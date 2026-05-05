'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { sectionHeads } from '@/content/copy';
import { projects, type Project } from '@/content/projects';
import { cn } from '@/lib/utils/cn';
import { EASE_OUT_SOFT } from '@/lib/utils/motion';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function SelectedWork() {
  return (
    <section id="work" className="section">
      <Container>
        <SectionHeader {...sectionHeads.work} />

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ staggerChildren: 0.07, delayChildren: 0.15 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-12"
        >
          {projects.map((p) => (
            <motion.li
              key={p.slug}
              variants={cardVariants}
              transition={{ duration: 0.7, ease: EASE_OUT_SOFT }}
              className={cn(p.featured ? 'lg:col-span-4' : 'lg:col-span-2', 'md:col-span-1')}
            >
              <ProjectCard project={p} />
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.link ?? '#'}
      className="group block"
      aria-label={`${project.title} — ${project.type}, ${project.year}`}
    >
      <div className="crt relative overflow-hidden rounded-lg border border-rule bg-bg-raised aspect-[16/10] transition-transform duration-500 ease-out-soft group-hover:-translate-y-1 group-hover:shadow-lift">
        <img
          src={project.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* inset accent border on hover — Pixel Melbourne playfulness, Fluid Glass restraint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: `inset 0 0 0 1px ${project.accent ?? 'rgba(255,90,31,0.6)'}`,
          }}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-micro tracking-widest uppercase text-ink-muted">
            {project.type} · {project.year}
          </span>
          <span className="font-mono text-micro tracking-widest uppercase text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            View →
          </span>
        </div>

        <h3 className="font-display text-h3 tracking-tighter text-ink-primary">
          <span className="bg-gradient-to-r from-current to-current bg-no-repeat bg-[length:0%_1px] group-hover:bg-[length:100%_1px] bg-left-bottom transition-[background-size] duration-500 ease-out-soft">
            {project.title}
          </span>
        </h3>

        <p className="text-ink-secondary text-sm italic">{project.role}</p>
        <p className="text-ink-primary text-base leading-body line-clamp-2">{project.impact}</p>

        <ul
          className="mt-1 flex flex-wrap gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="Capabilities"
        >
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="font-mono text-micro tracking-widest uppercase text-ink-muted border border-rule rounded-pill px-2 py-1"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </a>
  );
}
