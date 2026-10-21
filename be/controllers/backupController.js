const path = require('path');
const backupService = require('../services/backupService');
const { sendRes } = require('../utils/responseHelper');

/**
 * POST /api/backup/create
 * Admin kích hoạt backup thủ công (chạy nền và cập nhật tiến độ realtime)
 */
const createBackup = async (req, res) => {
    try {
        const createdBy = req.user?.person_id || null;

        if (backupService.isBackupRunning()) {
            return sendRes(res, 409, 'Một tiến trình sao lưu khác đang được thực hiện. Vui lòng chờ...', {
                progress: backupService.getProgress()
            });
        }

        console.log(`[BackupController] 🚀 Admin ID ${createdBy} kích hoạt backup thủ công...`);

        // Chạy backup trong background (không block request)
        backupService.createBackup({
            triggeredBy: 'manual',
            createdBy
        }).catch(err => {
            console.error('[BackupController] ❌ Background backup error:', err.message);
        });

        // Trả về 202 Accepted ngay lập tức với trạng thái tiến trình ban đầu
        sendRes(res, 202, 'Tiến trình sao lưu đã được khởi chạy thành công', {
            started: true,
            progress: backupService.getProgress()
        });
    } catch (error) {
        console.error('[BackupController] ❌ Lỗi tạo backup:', error);
        sendRes(res, 500, 'Lỗi khi tạo backup', null, error.message);
    }
};

/**
 * GET /api/backup/progress
 * Lấy trạng thái tiến trình sao lưu thời gian thực (% và tốc độ)
 */
const getBackupProgress = async (req, res) => {
    try {
        const progress = backupService.getProgress();
        sendRes(res, 200, 'Lấy tiến trình sao lưu thành công', progress);
    } catch (error) {
        sendRes(res, 500, 'Lỗi khi lấy tiến trình sao lưu', null, error.message);
    }
};

/**
 * GET /api/backup/list
 * Lấy danh sách backup
 */
const getBackupList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await backupService.getBackupList({ page, limit });
        sendRes(res, 200, 'Lấy danh sách backup thành công', result);
    } catch (error) {
        sendRes(res, 500, 'Lỗi khi lấy danh sách backup', null, error.message);
    }
};

/**
 * GET /api/backup/download/:id
 * Download file backup
 * - Nếu có S3: redirect tới presigned URL
 * - Nếu chỉ local: stream file về trực tiếp
 */
const downloadBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await backupService.getDownloadUrl(id);

        if (result.source === 's3' && result.downloadUrl) {
            // Redirect tới S3 presigned URL
            return res.redirect(302, result.downloadUrl);
        }

        if (result.source === 'local' && result.localPath) {
            // Stream file từ disk local
            const filename = path.basename(result.localPath);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/gzip');
            const fs = require('fs');
            const stream = fs.createReadStream(result.localPath);
            stream.on('error', () => sendRes(res, 404, 'File backup không tồn tại trên máy chủ'));
            return stream.pipe(res);
        }

        sendRes(res, 404, 'Không tìm thấy file backup');
    } catch (error) {
        sendRes(res, 500, 'Lỗi khi download backup', null, error.message);
    }
};

/**
 * DELETE /api/backup/:id
 * Xóa một backup record + file vật lý
 */
const deleteBackup = async (req, res) => {
    try {
        const { id } = req.params;
        await backupService.deleteBackup(id);
        sendRes(res, 200, 'Đã xóa backup thành công');
    } catch (error) {
        sendRes(res, error.message.includes('không tồn tại') ? 404 : 500, error.message, null, error.message);
    }
};

/**
 * POST /internal/cron/backup  (được gọi bởi cron/Lambda)
 * Trigger backup tự động theo lịch
 */
const triggerCronBackup = async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET_TOKEN;
        const providedSecret = req.headers['x-cron-secret'] ||
            (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);

        if (!cronSecret || providedSecret !== cronSecret) {
            console.warn('[BackupController] ⚠️ Unauthorized cron backup attempt');
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing x-cron-secret header' });
        }

        console.log('[BackupController] ⏰ Cron backup kích hoạt...');

        // Chạy backup không chờ (non-blocking) để trả response nhanh
        backupService.createBackup({ triggeredBy: 'cron', createdBy: null })
            .then(async (result) => {
                console.log(`[BackupController] ✅ Cron backup hoàn tất: ${result.log.filename}`);
                // Auto-cleanup giữ tối đa 30 bản cron
                await backupService.cleanupOldCronBackups(30).catch(err =>
                    console.error('[BackupController] Cleanup error:', err.message)
                );
            })
            .catch(err => {
                console.error('[BackupController] ❌ Cron backup lỗi:', err.message);
            });

        // Trả về ngay lập tức (không chờ backup xong)
        return res.json({
            success: true,
            message: 'Cron backup đã được kích hoạt',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createBackup,
    getBackupProgress,
    getBackupList,
    downloadBackup,
    deleteBackup,
    triggerCronBackup
};
