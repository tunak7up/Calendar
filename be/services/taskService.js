const { task } = require('../models');
const { Op } = require('sequelize');

const createTask = async ({ name, description, parent_id, assigner_id, created_by, start_time, due_date, ended_at, title, parent_Id, priority }) => {
    return await task.create({ name, description, parent_id, assigner_id, created_by, start_time, due_date, ended_at, title, status: 'pending', parent_Id, priority });
};

const getAllTasks = async () => {
    return await task.findAll();
};

const getTaskById = async (id) => {
    const task = await task.findByPk(id);
    if (!task) throw new Error('Task not found');
    return task;
};

const getChildTasksByParentId = async (parentId) => {
    return await task.findAll({ where: { parentId: parentId } });
};

const getTasksByTimeRange = async (startTime, endTime) => {
    return await task.findAll({
        where: {
            start_time: {
                [Op.gte]: startTime,
                [Op.lte]: endTime
            }
        }
    });
};
const updateTask = async (id, { name, description, parent_id, assigner_id, start_time, due_date, ended_at, title, status, priority }) => {
    const task = await task.findByPk(id);
    if (!task) throw new Error('Task not found');
    return await task.update({ name, description, parent_id, assigner_id, start_time, due_date, ended_at, title, status, priority });
};

const deleteTask = async (id) => {
    const task = await task.findByPk(id);
    if (!task) throw new Error('Task not found');
    await task.destroy();
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    getChildTasksByParentId,
    getTasksByTimeRange,
    updateTask,
    deleteTask
};