import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateRangeFilter({ startDate, endDate, onRangeChange }) {
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
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      const value = `${d.getFullYear()}-${d.getMonth()}`;
      options.push(<option key={value} value={value}>{label}</option>);
    }
    return options;
  };

  return (
    <div className="flex-shrink-0 bg-white rounded-2xl shadow-md border border-gray-300 p-4 flex items-center gap-4 overflow-x-auto w-full lg:w-auto">
      <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
        <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
        <select
          onChange={handleQuickMonthChange}
          className="bg-transparent border-none text-sm font-bold text-blue-600 outline-none cursor-pointer hover:text-blue-700 transition-colors"
          defaultValue=""
        >
          <option value="" disabled>Select Month</option>
          {getMonthOptions()}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onRangeChange(e.target.value, endDate)}
            className="bg-white border border-gray-300 shadow-sm rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onRangeChange(startDate, e.target.value)}
            className="bg-white border border-gray-300 shadow-sm rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
