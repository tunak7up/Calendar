const Redis = require('ioredis');
const { connection } = require('./queue');

let redisClient = null;

try {
  redisClient = new Redis({
    ...connection,
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying if Redis is offline
      return Math.min(times * 100, 1000);
    }
  });

  redisClient.on('error', (err) => {
    console.error('[Redis Client] Error:', err.message);
  });
} catch (err) {
  console.error('[Redis Client] Initialization error:', err.message);
}

module.exports = redisClient;
