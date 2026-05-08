const scheduleController = require('../controllers/scheduleController');
const express = require('express');
const router = express.Router();

router.post('/', scheduleController.createSchedule);
router.get('/', scheduleController.getAllSchedules);
router.get('/person/:personId', scheduleController.getScheduleByPersonId);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);
router.post('/person/:personId/time-range', scheduleController.getScheduleByPersonIdWithTimeRange);

module.exports = router;