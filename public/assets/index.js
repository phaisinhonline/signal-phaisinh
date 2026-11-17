import {
  api, priceFeed, initTheme, initSound, chime, toast, marketSession,
  fmt, fmtSigned, fmtMoneyShort, fmtPct, fmtTime, fmtAgo, tone, esc, isNum,
  sparkSvg, sideOf, sideTag, floatPts, initials, PERIOD_LABEL,
} from './common.js';

const MIN_TRADES = 3;
const $ = (id) => document.getElementById(id);

const state = {
  period: 'daily',
  positions: new Set(['BUY', 'SELL', 'FLAT']),
  q: '',
  minTrades: false,
  sort: null, // { key, dir }
  bots: [],
  loadedPeriod: null,
  lastSides: null,
  price: null,
  loading: false,
  error: '',
};

// Đọc trạng thái từ URL (?ky=weekly) để chia sẻ đúng góc nhìn
const params = new URLSearchParams(location.search);
if (PERIOD_LABEL[params.get('ky')]) state.period = params.get('ky');

const hasTrades = (b) => Number(b.total_trades) > 0;
const isOpen = (b) => sideOf(b.current_side) !== '';
const posKey = (b) => sideOf(b.current_side) || 'FLAT';
const shortCat = (s) => String(s || '').replace(/\s*\(.*?\)\s*/g, '').trim();

// ---------- Tải dữ liệu ----------
let timer = null;
async function load() {
  clearTimeout(timer);
  state.loading = true;
  const period = state.period;
  try {
    const j = await api(`/api/v1/bots/leaderboard?period=${period}&platform=tradingview&limit=150`);
    if (period !== state.period) return; // người dùng đã đổi kỳ
    const bots = (j.leaderboard || []).map((b, i) => ({ ...b, _order: i }));
    notifyChanges(bots);
    state.bots = bots;
    state.loadedPeriod = period;
    state.error = '';
  } catch (e) {
    state.error = 'Không tải được bảng xếp hạng. Đang thử lại…';
  } finally {
    state.loading = false;
    render();
    const visible = !document.hidden;
    timer = setTimeout(load, visible && marketSession().open ? 15000 : 90000);
  }
}

function notifyChanges(bots) {
  const sides = Object.fromEntries(bots.map((b) => [b.bot_id, sideOf(b.current_side)]));
  if (state.lastSides) {
    for (const b of bots) {
      const before = state.lastSides[b.bot_id];
      const now = sides[b.bot_id];
      if (before !== undefined && now && now !== before) {
        chime(now);
        toast(`<b>${esc(b.name)}</b> vừa vào lệnh <b>${now === 'BUY' ? 'Long' : 'Short'}</b> tại ${fmt(b.open_price)}`, now === 'BUY' ? 'long' : 'short');
      }
    }
  }
  state.lastSides = sides;
}

// ---------- Hiển thị ----------
function render() {
  renderSummary();
  renderOpen();
  renderLeaderboard();
}

function topBot(active) {
  const ranked = active.filter(hasTrades);
  return ranked.find((b) => Number(b.total_trades) >= MIN_TRADES) || ranked[0] || null;
}

function renderSummary() {
  const bots = state.bots;
  if (!bots.length) {
    $('deck').textContent = state.error || 'Đang tổng hợp vị thế và hiệu suất của các bot…';
    return;
  }
  const traded = bots.filter(hasTrades);
  const trades = traded.reduce((s, b) => s + Number(b.total_trades || 0), 0);
  const wins = traded.reduce((s, b) => s + Number(b.win_count || 0), 0);
  const pnl = traded.reduce((s, b) => s + Number(b.pnl_points || 0), 0);
  const longs = bots.filter((b) => posKey(b) === 'BUY').length;
  const shorts = bots.filter((b) => posKey(b) === 'SELL').length;
  const wr = trades ? (wins / trades) * 100 : null;
  const avg = trades ? pnl / trades : null;
  const label = PERIOD_LABEL[state.period];

  // Câu tóm tắt
  let s = trades
    ? `${label} có <b>${traded.length}/${bots.length}</b> bot giao dịch với <b>${trades}</b> lệnh đã đóng, tỷ lệ thắng <b>${fmtPct(wr)}</b> và lãi/lỗ trung bình <b class="${tone(avg)}">${fmtSigned(avg, 2)} điểm</b> mỗi lệnh.`
    : `${label} chưa có lệnh nào được đóng trong số ${bots.length} bot đang theo dõi.`;
  s += longs + shorts
    ? ` Hiện <b class="t-pos">${longs} bot giữ Long</b> và <b class="t-neg">${shorts} bot giữ Short</b>.`
    : ' Hiện không bot nào giữ vị thế.';
  $('deck').innerHTML = s;

  // KPI 1: vị thế đang mở
  $('k-open').textContent = String(longs + shorts);
  $('k-open-sub').textContent = `/ ${bots.length} bot`;
  const open = longs + shorts || 1;
  $('k-dbar-long').style.width = `${(longs / open) * 50}%`;
  $('k-dbar-short').style.width = `${(shorts / open) * 50}%`;
  $('k-open-split').innerHTML = `<span class="chip pos">${longs} Long</span><span class="chip neg">${shorts} Short</span>`;

  // KPI 2: lệnh đã đóng
  $('k-trades').textContent = String(trades);
  $('k-trades-sub').textContent = trades ? `${wins} thắng` : '';
  $('k-trades-delta').innerHTML = trades
    ? `<span class="chip flat">Thắng ${fmtPct(wr)}</span><span>${traded.length} bot giao dịch</span>`
    : '<span>Chưa có lệnh đóng</span>';

  // KPI 3: trung bình/lệnh
  const kAvg = $('k-avg');
  kAvg.textContent = fmtSigned(avg, 2);
  kAvg.className = tone(avg);
  $('k-avg-delta').innerHTML = trades ? `<span>≈ ${fmtMoneyShort(avg)} mỗi lệnh · tổng <b class="${tone(pnl)}">${fmtSigned(pnl)}</b> điểm</span>` : '';

  // KPI 4: dẫn đầu
  const top = topBot(bots);
  if (top) {
    $('k-top').innerHTML = `<a href="/bot/${encodeURIComponent(top.bot_id)}">${esc(top.name)}</a>`;
    const small = Number(top.total_trades) < MIN_TRADES;
    $('k-top-delta').innerHTML = `<span class="chip ${Number(top.pnl_points) >= 0 ? 'pos' : 'neg'}">${fmtSigned(top.pnl_points)} điểm</span><span>${top.total_trades} lệnh · thắng ${fmtPct(top.win_rate)}</span>${small ? '<span class="chip warn sm">mẫu nhỏ</span>' : ''}`;
  } else {
    $('k-top').textContent = '–';
    $('k-top-delta').innerHTML = '<span>Chờ lệnh đóng đầu tiên</span>';
  }
}

function floatHtml(b) {
  const fp = floatPts(b.current_side, b.open_price, state.price && state.price.price);
  if (fp === null) return '<span class="t-faint">–</span>';
  return `<span class="${tone(fp)}">${fmtSigned(fp)}</span>`;
}

function renderOpen() {
  const box = $('open-list');
  const list = state.bots.filter(isOpen).sort((a, b) => String(b.open_time || '').localeCompare(String(a.open_time || '')));
  $('open-count').textContent = list.length ? `(${list.length})` : '';
  if (!state.bots.length) { box.innerHTML = `<div class="empty">${state.error ? esc(state.error) : '<span class="sk"></span>'}</div>`; return; }
  if (!list.length) {
    box.innerHTML = `<div class="empty"><b>Không có bot nào đang giữ vị thế.</b> Bảng sẽ tự cập nhật khi có lệnh mới${marketSession().open ? '' : ' trong phiên giao dịch'}.</div>`;
    return;
  }
  box.innerHTML = `<div class="positions">
    <div class="op-row head"><div>Bot</div><div>Vị thế</div><div>Giá vào</div><div>Lãi/lỗ tạm</div><div>Chốt lời / Cắt lỗ</div></div>
    ${list.map((b) => {
      const s = sideOf(b.current_side);
      return `<div class="op-row">
        ${botCell(b, s)}
        <div class="c-side" data-lbl="Vị thế">${sideTag(s)}</div>
        <div class="r c-entry" data-lbl="Giá vào"><span class="big num">${fmt(b.open_price)}</span><span class="sub">${b.open_time ? `${fmtTime(b.open_time)} · ${fmtAgo(b.open_time)}` : ''}</span></div>
        <div class="r c-float" data-lbl="Lãi/lỗ tạm"><span class="big num" data-float="${esc(b.bot_id)}">${floatHtml(b)}</span><span class="sub">điểm/HĐ</span></div>
        <div class="r c-tpsl" data-lbl="Chốt lời / Cắt lỗ"><span class="num"><span class="t-pos">${fmt(b.current_tp)}</span> / <span class="t-neg">${fmt(b.current_sl)}</span></span></div>
      </div>`;
    }).join('')}
  </div>`;
}

function botCell(b, s = sideOf(b.current_side)) {
  const cls = s === 'BUY' ? 'long' : s === 'SELL' ? 'short' : '';
  return `<div class="bot-cell">
    <span class="bot-ava ${cls}" aria-hidden="true">${esc(initials(b))}</span>
    <div style="min-width:0">
      <a class="bot-name row-link" href="/bot/${encodeURIComponent(b.bot_id)}">${esc(b.name)}</a>
      <div class="bot-meta"><span class="mono">${esc(b.bot_id)}</span> · ${esc(b.timeframe || '')}${b.category_label ? ' · ' + esc(shortCat(b.category_label)) : ''}</div>
    </div>
  </div>`;
}

const SORTERS = {
  pnl: (b) => Number(b.pnl_points || 0),
  wr: (b) => Number(b.win_rate || 0) + Number(b.total_trades || 0) / 1e4,
  pf: (b) => Number(b.profit_factor || 0),
  dd: (b) => -Number(b.max_drawdown || 0),
  pos: (b) => ({ BUY: 2, SELL: 1, FLAT: 0 }[posKey(b)]),
};

function renderLeaderboard() {
  const body = $('lb-body');
  const q = state.q.trim().toLowerCase();
  const match = (b) => !q || String(b.name).toLowerCase().includes(q) || String(b.bot_id).toLowerCase().includes(q);
  const active = state.bots.filter((b) => hasTrades(b) || isOpen(b));
  const rankOf = new Map(active.map((b, i) => [b.bot_id, i + 1]));
  let rows = active.filter((b) => match(b) && state.positions.has(posKey(b)) && (!state.minTrades || Number(b.total_trades) >= MIN_TRADES));
  if (state.sort) {
    const f = SORTERS[state.sort.key];
    rows = [...rows].sort((a, b) => (f(b) - f(a)) * (state.sort.dir === 'asc' ? -1 : 1) || a._order - b._order);
  }
  document.querySelectorAll('.lb-row.head button[data-sort]').forEach((btn) => {
    const on = state.sort && state.sort.key === btn.dataset.sort;
    if (on) btn.setAttribute('aria-sort', state.sort.dir === 'asc' ? 'ascending' : 'descending');
    else btn.removeAttribute('aria-sort');
  });
  $('lb-count').textContent = state.bots.length ? `(${rows.length}/${active.length})` : '';

  if (!state.bots.length) {
    body.innerHTML = `<div class="empty">${state.error ? esc(state.error) : '<span class="sk"></span> Đang tải bảng xếp hạng…'}</div>`;
  } else if (!rows.length) {
    body.innerHTML = active.length
      ? '<div class="empty"><b>Không có bot phù hợp bộ lọc.</b> Thử bỏ bớt điều kiện lọc hoặc từ khóa tìm kiếm.</div>'
      : `<div class="empty"><b>${PERIOD_LABEL[state.period]} chưa có bot nào giao dịch.</b> Xem kỳ "Tuần" hoặc "Tất cả" để so sánh hiệu suất.</div>`;
  } else {
    body.innerHTML = rows.map((b) => {
      const rank = rankOf.get(b.bot_id);
      const s = sideOf(b.current_side);
      const trades = Number(b.total_trades || 0);
      const wr = Number(b.win_rate || 0);
      const posHtml = s
        ? `${sideTag(s)} <span class="sub num">từ ${fmt(b.open_price)} · <span data-float="${esc(b.bot_id)}">${floatHtml(b)}</span></span>`
        : '<span class="t-faint">Đứng ngoài</span>';
      return `<div class="lb-row" role="row">
        <div class="rank ${rank <= 3 ? 'top' : ''}" role="cell">${rank}</div>
        ${botCell(b, s).replace('class="bot-cell"', 'class="bot-cell" role="cell"')}
        <div class="pos-col" role="cell" data-lbl="Vị thế">${posHtml}</div>
        <div class="r c-pnl" role="cell" data-lbl="Lãi/lỗ"><span class="big num ${tone(b.pnl_points)}">${fmtSigned(b.pnl_points)}</span><span class="sub">${trades ? fmtMoneyShort(b.pnl_points) + '/HĐ' : 'chưa đóng lệnh'}</span></div>
        <div class="r c-wr" role="cell" data-lbl="Tỷ lệ thắng"><span class="big num">${trades ? fmtPct(wr) : '–'}</span><span class="sub">${trades ? `<span class="wr" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, wr))}%"></i></span> ${b.win_count || 0}/${trades} lệnh` : ''}${trades && trades < MIN_TRADES ? ' · <span class="chip warn sm">mẫu nhỏ</span>' : ''}</span></div>
        <div class="r c-pf num" role="cell" data-lbl="PF">${Number(b.profit_factor) > 0 ? fmt(b.profit_factor, 2) : '–'}</div>
        <div class="r c-dd num ${Number(b.max_drawdown) > 0 ? 't-neg' : ''}" role="cell" data-lbl="Sụt giảm">${Number(b.max_drawdown) > 0 ? fmtSigned(-b.max_drawdown) : '–'}</div>
        <div class="r spark-cell" role="cell">${sparkSvg(b.sparkline)}</div>
      </div>`;
    }).join('');
  }

  // Bot chưa có giao dịch trong kỳ
  const waiting = state.bots.filter((b) => !hasTrades(b) && !isOpen(b) && match(b));
  $('waiting').hidden = !waiting.length;
  $('waiting-count').textContent = `(${waiting.length})`;
  if (q && waiting.length && !rows.length) $('waiting').open = true;
  $('waiting-grid').innerHTML = waiting.map((b) => `<a href="/bot/${encodeURIComponent(b.bot_id)}"><b>${esc(b.name)}</b><span><span class="mono">${esc(b.bot_id)}</span> · ${esc(b.timeframe || '')}</span></a>`).join('');
}

// ---------- Giá realtime ----------
function onPrice(p) {
  if (!p || !isNum(p.price)) return;
  const prev = state.price;
  state.price = p;
  const last = $('px-last');
  last.textContent = fmt(p.price);
  if (prev && prev.price !== p.price) {
    last.classList.remove('up', 'down');
    void last.offsetWidth;
    last.classList.add(p.price > prev.price ? 'up' : 'down');
    setTimeout(() => last.classList.remove('up', 'down'), 800);
  }
  const chg = $('px-chg');
  chg.textContent = `${fmtSigned(p.change)} (${fmtSigned(p.change_pct, 2)}%)`;
  chg.className = 'chip ' + (Number(p.change) > 0 ? 'pos' : Number(p.change) < 0 ? 'neg' : 'flat');
  $('px-low').textContent = fmt(p.low);
  $('px-high').textContent = fmt(p.high);
  if (isNum(p.low) && isNum(p.high) && p.high > p.low) {
    const pos = (v) => `${Math.max(0, Math.min(100, ((v - p.low) / (p.high - p.low)) * 100))}%`;
    $('px-mark').style.left = pos(p.price);
    if (isNum(p.ref_price)) $('px-ref-mark').style.left = pos(p.ref_price);
  }
  $('px-time').textContent = (p.updated_at || '').split(' ')[0] || new Date().toLocaleTimeString('vi-VN');
  document.querySelectorAll('[data-float]').forEach((el) => {
    const b = state.bots.find((x) => x.bot_id === el.dataset.float);
    if (b) el.innerHTML = floatHtml(b);
  });
}

function onFeedState(s) {
  const el = $('feed-status');
  const sess = marketSession();
  $('px-session').textContent = sess.label;
  if (s === 'live') { el.className = 'status ' + (sess.open ? 'live' : ''); el.textContent = sess.open ? 'Trực tiếp' : sess.label; }
  else if (s === 'stale') { el.className = 'status stale'; el.textContent = 'Đang kết nối lại'; }
  else { el.className = 'status error'; el.textContent = 'Mất kết nối giá'; }
}

// ---------- Sự kiện ----------
function setPeriod(p) {
  if (p === state.period) return;
  state.period = p;
  state.lastSides = null;
  state.bots = [];
  document.querySelectorAll('#period-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === p)));
  const url = new URL(location.href);
  if (p === 'daily') url.searchParams.delete('ky'); else url.searchParams.set('ky', p);
  history.replaceState(null, '', url);
  $('poster-btn').title = POSTER_LABEL[p];
  render();
  load();
}

// ---------- Ảnh poster chia sẻ (share.js nạp khi bấm) ----------
const POSTER_LABEL = { daily: 'Tải ảnh bản tin hôm nay', weekly: 'Tải ảnh xếp hạng tuần', monthly: 'Tải ảnh xếp hạng tháng', all: 'Tải ảnh xếp hạng từ đầu' };
async function openPoster() {
  if (!state.bots.length || state.loadedPeriod !== state.period) { toast('Dữ liệu đang tải, vui lòng thử lại sau giây lát.'); return; }
  try {
    const { openShare } = await import('./share.js');
    openShare({ kind: 'overview', period: state.period, bots: state.bots, price: state.price });
  } catch { toast('Không mở được công cụ tạo ảnh. Vui lòng tải lại trang.'); }
}

function init() {
  initTheme();
  initSound();
  $('poster-btn').title = POSTER_LABEL[state.period];
  $('poster-btn').addEventListener('click', openPoster);
  document.querySelectorAll('#period-seg button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.period === state.period));
    b.addEventListener('click', () => setPeriod(b.dataset.period));
  });
  document.querySelectorAll('.chips button[data-pos]').forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.pos;
    if (state.positions.has(k)) { if (state.positions.size > 1) state.positions.delete(k); } else state.positions.add(k);
    document.querySelectorAll('.chips button[data-pos]').forEach((x) => x.setAttribute('aria-pressed', String(state.positions.has(x.dataset.pos))));
    renderLeaderboard();
  }));
  let qt;
  $('q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value; renderLeaderboard(); }, 120); });
  $('min-trades').addEventListener('change', (e) => { state.minTrades = e.target.checked; renderLeaderboard(); });
  document.querySelectorAll('.lb-row.head button[data-sort]').forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.sort;
    if (!state.sort || state.sort.key !== k) state.sort = { key: k, dir: 'desc' };
    else if (state.sort.dir === 'desc') state.sort = { key: k, dir: 'asc' };
    else state.sort = null;
    renderLeaderboard();
  }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !state.loading) load(); });
  onFeedState('stale');
  $('feed-status').textContent = 'Đang kết nối';
  $('feed-status').className = 'status';
  priceFeed(onPrice, onFeedState);
  load();
}

init();
