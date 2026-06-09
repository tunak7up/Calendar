const { get } = require('../routes');
const taskService = require('../services/taskService');
const { sendRes } = require('../utils/responseHelper');

const createTask = async (req, res) => {
    try {
        const data = { ...req.body, created_by: req.user ? req.user.person_id : req.body.created_by };
        const task = await taskService.createTask(data);
        sendRes(res, 201, 'Task created successfully', task);
    } catch (error) {
        console.error('Error in createTask:', error);
        sendRes(res, 400, 'Error creating task', null, error.message);
    }
};

const createSubTask = async (req, res) => {
    try {
        const data = { ...req.body, created_by: req.user ? req.user.person_id : req.body.created_by };
        const task = await taskService.createSubTask(req.params.parentId, data);
        sendRes(res, 201, 'Sub-task created successfully', task);
    } catch (error) {
        console.error('Error in createSubTask:', error);
        sendRes(res, 400, 'Error creating sub-task', null, error.message);
    }
};

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        sendRes(res, 200, 'Task retrieved successfully', task);
    } catch (error) {
        sendRes(res, 404, 'Task not found', null, error.message);
    }
};

const getChildTasksByParentId = async (req, res) => {
    try {
        const childTasks = await taskService.getChildTasksByParentId(req.params.parentId);
        sendRes(res, 200, 'Child tasks retrieved successfully', childTasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving child tasks', null, error.message);
    }
};

const getTasksByTimeRange = async (req, res) => {
    try {
        const { startTime, endTime } = req.query;
        const tasks = await taskService.getTasksByTimeRange(startTime, endTime);
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const getAllTasksByParticipantsId = async (req, res) => {
    try {
        const participantId = req.params.participantId;
        const tasks = await taskService.getAllTasksByParticipantsId(participantId);
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        sendRes(res, 200, 'Task updated successfully', task);
    } catch (error) {
        sendRes(res, 404, 'Task not found', null, error.message);
    }
};

const deleteTask = async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id);
        sendRes(res, 200, 'Task deleted successfully', null);
    } catch (error) {
        sendRes(res, 404, 'Task not found', null, error.message);
    }
};

const createTaskAttachment = async (req, res) => {
    try {
        const attachment = await taskService.createTaskAttachment(req.body);
        sendRes(res, 201, 'Task attachment created successfully', attachment);
    } catch (error) {
        sendRes(res, 400, 'Error creating task attachment', null, error.message);
    }
};

const getAttachmentsByTaskId = async (req, res) => {
    try {
        const attachments = await taskService.getAttachmentsByTaskId(req.params.taskId);
        sendRes(res, 200, 'Attachments retrieved successfully', attachments);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving attachments', null, error.message);
    }
};

const getAllTasksByPersonId = async (req, res) => {
    try {
        const personId = req.params.personId;
        const tasks = await taskService.getAllTasksByPersonId(personId);
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const getAllPendingTasksByPersonId = async (req, res) => {
    try {
        const personId = req.params.personId;
        const tasks = await taskService.getAllPendingTasksByPersonId(personId);
        sendRes(res, 200, 'Pending tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving pending tasks', null, error.message);
    }
};

const getTasksBeforeDueDate = async (req, res) => {
    try {
        const personId = req.params.personId;
        const tasks = await taskService.getTasksBeforeDueDate(personId, req.body);
        sendRes(res, 200, 'Tasks retrieved successfully', tasks);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving tasks', null, error.message);
    }
};

const updateTaskTitleOrDescription = async (req, res) => {
    try {
        const task = await taskService.updateTaskTitleOrDescription(req.params.id, req.body);
        sendRes(res, 200, 'Task updated successfully', task
        );
    } catch (error) {
        sendRes(res, 404, 'Task not found', null, error.message);
    }
};
const addParticipantToTask = async (req, res) => {
    try {
        const participant = await taskService.addParticipantToTask(req.params.id, req.body);
        sendRes(res, 201, 'Participant added successfully', participant);
    } catch (error) {
        console.error('Error in addParticipantToTask:', error);
        sendRes(res, 400, 'Error adding participant', null, error.message);
    }
};

const updateParticipantRole = async (req, res) => {
    try {
        const { id, participantId } = req.params;
        await taskService.updateParticipantRole(id, participantId, req.body);
        sendRes(res, 200, 'Participant role updated successfully', null);
    } catch (error) {
        console.error('Error in updateParticipantRole:', error);
        sendRes(res, 400, 'Error updating role', null, error.message);
    }
};

const removeParticipantFromTask = async (req, res) => {
    try {
        const { id, participantId } = req.params;
        await taskService.removeParticipantFromTask(id, participantId);
        sendRes(res, 200, 'Participant removed successfully', null);
    } catch (error) {
        console.error('Error in removeParticipantFromTask:', error);
        sendRes(res, 400, 'Error removing participant', null, error.message);
    }
};

const exportTasks = async (req, res) => {
    try {
        const taskIds = req.body?.taskIds || req.query?.taskIds;
        const workbook = await taskService.exportTasks(taskIds);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        sendRes(res, 400, 'Error exporting tasks', null, error.message);
    }
};

const exportTemplate = async (req, res) => {
    try {
        const workbook = await taskService.exportTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=import_template.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        sendRes(res, 400, 'Error exporting template', null, error.message);
    }
};

const importTasks = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Kh?ng t?m th?y file upload.' });
        }

        const assignerId = req.user.person_id;
        const createdBy = req.user.person_id;

        const result = await taskService.importTasks(req.file.buffer, assignerId, createdBy);

        return res.status(200).json({
            message: `Import ho?n t?t. Th?nh c?ng: ${result.success}, Th?t b?i: ${result.failed}.`,
            ...result
        });
    } catch (err) {
        console.error('importTasks error:', err);
        return res.status(500).json({ message: err.message });
    }
};
module.exports = {
    createTask,
    createSubTask,
    getAllTasks,
    getTaskById,
    getChildTasksByParentId,
    getAllTasksByParticipantsId,
    getTasksByTimeRange,
    updateTask,
    deleteTask,
    createTaskAttachment,
    getAttachmentsByTaskId,
    getAllTasksByPersonId,
    getAllPendingTasksByPersonId,
    getTasksBeforeDueDate,
    updateTaskTitleOrDescription,
    addParticipantToTask,
    updateParticipantRole,
    removeParticipantFromTask,
    exportTasks,
    importTasks,
    exportTemplate
};