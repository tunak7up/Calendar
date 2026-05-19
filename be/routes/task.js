const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authorize } = require('../middleware/auth');

router.post('/', taskController.createTask);
router.post('/attachment', taskController.createTaskAttachment);
router.get('/attachment/:taskId', taskController.getAttachmentsByTaskId);
router.get('/time-range/', taskController.getTasksByTimeRange);
router.get('/', taskController.getAllTasks);
router.get('/parent/:parentId', taskController.getChildTasksByParentId);
router.get('/participant/:participantId', taskController.getAllTasksByParticipantsId);
router.get('/person/:personId/pending', taskController.getAllPendingTasksByPersonId);
router.post('/person/:personId/due-date', taskController.getTasksBeforeDueDate);
router.get('/person/:personId', taskController.getAllTasksByPersonId);
router.put('/update-title-description/:id', taskController.updateTaskTitleOrDescription);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:parentId', taskController.createSubTask);
router.post('/:id/participant', authorize('manager', 'employee'), taskController.addParticipantToTask);
router.put('/:id/participant/:participantId', taskController.updateParticipantRole);
router.delete('/:id/participant/:participantId', taskController.removeParticipantFromTask);

module.exports = router;