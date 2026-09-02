import type { Route } from './types'

export interface DayTravelInfo {
  fromCity: string
  toCity: string
}

/**
 * Info de traslado del día `index` de `route.days` (0-based) para la lista de la pestaña DIAS —
 * las dos ciudades unidas por línea punteada, o null si ese día no implica traslado. Se marca
 * traslado en tres momentos, en este orden de prioridad: primer día (Origen → primer destino),
 * último día (último destino → Origen, tramo de vuelta) y cualquier día intermedio donde la ciudad
 * cambia respecto al anterior (transición entre destinos). El orden importa para un viaje de un
 * solo día, donde el primer y último día coinciden — se prioriza mostrar la llegada.
 */
export function computeDayTravelInfo(route: Route, index: number): DayTravelInfo | null {
  const day = route.days[index]
  if (!day) return null

  if (index === 0) return { fromCity: route.origin, toCity: day.city }
  if (index === route.days.length - 1) return { fromCity: day.city, toCity: route.origin }

  const previousDay = route.days[index - 1]
  if (previousDay.city !== day.city) return { fromCity: previousDay.city, toCity: day.city }

  return null
}
