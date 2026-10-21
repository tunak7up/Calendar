const fs = require('fs');
const path = require('path');
const archiverModule = require('archiver');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3, bucketName } = require('../config/aws');
const models = require('../models');
const { backup_log } = models;
const sseManager = require('../utils/sseManager');

/**
 * Khởi tạo Zip Archive tương thích cả Archiver v8+ (ZipArchive class) và v7- (function)
 */
const createZipInstance = (options = {}) => {
    if (archiverModule.ZipArchive) {
        return new archiverModule.ZipArchive(options);
    }
    if (typeof archiverModule === 'function') {
        return archiverModule('zip', options);
    }
    if (archiverModule.default && typeof archiverModule.default === 'function') {
        return archiverModule.default('zip', options);
    }
    throw new Error('Thư viện archiver không hỗ trợ định dạng zip');
};

// Thư mục lưu file uploads người dùng
const UPLOADS_DIR = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../uploads');

// Thư mục lưu backup local (mặc định uploads/backups)
const BACKUP_DIR = process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.join(UPLOADS_DIR, 'backups');

// Đảm bảo thư mục backup tồn tại
const ensureBackupDir = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
};

// Danh sách các bảng cần backup trong Database
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
 * Tạo tên file Full Backup theo timestamp (.zip)
 */
const generateFilename = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `backup_full_${date}_${time}.zip`;
};

// Trạng thái tiến trình backup thời gian thực (in-memory)
let currentProgress = {
    running: false,
    stage: 'idle', // idle | initializing | reading_db | scanning_files | compressing_zip | saving_local | uploading_s3 | completed | failed
    percent: 0,
    message: 'Chưa có tác vụ sao lưu nào đang chạy',
    currentTable: 0,
    totalTables: BACKUP_TABLES.length,
    tableName: '',
    rowsRead: 0,
    totalRows: 0,
    filesCount: 0,
    filesSizeBytes: 0,
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
    logs: [],
    s3Configured: Boolean(s3 && bucketName),
    s3Success: false
};

/**
 * Cập nhật trạng thái tiến trình và phát SSE realtime cho toàn bộ client kết nối
 */
const notifyProgress = (updates = {}) => {
    currentProgress = {
        ...currentProgress,
        ...updates
    };

    // Broadcast SSE realtime tới admin
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
 * Đọc toàn bộ dữ liệu từ Database và cập nhật tiến độ
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
                message: `Đang sao lưu bảng CSDL "${tableName}" (${i + 1}/${totalTables})...`
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
            const eta = Math.max(1, Math.round(remainingTables * avgSecPerTable + 5));
            // Tiến độ đọc DB chiếm 2% -> 50%
            const pct = Math.min(50, Math.round(2 + ((i + 1) / totalTables) * 48));

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
                }, `[${new Date().toLocaleTimeString('vi-VN')}] Đọc CSDL [${tableName}]: ${rows.length} dòng`);
            }
        } catch (err) {
            console.error(`[BackupService] ❌ Lỗi đọc bảng "${tableName}":`, err.message);
            data[tableName] = [];
            if (onProgress) {
                onProgress({
                    message: `Lỗi đọc bảng "${tableName}": ${err.message}`
                }, `[${new Date().toLocaleTimeString('vi-VN')}] ⚠️ Lỗi đọc [${tableName}]: ${err.message}`);
            }
        }
    }

    return { data, totalRows };
};

/**
 * Quét toàn bộ file trong thư mục uploads của máy local (loại trừ thư mục backups và file tạm)
 */
const getUploadFilesRecursively = (dir = UPLOADS_DIR, base = '') => {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = base ? path.join(base, entry.name) : entry.name;

            // Bỏ qua thư mục backups/ hoặc file tạm .tmp hoặc file ẩn .
            if (
                fullPath === BACKUP_DIR ||
                entry.name === 'backups' ||
                entry.name.startsWith('.') ||
                entry.name.endsWith('.tmp')
            ) {
                continue;
            }

            if (entry.isDirectory()) {
                results = results.concat(getUploadFilesRecursively(fullPath, relPath));
            } else if (entry.isFile()) {
                try {
                    const stat = fs.statSync(fullPath);
                    results.push({
                        name: entry.name,
                        relPath,
                        fullPath,
                        size: stat.size
                    });
                } catch (err) {
                    console.warn(`[BackupService] Không thể đọc file: ${fullPath}`, err.message);
                }
            }
        }
    } catch (err) {
        console.error('[BackupService] Lỗi quét thư mục uploads:', err.message);
    }
    return results;
};

/**
 * Đóng gói toàn bộ Database và Uploads thành file ZIP
 */
const createZipArchive = ({ dbData, uploadFiles, outputPath, onProgress }) => {
    return new Promise((resolve, reject) => {
        ensureBackupDir();
        const output = fs.createWriteStream(outputPath);
        const archive = createZipInstance({
            zlib: { level: 6 } // Cân bằng độ nén và CPU
        });

        output.on('close', () => {
            const finalSize = archive.pointer();
            console.log(`[BackupService] 📦 Đóng gói ZIP hoàn tất: ${(finalSize / (1024 * 1024)).toFixed(2)} MB`);
            resolve({ sizeBytes: finalSize, outputPath });
        });

        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('[BackupService] Archive warning:', err.message);
            } else {
                reject(err);
            }
        });

        archive.on('error', (err) => {
            reject(err);
        });

        if (onProgress) {
            archive.on('progress', (data) => {
                onProgress(data);
            });
        }

        archive.pipe(output);

        // 1. Thêm database.json
        const dbPayload = JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: '2.0',
            type: 'full_backup',
            tables: BACKUP_TABLES,
            data: dbData
        }, null, 0);
        archive.append(dbPayload, { name: 'database.json' });

        // 2. Thêm manifest.json (thông tin tổng quan bản sao lưu)
        const totalUploadSize = uploadFiles.reduce((sum, f) => sum + f.size, 0);
        const manifest = JSON.stringify({
            createdAt: new Date().toISOString(),
            backupType: 'full_system_backup',
            version: '2.0',
            tablesCount: Object.keys(dbData).length,
            uploadFilesCount: uploadFiles.length,
            uploadFilesSizeBytes: totalUploadSize,
            description: 'Full Backup gồm toàn bộ cơ sở dữ liệu và các tệp đính kèm vật lý (Local uploads)'
        }, null, 2);
        archive.append(manifest, { name: 'manifest.json' });

        // 3. Đưa toàn bộ file vật lý vào thư mục uploads/ trong file zip
        for (const file of uploadFiles) {
            archive.file(file.fullPath, { name: path.join('uploads', file.relPath) });
        }

        archive.finalize();
    });
};

/**
 * Upload file Full Backup ZIP lên S3
 * @returns {string} S3 key của file đã upload
 */
const uploadToS3 = async (filename, localFilePath) => {
    if (!s3 || !bucketName) {
        console.warn('[BackupService] ⚠️ S3 chưa được cấu hình (STORAGE_TYPE != s3), bỏ qua upload S3.');
        return null;
    }

    const s3Key = `backups/${filename}`;
    const fileStats = fs.statSync(localFilePath);
    const fileStream = fs.createReadStream(localFilePath);

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentLength: fileStats.size,
        ContentType: 'application/zip'
    });

    await s3.send(command);
    console.log(`[BackupService] ☁️ Đã upload Full Backup lên S3: s3://${bucketName}/${s3Key} (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB)`);
    return s3Key;
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
 * Hàm chính: tạo Full Backup (CSDL + Toàn bộ File đính kèm ➔ ZIP ➔ Local + S3)
 * @param {Object} options
 * @param {string} options.triggeredBy - 'manual' hoặc 'cron'
 * @param {number|null} options.createdBy - person_id của admin (null nếu cron)
 */
const createBackup = async ({ triggeredBy = 'manual', createdBy = null } = {}) => {
    const filename = generateFilename();
    const startTime = Date.now();
    const outputPath = path.join(BACKUP_DIR, filename);

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
        message: 'Khởi tạo tiến trình Full Backup (CSDL + Tệp đính kèm)...',
        currentTable: 0,
        totalTables: BACKUP_TABLES.length,
        tableName: '',
        rowsRead: 0,
        totalRows: 0,
        filesCount: 0,
        filesSizeBytes: 0,
        sizeBytes: 0,
        speedText: 'Bắt đầu...',
        elapsedSeconds: 0,
        etaSeconds: 12,
        startedAt: startTime,
        completedAt: null,
        error: null,
        result: null,
        triggeredBy,
        createdBy,
        logId: log.id,
        filename,
        s3Configured: Boolean(s3 && bucketName),
        s3Success: false
    }, `[${new Date().toLocaleTimeString('vi-VN')}] 🚀 Bắt đầu Full Backup: ${filename}`);

    try {
        // 2. Bước 1: Đọc toàn bộ Database (2% -> 50%)
        console.log('[BackupService] 🚀 Bắt đầu đọc dữ liệu Database...');
        const { data, totalRows } = await readAllData(handleProgress);

        // 3. Bước 2: Quét toàn bộ tệp đính kèm vật lý trong uploads/ (50% -> 60%)
        handleProgress({
            stage: 'scanning_files',
            percent: 52,
            message: 'Đang quét tệp đính kèm vật lý trong thư mục uploads...',
            speedText: 'Quét tệp tin...',
            etaSeconds: 8
        }, `[${new Date().toLocaleTimeString('vi-VN')}] 📁 Quét tệp đính kèm local (/uploads)...`);

        const uploadFiles = getUploadFilesRecursively();
        const filesCount = uploadFiles.length;
        const totalFilesSizeBytes = uploadFiles.reduce((sum, f) => sum + f.size, 0);
        const filesSizeMb = (totalFilesSizeBytes / (1024 * 1024)).toFixed(2);

        handleProgress({
            percent: 60,
            filesCount,
            filesSizeBytes: totalFilesSizeBytes,
            message: `Đã tìm thấy ${filesCount} tệp đính kèm (${filesSizeMb} MB). Bắt đầu nén ZIP...`,
            speedText: `${filesCount} tệp tin`,
            etaSeconds: 6
        }, `[${new Date().toLocaleTimeString('vi-VN')}] ✅ Tìm thấy ${filesCount} file vật lý (${filesSizeMb} MB)`);

        // 4. Bước 3: Đóng gói toàn bộ thành file ZIP (60% -> 85%)
        handleProgress({
            stage: 'compressing_zip',
            percent: 65,
            message: `Đang đóng gói CSDL và ${filesCount} tệp đính kèm vào file ZIP...`,
            speedText: 'Đang nén ZIP...',
            etaSeconds: 4
        }, `[${new Date().toLocaleTimeString('vi-VN')}] 📦 Đang nén file ZIP: ${filename}...`);

        const { sizeBytes } = await createZipArchive({
            dbData: data,
            uploadFiles,
            outputPath,
            onProgress: (archiveProgress) => {
                const processed = archiveProgress?.entries?.processed || 0;
                const totalEntries = (filesCount + 2);
                const zipPct = Math.min(85, Math.round(65 + (processed / Math.max(1, totalEntries)) * 20));
                notifyProgress({
                    percent: zipPct,
                    speedText: `Nén file ${processed}/${totalEntries}`
                });
            }
        });

        const finalZipMb = (sizeBytes / (1024 * 1024)).toFixed(2);

        // 5. Bước 4: Lưu trữ Local hoàn tất (85% -> 90%)
        handleProgress({
            stage: 'saving_local',
            percent: 90,
            sizeBytes,
            message: `Đã lưu file Full Backup tại máy chủ local (${finalZipMb} MB)`,
            speedText: 'Lưu local xong',
            etaSeconds: 2
        }, `[${new Date().toLocaleTimeString('vi-VN')}] 💾 Đã lưu local: ${outputPath} (${finalZipMb} MB)`);

        // 6. Bước 5: Upload S3 (nếu có cấu hình S3) (90% -> 98%)
        let s3Key = null;
        const s3Configured = Boolean(s3 && bucketName);
        let s3Success = false;

        if (s3Configured) {
            handleProgress({
                stage: 'uploading_s3',
                percent: 92,
                s3Configured: true,
                message: `Đang tải Full Backup lên AWS S3 (bucket: ${bucketName})...`,
                speedText: 'Upload S3...',
                etaSeconds: 2
            }, `[${new Date().toLocaleTimeString('vi-VN')}] ☁️ Đang upload Full Backup lên AWS S3`);

            try {
                s3Key = await uploadToS3(filename, outputPath);
                s3Success = true;
                handleProgress({
                    percent: 98,
                    s3Configured: true,
                    s3Success: true,
                    message: 'Đã tải lên AWS S3 an toàn!',
                    speedText: 'Upload S3 xong'
                }, `[${new Date().toLocaleTimeString('vi-VN')}] ✅ Upload AWS S3 thành công`);
            } catch (s3Err) {
                console.error('[BackupService] ⚠️ Upload S3 thất bại, backup local vẫn an toàn:', s3Err.message);
                handleProgress({
                    percent: 98,
                    s3Configured: true,
                    s3Success: false,
                    message: `Cảnh báo: Upload S3 lỗi (${s3Err.message}), file local vẫn an toàn`,
                    speedText: 'Lỗi S3 (local an toàn)'
                }, `[${new Date().toLocaleTimeString('vi-VN')}] ⚠️ Upload S3 lỗi: ${s3Err.message}`);
            }
        } else {
            handleProgress({
                percent: 98,
                s3Configured: false,
                s3Success: false,
                message: 'Bỏ qua S3 (hệ thống chưa thiết lập AWS S3, chỉ lưu Local)',
                speedText: 'Không thiết lập S3'
            }, `[${new Date().toLocaleTimeString('vi-VN')}] ⚠️ S3 chưa cấu hình, chỉ lưu local`);
        }

        // 7. Cập nhật log thành success
        await log.update({
            s3_key: s3Key,
            local_path: outputPath,
            size_bytes: sizeBytes,
            rows_count: totalRows,
            tables_count: Object.keys(data).length,
            status: 'success'
        });

        // 8. Tạo presigned URL nếu có S3
        const downloadUrl = s3Key
            ? await getS3DownloadUrl(s3Key)
            : null;

        const totalElapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const avgOverallSpeed = Math.round(totalRows / totalElapsedSec);

        console.log(`[BackupService] ✅ Full Backup hoàn tất: ${filename} | ${totalRows} rows | ${filesCount} files | ${finalZipMb} MB`);

        const finalResult = {
            log: log.toJSON(),
            downloadUrl,
            localPath: outputPath,
            filename,
            sizeBytes,
            totalRows,
            filesCount,
            totalTables: Object.keys(data).length,
            localDownloadPath: `/api/backup/download/${log.id}`,
            s3Configured,
            s3Success
        };

        handleProgress({
            running: false,
            stage: 'completed',
            percent: 100,
            s3Configured,
            s3Success,
            elapsedSeconds: totalElapsedSec,
            etaSeconds: 0,
            speedText: `Hoàn tất trong ${totalElapsedSec}s`,
            message: `Full Backup thành công! ${totalRows.toLocaleString('vi-VN')} bản ghi CSDL + ${filesCount} tệp đính kèm (${finalZipMb} MB).`,
            completedAt: Date.now(),
            result: finalResult
        }, `[${new Date().toLocaleTimeString('vi-VN')}] 🎉 Full Backup hoàn tất thành công trong ${totalElapsedSec}s!`);

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

        console.error('[BackupService] ❌ Lỗi Full Backup:', err);
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

    return {
        total: count,
        page,
        limit,
        data: rows
    };
};

/**
 * Lấy URL download cho một backup record
 */
const getDownloadUrl = async (id) => {
    const record = await backup_log.findByPk(id);
    if (!record) throw new Error('Backup không tồn tại');

    // Nếu có S3, trả về presigned URL
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
    UPLOADS_DIR,
    ensureBackupDir
};
