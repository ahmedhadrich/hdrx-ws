'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import type * as THREE from 'three';
import { configureTextBuilder } from 'troika-three-text';
import { PLINTH_FRONT } from './RoomScene';

// troika typesets in a blob: worker by default, which the site's CSP (next.config.mjs) blocks,
// and the text silently never appears. Main thread instead: it's one short line, set once.
configureTextBuilder({ useWorker: false });

// troika needs ttf / otf / woff (the site's Satoshi is woff2 only); without a font it fetches one from a CDN
const FONT = '/fonts/Geist-Regular.ttf';
const SIZE = 0.13;
const FADE_S = 0.6;

// Engraved, not printed: the letters are a darker grey than the stone, with a dark sliver along
// their top edge (the cut's upper wall in shadow) and a pale one along the bottom (its lower lip
// catching the light from above).
const LAYERS = [
  { color: '#3d3830', dy: 0.005, dz: 0.002 },
  { color: '#d8cbb2', dy: -0.006, dz: 0.003 },
  { color: '#5c574e', dy: 0, dz: 0.004 },
] as const;

interface Props {
  text: string;
  show: boolean;
  /** Seconds after `show` turns on before the fade starts (the camera settling) */
  delay: number;
}

// The zoomed-out hint, carved into the front face of the plinth under the MacBook
export function PlinthHint(props: Props) {
  return (
    <Suspense fallback={null}>
      <Carving {...props} />
    </Suspense>
  );
}

// troika's Text mesh: fillOpacity is applied at render time, no re-layout needed
type TextMesh = THREE.Mesh & { fillOpacity: number };

function Carving({ text, show, delay }: Props) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(TextMesh | null)[]>([]);
  const shownAt = useRef<number | null>(null);
  const opacity = useRef(0);

  useEffect(() => {
    shownAt.current = show ? performance.now() / 1000 : null;
  }, [show]);

  useFrame((_, dt) => {
    const now = performance.now() / 1000;
    const target = shownAt.current !== null && now - shownAt.current >= delay ? 1 : 0;
    const step = Math.min(dt, 0.1) / FADE_S;
    const next = target > opacity.current ? Math.min(1, opacity.current + step) : Math.max(0, opacity.current - step * 2);
    if (next === opacity.current) return;
    opacity.current = next;
    // Not the material's opacity: troika renders with its own derived copy of the material
    for (const m of meshes.current) if (m) m.fillOpacity = next;
    if (group.current) group.current.visible = next > 0;
  });

  return (
    <group ref={group} position={[0, PLINTH_FRONT.y, PLINTH_FRONT.z]} visible={false}>
      {LAYERS.map((l, i) => (
        <Text
          key={l.color}
          font={FONT}
          fontSize={SIZE}
          letterSpacing={0.22}
          anchorX="center"
          anchorY="middle"
          position={[0, l.dy, l.dz]}
          fillOpacity={0}
          ref={(m: TextMesh | null) => {
            meshes.current[i] = m;
          }}
        >
          {text.toUpperCase()}
          <meshStandardMaterial color={l.color} roughness={1} metalness={0} transparent />
        </Text>
      ))}
    </group>
  );
}
