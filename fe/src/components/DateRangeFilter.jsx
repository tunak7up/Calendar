import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import MiniCalendar from './MiniCalendar';

const toDisplayFormat = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};


const isValidDate = (day, month, year) => {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
};

const toStateFormat = (displayStr) => {
  if (!displayStr) return '';
  const parts = displayStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && parts[2].length === 4) {
      if (isValidDate(day, month, year)) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        return `${year}-${monthStr}-${dayStr}`;
      }
    }
  }
  return '';
};

export default function DateRangeFilter({ startDate, endDate, onRangeChange }) {
  const { t } = useTranslation();
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);

  const [startInput, setStartInput] = useState(toDisplayFormat(startDate));
  const [endInput, setEndInput] = useState(toDisplayFormat(endDate));

  useEffect(() => {
    setStartInput(toDisplayFormat(startDate));
  }, [startDate]);

  useEffect(() => {
    setEndInput(toDisplayFormat(endDate));
  }, [endDate]);

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

  const handleStartTextChange = (e) => {
    const val = e.target.value;
    setStartInput(val);
    const parsed = toStateFormat(val);
    if (parsed && !isNaN(new Date(parsed).getTime())) {
      handleStartDateChange(parsed);
    }
  };

  const handleEndTextChange = (e) => {
    const val = e.target.value;
    setEndInput(val);
    const parsed = toStateFormat(val);
    if (parsed && !isNaN(new Date(parsed).getTime())) {
      handleEndDateChange(parsed);
    }
  };

  const handleStartBlur = () => {
    const parsed = toStateFormat(startInput);
    if (!parsed) {
      setStartInput(toDisplayFormat(startDate));
    }
  };

  const handleEndBlur = () => {
    const parsed = toStateFormat(endInput);
    if (!parsed) {
      setEndInput(toDisplayFormat(endDate));
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
    <div className="flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-1.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto relative overflow-visible">
      {/* Month selection */}
      <div className="flex items-center gap-2 border-b sm:border-b-0 sm:border-r border-gray-200 pb-2 sm:pb-0 sm:pr-3">
        <CalendarDaysIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <select
          onChange={handleQuickMonthChange}
          className="bg-transparent border-none text-xs font-bold text-blue-600 outline-none cursor-pointer hover:text-blue-700 transition-colors w-full"
          defaultValue=""
        >
          {getMonthOptions()}
        </select>
      </div>

      {/* Date inputs wrapper */}
      <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-start flex-1 sm:flex-none w-full sm:w-auto">
        
        {/* From Date field */}
        <div className="flex items-center gap-1 sm:gap-1.5 relative flex-1 sm:flex-initial">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">{t('dashboard.from')}</span>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 gap-1 focus-within:ring-1 focus-within:ring-blue-500/50 w-full sm:w-auto">
            <input
              type="text"
              value={startInput}
              onChange={handleStartTextChange}
              onBlur={handleStartBlur}
              placeholder="dd/mm/yyyy"
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none w-full sm:w-[90px]"
            />
            <button
              onClick={() => {
                setShowFromCalendar(!showFromCalendar);
                setShowToCalendar(false);
              }}
              type="button"
              className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
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

        {/* To Date field */}
        <div className="flex items-center gap-1 sm:gap-1.5 relative flex-1 sm:flex-initial">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">{t('dashboard.to')}</span>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 gap-1 focus-within:ring-1 focus-within:ring-blue-500/50 w-full sm:w-auto">
            <input
              type="text"
              value={endInput}
              onChange={handleEndTextChange}
              onBlur={handleEndBlur}
              placeholder="dd/mm/yyyy"
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none w-full sm:w-[90px]"
            />
            <button
              onClick={() => {
                setShowToCalendar(!showToCalendar);
                setShowFromCalendar(false);
              }}
              type="button"
              className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
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
