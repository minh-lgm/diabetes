# Hệ thống thiết kế — Theo dõi Tiểu đường

Tài liệu dành cho người xây dựng giao diện (designer + front-end). Mã nguồn tương ứng: `src/index.css`, `tailwind.config.js`, `src/components/ui/`, `src/components/charts/`, `src/components/AppShell.tsx`.

---

## 1. Nguyên tắc

| Nguyên tắc | Ý nghĩa thực tế |
|---|---|
| **Rõ ràng** | Mỗi màn hình trả lời một câu hỏi: “Tôi đang ở đâu so với mục tiêu?”. Số liệu lớn, nhãn ngắn, không trang trí thừa. |
| **Bình tĩnh** | Người dùng là bệnh nhân mạn tính, xem app mỗi ngày. Không dùng màu đỏ chói, không rung/nhấp nháy, không cảnh báo giật gân. Trạng thái “Rất cao” vẫn chỉ là một huy hiệu nhỏ, không phải banner. |
| **Ưu tiên số liệu** | Giá trị đo luôn là phần tử nổi bật nhất trong một ô (cỡ chữ 3xl, `tabular-nums`). Đơn vị, thời gian, trạng thái là phụ. |
| **Màu trạng thái nhất quán** | Một màu = một ý nghĩa, ở mọi nơi (ô KPI, huy hiệu, biểu đồ). Xem §2.2. |
| **Không gây hoảng sợ** | Luôn kèm ngữ cảnh (mục tiêu, thời điểm đo) và câu nhắc “không thay thế tư vấn của bác sĩ”. Không tự chẩn đoán. |
| **Tiếng Việt chuẩn** | Đủ dấu, viết hoa chữ đầu câu, dùng dấu “·” để nối thông tin phụ, dấu “–” cho khoảng (70–180). |

---

## 2. Màu sắc

Tất cả màu là **CSS variable dạng `R G B`** trên `:root` (sáng) và `.dark` (tối), được Tailwind đọc qua `rgb(var(--c-x) / <alpha-value>)`. Vì vậy mọi tiện ích `bg-ok/15`, `text-primary` … đều tự đổi theme. Biểu đồ đọc cùng biến qua `useChartColors()`.

### 2.1 Token

| Token | Tailwind | Sáng | Tối | Dùng cho |
|---|---|---|---|---|
| `--c-bg` | `bg-bg` | `246 248 250` | `15 20 27` | Nền trang |
| `--c-surface` | `bg-surface` | `255 255 255` | `24 31 40` | Card, sidebar, modal, tooltip |
| `--c-surface-2` | `bg-surface-2` | `241 244 247` | `32 41 52` | Nền phụ: Segmented, hover, skeleton, icon-chip |
| `--c-border` | `border-border` | `226 231 236` | `48 58 71` | Viền card, divider, lưới biểu đồ |
| `--c-fg` | `text-fg` | `20 28 38` | `232 236 241` | Chữ chính |
| `--c-muted` | `text-muted` | `100 112 128` | `148 160 176` | Nhãn, chú thích, trục biểu đồ |
| `--c-primary` | `bg/text-primary` | `13 110 253` | `96 165 250` | Hành động chính, link active, đường huyết nhịn ăn |
| `--c-primary-fg` | `text-primary-fg` | `255 255 255` | `10 20 35` | Chữ trên nền primary |
| `--c-ok` | `ok` | `22 163 74` | `74 222 128` | Đạt mục tiêu, vùng mục tiêu, “trước ăn” |
| `--c-warn` | `warn` | `217 119 6` | `251 191 36` | Cao hơn mục tiêu, ngưỡng sau ăn, “sau ăn” |
| `--c-danger` | `danger` | `220 38 38` | `248 113 113` | Rất cao, hạ đường huyết, xoá |
| `--c-info` | `info` | `2 132 199` | `56 189 248` | Thấp (dưới ngưỡng), cân nặng, “trước ngủ” |

Quy ước: **không hard-code màu hex** trong component; nếu cần màu mới, thêm token vào `index.css` + `tailwind.config.js` rồi cập nhật bảng này.

### 2.2 Ánh xạ `Status` → màu

`Status` (`src/lib/calc.ts`) có 5 giá trị. Ánh xạ cố định trong `STATUS_TONE` / `STATUS_DOT` (`components/ui/index.tsx`):

| Status | Nhãn | Màu | Lý do |
|---|---|---|---|
| `low` | Thấp | **info** (xanh lam) | Thấp là bất thường nhưng không phải “lỗi của người dùng”; dùng lam để tách khỏi “cao”. Riêng ngưỡng hạ đường huyết trên biểu đồ vẽ bằng **danger** vì nguy hiểm cấp. |
| `ok` | Đạt mục tiêu | **ok** (xanh lục) | |
| `high` | Cao | **warn** (cam) | Cần chú ý, chưa khẩn cấp. |
| `very_high` | Rất cao | **danger** (đỏ) | Vượt xa mục tiêu (> 1.4× hoặc ngưỡng lâm sàng). |
| `unknown` | — | muted | Không có dữ liệu / thiếu chiều cao… |

Huy hiệu trạng thái luôn có **chấm màu + chữ** (không chỉ dựa vào màu) để người mù màu vẫn đọc được.

### 2.3 Màu theo bối cảnh đo đường huyết

Định nghĩa tại `components/charts/glucoseContext.ts`, dùng chung cho mọi biểu đồ và chú giải:

| Context | Nhãn | Màu |
|---|---|---|
| `fasting` | Nhịn ăn (sáng) | primary |
| `before_meal` | Trước ăn | ok |
| `after_meal` | Sau ăn 1–2h | warn |
| `bedtime` | Trước ngủ | info |
| `random` | Bất kỳ | muted |

---

## 3. Chữ

- Font: **Inter** (Google Fonts, 400/500/600/700), fallback `system-ui`. Tailwind `font-sans`.
- Thang cỡ chữ (Tailwind):

| Vai trò | Lớp | Ghi chú |
|---|---|---|
| Tiêu đề trang (h1) | `text-2xl font-bold tracking-tight` | `PageHeader` |
| Tiêu đề card (h2) | `text-base font-semibold` | `Card title` |
| Tiêu đề modal (h3) | `text-lg font-semibold` | |
| Giá trị KPI | `text-3xl font-bold tabular-nums tracking-tight` | `StatTile` |
| Giá trị trong danh sách | `text-base/lg font-semibold tabular-nums` | |
| Thân | `text-sm` | Mặc định cho form, nav, bảng |
| Phụ / chú thích | `text-xs text-muted` | Hint, thời gian, chú giải biểu đồ |
| Nhãn tab bar | `text-[11px] font-medium` | Chỉ dùng ở tab bar di động |

- **Số luôn `tabular-nums`** để căn thẳng cột (đã bật mặc định cho `td/th/input[type=number]` trong `index.css`).
- Số thập phân: đường huyết mmol/L 1 chữ số, HbA1c 1 chữ số, BMI 1 chữ số, cân nặng 1 chữ số, mg/dL làm tròn nguyên. Dùng `formatGlucose`.

---

## 4. Khoảng cách và bo góc

- Lưới cơ sở 4 px (Tailwind). Khoảng cách giữa các card: `gap-5` (20 px); giữa các ô KPI: `gap-3`.
- Đệm trang: `p-4` (mobile) / `p-6` (md+), do `AppShell` cung cấp — **trang không tự thêm đệm ngoài**.
- Nội dung tối đa `max-w-6xl` (72 rem), căn giữa.
- Bo góc: `rounded-xl` = 0.875 rem (nút, input, nav item, icon-chip); `rounded-2xl` = 1.25 rem (card, tile, modal, sheet); `rounded-full` (huy hiệu, thanh TIR, avatar).
- Đổ bóng rất nhẹ: `shadow-sm` cho card/tile; `shadow-xl` cho modal/sheet. Không dùng bóng màu.
- Viền 1 px `border-border` trên mọi surface để tách khỏi nền trong cả hai theme.

---

## 5. Thành phần

Từ `src/components/ui/index.tsx` (API ổn định, các trang import từ `'../components/ui'`):

| Thành phần | Khi dùng | Lưu ý |
|---|---|---|
| `Button` (`primary/secondary/ghost/danger`, `sm/md/lg`) | Mọi hành động. Một `primary` mỗi vùng; `secondary` cho hành động phụ; `danger` chỉ cho xoá/huỷ dữ liệu. | Cao 40 px (`md`); dùng `lg` (48 px) cho CTA trên mobile. |
| `Card` (`title`, `subtitle`, `action`) | Nhóm một nội dung có tiêu đề. | `bodyClassName="pb-0"` khi bên trong là danh sách full-bleed. |
| `PageHeader` | Đầu mỗi trang: tiêu đề + mô tả + hành động (bộ chọn khoảng, nút Thêm). | |
| `Field` + `Input`/`Select`/`Textarea` | Mọi form. `Field` cung cấp nhãn, hint, lỗi. | `Input suffix="mg/dL"` để hiển thị đơn vị. |
| `Segmented` | Chọn 1 trong ≤ 6 lựa chọn ngắn (khoảng thời gian, bối cảnh đo, đơn vị). | `role=radiogroup`. |
| `StatusBadge` | Hiển thị `Status` cạnh giá trị. | Không bao giờ chỉ dùng màu nền thay huy hiệu. |
| `StatTile` | Ô KPI: nhãn, giá trị, đơn vị, trạng thái, hint, icon; `onClick` để điều hướng. | Giá trị đã định dạng sẵn; truyền `'—'` khi trống. |
| `EmptyState` | Không có dữ liệu trong card/trang. | Luôn có hành động gợi ý nếu có thể. |
| `Modal` / `ConfirmDialog` | Form thêm/sửa (`Modal`), xác nhận xoá (`ConfirmDialog`). | Mobile: trượt từ đáy; Esc để đóng. |

Thêm mới trong đợt này:

| Thành phần | Tệp | Khi dùng |
|---|---|---|
| `ThemeToggle` | `components/ui/ThemeToggle.tsx` | Nút xoay vòng Sáng → Tối → Hệ thống, lưu vào profile. Có `aria-label` mô tả trạng thái hiện tại và trạng thái kế tiếp. |
| `BottomSheet` | `components/ui/BottomSheet.tsx` | Menu/trang tính nhỏ trượt từ đáy trên mobile (tab “Thêm…”). Dùng `Modal` cho form, `BottomSheet` cho menu. |
| `ChartLegend` | `components/charts/ChartLegend.tsx` | Chú giải HTML dưới biểu đồ (chấm màu hoặc gạch đứt). Dễ đọc hơn `Legend` SVG của Recharts trên mobile. |
| `glucoseContext.ts` | `components/charts/` | `contextColor(ctx, colors)` — nguồn duy nhất cho màu theo bối cảnh. |
| `navItems.ts` | `components/` | Danh sách điều hướng dùng chung cho sidebar và tab bar. |

Thành phần nội bộ của Tổng quan (`src/features/dashboard/`): `KpiGrid`, `GlucoseTrendChart`, `TimeInRangeBar`, `HbA1cTrendChart`, `WeightTrendChart`, `RecentEntries`, `QuickAdd`, hook `useDashboardData`, `useStoredRange`.

---

## 6. Quy ước biểu đồ (Recharts)

- Luôn bọc trong `ResponsiveContainer width="100%" height="100%"` bên trong một `div` có **chiều cao tường minh** (280 px biểu đồ chính, 220 px biểu đồ nửa trang).
- Màu lấy từ `useChartColors()`; tooltip dùng `tooltipStyle(c)`; tick `AXIS_TICK` (11 px) tô `c.muted`; lưới `c.border`, chỉ đường ngang (`vertical={false}`), nét đứt `3 3`.
- Tắt animation (`isAnimationActive={false}`) — bình tĩnh và tôn trọng `prefers-reduced-motion`.
- **Trục X thời gian**: `type="number" scale="time"`, dataKey là epoch ms; nhãn `dd/MM` (`fmtShort`) với khoảng ≤ 90 ngày, `MM/yyyy` (`fmtMonth`) với HbA1c nhiều năm.
- **Trục Y theo đơn vị người dùng** (`profile.glucoseUnit`): dữ liệu lưu mg/dL, chuyển bằng `toDisplayGlucose`; nhãn trục bỏ đơn vị, đơn vị hiện ở tooltip và chú giải.
- **Vùng mục tiêu**: `ReferenceArea` từ `fastingMin` đến `fastingMax`, tô `ok` với `fillOpacity 0.1`, không viền.
- **Ngưỡng**: `ReferenceLine` nét đứt `4 4`: `postMealMax` màu `warn`, `hypoBelow` màu `danger`, `hba1cMax` màu `warn`.
- **Điểm theo bối cảnh**: một `Scatter` cho mỗi context có dữ liệu, màu theo §2.3; chú giải chỉ liệt kê context đang có.
- **Tooltip** luôn 3 dòng: ngày giờ (`fmtDateTime`) · giá trị + đơn vị (đậm, `tabular-nums`) · ngữ cảnh/ghi chú (ví dụ nhãn context, eAG, BMI).
- Miền trục Y luôn bao gồm cả vùng mục tiêu và các ngưỡng để đường tham chiếu không bị cắt.
- Thanh thời-gian-trong-khoảng (TIR) là HTML thuần (`div` ngang, `role="img"` + `aria-label` đọc đủ %), thứ tự cố định Thấp → Trong khoảng → Cao với màu info → ok → warn.

---

## 7. Bố cục

- **md+ (≥ 768 px)**: sidebar cố định trái `w-64`, gồm thương hiệu (icon `Activity` trên nền primary + “Theo dõi Tiểu đường”), 7 mục điều hướng, chân sidebar có avatar chữ cái đầu + tên (mặc định “Hồ sơ của bạn”, bấm vào mở Cài đặt) + `ThemeToggle`. Nội dung lệch trái `md:pl-64`.
- **< md**: thanh trên `h-14` dính (`sticky`) với thương hiệu + `ThemeToggle`; thanh tab dưới cố định 5 ô (Tổng quan, Đường huyết, HbA1c, Cơ thể, Thêm…), mỗi ô cao ≥ 56 px. “Thêm…” mở `BottomSheet` chứa Huyết áp, Xét nghiệm, Cài đặt; ô “Thêm…” sáng khi đang ở một trong ba trang đó. Nội dung có đệm đáy `4.5rem + safe-area` để không bị che.
- Mục active: `bg-primary/10 text-primary` (sidebar) hoặc `text-primary` (tab bar). `NavLink end` cho “/”.
- `<main className="p-4 md:p-6 max-w-6xl mx-auto w-full">` — tất cả trang render bên trong; `AppShell` cuộn lên đầu khi đổi route.
- Lưới trang Tổng quan: KPI `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`; biểu đồ chính + TIR `lg:grid-cols-5` (3/2); hai card xu hướng `md:grid-cols-2`.

---

## 8. Quy ước form

- Thời điểm đo: `<input type="datetime-local">`, giá trị qua `toLocalInput` / `fromLocalInput` (`lib/dates.ts`); mặc định là “bây giờ”. Ngày xét nghiệm (HbA1c, lipid, thận) có thể dùng `type="date"` + `toDateInput`.
- Số: `<Input type="number" inputMode="decimal" step=…>` với **đơn vị ở `suffix`** (“mg/dL”, “mmol/L”, “%”, “kg”, “cm”, “mmHg”). Nhập theo đơn vị người dùng, lưu mg/dL (`fromDisplayGlucose`).
- Nhãn ngắn, không dấu hai chấm. Hint dưới trường cho mục tiêu: “Mục tiêu 80–130 mg/dL”.
- Thông điệp lỗi tiếng Việt, cụ thể, đặt ngay dưới trường (`Field error`), ví dụ:
  - “Vui lòng nhập giá trị.”
  - “Giá trị phải từ 20 đến 600 mg/dL.”
  - “Tâm thu phải lớn hơn tâm trương.”
  - “Thời điểm không được ở tương lai.”
- Nút trong modal: `Huỷ` (secondary) bên trái, hành động chính bên phải; xoá luôn qua `ConfirmDialog`.
- Form mở bằng tham số `?add=1` trên URL trang (Tổng quan điều hướng tới đó).

---

## 9. Trạng thái trống / tải / lỗi

- **Trống**: `EmptyState` với icon muted, tiêu đề một câu, mô tả ngắn, 1–2 nút. Trang Tổng quan khi hoàn toàn trống: “Ghi chỉ số đầu tiên” (primary) + “Tạo dữ liệu demo” (secondary). Card trống từng phần: chỉ tiêu đề + gợi ý (“Chọn khoảng thời gian rộng hơn…”).
- **Tải**: skeleton `animate-pulse bg-surface-2 rounded-2xl` giữ đúng kích thước nội dung, có `aria-busy`. Không spinner toàn trang.
- **Lỗi**: dòng `text-sm text-danger` với `role="alert"` ngay tại nơi hành động; không toast chói. Thông điệp nói việc gì không làm được và làm gì tiếp.
- **Không có dữ liệu trong ô KPI**: giá trị “—”, trạng thái `unknown`, hint “Chưa có dữ liệu”.

---

## 10. Khả năng tiếp cận

- Tương phản: chữ `fg` trên `surface` ≥ 12:1; `muted` trên `surface` ≥ 4.5:1 cả hai theme. Màu trạng thái dùng cho chữ chỉ ở cỡ ≥ 12 px và luôn kèm chấm/nhãn.
- Focus: mọi phần tử tương tác có `focus-visible:ring-2 ring-primary/50` (hoặc outline toàn cục trong `index.css`). Không bao giờ `outline-none` mà không có ring thay thế.
- Mục tiêu chạm ≥ 44 × 44 px: nav item `min-h-[44px]`, tab `min-h-[56px]`, nút icon `min-h/min-w-[44px]`, hàng danh sách `min-h-[56px]`.
- ARIA: `aria-label` cho nút chỉ có icon (Đóng, Giao diện…), `aria-current` tự động từ `NavLink`, `role="dialog" aria-modal` cho modal/sheet, `role="radiogroup"` cho Segmented, `role="img" aria-label` cho thanh TIR, `aria-expanded`/`aria-haspopup` cho nút Thêm.
- Icon trang trí luôn `aria-hidden`.
- Esc đóng modal/sheet; bấm nền mờ cũng đóng.
- `color-scheme` theo theme để control gốc (datetime-local, select) không chói trong dark mode.
- `prefers-reduced-motion`: tắt transition/animation.
- Ngôn ngữ `<html lang="vi">`; định dạng ngày `dd/MM/yyyy`, giờ 24 h.

---

## 11. Wireframe từng trang (mô tả)

**Tổng quan `/`**
`PageHeader` “Tổng quan” — mô tả “Chào, {tên} · Hôm nay dd/MM/yyyy” — bên phải `Segmented` 7 ngày … Tất cả (lưu localStorage).
Hàng 1: 6 `StatTile` (Đường huyết nhịn ăn · HbA1c · BMI · Huyết áp · LDL-C · eGFR), bấm vào mở trang tương ứng.
Hàng 2: 4 nút ghi nhanh (Ghi đường huyết / HbA1c / cân nặng / huyết áp → `?add=1`).
Hàng 3: Card “Đường huyết” (scatter theo bối cảnh, vùng mục tiêu, 2 ngưỡng, chú giải) 3/5 · Card “Thời gian trong khoảng” (thanh TIR + 3 % + 5 chỉ số + ghi chú nếu dữ liệu ít) 2/5.
Hàng 4: Card “Xu hướng HbA1c” (2 năm, đường + ngưỡng) · Card “Cân nặng” (đường, tooltip kèm BMI).
Hàng 5: Card “Bản ghi gần đây” — 8 hàng: icon · nhãn + ngày giờ · giá trị + huy hiệu · chevron.
Chân trang: dòng miễn trừ trách nhiệm y khoa. Trạng thái trống thay toàn bộ hàng 1–5 bằng một card `EmptyState`.

**Đường huyết `/glucose`**
Header + Segmented khoảng + nút “Thêm” (primary). Hàng thống kê (trung bình, TIR, số lần). Biểu đồ scatter cùng quy ước Tổng quan nhưng cao hơn; bộ lọc bối cảnh (`Segmented` hoặc chip). Bảng/danh sách bản ghi: ngày giờ · bối cảnh · giá trị (đơn vị người dùng) · huy hiệu · ghi chú · sửa/xoá. Modal thêm: datetime-local, giá trị + suffix đơn vị, bối cảnh (`Segmented`), ghi chú.

**HbA1c `/hba1c`**
Header + nút Thêm. Tile “Gần nhất” (kèm eAG, IFCC mmol/mol) · “Thay đổi so với lần trước”. Biểu đồ đường toàn lịch sử với ngưỡng `hba1cMax`. Danh sách bản ghi theo ngày. Modal: ngày, %, ghi chú.

**Cơ thể `/body`**
Header + Thêm. Tiles: Cân nặng · BMI (phân loại châu Á) · Vòng eo (so ngưỡng theo giới). Biểu đồ cân nặng (và BMI nếu có chiều cao), đường mục tiêu `bmiMin–bmiMax` quy đổi ra kg nếu có chiều cao. Danh sách. Modal: ngày giờ, cân nặng kg, chiều cao cm (điền sẵn từ hồ sơ), vòng eo cm.

**Huyết áp `/blood-pressure`**
Header + Thêm. Tiles: Gần nhất (sys/dia), Trung bình khoảng, Mạch. Biểu đồ 2 đường (tâm thu primary, tâm trương info) với 2 ngưỡng `bpSysMax`/`bpDiaMax` nét đứt. Danh sách. Modal: ngày giờ, tâm thu, tâm trương, mạch.

**Xét nghiệm `/labs`**
Hai tab/segment: Mỡ máu · Thận. Mỗi phần: tiles cho từng chỉ số (LDL, HDL, TG, TC / Creatinine, eGFR, UACR) với huy hiệu; biểu đồ đường theo lần xét nghiệm; bảng theo ngày; modal nhập nhiều trường tuỳ chọn (bỏ trống được).

**Cài đặt `/settings`**
Các card: Hồ sơ (tên, năm sinh, giới, loại tiểu đường, chiều cao) · Hiển thị (đơn vị đường huyết, giao diện) · Mục tiêu (toàn bộ `Targets`, hint giá trị ADA mặc định, nút “Khôi phục mặc định”) · Dữ liệu (Xuất JSON, Nhập JSON, Tạo dữ liệu demo, Xoá toàn bộ qua `ConfirmDialog`) · Giới thiệu + miễn trừ trách nhiệm.
