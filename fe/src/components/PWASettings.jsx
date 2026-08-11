import React from 'react';
import { usePWA } from '../context/PWAContext';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon, BellIcon, CheckCircleIcon, XCircleIcon, CpuChipIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

export default function PWASettings() {
  const { t } = useTranslation();
  const {
    notificationPermission,
    requestNotificationPermission
  } = usePWA();

  const handleNotificationClick = async () => {
    await requestNotificationPermission();
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase tracking-wider">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            {t('pwa.notif_granted')}
          </div>
        );
      case 'denied':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs font-bold uppercase tracking-wider">
            <XCircleIcon className="w-4 h-4 text-red-600" />
            {t('pwa.notif_denied')}
          </div>
        );
      case 'default':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold uppercase tracking-wider">
            <BellIcon className="w-4 h-4 text-amber-600" />
            {t('pwa.notif_default')}
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-150 text-xs font-bold uppercase tracking-wider">
            {t('pwa.notif_unsupported')}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
          <CpuChipIcon className="w-6 h-6 text-blue-600" />
          {t('pwa.pwa_section_title')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('pwa.pwa_section_desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android APK Download Card */}
        <div className="bg-[#f8fafc] border border-gray-150 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DevicePhoneMobileIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold uppercase tracking-wide">
                  {t('pwa.apk_badge')}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">{t('pwa.apk_title')}</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {t('pwa.apk_desc')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <a
              href="/app-debug.apk"
              download="app-debug.apk"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer text-center"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {t('pwa.apk_btn')} (18.2 MB)
            </a>
          </div>
        </div>

        {/* Push Notification Permission Card */}
        <div className="bg-[#f8fafc] border border-gray-150 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <BellIcon className="w-6 h-6" />
              </div>
              <div>
                {getPermissionBadge()}
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">{t('pwa.notif_title')}</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {t('pwa.notif_desc')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            {notificationPermission === 'default' ? (
              <button
                onClick={handleNotificationClick}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer"
              >
                <BellIcon className="w-4 h-4" />
                {t('pwa.notif_btn')}
              </button>
            ) : notificationPermission === 'granted' ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 py-2.5 font-bold text-xs">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                {t('pwa.notif_granted')}
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="text-center text-xs text-red-500 font-bold py-2 px-3 bg-red-50 rounded-xl border border-red-100">
                {t('pwa.notif_denied')}
              </div>
            ) : (
              <div className="text-center text-xs text-gray-400 font-semibold py-2.5 italic">
                {t('pwa.notif_unsupported')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

