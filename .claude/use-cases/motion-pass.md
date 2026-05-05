# Use Case — Motion Pass

Periodic sweep to verify motion is supporting meaning, not decorating it.

---

## Trigger

- After any section is added or redesigned
- Before final polish
- When a user reports the site feels "busy" or "slow"

---

## Workflow

1. **Disable JS scroll triggers** mentally and watch each section. Does it still communicate? If not, motion is leaning too hard.
2. **Walk the site with reduced-motion on** (`prefers-reduced-motion: reduce`). Every section must remain comprehensible and beautiful.
3. **For each animated element**, ask:
   - Is this in the approved technique list (`motion.md`)?
   - Is it inside one of the three "expressive moments" or is it subtle?
   - Does it fire once (`viewport={{ once: true }}`) or every scroll? It should fire once unless interactive.
   - Does it block interaction? It must not.
4. **Stagger audit**: list reveals should stagger 60–80ms between children. Faster feels chaotic; slower feels sluggish.
5. **Easing audit**: physical things (cards, drags) use springs. Reveals use `--ease-out-soft`. No bounces on UI.
6. **Performance**: any animation triggering layout (width, height, top, left)? Replace with transforms.

---

## When motion should be subtle

- Section reveals on scroll
- Hover states on links and buttons
- Theme toggle
- Form focus/blur
- Card hover lift (-4px, no scale beyond 1.01)

## When motion should be expressive

- Hero one-time cinematic reveal
- Camera dolly into 3D Project Space
- Project panel selection in 3D scene
- Theme transition (1s fade between palettes)

---

## Tooling

- Framer Motion `useReducedMotion`
- Variants in a `variants` const at top of section file
- `useScroll` + `useTransform` for parallax — never raw scroll listeners

---

## Anti-patterns to catch

- Idle bobbing
- Rotating loops
- Letter-by-letter on body copy
- Marquees
- Bounce easings on UI
- Hover effects that depend on cursor (broken on touch)
- Animations triggering on every scroll-into-view back and forth
