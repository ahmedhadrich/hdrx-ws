export const site = {
  name: 'HDRX',
  shortName: 'HDRX',
  // The person behind the brand: what people actually search for
  person: { name: 'Ahmed Hadrich', firstName: 'Ahmed', lastName: 'Hadrich', jobTitle: 'Full-Stack Engineer' },
  // Source photo (crawlable, full size) for search engines' knowledge panels
  portrait: '/me/portrait.jpg',
  url: 'https://hdrx.dev',
  email: 'hadrichahmed01@gmail.com',
  social: [
    { label: 'GitHub', href: 'https://github.com/ahmedhadrich' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/ahmed-hadrich' },
    { label: 'Email', href: 'mailto:hadrichahmed01@gmail.com' },
  ],
} as const;

// Page titles, search snippets and link previews (app/layout.tsx, app/opengraph-image.tsx).
// Name-first (people search for the person; the welcome screen leads with the name too), HDRX after.
// Title under ~60 characters and description under ~155, so Google shows them whole.
export const meta = {
  title: 'Ahmed Hadrich · Full-Stack Engineer, Frontend & AI | HDRX',
  titleTemplate: '%s · Ahmed Hadrich',
  description:
    'Ahmed Hadrich, full-stack engineer and lead developer in Germany, focused on frontend and AI. Shipped work in robotics, health, education and 3D.',
  // Shorter line for link previews, where the title already says who
  ogDescription: 'Full-stack engineer and lead developer. Frontend and AI, from first sketch to shipped product.',
  ogAlt: 'Ahmed Hadrich, Full-Stack Engineer, Frontend & AI, Lead Developer',
  // Bottom line of the link preview card
  disciplines: 'Frontend . AI . Full-stack . Interactive 3D',
  // Topics for the Person structured data
  knowsAbout: ['Full-stack development', 'Frontend engineering', 'Artificial intelligence', 'React', 'Next.js', 'TypeScript', 'Three.js', 'Technical leadership'],
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
  heading: 'Ahmed Hadrich, Full-Stack Engineer, Lead Developer, Frontend & AI',
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
  // Carved into the plinth while zoomed out (3D only, so desktop: click, not tap)
  zoomHint: 'Click the MacBook to start',
  prevLabel: 'Previous project',
  nextLabel: 'Next project',
  openLabel: 'Open case',
  visitLabel: 'Visit site',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  // Welcome card shown once per browser session (components/screen/HelloScreen)
  hello: {
    greeting: "Hey, I'm",
    name: 'Ahmed Hadrich',
    role: 'Full-Stack Engineer · Lead Developer · Frontend & AI',
    cta: 'See projects',
    portraitAlt: 'Portrait of Ahmed Hadrich',
  },
} as const;

export type ScreenPanelId = (typeof screen.panels)[number]['id'];
