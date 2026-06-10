# Tài liệu REST API

Dưới đây là một số endpoint API chính của Backend (Node.js/Express.js). Các Endpoint chi tiết có thể được tham khảo trong mã nguồn (routes/controllers).

Tất cả các API thường được gọi thông qua tiền tố `/api`.
*(Ví dụ: `http://localhost:3000/api/task`)*

## 1. Authentication (Xác thực)
- `POST /auth/login`: Đăng nhập, trả về Access Token (JWT).
- `POST /auth/register`: Đăng ký tài khoản.
- `POST /auth/refresh-token`: Cấp lại Access Token mới.

## 2. Tasks (Công việc)
*(Cần đính kèm Bearer Token ở Header)*
- `GET /task`: Lấy danh sách tất cả các Task.
- `POST /task`: Tạo mới một Task (yêu cầu Title, Due Date, Priority...).
- `GET /task/:id`: Lấy thông tin chi tiết một Task.
- `PUT /task/:id`: Cập nhật Task.
- `DELETE /task/:id`: Xóa Task.
- `POST /task/import`: Import file Excel.
- `GET /task/export`: Export danh sách ra file Excel.

## 3. Reports (Báo cáo)
- `GET /report`: Xem danh sách Daily Reports.
- `POST /report`: Tạo báo cáo ngày mới.

## 4. Requests (Yêu cầu)
- `GET /request`: Xem danh sách Requests (Đơn từ, đề xuất).
- `POST /request`: Nộp một Request mới.
- `PUT /request/:id/approve`: Cập nhật trạng thái duyệt (Approve/Reject).

*Lưu ý: Một số API chỉ có thể gọi bằng tài khoản có Role là `Manager`.*
