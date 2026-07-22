import { saveAuthRedirect } from "../utils/authRedirect";

export const BASE_URL = import.meta.env.VITE_API_URL;

let inMemoryToken = localStorage.getItem("token") || null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

export const getAccessToken = () => inMemoryToken;

let refreshPromise = null;

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.token);
          return data.token;
        } else {
          throw new Error("Refresh failed");
        }
      })
      .finally(() => {
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
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (inMemoryToken) {
    headers["Authorization"] = `Bearer ${inMemoryToken}`;
  }

  // Ensure cookies are always sent (for Refresh Token)
  const fetchOptions = {
    ...options,
    headers,
    credentials: "include",
  };

  let response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    if (
      !endpoint.includes("/auth/refresh-token") &&
      !endpoint.includes("/auth/login")
    ) {
      try {
        const newToken = await refreshAccessToken();
        headers["Authorization"] = `Bearer ${newToken}`;
        fetchOptions.headers = headers;
        response = await fetch(url, fetchOptions);
      } catch {
        setAccessToken(null);
        localStorage.removeItem("user");
        saveAuthRedirect(
          window.location.pathname +
            window.location.search +
            window.location.hash,
        );
        window.location.href = "/login";
        const sessionError = new Error(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        );
        sessionError.status = 401;
        throw sessionError;
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `API Error: ${response.status}`,
    );
    error.status = response.status; // giữ lại status để nơi gọi phân biệt được
    error.data = errorData; // giữ nguyên payload gốc nếu cần dùng thêm
    throw error;
  }

  return response.json();
};
