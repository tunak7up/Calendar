
export const BASE_URL = import.meta.env.VITE_API_URL;

let inMemoryToken = localStorage.getItem('token') || null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAccessToken = () => inMemoryToken;

let refreshPromise = null;

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.token);
        return data.token;
      } else {
        throw new Error('Refresh failed');
      }
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    ...options.headers,
  };
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  // Ensure cookies are always sent (for Refresh Token)
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' 
  };

  let response = await fetch(url, fetchOptions);

  // Auto-refresh logic when token is expired or unauthorized
  if (response.status === 401 || response.status === 403) {
    // Only try to refresh if it's not the refresh or login endpoint failing
    if (!endpoint.includes('/auth/refresh-token') && !endpoint.includes('/auth/login')) {
      try {
        const newToken = await refreshAccessToken();
        // Retry original request
        headers['Authorization'] = `Bearer ${newToken}`;
        fetchOptions.headers = headers;
        response = await fetch(url, fetchOptions);
      } catch (refreshError) {
        setAccessToken(null);
        localStorage.removeItem('user'); // Đảm bảo xóa sạch thông tin user
        window.location.href = '/login';
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
};
