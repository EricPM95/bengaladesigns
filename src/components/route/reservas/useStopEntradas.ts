import type { Reservation } from '../../../lib/bookings'
import { entranceTargetFor } from '../../../lib/bookings'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import type { StopEntrada } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import type { ReservationTarget } from './AddReservationSheet'

export interface StopEntradas {
  entradas: StopEntrada[]
  /** La reserva que cubre este sitio (Coliseo y Foro comparten la misma). */
  reservation: Reservation | null
  /** La hora que se enseña: solo en el primer sitio de la entrada (el Coliseo); el Foro lleva el ✓ sin hora. */
  shownTime: string | null
  /** Lo que se abre en la hoja de la hora («Añádela» o «Cambiar»). */
  target: ReservationTarget
}

/**
 * Las entradas de un sitio y si están reservadas (Tanda 6n): la pestañita de la tarjeta de DÍAS y la pestaña «Entradas» de la ficha leen lo mismo
 * de aquí. Null si los datos no dan entradas de ese sitio (sin entradas, ni pestaña ni pestañita).
 */
export function useStopEntradas(stop: { id: string; name: string; entradas?: StopEntrada[] | null } | null | undefined): StopEntradas | null {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const info = useDestinationExcursions(route?.destination)
  if (!stop || !route || !stop.entradas?.length) return null
  const day = route.days.find((candidate) => candidate.stops.some((item) => item.id === stop.id)) ?? null
  const reservation = reservations.find((item) => item.kind === 'entrada' && item.placeNames.includes(stop.name)) ?? null
  const base = reservation
    ? { refId: reservation.refId, name: reservation.name, placeNames: reservation.placeNames }
    : entranceTargetFor(stop.name, info.entradas)
  return {
    entradas: stop.entradas,
    reservation,
    shownTime: reservation && reservation.placeNames[0] === stop.name ? reservation.time : null,
    target: { kind: 'entrada', ...base, currentDayId: day?.id ?? null, existing: reservation },
  }
}
