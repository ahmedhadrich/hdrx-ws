import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/lib/hooks/useTheme';
import { meta, site } from '@/content/copy';
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
  metadataBase: new URL(site.url),
  title: { default: meta.title, template: meta.titleTemplate },
  description: meta.description,
  applicationName: site.name,
  authors: [{ name: site.person.name, url: site.url }],
  creator: site.person.name,
  alternates: { canonical: '/' },
  // Allow Google the large image preview and full-length snippets
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'profile',
    firstName: site.person.firstName,
    lastName: site.person.lastName,
    siteName: site.name,
    title: meta.title,
    description: meta.ogDescription,
    url: '/',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.ogDescription,
  },
  formatDetection: { telephone: false, email: false, address: false },
};

// Browser chrome: the dark room around the MacBook on desktop; phones and tablets follow
// the device theme (--bg-base). First match wins. Media mirrors lib/utils/device.ts.
export const viewport: Viewport = {
  themeColor: [
    {
      media: '(prefers-color-scheme: light) and (max-width: 767px), (prefers-color-scheme: light) and (pointer: coarse)',
      color: '#f2ebdf',
    },
    { color: '#0b0b0e' },
  ],
  colorScheme: 'dark light',
};

// Who the site is about, for search engines: a Person (name, role, photo, profiles) and the
// website they author. A data block, not a script: CSP leaves it alone.
const PERSON_ID = `${site.url}/#person`;
const STRUCTURED_DATA = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: site.person.name,
      givenName: site.person.firstName,
      familyName: site.person.lastName,
      alternateName: site.name,
      jobTitle: site.person.jobTitle,
      description: meta.description,
      url: site.url,
      image: `${site.url}${site.portrait}`,
      email: `mailto:${site.email}`,
      address: { '@type': 'PostalAddress', addressCountry: 'DE' },
      knowsAbout: meta.knowsAbout,
      sameAs: site.social.filter((s) => !s.href.startsWith('mailto:')).map((s) => s.href),
    },
    {
      '@type': 'WebSite',
      name: site.name,
      url: site.url,
      inLanguage: 'en',
      author: { '@id': PERSON_ID },
      about: { '@id': PERSON_ID },
    },
  ],
});

const PREPAINT = `try{var d=document.documentElement;if(matchMedia('(max-width: 767px), (pointer: coarse)').matches)d.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';else if(localStorage.getItem('hdrx-theme')==='dark')d.dataset.theme='dark';var s=JSON.parse(localStorage.getItem('hdrx-settings')||'null');if(s){var a={signal:'#87bba2',shore:'#e8865a',bone:'#e9dfc8'}[s.accent];if(a)d.style.setProperty('--accent-signal',a);var b=Math.min(1,Math.max(0.3,+s.brightness||1));d.style.setProperty('--screen-dim',((1-b)*0.85).toFixed(3));}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${satoshi.variable} ${mono.variable}`}>
      <head>
        {/* Theme (device setting on mobile, saved choice on desktop) / accent / brightness before first paint, so there's no flash.
            Keys and values mirror lib/hooks/useTheme.tsx and components/screen/settings.ts. */}
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* Each route brings its own frame: the home page is the MacBook, the rest use SiteChrome */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
