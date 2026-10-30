import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { SeasonCardPreview } from './dev/SeasonCardPreview.tsx'
import { AdminLogros } from './components/logros/AdminLogros.tsx'
import { PruebaFotos } from './components/logros/PruebaFotos.tsx'
import { logrosActivos } from './lib/logros.ts'
import { lazy, Suspense } from 'react'
import { precargarBanderas } from './lib/banderas.ts'

// Solo en desarrollo: window.__rutaPrueba() crea el viaje de pruebas de siempre (src/dev/rutaDePrueba.ts).
if (import.meta.env.DEV) void import('./dev/rutaDePrueba.ts')

// Solo en desarrollo (8C2): window.__escaparate abre cada pantalla de los logros en un estado conocido, para las capturas (src/dev/escaparate.ts).
if (import.meta.env.DEV) void import('./dev/escaparate.ts')

// Solo en desarrollo: ?dibujos=1 enseña todos los dibujos de los logros (src/dev/DibujosPrueba.tsx), cargado a demanda.
const DibujosPrueba = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dibujos') ? lazy(() => import('./dev/DibujosPrueba.tsx').then((m) => ({ default: m.DibujosPrueba }))) : null

// Solo en desarrollo: ?tarjeta=verano enseña la tarjeta de temporada sola (src/dev/SeasonCardPreview.tsx).
const previewSeason = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('tarjeta') : null

// Con los logros encendidos (Tanda 8A): el panel de Eric (/admin/logros o /?admin=logros) y la prueba de las fotos (?pruebaFotos=1). Apagados, nada de esto existe.
const parametros = new URLSearchParams(window.location.search)
const paginaDeLogros = logrosActivos() ? (window.location.pathname === '/admin/logros' || parametros.get('admin') === 'logros' ? 'admin' : parametros.get('pruebaFotos') ? 'fotos' : null) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {DibujosPrueba ? <Suspense fallback={null}><DibujosPrueba /></Suspense> : previewSeason ? <SeasonCardPreview season={previewSeason} /> : paginaDeLogros === 'admin' ? <AdminLogros /> : paginaDeLogros === 'fotos' ? <PruebaFotos /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)

// Las banderas (su CSS pesa 84 KB comprimido) se bajan con el navegador libre, justo después de abrir (10S).
precargarBanderas()

// La pantalla al abrir (I2; Tanda 10E, la de JUTRIP) vive en index.html para verse antes de que cargue nada. Tanda 10G: sale en CADA apertura (index.html solo la omite en la recarga de después de entrar), dura 3,5 segundos, se ve entera
// y NADA la corta: ni un toque ni la app. Se quita cuando ACABA su animación, contando desde que empieza de verdad (no desde que se abrió la página): si cargar o la letra Italiana tardan, la animación empieza más tarde y se ve igual de entera.
// En desarrollo se quita al momento (si no, taparía las capturas y las pruebas); `?apertura=1` la deja puesta para verla.
{
  const apertura = document.getElementById('apertura')
  const dejar = import.meta.env.DEV && new URLSearchParams(window.location.search).get('apertura') === '1'
  if (import.meta.env.DEV && apertura) (window as unknown as { __aperturaHtml?: string }).__aperturaHtml = apertura.outerHTML // (para la captura de la apertura)
  if (apertura && !dejar) {
    const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const quitar = () => {
      apertura.style.opacity = '0'
      window.setTimeout(() => apertura.remove(), reducir ? 0 : 380)
    }
    if (import.meta.env.DEV) quitar()
    else {
      // Con las animaciones reducidas, la pantalla queda quieta con el logo, el lema y la línea nueva, 1,5 segundos desde ahora.
      if (reducir) window.setTimeout(quitar, 1500)
      else {
        // Lo último que entra es el lema (`data-fin`): cuando acaba su animación, acaba toda la pantalla. Sin ella (una marca sin logo), 3,5 s.
        const fin = apertura.querySelector('[data-fin]')
        if (fin) fin.addEventListener('animationend', quitar, { once: true })
        else window.setTimeout(quitar, 3500)
      }
    }
  }
}
