import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { DateRange, Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'

/**
 * Fechas puestas desde el botón del mapa (PROMPT_PENDIENTE G). En los destinos curados (horas del motor), la ruta se
 * rehace como en el formulario, con la pantalla de carga y luego la ventana de avisos de fechas. Si el viajero ya la
 * había cambiado a mano, antes se pregunta: con "Mejor no" se guardan las fechas y la ruta se queda exactamente igual,
 * sin ventana ni avisos; solo las paradas que cierran ese día llevan "Hoy cierra" en rojo (el dato de la parada). En los demás destinos, como siempre: solo se guardan las fechas.
 */

/** Las paradas que cierran ese día (cierre semanal o festivo): el dato de la parada, sin avisos. */
async function keptClosures(route: Route, dateRange: DateRange | undefined): Promise<{ dayNumber: number; name: string }[]> {
  if (!dateRange) return []
  try {
    const response = await fetch('/api/kept-route-closures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        start: dateRange.start,
        days: route.days.filter((day) => !day.isReturnLeg).map((day) => ({ day_number: day.dayNumber, stops: day.stops.map((stop) => stop.name) })),
      }),
    })
    const body = (await response.json()) as { closures?: { day_number: number; name: string }[] }
    return (body.closures ?? []).map((closure) => ({ dayNumber: closure.day_number, name: closure.name }))
  } catch {
    return []
  }
}

export function useDatesChange(route: Route | null) {
  const setRouteDateRange = useRouteStore((store) => store.setRouteDateRange)
  const regenerateRouteForDates = useRouteStore((store) => store.regenerateRouteForDates)
  const setRouteDatesKeepingRoute = useRouteStore((store) => store.setRouteDatesKeepingRoute)
  const [pending, setPending] = useState<{ dateRange: DateRange | undefined } | null>(null)
  const [saving, setSaving] = useState(false)

  const onChangeDateRange = (dateRange: DateRange | undefined) => {
    if (!route) return
    // Solo los destinos curados se rehacen sin Claude; los demás guardan las fechas como siempre.
    const curated = route.days.some((day) => day.timesAreFinal)
    if (!curated) {
      setRouteDateRange(dateRange)
      return
    }
    if (route.editedManually) setPending({ dateRange })
    else regenerateRouteForDates(dateRange)
  }

  const keep = async () => {
    if (!route || !pending) return
    setSaving(true)
    setRouteDatesKeepingRoute(pending.dateRange, await keptClosures(route, pending.dateRange))
    setSaving(false)
    setPending(null)
  }

  const dialog = pending
    ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="dates-change-heading">
          <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={() => setPending(null)} />
          <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Tus fechas</p>
            <h2 id="dates-change-heading" className="mt-2 font-display text-[24px] leading-[1.15] text-text">
              Vamos a ajustar tu ruta a estas fechas y algunos días pueden cambiar. ¿Seguimos?
            </h2>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={keep} disabled={saving} className="h-12 flex-1 rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover disabled:opacity-60">
                Mejor no
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = pending.dateRange
                  setPending(null)
                  regenerateRouteForDates(next)
                }}
                disabled={saving}
                className="h-12 flex-1 rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-60"
              >
                Sí, ajústala
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return { onChangeDateRange, dialog }
}
