import { TripReadinessBadge } from '../route/reservas/TripReadinessBadge'

/** Botón redondo blanco de la cabecera (diseño "Trazo Itinerario"). */
const ROUND_BUTTON =
  'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-text/10 bg-bg-card text-text transition-colors hover:bg-bg-hover'

interface HeaderProps {
  /** La bombilla: los tips del viaje (PROMPT_UI_REPASO_2, 3). */
  onTips: () => void
}

/**
 * Cabecera mínima (diseño "Trazo Itinerario"): brújula, nombre, % de viaje listo y la bombilla de los tips. La varita de
 * «Volver a mi ruta original» ya no está aquí: va en cada día de la pestaña Días (PARA_CODE_TODO_2026-10-01, paso 8).
 */
export function Header({ onTips }: HeaderProps) {
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
      <button type="button" onClick={onTips} title="Tips del viaje" aria-label="Tips del viaje" className={ROUND_BUTTON}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
        </svg>
      </button>
    </header>
  )
}
