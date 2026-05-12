'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects, type Project } from '@/content/projects';
import { cn } from '@/lib/utils/cn';

interface Props {
  onSelect: (project: Project | null) => void;
  onFocus: (index: number) => void;
  selectedSlug: string | null;
  entered: boolean;
  focusedIndex: number;
}

export function FallbackScene({
  onSelect,
  onFocus,
  selectedSlug,
  entered,
  focusedIndex,
}: Props) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entered) {
      setMouse({ x: 0, y: 0 });
      return;
    }
    function handleMove(e: MouseEvent) {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setMouse({
        x: (e.clientX - cx) / (rect.width / 2),
        y: (e.clientY - cy) / (rect.height / 2),
      });
    }
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [entered]);

  const perspective = entered ? 900 : 1400;

  const total = projects.length;
  const layouts = projects.map((p, i) => {
    const t = total > 1 ? i / (total - 1) : 0.5;
    const angle = -55 + t * 110;
    const radians = (angle * Math.PI) / 180;
    const radius = entered ? 280 : 340;
    return {
      p,
      i,
      tx: Math.sin(radians) * radius,
      tz: -Math.cos(radians) * radius + radius * 0.5,
      ry: -angle * 0.4,
      ty: i % 2 === 0 ? 10 : -10,
    };
  });

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(255,90,31,0.06) 0%, transparent 70%), var(--bg-base)',
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: `${perspective}px`,
          perspectiveOrigin: '50% 50%',
          transform: entered
            ? `rotateX(${-mouse.y * 3}deg) rotateY(${mouse.x * 3}deg)`
            : 'none',
          transition: entered ? 'none' : 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          transformStyle: 'preserve-3d',
        }}
      >
        {layouts.map(({ p, i, tx, ty, tz, ry }) => (
          <FallbackPanel
            key={p.slug}
            project={p}
            index={i}
            tx={tx}
            ty={ty}
            tz={tz}
            ry={ry}
            selected={selectedSlug === p.slug}
            focused={focusedIndex === i}
            dimmed={entered && focusedIndex !== -1 && focusedIndex !== i}
            entered={entered}
            onSelect={onSelect}
            onFocus={onFocus}
          />
        ))}
      </div>
    </div>
  );
}

interface PanelProps {
  project: Project;
  index: number;
  tx: number;
  ty: number;
  tz: number;
  ry: number;
  selected: boolean;
  focused: boolean;
  dimmed: boolean;
  entered: boolean;
  onSelect: (p: Project | null) => void;
  onFocus: (index: number) => void;
}

function FallbackPanel({
  project,
  index,
  tx,
  ty,
  tz,
  ry,
  selected,
  focused,
  dimmed,
  entered,
  onSelect,
  onFocus,
}: PanelProps) {
  const [hover, setHover] = useState(false);
  const lifted = hover || selected || focused;

  const interactive = entered;

  // Extra Z push for the focused panel so it reads as "zoomed"
  const tzOffset = focused ? 100 : lifted ? 70 : 0;
  const scale = focused ? 1.1 : lifted ? 1.05 : entered ? 1.0 : 0.92;
  const opacity = dimmed ? 0.45 : entered ? 1 : 0.45;

  return (
    <button
      type="button"
      onClick={
        interactive
          ? () => {
              onFocus(index);
              onSelect(selected ? null : project);
            }
          : undefined
      }
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      onFocus={interactive ? () => setHover(true) : undefined}
      onBlur={interactive ? () => setHover(false) : undefined}
      tabIndex={interactive ? 0 : -1}
      aria-label={`${project.title} — ${project.role}`}
      aria-disabled={!interactive}
      className={cn(
        'absolute top-1/2 left-1/2',
        'w-[260px] aspect-[16/10] rounded-xl overflow-hidden border border-rule',
        'will-change-transform',
        interactive
          ? 'transition-all duration-500 ease-out-soft'
          : 'transition-all duration-700 ease-out-soft',
        interactive ? 'cursor-pointer' : 'cursor-default'
      )}
      style={{
        transformStyle: 'preserve-3d',
        opacity,
        transform: `
          translate(-50%, -50%)
          translate3d(${tx}px, ${ty}px, ${tz + tzOffset}px)
          rotateY(${ry}deg)
          scale(${scale})
        `,
        boxShadow: lifted
          ? `0 32px 64px rgba(0,0,0,0.45), 0 0 0 1.5px ${project.accent ?? '#FF5A1F'}80`
          : entered
          ? '0 12px 32px rgba(0,0,0,0.28)'
          : '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      <img
        src={project.thumbnail}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Hover / focus title label */}
      <AnimatePresence>
        {interactive && lifted && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent"
          >
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/70 block mb-0.5">
              {project.type}
            </span>
            <span className="font-display text-sm leading-tight text-white block">
              {project.title}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
