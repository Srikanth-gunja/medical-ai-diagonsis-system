'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastIcon = ({ type }: { type: Toast['type'] }) => {
  switch (type) {
    case 'success':
      return <Icon name="CheckCircleIcon" className="w-5 h-5 text-success" variant="solid" />;
    case 'error':
      return <Icon name="XCircleIcon" className="w-5 h-5 text-error" variant="solid" />;
    case 'warning':
      return (
        <Icon name="ExclamationTriangleIcon" className="w-5 h-5 text-warning" variant="solid" />
      );
    case 'info':
      return <Icon name="InformationCircleIcon" className="w-5 h-5 text-primary" variant="solid" />;
  }
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration, toast.id, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-elevation-3 border
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${toast.type === 'success' && 'bg-success/10 border-success/20'}
        ${toast.type === 'error' && 'bg-error/10 border-error/20'}
        ${toast.type === 'warning' && 'bg-warning/10 border-warning/20'}
        ${toast.type === 'info' && 'bg-primary/10 border-primary/20'}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        <h4
          className={`font-semibold text-sm ${toast.type === 'success' && 'text-success'} ${
            toast.type === 'error' && 'text-error'
          } ${toast.type === 'warning' && 'text-warning'} ${
            toast.type === 'info' && 'text-primary'
          }`}
        >
          {toast.title}
        </h4>
        {toast.message && <p className="text-text-secondary text-sm mt-1">{toast.message}</p>}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
      >
        <Icon name="XMarkIcon" className="w-4 h-4" />
      </button>
    </div>
  );
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={hideToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
