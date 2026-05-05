'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { about, sectionHeads } from '@/content/copy';
import { fadeUp, EASE_OUT_SOFT } from '@/lib/utils/motion';

export function About() {
  return (
    <section id="about" className="section">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <SectionHeader {...sectionHeads.about} />
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
            className="lg:col-span-7 flex flex-col gap-8 max-w-prose"
          >
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
              className="text-lg md:text-xl leading-body text-ink-primary"
            >
              {about.paragraphs[0]}
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
              className="flex items-center gap-4"
              aria-hidden="true"
            >
              <span className="block flex-1 h-px bg-rule" />
              <span className="font-display text-2xl text-accent-signal">{about.glyph}</span>
              <span className="block flex-1 h-px bg-rule" />
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
              className="text-lg md:text-xl leading-body text-ink-secondary"
            >
              {about.paragraphs[1]}
            </motion.p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
