const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');
const backupController = require('../controllers/backupController');

// Webhook trigger được gọi từ AWS Lambda / EventBridge
router.post('/cron/daily-scheduler', cronController.triggerDailyAttendanceScheduler);

// API kiểm tra trạng thái chạy của cronjob trong ngày
router.get('/cron/daily-scheduler/status', cronController.getDailySchedulerStatus);

// Trigger backup tự động theo lịch (AWS Lambda / EventBridge)
router.post('/cron/backup', backupController.triggerCronBackup);

module.exports = router;
