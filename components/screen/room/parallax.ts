// One damped pointer value shared by the 3D room camera and the CSS tilt of the
// MacBook, so both move as a single rig. Runs one rAF loop while anyone listens.

type Vec = { x: number; y: number };

const target: Vec = { x: 0, y: 0 };
export const parallax: Vec = { x: 0, y: 0 };

let users = 0;
let raf = 0;
let el: HTMLElement | null = null;

// Lower = heavier, laggier follow
const DAMPING = 0.06;

function onMove(e: PointerEvent) {
  target.x = (e.clientX / window.innerWidth) * 2 - 1;
  target.y = (e.clientY / window.innerHeight) * 2 - 1;
}

function onLeave() {
  target.x = 0;
  target.y = 0;
}

function tick() {
  parallax.x += (target.x - parallax.x) * DAMPING;
  parallax.y += (target.y - parallax.y) * DAMPING;
  if (el) {
    el.style.setProperty('--px', parallax.x.toFixed(4));
    el.style.setProperty('--py', parallax.y.toFixed(4));
  }
  raf = requestAnimationFrame(tick);
}

/** Start following the pointer; `cssTarget` receives `--px` / `--py` in [-1, 1]. */
export function startParallax(cssTarget?: HTMLElement | null) {
  if (cssTarget) el = cssTarget;
  if (users++ === 0) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
  }
  return () => {
    if (cssTarget && el === cssTarget) {
      el.style.removeProperty('--px');
      el.style.removeProperty('--py');
      el = null;
    }
    if (--users === 0) {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      target.x = target.y = parallax.x = parallax.y = 0;
    }
  };
}
