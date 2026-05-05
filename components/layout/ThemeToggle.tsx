'use client';

import { useTheme } from '@/lib/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink-primary transition-colors duration-300 hover:bg-bg-raised focus-visible:shadow-glow-signal"
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}

function Sun() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <line x1="8" y1="1" x2="8" y2="2.5" />
        <line x1="8" y1="13.5" x2="8" y2="15" />
        <line x1="1" y1="8" x2="2.5" y2="8" />
        <line x1="13.5" y1="8" x2="15" y2="8" />
        <line x1="3" y1="3" x2="4" y2="4" />
        <line x1="12" y1="12" x2="13" y2="13" />
        <line x1="3" y1="13" x2="4" y2="12" />
        <line x1="12" y1="4" x2="13" y2="3" />
      </g>
    </svg>
  );
}

function Moon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13 9.5A5.5 5.5 0 0 1 6.5 3a.5.5 0 0 0-.7-.5A6 6 0 1 0 13.5 10.2a.5.5 0 0 0-.5-.7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
