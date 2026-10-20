import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/lib/hooks/useTheme';
import { IntroProvider } from '@/lib/hooks/useIntro';
import { SiteChrome } from '@/components/layout/SiteChrome';
import './globals.css';

const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-satoshi',
});

// HUD labels on the glass screen. Self-hosted by next/font at build time.
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'HDRX',
  description:
    'Independent engineer and designer making products, systems, and tools that feel inevitable.',
  metadataBase: new URL('https://hdrx.dev'),
  openGraph: {
    title: 'HDRX',
    description:
      'Independent engineer and designer making products, systems, and tools that feel inevitable.',
    type: 'website',
  },
};

const PREPAINT = `try{var d=document.documentElement;if(localStorage.getItem('hdrx-theme')==='dark')d.dataset.theme='dark';var s=JSON.parse(localStorage.getItem('hdrx-settings')||'null');if(s){var a={signal:'#ff5a1f',shore:'#7ac2c9',bone:'#e9dfc8'}[s.accent];if(a)d.style.setProperty('--accent-signal',a);var b=Math.min(1,Math.max(0.3,+s.brightness||1));d.style.setProperty('--screen-dim',((1-b)*0.85).toFixed(3));}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${satoshi.variable} ${mono.variable}`}>
      <head>
        {/* Saved theme / accent / brightness before first paint, so there's no flash.
            Keys and values mirror lib/hooks/useTheme.tsx and components/screen/settings.ts. */}
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <IntroProvider>
          <ThemeProvider>
            <SiteChrome>{children}</SiteChrome>
          </ThemeProvider>
        </IntroProvider>
      </body>
    </html>
  );
}
