import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Route } from '../../../lib/types'
import type { GeneratedDay } from '../../../lib/mapGeneratedRoute'
import { mapSingleGeneratedDay } from '../../../lib/mapGeneratedRoute'
import { enrichRoutePhotos } from '../../../lib/placePhoto'
import { useRouteStore } from '../../../store/useRouteStore'

/**
 * "Quiero entrar" (PROMPT_PENDIENTE F): el interruptor de una parada que va por fuera. El motor rehace ese día curado
 * con la parada por dentro y obligatoria (sin cambiar paradas ni orden: solo recoloca horas, y el tiempo sale de lo
 * estirable y de lo de menos nivel). Antes de guardar, una línea con lo que cambia y "Vale" / "Mejor no"; si hay que
 * quitar un imprescindible o el atardecer, lo pregunta ("Para entrar hay que quitar el Janículo. ¿Lo cambiamos?").
 */

interface InsideResponse {
  day: GeneratedDay
  ok: boolean
  critical: boolean
  message: string
}

type State = { stopName: string; phase: 'loading' } | { stopName: string; phase: 'ready'; result: InsideResponse } | { stopName: string; phase: 'error'; message: string }

/** El estado del diálogo y la petición al servidor. */
export function useWantInside(route: Route | null, day: DayPlan) {
  const [state, setState] = useState<State | null>(null)
  const selectedPool = useRouteStore((store) => store.selected_curated_place_names)

  const ask = async (stopName: string) => {
    if (!route) return
    setState({ stopName, phase: 'loading' })
    try {
      const response = await fetch('/api/curated-day-inside', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: route.destination,
          answers: route.answers,
          all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
          day_number: day.dayNumber,
          must_include_places: selectedPool,
          inside_names: route.insideNames ?? [],
          add: stopName,
        }),
      })
      const body = (await response.json()) as InsideResponse & { error?: string }
      if (!response.ok || !body.day) throw new Error(body.error ?? 'No se pudo rehacer el día.')
      setState({ stopName, phase: 'ready', result: body })
    } catch (error) {
      setState({ stopName, phase: 'error', message: error instanceof Error ? error.message : 'No se pudo rehacer el día.' })
    }
  }

  return { state, ask, close: () => setState(null) }
}

export function WantInsideDialog({ route, day, state, onClose }: { route: Route | null; day: DayPlan; state: State | null; onClose: () => void }) {
  const replaceDayWithInside = useRouteStore((store) => store.replaceDayWithInside)
  const [saving, setSaving] = useState(false)
  if (!state || !route) return null

  const accept = async () => {
    if (state.phase !== 'ready') return
    setSaving(true)
    const next = mapSingleGeneratedDay(route.destination, state.result.day, day)
    // Las fotos de las paradas del día nuevo, como en la ruta recién generada.
    await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
    replaceDayWithInside(day.id, next, state.stopName)
    setSaving(false)
    onClose()
  }

  const text = state.phase === 'loading' ? 'Estamos rehaciendo tu día…' : state.phase === 'error' ? state.message : state.result.message
  // En el body: el panel del día lleva una animación con transform, que encerraría el "fixed" dentro de él.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="want-inside-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative w-full rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[420px] md:rounded-[28px]">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Quiero entrar</p>
        <h2 id="want-inside-heading" className="mt-2 font-display text-[26px] leading-[1.1] text-text">
          {state.stopName}
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-text-soft">{text}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="h-12 flex-1 rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
            Mejor no
          </button>
          {state.phase === 'ready' && (
            <button type="button" onClick={accept} disabled={saving} className="h-12 flex-1 rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-60">
              Vale
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** El interruptor de la tarjeta: apagado (va por fuera); al tocarlo, pide entrar. */
export function WantInsideSwitch({ onToggle }: { onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={false} onClick={onToggle} className="flex items-center gap-1.5 rounded-full py-0.5 text-[11px] font-medium text-text/70 hover:text-text">
      <span className="relative inline-flex h-[16px] w-[28px] items-center rounded-full bg-text/15 transition-colors">
        <span className="absolute left-[2px] h-[12px] w-[12px] rounded-full bg-white shadow-sm" />
      </span>
      Quiero entrar
    </button>
  )
}
