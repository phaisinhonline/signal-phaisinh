# Triển khai signal.phaisinh.online lên Cloudflare Workers (gói Free)

## 1. Kiến trúc

```
Trình duyệt ──► signal.phaisinh.online  (Cloudflare Worker "signal-phaisinh")
                 ├─ /, /assets/*, /404.html ............ Static Assets (miễn phí, không tính lượt Worker)
                 ├─ /bot/{MÃ} ........................... Worker: lấy dữ liệu bot (cache 15s) + chèn meta SEO/OG
                 ├─ /api/v1/... (GET công khai) ......... Worker: proxy + cache edge 2–30s + lọc trường riêng tư
                 │                                        + bản dự phòng 24h khi VPS lỗi
                 ├─ /api/v1/prices/stream ............... Worker: chuyển tiếp SSE giá (1 request/kết nối)
                 ├─ /trade, /api/trade, /api/v1/trade ... Worker: chuyển tiếp POST webhook TradingView
                 └─ /signal, /signal/{MÃ}, /ranking ..... 301 về đường dẫn mới
                          │
                          ▼
              signal-api.phaisinh.online (nginx VPS, deploy/nginx_signal_api.conf)
                          │  chỉ mở GET công khai + webhook; còn lại 404
                          ▼
              FastAPI dispatcher 127.0.0.1:8765 (repo Facebook Tracking Group)
```

**Giảm tải VPS:** HTML/CSS/JS không còn đi qua VPS. Mỗi điểm dữ liệu (bảng xếp hạng, chi tiết bot, giá) chỉ được VPS tính tối đa một lần mỗi 2–15 giây cho mỗi trung tâm dữ liệu Cloudflare, bất kể bao nhiêu người xem. SSE giá vẫn giữ 1 kết nối/người xem tới VPS (nhẹ, dùng chung bộ đệm giá 2,5 giây).

## 2. Hạn mức gói Free cần lưu ý

| Hạng mục | Hạn mức | Ước tính sử dụng |
|---|---|---|
| Request gọi Worker | 100.000/ngày | Mỗi người xem: ~240 request/giờ trong phiên (bảng xếp hạng 15s) + 1 SSE; ngoài phiên ~40/giờ. ≈ 50 người xem liên tục cả phiên (5 giờ) ≈ 60.000. |
| CPU mỗi request | 10 ms | Proxy/lọc JSON và HTMLRewriter đều < 5 ms. |
| Static Assets | Không giới hạn, không tính request Worker | Trang chủ, CSS, JS, 404. |

Khi vượt 100.000 request/ngày, các đường dẫn Worker trả lỗi đến 07:00 sáng hôm sau (giờ VN), trang tĩnh vẫn mở được. Phương án: (a) nâng gói Workers Paid 5 USD/tháng (10 triệu request), hoặc (b) đặt `<meta name="signal-api" content="https://signal-api.phaisinh.online">` trong `public/*.html` để trình duyệt gọi thẳng API VPS, bật proxy cam Cloudflare + Cache Rule cho `signal-api.phaisinh.online/api/v1/*` (Cloudflare tôn trọng header `Cache-Control: s-maxage` mà VPS đã trả).

## 3. Các bước triển khai lần đầu

> Thứ tự quan trọng: dựng API VPS trước, kiểm tra Worker trên `*.workers.dev`, sau cùng mới chuyển tên miền.

1. **VPS — cập nhật mã dispatcher** (repo Facebook Tracking Group, đã có trong commit cùng đợt): API công khai lọc cấu hình nhóm Zalo/kênh Telegram và trả `Cache-Control`. Khởi động lại dịch vụ `zalo-phaisinh`.
2. **DNS** (Cloudflare dashboard → phaisinh.online → DNS): thêm bản ghi `A signal-api` → IP VPS, **Proxied** (cam). SSL origin: dùng Cloudflare Origin Certificate (SSL/TLS → Origin Server) dán vào aaPanel → SSL → Other certificate, chế độ Full (strict).
3. **VPS — nginx:** tạo site `signal-api.phaisinh.online` trong aaPanel, dán `deploy/nginx_signal_api.conf`, cấp SSL (hoặc dùng Cloudflare Origin Certificate với SSL mode Full (strict)). Kiểm tra:
   ```bash
   curl -s https://signal-api.phaisinh.online/api/v1/market/price
   curl -s -o /dev/null -w "%{http_code}\n" https://signal-api.phaisinh.online/api/v1/system/services   # phải là 404
   ```
4. **Máy local — deploy Worker:**
   ```bash
   npm install
   npm run login   # đăng nhập Cloudflare riêng cho repo này (.wrangler-home), tài khoản son.nguyen@encapital.io
   npm run deploy
   ```
   Mở `https://signal-phaisinh.son-nguyen-458.workers.dev/` để kiểm tra (trên workers.dev, Cache API không hoạt động nên mọi request đi thẳng VPS — chỉ dùng để thử).
5. **(Tùy chọn) khóa nguồn:** `npx wrangler secret put ORIGIN_SECRET` → nhập chuỗi ngẫu nhiên; bỏ comment khối `X-Edge-Secret` trong nginx với cùng chuỗi rồi reload nginx.
6. **Chuyển tên miền:** trong `wrangler.jsonc` bỏ comment dòng `routes` (`custom_domain: true`), xóa bản ghi DNS `signal` cũ đang trỏ VPS (Wrangler sẽ báo nếu còn bản ghi trùng), rồi `npm run deploy`. Cloudflare tự tạo DNS + SSL cho `signal.phaisinh.online`.
7. **Kiểm tra sau chuyển:**
   - `https://signal.phaisinh.online/` hiển thị giao diện mới; `https://signal.phaisinh.online/bot/CNPS1` có `<title>` đúng tên bot (xem nguồn trang).
   - `curl -sI https://signal.phaisinh.online/api/v1/bots/leaderboard | grep -i x-edge-cache` → lần 2 là `HIT`.
   - Gửi thử 1 webhook TradingView (hoặc `test_trade_webhook.py` trỏ vào domain) → nhận HTTP 200 trong < 3 giây.
   - Nên đổi URL cảnh báo TradingView sang `https://zalo.phaisinh.online/trade` (hoặc `signal-api`) để webhook không phụ thuộc Worker.

## 4. Rollback

Xóa custom domain của Worker (Workers & Pages → signal-phaisinh → Settings → Domains), tạo lại bản ghi `A signal` → IP VPS. nginx cũ (`nginx_signal_phaisinh_online.conf`) và giao diện cũ `signal_html.py` vẫn còn nguyên trên VPS.

## 5. Phát triển local

```bash
cp .dev.vars.example .dev.vars    # API_ORIGIN=https://signal.phaisinh.online (máy chủ hiện tại)
npm run dev                        # http://127.0.0.1:8787
npm run check                      # kiểm tra cú pháp JS
```
