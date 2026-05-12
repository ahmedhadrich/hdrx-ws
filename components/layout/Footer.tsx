'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { site, footer } from '@/content/copy';

const EASE_TEXT = [0.98, 0, 0.02, 1] as const;
const EASE_APPEARS = [0.82, 0, 0.18, 1] as const;
const EASE_WORDMARK = [0.85, 0, 0.25, 1] as const;

const NAV_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Space', href: '#space' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'About', href: '#about' },
];

function HoverLink({
  href,
  children,
  className = '',
  target,
  rel,
}: {
  href: string;
  children: string;
  className?: string;
  target?: string;
  rel?: string;
}) {
  const ease = `cubic-bezier(${EASE_TEXT.join(',')})`;
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={`relative block overflow-hidden will-change-transform group ${className}`}
    >
      <span
        className="flex transition-transform duration-700 lg:group-hover:-translate-y-full"
        style={{ transitionTimingFunction: ease }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 flex translate-y-full transition-transform duration-700 lg:group-hover:translate-y-0"
        style={{ transitionTimingFunction: ease }}
      >
        {children}
      </span>
    </a>
  );
}

function useAppearsVariants(reduced: boolean) {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: EASE_APPEARS },
    },
  };
}

export function Footer() {
  const reduced = useReducedMotion();
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const wordmarkInView = useInView(wordmarkRef, { amount: 0.6, once: true });
  const appears = useAppearsVariants(reduced);

  const letters = ['H', 'D', 'R', 'X', '.'];

  return (
    <footer
      className="relative z-10 overflow-hidden"
      style={{ backgroundColor: '#0b0b0e', color: '#f4f4ee' }}
      aria-label="Site footer"
    >
      {/* Zone 1 — CTA billboard */}
      <div className="px-[clamp(1.25rem,4vw,3rem)] pt-24 pb-16 md:pt-48 md:pb-32">
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-12 gap-x-4 gap-y-8">
            <motion.h2
              variants={appears}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="col-span-10 col-start-2 text-center font-display font-light leading-tight tracking-[-0.015em] text-h2"
            >
              {footer.cta}
            </motion.h2>

            <motion.div
              variants={appears}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="col-span-12 flex justify-center mt-4"
            >
              <HoverLink
                href={`mailto:${site.email}`}
                className="font-mono text-micro tracking-widest uppercase border-b pb-0.5 text-[rgba(244,244,238,0.5)] border-[rgba(244,244,238,0.2)]"
              >
                {footer.ctaLink}
              </HoverLink>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hairline rule */}
      <div className="px-[clamp(1.25rem,4vw,3rem)]">
        <div className="h-px" style={{ background: 'rgba(244,244,238,0.1)' }} />
      </div>

      {/* Zone 2 — Link grid */}
      <div className="px-[clamp(1.25rem,4vw,3rem)] py-16 md:py-24">
        <div className="mx-auto max-w-container grid grid-cols-12 gap-x-4 gap-y-12 md:gap-y-0">
          {/* Nav */}
          <motion.div
            variants={appears}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="col-span-12 md:col-span-6 grid grid-cols-5 md:grid-cols-4"
          >
            <p
              className="col-span-2 md:col-span-1 font-mono text-micro tracking-widest uppercase whitespace-nowrap"
              style={{ color: 'rgba(244,244,238,0.35)' }}
            >
              ( Nav )
            </p>
            <div className="col-span-3 flex flex-col gap-y-2 text-sm">
              {NAV_LINKS.map(({ label, href }) => (
                <HoverLink key={label} href={href}>
                  {label}
                </HoverLink>
              ))}
            </div>
          </motion.div>

          {/* Reach out */}
          <motion.div
            variants={appears}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="col-span-12 md:col-span-6 grid grid-cols-5 md:grid-cols-4"
          >
            <p
              className="col-span-2 md:col-span-1 font-mono text-micro tracking-widest uppercase whitespace-nowrap"
              style={{ color: 'rgba(244,244,238,0.35)' }}
            >
              ( Reach out )
            </p>
            <div className="col-span-3 flex flex-col gap-y-2 text-sm">
              <HoverLink href={`mailto:${site.email}`}>Email</HoverLink>
              {site.social.map(({ label, href }) => (
                <HoverLink
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                </HoverLink>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Zone 3 — Animated wordmark / back to top */}
      <div ref={wordmarkRef} className="px-[clamp(1.25rem,4vw,3rem)]">
        <button
          onClick={() =>
            window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
          }
          aria-label="Back to top"
          className="w-full text-left focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-4"
        >
          <div className="flex justify-between items-end w-full">
            {letters.map((letter, i) => (
              <div key={i} className="overflow-hidden">
                <motion.span
                  initial={reduced ? { opacity: 0 } : { y: '105%' }}
                  animate={
                    wordmarkInView
                      ? reduced
                        ? { opacity: 1, transition: { duration: 0.2 } }
                        : {
                            y: 0,
                            transition: {
                              duration: 1,
                              ease: EASE_WORDMARK,
                              delay: i * 0.05,
                            },
                          }
                      : {}
                  }
                  className="block font-mono font-medium uppercase leading-[0.85] tracking-widest select-none"
                  style={{ fontSize: 'clamp(5rem,22vw,22rem)' }}
                >
                  {letter}
                </motion.span>
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Hairline rule */}
      <div className="px-[clamp(1.25rem,4vw,3rem)]">
        <div className="h-px" style={{ background: 'rgba(244,244,238,0.1)' }} />
      </div>

      {/* Zone 4 — Legal */}
      <div
        className="px-[clamp(1.25rem,4vw,3rem)] pt-[15px] pb-24 flex justify-between items-center"
        style={{ color: 'rgba(244,244,238,0.35)' }}
      >
        <span className="font-mono text-micro tracking-[0.08em] uppercase">
          © {new Date().getFullYear()} {site.name}
        </span>
        <span className="font-mono text-micro tracking-[0.08em] uppercase">
          Built with intention
        </span>
      </div>
    </footer>
  );
}
