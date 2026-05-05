# Build Workflow

How a session executes work on this project.

---

## Before any non-trivial change

1. Read `CLAUDE.md`.
2. Identify the use case. Read the matching `.claude/use-cases/*.md`.
3. Identify which rules govern: `design-system.md`, `motion.md`, `3d-space.md`, `content-strategy.md`.
4. State the plan: scope, files, risks, anti-patterns watched.
5. Get alignment from the user. Then build.

---

## File and folder conventions

```
app/
  layout.tsx                # root layout, fonts, theme provider, ambient bg
  page.tsx                  # home assembles all sections
  globals.css               # tokens, base styles
components/
  ui/                       # primitives: Button, Eyebrow, Glyph, Container, GlassCard
  layout/                   # Nav, Footer, AmbientBackground, ThemeToggle
  sections/                 # Hero, SelectedWork, ProjectSpace, Capabilities, About, Contact
  effects/                  # CrtOverlay (signature shader), reveal helpers
  three/                    # R3F scene + panels + fallback
content/
  projects.ts               # project entries (typed)
  copy.ts                   # site-wide copy (hero, about, capabilities)
lib/
  hooks/                    # useReducedMotion, useMediaQuery, useTheme
  utils/                    # cn, etc.
public/
  fonts/                    # if self-hosted later
  thumbs/                   # project thumbnails
```

---

## Coding conventions

- TypeScript strict mode on.
- Prefer named exports.
- Sections export a default `Section()` component and accept no required props.
- Co-locate small components inside their section file when they aren't reused.
- Promote to `components/ui/` only when reused in 2+ places.
- All animation variants live in a `variants` const at top of file.
- All copy lives in `content/copy.ts` (no string literals scattered across components).

---

## Quality gates before declaring "done"

- [ ] No anti-patterns from `CLAUDE.md` §8 present.
- [ ] Reduced motion path verified.
- [ ] Keyboard tab through every interactive element.
- [ ] Visible focus states on every interactive element.
- [ ] Light + dark both legible.
- [ ] Mobile (375px), tablet (768px), desktop (1280px+) all hold.
- [ ] No layout shift on font load.
- [ ] Lighthouse perf > 85 on desktop (MVP target; v2 raises bar).
- [ ] Run `final-polish.md` checklist for ship-quality work.

---

## Commit hygiene

This project is currently a single working tree, not a git repo. Once initialized:

- Commit per section, not per file.
- Commit messages: `section(hero): cinematic reveal sequence`, `tokens: signal accent + ember`.
- No "fix stuff" / "wip" commits on main.

---

## When stuck

If a design choice feels wrong:

1. Re-read the design blend in `CLAUDE.md` §2.
2. Identify which reference the section pulls from.
3. Ask: am I copying or extracting? Extract patterns, not specifics.
4. If still stuck, propose 2 directions to the user and pick.
