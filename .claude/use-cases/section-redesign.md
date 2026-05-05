# Use Case — Section Redesign

When a section needs to be reworked while preserving the design blend.

---

## Goal

Improve a single section without breaking the blend, the rhythm with neighboring sections, or established tokens.

---

## Workflow

1. **Identify the section** (`Hero`, `SelectedWork`, `ProjectSpace`, `Capabilities`, `About`, `Contact`).
2. **Re-read** the relevant rules:
   - Always: `design-system.md`, `motion.md`
   - For 3D: `3d-space.md`
   - For copy: `content-strategy.md`
3. **Read the current implementation** in `components/sections/<Name>.tsx`.
4. **Diagnose**: which references is this section pulling from? Is the blend correct? Does it feel like a copy of one source or an extraction from several?
5. **Plan the change**:
   - What stays
   - What changes (visuals, motion, copy, structure)
   - Which tokens are touched (none ideally)
   - Which neighboring sections might need rhythm adjustments
6. **Implement.** Keep the public component shape stable — `<Hero />`, `<SelectedWork />`.
7. **Verify** against `final-polish.md` for the section in isolation.

---

## Constraints

- Do NOT change tokens to make a section work — change the section.
- Do NOT introduce a new font, color, or animation curve at section level — promote to tokens via PR if truly needed.
- Maintain visual rhythm with neighbors. Vertical breathing room (`--space-section`) must be consistent.

---

## Test

After change, scroll the whole site. The redesigned section should feel like the same product as the rest. If it stands out as "the new one", recalibrate.
