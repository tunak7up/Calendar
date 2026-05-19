import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo từ localStorage khi mount
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedRefresh = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      let isExpired = false;
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          isExpired = true;
        }
      } catch (e) {
        isExpired = true;
      }

      if (isExpired) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        setAccessToken(savedToken);
        setRefreshToken(savedRefresh);
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.clear();
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data) => {
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    // Decode user info từ JWT payload
    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
    const userData = {
      person_id: payload.person_id,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
    setUser(userData);

    // Lưu vào localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const updateAccessToken = (newToken) => {
    setAccessToken(newToken);
    localStorage.setItem('accessToken', newToken);
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'manager',
    isLoading,
    login,
    logout,
    updateAccessToken,
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
