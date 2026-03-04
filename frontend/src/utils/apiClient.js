import axios from 'axios';
import { resetThemeToLight } from './theme';

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

const normalizeBaseURL = (raw) => {
  if (typeof raw !== 'string') return DEFAULT_API_BASE_URL;
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_API_BASE_URL;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const baseURL = normalizeBaseURL(import.meta.env.VITE_API_BASE_URL);

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 — localStorage에 토큰이 있으면 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 토큰 제거 및 로그인 리다이렉트
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      resetThemeToLight();

      // 이미 로그인 페이지가 아닐 때만 리다이렉트
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const toApiUrl = (path = '') => {
  if (typeof path !== 'string' || !path) return baseURL;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? `${baseURL}${path}` : `${baseURL}/${path}`;
};

export default apiClient;
