const { task, person, task_participant, task_attachment } = require('../models');

const { Op } = require('sequelize');
const createTask = async ({ name, description, parent_id, assigner_id, created_by, start_time, due_date, ended_at, title, parent_Id, priority }) => {
    return await task.create({ name, description, parent_id, assigner_id, created_by, start_time, due_date, ended_at, title, status: 'pending', parent_Id, priority });
};
const sequelize = require('../config/db');

const createTask = async (data) => {
    return await sequelize.transaction(async (t) => {
        const parentTask = await task.create({
            parent_id: null,
            assigner_id: data.assigner_id,
            created_by: 1, //mocking for now
            start_time: data.start_time,
            due_date: data.due_date,
            title: data.title,
            status: data.status,
            created_at: new Date(),
            description: data.description,
            priority: data.priority,
            ended_at: null,
        }, { transaction: t });

        if (data.sub_tasks && data.sub_tasks.length > 0) {
            const subTasks = data.sub_tasks.map(subTask => ({
                parent_id: parentTask.task_id,
                assigner_id: data.assigner_id,
                created_by: 1,
                start_time: data.start_time,
                due_date: data.due_date,
                title: subTask.title,
                status: subTask.status,
                created_at: new Date(),
                description: subTask.description,
                priority: subTask.priority,
                ended_at: null,
            }));
            await task.bulkCreate(subTasks, { transaction: t });
        }

        if (data.task_participants && data.task_participants.length > 0) {
            const participants = data.task_participants.map(participant => ({
                task_id: parentTask.task_id,
                participant_id: participant.participant_id,
                role: participant.role
            }));
            await task_participant.bulkCreate(participants, { transaction: t });
        }

        return parentTask;
    });
}

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