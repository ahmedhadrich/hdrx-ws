'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, RoundedBox } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { projects, type Project } from '@/content/projects';

interface SceneProps {
  onSelect: (project: Project | null) => void;
  selectedSlug: string | null;
  theme: 'dark' | 'light';
}

export function ProjectScene({ onSelect, selectedSlug, theme }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5.4], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={[theme === 'dark' ? '#0b0b0e' : '#fafaf7']} />
        <ambientLight intensity={theme === 'dark' ? 0.35 : 0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} color="#FFE7D6" />
        <directionalLight position={[-4, -2, 3]} intensity={0.4} color="#7AC2C9" />
        <Environment preset={theme === 'dark' ? 'city' : 'apartment'} />

        <CameraDrift />

        <group>
          {projects.map((p, i) => (
            <Panel
              key={p.slug}
              project={p}
              index={i}
              total={projects.length}
              selected={selectedSlug === p.slug}
              onSelect={onSelect}
            />
          ))}
        </group>
      </Suspense>
    </Canvas>
  );
}

function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(t * 0.12) * 0.35;
    state.camera.position.y = 0.2 + Math.sin(t * 0.18) * 0.08;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

interface PanelProps {
  project: Project;
  index: number;
  total: number;
  selected: boolean;
  onSelect: (p: Project | null) => void;
}

function Panel({ project, index, total, selected, onSelect }: PanelProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // panels spread across a ~120° arc facing the camera
  const { position, rotation } = useMemo(() => {
    const arc = Math.PI * 0.66;
    const start = -arc / 2;
    const t = total > 1 ? index / (total - 1) : 0.5;
    const angle = start + arc * t;
    const radius = 4.2;
    const x = Math.sin(angle) * radius;
    const z = -Math.cos(angle) * radius + radius - 1.5;
    const y = index % 2 === 0 ? 0.18 : -0.18;
    return {
      position: [x, y, z] as [number, number, number],
      rotation: [0, -angle, 0] as [number, number, number],
    };
  }, [index, total]);

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
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const active = hovered || selected;
    const targetZ = position[2] + (active ? 0.4 : 0) + Math.sin(t * 0.5 + index) * 0.04;
    const targetY = position[1] + Math.sin(t * 0.4 + index * 1.4) * 0.04;
    ref.current.position.z += (targetZ - ref.current.position.z) * 0.08;
    ref.current.position.y += (targetY - ref.current.position.y) * 0.08;
    const targetScale = active ? 1.04 : 1;
    ref.current.scale.x += (targetScale - ref.current.scale.x) * 0.1;
    ref.current.scale.y += (targetScale - ref.current.scale.y) * 0.1;
  });

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox
        args={[1.78, 1.13, 0.04]}
        radius={0.06}
        smoothness={4}
        position={[0, 0, -0.03]}
      >
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={hovered || selected ? 0.55 : 0.0}
        />
      </RoundedBox>

      <RoundedBox
        ref={ref}
        args={[1.7, 1.06, 0.05]}
        radius={0.05}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(selected ? null : project);
        }}
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
        />
      </RoundedBox>
    </group>
  );
}
