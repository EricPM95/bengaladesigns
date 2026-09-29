import { TripReadinessBadge } from '../route/reservas/TripReadinessBadge'
import { MagicWandIcon } from '../route/MagicWandIcon'

/** Botón redondo blanco de la cabecera (diseño "Trazo Itinerario"). */
const ROUND_BUTTON =
  'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-text/10 bg-bg-card text-text transition-colors hover:bg-bg-hover'

interface HeaderProps {
  /** La bombilla: los tips del viaje (PROMPT_UI_REPASO_2, 3). */
  onTips: () => void
  /** La varita: «Volver a mi ruta original» (o «Tu ruta está tal como te la preparamos» si no hay cambios). */
  onWand: () => void
}

/**
 * Cabecera mínima (diseño "Trazo Itinerario"): brújula, nombre, % de viaje listo, la bombilla de los tips y la varita
 * (PROMPT_UI_REPASO_2, 1: sustituyen a «Mis viajes», que pasa al perfil de la barra de abajo, y al modo noche). La varita
 * siempre visible y siempre igual, sin puntito ni aviso.
 */
export function Header({ onTips, onWand }: HeaderProps) {
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
      <button type="button" onClick={onWand} title="Volver a mi ruta original" aria-label="Volver a mi ruta original" className={ROUND_BUTTON}>
        <MagicWandIcon className="h-[18px] w-[18px]" />
      </button>
    </header>
  )
}
