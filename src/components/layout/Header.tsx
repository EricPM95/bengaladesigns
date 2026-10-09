import { useState } from 'react'
import { TripReadinessBadge } from '../route/reservas/TripReadinessBadge'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useAppNotices } from '../../hooks/useAppNotices'
import { buildTripPayload } from '../sync/TripSync'
import { NewTripSheet } from './NewTripSheet'
import { NoticesSheet } from './NoticesSheet'

/** Botón redondo blanco de la cabecera (diseño "Trazo Itinerario"). */
const ROUND_BUTTON =
  'relative flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full border border-text/10 bg-bg-card text-text transition-colors hover:bg-bg-hover'

interface HeaderProps {
  /** La bombilla: los tips del viaje (PROMPT_UI_REPASO_2, 3). */
  onTips: () => void
  /** El aviso «más días que fechas» abre el calendario de fechas. */
  onOpenDates: () => void
}

/**
 * Cabecera (diseño "Trazo Itinerario"): brújula, nombre y, a la derecha y en este orden, el % de viaje listo, la bombilla de los tips,
 * el «+» de viaje nuevo y la campana de avisos (con su número). La varita de «Volver a mi ruta original» ya no está aquí: va en cada día
 * de la pestaña Días (PARA_CODE_TODO_2026-10-01, paso 8).
 */
export function Header({ onTips, onOpenDates }: HeaderProps) {
  const setScreen = useRouteStore((state) => state.setScreen)
  const resetQuestionnaire = useRouteStore((state) => state.resetQuestionnaire)
  const setMode = useRouteStore((state) => state.setMode)
  const { items, unreadCount } = useAppNotices()
  const [newTripOpen, setNewTripOpen] = useState(false)
  const [noticesOpen, setNoticesOpen] = useState(false)
  const hasError = items.some((item) => item.kind === 'error' && !item.read)

  const startNewTrip = () => {
    setNewTripOpen(false)
    // El viaje de ahora no se toca: se guarda su copia exacta para poder volver a él desde la cruz del formulario.
    const payload = buildTripPayload()
    const sync = useSyncStore.getState()
    sync.setResumeTrip(payload ? { payload, tripId: sync.activeTripId } : null)
    // El próximo guardado crea una fila nueva; la del viaje de ahora se queda como está.
    sync.setActiveTripId(null)
    resetQuestionnaire()
    setScreen('destination')
  }

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 bg-bg pl-[14px] pr-3">
      <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#1C2230] text-[oklch(0.8_0.14_70)]" aria-hidden="true">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 truncate font-display text-[20px] leading-none text-text">Route Planner</span>
      <TripReadinessBadge />
      <button type="button" onClick={onTips} title="Tips del viaje" aria-label="Tips del viaje" className={ROUND_BUTTON}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
        </svg>
      </button>
      <button type="button" onClick={() => setNewTripOpen(true)} title="Crear un viaje nuevo" aria-label="Crear un viaje nuevo" className={ROUND_BUTTON}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button type="button" onClick={() => setNoticesOpen(true)} title="Avisos" aria-label={unreadCount > 0 ? `Avisos (${unreadCount})` : 'Avisos'} className={ROUND_BUTTON}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className={`absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white ${hasError ? 'bg-accent-red' : 'bg-accent'}`}
            aria-hidden="true"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {newTripOpen && <NewTripSheet onConfirm={startNewTrip} onCancel={() => setNewTripOpen(false)} />}
      {noticesOpen && (
        <NoticesSheet
          items={items}
          onClose={() => setNoticesOpen(false)}
          onAction={(action) => {
            setNoticesOpen(false)
            if (action === 'open-dates') onOpenDates()
            if (action === 'open-reservas') setMode('bookings')
          }}
        />
      )}
    </header>
  )
}
