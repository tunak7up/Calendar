const path = require('path');
const fs = require('fs');
const backupService = require('../services/backupService');
const restoreService = require('../services/restoreService');
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

        if (restoreService.isRestoreRunning()) {
            return sendRes(res, 409, 'Đang có tiến trình khôi phục dữ liệu, không thể sao lưu lúc này.');
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
            res.setHeader('Content-Type', filename.endsWith('.zip') ? 'application/zip' : 'application/gzip');
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

        if (restoreService.isRestoreRunning() || backupService.isBackupRunning()) {
            console.warn('[BackupController] ⚠️ Bỏ qua cron backup vì đang có tiến trình backup/restore chạy');
            return res.json({ success: false, message: 'Đang có tiến trình backup/restore chạy, bỏ qua lần này' });
        }

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

const parseBool = (val, defaultVal = true) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    return !(val === false || val === 'false' || val === '0' || val === 0);
};

const checkRestoreBusy = (res) => {
    if (restoreService.isRestoreRunning()) {
        sendRes(res, 409, 'Một tiến trình khôi phục khác đang chạy. Vui lòng chờ...', {
            progress: restoreService.getRestoreProgress()
        });
        return true;
    }
    if (backupService.isBackupRunning()) {
        sendRes(res, 409, 'Đang có tiến trình sao lưu chạy, vui lòng chờ hoàn tất rồi thử lại.');
        return true;
    }
    return false;
};

/**
 * POST /api/backup/restore/:id
 * Khôi phục dữ liệu từ một bản backup có sẵn trong danh sách (chạy nền)
 * Body: { restoreFiles?: boolean, safetyBackup?: boolean }
 */
const restoreFromBackup = async (req, res) => {
    try {
        if (checkRestoreBusy(res)) return;

        const backupId = parseInt(req.params.id);
        if (!backupId) return sendRes(res, 400, 'ID backup không hợp lệ');

        const requestedBy = req.user?.person_id || null;
        console.log(`[BackupController] ♻️ Admin ID ${requestedBy} khôi phục từ backup ID ${backupId}...`);

        restoreService.restoreBackup({
            backupId,
            restoreFiles: parseBool(req.body?.restoreFiles),
            safetyBackup: parseBool(req.body?.safetyBackup),
            requestedBy
        }).catch(err => console.error('[BackupController] ❌ Background restore error:', err.message));

        sendRes(res, 202, 'Tiến trình khôi phục đã được khởi chạy', {
            started: true,
            progress: restoreService.getRestoreProgress()
        });
    } catch (error) {
        sendRes(res, 500, 'Lỗi khi khôi phục dữ liệu', null, error.message);
    }
};

/**
 * POST /api/backup/restore-upload  (multipart/form-data, field: file)
 * Khôi phục dữ liệu từ file Full Backup ZIP được upload từ máy admin
 */
const restoreFromUpload = async (req, res) => {
    const uploaded = req.file;
    try {
        if (!uploaded) return sendRes(res, 400, 'Vui lòng chọn file backup (.zip)');

        if (checkRestoreBusy(res)) {
            fs.unlink(uploaded.path, () => {});
            return;
        }

        const requestedBy = req.user?.person_id || null;
        console.log(`[BackupController] ♻️ Admin ID ${requestedBy} khôi phục từ file upload: ${uploaded.originalname}`);

        restoreService.restoreBackup({
            uploadedFilePath: uploaded.path,
            uploadedFileName: uploaded.originalname,
            restoreFiles: parseBool(req.body?.restoreFiles),
            safetyBackup: parseBool(req.body?.safetyBackup),
            requestedBy
        }).catch(err => console.error('[BackupController] ❌ Background restore error:', err.message));

        sendRes(res, 202, 'Tiến trình khôi phục đã được khởi chạy', {
            started: true,
            progress: restoreService.getRestoreProgress()
        });
    } catch (error) {
        if (uploaded?.path) fs.unlink(uploaded.path, () => {});
        sendRes(res, 500, 'Lỗi khi khôi phục dữ liệu', null, error.message);
    }
};

/**
 * GET /api/backup/restore/progress
 */
const getRestoreProgress = async (req, res) => {
    try {
        sendRes(res, 200, 'Lấy tiến trình khôi phục thành công', restoreService.getRestoreProgress());
    } catch (error) {
        sendRes(res, 500, 'Lỗi khi lấy tiến trình khôi phục', null, error.message);
    }
};

module.exports = {
    createBackup,
    getBackupProgress,
    getBackupList,
    downloadBackup,
    deleteBackup,
    triggerCronBackup,
    restoreFromBackup,
    restoreFromUpload,
    getRestoreProgress
};
