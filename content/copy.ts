export const site = {
  name: 'HDRX',
  shortName: 'HDRX',
  owner: 'Ahmed Hadrich',
  url: 'https://hdrx.dev',
  email: 'hadrichahmed01@gmail.com',
  social: [
    { label: 'GitHub', href: 'https://github.com/ahmedhadrich' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/ahmed-hadrich' },
    { label: 'Email', href: 'mailto:hadrichahmed01@gmail.com' },
  ],
} as const;

// Page titles, search snippets and link previews (app/layout.tsx, app/opengraph-image.tsx).
// Written to be read in a Google result or a Slack unfurl: first person, plain words.
export const meta = {
  title: 'Ahmed Hadrich · Engineer and designer',
  titleTemplate: '%s · Ahmed Hadrich',
  description:
    'I’m Ahmed, an engineer and designer in Germany. I turn messy briefs into products that ship, from robotics brands to clinical-trial search.',
  // Shorter line for link previews, where the title already says who
  ogDescription: 'Messy briefs in, shipped products out. Robotics, health, education, and the odd 3D experiment.',
  ogAlt: 'Ahmed Hadrich, engineer and designer',
  jobTitle: 'Engineer and designer',
  location: 'Germany',
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
  heading: 'Ahmed Hadrich, engineer and designer',
  panels: [
    { id: 'contact', label: 'Contact' },
  ],
  // Menu bar clock (Germany)
  location: { timeZone: 'Europe/Berlin' },
  batteryLabel: 'Battery',
  settingsLabel: 'Settings',
  contactLabel: 'Contact',
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
