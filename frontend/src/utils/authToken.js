const TOKEN_STORAGE_KEY = 'token';

const hasControlCharacter = (value) => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) return true;
  }

  return false;
};

const normalizeToken = (rawToken) => {
  if (typeof rawToken !== 'string') return '';
  const token = rawToken.trim();
  if (!token) return '';
  if (hasControlCharacter(token)) return '';
  return token;
};

export const getStoredToken = () => {
  if (typeof window === 'undefined') return '';
  return normalizeToken(window.sessionStorage.getItem(TOKEN_STORAGE_KEY));
};

export const setStoredToken = (token) => {
  if (typeof window === 'undefined') return false;
  const normalizedToken = normalizeToken(String(token ?? ''));
  if (!normalizedToken) {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return false;
  }

  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, normalizedToken);
  return true;
};

export const clearStoredToken = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const getAuthorizationHeader = () => {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};
