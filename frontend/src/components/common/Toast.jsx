import { useEffect, useState, useCallback } from 'react';

let toastId = 0;
const listeners = new Set();

export function showToast(message, type = 'success', duration = 3500) {
  const id = ++toastId;
  listeners.forEach((fn) => fn({ id, message, type, duration }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span style={{ flexShrink: 0 }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
