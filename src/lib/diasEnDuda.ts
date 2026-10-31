import type { Route } from './types'
import { dayOfReservation, type Reservation } from './bookings'

/**
 * (Tanda 10S7, apartado 2) QUÉ CAMBIOS DE LA RUTA PIDEN QUE SE CALCULE SI REORGANIZAR CAMBIARÍA ALGO. Puro: compara la ruta de antes con la de después. (Aparte de reorganizarDia.ts, que no mira el vuelo.)
 */

const firmaDeVuelos = (route: Route) => JSON.stringify([route.arrivalFlightTime ?? null, route.departureFlightTime ?? null, route.arrivalPointId ?? null, route.departurePointId ?? null])
const firmaDeHoras = (reservations: Reservation[]) => new Map(reservations.filter((reservation) => reservation.kind === 'entrada').map((reservation) => [reservation.id, `${reservation.dateIso ?? ''}|${reservation.dayNumber ?? ''}|${reservation.time ?? ''}`]))

/**
 * Los días que un cambio de la ruta (de `antes` a `despues`) pone en duda: los que han recibido una parada nueva (añadida o pasada desde otro día), el día de una entrada o del Free Tour cuya hora
 * se ha puesto o cambiado, el primero y el último si cambian los vuelos y todos si cambia la zona del alojamiento. Vacío si no ha pasado nada de eso, o si la ruta se ha cambiado entera (otro viaje,
 * rehacer, cargar de la nube: más de 4 paradas nuevas de golpe no es un cambio del viajero y no merece el botón).
 */
export function diasPuestosEnDuda(antes: { route: Route | null; reservations: Reservation[] }, despues: { route: Route | null; reservations: Reservation[] }): string[] {
  const a = antes.route
  const d = despues.route
  if (!a || !d || a.id !== d.id) return []
  const dudosos = new Set<string>()
  // 1. Paradas nuevas en un día.
  let nuevas = 0
  const dudaPorParadas = new Set<string>()
  for (const day of d.days) {
    const previo = a.days.find((other) => other.id === day.id)
    if (!previo) continue
    const conocidas = new Set(previo.stops.map((stop) => stop.id))
    const llegadas = day.stops.filter((stop) => !conocidas.has(stop.id))
    if (llegadas.length > 0) dudaPorParadas.add(day.id)
    nuevas += llegadas.length
  }
  if (nuevas > 4) return []
  for (const id of dudaPorParadas) dudosos.add(id)
  // 2. La hora de una entrada o del Free Tour.
  const horasAntes = firmaDeHoras(antes.reservations)
  for (const reservation of despues.reservations) {
    if (reservation.kind !== 'entrada' || !reservation.time || reservation.refId.startsWith('otra:')) continue
    if (horasAntes.get(reservation.id) === firmaDeHoras([reservation]).get(reservation.id)) continue
    const day = dayOfReservation(d, reservation)
    if (day) dudosos.add(day.id)
  }
  // 3. Los vuelos: el día de llegada y el último de ciudad.
  if (firmaDeVuelos(a) !== firmaDeVuelos(d)) {
    const ciudad = d.days.filter((day) => !day.isReturnLeg)
    if (ciudad[0]) dudosos.add(ciudad[0].id)
    if (ciudad.length > 0) dudosos.add(ciudad[ciudad.length - 1].id)
  }
  // 4. La zona del alojamiento: todos los días.
  if ((a.accommodationZone ?? null) !== (d.accommodationZone ?? null) && d.accommodationZone) for (const day of d.days) dudosos.add(day.id)
  return [...dudosos]
}
