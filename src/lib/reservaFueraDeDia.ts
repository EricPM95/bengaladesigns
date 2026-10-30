/**
 * Una reserva cuyo sitio no está en el día de su fecha (Tanda 6y2, pregunta 8, decidido por Eric el 11-oct-2026). En una ruta a mano la app no mueve nada sola, así que AVISA, con un botón que hace lo que dice:
 *  - el sitio está en otro día: «Tu entrada al Coliseo es el mié 15, pero en tu ruta el Coliseo está el mar 14.» con [Pasar al mié 15];
 *  - el sitio no está en ningún día: «Tu entrada al Coliseo es el mié 15 y el Coliseo no está en tu ruta.» con [Añadir al mié 15].
 * Sale en la campana (useAppNotices.ts) y en la tarjeta de la reserva en RESERVAS. Mientras no se pulsa el botón no se mueve nada; al pulsarlo hay «Deshacer». Se va solo cuando se arregla (se calcula del estado del
 * viaje). Sin fechas en el viaje, el día se dice «el día 2». Solo en una ruta a mano: en la nuestra el motor ya pone cada entrada en su día (y sus excepciones tienen su propio aviso).
 *
 * La detección es pura (sin React ni el almacén); lo que hacen los botones (`aplicarAvisoFueraDeDia`) carga el almacén y el catálogo del destino cuando se pulsan.
 */
import type { Route, Stop } from './types'
import { dayOfReservation, reservedEntranceInPlace, type Reservation } from './bookings'
import { isManualRoute } from './manualPlan'
import { elDia, fechaCorta, fechaDelDia } from './nombreDeDia'
import { shortOf, withA } from './reservationOverlaps'
import { FREE_TOUR_REF } from './freeTourManual'

export interface ReservaFueraDeDia {
  /** Estable mientras sea la misma reserva y el mismo caso: lo que usa la campana para no repetirlo. */
  id: string
  /** 'otro-dia': el sitio está en otro día de la ruta. 'no-esta': no está en ninguno. */
  kind: 'otro-dia' | 'no-esta'
  reservation: Reservation
  /** El día de la fecha de la reserva (a donde lleva el botón). */
  targetDayId: string
  /** Solo 'otro-dia': el día y la parada que hay ahora. */
  fromDayId: string | null
  stopId: string | null
  text: string
  /** «Pasar al mié 15» / «Añadir al mié 15». */
  actionLabel: string
}

/** ¿Es esta parada la que cubre la reserva? (El Free Tour es su propia parada.) */
function esDeLaReserva(stop: Stop, reservation: Reservation): boolean {
  if (stop.passThrough) return false
  if (reservation.refId === FREE_TOUR_REF) return Boolean(stop.isFreeTour)
  return !stop.isFreeTour && reservation.placeNames.includes(stop.name)
}

/** «el mié 15» (con fechas) o «el día 2» (sin ellas). */
function elDiaCorto(route: Route, dayNumber: number): string {
  const iso = fechaDelDia(route, dayNumber)
  return iso ? `el ${fechaCorta(iso)}` : elDia(route, dayNumber)
}

/** Las reservas de entrada cuyo sitio no está en el día de su fecha (solo en una ruta a mano). */
export function reservasFueraDeSuDia(route: Route, reservations: Reservation[], nombresCortos?: Record<string, string>): ReservaFueraDeDia[] {
  if (!isManualRoute(route)) return []
  const avisos: ReservaFueraDeDia[] = []
  for (const reservation of reservations) {
    if (reservation.kind !== 'entrada' || reservation.fueraDeRuta) continue
    // (10S4) La escrita a mano en [Añadir otra reserva] no es de ningún sitio nuestro: solo vive en RESERVAS, sin aviso.
    if (reservation.refId.startsWith('otra:')) continue
    const target = dayOfReservation(route, reservation)
    // (Fuera del viaje, el día de llegada/vuelta o un día de excursión: no hay a dónde pasarlo; la reserva se queda en RESERVAS.)
    if (!target || target.isReturnLeg || target.dayType === 'excursion') continue
    if (target.stops.some((stop) => esDeLaReserva(stop, reservation))) continue
    const esFreeTour = reservation.refId === FREE_TOUR_REF
    const short = esFreeTour ? 'el Free Tour' : shortOf(reservation, nombresCortos)
    const label = esFreeTour ? 'Tu Free Tour' : `Tu entrada ${short ? withA(short) : `a ${reservation.name}`}`
    const nombre = short ?? reservation.name
    const cuando = elDiaCorto(route, target.dayNumber)
    const alDia = cuando.replace(/^el /, 'al ')
    let from: { dayId: string; stop: Stop; dayNumber: number } | null = null
    for (const day of route.days) {
      if (day.id === target.id) continue
      const stop = day.stops.find((candidate) => esDeLaReserva(candidate, reservation))
      if (stop) {
        from = { dayId: day.id, stop, dayNumber: day.dayNumber }
        break
      }
    }
    if (from) {
      avisos.push({
        id: `fuera-de-dia:${reservation.id}:otro-dia`,
        kind: 'otro-dia',
        reservation,
        targetDayId: target.id,
        fromDayId: from.dayId,
        stopId: from.stop.id,
        text: `${label} es ${cuando}, pero en tu ruta ${nombre} está ${elDiaCorto(route, from.dayNumber)}.`,
        actionLabel: `Pasar ${alDia}`,
      })
    } else {
      avisos.push({
        id: `fuera-de-dia:${reservation.id}:no-esta`,
        kind: 'no-esta',
        reservation,
        targetDayId: target.id,
        fromDayId: null,
        stopId: null,
        text: `${label} es ${cuando} y ${nombre} no está en tu ruta.`,
        actionLabel: `Añadir ${alDia}`,
      })
    }
  }
  return avisos
}

/**
 * Lo que hace el botón del aviso, con «Deshacer». 'otro-dia': la parada pasa al día de la reserva (al final) y coge la hora y la marca de la reserva. 'no-esta': el sitio (o el Free Tour) se añade a ese día, también con la hora
 * y la marca. Devuelve false si no se pudo (el sitio no está en el catálogo del destino o el aviso ya no vale); entonces no cambia nada.
 */
export async function aplicarAvisoFueraDeDia(aviso: ReservaFueraDeDia): Promise<boolean> {
  const { useRouteStore } = await import('../store/useRouteStore')
  const { withUndo, useAddFlowStore } = await import('../store/useAddFlowStore')
  const state = useRouteStore.getState()
  const route = state.route
  if (!route || !isManualRoute(route)) return false
  const reservation = state.reservations.find((item) => item.id === aviso.reservation.id)
  const target = route.days.find((day) => day.id === aviso.targetDayId)
  if (!reservation || !target) return false
  const cuando = elDiaCorto(route, target.dayNumber).replace(/^el /, '')
  const fijar = () => useRouteStore.setState((actual) => (actual.route ? { route: reservedEntranceInPlace(actual.route, reservation) } : actual))

  if (aviso.kind === 'otro-dia') {
    if (!aviso.fromDayId || !aviso.stopId) return false
    const antes = useRouteStore.getState().route
    withUndo(`Pasado al ${cuando}`, () => {
      useRouteStore.getState().moveStopToDay(aviso.stopId!, aviso.fromDayId!, aviso.targetDayId)
      fijar()
    })
    // (Una parada que no se puede mover —ya fijada por otra reserva— deja la ruta como estaba: no hay nada que deshacer.)
    if (useRouteStore.getState().route === antes) {
      useAddFlowStore.setState({ toast: null })
      return false
    }
    return true
  }

  const { fetchDestinationPlaces } = await import('./destinationPlacesApi')
  const catalogo = await fetchDestinationPlaces(route.destination)
  if (reservation.refId === FREE_TOUR_REF) {
    const { withManualFreeTour, pedirFotoDelFreeTour } = await import('./freeTourManual')
    withUndo(`Añadido al ${cuando}`, () => {
      useRouteStore.setState((actual) => (actual.route ? { route: reservedEntranceInPlace(withManualFreeTour(actual.route, reservation, catalogo.freeTourEntry), reservation) } : actual))
    })
    void pedirFotoDelFreeTour()
    return true
  }
  const lugar = catalogo.places.find((place) => place.kind === 'place' && reservation.placeNames.includes(place.name))
  if (!lugar) return false
  const { stopFromPlace, placeholderPhoto } = await import('../components/route/placeExplorer/PlaceExplorerScreen')
  const { fetchPlacePhoto } = await import('./placePhoto')
  const foto = await Promise.race([fetchPlacePhoto(lugar.photo_name ?? lugar.name, target.city || route.destination, lugar.wikipedia_title), new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))]).catch(() => null)
  const parada = stopFromPlace(lugar, foto ?? placeholderPhoto(lugar.name))
  withUndo(`Añadido al ${cuando}`, () => {
    useRouteStore.getState().addPlaceToDay(aviso.targetDayId, parada, null)
    fijar()
  })
  return true
}
