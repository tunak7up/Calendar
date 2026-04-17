const task_attachment = require('../services/taskAttachmentService');

const createTaskAttachment =  (req, res) => {
    try {
        const { task_id, url } = req.body;
        const attachment = task_attachment.createTaskAttachment({ task_id, url });
        res.json(attachment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAttachmentsByTaskId = async (req, res) => {
    try {
        const attachments = await task_attachment.getAttachmentsByTaskId(req.params.id);
        res.json(attachments);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = {
    createTaskAttachment,
    getAttachmentsByTaskId
};

