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
    slug: 'aura-technologies',
    title: 'Aura',
    type: 'Experiment',
    role: 'Designed and built the motion arena',
    year: 2026,
    tags: ['Three.js', 'WebGL', 'Game design', 'Solana'],
    impact:
      'Turned robot motion evaluation into a game: players pick the more natural humanoid move, and every vote trains a preference model.',
    thumbnail: '/thumbs/aura-technologies.webp',
    featured: false,
    link: 'https://aura-technologies.netlify.app',
    accent: '#7FA392',
  },
  {
    slug: 'birdwave',
    title: 'Birdwave',
    type: 'Product',
    role: 'Designed and built the front-end',
    year: 2026,
    tags: ['Next.js', 'Web design', 'Product design', 'Framer Motion'],
    impact:
      'Building the vendor-neutral integration layer for physical automation — from use-case evaluation to deployed robotics.',
    thumbnail: '/thumbs/birdwave.webp',
    featured: false,
    link: 'https://birdwave.de',
    accent: '#E9B872',
  },
  {
    slug: 'medstudy-connect',
    title: 'MedStudy Connect',
    type: 'Product',
    role: 'Designed and built the platform',
    year: 2026,
    tags: ['Next.js', 'Product design', 'Web design', 'i18n'],
    impact:
      'Connects patients in Germany with clinical trials near them, from search and pre-screening to a first appointment at the study site.',
    thumbnail: '/thumbs/medstudy-connect.webp',
    featured: false,
    link: 'https://medstudy-connect.com',
    accent: '#3B5BDB',
  },
  {
    slug: 'edu-360',
    title: 'Edu360',
    type: 'Product',
    role: 'Designed and built the full-stack application',
    year: 2026,
    tags: ['Next.js', 'Prisma', 'NeonDB', 'Product design'],
    impact:
      'Replaced fragmented spreadsheets and paper files with one DSGVO-compliant digital record, cutting school admin overhead by 30%.',
    thumbnail: '/thumbs/edu-360.webp',
    featured: true,
    link: 'https://www.edu-360.org',
    accent: '#2F6BFF',
  },
  {
    slug: 'athenyx-robotics',
    title: 'Athenyx Robotics',
    type: 'Brand',
    role: 'Co-built the front-end',
    year: 2026,
    tags: ['Next.js', 'Framer Motion', 'Web design', 'Brand site'],
    impact:
      'Gave an industrial AI robotics company a brand site that reads as serious and established.',
    thumbnail: '/thumbs/athenyx-robotics.webp',
    featured: false,
    link: 'https://athenyxrobotics.com',
    accent: '#1C1C1E',
  },
  {
    slug: 'robotics-collective',
    title: 'Robotics Collective',
    type: 'Brand',
    role: 'Created brand identity, designed the site, and co-built the front-end',
    year: 2025,
    tags: ['Brand identity', 'Logo design', 'Web design', 'Next.js'],
    impact:
      'Gave a fragmented Aachen robotics scene a single identity and home, uniting academic, startup, and student teams under one brand.',
    thumbnail: '/thumbs/robotics-collective.webp',
    featured: true,
    link: 'https://roboticscollective.org',
    accent: '#1A1A2E',
  },
  {
    slug: 'pacific-cross',
    title: 'Pacific Cross',
    type: 'Brand',
    role: 'Implemented brand redesign and site architecture across 7 international markets',
    year: 2024,
    tags: ['Webflow', 'Web design', 'Brand implementation', 'SEO'],
    impact:
      'Rolled out a unified brand and site architecture across 7 Southeast Asian markets, lifting organic SEO visibility and Google Ads reach region-wide.',
    thumbnail: '/thumbs/pacific-cross.webp',
    featured: false,
    link: 'https://www.pacificcross.com',
    accent: '#ea8837',
  },
];

// Case study when one exists, otherwise the live site.
export function projectTarget(p: Project): { href: string; external: boolean } | null {
  if (p.caseStudy) return { href: `/work/${p.slug}`, external: false };
  if (p.link) return { href: p.link, external: true };
  return null;
}
