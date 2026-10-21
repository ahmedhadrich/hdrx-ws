import { ImageResponse } from 'next/og';
import { H_PATH } from '@/components/ui/mark';
import { meta, site } from '@/content/copy';

// Link preview card (Open Graph + Twitter), rendered once at build time.
// Default next/og font: Satori can't read the site's woff2 Satoshi.
export const alt = meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Tokens from globals.css (Satori can't read CSS variables)
const BG = '#0b0b0e';
const INK = '#f4f4ee';
const INK_2 = '#a8a8b0';
const SAGE = '#87bba2';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: BG,
          color: INK,
        }}
      >
        {/* Same mark as the favicon: black H on a sage disc */}
        <svg width="96" height="96" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill={SAGE} />
          <path transform="translate(50 50) scale(0.6) translate(-50 -50)" d={H_PATH} fill={BG} />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>{site.name}</div>
          <div style={{ fontSize: 40, color: INK_2, lineHeight: 1.3, maxWidth: 900 }}>{meta.ogDescription}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: INK_2 }}>
          <span>{meta.disciplines}</span>
          <span style={{ color: SAGE }}>{site.url.replace('https://', '')}</span>
        </div>
      </div>
    ),
    size,
  );
}
