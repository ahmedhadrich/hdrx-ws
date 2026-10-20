// One damped pointer value shared by the 3D room camera and the CSS tilt of the
// MacBook, so both move as a single rig. Runs one rAF loop while the value is still
// catching up with the pointer; at rest it sleeps until the pointer moves again.

type Vec = { x: number; y: number };

const target: Vec = { x: 0, y: 0 };
export const parallax: Vec = { x: 0, y: 0 };

let users = 0;
let raf = 0;
let el: HTMLElement | null = null;
// Last strings written to the CSS target: --px/--py are inherited, so every write restyles
// the whole page subtree; identical values are skipped
let lastPx = '';
let lastPy = '';

// Below this the follow has arrived (the CSS values, at 4 decimals, no longer change)
const SETTLE = 1e-5;

// Lower = heavier, laggier follow
const DAMPING = 0.06;

function wake() {
  if (!raf && users > 0) raf = requestAnimationFrame(tick);
}

function onMove(e: PointerEvent) {
  target.x = (e.clientX / window.innerWidth) * 2 - 1;
  target.y = (e.clientY / window.innerHeight) * 2 - 1;
  wake();
}

function onLeave() {
  target.x = 0;
  target.y = 0;
  wake();
}

function tick() {
  parallax.x += (target.x - parallax.x) * DAMPING;
  parallax.y += (target.y - parallax.y) * DAMPING;
  const settled = Math.abs(target.x - parallax.x) < SETTLE && Math.abs(target.y - parallax.y) < SETTLE;
  if (settled) {
    parallax.x = target.x;
    parallax.y = target.y;
  }
  if (el) {
    const px = parallax.x.toFixed(4);
    const py = parallax.y.toFixed(4);
    if (px !== lastPx) el.style.setProperty('--px', (lastPx = px));
    if (py !== lastPy) el.style.setProperty('--py', (lastPy = py));
  }
  raf = settled ? 0 : requestAnimationFrame(tick);
}

/** Start following the pointer; `cssTarget` receives `--px` / `--py` in [-1, 1]. */
export function startParallax(cssTarget?: HTMLElement | null) {
  if (cssTarget) {
    el = cssTarget;
    lastPx = lastPy = '';
  }
  if (users++ === 0) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
  }
  // Writes the current value to a new CSS target, then sleeps again once settled
  wake();
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
      raf = 0;
      target.x = target.y = parallax.x = parallax.y = 0;
    }
  };
}
