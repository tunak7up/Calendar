import React from 'react';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function WorkdayDetailModal({ isOpen, onClose, selectedDate, selectedDateDetail }) {
  const { i18n } = useTranslation();
  if (!isOpen) return null;

  const { schedule, report } = selectedDateDetail;
  const hasSchedule = !!schedule;
  const checkIn = report?.check_in || null;
  const checkOut = report?.check_out || null;

  let statusLabel = '';
  let statusColorClass = '';
  if (hasSchedule) {
    if (checkIn) {
      statusLabel = i18n.language === 'vi' ? 'Đi làm đúng lịch' : 'Worked (Scheduled)';
      statusColorClass = 'bg-blue-50 text-blue-700 border-blue-100';
    } else {
      statusLabel = i18n.language === 'vi' ? 'Vắng / Chưa check-in' : 'Absent / No Check-in';
      statusColorClass = 'bg-red-50 text-red-700 border-red-100';
    }
  } else {
    statusLabel = i18n.language === 'vi' ? 'Đi làm ngoài lịch' : 'Unscheduled Work';
    statusColorClass = 'bg-amber-50 text-amber-700 border-amber-100';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {i18n.language === 'vi' ? 'Chi tiết ngày làm việc' : 'Workday Details'}
              </h3>
              <p className="text-[10px] font-bold text-gray-400">
                {(() => {
                  const [year, month, day] = selectedDate.split('-');
                  return `${day}/${month}/${year}`;
                })()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!hasSchedule && !checkIn ? (
            <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm font-semibold text-gray-400">
                {i18n.language === 'vi' ? 'Không có lịch làm việc và chấm công trong ngày này' : 'No schedule or attendance on this day'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border uppercase tracking-wider ${statusColorClass} shadow-sm`}>
                  {statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 block">
                    {i18n.language === 'vi' ? 'Ca đăng ký' : 'Registered Shift'}
                  </span>
                  {hasSchedule ? (
                    <span className="text-sm font-bold text-gray-800">
                      {new Date(schedule.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(schedule.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 italic font-semibold">
                      {i18n.language === 'vi' ? 'Không có ca đăng ký' : 'No registered shift'}
                    </span>
                  )}
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 block">
                    {i18n.language === 'vi' ? 'Giờ điểm danh' : 'Attendance Time'}
                  </span>
                  {checkIn ? (
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-800">
                      <span className="text-emerald-600">In: {checkIn.slice(0, 5)}</span>
                      <span className="text-blue-600">Out: {checkOut ? checkOut.slice(0, 5) : '--:--'}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic font-semibold">
                      {i18n.language === 'vi' ? 'Chưa chấm công' : 'No check-in record'}
                    </span>
                  )}
                </div>
              </div>

              {checkIn && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                    {i18n.language === 'vi' ? 'Nội dung báo cáo hàng ngày' : 'Daily Report Content'}
                  </span>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 min-h-[120px] shadow-sm text-sm text-gray-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {report?.description || (
                      <span className="text-gray-400 italic">
                        {i18n.language === 'vi' ? 'Không có mô tả báo cáo' : 'No report description'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {i18n.language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
