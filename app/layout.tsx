import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/lib/hooks/useTheme';
import { IntroProvider } from '@/lib/hooks/useIntro';
import { AmbientBackground } from '@/components/layout/AmbientBackground';
import { IntroLoader } from '@/components/layout/IntroLoader';
import { RouteLoader } from '@/components/layout/RouteLoader';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { MainWrapper } from '@/components/layout/MainWrapper';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

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
    <html
      lang="en"
      data-theme="dark"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <IntroProvider>
          <ThemeProvider>
            <AmbientBackground />
            <RouteLoader />
            <IntroLoader />
            <Nav />
            <MainWrapper id="main">{children}</MainWrapper>
            <Footer />
          </ThemeProvider>
        </IntroProvider>
      </body>
    </html>
  );
}
