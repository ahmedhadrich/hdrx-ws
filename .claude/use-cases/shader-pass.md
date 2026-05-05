# Use Case — Shader Pass

The retro-tech signature is one moment, not a theme. This file governs that moment.

---

## Rule

There is exactly **one** signature shader/CRT effect in the portfolio. Choose one of:

- **Hero media** — a small media surface (logo, hero portrait, hero accent shape) with subtle CRT
- **Project card hover** — brief flicker + edge chromatic aberration on hover/focus
- **Transition into 3D Project Space** — scanline + signal-loss wipe as the camera dollies in

Default in MVP: **3D entry transition** — most cinematic, least repetitive, occurs at most once per scroll.

---

## Approved effect ingredients

- Scanlines (mild, 2–4% opacity, 2px line)
- Subtle chromatic aberration (max 2px channel offset)
- Mild flicker (random brightness ±2% at 60Hz)
- Signal-loss wipe (vertical noise band passing once)

Pick **at most two** ingredients for the chosen moment.

---

## Forbidden

- Site-wide CRT overlay
- VHS warp on every page
- Glitch text on every heading
- Phosphor glow on body copy
- Chromatic aberration on body text (illegible)

---

## Implementation

Two viable paths:

1. **CSS-only** — best for the project card hover. A pseudo-element with `mix-blend-mode: screen` and a scanline gradient + a transform-based color split.
2. **Shader (R3F postprocessing)** — best for the 3D entry transition. Custom fragment shader passed once during the camera dolly. Disabled when `reduced-motion: reduce`.

The retro-tech signature MUST respect `prefers-reduced-motion` and degrade to a static, non-animated overlay (or skip entirely).

---

## Color palette for retro signature

Use `--accent-ember` (#7B1F1F) and `--accent-bone` for the rare "retro" moment. Never `--accent-signal`. The retro moment should feel intentional and slightly warmer than the base palette.

---

## Final check

After implementation, scroll the entire site. If you encounter the retro effect more than once per session in a non-interactive way, you've over-applied it. Pull it back.
