import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
  durationMs: number;
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastType, durationMs?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (text: string, type: ToastType = 'info', durationMs: number = 3200) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, text, type, durationMs };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          hideToast(id);
        }, durationMs);
      }
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: '380px',
        }}
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const typeColors = {
            success: {
              border: 'rgba(16, 185, 129, 0.4)',
              bg: 'rgba(16, 185, 129, 0.12)',
              text: '#34d399',
              icon: <CheckCircle2 size={17} color="#34d399" />,
            },
            warning: {
              border: 'rgba(245, 158, 11, 0.4)',
              bg: 'rgba(245, 158, 11, 0.12)',
              text: '#fbbf24',
              icon: <AlertTriangle size={17} color="#fbbf24" />,
            },
            error: {
              border: 'rgba(239, 68, 68, 0.4)',
              bg: 'rgba(239, 68, 68, 0.12)',
              text: '#f87171',
              icon: <AlertCircle size={17} color="#f87171" />,
            },
            info: {
              border: 'rgba(56, 189, 248, 0.4)',
              bg: 'rgba(56, 189, 248, 0.12)',
              text: 'var(--accent)',
              icon: <Info size={17} color="#38bdf8" />,
            },
          };

          const config = typeColors[toast.type] || typeColors.info;

          return (
            <div
              key={toast.id}
              className="animate-fade-in glass"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: `1px solid ${config.border}`,
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--text-main)',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
              role="status"
              aria-live="polite"
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {config.icon}
              </div>
              <div style={{ flex: 1, fontWeight: 500 }}>{toast.text}</div>
              <button
                onClick={() => hideToast(toast.id)}
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Dismiss"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
