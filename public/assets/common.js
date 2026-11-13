// Tiện ích dùng chung cho signal.phaisinh.online (ES module, không phụ thuộc thư viện).

const meta = document.querySelector('meta[name="signal-api"]');
export const API_BASE = (meta && meta.content ? meta.content : '').replace(/\/$/, '');
export const POINT_VALUE = 100000; // 1 điểm VN30F = 100.000 đ/hợp đồng
const MINUS = '−';

// ---------- Định dạng ----------
const nfCache = new Map();
function nf(d) {
  if (!nfCache.has(d)) nfCache.set(d, new Intl.NumberFormat('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d }));
  return nfCache.get(d);
}
export const isNum = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
export function fmt(v, d = 1) {
  if (!isNum(v)) return '–';
  const n = Number(v);
  return (n < 0 ? MINUS : '') + nf(d).format(Math.abs(n));
}
export function fmtSigned(v, d = 1) {
  if (!isNum(v)) return '–';
  const n = Number(v);
  if (n === 0) return nf(d).format(0);
  return (n > 0 ? '+' : MINUS) + nf(d).format(Math.abs(n));
}
export function fmtMoneyShort(points) {
  if (!isNum(points)) return '–';
  const v = Number(points) * POINT_VALUE;
  const a = Math.abs(v);
  const sign = v > 0 ? '+' : v < 0 ? MINUS : '';
  if (a >= 1e9) return sign + nf(2).format(a / 1e9) + ' tỷ';
  if (a >= 1e6) return sign + nf(a >= 1e8 ? 0 : 1).format(a / 1e6) + ' tr';
  return sign + nf(0).format(a) + ' đ';
}
export function fmtPct(v, d = 1) { return isNum(v) ? nf(d).format(Number(v)) + '%' : '–'; }
export const tone = (v) => (!isNum(v) || Number(v) === 0 ? '' : Number(v) > 0 ? 't-pos' : 't-neg');
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function safeUrl(u) {
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : ''; } catch { return ''; }
}

// "2026-11-13 13:14:03" (giờ VN) -> Date
export function parseVnTime(s) {
  if (!s) return null;
  const pad = (n) => String(n).padStart(2, '0');
  const str = String(s);
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}+07:00`);
  // Định dạng TradingView đã chuẩn hóa: "lúc 14:45 ngày 13/11/2026" hoặc "14:45 13/11/2026"
  m = str.match(/(\d{1,2}):(\d{2})\D+?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(`${m[5]}-${pad(m[4])}-${pad(m[3])}T${pad(m[1])}:${m[2]}:00+07:00`);
  m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\D+?(\d{1,2}):(\d{2})/);
  if (m) return new Date(`${m[3]}-${pad(m[2])}-${pad(m[1])}T${pad(m[4])}:${m[5]}:00+07:00`);
  return null;
}
const vnParts = (d) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(d).map((p) => [p.type, p.value]));
export function fmtTime(s) {
  const d = s instanceof Date ? s : parseVnTime(s);
  if (!d) return s ? esc(s) : '–';
  const p = vnParts(d), now = vnParts(new Date());
  const hm = `${p.hour}:${p.minute}`;
  return p.day === now.day && p.month === now.month && p.year === now.year ? hm : `${p.day}/${p.month} ${hm}`;
}
export function fmtAgo(s) {
  const d = s instanceof Date ? s : parseVnTime(s);
  if (!d) return '';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} giờ ${mins % 60 ? (mins % 60) + ' phút' : ''}`.trim();
  return `${Math.floor(h / 24)} ngày`;
}

// ---------- Phiên giao dịch VN30F (giờ VN) ----------
export function marketSession(d = new Date()) {
  const p = vnParts(d);
  if (p.weekday === 'Sat' || p.weekday === 'Sun') return { open: false, label: 'Nghỉ cuối tuần' };
  const t = Number(p.hour) * 60 + Number(p.minute);
  if (t >= 525 && t < 540) return { open: true, label: 'Phiên ATO' };
  if (t >= 540 && t < 690) return { open: true, label: 'Phiên sáng' };
  if (t >= 690 && t < 780) return { open: false, label: 'Nghỉ trưa' };
  if (t >= 780 && t < 870) return { open: true, label: 'Phiên chiều' };
  if (t >= 870 && t < 885) return { open: true, label: 'Phiên ATC' };
  return { open: false, label: t < 525 ? 'Chưa mở cửa' : 'Đã đóng cửa' };
}

// ---------- API ----------
export async function api(path, { timeout = 12000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(API_BASE + path, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

// ---------- Giá VN30F1M realtime: SSE, tự rơi về polling ----------
export function priceFeed(onPrice, onState) {
  let es = null, pollTimer = null, retry = 0, stopped = false;
  const state = (s) => onState && onState(s);
  async function poll() {
    try { const j = await api('/api/v1/market/price'); if (j && j.ok && j.data) { onPrice(j.data); state('live'); } }
    catch { state('error'); }
    if (!stopped) pollTimer = setTimeout(poll, marketSession().open ? 5000 : 60000);
  }
  function connect() {
    if (!window.EventSource) return poll();
    es = new EventSource(API_BASE + '/api/v1/prices/stream');
    es.addEventListener('price_update', (e) => { retry = 0; try { onPrice(JSON.parse(e.data)); state('live'); } catch { /* bỏ qua gói lỗi */ } });
    es.onerror = () => {
      es.close(); es = null; state('stale');
      retry += 1;
      if (retry >= 3) { poll(); return; }
      setTimeout(() => !stopped && connect(), 3000 * retry);
    };
  }
  connect();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (es) { es.close(); es = null; } }
    else if (!es && !pollTimer && !stopped) connect();
  });
  return () => { stopped = true; if (es) es.close(); clearTimeout(pollTimer); };
}

// ---------- Giao diện sáng/tối ----------
export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('signal_theme', next); } catch { /* chế độ riêng tư */ }
  });
}

// ---------- Âm báo vào lệnh (mặc định tắt) ----------
let soundOn = false;
try { soundOn = localStorage.getItem('signal_sound') === 'on'; } catch { /* */ }
export function initSound() {
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;
  const sync = () => { btn.setAttribute('aria-pressed', String(soundOn)); btn.title = soundOn ? 'Tắt âm báo vào lệnh' : 'Bật âm báo vào lệnh'; btn.setAttribute('aria-label', btn.title); };
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem('signal_sound', soundOn ? 'on' : 'off'); } catch { /* */ }
    sync();
    if (soundOn) chime('BUY');
  });
  sync();
}
export function chime(side) {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(side === 'BUY' ? 587.33 : 440, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(side === 'BUY' ? 880 : 329.63, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.42);
  } catch { /* trình duyệt chặn âm thanh */ }
}

// ---------- Toast ----------
export function toast(html, kind = '') {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = `<div>${html}</div><button type="button" aria-label="Đóng">×</button>`;
  el.querySelector('button').onclick = () => el.remove();
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 6000);
}

// ---------- Vẽ ----------
export function sparkSvg(points, w = 96, h = 30) {
  const pts = (points || []).map(Number).filter(Number.isFinite);
  if (pts.length < 2) return '<span class="spark-empty">–</span>';
  const cum = [0]; pts.forEach((p) => cum.push(cum[cum.length - 1] + p));
  const min = Math.min(...cum), max = Math.max(...cum), range = max - min || 1;
  const xy = cum.map((v, i) => [(i / (cum.length - 1)) * w, h - 2 - ((v - min) / range) * (h - 4)]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const color = cum[cum.length - 1] >= 0 ? 'var(--pos)' : 'var(--neg)';
  const zeroY = h - 2 - ((0 - min) / range) * (h - 4);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><line x1="0" x2="${w}" y1="${zeroY.toFixed(1)}" y2="${zeroY.toFixed(1)}" stroke="var(--line-strong)" stroke-dasharray="2 3"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function sideOf(s) { const v = String(s || '').toUpperCase(); return v === 'BUY' || v === 'LONG' ? 'BUY' : v === 'SELL' || v === 'SHORT' ? 'SELL' : ''; }
export function sideTag(side) {
  const s = sideOf(side);
  if (s === 'BUY') return '<span class="side long">LONG</span>';
  if (s === 'SELL') return '<span class="side short">SHORT</span>';
  return '<span class="side flat">ĐỨNG NGOÀI</span>';
}
export function floatPts(side, open, last) {
  if (!isNum(open) || !isNum(last)) return null;
  const s = sideOf(side);
  if (s === 'BUY') return Number(last) - Number(open);
  if (s === 'SELL') return Number(open) - Number(last);
  return null;
}
export function initials(bot) {
  const id = String(bot.bot_id || '');
  const m = id.match(/(\d+)$/);
  return m ? m[1] : id.slice(0, 3);
}
export const PERIOD_LABEL = { daily: 'Hôm nay', weekly: 'Tuần này', monthly: 'Tháng này', all: 'Từ đầu' };
