# Quản lý Tài khoản & Phân quyền

Tính năng Quản lý người dùng cho phép Quản trị viên (Admin) hoặc Quản lý (Manager) thêm, sửa, xóa các tài khoản và phân công vai trò (Roles) trong hệ thống Intern Management App.

## Các vai trò (Roles)

Hệ thống cung cấp cơ chế phân quyền RBAC (Role-Based Access Control) với các vai trò mặc định:

1. **Manager (Quản lý):**
   - Có toàn quyền truy cập: xem, thêm, sửa, xóa (CRUD) các Task, Report, Request.
   - Có thể quản lý và duyệt các Request từ thực tập sinh.
   - Được phân công công việc (Assigner).

2. **Employee / Intern (Thực tập sinh/Nhân viên):**
   - Chỉ có thể xem danh sách Task được phân công cho mình.
   - Nộp báo cáo (Daily Report) và gửi yêu cầu (Leave Request, Equipment Request).
   - Được thêm vào Task dưới dạng Participants.

## Thêm tài khoản mới

1. Đăng nhập với quyền Manager.
2. Điều hướng đến giao diện quản lý tài khoản (Users/Employees).
3. Nhấn **Thêm mới**.
4. Cung cấp:
   - Họ và tên
   - Email đăng nhập
   - Mật khẩu mặc định (Có thể thiết lập tự động cấp mật khẩu và gửi qua email).
   - Vai trò (Role).

![Quản lý Users](public/screenshots/manager/usermanagement.png)
