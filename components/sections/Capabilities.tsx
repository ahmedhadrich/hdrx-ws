'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { capabilities, sectionHeads } from '@/content/copy';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export function Capabilities() {
  return (
    <section id="capabilities" className="section">
      <Container>
        <SectionHeader {...sectionHeads.capabilities} />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {Object.entries(capabilities).map(([group, items], gi) => (
            <motion.div
              key={group}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ staggerChildren: 0.05, delayChildren: gi * 0.1 }}
              className="flex flex-col gap-4"
            >
              <motion.h3
                variants={itemVariants}
                transition={{ duration: 0.6, ease: EASE_OUT_SOFT }}
                className="font-mono text-micro tracking-widest uppercase text-ink-muted flex items-center gap-3"
              >
                <span className="block w-6 h-px bg-rule" />
                {group}
              </motion.h3>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <motion.li
                    key={item}
                    variants={itemVariants}
                    transition={{ duration: 0.5, ease: EASE_OUT_SOFT }}
                    className="font-display text-h3 tracking-tighter text-ink-primary leading-tight"
                  >
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
