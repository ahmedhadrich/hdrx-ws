'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, type CSSProperties } from 'react';
import { screen } from '@/content/copy';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';
import {
  MAX_ORIENTATION,
  formatHour,
  localHour,
  updateSettings,
  useHour,
  useScreenSettings,
  windowBearing,
} from './settings';
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
  // Contents fade in once the shell has mostly resized, so they never show stretched
  content: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2, delay: 0.12 } } },
};

// Room light control, in the room under the plinth (zoomed-out view only), not on the laptop.
// On Auto it is one pill: the room follows the visitor's clock. Pressing it switches to manual
// and opens the sliders (time, and facing, which turns the room against the sun so the window's
// stripes sweep across the floor and walls); pressing Auto there collapses it again.
export function TimeControl({ reducedMotion }: { reducedMotion: boolean }) {
  const copy = screen.settings;
  const { timeAuto, orientation } = useScreenSettings();
  const hour = useHour();
  const bearing = windowBearing(orientation);

  // Focus follows the toggle across the swap (the pressed button unmounts), but only after a
  // press: not on first mount
  const pillRef = useRef<HTMLButtonElement>(null);
  const autoRef = useRef<HTMLButtonElement>(null);
  const toggled = useRef(false);
  useEffect(() => {
    if (!toggled.current) return;
    (timeAuto ? pillRef : autoRef).current?.focus();
  }, [timeAuto]);

  // Leaving Auto keeps the current time as the slider's starting point
  const toggleAuto = () => {
    toggled.current = true;
    updateSettings(timeAuto ? { timeAuto: false, hour: localHour() } : { timeAuto: true });
  };

  return (
    <motion.section
      className="timectl"
      data-collapsed={timeAuto || undefined}
      aria-label={copy.roomLight}
      variants={reducedMotion ? variants.reduced : variants.bar}
      initial="hidden"
      animate="visible"
      exit="hidden"
      // Shell morphs between pill and panel; radius set inline so framer keeps it undistorted
      layout={!reducedMotion}
      style={{ borderRadius: timeAuto ? 999 : 14 }}
      transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: EASE_OUT_SOFT }}
    >
      {timeAuto ? (
        <motion.button
          key="pill"
          ref={pillRef}
          type="button"
          className="timectl__pill"
          aria-pressed
          aria-label={`${copy.auto}, ${copy.timeOfDay} ${formatHour(hour)}`}
          onClick={toggleAuto}
          variants={variants.content}
          initial="hidden"
          animate="visible"
        >
          <span className="timectl__dot" aria-hidden="true" />
          <span>{copy.auto}</span>
          <span className="timectl__value" aria-hidden="true">
            {formatHour(hour)}
          </span>
        </motion.button>
      ) : (
        <motion.div key="panel" className="timectl__panel" variants={variants.content} initial="hidden" animate="visible">
          <RoomSlider
            label={copy.time}
            ariaLabel={copy.timeOfDay}
            min={0}
            max={24}
            step={0.25}
            value={hour}
            valueText={formatHour(hour)}
            onChange={(v) => updateSettings({ timeAuto: false, hour: v })}
            extra={
              <button ref={autoRef} type="button" className="timectl__text" aria-pressed={false} onClick={toggleAuto}>
                {copy.auto}
              </button>
            }
          />
          <RoomSlider
            label={copy.orientation}
            min={-MAX_ORIENTATION}
            max={MAX_ORIENTATION}
            step={1}
            value={orientation}
            valueText={`${bearing.point} ${bearing.deg}°`}
            ariaValueText={`${copy.windowFaces} ${bearing.point}, ${bearing.deg}°`}
            onChange={(v) => updateSettings({ orientation: v })}
            centred
          />

          <div className="timectl__presets" role="group" aria-label={copy.timeOfDay}>
            {TIME_PRESETS.map((p) => {
              // Within ~8 min counts as on the preset (15-min slider steps)
              const on = Math.abs(hour - p.hour) < 0.13;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="timectl__text"
                  aria-pressed={on}
                  title={formatHour(p.hour)}
                  onClick={() => updateSettings({ timeAuto: false, hour: p.hour })}
                >
                  {copy.presets[p.id]}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}

interface RoomSliderProps {
  label: string;
  /** Screen reader name when the visible label is too terse */
  ariaLabel?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueText: string;
  ariaValueText?: string;
  onChange: (v: number) => void;
  /** Fill from the middle out (a signed offset), with a tick at zero */
  centred?: boolean;
  extra?: React.ReactNode;
}

// Hairline track, small knob. The native range sits invisibly on top, so drag, keyboard and
// screen readers keep working.
function RoomSlider({
  label,
  ariaLabel,
  min,
  max,
  step,
  value,
  valueText,
  ariaValueText,
  onChange,
  centred = false,
  extra,
}: RoomSliderProps) {
  const frac = (value - min) / (max - min);
  const lo = centred ? Math.min(frac, 0.5) : 0;
  const hi = centred ? Math.max(frac, 0.5) : frac;
  return (
    <div className="timectl__row">
      <span className="timectl__label hud" aria-hidden="true">
        {label}
      </span>
      <div
        className="timectl__bar"
        data-centred={centred || undefined}
        style={{ '--frac': frac.toFixed(4), '--lo': lo.toFixed(4), '--hi': hi.toFixed(4) } as CSSProperties}
      >
        <span className="timectl__knob" aria-hidden="true" />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel ?? label}
          aria-valuetext={ariaValueText ?? valueText}
        />
      </div>
      <span className="timectl__value" aria-hidden="true">
        {valueText}
      </span>
      <span className="timectl__extra">{extra}</span>
    </div>
  );
}
