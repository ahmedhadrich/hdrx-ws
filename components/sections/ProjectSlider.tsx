'use client';

import { useEffect, useRef, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { sectionHeads } from '@/content/copy';
import { projects, type Project } from '@/content/projects';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

// Dark-tinted card color schemes — one per project, matched to its accent
const CARD_THEMES: Record<string, { bg: string; fg: string; muted: string }> = {
  meridian:  { bg: '#1E1408', fg: '#F0C898', muted: '#8A6840' },
  shoreline: { bg: '#081416', fg: '#9FD4D8', muted: '#3A7880' },
  ember:     { bg: '#160A08', fg: '#D4A090', muted: '#7A4030' },
  parallax:  { bg: '#16140E', fg: '#E8DCC4', muted: '#6C6040' },
  fold:      { bg: '#0C1018', fg: '#A8B8D4', muted: '#405070' },
  signal:    { bg: '#1A1008', fg: '#F0C080', muted: '#886030' },
};

const FALLBACK_THEME = { bg: '#13131A', fg: '#F4F4EE', muted: '#6A6A74' };

export function ProjectSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [hoveredDomIdx, setHoveredDomIdx] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;

    (async () => {
      const [{ gsap }, { Observer }] = await Promise.all([
        import('gsap'),
        import('gsap/Observer'),
      ]);

      if (cancelled) return;
      gsap.registerPlugin(Observer);

      const track = trackRef.current;
      if (!track) return;

      // Both groups are structurally identical; half = one group's width
      const half = track.offsetWidth / 2;
      const wrap = gsap.utils.wrap(-half, 0);

      let total = 0;
      let isAnimating = true;

      const xTo = gsap.quickTo(track, 'x', {
        duration: 0.5,
        ease: 'power3',
        modifiers: { x: gsap.utils.unitize(wrap) },
      });

      const tick = (_time: number, deltaTime: number) => {
        if (isAnimating) {
          total -= deltaTime / 10;
          xTo(total);
        }
      };
      gsap.ticker.add(tick);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obs = Observer.create({
        target: track,
        type: 'pointer,touch',
        onDragStart: () => track.classList.add('dragging'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onDrag: (self: any) => {
          total += self.deltaX;
          xTo(total);
        },
        onDragEnd: () => track.classList.remove('dragging'),
      });

      const onEnter = () => { isAnimating = false; };
      const onLeave = () => { isAnimating = true; };
      track.addEventListener('mouseenter', onEnter);
      track.addEventListener('mouseleave', onLeave);

      cleanupRef.current = () => {
        gsap.ticker.remove(tick);
        obs.kill();
        track.removeEventListener('mouseenter', onEnter);
        track.removeEventListener('mouseleave', onLeave);
      };
    })();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, [reducedMotion]);

  return (
    <section id="work" className="section overflow-hidden">
      <Container>
        <SectionHeader {...sectionHeads.work} />
      </Container>

      <div className="mt-16">
        {/*
         * Two structurally identical flex groups with padding-right matching the gap.
         * This makes each group's width = N×cardWidth + N×gap, so
         * half = track.offsetWidth / 2 lands exactly at the clone group's start.
         */}
        <div
          ref={trackRef}
          className="flex w-max [&.dragging_a]:pointer-events-none"
        >
          <div className="flex" style={{ gap: '1.5rem', paddingRight: '1.5rem' }}>
            {projects.map((project, i) => (
              <SliderCard
                key={project.slug}
                project={project}
                domIndex={i}
                projectIndex={i}
                hoveredDomIdx={hoveredDomIdx}
                onHover={setHoveredDomIdx}
              />
            ))}
          </div>
          <div className="flex" style={{ gap: '1.5rem', paddingRight: '1.5rem' }}>
            {projects.map((project, i) => (
              <SliderCard
                key={`${project.slug}-clone`}
                project={project}
                domIndex={projects.length + i}
                projectIndex={i}
                hoveredDomIdx={hoveredDomIdx}
                onHover={setHoveredDomIdx}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SliderCard({
  project,
  domIndex,
  projectIndex,
  hoveredDomIdx,
  onHover,
}: {
  project: Project;
  domIndex: number;
  projectIndex: number;
  hoveredDomIdx: number | null;
  onHover: (i: number | null) => void;
}) {
  const theme = CARD_THEMES[project.slug] ?? FALLBACK_THEME;
  const num = String(projectIndex + 1).padStart(2, '0');

  const spreadX =
    hoveredDomIdx === null
      ? '0px'
      : domIndex < hoveredDomIdx
      ? '-1rem'
      : domIndex > hoveredDomIdx
      ? '1rem'
      : '0px';

  return (
    <div
      className="flex-none w-72 h-[26rem] md:w-[38.125rem] md:h-[44rem]"
      style={{
        transform: `translateX(${spreadX})`,
        transition: 'transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)',
        willChange: 'transform',
      }}
      onMouseEnter={() => onHover(domIndex)}
      onMouseLeave={() => onHover(null)}
    >
      <a
        href={`/work/${project.slug}`}
        aria-label={`${project.title} — ${project.type}, ${project.year}`}
        className="block h-full"
        style={{ perspective: '1000px' }}
      >
        <div
          className="h-full flex flex-col overflow-hidden"
          style={{
            background: theme.bg,
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Top: title (left) + impact + arrow (right) */}
          <div
            className="flex gap-4 p-6 md:pt-[3.3rem] md:px-8 md:pb-[2.75rem] flex-col md:flex-row md:justify-between"
            style={{ color: theme.fg, flexShrink: 0 }}
          >
            {/* Left: title + number */}
            <div className="flex flex-col justify-between flex-1">
              <h3
                className="font-display leading-none tracking-tight"
                style={{
                  fontSize: 'clamp(1.5rem, 2.5rem, 2.5rem)',
                  fontWeight: 300,
                  color: theme.fg,
                  maxWidth: '18.5rem',
                }}
              >
                {project.title}
              </h3>
              <span
                className="font-mono text-micro mt-3 block"
                style={{ color: theme.muted, letterSpacing: '0.06em' }}
              >
                {num}
              </span>
            </div>

            {/* Right: impact text + circle-arrow */}
            <div
              className="flex md:flex-col justify-between items-start gap-4 md:gap-0 md:flex-shrink-0"
              style={{ width: undefined }}
            >
              <p
                className="font-sans text-micro leading-relaxed md:w-[13.375rem]"
                style={{ color: theme.muted }}
              >
                {project.impact}
              </p>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.muted}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 md:mt-auto md:self-end"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M14 8l4 4-4 4" />
              </svg>
            </div>
          </div>

          {/* Thumbnail fills remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <img
              src={project.thumbnail}
              alt=""
              width={640}
              height={400}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </a>
    </div>
  );
}
