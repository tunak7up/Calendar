const { Worker } = require('bullmq');
const { connection } = require('../utils/queue');
const { sendPushNotification } = require('../utils/onesignal');

console.log('[Notification Worker] Initializing...');

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
}, {
  connection,
  concurrency: 3
});

worker.on('completed', (job) => {
  console.log(`[Notification Worker] Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Notification Worker] Job ${job.id} failed with error:`, err.message);
});

// Handle connection errors gracefully to prevent crashing the server
worker.on('error', (err) => {
  console.error('[Notification Worker] Redis connection error:', err.message);
});

module.exports = worker;
