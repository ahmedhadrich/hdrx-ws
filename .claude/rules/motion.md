# Motion Rules

Motion exists to support meaning. Never decorative. Never default-on.

---

## Principles

1. **Subtle by default.** Most components reveal with opacity + 8–16px translate, max 400ms. That's it.
2. **Expressive at three moments only**:
   - Hero reveal (once per session, cinematic — up to `--dur-cinematic`)
   - Transitions into the 3D Project Space (camera dolly + fade, ~1s)
   - Gallery interactions (card hover, drag, focus shift)
3. **Springs over easings** for anything physical (cards, drags, hover lifts). Easings for compositional reveals (text, sections).
4. **Stagger reveals** for groups (list items, gallery cards). 60–80ms between children.
5. **Never animate without a reason.** "It looks cool" is not a reason.

---

## Approved techniques

- Opacity fade
- Transform translate (Y or X, never both, max 24px)
- Clip-path reveals (`inset` or polygon for editorial moments)
- Scale 0.98 → 1.0 on appear (very subtle)
- Parallax via `translate3d` driven by scroll progress (max 60px range)
- Backdrop-filter blur transitions (glass surfaces appearing in front of motion)
- Springy card lift on hover (`translateY(-4px)` + shadow change)

---

## Forbidden techniques

- Floating loops on idle elements (purposeless bobbing)
- Bounce easings on UI elements
- Long-running rotation loops (the ambient background is the only exception)
- Marquees that scroll forever without user benefit
- Letter-by-letter text reveals on body copy (acceptable on hero headline only, once)
- Auto-playing video as background unless muted, looped, and reduced-motion-aware

---

## Reduced motion

`prefers-reduced-motion: reduce` is a first-class path:

- Collapse all transforms to opacity only
- Cap duration at 200ms
- Disable parallax entirely
- Disable the ambient background animation (still render the static gradient)
- 3D scene: render a still frame; disable orbit/auto-rotate

Implementation: a `useReducedMotion` hook gates motion variants. The ambient background reads `prefers-reduced-motion` directly in CSS via `@media`.

---

## Scroll choreography

- Use Framer Motion `useScroll` + `useTransform` for parallax and progress-driven reveals.
- Reveals fire once via `whileInView={{...}} viewport={{ once: true, amount: 0.3 }}`.
- Section transitions: subtle parallax of background + crisp foreground reveal.

---

## Hero reveal sequence (one-time, cinematic)

1. Background ambient layer fades in (700ms ease-out-soft)
2. Eyebrow line reveals (clip-path, 400ms, 200ms delay)
3. Display headline reveals line by line (clip-path inset, 600ms per line, 80ms stagger)
4. Positioning sub-line fades + translates up (400ms, 1100ms delay)
5. CTA spring-scales in (1300ms delay)
6. Scroll affordance fades (1500ms delay)

Total: ~2.0s. Only fires once.

---

## Anti-patterns (motion)

- Animating opacity AND scale AND translate on the same element (pick one or two)
- Reveals that fire repeatedly as user scrolls back and forth
- Hover effects that depend on cursor following (broken on touch)
- Animations that block interaction (clicks should work mid-animation)
