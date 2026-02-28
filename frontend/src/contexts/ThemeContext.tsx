'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (nextTheme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'medicare-theme';

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isReady, setIsReady] = useState(false);
  const transitionTimeout = useRef<number | null>(null);
  const hasAppliedTheme = useRef(false);

  // Sync React state with localStorage on mount (inline script in layout.tsx prevents visual flash)
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme = storedTheme ?? getSystemTheme();
    setThemeState(initialTheme);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !isReady) return;
    const root = document.documentElement;

    // Clear any pending transition timeout to prevent stacking on rapid toggles
    if (transitionTimeout.current !== null) {
      window.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }

    // Skip transition on first theme application after hydration
    if (hasAppliedTheme.current) {
      root.classList.add('theme-transition');
    } else {
      root.classList.remove('theme-transition');
    }

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (window.localStorage.getItem(THEME_STORAGE_KEY) !== theme) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    if (hasAppliedTheme.current) {
      transitionTimeout.current = window.setTimeout(() => {
        root.classList.remove('theme-transition');
        transitionTimeout.current = null;
      }, 250);
    }

    hasAppliedTheme.current = true;

    return () => {
      if (transitionTimeout.current !== null) {
        window.clearTimeout(transitionTimeout.current);
        transitionTimeout.current = null;
      }
    };
  }, [theme, isReady]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
