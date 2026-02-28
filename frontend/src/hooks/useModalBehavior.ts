'use client';

import { useEffect, useRef } from 'react';

/**
 * Shared hook for custom modals (non-Headless UI).
 * Provides:
 *  1. Body scroll lock when modal is open
 *  2. Escape key handler to close modal
 *
 * Headless UI <Dialog> modals already handle these natively — this hook
 * is only for the hand-rolled `fixed inset-0` modal pattern.
 */
export function useModalBehavior(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
}
