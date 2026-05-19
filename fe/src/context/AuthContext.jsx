import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAccessToken, BASE_URL } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo từ server khi mount (sử dụng Refresh Token qua Cookie)
  useEffect(() => {
    const initializeAuth = async () => {
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
        } else {
          setAccessToken(null);
          setUser(null);
        }
      } catch (error) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (data) => {
    setAccessToken(data.token);
    setUser(data.user);
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
