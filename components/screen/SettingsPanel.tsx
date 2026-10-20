'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { screen } from '@/content/copy';
import { useTheme } from '@/lib/hooks/useTheme';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';
import { ACCENTS, MIN_BRIGHTNESS, updateSettings, useScreenSettings, type Accent } from './settings';
// Display / Sound modules: kept beside the component (tokens and the panel shell stay in globals.css)
import './SettingsPanel.css';

const variants = {
  panel: { hidden: { opacity: 0, y: -6 }, visible: { opacity: 1, y: 0 } },
  reduced: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** The menu bar button that opened it: focus returns here, clicks on it don't count as "outside" */
  trigger: RefObject<HTMLButtonElement | null>;
  reducedMotion: boolean;
}

// Control Centre dropped from the menu bar: theme, accent, display brightness, volume
export function SettingsPanel({ open, onClose, trigger, reducedMotion }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const copy = screen.settings;
  const { theme, setTheme } = useTheme();
  const { accent, brightness, volume } = useScreenSettings();
  const dark = theme === 'dark';

  // Outside click and Esc close it. Esc is caught first (capture) and stopped so the
  // stage doesn't also zoom out on the same key press.
  useEffect(() => {
    if (!open) return;
    const close = () => {
      onClose();
      trigger.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || trigger.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      close();
    };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey, true);
    ref.current?.querySelector<HTMLElement>('button, input')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose, trigger]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          id="settings-panel"
          role="dialog"
          aria-label={copy.title}
          className="settings"
          variants={reducedMotion ? variants.reduced : variants.panel}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: reducedMotion ? 0.2 : 0.24, ease: EASE_OUT_SOFT }}
        >
          <div className="settings__row">
            <button
              type="button"
              className="settings__tile settings__toggle"
              aria-pressed={dark}
              onClick={() => setTheme(dark ? 'light' : 'dark')}
            >
              <span className="settings__icon" data-on={dark || undefined}>
                <MoonIcon />
              </span>
              <span className="settings__text">
                <span className="settings__label">{copy.darkMode}</span>
                <span className="settings__value">{dark ? copy.on : copy.off}</span>
              </span>
            </button>

            <fieldset className="settings__tile settings__accents">
              <legend className="settings__label">{copy.accent}</legend>
              <div className="settings__swatches">
                {(Object.keys(ACCENTS) as Accent[]).map((a) => (
                  <label key={a} className="settings__swatch" style={{ '--swatch': ACCENTS[a] } as CSSProperties}>
                    <input
                      type="radio"
                      name="accent"
                      value={a}
                      checked={accent === a}
                      onChange={() => updateSettings({ accent: a })}
                      aria-label={copy.accents[a]}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <Slider
            label={copy.display}
            min={MIN_BRIGHTNESS}
            value={brightness}
            onChange={(v) => updateSettings({ brightness: v })}
            start={<SunIcon size="small" />}
            end={<SunIcon size="large" />}
          />
          <Slider
            label={copy.sound}
            min={0}
            value={volume}
            onChange={(v) => updateSettings({ volume: v })}
            start={<SpeakerIcon waves={0} />}
            end={<SpeakerIcon waves={3} />}
            knob
            chevron
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SliderProps {
  label: string;
  min: number;
  value: number;
  onChange: (v: number) => void;
  start: React.ReactNode;
  end: React.ReactNode;
  /** Sound's white pill thumb; Display shows the fill only */
  knob?: boolean;
  /** Sound's "more" chevron (decorative) */
  chevron?: boolean;
}

// macOS Control Center module: titled glass card, thin track between a small and a large icon.
// The native range sits invisibly on top, so drag, keyboard and screen readers keep working.
function Slider({ label, min, value, onChange, start, end, knob = false, chevron = false }: SliderProps) {
  const frac = (value - min) / (1 - min);
  return (
    <div className="settings__module">
      <div className="settings__module-head">
        <span className="settings__module-title">{label}</span>
        {chevron && <ChevronIcon />}
      </div>
      <div className="settings__control">
        <span className="settings__end settings__end--start" aria-hidden="true">
          {start}
        </span>
        <div
          className="settings__bar"
          data-knob={knob || undefined}
          style={{ '--frac': frac.toFixed(4) } as CSSProperties}
        >
          {knob && <span className="settings__knob" aria-hidden="true" />}
          <input
            type="range"
            min={min}
            max={1}
            step={0.01}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={label}
            aria-valuetext={`${Math.round(frac * 100)}%`}
          />
        </div>
        <span className="settings__end settings__end--end" aria-hidden="true">
          {end}
        </span>
      </div>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1z" fill="currentColor" />
    </svg>
  );
}

function SunIcon({ size }: { size: 'small' | 'large' }) {
  // The small sun has short rays, the large one long rays, as at the two ends of the macOS slider
  const ray = size === 'small' ? [3.6, 4.6] : [2.2, 4.2];
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r={size === 'small' ? 3 : 3.6} fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="10"
          y1={ray[0]}
          x2="10"
          y2={ray[1]}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${a} 10 10)`}
        />
      ))}
    </svg>
  );
}

function SpeakerIcon({ waves }: { waves: 0 | 3 }) {
  return (
    <svg viewBox="0 0 24 20" aria-hidden="true">
      <path d="M2.5 7.2h3.2l4.6-3.8v13.2l-4.6-3.8H2.5z" fill="currentColor" />
      {waves > 0 && (
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M13.2 7.8a3 3 0 0 1 0 4.4" />
          <path d="M15.8 5.6a6.2 6.2 0 0 1 0 8.8" />
          <path d="M18.4 3.4a9.4 9.4 0 0 1 0 13.2" />
        </g>
      )}
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 10 16" className="settings__chevron" aria-hidden="true">
      <path d="M2.5 2.5 8 8l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
