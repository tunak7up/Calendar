import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAccessToken, BASE_URL } from '../services/api';

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
      } catch (error) {
        if (!isMounted) return;
        setAccessToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (!localStorage.getItem('user')) {
      initializeAuth();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (data) => {
    setAccessToken(data.token);
    setUser(data.user);
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      // Thêm chút thời gian chờ để user kịp nhìn thấy hiệu ứng loading
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error('Lỗi khi gọi API đăng xuất:', error);
    } finally {
      // Chỉ xóa state SAU KHI api đăng xuất hoàn thành
      setUser(null);
      setAccessToken(null);
      
      // Chuyển hướng người dùng về trang đăng nhập
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
