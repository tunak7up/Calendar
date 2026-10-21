import { useState, useEffect, useCallback, useRef } from 'react';
import { backupService } from '../../../../services/backupService';

export function useAdminBackup() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  // Trạng thái tiến trình sao lưu thời gian thực
  const [progress, setProgress] = useState({
    running: false,
    stage: 'idle',
    percent: 0,
    message: '',
    currentTable: 0,
    totalTables: 0,
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
    logs: []
  });
  const [showProgressPanel, setShowProgressPanel] = useState(false);

  const pollIntervalRef = useRef(null);
  const prevRunningRef = useRef(false);

  useEffect(() => {
    document.title = 'KIS Vietnam - Quản lý Backup';
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 6000);
  };

  const loadBackups = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await backupService.getList({ page: targetPage, limit: LIMIT });
      if (res?.success) {
        setBackups(res.data?.data || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) {
      showError('Không thể tải danh sách backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadBackups(page);
  }, [page]);

  // Áp dụng cập nhật trạng thái tiến trình
  const applyProgressUpdate = useCallback((newProgress) => {
    if (!newProgress) return;
    setProgress(newProgress);

    if (newProgress.running) {
      setCreating(true);
      setShowProgressPanel(true);
      prevRunningRef.current = true;
    } else {
      setCreating(false);
      // Nếu vừa mới hoàn tất từ trạng thái đang chạy
      if (prevRunningRef.current) {
        prevRunningRef.current = false;
        if (newProgress.stage === 'completed') {
          showSuccess(newProgress.message || '✅ Sao lưu hoàn tất thành công!');
          loadBackups(1);
          setPage(1);
        } else if (newProgress.stage === 'failed') {
          showError(newProgress.error || newProgress.message || 'Sao lưu thất bại');
        }
      }
    }
  }, [loadBackups]);

  // Kiểm tra trạng thái backup ban đầu khi mở trang
  useEffect(() => {
    let isMounted = true;
    backupService.getProgress()
      .then((res) => {
        if (!isMounted || !res?.data) return;
        if (res.data.running) {
          applyProgressUpdate(res.data);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [applyProgressUpdate]);

  // Lắng nghe sự kiện SSE realtime từ HeaderPage
  useEffect(() => {
    const handleSseProgress = (e) => {
      if (e.detail) {
        applyProgressUpdate(e.detail);
      }
    };

    window.addEventListener('backup_progress', handleSseProgress);
    return () => {
      window.removeEventListener('backup_progress', handleSseProgress);
    };
  }, [applyProgressUpdate]);

  // Polling fallback định kỳ (mỗi 800ms) khi backup đang chạy để đảm bảo UI mượt mà
  useEffect(() => {
    if (creating || progress.running) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          try {
            const res = await backupService.getProgress();
            if (res?.data) {
              applyProgressUpdate(res.data);
              if (!res.data.running) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          } catch (err) {
            console.warn('[useAdminBackup] Poll progress failed:', err.message);
          }
        }, 800);
      }
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [creating, progress.running, applyProgressUpdate]);

  // Kích hoạt backup thủ công
  const handleCreate = async () => {
    if (creating || progress.running) {
      showError('Tiến trình sao lưu đang được thực hiện, vui lòng chờ...');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn tạo backup toàn bộ dữ liệu ngay bây giờ? Quá trình sẽ chạy ngầm và hiển thị tiến độ thời gian thực.')) {
      return;
    }

    setCreating(true);
    setShowProgressPanel(true);
    setError(null);

    try {
      const res = await backupService.create();
      if (res?.success) {
        if (res.data?.progress) {
          applyProgressUpdate(res.data.progress);
        }
      } else {
        setCreating(false);
        showError(res?.message || 'Không thể bắt đầu sao lưu');
      }
    } catch (err) {
      setCreating(false);
      showError('Lỗi khi kích hoạt sao lưu: ' + err.message);
    }
  };

  const handleDownload = async (backup) => {
    if (downloadingId) return;
    setDownloadingId(backup.id);
    try {
      await backupService.download(backup.id, backup.filename);
      showSuccess('✅ Download bắt đầu!');
    } catch (err) {
      showError('Lỗi khi download: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (backup) => {
    if (!window.confirm(`Bạn có chắc muốn xóa backup "${backup.filename}"?\nHành động này không thể hoàn tác.`)) return;
    setDeletingId(backup.id);
    try {
      const res = await backupService.delete(backup.id);
      if (res?.success) {
        showSuccess('🗑️ Đã xóa backup thành công');
        await loadBackups(page);
      } else {
        showError(res?.message || 'Xóa backup thất bại');
      }
    } catch (err) {
      showError('Lỗi khi xóa backup: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const dismissProgressPanel = () => {
    setShowProgressPanel(false);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return {
    backups,
    loading,
    creating,
    downloadingId,
    deletingId,
    error,
    successMsg,
    page,
    setPage,
    total,
    totalPages,
    LIMIT,
    progress,
    showProgressPanel,
    dismissProgressPanel,
    handleCreate,
    handleDownload,
    handleDelete,
    loadBackups
  };
}
