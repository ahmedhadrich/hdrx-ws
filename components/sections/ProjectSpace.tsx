'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Loader } from '@/components/ui/Loader';
import { sectionHeads } from '@/content/copy';
import { projects, type Project } from '@/content/projects';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useTheme } from '@/lib/hooks/useTheme';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';

function SceneLoader() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-bg-raised">
      <Loader label="Loading 3D project space" />
    </div>
  );
}

const ProjectScene = dynamic(
  () => import('@/components/three/ProjectScene').then((m) => m.ProjectScene),
  { ssr: false, loading: () => <SceneLoader /> }
);

const FallbackScene = dynamic(
  () => import('@/components/three/FallbackScene').then((m) => m.FallbackScene),
  { ssr: false, loading: () => <SceneLoader /> }
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
  useEffect(() => {
    setWebgl(detectWebGL());
  }, []);

  const useFallback = !webgl || isCoarse || isNarrow || reducedMotion;

  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <section id="space" className="section relative">
      <Container>
        <SectionHeader {...sectionHeads.space} />

        <div className="mt-16 relative">
          <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-rule bg-bg-raised">
            {useFallback ? (
              <FallbackScene onSelect={setSelected} selectedSlug={selected?.slug ?? null} />
            ) : (
              <ProjectScene
                onSelect={setSelected}
                selectedSlug={selected?.slug ?? null}
                theme={theme}
              />
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-4 left-4 font-mono text-micro tracking-widest uppercase text-ink-muted"
            >
              {useFallback ? 'Hover · Tap to select' : 'Hover · Click to focus'}
            </div>

            <a
              href="#capabilities"
              className="skip-link"
              aria-label="Skip 3D project space"
            >
              Skip section
            </a>
          </div>

          <AnimatePresence mode="wait">
            {selected && <ProjectMeta project={selected} key={selected.slug} />}
          </AnimatePresence>

          <ul className="sr-only" aria-label="Projects in 3D space">
            {projects.map((p) => (
              <li key={p.slug}>
                <button onClick={() => setSelected(p)}>
                  {p.title} — {p.role}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function ProjectMeta({ project }: { project: Project }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE_OUT_SOFT }}
      className="mt-8 max-w-3xl flex flex-col gap-3"
    >
      <span className="font-mono text-micro tracking-widest uppercase text-ink-muted">
        {project.type} · {project.year} · {project.role}
      </span>
      <h3 className="font-display text-h2 tracking-tighter">{project.title}</h3>
      <p className="text-ink-secondary leading-body">{project.impact}</p>
    </motion.div>
  );
}
