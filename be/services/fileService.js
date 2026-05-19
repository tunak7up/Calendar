const fs = require('fs');
const path = require('path');
const fileAttachment = require('../models/fileAttachment');

// Configuration
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/rar',
    'application/x-7z-compressed'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpeg', '.jpg', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.zip', '.rar', '.7z'];

// Ensure uploads directory exists
const ensureUploadsDir = () => {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
};

// Validate file
const validateFile = (file) => {
    if (!file) {
        throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`File type ${file.mimetype} with extension ${ext} is not allowed`);
    }

    return true;
};

// Save file to disk
const saveFileToDisk = (file) => {
    ensureUploadsDir();
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = path.parse(file.originalname);
    const fileName = `${timestamp}-${randomStr}-${originalName.name}${originalName.ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, file.buffer);
    
    return {
        fileName,
        filePath,
        url: `/uploads/${fileName}`,
        originalName: file.originalname
    };
};

// Create file attachment record
const createFileAttachment = async (attachable_type, attachable_id, fileData) => {
    try {
        let finalName = fileData.originalName;
        
        // Handle name collision
        const existingAttachments = await fileAttachment.findAll({
            where: { attachable_type, attachable_id }
        });
        const existingNames = existingAttachments.map(a => a.file_name);
        
        if (existingNames.includes(finalName)) {
            const ext = path.extname(finalName);
            const base = path.basename(finalName, ext);
            let counter = 1;
            while (existingNames.includes(`${base}(${counter})${ext}`)) {
                counter++;
            }
            finalName = `${base}(${counter})${ext}`;
        }

        const attachment = await fileAttachment.create({
            attachable_type,
            attachable_id,
            url: fileData.url,
            file_name: finalName,
            file_type: fileData.mimeType,
            file_size: fileData.fileSize
        });
        return attachment;
    } catch (error) {
        // Delete file if DB insert fails
        if (fs.existsSync(fileData.filePath)) {
            fs.unlinkSync(fileData.filePath);
        }
        throw error;
    }
};

// Upload file handler (for Express middleware)
const uploadFile = (file, attachable_type, attachable_id) => {
    try {
        validateFile(file);
        const savedFile = saveFileToDisk(file);
        
        return {
            ...savedFile,
            mimeType: file.mimetype,
            fileSize: file.size
        };
    } catch (error) {
        throw error;
    }
};

// Get attachments by type and ID
const getAttachments = async (attachable_type, attachable_id) => {
    try {
        const attachments = await fileAttachment.findAll({
            where: {
                attachable_type,
                attachable_id
            }
        });
        return attachments;
    } catch (error) {
        throw new Error(`Error retrieving attachments: ${error.message}`);
    }
};

// Delete attachment
const deleteAttachment = async (file_attachment_id) => {
    try {
        const attachment = await fileAttachment.findByPk(file_attachment_id);
        if (!attachment) {
            throw new Error('Attachment not found');
        }

        // Delete file from disk
        const actualFileName = path.basename(attachment.url);
        const filePath = path.join(UPLOADS_DIR, actualFileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete record from DB
        await attachment.destroy();
        return true;
    } catch (error) {
        throw error;
    }
};

// Delete all attachments for an entity
const deleteAttachmentsByEntity = async (attachable_type, attachable_id) => {
    try {
        const attachments = await fileAttachment.findAll({
            where: {
                attachable_type,
                attachable_id
            }
        });

        // Delete files from disk
        for (const attachment of attachments) {
            const actualFileName = path.basename(attachment.url);
            const filePath = path.join(UPLOADS_DIR, actualFileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete records from DB
        await fileAttachment.destroy({
            where: {
                attachable_type,
                attachable_id
            }
        });

        return true;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    uploadFile,
    createFileAttachment,
    getAttachments,
    deleteAttachment,
    deleteAttachmentsByEntity,
    validateFile,
    UPLOADS_DIR,
    MAX_FILE_SIZE,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    ensureUploadsDir
};
