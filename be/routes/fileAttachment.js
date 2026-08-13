const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileAttachmentController = require('../controllers/fileAttachmentController');
const fileService = require('../services/fileService');

const { sendRes } = require('../utils/responseHelper');

// Setup multer for file uploads (store in memory, not on disk initially)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: fileService.MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        const ext = require('path').extname(file.originalname).toLowerCase();
        if (fileService.ALLOWED_MIME_TYPES.includes(file.mimetype) || (fileService.ALLOWED_EXTENSIONS && fileService.ALLOWED_EXTENSIONS.includes(ext))) {
            cb(null, true);
        } else {
            cb(new Error(`Định dạng file ${ext} (${file.mimetype}) không được hỗ trợ.`));
        }
    }
});

const handleMulterUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            let msg = `Lỗi upload file: ${err.message}`;
            if (err.code === 'LIMIT_FILE_SIZE') {
                const maxMb = Math.round(fileService.MAX_FILE_SIZE / (1024 * 1024));
                msg = `Dung lượng file vượt quá giới hạn tối đa ${maxMb}MB.`;
            }
            return sendRes(res, 400, msg, null, msg);
        } else if (err) {
            return sendRes(res, 400, err.message, null, err.message);
        }
        next();
    });
};

// Routes
router.post('/upload', handleMulterUpload, fileAttachmentController.uploadAttachment);
router.get('/:attachable_type/:attachable_id', fileAttachmentController.getAttachments);
router.delete('/:file_attachment_id', fileAttachmentController.deleteAttachment);
router.delete('/:attachable_type/:attachable_id/all', fileAttachmentController.deleteAttachmentsByEntity);

module.exports = router;
