'use client';

import { useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const iconColors = {
    danger: 'text-error',
    warning: 'text-warning',
    info: 'text-primary',
  };

  const buttonColors = {
    danger: 'bg-error hover:bg-error/90',
    warning: 'bg-warning hover:bg-warning/90',
    info: 'bg-primary hover:bg-primary/90',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-2xl shadow-elevation-3 max-w-md w-full mx-4 p-6 animate-scale-in">
        {/* Icon */}
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          type === 'danger' ? 'bg-error/10' :
          type === 'warning' ? 'bg-warning/10' :
          'bg-primary/10'
        }`}>
          <Icon 
            name={type === 'danger' ? 'ExclamationTriangleIcon' : type === 'warning' ? 'ExclamationCircleIcon' : 'InformationCircleIcon'}
            className={`w-6 h-6 ${iconColors[type]}`}
            variant="solid"
          />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-text-primary text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p className="text-text-secondary text-center mb-6">
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-border text-text-primary hover:bg-muted transition-colors font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-lg text-white transition-colors font-medium ${buttonColors[type]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for easy usage
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
  });
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOptions(options);
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(true);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef?.(false);
  }, [resolveRef]);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      isOpen={isOpen}
      {...options}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogComponent };
}

export default ConfirmDialog;
