/**
 * AWS Lambda Function - Kích hoạt Cronjob nạp lịch điểm danh 00:01 hàng ngày
 * Runtime: Node.js 18.x / 20.x / 22.x
 * Dependencies: Không cần cài thêm npm packages (sử dụng native fetch)
 * 
 * Biến môi trường (Environment Variables trên AWS Lambda):
 * - BACKEND_URL: URL backend API (ví dụ: https://your-backend-domain.com/api/internal/cron/daily-scheduler)
 * - CRON_SECRET_TOKEN: Mã token bảo mật tương ứng trong be/.env
 */

export const handler = async (event, context) => {
  const backendUrl = process.env.BACKEND_URL;
  const cronSecret = process.env.CRON_SECRET_TOKEN;

  if (!backendUrl) {
    const errorMsg = 'BACKEND_URL environment variable is not configured on Lambda!';
    console.error(`[Lambda Daily Scheduler] ❌ ${errorMsg}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: errorMsg })
    };
  }

  console.log(`[Lambda Daily Scheduler] ⏰ Bắt đầu kích hoạt webhook tại: ${backendUrl}`);
  console.log(`[Lambda Daily Scheduler] Event Time: ${event?.time || new Date().toISOString()}`);

  if (!cronSecret) {
    const errorMsg = 'CRON_SECRET_TOKEN environment variable is not configured on Lambda!';
    console.error(`[Lambda Daily Scheduler] ❌ ${errorMsg}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: errorMsg })
    };
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
      console.error(`[Lambda Daily Scheduler] ❌ Backend returned status ${response.status}:`, data);
      throw new Error(`Backend returned HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log(`[Lambda Daily Scheduler] ✅ Thành công! Kết quả từ Backend:`, data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Successfully triggered daily scheduler on backend',
        backendResponse: data
      })
    };
  } catch (error) {
    console.error(`[Lambda Daily Scheduler] ❌ Lỗi khi gửi webhook tới Backend:`, error.message);
    // Ném lỗi để AWS EventBridge / CloudWatch ghi nhận status Failed và tự động Retry
    throw error;
  }
};
