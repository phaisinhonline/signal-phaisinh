# Quy chuẩn thiết kế hệ sinh thái phaisinh.online

> Bản sao từ `E:/Dropbox/Antigravity/Facebook Tracking Group/docs/PHAISINH_DESIGN_SYSTEM.md` (bản gốc). Sửa ở bản gốc rồi chép lại, không sửa riêng ở đây.

> **Dành cho AI Agent và lập trình viên.** Đọc hết file này trước khi tạo hoặc sửa giao diện bất kỳ trang nào thuộc `*.phaisinh.online`. Mục tiêu: mọi chuyên trang trông và vận hành như **một sản phẩm duy nhất**. Khi cần một quy tắc chưa có ở đây, chọn phương án **giống oi.phaisinh.online nhất**, rồi bổ sung quy tắc vào file này.

- Phiên bản: 1.0 (13/11/2026)
- Nguồn đối chiếu (đã kiểm chứng trực tiếp ngày 13/11/2026):
  - `https://phaisinh.online` (hub tin tức, Astro, repo `C:\dev\phaisinh-wt\astro-shell`, tài liệu gốc `design/DESIGN_SYSTEM.md`).
  - `https://oi.phaisinh.online` (chuyên trang dữ liệu, `css/tokens.css` + `css/app.css`). **Đây là mẫu chuẩn cho mọi trang dữ liệu/dashboard.**
  - `https://signal.phaisinh.online` (bảng xếp hạng bot, áp dụng quy chuẩn này từ bản 2.0).

---

## 1. Định vị và giọng điệu

| Thuộc tính | Quy định |
|---|---|
| Cảm giác | Báo tài chính hiện đại: nền trắng ấm, chữ đen đậm, nhấn **đỏ gạch** của logo. Gọn, đáng tin, đọc số nhanh. Không phong cách "trading game", không neon, không glassmorphism. |
| Mặc định | **Giao diện sáng**. Tối theo `prefers-color-scheme` hoặc lựa chọn của người dùng. |
| Ngôn ngữ | Tiếng Việt, câu thường (sentence case). Không VIẾT HOA cả câu, trừ nhãn nhỏ (eyebrow, tiêu đề cột) bằng CSS `text-transform`. |
| Emoji | **Không dùng emoji trong giao diện** (nút, tiêu đề, badge, toast). Dùng icon SVG nét mảnh. |
| Từ ngữ | Mô tả trung thực, không hứa lợi nhuận. Không dùng "Quán quân", "Áp đảo", "Siêu lợi nhuận", "100% an toàn". Nói "Lãi/lỗ", "Tỷ lệ thắng", "Sụt giảm tối đa". |
| Pháp lý | Trang có số liệu hiệu suất **bắt buộc** có dòng miễn trừ: kết quả quá khứ không đảm bảo tương lai, không phải khuyến nghị đầu tư. |

## 2. Design tokens (bắt buộc dùng biến, không viết mã màu trực tiếp)

Sao chép nguyên khối dưới đây vào `tokens.css` của chuyên trang. **Không đổi giá trị**; chỉ được thêm token mới có tiền tố riêng của trang (ví dụ `--sig-*`).

```css
:root {
  /* Thương hiệu (đỏ logo) */
  --red-600: #d23922; --red-700: #b02c18; --red-800: #8e1f12;
  --red-50: #fff4f1;  --red-25: #fffaf8;
  --brand-primary: #d23922;   /* accent, link hover, tab đang chọn, thanh nhấn tiêu đề */
  --brand-hover:   #b02c18;
  --brand-strong:  #8e1f12;   /* nút CTA chính */
  --brand-soft:    #fff4f1;   /* nền nhạt của chip đang chọn */
  --brand-gradient: linear-gradient(135deg, #d23922 0%, #8e1f12 100%);

  /* Dữ liệu: tăng = xanh logo, giảm = đỏ logo (khớp quy ước thị trường VN) */
  --pos: #0b7d44; --pos-hover: #086637; --pos-bg: #e8f6ee; --pos-border: rgba(11,125,68,.24);
  --neg: #d23922; --neg-hover: #b02c18; --neg-bg: #fdeeea; --neg-border: rgba(210,57,34,.24);
  --neutral: #6c6d6d; --neutral-bg: rgba(108,109,109,.08); --neutral-border: rgba(108,109,109,.2);
  --warn: #946300; --warn-bg: #fdf6e6; --warn-border: rgba(148,99,0,.28);  /* cũng là màu giá tham chiếu */

  /* Chuỗi dữ liệu biểu đồ đã dùng trên oi */
  --s-nn: #1e4d8c;  /* Khối ngoại */  --s-td: #6a4aa0; /* Tự doanh */ --s-nk: #8b8580; /* Nhóm khác */
  --metric-oi: #0e7490; --chart-price: #1b1b1b; --chart-vol: #d9d6d4;

  /* Nền và chữ (tông xám ấm) */
  --bg-page: #ffffff; --bg-surface: #ffffff; --bg-surface-2: #f6f4f3; --bg-surface-3: #eeeae8; --bg-soft: #fffaf8;
  --ink-primary: #111111; --ink-secondary: #444444; --ink-muted: #6c6d6d; --ink-faint: #9d9fa3; --ink-inverse: #ffffff;
  --line-subtle: #f6f4f3; --line-normal: #eeeae8; --line-strong: #d9d6d4;

  /* Hình khối */
  --shadow-xs: 0 1px 2px #1111110d; --shadow-sm: 0 1px 2px #1111110d;
  --shadow-md: 0 4px 14px #8e1f120f; --shadow-lg: 0 8px 28px #8e1f1214; --shadow-xl: 0 16px 40px #8e1f121a;
  --radius-xs: 6px; --radius-sm: 10px; --radius-md: 16px; --radius-lg: 24px; --radius-full: 9999px;

  /* Chữ */
  --font-sans: "Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-heading: var(--font-sans);
  --font-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;

  /* Bố cục */
  --max-content-width: 1200px; --header-height: 68px; --touch-target-min: 44px;
  color-scheme: light;
}
:root[data-theme="dark"] {
  --red-600: #f0634a; --red-700: #ff7a63; --red-800: #ffb3a5; --red-50: #2a1612; --red-25: #1d1311;
  --brand-primary: #f0634a; --brand-hover: #ff7a63; --brand-strong: #c2412b; --brand-soft: #2a1612;
  --bg-page: #141110; --bg-surface: #1b1716; --bg-surface-2: #221e1c; --bg-surface-3: #2f2a28; --bg-soft: #1d1311;
  --ink-primary: #f3efed; --ink-secondary: #cfc9c6; --ink-muted: #9a9491; --ink-faint: #7a7471; --ink-inverse: #141110;
  --line-subtle: #221e1c; --line-normal: #2f2a28; --line-strong: #4a4442;
  --pos: #2fbf6f; --pos-hover: #4fd389; --pos-bg: #10261a; --pos-border: rgba(63,191,122,.3);
  --neg: #ff6b52; --neg-hover: #ff8a75; --neg-bg: #2c1511; --neg-border: rgba(255,122,99,.3);
  --neutral: #9a9491; --neutral-bg: rgba(154,148,145,.12); --neutral-border: rgba(154,148,145,.24);
  --warn: #e0b04a; --warn-bg: #2a2210; --warn-border: rgba(224,176,74,.3);
  --s-nn: #6fa3ea; --s-td: #ad92e6; --s-nk: #a39d98; --metric-oi: #22b8cf; --chart-price: #f3efed; --chart-vol: #4a4442;
  --shadow-xs: 0 1px 2px rgba(0,0,0,.4); --shadow-sm: 0 1px 3px rgba(0,0,0,.4); --shadow-md: 0 4px 10px rgba(0,0,0,.45);
  --shadow-lg: 0 8px 28px rgba(0,0,0,.5); --shadow-xl: 0 16px 40px rgba(0,0,0,.55);
  color-scheme: dark;
}
```

### Quy tắc màu
1. **Xanh = tăng/lãi/Long, đỏ = giảm/lỗ/Short, vàng nâu `--warn` = tham chiếu/cảnh báo/dữ liệu cũ.** Không đảo ngược, không dùng màu khác cho ý nghĩa này.
2. Đỏ thương hiệu và đỏ "giảm" là cùng một màu, nên **không** tô đỏ các thành phần trang trí lớn cạnh số liệu (dễ đọc nhầm là lỗ). Nút CTA dùng `--brand-strong` (đỏ đậm), không dùng `--neg`.
3. Không dùng xanh ngọc/teal/emerald của Tailwind, không gradient neon, **không dùng tím** cho thành phần giao diện. Tím `--s-td` chỉ được dùng làm màu chuỗi "Tự doanh" trong biểu đồ.
4. Màu không phải tín hiệu duy nhất: số âm/dương luôn có dấu `+`/`−`; Long/Short luôn có chữ.
5. Độ tương phản chữ tối thiểu WCAG AA (4.5:1). `--ink-faint` chỉ cho chữ phụ ≥ 12px không mang thông tin bắt buộc.

## 3. Chữ

- Nạp font: `https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap` (kèm `preconnect` tới `fonts.googleapis.com` và `fonts.gstatic.com`). Trang Astro dùng `@fontsource` thay thế.
- `body`: `400 15px/1.55 var(--font-sans)`, `-webkit-font-smoothing: antialiased`. Mobile ≤ 560px: 14.5px.
- Tiêu đề trang (h1): `clamp(1.7rem, 1.1rem + 2.2vw, 2.7rem)`, weight 800, `letter-spacing: -0.025em`, `line-height: 1.15`, `max-width: 30ch`, `text-wrap: balance`.
- Tiêu đề khối (h2): 1.3rem, weight 800, `letter-spacing: -0.015em`, **có thanh đỏ 4px bên trái** (xem `.block-head`).
- Số liệu: **luôn** `font-variant-numeric: tabular-nums` bằng font sans. Chỉ dùng `--font-mono` cho mã (mã bot, mã hợp đồng ngắn, JSON); **không** đặt cả bảng số bằng mono.
- Mỗi trang đúng một `h1`.

## 4. Định dạng số liệu và thời gian

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Số thập phân | Locale `vi-VN`: dấu phẩy thập phân, dấu chấm hàng nghìn | `1.851,0` |
| Dấu | Luôn có dấu với số biến động; dùng dấu trừ Unicode `−` (U+2212) | `+8,4` · `−3,2` |
| Điểm phái sinh | Đơn vị "điểm"; 1 điểm VN30F = 100.000 đ/hợp đồng | `+8,4 điểm` (≈ `+840.000 đ/HĐ`) |
| Tiền lớn | Rút gọn `tr`, `tỷ` khi > 6 chữ số trong ô hẹp | `+4,5 tr` |
| Tỷ lệ | Một chữ số thập phân, có `%` | `62,5%` |
| Giờ | GMT+7, 24h, `HH:mm` trong ngày; `dd/MM HH:mm` khi khác ngày | `14:28` · `12/11 09:15` |
| Thiếu dữ liệu | Dấu gạch `–` màu `--ink-faint`, không ghi `null`, `NaN`, `--đ` | `–` |
| Mẫu nhỏ | Chỉ số dựa trên < 5 lệnh phải kèm nhãn "mẫu nhỏ" hoặc bị loại khỏi xếp hạng chính | `100% · 1 lệnh` |

## 5. Bố cục

- Khung nội dung `.wrap`: `max-width: 1200px; margin: 0 auto; padding-inline: max(16px, env(safe-area-inset-*))`.
- Nhịp dọc: khối cách nhau 40px (32px trên mobile); tiêu đề khối cách nội dung 14px.
- Ưu tiên **đường kẻ mảnh và khoảng trắng** để phân vùng thay vì hộp/card có bóng. Card chỉ dùng cho mục bấm được (bot, bài viết) hoặc hộp thoại.
- Breakpoints: **1080px** (ẩn bớt mục nav, ẩn cột phụ), **860px** (ẩn nav, KPI 2 cột, bảng → thẻ/lưới 2 cột), **560px** (1 cột, ẩn CTA header, nút segmented giãn đều).
- Không cuộn ngang trang ở 375px. Bảng rộng đặt trong `.table-scroll` với cột đầu `position: sticky`.

## 6. Thành phần chuẩn (tên class giữ nguyên để agent khác nhận diện)

### 6.1 Header `.site-header`
Sticky, nền `color-mix(in srgb, var(--bg-surface) 92%, transparent)` + `backdrop-filter: saturate(1.4) blur(10px)`, viền dưới `--line-normal`, cao 68px (60px mobile).

```html
<header class="site-header">
  <div class="wrap header-row">
    <a href="https://phaisinh.online/" class="brand" aria-label="phaisinh.online – Trang chủ">
      <img class="brand-logo" src="https://phaisinh.online/brand/logo-phaisinh.png" width="130" height="34" alt="phaisinh.online">
    </a>
    <nav class="nav" aria-label="Điều hướng chính">
      <a href="https://phaisinh.online/category/phai-sinh-hom-nay/">Phái sinh hôm nay</a>
      <a href="https://oi.phaisinh.online/">Vị thế VN30F</a>
      <a href="https://signal.phaisinh.online/">Bot tín hiệu</a>
      <a href="https://phaisinh.online/category/phaisinh101/">Kiến thức</a>
    </nav>
    <div class="header-actions">
      <button type="button" id="theme-toggle" class="icon-btn" aria-label="Chuyển giao diện Sáng / Tối">…moon/sun svg…</button>
      <a href="https://bantin.phaisinh.online/" class="cta" target="_blank" rel="noopener">Nhận bản tin ↗</a>
    </div>
  </div>
</header>
```
- Mục nav của trang hiện tại: class `on` + `aria-current="page"`; màu `--brand-primary`, gạch chân 2px sát mép dưới header.
- Logo ở dark mode: nền trắng bo 8px, padding `3px 8px` (không đảo màu logo).
- `.icon-btn`: tròn 40×40, viền `--line-normal`, icon SVG 18px nét 1.8.
- `.cta`: pill cao 40px, nền `--brand-strong`, chữ trắng 14px/600; hover `--red-700`.

### 6.2 Đầu trang báo cáo `.report-head`
Nền blush: `radial-gradient(60% 120% at 0% 0%, var(--red-50) 0%, transparent 60%), radial-gradient(40% 90% at 100% 0%, color-mix(in srgb, var(--pos-bg) 70%, transparent) 0%, transparent 60%), var(--bg-page)`; padding dọc 28/26px; viền dưới.
Gồm: `.eyebrow` (12.5px, 700, uppercase, `letter-spacing .07em`, màu `--brand-primary`) + `.status` → `h1` → `.deck` (1.08rem, `--ink-secondary`, ≤ 72ch, tóm tắt **bằng câu chữ** có số liệu chính) → `.contract-meta` (13px, muted).

### 6.3 Trạng thái dữ liệu `.status`
Pill nhỏ có chấm tròn: `.live` (xanh), `.stale/.cached` (vàng), `.error` (đỏ), mặc định xám. Luôn cho biết dữ liệu còn trực tiếp hay không và thời điểm cập nhật.

### 6.4 Dải KPI `.kpis > .kpi`
Lưới 4 cột không nền, ngăn bằng vạch dọc 1px; `.kpi-lbl` (12.5px uppercase muted) → `.kpi-val` (`clamp(1.6rem, 1.2rem + 1.4vw, 2.35rem)`, 800, `letter-spacing -0.03em`) → `.kpi-delta` chứa `.chip`. Mobile: 2 cột.

### 6.5 Tiêu đề khối `.block-head`
`h2` có `::before` thanh 4×0.95em màu `--brand-primary` bo 2px; bên phải là `.block-note` (13px muted) hoặc điều khiển `.seg`.

### 6.6 Điều khiển phân đoạn `.seg`
Pill nền `--bg-surface-2`, viền `--line-normal`, padding 3px; nút trong suốt, 14px/600, `min-height: 38px`; nút được chọn: `aria-pressed="true"` hoặc `aria-selected="true"`, nền `--bg-surface`, chữ `--brand-primary`, bóng `0 1px 3px rgba(17,17,17,.13)`. Bản nhỏ `.seg-sm` (32px). Dùng cho kỳ thời gian (Hôm nay/Tuần/Tháng/Tất cả), hợp đồng, chế độ xem.

### 6.7 Chip và nhãn vị thế
- `.chip.pos/.neg/.flat/.warn`: pill 13px/700, nền `*-bg`, chữ màu tương ứng.
- `.side.long/.short`: nhãn vuông bo 4px, 11.5px/800, `letter-spacing .04em` (ví dụ `LONG`, `SHORT`).
- Lọc bật/tắt nhiều lựa chọn: `.chips` (input ẩn + span pill, khi chọn viền và chữ `--brand-primary`, nền `--brand-soft`) hoặc `.legend button[aria-pressed]`.

### 6.8 Thanh lệch `.dbar` và thước đo `.gauge`
- `.dbar`: cao 10px nền `--bg-surface-2`, vạch giữa; phần Long tô `--pos` từ giữa sang phải, Short tô `--neg` từ giữa sang trái.
- `.gauge`: cao 6px, gradient `--neg → --bg-surface-3 → --pos`, kim đen 4×16px.

### 6.9 Bảng dữ liệu
`table` 13.5px, `th` 11.5px/700 uppercase muted, ô padding `9px 12px`, kẻ dưới `--line-normal`, số canh phải, hover hàng `--bg-surface-2`, cột đầu sticky. Bảng dài đặt trong `details.data-table` (summary có mũi tên đỏ `▸`).

### 6.10 Điểm nhấn `.highlights > .hl`
Lưới 3 cột, mỗi mục có viền trên 3px màu ngữ nghĩa, số lớn `clamp(1.8rem, 1.3rem + 1.6vw, 2.6rem)`/800, nhãn 14.5px/700, chú thích 13px muted.

### 6.11 Biểu đồ
SVG tự vẽ, `width: 100%`, có trục và lưới mảnh `--line-normal`, tooltip `.chart-tip` (nền surface, viền, `--shadow-lg`, bo 10px). Sparkline `.spark` 120×36. Đường giá dùng `--chart-price`, khối lượng `--chart-vol`. Luôn có trạng thái rỗng `.chart-empty` bằng câu chữ.

### 6.12 Hộp thoại
Dùng `<dialog>` gốc: `width: min(640px, 100vw - 24px)`, bo 16px, `--shadow-xl`, backdrop `rgba(17,17,17,.45)`. Đóng bằng Esc và nút ×. Không chặn cuộn trang nền bằng JS phức tạp.

### 6.13 Nút
- Chính: `.cta` (pill đỏ đậm).
- Viền: `.btn-outline` (pill, viền và chữ `--brand-primary`, hover nền `--brand-soft`).
- Liên kết dạng nút: `.link-btn` (chữ đỏ, gạch chân offset 3px).
- Vùng chạm tối thiểu 44×44px trên mobile.

### 6.14 Chân trang `.site-footer`
Viền trên, 13px muted: `© 2026 phaisinh.online · <mô tả chuyên trang>.` + liên kết Trang chủ · Bản tin · Sitemap; trang dữ liệu thêm dòng miễn trừ trách nhiệm.

## 7. Giao diện sáng/tối

```html
<script>
  (function () {
    try {
      var s = localStorage.getItem('<site>_theme');
      var d = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', s || (d ? 'dark' : 'light'));
    } catch (e) {}
  })();
</script>
```
- Đặt **inline trong `<head>` trước CSS** để không nháy màu. Khóa lưu: `oi_theme`, `signal_theme`, … (mỗi chuyên trang một khóa, giá trị `light`/`dark`).
- Nút đổi giao diện chỉ hiện icon mặt trăng (đang sáng) hoặc mặt trời (đang tối).

## 8. Chuyển động và khả năng truy cập

- Chuyển động ngắn (≤ 200ms), chỉ để báo thay đổi (nhấp nháy nền ô khi giá đổi ≤ 800ms). Tôn trọng `prefers-reduced-motion: reduce` (tắt hết animation).
- Không dùng `animate-ping`/chấm nhấp nháy liên tục ngoài một chấm "trực tiếp" duy nhất.
- `:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }`.
- Hàng/thẻ bấm được phải là `<a>` hoặc `<button>` thật (điều hướng bằng bàn phím được), không gắn `onclick` lên `<tr>`.
- Âm thanh: **mặc định tắt**, chỉ bật khi người dùng chủ động.
- Mọi icon-only button có `aria-label`. Vùng số liệu cập nhật trực tiếp dùng `aria-live="polite"` ở mức tóm tắt, không đọc từng tick giá.

## 9. Hiệu năng và kỹ thuật

- **Không** dùng `cdn.tailwindcss.com`, font icon (Phosphor/FontAwesome) hoặc framework nặng cho trang công khai. CSS thuần theo token + JS thuần (ES module). Icon là SVG inline.
- Trang tĩnh phục vụ từ Cloudflare (Workers Static Assets/Pages); dữ liệu lấy qua `/api/*` có cache ở edge. Tổng JS trang ≤ 40 KB chưa nén.
- SEO: `title` ≤ 60 ký tự, `meta description`, `canonical`, Open Graph đầy đủ, `lang="vi"`; trang chi tiết có meta riêng sinh phía server/edge.
- Không đưa dữ liệu nội bộ (ID nhóm Zalo, kênh Telegram, nick gửi, link tài liệu riêng, token) vào HTML/JSON công khai.

## 10. Danh sách kiểm tra trước khi bàn giao

- [ ] Chỉ dùng biến token; không mã màu trực tiếp ngoài file token.
- [ ] Header, footer, `.seg`, `.chip`, `.block-head` đúng mẫu mục 6.
- [ ] Sáng/tối đều đọc tốt; không nháy màu khi tải.
- [ ] 375px không cuộn ngang; vùng chạm ≥ 44px.
- [ ] Số liệu đúng định dạng `vi-VN`, có dấu, tabular-nums, `–` khi thiếu.
- [ ] Không emoji trong UI; có dòng miễn trừ ở trang hiệu suất.
- [ ] Có trạng thái đang tải, rỗng, lỗi và dữ liệu cũ.
- [ ] Không lộ dữ liệu nội bộ trong mã nguồn trang hoặc API công khai.
