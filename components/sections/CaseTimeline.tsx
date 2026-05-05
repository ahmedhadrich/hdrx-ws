'use client';

import { useRef } from 'react';
import { Container } from '@/components/ui/Container';
import type { CaseStudy } from '@/content/projects';

export function CaseTimeline({ study }: { study: CaseStudy }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - trackRef.current.getBoundingClientRect().left;
    scrollStart.current = trackRef.current.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.getBoundingClientRect().left;
    trackRef.current.scrollLeft = scrollStart.current - (x - startX.current) * 1.5;
  };

  const stopDrag = () => { isDragging.current = false; };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!trackRef.current) return;
    isDragging.current = true;
    startX.current = e.touches[0].pageX;
    scrollStart.current = trackRef.current.scrollLeft;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    const walk = (startX.current - e.touches[0].pageX) * 1.5;
    trackRef.current.scrollLeft = scrollStart.current + walk;
  };

  return (
    <section className="pt-[3.75rem] pb-[7.5rem] overflow-hidden">
      <Container>
        <h2 className="font-display text-h1 font-light tracking-tighter text-center">
          Project Timeline
        </h2>

        <div className="flex justify-between items-center border-b border-rule py-3 mt-16">
          <span className="font-mono text-micro tracking-widest uppercase text-ink-muted">phases</span>
          <span className="font-mono text-micro tracking-widest uppercase text-ink-muted">
            {String(study.phases.length).padStart(2, '0')}
          </span>
        </div>
      </Container>

      {/* Drag-scrollable track — full bleed */}
      <div
        ref={trackRef}
        className="overflow-x-auto cursor-grab active:cursor-grabbing select-none"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={stopDrag}
      >
        <div
          className="flex"
          style={{ gap: '1.75rem', padding: '1.75rem clamp(1.25rem, 4vw, 3rem)', paddingRight: 'clamp(1.25rem, 4vw, 3rem)' }}
        >
          {study.phases.map((phase) => (
            <div
              key={phase.num}
              className="flex-none flex flex-col justify-between overflow-hidden rounded-sm border border-rule bg-bg-raised transition-colors duration-300 hover:border-ink-muted"
              style={{ width: '23.75rem', height: '23.75rem' }}
            >
              {/* Number */}
              <div className="px-4 pt-4 pb-3 border-b border-rule">
                <span className="font-mono text-micro tracking-wide text-ink-muted">{phase.num}</span>
              </div>

              {/* Title + description + icon */}
              <div className="flex flex-col items-center justify-end flex-1 p-6 gap-4 text-center">
                <h3 className="font-display font-light tracking-tighter leading-tight text-[2rem]">
                  {phase.title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-ink-secondary">
                  {phase.description}
                </p>
                <svg
                  width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="text-ink-muted mt-1"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8M14 8l4 4-4 4" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
