'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { projects, projectTarget } from '@/content/projects';
import { screen, type ScreenPanelId } from '@/content/copy';
import { useTheme } from '@/lib/hooks/useTheme';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';
import { cn } from '@/lib/utils/cn';
import { MOBILE_QUERY } from '@/lib/utils/device';
import { GlassShader } from './GlassShader';
import { CssCarousel } from './CssCarousel';
import { InfoPanel } from './InfoPanel';
import { HelloBackdrop, HelloScreen, preloadPortrait } from './HelloScreen';
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
// Trailing wheel inertia / key repeat from the dismissing gesture must not step the carousel
const DISMISS_LOCK_MS = 450;
// How long the closed lid holds while the H lights up (counted from model loaded)
const LOGO_HOLD_MS = 2100;
// The hint carved in the plinth fades in once the camera has settled in the room: after the
// intro's pull-back (MacbookWorld T.introZoom), or after a later zoom out
const HINT_DELAY = { intro: 2.6, zoom: 1.1 };
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

type Hello = 'show' | 'done';
type Boot = 'pending' | 'booting' | 'on';
type Intro = 'pending' | 'loading' | 'closed' | 'opening' | 'open';
// 3d: the MacBook model is the frame for good. flat: phones / no WebGL / model failed.
type Mode = 'pending' | '3d' | 'flat';

export function MacbookStage() {
  const router = useRouter();
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  // Phones and tablets: just the screen, full-bleed. No MacBook, room, blobs or glass shader,
  // and the CSS fan instead of WebGL, so nothing renders between interactions.
  const isMobile = useMediaQuery(MOBILE_QUERY);

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
  // Has the visitor been in yet? Until then the hint waits for the intro's longer pull-back
  const [beenIn, setBeenIn] = useState(false);
  const skipIntro = useRef(false);
  // The live screen, warped onto the 3D display every frame by MacbookWorld
  const overlayRef = useRef<HTMLDivElement>(null);
  const [boot, setBoot] = useState<Boot>('pending');
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [panel, setPanel] = useState<ScreenPanelId | null>(null);
  // Welcome photo opens every page load, until dismissed
  const [hello, setHello] = useState<Hello>('show');
  const [justDismissed, setJustDismissed] = useState(false);
  const helloRef = useRef<Hello>('show');
  const cardUpRef = useRef(false);
  const dismissedAt = useRef(0);
  const refocusStage = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const dark = theme === 'dark';
  const useFallback = !webgl || isMobile || reducedMotion;
  const showRoom = mounted && webgl && !isMobile;
  const rootRef = useRef<HTMLDivElement>(null);
  const project = projects[active];
  const target = projectTarget(project);

  const endIntro = useCallback((thenBoot: Boot) => {
    setIntro('open');
    setBoot((b) => (b === 'pending' ? thenBoot : b));
  }, []);

  const fallBackToFlat = useCallback(() => {
    setMode('flat');
    // 3D starts zoomed out in the room; the flat laptop has no room, so it must be zoomed in
    // (zoomed out blocks keys / wheel and keeps the welcome photo hidden)
    setZoom('in');
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

    // Phones and tablets: the bare screen. No WebGL: the flat laptop.
    if (!hasWebgl || window.matchMedia(MOBILE_QUERY).matches) {
      fallBackToFlat();
      return;
    }

    // 3D MacBook: once loaded, the H lights up on the closed lid, then the camera pulls back
    // into the room with the lid still shut (MacbookWorld). Clicking the MacBook zooms in and
    // opens it. Plays on every visit; reduced motion lands in the room directly.
    skipIntro.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMode('3d');
    setZoom('out');
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
    const id = setTimeout(() => endIntro('on'), LOGO_HOLD_MS);
    return () => clearTimeout(id);
  }, [intro, endIntro]);

  useEffect(() => {
    if (boot === 'on' && zoom === 'in') setBeenIn(true);
  }, [boot, zoom]);

  const onWorldReady = useCallback(() => {
    if (skipIntro.current) endIntro('on');
    else setIntro((i) => (i === 'loading' ? 'closed' : i));
  }, [endIntro]);

  // A click or key while the H lights up skips straight to the pull-back
  useEffect(() => {
    if (intro !== 'closed') return;
    const skip = () => endIntro('on');
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [intro, endIntro]);

  const onIntroDone = useCallback(() => endIntro('booting'), [endIntro]);

  // Room camera + MacBook tilt follow the pointer, only once the intro is over.
  useEffect(() => {
    if (intro !== 'open' || !showRoom || reducedMotion) return;
    // 3D: only the room camera uses it, and only zoomed out. No --px/--py on the root there:
    // those inherited variables restyled the whole warped site on every pointer move.
    if (mode === '3d') return zoom === 'out' ? startParallax() : undefined;
    return startParallax(rootRef.current);
  }, [intro, showRoom, reducedMotion, mode, zoom]);

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

  // Fetch the photo during the intro so it's there when the lid opens
  useEffect(() => {
    preloadPortrait();
  }, []);

  const cardUp = boot === 'on' && hello === 'show';
  useEffect(() => {
    helloRef.current = hello;
    cardUpRef.current = cardUp;
  }, [hello, cardUp]);

  const dismissHello = useCallback(() => {
    if (helloRef.current !== 'show') return;
    helloRef.current = 'done';
    cardUpRef.current = false;
    dismissedAt.current = performance.now();
    refocusStage.current = true;
    setJustDismissed(true);
    setHello('done');
  }, []);

  // Once the carousel is live again, put keyboard focus on it so it isn't left on the removed button
  useEffect(() => {
    if (hello === 'done' && refocusStage.current) {
      refocusStage.current = false;
      stageRef.current?.focus();
    }
  }, [hello]);

  // ---- navigation ----
  const go = useCallback((delta: number) => {
    // Hidden behind the welcome card (or just dismissed by this same gesture): don't step
    if (helloRef.current !== 'done' || performance.now() - dismissedAt.current < DISMISS_LOCK_MS) return;
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
      if (cardUpRef.current) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          if (!e.repeat) dismissHello();
        } else if (e.key === 'Enter' && !onControl) {
          dismissHello();
        }
        return;
      }
      if (helloRef.current !== 'done') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Enter' && !onControl) {
        // A held Enter that just dismissed the card must not also open the first project
        if (e.repeat || performance.now() - dismissedAt.current < DISMISS_LOCK_MS) return;
        openActive();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, go, openActive, closePanel, dismissHello]);

  // ---- wheel / trackpad and drag / swipe, one step per gesture ----
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
        if (cardUpRef.current) dismissHello();
        else go(acc > 0 ? 1 : -1);
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
      if (Math.abs(dx) > 50) {
        if (cardUpRef.current) dismissHello();
        else go(dx < 0 ? 1 : -1);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
    // mode: the stage only exists once the screen is mounted (flat or 3d), not on first render
  }, [panel, go, mode, dismissHello]);

  const on = boot === 'on';
  const showWork = on && hello === 'done';
  const hudV = reducedMotion ? variants.reduced : variants.hud;

  // The live screen. Shared by both modes: inside the flat lid, or warped onto the 3D display.
  const display = (
    <div className="mbp__display">
      <AnimatePresence>
        {/* Wallpaper from the moment the lid opens (through the boot), not just once the text is up */}
        {hello === 'show' && <HelloBackdrop key="hello-photo" reducedMotion={reducedMotion} revealed={intro === 'open' && zoom === 'in'} />}
      </AnimatePresence>

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
        tabIndex={-1}
      >
        <motion.div
          className="absolute inset-0"
          // Hidden and out of the tab order / a11y tree until the welcome card is dismissed
          inert={!showWork}
          initial={{ opacity: 0 }}
          animate={{ opacity: showWork ? 1 : 0 }}
          transition={{
            // Slow fade with the boot; a click-triggered reveal stays within the 400ms default
            duration: reducedMotion ? 0.2 : justDismissed ? 0.4 : 0.9,
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

        <AnimatePresence>
          {cardUp && <HelloScreen key="hello" onDismiss={dismissHello} reducedMotion={reducedMotion} />}
        </AnimatePresence>

        {showWork && (
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
          {showWork && (
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
        <motion.div variants={hudV} custom={3} style={{ visibility: showWork ? undefined : 'hidden' }}>
          <Dock tags={project.tags} reducedMotion={reducedMotion} />
        </motion.div>
        {isMobile && (
          <motion.div variants={hudV} custom={4}>
            <button type="button" className="mbp__contact hud" onClick={(e) => openPanel('contact', e.currentTarget)}>
              {screen.contactLabel}
            </button>
          </motion.div>
        )}
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
      {!isMobile && <GlassShader dark={dark} reducedMotion={reducedMotion} />}

      <AnimatePresence>
        {panel && <InfoPanel key={panel} id={panel} onClose={closePanel} reducedMotion={reducedMotion} />}
      </AnimatePresence>
    </div>
  );

  return (
    <div ref={rootRef} className={cn('mbp', intro !== 'open' && 'is-intro', showRoom && 'has-room')}>
      {/* The page heading for screen readers and search engines. Here, not in the menu bar:
          the screen only mounts on the client, and this must be in the server-rendered HTML. */}
      <h1 className="sr-only">{screen.heading}</h1>
      <div className="mbp__room" aria-hidden="true">
        {/* In 3D mode the room is drawn by MacbookWorld, with the MacBook standing in it.
            While loading (and in 3D) this layer stays empty, just the dark room colour,
            so the world can fade in from black instead of cutting in over the blobs. */}
        {mode === 'flat' &&
          !isMobile &&
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
            hint={{
              text: screen.zoomHint,
              show: on && zoom === 'out',
              delay: reducedMotion ? 0 : beenIn ? HINT_DELAY.zoom : HINT_DELAY.intro,
            }}
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
