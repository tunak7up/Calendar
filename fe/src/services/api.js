export const BASE_URL = 'https://calendar-ny17.onrender.com/api';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  // Tự động gắn access token vào header
  const accessToken = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Nếu token hết hạn (401), thử refresh
  if (response.status === 401 && accessToken) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/login/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.data.accessToken;

          // Cập nhật token mới
          localStorage.setItem('accessToken', newToken);
          headers['Authorization'] = `Bearer ${newToken}`;

          // Retry request với token mới
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh token cũng hết hạn -> logout
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
};

export const checkTodayReportExists = async (personId) => {
  try {
    const response = await apiFetch(`/daily-report/person/${personId}/today`);
    return response;
  } catch (error) {
    console.error('Error checking today report:', error);
    return null;
  }
};
