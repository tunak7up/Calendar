const dailyReportController = require('../controllers/dailyReportController');
const express = require('express');
const router = express.Router();

router.post('/', dailyReportController.createDailyReport);
router.put('/:id', dailyReportController.updateDailyReport);
router.get('/person/:person_id/date/:working_date', dailyReportController.getDailyReportByPersonIdAndDate);
router.get('/date/:working_date', dailyReportController.getDailyReportByDate);
router.get('/person/:person_id', dailyReportController.getDailyReportByPersonId);
router.put('/:id/description', dailyReportController.updateDailyReportDescription);

module.exports = router;