'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects, type Project } from '@/content/projects';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useTheme } from '@/lib/hooks/useTheme';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';

const ProjectScene = dynamic(
  () => import('@/components/three/ProjectScene').then((m) => m.ProjectScene),
  { ssr: false }
);

const FallbackScene = dynamic(
  () => import('@/components/three/FallbackScene').then((m) => m.FallbackScene),
  { ssr: false }
);

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export function ProjectSpace() {
  const reducedMotion = useReducedMotion();
  const isCoarse = useMediaQuery('(pointer: coarse)');
  const isNarrow = useMediaQuery('(max-width: 767px)');
  const { theme } = useTheme();

  const [webgl, setWebgl] = useState(false);
  const [entered, setEntered] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    setWebgl(detectWebGL());
  }, []);

  // Body scroll lock while in the space
  useEffect(() => {
    document.body.style.overflow = entered ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [entered]);

  // Sync selected project with focusedIndex
  useEffect(() => {
    if (focusedIndex >= 0) {
      setSelected(projects[focusedIndex]);
    }
  }, [focusedIndex]);

  // Wheel navigation while entered
  useEffect(() => {
    if (!entered) return;
    const lastTime = { current: 0 };

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTime.current < 350) return; // throttle
      lastTime.current = now;

      const dir = e.deltaX > 0 || e.deltaY > 0 ? 1 : -1;
      setFocusedIndex((prev) => {
        const next =
          prev === -1
            ? dir > 0
              ? 0
              : projects.length - 1
            : prev + dir;
        return Math.max(0, Math.min(projects.length - 1, next));
      });
    }

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [entered]);

  const useFallback = !webgl || isCoarse || isNarrow || reducedMotion;

  function handleEnter() {
    setEntered(true);
  }

  function handleExit() {
    setEntered(false);
    setSelected(null);
    setFocusedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!entered && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleEnter();
    }
    if (entered && e.key === 'Escape') {
      handleExit();
    }
    if (entered && e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        Math.min(prev === -1 ? 0 : prev + 1, projects.length - 1)
      );
    }
    if (entered && e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    }
  }

  return (
    <section
      id="space"
      className="relative min-h-screen flex flex-col bg-bg-base overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Skip link for keyboard users who don't want to navigate the 3D space */}
      <a href="#capabilities" className="skip-link">
        Skip project space
      </a>

      {/* Section eyebrow — always visible, anchored top-center */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <span className="font-mono text-micro tracking-widest uppercase text-ink-muted">
          Project Space
        </span>
      </div>

      {/* Full-bleed scene — switches between inline and fixed on enter */}
      <div
        className={
          entered
            ? 'fixed inset-0 z-40 bg-bg-base'
            : 'absolute inset-0'
        }
        aria-hidden="true"
      >
        {useFallback ? (
          <FallbackScene
            onSelect={setSelected}
            onFocus={setFocusedIndex}
            selectedSlug={selected?.slug ?? null}
            entered={entered}
            focusedIndex={focusedIndex}
          />
        ) : (
          <ProjectScene
            onSelect={setSelected}
            onFocus={setFocusedIndex}
            selectedSlug={selected?.slug ?? null}
            entered={entered}
            focusedIndex={focusedIndex}
            theme={theme}
          />
        )}

        {/* "Back to all" button — visible when a panel is focused */}
        <AnimatePresence>
          {entered && focusedIndex !== -1 && (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
              onClick={() => {
                setFocusedIndex(-1);
                setSelected(null);
              }}
              className="absolute top-8 left-8 z-50 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-muted hover:text-ink-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            >
              ← All projects
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scroll hint — visible when entered but no panel focused yet */}
        <AnimatePresence>
          {entered && focusedIndex === -1 && (
            <motion.div
              key="scroll-hint"
              className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest uppercase text-ink-muted pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: EASE_OUT_SOFT }}
            >
              Scroll to navigate
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit button */}
        <AnimatePresence>
          {entered && (
            <motion.button
              key="exit-btn"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
              onClick={handleExit}
              className="absolute bottom-8 left-8 z-50 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-muted hover:text-ink-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            >
              ← Exit
            </motion.button>
          )}
        </AnimatePresence>

        {/* Project metadata overlay — right side on desktop, bottom on mobile */}
        <AnimatePresence mode="wait">
          {selected && entered && (
            <ProjectMeta
              key={selected.slug}
              project={selected}
              onClose={() => {
                setSelected(null);
                setFocusedIndex(-1);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Enter affordance — visible only when not entered */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            key="enter-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_SOFT }}
            className="absolute inset-0 flex flex-col items-center justify-end pb-16 z-10 pointer-events-none"
          >
            {/* Vignette to help the button read over the scene */}
            <div
              className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, rgba(11,11,14,0.7) 0%, transparent 100%)',
              }}
            />
            <button
              onClick={handleEnter}
              className="pointer-events-auto relative font-mono text-[11px] tracking-[0.12em] uppercase text-ink-muted border border-rule rounded-full px-6 py-2.5 transition-colors duration-300 hover:text-ink-primary hover:border-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            >
              Enter the space
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen-reader accessible project list — keyboard navigation without WebGL */}
      <ul className="sr-only" aria-label="Projects in 3D space">
        {projects.map((p) => (
          <li key={p.slug}>
            <button onClick={() => setSelected(p)}>
              {p.title} — {p.role}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ProjectMetaProps {
  project: Project;
  onClose: () => void;
}

function ProjectMeta({ project, onClose }: ProjectMetaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.4, ease: EASE_OUT_SOFT }}
      className="
        absolute z-20
        bottom-8 right-8
        md:top-1/2 md:-translate-y-1/2 md:bottom-auto
        w-[calc(100%-4rem)] max-w-xs
        glass rounded-xl p-6
        flex flex-col gap-3
      "
      style={{
        borderTop: `2px solid ${project.accent ?? 'var(--accent-signal)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-micro tracking-widest uppercase text-ink-muted leading-snug">
          {project.type} · {project.year} · {project.role}
        </span>
        <button
          onClick={onClose}
          aria-label="Close project details"
          className="shrink-0 text-ink-muted hover:text-ink-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal rounded"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <h3 className="font-display text-h3 leading-tight tracking-tighter text-ink-primary">
        {project.title}
      </h3>

      <p className="text-ink-secondary text-sm leading-body">{project.impact}</p>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border border-rule text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 font-mono text-micro tracking-widest uppercase text-accent-signal hover:opacity-80 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal rounded"
        >
          View project →
        </a>
      )}
    </motion.div>
  );
}
