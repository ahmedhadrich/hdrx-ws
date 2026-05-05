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
    title: 'Meridian',
    type: 'Product',
    role: 'Lead engineer · co-designer',
    year: 2025,
    tags: ['Next.js', 'Postgres', 'Realtime', 'Design system'],
    impact:
      'Took a five-person ops team from spreadsheets to a real-time platform handling 1.2M daily events.',
    thumbnail: '/thumbs/meridian.svg',
    accent: '#FF5A1F',
    featured: true,
    caseStudy: {
      problem:
        'A five-person ops team managing critical workflows across spreadsheets and email threads — no single source of truth, no real-time visibility, no way to scale.',
      subLinks: [
        'Real-time architecture',
        'Postgres schema design',
        'Next.js App Router',
        'Event streaming pipeline',
        'Design system build',
        'Operational dashboards',
        'Access control and roles',
        'Data migration strategy',
        'Mobile-first UI',
        'Performance profiling',
        'API design',
        'Team documentation',
      ],
      phases: [
        {
          num: '01',
          title: 'Discovery',
          description:
            'Four days of pairing with every operator — mapping their actual workflows, not the ones they thought they had.',
        },
        {
          num: '02',
          title: 'Architecture',
          description:
            'Schema-first: defined the event model, permission topology, and realtime propagation rules before a single component was written.',
        },
        {
          num: '03',
          title: 'Platform Build',
          description:
            'Twelve weeks of focused execution — core data layer, realtime engine, and the primary ops surface built in parallel.',
        },
        {
          num: '04',
          title: 'Integration',
          description:
            'Connected three legacy data sources with zero downtime using a careful migration-with-shadow strategy.',
        },
        {
          num: '05',
          title: 'Ship and Monitor',
          description:
            'Phased rollout over two weeks, watching every metric, tuning the realtime fanout under real production load.',
        },
      ],
      outcomes: [
        'Eliminated spreadsheet-based operations entirely',
        '1.2M daily events processed in real-time',
        '30-day full-team adoption cycle',
        'Zero downtime in the first six months',
      ],
      techStack: [
        'Next.js',
        'TypeScript',
        'Postgres',
        'Supabase',
        'Redis',
        'Tailwind CSS',
        'Framer Motion',
        'Zod',
        'Prisma',
        'Vercel',
        'GitHub Actions',
        'Figma',
      ],
    },
  },
  {
    slug: 'shoreline',
    title: 'Shoreline',
    type: 'System',
    role: 'Architected and built',
    year: 2024,
    tags: ['Edge', 'TypeScript', 'Queues'],
    impact: 'Cut deployment time from 40 minutes to 90 seconds across twelve services.',
    thumbnail: '/thumbs/shoreline.svg',
    accent: '#7AC2C9',
    caseStudy: {
      problem:
        'Twelve services sharing a single deployment pipeline — 40-minute release windows, cascading failures, and engineers afraid to push on Fridays.',
      subLinks: [
        'Pipeline architecture',
        'Edge function deployment',
        'Queue-based orchestration',
        'TypeScript migration',
        'Service isolation design',
        'Parallel deployment',
        'Rollback automation',
        'Load testing suite',
        'Monitoring and alerting',
        'CI/CD configuration',
        'Zero-downtime strategy',
        'Developer tooling',
      ],
      phases: [
        {
          num: '01',
          title: 'Audit',
          description:
            'Traced every dependency in the existing pipeline — where coupling crept in, which services owned what, and which failures cascaded.',
        },
        {
          num: '02',
          title: 'Architecture',
          description:
            'Designed isolated deployment units per service with shared artifact caching and parallel execution paths.',
        },
        {
          num: '03',
          title: 'Pipeline Rebuild',
          description:
            'Rebuilt the CI/CD backbone service by service, running old and new pipelines in shadow mode until confidence was high.',
        },
        {
          num: '04',
          title: 'Rollout',
          description:
            'Graduated migration over three weeks — five services first, then all twelve, with automatic rollback guards on every deploy.',
        },
        {
          num: '05',
          title: 'Hardening',
          description:
            'Stress-tested parallel execution limits, profiled cold-start behavior, and documented every escape hatch for the team.',
        },
      ],
      outcomes: [
        'Deploy time cut from 40 minutes to 90 seconds',
        'Zero shared pipeline dependencies across all services',
        '4× weekly release cadence after rollout',
        'No engineer-initiated rollbacks in three months',
      ],
      techStack: [
        'TypeScript',
        'Edge Functions',
        'Node.js',
        'GitHub Actions',
        'Docker',
        'Redis',
        'Bash',
        'Datadog',
        'Terraform',
        'Vercel Edge',
      ],
    },
  },
  {
    slug: 'ember',
    title: 'Ember',
    type: 'Tool',
    role: 'Designed and built solo',
    year: 2024,
    tags: ['CLI', 'Rust', 'DX'],
    impact: 'Open-source CLI now used by 8k+ developers monthly to scaffold typed API clients.',
    thumbnail: '/thumbs/ember.svg',
    accent: '#7B1F1F',
    caseStudy: {
      problem:
        'Every team was hand-rolling API clients from scratch — days lost to boilerplate, type drift, and specs that diverged from reality the moment they were written.',
      subLinks: [
        'CLI architecture',
        'OpenAPI parsing',
        'TypeScript codegen',
        'Rust performance core',
        'Plugin system design',
        'Documentation generator',
        'Version management',
        'Community tooling',
        'Testing harness',
        'CI/CD pipeline',
        'npm publishing',
        'Contribution guide',
      ],
      phases: [
        {
          num: '01',
          title: 'Research',
          description:
            'Surveyed 30 developers about their API client workflow — the patterns, the pain, and the hacks they had normalized over years.',
        },
        {
          num: '02',
          title: 'Schema Design',
          description:
            'Defined the generator type model: how OpenAPI specifications map to idiomatic TypeScript, covering every edge case.',
        },
        {
          num: '03',
          title: 'CLI Architecture',
          description:
            'Built the core in Rust for performance with a thin JS CLI layer for ergonomics. Schema in, typed client out.',
        },
        {
          num: '04',
          title: 'Open-Source Launch',
          description:
            'Shipped publicly on a Wednesday with zero marketing — Hacker News front page by Thursday morning.',
        },
        {
          num: '05',
          title: 'Community',
          description:
            'Responded to every issue and PR in the first month, establishing the patterns that let 47 contributors join the codebase.',
        },
      ],
      outcomes: [
        '8k+ monthly active developers within six months',
        'Adopted by 40+ teams in the first three months',
        '70% average reduction in API client boilerplate',
        '47 contributors — none paid',
      ],
      techStack: [
        'Rust',
        'TypeScript',
        'Node.js',
        'OpenAPI 3.x',
        'Zod',
        'Cargo',
        'GitHub Actions',
        'npm',
        'Vite',
        'Jest',
        'esbuild',
      ],
    },
  },
  {
    slug: 'parallax',
    title: 'Parallax',
    type: 'Experiment',
    role: 'Direction and engineering',
    year: 2025,
    tags: ['WebGL', 'Shaders', 'GLSL'],
    impact:
      'Cinematic shader-driven landing system shipped for a launch with 240k visitors in 48 hours.',
    thumbnail: '/thumbs/parallax.svg',
    accent: '#E9DFC8',
    featured: true,
    caseStudy: {
      problem:
        'A product launch needed an interface that felt as cinematic as the product itself — not a landing page, but a spatial experience that commanded attention from frame one.',
      subLinks: [
        'WebGL pipeline design',
        'Custom GLSL shaders',
        'Scene composition',
        'Camera choreography',
        'Performance optimization',
        'Mobile fallback system',
        'Asset pipeline',
        'Load time budget',
        'Cross-browser testing',
        'Accessibility path',
        'Analytics integration',
        'Launch coordination',
      ],
      phases: [
        {
          num: '01',
          title: 'Creative Direction',
          description:
            'Two days of moodboarding and reference extraction — identifying the visual signature that would make this launch unforgettable.',
        },
        {
          num: '02',
          title: 'Shader R&D',
          description:
            'Six prototyping sprints: noise fields, fluid displacement, chromatic aberration, light scattering. Picked one. Threw the rest away.',
        },
        {
          num: '03',
          title: 'Scene Composition',
          description:
            'Built the spatial layout — camera path, timing choreography, and content integration points where type meets the shader field.',
        },
        {
          num: '04',
          title: 'Performance',
          description:
            'Profiled on every major device class. Cut the bundle in half. Added a WebGL fallback that looked intentional, not degraded.',
        },
        {
          num: '05',
          title: 'Ship',
          description:
            'Launched at midnight with full monitoring. 240k visitors in 48 hours. No crashes, no rollbacks.',
        },
      ],
      outcomes: [
        '240k visitors in 48 hours with zero performance degradation',
        'Sub-100ms first contentful paint on 3G networks',
        'Cited in three design publications within the launch week',
        '100/100 Lighthouse score on mobile',
      ],
      techStack: [
        'WebGL',
        'GLSL',
        'Three.js',
        'React',
        'Next.js',
        'GSAP',
        'TypeScript',
        'Vercel Edge',
        'Playwright',
        'Lighthouse CI',
      ],
    },
  },
  {
    slug: 'fold',
    title: 'Fold',
    type: 'Brand',
    role: 'Identity and site',
    year: 2023,
    tags: ['Identity', 'Editorial', 'Motion'],
    impact: 'Repositioned a B2B studio; site lifted qualified inbound by 3.2× in two quarters.',
    thumbnail: '/thumbs/fold.svg',
    accent: '#7AC2C9',
    caseStudy: {
      problem:
        'A respected B2B studio with strong work but a visual identity indistinguishable from every other agency — nothing to remember, nothing to pursue.',
      subLinks: [
        'Brand strategy',
        'Visual identity system',
        'Editorial typography',
        'Motion language',
        'Brand guidelines',
        'Site architecture',
        'Design system build',
        'Photography direction',
        'Tone of voice',
        'Icon system',
        'Print collateral',
        'Launch campaign',
      ],
      phases: [
        {
          num: '01',
          title: 'Brand Discovery',
          description:
            'Workshops with the founders and their best clients — extracting the honest version of what the studio actually stood for.',
        },
        {
          num: '02',
          title: 'Visual Language',
          description:
            'Developed the identity: mark, type pairing, color logic, and the three visual rules that govern everything derived from the brand.',
        },
        {
          num: '03',
          title: 'Editorial System',
          description:
            'Built the typographic system — how the brand speaks in print, digital, pitch decks, and motion.',
        },
        {
          num: '04',
          title: 'Motion Direction',
          description:
            'Defined the animation personality: how the brand enters space, how it exits, what it does when it breathes.',
        },
        {
          num: '05',
          title: 'Site Build',
          description:
            'Designed and built the site in four weeks — every detail held to the identity rules, no exceptions.',
        },
      ],
      outcomes: [
        '3.2× qualified inbound lift in two quarters',
        'Fortune 500 client retained after the brand launched',
        'Featured in Fonts In Use',
        'Sales cycle shortened by 40% through visual authority',
      ],
      techStack: [
        'Figma',
        'Next.js',
        'Framer Motion',
        'Tailwind CSS',
        'TypeScript',
        'Contentful',
        'Vercel',
        'Illustrator',
        'After Effects',
      ],
    },
  },
  {
    slug: 'signal',
    title: 'Signal',
    type: 'Product',
    role: 'Founding engineer',
    year: 2023,
    tags: ['React', 'GraphQL', 'Realtime'],
    impact: 'Built the core analytics surface; reached 1k paying teams within ten months of launch.',
    thumbnail: '/thumbs/signal.svg',
    accent: '#FF5A1F',
    caseStudy: {
      problem:
        'Strong data, zero clarity. An analytics platform where finding a single metric required three clicks, a filter, and a prayer.',
      subLinks: [
        'Information architecture',
        'Data visualization layer',
        'React component system',
        'GraphQL API design',
        'Realtime subscriptions',
        'Permission model',
        'Onboarding flow',
        'Dashboard builder',
        'Export pipeline',
        'Notification system',
        'Mobile experience',
        'API documentation',
      ],
      phases: [
        {
          num: '01',
          title: 'User Research',
          description:
            'Interviewed 12 users across three segments. Found the same three problems in every session. Started there.',
        },
        {
          num: '02',
          title: 'Information Architecture',
          description:
            'Rebuilt the dashboard model from scratch — what shows on first load, how context is preserved, where the mental model breaks.',
        },
        {
          num: '03',
          title: 'Core Analytics',
          description:
            'Shipped the primary data surface in six weeks: charts, filters, and the query engine that made deep exploration feel instant.',
        },
        {
          num: '04',
          title: 'Realtime Layer',
          description:
            'Added the live event stream and alert system — the features that turned casual checkers into daily active users.',
        },
        {
          num: '05',
          title: 'Launch',
          description:
            'Shipped to beta, watched the retention curve, iterated on the one thing that needed fixing, then opened publicly.',
        },
      ],
      outcomes: [
        '1,000 paying teams reached in ten months',
        '92% daily active use of the core analytics surface',
        'Zero paid acquisition — entirely product-led growth',
        'Three major features shipped in the first quarter',
      ],
      techStack: [
        'React',
        'TypeScript',
        'GraphQL',
        'Apollo Client',
        'Node.js',
        'Postgres',
        'Redis',
        'WebSocket',
        'Recharts',
        'Tailwind CSS',
      ],
    },
  },
];
