/**
 * El Free Tour en una ruta a mano (Tanda 6y2, pregunta 6): se añade como cualquier reserva (desde RESERVAS o desde EXPLORAR, con su hora) y va al DÍA DE SU FECHA como una parada más.
 * Sin precio, como siempre. Al quitar la reserva se quita también su parada (Tanda 6y3, `withoutManualFreeTour`). En una ruta nuestra el Free Tour lo coloca el motor (`aplicarFreeTour` rehace los días); aquí no hay motor: la parada se crea con los datos del destino
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

/** Hasta que llega la foto real, ninguna (el recuadro neutro de la app, como en toda parada añadida sin foto: `placeholderPhoto`). */
const SIN_FOTO = ''

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
    photoUrl: SIN_FOTO,
    // (La foto real es la del lugar de `photo_from` del destino —Piazza Navona—, como en la ruta nuestra; se pide con `pedirFotoDelFreeTour` al guardar la reserva.)
    ...(entry?.photo_name ? { photoName: entry.photo_name } : {}),
    ...(entry?.wikipedia_title ? { wikipediaTitle: entry.wikipedia_title } : {}),
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

/** ¿Es la reserva del Free Tour de una ruta a mano? (la que pone su parada en el día y, al quitarse, se la lleva). */
export function isManualFreeTourReservation(route: Route | null | undefined, reservation: Pick<Reservation, 'kind' | 'refId'> | null | undefined): boolean {
  return Boolean(route && reservation && isManualRoute(route) && reservation.kind === 'entrada' && reservation.refId === FREE_TOUR_REF)
}

/**
 * La ruta sin la parada del Free Tour (Tanda 6y3, pregunta 10): quitar la reserva del Free Tour a mano quita también su parada del día. La parada anterior queda con su tramo por recalcular,
 * igual que al quitar cualquier parada. Solo en una ruta a mano; sin parada del Free Tour, la misma ruta.
 */
export function withoutManualFreeTour(route: Route): Route {
  if (!isManualRoute(route) || !route.days.some((day) => day.stops.some((stop) => stop.isFreeTour))) return route
  return {
    ...route,
    days: route.days.map((day) => {
      let stops = day.stops
      for (const stop of day.stops) if (stop.isFreeTour) stops = sinLaParada(stops, stop.id)
      return stops === day.stops ? day : { ...day, stops }
    }),
  }
}

/** Las paradas del Free Tour de las que ya se pidió la foto (una sola petición por parada, aunque se guarde la reserva varias veces). */
const fotoPedida = new Set<string>()

/**
 * La foto real de la parada del Free Tour a mano (Tanda 6y3): la del lugar que dice el destino (`photo_from`: Piazza Navona), pedida con la MISMA lógica que el resto de paradas
 * (`fetchPlacePhoto` → `/api/place-photo`: propia, Unsplash o Wikipedia, con el nombre y su `wikipedia_title` si lo hay). Solo se pide si la parada no tiene foto y una vez por parada;
 * sin foto (o con el servidor caído) la parada se queda sin ella —el recuadro neutro— y nada se rompe. Si el viajero la quitó mientras tanto, no se escribe nada.
 */
export async function pedirFotoDelFreeTour(): Promise<void> {
  try {
    const { useRouteStore } = await import('../store/useRouteStore')
    const route = useRouteStore.getState().route
    if (!route || !isManualRoute(route)) return
    const { fetchPlacePhoto, photoNameOf } = await import('./placePhoto')
    const { addDaysToIso } = await import('./dateRange')
    const startIso = route.answers.dateRange?.start ?? null
    for (const day of route.days) {
      for (const stop of day.stops) {
        // (Sin `photoName` no se pide nada: la foto del Free Tour nunca se busca por su propio nombre, como en la ruta nuestra.)
        if (!stop.isFreeTour || !stop.photoName || stop.photoUrl || stop.fixedPhotoUrl || fotoPedida.has(`${route.id}|${stop.id}`)) continue
        fotoPedida.add(`${route.id}|${stop.id}`)
        const url = await fetchPlacePhoto(photoNameOf(stop), day.city || route.destination, stop.wikipediaTitle, 'regular', startIso ? addDaysToIso(startIso, day.dayNumber - 1) : null, Boolean(stop.noOwnPhoto))
        if (!url) continue
        useRouteStore.setState((actual) => ({
          route: actual.route
            ? { ...actual.route, days: actual.route.days.map((otro) => ({ ...otro, stops: otro.stops.map((parada) => (parada.id === stop.id && !parada.photoUrl ? { ...parada, photoUrl: url } : parada)) })) }
            : actual.route,
        }))
      }
    }
  } catch {
    // (Sin foto: la parada se queda con el recuadro neutro.)
  }
}
