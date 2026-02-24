import axios from 'axios';

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

export const toApiUrl = (path = '') => {
  if (typeof path !== 'string' || !path) return baseURL;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? `${baseURL}${path}` : `${baseURL}/${path}`;
};

export default apiClient;
