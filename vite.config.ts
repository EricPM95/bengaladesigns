import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
