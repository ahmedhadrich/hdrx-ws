'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { projects } from '@/content/projects';
import { cn } from '@/lib/utils/cn';
import { FAN_VISIBLE, fanPose } from './fan';

// Fallback for touch, small screens, reduced motion and no-WebGL.
// Same fan layout as the WebGL version, built from CSS transforms.
interface Props {
  active: number;
  onPick: (index: number) => void;
}

export function CssCarousel({ active, onPick }: Props) {
  return (
    <div className="fan">
      {projects.map((p, i) => {
        const pose = fanPose(i - active);
        const hidden = pose.dist > FAN_VISIBLE;
        const near = Math.min(pose.dist, 1);
        const style = {
          '--x': pose.x,
          '--y': pose.y,
          '--r': `${pose.angle}rad`,
          '--z': -pose.dist * 60,
          opacity: hidden ? 0 : Math.max(1 - pose.dist * 0.3, 0.15),
          filter: `grayscale(${near * 0.85}) brightness(${1 - near * 0.4})`,
          zIndex: 10 - Math.round(pose.dist),
        } as CSSProperties;

        return (
          <button
            key={p.slug}
            type="button"
            className={cn('fan__card', i === active && 'is-active')}
            style={style}
            onClick={() => onPick(i)}
            tabIndex={hidden ? -1 : 0}
            aria-hidden={hidden || undefined}
            aria-label={p.title}
            aria-current={i === active || undefined}
          >
            <Image
              src={p.thumbnail}
              alt=""
              fill
              sizes="(max-width: 768px) 70vw, 32vw"
              className="fan__img"
              priority={i === active}
            />
          </button>
        );
      })}
    </div>
  );
}
