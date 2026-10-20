'use client';

import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import { MacbookModel, type MacbookControls } from './MacbookModel';
import { Studio } from './Studio';

// Dev-only workbench for the MacBook model: orbit, open the lid, light the H.
// `?open=0.4&lit=1&view=front|top|three` sets the starting state (used for screenshots).
export default function MacbookLab() {
  const controls = useRef<MacbookControls>({ open: 0, lit: 1, screen: 0 });
  const [open, setOpen] = useState(0);
  const [lit, setLit] = useState(1);
  const [view, setView] = useState<'three' | 'front' | 'top'>('three');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const o = q.get('open');
    const l = q.get('lit');
    const v = q.get('view');
    if (o !== null) setOpen(Number(o));
    if (l !== null) setLit(Number(l));
    if (v === 'front' || v === 'top' || v === 'three') setView(v);
  }, []);

  useEffect(() => {
    controls.current.open = open;
    controls.current.lit = lit;
  }, [open, lit]);

  const camera = {
    three: [0.32, 0.3, 0.52] as const,
    front: [0, 0.12, 0.62] as const,
    top: [0, 0.62, 0.12] as const,
  }[view];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#07070a' }}>
      <Canvas key={view} camera={{ position: [...camera], fov: 32, near: 0.01, far: 20 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Studio />
          <MacbookModel controls={controls} />
          <ContactShadows position={[0, -0.004, 0]} opacity={0.65} scale={0.9} blur={2.4} far={0.3} />
        </Suspense>
        <OrbitControls target={[0, 0.06, 0]} makeDefault />
      </Canvas>

      <div className="hud" style={{ position: 'fixed', left: 16, bottom: 16, display: 'grid', gap: 8, color: '#f4f4ee' }}>
        <label>
          Lid {open.toFixed(2)}{' '}
          <input type="range" min={0} max={1} step={0.01} value={open} onChange={(e) => setOpen(Number(e.target.value))} />
        </label>
        <label>
          H glow {lit.toFixed(2)}{' '}
          <input type="range" min={0} max={1} step={0.01} value={lit} onChange={(e) => setLit(Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
}
