const { Worker } = require('bullmq');
const { connection } = require('../utils/queue');
const { sendPushNotification } = require('../utils/onesignal');

console.log('[Notification Worker] Initializing BullMQ Worker...');

const worker = new Worker('notification-queue', async (job) => {
  if (job.name === 'send-push') {
    const { recipientName, subscriptionIds, title, content, url, buttons } = job.data;
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts?.attempts || 3;
    console.log(`[Notification Worker] 🚀 ĐANG GỬI Push (Job #${job.id}, Lần thử ${attempt}/${maxAttempts}) cho User: ${recipientName || 'Unknown'} tới ${subscriptionIds.length} thiết bị...`);

    try {
      const result = await sendPushNotification(subscriptionIds, title, content, url, buttons, recipientName);
      if (result && result.errors && result.errors.length > 0) {
        const errMsg = Array.isArray(result.errors) ? result.errors.join(', ') : JSON.stringify(result.errors);
        throw new Error(`OneSignal API returned error: ${errMsg}`);
      }
      return result;
    } catch (err) {
      console.error(`[Notification Worker] ❌ Lỗi khi gửi Push cho Job #${job.id} (Lần thử ${attempt}/${maxAttempts}):`, err.message || err);
      throw err; // Rethrow to let BullMQ handle retry/fail state
    }
  }

  if (job.name === 'attendance-milestone') {
    const { processMilestoneJob } = require('../services/attendanceNotificationService');
    return await processMilestoneJob(job.data);
  }

  if (job.name === 'daily-attendance-scheduler') {
    const { getVNTime } = require('../utils/dateUtils');
    const redisClient = require('../utils/redis');
    const { scheduleAllTodayMilestones } = require('../services/attendanceNotificationService');

    const nowVN = getVNTime();
    const todayStr = nowVN.dateStr;
    const redisKey = `cron:daily_attendance:${todayStr}`;

    // Kiểm tra xem AWS Lambda đã kích hoạt trước đó (lúc 00:01) chưa
    if (redisClient) {
      try {
        const executedData = await redisClient.get(redisKey);
        if (executedData) {
          console.log(`[Notification Worker] ⏩ Lambda đã kích hoạt nạp lịch hôm nay (${todayStr}), bỏ qua lượt chạy BullMQ Fallback.`);
          return { skipped: true, reason: 'Already executed by Lambda', details: JSON.parse(executedData) };
        }
      } catch (err) {
        console.error('[Notification Worker] Lỗi kiểm tra Redis flag cho BullMQ fallback:', err.message);
      }
    }

    // Nếu Lambda chưa chạy (AWS sập, rớt mạng, Lambda bị xóa...) -> Tự động chạy dự phòng
    console.warn(`[Notification Worker] ⚠️ [FALLBACK ALERT] AWS Lambda chưa kích hoạt hôm nay (${todayStr})! Tự động chạy nạp lịch dự phòng qua BullMQ...`);

    if (redisClient) {
      await redisClient.set(redisKey, JSON.stringify({
        source: 'bullmq_fallback',
        executedAt: new Date().toISOString(),
        dateStr: todayStr
      }), 'EX', 86400).catch(() => {});
    }

    return await scheduleAllTodayMilestones();
  }
}, {
  connection,
  concurrency: 5
});

worker.on('completed', (job) => {
  console.log(`[Notification Worker] Job ${job.id} (${job.name}) completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Notification Worker] Job ${job?.id} (${job?.name}) failed with error:`, err.message);
});

// Handle connection errors gracefully to prevent crashing the server
worker.on('error', (err) => {
  console.error('[Notification Worker] Redis connection error:', err.message);
});

module.exports = worker;
