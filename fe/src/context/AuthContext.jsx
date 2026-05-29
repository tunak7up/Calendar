import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAccessToken, BASE_URL } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo từ server khi mount (sử dụng localStorage hoặc Refresh Token qua Cookie)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Thử khôi phục từ localStorage trước làm fallback
        const savedToken = localStorage.getItem('accessToken');
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
              localStorage.setItem('accessToken', data.token);
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

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAccessToken(data.token);
          setUser(data.user);
          localStorage.setItem('accessToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          setAccessToken(null);
          setUser(null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        }
      } catch (error) {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (data) => {
    setAccessToken(data.token);
    setUser(data.user);
    localStorage.setItem('accessToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (error) {
      console.error('Lỗi khi gọi API đăng xuất:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Chuyển hướng người dùng về trang đăng nhập
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'manager',
    isLoading,
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
