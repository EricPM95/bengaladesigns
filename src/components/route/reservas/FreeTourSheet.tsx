import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Route } from '../../../lib/types'
import { aplicarFreeTour } from '../../../lib/rebuildDay'

/** Las horas del Free Tour (Tanda 6j): el de mañana es el de siempre (10:00); el de tarde sale a las 15:00 o a las 17:00 y el de noche a las 21:00 (solo si el viajero lo reserva). */
const FRANJAS = [
  { id: 'manana', label: 'Por la mañana', hora: '10:00' },
  { id: 'tarde', label: 'Por la tarde', hora: '15:00' },
  { id: 'tarde', label: 'Por la tarde', hora: '17:00' },
  { id: 'noche', label: 'De noche', hora: '21:00' },
] as const

/** ¿La ruta ya lleva un Free Tour? Sirve para enseñar «Añadido» y ofrecer quitarlo. */
export function routeHasFreeTour(route: Route): boolean {
  return route.days.some((day) => day.stops.some((stop) => stop.isFreeTour)) || Boolean(route.answers.freeTourDespues) || (route.answers.experiencesPositive ?? []).includes('free_tour')
}

/** El Free Tour solo se ofrece en destinos con días escritos y con al menos 2 días de ciudad (el de 1 día no lo lleva). */
export function freeTourAvailable(route: Route): boolean {
  return route.days.filter((day) => !day.isReturnLeg && day.curatedId).length >= 2
}

/**
 * «Free Tour» desde RESERVAS y desde «+ Añadir parada»: pregunta la hora y rehace los días con las reglas de siempre.
 * Misma hoja de abajo que la de reservas (AddReservationSheet).
 */
export function FreeTourSheet({ route, onClose }: { route: Route; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const added = routeHasFreeTour(route)
  const run = async (choice: { franja: 'manana' | 'tarde' | 'noche'; hora: string } | null) => {
    setBusy(true)
    setError(false)
    const ok = await aplicarFreeTour(choice)
    setBusy(false)
    if (ok) onClose()
    else setError(true)
  }
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="free-tour-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={busy ? undefined : onClose} />
      <div className="trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
          <p className="max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-accent">Free Tour</p>
          <h2 id="free-tour-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
            ¿A qué hora lo quieres?
          </h2>
          <p className="mt-2 text-caption text-text-soft">
            Tu ruta se rehace con el Free Tour: el día que lo lleva cambia a su versión con Free Tour y el resto se reordena con las reglas de siempre.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {FRANJAS.map((franja) => (
              <button
                key={`${franja.id}-${franja.hora}`}
                type="button"
                disabled={busy}
                onClick={() => run({ franja: franja.id, hora: franja.hora })}
                className="flex h-12 items-center justify-between rounded-2xl border border-text/15 bg-bg px-4 text-left text-[15px] text-text hover:bg-bg-hover disabled:opacity-50"
              >
                <span>{franja.label}</span>
                <span className="font-mono text-[12px] text-text-muted">{franja.hora}</span>
              </button>
            ))}
            {added && (
              <button type="button" disabled={busy} onClick={() => run(null)} className="mt-1 h-11 rounded-2xl text-caption font-semibold text-text-soft underline underline-offset-2 hover:text-text disabled:opacity-50">
                Quitar el Free Tour
              </button>
            )}
          </div>
          {busy && <p className="mt-3 text-caption text-text-muted">Rehaciendo tus días…</p>}
          {error && <p className="mt-3 text-caption text-accent-red">No se han podido rehacer todos los días. Prueba otra vez.</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
