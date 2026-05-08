const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask);
router.post('/attachment', taskController.createTaskAttachment);
router.get('/attachment/:taskId', taskController.getAttachmentsByTaskId);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.get('/parent/:parentId', taskController.getChildTasksByParentId);
router.get('/participant/:participantId', taskController.getAllTasksByParticipantsId);
router.get('/time-range', taskController.getTasksByTimeRange);
router.get('/person/:personId', taskController.getAllTasksByPersonId);
router.get('/person/:personId/pending', taskController.getAllPendingTasksByPersonId);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:parentId', taskController.createSubTask);

module.exports = router;