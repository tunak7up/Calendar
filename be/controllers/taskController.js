const taskService = require('../services/taskService');

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        res.json(task);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const getChildTasksByParentId = async (req, res) => {
    try {
        const childTasks = await taskService.getChildTasksByParentId(req.params.parentId);
        res.json(childTasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTasksByTimeRange = async (req, res) => {
    try {
        const { startTime, endTime } = req.query;
        const tasks = await taskService.getTasksByTimeRange(startTime, endTime);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        res.json(task);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    getChildTasksByParentId,
    getTasksByTimeRange,
    updateTask,
    deleteTask
};