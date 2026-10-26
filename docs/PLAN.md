# Kế hoạch sản phẩm — Theo dõi Tiểu đường

> Tài liệu này mô tả mục tiêu, phạm vi và lộ trình của ứng dụng. Mô hình dữ liệu và công thức tham chiếu trực tiếp `src/types.ts`, `src/lib/calc.ts`, `src/lib/targets.ts`.

## 1. Mục tiêu & người dùng mục tiêu

**Mục tiêu:** một ứng dụng web tiếng Việt, đơn giản và riêng tư, giúp người bị tiểu đường tự ghi lại và nhìn thấy xu hướng của các chỉ số sức khoẻ quan trọng (đường huyết, HbA1c, BMI/vòng eo, huyết áp, mỡ máu, chức năng thận) để trao đổi hiệu quả hơn với bác sĩ.

| Nhóm người dùng | Nhu cầu chính |
|---|---|
| Bệnh nhân tiểu đường type 2 | Ghi đường huyết hằng ngày, theo dõi HbA1c mỗi 3 tháng, huyết áp, mỡ máu, thận |
| Bệnh nhân tiểu đường type 1 | Ghi nhiều lần/ngày, xem Time-in-Range, tỉ lệ hạ đường huyết, độ biến thiên (CV) |
| Người tiền tiểu đường | Theo dõi đường huyết lúc đói, cân nặng, BMI, vòng eo để phòng ngừa tiến triển |
| Người chăm sóc (con cái, vợ/chồng) | Xem nhanh tình trạng, nhập hộ số liệu, xuất bản sao lưu |

**Nguyên tắc sản phẩm:** local-first (dữ liệu ở trình duyệt), mobile-first, nhập liệu dưới 10 giây, cảnh báo bằng màu + chữ (không chỉ màu), ngôn ngữ dễ hiểu.

## 2. Phạm vi MVP (v1.0)

Các route lấy từ `src/App.tsx`.

### 2.1 Tổng quan — `/`
- Thẻ chỉ số mới nhất (StatTile) cho đường huyết, HbA1c, BMI, huyết áp, LDL, eGFR/UACR, kèm trạng thái (đạt / cao / rất cao / thấp).
- Thống kê đường huyết theo khoảng thời gian: trung bình, GMI, TIR (thấp / trong ngưỡng / cao), CV.
- Biểu đồ xu hướng thu gọn; nút nhập nhanh.
- Trạng thái trống (EmptyState) và nút nạp dữ liệu demo (`seedDemoData`).

### 2.2 Đường huyết — `/glucose`
- Thêm / sửa / xoá phép đo: thời điểm, giá trị (theo đơn vị người dùng), bối cảnh (nhịn ăn, trước ăn, sau ăn 1–2h, trước ngủ, bất kỳ), ghi chú.
- Danh sách lọc theo bối cảnh và khoảng thời gian (7/14/30/90 ngày, 1 năm, tất cả).
- Biểu đồ đường với vùng mục tiêu; huy hiệu trạng thái theo bối cảnh.
- Thống kê: trung bình, GMI, TIR 70–180, CV, số lần hạ đường huyết.

### 2.3 HbA1c — `/hba1c`
- Thêm / sửa / xoá kết quả HbA1c (%), ghi chú.
- Hiển thị đồng thời mmol/mol (IFCC) và eAG (ADAG, theo đơn vị đường huyết người dùng).
- Biểu đồ xu hướng với đường mục tiêu; so sánh với GMI từ đường huyết tự đo.

### 2.4 Cơ thể / BMI — `/body`
- Ghi cân nặng, chiều cao, vòng eo, ghi chú; chiều cao mặc định lấy từ hồ sơ.
- BMI tự tính, phân loại theo chuẩn châu Á; cảnh báo vòng eo theo giới tính.
- Biểu đồ cân nặng / BMI / vòng eo.

### 2.5 Huyết áp — `/blood-pressure`
- Ghi tâm thu, tâm trương, mạch, ghi chú.
- Trạng thái theo mục tiêu (<130/80), cảnh báo mức rất cao (≥180 hoặc ≥120) và thấp (<90 hoặc <60).
- Biểu đồ hai đường + vùng mục tiêu.

### 2.6 Xét nghiệm mỡ máu & thận — `/labs`
- Ba tab: **Mỡ máu** (Total-C, LDL, HDL, Triglycerides; mg/dL), **Thận** (creatinine mg/dL, eGFR, UACR) và **Tuyến giáp** (TSH mIU/L, FT4 ng/dL).
- Thêm / sửa / xoá bộ kết quả theo ngày; các trường đều tuỳ chọn (xét nghiệm một phần).
- Phân giai đoạn eGFR (G1–G5) và UACR (A1–A3) theo KDIGO.
- Biểu đồ xu hướng theo chỉ số.

### 2.7 Cài đặt — `/settings`
- Hồ sơ: tên, năm sinh, giới tính, loại tiểu đường, chiều cao.
- Đơn vị đường huyết (mg/dL hoặc mmol/L), giao diện sáng / tối / theo hệ thống.
- Chỉnh mục tiêu cá nhân (Targets) và nút khôi phục mặc định ADA.
- Xuất / nhập JSON (sao lưu), nạp dữ liệu demo, xoá toàn bộ dữ liệu (có xác nhận).
- Khối miễn trừ y khoa.

### 2.8 Xuyên suốt
- Sidebar trên desktop, thanh tab dưới trên mobile; giao diện sáng/tối bằng CSS variables.
- Cập nhật UI tức thì qua `useLiveQuery`; biểu đồ đổi màu theo theme.
- Định dạng ngày `dd/MM/yyyy` (locale `vi`).

## 3. Chỉ số theo dõi và công thức

Mục tiêu mặc định lấy từ `DEFAULT_TARGETS` (`src/lib/targets.ts`) — theo **ADA Standards of Care 2025** cho glucose / HbA1c / huyết áp / lipid, với ngưỡng BMI và vòng eo châu Á. Người dùng có thể chỉnh trong Cài đặt; **ngưỡng cá nhân hoá do bác sĩ quyết định**.

| Chỉ số | Đơn vị | Công thức / nguồn | Ngưỡng mục tiêu mặc định |
|---|---|---|---|
| Đường huyết lúc đói / trước ăn / trước ngủ | mg/dL (lưu), hiển thị mg/dL hoặc mmol/L | ADA 2025; 1 mmol/L = 18,0182 mg/dL | 80–130 mg/dL (`fastingMin`–`fastingMax`) |
| Đường huyết sau ăn / bất kỳ | mg/dL | ADA 2025 (đỉnh sau ăn 1–2h) | < 180 mg/dL (`postMealMax`) |
| Hạ đường huyết | mg/dL | ADA 2025 | < 70 mg/dL (`hypoBelow`) |
| HbA1c | % | ADA 2025 | < 7 % (`hba1cMax`) |
| HbA1c → IFCC | mmol/mol | (A1c − 2,15) × 10,929 | — |
| eAG (đường huyết trung bình ước tính) | mg/dL | **eAG = 28,7 × A1c − 46,7** (ADAG, Nathan 2008); nghịch đảo: A1c = (eAG + 46,7) / 28,7 | — |
| GMI | % | **GMI = 3,31 + 0,02392 × trung bình mg/dL** (Bergenstal 2018) | tham chiếu < 7 % |
| Time-in-Range (TIR) | % số phép đo | Tỉ lệ phép đo trong 70–180 mg/dL (trên các phép đo tự đo SMBG, không phải CGM liên tục) | 70–180 mg/dL; càng cao càng tốt |
| Độ biến thiên CV | % | CV = SD / trung bình × 100 (SD mẫu, n−1) | < 36 % |
| BMI | kg/m² | cân nặng / (chiều cao m)² | 18,5 – 22,9 (`bmiMin` 18.5, `bmiMax` 23) |
| Phân loại BMI châu Á | — | WHO / IDI-WPRO 2000 | < 18,5 thiếu cân; 18,5–22,9 bình thường; 23–24,9 thừa cân; 25–29,9 béo phì độ I; ≥ 30 béo phì độ II |
| Vòng eo | cm | Ngưỡng béo bụng châu Á | Nam ≤ 90; nữ ≤ 80 (`waistMaxMale`, `waistMaxFemale`) |
| Huyết áp | mmHg | ADA 2025 | < 130 / < 80 (`bpSysMax`, `bpDiaMax`) |
| LDL-C | mg/dL | ADA 2025 | < 100 (`ldlMax`) |
| HDL-C | mg/dL | ADA 2025 | Nam > 40; nữ > 50 (`hdlMinMale`, `hdlMinFemale`) |
| Triglycerides | mg/dL | ADA 2025 | < 150 (`tgMax`) |
| eGFR | mL/phút/1,73 m² | KDIGO — G1 ≥ 90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 < 15 | ≥ 60 (`egfrMin`) |
| UACR | mg/g | KDIGO — A1 < 30, A2 30–300, A3 > 300 | < 30 (`uacrMax`) |
| TSH | mIU/L | Khoảng tham chiếu phổ biến 0,4–4,0; > 10 gợi ý suy giáp rõ | 0,4–4,0 (`tshMin`/`tshMax`) |
| FT4 | ng/dL | Khoảng tham chiếu phổ biến 0,8–1,8 | cố định |
| Creatinine | mg/dL | Nhập từ kết quả xét nghiệm | — |

### Quy tắc phân mức trạng thái (`src/lib/calc.ts`)

| Chỉ số | Thấp | Đạt | Cao | Rất cao |
|---|---|---|---|---|
| Đường huyết (mọi bối cảnh) | < `hypoBelow` (70) | — | — | — |
| Đói / trước ăn / trước ngủ | < `fastingMin` (80) | 80–130 | > 130 | > 130 × 1,4 = 182 |
| Sau ăn / bất kỳ | < 70 | ≤ 180 | > 180 | > 180 × 1,4 = 252 |
| HbA1c | — | ≤ 7 | > 7 | > 9 (mục tiêu + 2) |
| BMI | < `bmiMin` | < `bmiMax` | ≥ 23 | ≥ 30 |
| Vòng eo | — | ≤ ngưỡng giới | > ngưỡng giới | — |
| Huyết áp | < 90 hoặc < 60 | dưới 130/80 | ≥ 130 hoặc ≥ 80 | ≥ 180 hoặc ≥ 120 |
| LDL | — | < 100 | ≥ 100 | ≥ 160 |
| HDL | < ngưỡng giới | còn lại | — | — |
| Triglycerides | — | < 150 | ≥ 150 | ≥ 500 |
| eGFR | — | ≥ 60 | < 60 | < 30 |
| UACR | — | < 30 | ≥ 30 | ≥ 300 |
| TSH | < 0,4 | 0,4–4,0 | > 4,0 | > 10 |

> Ghi chú: hàm `glucoseStatus` kiểm tra `hypoBelow` trước, sau đó phân nhánh theo bối cảnh. Ngưỡng "rất cao" là heuristic của ứng dụng để tô màu, không phải khuyến cáo lâm sàng.

## 4. Non-goals của v1

- Không có tài khoản, đăng nhập hay cloud/đồng bộ — mọi dữ liệu nằm trong trình duyệt.
- Không kết nối máy đo đường huyết / CGM / thiết bị Bluetooth.
- Không nhắc uống thuốc, không nhắc đo, không thông báo đẩy.
- Không tư vấn điều trị, không gợi ý liều thuốc/insulin, không chẩn đoán.
- Không nhật ký bữa ăn/carb/hoạt động (để dành cho v1.2).
- Không đa ngôn ngữ (chỉ tiếng Việt).

## 5. Roadmap

| Phiên bản | Nội dung |
|---|---|
| **v1.0** | MVP như mục 2. |
| **v1.1** | PWA: hoạt động offline, cài lên màn hình chính; nhắc đo (local notification khi khả dụng); xuất báo cáo PDF cho bác sĩ (tóm tắt 30/90 ngày, biểu đồ, bảng chỉ số). |
| **v1.2** | Nhật ký thuốc/insulin, bữa ăn, carb; gắn nhãn sự kiện lên biểu đồ đường huyết. |
| **v2** | Đồng bộ cloud đa thiết bị (đăng nhập, mã hoá đầu cuối nếu có thể); nhập CGM/CSV từ máy đo; chia sẻ có kiểm soát cho bác sĩ/người chăm sóc. |

## 6. Rủi ro & lưu ý

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| **Dữ liệu chỉ nằm trong trình duyệt:** xoá cache/dữ liệu trang, đổi máy, chế độ ẩn danh hoặc trình duyệt dọn dẹp tự động → mất dữ liệu | Cao | Nút xuất JSON nổi bật; nhắc sao lưu định kỳ (ví dụ hiển thị "Sao lưu lần cuối" và cảnh báo sau 30 ngày); đề nghị `navigator.storage.persist()` ở v1.1 |
| **Hiểu nhầm là công cụ y tế:** người dùng tự điều chỉnh thuốc theo số liệu | Cao | Miễn trừ y khoa ở Cài đặt và README; không đưa lời khuyên điều trị; ngôn ngữ trạng thái trung tính |
| Ngưỡng mặc định không phù hợp cá nhân (người cao tuổi, thai kỳ, bệnh nặng) | Trung bình | Cho chỉnh Targets; ghi rõ ngưỡng cá nhân hoá do bác sĩ quyết định |
| Sai đơn vị mg/dL ↔ mmol/L khi nhập | Trung bình | Luôn hiển thị nhãn đơn vị cạnh ô nhập; kiểm tra phạm vi giá trị hợp lý; unit test cho `calc.ts` |
| Chênh lệch TIR/GMI từ phép đo tự đo so với CGM | Thấp | Ghi chú rằng đây là ước tính từ các phép đo rời rạc |
| Dữ liệu sức khoẻ nhạy cảm | Trung bình | Không gửi dữ liệu ra ngoài; không analytics; xuất file do người dùng tự giữ |

### Tuyên bố miễn trừ y khoa

Ứng dụng chỉ nhằm hỗ trợ ghi chép và theo dõi cá nhân. **Không thay thế tư vấn, chẩn đoán hay điều trị của bác sĩ.** Ngưỡng mục tiêu mặc định dựa trên khuyến cáo chung (ADA, KDIGO, WHO); mục tiêu cá nhân do bác sĩ điều trị quyết định. Khi có triệu chứng hạ/tăng đường huyết nặng hoặc kết quả bất thường, hãy liên hệ cơ sở y tế ngay.

## 7. Tiêu chí hoàn thành v1 (Definition of Done)

**Chức năng**
- [ ] 7 route hoạt động: `/`, `/glucose`, `/hba1c`, `/body`, `/blood-pressure`, `/labs`, `/settings`.
- [ ] CRUD đầy đủ (thêm / sửa / xoá có xác nhận) cho 6 loại bản ghi: glucose, hba1c, body, bloodPressure, lipids, kidney.
- [ ] Đổi đơn vị mg/dL ↔ mmol/L cập nhật toàn bộ giá trị hiển thị và ô nhập mà không đổi dữ liệu đã lưu.
- [ ] Trạng thái (đạt / cao / rất cao / thấp) hiển thị đúng theo `Targets` hiện hành; sửa Targets cập nhật ngay.
- [ ] Xuất JSON → xoá dữ liệu → nhập lại cho kết quả giống ban đầu (kiểm tra `ExportBundle` v1).
- [ ] Dữ liệu demo nạp được và xoá toàn bộ hoạt động.

**Chất lượng**
- [ ] `npm run build` (gồm `tsc -b`) và `npm run lint` không lỗi.
- [ ] Unit test `src/lib/calc.ts` pass: chuyển đổi đơn vị, eAG, GMI, IFCC, BMI + phân loại, các hàm status, TIR, CV.
- [ ] Giao diện dùng được ở 360 px (mobile) đến desktop; sáng/tối đều đọc rõ, biểu đồ đổi màu theo theme.
- [ ] Trạng thái không chỉ dựa vào màu (có nhãn chữ); form có nhãn, focus ring, tương phản đạt WCAG AA.
- [ ] Mọi trang có EmptyState khi chưa có dữ liệu và không lỗi console.
- [ ] Triển khai static thành công, tải lại ở route con (ví dụ `/glucose`) không bị 404 (SPA fallback).
- [ ] Có miễn trừ y khoa trong ứng dụng và README.
