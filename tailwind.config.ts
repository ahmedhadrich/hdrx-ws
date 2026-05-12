import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    container: {
      center: true,
      padding: 'clamp(1.25rem, 4vw, 3rem)',
      screens: {
        '2xl': '84rem',
      },
    },
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          raised: 'var(--bg-raised)',
          glass: 'var(--bg-glass)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
        },
        accent: {
          signal: 'var(--accent-signal)',
          shore: 'var(--accent-shore)',
          bone: 'var(--accent-bone)',
          ember: 'var(--accent-ember)',
        },
        rule: 'var(--rule)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'sans-serif'],
      },
      fontSize: {
        display: 'clamp(3.5rem, 8vw, 8rem)',
        h1: 'clamp(2.25rem, 5vw, 4rem)',
        h2: 'clamp(1.75rem, 3.5vw, 2.5rem)',
        h3: 'clamp(1.25rem, 2.2vw, 1.5rem)',
        micro: '0.75rem',
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.02em',
        widest: '0.12em',
      },
      lineHeight: {
        display: '1.02',
        tight: '1.1',
        body: '1.6',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        lift: '0 2px 6px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.12)',
        'glow-signal':
          '0 0 0 1px rgba(255,90,31,0.5), 0 8px 24px rgba(255,90,31,0.18)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        glass: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      maxWidth: {
        container: '84rem',
        prose: '60ch',
      },
    },
  },
  plugins: [],
};

export default config;
