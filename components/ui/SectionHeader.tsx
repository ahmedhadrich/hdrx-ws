'use client';

import { motion } from 'framer-motion';
import { Eyebrow } from './Eyebrow';
import { cn } from '@/lib/utils/cn';
import { fadeUp, EASE_OUT_SOFT } from '@/lib/utils/motion';

interface Props {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({ eyebrow, title, sub, align = 'left', className }: Props) {
  return (
    <motion.header
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: EASE_OUT_SOFT, staggerChildren: 0.08 }}
      className={cn(
        'flex flex-col gap-4 max-w-prose',
        align === 'center' && 'mx-auto items-center text-center',
        className
      )}
    >
      <motion.div variants={fadeUp}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="font-display text-h1 leading-tight tracking-tighter text-balance"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          variants={fadeUp}
          className="text-ink-secondary leading-body max-w-prose"
        >
          {sub}
        </motion.p>
      )}
    </motion.header>
  );
}
