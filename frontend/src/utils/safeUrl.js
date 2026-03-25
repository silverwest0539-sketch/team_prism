const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

const getBaseOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost';
};

export const getSafeExternalUrl = (input) => {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, getBaseOrigin());
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
};
