import { BASE_URL } from './api';

/**
 * Gọi API đăng nhập
 * @param {string} username
 * @param {string} password
 * @returns {{ token, user }}
 */
export const loginApi = async (username, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: allows receiving Set-Cookie
    body: JSON.stringify({ username, password, device_info: navigator.userAgent }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Đăng nhập thất bại. Server trả về nội dung không hợp lệ.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập thất bại');
  }

  return {
    token: data.token,
    user: data.user,
  };
};
