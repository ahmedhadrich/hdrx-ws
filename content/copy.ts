export const site = {
  name: 'Ahmed Hadrich',
  shortName: 'HDRX',
  email: 'hadrichahmed01@gmail.com',
  social: [
    { label: 'GitHub', href: 'https://github.com/ahmedhadrich' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/ahmed-hadrich' },
    { label: 'Email', href: 'mailto:hadrichahmed01@gmail.com' },
  ],
} as const;

export const hero = {
  eyebrow: 'PM · Engineer · Builder',
  headline: ['Ideas scoped', 'into products', 'that ship.'],
  positioning: 'Turning vague briefs into clear scopes.',
  ctaPrimary: { label: 'See selected work', href: '#work' },
  ctaSecondary: { label: 'Let’s talk', href: '#contact' },
  scrollHint: 'Scroll',
} as const;

export const sectionHeads = {
  work: {
    eyebrow: 'Selected work',
    title: 'Things I have led, designed, and built.',
    sub: 'Five projects across energy platforms, web launches, and creative tech — each a story about turning a messy brief into something real.',
  },
  space: {
    eyebrow: 'Project space',
    title: 'Step into the work.',
    sub: 'A spatial gallery — projects as floating glass panels in a calm scene. Hover, focus, or drag to explore.',
  },
  capabilities: {
    eyebrow: 'Capabilities',
    title: 'How I show up.',
    sub: 'Half PM, half engineer, fluent in design — comfortable on either side of the brief.',
  },
  about: {
    eyebrow: 'About',
    title: 'Energy brain, design eye, builder hands.',
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Got something worth scoping? Let’s talk.',
  },
} as const;

export const capabilities = {
  'Product & Delivery': [
    'Roadmaps, scoping, and shaping',
    'Backlog and release planning',
    'Stakeholder alignment',
    'Cross-functional coordination',
    'Vendor and dev-team handoff',
  ],
  'Creative Tech': [
    'Front-end engineering — React, Next.js, TypeScript',
    'Interactive 3D and WebGL experiments',
    'Visual prototyping in code',
    'Design systems and component libraries',
    'Motion and interaction design',
  ],
  Domain: [
    'Energy and sustainability fluency',
    'Engineering-to-business translation',
    'UX thinking for technical products',
    'Design–dev–stakeholder communication',
    'Mentoring and pairing',
  ],
} as const;

export const about = {
  paragraphs: [
    'I came up through energy engineering, learned to design along the way, and now spend most days writing code, scoping work, or making sure the right thing gets built. My role usually sits between the people who imagine a product and the people who ship it.',
    'Right now I am most curious about creative tech — interactive 3D, real-time visuals, the kinds of interfaces that feel less like dashboards and more like places. The portfolio is a sandbox for that. Open to product, PM, and creative-technology roles where the work matters.',
  ],
} as const;

export const contact = {
  closer:
    'Currently open to product, PM, and creative-technology roles — and to interesting collaborations on the side.',
  emailLabel: 'Mail me',
} as const;

export const footer = {
  cta: 'Available for product, PM, and creative-technology work — full-time roles, embedded gigs, or one-off scopes.',
  ctaLink: 'Start a conversation',
} as const;

// Single-screen home: everything lives on one glass MacBook display.
export const screen = {
  brand: 'HDRX',
  panels: [
    { id: 'contact', label: 'Contact' },
  ],
  location: { label: 'Germany', timeZone: 'Europe/Berlin' },
  emailLabel: 'Email',
  batteryLabel: 'Battery',
  settingsLabel: 'Settings',
  contactLabel: 'Contact',
  settings: {
    title: 'Control Centre',
    darkMode: 'Dark mode',
    on: 'On',
    off: 'Off',
    accent: 'Accent colour',
    accents: { signal: 'Signal', shore: 'Shore', bone: 'Bone' },
    display: 'Display',
    sound: 'Sound',
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
