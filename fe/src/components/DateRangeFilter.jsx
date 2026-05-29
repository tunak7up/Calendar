import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function DateRangeFilter({ startDate, endDate, onRangeChange }) {
  const { t } = useTranslation();

  const monthsList = t('months_long', { returnObjects: true }) || [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
    <div className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 flex items-center gap-3 overflow-x-auto w-full lg:w-auto">
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.from')}</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onRangeChange(e.target.value, endDate)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.to')}</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onRangeChange(startDate, e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
