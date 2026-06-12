const REDIRECT_KEY = 'auth_redirect_after_login';

export const saveAuthRedirect = (path) => {
  if (!path || path === '/login' || path.startsWith('/login?')) {
    localStorage.removeItem(REDIRECT_KEY);
    return;
  }

  localStorage.setItem(REDIRECT_KEY, path);
};

export const getAuthRedirect = () => localStorage.getItem(REDIRECT_KEY);

export const clearAuthRedirect = () => {
  localStorage.removeItem(REDIRECT_KEY);
};

export const getDefaultRedirectPath = (user) => {
  return user?.role === 'manager' ? '/admin/dashboard' : '/dashboard';
};
