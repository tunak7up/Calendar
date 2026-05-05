const commentController = require('../controllers/commentController');
const express = require('express');
const router = express.Router();


router.get('/task/:taskId', commentController.getCommentsByTaskId);
router.post('/task/:taskId', commentController.createCommentByTaskId);
router.get('/', commentController.getAllComments);

module.exports = router;