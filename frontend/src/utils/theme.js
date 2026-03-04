const THEME_STORAGE_KEY = 'prism_theme';
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

export const THEMES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
});

export const normalizeTheme = (value) => (
  value === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT
);

export const getStoredTheme = () => {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  return normalizeTheme(raw);
};

export const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const normalized = normalizeTheme(theme);
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${normalized}`);
  root.setAttribute('data-theme', normalized);
};

export const saveTheme = (theme) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
};

const hasAuthenticatedSession = () => {
  if (typeof window === 'undefined') return false;

  const token = String(window.localStorage.getItem(TOKEN_STORAGE_KEY) || '').trim();
  if (!token) return false;

  try {
    const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!rawUser) return false;
    const parsed = JSON.parse(rawUser);
    return Boolean(parsed && typeof parsed.email === 'string' && parsed.email.trim());
  } catch {
    return false;
  }
};

export const resetThemeToLight = () => {
  applyTheme(THEMES.LIGHT);
  saveTheme(THEMES.LIGHT);
  return THEMES.LIGHT;
};

export const initializeTheme = () => {
  if (!hasAuthenticatedSession()) {
    return resetThemeToLight();
  }

  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
};

export const toggleTheme = (theme) => (
  normalizeTheme(theme) === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
);
