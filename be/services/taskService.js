const { task, person, task_participant, task_attachment } = require('../models');
const { Op } = require('sequelize');

const createTask = async ({ name, description, parent_id, assigner_id, created_by, start_time, due_date, ended_at, title, parent_Id, priority }) => {
    return await task.create({ name, description, parent_id, assigner_id, created_by, start_time, due_date, ended_at, title, status: 'pending', parent_Id, priority });
};

const createTaskAttachment = async ({ task_id, url }) => {
    return await task_attachment.create({ task_id, url });
};

const getAttachmentsByTaskId = async (taskId) => {
    return await task_attachment.findAll({
        where: { task_id: taskId }
    });
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

const getAllTasksWithParticipants = async () => {
    const tasks = await task.findAll({
        include: [
            {
                model: task_participant,
                as: 'participants',
                attributes: ['role'],
                include: [
                    {
                        model: person,
                        as: 'person_info',
                        attributes: ['name', 'role']
                    }
                ]
            }
        ],
        attributes: ['task_id', 'title']
    });
    return tasks.map(task => {
        return {
            task_id: task.task_id,
            name: task.title,
            members: task.participants.map(p => ({
                name: p.person_info?.name || 'N/A',
                job_role: p.person_info?.role || 'N/A',
                project_role: p.role || 'N/A'
            }))
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
    getAllTasksWithParticipants,
    updateTask,
    deleteTask,
    createTaskAttachment,
    getAttachmentsByTaskId
};