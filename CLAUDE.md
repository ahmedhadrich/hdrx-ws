# HDRX-WS — Personal Portfolio

This file is the long-term project memory. Future Claude Code sessions should read this first, then load the relevant `.claude/rules/*.md` and `.claude/use-cases/*.md` files for the work at hand.

---

## 1. Project Objective

A premium, immersive personal portfolio site for Ahmed Hadrich. The site must feel:

- Original (not template-driven, not "AI startup")
- Cinematic and confident
- Tactile and physical (motion has weight, surfaces feel real)
- Technically ambitious (3D, shader, ambient systems)
- Readable and usable above all else

The portfolio is the product. Style serves the work — never overpowers it.

---

## 2. Design Blend (primary creative constraint)

This blend is non-negotiable. Every section, component, and motion choice must trace back to this distribution.

| Weight | Source | Contribution |
| --- | --- | --- |
| 40% | Fluid Glass | Structure, polish, restraint, layered premium feel, glass surfaces |
| 20% | Mad Creative Agency | Hero impact, declarative typography, visual confidence |
| 15% | Pixel Melbourne | Project showcase gallery, playful card rhythm, character |
| 10% | HUPR | Colorful section transitions, scroll rhythm, breathing room |
| 10% | Shader | Retro-tech signature effect (one moment, not site-wide) |
| 5%  | Adjaycent | Editorial typography attitude, symbolic punctuation, sharpness |
| (secondary) | Loud | Ambient supporting background animation |

If a design decision doesn't pull from this list, reject it.

---

## 3. Section Architecture

> **Superseded for the home page (2026-10-20).** The home route `/` is now a single,
> non-scrolling screen: a glass MacBook Pro whose display carries everything (HUD,
> 3D work carousel, Capabilities / About / Contact as glass panels). See
> `.claude/notes/single-screen-home.md`. The list below still describes the content
> that must be reachable. The old scrolling-site section components (Hero, SelectedWork,
> ProjectSpace, Capabilities, About, Contact, ProjectSlider, the old ProjectScene/FallbackScene)
> were deleted on 2026-10-20 as unreachable dead code; they're in git history at 98bf68e.


The MVP ships these sections in this order:

1. **Hero** — cinematic first impression. Strong heading, positioning line, primary CTA, atmospheric depth. Inspired by Mad Creative Agency confidence + Fluid Glass polish.
2. **Selected Work** — gallery of projects. Pixel Melbourne rhythm. Each card: title, type, role, short impact summary. Structure must evolve into case studies later.
3. **3D Project Space** — interactive spatial section using React Three Fiber. Projects as floating glass cards / monitors / portals / panels. If full 3D is too heavy on a device, fake it elegantly with layered transforms + parallax.
4. **Capabilities** — clean editorial list of skills/services. Adjaycent attitude, restrained.
5. **About** — personal, direct, not generic. Voice-led.
6. **Contact** — minimal, clear. Email + social. No bloated form.

Plus a site-wide ambient background layer (Loud-inspired) that supports composition without distracting.

---

## 4. Coding Preferences

- **Package manager**: Bun. Always use `bun` / `bunx`. Never use `npm`, `yarn`, or `pnpm`.
- **Framework**: Next.js (App Router) + React 18+, TypeScript
- **Styling**: Tailwind CSS, with design tokens exposed as CSS custom properties on `:root`
- **3D**: `three`, `@react-three/fiber`, `@react-three/drei`
- **Animation**: `framer-motion` for component motion; GSAP only if scroll choreography demands it
- **Fonts**: `next/font` for self-hosted; expressive display + clean body (see design-system.md)
- **Component structure**: small, composable, colocated in `components/`. Sections in `components/sections/`.
- **State**: keep local. No global store needed for MVP.
- **Lint/format**: ESLint + Prettier defaults that ship with `create-next-app`.

---

## 5. Implementation Order

When building or refactoring:

1. Tokens and global styles
2. Layout shell + ambient background
3. Hero
4. Selected Work
5. 3D Project Space (with fallback)
6. Capabilities
7. About
8. Contact
9. Signature retro-tech shader moment (one place only)
10. Motion pass
11. Final polish (a11y, perf, reduced motion, anti-pattern audit)

Do not skip ahead. Do not polish a section before the next one is scaffolded.

---

## 6. Motion Philosophy

See `.claude/rules/motion.md` for full detail. Summary:

- Subtle by default. Expressive at: hero reveal, transitions into 3D, gallery interactions.
- Premium, organic, physical. Springs over linear easings.
- Techniques: opacity, clip-path reveals, transform-based parallax, depth/blur.
- Reduced-motion is a first-class path, not an afterthought.
- No purposeless floating effects.

---

## 7. 3D Philosophy

See `.claude/rules/3d-space.md` for full detail. Summary:

- One dedicated 3D section. No 3D bleeding into other sections.
- 3D supports the work, doesn't replace content.
- Performance budget: ~60fps on M1, graceful degradation below.
- Always provide a non-WebGL fallback.

---

## 8. Anti-Patterns to Avoid

These are blockers. If a design or implementation drifts toward any of these, stop and redirect.

- No generic AI startup layouts (no "Hero with gradient + 3 feature cards + pricing")
- No repetitive 3-column feature blocks
- No overuse of purple gradients
- No overuse of retro effects (CRT, scanlines, glitch must be rare and intentional)
- No style overpowering project content
- No unreadable typography (contrast ratios, line lengths must be respected)
- No unnecessary animation
- No overuse of 3D (one section, not everywhere)
- No cluttered hero (one headline, one positioning line, one CTA, atmosphere)

---

## 9. How to Continue Work in Future Sessions

For any new session:

1. Read this `CLAUDE.md` end-to-end.
2. Read all `.claude/rules/*.md` files. They are short by design.
3. Identify the use case for the requested work and load the matching `.claude/use-cases/*.md` file as a workflow guide.
4. **Always plan before non-trivial implementation.** State the plan, get alignment, then execute.
5. After meaningful changes, append context to `.claude/notes/` if the change shifts direction or unlocks new constraints.

Use cases available:

- `reference-audit.md` — auditing a new reference site
- `section-redesign.md` — reworking a section while preserving the blend
- `project-card-generation.md` — adding or restructuring a project entry
- `motion-pass.md` — running a motion improvement sweep
- `shader-pass.md` — applying retro-tech effects tastefully
- `final-polish.md` — pre-ship review checklist

---

## 10. The "Always Plan" Rule

Before any non-trivial implementation:

1. State the change in plain language.
2. Identify which rules and references apply.
3. List which files will change.
4. Identify risks (anti-patterns, performance, a11y).
5. Get alignment. Then build.

This rule exists because this project's value comes from intentionality. Skipping the plan compounds drift.

---

## 11. v2 Refinement Notes

See `.claude/notes/v2-refinements.md` for the running list of follow-ups deferred from MVP.
