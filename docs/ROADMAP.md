# Lộ trình tính năng signal.phaisinh.online

Trạng thái ngày 13/11/2026. **Mọi mục dưới đây là đề xuất chưa triển khai**, trừ phần "Đã có ở bản 2.0".

## Đã có ở bản 2.0 (giao diện mới)
- Giao diện theo quy chuẩn phaisinh.online (sáng mặc định, tối theo hệ thống), header/footer thống nhất với oi.phaisinh.online.
- Câu tóm tắt tự sinh, 4 KPI (bot giữ lệnh, lệnh đóng + tỷ lệ thắng, lãi/lỗ trung bình mỗi lệnh, bot dẫn đầu có ≥ 3 lệnh).
- Khối "Vị thế đang mở" riêng với lãi/lỗ tạm tính theo giá realtime.
- Bảng xếp hạng: tìm kiếm, lọc Long/Short/Đứng ngoài, sắp xếp theo cột, nhãn "mẫu nhỏ", lọc "chỉ bot có từ 3 lệnh", kỳ chia sẻ được qua URL `?ky=weekly`.
- Trang bot `/bot/{MÃ}` có meta SEO/OG sinh tại edge, biểu đồ lũy kế có tooltip, nhật ký lệnh + CSV, máy tính khối lượng theo rủi ro và ký quỹ.
- Âm báo vào lệnh (mặc định tắt) + toast.
- Bỏ: nút tải poster infographic (canvas tự vẽ, lệch thương hiệu) — thay bằng đề xuất ảnh OG động (mục B2).

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
| B2 | Ảnh OG động `/og/bot/{MÃ}.png` sinh tại Worker (Satori/resvg-wasm) với lãi/lỗ, tỷ lệ thắng | Chia sẻ Zalo/Facebook đẹp, thay poster cũ. |
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
