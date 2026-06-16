const { task, person, task_participant, task_attachment, comment, comment_attachment } = require('../models');
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
            } catch (error) {
                console.error('Error fetching participants or sending task emails in background:', error);
            }
        })();
    }

    return parentTask;
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

const checkAndUpdateOverdueStatus = async (taskInstance) => {
    if (
        taskInstance.due_date &&
        new Date(taskInstance.due_date).getTime() < Date.now() &&
        taskInstance.status !== 'completed'
    ) {
        if (taskInstance.status !== 'overdue') {
            await taskInstance.update({ status: 'overdue' });
        }
    } else if (
        taskInstance.due_date &&
        new Date(taskInstance.due_date).getTime() >= Date.now() &&
        taskInstance.status === 'overdue'
    ) {
        await taskInstance.update({ status: 'pending' });
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

const updateTask = async (id, data) => {
    const parentTask = await task.findByPk(id);
    if (!parentTask) throw new Error('Task not found');

    return await sequelize.transaction(async (t) => {
        if (data.due_date && new Date(data.due_date).getTime() >= Date.now() && parentTask.status === 'overdue') {
            data.status = 'pending';
        }
        const updatedParent = await parentTask.update(data, { transaction: t });

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
};

const updateTaskTitleOrDescription = async (id, { title, description }) => {
    const targetTask = await task.findByPk(id);
    if (!targetTask) throw new Error('Task not found');
    return await targetTask.update({ title, description });
};

const deleteTaskRecursive = async (id, t) => {
    const childTasks = await task.findAll({
        where: { parent_id: id },
        transaction: t
    });

    for (const child of childTasks) {
        await deleteTaskRecursive(child.task_id, t);
    }

    await comment.destroy({ where: { task_id: id }, transaction: t });

    await task.destroy({ where: { task_id: id }, transaction: t });
};

const deleteTask = async (id) => {
    return await sequelize.transaction(async (t) => {
        const targetTask = await task.findByPk(id, { transaction: t });

        if (!targetTask) {
            throw new Error('Task not found hehe');
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

const addParticipantToTask = async (taskId, { participant_id, role }) => {
    const participant = await task_participant.create({
        task_id: taskId,
        participant_id,
        role
    });

    try {
        const targetTask = await task.findByPk(taskId);
        const p = await person.findByPk(participant_id);
        if (targetTask && p && p.email) {
            const assigner = await person.findByPk(targetTask.assigner_id);
            const assignerName = assigner ? assigner.name : 'Người quản lý';
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
    } catch (error) {
        console.error('Error sending task email to added participant:', error);
    }

    return participant;
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
    'start time': 'start_time',
    'start_time': 'start_time',
    'due date': 'due_date',
    'due_date': 'due_date',
    'status': 'status',
    'priority': 'priority',
    'ended at': 'ended_at',
    'ended_at': 'ended_at',
    'description': 'description',
};

const VALID_STATUS = ['pending', 'completed', 'in progress', 'overdue'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

const previewImportTasks = async (fileBuffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('File Excel không có sheet nào.');

    const headerRow = sheet.getRow(1).values;
    const headers = [];
    if (headerRow) {
        headerRow.forEach((header, index) => {
            if (header) {
                headers.push({ index, name: header.toString().trim() });
            }
        });
    }
    return headers;
};

const importTasks = async (fileBuffer, assignerId, createdBy, customMapping) => {
    console.log('=== importTasks ===');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('File Excel không có sheet nào.');

    // Đọc header từ dòng 1
    const headerRow = sheet.getRow(1).values; // index bắt đầu từ 1
    const colMap = {}; // colIndex -> key chuẩn

    if (customMapping && Object.keys(customMapping).length > 0) {
        Object.entries(customMapping).forEach(([colIndex, key]) => {
            if (key) colMap[colIndex] = key;
        });
    } else {
        headerRow.forEach((header, colIndex) => {
            if (!header) return;
            const normalized = header.toString().trim().toLowerCase();
            const key = HEADER_MAP[normalized];
            if (key) colMap[colIndex] = key;
        });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const rowsToInsert = [];

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // bỏ header

        const values = row.values; // 1-indexed
        const entry = {};

        Object.entries(colMap).forEach(([colIndex, key]) => {
            const raw = values[colIndex];
            entry[key] = raw !== undefined && raw !== null ? raw.toString().trim() : null;
        });

        // Bỏ qua dòng trống
        if (!entry.title) {
            results.errors.push({ row: rowNumber, reason: 'Vui lòng nhập title' });
            results.failed++;
            return;
        }

        // Validate enums
        if (entry.status && !VALID_STATUS.includes(entry.status.toLowerCase())) {
            results.errors.push({ row: rowNumber, reason: `status không hợp lệ: "${entry.status}", chỉ chấp nhận các giá trị pending, completed, in progress, overdue` });
            results.failed++;
            return;
        }

        if (entry.priority && !VALID_PRIORITY.includes(entry.priority.toLowerCase())) {
            results.errors.push({ row: rowNumber, reason: `priority không hợp lệ: "${entry.priority}", chỉ chấp nhận các giá trị low, medium, high` });
            results.failed++;
            return;
        }

        // Parse dates — chấp nhận cả chuỗi ISO lẫn Date object từ Excel
        const parseDate = (val) => {
            if (!val) return null;
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        };

        rowsToInsert.push({
            title: entry.title,
            start_time: parseDate(entry.start_time),
            due_date: parseDate(entry.due_date),
            status: entry.status?.toLowerCase() || 'pending',
            priority: entry.priority?.toLowerCase() || 'medium',
            ended_at: parseDate(entry.ended_at),
            description: entry.description || null,
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
    exportTemplate
};