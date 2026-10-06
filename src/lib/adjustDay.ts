import { mapSingleGeneratedDay, type GeneratedDay } from './mapGeneratedRoute'
import { enrichRoutePhotos } from './placePhoto'

export type AdjustMode = 'retraso' | 'cansado'

export interface AdjustResult {
  ok: boolean
  /** Cuántas paradas pasan a «Si te sobra tiempo» con este ajuste (las nuevas, no las que ya había). */
  newSpare: number
}

/**
 * HOY: «Voy con retraso» / «Estoy cansado» (Tanda 6). Pide al servidor el día recalculado con lo que ya se ha hecho y la hora de
 * ahora (`POST /api/adjust-day`, mismo patrón que /api/rebuild-day) y SUSTITUYE el día. Lo ya hecho se queda hecho (su `checkedInAt`).
 * Nunca decide el viajero a ciegas: el mensaje de después dice qué ha pasado.
 */
export async function adjustDay(dayId: string, mode: AdjustMode, nowMinutes: number): Promise<AdjustResult> {
  const { useRouteStore } = await import('../store/useRouteStore')
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!route || !day) return { ok: false, newSpare: 0 }
  const done = day.stops.filter((stop) => stop.checkedInAt)
  try {
    const response = await fetch('/api/adjust-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        answers: route.answers,
        all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
        day_number: day.dayNumber,
        done_ids: done.map((stop) => stop.id),
        done_names: done.flatMap((stop) => [stop.name, stop.fullName].filter(Boolean)),
        now_minutes: nowMinutes,
        mode,
      }),
    })
    if (!response.ok) return { ok: false, newSpare: 0 }
    const body = (await response.json()) as { day?: GeneratedDay }
    if (!body.day) return { ok: false, newSpare: 0 }
    const next = mapSingleGeneratedDay(route.destination, body.day, day)
    await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
    // Lo ya hecho se queda hecho; si el servidor no devuelve alguna parada hecha, se conserva delante para que el progreso del día no se pierda.
    const doneById = new Map(done.map((stop) => [stop.id, stop]))
    const kept = next.stops.map((stop) => (doneById.has(stop.id) ? { ...stop, checkedInAt: doneById.get(stop.id)!.checkedInAt } : stop))
    const missingDone = done.filter((stop) => !kept.some((other) => other.id === stop.id))
    const adjusted = { ...next, stops: [...missingDone, ...kept] }
    useRouteStore.getState().applyAdjustedDay(dayId, adjusted)
    const before = new Set((day.spareStops ?? []).map((stop) => stop.id))
    return { ok: true, newSpare: (next.spareStops ?? []).filter((stop) => !before.has(stop.id)).length }
  } catch {
    return { ok: false, newSpare: 0 }
  }
}
