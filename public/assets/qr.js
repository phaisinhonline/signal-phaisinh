// Bộ sinh mã QR tối giản (chế độ byte, mức sửa lỗi M, phiên bản 1–9), không phụ thuộc thư viện.
// Thuật toán theo ISO/IEC 18004; đối chiếu ma trận với thư viện Python `qrcode` (xem docs/ROADMAP.md).

const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22];
const NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5];

const rawModules = (v) => {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
  return r;
};
const dataCodewords = (v) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * NUM_BLOCKS[v];

function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
  return z;
}
function rsDivisor(deg) {
  const r = new Array(deg).fill(0); r[deg - 1] = 1;
  let root = 1;
  for (let i = 0; i < deg; i++) {
    for (let j = 0; j < deg; j++) { r[j] = gfMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
    root = gfMul(root, 2);
  }
  return r;
}
function rsRemainder(data, div) {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); }
  return r;
}

function encodeData(bytes, v) {
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, 8);
  bytes.forEach((b) => put(b, 8));
  const cap = dataCodewords(v) * 8;
  put(0, Math.min(4, cap - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
  const out = [];
  for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  return out;
}

function addEcc(data, v) {
  const nb = NUM_BLOCKS[v], ecl = ECC_PER_BLOCK[v], raw = Math.floor(rawModules(v) / 8);
  const nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb);
  const div = rsDivisor(ecl), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const len = shortLen - ecl + (i < nShort ? 0 : 1);
    const dat = data.slice(k, k + len); k += len;
    const ecc = rsRemainder(dat, div);
    if (i < nShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const out = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecl || j >= nShort) out.push(b[i]); });
  return out;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function build(v, codewords, mask) {
  const n = v * 4 + 17;
  const m = Array.from({ length: n }, () => new Array(n).fill(false));
  const fn = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true; };
  for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < n && y >= 0 && y < n) set(x, y, d !== 2 && d !== 4);
    }
  }
  if (v > 1) {
    const cnt = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (cnt * 2 - 2)) * 2;
    const pos = [6];
    for (let p = n - 7; pos.length < cnt; p -= step) pos.splice(1, 0, p);
    pos.forEach((ax, i) => pos.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === cnt - 1) || (i === cnt - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
  }
  // Thông tin định dạng: mức M (00) + mẫu mặt nạ
  const fd = mask; let rem = fd;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const fb = ((fd << 10) | rem) ^ 0x5412, bit = (i) => ((fb >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
  set(8, n - 8, true);
  if (v >= 7) {
    let r = v;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const vb = (v << 12) | r;
    for (let i = 0; i < 18; i++) { const d = ((vb >>> i) & 1) === 1, a = n - 11 + (i % 3), b = Math.floor(i / 3); set(a, b, d); set(b, a, d); }
  }
  // Dữ liệu theo đường zigzag
  let k = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vert : vert;
      if (!fn[y][x] && k < codewords.length * 8) { m[y][x] = ((codewords[k >>> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
    }
  }
  const f = MASKS[mask];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fn[y][x] && f(x, y)) m[y][x] = !m[y][x];
  return m;
}

function penalty(m) {
  const n = m.length; let p = 0, dark = 0;
  const line = (get) => {
    for (let a = 0; a < n; a++) {
      let run = 1;
      for (let b = 1; b <= n; b++) {
        if (b < n && get(a, b) === get(a, b - 1)) run++;
        else { if (run >= 5) p += run - 2; run = 1; }
      }
      for (let b = 0; b + 11 <= n; b++) {
        const s = Array.from({ length: 11 }, (_, i) => (get(a, b + i) ? 1 : 0)).join('');
        if (s === '10111010000' || s === '00001011101') p += 40;
      }
    }
  };
  line((a, b) => m[a][b]);
  line((a, b) => m[b][a]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (m[y][x]) dark++;
    if (x < n - 1 && y < n - 1) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
  }
  return p + Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
}

/** Trả về ma trận boolean (true = ô tối). `forceMask` chỉ dùng khi kiểm thử. */
export function qrMatrix(text, forceMask) {
  const bytes = [...new TextEncoder().encode(text)];
  let v = 1;
  while (v <= 9 && dataCodewords(v) < bytes.length + 2) v++;
  if (v > 9) throw new Error('Chuỗi quá dài cho mã QR');
  const cw = addEcc(encodeData(bytes, v), v);
  if (forceMask !== undefined) return build(v, cw, forceMask);
  let best = null, bestP = Infinity;
  for (let mk = 0; mk < 8; mk++) { const mm = build(v, cw, mk), pp = penalty(mm); if (pp < bestP) { best = mm; bestP = pp; } }
  return best;
}
