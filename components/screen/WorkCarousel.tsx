'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
// Aliased: drei's Image is a mesh, not an <img> (keeps jsx-a11y quiet)
import { Image as ImagePlane, RoundedBox } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { projects } from '@/content/projects';
import { FAN_VISIBLE, fanPose } from './fan';
import { isScreenVisible, onScreenVisibility } from '@/components/three/screenVisibility';

// Panel size in world units (16:10, matches the thumbnails)
const W = 1.6;
const H = 1.0;

// Below this the eased values are treated as arrived and the canvas stops drawing
const SETTLE = 1e-4;
// Frame step used for the first frame after the canvas sat idle (or hidden): R3F's clock delta would
// otherwise span the whole idle time and snap the fan halfway in one frame
const IDLE_STEP = 1 / 60;

// The webp next to each PNG (same 1600 x 1000, ~10x smaller). The PNGs stay the source
// for next/image (CssCarousel, case-study pages), which re-encodes them anyway.
const textureUrl = (thumbnail: string) => thumbnail.replace(/\.png$/, '.webp');

interface Props {
  active: number;
  onPick: (index: number) => void;
  dark: boolean;
}

export default function WorkCarousel({ active, onPick, dark }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.4], fov: 32 }}
      dpr={[1, 2]}
      // Draw only while something moves (fan easing, camera fit, hover, theme, textures):
      // at rest the panels are a still picture, and while the screen is hidden nothing draws
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
      // Layout size, not the on-screen size: the screen is CSS-warped onto the 3D display,
      // and pointer offsets are in layout pixels
      resize={{ offsetSize: true }}
      aria-hidden="true"
    >
      <ambientLight intensity={dark ? 0.7 : 1.1} />
      <directionalLight position={[2.5, 3, 4]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-3, -1, 2]} intensity={0.5} color="#7ac2c9" />
      <ScreenGate />
      <CameraFit />
      <Suspense fallback={null}>
        <Fan active={active} onPick={onPick} dark={dark} />
      </Suspense>
    </Canvas>
  );
}

// Redraws when the screen comes back into view (the zoomed-out room hides it). While it is
// hidden, frames are only drawn if R3F itself asks (a texture arriving, a resize).
function ScreenGate() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => onScreenVisibility((visible) => visible && invalidate()), [invalidate]);
  return null;
}

// Ask for another frame, unless the screen is hidden: then the motion simply resumes on the
// next visible frame. Returns whether the next frame is back to back with this one.
function keepDrawing(invalidate: () => void) {
  if (!isScreenVisible()) return false;
  invalidate();
  return true;
}

// Narrow canvases pull the camera back so the centre panel always fits.
function CameraFit() {
  const { camera, size, invalidate } = useThree();
  useFrame(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const target = aspect < 1.4 ? 4.4 * (1.4 / aspect) : 4.4;
    const gap = target - camera.position.z;
    if (Math.abs(gap) < SETTLE) {
      camera.position.z = target;
      return;
    }
    camera.position.z += gap * 0.1;
    keepDrawing(invalidate);
  });
  return null;
}

function Fan({ active, onPick, dark }: Props) {
  // Continuous position, eased towards the active index every frame
  const pos = useRef(active);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const images = useRef<(THREE.Mesh | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  // True when the previous frame didn't ask for this one (fan at rest, or screen hidden):
  // the clock delta then spans the gap, not one frame
  const resumed = useRef(true);

  // A new active panel, hover or theme: draw (the frame callback keeps going while easing)
  useEffect(() => {
    invalidate();
  }, [active, hovered, dark, invalidate]);

  useFrame((_, dt) => {
    const step = resumed.current ? IDLE_STEP : dt;
    pos.current += (active - pos.current) * (1 - Math.exp(-step * 6));
    if (Math.abs(active - pos.current) < SETTLE) {
      pos.current = active;
      resumed.current = true;
    } else {
      resumed.current = !keepDrawing(invalidate);
    }

    projects.forEach((_, i) => {
      const g = groups.current[i];
      const img = images.current[i];
      if (!g || !img) return;

      const pose = fanPose(i - pos.current);
      g.visible = pose.dist < FAN_VISIBLE + 0.5;
      if (!g.visible) return;

      const lift = hovered === i && i === active ? 0.12 : 0;
      g.position.set(pose.x * W, 0.08 - pose.y * W, -pose.dist * 0.35 + lift);
      g.rotation.set(0, -pose.angle * 0.55, -pose.angle);

      const near = Math.min(pose.dist, 1);
      const mat = img.material as THREE.ShaderMaterial & {
        grayscale: number;
        opacity: number;
        color: THREE.Color;
      };
      mat.grayscale = near * 0.85;
      mat.opacity = THREE.MathUtils.clamp(1 - pose.dist * 0.3, 0.12, 1);
      mat.color.setScalar(1 - near * (dark ? 0.45 : 0.2));
    });
  });

  return (
    <group>
      {projects.map((p, i) => (
        <group key={p.slug} ref={(el) => {
            groups.current[i] = el;
          }}>
          {/* Glass slab the image sits on */}
          <RoundedBox args={[W + 0.09, H + 0.09, 0.035]} radius={0.05} smoothness={4} position={[0, 0, -0.025]}>
            <meshPhysicalMaterial
              color={dark ? '#cfd6e0' : '#ffffff'}
              transparent
              opacity={dark ? 0.12 : 0.35}
              roughness={0.12}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.1}
              depthWrite={false}
            />
          </RoundedBox>
          <ImagePlane
            ref={(el) => {
              images.current[i] = el;
            }}
            url={textureUrl(p.thumbnail)}
            scale={[W, H]}
            radius={0.035}
            transparent
            toneMapped={false}
            onClick={(e) => {
              e.stopPropagation();
              onPick(i);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(i);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = '';
            }}
          />
        </group>
      ))}
    </group>
  );
}
