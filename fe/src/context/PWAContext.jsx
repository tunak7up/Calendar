import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import OneSignalNative from '@onesignal/capacitor-plugin';

const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Check if already installed or running on native mobile app
    const checkStandAlone = () => {
      const isStandalone = 
        Capacitor.isNativePlatform() ||
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator && window.navigator.standalone) ||
        document.referrer.includes('android-app://');
      setIsInstalled(!!isStandalone);
    };

    checkStandAlone();
    
    // Check notification permission
    const checkPermission = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const hasPerm = await OneSignalNative.Notifications.hasPermission();
          setNotificationPermission(hasPerm ? 'granted' : 'default');
        } catch (e) {
          console.error('[PWA] Error checking native notification permission:', e);
        }
      } else if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    checkPermission();

    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event fired');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] App was successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Watch for permission changes (supported in Chromium browsers)
    let permissionStatus = null;
    if (!Capacitor.isNativePlatform() && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' })
        .then((status) => {
          permissionStatus = status;
          const handlePermissionChange = () => {
            setNotificationPermission(Notification.permission);
          };
          status.addEventListener('change', handlePermissionChange);
        })
        .catch(err => console.log('[PWA] Navigator permissions query not fully supported:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', () => {});
      }
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available for installation');
      return false;
    }
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to the install prompt: ${outcome}`);
    
    // Clear deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
    
    return outcome === 'accepted';
  };

  const requestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await OneSignalNative.Notifications.requestPermission(true);
        const hasPerm = await OneSignalNative.Notifications.hasPermission();
        const status = hasPerm ? 'granted' : 'denied';
        setNotificationPermission(status);
        return status;
      } catch (error) {
        console.error('[PWA] Native permission request error:', error);
        return 'error';
      }
    }

    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported by this browser');
      return 'unsupported';
    }

    try {
      let permission = 'default';
      
      // If OneSignal is initialized, we should try using it to request permission
      if (window.OneSignalDeferred) {
        await new Promise((resolve) => {
          window.OneSignalDeferred.push(async function(OneSignal) {
            try {
              await OneSignal.Notifications.requestPermission();
              permission = Notification.permission;
            } catch (err) {
              console.error('[PWA] OneSignal permission request error:', err);
              permission = await Notification.requestPermission();
            }
            resolve();
          });
        });
      } else {
        permission = await Notification.requestPermission();
      }

      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error('[PWA] Error requesting notification permission:', error);
      return 'error';
    }
  };

  const value = {
    isInstallable,
    isInstalled,
    notificationPermission,
    installApp,
    requestNotificationPermission
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

export default PWAContext;
