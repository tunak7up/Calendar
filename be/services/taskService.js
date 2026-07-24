const { task, person, task_participant, task_attachment, comment, comment_attachment, change_history, fileAttachment } = require('../models');
const { logChange } = require('../utils/changeLogger');
const { deletePhysicalFile } = require('../utils/fileHelper');
const { Op } = require('sequelize');
const { sendMail } = require('./mailService');
const ExcelJS = require('exceljs');

const sequelize = require('../config/db');

const createTask = async (data) => {
    const parentTask = await sequelize.transaction(async (t) => {
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

        await logChange({
            tableName: 'task',
            recordId: parentTask.task_id,
            parentTable: null,
            parentId: null,
            action: 'CREATE',
            newData: {
                task_id: parentTask.task_id,
                title: parentTask.title,
                status: parentTask.status,
                assigner_id: parentTask.assigner_id,
                start_time: parentTask.start_time,
                due_date: parentTask.due_date,
                priority: parentTask.priority,
                description: parentTask.description
            },
            changedBy: data.created_by || data.assigner_id || null,
            transaction: t
        });

        if (data.sub_tasks && data.sub_tasks.length > 0) {
            const subTasksData = data.sub_tasks.map(subTask => ({
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
            const createdSubTasks = await task.bulkCreate(subTasksData, { transaction: t, returning: true });
            for (const sub of createdSubTasks) {
                await logChange({
                    tableName: 'task',
                    recordId: sub.task_id,
                    parentTable: 'task',
                    parentId: parentTask.task_id,
                    action: 'CREATE',
                    newData: { title: sub.title, status: sub.status },
                    changedBy: data.created_by || null,
                    transaction: t
                });
            }
        }

        if (data.task_participants && data.task_participants.length > 0) {
            const participantsData = data.task_participants.map(participant => ({
                task_id: parentTask.task_id,
                participant_id: participant.participant_id,
                role: participant.role
            }));
            const createdParticipants = await task_participant.bulkCreate(participantsData, { transaction: t, returning: true });
            for (const p of createdParticipants) {
                await logChange({
                    tableName: 'task_participant',
                    recordId: p.participant_id,
                    parentTable: 'task',
                    parentId: parentTask.task_id,
                    action: 'CREATE',
                    newData: { participant_id: p.participant_id, role: p.role },
                    changedBy: data.created_by || null,
                    transaction: t
                });
            }
        }

        return parentTask;
    });

    if (data.task_participants && data.task_participants.length > 0) {
        // Send emails in background to prevent blocking the response
        (async () => {
            try {
                const assigner = await person.findByPk(data.assigner_id || parentTask.assigner_id);
                const assignerName = assigner ? assigner.name : 'Người quản lý';
                const subject = `Thông báo có task mới từ ${assignerName}`;

                const participantIds = data.task_participants.map(p => p.participant_id);
                const participants = await person.findAll({
                    where: {
                        person_id: {
                            [Op.in]: participantIds
                        }
                    }
                });

                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #0D8ABC; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px;">Thông Báo Task Mới</h2>
                    </div>
                    <div style="padding: 24px; color: #333333;">
                        <p>Xin chào,</p>
                        <p>Bạn vừa được giao một công việc mới từ <strong>${assignerName}</strong>:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${frontendUrl}/tasks/${parentTask.task_id}" style="background-color: #0D8ABC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem Chi Tiết Công Việc</a>
                        </div>
                        <div style="background-color: #f9fafb; border-left: 4px solid #0D8ABC; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px;">${data.title}</h3>
                            <p style="margin: 0; color: #4b5563; font-size: 14px; white-space: pre-line;">${data.description || 'Không có mô tả chi tiết cho task này.'}</p>
                        </div>
                        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">Đây là email tự động từ hệ thống quản lý công việc.</p>
                        <span style="display:none !important; font-size: 0px;">id: ${Date.now()}</span>
                    </div>
                </div>
                `;

                const emailPromises = participants.map(p => {
                    if (p.email) {
                        return sendMail({
                            to: p.email,
                            subject: subject,
                            html: html
                        }).catch(mailError => {
                            console.error(`Failed to send task email to ${p.email}:`, mailError);
                        });
                    }
                    return Promise.resolve();
                });
                await Promise.all(emailPromises);

                // Send & Save Notifications
                try {
                    const { createNotification } = require('./notificationService');
                    const title = `Task mới: ${data.title}`;
                    const message = `Bạn vừa được giao một công việc mới từ ${assignerName}.`;
                    const url = `/tasks/${parentTask.task_id}`;

                    for (const participant of participants) {
                        if (participant && participant.person_id) {
                            await createNotification(participant.person_id, data.assigner_id, title, message, url);
                        }
                    }
                } catch (pushError) {
                    console.error('Failed to send task notifications:', pushError);
                }
            } catch (error) {
                console.error('Error fetching participants or sending task emails in background:', error);
            }
        })();
    }

    return parentTask;
};

const createSubTask = async (parentTaskId, data, createdBy = null) => {
    const parentTaskData = await task.findByPk(parentTaskId);
    if (!parentTaskData) throw new Error('Parent task not found');

    const subTask = await task.create({
        parent_id: parentTaskId,
        assigner_id: parentTaskData.assigner_id,
        created_by: createdBy || data.created_by || parentTaskData.created_by,
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

    await logChange({
        tableName: 'task',
        recordId: subTask.task_id,
        parentTable: 'task',
        parentId: Number(parentTaskId),
        action: 'CREATE',
        newData: {
            task_id: subTask.task_id,
            title: subTask.title,
            status: subTask.status,
            description: subTask.description
        },
        changedBy: createdBy || data.created_by || null
    });

    return subTask;
};

const createTaskAttachment = async ({ task_id, url }) => {
    return await task_attachment.create({ task_id, url });
};

const getAttachmentsByTaskId = async (taskId) => {
    return await task_attachment.findAll({
        where: { task_id: taskId }
    });
};

const checkAndUpdateOverdueStatus = async (taskInstance) => {
    if (
        taskInstance.due_date &&
        new Date(taskInstance.due_date).getTime() < Date.now() &&
        taskInstance.status !== 'completed'
    ) {
        if (taskInstance.status !== 'overdue') {
            const oldStatus = taskInstance.status;
            await taskInstance.update({ status: 'overdue' });
            await logChange({
                tableName: 'task',
                recordId: taskInstance.task_id,
                parentTable: taskInstance.parent_id ? 'task' : null,
                parentId: taskInstance.parent_id || taskInstance.task_id,
                action: 'UPDATE',
                oldData: { status: oldStatus },
                newData: { status: 'overdue' },
                changedBy: null
            });
        }
    } else if (
        taskInstance.due_date &&
        new Date(taskInstance.due_date).getTime() >= Date.now() &&
        taskInstance.status === 'overdue'
    ) {
        const oldStatus = taskInstance.status;
        await taskInstance.update({ status: 'pending' });
        await logChange({
            tableName: 'task',
            recordId: taskInstance.task_id,
            parentTable: taskInstance.parent_id ? 'task' : null,
            parentId: taskInstance.parent_id || taskInstance.task_id,
            action: 'UPDATE',
            oldData: { status: oldStatus },
            newData: { status: 'pending' },
            changedBy: null
        });
    }
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

    await Promise.all(
        tasks.map(async t => {
            await checkAndUpdateOverdueStatus(t);
        })
    )

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
            parent_id: taskJson.parent_id,
            created_at: taskJson.created_at,
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

    await checkAndUpdateOverdueStatus(targetTask);

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
    await Promise.all(tasks.map(async t => {
        await checkAndUpdateOverdueStatus(t);
    }));
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
            role: taskJson.task_participants?.[0]?.role || 'N/A',
            created_at: taskJson.created_at,
            parent_id: taskJson.parent_id
        }
    });
};

const updateTask = async (id, data, changedBy = null) => {
    const parentTask = await task.findByPk(id);
    if (!parentTask) throw new Error('Task not found');

    const oldTaskJSON = parentTask.toJSON();

    const updatedParent = await sequelize.transaction(async (t) => {
        if (data.due_date && new Date(data.due_date).getTime() >= Date.now() && parentTask.status === 'overdue') {
            data.status = 'pending';
        }
        const updatedParent = await parentTask.update(data, { transaction: t });

        await logChange({
            tableName: 'task',
            recordId: id,
            parentTable: parentTask.parent_id ? 'task' : null,
            parentId: parentTask.parent_id || null,
            action: 'UPDATE',
            oldData: oldTaskJSON,
            newData: updatedParent.toJSON(),
            changedBy: changedBy || data.changed_by || null,
            transaction: t
        });

        if (data.status === 'completed') {
            await parentTask.update({ ended_at: new Date() }, { transaction: t });
            await task.update(
                { status: 'completed', ended_at: new Date() },
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

    if (updatedParent.status !== 'completed') {
        await checkAndUpdateOverdueStatus(updatedParent);
    }

    // Send notifications in background if status changed
    if (data.status && data.status !== parentTask.status) {
        (async () => {
            try {
                const { person } = require('../models');
                // Get all participants of this task
                const taskWithParticipants = await task.findByPk(id, {
                    include: [
                        { model: person, as: 'participants' },
                        { model: person, as: 'assigner' }
                    ]
                });

                if (taskWithParticipants) {
                    const title = `Cập nhật trạng thái: ${parentTask.title}`;
                    const message = `Trạng thái công việc đã thay đổi thành "${data.status}".`;
                    const url = `/tasks/${parentTask.task_id}`;

                    const recipients = [];
                    if (taskWithParticipants.assigner) {
                        recipients.push(taskWithParticipants.assigner);
                    }
                    if (taskWithParticipants.participants) {
                        recipients.push(...taskWithParticipants.participants);
                    }

                    // Unique recipients
                    const uniqueRecipients = [];
                    const seen = new Set();
                    recipients.forEach(r => {
                        if (r && r.person_id && !seen.has(r.person_id)) {
                            seen.add(r.person_id);
                            uniqueRecipients.push(r);
                        }
                    });

                    const { createNotification } = require('./notificationService');
                    for (const recipient of uniqueRecipients) {
                        await createNotification(recipient.person_id, null, title, message, url);
                    }
                }
            } catch (err) {
                console.error('Failed to send status update push notification:', err);
            }
        })();
    }

    return updatedParent;
};

const updateTaskTitleOrDescription = async (id, { title, description }, changedBy = null) => {
    const targetTask = await task.findByPk(id);
    if (!targetTask) throw new Error('Task not found');
    const oldJSON = targetTask.toJSON();

    const updated = await targetTask.update({ title, description });

    await logChange({
        tableName: 'task',
        recordId: id,
        parentTable: targetTask.parent_id ? 'task' : null,
        parentId: targetTask.parent_id || null,
        action: 'UPDATE',
        oldData: oldJSON,
        newData: updated.toJSON(),
        changedBy
    });

    return updated;
};

const deleteTaskRecursive = async (id, t) => {
    const targetTask = await task.findByPk(id, { transaction: t });
    const isSubTask = targetTask && targetTask.parent_id !== null;

    const childTasks = await task.findAll({
        where: { parent_id: id },
        transaction: t
    });

    for (const child of childTasks) {
        await deleteTaskRecursive(child.task_id, t);
    }

    // Xóa tất cả các file_attachment & comment_attachment của các comment thuộc task này
    const taskComments = await comment.findAll({
        where: { task_id: id },
        attributes: ['comment_id'],
        transaction: t
    });

    if (taskComments.length > 0) {
        const commentIds = taskComments.map(c => c.comment_id);

        // a) Xóa file_attachment có attachable_type = 'comment'
        if (fileAttachment) {
            const commentFileAttachments = await fileAttachment.findAll({
                where: {
                    attachable_type: 'comment',
                    attachable_id: { [Op.in]: commentIds }
                },
                transaction: t
            });
            for (const att of commentFileAttachments) {
                deletePhysicalFile(att.url);
            }
            await fileAttachment.destroy({
                where: {
                    attachable_type: 'comment',
                    attachable_id: { [Op.in]: commentIds }
                },
                transaction: t
            });
        }

        // b) Xóa comment_attachment truyền thống
        const commentAttachments = await comment_attachment.findAll({
            where: { comment_id: { [Op.in]: commentIds } },
            transaction: t
        });

        for (const att of commentAttachments) {
            deletePhysicalFile(att.url);
        }

        await comment_attachment.destroy({
            where: { comment_id: { [Op.in]: commentIds } },
            transaction: t
        });
    }

    // Xóa tất cả các file vật lý & CSDL của task_attachment thuộc task này
    const taskAttachments = await task_attachment.findAll({
        where: { task_id: id },
        transaction: t
    });

    for (const att of taskAttachments) {
        deletePhysicalFile(att.url);
    }
    await task_attachment.destroy({ where: { task_id: id }, transaction: t });

    // Xóa tất cả các file vật lý & CSDL của fileAttachment thuộc task này
    if (fileAttachment) {
        const genericAttachments = await fileAttachment.findAll({
            where: { attachable_type: 'task', attachable_id: id },
            transaction: t
        });
        for (const att of genericAttachments) {
            deletePhysicalFile(att.url);
        }
        await fileAttachment.destroy({
            where: { attachable_type: 'task', attachable_id: id },
            transaction: t
        });
    }

    await comment.destroy({ where: { task_id: id }, transaction: t });
    await task_participant.destroy({ where: { task_id: id }, transaction: t });

    if (isSubTask) {
        // Xóa lịch sử thuộc về các phần tử con của subtask này
        await change_history.destroy({
            where: {
                parent_table: 'task',
                parent_id: id
            },
            transaction: t
        });
    } else {
        // Xóa toàn bộ lịch sử liên quan đến task gốc
        await change_history.destroy({
            where: {
                [Op.or]: [
                    { table_name: 'task', record_id: id },
                    { parent_table: 'task', parent_id: id }
                ]
            },
            transaction: t
        });
    }

    await task.destroy({ where: { task_id: id }, transaction: t });
};

const deleteTask = async (id, changedBy = null) => {
    return await sequelize.transaction(async (t) => {
        const targetTask = await task.findByPk(id, { transaction: t });

        if (!targetTask) {
            throw new Error('Task not found');
        }

        // If subtask, log DELETE history on parent task
        if (targetTask.parent_id) {
            await logChange({
                tableName: 'subtask',
                recordId: targetTask.task_id,
                parentTable: 'task',
                parentId: targetTask.parent_id,
                action: 'DELETE',
                oldData: {
                    task_id: targetTask.task_id,
                    title: targetTask.title,
                    status: targetTask.status
                },
                changedBy: changedBy,
                transaction: t
            });
        }

        await deleteTaskRecursive(id, t);
    });
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

const addParticipantToTask = async (taskId, { participant_id, role }, changedBy = null) => {
    const participant = await task_participant.create({
        task_id: taskId,
        participant_id,
        role
    });

    await logChange({
        tableName: 'task_participant',
        recordId: participant_id,
        parentTable: 'task',
        parentId: taskId,
        action: 'CREATE',
        newData: { participant_id, role },
        changedBy
    });

    try {
        const targetTask = await task.findByPk(taskId);
        const p = await person.findByPk(participant_id);
        if (targetTask && p) {
            const assigner = await person.findByPk(targetTask.assigner_id);
            const assignerName = assigner ? assigner.name : 'Người quản lý';

            // Send database and push notification
            try {
                const { createNotification } = require('./notificationService');
                const title = `Task mới: ${targetTask.title}`;
                const message = `Bạn vừa được giao một công việc mới từ ${assignerName}.`;
                const url = `/tasks/${taskId}`;
                await createNotification(participant_id, targetTask.assigner_id, title, message, url);
            } catch (pushError) {
                console.error('Error creating database notification for added participant:', pushError);
            }

            // Send email
            if (p.email) {
                const subject = `Thông báo có task mới từ ${assignerName}`;
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #0D8ABC; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px;">Thông Báo Task Mới</h2>
                    </div>
                    <div style="padding: 24px; color: #333333;">
                        <p>Xin chào,</p>
                        <p>Bạn vừa được giao một công việc mới từ <strong>${assignerName}</strong>:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${frontendUrl}/tasks/${taskId}" style="background-color: #0D8ABC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem Chi Tiết Công Việc</a>
                        </div>
                        <div style="background-color: #f9fafb; border-left: 4px solid #0D8ABC; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px;">${targetTask.title}</h3>
                            <p style="margin: 0; color: #4b5563; font-size: 14px; white-space: pre-line;">${targetTask.description || 'Không có mô tả chi tiết cho task này.'}</p>
                        </div>
                        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">Đây là email tự động từ hệ thống quản lý công việc.</p>
                        <span style="display:none !important; font-size: 0px;">id: ${Date.now()}</span>
                    </div>
                </div>
                `;

                sendMail({
                    to: p.email,
                    subject: subject,
                    html: html
                }).catch(error => {
                    console.error('Error sending task email to added participant:', error);
                });
            }
        }
    } catch (error) {
        console.error('Error sending task email/notification to added participant:', error);
    }

    return participant;
};

const updateParticipantRole = async (taskId, participantId, { role }, changedBy = null) => {
    const existing = await task_participant.findOne({ where: { task_id: taskId, participant_id: participantId } });
    const oldRole = existing ? existing.role : null;

    const res = await task_participant.update(
        { role },
        { where: { task_id: taskId, participant_id: participantId } }
    );

    await logChange({
        tableName: 'task_participant',
        recordId: participantId,
        parentTable: 'task',
        parentId: taskId,
        action: 'UPDATE',
        oldData: { participant_id: participantId, role: oldRole },
        newData: { participant_id: participantId, role },
        changedBy
    });

    return res;
};

const removeParticipantFromTask = async (taskId, participantId, changedBy = null) => {
    const existing = await task_participant.findOne({ where: { task_id: taskId, participant_id: participantId } });
    const oldRole = existing ? existing.role : null;

    const res = await task_participant.destroy({
        where: { task_id: taskId, participant_id: participantId }
    });

    await logChange({
        tableName: 'task_participant',
        recordId: participantId,
        parentTable: 'task',
        parentId: taskId,
        action: 'DELETE',
        oldData: { participant_id: participantId, role: oldRole },
        changedBy
    });

    return res;
};

const exportTasks = async (taskIds = null) => {
    console.log('=== exportTasks ===');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tasks');

    sheet.columns = [
        { header: 'Task ID', key: 'task_id' },
        { header: 'Parent ID', key: 'parent_id' },
        { header: 'Title', key: 'title' },
        { header: 'Assigner', key: 'assigner' },
        { header: 'Created By', key: 'created_by' },
        { header: 'Participants', key: 'participants' },
        { header: 'Start Time', key: 'start_time' },
        { header: 'Due Date', key: 'due_date' },
        { header: 'Status', key: 'status' },
        { header: 'Priority', key: 'priority' },
        { header: 'Created At', key: 'created_at' },
        { header: 'Ended At', key: 'ended_at' },
        { header: 'Description', key: 'description' },
    ];

    const whereClause = taskIds && taskIds.length > 0
        ? { task_id: { [Op.in]: taskIds } }
        : {};

    const tasks = await task.findAll({
        where: whereClause,
        include: [
            {
                model: person,
                as: 'assigner',
                attributes: ['name']
            },
            {
                model: person,
                as: 'creator',
                attributes: ['name']
            },
            {
                model: person,
                as: 'participants',
                attributes: ['name']
            }
        ]
    });

    const formatDate = (val) => {
        if (!val) return '';
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 19).replace('T', ' ');
    };

    tasks.forEach(t => {
        const participantNames = t.participants ? t.participants.map(p => p.name).join(', ') : '';
        sheet.addRow({
            task_id: t.task_id,
            parent_id: t.parent_id ?? '',
            title: t.title ?? '',
            assigner: t.assigner?.name ?? '',
            created_by: t.creator?.name ?? '',
            participants: participantNames,
            start_time: formatDate(t.start_time),
            due_date: formatDate(t.due_date),
            status: t.status ?? '',
            priority: t.priority ?? '',
            created_at: formatDate(t.created_at),
            ended_at: formatDate(t.ended_at),
            description: t.description ?? '',
        });
    });

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
    };
    headerRow.alignment = { horizontal: 'center' };

    const MAX_WIDTHS = {
        title: 60,
        description: 50,
    };
    // Auto-fit columns
    sheet.columns.forEach(column => {
        let maxLength = column.header?.length ?? 10;
        column.eachCell({ includeEmpty: false }, cell => {
            const len = cell.value ? cell.value.toString().length : 0;
            if (len > maxLength) maxLength = len;
        });

        const cap = MAX_WIDTHS[column.key];
        column.width = cap ? Math.min(maxLength + 4, cap) : maxLength + 4;
    });

    return workbook;
};

const HEADER_MAP = {
    'title': 'title',
    'tiêu đề': 'title',
    'tên công việc': 'title',

    'start time': 'start_time',
    'start_time': 'start_time',
    'start date': 'start_time',
    'start_date': 'start_time',
    'thời gian bắt đầu': 'start_time',
    'ngày bắt đầu': 'start_time',

    'due date': 'due_date',
    'due_date': 'due_date',
    'due time': 'due_date',
    'due_time': 'due_date',
    'due_time/due_date': 'due_date',
    'hạn chót': 'due_date',
    'hạn hoàn thành': 'due_date',
    'ngày hết hạn': 'due_date',
    'thời gian hoàn thành': 'due_date',

    'status': 'status',
    'trạng thái': 'status',

    'priority': 'priority',
    'độ ưu tiên': 'priority',
    'mức độ ưu tiên': 'priority',

    'ended at': 'ended_at',
    'ended_at': 'ended_at',
    'kết thúc lúc': 'ended_at',

    'description': 'description',
    'mô tả': 'description',
};

const VALID_STATUS = ['pending', 'completed', 'in progress', 'overdue'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

const previewImportTasks = async (fileBuffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('File Excel không có sheet nào.');

    const headers = [];
    const colMap = {};
    sheet.getRow(1).eachCell((cell, colNumber) => {
        const rawVal = extractCellValue(cell.value);
        if (rawVal !== undefined && rawVal !== null) {
            const headerName = rawVal.toString().trim();
            headers.push({ index: colNumber, name: headerName });
            const normalized = headerName.toLowerCase();
            const key = HEADER_MAP[normalized];
            if (key) colMap[colNumber] = key;
        }
    });

    const formatDateString = (d) => {
        if (!d || isNaN(d.getTime())) return '';
        const pad = n => n < 10 ? '0' + n : n;
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const parsedRows = [];
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // bỏ qua header

        const entry = {};
        Object.entries(colMap).forEach(([colIndex, key]) => {
            const cell = row.getCell(parseInt(colIndex, 10));
            entry[key] = extractCellValue(cell.value);
        });

        const titleStr = entry.title ? entry.title.toString().trim() : '';
        const descStr = entry.description ? entry.description.toString().trim() : '';
        const statusStr = entry.status ? entry.status.toString().trim().toLowerCase() : 'pending';
        const priorityStr = entry.priority ? entry.priority.toString().trim().toLowerCase() : 'medium';

        const rawStartTimeStr = entry.start_time !== undefined && entry.start_time !== null ? entry.start_time.toString().replace(/^['"]+/, '').trim() : '';
        const rawDueDateStr = entry.due_date !== undefined && entry.due_date !== null ? entry.due_date.toString().replace(/^['"]+/, '').trim() : '';

        const startTime = parseDateValue(entry.start_time);
        const dueDate = parseDateValue(entry.due_date);

        const errors = [];
        if (!titleStr) {
            errors.push('Vui lòng nhập tên công việc');
        }
        if (rawStartTimeStr && !startTime) {
            errors.push(`Thời gian bắt đầu "${rawStartTimeStr}" không hợp lệ (ngày không tồn tại trên lịch)`);
        }
        if (rawDueDateStr && !dueDate) {
            errors.push(`Thời gian hạn chót "${rawDueDateStr}" không hợp lệ (ngày không tồn tại trên lịch)`);
        }
        if (startTime && dueDate && dueDate < startTime) {
            errors.push('Ngày hạn chót không được trước Ngày bắt đầu');
        }
        if (statusStr && !VALID_STATUS.includes(statusStr)) {
            errors.push(`Trạng thái "${statusStr}" không hợp lệ`);
        }
        if (priorityStr && !VALID_PRIORITY.includes(priorityStr)) {
            errors.push(`Độ ưu tiên "${priorityStr}" không hợp lệ`);
        }

        parsedRows.push({
            rowNumber,
            title: titleStr,
            description: descStr,
            start_time: startTime ? formatDateString(startTime) : rawStartTimeStr,
            due_date: dueDate ? formatDateString(dueDate) : rawDueDateStr,
            status: VALID_STATUS.includes(statusStr) ? statusStr : 'pending',
            priority: VALID_PRIORITY.includes(priorityStr) ? priorityStr : 'medium',
            isValid: errors.length === 0,
            errors
        });
    });

    return { headers, rows: parsedRows };
};

const extractCellValue = (raw) => {
    if (raw === undefined || raw === null) return null;
    if (raw instanceof Date) return raw;
    if (typeof raw === 'object') {
        if (raw.result !== undefined && raw.result !== null) {
            if (raw.result instanceof Date) return raw.result;
            return raw.result;
        }
        if (raw.text !== undefined && raw.text !== null) {
            return raw.text;
        }
        if (raw.richText && Array.isArray(raw.richText)) {
            return raw.richText.map(rt => rt.text).join('');
        }
    }
    return raw;
};

const parseDateValue = (val) => {
    if (val === undefined || val === null || val === '') return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

    if (typeof val === 'number') {
        // Excel serial date format (typically between 30000 and 60000)
        if (val > 30000 && val < 60000) {
            const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
            return isNaN(jsDate.getTime()) ? null : jsDate;
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }

    // Strip leading single or double quotes (e.g. '2026-06-29)
    const strVal = val.toString().replace(/^['"]+/, '').trim();
    if (!strVal) return null;

    // Try format YYYY-MM-DD or YYYY/MM/DD (Local Time to prevent UTC timezone shifts)
    const ymdMatch = strVal.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        const hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
        const minute = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
        const second = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
        const d = new Date(year, month, day, hour, minute, second);
        // Strict calendar check: ensure day/month did not roll over (e.g. June 31 -> July 1)
        if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            return d;
        }
        return null;
    }

    // Try format DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
        const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
        const second = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
        const d = new Date(year, month, day, hour, minute, second);
        // Strict calendar check
        if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            return d;
        }
        return null;
    }

    let d = new Date(strVal);
    if (!isNaN(d.getTime())) return d;

    return null;
};

const importTasks = async (fileBuffer, assignerId, createdBy, customMapping) => {
    console.log('=== importTasks ===');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('File Excel không có sheet nào.');

    // Đọc header từ dòng 1
    const colMap = {}; // colIndex -> key chuẩn

    if (customMapping && Object.keys(customMapping).length > 0) {
        Object.entries(customMapping).forEach(([colIndex, key]) => {
            if (key) colMap[colIndex] = key;
        });
    } else {
        sheet.getRow(1).eachCell((cell, colIndex) => {
            const rawVal = extractCellValue(cell.value);
            if (!rawVal) return;
            const normalized = rawVal.toString().trim().toLowerCase();
            const key = HEADER_MAP[normalized];
            if (key) colMap[colIndex] = key;
        });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const rowsToInsert = [];

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // bỏ header

        const entry = {};

        Object.entries(colMap).forEach(([colIndex, key]) => {
            const cell = row.getCell(parseInt(colIndex, 10));
            const raw = extractCellValue(cell.value);
            entry[key] = raw;
        });

        // Bỏ qua dòng trống
        const titleStr = entry.title ? entry.title.toString().trim() : null;
        if (!titleStr) {
            results.errors.push({ row: rowNumber, reason: 'Vui lòng nhập title' });
            results.failed++;
            return;
        }

        const statusStr = entry.status ? entry.status.toString().trim() : null;
        const priorityStr = entry.priority ? entry.priority.toString().trim() : null;

        // Validate enums
        if (statusStr && !VALID_STATUS.includes(statusStr.toLowerCase())) {
            results.errors.push({ row: rowNumber, reason: `status không hợp lệ: "${statusStr}", chỉ chấp nhận các giá trị pending, completed, in progress, overdue` });
            results.failed++;
            return;
        }

        if (priorityStr && !VALID_PRIORITY.includes(priorityStr.toLowerCase())) {
            results.errors.push({ row: rowNumber, reason: `priority không hợp lệ: "${priorityStr}", chỉ chấp nhận các giá trị low, medium, high` });
            results.failed++;
            return;
        }

        const startTime = parseDateValue(entry.start_time);
        const dueDate = parseDateValue(entry.due_date);

        if (startTime && dueDate && dueDate < startTime) {
            results.errors.push({ row: rowNumber, reason: `Ngày hạn chót (due_date) không được trước Ngày bắt đầu (start_time)` });
            results.failed++;
            return;
        }

        const startTimeFormatted = formatForDatabase(startTime);
        const dueDateFormatted = formatForDatabase(dueDate);

        rowsToInsert.push({
            title: titleStr,
            start_time: startTimeFormatted,
            due_date: dueDateFormatted,
            status: statusStr?.toLowerCase() || 'pending',
            priority: priorityStr?.toLowerCase() || 'medium',
            ended_at: formatForDatabase(parseDateValue(entry.ended_at)),
            description: entry.description ? entry.description.toString().trim() : null,
            assigner_id: assignerId,
            created_by: createdBy,
            created_at: new Date(),
        });
    });

    // Bulk insert
    if (rowsToInsert.length > 0) {
        try {
            await task.bulkCreate(rowsToInsert);
            results.success = rowsToInsert.length;
        } catch (err) {
            throw new Error(`bulkCreate thất bại: ${err.message}`);
        }
    }

    return results;
};

const formatForDatabase = (val) => {
    if (!val) return null;
    let d = val instanceof Date ? val : parseDateValue(val);
    if (!d || isNaN(d.getTime())) return null;
    const pad = n => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const importDirectTasks = async (taskList, assignerId, createdBy) => {
    if (!Array.isArray(taskList) || taskList.length === 0) {
        throw new Error('Danh sách công việc rỗng');
    }

    const rowsToInsert = [];
    taskList.forEach(item => {
        const title = item.title ? item.title.toString().trim() : '';
        if (!title) return;

        const startTime = parseDateValue(item.start_time);
        const dueDate = parseDateValue(item.due_date);
        const status = VALID_STATUS.includes(item.status?.toLowerCase()) ? item.status.toLowerCase() : 'pending';
        const priority = VALID_PRIORITY.includes(item.priority?.toLowerCase()) ? item.priority.toLowerCase() : 'medium';

        rowsToInsert.push({
            title,
            start_time: formatForDatabase(startTime),
            due_date: formatForDatabase(dueDate),
            status,
            priority,
            description: item.description ? item.description.toString().trim() : null,
            assigner_id: assignerId,
            created_by: createdBy,
            created_at: new Date()
        });
    });

    if (rowsToInsert.length === 0) {
        throw new Error('Không có dòng hợp lệ nào để import');
    }

    await task.bulkCreate(rowsToInsert);
    return { success: rowsToInsert.length };
};

const exportTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template');

    sheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Start Time', key: 'start_time', width: 20 },
        { header: 'Due Date', key: 'due_date', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Priority', key: 'priority', width: 15 },
    ];

    // Add a sample row to guide the user (optional, but helpful)
    sheet.addRow({
        title: 'Task Mẫu',
        description: 'Mô tả công việc mẫu',
        start_time: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        status: 'pending',
        priority: 'medium',
    });

    // Add list data validations for Status and Priority columns (up to row 100)
    for (let i = 2; i <= 100; i++) {
        sheet.getCell(`E${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"pending,completed,in progress,overdue"'],
            showErrorMessage: true,
            errorTitle: 'Trạng thái không hợp lệ',
            error: 'Vui lòng chọn trạng thái từ danh sách.'
        };
        sheet.getCell(`F${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"low,medium,high"'],
            showErrorMessage: true,
            errorTitle: 'Mức độ ưu tiên không hợp lệ',
            error: 'Vui lòng chọn mức độ ưu tiên từ danh sách.'
        };
    }

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
    };
    headerRow.alignment = { horizontal: 'center' };

    return workbook;
};

const getTaskStatusHistory = async (taskId) => {
    const histories = await change_history.findAll({
        where: {
            [Op.or]: [
                { table_name: 'task', record_id: taskId },
                { parent_table: 'task', parent_id: taskId }
            ]
        },
        include: [
            {
                model: person,
                as: 'changer',
                attributes: ['person_id', 'name', 'username']
            }
        ],
        order: [['created_at', 'DESC']]
    });

    // Collect all participant_ids referenced in history
    const participantIds = new Set();
    histories.forEach(h => {
        if (h.table_name === 'task_participant') {
            const pId = h.changed_data?.participant_id || h.old_data?.participant_id || h.record_id;
            if (pId) participantIds.add(Number(pId));
        }
    });

    let personMap = {};
    if (participantIds.size > 0) {
        const persons = await person.findAll({
            where: { person_id: { [Op.in]: Array.from(participantIds) } },
            attributes: ['person_id', 'name', 'username']
        });
        persons.forEach(p => {
            personMap[p.person_id] = p.name || p.username;
        });
    }

    return histories.map(h => {
        const hJson = h.toJSON();
        if (hJson.table_name === 'task_participant') {
            const pId = hJson.changed_data?.participant_id || hJson.old_data?.participant_id || hJson.record_id;
            if (pId) {
                hJson.target_person_id = pId;
                hJson.target_person_name = personMap[pId] || `ID: ${pId}`;
            }
        }
        return hJson;
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
    removeParticipantFromTask,
    exportTasks,
    previewImportTasks,
    importTasks,
    importDirectTasks,
    exportTemplate,
    getTaskStatusHistory
};