const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, bucketName } = require('../config/aws');
const sequelize = require('../config/db');
const models = require('../models');
const { backup_log } = models;
const sseManager = require('../utils/sseManager');
const backupService = require('./backupService');

const { BACKUP_TABLES, BACKUP_DIR, UPLOADS_DIR, ensureBackupDir } = backupService;

// Thư mục tạm cho file restore (upload từ máy hoặc tải từ S3)
const RESTORE_TMP_DIR = path.join(BACKUP_DIR, 'restore_tmp');

const ensureRestoreTmpDir = () => {
    ensureBackupDir();
    if (!fs.existsSync(RESTORE_TMP_DIR)) {
        fs.mkdirSync(RESTORE_TMP_DIR, { recursive: true });
    }
};

const INITIAL_PROGRESS = {
    running: false,
    stage: 'idle', // idle | initializing | safety_backup | downloading | extracting | validating | clearing_db | restoring_db | restoring_files | completed | failed
    percent: 0,
    message: 'Chưa có tác vụ khôi phục nào đang chạy',
    source: null, // 'backup' | 'upload'
    sourceName: null,
    backupId: null,
    currentTable: 0,
    totalTables: BACKUP_TABLES.length,
    tableName: '',
    rowsRestored: 0,
    totalRows: 0,
    filesRestored: 0,
    totalFiles: 0,
    elapsedSeconds: 0,
    startedAt: null,
    completedAt: null,
    error: null,
    result: null,
    safetyBackupFilename: null,
    logs: []
};

let currentProgress = { ...INITIAL_PROGRESS };

const ts = () => `[${new Date().toLocaleTimeString('vi-VN')}]`;

/**
 * Trích xuất thông báo lỗi chi tiết từ AggregateError / Sequelize / MSSQL error
 */
const extractErrorMessage = (err) => {
    if (!err) return 'Lỗi không xác định';
    if (Array.isArray(err.errors) && err.errors.length > 0) {
        const msgs = err.errors.map(e => e.message || String(e)).filter(Boolean);
        if (msgs.length > 0) return msgs.join('; ');
    }
    if (err.original && err.original.message) {
        return err.original.message;
    }
    if (err.parent && err.parent.message) {
        return err.parent.message;
    }
    if (err.message && err.message.trim() !== '') {
        return err.message;
    }
    return String(err);
};

const notifyProgress = (updates = {}, logMsg = null) => {
    const logs = [...(currentProgress.logs || [])];
    if (logMsg) {
        logs.push(logMsg);
        if (logs.length > 40) logs.shift();
    }
    const elapsedSeconds = currentProgress.startedAt
        ? Math.max(0, Math.round((Date.now() - currentProgress.startedAt) / 1000))
        : 0;

    currentProgress = { ...currentProgress, elapsedSeconds, ...updates, logs };
    sseManager.broadcast('restore_progress', currentProgress);
    return currentProgress;
};

const getRestoreProgress = () => {
    if (currentProgress.running && currentProgress.startedAt) {
        currentProgress.elapsedSeconds = Math.round((Date.now() - currentProgress.startedAt) / 1000);
    }
    return currentProgress;
};

const isRestoreRunning = () => currentProgress.running === true;

/**
 * Tải file backup từ S3 về thư mục tạm
 */
const downloadFromS3 = async (s3Key, destPath) => {
    if (!s3 || !bucketName) throw new Error('S3 chưa được cấu hình, không thể tải file backup từ S3');
    const res = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: s3Key }));
    await new Promise((resolve, reject) => {
        const out = fs.createWriteStream(destPath);
        res.Body.pipe(out);
        res.Body.on('error', reject);
        out.on('error', reject);
        out.on('finish', resolve);
    });
    return destPath;
};

/**
 * Chặn path traversal khi giải nén (zip-slip)
 */
const safeJoin = (baseDir, relPath) => {
    const target = path.resolve(baseDir, relPath);
    const base = path.resolve(baseDir);
    if (target !== base && !target.startsWith(base + path.sep)) {
        throw new Error(`Đường dẫn không hợp lệ trong file backup: ${relPath}`);
    }
    return target;
};

/**
 * Mở file ZIP và đọc database.json + danh sách file uploads
 */
const openBackupArchive = async (zipPath) => {
    const directory = await unzipper.Open.file(zipPath);
    const dbEntry = directory.files.find(f => f.path === 'database.json');
    if (!dbEntry) {
        throw new Error('File backup không hợp lệ: thiếu database.json');
    }

    const raw = (await dbEntry.buffer()).toString('utf8');
    let payload;
    try {
        payload = JSON.parse(raw);
    } catch (err) {
        throw new Error('database.json bị lỗi định dạng: ' + err.message);
    }

    if (!payload || typeof payload.data !== 'object') {
        throw new Error('database.json không đúng cấu trúc (thiếu trường data)');
    }

    const uploadEntries = directory.files.filter(f =>
        f.type === 'File' && f.path.replace(/\\/g, '/').startsWith('uploads/')
    );

    return { payload, uploadEntries };
};

/**
 * Chuẩn hóa dữ liệu một dòng trước khi insert:
 * - Bỏ cột không tồn tại trong model hiện tại
 * - Chuyển chuỗi ISO về Date cho cột DATE
 * - Khôi phục placeholder email rỗng cho bảng person (tránh vi phạm UNIQUE)
 */
const normalizeRows = (modelKey, model, rows) => {
    const attrs = model.rawAttributes;
    const attrNames = Object.keys(attrs);

    return rows.map((row, idx) => {
        const out = {};
        for (const name of attrNames) {
            if (!(name in row)) continue;
            let val = row[name];
            const typeKey = attrs[name].type && attrs[name].type.key;
            if (typeKey === 'DATE' && val != null && !(val instanceof Date)) {
                const d = new Date(val);
                val = isNaN(d.getTime()) ? null : d;
            }
            out[name] = val;
        }

        if (modelKey === 'person' && 'email' in attrs) {
            if (out.email == null || String(out.email).trim() === '') {
                out.email = `__empty_${Date.now()}_${idx}_${Math.random().toString(36).substring(2)}`;
            }
        }
        return out;
    });
};

const getTableName = (model) => {
    const t = model.getTableName();
    return typeof t === 'object' ? t.tableName : t;
};

/**
 * Bật / tắt ràng buộc khóa ngoại và triggers cho các bảng được restore
 */
const setConstraints = async (enable, transaction, triggerSecret = null) => {
    const dialect = sequelize.getDialect();
    if (dialect === 'mssql') {
        const secret = triggerSecret || process.env.DB_APP_CONTEXT_SECRET || 'backend_service_secret';
        // Luôn gán app_context để vượt qua các trigger bảo vệ dữ liệu (ví dụ: trg_protect_daily_report_mutation)
        await sequelize.query(`EXEC sp_set_session_context N'app_context', N'${secret}';`, { transaction }).catch(() => {});

        if (enable) {
            // 1. Kích hoạt lại toàn bộ triggers
            await sequelize.query("EXEC sp_msforeachtable 'ALTER TABLE ? ENABLE TRIGGER ALL';", { transaction }).catch(() => {});
            // 2. Kích hoạt lại khóa ngoại
            for (const key of BACKUP_TABLES) {
                const model = models[key];
                if (!model) continue;
                const table = getTableName(model);
                const sql = `IF OBJECT_ID(N'[dbo].[${table}]', N'U') IS NOT NULL ALTER TABLE [dbo].[${table}] CHECK CONSTRAINT ALL`;
                await sequelize.query(sql, { transaction }).catch(() => {});
            }
        } else {
            // 1. Vô hiệu hóa toàn bộ triggers trong lúc restore
            await sequelize.query("EXEC sp_msforeachtable 'ALTER TABLE ? DISABLE TRIGGER ALL';", { transaction }).catch(() => {});
            // 2. Vô hiệu hóa khóa ngoại
            for (const key of BACKUP_TABLES) {
                const model = models[key];
                if (!model) continue;
                const table = getTableName(model);
                const sql = `IF OBJECT_ID(N'[dbo].[${table}]', N'U') IS NOT NULL ALTER TABLE [dbo].[${table}] NOCHECK CONSTRAINT ALL`;
                await sequelize.query(sql, { transaction }).catch(() => {});
            }
        }
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
        await sequelize.query(`SET FOREIGN_KEY_CHECKS = ${enable ? 1 : 0}`, { transaction });
    } else if (dialect === 'sqlite') {
        await sequelize.query(`PRAGMA foreign_keys = ${enable ? 'ON' : 'OFF'}`, { transaction });
    }
};

/**
 * Khôi phục CSDL từ payload database.json (trong 1 transaction, lỗi sẽ rollback toàn bộ)
 */
const restoreDatabase = async (dbData, triggerSecret = null) => {
    const tablesToRestore = BACKUP_TABLES.filter(key => models[key] && Array.isArray(dbData[key]));
    const totalRows = tablesToRestore.reduce((sum, key) => sum + dbData[key].length, 0);
    let rowsRestored = 0;

    notifyProgress({ totalRows, totalTables: tablesToRestore.length });

    await sequelize.transaction(async (transaction) => {
        await setConstraints(false, transaction, triggerSecret);

        // 1. Xóa dữ liệu hiện tại (thứ tự ngược để con trước cha)
        notifyProgress({
            stage: 'clearing_db',
            percent: 30,
            message: 'Đang xóa dữ liệu hiện tại của các bảng sẽ khôi phục...'
        }, `${ts()} 🧹 Xóa dữ liệu cũ của ${tablesToRestore.length} bảng`);

        for (const key of [...tablesToRestore].reverse()) {
            const model = models[key];
            await model.destroy({ where: {}, transaction, hooks: false, individualHooks: false, force: true });
        }

        // 2. Insert lại dữ liệu từ backup (thứ tự cha trước con)
        for (let i = 0; i < tablesToRestore.length; i++) {
            const key = tablesToRestore[i];
            const model = models[key];
            const rows = normalizeRows(key, model, dbData[key]);

            notifyProgress({
                stage: 'restoring_db',
                currentTable: i + 1,
                tableName: key,
                message: `Đang khôi phục bảng "${key}" (${i + 1}/${tablesToRestore.length})...`
            });

            const chunkSize = 500;
            for (let j = 0; j < rows.length; j += chunkSize) {
                const chunk = rows.slice(j, j + chunkSize);
                await model.bulkCreate(chunk, {
                    transaction,
                    hooks: false,
                    individualHooks: false,
                    validate: false,
                    returning: false
                });
                rowsRestored += chunk.length;
                const pct = Math.min(80, Math.round(35 + (rowsRestored / Math.max(1, totalRows)) * 45));
                notifyProgress({ percent: pct, rowsRestored });
            }

            notifyProgress({ rowsRestored }, `${ts()} ✅ Khôi phục bảng [${key}]: ${rows.length} dòng`);
        }

        await setConstraints(true, transaction, triggerSecret);
    });

    return { rowsRestored, tablesRestored: tablesToRestore.length };
};

/**
 * Giải nén thư mục uploads/ trong ZIP vào thư mục uploads của máy chủ (ghi đè file trùng tên)
 */
const restoreUploadFiles = async (uploadEntries) => {
    const totalFiles = uploadEntries.length;
    let filesRestored = 0;
    notifyProgress({ totalFiles, filesRestored: 0 });

    for (const entry of uploadEntries) {
        const relPath = entry.path.replace(/\\/g, '/').replace(/^uploads\//, '');
        if (!relPath || relPath.split('/').some(p => p === 'backups')) continue;

        const dest = safeJoin(UPLOADS_DIR, relPath);
        fs.mkdirSync(path.dirname(dest), { recursive: true });

        await new Promise((resolve, reject) => {
            entry.stream()
                .on('error', reject)
                .pipe(fs.createWriteStream(dest))
                .on('error', reject)
                .on('finish', resolve);
        });

        filesRestored++;
        if (filesRestored % 5 === 0 || filesRestored === totalFiles) {
            const pct = Math.min(98, Math.round(82 + (filesRestored / Math.max(1, totalFiles)) * 16));
            notifyProgress({ percent: pct, filesRestored, message: `Đang khôi phục tệp đính kèm ${filesRestored}/${totalFiles}...` });
        }
    }

    return { filesRestored };
};

/**
 * Hàm chính: Restore hệ thống từ file Full Backup ZIP
 * @param {Object} options
 * @param {number} [options.backupId] - ID bản backup trong BackupLogs
 * @param {string} [options.uploadedFilePath] - Đường dẫn file ZIP do admin upload
 * @param {string} [options.uploadedFileName] - Tên gốc file upload
 * @param {boolean} [options.restoreFiles=true] - Có khôi phục tệp đính kèm hay không
 * @param {boolean} [options.safetyBackup=true] - Tạo bản backup an toàn trước khi restore
 * @param {string|null} [options.triggerSecret] - Mã bí mật trigger CSDL
 * @param {number|null} [options.requestedBy]
 */
const restoreBackup = async ({
    backupId = null,
    uploadedFilePath = null,
    uploadedFileName = null,
    restoreFiles = true,
    safetyBackup = true,
    triggerSecret = null,
    requestedBy = null
} = {}) => {
    if (isRestoreRunning()) throw new Error('Một tiến trình khôi phục khác đang chạy');
    if (backupService.isBackupRunning()) throw new Error('Đang có tiến trình sao lưu chạy, vui lòng chờ hoàn tất');

    const startTime = Date.now();
    let zipPath = null;
    let tempFileToCleanup = uploadedFilePath || null;

    currentProgress = { ...INITIAL_PROGRESS, logs: [] };
    notifyProgress({
        running: true,
        stage: 'initializing',
        percent: 2,
        startedAt: startTime,
        source: backupId ? 'backup' : 'upload',
        sourceName: uploadedFileName,
        backupId,
        message: 'Khởi tạo tiến trình khôi phục dữ liệu...'
    }, `${ts()} 🚀 Bắt đầu khôi phục dữ liệu (admin ID: ${requestedBy ?? 'N/A'})`);

    try {
        ensureRestoreTmpDir();

        // 1. Xác định nguồn file ZIP
        if (backupId) {
            const record = await backup_log.findByPk(backupId);
            if (!record) throw new Error('Bản backup không tồn tại');
            if (record.status !== 'success') throw new Error('Chỉ có thể khôi phục từ bản backup thành công');

            notifyProgress({ sourceName: record.filename });

            if (record.local_path && fs.existsSync(record.local_path)) {
                zipPath = record.local_path;
                notifyProgress({}, `${ts()} 💾 Dùng file local: ${record.filename}`);
            } else if (record.s3_key) {
                notifyProgress({
                    stage: 'downloading',
                    percent: 5,
                    message: 'File local không còn, đang tải bản backup từ AWS S3...'
                }, `${ts()} ☁️ Tải file từ S3: ${record.s3_key}`);
                zipPath = path.join(RESTORE_TMP_DIR, `s3_${Date.now()}_${record.filename}`);
                await downloadFromS3(record.s3_key, zipPath);
                tempFileToCleanup = zipPath;
            } else {
                throw new Error('Không tìm thấy file backup (local và S3 đều không còn)');
            }
        } else if (uploadedFilePath) {
            zipPath = uploadedFilePath;
            notifyProgress({}, `${ts()} 📤 Dùng file upload: ${uploadedFileName || path.basename(uploadedFilePath)}`);
        } else {
            throw new Error('Thiếu nguồn dữ liệu khôi phục (backupId hoặc file upload)');
        }

        // 2. Đọc & kiểm tra file ZIP TRƯỚC khi đụng vào dữ liệu
        notifyProgress({
            stage: 'validating',
            percent: 10,
            message: 'Đang đọc và kiểm tra tính hợp lệ của file backup...'
        }, `${ts()} 🔍 Kiểm tra cấu trúc file backup`);

        const { payload, uploadEntries } = await openBackupArchive(zipPath);
        const tableKeys = Object.keys(payload.data).filter(k => BACKUP_TABLES.includes(k));
        if (tableKeys.length === 0) throw new Error('File backup không chứa bảng dữ liệu hợp lệ nào');

        notifyProgress({
            percent: 15,
            totalFiles: restoreFiles ? uploadEntries.length : 0
        }, `${ts()} ✅ Hợp lệ: ${tableKeys.length} bảng, ${uploadEntries.length} tệp đính kèm (backup lúc ${payload.exportedAt || 'N/A'})`);

        // 3. Tạo bản backup an toàn trước khi ghi đè
        let safetyBackupFilename = null;
        if (safetyBackup) {
            notifyProgress({
                stage: 'safety_backup',
                percent: 18,
                message: 'Đang tạo bản sao lưu an toàn của dữ liệu hiện tại trước khi khôi phục...'
            }, `${ts()} 🛡️ Tạo bản backup an toàn trước khi restore`);

            const safety = await backupService.createBackup({ triggeredBy: 'pre_restore', createdBy: requestedBy });
            safetyBackupFilename = safety.filename;
            notifyProgress({
                percent: 28,
                safetyBackupFilename
            }, `${ts()} ✅ Đã tạo backup an toàn: ${safetyBackupFilename}`);
        }

        // 4. Khôi phục CSDL
        const { rowsRestored, tablesRestored } = await restoreDatabase(payload.data, triggerSecret);

        // 5. Khôi phục tệp đính kèm
        let filesRestored = 0;
        if (restoreFiles && uploadEntries.length > 0) {
            notifyProgress({
                stage: 'restoring_files',
                percent: 82,
                message: `Đang khôi phục ${uploadEntries.length} tệp đính kèm...`
            }, `${ts()} 📁 Khôi phục ${uploadEntries.length} tệp đính kèm vào /uploads`);
            ({ filesRestored } = await restoreUploadFiles(uploadEntries));
            notifyProgress({}, `${ts()} ✅ Đã khôi phục ${filesRestored} tệp đính kèm`);
        }

        const totalElapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const result = {
            rowsRestored,
            tablesRestored,
            filesRestored,
            safetyBackupFilename,
            backupExportedAt: payload.exportedAt || null,
            elapsedSeconds: totalElapsedSec
        };

        notifyProgress({
            running: false,
            stage: 'completed',
            percent: 100,
            completedAt: Date.now(),
            elapsedSeconds: totalElapsedSec,
            result,
            message: `Khôi phục thành công! ${rowsRestored.toLocaleString('vi-VN')} bản ghi (${tablesRestored} bảng) + ${filesRestored} tệp đính kèm.`
        }, `${ts()} 🎉 Khôi phục hoàn tất trong ${totalElapsedSec}s`);

        console.log(`[RestoreService] ✅ Restore hoàn tất: ${rowsRestored} rows, ${filesRestored} files`);
        return result;
    } catch (err) {
        console.error('[RestoreService] ❌ Lỗi restore:', err);
        const errorMsg = extractErrorMessage(err);
        notifyProgress({
            running: false,
            stage: 'failed',
            error: errorMsg,
            completedAt: Date.now(),
            message: `Khôi phục thất bại: ${errorMsg}`
        }, `${ts()} ❌ Khôi phục thất bại (CSDL đã được rollback): ${errorMsg}`);
        throw err;
    } finally {
        if (tempFileToCleanup && fs.existsSync(tempFileToCleanup)) {
            fs.unlink(tempFileToCleanup, () => {});
        }
    }
};

module.exports = {
    restoreBackup,
    getRestoreProgress,
    isRestoreRunning,
    RESTORE_TMP_DIR,
    ensureRestoreTmpDir
};
