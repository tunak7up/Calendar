import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function MiniCalendar({ selectedDate, onSelectDate, workDays = [] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selectedDate ? new Date(selectedDate).getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? new Date(selectedDate).getMonth() : today.getMonth()
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build day grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, currentMonth: false, dateStr: null });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, currentMonth: true, dateStr });
  }

  // Trailing days
  const trailing = 42 - cells.length;
  for (let d = 1; d <= trailing; d++) {
    cells.push({ day: d, currentMonth: false, dateStr: null });
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-bold text-gray-900">
          Tháng {viewMonth + 1}, {viewYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className={`text-center text-[0.7rem] font-bold py-1 ${wd === 'CN' || wd === 'T7' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          const hasWorkHour = cell.dateStr ? workDays.includes(cell.dateStr) : false;
          const colPos = idx % 7; // 0=Sun, 6=Sat

          return (
            <button
              key={idx}
              disabled={!cell.currentMonth}
              onClick={() => cell.dateStr && onSelectDate(cell.dateStr)}
              className={`
                relative flex items-center justify-center h-8 w-8 mx-auto rounded-full text-[0.8rem] font-medium transition-colors
                ${!cell.currentMonth ? 'text-gray-300 cursor-default' : ''}
                ${cell.currentMonth && !isToday && !isSelected
                  ? colPos === 0 || colPos === 6
                    ? 'text-blue-500 hover:bg-gray-100 cursor-pointer'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  : ''}
                ${isToday && !isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                ${isSelected ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 font-bold' : ''}
              `}
            >
              <span>{cell.day}</span>
              {hasWorkHour && (
                <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday && !isSelected ? 'bg-white' : 'bg-gray-400'}`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
