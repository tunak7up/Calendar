const express = require('express');
const router = express.Router();
const performanceAnalysisController = require('../controllers/performanceAnalysisController');
const { authorize } = require('../../middleware/auth');

// Chỉ manager (admin) mới được phép phân tích hiệu suất nhân viên
router.post('/analyze', authorize('manager'), performanceAnalysisController.analyzePerformance);

module.exports = router;
