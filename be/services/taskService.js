const { task, person, task_participant, task_attachment, comment, comment_attachment } = require('../models');
const { Op } = require('sequelize');

const sequelize = require('../config/db');

const createTask = async (data) => {
    return await sequelize.transaction(async (t) => {
        const parentTask = await task.create({
            parent_id: null,
            assigner_id: data.assigner_id,
            created_by: data.created_by || 2, // Use provided ID or fallback to Admin (ID: 2)
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
                created_by: data.created_by || 2,
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
};

const createSubTask = async (parentTaskId, data) => {
    const parentTaskData = await task.findByPk(parentTaskId);
    if (!parentTaskData) throw new Error('Parent task not found');
    return await task.create({
        parent_id: parentTaskId,
        assigner_id: parentTaskData.assigner_id,
        created_by: parentTaskData.created_by,
        start_time: parentTaskData.start_time,
        due_date: parentTaskData.due_date,
        title: data.title,
        status: data.status || 'pending',
        created_at: new Date(),
        description: data.description,
        priority: data.priority,
        ended_at: null,
        ...data
    });
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
    const tasks = await task.findAll({
        include: [
            {
                model: person,
                as: 'assigner',
                attributes: ['name']
            },
            {
                model: person,
                as: 'participants',
                attributes: ['name', 'person_id']
            }
        ],
        order: [['created_at', 'DESC']]
    });

    return tasks.map(t => {
        const taskJson = t.toJSON();
        const participants = taskJson.participants?.map(p => ({
            person_id: p.person_id,
            name: p.name,
            role: p.task_participant?.role || 'N/A'
        })) || [];

        return {
            task_id: taskJson.task_id,
            name: taskJson.title,
            assigner: taskJson.assigner?.name || 'N/A',
            start_time: taskJson.start_time,
            due_date: taskJson.due_date,
            status: taskJson.status || 'pending',
            priority: taskJson.priority || 'medium',
            participants: participants,
            parent_id: taskJson.parent_id
        };
    });
};

const getAllTasksByPersonId = async (personId) => {
    const tasks = await task.findAll({
        include: [
            {
                model: person,
                as: 'participants',
                attributes: ['person_id']
            }
        ],
        order: [['created_at', 'DESC']],
        where: {
            person_id: personId
        }
    });


};

const getTaskById = async (id) => {
    const targetTask = await task.findByPk(id, {
        include: [
            {
                model: person,
                as: 'assigner',
                attributes: ['name', 'person_id']
            },
            {
                model: person,
                as: 'participants',
                attributes: ['name', 'person_id'],
                through: { attributes: ['role'] }
            }
        ]
    });

    if (!targetTask) throw new Error('Task not found');

    const taskJson = targetTask.toJSON();
    const participants = taskJson.participants?.map(p => ({
        person_id: p.person_id,
        name: p.name,
        role: p.task_participant?.role || 'N/A'
    })) || [];

    return {
        ...taskJson,
        assigner: taskJson.assigner?.name || 'N/A',
        assigner_id: taskJson.assigner?.person_id,
        participants: participants
    };
};

const getChildTasksByParentId = async (parentId) => {
    return await task.findAll({ where: { parent_id: parentId } });
};

const getTasksByTimeRange = async (startTime, endTime) => {
    console.log('startTime:', startTime);
    console.log('endTime:', endTime);
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
                model: person,
                as: 'assigner',
                attributes: ['name']
            },
            {
                model: task_participant,
                as: 'task_participants',
                where: { participant_id: participantId },
                attributes: ['role'],
            }
        ]
    });
    return tasks.map(task => {
        const taskJson = task.toJSON();
        return {
            task_id: taskJson.task_id,
            name: taskJson.title,
            assigner: taskJson.assigner?.name || 'N/A',
            start_time: taskJson.start_time,
            due_date: taskJson.due_date,
            status: taskJson.status || 'pending',
            priority: taskJson.priority || 'medium',
            role: taskJson.task_participants?.[0]?.role || 'N/A'
        }
    });
};

const updateTask = async (id, data) => {
    const parentTask = await task.findByPk(id);
    if (!parentTask) throw new Error('Task not found');

    return await sequelize.transaction(async (t) => {
        const updatedParent = await parentTask.update(data, { transaction: t });

        if (data.status === 'completed') {
            await task.update(
                { status: 'completed' },
                {
                    where: { parent_id: parentTask.task_id },
                    transaction: t,
                }
            );
        }

        if (data.start_time || data.due_date) {
            const dateFields = {};
            if (data.start_time) dateFields.start_time = data.start_time;
            if (data.due_date) dateFields.due_date = data.due_date;

            await task.update(dateFields, {
                where: { parent_id: parentTask.task_id },
                transaction: t,
            });
        }

        return updatedParent;
    });
};

const updateTaskTitleOrDescription = async (id, { title, description }) => {
    const targetTask = await task.findByPk(id);
    if (!targetTask) throw new Error('Task not found');
    return await targetTask.update({ title, description });
};

const deleteTask = async (id) => {
    const targetTask = await task.findByPk(id);
    if (!targetTask) throw new Error('Task not found');
    await targetTask.destroy();
};

const getTasksBeforeDueDate = async (personId, data) => {
    const { pickedDate } = data;
    return await task.findAll({
        include: [
            {
                model: person,
                as: 'participants',
                where: { person_id: personId },
                required: true,
                attributes: []
            }
        ],
        where: {
            due_date: { [Op.gte]: pickedDate }
        }
    });
};

const addParticipantToTask = async (taskId, { participant_id, role }) => {
    return await task_participant.create({
        task_id: taskId,
        participant_id,
        role
    });
};

const updateParticipantRole = async (taskId, participantId, { role }) => {
    return await task_participant.update(
        { role },
        { where: { task_id: taskId, participant_id: participantId } }
    );
};

const removeParticipantFromTask = async (taskId, participantId) => {
    return await task_participant.destroy({
        where: { task_id: taskId, participant_id: participantId }
    });
};

module.exports = {
    createTask,
    createSubTask,
    createTaskAttachment,
    getAttachmentsByTaskId,
    getAllTasks,
    getAllTasksByPersonId,
    getTaskById,
    getChildTasksByParentId,
    getTasksByTimeRange,
    getAllTasksByParticipantsId,
    getTasksBeforeDueDate,
    updateTask,
    updateTaskTitleOrDescription,
    deleteTask,
    addParticipantToTask,
    updateParticipantRole,
    removeParticipantFromTask
};