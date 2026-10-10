import type { Route } from '../lib/types'
import { useRouteStore } from '../store/useRouteStore'
import { buildDestinationSegments } from '../lib/destinationSegments'
import { buildEntradasBloque } from '../lib/bookings'
import { useDestinationExcursions } from '../lib/destinationExcursions'
import { legsOf } from '../lib/reservasLegs'
import { useArrivalInfo } from '../lib/arrivalReturn'
import { pagoActivo } from '../lib/pago'
import { alojamientoHecho } from '../components/route/reservas/AlojamientoReservas'

/**
 * CUÁNTAS COSAS FALTAN POR RESERVAR (Tanda 6z6): lo que sale como «Falta» en los bloques de RESERVAS. Una sola cuenta, la de la tarjeta de arriba de RESERVAS:
 *  - cada entrada de «EN TU RUTA» sin reservar (el Free Tour también),
 *  - el alojamiento (de pago, la zona; en la gratis, el hotel que cuenta el viajero; con varios destinos, uno por cada destino con noches),
 *  - de pago y con un solo destino, la llegada y la vuelta.
 */
export function useFaltaPorReservar(route: Route): number {
  const pago = pagoActivo()
  const reservations = useRouteStore((state) => state.reservations)
  const selections = useRouteStore((state) => state.accommodationSelections)
  const info = useDestinationExcursions(route.destination)
  const ciudad = route.days[0]?.city ?? route.destination
  const llegada = useArrivalInfo(route.destination, ciudad, route.origin)

  const { enRuta } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations)
  const entradas = enRuta.filter((item) => !item.reservation).length
  const tramos = buildDestinationSegments(route.days).filter((segment) => segment.nights > 0)
  const unDestino = buildDestinationSegments(route.days).length <= 1
  let alojamiento = 0
  if (unDestino) {
    const hotel = tramos[0] ? selections[tramos[0].dayIds[0]] : undefined
    const zona = info.zonasAlojamiento.find((candidata) => candidata.id === route.accommodationZone) ?? null
    const listo = pago ? alojamientoHecho(zona?.id) : Boolean(hotel)
    alojamiento = listo ? 0 : 1
  } else {
    alojamiento = tramos.filter((segment) => !selections[segment.dayIds[0]]).length
  }
  let trayectos = 0
  if (pago && unDestino) {
    const legs = legsOf(route, llegada)
    trayectos = (legs.arrival.done ? 0 : 1) + (legs.departure.done ? 0 : 1)
  }
  return entradas + alojamiento + trayectos
}
