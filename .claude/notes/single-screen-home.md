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

## Lid snapping shut mid-browse (fixed 2026-10-22)

- R3F's `setFrameloop` resets `clock.elapsedTime` to 0, and a `<Canvas>` re-applies its own
  `frameloop` prop on every re-render. Director used to call `setFrameloop('demand')` itself and
  time the lid/zoom off the R3F clock, so each carousel step (page re-render) reset the clock,
  `now` fell before `lidStart`, and the lid eased back to closed with the screen hidden.
- Now: Director times everything with `performance.now()`, and the frameloop is a prop owned by
  MacbookWorld (`onIdle` → `frameloop`), passed to RoomScene / the studio Canvas.
  Never read `state.clock` for timelines in a canvas whose frameloop changes.

## Welcome card (2026-10-28)

- After the lid intro and boot (`boot === 'on'`), the welcome screen takes over the whole display
  (`components/screen/HelloScreen.tsx`, copy in `screen.hello`, styles `.hello*` in globals.css):
  the portrait behind the stage (`HelloBackdrop`, at display level; mounted as soon as
  `hello === 'show'`, so it's on screen while the lid opens and the boot bar runs), with
  "Hey, I'm Ahmed Hadrich", the role line and a "See projects" button on the left (bottom on
  narrow screens). The text lives inside the stage so wheel / swipe reach its handlers. Flat and 3D modes.
- Dismissed by the button, Enter outside a control, ArrowLeft/Right, wheel/trackpad or a horizontal
  swipe on the stage. One gesture only dismisses (`DISMISS_LOCK_MS` swallows wheel inertia / key
  repeat). Focus then moves to the stage region. While it is up the carousel is `inert`, and
  arrows, caption and dock are hidden.
- Shows on every page load (the user asked for this; it used to be once per session). No storage.
- Portrait (`HelloBackdrop`): `public/me/portrait-cut.webp`, the user's `portrait.jpg` cropped above
  the shirt print with the grey backdrop cut out (flood fill from the border through pale neutral
  pixels, a fitted quadratic backdrop for soft edges, edge unmixing). On the display's own glass at
  62% of its height, standing on the bottom edge; greeting, role and "See projects" centred above.
  Tried and dropped: the Workspace.png cutout (`face.webp`), a keyed `face.png` (`hello-face.webp`).

## Load: H on the closed lid, then pull back into the room (2026-10-28)

- Once the model loads: closed lid, close up, the H flickers on (`'closed'`, `LOGO_HOLD_MS`; a click
  or key skips). Then, instead of opening, the camera pulls back over 2.2s (`T.introZoom`) into the
  zoomed-out room shot with the lid still shut. Clicking the MacBook zooms in, which opens the lid
  onto the welcome screen (existing zoom behaviour). No boot bar. Reduced motion: straight to the room.
- (Briefly the load started on the open screen and pulled back from it; the user wanted the H and
  closed lid back.) Director's 'opening' phase and `onIntroDone` are no longer reached.
- MacbookStage sets `zoom = 'out'` at mount in 3D mode. The hint `screen.zoomHint` is carved into the
  plinth's front face whenever zoomed out (`room/PlinthHint.tsx`, drei Text in three layers: dark
  grey letters, a shadow sliver above, a pale lip below). Font: `public/fonts/Geist-Regular.ttf`
  (copied from next's @vercel/og; troika can't read the site's woff2 Satoshi). Fades in after the
  camera settles (`HINT_DELAY`).
- The welcome photo's entrance waits for `zoom === 'in'`, so it plays as the lid opens, not unseen.
- Flat mode (phones, no WebGL) is unchanged: no room, no zoom.
