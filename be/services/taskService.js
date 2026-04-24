const { task, person, task_participant, task_attachment } = require('../models');
const { Op } = require('sequelize');

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
                status: subTask.status || 'pending',
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
    const targetTask = await task.findByPk(id);
    if (!targetTask) throw new Error('Task not found');
    return targetTask;
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

const getAllTasksByParticipantsId = async (participantId) => {
    const tasks = await task.findAll({
        include: [
            {
                model: task_participant,
                as: 'task_participants',
                where: { participant_id: participantId },
                attributes: ['role'],
            }
        ]
    });
    return tasks.map(task => {
        const taskData = task.toJSON();
        taskData.role = taskData.task_participants[0].role;
        delete taskData.task_participants;
        return taskData;
    });
};

const updateTask = async (id, data) => {
    const targetTask = await task.findByPk(id);
    if (!targetTask) throw new Error('Task not found');
    await targetTask.update(data);
    return targetTask;
};

const deleteTask = async (id) => {
    const targetTask = await task.findByPk(id);
    if (!targetTask) throw new Error('Task not found');
    await targetTask.destroy();
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    getChildTasksByParentId,
    getTasksByTimeRange,
    getAllTasksByParticipantsId,
    updateTask,
    deleteTask,
    createTaskAttachment,
    getAttachmentsByTaskId
};