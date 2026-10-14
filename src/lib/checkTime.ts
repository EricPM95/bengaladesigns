import { mapStop, type GeneratedStop } from './mapGeneratedRoute'
import type { Stop } from './types'
import { isManualRoute } from './manualPlan'
import { llegadaVueltaDe } from './llegadaVuelta'

export interface CheckTimeResult {
  status: 'bien' | 'justo' | 'normal' | 'hueco'
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
  // Una ruta a mano (Tanda 6y) no tiene lista nuestra con la que comparar el tiempo, ni sugerencias de paradas: HOY no pregunta nada al motor.
  if (!route || !day || isManualRoute(route)) return null
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
        // Tanda 7 (de pago): el día que se mira es el de la hora de llegada y de vuelta del viajero.
        ...(await llegadaVueltaDe(route, useRouteStore.getState().reservations)),
      }),
    })
    if (!response.ok) return null
    const body = (await response.json()) as {
      status?: 'bien' | 'justo' | 'normal' | 'hueco'
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
