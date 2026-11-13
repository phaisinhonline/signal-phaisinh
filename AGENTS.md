# Hướng dẫn cho AI Agent

1. Đọc `docs/DESIGN_SYSTEM.md` trước khi sửa bất kỳ giao diện nào. Không thêm Tailwind CDN, font icon, framework hay mã màu trực tiếp; chỉ dùng biến trong `public/assets/tokens.css` và class trong `public/assets/app.css`.
2. Đọc `docs/DEPLOY.md` trước khi sửa `src/index.js` hoặc `wrangler.jsonc`. Giữ danh sách `run_worker_first` tối thiểu (mỗi đường dẫn thêm vào sẽ tốn hạn mức 100.000 request/ngày).
3. Không đưa trường nội bộ (nhóm Zalo, nick gửi, kênh Telegram, kết quả gửi tin, token) ra HTML/JSON. Danh sách trường công khai nằm ở đầu `src/index.js`; API VPS cũng lọc trong `server.py` (`_PRIVATE_BOT_FIELDS`).
4. Mọi chuỗi từ API khi chèn vào HTML phải qua `esc()`; URL ngoài qua `safeUrl()`.
5. Sau khi sửa: `npm run check`, chạy `npm run dev` và xem ở 375px, 768px, 1280px, cả sáng và tối.
6. Cập nhật `docs/ROADMAP.md` khi hoàn thành hoặc thêm đề xuất.
