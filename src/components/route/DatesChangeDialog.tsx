import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { DateRange, Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { ConfirmDialog, changedDaysText } from './ConfirmDialog'
import { isManualRoute } from '../../lib/manualPlan'
import { manualShrinkNotice, type ManualShrinkNotice } from '../../lib/manualDuration'
import { useDestinationExcursions } from '../../lib/destinationExcursions'

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

/** El «¿Estás seguro?» de acortar el viaje en una ruta a mano (Tanda 6y3): el mismo diálogo de siempre al eliminar, que dice qué días se quitan. */
export function ManualShrinkDialog({ notice, onConfirm, onCancel }: { notice: ManualShrinkNotice; onConfirm: () => void; onCancel: () => void }) {
  return <ConfirmDialog eyebrow="Tus fechas" text="¿Estás seguro?" detail={notice.text} confirmLabel="Eliminar" cancelLabel="Cancelar" onCancel={onCancel} onConfirm={onConfirm} />
}

export function useDatesChange(route: Route | null) {
  const setRouteDateRange = useRouteStore((store) => store.setRouteDateRange)
  const regenerateRouteForDates = useRouteStore((store) => store.regenerateRouteForDates)
  const setRouteDatesKeepingRoute = useRouteStore((store) => store.setRouteDatesKeepingRoute)
  const [pending, setPending] = useState<{ dateRange: DateRange | undefined } | null>(null)
  const [saving, setSaving] = useState(false)

  const reservations = useRouteStore((store) => store.reservations)
  // (Los nombres cortos de las reservas —«el Coliseo»— para nombrarlas en el «¿Estás seguro?».)
  const nombresCortos = useDestinationExcursions(route?.destination).nombresCortos
  // Ruta a mano que se acorta (Tanda 6y3): UN solo «¿Estás seguro?» que dice qué días se quitan. Con «Eliminar» se quitan con todo lo que tengan; con «Cancelar» las fechas NO cambian.
  const [manualShrink, setManualShrink] = useState<ManualShrinkNotice | null>(null)

  const onChangeDateRange = (dateRange: DateRange | undefined) => {
    if (!route) return
    if (isManualRoute(route)) {
      const notice = manualShrinkNotice(route, dateRange, reservations, nombresCortos)
      if (notice) setManualShrink(notice)
      else setRouteDateRange(dateRange)
      return
    }
    // Solo los destinos curados se rehacen sin Claude; los demás guardan las fechas como siempre.
    // Una ruta a mano (Tanda 6y) nunca se rehace: las fechas se guardan y cada día pasa a llamarse por la suya.
    const curated = route.days.some((day) => day.timesAreFinal) && !isManualRoute(route)
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
            {route && route.days.some((day) => day.originalSnapshot) && (
              <p className="mt-3 text-[14.5px] leading-relaxed text-text-soft">Perderás los cambios que hiciste en {changedDaysText(route, route.days.filter((day) => day.originalSnapshot).map((day) => day.dayNumber))}.</p>
            )}
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
                className="h-12 flex-1 rounded-full btn-champan text-[15px] font-medium transition-transform active:scale-[.98] disabled:opacity-60"
              >
                Sí, ajústala
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  const manualDialog = manualShrink ? (
    <ManualShrinkDialog
      notice={manualShrink}
      onCancel={() => setManualShrink(null)}
      onConfirm={() => {
        const next = manualShrink.dateRange
        setManualShrink(null)
        setRouteDateRange(next)
      }}
    />
  ) : null

  return { onChangeDateRange, dialog: manualDialog ?? dialog }
}
