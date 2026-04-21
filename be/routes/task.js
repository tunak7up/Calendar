const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask);
router.post('/attachment', taskController.createTaskAttachment);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.get('/parent/:parentId', taskController.getChildTasksByParentId);
router.get('/with-participants', taskController.getAllTasksWithParticipants);
router.get('/time-range', taskController.getTasksByTimeRange);
router.get('/attachment/:taskId', taskController.getAttachmentsByTaskId);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;