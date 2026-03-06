const STORAGE_KEY = 'preferred_community_by_user';

const normalize = (value) => String(value || '').trim();

const readMap = () => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeMap = (map) => {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
};

export const getAccountPreferredCommunity = (email = '') => {
  const accountKey = normalize(email).toLowerCase();
  if (!accountKey) return '';

  const storageMap = readMap();
  return normalize(storageMap[accountKey]);
};

export const setAccountPreferredCommunity = (email = '', platform = '') => {
  const accountKey = normalize(email).toLowerCase();
  const normalizedPlatform = normalize(platform);

  if (!accountKey || !normalizedPlatform) return false;

  const storageMap = readMap();
  storageMap[accountKey] = normalizedPlatform;
  return writeMap(storageMap);
};
