const express = require('express');
const router = express.Router();
const monthlyCompanyAnalysisController = require('../controllers/monthlyCompanyAnalysisController');
const { authorize } = require('../../middleware/auth');

// Chỉ manager (admin) mới được phép phân tích hiệu suất doanh nghiệp
router.post('/analyze-company', authorize('manager'), monthlyCompanyAnalysisController.analyzeCompanyMonthly);

module.exports = router;
