'use client';

import { useScroll, useTransform, motion, useSpring } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { projects, type Project } from '@/content/projects';
import { cn } from '@/lib/utils/cn';

interface Props {
  onSelect: (project: Project | null) => void;
  selectedSlug: string | null;
}

export function FallbackScene({ onSelect, selectedSlug }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'end start'],
  });

  const drift = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const driftSm = useSpring(drift, { stiffness: 60, damping: 18 });

  const layouts = useMemo(() => {
    const total = projects.length;
    return projects.map((p, i) => {
      const t = total > 1 ? i / (total - 1) : 0.5;
      const angle = -55 + t * 110;
      const radians = (angle * Math.PI) / 180;
      const radius = 320;
      return {
        p,
        tx: Math.sin(radians) * radius,
        tz: -Math.cos(radians) * radius + radius * 0.5,
        ry: -angle * 0.4,
        ty: i % 2 === 0 ? 8 : -8,
      };
    });
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full overflow-hidden glass"
      style={{ perspective: '1400px' }}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: driftSm }}
      >
        {layouts.map(({ p, tx, ty, tz, ry }) => (
          <FallbackPanel
            key={p.slug}
            project={p}
            tx={tx}
            ty={ty}
            tz={tz}
            ry={ry}
            selected={selectedSlug === p.slug}
            onSelect={onSelect}
          />
        ))}
      </motion.div>
    </div>
  );
}

interface PanelProps {
  project: Project;
  tx: number;
  ty: number;
  tz: number;
  ry: number;
  selected: boolean;
  onSelect: (p: Project | null) => void;
}

function FallbackPanel({ project, tx, ty, tz, ry, selected, onSelect }: PanelProps) {
  const [hover, setHover] = useState(false);
  const lifted = hover || selected;
  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : project)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={`${project.title} — ${project.role}`}
      className={cn(
        'absolute top-1/2 left-1/2 w-[280px] aspect-[16/10] rounded-lg overflow-hidden border border-rule',
        'transition-all duration-500 ease-out-soft will-change-transform'
      )}
      style={{
        transformStyle: 'preserve-3d',
        transform: `translate(-50%, -50%) translate3d(${tx}px, ${ty}px, ${tz + (lifted ? 60 : 0)}px) rotateY(${ry}deg) scale(${lifted ? 1.04 : 1})`,
        boxShadow: lifted
          ? `0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px ${project.accent ?? '#FF5A1F'}80`
          : '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      <img
        src={project.thumbnail}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    </button>
  );
}
