# Câu hỏi thường gặp (FAQ) & Xử lý lỗi

Dưới đây là một số vấn đề phổ biến bạn có thể gặp phải trong quá trình cài đặt hoặc sử dụng Intern Management App (IMA) và cách khắc phục.

## 1. Import Excel bị lỗi "Import thất bại"

**Nguyên nhân:** File Excel của bạn tải lên không đúng định dạng cột hoặc một số dòng thiếu dữ liệu bắt buộc (ví dụ thiếu `title`, hoặc `status`, `priority` không hợp lệ).

**Cách khắc phục:**
- Kiểm tra chi tiết thông báo lỗi hiển thị trên màn hình. Hệ thống sẽ báo rõ dòng nào bị lỗi và nguyên nhân (ví dụ: `Dòng 2: Vui lòng nhập title`).
- Đảm bảo các giá trị trong cột `status` chỉ nằm trong danh sách: `pending`, `in progress`, `completed`, `overdue`.
- Đảm bảo các giá trị trong cột `priority` chỉ nằm trong danh sách: `low`, `medium`, `high`.
- Bạn có thể tải **Import Template** (file mẫu) về, điền dữ liệu vào và thử lại.

## 2. Tôi không nhận được Email thông báo

**Nguyên nhân:** Máy chủ chưa được cấu hình đúng tài khoản email gửi đi (SMTP), hoặc email bị rơi vào hòm thư rác (Spam).

**Cách khắc phục:**
- Kiểm tra hộp thư rác (Spam/Junk) của bạn.
- Liên hệ quản trị viên (Admin) kiểm tra lại file cấu hình biến môi trường `.env` (`EMAIL_USER`, `EMAIL_PASS`).

## 3. Quên mật khẩu đăng nhập

**Cách khắc phục:**
Tính năng cấp lại mật khẩu hiện được quản lý bởi Admin. Vui lòng liên hệ với người quản lý (Manager) hoặc Quản trị viên hệ thống để được cấp lại mật khẩu mới.

## 4. Dữ liệu trên Dashboard không cập nhật

**Nguyên nhân:** Trình duyệt có thể lưu bộ nhớ đệm (cache) cũ.

**Cách khắc phục:**
- Thử tải lại trang (nhấn F5 hoặc Ctrl + R).
- Đăng xuất và đăng nhập lại hệ thống để làm mới các token truy cập.

---

Nếu vấn đề của bạn vẫn chưa được giải quyết, vui lòng liên hệ quản trị viên hệ thống.
