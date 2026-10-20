'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Component, Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import { DISPLAY_PX, MacbookModel, type MacbookRig } from '@/components/three/MacbookModel';
import { Studio } from '@/components/three/Studio';
import RoomScene, { CAM_LOOK, CAM_POS, PLINTH_TOP } from './room/RoomScene';
import { parallax } from './room/parallax';
import { useScreenSettings } from './settings';
import { useTheme } from '@/lib/hooks/useTheme';

// The 3D MacBook is the site's frame for good: it plays the intro, then stays, and the
// live HTML screen (`overlay`) is warped onto its display every frame.
// With the room, it stands on the plinth and the room's camera view is the zoomed-out frame.

export type WorldPhase = 'loading' | 'closed' | 'opening' | 'open';
export type Zoom = 'in' | 'out';

// Timeline, in seconds from the start of each phase
const T = {
  // closed: the H flickers on
  litDelay: 0.35,
  litDur: 1.3,
  // opening: lid swings, camera comes round, screen powers up
  lidDur: 1.7,
  camStart: 0.45,
  camDur: 1.85,
  screenStart: 1.7,
  screenDur: 0.6,
  done: 2.35,
  // zoom in / out, and the catch-up after a skipped intro
  zoom: 1.3,
};

// The model is real size (0.31 m wide, 0.22 m deep). In the room it is scaled so the base
// (0.221 m x scale) fits the plinth's top slab, 2.7 deep: 12 gives ~2.65 deep, ~3.7 wide.
const ROOM_SCALE = 12;
// Base underside sits 0.0094 m below the model origin
const BASE_DROP = 0.0094;

// Camera shots, in laptop units (multiplied by the scale), around the laptop's origin
const CLOSED = { azimuth: 0.42, elevation: 0.5, distance: 0.58, lookUp: 0.004 };
// Zoomed out without the room: the whole laptop, from the front left
const OVERVIEW = { azimuth: -0.5, elevation: 0.24, distance: 0.7, lookUp: 0.07, lookBack: -0.03 };
// Zoomed in: square-on to the display, which fills this share of the window's tighter side
const FOCUS_FILL = 0.96;

interface Props {
  phase: WorldPhase;
  zoom: Zoom;
  reducedMotion: boolean;
  /** Stand on the plinth in the 3D room (desktop); otherwise a plain studio */
  withRoom: boolean;
  /** The live HTML display, positioned onto the 3D screen */
  overlay: RefObject<HTMLDivElement | null>;
  onReady: () => void;
  onIntroDone: () => void;
  onZoomIn: () => void;
  onError: () => void;
}

// Entrance fade once the first correctly posed frame is on screen
const FADE_IN_MS = 900;

export default function MacbookWorld(props: Props) {
  const { withRoom, reducedMotion, onError } = props;
  // The 3D display's glow follows the screen settings: same curve as the HTML screen's
  // dimming veil (opacity (1 - brightness) * 0.85), and much dimmer behind the dark glass
  const { theme } = useTheme();
  const { brightness } = useScreenSettings();
  const backlight = (1 - (1 - brightness) * 0.85) * (theme === 'dark' ? 0.35 : 1);
  // Hidden until Director has posed the lid and camera: the model's very first frame
  // still has the GLB's default pose (lid open) and the room's resting camera.
  const [shown, setShown] = useState(false);
  const onPosed = () => setShown(true);

  const laptop = withRoom ? (
    <group position={[PLINTH_TOP.x, PLINTH_TOP.y + BASE_DROP * ROOM_SCALE, PLINTH_TOP.z]} scale={ROOM_SCALE}>
      <Director {...props} scale={ROOM_SCALE} onPosed={onPosed} backlight={backlight} />
    </group>
  ) : (
    <Director {...props} scale={1} onPosed={onPosed} backlight={backlight} />
  );

  return (
    <div
      className="mbp__world"
      // Inline so the canvas always covers the window, whatever the stylesheet state
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        opacity: shown ? 1 : 0,
        transition: `opacity ${reducedMotion ? 200 : FADE_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
      aria-hidden="true"
    >
      <WorldErrorBoundary onError={onError}>
        {withRoom ? (
          <RoomScene still={reducedMotion} externalCamera>
            <Suspense fallback={null}>
              <Studio environmentOnly />
              {laptop}
            </Suspense>
          </RoomScene>
        ) : (
          <Canvas
            camera={{ fov: 30, near: 0.01, far: 20, position: [0, 0.4, 0.8] }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <Suspense fallback={null}>
              <Studio />
              {laptop}
              <ContactShadows position={[0, -BASE_DROP, 0]} opacity={0.7} scale={0.9} blur={2.4} far={0.3} />
            </Suspense>
          </Canvas>
        )}
      </WorldErrorBoundary>
    </div>
  );
}

type DirectorProps = Pick<
  Props,
  'phase' | 'zoom' | 'reducedMotion' | 'withRoom' | 'overlay' | 'onReady' | 'onIntroDone' | 'onZoomIn'
> & { scale: number; onPosed: () => void; backlight: number };

function Director({
  phase,
  zoom,
  reducedMotion,
  withRoom,
  overlay,
  onReady,
  onIntroDone,
  onZoomIn,
  scale,
  onPosed,
  backlight,
}: DirectorProps) {
  // Read per frame without re-rendering the scene
  const backlightRef = useRef(backlight);
  useEffect(() => {
    backlightRef.current = backlight;
  }, [backlight]);
  const { camera, size, gl } = useThree();
  const [rig, setRig] = useState<MacbookRig | null>(null);
  const group = useRef<THREE.Group>(null);
  const posed = useRef(false);
  const state = useRef({
    phase: null as WorldPhase | null,
    phaseStart: 0,
    introDone: false,
    zoom: null as Zoom | null,
    zoomStart: -Infinity,
    fromPos: new THREE.Vector3(),
    fromLook: new THREE.Vector3(),
    look: new THREE.Vector3(),
    lastOpen: -1,
  });
  const corners = useRef<THREE.Vector3[]>([]);
  const v = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3(), p: new THREE.Vector3(), origin: new THREE.Vector3() });

  useFrame(({ clock }) => {
    if (!rig || !group.current) return;
    const now = clock.elapsedTime;
    const s = state.current;
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const { pos, look, p, origin } = v.current;
    // Laptop origin in world space (the plinth in the room, the world origin otherwise)
    group.current.getWorldPosition(origin);

    if (s.phase !== phase) {
      // Entering "open" without finishing the intro (skipped): glide to the current zoom
      if (phase === 'open' && !s.introDone) startZoom(s, cam, now, zoom);
      s.phase = phase;
      s.phaseStart = now;
    }
    const t = now - s.phaseStart;

    // ---- lid, logo, backlight ----
    let open = 1;
    let lit = 1;
    let screen = 1;
    if (phase === 'loading' || phase === 'closed') {
      open = 0;
      screen = 0;
      lit = phase === 'closed' ? flicker((t - T.litDelay) / T.litDur) : 0;
    } else if (phase === 'opening') {
      open = easeInOut(clamp01(t / T.lidDur));
      screen = easeInOut(clamp01((t - T.screenStart) / T.screenDur));
    }
    rig.apply({ open, lit, screen, backlight: backlightRef.current });
    rig.displayCorners(corners.current);
    // The room bakes its shadows once; re-bake while the lid moves
    if (withRoom && open !== s.lastOpen) gl.shadowMap.needsUpdate = true;
    s.lastOpen = open;

    // ---- camera ----
    if (phase === 'loading' || phase === 'closed') {
      closedPose(origin, scale, aspect, pos, look);
    } else if (phase === 'opening') {
      const k = easeInOut(clamp01((t - T.camStart) / T.camDur));
      closedPose(origin, scale, aspect, s.fromPos, s.fromLook);
      focusPose(corners.current, cam.fov, aspect, pos, look);
      pos.lerpVectors(s.fromPos, pos, k);
      look.lerpVectors(s.fromLook, look, k);
      if (t >= T.done && !s.introDone) {
        s.introDone = true;
        s.zoom = 'in';
        s.zoomStart = -Infinity;
        onIntroDone();
      }
    } else {
      if (s.zoom !== zoom) startZoom(s, cam, now, zoom);
      if (zoom === 'in') focusPose(corners.current, cam.fov, aspect, pos, look);
      else if (withRoom) roomPose(reducedMotion, pos, look);
      else overviewPose(origin, scale, aspect, pos, look);
      const k = reducedMotion ? 1 : easeInOut(clamp01((now - s.zoomStart) / T.zoom));
      pos.lerpVectors(s.fromPos, pos, k);
      look.lerpVectors(s.fromLook, look, k);
    }
    cam.position.copy(pos);
    s.look.copy(look);
    cam.lookAt(look);
    cam.updateMatrixWorld();

    // ---- live screen onto the display ----
    const el = overlay.current;
    if (el) placeOverlay(el, corners.current, cam, size.width, size.height, screen, p);

    // This frame is drawn right after (the film pass runs at priority 1), so it's the
    // first one worth showing: start the entrance fade.
    if (!posed.current) {
      posed.current = true;
      onPosed();
    }
  });

  // Zoomed out, the laptop itself is the way back in (the room around it isn't)
  const zoomable = zoom === 'out' && phase === 'open';
  const setCursor = (on: boolean) => {
    document.body.style.cursor = on ? 'zoom-in' : '';
  };
  useEffect(() => {
    if (!zoomable) setCursor(false);
  }, [zoomable]);

  return (
    <group
      ref={group}
      onClick={(e) => {
        // e.delta: pixels the pointer moved between down and up; ignore drags
        if (!zoomable || e.delta > 6) return;
        e.stopPropagation();
        onZoomIn();
      }}
      onPointerOver={(e) => {
        if (!zoomable) return;
        e.stopPropagation();
        setCursor(true);
      }}
      onPointerOut={() => setCursor(false)}
    >
      <MacbookModel
        castShadow={withRoom}
        onReady={(r) => {
          setRig(r);
          if (withRoom) gl.shadowMap.needsUpdate = true;
          onReady();
        }}
      />
    </group>
  );
}

type ZoomState = { zoom: Zoom | null; zoomStart: number; fromPos: THREE.Vector3; fromLook: THREE.Vector3; look: THREE.Vector3 };

function startZoom(s: ZoomState, cam: THREE.Camera, now: number, zoom: Zoom) {
  s.zoom = zoom;
  s.zoomStart = now;
  s.fromPos.copy(cam.position);
  s.fromLook.copy(s.look);
}

function closedPose(origin: THREE.Vector3, scale: number, aspect: number, pos: THREE.Vector3, look: THREE.Vector3) {
  // Pull back on narrow windows so the closed laptop still fits
  const d = CLOSED.distance * scale * Math.max(1, 1.5 / aspect);
  look.copy(origin).y += CLOSED.lookUp * scale;
  return orbit(look, CLOSED.azimuth, CLOSED.elevation, d, pos);
}

function overviewPose(origin: THREE.Vector3, scale: number, aspect: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const d = OVERVIEW.distance * scale * Math.max(1, 1.5 / aspect);
  look.copy(origin);
  look.y += OVERVIEW.lookUp * scale;
  look.z += OVERVIEW.lookBack * scale;
  orbit(look, OVERVIEW.azimuth, OVERVIEW.elevation, d, pos);
}

// The room's own resting shot, with the same pointer swing as the room's camera rig
function roomPose(still: boolean, pos: THREE.Vector3, look: THREE.Vector3) {
  const px = still ? 0 : parallax.x;
  const py = still ? 0 : parallax.y;
  pos.set(CAM_POS.x + px * 1.1, CAM_POS.y - py * 0.45, CAM_POS.z);
  look.set(CAM_LOOK.x - px * 0.35, CAM_LOOK.y + py * 0.15, CAM_LOOK.z);
}

const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _n = new THREE.Vector3();

// Square-on to the display, far enough back that it fills FOCUS_FILL of the window
function focusPose(c: THREE.Vector3[], fov: number, aspect: number, pos: THREE.Vector3, look: THREE.Vector3) {
  _right.subVectors(c[1], c[0]);
  _up.subVectors(c[0], c[3]);
  _n.crossVectors(_right, _up).normalize();
  const w = _right.length();
  const h = _up.length();
  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const d = Math.max(h / (2 * tan), w / (2 * tan * aspect)) / FOCUS_FILL;
  look.copy(c[0]).add(c[2]).multiplyScalar(0.5);
  pos.copy(look).addScaledVector(_n, d);
}

function orbit(target: THREE.Vector3, az: number, el: number, d: number, out: THREE.Vector3) {
  return out
    .set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    .multiplyScalar(d)
    .add(target);
}

// Projective map of the display rectangle (DISPLAY_PX) onto the 4 projected corners:
// a perspective-correct CSS matrix3d, so the HTML stays sharp and clickable.
function placeOverlay(
  el: HTMLDivElement,
  corners: THREE.Vector3[],
  cam: THREE.PerspectiveCamera,
  W: number,
  H: number,
  screen: number,
  p: THREE.Vector3
) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const c of corners) {
    p.copy(c).project(cam);
    if (p.z > 1 || p.z < -1) {
      el.style.visibility = 'hidden';
      return;
    }
    xs.push(((p.x + 1) / 2) * W);
    ys.push(((1 - p.y) / 2) * H);
  }
  const [x0, x1, x2, x3] = xs;
  const [y0, y1, y2, y3] = ys;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const { width: w, height: hh } = DISPLAY_PX;
  const m = [a / w, d / w, 0, g / w, b / hh, e / hh, 0, h / hh, 0, 0, 1, 0, x0, y0, 0, 1];
  el.style.transform = `matrix3d(${m.map((n) => +n.toFixed(8)).join(',')})`;
  el.style.opacity = String(screen);
  el.style.visibility = screen > 0.001 ? 'visible' : 'hidden';
}

// Old backlit-logo flicker: catches, dips, settles to full
function flicker(p: number) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const keys = [
    [0, 0],
    [0.12, 0.55],
    [0.22, 0.2],
    [0.5, 0.85],
    [1, 1],
  ];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (p <= t1) return v0 + (v1 - v0) * ((p - t0) / (t1 - t0));
  }
  return 1;
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const easeInOut = (n: number) => (n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2);

// If the model or WebGL fails, fall back to the flat layout instead of an empty room
class WorldErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('[MacbookWorld] falling back to the flat screen:', error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
