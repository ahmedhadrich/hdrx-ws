'use client';

import { useSyncExternalStore } from 'react';

// Screen settings from the menu bar's Control Center: accent colour, display
// brightness and volume. Plain module store so anything (the menu bar, the
// display, the music later) can read it without a provider.

export const ACCENTS = {
  signal: '#ff5a1f',
  shore: '#7ac2c9',
  bone: '#e9dfc8',
} as const;
export type Accent = keyof typeof ACCENTS;

export interface ScreenSettings {
  accent: Accent;
  /** 0.3 – 1; below 1 the display is dimmed */
  brightness: number;
  /** 0 – 1; read by the soundtrack once it exists (getVolume / subscribe) */
  volume: number;
}

// Also read by the pre-paint script in app/layout.tsx
export const SETTINGS_KEY = 'hdrx-settings';
export const MIN_BRIGHTNESS = 0.3;

const DEFAULTS: ScreenSettings = { accent: 'signal', brightness: 1, volume: 0.6 };

let state: ScreenSettings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (saved && typeof saved === 'object') {
      state = {
        accent: saved.accent in ACCENTS ? saved.accent : DEFAULTS.accent,
        brightness: clamp(Number(saved.brightness ?? DEFAULTS.brightness), MIN_BRIGHTNESS, 1),
        volume: clamp(Number(saved.volume ?? DEFAULTS.volume), 0, 1),
      };
    }
  } catch {
    /* storage blocked or corrupt: defaults */
  }
  apply();
}

function clamp(n: number, lo: number, hi: number) {
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : hi;
}

function apply() {
  const root = document.documentElement.style;
  root.setProperty('--accent-signal', ACCENTS[state.accent]);
  // Dimming layer opacity over the display (see .mbp__display::after)
  root.setProperty('--screen-dim', ((1 - state.brightness) * 0.85).toFixed(3));
}

export function updateSettings(patch: Partial<ScreenSettings>) {
  load();
  state = { ...state, ...patch };
  apply();
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: still applies for this visit */
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVolume() {
  load();
  return state.volume;
}

export function useScreenSettings(): ScreenSettings {
  return useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => DEFAULTS
  );
}
