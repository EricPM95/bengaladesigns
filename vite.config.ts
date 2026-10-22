import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/** El nombre de la app, el lema, el logo y el fondo de la pantalla al abrir salen de data/marca.json y de shared/marca/logoJutrip.js (un solo sitio): se ponen en el título y en la pantalla al abrir (index.html). */
function marcaEnElHtml(): Plugin {
  return {
    name: 'marca-en-el-html',
    async transformIndexHtml(html) {
      const marca = JSON.parse(readFileSync(new URL('./data/marca.json', import.meta.url), 'utf8')) as { nombre: string; lema?: string; descripcion?: string; logo: string | null; color_apertura?: string; color_tema?: string }
      const { aperturaInteriorHtml } = (await import('./shared/marca/aperturaJutrip.js')) as { aperturaInteriorHtml: (o: { lema: string }) => string }
      const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      const hueco =
        '<span style="width:96px;height:96px;border-radius:26px;border:1.5px dashed rgba(28,34,48,.3);display:flex;align-items:center;justify-content:center;font:600 10px Geist Mono,monospace;letter-spacing:.14em;color:rgba(28,34,48,.45)">LOGO</span>'
      // La pantalla al abrir entera (el logo, el lema letra a letra y la ruta de puntos), como Marca JUTRIP 02 · 01.
      const apertura = marca.logo ? aperturaInteriorHtml({ lema: marca.lema ?? marca.descripcion ?? '' }) : hueco
      return html
        .replaceAll('%MARCA_NOMBRE%', esc(marca.nombre))
        .replaceAll('%MARCA_LEMA%', esc(marca.lema ?? marca.descripcion ?? ''))
        .replaceAll('%MARCA_COLOR_TEMA%', marca.color_tema ?? '#F6EFE0')
        .replaceAll('%MARCA_COLOR_APERTURA%', marca.color_apertura ?? '#FBF3E2')
        .replaceAll('%MARCA_APERTURA%', apertura)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), marcaEnElHtml()],
  build: {
    rollupOptions: {
      output: {
        // Las librerías grandes en su propio archivo (Tanda 8A3): así solo se bajan cuando una pantalla las pide (el mapa, el PDF…) y el navegador puede guardarlas aparte.
        manualChunks(id) {
          // Lo que usa todo el mundo (React y las piezas comunes de las librerías) va en el archivo de siempre, para que un archivo de librería grande no arrastre a los demás al abrir.
          if (id.includes('commonjsHelpers') || /node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'vendor-react'
          if (!id.includes('node_modules')) return undefined
          if (id.includes('mapbox-gl')) return 'vendor-mapbox'
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify')) return 'vendor-pdf'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('@dnd-kit')) return 'vendor-dnd'
          if (id.includes('react-day-picker') || id.includes('date-fns')) return 'vendor-fechas'
          return undefined
        },
      },
    },
  },
  server: {
    proxy: {
      // El backend en server/index.js guarda la clave de Anthropic y nunca la expone al cliente.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
