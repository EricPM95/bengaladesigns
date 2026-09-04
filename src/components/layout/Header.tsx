import { useRouteStore } from '../../store/useRouteStore'
import { TripReadinessBadge } from '../route/reservas/TripReadinessBadge'

/** Exportar a PDF y compartir enlace se retiraron de la cabecera para dejarla mínima (logo, % listo, modo oscuro) — la lógica sigue en exportPdf.ts/shareUrl.ts por si se resurge en otro sitio. */
export function Header() {
  const darkMode = useRouteStore((state) => state.darkMode)
  const toggleDarkMode = useRouteStore((state) => state.toggleDarkMode)
  const setScreen = useRouteStore((state) => state.setScreen)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg-card px-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🧭</span>
        <span className="font-sans text-body font-semibold text-text">Route Planner</span>
      </div>
      <div className="flex items-center gap-2">
        <TripReadinessBadge />
        {/* Único punto de vuelta a "Mis viajes" — sin esto, un viaje que se auto-abre al arrancar
            (retomar generación o Modo Hoy, ver TripSync.tsx) dejaba al viajero sin forma de ver sus
            otros viajes guardados ni crear uno nuevo. */}
        <button
          type="button"
          onClick={() => setScreen('myTrips')}
          title="Mis viajes"
          aria-label="Mis viajes"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-soft transition-colors hover:bg-bg-hover"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleDarkMode}
          title="Cambiar modo oscuro"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-soft transition-colors hover:bg-bg-hover"
        >
          {darkMode ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
