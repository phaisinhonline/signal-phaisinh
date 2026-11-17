# Lộ trình tính năng signal.phaisinh.online

Trạng thái ngày 13/11/2026. **Mọi mục dưới đây là đề xuất chưa triển khai**, trừ phần "Đã có ở bản 2.0".

## Đã có ở bản 2.0 (giao diện mới)
- Giao diện theo quy chuẩn phaisinh.online (sáng mặc định, tối theo hệ thống), header/footer thống nhất với oi.phaisinh.online.
- Câu tóm tắt tự sinh, 4 KPI (bot giữ lệnh, lệnh đóng + tỷ lệ thắng, lãi/lỗ trung bình mỗi lệnh, bot dẫn đầu có ≥ 3 lệnh).
- Khối "Vị thế đang mở" riêng với lãi/lỗ tạm tính theo giá realtime.
- Bảng xếp hạng: tìm kiếm, lọc Long/Short/Đứng ngoài, sắp xếp theo cột, nhãn "mẫu nhỏ", lọc "chỉ bot có từ 3 lệnh", kỳ chia sẻ được qua URL `?ky=weekly`.
- Trang bot `/bot/{MÃ}` có meta SEO/OG sinh tại edge, biểu đồ lũy kế có tooltip, nhật ký lệnh + CSV, máy tính khối lượng theo rủi ro và ký quỹ.
- Âm báo vào lệnh (mặc định tắt) + toast.
- Ảnh poster chia sẻ (17/11/2026, `public/assets/share.js` + `qr.js`, nạp lười khi bấm nút "Tải ảnh" gọn cạnh bộ chọn kỳ ở trang chủ và trong hàng nút trang bot): khổ dọc 1080×1920, nền sáng/tối mặc định theo giao diện người xem (đổi được trong hộp thoại; token `--sig-poster-{light|dark}-*`). Nhiều mẫu để chia sẻ nhiều lần trong ngày không lặp: trang chủ có Xếp hạng / Tiêu điểm (bot dẫn đầu, ưu tiên bot đủ 3 lệnh) / Vị thế (Long–Short realtime, mặc định trong phiên); trang bot có Hiệu suất / Nhật ký lệnh / Lệnh mở. Tiêu đề sinh từ số liệu và nhãn phiên (Phiên sáng, Phiên chiều, Tổng kết phiên…). Đầu ảnh chỉ có một dòng `signal.phaisinh.online` (kiêm logo) và mã QR 100px góc phải trên; chân ảnh chỉ còn một dòng miễn trừ kèm giờ cập nhật. Mã QR (bộ sinh QR tự viết, đã đối chiếu 40/40 với thư viện Python `qrcode`) dẫn về `signal.phaisinh.online/?src=qr` (giữ `?ky=` theo kỳ) hoặc `/bot/{MÃ}`; `?src=qr` chỉ thêm khi URL ≤ 42 byte để QR giữ phiên bản 3 (29×29 ô, 3px/ô ở cỡ 100px). Cần thử quét bằng Zalo trên điện thoại thật; nếu khó quét, tăng `QR_DEFAULT` trong `share.js` lên 120–140.
  - Hộp thoại xem trước: "Chia sẻ ảnh" (Web Share API, hiện trên điện thoại hỗ trợ chia sẻ tệp), "Tải ảnh", "Sao chép lời giới thiệu" (câu tóm tắt + liên kết, vì Zalo thường bỏ phần chữ khi chia sẻ ảnh).

## A. Chất lượng dữ liệu (nên làm trước, ảnh hưởng độ tin cậy)
| # | Đề xuất | Lý do | Công sức |
|---|---|---|---|
| A1 | Webhook ghi đúng `side` (BUY/SELL) và `order_type` (EXIT/REVERSE) | Hiện mọi tín hiệu lưu `side=""` và `order_type=ENTRY`, kể cả lệnh đảo chiều có lãi/lỗ → nhật ký lệnh thiếu hướng. | Nhỏ (trade_service/trade_bots) |
| A2 | Lưu `open_time` dạng ISO thay vì "lúc 14:45 ngày 13/11/2026" | Giao diện đang phải đoán định dạng. | Nhỏ |
| A3 | Điểm tổng hợp phạt mẫu nhỏ (Bayesian/Wilson cho tỷ lệ thắng, tối thiểu N lệnh) | Bot 1 lệnh thắng đang đứng hạng 1. | Nhỏ |
| A4 | Lãi/lỗ sau phí (phí GD + thuế + trượt giá 0,3–0,5 điểm/lệnh, cấu hình được) | Con số sát thực tế hơn, tăng uy tín. | Trung bình |
| A5 | Giá realtime lấy bằng tác vụ nền thay vì gọi đồng bộ trong vòng lặp async | `fetch_vn30f1m_live_price()` chạy chặn trong `event_generator`; khi hết cache sẽ chặn cả server. | Nhỏ |

## B. Tăng trưởng & chia sẻ
| # | Đề xuất | Giá trị |
|---|---|---|
| B1 | Đăng ký nhận tín hiệu theo bot (chọn bot → nhận Telegram/Zalo riêng), trang xác nhận | Biến người xem thành người theo dõi, đo được chuyển đổi. |
| B2 | Ảnh OG động `/og/bot/{MÃ}.png` sinh tại Worker (Satori/resvg-wasm) với lãi/lỗ, tỷ lệ thắng | Xem trước liên kết đẹp khi dán link (bổ sung cho poster tải về). |
| B6 | Kỳ "Quý" cho bảng xếp hạng và poster | API hiện trả về toàn số 0 với `period=quarterly`; cần thêm kỳ quý trong `server.py` rồi thêm nút "Quý" vào `.seg` và `PERIOD_LABEL`. |
| B7 | Đo lượt quét QR / lượt chia sẻ (Cloudflare Web Analytics theo `?src=qr`, đếm bấm nút poster) | Biết poster nào kéo người xem về nhiều nhất để tối ưu. |
| B8 | Poster "Tổng kết phiên" tự sinh lúc 15:00 và đăng sẵn lên nhóm Zalo/bantin | Nội dung định kỳ lan tỏa không cần người dùng bấm. |
| B3 | Nhúng widget `<iframe>`/script "Top 5 bot hôm nay" cho phaisinh.online và bantin | Đồng bộ hệ sinh thái, kéo traffic chéo. |
| B4 | Bản tổng kết cuối phiên tự động (15:00) đăng bantin + Telegram, có link về signal | Nội dung định kỳ không tốn công. |
| B5 | Thêm "Bot tín hiệu" vào eco-bar/menu của phaisinh.online và oi | Liên kết nội bộ, SEO. |

## C. Phân tích cho người dùng chuyên nghiệp
| # | Đề xuất | Giá trị |
|---|---|---|
| C1 | So sánh 2–4 bot cùng biểu đồ lũy kế | Chọn bot theo phong cách. |
| C2 | Lịch nhiệt lãi/lỗ theo ngày và theo khung giờ trong phiên | Thấy bot mạnh ở phiên sáng/chiều. |
| C3 | Chỉ số mở rộng: Sharpe, Sortino, chuỗi thắng/thua dài nhất, thời gian giữ lệnh TB, R-multiple | Chuẩn đánh giá chiến lược. |
| C4 | "Danh mục bot": chọn nhiều bot + tỷ trọng → đường vốn tổng hợp, tương quan | Phân tán rủi ro. |
| C5 | Đồ thị giá VN30F1M trong phiên có đánh dấu điểm vào/ra của bot | Trực quan nhất cho người mới. |
| C6 | Đồng thuận thuật toán theo thời gian (tỷ lệ Long/Short qua các phiên) đặt cạnh vị thế khối ngoại của oi.phaisinh.online | Kết nối dữ liệu hai chuyên trang. |

## D. Vận hành & hạ tầng
| # | Đề xuất | Giá trị |
|---|---|---|
| D1 | Đẩy sự kiện vào lệnh qua Durable Object/WebSocket (hoặc KV + polling 5s) thay vì SSE xuyên VPS | VPS không giữ kết nối mỗi người xem; cần gói Paid cho DO. |
| D2 | VPS đẩy snapshot leaderboard lên KV/R2 mỗi 10s, Worker đọc KV | VPS gần như không nhận request đọc. |
| D3 | Cloudflare Web Analytics + đếm click "Nhận tín hiệu" | Đo hiệu quả. |
| D4 | Test tự động (Playwright) chụp màn hình 375/768/1280, sáng/tối | Chống vỡ giao diện khi agent sửa. |
| D5 | CI GitHub Actions: `npm run check` + `wrangler deploy` khi merge `main` | Triển khai một chạm. |
