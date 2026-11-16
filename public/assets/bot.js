import {
  api, priceFeed, initTheme, toast, marketSession, POINT_VALUE,
  fmt, fmtSigned, fmtMoneyShort, fmtPct, fmtTime, fmtAgo, tone, esc, isNum, safeUrl,
  sideOf, sideTag, floatPts, PERIOD_LABEL,
} from './common.js';

const $ = (id) => document.getElementById(id);
const state = { bot: null, period: 'all', price: null };

const ACTION = { ENTRY: 'Vào lệnh', EXIT: 'Thoát lệnh', CLOSE: 'Đóng lệnh', TP: 'Chốt lời', SL: 'Cắt lỗ', REVERSE: 'Đảo chiều' };
const REASON = { EOD_ATC: 'Đóng cuối phiên 14:28', TP: 'Chạm chốt lời', SL: 'Chạm cắt lỗ', REVERSE: 'Đảo chiều' };

function botIdFromPath() {
  const m = location.pathname.match(/\/(?:bot|signal)\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]).toUpperCase() : '';
}

async function loadBot() {
  try {
    const embedded = JSON.parse($('bot-data').textContent || 'null');
    if (embedded && embedded.bot_id) return embedded;
  } catch { /* không có dữ liệu nhúng */ }
  const id = botIdFromPath();
  if (!id) throw new Error('Thiếu mã bot');
  const j = await api(`/api/v1/bots/${encodeURIComponent(id)}`);
  if (!j.ok || !j.bot) throw new Error('Không tìm thấy bot');
  return j.bot;
}

// ---------- Đầu trang ----------
function renderHead(b) {
  document.title = `${b.name} – Bot tín hiệu VN30F1M | phaisinh.online`;
  $('crumb-name').textContent = b.name;
  $('bot-name').textContent = b.name;
  $('bot-eyebrow').textContent = `Bot ${b.platform === 'amibroker' ? 'Amibroker' : 'TradingView'} · ${b.timeframe || ''}`;
  $('bot-desc').textContent = b.description || '';
  const cat = String(b.category_label || '').trim();
  $('bot-tags').innerHTML = [
    `<span class="chip flat"><span class="mono">${esc(b.bot_id)}</span></span>`,
    '<span class="chip flat">VN30F1M</span>',
    cat ? `<span class="chip flat">${esc(cat)}</span>` : '',
    b.strategy_type === 'short' ? '<span class="chip flat">Intraday · đóng 14:28</span>' : b.strategy_type === 'long' ? '<span class="chip flat">Giữ qua đêm</span>' : '',
  ].join('');
  const post = safeUrl(b.phaisinh_post_url);
  const drive = safeUrl(b.drive_link);
  $('bot-actions').innerHTML = `
    ${post ? `<a class="btn-outline" href="${esc(post)}" target="_blank" rel="noopener">Bài giới thiệu chiến lược ↗</a>` : ''}
    ${drive ? `<a class="btn-ghost" href="${esc(drive)}" target="_blank" rel="noopener nofollow">Tải script ${b.platform === 'amibroker' ? 'AFL' : 'Pine'} ↗</a>` : ''}
    <button type="button" class="btn-ghost" id="share-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg> Sao chép liên kết</button>`;
  $('share-btn').addEventListener('click', async () => {
    const url = `${location.origin}/bot/${encodeURIComponent(b.bot_id)}`;
    try { await navigator.clipboard.writeText(url); toast('Đã sao chép liên kết bot.'); }
    catch { window.prompt('Sao chép liên kết:', url); }
  });
}

function renderPosition() {
  const b = state.bot, p = b.position || {};
  const s = sideOf(p.current_side);
  const box = $('pos-banner');
  if (!s) {
    box.innerHTML = `<div class="pos-banner"><div>${sideTag('')}</div><div><div class="lbl">Trạng thái</div><div>Đang đứng ngoài thị trường, chờ tín hiệu mới.</div></div><div class="t-muted" style="font-size:13px">${p.updated_at ? 'Cập nhật ' + fmtTime(p.updated_at) : ''}</div></div>`;
    return;
  }
  const fp = floatPts(s, p.open_price, state.price && state.price.price);
  box.innerHTML = `<div class="pos-banner ${s === 'BUY' ? 'long' : 'short'}">
    <div>${sideTag(s)}</div>
    <div class="grid">
      <div><div class="lbl">Giá vào</div><div class="val num">${fmt(p.open_price)}</div></div>
      <div><div class="lbl">Lãi/lỗ tạm</div><div class="val num ${tone(fp)}" id="pos-float">${fp === null ? '–' : fmtSigned(fp)}</div></div>
      <div><div class="lbl">Chốt lời</div><div class="val num t-pos">${fmt(p.current_tp)}</div></div>
      <div><div class="lbl">Cắt lỗ</div><div class="val num t-neg">${fmt(p.current_sl)}</div></div>
    </div>
    <div class="t-muted" style="font-size:13px">${p.open_time ? `Mở lúc ${fmtTime(p.open_time)} · ${fmtAgo(p.open_time)}` : ''}<br><span id="pos-money">${fp === null ? '' : fmtMoneyShort(fp) + '/HĐ'}</span></div>
  </div>`;
}

// ---------- Hiệu suất ----------
function renderKpis() {
  const sc = (state.bot.scores || {})[state.period] || {};
  const trades = Number(sc.total_trades || 0);
  const kpi = (lbl, val, sub = '', cls = '') => `<div class="kpi"><div class="kpi-lbl">${lbl}</div><div class="kpi-val ${cls}">${val}</div><div class="kpi-delta">${sub}</div></div>`;
  $('kpis').innerHTML = [
    kpi('Lãi/lỗ', `<span class="${tone(sc.pnl_points)}">${fmtSigned(sc.pnl_points)}</span><small>điểm</small>`, trades ? fmtMoneyShort(sc.pnl_points) + '/HĐ' : PERIOD_LABEL[state.period]),
    kpi('Tỷ lệ thắng', trades ? fmtPct(sc.win_rate) : '–', trades ? `${sc.win_count || 0} thắng / ${sc.loss_count || 0} thua` : ''),
    kpi('Lệnh đã đóng', String(trades), trades && trades < 3 ? '<span class="chip warn sm">mẫu nhỏ</span>' : ''),
    kpi('Profit factor', Number(sc.profit_factor) > 0 ? fmt(sc.profit_factor, 2) : '–', 'Tổng lãi / tổng lỗ'),
    kpi('Sụt giảm tối đa', Number(sc.max_drawdown) > 0 ? `<span class="t-neg">${fmtSigned(-sc.max_drawdown)}</span>` : '–', 'điểm, từ đỉnh lũy kế'),
    kpi('Điểm tổng hợp', Number(sc.score_composite) > 0 ? fmt(sc.score_composite, 1) : '–', 'Dùng để xếp hạng'),
  ].join('');
  renderEquity(sc.sparkline || []);
}

function renderEquity(points) {
  const box = $('eq-chart'), tip = $('eq-tip');
  const pts = (points || []).map(Number).filter(Number.isFinite);
  if (pts.length < 1) { box.innerHTML = `<div class="chart-empty">${PERIOD_LABEL[state.period]} chưa có lệnh đóng để vẽ biểu đồ.</div>`; return; }
  const cum = [0]; pts.forEach((p) => cum.push(cum[cum.length - 1] + p));
  const W = 900, H = 240, L = 48, R = 12, T = 14, B = 26;
  let min = Math.min(...cum), max = Math.max(...cum);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.08; min -= pad; max += pad;
  const x = (i) => L + (i / Math.max(1, cum.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const ticks = 4, grid = [];
  for (let k = 0; k <= ticks; k++) {
    const v = min + ((max - min) * k) / ticks;
    grid.push(`<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line-normal)"/><text x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--ink-muted)">${fmt(v, 1)}</text>`);
  }
  const line = cum.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const last = cum[cum.length - 1];
  const color = last >= 0 ? 'var(--pos)' : 'var(--neg)';
  const area = `${line}L${x(cum.length - 1).toFixed(1)},${y(Math.max(min, Math.min(max, 0))).toFixed(1)}L${x(0).toFixed(1)},${y(Math.max(min, Math.min(max, 0))).toFixed(1)}Z`;
  const dots = cum.length <= 60 ? cum.slice(1).map((v, i) => `<circle cx="${x(i + 1).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="var(--bg-page)" stroke="${pts[i] >= 0 ? 'var(--pos)' : 'var(--neg)'}" stroke-width="1.8"/>`).join('') : '';
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lãi/lỗ lũy kế ${fmtSigned(last)} điểm sau ${pts.length} lệnh">
    ${grid.join('')}
    <line x1="${L}" x2="${W - R}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" stroke="var(--line-strong)" stroke-dasharray="4 4"/>
    <path d="${area}" fill="${color}" opacity=".08"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <text x="${L}" y="${H - 6}" font-size="11" fill="var(--ink-muted)">Lệnh 1</text>
    <text x="${W - R}" y="${H - 6}" font-size="11" text-anchor="end" fill="var(--ink-muted)">Lệnh ${pts.length}</text>
    <line id="eq-cursor" x1="0" x2="0" y1="${T}" y2="${H - B}" stroke="var(--ink-faint)" opacity="0"/>
  </svg>`;
  const svg = box.querySelector('svg');
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const i = Math.max(1, Math.min(cum.length - 1, Math.round(((px - L) / (W - L - R)) * (cum.length - 1))));
    const cur = svg.querySelector('#eq-cursor');
    cur.setAttribute('x1', x(i)); cur.setAttribute('x2', x(i)); cur.setAttribute('opacity', '1');
    tip.innerHTML = `<b>Lệnh ${i}</b>Lãi/lỗ lệnh: <span class="${tone(pts[i - 1])}">${fmtSigned(pts[i - 1])}</span><br>Lũy kế: <span class="${tone(cum[i])}">${fmtSigned(cum[i])}</span> điểm`;
    const left = (x(i) / W) * r.width;
    tip.style.left = `${Math.min(r.width - 180, Math.max(0, left + 12))}px`;
    tip.style.top = `${(y(cum[i]) / H) * r.height - 10}px`;
    tip.classList.add('on');
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerleave', () => { tip.classList.remove('on'); svg.querySelector('#eq-cursor').setAttribute('opacity', '0'); });
}

// ---------- Nhật ký lệnh ----------
function actionLabel(s) {
  const t = String(s.order_type || '').toUpperCase();
  // Webhook hiện ghi lệnh đảo chiều là ENTRY kèm lãi/lỗ của vị thế cũ
  if (t === 'REVERSE' || (t === 'ENTRY' && isNum(s.pnl_points))) return 'Đóng & đảo chiều';
  if (ACTION[t]) return ACTION[t];
  return Number(s.is_close) ? 'Đóng lệnh' : 'Vào lệnh';
}
function renderSignals() {
  const sigs = state.bot.signals || [];
  $('sig-count').textContent = sigs.length ? `(${sigs.length} gần nhất)` : '';
  if (!sigs.length) { $('sig-body').innerHTML = '<tr><td colspan="8" class="miss">Bot chưa gửi tín hiệu nào.</td></tr>'; return; }
  $('sig-body').innerHTML = sigs.map((s) => {
    let side = sideOf(s.side);
    if (!side && s.order_type) side = sideOf(s.order_type);
    if (!side && s.comment) {
      if (/SHORT|BÁN|SELL/i.test(s.comment)) side = 'SELL';
      else if (/LONG|MUA|BUY/i.test(s.comment)) side = 'BUY';
    }
    let reason = REASON[String(s.exit_reason || '').toUpperCase()] || s.exit_reason || '';
    if (!reason && (s.order_type === 'REVERSE' || (s.order_type === 'ENTRY' && isNum(s.pnl_points)))) {
      reason = 'Đảo chiều';
    }
    if (!reason && s.comment) {
      reason = s.comment;
    }
    return `<tr>
      <td title="${esc(s.created_at || '')}">${fmtTime(s.created_at)}</td>
      <td class="l">${actionLabel(s)}</td>
      <td class="l">${side ? sideTag(side) : '<span class="t-faint">–</span>'}</td>
      <td>${fmt(s.price)}</td>
      <td class="${isNum(s.tp) ? '' : 'miss'}">${fmt(s.tp)}</td>
      <td class="${isNum(s.sl) ? '' : 'miss'}">${fmt(s.sl)}</td>
      <td class="l ${reason ? '' : 'miss'}">${reason ? esc(reason) : '–'}</td>
      <td class="${tone(s.pnl_points)}">${isNum(s.pnl_points) ? fmtSigned(s.pnl_points) : '<span class="t-faint">–</span>'}</td>
    </tr>`;
  }).join('');
}

function exportCsv() {
  const b = state.bot, sigs = b.signals || [];
  if (!sigs.length) { toast('Chưa có lệnh để xuất.'); return; }
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Mã bot', 'Tên bot', 'Thời gian', 'Hành động', 'Hướng', 'Giá', 'Chốt lời', 'Cắt lỗ', 'Lý do', 'Lãi/lỗ (điểm)', 'Lãi/lỗ (đ/HĐ)'];
  const rows = sigs.map((s) => [b.bot_id, b.name, s.created_at, actionLabel(s), sideOf(s.side), s.price, s.tp, s.sl, s.exit_reason || s.comment, s.pnl_points, isNum(s.pnl_points) ? Math.round(s.pnl_points * POINT_VALUE) : ''].map(q).join(','));
  const blob = new Blob(['﻿' + [head.map(q).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `nhat-ky-lenh-${b.bot_id}-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- Máy tính khối lượng ----------
function initCalc() {
  const cap = $('c-cap');
  const parseVnd = (s) => Number(String(s).replace(/[^\d]/g, '')) || 0;
  cap.addEventListener('blur', () => { cap.value = new Intl.NumberFormat('vi-VN').format(parseVnd(cap.value)); });
  const p = state.bot.position || {};
  if (isNum(p.open_price) && isNum(p.current_sl) && Math.abs(p.open_price - p.current_sl) > 0) $('c-sl').value = Math.abs(p.open_price - p.current_sl).toFixed(1);
  const update = () => {
    const capital = parseVnd(cap.value);
    const risk = capital * (Number($('c-risk').value) / 100);
    const sl = Math.max(0.1, Number($('c-sl').value) || 0);
    const n = Math.floor(risk / (sl * POINT_VALUE));
    $('c-out-n').textContent = `${n} HĐ`;
    $('c-out-risk').textContent = new Intl.NumberFormat('vi-VN').format(Math.round(risk)) + ' đ';
    const price = state.price && isNum(state.price.price) ? Number(state.price.price) : null;
    const im = Number($('c-im').value) / 100;
    if (price && im > 0) {
      const perContract = price * POINT_VALUE * im;
      $('c-out-margin').textContent = `${Math.floor(capital / perContract)} HĐ`;
      $('c-out-im').textContent = fmtMoneyShort(perContract / POINT_VALUE).replace('+', '');
    } else { $('c-out-margin').textContent = '–'; $('c-out-im').textContent = '–'; }
  };
  ['input', 'change'].forEach((ev) => ['c-cap', 'c-risk', 'c-sl', 'c-im'].forEach((id) => $(id).addEventListener(ev, update)));
  update();
  state.updateCalc = update;
}

// ---------- Realtime ----------
function onPrice(p) {
  if (!p || !isNum(p.price)) return;
  state.price = p;
  const pos = state.bot && state.bot.position;
  if (pos && sideOf(pos.current_side)) {
    const fp = floatPts(pos.current_side, pos.open_price, p.price);
    const el = $('pos-float');
    if (el && fp !== null) { el.textContent = fmtSigned(fp); el.className = `val num ${tone(fp)}`; $('pos-money').textContent = fmtMoneyShort(fp) + '/HĐ'; }
  }
  if (state.updateCalc) state.updateCalc();
}
function onFeedState(s) {
  const el = $('feed-status'), sess = marketSession();
  if (s === 'live') { el.className = 'status ' + (sess.open ? 'live' : ''); el.textContent = sess.open ? 'Trực tiếp' : sess.label; }
  else if (s === 'stale') { el.className = 'status stale'; el.textContent = 'Đang kết nối lại'; }
  else { el.className = 'status error'; el.textContent = 'Mất kết nối giá'; }
}

async function refresh() {
  try {
    const j = await api(`/api/v1/bots/${encodeURIComponent(state.bot.bot_id)}`);
    if (j.ok && j.bot) { state.bot = j.bot; renderPosition(); renderKpis(); renderSignals(); }
  } catch { /* giữ dữ liệu cũ */ }
  setTimeout(refresh, !document.hidden && marketSession().open ? 20000 : 120000);
}

async function init() {
  initTheme();
  try {
    state.bot = await loadBot();
  } catch (e) {
    $('bot-name').textContent = 'Không tìm thấy bot';
    $('bot-desc').innerHTML = 'Mã bot không tồn tại hoặc dữ liệu tạm thời không truy cập được. <a href="/">Quay lại bảng xếp hạng</a>.';
    $('feed-status').className = 'status error'; $('feed-status').textContent = 'Lỗi dữ liệu';
    return;
  }
  // Mặc định mở kỳ có dữ liệu gần nhất: hôm nay nếu đã có lệnh, ngược lại Tất cả
  const sc = state.bot.scores || {};
  state.period = Number((sc.daily || {}).total_trades) > 0 ? 'daily' : 'all';
  document.querySelectorAll('#period-seg button').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.period === state.period));
    btn.addEventListener('click', () => {
      state.period = btn.dataset.period;
      document.querySelectorAll('#period-seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
      renderKpis();
    });
  });
  renderHead(state.bot);
  renderPosition();
  renderKpis();
  renderSignals();
  initCalc();
  $('csv-btn').addEventListener('click', exportCsv);
  priceFeed(onPrice, onFeedState);
  setTimeout(refresh, 20000);
}

init();
