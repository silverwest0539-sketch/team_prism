import axios from 'axios';
import { resetThemeToLight } from './theme';
import { clearStoredToken, getStoredToken } from './authToken';

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const RETRYABLE_METHODS = new Set(['get']);
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRY_COUNT = 2;
const RETRY_BASE_DELAY_MS = 350;

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

const sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

const shouldRetryRequest = (error) => {
  const requestConfig = error?.config;
  if (!requestConfig || requestConfig.disableRetry) return false;

  const method = String(requestConfig.method || 'get').toLowerCase();
  if (!RETRYABLE_METHODS.has(method)) return false;

  const retryCount = Number(requestConfig.__retryCount || 0);
  if (retryCount >= MAX_RETRY_COUNT) return false;

  if (error?.code === 'ERR_CANCELED') return false;

  const status = Number(error?.response?.status);
  if (Number.isFinite(status)) {
    return RETRYABLE_STATUS_CODES.has(status);
  }

  return error?.code === 'ECONNABORTED' || !error?.response;
};

// 요청 인터셉터 — sessionStorage에 토큰이 있으면 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 토큰 제거 및 로그인 리다이렉트
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (shouldRetryRequest(error)) {
      const requestConfig = error.config;
      requestConfig.__retryCount = Number(requestConfig.__retryCount || 0) + 1;
      const delayMs = RETRY_BASE_DELAY_MS * (2 ** (requestConfig.__retryCount - 1));
      await sleep(delayMs);
      return apiClient.request(requestConfig);
    }

    if (error.response?.status === 401) {
      clearStoredToken();
      window.sessionStorage.removeItem('user');
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
