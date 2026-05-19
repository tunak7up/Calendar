const fileService = require('../services/fileService');
const { sendRes } = require('../utils/responseHelper');

// Upload attachment
const uploadAttachment = async (req, res) => {
    try {
        const { attachable_type, attachable_id } = req.body;

        if (!attachable_type || !attachable_id) {
            return sendRes(res, 400, 'attachable_type and attachable_id are required', null);
        }

        if (!req.file) {
            return sendRes(res, 400, 'No file provided', null);
        }

        const fileData = fileService.uploadFile(req.file, attachable_type, attachable_id);
        const attachment = await fileService.createFileAttachment(
            attachable_type,
            attachable_id,
            fileData
        );

        sendRes(res, 201, 'File uploaded successfully', attachment);
    } catch (error) {
        console.error('Error in uploadAttachment:', error);
        sendRes(res, 400, 'Error uploading file', null, error.message);
    }
};

// Get attachments
const getAttachments = async (req, res) => {
    try {
        const { attachable_type, attachable_id } = req.params;

        if (!attachable_type || !attachable_id) {
            return sendRes(res, 400, 'attachable_type and attachable_id are required', null);
        }

        const attachments = await fileService.getAttachments(attachable_type, attachable_id);
        sendRes(res, 200, 'Attachments retrieved successfully', attachments);
    } catch (error) {
        console.error('Error in getAttachments:', error);
        sendRes(res, 500, 'Error retrieving attachments', null, error.message);
    }
};

// Delete attachment
const deleteAttachment = async (req, res) => {
    try {
        const { file_attachment_id } = req.params;

        if (!file_attachment_id) {
            return sendRes(res, 400, 'file_attachment_id is required', null);
        }

        await fileService.deleteAttachment(file_attachment_id);
        sendRes(res, 200, 'File deleted successfully', null);
    } catch (error) {
        console.error('Error in deleteAttachment:', error);
        sendRes(res, 400, 'Error deleting attachment', null, error.message);
    }
};

// Delete all attachments for an entity
const deleteAttachmentsByEntity = async (req, res) => {
    try {
        const { attachable_type, attachable_id } = req.params;

        if (!attachable_type || !attachable_id) {
            return sendRes(res, 400, 'attachable_type and attachable_id are required', null);
        }

        await fileService.deleteAttachmentsByEntity(attachable_type, attachable_id);
        sendRes(res, 200, 'All attachments deleted successfully', null);
    } catch (error) {
        console.error('Error in deleteAttachmentsByEntity:', error);
        sendRes(res, 400, 'Error deleting attachments', null, error.message);
    }
};

module.exports = {
    uploadAttachment,
    getAttachments,
    deleteAttachment,
    deleteAttachmentsByEntity
};
