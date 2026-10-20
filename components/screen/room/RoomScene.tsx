'use client';

import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, useFBO } from '@react-three/drei';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { parallax } from './parallax';
import { useScreenSettings, type Accent } from '../settings';
import { dustFragment, dustVertex, postFragment, postVertex, skyFragment, skyVertex } from './shaders';

// Design tokens, mirrored from globals.css (WebGL can't read CSS variables)
const BONE = '#e9dfc8';
const SIGNAL = '#ff5a1f';
const SHORE = '#7ac2c9';
const BASE = '#0b0b0e';

// Low dusk sun from the left, slightly in front of the back wall: it comes in through
// the side wall's openings as shafts and grazes the back wall's visible face. (From
// behind the back wall, that face only got the teal sky light and read olive green.)
const SUN_POS = new THREE.Vector3(-22, 11, 4);

// Where the camera rests and what it looks at
export const CAM_POS = new THREE.Vector3(0, 2.6, 14);
export const CAM_LOOK = new THREE.Vector3(0, 2.9, 0);
export const CAM_FOV = 34;
// Centre of the plinth's top face: the 3D MacBook stands here
export const PLINTH_TOP = new THREE.Vector3(0, 1.1, 1.2);

// ---------- Atmosphere: the accent colour sets the room's whole mood ----------
// signal = warm dusk (the original room), shore = cool blue hour, bone = pale sandstone day.
// Fog/background stay near-black (they show at the far wall and through the openings).
const ATMO_KEYS = ['top', 'horizon', 'sun', 'sunLight', 'bounce', 'hemiSky', 'hemiGround', 'dust', 'fog', 'lift'] as const;
type AtmoKey = (typeof ATMO_KEYS)[number];
type Palette = Record<AtmoKey, THREE.Color>;

// Colours go through THREE.Color(hex) so they are converted to linear like the rest of the scene
const c = (hex: string) => new THREE.Color(hex);
const PALETTES: Record<Accent, Palette> = {
  signal: {
    top: c(SHORE).multiplyScalar(0.55),
    horizon: c(BONE).lerp(c(SIGNAL), 0.35).multiplyScalar(0.9),
    sun: c(SIGNAL),
    sunLight: c('#ffb889'),
    bounce: c(SIGNAL),
    // Cool blue-grey, not teal: teal over the yellowish bone plaster read olive green
    hemiSky: c('#8f9bb0'),
    hemiGround: c('#1a120c'),
    dust: c(BONE),
    fog: c(BASE),
    lift: new THREE.Color(1.03, 1.0, 0.97),
  },
  shore: {
    top: c('#123840').multiplyScalar(0.9),
    horizon: c(BONE).lerp(c(SHORE), 0.6).multiplyScalar(0.85),
    sun: c('#bfeff2'),
    sunLight: c('#b6e2ee'),
    bounce: c(SHORE),
    hemiSky: c('#6f8fa8'),
    hemiGround: c('#0a1416'),
    dust: c(BONE).lerp(c(SHORE), 0.35),
    fog: c('#090d10'),
    lift: new THREE.Color(0.93, 1.0, 1.08),
  },
  bone: {
    top: c('#7a705f').multiplyScalar(0.7),
    horizon: c(BONE).multiplyScalar(0.95),
    sun: c('#fff2d8'),
    sunLight: c('#ffeccc'),
    bounce: c('#e6b98a'),
    hemiSky: c('#cdc1a8'),
    hemiGround: c('#1c1712'),
    dust: c('#fff5e2'),
    fog: c('#100f0d'),
    lift: new THREE.Color(1.05, 1.01, 0.93),
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
      <fog attach="fog" args={[BASE, 18, 60]} />
      <Atmosphere still={still} />
      <Lights />
      <Sky />
      <Architecture />
      <Water still={still} />
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
  const bounce = useRef<THREE.PointLight>(null);
  const { gl } = useThree();

  // Light colours follow the atmosphere; colour changes need no shadow re-bake
  useFrame(() => {
    sun.current?.color.copy(atmo.sunLight);
    bounce.current?.color.copy(atmo.bounce);
    if (hemi.current) {
      hemi.current.color.copy(atmo.hemiSky);
      hemi.current.groundColor.copy(atmo.hemiGround);
    }
  });

  // Nothing in the room moves, so bake the shadow map once and stop updating it
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);

  return (
    <>
      {/* Sky fill kept low: at 0.35 it tinted the bone plaster green */}
      <hemisphereLight ref={hemi} args={[SHORE, '#1a120c', 0.2]} />
      <ambientLight intensity={0.06} />
      <directionalLight
        ref={sun}
        position={SUN_POS.toArray()}
        intensity={2.8}
        color="#ffb889"
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
      {/* Warm bounce off the water onto the walls */}
      {/* Low and soft: stronger, it burned an orange hotspot into the plinth and the water */}
      <pointLight ref={bounce} position={[0, 0.3, 5]} intensity={1.8} distance={14} decay={2} color={SIGNAL} />
    </>
  );
}

function Sky() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(SHORE).multiplyScalar(0.55) },
      uHorizon: {
        value: new THREE.Color(BONE).lerp(new THREE.Color(SIGNAL), 0.35).multiplyScalar(0.9),
      },
      uSun: { value: new THREE.Color(SIGNAL) },
      uSunDir: { value: SUN_POS.clone().normalize() },
      uExposure: { value: 0.5 },
    }),
    [],
  );
  useFrame(() => {
    uniforms.uTop.value.copy(atmo.top);
    uniforms.uHorizon.value.copy(atmo.horizon);
    uniforms.uSun.value.copy(atmo.sun);
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

// Lumpy stone: an icosphere pushed around by layered sines
function stoneGeometry(seed: number) {
  const geo = new THREE.IcosahedronGeometry(1, 4);
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

function Architecture() {
  const geos = useMemo(
    () => ({
      // Back wall: a tall slot on the left, a round oculus on the right
      back: wallGeometry(30, 14, [rectHole(-7.4, 0.6, -6.2, 11.5), circleHole(5.2, 8.2, 1.9)]),
      // Side wall on the left, two narrow openings that throw light shafts across the floor
      side: wallGeometry(26, 14, [rectHole(-9, 0.6, -7.8, 9.5), rectHole(-3.6, 0.6, -2.6, 8.2)]),
      stoneA: stoneGeometry(1.3),
      stoneB: stoneGeometry(4.1),
    }),
    [],
  );

  const plaster = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BONE,
        roughness: 0.92,
        metalness: 0,
      }),
    [],
  );
  const stone = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b9ab92',
        roughness: 1,
        metalness: 0,
        flatShading: false,
      }),
    [],
  );

  return (
    <group>
      <mesh geometry={geos.back} material={plaster} position={[0, 0, -9]} castShadow receiveShadow />
      <mesh
        geometry={geos.side}
        material={plaster}
        position={[-11, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      />

      {/* Plinth the MacBook stands on */}
      <mesh material={plaster} position={[0, 0.45, 1.2]} castShadow receiveShadow>
        {/* Narrower than before so it frames the ~4-unit laptop; the top stays at PLINTH_TOP */}
        <boxGeometry args={[7, 0.9, 3.4]} />
      </mesh>
      <mesh material={plaster} position={[0, 1.0, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.2, 2.7]} />
      </mesh>

      {/* Stepped column, back right */}
      <mesh material={plaster} position={[8.2, 2.4, -5.2]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 4.8, 1.6]} />
      </mesh>
      <mesh material={plaster} position={[8.2, 5.4, -5.2]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.2, 1.1]} />
      </mesh>

      {/* Stones half sunk in the water */}
      <mesh
        geometry={geos.stoneA}
        material={stone}
        position={[6.4, 0.1, 3.4]}
        scale={[1.5, 0.9, 1.2]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geos.stoneB}
        material={stone}
        position={[-7.2, 0, 4.6]}
        scale={[0.9, 0.55, 0.8]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

// Tileable value noise used to ripple the reflections
function noiseTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      const n =
        Math.sin(u * 3 + Math.cos(v * 2) * 1.5) * 0.5 +
        Math.sin(v * 5 + Math.sin(u * 4) * 1.2) * 0.35 +
        Math.sin((u + v) * 7) * 0.15;
      const c = Math.round((n * 0.5 + 0.5) * 255);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = c;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.needsUpdate = true;
  return tex;
}

function Water({ still }: { still: boolean }) {
  const ripples = useMemo(() => noiseTexture(), []);
  useFrame((_, dt) => {
    if (still) return;
    ripples.offset.x += dt * 0.012;
    ripples.offset.y += dt * 0.008;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[300, 90]}
        mixBlur={1.1}
        mixStrength={2.2}
        mixContrast={1.05}
        mirror={0.75}
        depthScale={0.8}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.4}
        distortion={0.35}
        distortionMap={ripples}
        roughness={0.55}
        metalness={0.4}
        color="#15161b"
      />
    </mesh>
  );
}

// Seeded PRNG (mulberry32): same dust layout on every render, keeps the hook pure
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

function Dust() {
  const count = 90;
  const { positions, seeds } = useMemo(() => {
    const rand = seeded(7);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 18;
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
    uniforms.uColor.value.copy(atmo.dust);
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
