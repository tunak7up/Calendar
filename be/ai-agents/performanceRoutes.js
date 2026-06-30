const express = require('express');
const router = express.Router();
const performanceController = require('./performanceController');
const { authorize } = require('../middleware/auth');

// Chỉ manager (admin) mới được phép phân tích hiệu suất nhân viên
router.post('/analyze', authorize('manager'), performanceController.analyzePerformance);
router.post('/analyze-company', authorize('manager'), performanceController.analyzeCompanyMonthly);

module.exports = router;
