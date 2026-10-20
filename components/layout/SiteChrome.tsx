'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AmbientBackground } from '@/components/layout/AmbientBackground';
import { IntroLoader } from '@/components/layout/IntroLoader';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { MainWrapper } from '@/components/layout/MainWrapper';
import { CrtOverlay } from '@/components/effects/CrtOverlay';

// The home page is a self-contained single screen (MacBook stage) that brings
// its own nav, footer and effects. Every other route keeps the scrolling chrome.
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/') {
    return <main id="main">{children}</main>;
  }

  return (
    <>
      <AmbientBackground />
      <IntroLoader />
      <Nav />
      <MainWrapper id="main">{children}</MainWrapper>
      <Footer />
      <CrtOverlay />
    </>
  );
}
