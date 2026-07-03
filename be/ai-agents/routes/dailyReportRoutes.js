const express = require('express');
const router = express.Router();
const dailyReportController = require('../controllers/dailyReportController');

router.post('/generate', dailyReportController.generateDailyReportAI);

module.exports = router;
