import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { DateRange, Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { changedDaysText } from './ConfirmDialog'
import { isManualRoute } from '../../lib/manualPlan'
import { planManualResize, type ManualResizeQuestion, type RemovedDayChoice } from '../../lib/manualDuration'

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

/** Los textos de la pregunta de un día con cosas que se quitaría (sin React, para probarlos): «El jue 16 tiene 3 paradas. ¿Qué hago con ellas?». */
export function manualDaysQuestionText(question: ManualResizeQuestion): { heading: string; detail: string | null; move: string | null; drop: string; cancel: string } {
  const label = `El ${question.label}`
  if (question.excursion) return { heading: `${label} tiene una excursión. ¿Qué hago con ella?`, detail: 'Una excursión no se pasa a otro día: se puede quitar o dejar el viaje como está.', move: null, drop: 'Quitarla', cancel: 'Cancelar' }
  const plural = question.count !== 1
  return {
    heading: `${label} tiene ${plural ? `${question.count} paradas` : 'una parada'}. ¿Qué hago con ${plural ? 'ellas' : 'ella'}?`,
    detail: question.moveToLabel ? `Si ${plural ? 'las' : 'la'} paso, ${plural ? 'irán' : 'irá'} al final del ${question.moveToLabel}, con lo que ya tengas allí.` : null,
    move: plural ? 'Pasarlas a otro día' : 'Pasarla a otro día',
    drop: plural ? 'Quitarlas' : 'Quitarla',
    cancel: 'Cancelar',
  }
}

function ManualDaysDialog({ question, onAnswer, onCancel }: { question: ManualResizeQuestion; onAnswer: (choice: RemovedDayChoice) => void; onCancel: () => void }) {
  const text = manualDaysQuestionText(question)
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="manual-days-heading" data-manual-days-dialog="1">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onCancel} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Tus fechas</p>
        <h2 id="manual-days-heading" className="mt-2 font-display text-[24px] leading-[1.15] text-text">
          {text.heading}
        </h2>
        {text.detail && <p className="mt-2 text-[14.5px] leading-snug text-text-soft">{text.detail}</p>}
        <div className="mt-5 flex flex-col gap-2">
          {text.move && (
            <button type="button" data-manual-days="move" onClick={() => onAnswer('move')} className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98]">
              {text.move}
            </button>
          )}
          <button type="button" data-manual-days="drop" onClick={() => onAnswer('drop')} className="h-12 w-full rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
            {text.drop}
          </button>
          <button type="button" data-manual-days="cancel" onClick={onCancel} className="h-12 w-full rounded-full text-[15px] font-medium text-text-soft transition-colors hover:bg-bg-hover">
            {text.cancel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function useDatesChange(route: Route | null) {
  const setRouteDateRange = useRouteStore((store) => store.setRouteDateRange)
  const regenerateRouteForDates = useRouteStore((store) => store.regenerateRouteForDates)
  const setRouteDatesKeepingRoute = useRouteStore((store) => store.setRouteDatesKeepingRoute)
  const [pending, setPending] = useState<{ dateRange: DateRange | undefined } | null>(null)
  const [saving, setSaving] = useState(false)

  // Ruta a mano que se acorta y pierde un día con cosas dentro: se pregunta día a día (Tanda 6y2) y nada cambia hasta contestar la última.
  const [manualAsk, setManualAsk] = useState<{ dateRange: DateRange | undefined; questions: ManualResizeQuestion[]; at: number; decisions: Record<string, RemovedDayChoice> } | null>(null)

  const answerManual = (choice: RemovedDayChoice) => {
    if (!manualAsk) return
    const decisions = { ...manualAsk.decisions, [manualAsk.questions[manualAsk.at].dayId]: choice }
    if (manualAsk.at + 1 < manualAsk.questions.length) {
      setManualAsk({ ...manualAsk, at: manualAsk.at + 1, decisions })
      return
    }
    setManualAsk(null)
    setRouteDateRange(manualAsk.dateRange, decisions)
  }

  const onChangeDateRange = (dateRange: DateRange | undefined) => {
    if (!route) return
    if (isManualRoute(route)) {
      const { ask } = planManualResize(route, dateRange)
      if (ask.length === 0) setRouteDateRange(dateRange)
      else setManualAsk({ dateRange, questions: ask, at: 0, decisions: {} })
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

  const manualDialog = manualAsk ? <ManualDaysDialog question={manualAsk.questions[manualAsk.at]} onAnswer={answerManual} onCancel={() => setManualAsk(null)} /> : null

  return { onChangeDateRange, dialog: manualDialog ?? dialog }
}
