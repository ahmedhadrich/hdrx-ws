'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { projects, type Project } from '@/content/projects';
import {
  DEFAULT_CAMERA_TUNING,
  type CameraTuning,
} from '@/components/three/cameraTuning';

// ---------------------------------------------------------------------------
// CRT shader — applied per-panel on hover/focus (the one allowed retro moment)
// Derived from shader.se's postprocessing chain: sepia, chromatic aberration
// (vertical RGB split), film grain (sin-hash), scanlines, vignette, phosphor
// edge glow, and subtle flicker driven by uTime.
// ---------------------------------------------------------------------------
const CRT_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CRT_FRAG = /* glsl */ `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;

varying vec2 vUv;

vec3 sepia(vec3 c) {
  return vec3(
    dot(c, vec3(0.393, 0.769, 0.189)),
    dot(c, vec3(0.349, 0.686, 0.168)),
    dot(c, vec3(0.272, 0.534, 0.131))
  );
}

float filmGrain(vec2 uv, float t) {
  return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + t);
}

void main() {
  vec2 uv = vUv;

  // Edge fade — feather the CA at panel borders
  float edgeX = smoothstep(0.0, 0.02, uv.x) * smoothstep(0.0, 0.02, 1.0 - uv.x);
  float edgeY = smoothstep(0.0, 0.02, uv.y) * smoothstep(0.0, 0.02, 1.0 - uv.y);
  float edgeFade = edgeX * edgeY;

  // Chromatic aberration — vertical RGB split (shader.se pattern, aspect 1.7/1.06)
  float aspectRatio = 1.6038;
  vec2 scaledRatio = vec2(aspectRatio, 1.0) / aspectRatio;
  float dist = length((uv - 0.5) * scaledRatio * 2.0);
  float caY = 0.001 * dist * 2.0 * 1.04;
  vec4 straight = texture2D(uTexture, uv);
  vec4 chromatic = vec4(
    texture2D(uTexture, uv + vec2(0.0, -caY)).r,
    straight.g,
    texture2D(uTexture, uv + vec2(0.0,  caY)).b,
    straight.a
  );
  vec4 color = mix(straight, chromatic, edgeFade);

  // Gamma curve
  color.rgb = pow(color.rgb, vec3(1.92));

  // Sepia + brightness
  color.rgb = clamp(mix(color.rgb, sepia(color.rgb), 0.22) * 1.2, 0.0, 1.0);

  // Contrast
  color.rgb = clamp((color.rgb - 0.5) * 0.97 + 0.5, 0.0, 1.0);

  // Film grain (sin-hash Gaussian, no texture needed)
  float grain = filmGrain(uv, uTime);
  color.rgb += vec3(grain) * (1.0 - color.rgb) * 0.041;

  // Scanlines — very subtle horizontal bands
  float scan = sin(uv.y * 180.0) * 0.5 + 0.5;
  color.rgb *= mix(1.0, scan * 0.85 + 0.15, 0.12);

  // Vignette
  float vigDist = length(uv - 0.5);
  float vigMask = smoothstep(-0.3, 0.3, 0.5 - vigDist);
  color.rgb = mix(color.rgb, clamp(color.rgb * vigMask, 0.0, 1.0), 0.1);

  // Phosphor edge glow (accent-ember: #7B1F1F)
  color.rgb += vec3(0.48, 0.12, 0.12) * (1.0 - edgeFade) * 0.5;

  // Subtle flicker
  float flicker = 1.0 + sin(uTime * 23.9) * 0.015 + sin(uTime * 5.3) * 0.01;
  color.rgb *= flicker;

  gl_FragColor = vec4(color.rgb, uIntensity);
}
`;

interface SceneProps {
  onSelect: (project: Project | null) => void;
  onFocus: (index: number) => void;
  selectedSlug: string | null;
  entered: boolean;
  focusedIndex: number;
  theme: 'dark' | 'light';
  cameraTuning?: CameraTuning;
}

// Shared arc layout computation — used by both CameraDrift and Panel
function computePanelLayouts(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const arc = Math.PI * 0.55;
    const start = -arc / 2;
    const t = count > 1 ? i / (count - 1) : 0.5;
    const angle = start + arc * t;
    const radius = 4.0;
    return {
      x: Math.sin(angle) * radius,
      y: i % 2 === 0 ? 0.15 : -0.15,
      z: -Math.cos(angle) * radius + radius - 1.2,
      angle,
      ry: -angle,
    };
  });
}

export function ProjectScene({
  onSelect,
  onFocus,
  selectedSlug,
  entered,
  focusedIndex,
  theme,
  cameraTuning = DEFAULT_CAMERA_TUNING,
}: SceneProps) {
  const panelLayouts = useMemo(() => computePanelLayouts(projects.length), []);
  const focusedLayout = focusedIndex >= 0 ? panelLayouts[focusedIndex] : null;

  return (
    <Canvas
      camera={{
        position: [cameraTuning.ambientX, cameraTuning.ambientY, cameraTuning.ambientZ],
        fov: cameraTuning.fov,
      }}
      dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={[theme === 'dark' ? '#0b0b0e' : '#fafaf7']} />
        <ambientLight intensity={theme === 'dark' ? 0.35 : 0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} color="#FFE7D6" />
        <directionalLight position={[-4, -2, 3]} intensity={0.4} color="#7AC2C9" />
        <CameraDrift
          entered={entered}
          focusedLayout={focusedLayout}
          tuning={cameraTuning}
        />

        <group>
          {projects.map((p, i) => (
            <Panel
              key={p.slug}
              project={p}
              index={i}
              layout={panelLayouts[i]}
              selected={selectedSlug === p.slug}
              focused={focusedIndex === i}
              entered={entered}
              onSelect={onSelect}
              onFocus={onFocus}
            />
          ))}
        </group>
      </Suspense>
    </Canvas>
  );
}

interface PanelLayout {
  x: number;
  y: number;
  z: number;
  angle: number;
  ry: number;
}

interface CameraDriftProps {
  entered: boolean;
  focusedLayout: PanelLayout | null;
  tuning: CameraTuning;
}

function CameraDrift({ entered, focusedLayout, tuning }: CameraDriftProps) {
  // Persistent lerped look-at target — prevents camera snap when switching panels
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    if (state.camera instanceof THREE.PerspectiveCamera && state.camera.fov !== tuning.fov) {
      state.camera.fov = tuning.fov;
      state.camera.updateProjectionMatrix();
    }

    const t = state.clock.getElapsedTime();
    let targetX: number, targetY: number, targetZ: number;
    let lookX: number, lookY: number, lookZ: number;

    if (focusedLayout) {
      const { x, y, z, angle } = focusedLayout;
      // Panel face normal: local +Z maps to world (-sin(angle), 0, cos(angle))
      const dist = tuning.focusDistance;
      targetX = x + -Math.sin(angle) * dist;
      targetY = y + tuning.focusYOffset;
      targetZ = z + Math.cos(angle) * dist;
      lookX = x;
      lookY = y;
      lookZ = z;
    } else if (entered) {
      // Gentle drift while in the space with no panel focused
      targetX = tuning.enteredX + Math.sin(t * 0.11) * tuning.driftX;
      targetY = tuning.enteredY + Math.sin(t * 0.17) * tuning.driftY;
      targetZ = tuning.enteredZ;
      lookX = tuning.lookAtX;
      lookY = tuning.lookAtY;
      lookZ = tuning.lookAtZ;
    } else {
      // Ambient (not yet entered) — pulled back
      targetX = tuning.ambientX + Math.sin(t * 0.11) * (tuning.driftX * 0.5);
      targetY = tuning.ambientY + Math.sin(t * 0.17) * tuning.driftY;
      targetZ = tuning.ambientZ;
      lookX = tuning.lookAtX;
      lookY = tuning.lookAtY;
      lookZ = tuning.lookAtZ;
    }

    // Faster lerp when focused so the zoom feels responsive
    const lerpFactor = focusedLayout ? tuning.focusLerp : tuning.idleLerp;

    state.camera.position.x += (targetX - state.camera.position.x) * lerpFactor;
    state.camera.position.y += (targetY - state.camera.position.y) * lerpFactor;
    state.camera.position.z += (targetZ - state.camera.position.z) * lerpFactor;

    lookAt.current.x += (lookX - lookAt.current.x) * lerpFactor;
    lookAt.current.y += (lookY - lookAt.current.y) * lerpFactor;
    lookAt.current.z += (lookZ - lookAt.current.z) * lerpFactor;
    state.camera.lookAt(lookAt.current);
  });

  return null;
}

interface PanelProps {
  project: Project;
  index: number;
  layout: PanelLayout;
  selected: boolean;
  focused: boolean;
  entered: boolean;
  onSelect: (p: Project | null) => void;
  onFocus: (index: number) => void;
}

interface CrtOverlayProps {
  texture: THREE.Texture;
  active: boolean;
}

function CrtOverlayMesh({ texture, active }: CrtOverlayProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    }),
    [texture]
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.getElapsedTime();
    matRef.current.uniforms.uTime.value = t;
    const target = active ? 1.0 : 0.0;
    matRef.current.uniforms.uIntensity.value +=
      (target - matRef.current.uniforms.uIntensity.value) * 0.08;
  });

  return (
    <mesh position={[0, 0, 0.028]}>
      <planeGeometry args={[1.7, 1.06]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={CRT_VERT}
        fragmentShader={CRT_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function Panel({
  project,
  index,
  layout,
  selected,
  focused,
  entered,
  onSelect,
  onFocus,
}: PanelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const { x, y, z, ry } = layout;

  const texture = useLoader(THREE.TextureLoader, project.thumbnail);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
  }, [texture]);

  const accent = useMemo(
    () => new THREE.Color(project.accent ?? '#FF5A1F'),
    [project.accent]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    const floatAmp = entered ? 0.04 : 0.025;
    const targetFloatY = Math.sin(t * 0.4 + index * 1.4) * floatAmp;

    // Focused panels lift forward more than merely hovered/selected panels
    const liftZ = entered && (hovered || selected || focused) ? 0.45 : 0;
    const targetFloatZ =
      Math.sin(t * 0.5 + index) * (entered ? 0.035 : 0.02) + liftZ;

    meshRef.current.position.y += (targetFloatY - meshRef.current.position.y) * 0.07;
    meshRef.current.position.z += (targetFloatZ - meshRef.current.position.z) * 0.08;

    // Focused panels scale up more than hovered/selected
    const targetScale = focused
      ? 1.08
      : entered && (hovered || selected)
      ? 1.05
      : entered
      ? 1.0
      : 0.93;
    meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.08;
    meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.08;

    if (meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      const targetOpacity = entered ? 1.0 : 0.0;
      mat.opacity += (targetOpacity - mat.opacity) * 0.06;
    }
  });

  const interactive = entered;

  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      {/* Accent glow border */}
      <RoundedBox
        args={[1.78, 1.13, 0.04]}
        radius={0.06}
        smoothness={4}
        position={[0, 0, -0.03]}
      >
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={entered && (hovered || selected || focused) ? 0.5 : 0.0}
        />
      </RoundedBox>

      {/* Image panel */}
      <RoundedBox
        ref={meshRef}
        args={[1.7, 1.06, 0.05]}
        radius={0.05}
        smoothness={4}
        onPointerOver={
          interactive
            ? (e) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = 'pointer';
              }
            : undefined
        }
        onPointerOut={
          interactive
            ? () => {
                setHovered(false);
                document.body.style.cursor = 'auto';
              }
            : undefined
        }
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                onFocus(index);
                onSelect(selected ? null : project);
              }
            : undefined
        }
      >
        <meshPhysicalMaterial
          map={texture}
          roughness={0.25}
          metalness={0.05}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          transmission={0.0}
          thickness={0.3}
          ior={1.4}
          transparent
          opacity={0.0}
        />
      </RoundedBox>

      {/* CRT overlay — fades in on hover/focus (the one allowed retro moment) */}
      <CrtOverlayMesh texture={texture} active={entered && (hovered || focused)} />
    </group>
  );
}
