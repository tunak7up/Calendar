const scheduleController = require('../controllers/scheduleController');
const express = require('express');
const router = express.Router();

router.post('/', scheduleController.createSchedule);
router.get('/', scheduleController.getAllSchedules);
router.get('/range', scheduleController.getSchedulesByRange);
router.get('/person/:personId', scheduleController.getScheduleByPersonId);
router.get('/person/:personId/date/:date', scheduleController.getShiftByDate);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);
router.post('/person/:personId/time-range', scheduleController.getScheduleByPersonIdWithTimeRange);

module.exports = router;