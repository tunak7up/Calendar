const express = require('express');
const router = express.Router();
const taskStatusController = require('../controllers/taskStatusController');

router.get('/', taskStatusController.getAllStatuses);
router.post('/', taskStatusController.createStatus);
router.delete('/:name', taskStatusController.deleteStatus);

module.exports = router;
