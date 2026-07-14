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
    const newComment = await sequelize.transaction(async (t) => {
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

    // Send notifications in background
    (async () => {
        try {
            const { task, person } = require('../models');
            const targetTask = await task.findByPk(taskId, {
                include: [
                    { model: person, as: 'assigner' },
                    { model: person, as: 'participants' }
                ]
            });
            if (targetTask) {
                const commenter = await person.findByPk(data.person_id);
                const commenterName = commenter ? commenter.name : 'Thành viên';
                
                const recipients = [];
                // Add assigner if not commenter
                if (targetTask.assigner_id && targetTask.assigner_id !== data.person_id && targetTask.assigner) {
                    recipients.push(targetTask.assigner);
                }
                // Add participants if not commenter
                if (targetTask.participants) {
                    targetTask.participants.forEach(p => {
                        if (p.person_id !== data.person_id) {
                            recipients.push(p);
                        }
                    });
                }

                const onesignalIds = recipients
                    .map(r => r.onesignal_id)
                    .filter(id => id && id.trim() !== '');

                if (onesignalIds.length > 0) {
                    const { sendPushNotification } = require('../utils/onesignal');
                    const title = `Bình luận mới: ${targetTask.title}`;
                    const message = `${commenterName}: "${data.content.substring(0, 60)}${data.content.length > 60 ? '...' : ''}"`;
                    const url = `/tasks/${taskId}`;
                    await sendPushNotification(onesignalIds, title, message, url);
                }
            }
        } catch (err) {
            console.error('Error sending comment push notifications:', err);
        }
    })();

    return newComment;
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