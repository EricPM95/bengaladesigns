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
        // Paleta fija (sin variante oscura — el prototipo del rediseño no trae una) SOLO para el
        // formulario de creación de ruta rediseñado — namespace "onb" (onboarding) a propósito,
        // para no colisionar ni mezclarse nunca con bg/accent/text/border de arriba, que siguen
        // gobernando el resto de la app (RUTA/DIAS/RESERVAS/EXPLORAR), fuera de este rediseño.
        'onb-bg': '#FAFAF8',
        'onb-card': '#FFFFFF',
        'onb-text': '#1A1A1A',
        'onb-text-soft': '#6B6B6B',
        'onb-text-muted': '#9E9E9E',
        'onb-accent': '#2A9D8F',
        'onb-accent-hover': '#238578',
        'onb-accent-light': '#E8F6F4',
        'onb-border': '#E8E8E5',
        'onb-dark': '#1A1A1A',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        // Solo para el formulario de creación de ruta rediseñado (ver index.css) — nunca usadas
        // fuera de esas pantallas, el resto de la app se queda con Plus Jakarta Sans.
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        dmsans: ['"DM Sans"', 'system-ui', 'sans-serif'],
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
        // Solo para el formulario de creación de ruta rediseñado — valores exactos del prototipo.
        'onb-sm': '10px',
        'onb-md': '14px',
        'onb-lg': '20px',
        'onb-full': '50px',
      },
      transitionTimingFunction: {
        // Curva exacta del prototipo para las transiciones de pantalla (slide + fade, 450ms).
        'onb-page': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
