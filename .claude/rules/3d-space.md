# 3D Project Space — Rules

The 3D section is the technical signature of the portfolio. It must be one section, not a theme.

---

## Philosophy

- 3D is content, not chrome.
- The scene shows projects as **floating glass panels** in spatial composition (cinematic camera, depth of field).
- Camera is always slightly in motion — orbit is gentle, never disorienting.
- The viewer is invited to navigate, not forced.

---

## Composition

- 4–6 project panels arranged in a curved arc around the camera origin.
- Each panel: rounded rectangle (~16:10), glass material, project thumbnail mapped, subtle bevel.
- Hovered panel: lifts forward in Z, slight scale, shader signature flicker on edge (the one allowed retro moment).
- Selected panel: panel reads its full metadata in a 2D overlay anchored to its screen-space position.

---

## Tech

- `@react-three/fiber` + `@react-three/drei`
- Camera: `PerspectiveCamera`, fov 38, slight `useFrame` drift
- Materials: `MeshPhysicalMaterial` with `transmission`, `thickness`, `ior`, mild `roughness`
- Lighting: 1 directional key, 1 soft fill, 1 environment map (drei `Environment preset="city"` in dark, `"apartment"` in light)
- Postprocessing (optional, behind a flag): `@react-three/postprocessing` Bloom + ChromaticAberration. Off by default; on only at high DPI + non-mobile.

---

## Performance budget

- 60fps on M1 baseline
- < 1.5MB total 3D bundle (lazy-loaded)
- Lazy: `next/dynamic` import the 3D scene with `ssr: false`
- DPR clamp: `dpr={[1, Math.min(window.devicePixelRatio, 2)]}`
- Shadows: off (use baked AO in textures or skip)
- Single environment map, low resolution (256–512)

Mobile (<768px or coarse pointer): replace the 3D canvas with the **CSS-fake fallback** (see below).

---

## CSS-fake fallback (when WebGL unavailable, mobile, or reduced-motion)

A layered 2D composition that *looks* 3D:

- 4–6 cards positioned with CSS `transform: perspective(1200px) rotateY(...) translateZ(...)`
- `backdrop-filter` glass + soft shadows
- Subtle parallax driven by scroll progress
- No interactivity beyond hover/focus

This must look intentional, not a downgrade. It uses the same panel design as the WebGL version.

---

## Detection logic

```ts
const supportsWebGL = useMemo(() => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch { return false; }
}, []);

const isCoarse = useMediaQuery('(pointer: coarse)');
const reducedMotion = useReducedMotion();

const useFallback = !supportsWebGL || isCoarse || reducedMotion;
```

---

## Accessibility

- The 3D scene must NOT be the only way to access project information. Selected Work above already lists everything.
- Provide a "Skip to next section" link inside the 3D section's bounds for keyboard users.
- The canvas is `aria-hidden="true"`; metadata for currently-focused panel is rendered in semantic HTML overlay with proper headings.
- Tab key cycles through panels in fallback mode.

---

## Anti-patterns (3D)

- 3D in the hero (no — Mad Creative confidence is typographic)
- 3D in Capabilities, About, or Contact
- Auto-rotating scene with no user agency
- Particles for the sake of particles
- Heavy GLTF models — we use glass panels with image textures, that's it
- Postprocessing stacked thick (one or two effects max, gated)
