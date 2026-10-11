/**
 * «Reorganizar este día» (Tanda 6y, punto 3): el cliente le pide al servidor el orden nuevo de las paradas de UN día (la regla vive en un solo sitio:
 * shared/routeEngine/reorganizarDia.js, que también usa «Crear mi propio día»). Solo ordena: devuelve los mismos ids, nunca añade ni quita.
 */
import type { DayPlan, Route } from './types'
import type { Reservation } from './bookings'
import { isFreeDay } from './freeDays'

export interface OrdenDelDia {
  /** Los mismos ids de las paradas del día, en el orden nuevo. */
  order: string[]
  /** false: el día ya estaba en buen orden. */
  changed: boolean
  /** Detrás de qué posición de `order` van la comida y la cena (-1 = antes de la primera). Solo con las que el día ya tiene. */
  mealAfter: { lunch?: number; dinner?: number }
}

/** ¿Se enseña el botón en este día? Con 2 paradas o más, en la ruta a mano y en los días nuestros que el viajero ha cambiado a mano. */
export function puedeReorganizar(day: DayPlan): boolean {
  if (day.stops.length < 2 || day.isReturnLeg) return false
  if (day.dayType === 'excursion') return false
  return isFreeDay(day) || Boolean(day.originalSnapshot) || Boolean(day.userAdded)
}

/** Lo que se le manda al servidor de cada parada. */
function paradaParaElServidor(stop: DayPlan['stops'][number], reservations: Reservation[]) {
  const reservation = stop.reservedId ? reservations.find((candidate) => candidate.id === stop.reservedId) : null
  return {
    id: stop.id,
    name: stop.name,
    fullName: stop.fullName,
    night: Boolean(stop.isNightExperience),
    arrival: Boolean(stop.isArrival),
    freeTour: Boolean(stop.isFreeTour),
    reservedTime: reservation?.time ?? stop.reservationTime ?? undefined,
    coordinates: stop.coordinates && Number.isFinite(stop.coordinates.lat) ? [stop.coordinates.lat, stop.coordinates.lng] : undefined,
  }
}

/** El orden nuevo del día, o null si no se pudo pedir (sin conexión, destino sin días escritos): entonces no cambia nada. */
export async function pedirOrdenDelDia(route: Route, day: DayPlan, reservations: Reservation[]): Promise<OrdenDelDia | null> {
  try {
    const response = await fetch('/api/reorganizar-dia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        stops: day.stops.map((stop) => paradaParaElServidor(stop, reservations)),
        has_lunch: day.meals.some((meal) => meal.mealTime === 'lunch'),
        has_dinner: day.meals.some((meal) => meal.mealTime === 'dinner'),
        accommodation_zone: route.accommodationZone ?? null,
      }),
    })
    if (!response.ok) return null
    const body = (await response.json()) as Partial<OrdenDelDia>
    if (!Array.isArray(body.order) || body.order.length !== day.stops.length) return null
    const same = new Set(day.stops.map((stop) => stop.id))
    if (body.order.some((id) => !same.has(id)) || new Set(body.order).size !== body.order.length) return null
    return { order: body.order, changed: Boolean(body.changed), mealAfter: body.mealAfter ?? {} }
  } catch {
    return null
  }
}
