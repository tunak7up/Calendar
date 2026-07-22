const dailyReportController = require('../controllers/dailyReportController');
const { captureClientIp } = require('../middleware/ipAttach');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', captureClientIp, dailyReportController.createDailyReport);
router.patch('/:id', captureClientIp, dailyReportController.updateDailyReport);
router.get('/person/:person_id/date/:working_date', dailyReportController.getDailyReportByPersonIdAndDate);
router.get('/date/:working_date', dailyReportController.getDailyReportByDate);
router.get('/person/:person_id/today', dailyReportController.checkTodayReportExists);
router.get('/person/:person_id', dailyReportController.getDailyReportByPersonId);
router.patch('/:id/description', dailyReportController.updateDailyReportDescription);
router.post('/export', dailyReportController.exportDailyReport);
router.post('/import', upload.single('file'), dailyReportController.importDailyReports);
router.get('/range', dailyReportController.getAllDailyReportsInRange);

module.exports = router;