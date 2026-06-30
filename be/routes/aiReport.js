const express = require('express');
const router = express.Router();
const aiReportController = require('../controllers/aiReportController');

router.post('/generate', aiReportController.generateDailyReportAI);

module.exports = router;
