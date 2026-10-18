import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/** El nombre de la app y el fondo de la pantalla al abrir salen de data/marca.json (un solo sitio): se ponen en el título y en la pantalla al abrir (index.html). */
function marcaEnElHtml(): Plugin {
  return {
    name: 'marca-en-el-html',
    transformIndexHtml(html) {
      const marca = JSON.parse(readFileSync(new URL('./data/marca.json', import.meta.url), 'utf8')) as { nombre: string; logo: string | null; color_apertura?: string }
      const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      const hueco =
        '<span style="width:96px;height:96px;border-radius:26px;border:1.5px dashed rgba(255,253,248,.4);display:flex;align-items:center;justify-content:center;font:600 10px Geist Mono,monospace;letter-spacing:.14em;color:rgba(255,253,248,.55)">LOGO</span>'
      const logo = marca.logo ? `<img src="${esc(marca.logo)}" alt="" width="96" height="96" style="border-radius:26px" />` : hueco
      return html.replaceAll('%MARCA_NOMBRE%', esc(marca.nombre)).replaceAll('%MARCA_COLOR_APERTURA%', marca.color_apertura ?? '#141826').replaceAll('%MARCA_LOGO%', logo)
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
