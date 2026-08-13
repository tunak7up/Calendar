const fs = require('fs');
const path = require('path');
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3, bucketName, bucketRegion } = require('../config/aws');
const fileAttachment = require('../models/fileAttachment');
const { logChange } = require('../utils/changeLogger');
const { deletePhysicalFile } = require('../utils/fileHelper');

// Helper to extract S3 Key from any URL format
const extractS3Key = (fileUrl) => {
    if (!fileUrl) return null;
    try {
        let cleanUrl = String(fileUrl).trim().split('?')[0].split('#')[0];
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            const urlObj = new URL(cleanUrl);
            cleanUrl = urlObj.pathname;
        }
        cleanUrl = decodeURIComponent(cleanUrl).replace(/^\//, '');
        if (cleanUrl.startsWith('uploads/')) {
            return cleanUrl;
        }
    } catch (e) {
        console.error('[fileService] Error parsing S3 key:', e);
    }
    return null;
};

// Helper to generate S3 Presigned Download URL (valid for 1 hour by default)
const generatePresignedUrl = async (fileUrl, expiresIn = 3600) => {
    if (!fileUrl) return fileUrl;
    const isS3Url = fileUrl.includes('.amazonaws.com') || fileUrl.includes('s3.') || (process.env.STORAGE_TYPE === 's3' && fileUrl.startsWith('http'));
    if (isS3Url) {
        try {
            const s3Key = extractS3Key(fileUrl);
            if (!s3Key) return fileUrl;
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: s3Key
            });
            return await getSignedUrl(s3, command, { expiresIn });
        } catch (err) {
            console.error('[fileService] Error generating presigned URL:', err);
            return fileUrl;
        }
    }
    return fileUrl;
};

// Configuration
const UPLOADS_DIR = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../uploads');
const CDN_UPLOAD_URL = process.env.CDN_UPLOAD_URL || process.env.UPLOAD_URL_BASE || '';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
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
    'application/x-7z-compressed',
    'application/x-msdownload',
    'application/x-dosexec',
    'application/octet-stream',
    'application/x-executable'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpeg', '.jpg', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.zip', '.rar', '.7z', '.exe', '.apk', '.dmg', '.iso', '.bin'];

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

// Build file URL depending on configured CDN host
const buildFileUrl = (fileName) => {
    const urlPath = `/uploads/${fileName}`;
    if (!CDN_UPLOAD_URL) return urlPath;
    return `${CDN_UPLOAD_URL.replace(/\/+$/, '')}${urlPath}`;
};

// Save file to disk (Local Storage)
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
        url: buildFileUrl(fileName),
        originalName: file.originalname,
        storageProvider: 'local'
    };
};

// Save file to AWS S3
const saveFileToS3 = async (file) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = path.parse(file.originalname);
    const fileName = `${timestamp}-${randomStr}-${originalName.name}${originalName.ext}`;
    const s3Key = `uploads/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3.send(command);

    let url;
    if (CDN_UPLOAD_URL) {
        url = `${CDN_UPLOAD_URL.replace(/\/+$/, '')}/${s3Key}`;
    } else {
        const region = bucketRegion || 'ap-southeast-1';
        url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    }

    return {
        fileName,
        filePath: s3Key,
        url,
        originalName: file.originalname,
        storageProvider: 's3'
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

        if (attachable_type === 'task') {
            await logChange({
                tableName: 'file_attachment',
                recordId: attachment.file_attachment_id,
                parentTable: 'task',
                parentId: attachable_id,
                action: 'CREATE',
                newData: { file_name: attachment.file_name, file_type: attachment.file_type },
                changedBy: null
            });
        }

        const plainAttachment = attachment.toJSON();
        plainAttachment.url = await generatePresignedUrl(plainAttachment.url);
        return plainAttachment;
    } catch (error) {
        // Delete file if DB insert fails
        if (fileData.storageProvider === 's3') {
            try {
                await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileData.filePath }));
            } catch (s3Err) {
                console.error('[fileService] Error deleting S3 file on DB rollback:', s3Err);
            }
        } else if (fileData.filePath && fs.existsSync(fileData.filePath)) {
            fs.unlinkSync(fileData.filePath);
        }
        throw error;
    }
};

// Upload file handler (Orchestrator: supports local disk & S3 based on STORAGE_TYPE env)
const uploadFile = async (file, attachable_type, attachable_id) => {
    try {
        validateFile(file);

        const storageType = (process.env.STORAGE_TYPE || 'local').toLowerCase();
        let savedFile;

        if (storageType === 's3') {
            savedFile = await saveFileToS3(file);
        } else {
            savedFile = saveFileToDisk(file);
        }
        
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

        const result = await Promise.all(attachments.map(async (item) => {
            const data = item.toJSON();
            data.url = await generatePresignedUrl(data.url);
            return data;
        }));

        return result;
    } catch (error) {
        throw new Error(`Error retrieving attachments: ${error.message}`);
    }
};

// Helper to delete physical file from storage (S3 or Local Disk)
const deleteFileFromStorage = async (url) => {
    if (!url) return;
    const s3Key = extractS3Key(url);
    const isS3 = url.includes('.amazonaws.com') || url.includes('s3.') || (process.env.STORAGE_TYPE === 's3' && s3Key);

    if (isS3 && s3Key) {
        try {
            console.log(`[fileService] Deleting file from S3 bucket: ${bucketName}, key: ${s3Key}`);
            await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: s3Key }));
        } catch (s3Err) {
            console.error('[fileService] Error deleting file from S3:', s3Err);
        }
    }

    // Always attempt local disk deletion as well/fallback
    deletePhysicalFile(url);
};

// Delete attachment
const deleteAttachment = async (file_attachment_id) => {
    try {
        const attachment = await fileAttachment.findByPk(file_attachment_id);
        if (!attachment) {
            throw new Error('Attachment not found');
        }

        // Delete file physically (S3 or Local Disk)
        await deleteFileFromStorage(attachment.url);

        if (attachment.attachable_type === 'task') {
            await logChange({
                tableName: 'file_attachment',
                recordId: attachment.file_attachment_id,
                parentTable: 'task',
                parentId: attachment.attachable_id,
                action: 'DELETE',
                oldData: { file_name: attachment.file_name },
                changedBy: null
            });
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

        // Delete files physically (S3 or Local Disk)
        for (const attachment of attachments) {
            await deleteFileFromStorage(attachment.url);
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
    generatePresignedUrl,
    deleteFileFromStorage,
    validateFile,
    UPLOADS_DIR,
    MAX_FILE_SIZE,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    ensureUploadsDir
};
