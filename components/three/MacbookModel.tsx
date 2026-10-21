'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { H_PATH } from '@/components/ui/mark';

// MacBook Pro 14" (M5) by "Apple User" on Sketchfab, Free Standard licence.
// Compressed from the source GLB with gltf-transform (meshopt + webp), hierarchy kept.
export const MACBOOK_URL = '/models/macbook.glb';

// Node and material names in the source file (they are random IDs, not words)
const NODE = {
  lid: 'RcexTyyhpuJYATQ',
  logo: 'xiLiwJHfkqIwaTs',
  screen: 'tfTbkkzhxqpKRgC',
};
const MAT = {
  // Aluminium shell, shared by base and lid. In the source it was 'HdeQgqDhVRltuvQ';
  // gltf-transform's optimize merged it into this identical material when compressing.
  body: 'zNRfbdNyoCOxSDD',
  screen: 'HlQwFCAPWzetDQy',
};

// Model space is centimetres, Z down (the root node rotates it to Y up and scales to metres).
// Hinge axis runs along X at the back edge, level with the top of the base. Solved so that
// rotating by LID_CLOSED_RAD lays the display face-down just above the keys (z = -0.40);
// a pivot at the hinge barrel's centre (lower) buried the closed lid inside the base.
const HINGE = new THREE.Vector3(0, -11.0, -0.087);
// The file ships with the display tilted 110deg from the base; rotating back by this closes it.
export const LID_CLOSED_RAD = THREE.MathUtils.degToRad(110.0);
// Lid back faces backwards and slightly down: rotation that lays a plane onto it
const LID_BACK_TILT = Math.atan2(0.931, 0.365);
// The lit display panel, model space (lid open as shipped), from the screen mesh bounds:
// 30.08 x 19.56 cm, ratio 1.539 = the 14" panel (3024 x 1964).
const DISPLAY = {
  center: new THREE.Vector3(0, -15.137, -10.53),
  halfWidth: 15.038,
  halfHeight: 9.778,
  // Up along the panel (towards the camera notch): back and up, as the lid leans back
  up: new THREE.Vector3(0, -6.692, -18.374).normalize(),
};
export { DISPLAY_PX } from './display';

export interface MacbookControls {
  /** 0 = closed, 1 = open as shipped */
  open: number;
  /** H logo glow, 0..1 */
  lit: number;
  /** Display brightness, 0 = off. Rises at the end of the intro, just before the HTML screen takes over */
  screen?: number;
  /** Backlight strength once on (brightness setting x theme), 1 = full light-theme glow */
  backlight?: number;
}

export type MacbookRig = ReturnType<typeof buildRig> & {
  /** Apply lid / glow / screen values and refresh the lid's world matrix */
  apply: (c: MacbookControls) => void;
  /** Display corners in world space, order TL, TR, BR, BL (call after apply) */
  displayCorners: (out: THREE.Vector3[]) => THREE.Vector3[];
};

interface Props {
  controls?: MutableRefObject<MacbookControls>;
  /** Hand the rig to a parent that drives the lid itself every frame */
  onReady?: (rig: MacbookRig) => void;
  /** Cast and receive shadows (in the room, where the sun throws them onto the plinth) */
  castShadow?: boolean;
}

export function MacbookModel({ controls, onReady, castShadow = false }: Props) {
  const { scene } = useGLTF(MACBOOK_URL);
  const rig = useMemo(() => prepare(scene), [scene]);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = castShadow;
        o.receiveShadow = castShadow;
      }
    });
    // The H and its halo glow; they never block light
    rig.hMesh.castShadow = rig.glowMesh.castShadow = false;
  }, [scene, rig, castShadow]);
  const smooth = useRef({ open: controls?.current.open ?? 1, lit: controls?.current.lit ?? 0 });

  useEffect(() => {
    onReady?.(rig);
    // Hand over once per loaded scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig]);

  // Self-driven mode (lab): ease towards the control values
  useFrame((_, dt) => {
    if (!controls) return;
    const c = controls.current;
    const k = 1 - Math.exp(-dt * 12);
    smooth.current.open += (c.open - smooth.current.open) * k;
    smooth.current.lit += (c.lit - smooth.current.lit) * k;
    rig.apply({ open: smooth.current.open, lit: smooth.current.lit, screen: c.screen });
  });

  return <primitive object={scene} />;
}

// Start the download as soon as the 3D code loads (browser only; never on the server)
if (typeof window !== 'undefined') useGLTF.preload(MACBOOK_URL);

// One-time surgery on the cached scene: hinge pivot, logo swap, finish.
function prepare(scene: THREE.Object3D): MacbookRig {
  if (scene.userData.rig) return scene.userData.rig as MacbookRig;
  const base = buildRig(scene);

  // Display corners in pivot space (the pivot sits on the hinge)
  const right = new THREE.Vector3(DISPLAY.halfWidth, 0, 0);
  const up = DISPLAY.up.clone().multiplyScalar(DISPLAY.halfHeight);
  const local = [
    DISPLAY.center.clone().sub(right).add(up),
    DISPLAY.center.clone().add(right).add(up),
    DISPLAY.center.clone().add(right).sub(up),
    DISPLAY.center.clone().sub(right).sub(up),
  ].map((v) => v.sub(HINGE));

  const rig: MacbookRig = {
    ...base,
    apply(c) {
      base.pivot.rotation.x = LID_CLOSED_RAD * (1 - c.open);
      base.hMat.opacity = c.lit;
      base.glowMat.opacity = c.lit * 0.55;
      // Display backlight: the HTML screen sits on top, this is what shows through its glass
      const on = (c.screen ?? 0) * (c.backlight ?? 1);
      base.screenMat?.emissive.setRGB(0.62 * on, 0.62 * on, 0.6 * on);
      base.pivot.updateWorldMatrix(true, false);
    },
    displayCorners(out) {
      for (let i = 0; i < 4; i++) {
        out[i] = (out[i] ?? new THREE.Vector3()).copy(local[i]).applyMatrix4(base.pivot.matrixWorld);
      }
      return out;
    },
  };
  scene.userData.rig = rig;
  return rig;
}

function buildRig(scene: THREE.Object3D) {
  const lid = scene.getObjectByName(NODE.lid);
  const logo = scene.getObjectByName(NODE.logo);
  if (!lid?.parent || !logo?.parent) throw new Error('[MacbookModel] expected lid/logo nodes missing');

  // Re-parent the lid under a pivot sitting on the hinge axis
  const pivot = new THREE.Group();
  pivot.name = 'lidPivot';
  pivot.position.copy(HINGE);
  lid.parent.add(pivot);
  lid.position.sub(HINGE);
  pivot.add(lid);

  // Swap the Apple logo for a backlit H, same spot on the lid back
  // The logo is not hidden: hiding it left its recess in the lid shell, which caught the light
  // as a shiny logo shape. It keeps its place, filling the recess, and gets the lid's own
  // finish below (bodyMat), so it reads as plain aluminium under the H.
  const normal = new THREE.Vector3(0, -Math.sin(LID_BACK_TILT), Math.cos(LID_BACK_TILT));
  // Lifted off the lid (cm): the back panel isn't quite parallel to the logo's plane, and the
  // 13 cm halo sank into it, cutting the glow with a hard straight edge
  const at = logo.position.clone().addScaledVector(normal, 0.35);

  const hMat = new THREE.MeshBasicMaterial({
    map: hTexture(),
    transparent: true,
    opacity: 0,
    toneMapped: false,
    depthWrite: false,
  });
  const h = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), hMat);
  h.position.copy(at);
  h.rotation.x = LID_BACK_TILT;
  logo.parent.add(h);
  h.name = 'hLogo';

  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTexture(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), glowMat);
  glow.position.copy(at).addScaledVector(normal, -0.05);
  glow.rotation.x = LID_BACK_TILT;
  logo.parent.add(glow);
  glow.name = 'hGlow';

  let screenMat: THREE.MeshStandardMaterial | null = null;
  let bodyMat: THREE.MeshStandardMaterial | null = null;
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const std = m as THREE.MeshStandardMaterial;
      if (std.name === MAT.body) {
        // Space grey: anodised aluminium, mid roughness so the studio lights read as soft sheens
        std.color.set('#4a4b50');
        std.metalness = 1;
        std.roughness = 0.42;
        bodyMat = std;
      } else if (std.name === MAT.screen) {
        // Screen off; the live display is the HTML glass screen
        std.emissive.set('#000000');
        std.color.set('#050506');
        screenMat = std;
      }
    }
  });

  if (bodyMat && (logo as THREE.Mesh).isMesh) (logo as THREE.Mesh).material = bodyMat;

  return { pivot, lid, hMat, glowMat, hMesh: h, glowMesh: glow, screenMat: screenMat as THREE.MeshStandardMaterial | null };
}

function hTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.scale(512 / 100, 512 / 100);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 2;
  ctx.fill(new Path2D(H_PATH));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(235,242,255,0.55)');
  g.addColorStop(0.35, 'rgba(235,242,255,0.14)');
  g.addColorStop(1, 'rgba(235,242,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
