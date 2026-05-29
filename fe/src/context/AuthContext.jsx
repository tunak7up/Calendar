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

  // Khởi tạo từ server khi mount (sử dụng Refresh Token qua Cookie)
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
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
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        if (!isMounted) return;
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
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
    localStorage.setItem('user', JSON.stringify(data.user));
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
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setIsLoggingOut(false);
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
