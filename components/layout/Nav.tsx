'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { site } from '@/content/copy';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

// ─── Section ticker config ─────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'space', label: 'Space' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

const NAV_LINKS = [
  { label: 'Work', anchor: '#work' },
  { label: 'Space', anchor: '#space' },
  { label: 'About', anchor: '#about' },
  { label: 'Contact', anchor: '#contact' },
] as const;

const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/' },
  { label: 'X', href: 'https://x.com/' },
  { label: 'Email', href: `mailto:${site.email}` },
] as const;

// ─── Motion variants ───────────────────────────────────────────────────────────

const tickerVariants = {
  enter: { y: '100%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { y: '-100%', opacity: 0, transition: { duration: 0.24, ease: [0.65, 0, 0.35, 1] } },
};

const menuVariants = {
  closed: {
    opacity: 0,
    y: 16,
    scale: 0.97,
    transition: { duration: 0.22, ease: [0.65, 0, 0.35, 1] },
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.36,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const menuItemVariants = {
  closed: { opacity: 0, y: 12 },
  open: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
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
  const isHome = pathname === '/';
  const reduced = useReducedMotion();

  const [menuOpen, setMenuOpen] = useState(false);
  const [sectionLabel, setSectionLabel] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // ─── Section ticker via IntersectionObserver ─────────────────────────────

  useEffect(() => {
    if (!isHome) {
      // On sub-pages, derive label from pathname
      const slug = pathname.split('/').filter(Boolean).pop() ?? '';
      setSectionLabel(slug.toUpperCase());
      return;
    }

    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setSectionLabel(label.toUpperCase());
          }
        },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [isHome, pathname]);

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

  // ─── Link href helper (anchor works on home; prefixed on sub-pages) ───────

  const href = useCallback(
    (anchor: string) => (isHome ? anchor : `/${anchor}`),
    [isHome]
  );

  const handleLinkClick = useCallback(() => setMenuOpen(false), []);

  const activeMenuVariants = reduced ? menuReducedVariants : menuVariants;

  return (
    <>
      {/* ── Menu overlay ─────────────────────────────────────────────────── */}
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
            className="nav-menu nav-menu-panel fixed z-50 flex flex-col"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
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

            {/* Secondary grid — social links */}
            <motion.div
              variants={reduced ? undefined : menuItemVariants}
              className="px-5 pb-4 pt-2"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {SOCIAL_LINKS.map(({ label, href: socialHref }) => (
                  <a
                    key={label}
                    href={socialHref}
                    target={socialHref.startsWith('mailto') ? undefined : '_blank'}
                    rel={socialHref.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                    onClick={handleLinkClick}
                    className="font-sans text-sm text-ink-muted hover:text-ink-secondary transition-colors duration-200 py-1.5 focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2 rounded"
                    aria-label={label}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Bottom bar — ThemeToggle + CTA */}
            <motion.div
              variants={reduced ? undefined : menuItemVariants}
              className="flex items-center justify-between px-5 py-3.5 border-t border-rule"
            >
              <ThemeToggle />
              <a
                href={href('#contact')}
                onClick={handleLinkClick}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] uppercase text-ink-secondary hover:text-ink-primary transition-colors duration-200 border border-rule rounded-full px-4 py-1.5 hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2"
              >
                Get in touch
                <span aria-hidden="true">→</span>
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Glass pill ───────────────────────────────────────────────────── */}
      <div
        className="nav-pill fixed z-50 flex items-stretch overflow-hidden"
        style={{
          width: '276px',
          height: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          borderRadius: '999px',
        }}
        role="navigation"
        aria-label="Site navigation pill"
      >
        {/* Left zone — Logo */}
        <a
          href={isHome ? '#top' : '/'}
          aria-label={site.name}
          className="flex items-center justify-center flex-shrink-0 text-ink-primary hover:text-accent-signal transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2 focus-visible:rounded-full"
          style={{ width: '50px' }}
        >
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase select-none">
            {site.shortName}
            <span className="text-accent-signal">.</span>
          </span>
        </a>

        {/* Divider */}
        <div
          className="nav-divider flex-shrink-0 self-stretch"
          style={{ width: '1px', margin: '10px 0' }}
          aria-hidden="true"
        />

        {/* Center zone — Section ticker */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden"
          aria-live="polite"
          aria-atomic="true"
          aria-label={sectionLabel ? `Current section: ${sectionLabel}` : undefined}
        >
          <AnimatePresence mode="wait">
            {sectionLabel ? (
              <motion.span
                key={sectionLabel}
                variants={tickerVariants}
                initial={reduced ? { opacity: 0 } : 'enter'}
                animate={reduced ? { opacity: 1 } : 'visible'}
                exit={reduced ? { opacity: 0 } : 'exit'}
                className="font-mono text-[11px] tracking-[0.08em] uppercase text-ink-muted select-none"
              >
                {sectionLabel}
              </motion.span>
            ) : (
              <motion.span
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div
          className="nav-divider flex-shrink-0 self-stretch"
          style={{ width: '1px', margin: '10px 0' }}
          aria-hidden="true"
        />

        {/* Right zone — Burger / Close */}
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
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <CloseIcon />
              </motion.span>
            ) : (
              <motion.span
                key="burger"
                initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.8 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <BurgerIcon />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

    </>
  );
}
