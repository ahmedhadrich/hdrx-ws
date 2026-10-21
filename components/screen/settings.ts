'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

// Screen settings from the menu bar's Control Center: accent colour, display
// brightness and volume. Plain module store so anything (the menu bar, the
// display, the music later) can read it without a provider.

export const ACCENTS = {
  signal: '#87bba2',
  shore: '#e8865a',
  bone: '#e9dfc8',
} as const;
export type Accent = keyof typeof ACCENTS;

export interface ScreenSettings {
  accent: Accent;
  /** 0.3 – 1; below 1 the display is dimmed */
  brightness: number;
  /** 0 – 1; stored for the soundtrack, which doesn't exist yet */
  volume: number;
  /** Room lighting follows the visitor's clock; off = the manual `hour` below */
  timeAuto: boolean;
  /** Manual time of day in hours, 0 – 24 (used when timeAuto is off) */
  hour: number;
  /** Which way the room faces, in degrees off its default (window facing due west). Swings the sun round the room */
  orientation: number;
}

// Also read by the pre-paint script in app/layout.tsx
export const SETTINGS_KEY = 'hdrx-settings';
export const MIN_BRIGHTNESS = 0.3;
// Past this the sun runs nearly parallel to the window wall and stops coming in
export const MAX_ORIENTATION = 45;

const DEFAULTS: ScreenSettings = {
  accent: 'signal',
  brightness: 1,
  volume: 0.6,
  timeAuto: true,
  hour: 17.5,
  orientation: 0,
};

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
        timeAuto: typeof saved.timeAuto === 'boolean' ? saved.timeAuto : DEFAULTS.timeAuto,
        hour: clamp(Number(saved.hour ?? DEFAULTS.hour), 0, 24),
        // Not clamp(): its fallback is the upper bound, and 0 (due west) is the sane default here
        orientation: Number.isFinite(Number(saved.orientation))
          ? Math.min(MAX_ORIENTATION, Math.max(-MAX_ORIENTATION, Number(saved.orientation)))
          : DEFAULTS.orientation,
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

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useScreenSettings(): ScreenSettings {
  return useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => DEFAULTS
  );
}

/** The visitor's local time as fractional hours, 0 – 24 */
export function localHour(d = new Date()) {
  return d.getHours() + d.getMinutes() / 60;
}

/**
 * Effective time of day for the room's lighting: the visitor's clock (re-read every
 * 30 s) when timeAuto is on, otherwise the manual hour. Server render returns the default.
 */
export function useHour(): number {
  const { timeAuto, hour } = useScreenSettings();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!timeAuto) return;
    setNow(localHour());
    const id = setInterval(() => setNow(localHour()), 30_000);
    return () => clearInterval(id);
  }, [timeAuto]);
  return timeAuto ? (now ?? DEFAULTS.hour) : hour;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/** Compass bearing the window faces for an orientation offset: 0 is due west, 270° */
export function windowBearing(orientation: number) {
  const deg = Math.round((((270 + orientation) % 360) + 360) % 360);
  return { deg, point: COMPASS[Math.round(deg / 22.5) % 16] };
}

/** "17:30" for a fractional hour */
export function formatHour(h: number) {
  const total = Math.round(h * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
