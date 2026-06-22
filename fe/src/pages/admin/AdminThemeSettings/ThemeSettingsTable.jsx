import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ThemeSettingsTable({
  t,
  activePage,
  activeTab,
  localTheme,
  onFieldChange,
  onResetComponent
}) {
  const filteredEntries = Object.entries(localTheme).filter(([key]) => {
    if (activePage === 'dashboard') {
      if (activeTab === 'charts') return key.includes('ChartColor-');
      if (activeTab === 'attendance') return key.includes('Attendance-');
    }
    if (activePage === 'schedule') {
      if (activeTab === 'schedule-admin') return key.includes('Schedule-Admin-');
      if (activeTab === 'schedule-user') return key.includes('Schedule-User-');
    }
    if (activePage === 'tasks') {
      if (activeTab === 'status') return key.includes('TaskStatus-');
      if (activeTab === 'priority') return key.includes('TaskPriority-');
    }
    return false;
  });

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[40%]">
                {t('themesettings.col_component')}
              </th>
              <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[20%]">
                {t('themesettings.col_bg')}
              </th>
              <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[20%]">
                {t('themesettings.col_text')}
              </th>
              <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-[20%]">
                {t('themesettings.col_action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEntries.map(([key, item]) => (
              <tr key={key} className="hover:bg-gray-50/20 transition-colors">
                {/* Name & Friendly Label input */}
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
                      {key.replace('[data-custom-component="', '').replace('"]', '')}
                    </span>
                    <input
                      type="text"
                      value={item.label}
                      disabled
                      className="w-full px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 font-bold text-xs cursor-not-allowed outline-none"
                    />
                  </div>
                </td>

                {/* Background Color Picker */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        item.bg && item.bg !== 'transparent' && item.bg.startsWith('#')
                          ? item.bg
                          : '#ffffff'
                      }
                      disabled={item.bg === 'transparent'}
                      onChange={(e) => onFieldChange(key, 'bg', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden p-0 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      value={item.bg}
                      onChange={(e) => onFieldChange(key, 'bg', e.target.value)}
                      className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-mono outline-none"
                    />
                  </div>
                </td>

                {/* Text Color Picker */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={item.text && item.text.startsWith('#') ? item.text : '#1f2937'}
                      onChange={(e) => onFieldChange(key, 'text', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => onFieldChange(key, 'text', e.target.value)}
                      className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-mono outline-none"
                    />
                  </div>
                </td>

                {/* Action Buttons */}
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => onResetComponent(key)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 shadow-sm border border-blue-100 hover:scale-105 active:scale-95"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    <span>{t('themesettings.btn_reset')}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
