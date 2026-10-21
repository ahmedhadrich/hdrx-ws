export const site = {
  name: 'HDRX',
  shortName: 'HDRX',
  url: 'https://hdrx.dev',
  email: 'hadrichahmed01@gmail.com',
  social: [
    { label: 'GitHub', href: 'https://github.com/ahmedhadrich' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/ahmed-hadrich' },
    { label: 'Email', href: 'mailto:hadrichahmed01@gmail.com' },
  ],
} as const;

// Page titles, search snippets and link previews (app/layout.tsx, app/opengraph-image.tsx).
// Brand-first: HDRX and the work, no personal name. Plain words, read in a Google result or a Slack unfurl.
export const meta = {
  title: 'HDRX',
  titleTemplate: '%s · HDRX',
  description:
    'I design and build digital products, from first sketch to shipped code. Robotics brands, clinical-trial search, education platforms and interactive 3D.',
  // Shorter line for link previews, where the title already says what
  ogDescription: 'Messy briefs in, shipped products out. Robotics, health, education, and the odd 3D experiment.',
  ogAlt: 'Ahmed Hadrich, product engineering, software development and design',
  // Bottom line of the link preview card
  disciplines: 'Product . Websites . Software . Brand . Interactive 3D',
  notFound: 'Page not found',
} as const;

// Heading of the Contact panel on the home screen (components/screen/InfoPanel)
export const sectionHeads = {
  contact: {
    title: 'Got something worth scoping? Let’s talk.',
  },
} as const;

export const footer = {
  cta: 'Available for product, PM, and creative-technology work — full-time roles, embedded gigs, or one-off scopes.',
  ctaLink: 'Start a conversation',
} as const;

// Single-screen home: everything lives on one glass MacBook display.
export const screen = {
  // Visually hidden page heading: what screen readers and search engines take the page to be
  heading: 'HDRX, product engineering and design',
  panels: [
    { id: 'contact', label: 'Contact' },
  ],
  // Menu bar clock (Germany)
  location: { timeZone: 'Europe/Berlin' },
  batteryLabel: 'Battery',
  settingsLabel: 'Settings',
  contactLabel: 'Contact',
  // Big button under the screen on phones and tablets
  contactCta: 'Get in touch',
  settings: {
    title: 'Control Centre',
    darkMode: 'Dark mode',
    on: 'On',
    off: 'Off',
    accent: 'Accent colour',
    accents: { signal: 'Sage', shore: 'Terracotta', bone: 'Bone' },
    display: 'Display',
    sound: 'Sound',
    timeOfDay: 'Time of day',
    // Room light control under the plinth (components/screen/TimeControl)
    roomLight: 'Room light',
    time: 'Time',
    orientation: 'Facing',
    windowFaces: 'Window faces',
    // Quick jumps for checking the room's lighting; hours live in SettingsPanel (TIME_PRESETS)
    presets: {
      dawn: 'Dawn',
      morning: 'Morning',
      noon: 'Noon',
      golden: 'Golden hour',
      dusk: 'Dusk',
      night: 'Night',
    },
    auto: 'Auto',
  },
  bootLabel: 'Booting',
  closeLabel: 'Close',
  zoomOutLabel: 'Zoom out',
  zoomInLabel: 'Zoom in',
  prevLabel: 'Previous project',
  nextLabel: 'Next project',
  openLabel: 'Open case',
  visitLabel: 'Visit site',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
} as const;

export type ScreenPanelId = (typeof screen.panels)[number]['id'];
