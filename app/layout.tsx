import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/hooks/useTheme';
import { IntroProvider } from '@/lib/hooks/useIntro';
import { AmbientBackground } from '@/components/layout/AmbientBackground';
import { IntroLoader } from '@/components/layout/IntroLoader';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { MainWrapper } from '@/components/layout/MainWrapper';
import { CrtOverlay } from '@/components/effects/CrtOverlay';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ahmed Hadrich — Builder, Engineer, Designer',
  description:
    'Independent engineer and designer making products, systems, and tools that feel inevitable.',
  metadataBase: new URL('https://hdrx.dev'),
  openGraph: {
    title: 'Ahmed Hadrich — Builder, Engineer, Designer',
    description:
      'Independent engineer and designer making products, systems, and tools that feel inevitable.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,300i,400,400i,500,700,700i&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <IntroProvider>
          <ThemeProvider>
            <AmbientBackground />
            <IntroLoader />
            <Nav />
            <MainWrapper id="main">{children}</MainWrapper>
            <Footer />
            <CrtOverlay />
          </ThemeProvider>
        </IntroProvider>
      </body>
    </html>
  );
}
