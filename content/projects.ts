export type ProjectType = 'Product' | 'System' | 'Tool' | 'Experiment' | 'Brand';

export interface CasePhase {
  num: string;
  title: string;
  description: string;
}

export interface CaseStudy {
  problem: string;
  subLinks: string[];
  phases: CasePhase[];
  outcomes: string[];
  techStack: string[];
}

export interface Project {
  slug: string;
  title: string;
  type: ProjectType;
  role: string;
  year: number;
  tags: string[];
  impact: string;
  thumbnail: string;
  accent?: string;
  link?: string;
  featured?: boolean;
  caseStudy?: CaseStudy;
}

export const projects: Project[] = [
  {
    slug: 'meridian',
    title: 'Energy Analytics Platform',
    type: 'Product',
    role: 'Product lead · front-end build · UX',
    year: 2025,
    tags: ['Energy', 'Dashboard', 'Next.js', 'UX'],
    impact:
      'Turned a mess of energy data into a dashboard operators actually open in the morning.',
    thumbnail: '/thumbs/meridian.svg',
    accent: '#FF5A1F',
    featured: true,
    caseStudy: {
      problem:
        'A working group sitting on years of energy data with no clear way to see it. Reports landed in inboxes, decisions waited on spreadsheets, and the people closest to the meters had the least visibility.',
      subLinks: [
        'Stakeholder discovery',
        'Requirements shaping',
        'Information architecture',
        'UX wireframing',
        'Front-end build',
        'Charting and data viz',
        'Component library',
        'Backend handoff specs',
        'Release planning',
        'User testing',
        'Operator onboarding',
        'Documentation',
      ],
      phases: [
        {
          num: '01',
          title: 'Discovery',
          description:
            'Sat with operators, analysts, and management — separately — until the actual workflow emerged from the official one.',
        },
        {
          num: '02',
          title: 'Scoping',
          description:
            'Boiled a long wishlist down to the three views that would change the day-to-day. Everything else went into a clearly labeled v2.',
        },
        {
          num: '03',
          title: 'UX & Prototype',
          description:
            'Wireframed the core surfaces, then built a clickable prototype to validate the IA before a single chart was wired to data.',
        },
        {
          num: '04',
          title: 'Front-end Build',
          description:
            'Shipped the front-end in Next.js with a small reusable chart kit. Coordinated with backend on a clean API contract — no ad-hoc fields.',
        },
        {
          num: '05',
          title: 'Handoff & Rollout',
          description:
            'Wrote the operator guide, ran two onboarding sessions, and stayed on call for the first weeks of live use.',
        },
      ],
      outcomes: [
        'Single source of truth replaced four parallel spreadsheets',
        'Daily decision loop shortened from days to minutes',
        'Adopted across operations, analysis, and management',
        'Hand-off package allowed the in-house team to extend it without me',
      ],
      techStack: [
        'Next.js',
        'TypeScript',
        'React',
        'Tailwind CSS',
        'Recharts',
        'REST API',
        'Figma',
        'Vercel',
      ],
    },
  },
  {
    slug: 'shoreline',
    title: 'Web Platform Launch',
    type: 'Product',
    role: 'Project lead · front-end engineer',
    year: 2024,
    tags: ['Web', 'Responsive', 'Delivery'],
    impact:
      'Took a stalled web platform from kickoff to launch in one quarter, on scope and on time.',
    thumbnail: '/thumbs/shoreline.svg',
    accent: '#7AC2C9',
    caseStudy: {
      problem:
        'A platform that had been talked about for a year but never shipped — competing visions, no clear scope, and a deadline that kept slipping by another two weeks every two weeks.',
      subLinks: [
        'Scope definition',
        'Stakeholder alignment',
        'Roadmap',
        'Design coordination',
        'Front-end implementation',
        'Responsive layout',
        'Content modeling',
        'CMS integration',
        'QA and bug triage',
        'Launch checklist',
        'Analytics setup',
        'Post-launch support',
      ],
      phases: [
        {
          num: '01',
          title: 'Re-scoping',
          description:
            'Ran a one-week reset — surfaced what was actually blocking, agreed a v1 everyone could defend, and put the rest in a phase 2 doc.',
        },
        {
          num: '02',
          title: 'Roadmap',
          description:
            'Built a delivery plan with weekly checkpoints and clear owners — no more standing meetings to figure out who owned what.',
        },
        {
          num: '03',
          title: 'Design + Front-end',
          description:
            'Worked alongside the designer, building screens as components in parallel so feedback could land in code, not slides.',
        },
        {
          num: '04',
          title: 'Integration',
          description:
            'Wired the front-end to the CMS, ran content rehearsals with the editorial team, and ironed out the long tail of edge cases.',
        },
        {
          num: '05',
          title: 'Launch',
          description:
            'Shipped on the agreed date, watched analytics for the first week, and handled the inevitable small fires before they grew.',
        },
      ],
      outcomes: [
        'Launched on the agreed date after a year of slippage',
        'Responsive across mobile, tablet, and desktop without a rebuild',
        'Editorial team able to publish without engineering involvement',
        'Stakeholders aligned on a clear v2 backlog instead of competing roadmaps',
      ],
      techStack: [
        'Next.js',
        'TypeScript',
        'Tailwind CSS',
        'Headless CMS',
        'Framer Motion',
        'Vercel',
        'Figma',
        'Notion',
      ],
    },
  },
  {
    slug: 'parallax',
    title: '3D Experience Space',
    type: 'Experiment',
    role: 'Designed and built solo',
    year: 2025,
    tags: ['WebGL', 'R3F', 'Three.js', 'Interaction'],
    impact:
      'Built an interactive 3D space to showcase work — half experiment, half playground for new interfaces.',
    thumbnail: '/thumbs/parallax.svg',
    accent: '#E9DFC8',
    featured: true,
    caseStudy: {
      problem:
        'Most portfolios are a list. I wanted a place — somewhere projects sit in space, with their own weight, that you navigate instead of scroll past.',
      subLinks: [
        'Concept and moodboard',
        'Scene composition',
        'WebGL pipeline',
        'React Three Fiber setup',
        'Glass material tuning',
        'Camera choreography',
        'Hover and focus interactions',
        'Performance budget',
        '2D fallback design',
        'Mobile path',
        'Reduced-motion path',
        'Accessibility overlay',
      ],
      phases: [
        {
          num: '01',
          title: 'Concept',
          description:
            'Sketched the spatial idea: floating glass panels in a calm scene, gentle camera drift, projects with their own gravity.',
        },
        {
          num: '02',
          title: 'R3F Build',
          description:
            'Set up the React Three Fiber scene — physical materials, environment lighting, custom camera path. Iterated on feel, not features.',
        },
        {
          num: '03',
          title: 'Interaction',
          description:
            'Added hover lift, focus state, and a screen-space metadata overlay so the panels read as content, not decoration.',
        },
        {
          num: '04',
          title: 'Fallback',
          description:
            'Designed a CSS-only 3D-feeling fallback for mobile and reduced-motion — same panel design, no WebGL cost.',
        },
        {
          num: '05',
          title: 'Polish',
          description:
            'Profiled on every device I could borrow, clamped DPR, and tuned the scene until it held 60fps on a base M1.',
        },
      ],
      outcomes: [
        'Holds 60fps on M1 with full glass materials',
        'Graceful CSS fallback on mobile and reduced-motion',
        'Lazy-loaded — adds nothing to first paint',
        'A genuine playground for the next interaction ideas',
      ],
      techStack: [
        'React Three Fiber',
        'Three.js',
        'GLSL',
        'Next.js',
        'TypeScript',
        'Framer Motion',
        'Tailwind CSS',
        'Vercel',
      ],
    },
  },
  {
    slug: 'ember',
    title: 'Workflow & Automation',
    type: 'System',
    role: 'PM · process design · dev coordination',
    year: 2024,
    tags: ['Process', 'Automation', 'PM'],
    impact:
      'Took a tangle of email threads and shared drives and turned it into a system the team actually trusted.',
    thumbnail: '/thumbs/ember.svg',
    accent: '#7B1F1F',
    caseStudy: {
      problem:
        'A client running critical workflows on email, attachments, and tribal knowledge. Every new hire took months to ramp, and every handoff lost something on the way.',
      subLinks: [
        'Process mapping',
        'Stakeholder interviews',
        'Workflow redesign',
        'Tooling selection',
        'Backlog and release plan',
        'Developer coordination',
        'Automation specs',
        'QA and rollout',
        'Change management',
        'Training materials',
        'Documentation',
        'Post-rollout review',
      ],
      phases: [
        {
          num: '01',
          title: 'Mapping',
          description:
            'Drew the existing workflow on a wall — every handoff, every approval, every place a thing fell on the floor.',
        },
        {
          num: '02',
          title: 'Redesign',
          description:
            'Proposed a slimmer flow with clear ownership and three points of automation. Got sign-off before anyone touched a tool.',
        },
        {
          num: '03',
          title: 'Backlog',
          description:
            'Translated the redesign into a sequenced backlog with acceptance criteria — handed it to the dev team in a state they could just pick up and run with.',
        },
        {
          num: '04',
          title: 'Implementation',
          description:
            'Coordinated the build, ran weekly demos with the operators, and adjusted scope as the real edge cases surfaced.',
        },
        {
          num: '05',
          title: 'Rollout',
          description:
            'Trained the team in two short sessions, ran a parallel period, and switched off the old way once everyone was comfortable.',
        },
      ],
      outcomes: [
        'Onboarding time for new hires cut roughly in half',
        'Handoffs traceable end-to-end instead of buried in inboxes',
        'Three high-friction steps fully automated',
        'Process documented well enough to outlive me',
      ],
      techStack: [
        'Notion',
        'Airtable',
        'Zapier',
        'Linear',
        'Figma',
        'Slack',
        'Custom scripts (TypeScript)',
        'Google Workspace',
      ],
    },
  },
  {
    slug: 'fold',
    title: 'Design-to-Dev Systems',
    type: 'System',
    role: 'Lead — design system + dev handoff',
    year: 2023,
    tags: ['Design system', 'Components', 'Tokens'],
    impact:
      'Built small design systems and component libraries so designers, devs, and content people stopped arguing about spacing.',
    thumbnail: '/thumbs/fold.svg',
    accent: '#7AC2C9',
    caseStudy: {
      problem:
        'Teams shipping the same button six different ways. Every new screen kicked off another spacing debate. Designers and developers technically working from the same files, practically from different planets.',
      subLinks: [
        'Design audit',
        'Token system',
        'Type and color scales',
        'Spacing and radius rules',
        'Component inventory',
        'React component library',
        'Figma library mirror',
        'Documentation site',
        'Contribution guide',
        'Versioning strategy',
        'Adoption rollout',
        'Office hours',
      ],
      phases: [
        {
          num: '01',
          title: 'Audit',
          description:
            'Pulled every UI surface into one board and counted the variants. The pitch wrote itself.',
        },
        {
          num: '02',
          title: 'Tokens',
          description:
            'Defined a small, opinionated set of tokens — color, type, spacing, radius — exposed as CSS custom properties and Figma styles.',
        },
        {
          num: '03',
          title: 'Components',
          description:
            'Built a focused React component library mirrored 1:1 in Figma. Same names, same props, same behavior on both sides.',
        },
        {
          num: '04',
          title: 'Docs',
          description:
            'Shipped a docs site with usage examples, do/don’t guidance, and a contribution guide so the system could grow without me as a bottleneck.',
        },
        {
          num: '05',
          title: 'Adoption',
          description:
            'Ran weekly office hours during rollout. Migrated screens with the teams instead of throwing the system over the wall.',
        },
      ],
      outcomes: [
        'One source of truth for tokens across design and code',
        'New screens assembled from existing components, not designed from scratch',
        'Spacing and color debates effectively retired',
        'System maintained by the in-house team after handoff',
      ],
      techStack: [
        'React',
        'TypeScript',
        'Tailwind CSS',
        'CSS custom properties',
        'Figma',
        'Storybook',
        'MDX',
        'GitHub',
      ],
    },
  },
];
