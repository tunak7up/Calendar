import { BASE_URL } from './api';

/**
 * Gọi API đăng nhập
 * @param {string} username
 * @param {string} password
 * @returns {{ accessToken, refreshToken }}
 */
export const loginApi = async (username, password) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Đăng nhập thất bại');
  }

  return data.data; // { accessToken, refreshToken }
};

/**
 * Làm mới access token bằng refresh token
 * @param {string} refreshToken
 * @returns {{ accessToken }}
 */
export const refreshTokenApi = async (refreshToken) => {
  const response = await fetch(`${BASE_URL}/login/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Không thể làm mới token');
  }

  return data.data; // { accessToken }
};
