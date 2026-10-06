import { mapStop, type GeneratedStop } from './mapGeneratedRoute'
import type { Stop } from './types'

export interface CheckTimeResult {
  status: 'bien' | 'justo' | 'normal'
  message: string
  spareMinutes: number
  beforeMeal: boolean
  suggestions: Stop[]
  drop: { name: string; reason: string } | null
}

/**
 * HOY: cada vez que el viajero marca «Visto», pregunta al servidor cómo va de tiempo (`POST /api/check-time`, mismo patrón que
 * adjustDay). Devuelve null si no hay respuesta (servidor viejo o error): entonces no sale nada, nunca se inventa un aviso.
 */
export async function checkTime(dayId: string, nowMinutes: number): Promise<CheckTimeResult | null> {
  const { useRouteStore } = await import('../store/useRouteStore')
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!route || !day) return null
  const done = day.stops.filter((stop) => stop.checkedInAt)
  try {
    const response = await fetch('/api/check-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        answers: route.answers,
        all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
        day_number: day.dayNumber,
        done_names: done.flatMap((stop) => [stop.name, stop.fullName].filter(Boolean)),
        now_minutes: nowMinutes,
      }),
    })
    if (!response.ok) return null
    const body = (await response.json()) as {
      status?: 'bien' | 'justo' | 'normal'
      message?: string
      spare_minutes?: number
      before_meal?: boolean
      suggestions?: GeneratedStop[]
      drop?: { name: string; reason: string } | null
    }
    if (!body.status) return null
    return {
      status: body.status,
      message: body.message ?? '',
      spareMinutes: body.spare_minutes ?? 0,
      beforeMeal: Boolean(body.before_meal),
      suggestions: (body.suggestions ?? []).map((stop) => mapStop(day.dayNumber, stop)),
      drop: body.drop ?? null,
    }
  } catch {
    return null
  }
}
