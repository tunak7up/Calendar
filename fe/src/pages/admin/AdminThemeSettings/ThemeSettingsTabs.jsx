import React from 'react';

export default function ThemeSettingsTabs({ t, activePage, activeTab, setActiveTab }) {
  if (activePage === 'dashboard') {
    return (
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('charts')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'charts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('themesettings.tab_charts')}
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('themesettings.tab_attendance')}
        </button>
      </div>
    );
  }

  if (activePage === 'tasks') {
    return (
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('status')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'status'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('themesettings.tab_task_status')}
        </button>
        <button
          onClick={() => setActiveTab('priority')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'priority'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('themesettings.tab_task_priority')}
        </button>
      </div>
    );
  }

  if (activePage === 'schedule') {
    return (
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('schedule-admin')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'schedule-admin'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('themesettings.tab_schedule_admin')}
        </button>
        <button
          onClick={() => setActiveTab('schedule-user')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'schedule-user'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('themesettings.tab_schedule_user')}
        </button>
      </div>
    );
  }

  return null;
}
