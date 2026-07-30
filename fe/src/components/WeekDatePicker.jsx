import React from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getFullDateStr } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateWeek = (dateObj, lang = 'vi') => {
  const dates = [];
  const date = new Date(dateObj.getTime());
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(date.setDate(diff));
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek.getTime());
    d.setDate(startOfWeek.getDate() + i);
    dates.push({
      day: d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase(),
      date: d.getDate().toString(),
      fullDate: getFullDateStr(d),
      dateObj: d,
    });
  }
  return dates;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function WeekDatePicker({
  viewDate,
  onViewChange,
  selectedDates = [],
  addedDates = [],
  pendingDates = [],
  onDayClick,
  workDays = [],
}) {
  const { t, i18n } = useTranslation();
  const weekDates = generateWeek(viewDate, i18n.language);
  const viewDateStr = getFullDateStr(viewDate);
  const todayStr = getFullDateStr(new Date());
  const formatDateToDMY = (dObj) => {
    const day = String(dObj.getDate()).padStart(2, '0');
    const month = String(dObj.getMonth() + 1).padStart(2, '0');
    const year = dObj.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const weekStartStr = formatDateToDMY(weekDates[0].dateObj);
  const weekEndStr = formatDateToDMY(weekDates[6].dateObj);

  const handleNativeChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-');
    const newDate = new Date(y, m - 1, d);
    onViewChange(newDate);
  };

  const handlePrevWeek = () => {
    const d = new Date(viewDate.getTime());
    d.setDate(d.getDate() - 7);
    onViewChange(d);
  };

  const handleNextWeek = () => {
    const d = new Date(viewDate.getTime());
    d.setDate(d.getDate() + 7);
    onViewChange(d);
  };

  return (
    <div>
      {/* Label row with calendar icon and navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevWeek} 
            className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title={t('components.weekDatePicker.prevWeek')}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-gray-700">
              {weekStartStr} - {weekEndStr}
            </span>
            <div className="relative w-6 h-6">
              <input
                type="date"
                value={viewDateStr}
                onChange={handleNativeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title={t('components.weekDatePicker.selectDate')}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button 
            onClick={handleNextWeek} 
            className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title={t('components.weekDatePicker.nextWeek')}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="flex justify-between items-center w-full max-w-2xl mx-auto gap-2 overflow-x-auto pb-2 px-1">
        {weekDates.map((d) => {
          const active = selectedDates.includes(d.fullDate);
          const isAdded = addedDates.includes(d.fullDate);
          const isPending = pendingDates.includes(d.fullDate);
          const hasWork = workDays.includes(d.fullDate);
          const colPos = d.dateObj.getDay();
          const isWeekend = colPos === 0 || colPos === 6;
          const isPast = d.fullDate < todayStr;
          const isDisabled = isWeekend || isPast;

          let btnClass = '';
          let dayTextClass = '';
          let dateTextClass = '';
          let dotColor = '';

          if (active) {
            btnClass = 'bg-blue-50 border-blue-400 shadow-md';
            dayTextClass = 'text-blue-500';
            dateTextClass = 'text-blue-700';
            dotColor = 'bg-blue-600';
          } else if (isAdded) {
            btnClass = 'bg-emerald-50 border-emerald-400 shadow-md text-emerald-700';
            dayTextClass = 'text-emerald-500';
            dateTextClass = 'text-emerald-700';
            dotColor = 'bg-emerald-600';
          } else if (isPending) {
            btnClass = 'bg-yellow-50 border-yellow-400 shadow-md text-yellow-700';
            dayTextClass = 'text-yellow-600';
            dateTextClass = 'text-yellow-700';
            dotColor = 'bg-yellow-600';
          } else if (isDisabled) {
            btnClass = 'opacity-40 cursor-not-allowed border-transparent bg-gray-50/50';
            dayTextClass = 'text-gray-350';
            dateTextClass = 'text-gray-300';
            dotColor = 'bg-blue-300';
          } else {
            btnClass = 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-sm';
            dayTextClass = 'text-gray-400';
            dateTextClass = 'text-gray-900';
            dotColor = 'bg-blue-400';
          }

          return (
            <button
              key={d.fullDate}
              disabled={isDisabled}
              onClick={() => onDayClick(d.dateObj)}
              className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all flex-shrink-0 relative border-2 ${btnClass}`}
            >
              <span className={`text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${dayTextClass}`}>
                {d.day}
              </span>
              <span className={`text-xl font-bold ${dateTextClass}`}>
                {d.date}
              </span>
              {hasWork && (
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row justify-center items-start sm:items-center gap-y-2 sm:gap-x-6 mt-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-fit mx-auto sm:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 bg-blue-50"></div>
          <span>{t('components.weekDatePicker.legend_selecting', 'Đang chọn')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 bg-emerald-50"></div>
          <span>{t('components.weekDatePicker.legend_added', 'Đã thêm vào danh sách')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 bg-yellow-50"></div>
          <span>{t('components.weekDatePicker.legend_pending', 'Chờ duyệt')}</span>
        </div>
      </div>
    </div>
  );
}
