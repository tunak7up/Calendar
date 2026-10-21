import { useState, useRef, useEffect } from 'react';
import {
  CloudArrowDownIcon,
  TrashIcon,
  ArrowPathIcon,
  CircleStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  CloudIcon,
  BoltIcon,
  DocumentTextIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { useAdminBackup } from './hooks/useAdminBackup';

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch { return dateStr; }
};

const formatSeconds = (sec) => {
  if (sec == null || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getStageStep = (stage) => {
  switch (stage) {
    case 'initializing':
    case 'reading_db':
      return 1;
    case 'scanning_files':
      return 2;
    case 'compressing_zip':
      return 3;
    case 'saving_local':
    case 'uploading_s3':
      return 4;
    case 'completed':
      return 5;
    default:
      return 1;
  }
};

const StatusBadge = ({ status }) => {
  if (status === 'success') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircleIcon className="w-3.5 h-3.5" />
      Thành công
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <XCircleIcon className="w-3.5 h-3.5" />
      Thất bại
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <ClockIcon className="w-3.5 h-3.5" />
      Đang xử lý
    </span>
  );
};

const StorageBadge = ({ backup }) => {
  const hasS3 = !!backup.s3_key;
  const hasLocal = !!backup.local_path;
  return (
    <div className="flex gap-1.5 flex-wrap">
      {hasS3 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <CloudIcon className="w-3 h-3" /> S3
        </span>
      )}
      {hasLocal && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
          <ServerIcon className="w-3 h-3" /> Local
        </span>
      )}
    </div>
  );
};

export default function AdminBackup() {
  const {
    backups, loading, creating, downloadingId, deletingId,
    error, successMsg, page, setPage, total, totalPages, LIMIT,
    progress, showProgressPanel, dismissProgressPanel,
    handleCreate, handleDownload, handleDelete
  } = useAdminBackup();

  const [showLogs, setShowLogs] = useState(false);
  const logTerminalRef = useRef(null);

  // Tự động cuộn xuống dòng log mới nhất khi log thay đổi
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [progress.logs]);

  const currentStep = getStageStep(progress.stage);

  const isS3Configured = progress.s3Configured !== undefined 
    ? Boolean(progress.s3Configured)
    : Boolean(progress.result?.s3Configured ?? (progress.result?.log?.s3_key || progress.result?.downloadUrl));

  const isS3Uploaded = Boolean(
    progress.s3Success ??
    progress.result?.s3Success ??
    (progress.result?.log?.s3_key || progress.result?.downloadUrl)
  );

  const pipelineSteps = [
    { id: 1, label: 'Đọc CSDL (18 bảng)' },
    { id: 2, label: 'Đóng gói Full ZIP' },
    { id: 3, label: 'Lưu Local' },
    {
      id: 4,
      label: isS3Configured ? 'Đẩy lên S3' : 'Không thiết lập S3'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <CircleStackIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý Backup</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Full Backup: CSDL + Toàn bộ tệp đính kèm vật lý (ảnh, tài liệu) lên S3 & máy chủ · Tổng: <span className="font-semibold text-gray-700">{total}</span> bản
              </p>
            </div>
          </div>

          <button
            id="btn-create-backup"
            onClick={handleCreate}
            disabled={creating || progress.running}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.97] disabled:cursor-not-allowed"
          >
            {creating || progress.running ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Đang sao lưu ({progress.percent}%)...
              </>
            ) : (
              <>
                <CircleStackIcon className="w-5 h-5" />
                Tạo Backup Ngay
              </>
            )}
          </button>
        </div>

        {/* Alert Messages */}
        {successMsg && (
          <div className="mb-5 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-medium shadow-sm">
            <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-sm font-medium shadow-sm">
            <XCircleIcon className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            {error}
          </div>
        )}

        {/* Real-time Backup Progress Panel */}
        {showProgressPanel && (
          <div className="mb-8 bg-white border border-blue-200/90 rounded-2xl p-6 shadow-xl shadow-blue-500/10 relative overflow-hidden transition-all duration-300">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-blue-400/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Status + Actions */}
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  progress.stage === 'completed'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : progress.stage === 'failed'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-200'
                }`}>
                  {progress.stage === 'completed' ? (
                    <CheckCircleIcon className="w-7 h-7 text-emerald-600" />
                  ) : progress.stage === 'failed' ? (
                    <XCircleIcon className="w-7 h-7 text-rose-600" />
                  ) : (
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900">
                      {progress.stage === 'completed'
                        ? 'Sao lưu hoàn tất thành công'
                        : progress.stage === 'failed'
                        ? 'Sao lưu gặp sự cố'
                        : 'Đang tiến hành sao lưu hệ thống'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight shadow-sm ${
                      progress.stage === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : progress.stage === 'failed'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-blue-600 text-white animate-pulse'
                    }`}>
                      {progress.percent}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 font-medium">
                    {progress.message || 'Đang chuẩn bị tiến trình...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {progress.stage === 'completed' && progress.result?.downloadUrl && (
                  <a
                    href={progress.result.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-500/20 transition active:scale-95"
                  >
                    <CloudArrowDownIcon className="w-4 h-4" />
                    Tải file về máy
                  </a>
                )}
                {!progress.running && (
                  <button
                    onClick={dismissProgressPanel}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    title="Đóng bảng tiến độ"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Progress Bar */}
            <div className="relative mb-5 z-10">
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/80 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                    progress.stage === 'completed'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500'
                      : progress.stage === 'failed'
                      ? 'bg-gradient-to-r from-rose-500 to-red-600'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
                  }`}
                  style={{ width: `${Math.max(2, Math.min(100, progress.percent))}%` }}
                >
                  {/* Subtle Shimmer Animation */}
                  {progress.running && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Grid: 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 z-10 relative">
              {/* Metric 1: Tốc độ xử lý */}
              <div className="bg-gradient-to-br from-amber-50/60 to-white border border-amber-100/80 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium mb-1">
                  <BoltIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Tốc độ xử lý</span>
                </div>
                <div className="text-sm font-extrabold text-gray-900 truncate" title={progress.speedText}>
                  {progress.speedText || '—'}
                </div>
              </div>

              {/* Metric 2: Bản ghi & Tệp tin */}
              <div className="bg-gradient-to-br from-blue-50/60 to-white border border-blue-100/80 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-blue-800 font-medium mb-1">
                  <DocumentTextIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>CSDL & Tệp đính kèm</span>
                </div>
                <div className="text-sm font-extrabold text-gray-900 truncate">
                  {(progress.rowsRead || 0).toLocaleString('vi-VN')} dòng
                  {progress.filesCount > 0 && (
                    <span className="text-xs font-semibold text-indigo-600 ml-1">
                      · {progress.filesCount} file
                    </span>
                  )}
                </div>
              </div>

              {/* Metric 3: Thời gian đã chạy */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-100/80 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-indigo-800 font-medium mb-1">
                  <ClockIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Thời gian đã chạy</span>
                </div>
                <div className="text-sm font-extrabold text-gray-900 font-mono">
                  {formatSeconds(progress.elapsedSeconds)}
                </div>
              </div>

              {/* Metric 4: Ước tính còn lại */}
              <div className="bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/80 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium mb-1">
                  <ClockIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Ước tính còn</span>
                </div>
                <div className="text-sm font-extrabold text-gray-900">
                  {progress.running
                    ? (progress.etaSeconds ? `~${progress.etaSeconds} giây` : 'Đang tính...')
                    : (progress.stage === 'completed' ? 'Hoàn tất' : '—')}
                </div>
              </div>
            </div>

            {/* Pipeline Stage Stepper */}
            <div className="border-t border-gray-100 pt-4 mb-4 z-10 relative">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {pipelineSteps.map((step) => {
                  // Xử lý riêng cho Bước S3 (step.id === 4)
                  if (step.id === 4) {
                    if (!isS3Configured) {
                      // Không thiết lập S3 -> Màu vàng cảnh báo
                      const isReached = progress.stage === 'completed' || currentStep >= 4;
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isReached
                              ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-sm'
                              : 'bg-amber-50/50 text-amber-700/80 border border-dashed border-amber-200'
                          }`}
                          title="Chưa thiết lập cấu hình AWS S3 trong file .env — file backup chỉ được lưu trên máy chủ Local"
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isReached
                              ? 'bg-amber-500 text-white'
                              : 'bg-amber-200 text-amber-800'
                          }`}>
                            ⚠️
                          </div>
                          <span className="truncate">{step.label}</span>
                        </div>
                      );
                    }

                    // S3 có cấu hình nhưng bị lỗi upload
                    if (progress.stage === 'completed' && !isS3Uploaded) {
                      return (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 shadow-sm"
                          title="Lỗi khi tải file lên AWS S3 (file local vẫn được lưu an toàn)"
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-rose-500 text-white">
                            ✕
                          </div>
                          <span className="truncate">Lỗi đẩy lên S3</span>
                        </div>
                      );
                    }
                  }

                  // Các bước thông thường
                  const isDone = progress.stage === 'completed' || currentStep > step.id;
                  const isCurrent = progress.stage !== 'completed' && currentStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : isCurrent
                          ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-sm ring-1 ring-blue-400/30'
                          : 'bg-gray-50 text-gray-400 border border-gray-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isDone ? '✓' : step.id}
                      </div>
                      <span className="truncate">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Terminal Live Activity Logs (Collapsible) */}
            <div className="border-t border-gray-100 pt-3 z-10 relative">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-gray-900 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <CommandLineIcon className="w-4 h-4 text-gray-500" />
                  Nhật ký hoạt động chi tiết ({progress.logs?.length || 0} mục)
                </span>
                {showLogs ? (
                  <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showLogs && (
                <div
                  ref={logTerminalRef}
                  className="mt-2.5 bg-gray-950 text-gray-200 font-mono text-xs rounded-xl p-3 max-h-48 overflow-y-auto space-y-1 shadow-inner border border-gray-800"
                >
                  {(!progress.logs || progress.logs.length === 0) ? (
                    <p className="text-gray-500 italic">Chưa có nhật ký hoạt động...</p>
                  ) : (
                    progress.logs.map((logMsg, idx) => (
                      <div key={idx} className="leading-relaxed hover:bg-gray-900 px-1 rounded flex gap-2">
                        <span className="text-gray-500 select-none">[{idx + 1}]</span>
                        <span className={
                          logMsg.includes('❌') || logMsg.includes('Lỗi')
                            ? 'text-rose-400'
                            : logMsg.includes('✅') || logMsg.includes('🎉')
                            ? 'text-emerald-400'
                            : logMsg.includes('📦') || logMsg.includes('🚀')
                            ? 'text-cyan-400'
                            : 'text-gray-300'
                        }>
                          {logMsg}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 border rounded-xl px-4 py-3 flex items-start gap-3 transition-colors ${
            isS3Configured
              ? 'bg-blue-50 border-blue-200'
              : 'bg-amber-50/70 border-amber-200/90'
          }`}>
            <CloudIcon className={`w-5 h-5 shrink-0 mt-0.5 ${isS3Configured ? 'text-blue-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-sm font-semibold flex items-center gap-2 ${isS3Configured ? 'text-blue-900' : 'text-amber-900'}`}>
                <span>Lưu trữ đám mây (S3)</span>
                {!isS3Configured && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                    Chưa thiết lập
                  </span>
                )}
              </p>
              <p className={`text-xs mt-0.5 ${isS3Configured ? 'text-blue-700' : 'text-amber-700'}`}>
                {isS3Configured
                  ? 'Bản Full Backup ZIP (CSDL + toàn bộ tệp đính kèm) được đẩy lên AWS S3 an toàn'
                  : 'Chưa cấu hình AWS S3 trong file .env — file backup hiện chỉ lưu an toàn tại máy chủ Local'}
              </p>
            </div>
          </div>
          <div className="flex-1 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <ServerIcon className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-900">Lưu trữ máy chủ (Local)</p>
              <p className="text-xs text-violet-700 mt-0.5">File ZIP luôn được lưu một bản tại máy chủ — download trực tiếp không lo mạng chậm</p>
            </div>
          </div>
          <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <ClockIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Tự động hàng ngày</p>
              <p className="text-xs text-amber-700 mt-0.5">Hệ thống tự Full Backup lúc 2:00 AM mỗi ngày · Tự động giữ tối đa 30 bản gần nhất</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Đang tải danh sách backup...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CircleStackIcon className="w-12 h-12 text-gray-300" />
              <p className="text-base font-semibold text-gray-500">Chưa có backup nào</p>
              <p className="text-sm text-gray-400">Bấm "Tạo Backup Ngay" để tạo bản backup đầu tiên</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tên file', 'Thời gian', 'Kích thước', 'Records', 'Trigger', 'Lưu trữ', 'Trạng thái', 'Thao tác'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-mono text-gray-700 text-xs">{backup.filename}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatDate(backup.created_at)}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{formatBytes(backup.size_bytes)}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {backup.rows_count != null ? backup.rows_count.toLocaleString('vi-VN') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          backup.triggered_by === 'cron'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {backup.triggered_by === 'cron' ? '⏰ Tự động' : '👤 Thủ công'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StorageBadge backup={backup} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={backup.status} />
                        {backup.status === 'failed' && backup.error_message && (
                          <p className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate" title={backup.error_message}>
                            {backup.error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {backup.status === 'success' && (
                            <button
                              id={`btn-download-backup-${backup.id}`}
                              onClick={() => handleDownload(backup)}
                              disabled={downloadingId === backup.id}
                              title="Download backup"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                              {downloadingId === backup.id
                                ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                : <CloudArrowDownIcon className="w-4 h-4" />
                              }
                            </button>
                          )}
                          <button
                            id={`btn-delete-backup-${backup.id}`}
                            onClick={() => handleDelete(backup)}
                            disabled={deletingId === backup.id}
                            title="Xóa backup"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                          >
                            {deletingId === backup.id
                              ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              : <TrashIcon className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Trang {page}/{totalPages} · {total} bản backup
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
