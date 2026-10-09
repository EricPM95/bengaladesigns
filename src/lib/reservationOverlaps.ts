import type { Route } from './types'
import { dayOfReservation, type Reservation } from './bookings'

/** Dos reservas de entrada del mismo día que se pisan (Tanda 6v). */
export interface ReservationOverlap {
  /** Estable mientras sean las mismas dos reservas: lo que usa la campana para no repetirlo. */
  id: string
  first: Reservation
  second: Reservation
  /** «Tu Free Tour y tu entrada a Museos Vaticanos y Capilla Sixtina coinciden. Revisa una de las dos reservas.» */
  text: string
}

const DEFAULT_MINUTES = 90
const FREE_TOUR_MINUTES = 150

const toMinutes = (hhmm: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/** Lo que dura una reserva de entrada: lo que dura la visita de sus sitios en la ruta (sumados, si cubre varios: Coliseo, Foro y Palatino) o, sin ellos, 1 h 30 (el Free Tour, 2 h 30). */
function durationOf(route: Route, reservation: Reservation): number {
  const stops = route.days.flatMap((day) => day.stops.filter((stop) => !stop.passThrough))
  if (reservation.refId === 'Free Tour') return stops.find((stop) => stop.isFreeTour)?.durationMinutes ?? FREE_TOUR_MINUTES
  const visited = stops.filter((stop) => !stop.isFreeTour && reservation.placeNames.includes(stop.name))
  const total = visited.reduce((sum, stop) => sum + (stop.durationMinutes ?? 0), 0)
  return total > 0 ? total : DEFAULT_MINUTES
}

/** «tu Free Tour» o «tu entrada a Museos Vaticanos y Capilla Sixtina»: el nombre sale de la propia reserva. */
const labelOf = (reservation: Reservation): string => (reservation.refId === 'Free Tour' ? 'tu Free Tour' : `tu entrada a ${reservation.name}`)

/** Lo que hace falta entre el final de una reserva y el principio de la siguiente para llegar: 30 min de trayecto y 30 de llegada a la entrada (el documento del Roma, «Si los dos están reservados»). */
const GAP_MINUTES = 60
/** Y 30 más si entre una y otra toca comer (la primera acaba antes de las 13:30 y la segunda empieza después de las 14:30). */
const LUNCH_EXTRA_MINUTES = 30

/** ¿Dos reservas del mismo día se pisan? Si la segunda empieza antes de que dé tiempo a llegar desde el final de la primera (la duración de la visita, el trayecto, la llegada y, si toca, la comida). */
function seSolapan(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  const [first, second] = a.start <= b.start ? [a, b] : [b, a]
  const lunch = first.end <= 13 * 60 + 30 && second.start >= 14 * 60 + 30 ? LUNCH_EXTRA_MINUTES : 0
  return second.start < first.end + GAP_MINUTES + lunch
}

/**
 * Las reservas de entrada que se pisan: del mismo día y con las horas cruzadas (de su hora a su hora más lo que dura la visita). Es lo único que avisa (la app nunca propone otra hora: el viajero compra la entrada cuando
 * le va bien y la app se adapta). El Free Tour va primero en el texto; si no, la de antes. Se calcula del estado del viaje, así que se va sola cuando se arregla.
 */
export function reservationOverlaps(route: Route, reservations: Reservation[]): ReservationOverlap[] {
  const entries = reservations
    .filter((reservation) => reservation.kind === 'entrada')
    .map((reservation) => {
      const day = dayOfReservation(route, reservation)
      const start = toMinutes(reservation.time)
      return day && start != null ? { reservation, dayId: day.id, start, end: start + durationOf(route, reservation) } : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  const found: ReservationOverlap[] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]
      const b = entries[j]
      if (a.dayId !== b.dayId || !seSolapan(a, b)) continue
      const [first, second] = a.reservation.refId === 'Free Tour' || (b.reservation.refId !== 'Free Tour' && a.start <= b.start) ? [a, b] : [b, a]
      found.push({
        id: `solape:${first.reservation.id}:${second.reservation.id}`,
        first: first.reservation,
        second: second.reservation,
        text: `${labelOf(first.reservation).replace(/^t/, 'T')} y ${labelOf(second.reservation)} coinciden. Revisa una de las dos reservas.`,
      })
    }
  }
  return found
}
