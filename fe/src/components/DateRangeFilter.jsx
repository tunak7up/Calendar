import React, { useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import MiniCalendar from './MiniCalendar';

export default function DateRangeFilter({ startDate, endDate, onRangeChange }) {
  const { t } = useTranslation();
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);

  const monthsList = t('months_long', { returnObjects: true }) || [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleStartDateChange = (newStart) => {
    if (!newStart) return;
    if (newStart > endDate) {
      const [year, month] = newStart.split('-').map(Number);
      const lastDayDate = new Date(year, month, 0);
      const lastDayStr = lastDayDate.toISOString().split('T')[0];
      onRangeChange(newStart, lastDayStr);
    } else {
      onRangeChange(newStart, endDate);
    }
  };

  const handleEndDateChange = (newEnd) => {
    if (!newEnd) return;
    if (newEnd < startDate) {
      onRangeChange(startDate, startDate);
    } else {
      onRangeChange(startDate, newEnd);
    }
  };

  const handleQuickMonthChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month] = val.split('-').map(Number);
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    onRangeChange(first.toISOString().split('T')[0], last.toISOString().split('T')[0]);
  };

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthsList[d.getMonth()]} ${d.getFullYear()}`;
      const value = `${d.getFullYear()}-${d.getMonth()}`;
      options.push(<option key={value} value={value}>{label}</option>);
    }
    return options;
  };

  return (
    <div className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 flex items-center gap-3 w-full lg:w-auto relative overflow-visible">
      <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
        <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
        <select
          onChange={handleQuickMonthChange}
          className="bg-transparent border-none text-xs font-bold text-blue-600 outline-none cursor-pointer hover:text-blue-700 transition-colors"
          defaultValue=""
        >
          {getMonthOptions()}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        
        {/* From Date field with Calendar Icon */}
        <div className="flex items-center gap-1.5 relative">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.from')}</span>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 gap-1 focus-within:ring-1 focus-within:ring-blue-500/50">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none w-[110px]"
            />
            <button
              onClick={() => {
                setShowFromCalendar(!showFromCalendar);
                setShowToCalendar(false);
              }}
              type="button"
              className="text-gray-450 hover:text-blue-600 transition-colors"
            >
              <CalendarDaysIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {showFromCalendar && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFromCalendar(false)} />
              <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-white border border-gray-200 shadow-2xl rounded-2xl w-[280px]">
                <MiniCalendar
                  selectedDate={startDate}
                  onSelectDate={(date) => {
                    handleStartDateChange(date);
                    setShowFromCalendar(false);
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* To Date field with Calendar Icon */}
        <div className="flex items-center gap-1.5 relative">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.to')}</span>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 gap-1 focus-within:ring-1 focus-within:ring-blue-500/50">
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none w-[110px]"
            />
            <button
              onClick={() => {
                setShowToCalendar(!showToCalendar);
                setShowFromCalendar(false);
              }}
              type="button"
              className="text-gray-450 hover:text-blue-600 transition-colors"
            >
              <CalendarDaysIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {showToCalendar && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowToCalendar(false)} />
              <div className="absolute top-full right-0 z-50 mt-2 p-4 bg-white border border-gray-200 shadow-2xl rounded-2xl w-[280px]">
                <MiniCalendar
                  selectedDate={endDate}
                  onSelectDate={(date) => {
                    handleEndDateChange(date);
                    setShowToCalendar(false);
                  }}
                />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
