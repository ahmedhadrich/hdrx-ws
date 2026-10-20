'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface NormPos {
  nx: number; // -1 … +1
  ny: number; // -1 … +1
}

interface PixelPos {
  x: number;
  y: number;
}

const SOFT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SCAN_TRANSITION = `transform 600ms ${SOFT_EASE}`;
const VIGNETTE_TRANSITION = `background 600ms ${SOFT_EASE}`;
const GLOW_MOVE_TRANSITION = `left 800ms ${SOFT_EASE}, top 800ms ${SOFT_EASE}, opacity 600ms ease`;

// Maximum vertical pixel offset for R/B channel split (prism spread).
const MAX_SPLIT_PX = 2.5;
// Maximum skew per channel in degrees (prism curve).
const MAX_CURVE_DEG = 0.3;
// Maximum overall scanline skew following mouse X.
const MAX_SKEW_DEG = 0.4;
// Max vignette centre drift.
const MAX_VIGNETTE_SHIFT_PCT = 8;
const GLOW_RADIUS_PX = 180;

function scanlineStyle(color: string, transform: string) {
  return {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color} 2px, ${color} 4px)`,
    transform,
    transformOrigin: 'center center',
    transition: SCAN_TRANSITION,
  };
}

export function CrtOverlay() {
  const reducedMotion = useReducedMotion();

  const rawRef = useRef<{ nx: number; ny: number; px: number; py: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [normPos, setNormPos] = useState<NormPos>({ nx: 0, ny: 0 });
  const [pixelPos, setPixelPos] = useState<PixelPos>({ x: 0, y: 0 });
  const [glowVisible, setGlowVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    function scheduleFlush() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const r = rawRef.current;
        if (!r) return;
        setNormPos({ nx: r.nx, ny: r.ny });
        setPixelPos({ x: r.px, y: r.py });
      });
    }

    function onMouseMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      rawRef.current = { nx, ny, px: e.clientX, py: e.clientY };
      scheduleFlush();

      setGlowVisible(true);
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setGlowVisible(false), 2000);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
    };
  }, [reducedMotion]);

  // --- Derived values ---

  // How far cursor is from centre (0–1.0 range clamped).
  const dist = Math.min(Math.sqrt(normPos.nx ** 2 + normPos.ny ** 2) / Math.SQRT2, 1);

  // Vertical split for R (up) and B (down) channels.
  const split = reducedMotion ? 0 : dist * MAX_SPLIT_PX;

  // Horizontal skew applied to the whole scanline stack (screen tilt feel).
  const skewDeg = reducedMotion ? 0 : normPos.nx * MAX_SKEW_DEG;

  // Per-channel skew that creates the prism curve: R curves left, B curves right.
  const curveDeg = reducedMotion ? 0 : normPos.nx * MAX_CURVE_DEG;

  // Vignette centre follows mouse.
  const vx = reducedMotion ? 50 : 50 + normPos.nx * MAX_VIGNETTE_SHIFT_PCT;
  const vy = reducedMotion ? 50 : 50 + normPos.ny * MAX_VIGNETTE_SHIFT_PCT;

  // Channel transforms:
  // R — shifts up, curves left (negative skew).
  const rTransform = `translateY(${-split}px) skewX(${skewDeg - curveDeg}deg)`;
  // G — stays centred, carries base tilt only.
  const gTransform = `skewX(${skewDeg}deg)`;
  // B — shifts down, curves right (positive skew).
  const bTransform = `translateY(${split}px) skewX(${skewDeg + curveDeg}deg)`;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9997 }}
    >
      {/*
        Prism scanlines — three RGB channels that separate on mouse move.
        At rest they overlap and read as neutral grey (each at ~0.011 opacity,
        summing to ~0.033 — close to the original single-layer 0.028).
        As split grows the channels spread: red fringe above, blue below.
      */}
      <div style={scanlineStyle('rgba(200,40,40,0.011)', rTransform)} />
      <div style={scanlineStyle('rgba(40,180,40,0.009)', gTransform)} />
      <div style={scanlineStyle('rgba(40,40,200,0.011)', bTransform)} />

      {/* Vignette — centre drifts toward cursor */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 90% at ${vx}% ${vy}%, transparent 60%, rgba(0,0,0,0.52) 100%)`,
          transition: VIGNETTE_TRANSITION,
        }}
      />

      {/* Film grain — SVG feTurbulence, GPU-accelerated */}
      {!reducedMotion && (
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.055, mixBlendMode: 'overlay' as const }}
        >
          <filter id="crt-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            >
              <animate
                attributeName="seed"
                values="0;15;7;22;4;18;11;26;3;19;8;24;1;17;12;28;5;21;9;25;2;16;13;29;6;20;10;27;14;30"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#crt-grain)" />
        </svg>
      )}

      {/* Phosphor edge bleed — accent-ember tint at corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 72%, rgba(123,31,31,0.2) 100%)',
          mixBlendMode: 'screen' as const,
        }}
      />

      {/* Phosphor cursor persistence glow */}
      {!reducedMotion && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: pixelPos.x,
            top: pixelPos.y,
            width: GLOW_RADIUS_PX * 2,
            height: GLOW_RADIUS_PX * 2,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 50% 50%, rgba(220,210,190,0.85) 0%, rgba(220,210,190,0.18) 35%, transparent 70%)',
            opacity: glowVisible ? 0.07 : 0,
            mixBlendMode: 'screen' as const,
            transition: GLOW_MOVE_TRANSITION,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
