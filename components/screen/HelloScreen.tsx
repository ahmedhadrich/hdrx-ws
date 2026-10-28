'use client';

import Image, { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import { motion } from 'framer-motion';
import { screen } from '@/content/copy';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';

const variants = {
  photo: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT_SOFT } },
    exit: { opacity: 0, transition: { duration: 0.3, ease: EASE_OUT_SOFT } },
  },
  // The face rises into place a beat after the screen comes on: the one depth cue on load
  face: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.72, delay: 0.1, ease: EASE_OUT_SOFT } },
  },
  text: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.12, ease: EASE_OUT_SOFT } },
    // pointerEvents: the text is still in the DOM while it fades, don't let it eat clicks meant for the carousel
    exit: { opacity: 0, y: -8, pointerEvents: 'none' as const, transition: { duration: 0.3, ease: EASE_OUT_SOFT } },
  },
  reduced: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, pointerEvents: 'none' as const, transition: { duration: 0.2 } },
  },
};

// The face cut out on transparency, over the display's own glass. Sized against the display
// width (1512px laid out in 3D).
const SIZES = '(max-width: 767px) 100vw, 1512px';
// portrait.jpg with its grey backdrop cut out, cropped above the shirt print
const FACE = '/me/portrait-cut.webp';

// It mounts during the intro; preloading the same srcset means it's ready when the lid opens.
export function preloadPortrait() {
  const { props } = getImageProps({ src: FACE, sizes: SIZES, alt: '', fill: true });
  preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes });
}

interface Props {
  reducedMotion: boolean;
}

// The welcome portrait behind the stage, under the menu bar. Purely visual: the text and button
// live in HelloScreen, inside the stage, where the gesture handlers are.
// `revealed`: the screen is in view (lid opening or open). It mounts earlier so the images load,
// but the entrance waits, otherwise it would play out behind the closed lid.
export function HelloBackdrop({ reducedMotion, revealed }: Props & { revealed: boolean }) {
  return (
    <motion.div
      className="hello-photo"
      variants={reducedMotion ? variants.reduced : variants.photo}
      initial="hidden"
      animate={revealed ? 'visible' : 'hidden'}
      exit="exit"
    >
      <motion.div
        className="hello-photo__face"
        variants={reducedMotion ? undefined : variants.face}
      >
        <Image src={FACE} alt={screen.hello.portraitAlt} fill sizes={SIZES} className="hello-photo__img" />
      </motion.div>
    </motion.div>
  );
}

// Lives inside the stage (not beside it) so wheel / swipe on it reach the stage's gesture handlers.
export function HelloScreen({ onDismiss, reducedMotion }: Props & { onDismiss: () => void }) {
  const { hello } = screen;
  return (
    <div className="hello">
      <motion.section
        className="hello__text"
        aria-labelledby="hello-title"
        variants={reducedMotion ? variants.reduced : variants.text}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <h2 id="hello-title" className="hello__title">
          <span className="hello__greeting">{hello.greeting}</span>{' '}
          <span className="hello__name">{hello.name}</span>
        </h2>
        <p className="hello__role">{hello.role}</p>
        <motion.button
          type="button"
          className="hello__cta"
          onClick={onDismiss}
          whileHover={reducedMotion ? undefined : { scale: 1.03 }}
          whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <span>{hello.cta}</span>
          <span aria-hidden="true">→</span>
        </motion.button>
      </motion.section>
    </div>
  );
}
