const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const backupController = require('../controllers/backupController');
const restoreService = require('../services/restoreService');
const { authorize } = require('../middleware/auth');
const { sendRes } = require('../utils/responseHelper');

// Giới hạn dung lượng file backup upload để restore (mặc định 2GB, cấu hình qua RESTORE_MAX_UPLOAD_MB)
const RESTORE_MAX_UPLOAD_BYTES = (parseInt(process.env.RESTORE_MAX_UPLOAD_MB) || 2048) * 1024 * 1024;

// Lưu file upload trực tiếp xuống đĩa (file backup có thể rất lớn, không dùng memoryStorage)
const restoreUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            try {
                restoreService.ensureRestoreTmpDir();
                cb(null, restoreService.RESTORE_TMP_DIR);
            } catch (err) {
                cb(err);
            }
        },
        filename: (req, file, cb) => {
            cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.zip`);
        }
    }),
    limits: { fileSize: RESTORE_MAX_UPLOAD_BYTES },
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
            return cb(new Error('Chỉ chấp nhận file Full Backup định dạng .zip'));
        }
        cb(null, true);
    }
});

const handleRestoreUpload = (req, res, next) => {
    restoreUpload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            const msg = err.code === 'LIMIT_FILE_SIZE'
                ? `File backup vượt quá giới hạn ${Math.round(RESTORE_MAX_UPLOAD_BYTES / (1024 * 1024))}MB`
                : `Lỗi upload file: ${err.message}`;
            return sendRes(res, 400, msg, null, msg);
        } else if (err) {
            return sendRes(res, 400, err.message, null, err.message);
        }
        next();
    });
};

// Chỉ quản lý/admin mới được phép thực hiện tất cả các hành động backup
router.post('/create', authorize('manager', 'admin'), backupController.createBackup);
router.get('/progress', authorize('manager', 'admin'), backupController.getBackupProgress);
router.get('/list', authorize('manager', 'admin'), backupController.getBackupList);
router.get('/download/:id', authorize('manager', 'admin'), backupController.downloadBackup);

// Restore (khôi phục dữ liệu) - đặt trước route '/:id'
router.get('/restore/progress', authorize('manager', 'admin'), backupController.getRestoreProgress);
router.post('/restore-upload', authorize('manager', 'admin'), handleRestoreUpload, backupController.restoreFromUpload);
router.post('/restore/:id', authorize('manager', 'admin'), backupController.restoreFromBackup);

router.delete('/:id', authorize('manager', 'admin'), backupController.deleteBackup);

module.exports = router;
