import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { loginApi } from '../../../../services/authService';
import { BASE_URL } from '../../../../services/api';
import { clearAuthRedirect, getAuthRedirect, getDefaultRedirectPath } from '../../../../utils/authRedirect';

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = payload.exp;
    if (!exp) return false;
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export function useLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [savePassword, setSavePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');
  const { login, isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'session_expired') {
      setError(t('login.session_expired', { defaultValue: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }));
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsChecking(false);
      return;
    }

    const checkAuthStatus = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && isTokenValid(savedToken) && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          if (!isLoggedIn) {
            login({ token: savedToken, user: parsedUser });
          }
          if (onLogin) {
            onLogin({ token: savedToken, user: parsedUser });
          } else {
            const redirectTo = getAuthRedirect() || getDefaultRedirectPath(parsedUser);
            clearAuthRedirect();
            navigate(redirectTo);
          }
          return;
        } catch {
          console.error('Lỗi phân tích thông tin user');
        }
      }

      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          login(data);
          if (onLogin) {
            onLogin(data);
          } else {
            const redirectTo = getAuthRedirect() || getDefaultRedirectPath(data.user);
            clearAuthRedirect();
            navigate(redirectTo);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Lỗi khi gọi refresh token:', err);
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, [location, t, isLoggedIn, login, navigate, onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await loginApi(username, password);
      login(data);

      if (onLogin) {
        onLogin(data);
      } else {
        const redirectTo = getAuthRedirect() || getDefaultRedirectPath(data.user);
        clearAuthRedirect();
        navigate(redirectTo);
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('Sai tên đăng nhập') || !errMsg) {
        setError('auth_error');
      } else {
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    t,
    username,
    setUsername,
    password,
    setPassword,
    savePassword,
    setSavePassword,
    showPassword,
    setShowPassword,
    isLoading,
    isChecking,
    error,
    handleSubmit
  };
}
