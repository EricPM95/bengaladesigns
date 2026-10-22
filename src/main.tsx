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

// La pantalla al abrir (I2; Tanda 10E, la de JUTRIP) vive en index.html para verse antes de que cargue nada. Sale UNA vez, unos 3 segundos desde que se abre la app, y un toque la salta (index.html decide si sale: solo al abrir la app, no en cada recarga).
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
      apertura.style.cursor = 'pointer'
      apertura.addEventListener('pointerdown', quitar, { once: true })
      // Unos 2,5 segundos desde que se abrió la página (la app ya está pintada por debajo; es lo que dura la animación de shared/marca/aperturaJutrip.js); si cargar tardó más, se quita en cuanto pinta.
      // Con las animaciones reducidas, la pantalla queda quieta con el logo y la frase, un momento para leerla.
      window.setTimeout(quitar, reducir ? 1500 : Math.max(0, 3000 - performance.now()))
    }
  }
}
