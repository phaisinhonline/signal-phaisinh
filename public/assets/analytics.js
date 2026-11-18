/* Google Analytics 4 cho signal.phaisinh.online — dùng chung property với phaisinh.online và bantin (G-1X33LL2HJH).
   Cài đặt riêng tư giống https://phaisinh.online/analytics.js: tắt Google Signals và cá nhân hóa quảng cáo.
   Chỉ chạy trên tên miền thật, không ghi nhận khi chạy thử (localhost, *.workers.dev).
   Sự kiện được ghi tự động theo liên kết/nút, không cần sửa HTML:
     signal_cta (nút "Nhận tín hiệu"), join_channel (Zalo/Telegram/bản tin), select_bot (mở trang bot),
     article_open (bài giới thiệu trên phaisinh.online), download_script, export_csv, share_open, copy_link,
     outbound_subsite (sang trang con *.phaisinh.online khác).
   Mã khác có thể gọi window.psTrack('ten_su_kien', { ... }). */
(function (w, d, l) {
  var G = 'G-1X33LL2HJH';
  w.psTrack = function (name, params) { if (w.gtag) w.gtag('event', name, params || {}); };
  if (l.hostname !== 'signal.phaisinh.online') return;

  var s = d.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + G;
  d.head.appendChild(s);
  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  w.gtag = gtag;
  gtag('js', new Date());
  gtag('config', G, { allow_google_signals: false, allow_ad_personalization_signals: false });

  var BTN = { 'csv-btn': 'export_csv', 'poster-btn': 'share_open', 'share-btn': 'copy_link' };
  d.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest('button[id]');
    if (b && BTN[b.id]) { gtag('event', BTN[b.id], { page_path: l.pathname }); return; }
    var a = t.closest('a[href]');
    if (!a) return;
    var u;
    try { u = new URL(a.href, l.href); } catch (_) { return; }
    var h = u.hostname, p = u.pathname;
    if (u.hash === '#nhan-tin-hieu') return gtag('event', 'signal_cta', { location: a.closest('header') ? 'header' : 'body' });
    if (h === l.hostname) {
      var m = p.match(/^\/bot\/([A-Za-z0-9_-]+)/);
      if (m) gtag('event', 'select_bot', { bot_id: m[1].toUpperCase(), from_page: l.pathname });
      return;
    }
    if (h === 'zalo.me' || h.endsWith('.zalo.me')) return gtag('event', 'join_channel', { channel: 'zalo', target_url: a.href });
    if (h === 't.me' || h.endsWith('telegram.me')) return gtag('event', 'join_channel', { channel: 'telegram', target_url: a.href });
    if (h === 'bantin.phaisinh.online') return gtag('event', 'join_channel', { channel: 'bantin', target_url: a.href });
    if (h === 'drive.google.com') return gtag('event', 'download_script', { target_url: a.href, page_path: l.pathname });
    if (h === 'phaisinh.online') return gtag('event', 'article_open', { target_url: a.href });
    if (h.endsWith('.phaisinh.online')) return gtag('event', 'outbound_subsite', { subsite: h, target_url: a.href });
  });
})(window, document, location);
