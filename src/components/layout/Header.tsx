import { useRouteStore } from '../../store/useRouteStore'
import { TripReadinessBadge } from '../route/reservas/TripReadinessBadge'

/** Botón redondo blanco de la cabecera (diseño "Trazo Itinerario"). */
const ROUND_BUTTON =
  'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-text/10 bg-bg-card text-text transition-colors hover:bg-bg-hover'

/** Cabecera mínima (diseño "Trazo Itinerario"): brújula, nombre, % de viaje listo, Mis viajes y modo noche. Exportar a PDF y compartir enlace se retiraron de aquí — la lógica sigue en exportPdf.ts/shareUrl.ts. */
export function Header() {
  const darkMode = useRouteStore((state) => state.darkMode)
  const toggleDarkMode = useRouteStore((state) => state.toggleDarkMode)
  const setScreen = useRouteStore((state) => state.setScreen)

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-2.5 bg-bg pl-[18px] pr-4">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#1C2230] text-[oklch(0.8_0.14_70)]" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 truncate font-display text-[26px] leading-none text-text">Route Planner</span>
      <TripReadinessBadge />
      {/* Único punto de vuelta a "Mis viajes" — sin esto, un viaje que se auto-abre al arrancar
          (retomar generación o Modo Hoy, ver TripSync.tsx) dejaba al viajero sin forma de ver sus
          otros viajes guardados ni crear uno nuevo. */}
      <button type="button" onClick={() => setScreen('myTrips')} title="Mis viajes" aria-label="Mis viajes" className={ROUND_BUTTON}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <path d="M9 8V5h6v3M9 12v4M15 12v4" />
        </svg>
      </button>
      <button type="button" onClick={toggleDarkMode} title="Cambiar modo oscuro" aria-label="Modo noche" className={ROUND_BUTTON}>
        {darkMode ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
          </svg>
        )}
      </button>
    </header>
  )
}
