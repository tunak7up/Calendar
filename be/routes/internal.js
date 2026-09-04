const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');

// Webhook trigger được gọi từ AWS Lambda / EventBridge
router.post('/cron/daily-scheduler', cronController.triggerDailyAttendanceScheduler);

// API kiểm tra trạng thái chạy của cronjob trong ngày
router.get('/cron/daily-scheduler/status', cronController.getDailySchedulerStatus);

module.exports = router;
