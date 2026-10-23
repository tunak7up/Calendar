import { useState, useEffect, useCallback, useRef } from 'react';
import { backupService } from '../../../../services/backupService';

const INITIAL_RESTORE_PROGRESS = {
  running: false,
  stage: 'idle',
  percent: 0,
  message: '',
  source: null,
  sourceName: null,
  currentTable: 0,
  totalTables: 0,
  tableName: '',
  rowsRestored: 0,
  totalRows: 0,
  filesRestored: 0,
  totalFiles: 0,
  elapsedSeconds: 0,
  error: null,
  result: null,
  safetyBackupFilename: null,
  logs: []
};

/**
 * Hook quản lý chức năng Khôi phục dữ liệu (Restore)
 * @param {Object} params
 * @param {Function} params.onFinished - callback khi restore kết thúc (để reload danh sách backup)
 * @param {Function} params.onSuccess - hiển thị thông báo thành công
 * @param {Function} params.onError - hiển thị thông báo lỗi
 */
export function useAdminRestore({ onFinished, onSuccess, onError } = {}) {
  const [restoreProgress, setRestoreProgress] = useState(INITIAL_RESTORE_PROGRESS);
  const [showRestorePanel, setShowRestorePanel] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Modal xác nhận: { type: 'backup', backup } | { type: 'file', file }
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreOptions, setRestoreOptions] = useState({ restoreFiles: true, safetyBackup: true });

  const pollRef = useRef(null);
  const prevRunningRef = useRef(false);
  const callbacksRef = useRef({ onFinished, onSuccess, onError });
  callbacksRef.current = { onFinished, onSuccess, onError };

  const applyUpdate = useCallback((p) => {
    if (!p) return;
    setRestoreProgress(p);

    if (p.running) {
      setRestoring(true);
      setShowRestorePanel(true);
      prevRunningRef.current = true;
      return;
    }

    setRestoring(false);
    if (prevRunningRef.current) {
      prevRunningRef.current = false;
      const { onFinished: fin, onSuccess: ok, onError: fail } = callbacksRef.current;
      if (p.stage === 'completed') ok?.(p.message || '✅ Khôi phục dữ liệu thành công!');
      else if (p.stage === 'failed') fail?.(p.error || p.message || 'Khôi phục thất bại');
      fin?.();
    }
  }, []);

  // Trạng thái ban đầu khi mở trang (nếu đang có restore chạy)
  useEffect(() => {
    let mounted = true;
    backupService.getRestoreProgress()
      .then((res) => {
        if (mounted && res?.data?.running) applyUpdate(res.data);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [applyUpdate]);

  // SSE realtime
  useEffect(() => {
    const handler = (e) => e.detail && applyUpdate(e.detail);
    window.addEventListener('restore_progress', handler);
    return () => window.removeEventListener('restore_progress', handler);
  }, [applyUpdate]);

  // Polling fallback khi đang restore
  useEffect(() => {
    if (restoring && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await backupService.getRestoreProgress();
          if (res?.data) applyUpdate(res.data);
        } catch (err) {
          console.warn('[useAdminRestore] Poll progress failed:', err.message);
        }
      }, 1000);
    }
    if (!restoring && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [restoring, applyUpdate]);

  const openRestoreFromBackup = (backup) => {
    setRestoreOptions({ restoreFiles: true, safetyBackup: true });
    setRestoreTarget({ type: 'backup', backup });
  };

  const openRestoreFromFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      callbacksRef.current.onError?.('Vui lòng chọn file Full Backup định dạng .zip');
      return;
    }
    setRestoreOptions({ restoreFiles: true, safetyBackup: true });
    setRestoreTarget({ type: 'file', file });
  };

  const closeRestoreModal = useCallback(() => setRestoreTarget(null), []);

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    const target = restoreTarget;
    setRestoreTarget(null);
    setRestoring(true);
    setShowRestorePanel(true);
    setRestoreProgress({
      ...INITIAL_RESTORE_PROGRESS,
      running: true,
      stage: 'initializing',
      percent: 1,
      message: target.type === 'file' ? 'Đang tải file backup lên máy chủ...' : 'Đang khởi tạo tiến trình khôi phục...',
      sourceName: target.type === 'file' ? target.file.name : target.backup.filename
    });

    try {
      const res = target.type === 'file'
        ? await backupService.restoreFromFile(target.file, restoreOptions)
        : await backupService.restore(target.backup.id, restoreOptions);

      if (res?.success) {
        if (res.data?.progress) applyUpdate(res.data.progress);
      } else {
        throw new Error(res?.message || 'Không thể bắt đầu khôi phục');
      }
    } catch (err) {
      setRestoring(false);
      setRestoreProgress((prev) => ({
        ...prev,
        running: false,
        stage: 'failed',
        error: err.message,
        message: `Khôi phục thất bại: ${err.message}`
      }));
      callbacksRef.current.onError?.('Lỗi khi khôi phục: ' + err.message);
    }
  };

  return {
    restoreProgress,
    showRestorePanel,
    dismissRestorePanel: () => setShowRestorePanel(false),
    restoring,
    restoreTarget,
    restoreOptions,
    setRestoreOptions,
    openRestoreFromBackup,
    openRestoreFromFile,
    closeRestoreModal,
    confirmRestore
  };
}
