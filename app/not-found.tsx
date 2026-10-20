import { Container } from '@/components/ui/Container';

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center">
      <Container>
        <div className="flex flex-col gap-6">
          <span className="font-mono text-micro tracking-widest uppercase text-ink-muted">
            404
          </span>
          <h1
            className="font-display font-light tracking-tighter text-ink-primary"
            style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}
          >
            Page not found.
          </h1>
          <a
            href="/"
            className="font-mono text-sm tracking-wider uppercase text-accent-signal hover:opacity-80 transition-opacity duration-150 w-fit"
          >
            ← Back home
          </a>
        </div>
      </Container>
    </section>
  );
}
