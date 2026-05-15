import { BASE_URL } from './api';

/**
 * Gọi API đăng nhập
 * @param {string} username
 * @param {string} password
 * @returns {{ accessToken, refreshToken }}
 */
export const loginApi = async (username, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Đăng nhập thất bại. Server trả về nội dung không hợp lệ.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập thất bại');
  }

  return {
    accessToken: data.accessToken || data.token,
    refreshToken: data.refreshToken || data.refresh_token,
    user: data.user || data.data?.user,
  };
};

/**
 * Làm mới access token bằng refresh token
 * @param {string} refreshToken
 * @returns {{ accessToken }}
 */
export const refreshTokenApi = async (refreshToken) => {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Không thể làm mới token. Server trả về nội dung không hợp lệ.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Không thể làm mới token');
  }

  return {
    accessToken: data.accessToken || data.token,
    refreshToken: data.refreshToken || data.refresh_token,
  };
};
