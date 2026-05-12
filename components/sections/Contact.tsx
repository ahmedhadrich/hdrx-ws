'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { contact, sectionHeads, site } from '@/content/copy';
import { fadeUp, EASE_OUT_SOFT } from '@/lib/utils/motion';

export function Contact() {
  return (
    <section id="contact" className="section">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.1 }}
          className="flex flex-col gap-10 max-w-4xl"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: EASE_OUT_SOFT }}>
            <Eyebrow>{sectionHeads.contact.eyebrow}</Eyebrow>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
            className="font-display text-h1 leading-tight tracking-tighter text-balance"
          >
            {sectionHeads.contact.title}
          </motion.h2>

          <motion.a
            variants={fadeUp}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
            href={`mailto:${site.email}`}
            className="group inline-flex items-center gap-4 self-start font-mono text-2xl md:text-4xl text-ink-primary border-b border-rule pb-3 hover:border-ink-primary transition-colors duration-300"
          >
            <span>{site.email}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              →
            </span>
          </motion.a>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
            className="text-ink-secondary text-lg max-w-prose"
          >
            {contact.closer}
          </motion.p>

          <motion.ul
            variants={fadeUp}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
            className="flex flex-wrap gap-6 mt-2"
          >
            {site.social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-micro tracking-widest uppercase text-ink-secondary hover:text-ink-primary transition-colors duration-200"
                >
                  {s.label} ↗
                </a>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </Container>
    </section>
  );
}
