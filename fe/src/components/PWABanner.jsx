import React, { useState, useEffect } from 'react';
import { usePWA } from '../context/PWAContext';
import { useTranslation } from 'react-i18next';
import { BellIcon, ArrowDownTrayIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function PWABanner() {
  const { t } = useTranslation();
  const {
    isInstallable,
    isInstalled,
    notificationPermission,
    installApp,
    requestNotificationPermission
  } = usePWA();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show banner if not already dismissed in this browser session/permanently
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    
    // Check if we need to show the banner
    // Need installation OR notification permission
    const needsInstall = isInstallable && !isInstalled;
    const needsNotifications = notificationPermission === 'default';

    if (!dismissed && (needsInstall || needsNotifications)) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isInstallable, isInstalled, notificationPermission]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      handleDismiss();
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      // If we also don't need installation, dismiss it
      if (!isInstallable || isInstalled) {
        handleDismiss();
      }
    }
  };

  if (!visible) return null;

  const showInstallBtn = isInstallable && !isInstalled;
  const showNotifBtn = notificationPermission === 'default';

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-indigo-500/25 border border-indigo-500/20 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400 rounded-full blur-3xl opacity-30 -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400 rounded-full blur-2xl opacity-20 -ml-10 -mb-10" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pr-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-yellow-300 border border-white/10 shrink-0">
            <SparklesIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              {t('pwa.install_title')} & {t('pwa.notif_title')}
            </h4>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
              {t('pwa.banner_text')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mt-2 md:mt-0 shrink-0">
          {showInstallBtn && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-white hover:bg-sky-50 text-indigo-700 py-2 px-4 rounded-xl text-xs font-black shadow-md shadow-black/10 hover:shadow-black/15 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {t('pwa.banner_install')}
            </button>
          )}

          {showNotifBtn && (
            <button
              onClick={handleEnableNotifications}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/50 py-2 px-4 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <BellIcon className="w-4 h-4" />
              {t('pwa.banner_notif')}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {t('pwa.banner_later')}
          </button>
        </div>
      </div>

      {/* Absolute Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 text-white/60 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer"
        aria-label="Close banner"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
