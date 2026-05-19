const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileAttachmentController = require('../controllers/fileAttachmentController');
const fileService = require('../services/fileService');

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
            cb(new Error(`File type ${file.mimetype} with extension ${ext} is not allowed`));
        }
    }
});

// Routes
router.post('/upload', upload.single('file'), fileAttachmentController.uploadAttachment);
router.get('/:attachable_type/:attachable_id', fileAttachmentController.getAttachments);
router.delete('/:file_attachment_id', fileAttachmentController.deleteAttachment);
router.delete('/:attachable_type/:attachable_id/all', fileAttachmentController.deleteAttachmentsByEntity);

module.exports = router;
