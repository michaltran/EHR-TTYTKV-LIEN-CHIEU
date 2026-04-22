# Hệ thống Quản lý Hồ sơ Sức khỏe Định kỳ — TTYT khu vực Liên Chiểu

Next.js 14 fullstack app để quản lý quy trình khám sức khỏe định kỳ cho viên chức và người lao động, áp dụng **Mẫu số 03** theo Thông tư 32, tích hợp ký số VNPT SmartCA.

## Tính năng chính

### 5 vai trò người dùng

| Vai trò | Chức năng |
|---|---|
| **ADMIN** | Import Excel, tạo đợt khám, duyệt hồ sơ, xuất báo cáo, xóa NV, in sổ trắng |
| **DOCTOR** | Khám theo chuyên khoa, ký điện tử (canvas / PNG / VNPT SmartCA) |
| **CONCLUDER** | Ký kết luận cuối cùng (có thể ký số SmartCA) |
| **DEPT_REP** | Tổng hợp hồ sơ khoa và gửi lên Admin |
| **EMPLOYEE** | Xem hồ sơ cá nhân |

### Nghiệp vụ đã làm

- **14 chuyên khoa khám** đúng Mẫu số 03 (Nội tuần hoàn/hô hấp/tiêu hóa/..., Ngoại, Da liễu, Sản phụ khoa, Mắt, TMH, RHM)
- **Quick-sign Nội khoa**: Tick nhiều mục "Bình thường" → ký 1 lần cho cả loạt
- **Form chuyên biệt**: Mắt (4 ô có/không kính × P/T), TMH (4 ô nói thường/thầm × P/T), RHM (Hàm trên/dưới)
- **Sản phụ khoa chỉ hiển thị với Nữ** — bao gồm tiền sử kinh nguyệt, PARA, BPTT
- **Cận lâm sàng**: Công thức máu, Sinh hoá, Miễn dịch, Điện tim, X-quang, Siêu âm — có thể upload PDF/ảnh kết quả
- **Chữ ký điện tử 3 chế độ**: Canvas vẽ tay, Upload PNG có sẵn, **Ký số VNPT SmartCA** (có giá trị pháp lý)
- **Chữ ký có metadata đầy đủ**: tên + chức danh + thời gian ký
- **Import/Export Excel**: 18 cột đúng mẫu Bộ Y tế, tự động nhận diện format TTYT cũ hoặc mẫu mới
- **In sổ trắng Mẫu 03**: để phát giấy in hàng loạt
- **Báo cáo tổng thể Excel 4 sheet**: Tổng quan, Theo khoa, Chi tiết, Bất thường chuyên khoa

## Công nghệ

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (Neon/Supabase/Vercel Postgres)
- JWT auth (`jose` + `bcryptjs`), cookie httpOnly
- `react-signature-canvas` cho canvas chữ ký offline
- `xlsx` (SheetJS) cho import/export Excel
- `recharts` cho biểu đồ thống kê
- `@vercel/blob` cho upload file cận lâm sàng
- VNPT SmartCA API v4.0 cho ký số từ xa

## Cấu hình môi trường trên Vercel

Vào project trên Vercel → Settings → Environment Variables, thêm:

### Bắt buộc

```
DATABASE_URL    = postgresql://user:pass@host/dbname?sslmode=require
AUTH_SECRET     = chuỗi-ngẫu-nhiên-dài-tối-thiểu-32-ký-tự
```

### Tùy chọn — VNPT SmartCA (ký số)

Chỉ thêm khi bạn có tài khoản SP từ VNPT. Nếu không có, hệ thống vẫn chạy được với chữ ký canvas/PNG offline.

```
VNPT_SCA_URL          = https://gwsca.vnpt.vn/sca/sp769
                        # hoặc UAT: https://rmgateway.vnptit.vn/sca/sp769
VNPT_SCA_SP_ID        = <Client ID VNPT cấp>
VNPT_SCA_SP_PASSWORD  = <Client Secret VNPT cấp>
```

**Webhook URL** (đăng ký với VNPT khi tạo SP):
```
https://<your-domain>.vercel.app/api/smartca/webhook
```

### Tùy chọn — Vercel Blob (upload file cận lâm sàng)

Vào tab **Storage** của project → **Create** → **Blob** → đặt tên `healthcheck-files`. Vercel sẽ tự thêm biến `BLOB_READ_WRITE_TOKEN`. Nếu không cấu hình, file sẽ lưu base64 trong DB (không khuyến nghị cho file lớn).

## Deploy

### 1. Push lên GitHub

```bash
git init
git add .
git commit -m "Initial"
git branch -M main
git remote add origin https://github.com/<username>/healthcheck-lienchieu.git
git push -u origin main
```

### 2. Tạo Neon Postgres

1. Vào https://neon.tech → Create project
2. Region: **Singapore** (gần VN nhất)
3. Copy connection string dạng `postgresql://...`

### 3. Deploy Vercel

1. vercel.com/new → Import repo GitHub
2. Thêm các biến môi trường ở mục trên
3. Deploy (~2-3 phút). Vercel tự chạy `prisma generate && prisma db push && next build`.

### 4. Khởi tạo tài khoản

Sau khi deploy xong, truy cập `https://<app>.vercel.app/setup` → bấm **"Chạy khởi tạo"** để tạo 8 tài khoản demo và đợt khám mẫu.

### Tài khoản demo

| Role | Email | Password |
|---|---|---|
| Admin | admin@lienchieu.vn | admin123 |
| BS kết luận | giamdoc@lienchieu.vn | conclude123 |
| BS Nội | bs.noikhoa@lienchieu.vn | doctor123 |
| BS Ngoại | bs.ngoai@lienchieu.vn | doctor123 |
| BS Sản phụ | bs.sanphu@lienchieu.vn | doctor123 |
| BS Mắt | bs.mat@lienchieu.vn | doctor123 |
| BS TMH | bs.tmh@lienchieu.vn | doctor123 |
| BS RHM | bs.rhm@lienchieu.vn | doctor123 |

> **Đổi mật khẩu ngay** trong production: Admin → Tài khoản → Đổi MK.

## Kịch bản end-to-end

1. **Admin**: Import Excel NV (hoặc tạo qua UI) → tạo Đợt khám → Generate hồ sơ → Mở đợt → Gửi thông báo
2. **Bác sĩ**: Kích hoạt VNPT SmartCA trong profile (nhập CCCD) → Vào hàng đợi → Khám từng NV → Ký SmartCA hoặc canvas
3. **Đại diện khoa**: Tổng hợp → Gửi lên Admin
4. **Admin**: Xem hồ sơ → Duyệt → Chuyển BS kết luận
5. **BS kết luận**: Nhập phân loại + kết luận → Ký VNPT SmartCA → Hoàn tất
6. **Admin**: In PDF Mẫu 03 → Xuất báo cáo tổng thể Excel

## Cấu trúc thư mục

```
healthcheck-app/
├── prisma/schema.prisma           # 10 models + 8 enums
├── src/
│   ├── app/
│   │   ├── admin/                 # Portal quản trị
│   │   ├── doctor/                # Portal bác sĩ khám
│   │   ├── conclude/              # Portal kết luận
│   │   ├── dept/                  # Portal đại diện khoa
│   │   ├── me/                    # Portal nhân viên
│   │   ├── records/[id]/print/    # In Mẫu số 03
│   │   ├── records/blank/         # Sổ trắng
│   │   ├── api/
│   │   │   ├── smartca/           # VNPT SmartCA endpoints
│   │   │   ├── admin/             # Admin API (employees, users, rounds...)
│   │   │   ├── doctor/            # Doctor API (vitals, exam, exam-text)
│   │   │   ├── paraclinical/      # Upload CLS
│   │   │   ├── conclude/[id]/     # Kết luận
│   │   │   └── setup/             # 1-click khởi tạo tài khoản
│   │   ├── setup/page.tsx         # UI khởi tạo
│   │   └── login/page.tsx
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── EmployeeForm.tsx
│   │   ├── SignaturePad.tsx       # Canvas + upload PNG
│   │   ├── SmartCASignButton.tsx  # Ký số VNPT
│   │   ├── SignatureDisplay.tsx
│   │   └── ParaclinicalPanel.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── constants.ts
│   │   └── vnpt-smartca.ts        # VNPT client
│   └── middleware.ts
└── README.md
```

## Ghi chú quan trọng về chữ ký số

- **Chữ ký canvas/PNG**: không có giá trị pháp lý, chỉ dùng quy trình nội bộ
- **Chữ ký VNPT SmartCA**: có giá trị pháp lý theo Luật Giao dịch điện tử, chứng thư do VNPT-CA cấp phát
- Hệ thống phân biệt 2 loại bằng prefix `CA:...` trong `signatureDataUrl` — trang in Mẫu 03 render khác nhau
- Hash SHA256 của nội dung khám được gửi đến VNPT (hash-based signing), không gửi cả file PDF
- Webhook xử lý callback async khi user xác nhận trên app SmartCA điện thoại
- Hệ thống cũng polling mỗi 3 giây (fallback nếu webhook không đến)
- Log ký số lưu trong model `CaSignTransaction` để audit

## Giấy phép

Software Copyright Powered by Dat Dat. Dùng nội bộ TTYT khu vực Liên Chiểu.
