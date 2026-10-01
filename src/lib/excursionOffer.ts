import type { DayPlan, Route } from './types'

/**
 * Los días que pueden ser una excursión de día completo: nunca el de llegada (el primero) ni el de vuelta (el último con
 * ruta), ni el día sintético de vuelta (decisión del usuario, 2026-09-29: una excursión el día que vuelves a casa no se
 * puede hacer).
 */
export function excursionCandidateDays(route: Route): DayPlan[] {
  const days = route.days.filter((day) => !day.isReturnLeg)
  if (days.length <= 2) return []
  return days.slice(1, -1).filter((day) => (day.dayType ?? 'normal') !== 'excursion')
}

/**
 * El día en que se ofrece la excursión: el de la oferta del destino (Roma en 4 días, el de D5C) si puede ser una
 * excursión; si es el de llegada o el de vuelta, el día completo más cercano a él. Null si no hay oferta o no cabe.
 */
export function excursionOfferDay(route: Route): { day: DayPlan; offerFrom: DayPlan } | null {
  const offerFrom = route.days.find((day) => day.excursionOffer)
  if (!offerFrom) return null
  const candidates = excursionCandidateDays(route)
  if (candidates.length === 0) return null
  if (candidates.some((day) => day.id === offerFrom.id)) return { day: offerFrom, offerFrom }
  const nearest = [...candidates].sort((a, b) => Math.abs(a.dayNumber - offerFrom.dayNumber) - Math.abs(b.dayNumber - offerFrom.dayNumber))[0]
  return { day: nearest, offerFrom }
}

/**
 * Los días donde puede ir una excursión («¿Dónde la ponemos?»): nunca el de llegada ni el de vuelta (el primero y el último con ruta,
 * ni el día sintético de vuelta). Un día que ya es una excursión se puede cambiar por otra.
 */
export function excursionTargetDays(route: Route): DayPlan[] {
  const days = route.days.filter((day) => !day.isReturnLeg)
  return days.length <= 2 ? [] : days.slice(1, -1)
}

/** ¿Sale el botón de excursiones? Con los días suficientes que marca el destino (null: este destino no tiene excursiones). */
export function showsExcursionsButton(route: Route, fromDays: number | null): boolean {
  if (fromDays == null) return false
  return route.days.filter((day) => !day.isReturnLeg).length >= fromDays
}
