'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { projects, type Project } from '@/content/projects';
import { screen, type ScreenPanelId } from '@/content/copy';
import { useTheme } from '@/lib/hooks/useTheme';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';
import { cn } from '@/lib/utils/cn';
import { GlassShader } from './GlassShader';
import { CssCarousel } from './CssCarousel';
import { InfoPanel } from './InfoPanel';
import { Dock } from './Dock';
import { MenuBar } from './MenuBar';
import { TimeControl } from './TimeControl';
import { startParallax } from './room/parallax';
import type { Zoom } from './MacbookWorld';
import { DISPLAY_PX } from '@/components/three/display';

const WorkCarousel = dynamic(() => import('./WorkCarousel'), { ssr: false });
const MacbookWorld = dynamic(() => import('./MacbookWorld'), { ssr: false });
const RoomScene = dynamic(() => import('./room/RoomScene'), { ssr: false });

const BOOT_MS = 900;
// How long the closed lid holds while the H lights up (counted from model loaded)
const LOGO_HOLD_MS = 2100;
// Fall back to the flat screen if the 3D model hasn't loaded by then
const LOAD_TIMEOUT_MS = 8000;

const variants = {
  hud: {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.08 * i, ease: EASE_OUT_SOFT },
    }),
  },
  caption: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  reduced: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0 },
  },
};

type Boot = 'pending' | 'booting' | 'on';
type Intro = 'pending' | 'loading' | 'closed' | 'opening' | 'open';
// 3d: the MacBook model is the frame for good. flat: phones / no WebGL / model failed.
type Mode = 'pending' | '3d' | 'flat';

// Case study when one exists, otherwise the live site.
function projectTarget(p: Project): { href: string; external: boolean } | null {
  if (p.caseStudy) return { href: `/work/${p.slug}`, external: false };
  if (p.link) return { href: p.link, external: true };
  return null;
}

export function MacbookStage() {
  const router = useRouter();
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const isCoarse = useMediaQuery('(pointer: coarse)');
  const isNarrow = useMediaQuery('(max-width: 767px)');

  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [intro, setIntro] = useState<Intro>('pending');
  const [mode, setMode] = useState<Mode>('pending');
  const [zoom, setZoom] = useState<Zoom>('in');
  // Read by the gesture handlers without re-binding them on every zoom change
  const zoomRef = useRef<Zoom>('in');
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  const skipIntro = useRef(false);
  // The live screen, warped onto the 3D display every frame by MacbookWorld
  const overlayRef = useRef<HTMLDivElement>(null);
  const [boot, setBoot] = useState<Boot>('pending');
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [panel, setPanel] = useState<ScreenPanelId | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const dark = theme === 'dark';
  const useFallback = !webgl || isCoarse || isNarrow || reducedMotion;
  // Phones and touch keep the soft blobs: the 3D room is a desktop treat
  const showRoom = mounted && webgl && !isCoarse && !isNarrow;
  const rootRef = useRef<HTMLDivElement>(null);
  const project = projects[active];
  const target = projectTarget(project);

  const endIntro = useCallback((thenBoot: Boot) => {
    setIntro('open');
    setBoot((b) => (b === 'pending' ? thenBoot : b));
  }, []);

  const fallBackToFlat = useCallback(() => {
    setMode('flat');
    endIntro('on');
  }, [endIntro]);

  // ---- mount: WebGL probe + boot sequence (every visit) ----
  useEffect(() => {
    setMounted(true);
    let hasWebgl = false;
    try {
      const c = document.createElement('canvas');
      hasWebgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      hasWebgl = false;
    }
    setWebgl(hasWebgl);

    // Phones have no room for a laptop: flat full-screen glass
    if (!hasWebgl || window.matchMedia('(max-width: 767px)').matches) {
      fallBackToFlat();
      return;
    }

    // 3D MacBook: load, H lights up on the closed lid, lid swings open. Plays on every visit;
    // reduced motion still gets the model, just already open. Any click or key skips it.
    skipIntro.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMode('3d');
    setIntro('loading');
  }, [fallBackToFlat]);

  // Model never arrived: don't hold the visitor on an empty room
  useEffect(() => {
    if (intro !== 'loading') return;
    const id = setTimeout(fallBackToFlat, LOAD_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [intro, fallBackToFlat]);

  useEffect(() => {
    if (intro !== 'closed') return;
    const id = setTimeout(() => setIntro((i) => (i === 'closed' ? 'opening' : i)), LOGO_HOLD_MS);
    return () => clearTimeout(id);
  }, [intro]);

  const onWorldReady = useCallback(() => {
    if (skipIntro.current) endIntro('on');
    else setIntro((i) => (i === 'loading' ? 'closed' : i));
  }, [endIntro]);

  const onIntroDone = useCallback(() => endIntro('booting'), [endIntro]);

  // Room camera + MacBook tilt follow the pointer, only once the intro is over.
  useEffect(() => {
    if (intro !== 'open' || !showRoom || reducedMotion) return;
    return startParallax(rootRef.current);
  }, [intro, showRoom, reducedMotion]);

  // Any click or key during the intro jumps straight to the live screen
  useEffect(() => {
    if (intro !== 'loading' && intro !== 'closed' && intro !== 'opening') return;
    const skip = () => endIntro('on');
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [intro, endIntro]);

  // Screen power-on progress, after the lid is open
  useEffect(() => {
    if (boot !== 'booting') return;
    const start = performance.now();
    let raf = 0;
    let done = 0;
    const tick = () => {
      const t = Math.min((performance.now() - start) / BOOT_MS, 1);
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else done = window.setTimeout(() => setBoot('on'), 180);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [boot]);

  // ---- navigation ----
  const go = useCallback((delta: number) => {
    setActive((a) => Math.min(Math.max(a + delta, 0), projects.length - 1));
  }, []);

  const openActive = useCallback(() => {
    const t = projectTarget(projects[active]);
    if (!t) return;
    if (t.external) window.open(t.href, '_blank', 'noopener,noreferrer');
    else router.push(t.href);
  }, [router, active]);

  const pick = useCallback(
    (i: number) => {
      if (i === active) openActive();
      else setActive(i);
    },
    [active, openActive],
  );

  const openPanel = (id: ScreenPanelId, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setPanel(id);
  };

  const closePanel = useCallback(() => {
    setPanel(null);
    // Return focus to whatever opened the panel
    requestAnimationFrame(() => lastTrigger.current?.focus());
  }, []);

  useEffect(() => {
    const t = projectTarget(projects[active]);
    if (t && !t.external) router.prefetch(t.href);
  }, [router, active]);

  // ---- keyboard: arrows browse, Enter opens, Esc closes panels ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (panel) {
        if (e.key === 'Escape') closePanel();
        return;
      }
      // Esc steps back from the screen to the whole room
      if (e.key === 'Escape') {
        setZoom('out');
        return;
      }
      // Zoomed out, the screen is something to look at, not to use
      if (zoomRef.current === 'out') return;
      const target = e.target as HTMLElement;
      const onControl = target.closest('a, button, input, textarea, select');
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Enter' && !onControl) {
        openActive();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, go, openActive, closePanel]);

  // ---- wheel / trackpad and drag / swipe, one step per gesture ----
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let acc = 0;
    let lockUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (panel || zoomRef.current === 'out') return;
      e.preventDefault();
      const now = performance.now();
      if (now < lockUntil) return;
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(acc) > 40) {
        go(acc > 0 ? 1 : -1);
        acc = 0;
        lockUntil = now + 420;
      }
    };
    let downX: number | null = null;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      if (downX === null || zoomRef.current === 'out') {
        downX = null;
        return;
      }
      const dx = e.clientX - downX;
      downX = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [panel, go]);

  const on = boot === 'on';
  const hudV = reducedMotion ? variants.reduced : variants.hud;

  // The live screen. Shared by both modes: inside the flat lid, or warped onto the 3D display.
  const display = (
    <div className="mbp__display">
      {/* ---------- HUD: header ---------- */}
      <motion.header className="mbp__head menubar" initial="hidden" animate={on ? 'visible' : 'hidden'}>
        <MenuBar variants={hudV} onContact={(trigger) => openPanel('contact', trigger)} />
      </motion.header>

      {/* ---------- Work carousel ---------- */}
      <div
        ref={stageRef}
        className="mbp__stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Selected work"
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: on ? 1 : 0 }}
          transition={{
            duration: reducedMotion ? 0.2 : 0.9,
            ease: EASE_OUT_SOFT,
          }}
        >
          {mounted &&
            (useFallback ? (
              <CssCarousel active={active} onPick={pick} />
            ) : (
              <WorkCarousel active={active} onPick={pick} dark={dark} />
            ))}
        </motion.div>

        {on && (
          <>
            <button
              type="button"
              className="mbp__arrow mbp__arrow--prev"
              onClick={() => go(-1)}
              disabled={active === 0}
              aria-label={screen.prevLabel}
            >
              ←
            </button>
            <button
              type="button"
              className="mbp__arrow mbp__arrow--next"
              onClick={() => go(1)}
              disabled={active === projects.length - 1}
              aria-label={screen.nextLabel}
            >
              →
            </button>
          </>
        )}
      </div>

      {/* ---------- Caption for the centred project ---------- */}
      <div className="mbp__caption" aria-live="polite">
        <AnimatePresence mode="wait">
          {on && (
            <motion.div
              key={project.slug}
              variants={reducedMotion ? variants.reduced : variants.caption}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
            >
              {target ? (
                <Link
                  href={target.href}
                  className="hud hud-link text-ink-secondary"
                  {...(target.external && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                >
                  {project.title} · {target.external ? screen.visitLabel : screen.openLabel} ↗
                </Link>
              ) : (
                <p className="hud text-ink-secondary">{project.title}</p>
              )}
              <p className="mbp__impact">{project.impact}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- HUD: footer ---------- */}
      <motion.footer className="mbp__foot" initial="hidden" animate={on ? 'visible' : 'hidden'}>
        <motion.div variants={hudV} custom={3}>
          <Dock tags={project.tags} reducedMotion={reducedMotion} />
        </motion.div>
      </motion.footer>

      {/* ---------- Boot ---------- */}
      <AnimatePresence>
        {boot === 'booting' && (
          <motion.div
            className="mbp__boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            aria-hidden="true"
          >
            <div className="flex justify-between">
              <span className="hud">{screen.bootLabel}</span>
              <span className="hud tabular-nums">{progress}</span>
            </div>
            <div className="mbp__bootbar">
              <span style={{ transform: `scaleX(${progress / 100})` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Glass surface + panels ---------- */}
      <GlassShader dark={dark} reducedMotion={reducedMotion} />

      <AnimatePresence>
        {panel && <InfoPanel key={panel} id={panel} onClose={closePanel} reducedMotion={reducedMotion} />}
      </AnimatePresence>
    </div>
  );

  return (
    <div ref={rootRef} className={cn('mbp', intro !== 'open' && 'is-intro', showRoom && 'has-room')}>
      <div className="mbp__room" aria-hidden="true">
        {/* In 3D mode the room is drawn by MacbookWorld, with the MacBook standing in it.
            While loading (and in 3D) this layer stays empty, just the dark room colour,
            so the world can fade in from black instead of cutting in over the blobs. */}
        {mode === 'flat' &&
          (showRoom ? (
            <RoomScene still={reducedMotion} />
          ) : (
            <>
              <div className="mbp__blob mbp__blob--a" />
              <div className="mbp__blob mbp__blob--b" />
              <div className="mbp__blob mbp__blob--c" />
            </>
          ))}
      </div>

      {mode === 'flat' && (
        <div className="mbp__rig">
          <div className="mbp__device">
            <div className="mbp__lid">
              <div className="mbp__notch" aria-hidden="true">
                <span className="mbp__cam" />
              </div>
              {display}
            </div>
            <div className="mbp__base" aria-hidden="true" />
          </div>
        </div>
      )}

      {mode === '3d' && (
        <>
          <MacbookWorld
            phase={intro === 'pending' ? 'loading' : intro}
            zoom={zoom}
            reducedMotion={reducedMotion}
            withRoom={showRoom}
            overlay={overlayRef}
            onReady={onWorldReady}
            onIntroDone={onIntroDone}
            onZoomIn={() => setZoom('in')}
            onError={fallBackToFlat}
          />
          <div
            ref={overlayRef}
            className="mbp__screen3d"
            // Inline, not just in CSS: the warp in MacbookWorld assumes exactly this box and origin
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              zIndex: 2,
              width: DISPLAY_PX.width,
              height: DISPLAY_PX.height,
              transformOrigin: '0 0',
              visibility: 'hidden',
              cursor: zoom === 'out' ? 'zoom-in' : undefined,
            }}
            // Zoomed out, a click on the screen zooms in instead of reaching the site
            onClickCapture={(e) => {
              if (zoom !== 'out') return;
              e.preventDefault();
              e.stopPropagation();
              setZoom('in');
            }}
          >
            {display}
            <span className="mbp__screen-notch" aria-hidden="true" />
          </div>
          {on && (
            <button
              type="button"
              className="mbp__zoom hud"
              onClick={() => setZoom((z) => (z === 'in' ? 'out' : 'in'))}
              aria-pressed={zoom === 'out'}
            >
              {zoom === 'in' ? screen.zoomOutLabel : screen.zoomInLabel}
            </button>
          )}
          {/* Room lighting, out in the room under the plinth: only once the intro is done and
              only zoomed out, where the plinth is in view and it can't cover the screen */}
          <AnimatePresence>
            {on && showRoom && zoom === 'out' && <TimeControl key="time" reducedMotion={reducedMotion} />}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
