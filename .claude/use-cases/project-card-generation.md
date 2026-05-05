# Use Case — Project Card Generation

When adding, editing, or restructuring an entry in `content/projects.ts`.

---

## Project entry shape

```ts
export type ProjectType = 'Product' | 'System' | 'Tool' | 'Experiment' | 'Brand';

export interface Project {
  slug: string;            // url-safe, unique
  title: string;           // 1–4 words
  type: ProjectType;
  role: string;            // verb-led, e.g. "Designed and built"
  year: number;            // 4-digit
  tags: string[];          // 2–4 capability tags
  impact: string;          // ONE sentence, the result
  thumbnail: string;       // /thumbs/<slug>.jpg, 16:10
  accent?: string;         // optional CSS color for accent treatment
  link?: string;           // case-study or live URL
  featured?: boolean;      // larger card in grid
}
```

---

## Card UI structure (Selected Work)

```
[ thumbnail (16:10, glass-bordered) ]
[ eyebrow: <type> · <year> ]
[ title ]
[ role — italic, secondary ]
[ impact — body, two-line clamp ]
[ tags (revealed on hover) ]
```

- Default state: clean, restrained.
- Hover state: lift `-4px`, shadow up, accent underline animates beneath title, tags fade in below.
- Focus state: identical to hover, plus visible focus ring (`--shadow-glow-signal`).

---

## Featured cards

`featured: true` cards span 2 columns on `lg:` and up. They reveal a longer impact line on hover (3-line clamp instead of 2).

---

## 3D Project Space surface

Each project also surfaces in the 3D scene as a floating panel:

- Same `thumbnail` is used as the panel texture
- Same `title` and `role` appear in the screen-space metadata overlay when the panel is selected
- `accent` colors the panel's edge bloom on hover (subtle)

---

## Voice rules for the `impact` field

Every `impact` line must:

- Start with a verb or a result noun
- Reference a specific change (users, scale, time, money, capability)
- Avoid "helped", "supported", "contributed to" — use direct outcomes
- Fit in 18 words

Examples:
- Good: "Cut deployment time from 40 minutes to 90 seconds across 12 services."
- Bad: "Helped the team improve their CI pipeline."

---

## Thumbnails

- 16:10, ≥ 1600×1000
- Saved as compressed `.jpg` or `.webp` in `public/thumbs/`
- Quiet, branded, no busy UI screenshots without crop
- Avoid hard whites — clip to off-white if needed to match `--bg-base`
