# Hướng dẫn thiết lập AWS Lambda & EventBridge Scheduler cho Hệ thống Điểm danh

Tài liệu này hướng dẫn chi tiết từng bước thao tác trên **AWS Console** để cấu hình AWS Lambda kết hợp Amazon EventBridge Scheduler kích hoạt nạp lịch điểm danh lúc **00:01 hàng ngày** (giờ Việt Nam).

---

## BƯỚC 1: TẠO LAMBDA FUNCTION TRÊN AWS CONSOLE

1. Đăng nhập vào [AWS Management Console](https://console.aws.amazon.com/).
2. Chọn Region bạn muốn dùng (khuyến nghị **ap-southeast-1 (Singapore)** để có độ trễ về Việt Nam thấp nhất).
3. Tìm kiếm dịch vụ **Lambda** trên thanh tìm kiếm và truy cập vào trang Lambda.
4. Nhấn nút màu cam **Create function**.
5. Cấu hình cơ bản:
   - Chọn: **Author from scratch**.
   - **Function name**: `calendar-daily-attendance-scheduler`
   - **Runtime**: Chọn **Node.js 20.x** (hoặc Node.js 18.x / 22.x).
   - **Architecture**: `x86_64` (mặc định).
   - **Permissions**: Để mặc định (*Create a new role with basic Lambda permissions*).
6. Nhấn nút **Create function** ở góc dưới cùng.

---

## BƯỚC 2: DÁN MÃ NGUỒN VÀO LAMBDA

1. Trong trang chi tiết của Function vừa tạo, kéo xuống mục **Code source**.
2. Mở file `index.mjs` trong trình soạn thảo code trên web.
3. Xóa toàn bộ nội dung mẫu và dán toàn bộ nội dung từ file [`dailyScheduler.mjs`](./dailyScheduler.mjs) vào:
   ```javascript
   export const handler = async (event, context) => {
     const backendUrl = process.env.BACKEND_URL;
     const cronSecret = process.env.CRON_SECRET_TOKEN;

     if (!backendUrl) {
       const errorMsg = 'BACKEND_URL environment variable is not configured on Lambda!';
       console.error(`[Lambda Daily Scheduler] ❌ ${errorMsg}`);
       return { statusCode: 500, body: JSON.stringify({ success: false, error: errorMsg }) };
     }

     console.log(`[Lambda Daily Scheduler] ⏰ Bắt đầu kích hoạt webhook tại: ${backendUrl}`);

     if (!cronSecret) {
       const errorMsg = 'CRON_SECRET_TOKEN environment variable is not configured on Lambda!';
       console.error(`[Lambda Daily Scheduler] ❌ ${errorMsg}`);
       return { statusCode: 500, body: JSON.stringify({ success: false, error: errorMsg }) };
     }

     try {
       const response = await fetch(backendUrl, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'x-cron-secret': cronSecret,
           'User-Agent': 'AWS-Lambda-DailyScheduler/1.0'
         },
         body: JSON.stringify({
           source: 'aws_lambda',
           triggerTime: event?.time || new Date().toISOString(),
           awsRequestId: context?.awsRequestId || null
         })
       });

       const data = await response.json().catch(() => null);

       if (!response.ok) {
         throw new Error(`Backend returned HTTP ${response.status}: ${JSON.stringify(data)}`);
       }

       console.log(`[Lambda Daily Scheduler] ✅ Thành công! Kết quả từ Backend:`, data);
       return {
         statusCode: 200,
         body: JSON.stringify({ success: true, backendResponse: data })
       };
     } catch (error) {
       console.error(`[Lambda Daily Scheduler] ❌ Lỗi khi gửi webhook:`, error.message);
       throw error;
     }
   };
   ```
4. Nhấn nút **Deploy** (màu xanh/xám) ngay phía trên khung code để lưu mã nguồn.

---

## BƯỚC 3: CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

1. Chuyển sang tab **Configuration** (nằm cạnh tab Code).
2. Chọn menu **Environment variables** ở cột bên trái.
3. Nhấn nút **Edit** và thêm 2 biến sau:
   - **Key 1**: `BACKEND_URL`  
     **Value 1**: `https://<YOUR_BACKEND_DOMAIN>/api/internal/cron/daily-scheduler`
   - **Key 2**: `CRON_SECRET_TOKEN`  
     **Value 2**: Mã token bí mật trong file môi trường `.env.docker` của bạn
4. Nhấn **Save**.

---

## BƯỚC 4: THỬ NGHIỆM CHẠY THỬ (TEST LAMBDA)

1. Chuyển sang tab **Test**.
2. Mục **Test event action**: chọn **Create new event**.
3. **Event name**: `TestDailyTrigger`
4. Để nguyên JSON mẫu `{}` và nhấn nút **Save**.
5. Nhấn nút **Test** màu cam.
6. Kết quả sẽ hiện ra ngay trong khung **Execution result**:
   - Nếu hiện màu xanh lá cây `Status: Succeeded` và có log trả về từ Backend: **CHÚC MỪNG, BẠN ĐÃ KẾT NỐI THÀNH CÔNG!**

---

## BƯỚC 5: ĐẶT LỊCH CHẠY 00:01 HÀNG NGÀY BẰNG EVENTBRIDGE SCHEDULER

1. Trên thanh tìm kiếm AWS Console, gõ tìm **Amazon EventBridge**.
2. Ở thanh menu bên trái, tìm mục **Schedules** (nằm dưới nhóm *Scheduler*).
3. Nhấn nút cam **Create schedule**.
4. **Schedule details (Bước 1/4)**:
   - **Schedule name**: `trigger-daily-attendance-at-0001`
   - **Schedule group**: `default`
   - **Occurrence**: Chọn **Recurring schedule** (Lịch lặp lại định kỳ).
   - **Timezone**: Chọn **Asia/Ho_Chi_Minh (GMT+07:00)**.
   - **Schedule type**: Chọn **Cron-based schedule**.
   - **Cron expression**: Nhập `1 0 * * ? *` *(Nghĩa là: Phút 1, Giờ 0, Mỗi ngày trong tháng, Mỗi tháng, Bất kỳ thứ nào, Mỗi năm)*.
   - Nhấn **Next**.
5. **Select target (Bước 2/4)**:
   - **Target API**: Chọn **AWS Lambda Invoke**.
   - **Lambda function**: Chọn function `calendar-daily-attendance-scheduler` đã tạo ở Bước 1.
   - Nhấn **Next**.
6. **Settings (Bước 3/4)**:
   - **Action after completion**: Để `NONE` (vì đây là lịch lặp lại).
   - **Retry policy**: Bật (Enable), số lần retry mặc định là 185 hoặc chỉnh về 3 lần nếu muốn.
   - Nhấn **Next**.
7. **Review and create schedule (Bước 4/4)**:
   - Kiểm tra lại thông tin và nhấn **Create schedule**.

---

## BƯỚC 6: CÁCH KIỂM TRA TRẠNG THÁI HỆ THỐNG VÀ XÓA RESOURCE KHI KHÔNG DÙNG

### 1. Kiểm tra trạng thái từ API Backend:
Bạn có thể mở trình duyệt hoặc Postman gọi API:
`GET https://<YOUR_BACKEND_DOMAIN>/api/internal/cron/daily-scheduler/status`
Sẽ trả về thông tin: Hôm nay cronjob đã chạy chưa, chạy lúc mấy giờ, và do ai gọi (`aws_lambda` hay `bullmq_fallback`).

### 2. Khi muốn xóa tài nguyên để tránh phát sinh chi phí:
- Vào **EventBridge** $\rightarrow$ **Schedules** $\rightarrow$ Chọn schedule và nhấn **Delete**.
- Vào **Lambda** $\rightarrow$ **Functions** $\rightarrow$ Chọn function và nhấn **Delete**.
- **Lưu ý:** Khi bạn xóa trên AWS, hệ thống Backend sẽ tự động phát hiện và chạy qua **BullMQ Fallback (00:05)** mà không bao giờ bị mất thông báo điểm danh!
