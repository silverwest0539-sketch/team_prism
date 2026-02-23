import React, { useEffect, useState } from 'react';
import { TOAST_EVENT } from '../../utils/toast';

const MAX_TOASTS = 4;
const DEFAULT_TYPE = 'info';
const TOAST_TYPES = new Set(['info', 'success', 'error', 'warning']);

const ToastViewport = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const payload = event?.detail;
      const rawMessage = payload?.message;
      const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
      if (!message) return;

      const id = payload?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const type = TOAST_TYPES.has(payload?.type) ? payload.type : DEFAULT_TYPE;
      const duration = Number.isFinite(payload?.duration) ? payload.duration : 2600;

      setToasts((prev) => [...prev, { id, message, type }].slice(-MAX_TOASTS));

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, Math.max(800, duration));
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

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
