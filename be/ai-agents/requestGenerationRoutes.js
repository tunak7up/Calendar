const express = require('express');
const router = express.Router();
const requestGenerationController = require('./requestGenerationController');

// Mọi nhân viên đã xác thực đều được phép sử dụng Trợ lý Đăng ký Nhanh
router.post('/parse-schedule', requestGenerationController.parseScheduleRequest);

module.exports = router;
