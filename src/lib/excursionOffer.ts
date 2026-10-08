import type { DayPlan, Route } from './types'

/**
 * Los días donde puede ir una excursión («¿Dónde la ponemos?»): nunca el de llegada ni el de vuelta (el primero y el último con ruta,
 * ni el día sintético de vuelta). Un día que ya es una excursión se puede cambiar por otra.
 */
export function excursionTargetDays(route: Route): DayPlan[] {
  const days = route.days.filter((day) => !day.isReturnLeg)
  return days.length <= 2 ? [] : days.slice(1, -1)
}
