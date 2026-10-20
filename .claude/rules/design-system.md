# Design System

Single source of truth for tokens. Every component reads from these — no hard-coded values.

---

## Color

Restrained neutral base. Selective color breaks (HUPR-inspired) at section transitions only.

### Neutrals (base)

| Token | Light | Dark |
| --- | --- | --- |
| `--bg-base` | `#FAFAF7` (warm off-white) | `#0B0B0E` (near-black, slight blue) |
| `--bg-raised` | `#F2F1EC` | `#13131A` |
| `--bg-glass` | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.04)` |
| `--ink-primary` | `#0E0E12` | `#F4F4EE` |
| `--ink-secondary` | `#3A3A42` | `#A8A8B0` |
| `--ink-muted` | `#6E6E78` | `#6A6A74` |
| `--rule` | `rgba(14,14,18,0.10)` | `rgba(244,244,238,0.10)` |

### Selective accents (use sparingly — section transitions, hovers, focus)

| Token | Value | Use |
| --- | --- | --- |
| `--accent-signal` | `#87BBA2` (sage green; was signal orange #FF5A1F) | Primary CTA accent, focus rings, single-section break |
| `--accent-shore`  | `#E8865A` (terracotta orange; was washed teal #7AC2C9) | Secondary accent, link hover ghost |
| `--accent-bone`   | `#E9DFC8` (parchment) | Editorial overlay, card subtitle highlight |
| `--accent-ember`  | `#7B1F1F` (deep ember) | Used only in retro-tech shader signature |

**No purple gradients. No rainbow. No saturated tech-blue.**

### Theme switching

- Default: dark (cinematic)
- Light mode supported and complete
- Switch via `data-theme="light|dark"` on `<html>`

---

## Typography

Editorial display + practical body. Avoid generic startup sans pairings (no Inter+Inter).

### Stack

| Role | Family | Notes |
| --- | --- | --- |
| Display | **Fraunces** (variable, opsz+wght+SOFT) | Editorial serif with character, takes opsz at large sizes |
| Body | **Inter** (variable) | Workhorse for prose and UI |
| Mono | **JetBrains Mono** | Code, metadata, retro-tech signature |

Loaded via `next/font/google` with `display: swap`.

### Scale (rem, fluid via `clamp`)

| Token | Mobile → Desktop | Use |
| --- | --- | --- |
| `--text-display` | `clamp(3.5rem, 8vw, 8rem)` | Hero headline |
| `--text-h1` | `clamp(2.25rem, 5vw, 4rem)` | Section heads |
| `--text-h2` | `clamp(1.75rem, 3.5vw, 2.5rem)` | Subsection |
| `--text-h3` | `clamp(1.25rem, 2.2vw, 1.5rem)` | Card titles |
| `--text-body` | `1rem` (16px) | Default prose |
| `--text-small` | `0.875rem` | Meta, labels |
| `--text-micro` | `0.75rem` | Tags, eyebrow |

### Weights & treatment

- Display: 300 (light italic for poetic accents) and 600 (statement)
- Body: 400 / 500
- Mono: 500
- **Tracking**: tighter on display (-0.02em), neutral on body, looser on micro labels (+0.08em uppercase)
- **Leading**: 1.05 on display, 1.6 on body
- **Mixed case** in display lines (Adjaycent attitude): `Intent In Form`

---

## Spacing

8px base. Use named tokens — not arbitrary numbers.

| Token | px |
| --- | --- |
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-6` | 24 |
| `--space-8` | 32 |
| `--space-12` | 48 |
| `--space-16` | 64 |
| `--space-24` | 96 |
| `--space-32` | 128 |
| `--space-section` | `clamp(6rem, 12vw, 12rem)` (vertical section padding) |

Container: `--container-max: 84rem` (1344px). Side gutter: `clamp(1.25rem, 4vw, 3rem)`.

---

## Radius

| Token | px |
| --- | --- |
| `--radius-sm` | 6 |
| `--radius-md` | 12 |
| `--radius-lg` | 20 |
| `--radius-xl` | 28 |
| `--radius-pill` | 999 |

---

## Borders & Rules

- Hairline rule: `1px solid var(--rule)`
- Glass border: `1px solid rgba(255,255,255,0.10)` (dark) / `rgba(14,14,18,0.06)` (light)
- Section dividers (HUPR-inspired): `1px` rule + 96px vertical breathing space

---

## Shadows

Glass-aware. No generic Material elevation.

| Token | Value |
| --- | --- |
| `--shadow-soft` | `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)` |
| `--shadow-lift` | `0 2px 6px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.12)` |
| `--shadow-press` | inset `0 1px 0 rgba(255,255,255,0.5)` |
| `--shadow-glow-signal` | `0 0 0 1px rgba(135,187,162,0.55), 0 8px 24px rgba(135,187,162,0.2)` |

---

## Motion timing

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default reveals |
| `--ease-spring` | spring (stiffness 180, damping 22) | Cards, interactive |
| `--ease-glass` | `cubic-bezier(0.65, 0, 0.35, 1)` | Glass surfaces, transitions |
| `--dur-fast` | 180ms | Hover, focus |
| `--dur-base` | 360ms | Standard transitions |
| `--dur-slow` | 720ms | Hero reveal, section transitions |
| `--dur-cinematic` | 1400ms | Once-per-page hero theatrical reveal |

Reduced-motion: collapse all to opacity-only, max 200ms.

---

## Light & Dark Mode

- Both ship at MVP.
- Toggle in nav (sun/moon icon, no text label).
- Persists via `localStorage` and respects `prefers-color-scheme` on first load.
- 3D scene uses dark scene palette in dark mode and a daylit palette in light mode.

---

## Component Tokens

A few component-level conventions:

- **Glass card**: `--bg-glass` + 1px subtle border + `backdrop-filter: blur(20px) saturate(140%)` + `--shadow-soft`
- **CTA primary**: solid `--ink-primary` with `--accent-signal` underline that animates on hover
- **CTA secondary**: ghost — border `--rule`, hover fills with `--bg-raised`
- **Section eyebrow**: `--text-micro` + uppercase + `+0.12em` tracking + mono font + leading dot glyph

---

## Anti-patterns (design)

- No drop shadows on type
- No purple gradients
- No 3-column feature card grids
- No emoji in body copy (glyph dividers in display only, sparingly)
- No accent color on body text — accents reserved for CTAs, focus rings, transitions, and the single retro signature
