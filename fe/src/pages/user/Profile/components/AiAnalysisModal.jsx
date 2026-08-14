import React from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function AiAnalysisModal({
  isOpen,
  onClose,
  isVi,
  profileName,
  analyzing,
  analysisError,
  analysisResult,
  copied,
  onRetry,
  onCopy
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <SparklesIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                {isVi ? 'Đánh giá Hiệu suất Nhân sự bằng AI' : 'AI Employee Performance Review'}
              </h3>
              <p className="text-[10px] font-bold text-gray-400">
                {isVi ? `Đánh giá cho: ${profileName}` : `Assessment for: ${profileName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <ArrowPathIcon className="animate-spin h-10 w-10 text-purple-600" />
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">
                  {isVi ? 'AI đang tổng hợp và phân tích dữ liệu hiệu suất...' : 'AI is compiling and analyzing performance data...'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isVi ? 'Quy trình bao gồm kiểm tra giờ công, lịch sử đi muộn và tình hình hoàn thành task.' : 'Checking actual working hours, lateness count, and task completion rate.'}
                </p>
              </div>
            </div>
          ) : analysisError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-red-600">
              <XMarkIcon className="w-12 h-12 text-red-500 bg-red-50 p-2.5 rounded-full mb-3" />
              <p className="font-bold text-sm">{analysisError}</p>
              <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isVi ? 'Thử lại' : 'Try Again'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex gap-3 text-purple-900 text-xs">
                <DocumentTextIcon className="w-5 h-5 shrink-0 text-purple-600" />
                <div>
                  <p className="font-bold">{isVi ? 'Nhận xét từ Hệ thống AI Agent' : 'Insights from AI Agent'}</p>
                  <p className="text-purple-700 mt-0.5 leading-relaxed">
                    {isVi 
                      ? 'Bản phân tích được tổng hợp hoàn toàn tự động từ dữ liệu chuyên cần, báo cáo ngày và công việc của nhân sự trong kỳ đánh giá.'
                      : 'This analysis is generated automatically from attendance records, daily logs, and task details.'}
                  </p>
                </div>
              </div>

              <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-6 shadow-inner text-sm text-gray-800 leading-relaxed font-semibold whitespace-pre-wrap font-sans max-h-[50vh] overflow-y-auto">
                {analysisResult}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
          <div>
            {!analyzing && !analysisError && analysisResult && (
              <button
                onClick={onCopy}
                className="py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">{isVi ? 'Đã sao chép!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                    <span>{isVi ? 'Sao chép kết quả' : 'Copy Result'}</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isVi ? 'Đóng lại' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
