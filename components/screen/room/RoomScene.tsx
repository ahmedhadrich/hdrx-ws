'use client';

import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { parallax } from './parallax';
import { useHour, useScreenSettings, type Accent } from '../settings';
import { dustFragment, dustVertex, postFragment, postVertex, skyFragment, skyVertex } from './shaders';

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
// The accent palette stays the room's colour identity (bounce, horizon, lift); the hour sets
// angle, strength and warmth. Night keeps a dim cool "moon" on the same shadow light, plus the lamp.
const SUN_R = 24;
const DEG = Math.PI / 180;
const NUM_KEYS = ['elev', 'az', 'sunI', 'hemiI', 'hemiMix', 'ambI', 'fillI', 'lampI', 'dustA', 'sunMix', 'skyK'] as const;
type NumKey = (typeof NUM_KEYS)[number];
type Tod = Record<NumKey, number> & { sunCol: THREE.Color; hemiCol: THREE.Color };
type Keyframe = Tod & { h: number };

const MOON = c('#8fa8d8');
const NIGHT_FILL = c('#6f86b8');
// elev/az in degrees (az: + is toward the camera); sunMix = how much the accent tints the sun
function kf(
  h: number, elev: number, az: number, sunI: number, sunCol: THREE.Color, hemiI: number, hemiMix: number,
  ambI: number, fillI: number, lampI: number, dustA: number, sunMix: number, skyK: number,
): Keyframe {
  return { h, elev, az, sunI, sunCol, hemiI, hemiMix, ambI, fillI, lampI, dustA, sunMix, skyK, hemiCol: NIGHT_FILL };
}
const KEYS: Keyframe[] = [
  //  hour elev  az  sunI  sunCol          hemiI mix  amb  fill lamp dust sunMix sky
  kf(0, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1),
  kf(5, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1),
  kf(5.5, 26, 20, 0, MOON, 0.5, 0.6, 0.16, 0.6, 13, 0.6, 0.1, 0.15),
  kf(5.9, 2, 18, 0, c('#ff9a6a'), 0.42, 0.4, 0.12, 0.8, 11, 0.8, 0.5, 0.25),
  kf(6.4, 5, 18, 1.0, c('#ffb98a'), 0.42, 0.3, 0.1, 0.9, 9, 1.0, 0.5, 0.35),
  kf(9, 26, 22, 3.2, c('#ffe9c8'), 0.75, 0, 0.1, 0.8, 2, 0.8, 0.35, 0.55),
  kf(13, 42, 26, 3.2, c('#fff4e0'), 0.85, 0, 0.1, 0.6, 0.6, 0.6, 0.25, 0.6),
  kf(17.5, 21, 22, 3.6, c('#ffd2a0'), 0.6, 0, 0.12, 1, 7, 1, 1, 0.5),
  kf(19.5, 3, 30, 1.1, c('#ff9a5a'), 0.45, 0.3, 0.12, 1, 10, 1, 0.6, 0.3),
  kf(20.2, 2, 30, 0, c('#ff8a50'), 0.45, 0.5, 0.14, 0.9, 12, 0.8, 0.4, 0.2),
  kf(20.7, 26, 20, 0, MOON, 0.55, 0.65, 0.18, 0.6, 13, 0.6, 0.1, 0.12),
  kf(21.5, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1),
  kf(24, 30, 20, 0.9, MOON, 0.6, 0.75, 0.2, 0.5, 14, 0.6, 0.05, 0.1),
];

const newTod = (): Tod => ({ ...KEYS[7], sunCol: KEYS[7].sunCol.clone(), hemiCol: KEYS[7].hemiCol.clone() });
// Live (eased) and target state; module-level like `atmo` so every component reads this frame's values
const tod: Tod = newTod();
const todTarget: Tod = newTod();

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
function TimeOfDay({ still }: { still: boolean }) {
  const hour = useHour();
  const { invalidate } = useThree();
  const first = useRef(true);

  useEffect(() => {
    sampleTod(hour, todTarget);
    if (still || first.current) {
      for (const k of NUM_KEYS) tod[k] = todTarget[k];
      tod.sunCol.copy(todTarget.sunCol);
      tod.hemiCol.copy(todTarget.hemiCol);
      first.current = false;
    }
    invalidate();
  }, [hour, still, invalidate]);

  useFrame((_, dt) => {
    const k = still ? 1 : 1 - Math.exp(-dt * 6);
    for (const key of NUM_KEYS) tod[key] += (todTarget[key] - tod[key]) * k;
    tod.sunCol.lerp(todTarget.sunCol, k);
    tod.hemiCol.lerp(todTarget.hemiCol, k);
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
}

export default function RoomScene({ still, children, externalCamera = false }: Props) {
  return (
    <Canvas
      className="mbp__scene"
      camera={{ position: CAM_POS.toArray(), fov: CAM_FOV, near: 0.05, far: 200 }}
      dpr={[1, 1.25]}
      // PCF, not R3F's default PCFSoft: three r18x deprecated soft shadows and warns on every shadow render
      shadows="percentage"
      frameloop={still ? 'demand' : 'always'}
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
      f.color.copy(atmo.bounce);
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
    uniforms.uTop.value.copy(atmo.top);
    uniforms.uHorizon.value.copy(atmo.horizon);
    uniforms.uSun.value.copy(atmo.sun);
    // Night: sky sinks toward deep blue and dims; the sun glow follows the sun's arc
    uniforms.uTop.value.lerp(NIGHT_FILL, tod.hemiMix * 0.5).multiplyScalar(0.6 + tod.skyK);
    uniforms.uHorizon.value.lerp(NIGHT_FILL, tod.hemiMix * 0.6);
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
      back: wallGeometry(36, 15, []),
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
  const pot = useMemo(() => new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.8 }), []);
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6c8f7c', roughness: 0.7, side: THREE.DoubleSide }), []);

  const bars = [-3.25, 0, 3.25];
  const leaves = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const a = (i / 7) * Math.PI * 2;
    const lean = 0.35 + (i % 3) * 0.18;
    return { a, lean, h: 1.0 + (i % 4) * 0.28 };
  });

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

      {/* Low bench against the back wall, with one plant */}
      <mesh material={wood} position={[7.2, 0.5, -8.3]} castShadow receiveShadow>
        <boxGeometry args={[7, 1, 1.3]} />
      </mesh>
      <group position={[9.0, 1, -8.3]}>
        <mesh material={pot} position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.38, 1, 24]} />
        </mesh>
        {leaves.map((l) => (
          <mesh
            key={l.a}
            material={leaf}
            position={[Math.sin(l.a) * 0.18, 1.0 + l.h * 0.5, Math.cos(l.a) * 0.18]}
            rotation={[Math.cos(l.a) * l.lean, 0, -Math.sin(l.a) * l.lean]}
            scale={[0.2, l.h, 0.06]}
            castShadow
          >
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ))}
      </group>

      <Pendant />
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
    uniforms.uColor.value.copy(atmo.dust).multiplyScalar(tod.dustA);
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
  const target = useFBO({ samples: 4 });
  const post = useMemo(() => new THREE.Scene(), []);
  const ortho = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const uniforms = useMemo(
    () => ({
      tScene: { value: target.texture },
      uRes: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uGrain: { value: 0.045 },
      uFringe: { value: 0.008 },
      uLift: { value: atmo.lift },
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
