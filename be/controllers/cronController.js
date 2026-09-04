const { scheduleAllTodayMilestones } = require('../services/attendanceNotificationService');
const { getVNTime } = require('../utils/dateUtils');
const redisClient = require('../utils/redis');

/**
 * Controller xử lý các Webhook Cronjob được kích hoạt từ bên ngoài (AWS Lambda / EventBridge)
 */
const triggerDailyAttendanceScheduler = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET_TOKEN;
    const providedSecret = req.headers['x-cron-secret'] || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);

    // 1. Xác thực Secret Key
    if (!cronSecret || providedSecret !== cronSecret) {
      console.warn('[Cron Controller] ⚠️ Unauthorized access attempt to /daily-scheduler with secret:', providedSecret);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing x-cron-secret header'
      });
    }

    const nowVN = getVNTime();
    const todayStr = nowVN.dateStr;
    const redisKey = `cron:daily_attendance:${todayStr}`;

    console.log(`[Cron Controller] 🚀 Nhận Webhook từ AWS Lambda cho ngày ${todayStr}. Đang kích hoạt nạp lịch...`);

    // 2. Ghi nhận cờ trạng thái vào Redis để BullMQ Fallback biết là Lambda đã chạy
    if (redisClient) {
      const payload = JSON.stringify({
        source: 'aws_lambda',
        executedAt: new Date().toISOString(),
        dateStr: todayStr
      });
      // Lưu với thời gian hết hạn (TTL) là 24 giờ (86400s)
      await redisClient.set(redisKey, payload, 'EX', 86400).catch(err => {
        console.error('[Cron Controller] ❌ Lỗi ghi Redis flag:', err.message);
      });
      console.log(`[Cron Controller] 📌 Đã lưu cờ Redis: ${redisKey}`);
    }

    // 3. Kích hoạt quét và nạp các mốc thông báo của ngày hôm nay vào hàng đợi
    await scheduleAllTodayMilestones();

    return res.json({
      success: true,
      message: `Daily attendance milestones successfully scheduled for ${todayStr}`,
      source: 'aws_lambda',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron Controller] ❌ Lỗi khi thực thi daily-scheduler:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Kiểm tra trạng thái chạy của cronjob ngày hôm nay
 */
const getDailySchedulerStatus = async (req, res) => {
  try {
    const nowVN = getVNTime();
    const todayStr = nowVN.dateStr;
    const redisKey = `cron:daily_attendance:${todayStr}`;

    let statusData = null;
    if (redisClient) {
      const raw = await redisClient.get(redisKey);
      if (raw) {
        statusData = JSON.parse(raw);
      }
    }

    return res.json({
      success: true,
      today: todayStr,
      hasExecutedToday: !!statusData,
      details: statusData || { message: 'Chưa có lượt chạy nào được ghi nhận cho hôm nay.' }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  triggerDailyAttendanceScheduler,
  getDailySchedulerStatus
};
