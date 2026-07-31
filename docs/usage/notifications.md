# Thông báo và Email (Notifications)

Hệ thống cung cấp tính năng thông báo đa kênh song song (Web Notification trực quan, Web Push bất đồng bộ và Email tự động) giúp người dùng và quản trị viên cập nhật thông tin theo thời gian thực mà không bỏ lỡ các công việc hay yêu cầu quan trọng.

---

## 1. Thông báo trên Web (Header Notification)

- **Vị trí**: Biểu tượng quả chuông ở góc trên bên phải thanh Header. Hiển thị badge màu đỏ kèm số lượng thông báo chưa đọc.
- **Tự động làm mới**: Hệ thống tự động đồng bộ và cập nhật thông báo mới mỗi 30 giây.
- **Đánh dấu tất cả đã đọc**: Cho phép người dùng chuyển toàn bộ thông báo chưa đọc sang trạng thái đã đọc chỉ bằng một cú nhấp chuột (`Đánh dấu tất cả là đã đọc`).

### Phân loại giao diện trực quan (Visual Category Badges)
Các thông báo được tự động phân loại bằng Icon và màu sắc nhận diện riêng biệt giúp người dùng dễ dàng theo dõi:
- 💬 **Bình luận mới trong công việc**: Icon trò chuyện màu xanh lá (Emerald).
- 📋 **Công việc mới được giao**: Icon danh sách công việc màu xanh ngọc (Teal).
- ✅ **Đơn đã được duyệt**: Icon dấu tích xanh (Green).
- ❌ **Đơn bị từ chối**: Icon dấu X màu đỏ (Rose).
- 📄 **Yêu cầu đơn từ mới**: Icon văn bản màu xanh tím (Indigo).
- ⚠️ **Cảnh báo hệ thống**: Icon cảnh báo màu đỏ (Rose).
- ⏰ **Nhắc nhở lịch làm việc / deadline**: Icon đồng hồ màu vàng (Amber).

### Duyệt đơn nhanh trực tiếp trên thông báo (Inline Quick Actions)
- **Thao tác nhanh cho Quản lý / Nâng cao năng suất**: Khi nhận được thông báo yêu cầu mới (Nghỉ phép, Đăng ký làm việc, Ngoại lệ đi muộn/về sớm...), Người quản lý có thể bấm trực tiếp nút **Đồng ý** hoặc **Từ chối** ngay trong danh sách thông báo thả xuống.
- Trạng thái xử lý đơn sẽ được cập nhật thời gian thực lập tức mà không cần phải di chuyển tới trang Quản lý yêu cầu.

### Điều hướng thông minh
- Nhấp vào bất kỳ thông báo nào sẽ tự động đánh dấu thông báo đó là "đã đọc" và tự động điều hướng người dùng tới trang chi tiết công việc (`/tasks/:id`) hoặc lịch sử đơn đăng ký (`/history/:id`).

---

## 2. Email tự động (SMTP Service)

Hệ thống tự động gửi email tới hòm thư cá nhân của người dùng đối với các sự kiện quan trọng:
- Được giao nhiệm vụ / công việc mới.
- Khi có đơn đăng ký mới gửi tới Quản lý chờ phê duyệt.
- Khi đơn đăng ký của nhân viên được duyệt hoặc từ chối.
- Đính kèm liên kết trực tiếp mở nhanh giao diện công việc / đơn từ tương ứng.

> 💡 **Lưu ý cấu hình**: Để tính năng Email hoạt động, quản trị viên hệ thống cần đảm bảo đã cấu hình đầy đủ thông tin SMTP (`EMAIL_USER`, `EMAIL_PASS`, `SMTP_HOST`, `SMTP_PORT`) trong phần biến môi trường (`.env`). Người dùng cần kiểm tra mục Spam/Junk nếu chưa thấy email gửi tới.

---

## 3. Kiến trúc Redis & Hàng đợi Thông báo (Redis Queue Architecture)

Hệ thống sử dụng **Redis** kết hợp với **BullMQ** để xử lý hàng đợi thông báo bất đồng bộ, giúp nâng cao hiệu năng và đảm bảo hệ thống không bị nghẽn (non-blocking) khi số lượng người dùng lớn.

```
[Sự kiện Trigger] 
       │
       ▼
 1. Lưu CSDL (MySQL) ──► Hiển thị ngay trên Web
       │
       ▼
 2. Push Job vào Redis (BullMQ - notification-queue)
       │
       ▼
 3. Worker (notificationWorker.js) đọc Job bất đồng bộ
       │
       ▼
 4. Gửi Web Push (OneSignal API) / Email tự động đến thiết bị
```

### Chi tiết luồng xử lý:
1. **Trigger sự kiện**: Khi người dùng giao công việc, gửi đơn từ hoặc bình luận, dịch vụ thông báo (`notificationService.js`) sẽ kích hoạt.
2. **Lưu CSDL**: Bản ghi thông báo lập tức được ghi vào bảng `notification` trong CSDL để người dùng xem trực tiếp trên Web.
3. **Queue bất đồng bộ qua Redis**:
   - Hệ thống khởi tạo hàng đợi `notification-queue` nối tới Redis (`be/utils/queue.js`).
   - Đẩy thông tin Push (`send-push`) vào hàng đợi Redis với chế độ **thử lại tự động 3 lần (3 attempts with exponential backoff)** nếu gặp sự cố mạng.
4. **Worker chạy nền (Background Worker)**:
   - Tiến trình Worker (`be/workers/notificationWorker.js`) chạy ngầm, liên tục tiêu thụ các Job trong Redis để gửi Web Push Notification qua dịch vụ OneSignal.
   - Nhờ kiến trúc này, thao tác của người dùng trên Web luôn phản hồi tức thì mà không phải chờ quá trình gửi Push/Email hoàn tất.

---

## 4. Lưu ý cho Thiết bị Di động & Điện thoại ROM Nội Địa (Xiaomi, Vivo, OPPO...)

Các thiết bị Android chạy **ROM nội địa** (như Xiaomi HyperOS/MIUI nội địa Trung Quốc, Vivo OriginOS, OPPO ColorOS/OriginOS...) thường có cơ chế tối ưu hóa pin và quản lý ứng dụng chạy nền rất nghiêm ngặt, có thể chặn ứng dụng nhận thông báo Push khi ứng dụng chạy ngầm hoặc tắt màn hình.

### Hướng dẫn cài đặt cấp quyền thông báo:
1. **Bật thông báo ứng dụng**:
   - Vào `Cài đặt` (Settings) ➔ `Quản lý ứng dụng` (Apps) ➔ Chọn ứng dụng **IMA Calendar / QLTT**.
   - Tìm mục **Quản lý thông báo** (Notifications) ➔ Cho phép tất cả các loại thông báo (Banner, Màn hình khóa, Âm thanh, Huy hiệu).
2. **Cho phép hoạt động dưới nền**:
   - Trong phần Cài đặt ứng dụng ➔ Chọn tab **Pin / Mức sử dụng pin** (Battery / Battery usage).
   - Chọn mục **Cho phép hoạt động dưới nền** (Allow background activity) hoặc đặt chế độ **Không hạn chế** (No restrictions / Unrestricted).
   - Bật thêm quyền **Tự khởi chạy** (Autostart / Auto-launch) nếu có.

> ⚠️ **Lưu ý hạn chế**: Mặc dù đã cài đặt đầy đủ các bước trên, một số mẫu điện thoại ROM nội địa vẫn có thể bị hệ điều hành diệt tiến trình ngầm (Kill background process), dẫn tới việc không hiển thị thông báo Push ứng dụng.

### 💡 Giải pháp tối ưu:
Để đảm bảo nhận thông báo đẩy ổn định và chuẩn xác nhất trên các thiết bị ROM nội địa, người dùng nên **sử dụng trực tiếp ứng dụng trên Google Chrome Mobile**:
1. Mở địa chỉ website hệ thống trên trình duyệt **Google Chrome** trên điện thoại.
2. Khi trình duyệt hỏi cấp quyền nhận thông báo, chọn **Cho phép (Allow)**.
3. Trong cài đặt của Chrome, vào mục **Thông báo**, tích chọn **Các trang web có thể yêu cầu gửi thông báo**.

<p align="center">
  <img
    src="/screenshots/manager/chrome.jpeg"
    alt="Mapping Tasks"
    width="200"
  />
</p>


4. (Khuyến nghị) Nhấp vào menu 3 chấm góc trên bên phải Chrome ➔ Chọn **"Cài đặt và tạo lỗ tắt" (Add to Home screen)** để cài đặt ứng dụng Web PWA. Thông báo qua Google Chrome Mobile sẽ hoạt động cực kỳ ổn định và không bị bỏ lỡ.

<p align="center">
  <img
    src="/screenshots/manager/chrome2.jpeg"
    alt="Mapping Tasks"
    width="400"
  />
</p>