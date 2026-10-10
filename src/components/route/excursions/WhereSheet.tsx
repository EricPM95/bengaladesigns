import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Excursion, Route } from '../../../lib/types'
import { excursionTargetDays } from '../../../lib/excursionOffer'
import { canAddDay } from '../../../lib/freeDays'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { isDayPinned } from '../../../lib/bookings'
import { dayOptionLabel } from '../freeDay/AddToDaySheet'
import { ponerExcursionEnElDia } from '../../../lib/dayInterruptor'
import { elDia } from '../../../lib/nombreDeDia'

/**
 * «¿Dónde la ponemos?» (PARA_CODE_EXCURSIONES, 3): sube desde abajo con su tirador y su cruz. Sin avisos: el viajero decide. Sustituir un
 * día lo convierte en la excursión (con la varita del día vuelve tal como estaba); un día nuevo se añade al final.
 */
export function WhereSheet({ route, excursion, onClose }: { route: Route; excursion: Excursion; onClose: () => void }) {
  const placeExcursion = useRouteStore((state) => state.placeExcursion)
  const closePage = useExcursionsStore((state) => state.closePage)
  const reservations = useRouteStore((state) => state.reservations)
  // (Un día fijado por una excursión reservada no se ofrece: lo reservado no se sustituye.)
  const days = excursionTargetDays(route).filter((day) => !isDayPinned(route, reservations, day))
  const newDayAllowed = canAddDay(route)
  const [choice, setChoice] = useState<string>(days[0]?.id ?? (newDayAllowed ? 'new' : ''))
  const chosenDay = days.find((day) => day.id === choice) ?? null

  const confirm = async () => {
    if (choice === 'new') placeExcursion(excursion, { newDay: true })
    else if (chosenDay) {
      // El día 4 lleva su interruptor [Roma | Excursión]: la excursión se pone en su página y el interruptor pasa a Excursión (Tanda 6g). Los demás días, como siempre.
      const hecho = chosenDay.interruptor ? await ponerExcursionEnElDia(chosenDay.id, excursion) : false
      if (!hecho) placeExcursion(excursion, { dayId: chosenDay.id })
    } else return
    closePage()
  }

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="where-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="overflow-y-auto px-6 pt-4">
          <p className="max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-accent">{excursion.title}</p>
          <h2 id="where-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
            ¿Dónde la ponemos?
          </h2>

          {days.length > 0 && (
            <>
              <p className="mt-5 font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-text-muted">Sustituye uno de tus días</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setChoice(day.id)}
                    className={`rounded-2xl border px-3.5 py-2.5 text-left transition-colors ${choice === day.id ? 'border-accent bg-accent-soft' : 'border-text/[.12] hover:bg-bg-hover'}`}
                  >
                    <span className="block text-[14px] font-medium text-text">{dayOptionLabel(route, day)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="mt-5 font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-text-muted">O en un día nuevo</p>
          <button
            type="button"
            disabled={!newDayAllowed}
            onClick={() => setChoice('new')}
            className={`mt-2 w-full rounded-2xl border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${choice === 'new' ? 'border-accent bg-accent-soft' : 'border-text/[.12] hover:bg-bg-hover'}`}
          >
            <span className="block text-[14px] font-medium text-text">{newDayAllowed ? 'Añádela en un día nuevo' : 'Máximo 14 días'}</span>
            <span className="block text-[12px] text-text-muted">Se añade a tu viaje como «{excursion.title}»</span>
          </button>
        </div>
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" disabled={choice === ''} onClick={confirm} className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40">
            {choice === 'new' || !chosenDay ? 'Añadirla en un día nuevo' : `Ponerla en ${elDia(route, chosenDay.dayNumber)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
