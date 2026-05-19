
export const BASE_URL = import.meta.env.VITE_API_URL;

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

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
  if (response.status === 401) {
    // Only try to refresh if it's not the refresh or login endpoint failing
    if (!endpoint.includes('/auth/refresh-token') && !endpoint.includes('/auth/login')) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.token;

          // Save new token in memory
          setAccessToken(newToken);
          
          // Retry original request
          headers['Authorization'] = `Bearer ${newToken}`;
          fetchOptions.headers = headers;
          
          response = await fetch(url, fetchOptions);
        } else {
          // Refresh token expired or invalid
          setAccessToken(null);
          window.location.href = '/login';
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
      } catch (refreshError) {
        setAccessToken(null);
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
