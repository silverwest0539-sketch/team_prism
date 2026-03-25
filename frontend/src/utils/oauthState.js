const OAUTH_STATE_PREFIX = 'oauth_state:';
const OAUTH_STATE_TTL_MS = 5 * 60 * 1000;

const normalizeProvider = (provider) => String(provider || '').trim().toLowerCase();

const getStorageKey = (provider) => `${OAUTH_STATE_PREFIX}${normalizeProvider(provider)}`;

const createRandomState = () => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
};

export const createAndStoreOAuthState = (provider) => {
  if (typeof window === 'undefined') return '';

  const normalizedProvider = normalizeProvider(provider);
  if (!normalizedProvider) return '';

  const state = createRandomState();
  const payload = {
    value: state,
    createdAt: Date.now(),
  };

  window.sessionStorage.setItem(getStorageKey(normalizedProvider), JSON.stringify(payload));
  return state;
};

export const validateAndConsumeOAuthState = (provider, incomingState) => {
  if (typeof window === 'undefined') return false;

  const normalizedProvider = normalizeProvider(provider);
  const state = String(incomingState || '').trim();
  if (!normalizedProvider || !state) return false;

  const storageKey = getStorageKey(normalizedProvider);
  const rawStoredState = window.sessionStorage.getItem(storageKey);
  window.sessionStorage.removeItem(storageKey);

  if (!rawStoredState) return false;

  try {
    const parsed = JSON.parse(rawStoredState);
    const expectedState = String(parsed?.value || '').trim();
    const createdAt = Number(parsed?.createdAt || 0);
    const isExpired = !Number.isFinite(createdAt) || Date.now() - createdAt > OAUTH_STATE_TTL_MS;

    if (isExpired) return false;
    return expectedState === state;
  } catch {
    return rawStoredState === state;
  }
};
