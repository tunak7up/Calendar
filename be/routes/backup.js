const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authorize } = require('../middleware/auth');

// Chỉ quản lý/admin mới được phép thực hiện tất cả các hành động backup
router.post('/create', authorize('manager', 'admin'), backupController.createBackup);
router.get('/progress', authorize('manager', 'admin'), backupController.getBackupProgress);
router.get('/list', authorize('manager', 'admin'), backupController.getBackupList);
router.get('/download/:id', authorize('manager', 'admin'), backupController.downloadBackup);
router.delete('/:id', authorize('manager', 'admin'), backupController.deleteBackup);

module.exports = router;
