const STORAGE_PREFIX = 'trend_scraps_fallback_by_user';

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeKeyword = (keyword = '') => String(keyword).trim();
const normalizeKeywordKey = (keyword = '') => normalizeKeyword(keyword).toLowerCase();

const getStorageKey = (email = '') => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return '';
  return `${STORAGE_PREFIX}:${normalizedEmail}`;
};

const readArray = (key) => {
  if (!key || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeArray = (key, value) => {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or private mode write failures.
  }
};

export const getAccountLocalScraps = (email) => {
  const key = getStorageKey(email);
  return readArray(key).map((item) => ({
    keyword: normalizeKeyword(item?.keyword || ''),
    rank: item?.rank || '-',
    type: item?.type || 'trend',
    desc: item?.desc || 'Local saved keyword',
    savedAt: item?.savedAt || new Date().toISOString(),
    isLocalFallback: true,
  })).filter((item) => item.keyword);
};

export const hasAccountLocalScrap = (email, keyword) => {
  const target = normalizeKeywordKey(keyword);
  if (!target) return false;
  return getAccountLocalScraps(email).some((item) => normalizeKeywordKey(item.keyword) === target);
};

export const upsertAccountLocalScrap = (email, keyword) => {
  const key = getStorageKey(email);
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!key || !normalizedKeyword) return;

  const rows = readArray(key);
  const targetKey = normalizeKeywordKey(normalizedKeyword);
  const withoutTarget = rows.filter((item) => normalizeKeywordKey(item?.keyword || '') !== targetKey);

  const next = [
    {
      keyword: normalizedKeyword,
      rank: '-',
      type: 'trend',
      desc: 'Local saved keyword',
      savedAt: new Date().toISOString(),
      isLocalFallback: true,
    },
    ...withoutTarget,
  ];
  writeArray(key, next);
};

export const removeAccountLocalScrap = (email, keyword) => {
  const key = getStorageKey(email);
  const targetKey = normalizeKeywordKey(keyword);
  if (!key || !targetKey) return;
  const rows = readArray(key);
  const next = rows.filter((item) => normalizeKeywordKey(item?.keyword || '') !== targetKey);
  writeArray(key, next);
};

export const mergeServerAndLocalScraps = (serverScraps = [], localScraps = []) => {
  const merged = [];
  const seen = new Set();

  (serverScraps || []).forEach((item) => {
    const keyword = normalizeKeyword(item?.keyword || '');
    if (!keyword) return;
    const key = normalizeKeywordKey(keyword);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({
      ...item,
      keyword,
      isLocalFallback: false,
    });
  });

  (localScraps || []).forEach((item) => {
    const keyword = normalizeKeyword(item?.keyword || '');
    if (!keyword) return;
    const key = normalizeKeywordKey(keyword);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({
      ...item,
      keyword,
      isLocalFallback: true,
    });
  });

  return merged;
};

