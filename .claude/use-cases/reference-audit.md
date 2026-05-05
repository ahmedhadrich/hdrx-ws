# Use Case — Reference Audit

When the user adds a new reference site, or asks to re-audit an existing one.

---

## Goal

Extract reusable design patterns. Never copy specifics. The output is a short distilled section in `.claude/rules/references.md`.

---

## Workflow

1. **Fetch the URL** with WebFetch. Ask the model to extract:
   - section structure
   - layout rhythm
   - typography feel (display, body, weights, contrast, tricks)
   - color strategy
   - animation and scroll behavior
   - background treatment
   - interaction quality
   - reusable patterns

2. **Filter for portfolio relevance.** Discard patterns that only work for an agency homepage, e-commerce, or content site.

3. **Convert specifics to abstractions.**
   - Bad: "Use #FF5F00 like Mad Creative"
   - Good: "Single warm accent for CTAs and focus rings"
   - Bad: "Add a CRT scanline overlay"
   - Good: "One signature retro-tech moment, surface limited"

4. **Decide the weight.** Where does this reference fit in the existing 40/20/15/10/10/5 blend? If it doesn't fit, either reject it or rebalance the blend explicitly.

5. **Write into `.claude/rules/references.md`** under a new heading following the existing template:
   - Title + URL + percentage
   - **Take** (one line)
   - 4–6 bullets of patterns
   - **Apply** (where in the portfolio this manifests)

6. **Update `CLAUDE.md` §2 Design Blend** if percentages shift.

---

## Quality bar

- The audit entry fits on one screen.
- Every pattern is actionable in our codebase.
- No copy-paste of source quotes — synthesize.

---

## Anti-patterns

- Adding a reference because it's trendy.
- Auditing a site without thinking about how it changes the build.
- Letting the blend drift past 100% by addition.
