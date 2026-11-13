/**
 * Cloudflare Worker cho signal.phaisinh.online
 *
 * - Trang tĩnh (public/) do Workers Static Assets phục vụ, KHÔNG tốn lượt request Worker.
 * - Worker chỉ chạy cho các đường dẫn khai báo ở wrangler.jsonc > assets.run_worker_first:
 *     /bot/*, /signal*, /ranking, /leaderboard  -> trang chi tiết bot có meta SEO sinh tại edge
 *     /api/*                                    -> proxy API công khai về VPS + cache edge + lọc trường riêng tư
 *     /trade, /api/trade, /api/v1/trade (POST)  -> chuyển tiếp nguyên vẹn webhook TradingView về VPS
 */

const PUBLIC_TTL = [
  // [regex đường dẫn, số giây cache tại edge]
  [/^\/api\/v1\/market\/price$/, 2],
  [/^\/api\/v1\/bots\/leaderboard$/, 10],
  [/^\/api\/v1\/bots$/, 30],
  [/^\/api\/v1\/bots\/[A-Za-z0-9_-]{1,32}\/signals$/, 15],
  [/^\/api\/v1\/bots\/[A-Za-z0-9_-]{1,32}$/, 15],
];
const ALLOWED_QUERY = new Set(['period', 'strategy_type', 'platform', 'limit']);
const STALE_TTL = 86400; // bản dự phòng khi VPS lỗi
const WEBHOOK_PATHS = new Set(['/trade', '/api/trade', '/api/v1/trade']);

// Chỉ những trường này được phép ra ngoài (API VPS cũng đã lọc; đây là lớp bảo vệ thứ hai)
// drive_link (file script bot) đã công khai sẵn trên bot.phaisinh.online/bots.json nên được giữ lại.
const BOT_FIELDS = ['bot_id', 'name', 'platform', 'strategy_type', 'timeframe', 'symbol', 'description', 'category', 'category_label', 'phaisinh_post_url', 'drive_link', 'is_active', 'total_signals'];
const LB_FIELDS = ['rank', 'bot_id', 'name', 'platform', 'strategy_type', 'timeframe', 'category', 'category_label', 'phaisinh_post_url',
  'current_side', 'open_price', 'open_time', 'current_tp', 'current_sl', 'pnl_points', 'pnl_money', 'win_count', 'loss_count',
  'total_trades', 'win_rate', 'profit_factor', 'max_drawdown', 'score_composite', 'sparkline', 'total_signals'];
const LIST_FIELDS = ['bot_id', 'name', 'platform', 'strategy_type', 'timeframe', 'category', 'category_label', 'phaisinh_post_url', 'is_active',
  'current_side', 'open_price', 'open_time', 'current_tp', 'current_sl', 'win_count', 'loss_count', 'total_trades', 'win_rate', 'total_signals', 'last_signal_time'];
const POS_FIELDS = ['current_side', 'open_price', 'open_time', 'current_tp', 'current_sl', 'updated_at', 'win_count', 'loss_count', 'total_trades', 'pnl_points_closed'];
const SCORE_FIELDS = ['pnl_points', 'pnl_money', 'win_count', 'loss_count', 'total_trades', 'win_rate', 'profit_factor', 'max_drawdown', 'score_composite', 'sparkline', 'updated_at'];
const SIGNAL_FIELDS = ['id', 'side', 'symbol', 'price', 'order_time', 'order_type', 'pos_state', 'tp', 'sl', 'timeframe', 'comment', 'exit_reason', 'pnl_points', 'is_close', 'created_at'];

const pick = (o, keys) => {
  const out = {};
  if (!o || typeof o !== 'object') return out;
  for (const k of keys) if (k in o) out[k] = o[k];
  return out;
};
export function sanitizeBot(b) {
  const out = pick(b, BOT_FIELDS);
  out.position = pick(b.position, POS_FIELDS);
  out.scores = {};
  for (const [p, s] of Object.entries(b.scores || {})) out.scores[p] = pick(s, SCORE_FIELDS);
  out.signals = (b.signals || []).map((s) => pick(s, SIGNAL_FIELDS));
  return out;
}
export function sanitize(path, data) {
  if (!data || typeof data !== 'object') return data;
  if (path === '/api/v1/bots/leaderboard') return { ...pick(data, ['ok', 'period', 'strategy_type', 'platform', 'count']), leaderboard: (data.leaderboard || []).map((b) => pick(b, LB_FIELDS)) };
  if (path === '/api/v1/bots') return { ...pick(data, ['ok', 'count']), bots: (data.bots || []).map((b) => pick(b, LIST_FIELDS)) };
  if (path.endsWith('/signals')) return { ...pick(data, ['ok', 'bot_id', 'count']), signals: (data.signals || []).map((s) => pick(s, SIGNAL_FIELDS)) };
  if (path.startsWith('/api/v1/bots/')) return { ok: data.ok, bot: data.bot ? sanitizeBot(data.bot) : null };
  return data; // market/price
}

const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
});

function originHeaders(request, env) {
  const h = new Headers();
  h.set('Accept', request.headers.get('Accept') || 'application/json');
  h.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
  h.set('X-Forwarded-Host', new URL(request.url).host);
  if (env.ORIGIN_SECRET) h.set('X-Edge-Secret', env.ORIGIN_SECRET);
  return h;
}

/** Lấy JSON công khai có cache edge + bản dự phòng khi VPS lỗi. */
async function cachedPublicJson(url, ttl, request, env, ctx) {
  const path = url.pathname;
  const qs = [...url.searchParams].filter(([k]) => ALLOWED_QUERY.has(k)).sort(([a], [b]) => a.localeCompare(b));
  const search = qs.length ? '?' + new URLSearchParams(qs).toString() : '';
  const keyBase = `https://signal-cache.internal${path}${search}`;
  const cache = caches.default;
  const freshKey = new Request(keyBase);
  const staleKey = new Request(keyBase + (search ? '&' : '?') + '__stale=1');

  const hit = await cache.match(freshKey);
  if (hit) return withClientHeaders(hit, 'HIT');

  let res;
  try {
    res = await fetch(env.API_ORIGIN + path + search, { headers: originHeaders(request, env), cf: { cacheTtl: 0 } });
  } catch (e) {
    res = null;
  }
  if (res && res.ok) {
    const data = sanitize(path, await res.json());
    const body = JSON.stringify(data);
    const mk = (age) => new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${age}` } });
    ctx.waitUntil(Promise.all([cache.put(freshKey, mk(ttl)), cache.put(staleKey, mk(STALE_TTL))]));
    return withClientHeaders(mk(ttl), 'MISS');
  }
  if (res && res.status === 404) return json({ ok: false, detail: 'Không tìm thấy' }, 404, { 'Cache-Control': 'public, max-age=30' });
  const stale = await cache.match(staleKey);
  if (stale) return withClientHeaders(stale, 'STALE');
  return json({ ok: false, detail: 'Máy chủ dữ liệu tạm thời không phản hồi' }, 502);
}

function withClientHeaders(res, state) {
  const r = new Response(res.body, res);
  r.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  r.headers.set('X-Edge-Cache', state);
  if (state === 'STALE') r.headers.set('X-Data-Stale', '1');
  r.headers.set('Access-Control-Allow-Origin', '*');
  return r;
}

/** SSE giá: chuyển tiếp dạng stream, không cache. */
async function proxyStream(request, env) {
  const h = originHeaders(request, env);
  h.set('Accept', 'text/event-stream');
  const res = await fetch(env.API_ORIGIN + '/api/v1/prices/stream', { headers: h, signal: request.signal });
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' },
  });
}

/** Webhook TradingView: chuyển tiếp nguyên trạng (giữ tương thích nếu cảnh báo cũ còn trỏ về signal.phaisinh.online). */
async function proxyWebhook(request, env) {
  const url = new URL(request.url);
  const h = new Headers(request.headers);
  h.delete('host');
  h.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
  if (env.ORIGIN_SECRET) h.set('X-Edge-Secret', env.ORIGIN_SECRET);
  return fetch(env.API_ORIGIN + url.pathname + url.search, { method: 'POST', headers: h, body: request.body });
}

// ---------- Trang chi tiết bot ----------
const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fmtVi = (v, d = 1) => (Number.isFinite(Number(v)) ? (Number(v) > 0 ? '+' : Number(v) < 0 ? '−' : '') + Math.abs(Number(v)).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');

function botSummary(b) {
  const all = (b.scores && b.scores.all) || {};
  const side = String((b.position || {}).current_side || '').toUpperCase();
  const pos = side === 'BUY' ? 'đang giữ Long' : side === 'SELL' ? 'đang giữ Short' : 'đang đứng ngoài';
  const trades = Number(all.total_trades || 0);
  const perf = trades
    ? `${fmtVi(all.pnl_points)} điểm sau ${trades} lệnh, tỷ lệ thắng ${Number(all.win_rate || 0).toLocaleString('vi-VN')}%`
    : 'chưa có lệnh đóng';
  return `Bot ${b.name} (${b.bot_id}, ${b.timeframe || ''}) giao dịch VN30F1M: ${perf}, hiện ${pos}. Theo dõi vị thế và nhật ký lệnh theo thời gian thực.`;
}

async function botPage(request, env, ctx, id) {
  const url = new URL(request.url);
  const canonical = `https://signal.phaisinh.online/bot/${encodeURIComponent(id)}`;
  const apiUrl = new URL(`/api/v1/bots/${encodeURIComponent(id)}`, url.origin);
  const apiRes = await cachedPublicJson(apiUrl, 15, request, env, ctx);
  if (apiRes.status === 404) {
    const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url.origin)));
    return new Response(nf.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
  }
  let bot = null;
  if (apiRes.ok) { try { bot = (await apiRes.json()).bot; } catch { bot = null; } }
  const shell = await env.ASSETS.fetch(new Request(new URL('/bot.html', url.origin)));
  if (!bot) return new Response(shell.body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

  const title = `${bot.name} – Bot tín hiệu VN30F1M | phaisinh.online`;
  const desc = botSummary(bot);
  const data = JSON.stringify(bot).replace(/</g, '\\u003c');
  const setAttr = (attr, value) => ({ element(el) { el.setAttribute(attr, value); } });
  const setText = (value) => ({ element(el) { el.setInnerContent(value); } });
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Bot tín hiệu', item: 'https://signal.phaisinh.online/' },
      { '@type': 'ListItem', position: 2, name: bot.name, item: canonical },
    ],
  }).replace(/</g, '\\u003c');

  const out = new HTMLRewriter()
    .on('title#seo-title', setText(title))
    .on('meta#seo-desc', setAttr('content', desc))
    .on('link#seo-canonical', setAttr('href', canonical))
    .on('meta#og-url', setAttr('content', canonical))
    .on('meta#og-title', setAttr('content', `${bot.name} – Bot tín hiệu VN30F1M`))
    .on('meta#og-desc', setAttr('content', desc))
    .on('h1#bot-name', setText(bot.name))
    .on('#crumb-name', setText(bot.name))
    .on('#bot-desc', setText(bot.description || ''))
    .on('script#bot-data', { element(el) { el.setInnerContent(data, { html: true }); } })
    .on('head', { element(el) { el.append(`<script type="application/ld+json">${ld}</script>`, { html: true }); } })
    .transform(shell);
  const res = new Response(out.body, out);
  res.headers.set('Content-Type', 'text/html; charset=utf-8');
  res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // Đường dẫn cũ
    if (path === '/signal' || path === '/ranking' || path === '/leaderboard') return Response.redirect(new URL('/', url).href + url.search, 301);
    const legacy = path.match(/^\/signal\/([A-Za-z0-9_-]{1,32})$/);
    if (legacy) return Response.redirect(new URL(`/bot/${legacy[1].toUpperCase()}`, url).href, 301);

    if (WEBHOOK_PATHS.has(path)) {
      if (request.method === 'POST') return proxyWebhook(request, env);
      return json({ ok: false, detail: 'Chỉ chấp nhận POST' }, 405);
    }

    const bot = path.match(/^\/bot\/([A-Za-z0-9_-]{1,32})$/);
    if (bot) {
      const id = bot[1].toUpperCase();
      if (bot[1] !== id) return Response.redirect(new URL(`/bot/${id}`, url).href, 301);
      return botPage(request, env, ctx, id);
    }

    if (path.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
      if (request.method !== 'GET') return json({ ok: false, detail: 'Không hỗ trợ' }, 405);
      if (path === '/api/v1/prices/stream') return proxyStream(request, env);
      const rule = PUBLIC_TTL.find(([re]) => re.test(path));
      if (!rule) return json({ ok: false, detail: 'Không tìm thấy' }, 404);
      return cachedPublicJson(new URL(path + url.search, url.origin), rule[1], request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};
