import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

function hexToRGBA(hex, alpha = 1) {
  if (!hex || hex === 'transparent') return 'transparent';
  if (hex.startsWith('rgba')) return hex;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ThemeSettingsPreview({ t, activePage, activeTab, getVal }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-105 shadow-sm space-y-6">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
        <SparklesIcon className="w-5 h-5 text-amber-500" />
        <span>{t('themesettings.preview_title')}</span>
      </h3>

      {activePage === 'dashboard' && activeTab === 'charts' && (
        /* MOCK CHART PREVIEW */
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
            {t('themesettings.preview_chart')}
          </h4>
          <div className="border border-gray-250 bg-white rounded-2xl p-4 flex flex-col gap-4 shadow-sm items-center">
            {/* Mock Chart Legend */}
            <div className="flex gap-4 p-1.5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm w-full justify-center">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded shadow-sm border border-transparent"
                  style={{
                    backgroundColor: getVal('[data-custom-component="ChartColor-Registered"]', 'bg')
                  }}
                />
                <span className="text-[9px] font-bold text-gray-700">
                  {getVal('[data-custom-component="ChartColor-Registered"]', 'label').split(' - ')[1]}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded shadow-sm border border-transparent"
                  style={{
                    backgroundColor: getVal('[data-custom-component="ChartColor-Actual"]', 'bg')
                  }}
                />
                <span className="text-[9px] font-bold text-gray-700">
                  {getVal('[data-custom-component="ChartColor-Actual"]', 'label').split(' - ')[1]}
                </span>
              </div>
            </div>

            {/* Mock Chart Bars */}
            <div className="flex items-end gap-5 h-20 border-b border-l border-gray-200 w-fit px-6 pt-2">
              <div
                className="w-6 rounded-t shadow-sm transition-all"
                style={{
                  height: '60%',
                  backgroundColor: getVal('[data-custom-component="ChartColor-Registered"]', 'bg')
                }}
                title={getVal('[data-custom-component="ChartColor-Registered"]', 'label')}
              />
              <div
                className="w-6 rounded-t shadow-sm transition-all"
                style={{
                  height: '80%',
                  backgroundColor: getVal('[data-custom-component="ChartColor-Actual"]', 'bg')
                }}
                title={getVal('[data-custom-component="ChartColor-Actual"]', 'label')}
              />
            </div>
          </div>
        </div>
      )}

      {activePage === 'dashboard' && activeTab === 'attendance' && (
        /* MOCK ATTENDANCE STATUS PREVIEW */
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
            {t('themesettings.preview_attendance')}
          </h4>
          <div className="border border-gray-200 rounded-2xl p-4 bg-white flex flex-col gap-3 shadow-sm">
            {/* Mock Legend Row */}
            <div className="flex flex-wrap gap-2 text-[8px] font-bold text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100 shadow-inner justify-center">
              {['Attendance-Scheduled', 'Attendance-Unscheduled', 'Attendance-Absent'].map(
                (statusKey) => {
                  const key = `[data-custom-component="${statusKey}"]`;
                  const bg = getVal(key, 'bg');
                  const text = getVal(key, 'text');
                  const label = getVal(key, 'label');
                  const cleanLabel = label.split(' - ')[1] || label;
                  return (
                    <div key={statusKey} className="flex items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded border"
                        style={{ backgroundColor: bg, borderColor: bg }}
                      />
                      <span style={{ color: text }}>{cleanLabel}</span>
                    </div>
                  );
                }
              )}
            </div>

            {/* Mock Table Rows */}
            <div className="space-y-1">
              {[
                { name: 'tuna', statusKey: 'Attendance-Scheduled', time: '12:50 - --:--' },
                { name: 'datnguyen', statusKey: 'Attendance-Unscheduled', time: '09:15 - --:--' },
                { name: 'a Duc', statusKey: 'Attendance-Absent', time: '--:-- - --:--' }
              ].map((row) => {
                const key = `[data-custom-component="${row.statusKey}"]`;
                const bg = getVal(key, 'bg');
                const rowBg = hexToRGBA(bg, 0.15);
                return (
                  <div
                    key={row.name}
                    style={{ backgroundColor: rowBg }}
                    className="flex justify-between items-center px-4 py-2 rounded-xl border border-gray-100 text-[10.5px] font-bold text-gray-800 shadow-sm"
                  >
                    <span>{row.name}</span>
                    <span className="text-[9px] text-gray-400 font-mono font-medium">
                      {row.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activePage === 'schedule' && activeTab === 'schedule-admin' && (
        /* MOCK SCHEDULE ADMIN PREVIEW */
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
            {t('themesettings.preview_admin_calendar')}
          </h4>
          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col gap-3 shadow-sm">
            {/* Mock Registered Card */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 font-mono block">
                {t('themesettings.registered_label')}
              </span>
              <div
                style={{
                  backgroundColor: getVal('[data-custom-component="Schedule-Admin-Registered"]', 'bg'),
                  color: getVal('[data-custom-component="Schedule-Admin-Registered"]', 'text'),
                  borderColor: getVal('[data-custom-component="Schedule-Admin-Registered"]', 'bg')
                }}
                className="flex items-center gap-1.5 truncate px-2.5 py-1.5 rounded-lg text-[10px] font-bold border-l-4 w-full shadow-sm"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: getVal('[data-custom-component="Schedule-Admin-Registered"]', 'text')
                  }}
                />
                <span className="truncate">
                  {getVal('[data-custom-component="Schedule-Admin-Registered"]', 'label').split(' - ')[1] ||
                    getVal('[data-custom-component="Schedule-Admin-Registered"]', 'label')}
                  : 3 {t('themesettings.unit_people')}
                </span>
              </div>
            </div>

            {/* Mock Unscheduled Card */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 font-mono block">
                {t('themesettings.unscheduled_label')}
              </span>
              <div
                style={{
                  backgroundColor: getVal('[data-custom-component="Schedule-Admin-Unscheduled"]', 'bg'),
                  color: getVal('[data-custom-component="Schedule-Admin-Unscheduled"]', 'text'),
                  borderColor: getVal('[data-custom-component="Schedule-Admin-Unscheduled"]', 'bg')
                }}
                className="flex items-center gap-1.5 truncate px-2.5 py-1.5 rounded-lg text-[10px] font-bold border-l-4 w-full shadow-sm"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: getVal('[data-custom-component="Schedule-Admin-Unscheduled"]', 'text')
                  }}
                />
                <span className="truncate">
                  {getVal('[data-custom-component="Schedule-Admin-Unscheduled"]', 'label').split(' - ')[1] ||
                    getVal('[data-custom-component="Schedule-Admin-Unscheduled"]', 'label')}
                  : 1 {t('themesettings.unit_people')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePage === 'schedule' && activeTab === 'schedule-user' && (
        /* MOCK SCHEDULE USER PREVIEW */
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
            {t('themesettings.preview_user_calendar')}
          </h4>
          <div className="border border-gray-200 rounded-2xl p-4 bg-white flex flex-col gap-4 shadow-sm">
            {/* Mock Legend Bar */}
            <div className="flex flex-wrap gap-2 text-[8px] font-bold text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100 shadow-inner justify-center">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded border"
                  style={{
                    backgroundColor: getVal('[data-custom-component="Schedule-User-Registered"]', 'bg'),
                    borderColor: getVal('[data-custom-component="Schedule-User-Registered"]', 'bg')
                  }}
                />
                <span style={{ color: getVal('[data-custom-component="Schedule-User-Registered"]', 'text') }}>
                  {t('themesettings.legend_registered')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded border"
                  style={{
                    backgroundColor: getVal('[data-custom-component="Schedule-User-Unscheduled"]', 'bg'),
                    borderColor: getVal('[data-custom-component="Schedule-User-Unscheduled"]', 'bg')
                  }}
                />
                <span style={{ color: getVal('[data-custom-component="Schedule-User-Unscheduled"]', 'text') }}>
                  {t('themesettings.legend_unscheduled')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded border"
                  style={{
                    backgroundColor: getVal('[data-custom-component="Schedule-User-Absent"]', 'bg'),
                    borderColor: getVal('[data-custom-component="Schedule-User-Absent"]', 'bg')
                  }}
                />
                <span style={{ color: getVal('[data-custom-component="Schedule-User-Absent"]', 'text') }}>
                  {t('themesettings.legend_absent')}
                </span>
              </div>
            </div>

            {/* Mock Events rendering */}
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-gray-400 uppercase block font-mono">
                {t('themesettings.mock_calendar_day')}
              </span>
              <div
                style={{
                  backgroundColor: getVal('[data-custom-component="Schedule-User-Registered"]', 'bg'),
                  color: getVal('[data-custom-component="Schedule-User-Registered"]', 'text'),
                  borderColor: getVal('[data-custom-component="Schedule-User-Registered"]', 'bg')
                }}
                className="truncate px-2 py-1 rounded-md text-[9px] font-bold border-l-4 w-full"
              >
                08:30 - 12:00 [08:29 - 12:02]
              </div>
              <div
                style={{
                  backgroundColor: getVal('[data-custom-component="Schedule-User-Unscheduled"]', 'bg'),
                  color: getVal('[data-custom-component="Schedule-User-Unscheduled"]', 'text'),
                  borderColor: getVal('[data-custom-component="Schedule-User-Unscheduled"]', 'bg')
                }}
                className="truncate px-2 py-1 rounded-md text-[9px] font-bold border-l-4 w-full"
              >
                {t('themesettings.mock_unscheduled_label')}
              </div>
              <div
                style={{
                  backgroundColor: getVal('[data-custom-component="Schedule-User-Absent"]', 'bg'),
                  color: getVal('[data-custom-component="Schedule-User-Absent"]', 'text'),
                  borderColor: getVal('[data-custom-component="Schedule-User-Absent"]', 'bg')
                }}
                className="truncate px-2 py-1 rounded-md text-[9px] font-bold border-l-4 w-full"
              >
                {t('themesettings.mock_absent_label')}
              </div>
            </div>
          </div>
        </div>
      )}

      {activePage === 'tasks' && activeTab === 'status' && (
        /* MOCK TASKS STATUS PREVIEW */
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
            {t('themesettings.preview_task_status')}
          </h4>
          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col gap-2.5 shadow-sm">
            {[
              { key: '[data-custom-component="TaskStatus-Pending"]', labelKey: 'Pending' },
              { key: '[data-custom-component="TaskStatus-InProgress"]', labelKey: 'In Progress' },
              { key: '[data-custom-component="TaskStatus-Completed"]', labelKey: 'Completed' },
              { key: '[data-custom-component="TaskStatus-Overdue"]', labelKey: 'Overdue' }
            ].map((item) => {
              const bg = getVal(item.key, 'bg');
              const text = getVal(item.key, 'text');
              const label = getVal(item.key, 'label');
              const cleanLabel = label.includes(' - ') ? label.split(' - ')[1] : label;
              return (
                <div
                  key={item.key}
                  className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-150 shadow-sm px-4"
                >
                  <span className="text-[11px] font-bold text-gray-500 font-mono">{item.labelKey}</span>
                  <div
                    style={{ backgroundColor: bg, color: text, borderColor: bg }}
                    className="flex items-center gap-1.5 font-black uppercase tracking-widest rounded-full border px-3 py-1 text-[8.5px] shadow-sm pointer-events-none"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: text }} />
                    <span>{cleanLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activePage === 'tasks' && activeTab === 'priority' && (
        /* MOCK TASKS PRIORITIES PREVIEW */
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
            {t('themesettings.preview_task_priority')}
          </h4>
          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col gap-2.5 shadow-sm">
            {[
              { key: '[data-custom-component="TaskPriority-High"]', labelKey: 'High' },
              { key: '[data-custom-component="TaskPriority-Medium"]', labelKey: 'Medium' },
              { key: '[data-custom-component="TaskPriority-Low"]', labelKey: 'Low' }
            ].map((item) => {
              const bg = getVal(item.key, 'bg');
              const text = getVal(item.key, 'text');
              const label = getVal(item.key, 'label');
              const cleanLabel = label.includes(' - ') ? label.split(' - ')[1] : label;
              return (
                <div
                  key={item.key}
                  className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-150 shadow-sm px-4"
                >
                  <span className="text-[11px] font-bold text-gray-500 font-mono">{item.labelKey}</span>
                  <div
                    style={{ backgroundColor: bg, color: text, borderColor: bg }}
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm pointer-events-none"
                  >
                    <span>{cleanLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
