const express = require('express');
const router = express.Router();
const taskAnalysisController = require('../controllers/taskAnalysisController');

router.post('/analyze', taskAnalysisController.analyzeTask);

module.exports = router;
