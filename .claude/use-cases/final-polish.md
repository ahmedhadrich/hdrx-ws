# Use Case — Final Polish

Pre-ship checklist. Run before declaring a section or the full site shippable.

---

## Consistency

- [ ] All colors come from tokens. No hex values in components.
- [ ] All spacing comes from tokens. No magic numbers.
- [ ] All text uses scale tokens (no `text-[18px]`).
- [ ] Light + dark both pass visual review.
- [ ] Section vertical rhythm consistent (`--space-section`).
- [ ] Section eyebrow + section heading pattern consistent across sections.

## Typography

- [ ] Display headlines use Fraunces with appropriate opsz.
- [ ] Body uses Inter at 16px minimum.
- [ ] Line lengths between 50–75ch in body copy.
- [ ] No widow/orphan single words on display headings (use `&nbsp;` or `text-balance`).
- [ ] Mono font reserved for eyebrows, code, contact email, retro signature.

## Color and contrast

- [ ] Body text contrast >= 4.5:1 in both themes.
- [ ] Interactive text contrast >= 4.5:1 in default and hover.
- [ ] Focus rings visible against all backgrounds.
- [ ] No purple gradients anywhere.

## Motion

- [ ] Reduced motion path verified.
- [ ] No purposeless idle motion.
- [ ] Reveals fire `once: true`.
- [ ] No layout-triggering animations.
- [ ] Hero cinematic reveal happens exactly once.

## 3D

- [ ] Lazy-loaded with `next/dynamic`, `ssr: false`.
- [ ] Fallback engages on coarse pointer or no WebGL.
- [ ] Reduced motion disables auto-orbit.
- [ ] 60fps on M1 baseline (Performance tab spot-check).

## Retro signature

- [ ] Appears in exactly one place.
- [ ] Respects reduced motion.
- [ ] No chromatic aberration on body text.

## Accessibility

- [ ] Semantic HTML: one `<h1>` (hero), `<h2>` per section.
- [ ] All images have alt text (or empty alt for decorative).
- [ ] All interactive elements keyboard-reachable.
- [ ] Tab order logical.
- [ ] Visible focus states.
- [ ] Skip-to-main link.
- [ ] Color is not the only signifier.
- [ ] Form fields have labels (Contact has none — it's mailto).

## Performance

- [ ] LCP < 2.5s on broadband (hero text + atmosphere).
- [ ] No CLS from font loading (`next/font` swap).
- [ ] Images: `next/image`, sized, lazy below the fold.
- [ ] 3D bundle < 1.5MB and lazy.
- [ ] Lighthouse perf >= 85 (MVP target).

## Mobile

- [ ] 375px width: no horizontal scroll.
- [ ] Touch targets >= 44px.
- [ ] 3D fallback engages.
- [ ] Hero readable without scrolling.

## Anti-pattern audit

For each section, verify NONE of:

- Generic AI startup layout
- 3-column feature blocks
- Purple gradients
- Retro effects scattered around
- Style overpowering content
- Unreadable typography
- Unnecessary animation
- 3D bleeding outside its section
- Cluttered hero

---

## Sign-off

When every box above is checked, the section/site is shippable. If a box is unchecked, it's deferred to `v2-refinements.md` with explicit justification.
