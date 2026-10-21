/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

// Turbopack (dev) wraps every module in eval() for source maps — 'unsafe-eval' is required in dev.
// 'wasm-unsafe-eval' lets the Meshopt decoder (MacBook model) compile its WebAssembly in production.
// Production gets a strict CSP with no third-party origins (font is self-hosted).
const cspDirectives = [
  "default-src 'self'",
  // Next.js injects inline <script> bootstrap tags (self.__next_r etc.) that require
  // 'unsafe-inline'. Turbopack dev mode additionally needs 'unsafe-eval' for source maps.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  // 'unsafe-inline' required: Framer Motion + inline style={} props throughout
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  // data: SVG noise grain. blob: GLTFLoader decodes the MacBook model's embedded textures via blob URLs
  "img-src 'self' data: blob:",
  // ws: required for Next.js HMR websocket in dev
  // blob: GLTFLoader fetches embedded textures from blob URLs
  isDev ? "connect-src 'self' ws: blob:" : "connect-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'Content-Security-Policy', value: cspDirectives },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['framer-motion', '@react-three/drei'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
