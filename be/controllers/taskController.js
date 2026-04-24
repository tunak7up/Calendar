const { get } = require('../routes');
const taskService = require('../services/taskService');
const { sendRes } = require('../utils/responseHelper');

const createTask = async (req, res) => {
    try {
        const task = await taskService.createTask(req.body);
        sendRes(res, 201, 'Task created successfully', task);
    } catch (error) {
        sendRes(res, 400, 'Error creating task', null, error.message);
    }
};

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        sendRes(res, 200, 'Task retrieved successfully', task);
    } catch (error) {
        sendRes(res, 404, 'Task not found', null, error.message);
    }
};

const getChildTasksByParentId = async (req, res) => {
    try {
        const childTasks = await taskService.getChildTasksByParentId(req.params.parentId);
        sendRes(res, 200, 'Child tasks retrieved successfully', childTasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving child tasks', null, error.message);
    }
};

const getTasksByTimeRange = async (req, res) => {
    try {
        const { startTime, endTime } = req.query;
        const tasks = await taskService.getTasksByTimeRange(startTime, endTime);
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const getAllTasksByParticipantsId = async (req, res) => {
    try {
        const participantId = req.params.participantId;
        const tasks = await taskService.getAllTasksByParticipantsId(participantId);
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        sendRes(res, 200, 'Task updated successfully', task);
    } catch (error) {
        sendRes(res, 404, 'Task not found', null, error.message);
    }
};

const deleteTask = async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id);
        sendRes(res, 200, 'Task deleted successfully', null);
    } catch (error) {
        sendRes(res, 404, 'Task not found', null, error.message);
    }
};

const createTaskAttachment = async (req, res) => {
    try {
        const attachment = await taskService.createTaskAttachment(req.body);
        sendRes(res, 201, 'Task attachment created successfully', attachment);
    } catch (error) {
        sendRes(res, 400, 'Error creating task attachment', null, error.message);
    }
};

const getAttachmentsByTaskId = async (req, res) => {
    try {
        const attachments = await taskService.getAttachmentsByTaskId(req.params.taskId);
        sendRes(res, 200, 'Attachments retrieved successfully', attachments);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving attachments', null, error.message);
    }
};


module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    getChildTasksByParentId,
    getAllTasksByParticipantsId,
    getTasksByTimeRange,
    updateTask,
    deleteTask,
    createTaskAttachment,
    getAttachmentsByTaskId
};