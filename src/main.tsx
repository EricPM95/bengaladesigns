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
