'use client';

import { useEffect, useCallback } from 'react';

type KeyCombo = string;
type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutConfig {
  key: KeyCombo;
  handler: ShortcutHandler;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      shortcuts.forEach(({ key, handler }) => {
        const keys = key.toLowerCase().split('+');
        const mainKey = keys[keys.length - 1];

        const ctrlRequired = keys.includes('ctrl') || keys.includes('control');
        const altRequired = keys.includes('alt');
        const shiftRequired = keys.includes('shift');
        const metaRequired =
          keys.includes('meta') || keys.includes('cmd') || keys.includes('command');

        const ctrlMatch = ctrlRequired === e.ctrlKey;
        const altMatch = altRequired === e.altKey;
        const shiftMatch = shiftRequired === e.shiftKey;
        const metaMatch = metaRequired === e.metaKey;
        const keyMatch = e.key.toLowerCase() === mainKey;

        if (ctrlMatch && altMatch && shiftMatch && metaMatch && keyMatch) {
          e.preventDefault();
          handler(e);
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcuts for common actions
export function useDashboardShortcuts({
  onSearch,
  onNewAppointment,
  onProfile,
  onLogout,
  onRefresh,
}: {
  onSearch?: () => void;
  onNewAppointment?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  onRefresh?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [
    ...(onSearch ? [{ key: 'ctrl+k', handler: onSearch, description: 'Open search' }] : []),
    ...(onNewAppointment
      ? [{ key: 'ctrl+n', handler: onNewAppointment, description: 'New appointment' }]
      : []),
    ...(onProfile ? [{ key: 'ctrl+p', handler: onProfile, description: 'Go to profile' }] : []),
    ...(onLogout ? [{ key: 'ctrl+shift+q', handler: onLogout, description: 'Logout' }] : []),
    ...(onRefresh ? [{ key: 'ctrl+r', handler: onRefresh, description: 'Refresh data' }] : []),
  ];

  useKeyboardShortcuts(shortcuts);

  return { shortcuts };
}

export default useKeyboardShortcuts;
