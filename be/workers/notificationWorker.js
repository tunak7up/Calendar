const { Worker } = require('bullmq');
const { connection } = require('../utils/queue');
const { sendPushNotification } = require('../utils/onesignal');

console.log('[Notification Worker] Initializing...');

const worker = new Worker('notification-queue', async (job) => {
  if (job.name === 'send-push') {
    const { subscriptionIds, title, content, url, buttons } = job.data;
    console.log(`[Notification Worker] Processing job ${job.id} - sending push to ${subscriptionIds.length} subscriptions`);

    try {
      const result = await sendPushNotification(subscriptionIds, title, content, url, buttons);
      return result;
    } catch (err) {
      console.error(`[Notification Worker] Error in sendPushNotification for job ${job.id}:`, err);
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
