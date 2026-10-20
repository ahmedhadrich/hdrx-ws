'use client';

import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { screen } from '@/content/copy';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { SettingsPanel } from './SettingsPanel';

// Same H as the backlit logo on the lid
export const H_PATH = 'M22 10h16v32h24V10h16v80H62V56H38v34H22z';

interface Props {
  variants: Variants;
  onContact: (trigger: HTMLElement) => void;
}

// macOS-style menu bar: H + Contact on the left, status items on the right.
// The notch sits in the gap between the two groups, like on the real machine.
export function MenuBar({ variants, onContact }: Props) {
  const time = useMenuClock();
  const battery = useBattery();
  const reducedMotion = useReducedMotion();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtn = useRef<HTMLButtonElement>(null);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <>
      <motion.div className="menubar__group" variants={variants} custom={0}>
        <svg viewBox="0 0 100 100" className="menubar__logo" aria-hidden="true">
          <path d={H_PATH} />
        </svg>
        {/* The brand stays the page heading for screen readers and SEO */}
        <h1 className="sr-only">{screen.brand}</h1>
        <button
          type="button"
          className="menubar__app menubar__btn menubar__item"
          onClick={(e) => onContact(e.currentTarget)}
        >
          {screen.contactLabel}
        </button>
      </motion.div>

      <motion.div className="menubar__group" variants={variants} custom={1}>
        <span className="menubar__item" role="img" aria-label={`${screen.batteryLabel} ${battery.level}%`}>
          <BatteryIcon level={battery.level} charging={battery.charging} />
        </span>
        <button
          ref={settingsBtn}
          type="button"
          className="menubar__item menubar__btn"
          onClick={() => setSettingsOpen((o) => !o)}
          aria-label={screen.settingsLabel}
          aria-expanded={settingsOpen}
          aria-controls="settings-panel"
        >
          <SettingsIcon />
        </button>
        <time className="menubar__time" dateTime={time.iso} suppressHydrationWarning>
          {time.label}
        </time>
      </motion.div>

      <SettingsPanel open={settingsOpen} onClose={closeSettings} trigger={settingsBtn} reducedMotion={reducedMotion} />
    </>
  );
}

function useMenuClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return { label: '', iso: '' };

  // "Tue 20 Oct 16:04", always in the studio's time zone
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: screen.location.timeZone,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    label: `${get('weekday')} ${get('day')} ${get('month')} ${get('hour')}:${get('minute')}`,
    iso: now.toISOString(),
  };
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

// Real battery where the Battery Status API exists (Chromium), a full charge elsewhere
function useBattery() {
  const [state, setState] = useState({ level: 100, charging: true });
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    if (!nav.getBattery) return;
    let bm: BatteryManager | null = null;
    const sync = () => bm && setState({ level: Math.round(bm.level * 100), charging: bm.charging });
    nav
      .getBattery()
      .then((b) => {
        bm = b;
        sync();
        b.addEventListener('levelchange', sync);
        b.addEventListener('chargingchange', sync);
      })
      .catch(() => {
        /* blocked by permissions policy: keep the full battery */
      });
    return () => {
      bm?.removeEventListener('levelchange', sync);
      bm?.removeEventListener('chargingchange', sync);
    };
  }, []);
  return state;
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  const fill = Math.max(1.5, (Math.min(level, 100) / 100) * 17);
  return (
    <svg viewBox="0 0 28 14" className="menubar__battery" aria-hidden="true">
      <rect x="0.75" y="0.75" width="22.5" height="12.5" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
      <rect x="2.75" y="2.75" width={fill} height="8.5" rx="1.8" fill="currentColor" />
      <path d="M25 4.8v4.4c0.9-0.3 1.5-1.2 1.5-2.2s-0.6-1.9-1.5-2.2z" fill="currentColor" fillOpacity="0.45" />
      {charging && (
        <path
          d="M12.6 2.2 8.4 7.6h3l-1 4.2 4.2-5.4h-3z"
          fill="currentColor"
          stroke="var(--menubar-bg-solid)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// Control Center glyph: two toggle switches
function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 16" className="menubar__glyph" aria-hidden="true">
      <rect x="1" y="1.5" width="18" height="5.5" rx="2.75" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15.75" cy="4.25" r="1.6" fill="currentColor" />
      <rect x="1" y="9" width="18" height="5.5" rx="2.75" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="4.25" cy="11.75" r="1.6" fill="currentColor" />
    </svg>
  );
}
