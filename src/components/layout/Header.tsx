import { useRouteStore } from '../../store/useRouteStore'
import { TripReadinessBadge } from '../route/reservas/TripReadinessBadge'

/** Exportar a PDF y compartir enlace se retiraron de la cabecera para dejarla mínima (logo, % listo, modo oscuro) — la lógica sigue en exportPdf.ts/shareUrl.ts por si se resurge en otro sitio. */
export function Header() {
  const darkMode = useRouteStore((state) => state.darkMode)
  const toggleDarkMode = useRouteStore((state) => state.toggleDarkMode)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg-card px-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🧭</span>
        <span className="font-sans text-body font-semibold text-text">Route Planner</span>
      </div>
      <div className="flex items-center gap-2">
        <TripReadinessBadge />
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
