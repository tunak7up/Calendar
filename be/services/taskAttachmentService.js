const task_attachment = require('../models/task_attachment');

const createTaskAttachment = async ({ task_id, url }) => {
    return await task_attachment.create({ task_id, url });
};

const getAttachmentsByTaskId = async (taskId) => {
    return await task_attachment.findAll({
        where: { task_id: taskId }
    });
};

module.exports = {
    createTaskAttachment,
    getAttachmentsByTaskId
};