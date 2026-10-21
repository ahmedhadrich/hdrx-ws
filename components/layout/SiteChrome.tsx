'use client';

import type { ReactNode } from 'react';
import { IntroProvider } from '@/lib/hooks/useIntro';
import { AmbientBackground } from '@/components/layout/AmbientBackground';
import { IntroLoader } from '@/components/layout/IntroLoader';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { MainWrapper } from '@/components/layout/MainWrapper';
import { CrtOverlay } from '@/components/effects/CrtOverlay';

// Scrolling chrome for every route except the home page, which is the self-contained
// MacBook screen. Mounted per route (app/work/layout.tsx, app/not-found.tsx), not in the
// root layout, so none of this ships in the home page's bundle.
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <IntroProvider>
      <AmbientBackground />
      <IntroLoader />
      <Nav />
      <MainWrapper id="main">{children}</MainWrapper>
      <Footer />
      <CrtOverlay />
    </IntroProvider>
  );
}
