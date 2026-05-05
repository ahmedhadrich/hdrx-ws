'use client';

import { motion } from 'framer-motion';
import { useIntro } from '@/lib/hooks/useIntro';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import type { ReactNode } from 'react';

interface MainWrapperProps {
  children: ReactNode;
  id?: string;
}

// Easing: Expo out — the "landing" deceleration
const EASE_EXPO_OUT = [0.215, 0.61, 0.355, 1.0] as const;

export function MainWrapper({ children, id }: MainWrapperProps) {
  const { introComplete } = useIntro();
  const reducedMotion = useReducedMotion();

  // With reduced-motion or if intro was already skipped: render immediately
  if (reducedMotion) {
    return (
      <main id={id} className="relative z-10">
        {children}
      </main>
    );
  }

  return (
    <motion.main
      id={id}
      className="relative z-10"
      initial={{ y: '6%', scale: 1.04, opacity: 0 }}
      animate={
        introComplete
          ? { y: '0%', scale: 1, opacity: 1 }
          : { y: '6%', scale: 1.04, opacity: 0 }
      }
      transition={{
        duration: 1.2,
        ease: EASE_EXPO_OUT,
      }}
    >
      {children}
    </motion.main>
  );
}
