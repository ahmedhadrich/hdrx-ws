'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { hero } from '@/content/copy';
import { Button } from '@/components/ui/Button';

const EASE_LINE = [0.82, 0, 0.18, 1] as const;
const EASE_SOFT = [0.22, 1, 0.36, 1] as const;
const EASE_SPRING = { type: 'spring', stiffness: 180, damping: 22 } as const;

function LineReveal({
  delay,
  reduced,
  duration = 0.65,
  children,
}: {
  delay: number;
  reduced: boolean;
  duration?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { clipPath: 'inset(0 0 100% 0)' }}
      animate={reduced ? { opacity: 1 } : { clipPath: 'inset(0 0 0% 0)' }}
      transition={
        reduced
          ? { duration: 0.2, delay }
          : { duration, delay, ease: EASE_LINE }
      }
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section
      id="top"
      className="relative min-h-[100svh] flex flex-col items-center justify-center px-[clamp(1.25rem,4vw,3rem)] pt-16 pb-32 overflow-hidden"
      aria-label="Introduction"
    >
      {/* Signal horizon vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 110%, rgba(255,90,31,0.10), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1
          className="font-display leading-[0.88] tracking-[-0.03em] flex flex-col items-center"
          style={{ fontSize: 'clamp(3.5rem, 9vw, 9.5rem)' }}
        >
          {/* Lines 1–2: light italic — poetic buildup */}
          <LineReveal delay={0.2} reduced={reduced}>
            <span
              className="block font-light italic"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}
            >
              {hero.headline[0]}
            </span>
          </LineReveal>

          {/* Bracket row — eyebrow nested inside the headline */}
          <LineReveal delay={0.3} reduced={reduced} duration={0.5}>
            <div className="flex items-center justify-center gap-x-[0.2em] my-[0.04em]">
              <span aria-hidden className="font-light leading-none">(</span>
              <div
                className="flex items-center gap-x-[0.35em]"
                style={{ fontSize: 'clamp(0.65rem, 1.15vw, 0.9rem)' }}
              >
                <span aria-hidden className="text-accent-signal leading-none">
                  ✴
                </span>
                <span className="font-mono font-medium tracking-[0.1em] uppercase text-ink-secondary whitespace-nowrap">
                  {hero.eyebrow}
                </span>
              </div>
              <span aria-hidden className="font-light leading-none">)</span>
            </div>
          </LineReveal>

          <LineReveal delay={0.4} reduced={reduced}>
            <span
              className="block font-light italic"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}
            >
              {hero.headline[1]}
            </span>
          </LineReveal>

          {/* Line 3: semibold upright — the payoff */}
          <LineReveal delay={0.52} reduced={reduced}>
            <span
              className="block font-semibold not-italic"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 8" }}
            >
              {hero.headline[2]}
            </span>
          </LineReveal>
        </h1>

        {/* Editorial separator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reduced
              ? { duration: 0.2, delay: 0.55 }
              : { duration: 0.6, delay: 0.85, ease: EASE_SOFT }
          }
          className="mt-8 flex items-center gap-3"
          style={{ width: 'clamp(5rem, 10vw, 9rem)' }}
          aria-hidden
        >
          <div className="flex-1 h-px bg-rule" />
          <span className="text-accent-signal text-xs leading-none">✴</span>
          <div className="flex-1 h-px bg-rule" />
        </motion.div>

        {/* Positioning paragraph */}
        <motion.p
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0.2, delay: 0.65 }
              : { duration: 0.55, delay: 1.1, ease: EASE_SOFT }
          }
          className="mt-6 text-ink-secondary text-base md:text-lg leading-body max-w-[56ch]"
        >
          {hero.positioning}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={
            reduced
              ? { duration: 0.2, delay: 0.75 }
              : { ...EASE_SPRING, delay: 1.3 }
          }
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Button href={hero.ctaPrimary.href} variant="primary" className="group">
            {hero.ctaPrimary.label}
          </Button>
          <Button href={hero.ctaSecondary.href} variant="ghost" className="group">
            {hero.ctaSecondary.label}
          </Button>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduced
            ? { duration: 0.2, delay: 0.85 }
            : { duration: 0.8, delay: 1.5 }
        }
        className="absolute bottom-8 flex flex-col items-center gap-2 text-ink-muted pointer-events-none"
        aria-hidden
      >
        <span className="font-mono text-micro tracking-widest uppercase">
          {hero.scrollHint}
        </span>
        <span className="block w-px h-10 bg-gradient-to-b from-ink-muted to-transparent" />
      </motion.div>
    </section>
  );
}
