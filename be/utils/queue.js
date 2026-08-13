const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  username: process.env.REDIS_USER || 'default',
  password: process.env.REDIS_PASSWORD || undefined,
};

const notificationQueue = new Queue('notification-queue', {
  connection
});

// Handle connection errors gracefully to prevent crashing the server
notificationQueue.on('error', (err) => {
  console.error('[Notification Queue] Redis connection error:', err.message);
});

module.exports = {
  notificationQueue,
  connection
};
