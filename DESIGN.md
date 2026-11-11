# RAI² DESIGN SYSTEM & ARCHITECTURE GUIDELINES
> **Tiêu chuẩn Thiết kế Đồng bộ Toàn diện: Front-End (Trang Chủ) & Back-End (AI Workspace App `rai2.si`)**
> **Thẩm mỹ chủ đạo**: *Framer Editorial × Apple Minimalism × Linear Precision*
> **Tài liệu nguồn (Single Source of Truth)**: Dùng làm kim chỉ nam thiết kế cho Front-End Landing Page và Back-End AI Workspace.

---

## 1. Triết lý Thiết kế (Design Philosophy)

Hệ thống thiết kế của **RAI²** được xây dựng trên triết lý **"Artificial Intelligence + Actual Intelligence"** (Trí tuệ nhân tạo kết hợp với trí tuệ thực thi của con người). Giao diện không đi theo lối mòn dashboard phần mềm kỹ thuật phức tạp, mà mang dáng dấp của một tạp chí kiến trúc cao cấp, tinh gọn, tĩnh lặng và tập trung tuyệt đối vào giá trị công việc.

### Ba Nguyên tắc Bất biến (Core Principles)
1. **White Hero Airiness (Khoáng đạt & Ánh sáng)**: Nền trắng tinh khôi kết hợp ánh hào quang xanh biển nhạt (*Ice Blue Ambient Glow*) lan tỏa nhẹ từ đỉnh, tạo cảm giác không gian vô tận và hiện đại.
2. **Typographic Mass (Sức nặng Kiểu chữ)**: Sử dụng font chữ tiêu đề đậm nét, tracking âm (`-0.03em` đến `-0.04em`), tương phản mạnh mẽ giữa chữ đen tuyền (`#0f172a` / `#111111`) trên nền sáng.
3. **Unified Surface Geometry (Hình học Bề mặt Đồng nhất)**: Bo tròn viền mềm mại (`rounded-2xl` 16px/18px, nút bấm pill `rounded-full`), viền sợi tóc siêu mảnh (`border-hairline` `#e2e8f0`), đổ bóng khuếch tán đa tầng (diffused multi-layer elevation).

---

## 2. Hệ Thống Màu Sắc Chuẩn (Color Tokens & Palette)

### 2.1. Bảng Màu Style Trắng (Daylight / White Hero Aesthetic)

| Token Tên Biến | Mã Màu Hex / HSL | Ý nghĩa & Vị trí Áp dụng |
| :--- | :--- | :--- |
| `--color-app` | `#f8fafd` | Nền chính không gian làm việc (Thread / Main Canvas) |
| `--color-hero-glow` | `rgba(0, 153, 255, 0.09)` | Vùng ánh sáng xanh thanh khiết tỏa từ trên đỉnh Section Hero |
| `--color-panel` | `#f1f5fa` | Nền thanh bên Sidebar danh sách RAI / Kênh chat |
| `--color-card` | `#ffffff` | Thẻ tin nhắn phản hồi của RAI, thẻ tính năng, bảng giá |
| `--color-raised` | `#e3edf7` | Trạng thái được chọn (Active row / Selected item) |
| `--color-raised-hover`| `#ebf3fa` | Trạng thái di chuột (Hover row / Hover item) |
| `--color-inset` | `#edf2f7` | Khung nhập liệu tìm kiếm (Search bar), ô input form |
| `--color-hairline` | `#e2e8f0` | Viền sợi tóc chia cắt giữa các panel và thẻ card |
| `--color-bubble-user` | `#0f172a` | Bong bóng tin nhắn người dùng (Jet Black Editorial) |
| `--color-bubble-user-ink` | `#ffffff` | Màu chữ trắng tinh trong bong bóng tin nhắn người dùng |
| `--color-accent` | `#0099ff` | **Màu thương hiệu RAI² (Electric Blue / Azure)** |
| `--color-accent-text` | `#0077cc` | Màu chữ liên kết và điểm nhấn ngữ nghĩa (Contrast 4.5:1+) |
| `--color-composer` | `#ffffff` | Khung soạn thảo tin nhắn nổi (Floating input composer) |
| `--color-ink` | `#0f172a` | Chữ tiêu đề và nội dung chính (High contrast Slate Black) |
| `--color-ink-secondary`| `#475569` | Chữ phụ, mô tả tính năng, nhãn thời gian |
| `--color-ink-tertiary` | `#94a3b8` | Chữ mờ, placeholder, trạng thái phụ |

---

## 3. Quy Chuẩn Hiệu Ứng Nền (Ambient Glow Effect)

Section Hero ngoài Front-End và Khu vực Chat Backend cùng chia sẻ công thức ánh sáng vi mô:

### 3.1. Phiên bản CSS thuần (Dùng cho Backend App `rai2.si/app`)
```css
/* Công thức ánh sáng nền xanh xanh nhẹ White (Hero Glow) */
background-color: #f8fafd;
background-image: radial-gradient(
  circle at 50% 0%,
  rgba(0, 153, 255, 0.09) 0%,
  rgba(0, 153, 255, 0.02) 45%,
  transparent 70%
);
background-repeat: no-repeat;
background-attachment: fixed;
```

### 3.2. Phiên bản Tailwind CSS (Dùng cho Front-End Landing Page `rai2.si`)
```tsx
{/* Subtle radial glow on edges */}
<div
  className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] blur-[120px] pointer-events-none rounded-full bg-[#0099ff]/10"
/>
```

* **Vùng phát sáng**: Tâm điểm đặt tại đỉnh giữa `50% 0%`.
* **Độ chuyển màu**: Tỏa mượt từ xanh Azure `#0099ff` (9% - 10% opacity) tan dần vào nền trắng `#f8fafd`.
* **Hiệu ứng tâm lý**: Tạo cảm giác không khí trong lành, kích thích khả năng tập trung sâu và tư duy sáng tạo khi người dùng làm việc liên tục hàng giờ.

---

## 4. Hệ Thống Kiểu Chữ (Typography Scale)

* **Font gia đình**: `Geist Variable`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
* **Display / Hero Headline**:
  * Cỡ chữ: `text-3xl sm:text-5xl md:text-6xl lg:text-[76px]` (36px – 76px).
  * Letter-spacing: `tracking-[-0.04em]` (nén chặt tạo khối ấn tượng).
  * Line-height: `leading-[1.12] sm:leading-[1.04]`.
* **Section Heading**:
  * Cỡ chữ: `text-2xl` đến `text-3xl` (24px – 30px).
  * Trọng lượng: `font-medium` (500) hoặc `font-semibold` (600).
* **Body / Message Text**:
  * Cỡ chữ: `text-[14px]` đến `text-[15px]`.
  * Line-height: `leading-relaxed` (1.6 – 1.65).
  * Màu mực: `#0f172a` (mực đen tương phản cao trên nền trắng).

---

## 5. Quy Chuẩn Thành Phần Giao Diện (Components Anatomy)

### 5.1. Thanh Điều Hướng (Top Header & Navigation)
* **Kích thước**: Chiều cao `56px` – `64px`, ghim cố định (`sticky` / `fixed top-0`).
* **Vật liệu**: Kính mờ cao cấp (`backdrop-blur-md`, nền `rgba(255, 255, 255, 0.90)`).
* **Đường biên**: Viền đáy 1px siêu mỏng `border-b border-[#e5e5e5]/80`.
* **Logo**: Logo bản đen `rai-core-black.png` tự động kích hoạt trên nền sáng.

### 5.2. Thẻ Trò Chuyện Của RAI (RAI Cards)
* **Nền**: Trắng tinh khôi (`#ffffff`).
* **Bo góc**: `rounded-2xl` (16px).
* **Viền**: 1px `border border-[#e2e8f0]/85`.
* **Đổ bóng**: `box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)`.
* **Mascot Avatar**: Vòng tròn Mascot thương hiệu đường kính `32px` – `40px` viền mảnh.

### 5.3. Bong Bóng Tin Nhắn Người Dùng (User Bubbles)
* **Nền**: Đen tuyền sang trọng (`#0f172a` hoặc `#000000`).
* **Màu chữ**: Trắng sáng (`#ffffff`).
* **Bo góc**: `rounded-2xl` với góc thoát 4px đặc trưng của tin nhắn tương tác.

### 5.4. Khung Soạn Thảo Tin Nhắn (Floating Composer)
* **Kiểu dáng**: Nổi lơ lửng trên nền chat (`floating bar`).
* **Nền**: Trắng tinh `#ffffff`.
* **Đổ bóng**: `box-shadow: 0 8px 24px -4px rgba(0, 100, 200, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.04)`.
* **Hiệu ứng Focus**: Viền sáng màu xanh Electric Blue `border-[#0099ff]` với vòng hào quang `ring-2 ring-[#0099ff]/20`.

### 5.5. Nút Thao Tác (Buttons & Badges)
* **Nút chính (Primary CTA)**: Dáng viên thuốc (`rounded-full`), nền đen tuyền `#000000`, chữ trắng, hover có vi chuyển động nhẹ `scale-[1.02]`.
* **Nút hành động nhanh (Electric CTA)**: Nền xanh `#0099ff`, chữ trắng `#ffffff`.
* **Huy hiệu thông báo (Announcement Badges)**: Nền pha loãng `bg-[#ffffff]`, viền `border-[#e2e8f0]`, chữ xám `#555555`, chấm tròn xanh `#0099ff` hiệu ứng nhịp thở `animate-pulse`.

---

## 6. Ma Trận Đồng Bộ Front-End & Back-End (Parity Matrix)

| Tiêu Chí | Front-End (Landing Page `rai2.si`) | Back-End (Workspace App `rai2.si/app`) |
| :--- | :--- | :--- |
| **Theme Mặc Định** | Style Sáng (Daylight White) | `data-skin="daylight"` (Style Sáng Đồng Bộ) |
| **Nền Canvas** | `#f8f9fa` + Hero Ambient Glow (`#0099ff`/10) | `#f8fafd` + Radial Blue Ambient Glow (`#0099ff`/9%) |
| **Logo Sử Dụng** | `rai-core-black.png` | `rai-core-black.png` (Tự động kích hoạt) |
| **Card / Khung Chứa** | Nền trắng `#ffffff`, viền `#e2e8f0` | Nền trắng `#ffffff`, viền `#e2e8f0` |
| **Màu Điểm Nhấn (Accent)**| `#0099ff` (Electric Blue) | `#0099ff` (Electric Blue) |
| **Chữ Tiêu Đề** | `#111111` / `#0f172a` (Tracking -0.04em) | `#0f172a` (Slate Black tương phản cao) |
| **Mascot Avatar** | Headline Mascot Badge & Avatar 8 RAI | Avatar tròn đồng bộ của 8 RAI |
| **Bong Bóng User** | Jet Black `#0f172a` hoặc `#000000` | Jet Black `#0f172a` với chữ trắng `#ffffff` |
| **Toggle Theme** | Nút Mặt trời / Mặt trăng trên Header | Nút chuyển Theme tức thời + Cài đặt giao diện |

---

## 7. Hướng Dẫn Mở Rộng & Triển Khai (Implementation Notes)

Khi tạo mới các màn hình, thẻ tính năng, hoặc báo cáo tài chính/vận hành trong hệ thống:
1. Luôn sử dụng token màu ngữ nghĩa từ `src/styles.css` thay vì gõ mã màu cứng (hardcoded colors).
2. Duy trì tỷ lệ tương phản tối thiểu **4.5:1** theo tiêu chuẩn tiếp cận Web WCAG AA cho mọi văn bản.
3. Khi người dùng bấm chuyển đổi Sáng/Tối, toàn bộ hệ thống từ ngoài vào trong tự động đồng bộ theo trạng thái đã chọn qua bộ lắng nghe `subscribeSkin`.
