# Import / Export Excel

Hệ thống hỗ trợ tính năng Import và Export dữ liệu qua file Excel (.xlsx) giúp người dùng và quản trị viên tiết kiệm thời gian khi làm việc với khối lượng dữ liệu lớn. Hiện tại, tính năng này được tích hợp tại 2 trang chính: **Quản lý Công việc (`/tasks`)** và **Quản lý Giờ công (`/admin/work-hours`)**.

---

## 1. Quản lý Công việc (`/tasks`)

### Export (Xuất danh sách công việc)
- Tại trang **Tasks**, nhấn nút **Export** để xuất danh sách các công việc theo bộ lọc hiện tại.
- Hệ thống sẽ tự động tải xuống file Excel chứa đầy đủ thông tin: `Task ID`, `Title`, `Assigner` (Người giao), `Participants` (Người thực hiện), `Status`, `Priority`, `Start Time`, `Due Date`.

### Import (Tải lên danh sách công việc hàng loạt)
1. **Tải file mẫu (Template)**: Nhấn nút **Download Template** để lấy cấu trúc file Excel chuẩn.
2. **Chuẩn bị dữ liệu**:
   - `Title` (Tên công việc): Trường bắt buộc.
   - `Status`: Nhận các giá trị `pending` (Chưa bắt đầu), `in progress` (Đang làm), `completed` (Hoàn thành).
   - `Priority`: Nhận các giá trị `low`, `medium`, `high`.
   - `Start Time` / `Due Date`: Định dạng ngày giờ chuẩn.
3. **Tải file & Xem trước (Review Modal)**:
   - Nhấn **Import**, chọn file Excel cần tải lên.
   - Hệ thống sẽ hiển thị **Modal Xem trước (Import Review Modal)** trước khi lưu vào cơ sở dữ liệu:
     - **Ưu tiên dòng hợp lệ**: Tất cả các dòng dữ liệu hợp lệ (`isValid: true`) được tự động sắp xếp lên phía trên cùng.
     - **Phân loại dòng lỗi**: Các dòng bị lỗi (thiếu tiêu đề, sai định dạng...) sẽ nằm phía dưới kèm thông báo chi tiết lý do lỗi từng ô.
     - **Sticky Header**: Thanh tiêu đề bảng ghim cố định giúp cuộn xem danh sách dài dễ dàng.
     - **Giao diện Responsive**: Tối ưu hiển thị và cuộn trên các thiết bị di động.
4. **Xác nhận**: Kiểm tra thông tin và nhấn **Xác nhận Import** để hoàn tất.

---

## 2. Quản lý Giờ công (`/admin/work-hours`)

### Export (Xuất báo cáo giờ công)
- Quản trị viên chọn khoảng thời gian cần báo cáo tại trang **Quản lý Giờ công (`/admin/work-hours`)**.
- Nhấn **Export** để tải về file Excel báo cáo tổng hợp giờ làm việc, giờ check-in / check-out của nhân viên.

### Import (Nhập dữ liệu giờ công / chấm công từ Excel)
1. **Định danh Nhân viên trong file Excel**:
   - Trường **Mã NV / Mã nhân viên** trong file Excel tương ứng với **`company_card`** (Mã thẻ từ công ty ngoài đời thực của nhân viên), **không dùng `person_id`** (do `person_id` là ID tự tăng nội bộ của hệ thống).
   - Lưu ý: Quản trị viên cần truy cập vào trang **https://qltt.kis-v.com/admin/employees** để thiết lập mã thẻ cho nhân viên tương ứng với mã nhân viên trong file excel được xuất từ máy chấm công.
2. **Cấu trúc dữ liệu nhập vào**:
   - `Mã NV` (`company_card`): Mã thẻ từ của nhân viên (ví dụ: `00001`).
   - `Họ và tên`: Tên nhân viên để đối soát.
   - `Ngày làm việc`: Định dạng ngày `YYYY-MM-DD` hoặc `DD/MM/YYYY`.
   - `Giờ vào` (`check_in`): Thời gian check-in (ví dụ: `08:00`).
   - `Giờ ra` (`check_out`): Thời gian check-out (ví dụ: `17:30`).
3. **Modal Xem trước dữ liệu (Import Review Modal)**:
   - Khi tải file Excel chấm công lên, giao diện Review Modal sẽ kiểm tra dữ liệu theo thời gian thực:
     - Tự động kiểm tra Mã thẻ (`company_card`) xem nhân viên có tồn tại trong hệ thống hay không.
     - **Dòng hợp lệ đẩy lên trên**: Các bản ghi chấm công chuẩn xác được ưu tiên hiển thị ở các dòng đầu tiên của bảng xem trước.
     - **Cảnh báo lỗi rõ ràng**: Dòng chứa mã thẻ không tồn tại hoặc sai định dạng giờ sẽ được xếp ở cuối bảng kèm lý do chi tiết.
     - Bảng xem trước có **Sticky Header** và hỗ trợ hiển thị tối ưu trên thiết bị di động.
4. **Xác nhận Import**: Quản trị viên rà soát các dòng hợp lệ và nhấn **Xác nhận Import** để cập nhật dữ liệu chấm công vào hệ thống.

---

## 3. Các lưu ý chung khi Import Excel

- **Định dạng file**: Hệ thống hỗ trợ file `.xlsx` và `.xls`.
- **Dung lượng**: Nên chia nhỏ file nếu có trên 1,000 dòng dữ liệu để đảm bảo tốc độ phản hồi tốt nhất.
- **Tính an toàn dữ liệu**: Hệ thống luôn hiển thị bước **Review & Xác nhận** trước khi ghi dữ liệu vào CSDL, giúp ngăn ngừa rủi ro đè dữ liệu sai.
