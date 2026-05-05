const commentService = require('../services/commentService');
const { sendRes } = require('../utils/responseHelper');

const getCommentsByTaskId = async (req, res) => {
    try {
        const comments = await commentService.getCommentsByTaskId(req.params.taskId);
        sendRes(res, 200, 'Comments retrieved successfully', comments);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving comments', null, error.message);
    }
};

const createCommentByTaskId = async (req, res) => {
    try {
        const comment = await commentService.createCommentByTaskId(req.params.taskId, req.body);
        sendRes(res, 201, 'Comment created successfully', comment);
    } catch (error) {
        sendRes(res, 400, 'Error creating comment', null, error.message);
    }
};

const getAllComments = async (req, res) => {
    try {
        const comments = await commentService.getAllComments();
        sendRes(res, 200, 'Comments retrieved successfully', comments);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving comments', null, error.message);
    }
};

module.exports = {
    getCommentsByTaskId,
    createCommentByTaskId,
    getAllComments
};