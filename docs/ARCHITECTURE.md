# Kiến trúc kỹ thuật — Theo dõi Tiểu đường

## 1. Stack và lý do chọn

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Build / dev server | Vite 8 | Khởi động nhanh, HMR, xuất static thuần |
| UI | React 19 + TypeScript 6 | Hệ sinh thái lớn, type-safe cho mô hình dữ liệu y tế |
| Style | Tailwind CSS 3 + CSS variables | Mobile-first nhanh; theme sáng/tối bằng biến màu (`--c-primary`, `--c-ok`, `--c-danger`, ...) |
| Routing | react-router-dom 7 (`BrowserRouter`) | Route lồng nhau với `AppShell` + `Outlet` |
| Biểu đồ | Recharts 3 | Khai báo, dễ tuỳ biến; màu đọc từ CSS variables (`components/charts/theme.ts`) |
| Lưu trữ | Dexie 4 (IndexedDB) + `dexie-react-hooks` | Truy vấn có index, giao dịch, `useLiveQuery` tự cập nhật UI |
| Ngày giờ | date-fns 4 (locale `vi`) | Nhẹ, tree-shakable |
| Icon | lucide-react | Bộ icon nhất quán |
| Lint | oxlint | Nhanh, không cấu hình nặng |

**Vì sao local-first, không backend?** Dữ liệu sức khoẻ là dữ liệu nhạy cảm: không có server nghĩa là không có gì để rò rỉ, không cần đăng ký tài khoản, không cần tuân thủ lưu trữ phía server, chi phí vận hành bằng 0 và ứng dụng chạy được khi mất mạng (đầy đủ ở v1.1 với PWA). Đánh đổi: mất dữ liệu nếu xoá dữ liệu trình duyệt → bù bằng xuất/nhập JSON (mục 7).

## 2. Cấu trúc thư mục

```
src/
├── main.tsx                 # entry, mount <App />
├── App.tsx                  # BrowserRouter + Routes (AppShell bọc 7 trang)
├── index.css                # Tailwind + CSS variables (light/dark)
├── db.ts                    # Dexie schema + getProfile/saveProfile/exportAll/importAll/clearAll
├── types.ts                 # toàn bộ kiểu dữ liệu dùng chung
├── pages/                   # mỗi route một file, CHỈ compose
│   ├── DashboardPage.tsx    #   /
│   ├── GlucosePage.tsx      #   /glucose
│   ├── HbA1cPage.tsx        #   /hba1c
│   ├── BodyPage.tsx         #   /body
│   ├── BloodPressurePage.tsx#   /blood-pressure
│   ├── LabsPage.tsx         #   /labs
│   └── SettingsPage.tsx     #   /settings
├── features/<domain>/       # logic theo miền: form, list, chart, hook riêng
│   ├── glucose/ hba1c/ body/ blood-pressure/ labs/ dashboard/ settings/
├── components/
│   ├── AppShell.tsx         # sidebar (desktop) + bottom tabs (mobile) + <Outlet />
│   ├── ui/index.tsx         # UI kit dùng chung
│   └── charts/              # theme.ts (màu, tooltip) + chart tái sử dụng
├── hooks/
│   ├── useProfile.ts        # useProfile(), useApplyTheme()
│   └── useTheme.ts
└── lib/
    ├── calc.ts              # công thức + hàm status (thuần, không phụ thuộc React)
    ├── targets.ts           # DEFAULT_TARGETS, DEFAULT_PROFILE
    ├── labels.ts            # nhãn tiếng Việt (bối cảnh, loại tiểu đường, giới tính)
    ├── dates.ts             # RangeKey, định dạng ngày, helper datetime-local
    └── seed.ts              # seedDemoData()
```

### Quy ước

1. **Trang chỉ compose.** `pages/*` ghép `PageHeader`, `Card` và các thành phần từ `features/<domain>`; không chứa truy vấn DB hay logic form phức tạp.
2. **Logic nằm trong `features/<domain>`:** form thêm/sửa, danh sách, biểu đồ, hook thống kê của riêng miền đó. Feature không import lẫn nhau; phần dùng chung đưa lên `components/` hoặc `lib/`.
3. **UI kit dùng chung** (`components/ui/index.tsx`): `Button`, `Card`, `PageHeader`, `Field`, `Input` (có `suffix`), `Select`, `Textarea`, `Segmented`, `StatusBadge`, `StatTile`, `EmptyState`, `Modal`, `ConfirmDialog`, cùng `STATUS_TONE` / `STATUS_DOT`. Không tự dựng lại các thành phần này trong feature.
4. **Hàm tính toán thuần trong `lib/`**, có thể unit test độc lập; không đặt công thức y khoa trong component.
5. **Không dùng `enum`** (`erasableSyntaxOnly: true`): dùng union type chuỗi (ví dụ `GlucoseContext`) + `Record<..., string>` cho nhãn. Cũng tránh `namespace` và parameter properties.
6. **`import type`** cho import chỉ dùng làm kiểu (`verbatimModuleSyntax: true`).
7. `noUnusedLocals` / `noUnusedParameters` bật: không để biến thừa.
8. Màu sắc lấy từ CSS variables / token Tailwind, không hard-code hex trong component; biểu đồ dùng `useChartColors()`.
9. Chuỗi hiển thị bằng tiếng Việt; định danh trong code bằng tiếng Anh.

## 3. Luồng dữ liệu

```
 Form (features/*)  ──submit──▶  db.<table>.add/put/delete  (Dexie / IndexedDB)
                                           │
                                           ▼
        useLiveQuery(() => db.<table>.where('at')...)   ◀── theo dõi thay đổi bảng
                                           │
                                           ▼
          Component list / chart / StatTile tự render lại
```

- **Ghi:** form chuyển giá trị đường huyết từ đơn vị người dùng sang mg/dL bằng `fromDisplayGlucose`, thời gian bằng `fromLocalInput` (ISO-8601), rồi `db.glucose.add(...)`.
- **Đọc:** `useLiveQuery` truy vấn theo index `at` (kèm `rangeStartIso(range)` để lọc khoảng thời gian). Mọi thay đổi (kể cả từ tab khác) làm UI cập nhật tự động; không cần store toàn cục.
- **Profile / targets:** `useProfile()` đọc bản ghi `profile['me']` (qua `getProfile()` — tạo mặc định nếu chưa có, trộn `DEFAULT_TARGETS` để tương thích khi thêm trường mới). Ghi bằng `saveProfile(patch)` (merge nông, `targets` merge riêng).
- **Theme:** `useApplyTheme(profile.theme)` gắn/bỏ class `dark` trên `<html>` (`light` | `dark` | `system`); CSS variables đổi theo class; `useChartColors()` quan sát class `dark` bằng `MutationObserver` để biểu đồ đổi màu.
- **Trạng thái hiển thị:** component gọi `glucoseStatus`, `hba1cStatus`, `bmiStatus`, `bpStatus`, ... với `profile.targets` → `StatusBadge` / `StatTile`.

## 4. Mô hình dữ liệu

Cơ sở dữ liệu IndexedDB tên `diabetes-tracker`, schema `version(1)` (`src/db.ts`). Mọi thời điểm là chuỗi ISO-8601 trong trường `at`.

| Bảng | Khoá chính | Index | Trường chính |
|---|---|---|---|
| `glucose` | `++id` | `at`, `context` | `valueMgdl` (mg/dL), `context` (`fasting` \| `before_meal` \| `after_meal` \| `bedtime` \| `random`), `note?` |
| `hba1c` | `++id` | `at` | `percent`, `note?` |
| `body` | `++id` | `at` | `weightKg?`, `heightCm?`, `waistCm?`, `note?` |
| `bloodPressure` | `++id` | `at` | `systolic`, `diastolic`, `pulse?`, `note?` |
| `lipids` | `++id` | `at` | `totalChol?`, `ldl?`, `hdl?`, `triglycerides?` (mg/dL), `note?` |
| `kidney` | `++id` | `at` | `creatinineMgdl?`, `egfr?` (mL/min/1.73m²), `uacr?` (mg/g), `note?` |
| `profile` | `id` (luôn `'me'`) | — | `name?`, `birthYear?`, `sex?`, `diabetesType?`, `heightCm?`, `glucoseUnit` (`mgdl` \| `mmol`), `theme`, `targets: Targets` |

`Targets` gồm 17 trường (xem `src/types.ts`; mặc định ở `src/lib/targets.ts`). Chỉ có các trường được liệt kê là index; các trường khác lưu trong bản ghi và không cần khai báo trong `stores()`.

## 5. Đơn vị

- **Đường huyết luôn lưu bằng mg/dL** (`GlucoseReading.valueMgdl`), bất kể người dùng chọn đơn vị nào. Hiển thị theo `profile.glucoseUnit` qua `toDisplayGlucose` / `formatGlucose` / `glucoseUnitLabel`; nhập liệu đổi ngược bằng `fromDisplayGlucose`. Hệ số: `MGDL_PER_MMOL = 18.0182`.
- Hiển thị mmol/L làm tròn 1 chữ số thập phân, mg/dL làm tròn số nguyên. Vì lưu mg/dL nên đổi đơn vị không làm mất độ chính xác dữ liệu gốc.
- **Mục tiêu (`Targets`) cũng lưu bằng mg/dL**; chuyển đổi khi hiển thị/nhập trong Cài đặt.
- **Lipid lưu mg/dL** (Total-C, LDL, HDL, TG); creatinine mg/dL; UACR mg/g; eGFR mL/phút/1,73 m². (Nếu cần hiển thị mmol/L cho lipid sẽ làm ở lớp hiển thị, không đổi dữ liệu lưu.)
- HbA1c lưu theo %; mmol/mol (IFCC) chỉ tính khi hiển thị bằng `hba1cToIfcc`.

## 6. Công thức (tóm tắt, chi tiết ở `docs/PLAN.md`)

`hba1cToEag`, `eagToHba1c`, `gmi`, `hba1cToIfcc`, `bmi`, `bmiClass` (cut-off châu Á), `timeInRange` (70–180), `cv`, `mean`, `stddev`, và các hàm `*Status` trả về `Status = 'low' | 'ok' | 'high' | 'very_high' | 'unknown'`.

## 7. Export / Import & migration

### Định dạng `ExportBundle` (v1)

```jsonc
{
  "app": "diabetes-tracker",
  "version": 1,
  "exportedAt": "2026-01-01T08:00:00.000Z",
  "profile": { "id": "me", "glucoseUnit": "mgdl", "theme": "system", "targets": { } },
  "glucose": [], "hba1c": [], "body": [],
  "bloodPressure": [], "lipids": [], "kidney": []
}
```

- `exportAll()` đọc song song mọi bảng; UI tải về dưới dạng file `.json` (đặt tên kèm ngày, ví dụ `diabetes-tracker-2026-01-01.json`).
- `importAll(bundle)` **thay thế toàn bộ** dữ liệu: kiểm tra `app === 'diabetes-tracker'`, chạy trong một giao dịch `rw` — xoá 6 bảng dữ liệu, `bulkAdd` lại (bỏ `id` để Dexie cấp mới), rồi `profile.put` đã trộn với `DEFAULT_PROFILE`. Lỗi giữa chừng sẽ rollback.
- UI phải xác nhận trước khi nhập (ConfirmDialog) vì thao tác ghi đè.
- `clearAll()` xoá 6 bảng dữ liệu (giữ profile).

### Chiến lược migration

| Thay đổi | Cách xử lý |
|---|---|
| Thêm trường tuỳ chọn vào bản ghi / `Targets` | Không cần nâng version Dexie; `getProfile()` đã trộn `DEFAULT_TARGETS`, đọc dữ liệu cũ dùng giá trị mặc định khi trường vắng |
| Thêm index hoặc bảng mới | `this.version(2).stores({ ...bảng mới/index mới })` — Dexie tự nâng cấp; chỉ khai báo phần thay đổi hoặc toàn bộ schema mới |
| Đổi hình dạng dữ liệu | `this.version(n).stores({...}).upgrade(tx => tx.table('x').toCollection().modify(...))` |
| Đổi định dạng export | Tăng `ExportBundle.version`; `importAll` đọc `bundle.version` và chạy hàm chuyển đổi từng bước (`v1 → v2 → ...`) trước khi ghi; luôn tương thích ngược với file cũ |

Quy tắc: **không bao giờ sửa `version(1)`** đã phát hành — thêm `version(n+1)`. Mỗi bản phát hành đổi schema cần test nâng cấp từ dữ liệu v trước.

## 8. Chạy và build

```bash
npm install
npm run dev        # Vite dev server (mặc định http://localhost:5173)
npm run build      # tsc -b && vite build  → thư mục dist/
npm run preview    # phục vụ dist/ để kiểm tra bản build
npm run lint       # oxlint
```

### Deploy static

Ứng dụng là SPA thuần tĩnh (`dist/`). Có thể dùng Vercel, Netlify, Cloudflare Pages hoặc GitHub Pages.

**Lưu ý SPA fallback cho `BrowserRouter`:** truy cập trực tiếp hoặc tải lại `/glucose` sẽ 404 nếu server không trả về `index.html`.

| Nền tảng | Cấu hình |
|---|---|
| Vercel | `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |
| Netlify | `public/_redirects`: `/*  /index.html  200` |
| Cloudflare Pages | Mặc định hỗ trợ SPA nếu không có `404.html`; hoặc dùng `_redirects` như Netlify |
| GitHub Pages | Không hỗ trợ rewrite: copy `dist/index.html` thành `dist/404.html`, và nếu deploy ở sub-path đặt `base: '/<repo>/'` trong `vite.config.ts` cùng `basename` cho `BrowserRouter` (hoặc chuyển sang `HashRouter`) |

Dữ liệu IndexedDB gắn với **origin** (giao thức + tên miền + cổng): đổi tên miền hoặc cổng nghĩa là "mất" dữ liệu cũ → dùng export/import khi chuyển.

## 9. Kiểm thử đề xuất

**Unit (Vitest)** — thêm `vitest` vào devDependencies và script `"test": "vitest run"`. Ưu tiên `src/lib/calc.ts` (thuần, rủi ro y khoa cao):

| Nhóm | Ca kiểm thử mẫu |
|---|---|
| Đơn vị | `mgdlToMmol(180) ≈ 9.99`; `mmolToMgdl(mgdlToMmol(x)) ≈ x`; `formatGlucose` làm tròn đúng theo đơn vị |
| HbA1c | `hba1cToEag(7) ≈ 154.2`; `eagToHba1c(hba1cToEag(x)) ≈ x`; `hba1cToIfcc(7) ≈ 53` |
| GMI | `gmi(154) ≈ 7.0` |
| BMI | `bmi(70, 170) ≈ 24.2`; biên `bmiClass`: 18.4 / 18.5 / 22.9 / 23 / 24.9 / 25 / 29.9 / 30 |
| Status | biên `glucoseStatus` (69/70/79/80/130/131/182/183 và sau ăn 180/181/252/253), `bpStatus` (89/60, 129/79, 130/80, 180/120), `egfrStatus` (29/30/59/60), `uacrStatus` (29/30/299/300), `hdlStatus` theo giới |
| Tổng hợp | `timeInRange` (mảng rỗng, biên 70 và 180), `cv` (n < 2 trả `undefined`), `mean` / `stddev` |
| DB | `exportAll` → `clearAll` → `importAll` cho kết quả tương đương (dùng `fake-indexeddb`) |

**Smoke test trên trình duyệt** (thủ công hoặc Playwright):
1. Nạp dữ liệu demo → 7 trang hiển thị không lỗi console, biểu đồ có dữ liệu.
2. Thêm / sửa / xoá một bản ghi mỗi loại; UI cập nhật ngay không cần tải lại.
3. Đổi mg/dL ↔ mmol/L: giá trị hiển thị, trục biểu đồ và ô nhập đổi theo.
4. Đổi theme sáng / tối / hệ thống; biểu đồ đổi màu.
5. Xuất JSON → xoá dữ liệu → nhập lại → số bản ghi khớp.
6. Viewport 360 px: bottom tabs hiển thị, không cuộn ngang; desktop: sidebar hiển thị.
7. Tải lại trực tiếp tại `/glucose` trên bản preview/deploy không bị 404.
