import { useState, useEffect, useRef } from 'react';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CommandLineIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ClockIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

const CONFIRM_KEYWORD = 'KHOI PHUC';

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatSeconds = (sec) => {
  if (sec == null || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const RESTORE_STEPS = [
  { id: 1, label: 'Kiểm tra file', stages: ['initializing', 'downloading', 'validating'] },
  { id: 2, label: 'Backup an toàn', stages: ['safety_backup'] },
  { id: 3, label: 'Khôi phục CSDL', stages: ['clearing_db', 'restoring_db'] },
  { id: 4, label: 'Khôi phục tệp', stages: ['restoring_files'] },
];

const getRestoreStep = (stage) => {
  if (stage === 'completed') return 5;
  const found = RESTORE_STEPS.find((s) => s.stages.includes(stage));
  return found ? found.id : 1;
};

/**
 * Modal xác nhận khôi phục dữ liệu (yêu cầu gõ từ khóa để tránh thao tác nhầm)
 */
export function RestoreConfirmModal(props) {
  if (!props.target) return null;
  // Mount mới mỗi lần mở để reset ô nhập xác nhận
  return <RestoreConfirmDialog {...props} />;
}

function RestoreConfirmDialog({ target, options, setOptions, onCancel, onConfirm }) {
  const [keyword, setKeyword] = useState('');
  const [triggerSecret, setTriggerSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const isFile = target.type === 'file';
  const name = isFile ? target.file.name : target.backup.filename;
  const size = isFile ? target.file.size : target.backup.size_bytes;
  const canConfirm = keyword.trim().toUpperCase() === CONFIRM_KEYWORD && triggerSecret.trim().length > 0;

  const handleSubmit = () => {
    if (canConfirm) {
      onConfirm(triggerSecret.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onCancel} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-modal-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center shrink-0">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="restore-modal-title" className="text-lg font-bold text-gray-900">Khôi phục dữ liệu hệ thống</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Toàn bộ dữ liệu hiện tại sẽ bị <span className="font-semibold text-rose-600">thay thế</span> bằng dữ liệu trong bản backup.
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Đóng">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-5 space-y-4">
          {/* Source info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
              {isFile ? 'File tải lên từ máy' : 'Bản backup trên hệ thống'}
            </p>
            <p className="text-sm font-mono text-gray-800 break-all">{name}</p>
            <p className="text-xs text-gray-500 mt-1">
              Kích thước: {formatBytes(size)}
              {!isFile && target.backup.rows_count != null && <> · {target.backup.rows_count.toLocaleString('vi-VN')} bản ghi</>}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition">
              <input
                id="restore-opt-safety-backup"
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-blue-600"
                checked={options.safetyBackup}
                onChange={(e) => setOptions((o) => ({ ...o, safetyBackup: e.target.checked }))}
              />
              <div>
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                  Tạo backup an toàn trước khi khôi phục
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Khuyến nghị</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Sao lưu dữ liệu hiện tại để có thể quay lại nếu cần.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition">
              <input
                id="restore-opt-files"
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-blue-600"
                checked={options.restoreFiles}
                onChange={(e) => setOptions((o) => ({ ...o, restoreFiles: e.target.checked }))}
              />
              <div>
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <PaperClipIcon className="w-4 h-4 text-indigo-600" />
                  Khôi phục cả tệp đính kèm (uploads)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Giải nén ảnh, tài liệu trong bản backup vào máy chủ (ghi đè file trùng tên).</p>
              </div>
            </label>
          </div>

          {/* Warning */}
          <div className="flex gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
            <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 leading-relaxed">
              Các phiên đăng nhập có thể bị đăng xuất sau khi khôi phục. Nếu có lỗi, CSDL sẽ tự động
              <span className="font-semibold"> rollback</span> về trạng thái ban đầu.
            </p>
          </div>

          {/* Trigger Secret Input */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="restore-trigger-secret-input" className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <KeyIcon className="w-4 h-4 text-amber-600" />
                Mã bí mật Trigger CSDL (DB_APP_CONTEXT_SECRET) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold underline"
              >
                {showSecret ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <input
              id="restore-trigger-secret-input"
              type={showSecret ? 'text' : 'password'}
              autoFocus
              value={triggerSecret}
              onChange={(e) => setTriggerSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Nhập mã bí mật trigger để xác thực..."
              autoComplete="off"
              className="w-full px-3.5 py-2 text-sm font-mono border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
            />
            <p className="text-[11px] text-amber-800/80 mt-1">
              Bắt buộc nhập chính xác mã bí mật để can thiệp trigger bảo vệ CSDL.
            </p>
          </div>

          {/* Confirm keyword */}
          <div>
            <label htmlFor="restore-confirm-input" className="text-xs font-medium text-gray-600">
              Gõ <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{CONFIRM_KEYWORD}</span> để xác nhận
            </label>
            <input
              id="restore-confirm-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={CONFIRM_KEYWORD}
              autoComplete="off"
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm font-mono border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
          <button
            id="btn-cancel-restore"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition"
          >
            Hủy
          </button>
          <button
            id="btn-confirm-restore"
            onClick={handleSubmit}
            disabled={!canConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl shadow-md shadow-orange-500/20 transition active:scale-[0.97]"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            Khôi phục ngay
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Bảng tiến trình khôi phục thời gian thực
 */
export function RestoreProgressPanel({ progress, onDismiss }) {
  const [showLogs, setShowLogs] = useState(true);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [progress.logs, showLogs]);

  const isDone = progress.stage === 'completed';
  const isFailed = progress.stage === 'failed';
  const currentStep = getRestoreStep(progress.stage);

  return (
    <div className="mb-8 bg-white border border-amber-200/90 rounded-2xl p-6 shadow-xl shadow-amber-500/10 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-amber-300/15 to-orange-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top */}
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            isDone ? 'bg-emerald-50 border-emerald-200' : isFailed ? 'bg-rose-50 border-rose-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
          }`}>
            {isDone ? <CheckCircleIcon className="w-7 h-7 text-emerald-600" />
              : isFailed ? <XCircleIcon className="w-7 h-7 text-rose-600" />
              : <ArrowPathIcon className="w-6 h-6 animate-spin text-amber-600" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">
                {isDone ? 'Khôi phục dữ liệu thành công' : isFailed ? 'Khôi phục gặp sự cố' : 'Đang khôi phục dữ liệu hệ thống'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : isFailed ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-amber-500 text-white animate-pulse'
              }`}>
                {progress.percent}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5 font-medium">{progress.message || 'Đang chuẩn bị...'}</p>
            {progress.sourceName && (
              <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">Nguồn: {progress.sourceName}</p>
            )}
          </div>
        </div>
        {!progress.running && (
          <button onClick={onDismiss} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition" title="Đóng">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative mb-5 z-10">
        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/80 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
              isDone ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500'
                : isFailed ? 'bg-gradient-to-r from-rose-500 to-red-600'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
            }`}
            style={{ width: `${Math.max(2, Math.min(100, progress.percent))}%` }}
          >
            {progress.running && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 relative z-10">
        <div className="bg-gradient-to-br from-blue-50/60 to-white border border-blue-100/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-blue-800 font-medium mb-1">
            <DocumentTextIcon className="w-4 h-4 text-blue-500" /> Bản ghi CSDL
          </div>
          <div className="text-sm font-extrabold text-gray-900 truncate">
            {(progress.rowsRestored || 0).toLocaleString('vi-VN')}
            <span className="text-xs font-semibold text-gray-400"> / {(progress.totalRows || 0).toLocaleString('vi-VN')}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-50/60 to-white border border-violet-100/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-violet-800 font-medium mb-1">
            <CommandLineIcon className="w-4 h-4 text-violet-500" /> Bảng hiện tại
          </div>
          <div className="text-sm font-extrabold text-gray-900 truncate" title={progress.tableName}>
            {progress.tableName ? `${progress.tableName} (${progress.currentTable}/${progress.totalTables})` : '—'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-100/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-indigo-800 font-medium mb-1">
            <PaperClipIcon className="w-4 h-4 text-indigo-500" /> Tệp đính kèm
          </div>
          <div className="text-sm font-extrabold text-gray-900">
            {progress.filesRestored || 0}
            <span className="text-xs font-semibold text-gray-400"> / {progress.totalFiles || 0}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium mb-1">
            <ClockIcon className="w-4 h-4 text-emerald-500" /> Thời gian
          </div>
          <div className="text-sm font-extrabold text-gray-900 font-mono">{formatSeconds(progress.elapsedSeconds)}</div>
        </div>
      </div>

      {/* Steps */}
      <div className="border-t border-gray-100 pt-4 mb-4 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RESTORE_STEPS.map((step) => {
            const done = isDone || currentStep > step.id;
            const current = !isDone && !isFailed && currentStep === step.id;
            const failedHere = isFailed && currentStep === step.id;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  failedHere ? 'bg-rose-50 text-rose-700 border border-rose-300'
                    : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    : current ? 'bg-amber-50 text-amber-800 border border-amber-300 ring-1 ring-amber-400/30'
                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  failedHere ? 'bg-rose-500 text-white'
                    : done ? 'bg-emerald-600 text-white'
                    : current ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {failedHere ? '✕' : done ? '✓' : step.id}
                </div>
                <span className="truncate">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isDone && progress.result?.safetyBackupFilename && (
        <div className="mb-4 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 relative z-10">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800">
            Dữ liệu trước khi khôi phục đã được lưu tại bản backup
            <span className="font-mono font-semibold"> {progress.result.safetyBackupFilename}</span>.
          </p>
        </div>
      )}

      {/* Logs */}
      <div className="border-t border-gray-100 pt-3 relative z-10">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-gray-900 py-1"
        >
          <span className="flex items-center gap-1.5">
            <CommandLineIcon className="w-4 h-4 text-gray-500" />
            Nhật ký khôi phục ({progress.logs?.length || 0} mục)
          </span>
          {showLogs ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
        </button>
        {showLogs && (
          <div ref={logRef} className="mt-2.5 bg-gray-950 text-gray-200 font-mono text-xs rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 border border-gray-800">
            {(!progress.logs || progress.logs.length === 0) ? (
              <p className="text-gray-500 italic">Chưa có nhật ký...</p>
            ) : progress.logs.map((msg, idx) => (
              <div key={idx} className="leading-relaxed hover:bg-gray-900 px-1 rounded flex gap-2">
                <span className="text-gray-500 select-none">[{idx + 1}]</span>
                <span className={
                  msg.includes('❌') ? 'text-rose-400'
                    : msg.includes('✅') || msg.includes('🎉') ? 'text-emerald-400'
                    : msg.includes('🛡️') || msg.includes('🚀') ? 'text-amber-300'
                    : 'text-gray-300'
                }>{msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
