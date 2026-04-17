const express = require('express');
const router = express.Router();
const taskAttachmentController = require('../controllers/taskAttachmentController');

router.post('/', taskAttachmentController.createTaskAttachment);
router.get('/:id', taskAttachmentController.getAttachmentsByTaskId);

module.exports = router;