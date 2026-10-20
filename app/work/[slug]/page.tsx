import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { projects, type Project } from '@/content/projects';
import { Container } from '@/components/ui/Container';
import { CaseTimeline } from '@/components/sections/CaseTimeline';

export function generateStaticParams() {
  return projects.filter((p) => p.caseStudy).map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = projects.find((p) => p.slug === params.slug);
  if (!project) return {};
  return {
    title: `${project.title} — HDRX`,
    description: project.impact,
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = projects.find((p) => p.slug === params.slug);
  if (!project?.caseStudy) notFound();

  const { caseStudy } = project;
  const currentIdx = projects.findIndex((p) => p.slug === params.slug);
  const next = projects[(currentIdx + 1) % projects.length];

  const col1 = caseStudy.subLinks.slice(0, Math.ceil(caseStudy.subLinks.length / 2));
  const col2 = caseStudy.subLinks.slice(Math.ceil(caseStudy.subLinks.length / 2));

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="pt-[7.5rem] pb-[7.5rem]">
        <Container>
          <div className="flex flex-col gap-14">
            {/* Back link */}
            <a
              href="/#work"
              className="eyebrow hover:text-ink-primary transition-colors duration-200 w-fit"
            >
              ← Selected work
            </a>

            {/* Type + year + H1 */}
            <div className="flex flex-col gap-4">
              <span className="font-mono text-micro tracking-widest uppercase text-ink-muted">
                {project.type} · {project.year}
              </span>
              <h1
                className="font-display font-light leading-none tracking-tighter"
                style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}
              >
                {project.title}
              </h1>
            </div>

            {/* Description row */}
            <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-16">
              <p className="text-ink-secondary text-xl leading-relaxed max-w-lg">
                {caseStudy.problem}
              </p>
              <p className="font-mono text-micro tracking-wide text-ink-muted md:text-right self-end">
                {project.role}
              </p>
            </div>

            {/* Sub-links — 2-column, column-first fill (FourMeta pattern) */}
            <nav aria-label="Project capabilities">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <SubLinkColumn links={col1} />
                <SubLinkColumn links={col2} />
              </div>
            </nav>
          </div>
        </Container>
      </section>

      {/* ─── Featured media ─── */}
      <section className="pb-[7.5rem]">
        <Container>
          <MediaCard project={project} />
        </Container>
      </section>

      {/* ─── Process timeline ─── */}
      <CaseTimeline study={caseStudy} />

      {/* ─── Impact / Outcomes (wins) ─── */}
      <section className="pt-[3.75rem] pb-[7.5rem]">
        <Container>
          <div className="flex flex-col gap-14 md:pl-[min(25.5rem,30%)]">
            <p className="font-sans text-xl text-ink-secondary leading-relaxed">
              {project.title} — impact and outcomes.
            </p>

            <div className="flex flex-col gap-2" role="list">
              {caseStudy.outcomes.map((outcome, i) => (
                <div
                  key={i}
                  role="listitem"
                  className="font-display font-light tracking-tighter leading-none text-ink-muted hover:text-ink-primary transition-colors duration-200 border-b border-rule pb-5 pt-2"
                  style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3.5rem)' }}
                >
                  {outcome}
                  {i < caseStudy.outcomes.length - 1 ? ',' : '.'}
                </div>
              ))}

              {/* Easter egg — strikethrough, always last */}
              <div
                className="font-display font-light tracking-tighter leading-none text-ink-muted opacity-25 line-through pointer-events-none border-b border-rule pb-5 pt-2"
                style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3.5rem)' }}
                aria-hidden="true"
              >
                Miracles delivered on a Friday,
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Tech Stack ─── */}
      <section className="bg-bg-raised pt-[7.5rem] pb-[10rem]">
        <Container>
          <div className="flex flex-col gap-14">
            <h2
              className="font-display font-light tracking-tighter"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
            >
              Stack
            </h2>

            <div>
              <p className="font-mono text-micro tracking-widest uppercase text-ink-muted mb-8">
                Technologies used
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {caseStudy.techStack.map((tech) => (
                  <div
                    key={tech}
                    className="h-[8.75rem] border border-rule flex items-center justify-center group relative overflow-hidden"
                    style={{ marginTop: '-1px', marginLeft: '-1px' }}
                  >
                    <span className="font-mono text-sm text-ink-secondary group-hover:text-ink-primary transition-colors duration-200 text-center px-2">
                      {tech}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Next project ─── */}
      <section className="border-t border-rule pt-[7.5rem] pb-[7.5rem]">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <a href="/#work" className="eyebrow hover:text-ink-primary transition-colors duration-200">
              ← All projects
            </a>
            {next?.caseStudy && (
              <div className="text-right">
                <span className="eyebrow block mb-4">Next project</span>
                <a
                  href={`/work/${next.slug}`}
                  className="font-display font-light tracking-tighter text-ink-muted hover:text-ink-primary transition-colors duration-300 block"
                  style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
                >
                  {next.title} →
                </a>
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SubLinkColumn({ links }: { links: string[] }) {
  return (
    <div className="flex flex-col">
      {links.map((link, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-3 border-b border-rule group px-1 cursor-default"
        >
          <span className="font-sans text-lg text-ink-secondary group-hover:text-ink-primary transition-colors duration-200">
            {link}
          </span>
          <svg
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-ink-muted group-hover:text-ink-primary transition-colors duration-200 flex-shrink-0 ml-3"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M14 8l4 4-4 4" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function MediaCard({ project }: { project: Project }) {
  const accentRgb = project.accent
    ? hexToRgb(project.accent)
    : { r: 255, g: 90, b: 31 };

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        aspectRatio: '16 / 10',
        background: `radial-gradient(ellipse at 60% 50%, rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12) 0%, var(--bg-raised) 70%)`,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <img
        src={project.thumbnail}
        alt={project.title}
        width={640}
        height={400}
        className="w-full h-full object-contain p-10 md:p-16"
      />

      {/* Type + year badge */}
      <div className="absolute top-4 right-4 glass rounded-md px-3 py-2">
        <span className="font-mono text-micro tracking-widest uppercase text-ink-secondary">
          {project.type} · {project.year}
        </span>
      </div>

      {/* Role badge bottom-left */}
      <div className="absolute bottom-4 left-4 glass rounded-md px-3 py-2">
        <span className="font-mono text-micro tracking-wide text-ink-secondary italic">
          {project.role}
        </span>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 255, g: 90, b: 31 };
}
