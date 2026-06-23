# Intern Management App (IMA)

Hệ thống quản lý thực tập sinh và phân công công việc nội bộ. Tối ưu hóa quá trình giao việc, báo cáo hằng ngày, quản lý lịch làm việc và xử lý các yêu cầu/đề xuất một cách tự động và trực quan.
Hướng dẫn sử dụng: https://docs-qltt.kis-v.com/

## Tính năng nổi bật

- **Quản lý công việc (Task Management):** Giao việc, theo dõi trạng thái, thời hạn, ưu tiên. Hỗ trợ công việc phụ (Sub-tasks), phân công nhiều người tham gia và bình luận trực tiếp.
- **Import/Export Excel:** Nhập/Xuất hàng loạt danh sách công việc bằng file Excel (.xlsx), hỗ trợ template chuẩn.
- **Báo cáo hằng ngày (Daily Reports):** Thực tập sinh có thể nộp báo cáo tiến độ cuối ngày kèm file đính kèm.
- **Quản lý yêu cầu (Requests):** Xử lý đơn xin phép nghỉ, đăng ký lịch làm việc có xét duyệt và tự động gửi email qua hệ thống.
- **Lịch làm việc (Schedule):** Tích hợp FullCalendar để xem lịch làm việc, thời hạn deadline một cách trực quan.
- **Thông báo & Email (Notifications):** Thông báo theo thời gian thực (Real-time) trên hệ thống và gửi email tự động khi có task mới được giao.
- **Quản lý thông tin tài khoản:** Quản lý tài khoản, phân quyền truy cập theo vai trò(Manager, Employee).

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| **Backend** | Node.js / Express.js |
| **Frontend** | React / Vite / TailwindCSS / HeadlessUI |
| **Database** | MySQL (thông qua Sequelize ORM) |
| **Bảo mật** | JWT (JSON Web Token), bcryptjs, SHA-256 |
| **Tiện ích** | ExcelJS (Xử lý file Excel), Nodemailer (Gửi Email) |

## Kiến trúc hệ thống

```text
                    ┌──────────────┐
   Client ─────────>│ React SPA    │ Port 5173 (Frontend)
                    │ (Vite build) │
                    └──────┬───────┘
                           │ API Requests
                    ┌──────┴───────┐
                    │ Node.js API  │ Port 3000 (Backend)
                    │ (Express.js) │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │   MySQL 8.0  │ Port 3306 (Database)
                    └──────────────┘
```

## Cấu trúc dự án

```text
sern/
├── be/                 # Backend (Node.js API)
│   ├── config/         # Cấu hình kết nối DB, môi trường
│   ├── controllers/    # Xử lý logic API
│   ├── models/         # Sequelize Models (Task, Person, Report,...)
│   ├── routes/         # Định nghĩa các endpoints API
│   ├── services/       # Xử lý logic nghiệp vụ, tích hợp Email, Excel
│   └── app.js          # Entry point của Backend
│
├── fe/                 # Frontend (React SPA)
│   ├── public/         # Các file tài nguyên tĩnh
│   ├── src/            # Mã nguồn chính của Frontend
│   │   ├── components/ # Các UI Component dùng chung (Table, Filter, Select,...)
│   │   ├── context/    # React Context (Auth, Theme,...)
│   │   ├── layouts/    # Bố cục trang (Header, Sidebar,...)
│   │   ├── pages/      # Các trang chính (Tasks, Reports, Schedule,...)
│   │   └── services/   # Gọi API (Fetch, Axios)
│   └── index.html      # Entry point của Frontend
└── README.md           # Tài liệu dự án
```

## Cài đặt và khởi chạy (Môi trường phát triển)

### Yêu cầu hệ thống
- Node.js (v16 trở lên)
- MySQL (v8.0)

### 1. Cài đặt Backend
Di chuyển vào thư mục `be`, cài đặt thư viện và chạy server:
```bash
cd be
npm install
# Cấu hình file .env (Tham khảo mục Biến môi trường bên dưới)
npm run dev
```

### 2. Cài đặt Frontend
Di chuyển vào thư mục `fe`, cài đặt thư viện và chạy môi trường dev:
```bash
cd fe
npm install
# Cấu hình file .env
npm run dev
```

Truy cập: **http://localhost:5173** để xem giao diện hệ thống. Backend API sẽ chạy ở cổng 3000.

## Biến môi trường (.env)

### Backend (`be/.env`)
| Biến | Mô tả |
|------|-------|
| `PORT` | Cổng chạy server API (Mặc định: 3000) |
| `DB_HOST` | Địa chỉ host database (Ví dụ: 127.0.0.1) |
| `DB_PORT` | Cổng database (Ví dụ: 3306) |
| `DB_USER` | Tên user MySQL |
| `DB_PASS` | Mật khẩu MySQL |
| `DB_NAME` | Tên database MySQL |
| `DB_DIALECT` | Loại database (Ví dụ: mssql) |
| `JWT_SECRET` | Secret string để mã hóa JWT |
| `FRONTEND_URL` | URL của Frontend (Dùng trong link Email) |
| `EMAIL_USER` / `EMAIL_PASS` | Tài khoản cấu hình gửi email (Nodemailer) |

### Frontend (`fe/.env (.env.production cho product)`)
| Biến | Mô tả |
|------|-------|
| `VITE_API_URL` | Địa chỉ Backend API (Ví dụ: http://localhost:3000/api) |

## Hướng dẫn sử dụng cơ bản

1. **Đăng nhập:** Đăng nhập vào hệ thống bằng tài khoản do Admin cấp.
2. **Quản lý công việc (Tasks):** 
   - Truy cập trang Tasks để xem danh sách công việc. 
   - Tạo mới, phân công, và đặt deadline.
   - Sử dụng tính năng Import/Export để nhập/xuất nhanh số lượng lớn công việc từ Excel.
3. **Báo cáo (Daily Reports):** Nộp báo cáo cuối ngày ở mục Reports. Quản lý có thể xem và chấm điểm.
4. **Lịch làm việc (Schedule):** Vào mục Schedule để có cái nhìn tổng quan dạng lịch cho tất cả các deadline và sự kiện.
5. **Yêu cầu (Requests):** Dùng mục Requests để xin phép nghỉ, hoặc các vấn đề phát sinh khác.

---
*Dự án Intern Management App (IMA)*
