import React from 'react';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function ThemeSettingsHeader({ t, saveStatus, onResetAll, onSave }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span>{t('themesettings.title')}</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          {t('themesettings.subtitle')}
        </p>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <button
          onClick={onResetAll}
          className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-50 bg-white text-gray-700 rounded-xl text-sm font-bold shadow-sm transition-all flex-1 md:flex-initial"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>{t('themesettings.btn_reset_all')}</span>
        </button>
        <button
          onClick={onSave}
          disabled={saveStatus.type === 'loading'}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-initial"
        >
          {saveStatus.type === 'loading' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <CheckIcon className="w-5 h-5" />
          )}
          <span>{t('themesettings.btn_save')}</span>
        </button>
      </div>
    </div>
  );
}
