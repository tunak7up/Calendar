import React from 'react';
import { useTranslation } from 'react-i18next';
import MiniCalendar from '../../../../components/MiniCalendar';

export default function ScheduleSidebar({
  selectedDate,
  onSelectDate,
  workDays,
  viewDate,
  onViewChange,
}) {
  const { t } = useTranslation();

  return (
    <div className="lg:w-64 lg:shrink-0 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm lg:h-fit lg:sticky lg:top-[100px]">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 lg:mb-6">
        {t('myschedule.nav_view')}
      </h3>
      <div className="flex justify-center lg:block">
        <div className="w-full max-w-xs lg:max-w-none">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            workDays={workDays}
            viewDate={viewDate}
            onViewChange={onViewChange}
          />
        </div>
      </div>
    </div>
  );
}
