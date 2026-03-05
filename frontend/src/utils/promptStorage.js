const STORAGE_PREFIX = 'saved_prompts_by_user';
const MAX_SAVED_PROMPTS = 60;

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeText = (value = '') => String(value || '').trim();
const normalizePromptSignature = (prompt = '') =>
  normalizeText(prompt).replace(/\s+/g, ' ').toLowerCase();

const getStorageKey = (email = '') => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return '';
  return `${STORAGE_PREFIX}:${normalizedEmail}`;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readRows = (key) => {
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

const writeRows = (key, rows = []) => {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    // Ignore localStorage write failures.
  }
};

const normalizeSavedPrompt = (item = {}) => {
  const prompt = normalizeText(item?.prompt || item?.content || '');
  if (!prompt) return null;

  const savedAt = item?.savedAt || new Date().toISOString();
  const normalized = {
    id: normalizeText(item?.id) || createId(),
    prompt,
    keyword: normalizeText(item?.keyword || ''),
    templateKey: normalizeText(item?.templateKey || ''),
    templateName: normalizeText(item?.templateName || ''),
    type: normalizeText(item?.type || ''),
    industry: normalizeText(item?.industry || ''),
    savedAt,
    updatedAt: item?.updatedAt || savedAt,
  };

  normalized.signature =
    normalizeText(item?.signature) || normalizePromptSignature(normalized.prompt);
  return normalized;
};

export const getAccountSavedPrompts = (email) => {
  const key = getStorageKey(email);
  const rows = readRows(key)
    .map(normalizeSavedPrompt)
    .filter(Boolean)
    .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));

  return rows;
};

export const upsertAccountSavedPrompt = (email, payload = {}) => {
  const key = getStorageKey(email);
  if (!key) return { ok: false, reason: 'missing_email' };

  const prompt = normalizeText(payload?.prompt || payload?.content || '');
  if (!prompt) return { ok: false, reason: 'missing_prompt' };

  const signature = normalizePromptSignature(prompt);
  const rows = getAccountSavedPrompts(email);
  const existing = rows.find((item) => item.signature === signature);
  const now = new Date().toISOString();

  const nextItem = normalizeSavedPrompt({
    id: existing?.id || createId(),
    prompt,
    keyword: payload?.keyword,
    templateKey: payload?.templateKey,
    templateName: payload?.templateName,
    type: payload?.type,
    industry: payload?.industry,
    savedAt: existing?.savedAt || now,
    updatedAt: now,
    signature,
  });

  const nextRows = [
    nextItem,
    ...rows.filter((item) => item.id !== existing?.id),
  ].slice(0, MAX_SAVED_PROMPTS);

  writeRows(key, nextRows);
  return { ok: true, duplicated: Boolean(existing), item: nextItem };
};

export const removeAccountSavedPrompt = (email, id) => {
  const key = getStorageKey(email);
  const targetId = normalizeText(id);
  if (!key || !targetId) return;

  const rows = getAccountSavedPrompts(email);
  const nextRows = rows.filter((item) => item.id !== targetId);
  writeRows(key, nextRows);
};
