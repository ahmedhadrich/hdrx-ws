'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader } from '@/components/ui/Loader';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

/**
 * How long the loader stays up on each load/navigation, even when the page is
 * already ready. Long enough for the dot to trace a shape; short enough to feel
 * like a beat, not a wait. One full loader cycle is ~3s.
 */
const MIN_VISIBLE_MS = 1100;
const EASE_GLASS = [0.65, 0, 0.35, 1] as const;

/**
 * Client-side loading overlay. Unlike the route-level `loading.tsx` Suspense
 * fallbacks (which only appear while a segment is actually streaming), this
 * shows on the initial mount and on every pathname change with a guaranteed
 * minimum duration — so a loading beat is visible every time the page loads,
 * static routes included.
 *
 * On the first homepage visit the cinematic `IntroLoader` (z 9999) sits on top;
 * this overlay lives beneath it and takes over on subsequent loads/navigations.
 */
export function RouteLoader() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (reduced) {
      setActive(false);
      return;
    }
    setActive(true);
    const timer = setTimeout(() => setActive(false), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [pathname, reduced]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-loader"
          className="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_GLASS }}
        >
          <Loader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
