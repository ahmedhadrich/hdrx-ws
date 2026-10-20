'use client';

import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { screen } from '@/content/copy';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';
import { formatHour, localHour, updateSettings, useHour, useScreenSettings } from './settings';
import './TimeControl.css';

// Hand-tuned states of the room's TimeOfDay keyframes (RoomScene); in between is interpolated.
// Dawn sits at 6:30 (keyframe 6.4) because the slider moves in 15-min steps.
const TIME_PRESETS = [
  { id: 'dawn', hour: 6.5 },
  { id: 'morning', hour: 9 },
  { id: 'noon', hour: 13 },
  { id: 'golden', hour: 17.5 },
  { id: 'dusk', hour: 19.5 },
  { id: 'night', hour: 22 },
] as const;

const variants = {
  bar: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
  reduced: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

// Room lighting control, in the room under the plinth (zoomed-out view only), not on the laptop.
// Follows the visitor's clock until they drag the slider or pick a preset.
export function TimeControl({ reducedMotion }: { reducedMotion: boolean }) {
  const copy = screen.settings;
  const { timeAuto } = useScreenSettings();
  const hour = useHour();
  const frac = hour / 24;

  return (
    <motion.section
      className="timectl"
      aria-label={copy.timeOfDay}
      variants={reducedMotion ? variants.reduced : variants.bar}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: EASE_OUT_SOFT }}
    >
      <div className="timectl__head">
        <span className="timectl__label hud">{copy.timeOfDay}</span>
        <span className="timectl__meta">
          <span className="timectl__clock" aria-hidden="true">
            {formatHour(hour)}
          </span>
          <button
            type="button"
            className="timectl__auto"
            aria-pressed={timeAuto}
            // Turning Auto off keeps the current time as the slider's starting point
            onClick={() => updateSettings(timeAuto ? { timeAuto: false, hour: localHour() } : { timeAuto: true })}
          >
            {copy.auto}
          </button>
        </span>
      </div>

      <div className="timectl__control">
        <MoonIcon />
        <div className="timectl__bar" style={{ '--frac': frac.toFixed(4) } as CSSProperties}>
          <span className="timectl__knob" aria-hidden="true" />
          {/* Native range on top, invisible: keeps drag, keyboard and screen readers */}
          <input
            type="range"
            min={0}
            max={24}
            step={0.25}
            value={hour}
            onChange={(e) => updateSettings({ timeAuto: false, hour: Number(e.target.value) })}
            aria-label={copy.timeOfDay}
            aria-valuetext={formatHour(hour)}
          />
        </div>
        <SunIcon />
      </div>

      <div className="timectl__presets" role="group" aria-label={copy.timeOfDay}>
        {TIME_PRESETS.map((p) => {
          // Within ~8 min counts as on the preset (15-min slider steps)
          const on = !timeAuto && Math.abs(hour - p.hour) < 0.13;
          return (
            <button
              key={p.id}
              type="button"
              className="timectl__preset"
              aria-pressed={on}
              title={formatHour(p.hour)}
              onClick={() => updateSettings({ timeAuto: false, hour: p.hour })}
            >
              {copy.presets[p.id]}
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" className="timectl__icon" aria-hidden="true">
      <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1z" fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" className="timectl__icon timectl__icon--sun" aria-hidden="true">
      <circle cx="10" cy="10" r="3.6" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="10"
          y1="2.2"
          x2="10"
          y2="4.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${a} 10 10)`}
        />
      ))}
    </svg>
  );
}
