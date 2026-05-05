# v2 Refinements

Items deferred from MVP. Each entry: short title, why deferred, what "done" looks like.

---

## Pending after MVP

- **Case-study deep dives** — Selected Work cards link to a `/work/[slug]` route. MVP keeps cards as endpoints with copy + thumbnail; v2 adds full case-study layouts with hero media, problem/process/result, and richer galleries.

- **CMS layer** — `content/projects.ts` is a typed file in MVP. v2 may move to MDX in `content/work/*.mdx` or a headless CMS. Keep the `Project` type as the contract.

- **Real 3D assets** — MVP uses image-textured glass panels. v2 may introduce subtle 3D logo or signature object in the scene (still no character models, no heavy GLTF).

- **Animated transitions between routes** — Once case studies exist, add view-transition-style choreography between home and case study pages.

- **Sound** — A subtle ambient audio layer with mute control, opt-in via interaction. Off by default, never autoplays.

- **Customizable cursor** — Cursor follower for desktop on the 3D and gallery sections only. MVP ships with native cursor.

- **Internationalization** — French toggle (Ahmed-relevant). MVP is English only.

- **OG images** — Per-page dynamic OG image generation. MVP uses one static OG.

- **Analytics** — Plausible or Vercel Analytics. MVP ships none.

- **Newsletter / RSS** — If a writing section is added, add RSS. Not in MVP scope.

- **Postprocessing in 3D** — Bloom + ChromaticAberration are wired off by default. v2 enables them on capable devices with an explicit toggle.

- **Print stylesheet** — Polished printable resume from About + Capabilities. v2.

- **Lighthouse perf >= 95** — MVP target is 85. v2 raises the bar with image audit, CSS pruning, font subsetting.

---

## Open questions for the user

- Final social links to surface (GitHub, LinkedIn, X, others?)
- Real project entries to populate `content/projects.ts` (currently placeholders)
- Final email address to wire to the Contact section
- Domain plans (custom domain, or initial Vercel preview?)
