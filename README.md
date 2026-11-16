# signal.phaisinh.online (giao diện web)

Giao diện công khai **Bảng xếp hạng & vị thế bot tín hiệu phái sinh VN30F1M**, chạy trên Cloudflare Workers (Static Assets, gói Free). Dữ liệu lấy từ API FastAPI trên VPS (repo `Facebook Tracking Group`, module `zalo_marketing/dispatcher`).

| Thư mục | Nội dung |
|---|---|
| `public/` | Trang tĩnh: `index.html` (bảng xếp hạng), `bot.html` (khung trang chi tiết), `404.html`, `assets/` (CSS token + thành phần, JS thuần ES module). |
| `src/index.js` | Worker: proxy + cache API công khai, lọc trường riêng tư, SSR meta cho `/bot/{MÃ}`, chuyển tiếp webhook TradingView, chuyển hướng đường dẫn cũ. |
| `deploy/nginx_signal_api.conf` | nginx cho `signal-api.phaisinh.online` trên VPS (chỉ mở API công khai). |
| `docs/DESIGN_SYSTEM.md` | Quy chuẩn thiết kế hệ sinh thái phaisinh.online (bắt buộc đọc trước khi sửa giao diện). |
| `docs/DEPLOY.md` | Kiến trúc, hạn mức gói Free, các bước triển khai và rollback. |
| `docs/ROADMAP.md` | Đề xuất tính năng tiếp theo. |

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev      # http://127.0.0.1:8787
npm run check
npm run login    # lần đầu: đăng nhập Cloudflare riêng cho repo (tài khoản quản lý phaisinh.online)
npm run deploy
```
