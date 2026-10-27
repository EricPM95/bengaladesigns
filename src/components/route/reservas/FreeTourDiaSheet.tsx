import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Route } from '../../../lib/types'
import { alDia } from '../../../lib/nombreDeDia'
import { anadirFreeTourEnDia, diaSugeridoParaFreeTour, planearFreeTour, viajeConFreeTour } from '../../../lib/freeTourEnDia'
import { useRouteStore } from '../../../store/useRouteStore'
import { dayOptionLabel } from '../freeDay/AddToDaySheet'
import { Icono } from '../../ui/Icono'

/**
 * (Tanda 10N5, apartado 1) «¿A qué día lo añadimos?» para el Free Tour, la MISMA hoja que el resto de sitios (`AddToDaySheet`): los días del viaje, el primero donde encaja ya marcado. Un día que no se
 * puede rehacer sin avisar (cosas puestas a mano, una entrada con hora…) sale sin elegir y con su motivo debajo. Sin hora: el Free Tour queda a la hora de nuestro día escrito. (10N6) Aquí ya no se quita el Free Tour: se quita como cualquier parada (sus tres puntitos, «Quitar parada»). Lo hace igual el
 * administrador, quien edita y quien solo recomienda (a este le sale en su propuesta como un solo cambio).
 */
export function FreeTourDiaSheet({ route, onClose }: { route: Route; onClose: () => void }) {
  const reservations = useRouteStore((state) => state.reservations)
  const dias = route.days.filter((day) => !day.isReturnLeg)
  const planes = useMemo(() => new Map(dias.map((day) => [day.id, planearFreeTour(route, reservations, day.id)])), [dias, route, reservations])
  const [dayId, setDayId] = useState<string | null>(() => diaSugeridoParaFreeTour(route, reservations))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const elegido = dias.find((day) => day.id === dayId) ?? null
  const yaLoTiene = viajeConFreeTour(route)

  const anadir = async () => {
    if (!elegido) return
    setBusy(true)
    setError(null)
    const r = await anadirFreeTourEnDia(elegido.id)
    setBusy(false)
    if (r.ok === false) setError(r.texto)
    else onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="free-tour-dia-heading" data-free-tour-dia-sheet="1">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={busy ? undefined : onClose} />
      <div className="trazo-notice-panel relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto px-6 pt-4">
          <p className="max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-accent">Free Tour</p>
          <h2 id="free-tour-dia-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
            {yaLoTiene ? '¿A qué día lo pasamos?' : '¿A qué día lo añadimos?'}
          </h2>
          <div className="mt-4 flex flex-col gap-1.5">
            {dias.map((candidate) => {
              const plan = planes.get(candidate.id)
              const bloqueado = !plan || plan.ok === false
              const motivo = plan && plan.ok === false ? plan.texto : null
              const activo = candidate.id === dayId
              return (
                <button
                  key={candidate.id}
                  type="button"
                  data-dia-id={candidate.id}
                  data-bloqueado={bloqueado ? '1' : undefined}
                  disabled={bloqueado || busy}
                  onClick={() => setDayId(candidate.id)}
                  className={`rounded-2xl border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${activo ? 'border-accent bg-accent-soft' : 'border-text/[.12] hover:bg-bg-hover'} ${bloqueado ? 'opacity-50' : ''}`}
                >
                  <span className="block text-[14px] font-medium text-text">{dayOptionLabel(route, candidate)}</span>
                  {motivo && <span className="block text-[12px] text-text-muted">{motivo}</span>}
                </button>
              )
            })}
          </div>
          {error && (
            <p data-free-tour-error="1" className="mt-3 text-[12.5px] leading-snug text-accent-red">
              {error}
            </p>
          )}
        </div>
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" disabled={!elegido || busy} onClick={anadir} data-free-tour-anadir="1" className="h-12 w-full rounded-full btn-champan text-[15px] font-medium transition-transform active:scale-[.98] disabled:opacity-40">
            {busy ? 'Rehaciendo tus días…' : elegido ? `${yaLoTiene ? 'Pasar' : 'Añadir'} ${alDia(route, elegido.dayNumber)}` : 'Ningún día encaja'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
