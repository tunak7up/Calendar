# Cấu hình Biến môi trường (.env)

Hệ thống IMA phân tách cấu hình giữa Backend và Frontend bằng các biến môi trường (Environment Variables). 

## Backend (`be/.env`)

File cấu hình này thường nằm tại thư mục gốc `be/`. Nếu triển khai bằng Docker Compose, bạn có thể tạo `.env` ở thư mục gốc chứa `docker-compose.yml`.

| Biến | Ý nghĩa | Ví dụ |
|------|---------|-------|
| `PORT` | Cổng để server Node.js chạy | `3000` |
| `DB_HOST` | Địa chỉ IP / Domain của MySQL | `127.0.0.1` |
| `DB_PORT` | Cổng MySQL | `3306` |
| `DB_USER` | Tên người dùng MySQL | `root` |
| `DB_PASS` | Mật khẩu MySQL | `123456` |
| `DB_NAME` | Tên CSDL (Database) | `intern_management` |
| `DB_DIALECT` | Hệ quản trị CSDL đang dùng | `mysql` hoặc `mssql` |
| `JWT_SECRET` | Khóa bí mật dùng để mã hóa Access Token | `sieu_bao_mat_jwt_123` |
| `FRONTEND_URL` | URL công khai của Frontend (để chèn vào nội dung email) | `http://localhost:5173` |
| `EMAIL_USER` | Email dùng để gửi tự động (Nodemailer) | `admin@gmail.com` |
| `EMAIL_PASS` | Mật khẩu ứng dụng (App Password) của Email | `abcd efgh ijkl mnop` |

## Frontend (`fe/.env`)

Với các dự án dùng Vite, biến môi trường của Frontend thường có tiền tố `VITE_`.

| Biến | Ý nghĩa | Ví dụ |
|------|---------|-------|
| `VITE_API_URL` | URL chỉ định để các hàm fetch gọi tới Backend | `http://localhost:3000/api` |

Khi Build lên Production, bạn nên tạo file `.env.production` để khai báo `VITE_API_URL` là domain thực tế (ví dụ `https://api.ima.com/api`).
