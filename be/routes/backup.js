const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authorize } = require('../middleware/auth');

// Chỉ admin mới được phép thực hiện tất cả các hành động backup
router.post('/create', authorize('admin'), backupController.createBackup);
router.get('/progress', authorize('admin'), backupController.getBackupProgress);
router.get('/list', authorize('admin'), backupController.getBackupList);
router.get('/download/:id', authorize('admin'), backupController.downloadBackup);
router.delete('/:id', authorize('admin'), backupController.deleteBackup);

module.exports = router;
