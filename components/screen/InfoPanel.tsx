'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { screen, sectionHeads, site, type ScreenPanelId } from '@/content/copy';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';

const variants = {
  backdrop: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  card: {
    hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  reduced: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

interface Props {
  id: ScreenPanelId;
  onClose: () => void;
  reducedMotion: boolean;
}

export function InfoPanel({ id, onClose, reducedMotion }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const head = sectionHeads[id];

  // Move focus into the panel so keyboard and screen reader users land on it
  useEffect(() => {
    headingRef.current?.focus();
  }, [id]);

  return (
    <motion.div
      className="mbp__overlay"
      variants={variants.backdrop}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: reducedMotion ? 0.2 : 0.36, ease: EASE_OUT_SOFT }}
      onClick={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`panel-${id}`}
        className="mbp__panel"
        variants={reducedMotion ? variants.reduced : variants.card}
        transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: EASE_OUT_SOFT }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h2
              id={`panel-${id}`}
              ref={headingRef}
              tabIndex={-1}
              className="max-w-[22ch] text-[clamp(1.5rem,3.2cqi,2.5rem)] font-medium leading-tight tracking-tighter outline-none"
            >
              {head.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="hud hud-btn shrink-0">
            [Esc] {screen.closeLabel}
          </button>
        </header>

        {id === 'contact' && <ContactBody />}
      </motion.section>
    </motion.div>
  );
}

function ContactBody() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${site.email}`}
          className="font-hud text-[clamp(1.1rem,2.6cqi,2rem)] tracking-tight text-ink-primary underline decoration-rule underline-offset-[6px] transition-colors hover:decoration-accent-signal"
        >
          {site.email}
        </a>
        <button type="button" onClick={copy} className="hud hud-btn" aria-live="polite">
          [{copied ? screen.copiedLabel : screen.copyLabel}]
        </button>
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {site.social
          .filter((s) => !s.href.startsWith('mailto:'))
          .map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer" className="hud hud-link">
                {s.label} ↗
              </a>
            </li>
          ))}
      </ul>
    </div>
  );
}
