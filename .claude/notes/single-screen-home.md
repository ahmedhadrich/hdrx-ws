# Single-screen home (2026-10-20)

Direction change requested by the user: the home page is one screen, no scrolling,
styled after arcmarumo.com (a site living inside a CRT TV) but modernised into a
glass MacBook Pro with a transparent display ("everything written on glass").

## What changed

- `app/page.tsx` renders `components/screen/MacbookStage.tsx` only.
- `components/layout/SiteChrome.tsx` (Nav / Footer / IntroLoader / CrtOverlay /
  AmbientBackground) is mounted per route by `app/work/layout.tsx`, not the root layout,
  so it stays out of the home bundle (2026-10-21). The root `not-found.tsx` ships with
  every route, so it must stay server-only: never wrap it in SiteChrome.
- `components/screen/`
  - `MacbookStage` — device frame, HUD corners, keyboard / wheel / swipe browsing, boot
  - `GlassShader` — raw WebGL overlay for the whole display (edge thickness, rim,
    window reflection, light sweep, refresh band, pointer glare, grain). No scanlines.
  - `WorkCarousel` — R3F fan of glass panels (desktop, fine pointer, WebGL)
  - `CssCarousel` — same fan in CSS (touch, < 768px, reduced motion, no WebGL)
  - `InfoPanel` — Capabilities / About / Contact as glass dialogs
  - `fan.ts` — layout shared by both carousels
- Copy for the screen lives in `content/copy.ts` → `screen`.
- HUD font: JetBrains Mono via `next/font/google` (`--font-hud`).

## Rules this overrides (for `/` only)

- CLAUDE.md §3 scrolling section order.
- "Shader in one place only": the glass shader covers the whole display. It is
  deliberately subtle; keep it that way.
- "3D in one section only": the 3D carousel is the centre of the single screen.

## Behaviour notes

- "Open" goes to `/work/[slug]` only when the project has a `caseStudy`; otherwise it
  opens `project.link` in a new tab. No project has a case study yet.
- Boot sequence plays once per session (`sessionStorage` key `hdrx-booted`).
- Location label + time zone for the footer clock: `screen.location` in copy.ts.

## Intro (added 2026-10-20)

- On first load per session: closed MacBook (lid on a 3D base deck with keyboard +
  trackpad) seen from above and in front, a backlit "H" on the
  lid flickers on (old glowing-logo idea), lid swings open over 1.5s, then the screen
  boot bar runs (0.9s). Any click or key skips. Reduced motion / repeat visits skip it.
- Implemented as two nested rotations about the hinge (device tilt + lid fold) in
  `MacbookStage` variants; `preserve-3d` only applies under `.is-intro` because
  `backdrop-filter` flattens 3D.
- Theme: dark is now the default for everyone; `prefers-color-scheme` is ignored and
  only the saved toggle choice switches to light (overrides design-system.md).
- Intro is CSS-state driven (`.is-closed` / `.is-opening` in globals.css), timed by
  `OPEN_MS` in MacbookStage. `/?intro` forces a replay. Phones skip it (no laptop frame).
- Theme (updated): light-only. Light screen and UI, dark room behind the MacBook
  (`--room` stays near-black under `[data-theme='light']`). `useTheme` keeps its
  API but `toggle`/`setTheme` are no-ops.
- Intro (updated): plays on every page load, not once per session. The
  `hdrx-booted` sessionStorage key and the `?intro` replay param are gone. Reduced
  motion still opens straight to the live screen; any click or key skips the intro.

## Mobile: bare screen (2026-10-21)

- Phones AND tablets (`MOBILE_QUERY` in `lib/utils/device.ts`: `(max-width: 767px), (pointer: coarse)`)
  get the same screen (CSS fan, caption, dock) full-bleed; the menu bar shrinks to a centred H
  (MenuBar.css), so Settings and the clock aren't reachable there, without the MacBook, the room,
  the blobs or the GlassShader. Reason: the always-on WebGL and blurred animated layers were buggy
  on mid-range devices. Tablets used to get the full 3D MacbookWorld; they no longer do.
- Nothing renders between interactions: the CSS fan only transitions on swipe / tap.
- A glass "Contact" button (`.mbp__contact`, `screen.contactLabel`) sits under the dock and opens the Contact panel.
- Theme on mobile follows the device's `prefers-color-scheme`, live. Desktop keeps the light
  default + saved choice. The rule lives in three places that must agree: `useTheme`, the pre-paint
  script and `viewport.themeColor` in `app/layout.tsx`. The Control Centre toggle still works on
  mobile until the device setting changes or the page reloads.
- A first attempt replaced the screen with a plain swipe carousel (db70a44); the user wanted the
  screen kept, so that was removed.
