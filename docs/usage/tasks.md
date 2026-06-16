# Quản lý Công việc (Tasks)

Module **Tasks** là trái tim của hệ thống Intern Management App, giúp người quản lý phân công công việc và theo dõi tiến độ một cách rõ ràng.

## Tạo Công việc mới

1. Truy cập vào menu **Tasks** bên tay trái.
2. Nhấn nút **Tạo mới** (Add Task).
3. Điền các thông tin cơ bản:
   - **Tên công việc (Title):** Mô tả ngắn gọn việc cần làm.
   - **Người được giao (Participants):** Chọn danh sách thực tập sinh hoặc nhân viên sẽ thực hiện.
   - **Ưu tiên (Priority):** Thấp (Low), Trung bình (Medium), Cao (High).
   - **Hạn chót (Due Date):** Ngày giờ bắt buộc hoàn thành.
4. Nhấn **Lưu** để hệ thống tạo task và tự động gửi email thông báo cho người nhận.

<!-- ![Tạo công việc](/screenshots/tao-cong-viec.png) -->

## Công việc phụ (Sub-tasks)

Mỗi công việc lớn có thể được chia nhỏ thành các **Sub-tasks**.
- Trong trang Chi tiết công việc (Task Detail), cuộn xuống phần **Sub-tasks**.
- Nhấn **Thêm Sub-task** và điền tên, thời hạn cho các công việc nhỏ.
- Quản lý trạng thái từng Sub-task độc lập để biết tỷ lệ hoàn thành công việc lớn.

## Trạng thái Công việc

Có 4 trạng thái chính:
- **Pending:** Đã tạo, đang chờ xử lý.
- **In Progress:** Người được giao đã bắt đầu làm việc.
- **Completed:** Công việc đã hoàn thành.
- **Overdue:** Hệ thống tự động chuyển sang trạng thái này nếu quá hạn (Due Date) mà chưa hoàn thành.

## Thảo luận & Bình luận

Mỗi Task đều có khu vực bình luận để mọi người trong dự án trao đổi.
- Nhập bình luận vào ô ở cuối trang chi tiết.
- Bạn có thể tải lên tài liệu đính kèm cùng với bình luận.
