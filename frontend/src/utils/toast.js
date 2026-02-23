const TOAST_EVENT_NAME = 'app:toast';

export const TOAST_EVENT = TOAST_EVENT_NAME;

export function showToast(message, options = {}) {
  if (typeof window === 'undefined') return;

  const detail = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: typeof message === 'string' ? message : String(message ?? ''),
    type: options.type || 'info',
    duration: Number.isFinite(options.duration) ? options.duration : 2600,
  };

  window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail }));
}
