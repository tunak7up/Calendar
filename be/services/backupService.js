const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3, bucketName, bucketRegion } = require('../config/aws');
const models = require('../models');
const { backup_log } = models;

const gzip = promisify(zlib.gzip);

// Thư mục lưu backup local
const BACKUP_DIR = process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.join(__dirname, '../uploads/backups');

// Đảm bảo thư mục backup tồn tại
const ensureBackupDir = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
};

// Danh sách các bảng cần backup (theo thứ tự tránh foreign key dependency)
const BACKUP_TABLES = [
    'person',
    'theme_setting',
    'preset_reason',
    'ai_agent',
    'task',
    'task_participant',
    'task_status',
    'daily_report',
    'request',
    'request_detail',
    'response',
    'comment',
    'schedule',
    'notification',
    'change_history',
    'fileAttachment',
    'push_subscription',
    'refresh_token',
];

/**
 * Tạo tên file backup theo timestamp
 */
const generateFilename = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `backup_${date}_${time}.json.gz`;
};

const sseManager = require('../utils/sseManager');

// Trạng thái tiến trình backup thời gian thực (in-memory)
let currentProgress = {
    running: false,
    stage: 'idle', // idle | initializing | reading_db | compressing | saving_local | uploading_s3 | completed | failed
    percent: 0,
    message: 'Chưa có tác vụ sao lưu nào đang chạy',
    currentTable: 0,
    totalTables: BACKUP_TABLES.length,
    tableName: '',
    rowsRead: 0,
    totalRows: 0,
    sizeBytes: 0,
    speedText: '—',
    elapsedSeconds: 0,
    etaSeconds: null,
    startedAt: null,
    completedAt: null,
    error: null,
    result: null,
    triggeredBy: null,
    createdBy: null,
    logId: null,
    filename: null,
    logs: []
};

/**
 * Cập nhật trạng thái tiến trình và phát SSE realtime cho toàn bộ client kết nối
 */
const notifyProgress = (updates = {}) => {
    currentProgress = {
        ...currentProgress,
        ...updates
    };

    // Broadcast SSE realtime
    sseManager.broadcast('backup_progress', currentProgress);
    return currentProgress;
};

/**
 * Lấy thông tin tiến trình hiện tại
 */
const getProgress = () => {
    if (currentProgress.running && currentProgress.startedAt) {
        const elapsed = Math.max(1, Math.round((Date.now() - currentProgress.startedAt) / 1000));
        currentProgress.elapsedSeconds = elapsed;
    }
    return currentProgress;
};

/**
 * Kiểm tra xem có tác vụ backup nào đang chạy không
 */
const isBackupRunning = () => currentProgress.running === true;

/**
 * Đọc toàn bộ dữ liệu từ DB và cập nhật tiến độ theo từng bảng
 */
const readAllData = async (onProgress) => {
    const data = {};
    let totalRows = 0;
    const totalTables = BACKUP_TABLES.length;
    const startTime = Date.now();

    for (let i = 0; i < totalTables; i++) {
        const tableName = BACKUP_TABLES[i];
        const model = models[tableName];

        if (onProgress) {
            onProgress({
                stage: 'reading_db',
                currentTable: i + 1,
                totalTables,
                tableName,
                message: `Đang sao lưu bảng "${tableName}" (${i + 1}/${totalTables})...`
            });
        }

        if (!model) {
            console.warn(`[BackupService] ⚠️ Không tìm thấy model: ${tableName}, bỏ qua.`);
            continue;
        }

        try {
            const rows = await model.findAll({ raw: true });
            data[tableName] = rows;
            totalRows += rows.length;

            const elapsedSec = Math.max(1, (Date.now() - startTime) / 1000);
            const speed = Math.round(totalRows / elapsedSec);
            const remainingTables = totalTables - (i + 1);
            const avgSecPerTable = elapsedSec / (i + 1);
            const eta = Math.max(1, Math.round(remainingTables * avgSecPerTable + 2));
            const pct = Math.min(75, Math.round(2 + ((i + 1) / totalTables) * 73));

            console.log(`[BackupService] ✅ Đọc bảng "${tableName}": ${rows.length} rows`);

            if (onProgress) {
                onProgress({
                    percent: pct,
                    rowsRead: totalRows,
                    totalRows,
                    speedText: `~${speed.toLocaleString('vi-VN')} dòng/s`,
                    etaSeconds: eta,
                    elapsedSeconds: Math.round(elapsedSec),
                    message: `Đã đọc xong bảng "${tableName}" (${rows.length.toLocaleString('vi-VN')} bản ghi)`
                }, `[${new Date().toLocaleTimeString('vi-VN')}] Đọc bảng ${tableName}: ${rows.length} dòng`);
            }
        } catch (err) {
            console.error(`[BackupService] ❌ Lỗi đọc bảng "${tableName}":`, err.message);
            data[tableName] = [];
            if (onProgress) {
                onProgress({
                    message: `Lỗi đọc bảng "${tableName}": ${err.message}`
                }, `[${new Date().toLocaleTimeString('vi-VN')}] ⚠️ Lỗi bảng ${tableName}: ${err.message}`);
            }
        }
    }

    return { data, totalRows };
};

/**
 * Upload file backup lên S3
 * @returns {string} S3 key của file đã upload
 */
const uploadToS3 = async (filename, compressedBuffer) => {
    if (!s3 || !bucketName) {
        console.warn('[BackupService] ⚠️ S3 chưa được cấu hình (STORAGE_TYPE != s3), bỏ qua upload S3.');
        return null;
    }

    const s3Key = `backups/${filename}`;
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: compressedBuffer,
        ContentType: 'application/gzip',
        ContentEncoding: 'gzip',
    });

    await s3.send(command);
    console.log(`[BackupService] ☁️ Đã upload lên S3: s3://${bucketName}/${s3Key}`);
    return s3Key;
};

/**
 * Lưu file backup xuống disk local
 * @returns {string} đường dẫn tuyệt đối của file trên máy chủ
 */
const saveToLocal = (filename, compressedBuffer) => {
    ensureBackupDir();
    const filePath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filePath, compressedBuffer);
    console.log(`[BackupService] 💾 Đã lưu local: ${filePath}`);
    return filePath;
};

/**
 * Tạo presigned URL download từ S3 (hết hạn sau 1 giờ)
 */
const getS3DownloadUrl = async (s3Key, expiresIn = 3600) => {
    if (!s3 || !bucketName || !s3Key) return null;
    try {
        const command = new GetObjectCommand({ Bucket: bucketName, Key: s3Key });
        return await getSignedUrl(s3, command, { expiresIn });
    } catch (err) {
        console.error('[BackupService] Lỗi tạo presigned URL:', err.message);
        return null;
    }
};

/**
 * Hàm chính: tạo backup toàn bộ (DB → gzip → S3 + local)
 * @param {Object} options
 * @param {string} options.triggeredBy - 'manual' hoặc 'cron'
 * @param {number|null} options.createdBy - person_id của admin (null nếu cron)
 * @returns {Object} log record + downloadUrl
 */
const createBackup = async ({ triggeredBy = 'manual', createdBy = null } = {}) => {
    const filename = generateFilename();
    const startTime = Date.now();

    // 1. Tạo log với status='pending'
    const log = await backup_log.create({
        filename,
        triggered_by: triggeredBy,
        created_by: createdBy,
        status: 'pending',
        created_at: new Date()
    });

    const addLog = (logMsg) => {
        const logs = [...(currentProgress.logs || [])];
        if (logMsg) {
            logs.push(logMsg);
            if (logs.length > 25) logs.shift();
        }
        return logs;
    };

    const handleProgress = (updates, logMsg) => {
        const logs = addLog(logMsg);
        notifyProgress({
            ...updates,
            logs
        });
    };

    handleProgress({
        running: true,
        stage: 'initializing',
        percent: 2,
        message: 'Khởi tạo tiến trình sao lưu...',
        currentTable: 0,
        totalTables: BACKUP_TABLES.length,
        tableName: '',
        rowsRead: 0,
        totalRows: 0,
        sizeBytes: 0,
        speedText: 'Bắt đầu...',
        elapsedSeconds: 0,
        etaSeconds: 8,
        startedAt: startTime,
        completedAt: null,
        error: null,
        result: null,
        triggeredBy,
        createdBy,
        logId: log.id,
        filename
    }, `[${new Date().toLocaleTimeString('vi-VN')}] 🚀 Bắt đầu sao lưu hệ thống: ${filename}`);

    try {
        // 2. Đọc toàn bộ DB
        console.log('[BackupService] 🚀 Bắt đầu đọc dữ liệu DB...');
        const { data, totalRows } = await readAllData(handleProgress);

        // 3. Serialize + Gzip
        handleProgress({
            stage: 'compressing',
            percent: 78,
            message: 'Đang nén dữ liệu bằng thuật toán Gzip...',
            speedText: 'Đang nén...',
            etaSeconds: 3
        }, `[${new Date().toLocaleTimeString('vi-VN')}] 📦 Đang nén ${totalRows.toLocaleString('vi-VN')} bản ghi...`);

        const payload = JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: '1.0',
            tables: BACKUP_TABLES,
            data
        }, null, 0);

        const compressed = await gzip(Buffer.from(payload, 'utf8'));
        const sizeBytes = compressed.length;
        const sizeKb = (sizeBytes / 1024).toFixed(1);
        console.log(`[BackupService] 📦 Kích thước file: ${sizeKb} KB`);

        handleProgress({
            percent: 85,
            sizeBytes,
            message: `Nén thành công! Kích thước file: ${sizeKb} KB`,
            speedText: 'Nén xong'
        }, `[${new Date().toLocaleTimeString('vi-VN')}] ✅ Nén hoàn tất: ${sizeKb} KB`);

        // 4. Lưu local (luôn luôn)
        handleProgress({
            stage: 'saving_local',
            percent: 88,
            message: 'Đang lưu file bản sao lưu vào máy chủ cục bộ...',
            speedText: 'Ghi máy chủ...'
        }, `[${new Date().toLocaleTimeString('vi-VN')}] 💾 Đang ghi file vào máy chủ local`);

        const localPath = saveToLocal(filename, compressed);

        handleProgress({
            percent: 90,
            message: 'Đã lưu file an toàn trên máy chủ',
            speedText: 'Lưu local xong'
        }, `[${new Date().toLocaleTimeString('vi-VN')}] ✅ Đã lưu local: ${localPath}`);

        // 5. Upload S3 (nếu có cấu hình)
        let s3Key = null;
        if (s3 && bucketName) {
            handleProgress({
                stage: 'uploading_s3',
                percent: 92,
                message: `Đang tải bản sao lưu lên AWS S3 (bucket: ${bucketName})...`,
                speedText: 'Upload S3...',
                etaSeconds: 2
            }, `[${new Date().toLocaleTimeString('vi-VN')}] ☁️ Đang upload lên S3`);

            try {
                s3Key = await uploadToS3(filename, compressed);
                handleProgress({
                    percent: 98,
                    message: 'Đã tải lên AWS S3 an toàn!',
                    speedText: 'Upload S3 xong'
                }, `[${new Date().toLocaleTimeString('vi-VN')}] ✅ Upload S3 thành công`);
            } catch (s3Err) {
                console.error('[BackupService] ⚠️ Upload S3 thất bại, backup local vẫn thành công:', s3Err.message);
                handleProgress({
                    percent: 98,
                    message: `Cảnh báo: Upload S3 lỗi (${s3Err.message}), backup local vẫn an toàn`,
                    speedText: 'Lỗi S3 (local an toàn)'
                }, `[${new Date().toLocaleTimeString('vi-VN')}] ⚠️ Upload S3 lỗi: ${s3Err.message}`);
            }
        } else {
            handleProgress({
                percent: 98,
                message: 'Bỏ qua S3 (hệ thống lưu trữ local)',
                speedText: 'Bỏ qua S3'
            }, `[${new Date().toLocaleTimeString('vi-VN')}] S3 chưa cấu hình, chỉ lưu local`);
        }

        // 6. Cập nhật log thành success
        await log.update({
            s3_key: s3Key,
            local_path: localPath,
            size_bytes: sizeBytes,
            rows_count: totalRows,
            tables_count: Object.keys(data).length,
            status: 'success'
        });

        // 7. Tạo presigned URL nếu có S3, hoặc dùng local download URL
        const downloadUrl = s3Key
            ? await getS3DownloadUrl(s3Key)
            : null;

        const totalElapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const avgOverallSpeed = Math.round(totalRows / totalElapsedSec);

        console.log(`[BackupService] ✅ Backup hoàn tất: ${filename} | ${totalRows} rows | ${sizeKb} KB`);

        const finalResult = {
            log: log.toJSON(),
            downloadUrl,
            localPath,
            filename,
            sizeBytes,
            totalRows,
            totalTables: Object.keys(data).length,
            localDownloadPath: `/api/backup/download/${log.id}`
        };

        handleProgress({
            running: false,
            stage: 'completed',
            percent: 100,
            elapsedSeconds: totalElapsedSec,
            etaSeconds: 0,
            speedText: `~${avgOverallSpeed.toLocaleString('vi-VN')} dòng/s (${totalElapsedSec}s)`,
            message: `Sao lưu thành công! Tổng cộng ${totalRows.toLocaleString('vi-VN')} bản ghi (${sizeKb} KB).`,
            completedAt: Date.now(),
            result: finalResult
        }, `[${new Date().toLocaleTimeString('vi-VN')}] 🎉 Sao lưu hoàn tất thành công trong ${totalElapsedSec} giây!`);

        return finalResult;

    } catch (err) {
        // Cập nhật log thành failed
        await log.update({
            status: 'failed',
            error_message: err.message
        }).catch(() => {});

        handleProgress({
            running: false,
            stage: 'failed',
            error: err.message,
            message: `Sao lưu thất bại: ${err.message}`,
            speedText: 'Thất bại',
            completedAt: Date.now()
        }, `[${new Date().toLocaleTimeString('vi-VN')}] ❌ Sao lưu thất bại: ${err.message}`);

        console.error('[BackupService] ❌ Lỗi tạo backup:', err);
        throw err;
    }
};

/**
 * Lấy danh sách backup (phân trang)
 */
const getBackupList = async ({ page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await backup_log.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset
    });
    return { total: count, page, limit, data: rows };
};

/**
 * Lấy presigned URL download cho một backup record
 */
const getDownloadUrl = async (id) => {
    const record = await backup_log.findByPk(id);
    if (!record) throw new Error('Backup không tồn tại');
    if (record.status !== 'success') throw new Error('Backup chưa hoàn thành hoặc bị lỗi');

    // Ưu tiên S3 URL trước
    if (record.s3_key) {
        const url = await getS3DownloadUrl(record.s3_key);
        return { record: record.toJSON(), downloadUrl: url, source: 's3' };
    }

    // Nếu không có S3, trả về flag để controller xử lý local download
    if (record.local_path && fs.existsSync(record.local_path)) {
        return { record: record.toJSON(), downloadUrl: null, source: 'local', localPath: record.local_path };
    }

    throw new Error('File backup không tìm thấy (đã bị xóa hoặc di chuyển)');
};

/**
 * Xóa một backup record + file vật lý
 */
const deleteBackup = async (id) => {
    const record = await backup_log.findByPk(id);
    if (!record) throw new Error('Backup không tồn tại');

    // Xóa file S3
    if (record.s3_key && s3 && bucketName) {
        try {
            await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: record.s3_key }));
            console.log(`[BackupService] 🗑️ Đã xóa S3: ${record.s3_key}`);
        } catch (err) {
            console.error('[BackupService] Lỗi xóa S3 file:', err.message);
        }
    }

    // Xóa file local
    if (record.local_path && fs.existsSync(record.local_path)) {
        fs.unlinkSync(record.local_path);
        console.log(`[BackupService] 🗑️ Đã xóa local: ${record.local_path}`);
    }

    await record.destroy();
    return true;
};

/**
 * Auto-cleanup: xóa các bản backup cron cũ nhất nếu vượt quá maxCount
 */
const cleanupOldCronBackups = async (maxCount = 30) => {
    const allCronBackups = await backup_log.findAll({
        where: { triggered_by: 'cron', status: 'success' },
        order: [['created_at', 'ASC']]
    });

    if (allCronBackups.length <= maxCount) return;

    const toDelete = allCronBackups.slice(0, allCronBackups.length - maxCount);
    console.log(`[BackupService] 🧹 Auto-cleanup: xóa ${toDelete.length} backup cron cũ...`);

    for (const record of toDelete) {
        await deleteBackup(record.id).catch(err =>
            console.error(`[BackupService] Lỗi cleanup backup ID ${record.id}:`, err.message)
        );
    }
};

module.exports = {
    createBackup,
    getBackupList,
    getDownloadUrl,
    deleteBackup,
    cleanupOldCronBackups,
    getProgress,
    isBackupRunning,
    BACKUP_TABLES,
    BACKUP_DIR,
    ensureBackupDir
};
