import type { Reservation } from '../../../lib/bookings'
import { entranceTargetFor } from '../../../lib/bookings'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import type { StopEntrada } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import type { ReservationTarget } from './AddReservationSheet'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'

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
  /** Tanda 10N §8: la entrada que el dueño tiene para este sitio y que NO cubre a quien mira (su «Comprar entrada» lleva el día y la hora del dueño). */
  delGrupo: Reservation | null
  /** Quien mira ve la reserva del dueño porque le cubre («Reservada ✓» sin «Cambiar»: no es suya para cambiarla). */
  cubiertaPorElDueno: boolean
  /** Viaje de varias personas: la etiqueta de la parada es la corta («Reservada ✓» / «Comprar entrada»). */
  compartido: boolean
  nombreAdmin: string
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
  const grupo = useEntradasDelGrupo()
  if (!stop || !route) return null
  const entradas = info.entradasPorSitio[stop.isFreeTour ? FREE_TOUR_KEY : stop.name]
  if (!entradas?.length) return null
  // En el viaje: la parada con ese id, o una con ese nombre (la ficha de EXPLORAR no tiene el id de la ruta). Lo «de paso» no es una visita.
  const day = route.days.find((candidate) => candidate.stops.some((item) => item.id === stop.id || (!item.passThrough && !item.isFreeTour === !stop.isFreeTour && item.name === stop.name))) ?? null
  const cubre = (item: Reservation) => item.kind === 'entrada' && (stop.isFreeTour ? item.refId === FREE_TOUR_KEY : item.placeNames.includes(stop.name))
  const delDueno = reservations.find(cubre) ?? null
  // Tanda 10N §8: quien mira el viaje de otra persona tiene SUS entradas (las que compra) y las del dueño que le cubren; la del dueño que no le cubre le sale «Comprar entrada».
  const propia = grupo.esInvitado ? (grupo.mias.find(cubre) ?? null) : null
  const cubiertaPorElDueno = grupo.esInvitado && !propia && delDueno != null && grupo.meIncluye(delDueno)
  const reservation = grupo.esInvitado ? (propia ?? (cubiertaPorElDueno ? delDueno : null)) : delDueno
  const delGrupo = grupo.esInvitado && !propia && !cubiertaPorElDueno ? delDueno : null
  const base = reservation
    ? { refId: reservation.refId, name: reservation.name, placeNames: reservation.placeNames }
    : stop.isFreeTour
      ? { refId: FREE_TOUR_KEY, name: stop.name, placeNames: [stop.name] }
      : entranceTargetFor(stop.name, info.entradas)
  return {
    entradas,
    inTrip: day != null,
    reservation,
    shownTime: reservation && (stop.isFreeTour || reservation.placeNames[0] === stop.name) ? reservation.time : null,
    target: { kind: 'entrada', ...base, currentDayId: day?.id ?? null, existing: cubiertaPorElDueno ? null : reservation },
    delGrupo,
    cubiertaPorElDueno,
    compartido: grupo.compartido,
    nombreAdmin: grupo.nombreAdmin,
  }
}
