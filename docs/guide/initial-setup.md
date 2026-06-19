# Thiết lập ban đầu

Sau khi bạn đã cài đặt xong theo tài liệu [Cài đặt](./installation.md), bạn cần thực hiện một số bước thiết lập cơ bản để hệ thống sẵn sàng sử dụng.

## 1. Cấu hình Cơ sở dữ liệu (Database)

Hệ thống sử dụng ORM Sequelize. Lần đầu tiên chạy, hệ thống có thể tự động tạo các bảng (nếu được cấu hình `sync()`).

Hãy đảm bảo rằng bạn đã tạo một database trống trên SQL Server với tên giống như cấu hình trong `.env` của thư mục `be/`:
```sql
CREATE DATABASE intern_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Tạo tài khoản Admin đầu tiên

Hiện tại hệ thống cần một tài khoản có vai trò Quản lý (Manager/Admin) để bắt đầu phân công công việc.
Nếu hệ thống có chức năng Seeder, hãy chạy lệnh seed của Sequelize để tạo tài khoản mặc định. Nếu không, bạn có thể đăng ký một tài khoản mới qua giao diện Frontend hoặc chèn trực tiếp vào cơ sở dữ liệu:

```sql
INSERT INTO persons (name, email, password, role) VALUES ('Admin', 'admin@example.com', 'your_hashed_password', 'manager');
```
*(Lưu ý: Mật khẩu thực tế được mã hóa bằng bcrypt, vui lòng insert mật khẩu đã được hash trên web https://bcrypt-generator.com/ với round = 10).*

## 3. Cấu hình Email (Nodemailer)

Để tính năng gửi thông báo khi có task mới hoạt động, bạn cần cung cấp tài khoản SMTP vào file `.env` của Backend:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```
*(Nếu dùng Gmail, hãy sử dụng **App Password** thay vì mật khẩu thông thường).*

## 4. Hoàn tất
Truy cập Frontend, đăng nhập bằng tài khoản Admin bạn vừa tạo. Bạn sẽ được chuyển hướng tới trang Dashboard. Lúc này, bạn đã có thể bắt đầu tạo tài khoản cho thực tập sinh và giao việc.
