'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MOBILE_QUERY } from '@/lib/utils/device';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Also read by the pre-paint script in app/layout.tsx
export const THEME_KEY = 'hdrx-theme';

// Desktop: light is the house default (light screen in a dark room); dark is an explicit
// choice from the screen's settings panel and is remembered.
// Phones and tablets: follow the device's light / dark setting, live.
export function ThemeProvider({ children }: { children: ReactNode }) {
  // null until the client has decided, so the pre-paint theme isn't overwritten with 'light'
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      if (mobile.matches) {
        setThemeState(dark.matches ? 'dark' : 'light');
        return;
      }
      try {
        setThemeState(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
      } catch {
        setThemeState('light'); /* storage blocked */
      }
    };
    sync();
    mobile.addEventListener('change', sync);
    dark.addEventListener('change', sync);
    return () => {
      mobile.removeEventListener('change', sync);
      dark.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const resolved = theme ?? 'light';
  const toggle = useCallback(() => setTheme(resolved === 'dark' ? 'light' : 'dark'), [resolved, setTheme]);

  const value = useMemo(() => ({ theme: resolved, toggle, setTheme }), [resolved, toggle, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
