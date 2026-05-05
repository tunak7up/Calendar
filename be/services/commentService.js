const { comment, comment_attachment } = require('../models');
const sequelize = require('../config/db');

const getAllComments = async () => {
    return await comment.findAll({
        include: {
            model: comment_attachment,
            as: 'attachments',
            attributes: ['comment_attachment_id', 'url']
        }
    });
};

const createCommentByTaskId = async (taskId, data) => {
    return await sequelize.transaction(async (t) => {
        const newComment = await comment.create({
            task_id: taskId,
            person_id: data.person_id,
            content: data.content,
            created_at: new Date()
        }, { transaction: t });

        if (data.attachments && data.attachments.length > 0) {
            const attachments = data.attachments.map(url => ({
                comment_id: newComment.comment_id,
                url
            }));
            await comment_attachment.bulkCreate(attachments, { transaction: t });
        }
        return newComment;
    });
};

const getCommentsByTaskId = async (taskId) => {
    return await comment.findAll({
        include: {
            model: comment_attachment,
            as: 'attachments',
            attributes: ['comment_attachment_id', 'url']
        },
        where: {
            task_id: taskId
        }
    });
};

module.exports = {
    getAllComments,
    createCommentByTaskId,
    getCommentsByTaskId
};