import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { SeasonCardPreview } from './dev/SeasonCardPreview.tsx'

// Solo en desarrollo: ?tarjeta=verano enseña la tarjeta de temporada sola (src/dev/SeasonCardPreview.tsx).
const previewSeason = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('tarjeta') : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {previewSeason ? <SeasonCardPreview season={previewSeason} /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
