import type { Config } from 'tailwindcss';

/**
 * Arcade design tokens (Epic 01, US1.2).
 * Raw values live in src/styles/tokens.css as CSS custom properties;
 * Tailwind maps them so utilities and tokens can never drift apart.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: 'var(--ds-bg)',
          surface: 'var(--ds-surface)',
          raised: 'var(--ds-raised)',
          border: 'var(--ds-border)',
          text: 'var(--ds-text)',
          muted: 'var(--ds-muted)',
          primary: 'var(--ds-primary)',
          'primary-hot': 'var(--ds-primary-hot)',
          accent: 'var(--ds-accent)',
          lime: 'var(--ds-lime)',
          amber: 'var(--ds-amber)',
        },
        tier: {
          perfect: 'var(--ds-tier-perfect)',
          great: 'var(--ds-tier-great)',
          good: 'var(--ds-tier-good)',
          rough: 'var(--ds-tier-rough)',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', '"Arial Black"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        chunk: '4px 4px 0 0 var(--ds-shadow)',
        'chunk-sm': '2px 2px 0 0 var(--ds-shadow)',
        'chunk-lg': '6px 6px 0 0 var(--ds-shadow)',
      },
      borderWidth: {
        3: '3px',
      },
      borderRadius: {
        arcade: '0.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
