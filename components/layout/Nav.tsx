'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { site } from '@/content/copy';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { EASE_OUT_SOFT, EASE_GLASS } from '@/lib/utils/motion';

// Never rendered on the home page (see SiteChrome), so links point back to its anchors
const NAV_LINKS = [
  { label: 'Work', anchor: '#work' },
  { label: 'Space', anchor: '#space' },
  { label: 'About', anchor: '#about' },
  { label: 'Contact', anchor: '#contact' },
] as const;

// ─── Motion variants ───────────────────────────────────────────────────────────

const tickerVariants = {
  enter: { y: '100%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { duration: 0.32, ease: EASE_OUT_SOFT } },
  exit: { y: '-100%', opacity: 0, transition: { duration: 0.24, ease: EASE_GLASS } },
};

const menuVariants = {
  closed: {
    opacity: 0,
    y: 16,
    scale: 0.97,
    transition: { duration: 0.22, ease: EASE_GLASS },
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.36,
      ease: EASE_OUT_SOFT,
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const menuItemVariants = {
  closed: { opacity: 0, y: 12 },
  open: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_SOFT } },
};

const menuReducedVariants = {
  closed: { opacity: 0, transition: { duration: 0.15 } },
  open: { opacity: 1, transition: { duration: 0.2 } },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function BurgerIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
      <line x1="0" y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function Nav() {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // Ticker shows the last path segment, e.g. /work/edu-360 → EDU-360
  const sectionLabel = (pathname.split('/').filter(Boolean).pop() ?? '').toUpperCase();

  // ─── Close menu on outside click ─────────────────────────────────────────

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        burgerRef.current &&
        !burgerRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  // ─── Close menu on Escape ─────────────────────────────────────────────────

  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const href = (anchor: string) => `/${anchor}`;

  const handleLinkClick = useCallback(() => setMenuOpen(false), []);

  const activeMenuVariants = reduced ? menuReducedVariants : menuVariants;

  return (
    <>
      {/* ── Single fixed anchor wrapping menu + pills ─────────────────────── */}
      <div
        className="fixed z-50"
        style={{ bottom: '40px', left: '50%', transform: 'translateX(-50%)' }}
      >
      {/* ── Menu — absolutely above the left pill ────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="nav-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            variants={activeMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="nav-menu absolute flex flex-col"
            style={{
              bottom: 'calc(100% + 12px)',
              left: 0,
              width: 'min(276px, calc(100vw - 2rem))',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              borderRadius: '1.25rem',
            }}
          >
            {/* Eyebrow */}
            <motion.div
              variants={reduced ? undefined : menuItemVariants}
              className="px-5 pt-5 pb-3"
            >
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-muted">
                Menu
              </span>
            </motion.div>

            {/* Primary nav links */}
            <nav aria-label="Primary navigation">
              <ul className="flex flex-col px-2 pb-2">
                {NAV_LINKS.map(({ label, anchor }) => (
                  <motion.li
                    key={anchor}
                    variants={reduced ? undefined : menuItemVariants}
                  >
                    <a
                      href={href(anchor)}
                      onClick={handleLinkClick}
                      className="nav-menu-link-hover block px-3 py-1.5 font-display font-light tracking-[-0.02em] leading-tight text-ink-primary hover:text-ink-primary/80 transition-colors duration-200 rounded-lg focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2"
                      style={{ fontSize: '2rem' }}
                    >
                      {label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Bottom bar — ThemeToggle + CTA */}
            <motion.div
              variants={reduced ? undefined : menuItemVariants}
              className="flex items-center justify-between px-5 py-3.5 border-t border-rule"
            >
              <ThemeToggle />
              <a
                href={href('#contact')}
                onClick={handleLinkClick}
                className="btn-glass inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] uppercase text-ink-secondary hover:text-ink-primary transition-all duration-300 rounded-full px-4 py-1.5 focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2"
              >
                Get in touch
                <span aria-hidden="true">→</span>
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Glass pills ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3"
        role="navigation"
        aria-label="Site navigation"
      >
        {/* Left pill — Burger + Logo */}
        <div
          className="nav-pill flex items-stretch overflow-hidden"
          style={{
            height: '50px',
            borderRadius: '999px',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          }}
        >
          {/* Burger / Close */}
          <button
            ref={burgerRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-menu"
            className="flex items-center justify-center flex-shrink-0 text-ink-primary hover:text-ink-primary/70 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2 focus-visible:rounded-full"
            style={{ width: '50px' }}
          >
            <AnimatePresence mode="wait">
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_SOFT }}
                >
                  <CloseIcon />
                </motion.span>
              ) : (
                <motion.span
                  key="burger"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.8 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.8 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_SOFT }}
                >
                  <BurgerIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Divider */}
          <div
            className="nav-divider flex-shrink-0 self-stretch"
            style={{ width: '1px', margin: '10px 0' }}
            aria-hidden="true"
          />

          {/* Logo — centered in remaining space */}
          <a
            href="/"
            aria-label={site.name}
            className="flex items-center justify-center flex-shrink-0 text-ink-primary hover:text-ink-secondary transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2 focus-visible:rounded-full"
            style={{ width: '70px' }}
          >
            <span className="font-mono text-[10px] tracking-[0.12em] uppercase select-none">
              {site.shortName}
            </span>
          </a>
        </div>

        {/* Right pill — Section ticker */}
        <AnimatePresence>
          {sectionLabel && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_SOFT }}
              className="nav-pill flex items-center overflow-hidden"
              style={{
                height: '50px',
                borderRadius: '999px',
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                padding: '0 20px',
              }}
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Current section: ${sectionLabel}`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={sectionLabel}
                  variants={tickerVariants}
                  initial={reduced ? { opacity: 0 } : 'enter'}
                  animate={reduced ? { opacity: 1 } : 'visible'}
                  exit={reduced ? { opacity: 0 } : 'exit'}
                  className="font-mono text-[11px] tracking-[0.08em] uppercase text-ink-primary select-none whitespace-nowrap"
                >
                  {sectionLabel}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>

    </>
  );
}
