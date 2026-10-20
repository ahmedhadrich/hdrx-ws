'use client';

import { Environment, Lightformer } from '@react-three/drei';

// Product-shot lighting without an HDRI download: a few soft area lights the metal reflects.
// `environmentOnly`: reflections only, no extra light, for scenes that light themselves (the room).
export function Studio({ environmentOnly = false }: { environmentOnly?: boolean }) {
  return (
    <>
      {!environmentOnly && <ambientLight intensity={0.15} />}
      <Environment resolution={256} environmentIntensity={environmentOnly ? 0.45 : 1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 2, 1]} scale={[3, 1, 1]} rotation-x={Math.PI / 2.5} />
        <Lightformer form="rect" intensity={1.2} position={[-2, 0.6, 1]} scale={[1.2, 2, 1]} rotation-y={Math.PI / 3} />
        <Lightformer
          form="rect"
          intensity={0.8}
          position={[2, 0.4, -1]}
          scale={[1.2, 2, 1]}
          rotation-y={-Math.PI / 2.5}
          color="#cfe6ff"
        />
        <Lightformer form="ring" intensity={0.6} position={[0, 1, -2]} scale={1.5} color="#ffd9c4" />
      </Environment>
    </>
  );
}
