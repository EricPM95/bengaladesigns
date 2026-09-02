import type { Config } from 'tailwindcss'

/** Colores definidos como triplete RGB en CSS (ej. `--accent: 13 148 136`) — así los modificadores de opacidad (bg-accent/10) funcionan vía rgb(var(--x) / <alpha-value>). */
function withOpacity(varName: string) {
  return `rgb(var(${varName}) / <alpha-value>)`
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: withOpacity('--bg'),
        'bg-card': withOpacity('--bg-card'),
        'bg-hover': withOpacity('--bg-hover'),
        accent: withOpacity('--accent'),
        'accent-hover': withOpacity('--accent-hover'),
        'accent-soft': withOpacity('--accent-soft'),
        'accent-warm': withOpacity('--accent-warm'),
        'accent-gold': withOpacity('--accent-gold'),
        'accent-red': withOpacity('--accent-red'),
        'accent-lilac': withOpacity('--accent-lilac'),
        text: withOpacity('--text'),
        'text-soft': withOpacity('--text-soft'),
        'text-muted': withOpacity('--text-muted'),
        border: withOpacity('--border'),
        'border-accent': withOpacity('--border-accent'),
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        hero: ['48px', { lineHeight: '1.1' }],
        h1: ['28px', { lineHeight: '1.2' }],
        h2: ['20px', { lineHeight: '1.3' }],
        body: ['15px', { lineHeight: '1.5' }],
        small: ['13px', { lineHeight: '1.4' }],
        caption: ['11px', { lineHeight: '1.3' }],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
} satisfies Config
