'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  siFramer,
  siNeon,
  siNextdotjs,
  siPrisma,
  siSolana,
  siThreedotjs,
  siWebflow,
  siWebgl,
  type SimpleIcon,
} from 'simple-icons';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';

// Project tags that have a logo. Tags without one (e.g. "Web design") stay off the dock.
const TECH_ICONS: Record<string, SimpleIcon> = {
  'Next.js': siNextdotjs,
  'Framer Motion': siFramer,
  Prisma: siPrisma,
  NeonDB: siNeon,
  Webflow: siWebflow,
  'Three.js': siThreedotjs,
  WebGL: siWebgl,
  Solana: siSolana,
};

const variants = {
  tile: {
    hidden: { opacity: 0, scale: 0.6 },
    visible: { opacity: 1, scale: 1 },
  },
};

interface Props {
  tags: readonly string[];
  reducedMotion: boolean;
}

// What the centred project was built with. Contact lives in the menu bar.
export function Dock({ tags, reducedMotion }: Props) {
  const tech = tags.filter((t) => TECH_ICONS[t]);
  // No logo tags: no empty glass pill
  if (tech.length === 0) return null;

  return (
    <nav aria-label="Built with" className="dock">
      <ul className="dock__group">
        <AnimatePresence mode="popLayout" initial={false}>
          {tech.map((t) => (
            <motion.li
              key={t}
              layout={!reducedMotion}
              variants={variants.tile}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: reducedMotion ? 0.2 : 0.32, ease: EASE_OUT_SOFT }}
            >
              {/* Focusable so keyboard users can still read the label */}
              <span className="dock__tile" tabIndex={0} role="img" aria-label={t}>
                <svg viewBox="0 0 24 24" className="dock__logo" aria-hidden="true">
                  <path d={TECH_ICONS[t].path} />
                </svg>
                <span className="dock__label" aria-hidden="true">
                  {t}
                </span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </nav>
  );
}
