'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'framer-motion';
import { useIntro } from '@/lib/hooks/useIntro';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { site } from '@/content/copy';

const EASE_CUBIC_OUT = [0.215, 0.61, 0.355, 1.0] as const;
const EASE_QUART_INOUT = [0.645, 0.045, 0.355, 1.0] as const;
const EASE_CUBE_RISE = [0.455, 0.03, 0.515, 0.955] as const;

function SplitText({ text, className }: { text: string; className?: string }) {
  return (
    <span aria-label={text} className={className}>
      {text.split('').map((char, i) => (
        <span key={i} className="intro-letter-wrap">
          <span data-letter="" style={{ display: 'inline-block' }}>
            {char === ' ' ? ' ' : char}
          </span>
        </span>
      ))}
    </span>
  );
}

export function IntroLoader() {
  const { setIntroComplete } = useIntro();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [removed, setRemoved] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const overlayDarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (reduced) {
      setIntroComplete(true);
      setRemoved(true);
      return;
    }

    if (process.env.NODE_ENV !== 'development') {
      try {
        if (sessionStorage.getItem('intro-played')) {
          setIntroComplete(true);
          setRemoved(true);
          return;
        }
        sessionStorage.setItem('intro-played', '1');
      } catch {
        // sessionStorage unavailable (private browsing)
      }
    }

    document.body.classList.add('intro-lock');

    const run = async () => {
      const cube = cubeRef.current;
      const logo = logoRef.current;
      const mark = markRef.current;
      const darkOverlay = overlayDarkRef.current;
      const container = containerRef.current;

      if (!cube || !logo || !mark || !darkOverlay || !container) return;

      // Snap all elements to their starting states (duration 0)
      const letters = logo.querySelectorAll<HTMLElement>('[data-letter]');
      animate(cube, { scale: 0, y: 60, opacity: 1 }, { duration: 0 });
      animate(logo, { x: '41%', opacity: 1 }, { duration: 0 });
      animate(mark, { opacity: 0 }, { duration: 0 });
      animate(darkOverlay, { opacity: 0 }, { duration: 0 });
      if (letters.length > 0) {
        animate(letters, { y: '110%' }, { duration: 0 });
      }

      // One frame to ensure paint before animating
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      // Phase 1 — cube rises and spins (0–1.5s). No await: phases overlap.
      cube.classList.add('intro-cube--rotate');
      animate(cube, { scale: 0.95, y: 0 }, { duration: 1.5, ease: EASE_CUBE_RISE });

      // Phase 2 starts at 1.3s — overlaps with end of Phase 1
      await new Promise<void>((resolve) => setTimeout(resolve, 1300));

      animate(logo, { x: '0%' }, { duration: 1.0, ease: EASE_QUART_INOUT });
      animate(cube, { x: '150%', y: '80%', scale: 0, opacity: 0 }, {
        duration: 0.9,
        ease: EASE_QUART_INOUT,
      });
      animate(mark, { opacity: 1 }, { duration: 0.5, ease: 'easeOut' });

      if (letters.length > 0) {
        animate(letters, { y: ['110%', '0%'] }, {
          duration: 0.8,
          ease: EASE_CUBIC_OUT,
          delay: stagger(0.05),
        });
      }

      // Phase 3 starts at 2.2s
      await new Promise<void>((resolve) => setTimeout(resolve, 900));

      animate(darkOverlay, { opacity: 0.6 }, { duration: 1.2 });
      animate(logo, { y: '-120%', opacity: 0 }, { duration: 0.9, ease: EASE_QUART_INOUT });

      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      setIntroComplete(true);

      await animate(container, { opacity: 0 }, { duration: 0.7 });

      document.body.classList.remove('intro-lock');
      setRemoved(true);
    };

    run();
  }, [mounted, reduced, setIntroComplete]);

  if (!mounted || removed) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-base)',
        color: 'var(--ink-primary)',
      }}
    >
      {/* Dark veil that deepens during Phase 3 */}
      <div
        ref={overlayDarkRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* CSS 3D cube — Framer drives scale/y/x on the outer div,
          CSS keyframe drives the 3D rotation on the inner shape */}
      <div
        ref={cubeRef}
        className="intro-cube"
        style={{ opacity: 0 }}
      >
        <div className="intro-cube__shape">
          <div className="intro-cube__face intro-cube__face--front" />
          <div className="intro-cube__face intro-cube__face--back" />
          <div className="intro-cube__face intro-cube__face--right" />
          <div className="intro-cube__face intro-cube__face--left" />
          <div className="intro-cube__face intro-cube__face--top" />
          <div className="intro-cube__face intro-cube__face--bottom" />
        </div>
      </div>

      {/* Logo group — starts at x=+41%, slides to center in Phase 2 */}
      <div
        ref={logoRef}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          opacity: 0,
        }}
      >
        {/* ✴ mark — fades in during Phase 2 */}
        <span
          ref={markRef}
          style={{
            fontSize: '3rem',
            color: 'var(--accent-signal)',
            lineHeight: 1,
            display: 'block',
          }}
          aria-hidden="true"
        >
          ✴
        </span>

        {/* Name — each letter wipes upward in Phase 2 */}
        <span style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', letterSpacing: '0.18em' }}>
          <SplitText
            text={site.name.toUpperCase()}
            className="font-mono font-medium uppercase select-none"
          />
        </span>
      </div>
    </div>
  );
}
