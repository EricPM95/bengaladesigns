/**
 * El Free Tour en una ruta a mano (Tanda 6y2, pregunta 6): se añade como cualquier reserva (desde RESERVAS o desde EXPLORAR, con su hora) y va al DÍA DE SU FECHA como una parada más.
 * Sin precio, como siempre. En una ruta nuestra el Free Tour lo coloca el motor (`aplicarFreeTour` rehace los días); aquí no hay motor: la parada se crea con los datos del destino
 * (`free_tour_entry` de `/api/destination-places`) y se pone al final del día, sin tocar nada más. La hora y la marca de la reserva las pone `reservedEntranceInPlace` (bookings.ts).
 *
 * Funciones puras, sin React ni el almacén: las usa `addReservation` y las prueba un script.
 */
import type { Coordinates, Route, Stop } from './types'
import type { DestinationPlace } from './destinationPlacesApi'
import { dayOfReservation, type Reservation } from './bookings'
import { isManualRoute } from './manualPlan'

/** El `refId` de la reserva del Free Tour (el mismo que usan RESERVAS y la hoja de la hora). */
export const FREE_TOUR_REF = 'Free Tour'

const SIN_COORDENADAS: Coordinates = { lat: 0, lng: 0 }

/** Una foto de relleno (la de siempre en lo que añade el viajero); la real se pide luego por el nombre del punto de encuentro. */
const fotoDeRelleno = (name: string): string => `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400`

/** La parada del Free Tour, igual que la que arma el motor (`buildFreeTourStop`) pero con lo que lleva la entrada del destino. Sin entrada (sin datos del destino), una parada mínima con el nombre de la reserva. */
export function freeTourStopFrom(entry: DestinationPlace | null, reservation: Pick<Reservation, 'id' | 'name' | 'placeNames' | 'time'>): Stop {
  // (El nombre de la reserva manda: así la reserva reconoce su parada por el nombre.)
  const name = reservation.placeNames[0] ?? entry?.name ?? reservation.name
  const punto = entry?.meeting_point ?? null
  const consejo = entry?.tip ?? null
  return {
    id: `stop-free-tour-${reservation.id}`,
    time: reservation.time,
    name,
    description: punto ? `Recorrido guiado a pie, punto de encuentro en ${punto}.` : 'Recorrido guiado a pie.',
    categoryLabel: 'Free Tour',
    category: 'experience',
    durationMinutes: entry?.duration_min ?? 150,
    coordinates: entry?.coordinates ?? SIN_COORDENADAS,
    photoUrl: fotoDeRelleno(entry?.photo_name ?? name),
    insiderTip: consejo ?? undefined,
    hours: null,
    isFreeTour: true,
    ...(punto ? { freeTourMeetingPoint: punto } : {}),
    freeTourHighlights: entry?.covers ?? [],
    freeTourTips: [consejo, punto ? `Punto de encuentro: ${punto}.` : null, 'Llega 10 minutos antes — los grupos se llenan rápido.'].filter((tip): tip is string => Boolean(tip)),
    addedByUser: true,
  }
}

/** La lista de paradas sin una, con el tramo de la anterior marcado para recalcular (igual que al quitar una parada). */
function sinLaParada(stops: Stop[], stopId: string): Stop[] {
  const index = stops.findIndex((stop) => stop.id === stopId)
  if (index < 0) return stops
  const rest = stops.filter((stop) => stop.id !== stopId)
  if (index === 0) return rest
  const previous = rest[index - 1]
  rest[index - 1] = { ...previous, walkingTimeToNextMinutes: undefined, nextStopNote: undefined, nextLegPending: index < rest.length || undefined }
  return rest
}

/**
 * Pone el Free Tour de una reserva en el día de su fecha, al final de ese día. Si la ruta ya lleva un Free Tour en otro día (el viajero cambió la fecha de la reserva), esa misma parada pasa al día
 * nuevo; si ya está en ese día, no cambia nada. Solo en una ruta a mano y solo con la reserva del Free Tour; el día de llegada/vuelta y un día de excursión no lo llevan (la reserva se guarda igual).
 * La hora y la marca de «fijada» las pone después `placeReservedEntrance`.
 */
export function withManualFreeTour(route: Route, reservation: Reservation, entry: DestinationPlace | null): Route {
  if (!isManualRoute(route) || reservation.kind !== 'entrada' || reservation.refId !== FREE_TOUR_REF) return route
  const target = dayOfReservation(route, reservation)
  if (!target || target.isReturnLeg || target.dayType === 'excursion') return route
  const actual = route.days.flatMap((day) => day.stops.filter((stop) => stop.isFreeTour).map((stop) => ({ day, stop })))[0] ?? null
  if (actual && actual.day.id === target.id) return route
  const parada = actual ? actual.stop : freeTourStopFrom(entry, reservation)
  return {
    ...route,
    days: route.days.map((day) => {
      if (actual && day.id === actual.day.id) return { ...day, stops: sinLaParada(day.stops, actual.stop.id) }
      // (La que era la última queda con su tramo hasta la nueva por calcular, como al añadir cualquier parada.)
      if (day.id === target.id) return { ...day, stops: [...day.stops.map((stop, at) => (at === day.stops.length - 1 ? { ...stop, nextLegPending: true } : stop)), { ...parada, time: '', reservedId: null }] }
      return day
    }),
  }
}
