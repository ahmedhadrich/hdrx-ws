// Whether the live HTML screen can be seen. In 3D mode MacbookWorld hides the warped
// overlay (visibility: hidden) during the intro and while zoomed out with the lid shut;
// the screen's own WebGL layers (WorkCarousel, GlassShader) listen here and stop drawing
// meanwhile instead of rendering 60 frames a second nobody sees.
// Dependency-free on purpose: GlassShader is in the page's main bundle (like display.ts).
// Defaults to visible, so the flat layout (no MacbookWorld) never pauses anything.

type Listener = (visible: boolean) => void;

let visible = true;
const listeners = new Set<Listener>();

export function isScreenVisible() {
  return visible;
}

/** Called by MacbookWorld when the overlay's visibility flips (not every frame). */
export function setScreenVisible(next: boolean) {
  if (next === visible) return;
  visible = next;
  listeners.forEach((l) => l(next));
}

export function onScreenVisibility(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
