# Quy chuẩn thiết kế hệ sinh thái phaisinh.online

> Bản sao từ `E:/dev/Phaisinh.online/docs/PHAISINH_DESIGN_SYSTEM.md` (bản gốc). Sửa ở bản gốc rồi chép lại, không sửa riêng ở đây.

> **Dành cho AI Agent và lập trình viên.** Đọc hết file này trước khi tạo hoặc sửa giao diện bất kỳ trang nào thuộc `*.phaisinh.online`. Mục tiêu: mọi chuyên trang trông và vận hành như **một sản phẩm duy nhất**. Khi cần một quy tắc chưa có ở đây, chọn phương án **giống oi.phaisinh.online nhất**, rồi bổ sung quy tắc vào file này.

- Phiên bản: 1.6 (18/11/2026) — xem "Lịch sử thay đổi" cuối file
- Nguồn đối chiếu (đã kiểm chứng trực tiếp ngày 13/11/2026):
  - `https://phaisinh.online` (hub tin tức, Astro, repo `C:\dev\phaisinh-wt\astro-shell`, tài liệu gốc `design/DESIGN_SYSTEM.md`).
  - `https://oi.phaisinh.online` (chuyên trang dữ liệu, `css/tokens.css` + `css/app.css`). **Đây là mẫu chuẩn cho mọi trang dữ liệu/dashboard.**
  - `https://signal.phaisinh.online` (bảng xếp hạng bot, áp dụng quy chuẩn này từ bản 2.0).
  - `https://bantin.phaisinh.online` (bản tin khuyến nghị CTCK, nhiều mục điều hướng; áp dụng quy chuẩn từ 17/11/2026 qua lớp `assets/phaisinh-brand.css`, xem mục 11–12).

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
SVG tự vẽ, `width: 100%`, có trục và lưới mảnh `--line-normal`, tooltip `.chart-tip` (nền surface, viền, `--shadow-lg`, bo 10px). Sparkline `.spark` 120×36. Khối lượng `--chart-vol`. Luôn có trạng thái rỗng `.chart-empty` bằng câu chữ.

**Biểu đồ giá theo phiên (đường giá trong ngày, cả trên trang lẫn trong ảnh chia sẻ):**
- **Nền biểu đồ hài hoà với giao diện đang dùng**: sáng trên trang sáng, tối trên trang tối. Không đặt mảng trắng giữa trang tối, không nền đen trên trang sáng. Biểu đồ nổi bật nhờ **đường line và vùng tô dưới đường**, không nhờ đổi nền.
  - Đường giá: màu xu hướng phiên. Tăng: `#0b7d44` (sáng) / `#3ccf7d` (tối). Giảm: `#d23922` / `#ff7a63`. Dày 2,5px trên trang, 5px trong ảnh.
  - Vùng tô dưới đường giá: gradient màu xu hướng, 34% (sáng) / 42% (tối) ở đỉnh, mờ dần về 0%.
  - Biểu đồ nến không tô nền. Nến xanh/đỏ đã mang thông tin xu hướng.
  - **Chi tiết không được chìm vào nền**:
    - Trên nền tối, mọi màu đậm vẽ trên canvas đổi sang bản sáng. Ví dụ: xanh `#0b7d44` → `#3ccf7d`, đỏ `#d23922` → `#ff6b52`, xám `#444` → `#8a8280`, nhãn `#6c6d6d` → `#b0a8a5`, lưới 6% → 11%. Mẫu: hàm `psDarkCanvas()` trong bantin `index.html`.
    - Với ApexCharts, màu chuỗi tối (độ sáng < 50%) được trộn thêm trắng (mẫu: `liftForDark()` trong `chart-theme.js`).
    - Vòng lưới radar theo giao diện, không tô nền sáng.
  - **Thang trục theo dữ liệu**, không cố định:
    - Tỷ lệ % lấy min/max thật, làm tròn 10%, chừa 5% hai đầu, bỏ vài phiên đầu mẫu nhỏ khi tính; luôn thấy mốc tham chiếu (50%).
    - Biểu đồ cột ngang: max = 1,6 × giá trị lớn nhất (chừa chỗ cho nhãn số), không quá 100%.
    - Chỉ dùng 0–100% khi số liệu thật trải gần hết khoảng đó.
  - Trong ảnh chia sẻ: thẻ biểu đồ theo nền ảnh (trắng / `#2a2322`), vùng tô dưới đường theo màu xu hướng.
- Xu hướng lấy **đúng con số tăng/giảm đang hiển thị ở đầu trang** (ví dụ `change_points` của bản tin); chỉ khi không có mới so giá cuối với giá tham chiếu/giá mở cửa. Không để nền đỏ khi đầu trang ghi “+3,3”.
- Biểu đồ không gắn với một phiên (lãi/lỗ lũy kế, nhiều chuỗi): giữ đường `--chart-price` hoặc màu chuỗi, nền surface.
- **Gọn, không khoảng trắng thừa** (lỗi gặp ở trang Phân tích bantin):
  - Mỗi biểu đồ chỉ **một** chú thích: có hàng chip lọc thì tắt `legend` của thư viện.
  - Chiều cao 260px trên điện thoại, 330px trên máy tính. Biểu đồ cột ngang: 30–36px mỗi hàng, tối thiểu 240px. Không đặt `min-height` lớn hơn chiều cao biểu đồ.
  - Lề trong của vùng vẽ: trên −6, phải 8, dưới −2, trái 4.
  - Nút tải ảnh cùng hàng tiêu đề khối, không xuống dòng riêng.
  - Đệm thẻ 12px trên điện thoại.

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


---

## 11. Chuyên trang có nhiều mục riêng (mẫu bantin.phaisinh.online)

Trang có điều hướng nội bộ từ 3 mục trở lên (bantin: Bản tin · Nhịp đập · Lịch sử · Xếp hạng · Phân tích · Hồ sơ) dùng **header 2 tầng**. Tầng 2 giữ đúng kích thước và chất liệu của `.site-header` (mục 6.1).

### 11.1 Tầng 1 — thanh hệ sinh thái `.top-news-bar` + `.eco-links`
Nền `--bg-surface-2`, viền dưới `--line-normal`, chữ 12px muted, cao ~30px. Từ trái sang phải:
1. Ngày (thứ, dd/MM/yyyy).
2. Vạch `.eco-sep` 1×12px rồi `.eco-links`: wordmark **phaisinh**.online (phần "phaisinh" màu `--brand-primary`, weight 800) · Phái sinh hôm nay · Vị thế VN30F · Bot tín hiệu · Kiến thức. Ẩn ở ≤ 1080px.
3. Bên phải: pill giá VN30F1M (nền surface, viền `--line-normal`, `tabular-nums`, giá màu `--ink-primary`, thay đổi màu `--pos`/`--neg`) và nút Sáng/Tối.

```html
<span class="eco-sep" aria-hidden="true"></span>
<nav class="eco-links" aria-label="Hệ sinh thái phaisinh.online">
  <a href="https://phaisinh.online/" class="eco-home"><b>phaisinh</b>.online</a>
  <a href="https://phaisinh.online/category/phai-sinh-hom-nay/">Phái sinh hôm nay</a>
  <a href="https://oi.phaisinh.online/">Vị thế VN30F</a>
  <a href="https://signal.phaisinh.online/">Bot tín hiệu</a>
  <a href="https://phaisinh.online/category/phaisinh101/">Kiến thức</a>
</nav>
```
Chuyên trang mới được thêm vào danh sách này **ở mọi trang** (xem mục 13).

### 11.2 Tầng 2 — nav chữ có gạch chân
- Mục nav là **chữ thuần** 14.5px/600 `--ink-secondary`, không icon, không nền pill, cao bằng header; padding ngang 12px.
- Mục đang chọn: chữ `--brand-primary` + gạch chân 2px sát mép dưới header (`::after`, cách hai bên 12px). Không dùng nền đặc đỏ/xanh.
- Logo riêng của chuyên trang (nếu có, ví dụ logo "Bản tin phaisinh") được phép thay logo phaisinh.online ở tầng 2, vì tầng 1 đã có wordmark hệ sinh thái. Cao 44px (38px mobile); dark mode đặt trên nền trắng bo 8px.
- Nút "Tải ảnh"/"Chia sẻ" = `.share-btn` (pill 40px, viền + chữ `--brand-primary`, nền `--brand-soft`; hover nền đỏ chữ trắng). Nút Sáng/Tối và menu mobile = `.icon-btn` tròn 40×40.
- ≤ 860px: ẩn nav, hiện nút menu; drawer liệt kê đủ các mục, mỗi dòng ≥ 44px, mục đang chọn nền `--brand-soft` chữ đỏ.

### 11.3 Thẻ, tiêu đề và trạng thái trong chuyên trang nhiều thẻ
- Tiêu đề khối (`h2`) bỏ icon đầu dòng, thay bằng thanh đỏ 4px như `.block-head`.
- Hộp tóm tắt đầu trang: nền `--bg-soft`, **vạch đỏ dọc 4px bên trái**, không viền bao.
- Thẻ được "chọn/nổi bật" cạnh số liệu: viền `--line-strong` + vạch nhấn đỏ 3px ở **mép trên** (không viền đỏ bao quanh — dễ đọc nhầm là lỗ).
- Thẻ khuyến nghị LONG/SHORT được phép viền màu ngữ nghĩa (`--pos`/`--neg`) vì màu đó chính là nội dung.
- Nhãn eyebrow (VN30F1M, loại báo cáo): chữ IN HOA đỏ 12.5px/700, không nền.

## 12. Đưa một trang có sẵn về quy chuẩn (không viết lại từ đầu)

Cách đã dùng cho bantin (11/2026) — áp dụng được cho mọi trang cũ có CSS riêng:

1. **Lớp thương hiệu nạp sau cùng**: file `assets/phaisinh-brand.css` gồm (a) khối token mục 2 nguyên văn, (b) **ánh xạ biến cũ → token**, (c) ghi đè thành phần chung (header, nav, nút, tiêu đề khối, footer). Gắn `<link rel="stylesheet" href="/assets/phaisinh-brand.css?v=YYYYMMDD">` ngay trước `</head>`; đường dẫn tuyệt đối (trang con ở `/ban-tin/<ngày>/` vẫn nạp đúng). Thư mục `/assets` cache immutable nên **mỗi lần sửa phải tăng `?v=`**.
2. **Bảng ánh xạ biến cũ** (tên bên trái là biến hay gặp trong các trang cũ dựng bằng Tailwind/slate):

   | Biến cũ | Token chuẩn |
   |---|---|
   | `--bg`, `--bg-body` | `--bg-page` |
   | `--bg-card` / `--bg-card-sub` / `--bg-card-hover` | `--bg-surface` / `--bg-surface-2` / `--bg-soft` |
   | `--border` / `--border-sub` / `--border-focus` | `--line-normal` / `--line-subtle` / `--line-strong` |
   | `--text` / `--text-muted` / `--text-light` | `--ink-primary` / `--ink-muted` / `--ink-faint` |
   | `--primary` / `--primary-hover` / `--primary-light` | `--brand-primary` / `--brand-hover` / `--brand-soft` |
   | `--success*` / `--danger*` / `--warning*` | `--pos*` / `--neg*` / `--warn*` |

   Khai báo phần ánh xạ trong `:root` (sáng) và `:root[data-theme="dark"]` (tối — độ đặc hiệu cao hơn `[data-theme="dark"]` cũ nên luôn thắng).
3. **Mã màu viết cứng & canvas**: canvas/ApexCharts không đọc được `var(--x)`, nên chạy script đổi mã hex/rgba cũ sang mã thương hiệu (mẫu: `scripts/apply-phaisinh-brand.js` của bantin; chạy lại nhiều lần vẫn an toàn). Quy tắc đổi:
   - Xanh dương accent (`#2563eb`, `#1d4ed8`, `#3b82f6`, `#38bdf8`…) → đỏ thương hiệu (`#d23922`, `#b02c18`; tối `#f0634a`).
   - **Lãi dương từng tô xanh dương → `--pos`**. **Long = xanh `#0b7d44`/`#2fbf6f`, Short = đỏ `#d23922`/`#ff6b52`** (không dùng cam cho Short).
   - Đường giá trong phiên → màu xu hướng phiên (mục 6.11), không tô màu thương hiệu, không để `#1b1b1b` cố định (tàng hình trên nền tối). Nền biểu đồ giữ theo giao diện.
   - Xám slate lạnh (`#0f172a`, `#64748b`, `#e2e8f0`, `#f1f5f9`…) → xám ấm tương ứng (`#111111`, `#6c6d6d`, `#eeeae8`, `#f6f4f3`).
   - Tím (`#8b5cf6`, `#7c3aed`, `#6366f1`) → `--s-nn` `#1e4d8c`.
4. Kiểm tra: 1280px và 375px, cả Sáng/Tối, mọi trang con (với bantin: `/`, `/phan-tich`, `/ctck`), `scrollWidth == innerWidth`, console không lỗi, ảnh logo không 404.

> Logo hệ sinh thái chuẩn: `https://phaisinh.online/brand/logo-phaisinh.png` (1174×306). Địa chỉ cũ `…/wp-content/uploads/2025/11/logo-phai-sinh.png` **đã chết**, không dùng.

## 13. Danh bạ chuyên trang

| Tên miền | Vai trò | Repo / mã nguồn | Khóa theme | Ghi chú |
|---|---|---|---|---|
| `phaisinh.online` | Hub tin tức | `C:\dev\phaisinh-wt\astro-shell` | – | Tài liệu gốc `design/DESIGN_SYSTEM.md` |
| `oi.phaisinh.online` | Vị thế VN30F (mẫu chuẩn dashboard) | `E:\dev\Vithephaisinh` (`app/css/tokens.css`, `app.css`) | `oi_theme` | Chạy `node build.js` trước commit |
| `signal.phaisinh.online` | Bot tín hiệu | `C:\dev\signal-phaisinh` | `signal_theme` | Mẫu ảnh chia sẻ gốc |
| `bantin.phaisinh.online` | Bản tin khuyến nghị CTCK | `E:\dev\Bantinphaisinh` (`assets/phaisinh-brand.css`) | `bantin_theme` | Header 2 tầng (mục 11) |

Thêm chuyên trang mới: bổ sung một dòng ở đây, thêm liên kết vào `.eco-links` (mục 11.1) và nav `.site-header` của các trang khác nếu cần.

## 14. Ảnh chia sẻ ("Tải ảnh")

Mọi nút tải ảnh theo **một** quy chuẩn. Chi tiết vẽ poster: `E:\dev\Vithephaisinh\docs\PROMPT-ANH-CHIA-SE.md`; nếu khác nhau thì **mục này thắng**. Bản cài đặt tham chiếu: `E:\dev\Vithephaisinh\app\js\share-poster.js` (oi, ES module) và `E:\dev\Bantinphaisinh\share-poster.js` (bantin, script thường, dùng chung được: `window.PhaisinhShare`).

### 14.1 Poster 1080×1920 (bản 11/2026)
- **Lề trái/phải 36px** (không phải 64px): tận dụng tối đa diện tích; khoảng trong thẻ/biểu đồ 24–28px. Chân ảnh ở `H − 34`, nội dung kết thúc ở `H − 84`.
- Dải màu thương hiệu 8px sát mép trên.
- **Đầu ảnh: logo phaisinh.online dạng ảnh**, không viết chữ tên miền. Cao 84px, căn giữa theo ô QR, giữ tỷ lệ gốc (`w = 84 × naturalWidth / naturalHeight`).
  - Nền sáng: `poster-logo.png` (logo gốc, cắt sát viền).
  - Nền tối: `poster-logo-light.png` — **logo âm bản**: vòng tròn giữ màu gốc (mũi tên trắng), chữ màu sáng `#f6f2f0`, không nền.
  - Hai file đặt **cùng tên miền** với trang (oi: `app/public/`, bantin: `Img/`) để canvas không bị "bẩn"; tải trước trong `ensureFonts()` (chờ tối đa 2,5 giây), lỗi thì quay về chữ tên miền.
  - Mã QR: ô trắng 120px, góc phải trên (`y = 28`), trỏ tới `https://‹tên miền›` không tham số.
- Eyebrow đỏ IN HOA, tiêu đề rất lớn, thẻ số 3 cột, mục có thanh đỏ, chân ảnh một dòng: như tệp PROMPT.
- **Biểu đồ trong ảnh**: thẻ biểu đồ theo nền ảnh (sáng/tối), đường 5px, vùng tô dưới đường và chấm cuối theo màu xu hướng (mục 6.11). Biểu đồ ApexCharts vẽ sẵn cả bản sáng lẫn bản tối để khớp nền ảnh.

### 14.1b Mẫu "Biểu đồ + Long/Short" (bản tin khuyến nghị theo ngày)
Giữ bố cục quen thuộc của bản tin cũ, vẽ bằng nhận diện mới (mẫu mặc định của trang Bản tin). Từ trên xuống:
1. **Đầu ảnh kiểu bản tin cũ, không có dòng eyebrow.** Bên trái là logo chuyên trang (Bản tin, bản đơn sắc hoặc âm bản) cao 104px; ở giữa, sau một vạch mảnh, là lịch ngày: thứ viết nhỏ IN HOA màu xám, ngày cỡ 96px màu đỏ thương hiệu, "/ tháng / năm" cỡ 56px; bên phải là QR. Bên dưới là tiêu đề một dòng và đoạn nhận định tối đa 2 dòng.
   - Trong `share-poster.js`: `spec.brandLogo = 'bantin'`, `spec.dateISO`, `spec.noEyebrow = true`.
2. Biểu đồ phiên **không khung**, vùng vẽ sát hai lề (`sec.bare`), cao 580px, có đường tham chiếu TC màu `--warn` và các mức vào lệnh: LONG xanh, SHORT đỏ.
   - Nhãn mức giá bên phải dàn cách đều tối thiểu 28px, không chồng chữ.
   - Mức thay đổi khớp với số ở đầu trang.
3. Hai cột **MUA · LONG** / **BÁN · SHORT**:
   - Đầu cột là ô nền nhạt cùng màu, có ký hiệu M/B và số lệnh.
   - Mỗi lệnh là một thẻ: ô logo CTCK nền trắng (ảnh cùng tên miền), rồi 3 số Vào · Chốt lời (xanh) · Cắt lỗ (đỏ) có nhãn nhỏ phía trên.
   - Lệnh đã chấm có dải màu kết quả mảnh bên trái thẻ.
   - Chiều cao thẻ tự co (96–124px); quá nhiều lệnh thì hiện "+ N lệnh khác".
4. Một hàng **QUAN SÁT** liệt kê CTCK đứng ngoài.
5. Dòng chân ảnh chuẩn.

### 14.1c Ảnh bảng xếp hạng người chơi ("Cao thủ dự báo")
- Không liệt kê chữ dài dưới tên người chơi. Dùng hình trực quan:
  - **Bục top 3**: hạng 1 ở giữa, cao hơn, viền vàng `#d4a017`; hạng 2 bạc, hạng 3 đồng. Mỗi thẻ có huy hiệu hạng, tên, tỷ lệ đúng cỡ lớn, "x/y phiên đúng", **dải ô** và nhãn "Chuỗi N".
  - **Hạng 4–10**: hàng gồm huy hiệu hạng · tên · **dải ô đúng/sai ở cột giữa** · tỷ lệ % bên phải.
- Dải ô: mỗi ô một phiên đã chấm, xanh là đúng, đỏ nhạt là sai. Ô tự co khi có nhiều phiên.

### 14.2 Hộp thoại "Tải ảnh chia sẻ" (mẫu oi, bản 11/2026)
- **Gọn, không chữ thừa**: không dòng mô tả dưới tiêu đề ("VN30F1M · ngày … · ảnh dọc 1080×1920"), không dòng gợi ý QR ở cuối, không khung/nền bao quanh ảnh xem trước (chỉ viền mảnh 1px, bo 6px).
- **Hàng tiêu đề**: tiêu đề · **công tắc nền ảnh Tối/Sáng dạng biểu tượng** (trăng/mặt trời, `role="switch"`, nút trượt nằm sau lựa chọn đang bật) · nút × tròn. Không dùng chip "Nền ảnh: Sáng / Tối".
- **Nút có biểu tượng**:
  - Tải ảnh: nút chính, đỏ đậm. Bấm thì chép nội dung đăng kèm vào clipboard ngay trong cú bấm, rồi tải PNG.
  - Chia sẻ: Web Share, chỉ hiện khi `navigator.canShare({files})`.
  - Tải cả N: chỉ hiện khi có ≥ 2 mẫu. Dựng sẵn cả bộ sau 300ms. Trên điện thoại mở bảng chia sẻ với mọi ảnh, trên máy tính tải lần lượt.
  - Chép ảnh: dùng ClipboardItem.
  - Chép chữ.
- Máy tính: ảnh bên trái rộng 300px; bên phải từ trên xuống là chip nội dung, hàng nút pill, thông báo, ô "Nội dung đăng kèm ảnh (sửa được)".
- **Điện thoại (≤ 720px)** — mọi thứ quan trọng nằm trong màn đầu, không phải cuộn:
  - Hộp thoại rộng `100vw − 12px`, bo 14px, đệm 8px.
  - Chip nội dung chia đều **đúng một hàng** (ẩn legend, chữ 12px, cắt "…").
  - Ảnh xem trước **cân trái**, rộng `min(100%, (100dvh − 150px) × 0,5625)`.
  - **Cột nút biểu tượng cân phải** rộng 56px. Mỗi nút là vòng tròn 44px nền `--brand-soft`; nút Tải ảnh nền đỏ đậm, biểu tượng trắng. Nhãn ngắn 11px bên dưới: "Tải ảnh", "Chia sẻ", "Tải cả N", "Chép ảnh", "Chép chữ".
  - Ô nội dung đăng kèm nằm dưới cùng.
- Ảnh vẽ sẵn (biểu đồ, lịch, hồ sơ) dùng **cùng hộp thoại**, ẩn công tắc nền và chip mẫu.
- Ghi nhớ mẫu và nền ảnh bằng `localStorage` (bọc try/catch). Nền mặc định theo giao diện trang.
- Lớp CSS mẫu: `.ps-dialog`, `.ps-switch`, `.ps-act` (bantin, `assets/phaisinh-brand.css` mục 8) ≡ `.share-dialog`, `.share-switch`, `.share-act` (oi, `app/css/app.css`).

## 15. Cách dùng tài liệu này cho trang mới

Khi bắt đầu một chuyên trang `*.phaisinh.online`, chỉ cần yêu cầu agent: **"Làm theo quy chuẩn thiết kế phaisinh.online"** — skill `phaisinh-design-system` (cài ở `~/.claude/skills/`) sẽ trỏ agent tới file này. Thứ tự làm:
1. Chép khối token mục 2 vào `tokens.css` (hoặc dùng lớp thương hiệu mục 12 nếu là trang cũ).
2. Dựng header theo 6.1 (trang một mục) hoặc mục 11 (trang nhiều mục); footer theo 6.14.
3. Dựng nội dung bằng `.report-head`, `.kpis`, `.block-head`, `.seg`, `.chip` (mục 6).
4. Thêm trang vào danh bạ mục 13 và `.eco-links`.
5. Chạy danh sách kiểm tra mục 10.

## 16. Đồng nhất giữa các trang và trên điện thoại (rút ra từ đợt rà soát bantin 18/11/2026)

### 16.1 Logo chuyên trang trên header và footer
- Mỗi chuyên trang có **logo riêng ở dạng ảnh**: logo phaisinh.online kèm tên chuyên trang (ví dụ "Bản tin"). Bắt buộc có 2 bản:
  - **bản đơn sắc** cho nền sáng: chữ tên chuyên trang và ".online" một màu `#1b1b1b`, **không gradient**;
  - **bản âm bản** cho nền tối: các chữ đó màu `#f6f2f0`. Vòng tròn và chữ "phaisinh" giữ màu gốc.
  - Mẫu: `bantin/Img/logo-bantin.png` và `logo-bantin-dark.png`.
- HTML đặt cả hai ảnh, CSS ẩn hoặc hiện theo `data-theme`. Không đặt logo trong ô nền trắng.
- Cao 40px trên header máy tính, 34px trên điện thoại và ở footer.

### 16.2 Nút trên header và nút "Tải ảnh"
- Mọi trang có **cùng bộ nút**: Tải ảnh · đổi giao diện · menu.
  - Điện thoại: cả 3 là nút tròn 40px (36px khi màn ≤ 380px). Nút Tải ảnh nền đỏ nhạt, chỉ hiện biểu tượng tải xuống.
  - Máy tính: nút Tải ảnh dạng pill có chữ "Tải ảnh".
- **Mỗi trang chỉ có MỘT nút "Tải ảnh": nút trên header.** Nút này mở hộp thoại có đủ mẫu ảnh của trang đang xem; chọn mẫu bằng chip. Ví dụ ở bantin:

  | Trang | Các mẫu ảnh |
  |---|---|
  | Bản tin | Tổng quan · Danh sách |
  | Nhịp đập | Mời dự báo · Kết quả · Cao thủ · Lịch sử phiên |
  | Lịch sử | Lịch tháng |
  | Xếp hạng | Phiên … Năm · Lịch tháng |
  | Phân tích | Xếp hạng · Lãi/lỗ · Tỷ lệ thắng · Đối đầu · Lịch khớp lệnh |
  | Hồ sơ | Hồ sơ · Nhật ký |

  Không đặt nút tải ở từng biểu đồ, từng khối hay đầu trang. Ngoại lệ duy nhất: trong cửa sổ chi tiết (modal) đang mở một đối tượng.
  - Ảnh biểu đồ của các mẫu còn lại được dựng ngầm sau khi hộp thoại mở, xong thì vẽ lại bằng `PhaisinhShare.refresh()`.
  - Trên điện thoại, chip mẫu cuộn ngang khi nhiều hơn 4 mẫu, không cắt chữ.
- **Không có nút "Chia sẻ" chỉ chép đường link.** Nút chia sẻ ở bất kỳ đâu đều là "Tải ảnh": biểu tượng *download*, mở hộp thoại Tải ảnh (mục 14.2), trong đó đã có Chia sẻ, Chép ảnh, Chép chữ.
- Nút Tải ảnh ở đầu trang (`.ps-page-dl`):
  - pill đỏ đậm, cao 40px (36px trên điện thoại);
  - nằm **cùng hàng tiêu đề trang**, căn phải, không bao giờ rơi xuống một dòng riêng.

### 16.3 Đầu trang và tiêu đề khối
- Đầu trang: h1 21–28px đậm 800, viết hoa chữ đầu câu, không biểu tượng trang trí. Mô tả 13–14px màu xám luôn hiện, cả trên điện thoại.
- Tiêu đề khối, mọi trang một kiểu (mục 6.5):
  - thanh đỏ 4px bên trái, chữ đậm 800;
  - không biểu tượng màu (vàng, xanh…) đứng trước;
  - không emoji (⚡ 🔥 🟢 🔴 🏆 ⛔ ⏱️ ⚪).
- **Viết hoa chữ đầu câu** cho tiêu đề, nhãn, nút, menu, chân trang. Không Viết Hoa Mỗi Chữ.
  - Từ viết tắt giữ nguyên: CTCK, PnL, TP, SL, VN30F1M, LONG, SHORT.
  - Chữ IN HOA chỉ dùng cho eyebrow/nhãn nhỏ.
- Khối phụ (mời dự báo, quảng bá) đặt **cuối** trang, không chen lên trên tiêu đề trang.
  - Khi bố cục mobile dùng `order` thì phải gán `order` lớn cho khối phụ.

### 16.3b Footer và menu điện thoại
- **Footer gọn** (mẫu `.site-footer` của oi), giống nhau ở mọi trang:
  - hàng 1: logo · liên kết (một hàng, không biểu tượng, viết hoa chữ đầu câu) · logo mạng xã hội 32px **đúng nhận diện từng hãng**:
    - Zalo: ô xanh `#0068FF` có bóng thoại chữ "Zalo";
    - Facebook: hình tròn `#0866FF` có chữ f trắng;
    - YouTube: khối đỏ `#FF0000` có nút play trắng.
    - Không tô xám, không vẽ lại kiểu tự chế.
  - hàng 2: **một** dòng miễn trừ 12,5px;
  - hàng 3: © bản quyền · liên kết phaisinh.online.
  - Không đoạn giới thiệu dài, không thẻ mạng xã hội to, không hộp miễn trừ màu.
- **Khối tương tác phụ** không xếp một hàng nhiều nút liên kết (dễ vỡ thành 2 hàng trên điện thoại). Gom thành **một liên kết chữ** căn phải, dạng "Xem kết quả & bảng xếp hạng →", ngăn với phần trên bằng một đường kẻ mảnh. Không lặp lại số liệu đã có trên hàng tiêu đề.
- **Menu điện thoại** chỉ chứa các mục điều hướng, biểu tượng cùng một màu. Không lặp lại các nút đã có trên header (Tải ảnh, đổi giao diện).

### 16.3c Không chia tab khi nội dung ngắn
- Một chủ đề có ít nội dung (ví dụ Nhịp đập: bình chọn, diễn biến, xếp hạng người chơi, lịch sử) thì **gộp thành một trang cuộn**. Mỗi phần là một khối có tiêu đề thanh đỏ, nút Tải ảnh nhỏ ở bên phải.
- Đường dẫn con cũ (`/nhip-dap/bang-xep-hang`, `/nhip-dap/lich-su`) vẫn dùng được: mở trang chung rồi cuộn tới đúng mục.
- Chỉ chia tab khi mỗi tab là một trang đầy đủ, dài hơn 2 màn hình.

### 16.3d Đầu trang báo cáo và dải chỉ số (mẫu `.report-head` + `.kpis` của oi)
Trang báo cáo theo ngày (như Bản tin) mở đầu bằng:
1. Eyebrow chữ đỏ IN HOA 12,5px (loại báo cáo · hợp đồng · ngày), không đóng viên thuốc.
2. Tiêu đề h1 lớn 1,55–2,35rem.
3. Đoạn dẫn 1,02rem màu `--ink-secondary`, không khung, không thanh đỏ bên trái.
4. **Dải chỉ số**: các ô nhãn nhỏ IN HOA 12px + số lớn đậm 800 (1,4–2rem) + chú thích nhỏ.
   - Các ô chia bằng vạch mảnh 1px; dải có đường kẻ trên và dưới. Không nền, không viền bo, không chấm màu.
   - Màu số theo nghĩa: LONG/tăng `--pos`, SHORT/giảm `--neg`, trung tính `--ink-secondary`.
   - Điện thoại: ô "Xu hướng chung" chiếm cả hàng (nhãn trái, giá trị phải), các ô đếm chia 3 cột bên dưới.

### 16.3e Khối tương tác phụ (mời dự báo, khảo sát) trên trang nội dung
- Máy tính: **không trải hết bề rộng nội dung**. Khối thành ô nổi rộng 372px ở góc phải dưới: viền trên đỏ 3px, bo 18px, đổ bóng lớn.
  - Từ 1100 đến dưới 2080px: mặc định thu gọn thành thanh nhỏ, bấm để mở.
  - Từ 2080px trở lên: nằm trong lề phải, mở sẵn, không che nội dung.
- Điện thoại: giữ là thẻ trong luồng trang.
- Nút chọn XANH/ĐỎ (hoặc Tăng/Giảm) phải nổi bật, mời bấm:
  - nền gradient đặc (xanh `#087040`→`#12a05a`, đỏ `#c22f1a`→`#f0634a`), cao ít nhất 64px, bo 16px;
  - mũi tên trong ô tròn trắng mờ, nhãn chữ 20px đậm 800, dòng phụ 12px một dòng ("Đóng trên TC");
  - đổ bóng cùng màu; hover nhấc lên 2px; ánh sáng lướt nhẹ, tắt khi `prefers-reduced-motion`;
  - đã chọn: vòng viền cùng màu và dòng "Bạn đã chọn"; hết giờ thì mờ và xám.

### 16.4 Bảng, lịch, card trên điện thoại (≤ 720px)
- **Không bắt người dùng kéo ngang bảng nhiều cột.** Bảng trên 5 cột chuyển thành thẻ, mỗi dòng của bảng là một thẻ 2–3 hàng:
  - hàng 1: ngày · vị thế · kết quả;
  - hàng 2: các mức giá, có nhãn ngắn "Vào", "TP", "SL";
  - hàng ghi chú trải hết chiều ngang.
- Lưới lịch dùng `repeat(N, minmax(0, 1fr))` để ô không bị nội dung đẩy rộng. Trên điện thoại rút gọn chữ trong ô (ví dụ "2/8" thay cho "2/8 CTCK có lãi").
- Số liệu dùng `font-variant-numeric: tabular-nums` trên font Be Vietnam Pro. Không dùng font monospace cho giá hay số.
- Nút, chip, nhãn ngắn để `white-space: nowrap`. Không có nút nào bị bẻ thành 2 dòng.
- Chữ nhỏ nhất 11px.
- Kiểm tra bằng script dò: không phần tử nào tràn ngang ở 375px, `scrollWidth` của trang = 375.

### 16.5 Biểu đồ trên cùng một trang phải cùng một kiểu
- ApexCharts: nạp lớp bọc chung (mẫu `bantin/assets/chart-theme.js`) **ngay sau** `apexcharts.min.js`. Lớp này đặt cho mọi biểu đồ:
  - nền trong suốt; chữ, lưới, tooltip theo giao diện sáng/tối (ảnh poster ép nền bằng `chart.psTheme`);
  - font Be Vietnam Pro;
  - lưới `rgba(17,17,17,.07)` nét đứt;
  - ẩn thanh công cụ (đã có nút Tải ảnh);
  - nhãn trục X không xoay, tự ẩn nhãn chồng. Không bật `trim` cho trục danh mục dài, vì nhãn sẽ bị cắt hết.
- Trục ngày dài: chỉ hiện khoảng 5–6 mốc `dd/mm` trên điện thoại, 10 mốc trên máy tính, các mốc khác để trống.
- Biểu đồ canvas tự vẽ (giá trong phiên, nến mini): nền trắng phủ gradient xu hướng (mục 6.11), cùng font thương hiệu.

### 16.6 Ảnh tải về ở mọi trang (không chỉ trang chủ)
- **Mọi** ảnh tải về đều là poster 1080×1920 của mục 14.1, dựng bằng `PhaisinhShare.open({ build })`. Không còn ảnh chụp biểu đồ khổ ngang kèm header tự vẽ.
- Nội dung poster: eyebrow (loại nội dung · đối tượng · kỳ) → tiêu đề nêu **điều nổi bật nhất** → thẻ 3 số → một hoặc hai khối. Các loại khối:
  - `list`: danh sách xếp hạng, nhật ký lệnh;
  - `chart`: đường giá hoặc lãi/lỗ cộng dồn, vẽ thẳng trên canvas;
  - `image`: biểu đồ ApexCharts **vẽ lại ngoài màn hình ở khổ 960×1000, chữ 20px**, không chụp bản nhỏ đang hiện trên điện thoại;
  - `grid`: lịch theo phiên. Ô tự giãn lấp phần thân ảnh, bỏ thứ Bảy và Chủ nhật.
- Một trang có nhiều nút Tải ảnh thì gom thành **một bộ mẫu** (chip nội dung, nút "Tải cả N"). Nút cạnh từng biểu đồ mở đúng mẫu của biểu đồ đó (`forceMode`).

## Lịch sử thay đổi
- 1.6.1 (18/11/2026): 14.1b có đầu ảnh logo chuyên trang + lịch ngày (bỏ eyebrow) và biểu đồ không khung; 16.3b gom các nút liên kết của khối phụ thành một liên kết chữ.
- 1.6 (18/11/2026): thêm 16.3e (khối tương tác phụ thành ô nổi góc màn hình trên máy tính; nút XANH/ĐỎ nổi bật) và 14.1c (ảnh "Cao thủ dự báo" dạng bục và dải ô đúng/sai).
- 1.5.1 (18/11/2026): thêm 14.1b, mẫu ảnh "Biểu đồ + Long/Short" giữ bố cục bản tin cũ theo nhận diện mới.
- 1.5 (18/11/2026): biểu đồ trên nền tối tự đổi màu chi tiết sang bản sáng, thang trục theo dữ liệu (6.11); một nút Tải ảnh duy nhất trên header mỗi trang (16.2); logo mạng xã hội đúng nhận diện (16.3b); thêm 16.3d đầu trang báo cáo + dải chỉ số kiểu oi.
- 1.4 (18/11/2026): sửa 6.11: nền biểu đồ hài hoà theo giao diện, chỉ đường line và vùng tô dưới đường mang màu xu hướng; thêm quy tắc biểu đồ gọn. 16.1: logo chuyên trang có bản đơn sắc và bản âm bản. Thêm 16.3b (footer gọn, menu điện thoại) và 16.3c (không chia tab khi nội dung ngắn).
- 1.3 (18/11/2026): thêm mục 16 (đồng nhất giữa các trang và trên điện thoại: cụm logo header, bộ nút header, nút "Tải ảnh" thay "Chia sẻ", đầu trang và tiêu đề khối, viết hoa chữ đầu câu, bảng thành thẻ trên mobile, lớp kiểu ApexCharts chung, mọi ảnh tải về là poster chuẩn).
- 1.2 (18/11/2026): biểu đồ giá theo phiên bỏ nền đen, tô gradient xanh/đỏ theo xu hướng (6.11, 12); mục 14 viết đầy đủ: poster lề 36px + logo ảnh (âm bản cho nền tối), hộp thoại Tải ảnh gọn kiểu oi (công tắc nền dạng biểu tượng, cột nút biểu tượng trên điện thoại, nút Tải cả N, bỏ chữ thừa và khung viền).
- 1.1 (17/11/2026): chuyển bản gốc về repo `E:\dev\Phaisinh.online\docs\`; thêm mục 11–15 (header 2 tầng cho chuyên trang nhiều mục, quy trình đưa trang cũ về chuẩn, danh bạ, ảnh chia sẻ, cách dùng); áp dụng cho bantin.phaisinh.online; thay logo chết.
- 1.0 (13/11/2026): bản đầu, đối chiếu phaisinh.online, oi., signal.
