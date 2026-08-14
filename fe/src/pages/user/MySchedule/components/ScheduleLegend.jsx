import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ScheduleLegend({ regTheme, unschedTheme, absentTheme, upcomingTheme }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-x-6 gap-y-3 items-center">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {t('myschedule.legend_title') || 'Chú thích màu sắc'}:
      </h4>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            data-custom-component="Schedule-User-Registered"
            style={{ backgroundColor: regTheme.bg, borderColor: regTheme.bg }}
          ></div>
          <span className="text-xs font-semibold" style={{ color: regTheme.text }}>
            {t('myschedule.legend_scheduled')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            data-custom-component="Schedule-User-Unscheduled"
            style={{ backgroundColor: unschedTheme.bg, borderColor: unschedTheme.bg }}
          ></div>
          <span className="text-xs font-semibold" style={{ color: unschedTheme.text }}>
            {t('myschedule.legend_unscheduled')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            data-custom-component="Schedule-User-Absent"
            style={{ backgroundColor: absentTheme.bg, borderColor: absentTheme.bg }}
          ></div>
          <span className="text-xs font-semibold" style={{ color: absentTheme.text }}>
            {t('myschedule.legend_absent')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            data-custom-component="Schedule-User-Upcoming"
            style={{ backgroundColor: upcomingTheme.bg, borderColor: upcomingTheme.bg }}
          ></div>
          <span className="text-xs font-semibold" style={{ color: upcomingTheme.text }}>
            {t('myschedule.legend_upcoming')}
          </span>
        </div>
      </div>
    </div>
  );
}
