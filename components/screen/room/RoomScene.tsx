'use client';

import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { parallax } from './parallax';
import { useHour, useScreenSettings, type Accent } from '../settings';
import { dustFragment, dustVertex, postFragment, postVertex, skyFragment, skyVertex } from './shaders';

// Firefox resolves MSAA targets and fills hi-DPI canvases much slower than Chromium/Safari:
// it gets fewer FBO samples and DPR 1 (the grain hides both). Same check as WorkCarousel.
const IS_FIREFOX = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

// Design tokens, mirrored from globals.css (WebGL can't read CSS variables)
const BONE = '#e9dfc8';
// The site accent (sage). Key stays `signal` in settings so saved choices keep working.
const SAGE = '#87bba2';
// Second accent (settings key `shore`): terracotta
const TERRACOTTA = '#e8865a';
const BASE = '#0b0b0e';

// Low golden-hour sun from the left, a touch in front of the back wall: it rakes through the
// big window in the left wall, so the window bars print hard stripes on the floor and back wall.
const SUN_POS = new THREE.Vector3(-20, 8, 8);

// Where the camera rests and what it looks at
export const CAM_POS = new THREE.Vector3(0, 2.6, 14);
export const CAM_LOOK = new THREE.Vector3(0, 2.9, 0);
export const CAM_FOV = 34;
// Centre of the plinth's top face: the 3D MacBook stands here
export const PLINTH_TOP = new THREE.Vector3(0, 1.1, 1.2);
// Centre of the plinth base's front face (the 7 x 0.9 x 3.4 box at z 1.2): the zoom hint is carved here
export const PLINTH_FRONT = { y: 0.45, z: 1.2 + 3.4 / 2 };

// ---------- Atmosphere: the accent colour sets the room's whole mood ----------
// signal = golden hour with a sage cast in the bounce (the default), shore = terracotta dusk
// (settings key kept), bone = pale high-key afternoon. Fog/background stay near-black.
const ATMO_KEYS = ['top', 'horizon', 'sun', 'sunLight', 'bounce', 'hemiSky', 'hemiGround', 'dust', 'fog', 'lift'] as const;
type AtmoKey = (typeof ATMO_KEYS)[number];
type Palette = Record<AtmoKey, THREE.Color>;

// Colours go through THREE.Color(hex) so they are converted to linear like the rest of the scene
const c = (hex: string) => new THREE.Color(hex);
const PALETTES: Record<Accent, Palette> = {
  signal: {
    top: c('#6b7684').multiplyScalar(0.6),
    horizon: c('#ffd9a8').lerp(c(SAGE), 0.12).multiplyScalar(0.9),
    sun: c('#ffd9a8'),
    sunLight: c('#ffd2a0'),
    // Warm bounce with only a trace of sage: more green and the plaster goes olive
    bounce: c('#ffb878').lerp(c(SAGE), 0.15),
    // Neutral-cool sky fill so shadows read cool against the warm patches
    hemiSky: c('#aab2c2'),
    hemiGround: c('#3a2a1c'),
    dust: c('#ffe6c0'),
    fog: c(BASE),
    lift: new THREE.Color(1.03, 1.0, 0.96),
  },
  shore: {
    top: c('#8a8279').multiplyScalar(0.6),
    horizon: c(BONE).lerp(c(TERRACOTTA), 0.35).multiplyScalar(0.9),
    sun: c(TERRACOTTA),
    sunLight: c('#ffbf94'),
    bounce: c(TERRACOTTA),
    hemiSky: c('#9a958c'),
    hemiGround: c('#2a1810'),
    dust: c(BONE),
    fog: c('#0d0b0a'),
    lift: new THREE.Color(1.04, 1.0, 0.95),
  },
  bone: {
    top: c('#7a705f').multiplyScalar(0.7),
    horizon: c(BONE).multiplyScalar(0.95),
    sun: c('#fff2d8'),
    sunLight: c('#fff6e4'),
    bounce: c('#f6dcb4'),
    hemiSky: c('#e2d8c4'),
    hemiGround: c('#6a5a44'),
    dust: c('#fff5e2'),
    fog: c('#100f0d'),
    lift: new THREE.Color(1.05, 1.01, 0.94),
  },
};

// The live, eased palette everything reads from each frame
const atmo: Palette = Object.fromEntries(ATMO_KEYS.map((k) => [k, PALETTES.signal[k].clone()])) as Palette;

function snapAtmo(to: Palette) {
  for (const k of ATMO_KEYS) atmo[k].copy(to[k]);
}

// Eases the palette toward the chosen accent (~700 ms) and tints background + fog.
// Mounted first so every other part of the room reads this frame's colours.
function Atmosphere({ still }: { still: boolean }) {
  const { accent } = useScreenSettings();
  const { scene, invalidate } = useThree();
  const first = useRef(true);

  useEffect(() => {
    // No motion (or first paint): switch at once and draw that one frame
    if (still || first.current) {
      snapAtmo(PALETTES[accent]);
      first.current = false;
    }
    invalidate();
  }, [accent, still, invalidate]);

  useFrame((_, dt) => {
    const target = PALETTES[accent];
    const k = still ? 1 : 1 - Math.exp(-dt * 5);
    for (const key of ATMO_KEYS) atmo[key].lerp(target[key], k);
    if (scene.background instanceof THREE.Color) scene.background.copy(atmo.fog);
    scene.fog?.color.copy(atmo.fog);
  });
  return null;
}

// ---------- Time of day: sun arc, intensities and warmth follow the hour ----------
// Like real daylight: morning is crisp, bright and blue-filled with a near-white sun, noon is
// neutral and brightest, the afternoon warms into golden hour, then blue hour and night.
// `warm` (0 cool daylight .. 1 the accent palette's warm look) decides how much of the accent's
// golden bounce, horizon, dust and grade comes through; `hemiCol` is the sky fill's colour.
// Night keeps a dim cool "moon" on the same shadow light, plus the lamp.
const SUN_R = 24;
const DEG = Math.PI / 180;
const NUM_KEYS = ['elev', 'az', 'sunI', 'hemiI', 'hemiMix', 'ambI', 'fillI', 'lampI', 'dustA', 'sunMix', 'skyK', 'warm'] as const;
type NumKey = (typeof NUM_KEYS)[number];
type Tod = Record<NumKey, number> & { sunCol: THREE.Color; hemiCol: THREE.Color };
type Keyframe = Tod & { h: number };

const MOON = c('#8fa8d8');
const NIGHT_FILL = c('#6f86b8');
// Clear morning / midday sky fill
const SKY_MORNING = c('#9cc1ff');
const SKY_NOON = c('#b4cdfa');
// Cool daylight counterparts of the accent palette's warm colours (warm = 0)
const COOL = {
  bounce: c('#dfe7f2'),
  horizon: c('#cfe0f5').multiplyScalar(0.9),
  top: c('#5f86c4').multiplyScalar(0.7),
  dust: c('#f2f6ff'),
  lift: new THREE.Color(0.97, 1.0, 1.04),
};
// elev/az in degrees (az: + is toward the camera); sunMix = how much the accent tints the sun
function kf(
  h: number, elev: number, az: number, sunI: number, sunCol: THREE.Color, hemiI: number, hemiMix: number,
  ambI: number, fillI: number, lampI: number, dustA: number, sunMix: number, skyK: number,
  warm: number, hemiCol: THREE.Color,
): Keyframe {
  return { h, elev, az, sunI, sunCol, hemiI, hemiMix, ambI, fillI, lampI, dustA, sunMix, skyK, warm, hemiCol };
}
const KEYS: Keyframe[] = [
  //  hour elev  az  sunI  sunCol          hemiI mix  amb  fill lamp dust sunMix sky  warm sky fill
  kf(0, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1, 0.25, NIGHT_FILL),
  kf(5, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1, 0.25, NIGHT_FILL),
  kf(5.5, 26, 20, 0, MOON, 0.5, 0.6, 0.16, 0.6, 13, 0.6, 0.1, 0.15, 0.3, NIGHT_FILL),
  // Sunrise: the low sun itself is warm, everything it doesn't touch is blue
  kf(5.9, 2, 18, 0, c('#ff9a6a'), 0.42, 0.5, 0.12, 0.8, 11, 0.8, 0.5, 0.25, 0.55, c('#8fa3d8')),
  kf(6.4, 5, 18, 1.0, c('#ffc29a'), 0.55, 0.6, 0.1, 0.9, 9, 1.0, 0.35, 0.4, 0.4, c('#9db8ec')),
  // Morning: crisp, bright, blue-filled; the sun is near white
  kf(9, 26, 22, 3.5, c('#f5f7ff'), 0.95, 0.75, 0.12, 0.8, 1, 0.7, 0.05, 0.65, 0.05, SKY_MORNING),
  // Noon: neutral and brightest
  kf(13, 42, 26, 3.9, c('#fffaf2'), 1.0, 0.6, 0.12, 0.7, 0.4, 0.6, 0.05, 0.7, 0.2, SKY_NOON),
  // Afternoon warming into golden hour (the accent palette in full)
  kf(15.5, 32, 24, 3.7, c('#ffefd8'), 0.85, 0.35, 0.12, 0.85, 2, 0.8, 0.4, 0.62, 0.55, c('#b8c6dc')),
  kf(17.5, 21, 22, 3.6, c('#ffd2a0'), 0.6, 0.1, 0.12, 1, 7, 1, 1, 0.5, 1, c('#aab2c2')),
  kf(19.5, 3, 30, 1.1, c('#ff9a5a'), 0.45, 0.3, 0.12, 1, 10, 1, 0.6, 0.3, 1, c('#9aa6c8')),
  // Blue hour
  kf(20.2, 2, 30, 0, c('#ff8a50'), 0.45, 0.55, 0.14, 0.9, 12, 0.8, 0.4, 0.2, 0.6, c('#7f92c8')),
  kf(20.7, 26, 20, 0, MOON, 0.55, 0.65, 0.18, 0.6, 13, 0.6, 0.1, 0.12, 0.3, NIGHT_FILL),
  kf(21.5, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1, 0.25, NIGHT_FILL),
  kf(24, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1, 0.25, NIGHT_FILL),
];

// Starts on golden hour (the settings default); TimeOfDay snaps to the real hour on mount
const START = KEYS.find((k) => k.h === 17.5)!;
const newTod = (): Tod => ({ ...START, sunCol: START.sunCol.clone(), hemiCol: START.hemiCol.clone() });
// Live (eased) and target state; module-level like `atmo` so every component reads this frame's values
const tod: Tod = newTod();
const todTarget: Tod = newTod();

// The accent palette's warm colours pulled toward cool daylight by the hour's `warm`:
// recomputed every frame by TimeOfDay, read by the lights, sky, dust and film grade
const lit = {
  bounce: new THREE.Color(),
  horizon: new THREE.Color(),
  top: new THREE.Color(),
  dust: new THREE.Color(),
  lift: new THREE.Color(1, 1, 1),
};

function sampleTod(hour: number, out: Tod) {
  const h = Math.min(Math.max(hour, 0), 24);
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = Math.min(Math.max((h - a.h) / (b.h - a.h), 0), 1);
  const t = u * u * (3 - 2 * u);
  for (const k of NUM_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  out.sunCol.copy(a.sunCol).lerp(b.sunCol, t);
  out.hemiCol.copy(a.hemiCol).lerp(b.hemiCol, t);
}

// Eases toward the hour's target (~500 ms); mounted after Atmosphere. Still: snap, draw one frame.
// The room's orientation turns the sun's azimuth, so it eases along with the hour.
function TimeOfDay({ still }: { still: boolean }) {
  const hour = useHour();
  const { orientation } = useScreenSettings();
  const { invalidate } = useThree();
  const first = useRef(true);

  useEffect(() => {
    sampleTod(hour, todTarget);
    todTarget.az += orientation;
    if (still || first.current) {
      for (const k of NUM_KEYS) tod[k] = todTarget[k];
      tod.sunCol.copy(todTarget.sunCol);
      tod.hemiCol.copy(todTarget.hemiCol);
      first.current = false;
    }
    invalidate();
  }, [hour, orientation, still, invalidate]);

  useFrame((_, dt) => {
    const k = still ? 1 : 1 - Math.exp(-dt * 6);
    for (const key of NUM_KEYS) tod[key] += (todTarget[key] - tod[key]) * k;
    tod.sunCol.lerp(todTarget.sunCol, k);
    tod.hemiCol.lerp(todTarget.hemiCol, k);
    // Atmosphere (mounted first) has already eased `atmo` this frame
    lit.bounce.copy(COOL.bounce).lerp(atmo.bounce, tod.warm);
    lit.horizon.copy(COOL.horizon).lerp(atmo.horizon, tod.warm);
    lit.top.copy(COOL.top).lerp(atmo.top, tod.warm);
    lit.dust.copy(COOL.dust).lerp(atmo.dust, tod.warm);
    lit.lift.copy(COOL.lift).lerp(atmo.lift, tod.warm);
  });
  return null;
}

interface Props {
  /** Reduced motion: render once, no pointer follow, no drifting dust or grain */
  still: boolean;
  /** Scene content rendered in the room (the 3D MacBook) */
  children?: ReactNode;
  /** Someone else drives the camera (the MacBook's zoom); skip the pointer rig */
  externalCamera?: boolean;
  /** Owner-driven frameloop (MacbookWorld drops to 'demand' when settled); still always wins */
  frameloop?: 'always' | 'demand';
}

export default function RoomScene({ still, children, externalCamera = false, frameloop = 'always' }: Props) {
  return (
    <Canvas
      className="mbp__scene"
      camera={{ position: CAM_POS.toArray(), fov: CAM_FOV, near: 0.05, far: 200 }}
      dpr={IS_FIREFOX ? [1, 1] : [1, 1.25]}
      // PCF, not R3F's default PCFSoft: three r18x deprecated soft shadows and warns on every shadow render
      shadows="percentage"
      frameloop={still ? 'demand' : frameloop}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <color attach="background" args={[BASE]} />
      <fog attach="fog" args={[BASE, 30, 75]} />
      <Atmosphere still={still} />
      <TimeOfDay still={still} />
      <Lights />
      <Sky />
      <Architecture />
      <Floor />
      {!still && <Dust />}
      {children}
      {!externalCamera && <CameraRig still={still} />}
      <FilmPass still={still} />
    </Canvas>
  );
}

function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const floorFill = useRef<THREE.PointLight>(null);
  const wallFill = useRef<THREE.PointLight>(null);
  const baked = useRef(new THREE.Vector3(Infinity, 0, 0));
  const tmp = useMemo(() => new THREE.Color(), []);
  const { gl } = useThree();

  // Light colours and strengths follow accent + hour; only a moved sun needs a shadow re-bake
  useFrame(() => {
    const s = sun.current;
    if (s) {
      const e = Math.max(tod.elev, 1.5) * DEG;
      const az = tod.az * DEG;
      s.position.set(-SUN_R * Math.cos(e) * Math.cos(az), SUN_R * Math.sin(e), SUN_R * Math.cos(e) * Math.sin(az));
      s.color.copy(tod.sunCol).lerp(atmo.sunLight, tod.sunMix);
      s.intensity = tod.sunI;
      // The map is baked once; re-bake only when the sun actually moved (and is lit)
      if (tod.sunI > 0.02 && s.position.distanceToSquared(baked.current) > 0.0025) {
        baked.current.copy(s.position);
        gl.shadowMap.needsUpdate = true;
      }
    }
    for (const f of [floorFill.current, wallFill.current]) {
      if (!f) continue;
      f.color.copy(lit.bounce);
      f.intensity = 5 * tod.fillI;
    }
    if (hemi.current) {
      hemi.current.color.copy(atmo.hemiSky).lerp(tod.hemiCol, tod.hemiMix);
      hemi.current.groundColor.copy(atmo.hemiGround);
      hemi.current.intensity = tod.hemiI;
    }
    if (amb.current) {
      amb.current.color.copy(tmp.set('#ffffff').lerp(tod.hemiCol, tod.hemiMix * 0.5));
      amb.current.intensity = tod.ambI;
    }
  });

  // Nothing but the sun moves, so the shadow map stays manual
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);

  return (
    <>
      {/* Low sky fill: it keeps shadows cool and readable without greening the plaster */}
      <hemisphereLight ref={hemi} args={['#aab2c2', '#3a2a1c', 0.6]} />
      <ambientLight ref={amb} intensity={0.12} />
      <directionalLight
        ref={sun}
        position={SUN_POS.toArray()}
        intensity={3.6}
        color="#ffd2a0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
      {/* Fake colour bleed: warm lights parked beside the sunlit floor and wall patches */}
      <pointLight ref={floorFill} position={[-3, 1.6, 3]} intensity={5} distance={14} decay={2} color="#ffb878" />
      <pointLight ref={wallFill} position={[2, 4.5, -7.2]} intensity={5} distance={13} decay={2} color="#ffb878" />
    </>
  );
}

function Sky() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: PALETTES.signal.top.clone() },
      uHorizon: { value: PALETTES.signal.horizon.clone() },
      uSun: { value: PALETTES.signal.sun.clone() },
      uSunDir: { value: SUN_POS.clone().normalize() },
      uExposure: { value: 0.5 },
    }),
    [],
  );
  useFrame(() => {
    uniforms.uTop.value.copy(lit.top);
    uniforms.uHorizon.value.copy(lit.horizon);
    uniforms.uSun.value.copy(atmo.sun);
    // The sky leans toward the hour's fill colour (clear blue by day, deep blue at night) and
    // dims at night; the sun glow follows the sun's arc
    uniforms.uTop.value.lerp(tod.hemiCol, tod.hemiMix * 0.5).multiplyScalar(0.6 + tod.skyK);
    uniforms.uHorizon.value.lerp(tod.hemiCol, tod.hemiMix * 0.6);
    uniforms.uExposure.value = 0.15 + tod.skyK;
    const e = tod.elev * DEG;
    const az = tod.az * DEG;
    uniforms.uSunDir.value.set(-Math.cos(e) * Math.cos(az), Math.sin(e), Math.cos(e) * Math.sin(az));
  });
  return (
    <mesh>
      <sphereGeometry args={[90, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
      />
    </mesh>
  );
}

// A wall slab with openings cut through it
function wallGeometry(w: number, h: number, holes: THREE.Path[]) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, h);
  shape.lineTo(-w / 2, h);
  shape.closePath();
  shape.holes.push(...holes);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.7,
    bevelEnabled: false,
    curveSegments: 48,
  });
  geo.translate(0, 0, -0.35);
  return geo;
}

function rectHole(x0: number, y0: number, x1: number, y1: number) {
  const p = new THREE.Path();
  p.moveTo(x0, y0);
  p.lineTo(x0, y1);
  p.lineTo(x1, y1);
  p.lineTo(x1, y0);
  p.closePath();
  return p;
}

function circleHole(x: number, y: number, r: number) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}

// Smooth river stone: a sphere pushed in and out by a few sines (welded so it shades smooth)
function stoneGeometry(seed: number) {
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, 4));
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 2.1 + seed) * Math.cos(v.y * 1.7 - seed) * 0.12 + Math.sin(v.z * 4.3 + seed * 2.0) * 0.04;
    v.multiplyScalar(1 + n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Seeded PRNG (mulberry32): same layout on every render, keeps the hooks pure
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Near-white mottled plaster; the material colour supplies the warmth
function plasterTexture() {
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const rand = seeded(11);
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 30 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rand() < 0.5;
    g.addColorStop(0, dark ? 'rgba(90,80,70,0.035)' : 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    // Draw wrapped copies so the tile has no seams
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.restore();
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  // Wall UVs are in world units: one tile per 9 units
  tex.repeat.set(1 / 9, 1 / 9);
  return tex;
}

// Oak planks running along x: per-plank tone, wavy grain, dark seams
function plankTexture() {
  const size = 1024;
  const boards = 8;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const rand = seeded(23);
  const bh = size / boards;
  for (let b = 0; b < boards; b++) {
    const l = 40 + rand() * 10;
    ctx.fillStyle = `hsl(${28 + rand() * 6}, ${38 + rand() * 8}%, ${l}%)`;
    ctx.fillRect(0, b * bh, size, bh);
    for (let k = 0; k < 34; k++) {
      const y0 = b * bh + rand() * bh;
      const amp = 1 + rand() * 3;
      const ph = rand() * 6;
      ctx.strokeStyle = `rgba(60,36,18,${0.05 + rand() * 0.1})`;
      ctx.lineWidth = 0.6 + rand() * 1.2;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 16) {
        const y = y0 + Math.sin(x * 0.012 + ph) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // staggered end joint
    ctx.fillStyle = 'rgba(30,18,8,0.55)';
    ctx.fillRect(rand() * size, b * bh, 2, bh);
    ctx.fillStyle = 'rgba(30,18,8,0.7)';
    ctx.fillRect(0, b * bh, size, 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(14, 14);
  return tex;
}

// Window in the left wall. Local x runs along the wall (world -z), so the window spans
// world z -6 to 7 once the wall is offset to z 0.5.
const WIN = { x0: -6.5, x1: 6.5, y0: 0.5, y1: 9.5 };

function Architecture() {
  const geos = useMemo(
    () => ({
      // Round oculus high on the back wall, as in the first room: a window on the sky's colour
      back: wallGeometry(36, 15, [circleHole(-4.2, 8.6, 1.3)]),
      pebble: stoneGeometry(2.7),
      side: wallGeometry(20, 15, [rectHole(WIN.x0, WIN.y0, WIN.x1, WIN.y1)]),
    }),
    [],
  );

  const plaster = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: plasterTexture(),
        color: '#efe3cc',
        roughness: 0.95,
        metalness: 0,
      }),
    [],
  );
  const wood = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4a3526', roughness: 0.7, metalness: 0 }),
    [],
  );
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2a2018', roughness: 0.6, metalness: 0 }),
    [],
  );
  const plinth = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b8a687', roughness: 0.9, metalness: 0 }),
    [],
  );
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9ab92', roughness: 1, metalness: 0 }), []);
  const ceramic = useMemo(() => new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.55, metalness: 0 }), []);

  const bars = [-3.25, 0, 3.25];
  const vase = useMemo(
    () =>
      lathe([
        [0, 0],
        [0.22, 0],
        [0.34, 0.25],
        [0.36, 0.5],
        [0.22, 0.85],
        [0.13, 1.05],
        [0.15, 1.15],
        [0.12, 1.15],
        [0.1, 1.05],
      ]),
    [],
  );

  return (
    <group>
      <mesh geometry={geos.back} material={plaster} position={[0, 0, -9]} castShadow receiveShadow />
      <mesh
        geometry={geos.side}
        material={plaster}
        position={[-11, 0, 0.5]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      />

      {/* Window bars: they cast the stripes across the floor and back wall */}
      <group position={[-10.9, 0, 0.5]} rotation={[0, Math.PI / 2, 0]}>
        {bars.map((x) => (
          <mesh key={x} material={frame} position={[x, (WIN.y0 + WIN.y1) / 2, 0]} castShadow>
            <boxGeometry args={[0.16, WIN.y1 - WIN.y0, 0.2]} />
          </mesh>
        ))}
        <mesh material={frame} position={[0, 6.4, 0]} castShadow>
          <boxGeometry args={[WIN.x1 - WIN.x0, 0.16, 0.2]} />
        </mesh>
        <mesh material={frame} position={[0, WIN.y1, 0]} castShadow>
          <boxGeometry args={[WIN.x1 - WIN.x0 + 0.3, 0.3, 0.3]} />
        </mesh>
        <mesh material={frame} position={[0, WIN.y0, 0.1]} castShadow>
          <boxGeometry args={[WIN.x1 - WIN.x0 + 0.3, 0.2, 0.5]} />
        </mesh>
      </group>

      {/* Plinth the MacBook stands on */}
      <mesh material={plinth} position={[0, 0.45, 1.2]} castShadow receiveShadow>
        {/* Narrower than before so it frames the ~4-unit laptop; the top stays at PLINTH_TOP */}
        <boxGeometry args={[7, 0.9, 3.4]} />
      </mesh>
      <mesh material={plinth} position={[0, 1.0, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.2, 2.7]} />
      </mesh>

      {/* Low bench against the back wall: plant, a pebble, a few books */}
      <mesh material={wood} position={[7.2, 0.5, -8.3]} castShadow receiveShadow>
        <boxGeometry args={[7, 1, 1.3]} />
      </mesh>
      <Plant position={[9.0, 1, -8.3]} />
      <mesh geometry={geos.pebble} material={stone} position={[7.75, 1.1, -8.05]} scale={[0.34, 0.16, 0.26]} castShadow receiveShadow />
      <Books position={[5.3, 1, -8.3]} />

      {/* Stepped plaster column with a vase, back left, where the window bars stripe the wall */}
      <group position={[-7.2, 0, -6.6]}>
        <mesh material={plaster} position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 3.2, 1.5]} />
        </mesh>
        <mesh material={plaster} position={[0, 3.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.7, 1.05]} />
        </mesh>
        <mesh geometry={vase} material={ceramic} position={[0, 3.9, 0]} scale={1.1} castShadow receiveShadow />
      </group>

      <Pendant />
    </group>
  );
}

// Lathe from [radius, height] pairs (pot, vase)
function lathe(profile: [number, number][], segments = 40) {
  return new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
}

// One sansevieria-style blade: tapered to a point, V-creased along the midrib, curving outward
// as it rises. Built in leaf space (y up the blade, z outward); vertex colours darken the base.
const LEAF_BASE = new THREE.Color('#3f5f4c');
const LEAF_TIP = new THREE.Color('#86ab92');
function leafGeometry(len: number, width: number, droop: number) {
  const rows = 14;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const tmp = new THREE.Color();
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    // Narrow stem, widest a third of the way up, sharp tip
    const w = width * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.5) * 0.5)) * (1 - Math.pow(t, 2.2));
    const y = len * t;
    const z = droop * len * t * t;
    // Edges sit forward of the midrib: the channel
    const crease = w * 0.45;
    pos.push(-w, y, z + crease, 0, y, z, w, y, z + crease);
    tmp.copy(LEAF_BASE).lerp(LEAF_TIP, Math.pow(t, 0.7));
    const mid = tmp.clone().multiplyScalar(0.88);
    col.push(tmp.r, tmp.g, tmp.b, mid.r, mid.g, mid.b, tmp.r, tmp.g, tmp.b);
    if (i < rows) {
      const a = i * 3;
      const b = a + 3;
      idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Potted sansevieria: a fan of creased blades in a tapered bone pot with a rolled rim
function Plant({ position }: { position: [number, number, number] }) {
  const { pot, soil, leaves, leafMat, potMat, soilMat } = useMemo(() => {
    const rand = seeded(31);
    const count = 13;
    const leaves = Array.from({ length: count }, (_, i) => {
      // Golden-angle spiral: no two blades line up, the tall ones in the middle
      const a = i * 2.39996 + rand() * 0.3;
      const inner = 1 - i / count;
      const len = 0.9 + inner * 1.1 + rand() * 0.25;
      return {
        geo: leafGeometry(len, 0.11 + rand() * 0.05, 0.08 + (1 - inner) * 0.35),
        a,
        lean: 0.08 + (1 - inner) * 0.45 + rand() * 0.08,
        twist: (rand() - 0.5) * 0.8,
        r: 0.04 + (1 - inner) * 0.2,
      };
    });
    return {
      leaves,
      pot: lathe([
        [0, 0],
        [0.34, 0],
        [0.36, 0.04],
        [0.46, 0.86],
        [0.5, 0.9],
        [0.5, 0.96],
        [0.46, 0.98],
        [0.43, 0.9],
        [0.42, 0.84],
      ]),
      soil: new THREE.CircleGeometry(0.42, 32),
      leafMat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide }),
      // Double-sided: the lathe's inner wall faces away from its outer normals
      potMat: new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.6, side: THREE.DoubleSide }),
      soilMat: new THREE.MeshStandardMaterial({ color: '#2b2119', roughness: 1 }),
    };
  }, []);

  return (
    <group position={position}>
      <mesh geometry={pot} material={potMat} castShadow receiveShadow />
      <mesh geometry={soil} material={soilMat} position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {leaves.map((l, i) => (
        // Yaw to the blade's direction, lean it out, then a little twist about its own axis
        <group key={i} position={[Math.sin(l.a) * l.r, 0.84, Math.cos(l.a) * l.r]} rotation={[0, l.a, 0]}>
          <mesh geometry={l.geo} material={leafMat} rotation={[l.lean, l.twist, 0]} castShadow receiveShadow />
        </group>
      ))}
    </group>
  );
}

// A short stack of books, spines out, slightly askew
function Books({ position }: { position: [number, number, number] }) {
  const books = useMemo(
    () =>
      [
        { w: 1.1, h: 0.14, d: 0.8, color: '#d9cdb4', yaw: 0.04 },
        { w: 1.0, h: 0.11, d: 0.74, color: '#7d9483', yaw: -0.08 },
        { w: 0.94, h: 0.16, d: 0.7, color: '#a8664a', yaw: 0.12 },
      ].map((b) => ({ ...b, mat: new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.85 }) })),
    [],
  );
  let y = 0;
  return (
    <group position={position}>
      {books.map((b, i) => {
        y += b.h / 2;
        const at = y;
        y += b.h / 2;
        return (
          <mesh key={i} material={b.mat} position={[0, at, 0]} rotation={[0, b.yaw, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
          </mesh>
        );
      })}
    </group>
  );
}

// Hoop pendant: the one emissive accent object. Its point light throws a soft pool on the wall.
function Pendant() {
  const light = useRef<THREE.PointLight>(null);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd9a8' }), []);
  const wire = useMemo(() => new THREE.MeshBasicMaterial({ color: '#1a1511' }), []);
  const base = useMemo(() => new THREE.Color('#ffd9a8'), []);
  // Near-off at noon, bright at night: the ring's glow tracks the lamp's strength
  useFrame(() => {
    if (light.current) light.current.intensity = tod.lampI;
    glow.color.copy(base).multiplyScalar(0.45 + 1.05 * Math.min(1, tod.lampI / 9));
  });
  return (
    <group position={[4.6, 6.4, -4.2]}>
      <mesh material={glow}>
        <torusGeometry args={[1.15, 0.065, 16, 72]} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} material={wire} position={[x * 0.9, 1.15 + 3.5, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 7, 4]} />
        </mesh>
      ))}
      <pointLight ref={light} position={[0, 0, -0.4]} intensity={7} distance={12} decay={2} color="#ffcf94" />
    </group>
  );
}

// Matte oak floor: catches the plinth's shadow and the sun patches, no reflections
function Floor() {
  const map = useMemo(() => plankTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[90, 90]} />
      <meshStandardMaterial map={map} roughness={0.88} metalness={0} />
    </mesh>
  );
}

function Dust() {
  const count = 110;
  const { positions, seeds } = useMemo(() => {
    const rand = seeded(7);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Weighted toward the window side, where the shafts are
      positions[i * 3] = -9 + rand() * 15;
      positions[i * 3 + 1] = 0.5 + rand() * 7;
      positions[i * 3 + 2] = -6 + rand() * 11;
      seeds[i] = rand();
    }
    return { positions, seeds };
  }, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 45 },
      uColor: { value: new THREE.Color(BONE) },
    }),
    [],
  );
  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uColor.value.copy(lit.dust).multiplyScalar(tod.dustA);
  });
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
      />
    </points>
  );
}

// Camera follows the shared pointer value: a few degrees of swing, never more
function CameraRig({ still }: { still: boolean }) {
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const px = still ? 0 : parallax.x;
    const py = still ? 0 : parallax.y;
    camera.position.set(CAM_POS.x + px * 1.1, CAM_POS.y - py * 0.45, CAM_POS.z);
    look.set(CAM_LOOK.x - px * 0.35, CAM_LOOK.y + py * 0.15, CAM_LOOK.z);
    camera.lookAt(look);
  });
  return null;
}

// Renders the room into an offscreen target, then draws it through the film shader
function FilmPass({ still }: { still: boolean }) {
  const { gl, scene, camera } = useThree();
  // Not 0: the canvas runs antialias off, so these samples are the room's only AA
  const target = useFBO({ samples: IS_FIREFOX ? 2 : 4 });
  const post = useMemo(() => new THREE.Scene(), []);
  const ortho = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const uniforms = useMemo(
    () => ({
      tScene: { value: target.texture },
      uRes: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uGrain: { value: 0.045 },
      uFringe: { value: 0.008 },
      uLift: { value: lit.lift },
    }),
    [target],
  );

  // Priority 1 takes over rendering from R3F.
  // Size is read here, not in an effect: an effect lags one frame behind a resize,
  // and a 0 x 0 uRes turns the fringe offsets into NaN (red/blue drop out, one green frame).
  useFrame((state, dt) => {
    const { width, height } = state.size;
    if (!width || !height) return;
    uniforms.uRes.value.set(width, height);
    if (!still) uniforms.uTime.value += dt;
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(post, ortho);
  }, 1);

  return createPortal(
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={postVertex}
        fragmentShader={postFragment}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>,
    post,
  );
}
