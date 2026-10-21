import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { AmbientBackground } from '@/components/layout/AmbientBackground';
import { meta } from '@/content/copy';

export const metadata: Metadata = {
  title: meta.notFound,
  robots: { index: false },
};

// No SiteChrome here on purpose: the root not-found ships with every route, the home page
// included, so it stays server-only (AmbientBackground is plain CSS)
export default function NotFound() {
  return (
    <main id="main" className="relative z-10">
      <AmbientBackground />
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
              {meta.notFound}.
            </h1>
            <Link
              href="/"
              className="font-mono text-sm tracking-wider uppercase text-accent-signal hover:opacity-80 transition-opacity duration-150 w-fit"
            >
              ← Back home
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
