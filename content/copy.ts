export const site = {
  name: 'Ahmed Hadrich',
  shortName: 'HDRX',
  email: 'hadrichahmed01@gmail.com',
  social: [
    { label: 'GitHub', href: 'https://github.com/' },
    { label: 'LinkedIn', href: 'https://linkedin.com/' },
    { label: 'X', href: 'https://x.com/' },
  ],
} as const;

export const hero = {
  eyebrow: 'Builder · Engineer · Designer',
  headline: ['Building thoughtful', 'software with', 'cinematic restraint.'],
  positioning:
    'Independent engineer and designer making products, systems, and tools that feel inevitable — clean code, considered surfaces, almost-cinematic interfaces.',
  ctaPrimary: { label: 'See selected work', href: '#work' },
  ctaSecondary: { label: 'Get in touch', href: '#contact' },
  scrollHint: 'Scroll',
} as const;

export const sectionHeads = {
  work: {
    eyebrow: 'Selected work',
    title: 'A few things I have shipped.',
    sub: 'Recent product, system, and brand work — each entry is a self-contained story; case studies expand on request.',
  },
  space: {
    eyebrow: 'Project space',
    title: 'Step into the work.',
    sub: 'A spatial gallery — projects as floating glass panels in a calm scene. Hover, focus, or drag to explore.',
  },
  capabilities: {
    eyebrow: 'Capabilities',
    title: 'How I show up.',
    sub: 'Engineer-first, designer-fluent, comfortable on either side of the brief.',
  },
  about: {
    eyebrow: 'About',
    title: 'Direct, calm, hands-on.',
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Let’s build something quietly excellent.',
  },
} as const;

export const capabilities = {
  Engineering: [
    'TypeScript, React, Next.js',
    'Node, edge runtimes, serverless',
    'Postgres, Redis, queues',
    'Distributed systems and APIs',
    'WebGL, shaders, real-time graphics',
    'Tooling, CI/CD, developer experience',
  ],
  'Design & UX': [
    'Interface and interaction design',
    'Motion direction and choreography',
    'Editorial typography systems',
    'Prototyping in code',
    'Design systems and tokens',
  ],
  Direction: [
    'Product scoping and shaping',
    'Engineering leadership',
    'Mentoring and pairing',
    'Cross-functional translation',
  ],
} as const;

export const about = {
  paragraphs: [
    'I build software end-to-end — from infrastructure to interface. My work tends to look quiet up close and sharp at distance: tight type, real motion, surfaces with weight. I prefer small teams, clear briefs, and the long view.',
    'Right now I am thinking about what cinematic restraint looks like on the web — interfaces that feel composed instead of decorated, motion that earns its place, and tools that respect the people using them.',
  ],
  glyph: '✴',
} as const;

export const contact = {
  closer: 'Currently open to selective product and platform engagements.',
  emailLabel: 'Mail me',
} as const;

export const footer = {
  cta: 'Interested in selective product and platform work — the kind where quality of execution actually matters.',
  ctaLink: 'Start a conversation',
} as const;
