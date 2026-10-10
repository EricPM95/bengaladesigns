import type { Route } from './types'
import { dayOfReservation, type Reservation } from './bookings'

/** Dos reservas de entrada del mismo día que se pisan (Tanda 6v). */
export interface ReservationOverlap {
  /** Estable mientras sean las mismas dos reservas: lo que usa la campana para no repetirlo. */
  id: string
  first: Reservation
  second: Reservation
  /** Solo 'coinciden': los horarios se cruzan de verdad (Tanda 6z5: la app no calcula si llegas o no de una a otra; eso lo decide el viajero). */
  kind: 'coinciden'
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

type ShortNames = Record<string, string> | undefined

/** El nombre corto con artículo de una reserva («los Museos»): el suyo o el de los datos del destino; null si no hay (se usa el nombre completo). */
const shortOf = (reservation: Reservation, shortNames: ShortNames): string | null => reservation.shortName?.trim() || shortNames?.[reservation.refId]?.trim() || null

/** «a los Museos», «al Coliseo» (a + el = al). */
const withA = (short: string): string => `a ${short}`.replace(/^a el /, 'al ')

/** «tu Free Tour» o «tu entrada a los Museos» (sin nombre corto, «tu entrada a Museos Vaticanos y Capilla Sixtina»). */
const labelOf = (reservation: Reservation, shortNames: ShortNames): string => {
  if (reservation.refId === 'Free Tour') return 'tu Free Tour'
  const short = shortOf(reservation, shortNames)
  return short ? `tu entrada ${withA(short)}` : `tu entrada a ${reservation.name}`
}

type Interval = { start: number; end: number }

/** ¿Se cruzan de verdad las dos reservas? Cada una empieza antes de que acabe la otra. */
const seCruzan = (a: Interval, b: Interval): boolean => a.start < b.end && b.start < a.end

/**
 * Las reservas de entrada que se pisan: del mismo día y con las horas cruzadas (de su hora a su hora más lo que dura la visita). Es lo único que avisa (Tanda 6z5: nada de «vas justo», no se calcula si da tiempo a llegar) (la app nunca propone otra hora: el viajero compra la entrada cuando
 * le va bien y la app se adapta). El Free Tour va primero en el texto; si no, la de antes. Se calcula del estado del viaje, así que se va sola cuando se arregla.
 */
export function reservationOverlaps(route: Route, reservations: Reservation[], shortNames?: Record<string, string>): ReservationOverlap[] {
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
      if (a.dayId !== b.dayId) continue
      if (seCruzan(a, b)) {
        const [first, second] = a.reservation.refId === 'Free Tour' || (b.reservation.refId !== 'Free Tour' && a.start <= b.start) ? [a, b] : [b, a]
        found.push({
          id: `solape:${first.reservation.id}:${second.reservation.id}`,
          kind: 'coinciden',
          first: first.reservation,
          second: second.reservation,
          text: `${labelOf(first.reservation, shortNames).replace(/^t/, 'T')} y ${labelOf(second.reservation, shortNames)} coinciden. Revisa una de las dos reservas.`,
        })
        continue
      }
    }
  }
  return found
}
