// Ảnh poster khổ dọc (1080×1920) để chia sẻ Zalo/Facebook, có mã QR nhỏ về signal.phaisinh.online.
// Nạp lười (dynamic import) khi người dùng bấm nút, không tăng dung lượng JS lúc tải trang.
// Nhiều mẫu (variant) + sáng/tối theo giao diện người dùng, để chia sẻ nhiều lần trong ngày không bị lặp.
import { fmt, fmtSigned, fmtPct, fmtMoneyShort, isNum, sideOf, floatPts, parseVnTime } from './common.js';
import { qrMatrix } from './qr.js';

const W = 1080, H = 1920, PAD = 64, INNER = W - PAD * 2;
const SITE = 'https://signal.phaisinh.online';
const HOST = 'signal.phaisinh.online';
const FONT = '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MIN_TRADES = 3;
const QR_DEFAULT = 100;         // cạnh mã QR (px trên ảnh 1080 rộng)
let qrSize = QR_DEFAULT;
const HEAD_Y = 40;              // mép trên mã QR
const BOTTOM = H - 92;          // nội dung phải kết thúc trước mốc này (chừa dòng miễn trừ)
// QR byte mode, mức M: ≤ 42 byte vẫn là phiên bản 3 (29×29 ô). Bỏ ?src=qr nếu làm QR lớn thêm một cấp.
const qrLink = (u) => { const t = u + (u.includes('?') ? '&' : '?') + 'src=qr'; return t.length <= 42 ? t : u; };
const PL = { daily: 'hôm nay', weekly: 'tuần này', monthly: 'tháng này', all: 'từ đầu' };
const shortCat = (s) => String(s || '').replace(/\s*\(.*?\)\s*/g, '').trim();

// ---------- Màu lấy từ token --sig-poster-{light|dark}-* (tokens.css) ----------
const KEYS = ['bg', 'surface', 'surface-2', 'line', 'ink', 'ink-2', 'muted', 'brand', 'pos', 'neg', 'warn', 'qr-bg', 'qr-ink'];
function palette(theme) {
  const cs = getComputedStyle(document.documentElement);
  const P = { dark: theme === 'dark' };
  KEYS.forEach((k) => { P[k.replace(/-(.)/g, (_, c) => c.toUpperCase())] = cs.getPropertyValue(`--sig-poster-${theme}-${k}`).trim(); });
  return P;
}
function alpha(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
const toneColor = (P, v) => (!isNum(v) || Number(v) === 0 ? P.ink : Number(v) > 0 ? P.pos : P.neg);

function vnNow(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
  const WD = { Mon: 'Thứ Hai', Tue: 'Thứ Ba', Wed: 'Thứ Tư', Thu: 'Thứ Năm', Fri: 'Thứ Sáu', Sat: 'Thứ Bảy', Sun: 'Chủ Nhật' };
  const hm = Number(p.hour) * 100 + Number(p.minute), weekend = p.weekday === 'Sat' || p.weekday === 'Sun';
  const session = weekend ? 'CUỐI TUẦN' : hm < 900 ? 'TRƯỚC GIỜ MỞ CỬA' : hm < 1130 ? 'PHIÊN SÁNG' : hm < 1300 ? 'NGHỈ TRƯA' : hm < 1430 ? 'PHIÊN CHIỀU' : hm < 1445 ? 'PHIÊN ATC' : 'TỔNG KẾT PHIÊN';
  return {
    date: `${p.day}/${p.month}/${p.year}`, dm: `${p.day}/${p.month}`, iso: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`,
    hhmm: `${p.hour}${p.minute}`, wd: WD[p.weekday] || '', month: `${p.month}/${p.year}`, session, live: !weekend && hm >= 900 && hm < 1445,
  };
}
function sigTime(s) {
  const m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(s || ''));
  return m ? { time: `${m[4]}:${m[5]}`, dm: `${m[3]}/${m[2]}` } : null;
}
function since(d) {
  if (!d) return '';
  const min = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (min < 60) return `${min} phút`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} giờ ${min % 60 ? (min % 60) + ' phút' : ''}`.trim();
  return `${Math.floor(min / 1440)} ngày`;
}

// ---------- Vẽ cơ bản ----------
function setFont(ctx, w, size) { ctx.font = `${w} ${size}px ${FONT}`; }
function txt(ctx, s, x, y, { w = 400, size = 32, color, align = 'left', ls = 0 } = {}) {
  setFont(ctx, w, size);
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  const hasLs = 'letterSpacing' in ctx;
  if (hasLs) ctx.letterSpacing = `${ls}px`;
  ctx.fillText(s, x, y);
  const width = ctx.measureText(s).width;
  if (hasLs) ctx.letterSpacing = '0px';
  return width;
}
function measure(ctx, s, w, size, ls = 0) {
  setFont(ctx, w, size);
  const hasLs = 'letterSpacing' in ctx;
  if (hasLs) ctx.letterSpacing = `${ls}px`;
  const v = ctx.measureText(s).width;
  if (hasLs) ctx.letterSpacing = '0px';
  return v;
}
function fit(ctx, s, w, size, maxW) {
  s = String(s || '');
  if (measure(ctx, s, w, size) <= maxW) return s;
  while (s.length > 1 && measure(ctx, s + '…', w, size) > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}
function fitSize(ctx, s, w, size, min, maxW, ls = 0) {
  while (size > min && measure(ctx, s, w, size, ls) > maxW) size -= 2;
  return size;
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function card(ctx, P, x, y, w, h, r = 28) {
  rr(ctx, x, y, w, h, r); ctx.fillStyle = P.surface; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
}
function glow(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, alpha(color, a)); g.addColorStop(1, alpha(color, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function wrapLines(ctx, s, w, size, maxW, maxLines) {
  const words = String(s || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? cur + ' ' + word : word;
    if (cur && measure(ctx, next, w, size) > maxW) { lines.push(cur); cur = word; } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    keep[maxLines - 1] = fit(ctx, lines.slice(maxLines - 1).join(' '), w, size, maxW);
    return keep;
  }
  return lines;
}
function sideInfo(P, side) {
  const s = sideOf(side);
  return s === 'BUY' ? { s, label: 'LONG', color: P.pos } : s === 'SELL' ? { s, label: 'SHORT', color: P.neg } : { s: '', label: 'ĐỨNG NGOÀI', color: P.muted };
}
function sidePill(ctx, P, side, x, y, size = 22) {
  const { label, color } = sideInfo(P, side);
  const w = measure(ctx, label, 800, size, 1.2) + size * 1.1;
  const h = size * 1.6;
  rr(ctx, x, y - h + size * 0.42, w, h, 8);
  ctx.fillStyle = alpha(color, P.dark ? 0.18 : 0.12); ctx.fill();
  txt(ctx, label, x + size * 0.55, y, { w: 800, size, color, ls: 1.2 });
  return w;
}
function sectionTitle(ctx, P, s, y, right) {
  rr(ctx, PAD, y - 30, 6, 34, 3); ctx.fillStyle = P.brand; ctx.fill();
  txt(ctx, s, PAD + 22, y, { w: 800, size: 34, color: P.ink, ls: -0.5 });
  if (right) txt(ctx, right, W - PAD, y, { w: 600, size: 21, color: P.muted, align: 'right' });
}
// Dải chỉ số trong một thẻ, chia cột bằng vạch mảnh
function statStrip(ctx, P, items, y, h = 168) {
  card(ctx, P, PAD, y, INNER, h, 28);
  const cw = INNER / items.length;
  items.forEach((t, i) => {
    const x = PAD + i * cw + 32, maxW = cw - 52;
    if (i) { ctx.fillStyle = P.line; ctx.fillRect(PAD + i * cw, y + 30, 2, h - 60); }
    txt(ctx, t.label.toUpperCase(), x, y + 48, { w: 700, size: 19, color: P.muted, ls: 1.3 });
    const size = fitSize(ctx, t.value, 800, 60, 40, maxW, -1.5);
    txt(ctx, t.value, x, y + 112, { w: 800, size, color: t.color || P.ink, ls: -1.5 });
    if (t.sub) txt(ctx, fit(ctx, t.sub, 400, 21, maxW), x, y + 146, { size: 21, color: t.subColor || P.muted });
  });
  return y + h;
}
// Đường lãi/lỗ lũy kế (từ danh sách lãi/lỗ từng lệnh)
function drawSpark(ctx, P, points, x, y, w, h, { lw = 4, fill = true, dots = false, base = true } = {}) {
  const pts = (points || []).map(Number).filter(Number.isFinite);
  if (!pts.length) return false;
  const cum = [0]; pts.forEach((p) => cum.push(cum[cum.length - 1] + p));
  let min = Math.min(...cum), max = Math.max(...cum);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.08; min -= pad; max += pad;
  const X = (i) => x + (i / Math.max(1, cum.length - 1)) * w;
  const Y = (v) => y + (1 - (v - min) / (max - min)) * h;
  const color = cum[cum.length - 1] >= 0 ? P.pos : P.neg;
  if (base) {
    ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeStyle = P.line;
    ctx.beginPath(); ctx.moveTo(x, Y(0)); ctx.lineTo(x + w, Y(0)); ctx.stroke(); ctx.setLineDash([]);
  }
  const line = new Path2D();
  cum.forEach((v, i) => (i ? line.lineTo(X(i), Y(v)) : line.moveTo(X(i), Y(v))));
  if (fill) {
    const area = new Path2D(line);
    area.lineTo(X(cum.length - 1), Y(0)); area.lineTo(X(0), Y(0)); area.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, alpha(color, P.dark ? 0.3 : 0.2)); g.addColorStop(1, alpha(color, 0.02));
    ctx.fillStyle = g; ctx.fill(area);
  }
  ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = color; ctx.stroke(line);
  if (dots && cum.length <= 40) cum.slice(1).forEach((v, i) => {
    ctx.beginPath(); ctx.arc(X(i + 1), Y(v), 7, 0, Math.PI * 2);
    ctx.fillStyle = P.surface; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = pts[i] >= 0 ? P.pos : P.neg; ctx.stroke();
  });
  return true;
}

// ---------- Khung chung ----------
const DECOR = {
  rank: (ctx, P, a) => { glow(ctx, 0, 0, 900, P.brand, a); glow(ctx, W, 380, 700, P.warn, a * 0.5); },
  spot: (ctx, P, a) => { glow(ctx, W / 2, 420, 900, P.warn, a * 0.8); glow(ctx, 0, 0, 600, P.brand, a * 0.7); },
  pos: (ctx, P, a) => { glow(ctx, 0, 520, 760, P.pos, a * 0.75); glow(ctx, W, 520, 760, P.neg, a * 0.75); },
  perf: (ctx, P, a) => { glow(ctx, 0, 0, 900, P.brand, a); glow(ctx, W, 900, 800, P.pos, a * 0.5); },
  log: (ctx, P, a) => { glow(ctx, W, 0, 900, P.brand, a); },
  live: (ctx, P, a, c) => { glow(ctx, W * 0.3, 560, 900, c || P.brand, a); },
};
// Đầu ảnh: một dòng địa chỉ web (kiêm logo) + mã QR nhỏ góc phải. Thời điểm gộp vào dòng nhãn của tiêu đề.
let frame = { chip: '', live: false };
function drawFrame(ctx, P, variant, chip, live, tint, qrUrl) {
  frame = { chip, live };
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
  (DECOR[variant] || DECOR.rank)(ctx, P, P.dark ? 0.2 : 0.1, tint);
  ctx.fillStyle = P.brand; ctx.fillRect(0, 0, W, 8);
  const qs = qrSize, qx = W - PAD - qs, qy = HEAD_Y;
  // QR trên nền trắng (đủ tương phản cả ảnh tối), chừa viền trắng ≥ 2 ô để máy quét nhận diện
  const m = qrMatrix(qrUrl), n = m.length;
  const cell = Math.max(2, Math.floor(qs / (n + 4))), box = Math.max(qs, cell * (n + 4)), off = (box - cell * n) / 2;
  rr(ctx, qx + qs - box, qy, box, box, Math.min(14, box / 8)); ctx.fillStyle = P.qrBg; ctx.fill();
  if (!P.dark) { ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke(); }
  ctx.fillStyle = P.qrInk;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) ctx.fillRect(qx + qs - box + off + x * cell, qy + off + y * cell, cell, cell);
  // Địa chỉ web, căn giữa theo chiều cao QR
  const us = fitSize(ctx, HOST, 800, 46, 34, qx + qs - box - 32 - PAD, -1);
  const by = qy + box / 2 + us * 0.36;
  let x = PAD;
  x += txt(ctx, 'signal.', x, by, { w: 800, size: us, color: P.ink, ls: -1 });
  txt(ctx, 'phaisinh.online', x, by, { w: 800, size: us, color: P.brand, ls: -1 });
  headTop = qy + box;
}
let headTop = 0;
function headline(ctx, P, eyebrow, title, y, color) {
  y = y || headTop + 70;
  // Nhãn: nội dung · thời điểm (chấm xanh khi đang trong phiên)
  let x = PAD;
  const chip = frame.chip ? ` · ${frame.chip}` : '';
  if (measure(ctx, eyebrow + chip, 700, 24, 2) + (frame.live ? 24 : 0) <= INNER) {
    x += txt(ctx, eyebrow, x, y, { w: 700, size: 24, color: P.brand, ls: 2 });
    if (chip) {
      x += txt(ctx, ' · ', x, y, { w: 700, size: 24, color: P.muted, ls: 2 });
      if (frame.live) { ctx.beginPath(); ctx.arc(x + 7, y - 9, 7, 0, Math.PI * 2); ctx.fillStyle = P.pos; ctx.fill(); x += 22; }
      txt(ctx, frame.chip, x, y, { w: 700, size: 24, color: frame.live ? P.pos : P.muted, ls: 2 });
    }
  } else txt(ctx, fit(ctx, eyebrow, 700, 24, INNER), PAD, y, { w: 700, size: 24, color: P.brand, ls: 2 });
  y += 26;
  let size = fitSize(ctx, title, 800, 88, 66, INNER, -2.5);
  const lines = wrapLines(ctx, title, 800, size, INNER, 2);
  if (lines.length > 1) size = Math.min(size, 72);
  const lh = Math.round(size * 1.12);
  const ls2 = wrapLines(ctx, title, 800, size, INNER, 2);
  ls2.forEach((l, i) => txt(ctx, l, PAD, y + size + i * lh, { w: 800, size, color: color || P.ink, ls: -2.5 }));
  return y + size + (ls2.length - 1) * lh;
}
// Chân ảnh: chỉ một dòng miễn trừ bắt buộc (quy chuẩn thiết kế) kèm giờ cập nhật
function drawFooter(ctx, P, stamp) {
  const s = `Cập nhật ${stamp} · Kết quả quá khứ, chưa trừ phí, thuế; không phải khuyến nghị đầu tư.`;
  txt(ctx, fit(ctx, s, 400, 19, INNER), PAD, H - 40, { size: 19, color: P.muted });
}
function priceText(ctx, P, price, x, y, align = 'left', size = 26) {
  if (!price || !isNum(price.price)) return 0;
  const chg = `${fmtSigned(price.change)} (${fmtSigned(price.change_pct, 2)}%)`;
  const parts = [['VN30F1M ', 600, P.muted], [fmt(price.price) + '  ', 800, P.ink], [chg, 700, toneColor(P, price.change)]];
  const total = parts.reduce((s, [t, w]) => s + measure(ctx, t, w, size), 0);
  let cx = align === 'right' ? x - total : x;
  parts.forEach(([t, w, c]) => { cx += txt(ctx, t, cx, y, { w, size, color: c }); });
  return total;
}
function emptyNote(ctx, P, title, body, y) {
  card(ctx, P, PAD, y, INNER, 220, 28);
  txt(ctx, title, PAD + 40, y + 90, { w: 800, size: 44, color: P.ink, ls: -1 });
  wrapLines(ctx, body, 400, 28, INNER - 80, 2).forEach((l, i) => txt(ctx, l, PAD + 40, y + 144 + i * 40, { size: 28, color: P.ink2 }));
}

// Chia phần còn lại cho danh sách: số hàng tối đa vừa chỗ, hàng giãn ra để không chừa khoảng trống
function fillRows(y, n, min = 92, max = 118) {
  const avail = BOTTOM - y;
  const count = Math.max(0, Math.min(n, Math.floor(avail / min)));
  return { count, h: count ? Math.min(max, Math.floor(avail / count)) : min };
}

// ---------- Hàng danh sách ----------
function rankBadge(ctx, P, rank, x, cy) {
  const top = rank <= 3;
  ctx.beginPath(); ctx.arc(x + 28, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = top ? alpha(P.warn, P.dark ? 0.18 : 0.12) : P.surface2; ctx.fill();
  if (top) { ctx.lineWidth = 2; ctx.strokeStyle = P.warn; ctx.stroke(); }
  txt(ctx, String(rank), x + 28, cy + 10, { w: 800, size: 28, color: top ? P.warn : P.ink2, align: 'center' });
}
function rowName(ctx, P, name, side, x, y, maxW, size = 34) {
  const s = sideOf(side);
  const nm = fit(ctx, name, 700, size, maxW - (s ? 130 : 0));
  const nw = txt(ctx, nm, x, y, { w: 700, size, color: P.ink });
  if (s) sidePill(ctx, P, s, x + nw + 14, y - 2, 18);
}
function drawRankRow(ctx, P, b, rank, y, h) {
  ctx.fillStyle = P.line; ctx.fillRect(PAD, y + h - 1, INNER, 2);
  rankBadge(ctx, P, rank, PAD, y + h / 2);
  const nx = PAD + 80, sx = W - PAD - 200 - 132;
  rowName(ctx, P, b.name, b.current_side, nx, y + 46, sx - 24 - nx);
  const trades = Number(b.total_trades || 0);
  const cx = nx + txt(ctx, `${b.timeframe || ''} · ${trades} lệnh · thắng ${fmtPct(b.win_rate, 0)}`, nx, y + 80, { size: 22, color: P.muted });
  if (trades < MIN_TRADES) txt(ctx, ' · mẫu nhỏ', cx, y + 80, { w: 600, size: 22, color: P.warn });
  drawSpark(ctx, P, b.sparkline, sx, y + 24, 120, h - 48, { lw: 3, fill: false, base: false });
  txt(ctx, fmtSigned(b.pnl_points), W - PAD, y + 52, { w: 800, size: 44, color: toneColor(P, b.pnl_points), align: 'right', ls: -1 });
  txt(ctx, `${fmtMoneyShort(b.pnl_points)}/HĐ`, W - PAD, y + 82, { size: 20, color: P.muted, align: 'right' });
}
function drawOpenRow(ctx, P, b, price, y, h) {
  ctx.fillStyle = P.line; ctx.fillRect(PAD, y + h - 1, INNER, 2);
  const { color } = sideInfo(P, b.current_side);
  rr(ctx, PAD, y + 18, 8, h - 36, 4); ctx.fillStyle = color; ctx.fill();
  const nx = PAD + 30;
  rowName(ctx, P, b.name, b.current_side, nx, y + 46, W - PAD - 220 - nx);
  const d = parseVnTime(b.open_time);
  txt(ctx, `vào ${fmt(b.open_price)}${d ? ' lúc ' + vnNow(d).time + ' ' + vnNow(d).dm : ''} · ${b.timeframe || ''}`, nx, y + 80, { size: 22, color: P.muted });
  const fp = floatPts(b.current_side, b.open_price, price && price.price);
  txt(ctx, fp === null ? '–' : fmtSigned(fp), W - PAD, y + 52, { w: 800, size: 44, color: toneColor(P, fp), align: 'right', ls: -1 });
  txt(ctx, fp === null ? 'điểm' : `${fmtMoneyShort(fp)}/HĐ`, W - PAD, y + 82, { size: 20, color: P.muted, align: 'right' });
}

// ---------- Poster tổng quan (trang chủ) ----------
function overviewStats(bots, price) {
  const traded = bots.filter((b) => Number(b.total_trades) > 0);
  const trades = traded.reduce((s, b) => s + Number(b.total_trades || 0), 0);
  const wins = traded.reduce((s, b) => s + Number(b.win_count || 0), 0);
  const pnl = traded.reduce((s, b) => s + Number(b.pnl_points || 0), 0);
  const open = bots.filter((b) => sideOf(b.current_side)).map((b) => ({ b, fp: floatPts(b.current_side, b.open_price, price && price.price) }));
  open.sort((a, c) => (c.fp ?? -1e9) - (a.fp ?? -1e9));
  const longs = open.filter((o) => sideOf(o.b.current_side) === 'BUY').length;
  return {
    traded, trades, wins, pnl, open, longs, shorts: open.length - longs, flat: bots.length - open.length,
    leader: traded.find((b) => Number(b.total_trades) >= MIN_TRADES && Number(b.pnl_points) > 0) || traded[0],
    winners: traded.filter((b) => Number(b.pnl_points) > 0).length, wr: trades ? (wins / trades) * 100 : null, avg: trades ? pnl / trades : null,
  };
}
function chipFor(period, t) {
  if (period === 'daily') return { chip: t.live ? `TRỰC TIẾP ${t.time}` : `${t.wd.toUpperCase()} ${t.dm}`, live: t.live };
  if (period === 'weekly') return { chip: `TUẦN ĐẾN ${t.dm}` };
  if (period === 'monthly') return { chip: `THÁNG ${t.month}` };
  return { chip: `ĐẾN ${t.date}` };
}

function overviewVariants(opts) {
  const st = overviewStats(opts.bots, opts.price);
  const v = [{ id: 'rank', label: 'Xếp hạng' }];
  if (st.traded.length) v.push({ id: 'spot', label: 'Tiêu điểm' });
  v.push({ id: 'pos', label: 'Vị thế' });
  // Trong phiên, mặc định khoe vị thế realtime; ngoài phiên khoe bảng xếp hạng
  const t = vnNow();
  const def = opts.period === 'daily' && t.live && st.open.length ? 'pos' : 'rank';
  return { list: v, def };
}

function drawOverview(ctx, P, opts, variant) {
  const { bots, period, price } = opts;
  const t = vnNow(), st = overviewStats(bots, price), pl = PL[period] || '';
  const { chip, live } = chipFor(period, t);
  if (variant === 'spot' && !st.traded.length) variant = 'rank';
  drawFrame(ctx, P, variant, chip, live, null, qrLink(`${SITE}/${period === 'daily' ? '' : '?ky=' + period}`));
  const when = period === 'daily' ? t.session : `BẢNG XẾP HẠNG ${pl.toUpperCase()}`;
  let y;

  if (variant === 'pos') {
    const title = !st.open.length ? 'Các bot đang đứng ngoài'
      : st.open.length < Math.max(3, bots.length * 0.1) ? `${st.flat}/${bots.length} bot đứng ngoài`
      : st.longs > st.shorts * 1.5 ? 'Bot đang nghiêng về Long'
      : st.shorts > st.longs * 1.5 ? 'Bot đang nghiêng về Short' : 'Bot chia phe Long – Short';
    y = headline(ctx, P, `VỊ THẾ BOT · ${period === 'daily' ? t.session : 'HIỆN TẠI'}`, title);
    y += 40;
    // Thẻ đồng thuận Long/Short
    const ch = 330;
    card(ctx, P, PAD, y, INNER, ch, 32);
    txt(ctx, 'BOT ĐANG GIỮ LỆNH', PAD + 40, y + 58, { w: 700, size: 20, color: P.muted, ls: 1.4 });
    priceText(ctx, P, price, W - PAD - 40, y + 58, 'right', 24);
    txt(ctx, String(st.longs), PAD + 36, y + 214, { w: 800, size: 150, color: P.pos, ls: -5 });
    txt(ctx, 'LONG', PAD + 44, y + 258, { w: 800, size: 26, color: P.pos, ls: 2 });
    txt(ctx, String(st.shorts), W - PAD - 36, y + 214, { w: 800, size: 150, color: P.neg, align: 'right', ls: -5 });
    txt(ctx, 'SHORT', W - PAD - 44, y + 258, { w: 800, size: 26, color: P.neg, align: 'right', ls: 2 });
    txt(ctx, `${st.flat}`, W / 2, y + 196, { w: 800, size: 64, color: P.ink2, align: 'center' });
    txt(ctx, 'đứng ngoài', W / 2, y + 236, { w: 600, size: 24, color: P.muted, align: 'center' });
    const bx = PAD + 40, bw = INNER - 80, by = y + ch - 44, tot = Math.max(1, bots.length);
    rr(ctx, bx, by, bw, 14, 7); ctx.fillStyle = P.surface2; ctx.fill();
    ctx.save(); rr(ctx, bx, by, bw, 14, 7); ctx.clip();
    ctx.fillStyle = P.pos; ctx.fillRect(bx, by, (st.longs / tot) * bw, 14);
    ctx.fillStyle = P.neg; ctx.fillRect(bx + bw - (st.shorts / tot) * bw, by, (st.shorts / tot) * bw, 14);
    ctx.restore();
    y += ch + 74;
    if (st.open.length) {
      sectionTitle(ctx, P, `Lệnh đang mở (${st.open.length})`, y, 'Lãi/lỗ tạm (điểm)');
      y += 20;
      // Ít lệnh mở thì dành phần còn lại cho bảng dẫn đầu kỳ
      const extra = st.traded.length ? 74 + 20 + 3 * 92 : 0;
      const fr = fillRows(y, st.open.length, 96, 100);
      if (st.open.length * 100 + extra > BOTTOM - y) fr.h = Math.floor((BOTTOM - y) / Math.max(1, fr.count));
      st.open.slice(0, fr.count).forEach(({ b }) => { drawOpenRow(ctx, P, b, price, y, fr.h); y += fr.h; });
      if (extra && BOTTOM - y >= extra) {
        y += 74;
        sectionTitle(ctx, P, `Dẫn đầu ${pl}`, y, 'Lãi/lỗ (điểm)');
        y += 20;
        const rr2 = fillRows(y, st.traded.length);
        st.traded.slice(0, rr2.count).forEach((b, i) => { drawRankRow(ctx, P, b, i + 1, y, rr2.h); y += rr2.h; });
      }
    } else {
      emptyNote(ctx, P, 'Chờ tín hiệu mới', 'Quét mã để xem ngay khi bot vào lệnh Long hoặc Short.', y - 30);
      if (st.traded.length) {
        y += 260;
        sectionTitle(ctx, P, `Dẫn đầu ${pl}`, y, 'Lãi/lỗ (điểm)');
        y += 20;
        const rr2 = fillRows(y, st.traded.length);
        st.traded.slice(0, rr2.count).forEach((b, i) => { drawRankRow(ctx, P, b, i + 1, y, rr2.h); y += rr2.h; });
      }
    }
  } else if (variant === 'spot') {
    const top = st.leader;
    y = headline(ctx, P, `BOT DẪN ĐẦU ${pl.toUpperCase()}`, top.name);
    const sub = [shortCat(top.category_label), top.timeframe ? `Khung ${top.timeframe}` : '', top.strategy_type === 'short' ? 'Intraday' : top.strategy_type === 'long' ? 'Giữ qua đêm' : ''].filter(Boolean).join(' · ');
    if (sub) { y += 52; txt(ctx, fit(ctx, sub, 500, 28, INNER), PAD, y, { w: 500, size: 28, color: P.ink2 }); }
    y += 36;
    const ch = 600;
    card(ctx, P, PAD, y, INNER, ch, 32);
    txt(ctx, `LÃI/LỖ ${pl.toUpperCase()}`, PAD + 40, y + 60, { w: 700, size: 21, color: P.muted, ls: 1.4 });
    if (sideOf(top.current_side)) sidePill(ctx, P, top.current_side, W - PAD - 40 - measure(ctx, sideInfo(P, top.current_side).label, 800, 22, 1.2) - 24, y + 58, 22);
    const v = fmtSigned(top.pnl_points);
    const vs = fitSize(ctx, v, 800, 176, 120, INNER - 240, -6);
    const vw = txt(ctx, v, PAD + 34, y + 60 + vs * 0.92, { w: 800, size: vs, color: toneColor(P, top.pnl_points), ls: -6 });
    txt(ctx, 'điểm', PAD + 34 + vw + 18, y + 60 + vs * 0.92, { w: 700, size: 40, color: P.ink2 });
    txt(ctx, `≈ ${fmtMoneyShort(top.pnl_points)} mỗi hợp đồng`, PAD + 40, y + 60 + vs * 0.92 + 50, { size: 26, color: P.muted });
    drawSpark(ctx, P, top.sparkline, PAD + 40, y + 330, INNER - 80, ch - 370, { lw: 6, dots: true });
    y += ch + 24;
    y = statStrip(ctx, P, [
      { label: 'Tỷ lệ thắng', value: fmtPct(top.win_rate, 0), sub: `${top.win_count || 0} thắng / ${top.loss_count || 0} thua`, subColor: Number(top.total_trades) < MIN_TRADES ? P.warn : undefined },
      { label: 'Profit factor', value: Number(top.profit_factor) > 0 ? fmt(top.profit_factor, 2) : '–', sub: 'lãi / lỗ' },
      { label: 'Sụt giảm', value: Number(top.max_drawdown) > 0 ? fmtSigned(-top.max_drawdown) : '0', color: Number(top.max_drawdown) > 0 ? P.neg : P.ink, sub: 'điểm, tối đa' },
    ], y, 160);
    y += 74;
    const others = st.traded.filter((b) => b !== top);
    if (others.length) {
      sectionTitle(ctx, P, 'Bám đuổi', y, 'Lãi/lỗ (điểm)');
      y += 20;
      const fr = fillRows(y, others.length);
      others.slice(0, fr.count).forEach((b) => { drawRankRow(ctx, P, b, st.traded.indexOf(b) + 1, y, fr.h); y += fr.h; });
    }
  } else {
    const title = st.traded.length ? `${st.winners}/${st.traded.length} bot có lãi ${pl}` : `Chưa có lệnh đóng ${pl}`;
    y = headline(ctx, P, period === 'daily' ? `${t.session} · BẢNG XẾP HẠNG` : when, title);
    y += 40;
    y = statStrip(ctx, P, [
      { label: 'Lệnh đã đóng', value: String(st.trades), sub: st.trades ? `${st.wins} lệnh thắng` : `${bots.length} bot theo dõi` },
      { label: 'Tỷ lệ thắng', value: st.trades ? fmtPct(st.wr, 0) : '–', sub: st.trades ? `${st.traded.length} bot giao dịch` : '' },
      { label: 'TB mỗi lệnh', value: st.trades ? fmtSigned(st.avg, 2) : '–', color: toneColor(P, st.avg), sub: st.trades ? `≈ ${fmtMoneyShort(st.avg)}/HĐ` : 'điểm' },
    ], y);
    y += 76;
    if (st.traded.length) {
      const fr = fillRows(y + 20, st.traded.length);
      sectionTitle(ctx, P, `Top ${fr.count} bot ${pl}`, y, 'Lãi/lỗ (điểm)');
      y += 20;
      st.traded.slice(0, fr.count).forEach((b, i) => { drawRankRow(ctx, P, b, i + 1, y, fr.h); y += fr.h; });
    } else if (st.open.length) {
      sectionTitle(ctx, P, `Lệnh đang mở (${st.open.length})`, y, 'Lãi/lỗ tạm (điểm)');
      y += 20;
      const fr = fillRows(y, st.open.length, 96, 110);
      st.open.slice(0, fr.count).forEach(({ b }) => { drawOpenRow(ctx, P, b, price, y, fr.h); y += fr.h; });
    } else {
      emptyNote(ctx, P, 'Chờ tín hiệu mới', 'Chưa có bot nào giao dịch trong kỳ. Quét mã để xem ngay khi bot vào lệnh.', y - 30);
    }
  }

  drawFooter(ctx, P, `${t.time} ${t.date}`);
  const link = `${SITE}/${period === 'daily' ? '' : '?ky=' + period}`;
  let caption;
  if (variant === 'pos') caption = `Vị thế bot phái sinh lúc ${t.time} ${t.date}: ${st.longs} bot Long, ${st.shorts} bot Short, ${st.flat} đứng ngoài.`;
  else if (variant === 'spot') caption = `Bot dẫn đầu ${pl}: ${st.leader.name} ${fmtSigned(st.leader.pnl_points)} điểm, thắng ${fmtPct(st.leader.win_rate, 0)} sau ${st.leader.total_trades} lệnh.`;
  else caption = st.trades ? `Bot phái sinh ${pl} (${t.date}): ${st.winners}/${st.traded.length} bot có lãi, ${st.trades} lệnh đóng, tỷ lệ thắng ${fmtPct(st.wr, 0)}.` : `Bot phái sinh ${pl} (${t.date}): chưa có lệnh đóng.`;
  return {
    filename: `signal-phaisinh-${variant}-${period}-${t.iso}-${t.hhmm}.png`,
    caption: `${caption} Theo dõi realtime: ${link}`,
  };
}

// ---------- Poster một bot ----------
const REASON = { TP: 'Chốt lời', SL: 'Cắt lỗ', REVERSE: 'Đảo chiều', EOD: 'Đóng cuối phiên', TIME: 'Đóng cuối phiên', EXIT: 'Đóng lệnh', CLOSE: 'Đóng lệnh' };
function sigAction(s) {
  const t = String(s.order_type || '').toUpperCase(), closing = isNum(s.pnl_points);
  if (t === 'REVERSE' || (t === 'ENTRY' && closing)) return { text: 'Đảo chiều', side: s.side };
  if (closing || Number(s.is_close)) return { text: REASON[String(s.exit_reason || '').toUpperCase()] || 'Đóng lệnh', side: '' };
  return { text: 'Vào lệnh', side: s.side || (/SHORT|SELL/i.test(s.comment || '') ? 'SELL' : /LONG|BUY/i.test(s.comment || '') ? 'BUY' : '') };
}
function botVariants(opts) {
  const b = opts.bot, v = [{ id: 'perf', label: 'Hiệu suất' }];
  if ((b.signals || []).length) v.push({ id: 'log', label: 'Nhật ký' });
  const open = sideOf((b.position || {}).current_side);
  if (open) v.push({ id: 'live', label: 'Lệnh mở' });
  return { list: v, def: open && vnNow().live ? 'live' : 'perf' };
}
function botSub(b) {
  return [shortCat(b.category_label), b.timeframe ? `Khung ${b.timeframe}` : '', b.strategy_type === 'short' ? 'Intraday, đóng 14:28' : b.strategy_type === 'long' ? 'Giữ qua đêm' : ''].filter(Boolean).join(' · ');
}
function drawBot(ctx, P, opts, variant) {
  const { bot, period, price } = opts;
  const t = vnNow(), sc = (bot.scores || {})[period] || {}, pl = PL[period] || '';
  const trades = Number(sc.total_trades || 0);
  const pos = bot.position || {}, ps = sideOf(pos.current_side);
  if (variant === 'live' && !ps) variant = 'perf';
  if (variant === 'log' && !(bot.signals || []).length) variant = 'perf';
  const { chip, live } = variant === 'live' ? { chip: t.live ? `TRỰC TIẾP ${t.time}` : `${t.time} ${t.dm}`, live: t.live } : chipFor(period, t);
  drawFrame(ctx, P, variant, chip, live, ps ? sideInfo(P, ps).color : null, qrLink(`${SITE}/bot/${encodeURIComponent(bot.bot_id)}`));
  const eyebrow = variant === 'live' ? `LỆNH ĐANG MỞ · BOT ${bot.bot_id}` : variant === 'log' ? `NHẬT KÝ LỆNH · BOT ${bot.bot_id}` : `HIỆU SUẤT ${pl.toUpperCase()} · BOT ${bot.bot_id}`;
  let y = headline(ctx, P, eyebrow, bot.name);
  const sub = botSub(bot);
  if (sub) { y += 52; txt(ctx, fit(ctx, sub, 500, 28, INNER), PAD, y, { w: 500, size: 28, color: P.ink2 }); }
  y += 36;

  if (variant === 'live') {
    const { label, color } = sideInfo(P, ps);
    const d = parseVnTime(pos.open_time), fp = floatPts(ps, pos.open_price, price && price.price);
    const ch = 470;
    card(ctx, P, PAD, y, INNER, ch, 32);
    ctx.save(); rr(ctx, PAD, y, INNER, ch, 32); ctx.clip(); ctx.fillStyle = color; ctx.fillRect(PAD, y, 12, ch); ctx.restore();
    txt(ctx, 'BOT ĐANG GIỮ', PAD + 48, y + 62, { w: 700, size: 21, color: P.muted, ls: 1.4 });
    txt(ctx, label, PAD + 42, y + 214, { w: 800, size: 156, color, ls: -4 });
    txt(ctx, 'LÃI/LỖ TẠM', W - PAD - 40, y + 62, { w: 700, size: 21, color: P.muted, align: 'right', ls: 1.4 });
    txt(ctx, fp === null ? '–' : fmtSigned(fp), W - PAD - 40, y + 184, { w: 800, size: 96, color: toneColor(P, fp), align: 'right', ls: -3 });
    txt(ctx, fp === null ? 'điểm' : `điểm · ${fmtMoneyShort(fp)}/HĐ`, W - PAD - 40, y + 226, { w: 600, size: 24, color: P.muted, align: 'right' });
    ctx.fillStyle = P.line; ctx.fillRect(PAD + 40, y + 280, INNER - 80, 2);
    const cells = [
      ['Giá vào', fmt(pos.open_price), d ? `lúc ${vnNow(d).time} ${vnNow(d).dm}` : ''],
      ['Giá hiện tại', price && isNum(price.price) ? fmt(price.price) : '–', price && isNum(price.change) ? `${fmtSigned(price.change)} (${fmtSigned(price.change_pct, 2)}%)` : ''],
      ['Đã giữ', d ? since(d) : '–', ''],
    ];
    const cw = (INNER - 80) / 3;
    cells.forEach(([l, v, s], i) => {
      const x = PAD + 40 + i * cw;
      txt(ctx, l.toUpperCase(), x, y + 336, { w: 700, size: 19, color: P.muted, ls: 1.3 });
      txt(ctx, fit(ctx, v, 800, 46, cw - 20), x, y + 394, { w: 800, size: 46, color: P.ink, ls: -1 });
      if (s) txt(ctx, fit(ctx, s, 400, 21, cw - 20), x, y + 430, { size: 21, color: i === 1 ? toneColor(P, price && price.change) : P.muted });
    });
    y += ch + 24;
    const tp = isNum(pos.current_tp), sl = isNum(pos.current_sl);
    y = statStrip(ctx, P, !tp && !sl ? [
      { label: `Lãi/lỗ ${pl}`, value: trades ? fmtSigned(sc.pnl_points) : '–', color: toneColor(P, sc.pnl_points), sub: trades ? `≈ ${fmtMoneyShort(sc.pnl_points)}/HĐ` : 'chưa có lệnh đóng' },
      { label: 'Tỷ lệ thắng', value: trades ? fmtPct(sc.win_rate, 0) : '–', sub: trades ? `${sc.win_count || 0} thắng / ${sc.loss_count || 0} thua` : '', subColor: trades && trades < MIN_TRADES ? P.warn : undefined },
      { label: 'Lệnh đã đóng', value: String(trades), sub: pl },
    ] : [
      { label: 'Chốt lời', value: tp ? fmt(pos.current_tp) : '–', color: tp ? P.pos : P.ink, sub: tp && isNum(pos.open_price) ? `${fmtSigned(ps === 'BUY' ? pos.current_tp - pos.open_price : pos.open_price - pos.current_tp)} điểm` : 'theo tín hiệu' },
      { label: 'Cắt lỗ', value: sl ? fmt(pos.current_sl) : '–', color: sl ? P.neg : P.ink, sub: sl && isNum(pos.open_price) ? `${fmtSigned(ps === 'BUY' ? pos.current_sl - pos.open_price : pos.open_price - pos.current_sl)} điểm` : 'theo tín hiệu' },
      { label: `Lãi/lỗ ${pl}`, value: trades ? fmtSigned(sc.pnl_points) : '–', color: toneColor(P, sc.pnl_points), sub: trades ? `${trades} lệnh · thắng ${fmtPct(sc.win_rate, 0)}` : 'chưa có lệnh đóng' },
    ], y, 160);
    y += 40;
    drawEquityCard(ctx, P, sc.sparkline, y, BOTTOM - y, pl);
  } else if (variant === 'log') {
    y = statStrip(ctx, P, [
      { label: `Lãi/lỗ ${pl}`, value: trades ? fmtSigned(sc.pnl_points) : '–', color: toneColor(P, sc.pnl_points), sub: trades ? `≈ ${fmtMoneyShort(sc.pnl_points)}/HĐ` : 'chưa có lệnh đóng' },
      { label: 'Tỷ lệ thắng', value: trades ? fmtPct(sc.win_rate, 0) : '–', sub: trades ? `${sc.win_count || 0} thắng / ${sc.loss_count || 0} thua` : '', subColor: trades && trades < MIN_TRADES ? P.warn : undefined },
      { label: 'Vị thế', value: sideInfo(P, ps).label, color: sideInfo(P, ps).color, sub: ps ? `vào ${fmt(pos.open_price)}` : 'chờ tín hiệu' },
    ], y, 160);
    y += 76;
    const rowH = 92, sigs = (bot.signals || []).slice(0, Math.max(1, Math.floor((BOTTOM - y - 20) / rowH)));
    sectionTitle(ctx, P, `${sigs.length} tín hiệu gần nhất`, y, 'Lãi/lỗ (điểm)');
    y += 20;
    sigs.forEach((s) => { drawSigRow(ctx, P, s, y, rowH); y += rowH; });
  } else {
    // Hiệu suất: số lớn + chỉ số + đường lãi/lỗ lũy kế + vị thế
    const ch = 250;
    card(ctx, P, PAD, y, INNER, ch, 32);
    txt(ctx, `LÃI/LỖ ${pl.toUpperCase()}`, PAD + 40, y + 60, { w: 700, size: 21, color: P.muted, ls: 1.4 });
    if (trades) {
      const v = fmtSigned(sc.pnl_points);
      const vs = fitSize(ctx, v, 800, 140, 100, INNER - 260, -5);
      const vw = txt(ctx, v, PAD + 34, y + 186, { w: 800, size: vs, color: toneColor(P, sc.pnl_points), ls: -5 });
      txt(ctx, 'điểm', PAD + 34 + vw + 18, y + 186, { w: 700, size: 38, color: P.ink2 });
      txt(ctx, `≈ ${fmtMoneyShort(sc.pnl_points)} mỗi hợp đồng · ${trades} lệnh đã đóng`, PAD + 40, y + 226, { size: 24, color: P.muted });
    } else {
      txt(ctx, 'Chưa có lệnh đóng', PAD + 40, y + 160, { w: 800, size: 60, color: P.ink, ls: -1.5 });
      txt(ctx, 'Xem kỳ dài hơn trên web để thấy hiệu suất đầy đủ', PAD + 40, y + 210, { size: 24, color: P.muted });
    }
    y += ch + 24;
    y = statStrip(ctx, P, [
      { label: 'Tỷ lệ thắng', value: trades ? fmtPct(sc.win_rate, 0) : '–', sub: trades ? `${sc.win_count || 0} thắng / ${sc.loss_count || 0} thua` : '', subColor: trades && trades < MIN_TRADES ? P.warn : undefined },
      { label: 'Profit factor', value: Number(sc.profit_factor) > 0 ? fmt(sc.profit_factor, 2) : '–', sub: 'lãi / lỗ' },
      { label: 'Sụt giảm', value: Number(sc.max_drawdown) > 0 ? fmtSigned(-sc.max_drawdown) : '–', color: Number(sc.max_drawdown) > 0 ? P.neg : P.ink, sub: 'điểm, tối đa' },
    ], y, 160);
    const posH = 120, chartBottom = BOTTOM - posH - 24;
    y += 24;
    drawEquityCard(ctx, P, sc.sparkline, y, chartBottom - y, pl);
    const py = chartBottom + 24;
    card(ctx, P, PAD, py, INNER, posH, 28);
    txt(ctx, 'VỊ THẾ', PAD + 36, py + 72, { w: 700, size: 20, color: P.muted, ls: 1.4 });
    const pw = sidePill(ctx, P, ps, PAD + 140, py + 74, 24);
    if (ps) {
      const d = parseVnTime(pos.open_time);
      txt(ctx, `vào ${fmt(pos.open_price)}${d ? ' · ' + vnNow(d).time + ' ' + vnNow(d).dm : ''}`, PAD + 140 + pw + 20, py + 72, { w: 600, size: 26, color: P.ink2 });
      const fp = floatPts(ps, pos.open_price, price && price.price);
      txt(ctx, fp === null ? '–' : fmtSigned(fp), W - PAD - 36, py + 78, { w: 800, size: 48, color: toneColor(P, fp), align: 'right', ls: -1 });
    } else {
      priceText(ctx, P, price, W - PAD - 36, py + 72, 'right', 24);
    }
  }

  const path = `/bot/${encodeURIComponent(bot.bot_id)}`;
  drawFooter(ctx, P, `${t.time} ${t.date}`);
  let caption;
  if (variant === 'live') caption = `${bot.name} đang giữ ${sideInfo(P, ps).label} từ giá ${fmt(pos.open_price)}.`;
  else caption = trades ? `${bot.name} ${pl}: ${fmtSigned(sc.pnl_points)} điểm, thắng ${fmtPct(sc.win_rate, 0)} sau ${trades} lệnh.` : `${bot.name}: theo dõi vị thế và nhật ký lệnh realtime.`;
  return {
    filename: `signal-phaisinh-${String(bot.bot_id).toLowerCase()}-${variant}-${t.iso}-${t.hhmm}.png`,
    caption: `${caption} Xem trực tiếp: ${SITE}${path}`,
  };
}
function drawSigRow(ctx, P, s, y, h) {
  ctx.fillStyle = P.line; ctx.fillRect(PAD, y + h - 1, INNER, 2);
  const tm = sigTime(s.created_at);
  txt(ctx, tm ? tm.time : '–', PAD, y + 46, { w: 800, size: 32, color: P.ink });
  txt(ctx, tm ? tm.dm : '', PAD, y + 76, { size: 21, color: P.muted });
  const a = sigAction(s), nx = PAD + 130;
  const aw = txt(ctx, a.text, nx, y + 46, { w: 700, size: 30, color: P.ink });
  if (sideOf(a.side)) sidePill(ctx, P, a.side, nx + aw + 14, y + 44, 17);
  const extra = [`giá ${fmt(s.price)}`, isNum(s.tp) ? `TP ${fmt(s.tp)}` : '', isNum(s.sl) ? `SL ${fmt(s.sl)}` : ''].filter(Boolean).join(' · ');
  txt(ctx, fit(ctx, extra, 400, 22, W - PAD - 200 - nx), nx, y + 76, { size: 22, color: P.muted });
  const v = isNum(s.pnl_points) ? fmtSigned(s.pnl_points) : '';
  if (v) txt(ctx, v, W - PAD, y + 58, { w: 800, size: 42, color: toneColor(P, s.pnl_points), align: 'right', ls: -1 });
  else txt(ctx, 'mở lệnh', W - PAD, y + 56, { w: 600, size: 22, color: P.muted, align: 'right' });
}
function drawEquityCard(ctx, P, points, y, h, pl) {
  if (h < 160) return;
  card(ctx, P, PAD, y, INNER, h, 28);
  const pts = (points || []).map(Number).filter(Number.isFinite);
  txt(ctx, 'LÃI/LỖ LŨY KẾ', PAD + 36, y + 54, { w: 700, size: 20, color: P.muted, ls: 1.4 });
  if (!pts.length) {
    txt(ctx, 'Chưa có lệnh đóng để vẽ biểu đồ', W / 2, y + h / 2 + 20, { size: 26, color: P.muted, align: 'center' });
    return;
  }
  const total = pts.reduce((s, v) => s + v, 0);
  const lw = txt(ctx, `${fmtSigned(total)} điểm`, W - PAD - 36, y + 54, { w: 800, size: 26, color: toneColor(P, total), align: 'right' });
  txt(ctx, `${pts.length} lệnh ${pl} · `, W - PAD - 36 - lw, y + 54, { size: 21, color: P.muted, align: 'right' });
  drawSpark(ctx, P, pts, PAD + 44, y + 92, INNER - 88, h - 128, { lw: 6, dots: true });
}

// ---------- API vẽ (dùng chung cho hộp thoại và kiểm thử) ----------
export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
export function posterVariants(opts) { return opts.kind === 'bot' ? botVariants(opts) : overviewVariants(opts); }
export function renderPoster(opts, { variant, theme = currentTheme(), qr = QR_DEFAULT } = {}) {
  qrSize = qr;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const P = palette(theme);
  const v = variant || posterVariants(opts).def;
  const meta = opts.kind === 'bot' ? drawBot(ctx, P, opts, v) : drawOverview(ctx, P, opts, v);
  return { canvas, meta };
}
export async function fontsReady() {
  if (!document.fonts || !document.fonts.load) return;
  const sample = 'Bản tin bot phái sinh ĐỨNG NGOÀI Lãi/lỗ −+0123456789';
  try {
    await Promise.race([
      Promise.all(['400', '500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px "Be Vietnam Pro"`, sample))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* dùng font hệ thống */ }
}

// ---------- Hộp thoại xem trước & chia sẻ ----------
const ICON = {
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
};
let dlg = null, objUrl = '';
function ensureDialog() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.className = 'share-dlg';
  dlg.setAttribute('aria-labelledby', 'share-title');
  dlg.innerHTML = `
    <div class="share-head">
      <h2 id="share-title">Chia sẻ ảnh</h2>
      <button type="button" class="icon-btn" data-close aria-label="Đóng"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <div class="share-body">
      <figure class="share-preview"><img alt="" hidden><span class="share-wait">Đang tạo ảnh…</span></figure>
      <div class="share-side">
        <div class="share-opt"><span class="share-opt-lbl" id="share-v-lbl">Mẫu ảnh</span><div class="seg seg-sm" role="group" aria-labelledby="share-v-lbl" data-opt="variant"></div></div>
        <div class="share-opt"><span class="share-opt-lbl" id="share-t-lbl">Nền</span><div class="seg seg-sm" role="group" aria-labelledby="share-t-lbl" data-opt="theme">
          <button type="button" data-v="light">Sáng</button><button type="button" data-v="dark">Tối</button></div></div>
        <div class="share-actions">
          <button type="button" class="cta" data-act="share" hidden>${ICON.share} Chia sẻ ảnh</button>
          <button type="button" class="btn-outline" data-act="download">${ICON.download} Tải ảnh</button>
          <button type="button" class="btn-ghost" data-act="copy">${ICON.copy} Sao chép lời giới thiệu</button>
        </div>
        <p class="share-status" role="status" aria-live="polite"></p>
        <p class="share-tip">Gửi kèm lời giới thiệu (có sẵn liên kết) để người nhận bấm xem ngay. Trong Zalo, nếu không tải được, hãy nhấn giữ ảnh để lưu.</p>
      </div>
    </div>`;
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.appendChild(dlg);
  return dlg;
}

async function copyText(s) {
  try { await navigator.clipboard.writeText(s); return true; } catch { return false; }
}
function pressSeg(seg, v) { seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }

/** opts: { kind: 'overview', period, bots, price } | { kind: 'bot', period, bot, price } */
export async function openShare(opts) {
  const d = ensureDialog();
  const img = d.querySelector('img'), wait = d.querySelector('.share-wait');
  const btnShare = d.querySelector('[data-act="share"]'), btnDl = d.querySelector('[data-act="download"]'), btnCopy = d.querySelector('[data-act="copy"]');
  const segV = d.querySelector('[data-opt="variant"]'), segT = d.querySelector('[data-opt="theme"]');
  const status = d.querySelector('.share-status');
  const note = (s) => { status.textContent = s; };
  d.querySelector('#share-title').textContent = opts.kind === 'bot' ? 'Chia sẻ ảnh bot' : opts.period === 'daily' ? 'Chia sẻ bản tin hôm nay' : 'Chia sẻ bảng xếp hạng';

  const variants = posterVariants(opts);
  const sel = { variant: variants.def, theme: currentTheme() };
  segV.innerHTML = variants.list.map((v) => `<button type="button" data-v="${v.id}">${v.label}</button>`).join('');
  segV.parentElement.hidden = variants.list.length < 2;
  if (!d.open) d.showModal();
  await fontsReady();

  let meta = null, file = null, token = 0;
  const draw = async () => {
    const my = ++token;
    pressSeg(segV, sel.variant); pressSeg(segT, sel.theme);
    [btnShare, btnDl, btnCopy].forEach((b) => { b.disabled = true; });
    img.hidden = true; wait.hidden = false; wait.textContent = 'Đang tạo ảnh…'; note('');
    let out;
    try { out = renderPoster(opts, sel); } catch { wait.textContent = 'Không tạo được ảnh. Vui lòng thử lại.'; img.hidden = true; return; }
    const blob = await new Promise((r) => out.canvas.toBlob(r, 'image/png'));
    if (my !== token) return;
    if (!blob) { wait.textContent = 'Trình duyệt không hỗ trợ xuất ảnh.'; img.hidden = true; return; }
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(blob);
    meta = out.meta;
    img.src = objUrl; img.alt = meta.caption;
    img.hidden = false; wait.hidden = true;
    file = new File([blob], meta.filename, { type: 'image/png' });
    const canShareFile = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    btnShare.hidden = !canShareFile;
    btnDl.className = canShareFile ? 'btn-outline' : 'cta';
    [btnShare, btnDl, btnCopy].forEach((b) => { b.disabled = false; });
  };
  segV.onclick = (e) => { const b = e.target.closest('button[data-v]'); if (b && b.dataset.v !== sel.variant) { sel.variant = b.dataset.v; draw(); } };
  segT.onclick = (e) => { const b = e.target.closest('button[data-v]'); if (b && b.dataset.v !== sel.theme) { sel.theme = b.dataset.v; draw(); } };

  const download = () => {
    const a = Object.assign(document.createElement('a'), { href: objUrl, download: meta.filename });
    document.body.appendChild(a); a.click(); a.remove();
    note('Đã tải ảnh. Gửi kèm lời giới thiệu để người nhận bấm xem ngay.');
  };
  btnDl.onclick = download;
  btnCopy.onclick = async () => {
    if (await copyText(meta.caption)) note('Đã sao chép lời giới thiệu kèm liên kết.');
    else window.prompt('Sao chép lời giới thiệu:', meta.caption);
  };
  btnShare.onclick = async () => {
    copyText(meta.caption); // Zalo thường bỏ phần chữ khi chia sẻ ảnh; để sẵn trong bộ nhớ tạm để dán
    try { await navigator.share({ files: [file], title: HOST, text: meta.caption }); }
    catch (e) { if (e && e.name !== 'AbortError') download(); }
  };
  await draw();
}
