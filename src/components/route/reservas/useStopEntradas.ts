import type { Reservation } from '../../../lib/bookings'
import { entranceTargetFor } from '../../../lib/bookings'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import type { StopEntrada } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import type { ReservationTarget } from './AddReservationSheet'

/** La clave del Free Tour en `_entradas.json` y el `refId` de su reserva. */
export const FREE_TOUR_KEY = 'Free Tour'

export interface StopEntradas {
  entradas: StopEntrada[]
  /** El sitio ya está en algún día del viaje (sin eso no se puede añadir la entrada: «Añádela» no sale). */
  inTrip: boolean
  /** La reserva que cubre este sitio (Coliseo y Foro comparten la misma). */
  reservation: Reservation | null
  /** La hora que se enseña: solo en el primer sitio de la entrada (el Coliseo); el Foro lleva el ✓ sin hora. */
  shownTime: string | null
  /** Lo que se abre en la hoja de la hora («Añádela» o «Cambiar»). */
  target: ReservationTarget
}

/**
 * Las entradas de un sitio y si están reservadas (Tanda 6n y 6o): la pestañita de la tarjeta de DÍAS y la pestaña «Entradas» de cualquier ficha (la de un día,
 * EXPLORAR o «+ Añadir parada») leen lo mismo de aquí, de las entradas del destino (`_entradas.json`). Null si los datos no dan entradas de ese sitio: sin
 * entradas, ni pestaña ni pestañita. El Free Tour es una entrada más (clave «Free Tour»).
 */
export function useStopEntradas(stop: { id: string; name: string; isFreeTour?: boolean } | null | undefined): StopEntradas | null {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const info = useDestinationExcursions(route?.destination)
  if (!stop || !route) return null
  const entradas = info.entradasPorSitio[stop.isFreeTour ? FREE_TOUR_KEY : stop.name]
  if (!entradas?.length) return null
  // En el viaje: la parada con ese id, o una con ese nombre (la ficha de EXPLORAR no tiene el id de la ruta). Lo «de paso» no es una visita.
  const day = route.days.find((candidate) => candidate.stops.some((item) => item.id === stop.id || (!item.passThrough && !item.isFreeTour === !stop.isFreeTour && item.name === stop.name))) ?? null
  const reservation = reservations.find((item) => item.kind === 'entrada' && (stop.isFreeTour ? item.refId === FREE_TOUR_KEY : item.placeNames.includes(stop.name))) ?? null
  const base = reservation
    ? { refId: reservation.refId, name: reservation.name, placeNames: reservation.placeNames }
    : stop.isFreeTour
      ? { refId: FREE_TOUR_KEY, name: FREE_TOUR_KEY, placeNames: [stop.name] }
      : entranceTargetFor(stop.name, info.entradas)
  return {
    entradas,
    inTrip: day != null,
    reservation,
    shownTime: reservation && (stop.isFreeTour || reservation.placeNames[0] === stop.name) ? reservation.time : null,
    target: { kind: 'entrada', ...base, currentDayId: day?.id ?? null, existing: reservation },
  }
}
