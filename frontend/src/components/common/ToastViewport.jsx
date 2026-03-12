import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TOAST_EVENT } from '../../utils/toast';

const MAX_TOASTS = 4;
const DEFAULT_TYPE = 'info';
const TOAST_TYPES = new Set(['info', 'success', 'error', 'warning']);

const ToastViewport = () => {
  const [toasts, setToasts] = useState([]);
  const timeoutMapRef = useRef(new Map());

  const clearToastTimeout = useCallback((id) => {
    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    clearToastTimeout(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, [clearToastTimeout]);

  const scheduleAutoDismiss = useCallback((id, duration) => {
    clearToastTimeout(id);
    const timeoutId = window.setTimeout(() => {
      dismissToast(id);
    }, Math.max(800, duration));
    timeoutMapRef.current.set(id, timeoutId);
  }, [clearToastTimeout, dismissToast]);

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;

    const handleToast = (event) => {
      const payload = event?.detail;
      const rawMessage = payload?.message;
      const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
      if (!message) return;

      const id = payload?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const type = TOAST_TYPES.has(payload?.type) ? payload.type : DEFAULT_TYPE;
      const duration = Number.isFinite(payload?.duration) ? payload.duration : 2600;
      const dedupeKey = `${type}::${message}`;
      let targetId = id;
      let removedIds = [];

      setToasts((prev) => {
        const existing = prev.find((toast) => toast.dedupeKey === dedupeKey);
        if (existing) {
          targetId = existing.id;
          return prev.map((toast) => (
            toast.id === existing.id
              ? { ...toast, message, type, dedupeKey }
              : toast
          ));
        }

        const nextToast = { id, message, type, dedupeKey };
        const merged = [...prev, nextToast];
        const next = merged.slice(-MAX_TOASTS);
        removedIds = merged
          .filter((toast) => !next.some((nextToastItem) => nextToastItem.id === toast.id))
          .map((toast) => toast.id);
        return next;
      });

      removedIds.forEach((removedId) => clearToastTimeout(removedId));
      scheduleAutoDismiss(targetId, duration);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      timeoutMap.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutMap.clear();
    };
  }, [clearToastTimeout, scheduleAutoDismiss]);

  return (
    <div className="app-toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`app-toast app-toast--${toast.type}`}>
          <p className="app-toast__message">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="app-toast__close"
            aria-label="알림 닫기"
          >
            닫기
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastViewport;
