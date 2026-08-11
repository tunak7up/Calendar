import { createContext, useContext, useState, useEffect } from 'react';
import { setAccessToken, BASE_URL } from '../services/api';
import { Capacitor } from '@capacitor/core';
import OneSignalNative from '@onesignal/capacitor-plugin';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem('user');
  });

  // Khởi tạo từ server khi mount (sử dụng localStorage hoặc Refresh Token qua Cookie)
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // 1. Thử khôi phục từ localStorage trước làm fallback
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setAccessToken(savedToken);
          setUser(JSON.parse(savedUser));
          setIsLoading(false);

          // Thử refresh token trong background để cập nhật token mới nếu có thể
          try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              setAccessToken(data.token);
              setUser(data.user);
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          } catch (bgError) {
            console.warn('Lỗi tự động làm mới trong background:', bgError);
          }
          return;
        }

        // 2. Nếu không có localStorage, thử lấy từ refresh token qua Cookie như cũ
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!isMounted) return;

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAccessToken(data.token);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          setAccessToken(null);
          setUser(null);
        }
      } catch {
        if (!isMounted) return;
        setAccessToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (data) => {
    setAccessToken(data.token);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    const onesignalId = localStorage.getItem('onesignal_id');

    // 1. OneSignal SDK Logout (Native & Web)
    try {
      if (Capacitor.isNativePlatform()) {
        await OneSignalNative.logout().catch(e => console.error('[OneSignal Native] Logout error:', e));
      } else if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal) {
          try {
            await OneSignal.logout();
          } catch (e) {
            console.error('[OneSignal Web] Logout error:', e);
          }
        });
      }
    } catch (e) {
      console.error('[OneSignal] Logout error:', e);
    }

    // 2. Call backend logout API to remove token and push subscription
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onesignal_id: onesignalId }),
        credentials: 'include'
      });
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Lỗi khi gọi API đăng xuất:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('onesignal_id');
      
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'manager',
    isLoading,
    isLoggingOut,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
