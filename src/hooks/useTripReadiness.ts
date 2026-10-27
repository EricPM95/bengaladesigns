import { useRouteStore } from '../store/useRouteStore'
import { buildReadinessItems, computeReadinessPercent, type ReadinessResolvedState } from '../lib/readiness'
import { buildEntradasBloque, buildExcursionRow, hasEnoughDaysForExcursions, type EntryRow } from '../lib/bookings'
import { useDestinationExcursions } from '../lib/destinationExcursions'
import { useArrivalInfo } from '../lib/arrivalReturn'
import { legsOf } from '../lib/reservasLegs'
import { usePagoActivo } from '../lib/pago'
import { buildDestinationSegments } from '../lib/destinationSegments'
import { alojamientoCubierto } from '../lib/tuAlojamiento'

/** null cuando no hay ruta cargada todavía. */
export function useTripReadiness() {
  const route = useRouteStore((state) => state.route)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const transportBookings = useRouteStore((state) => state.transportBookings)
  const insuranceBooking = useRouteStore((state) => state.insuranceBooking)
  const n26Added = useRouteStore((state) => state.n26Added)
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const esimSelections = useRouteStore((state) => state.esimSelections)
  const reservations = useRouteStore((state) => state.reservations)
  // Las entradas y la excursión salen de la ruta y de los datos del destino (PARA_CODE_RESERVAS, 3; el orden, de `entradas_reservas_orden`, Tanda 6s).
  const destinationInfo = useDestinationExcursions(route?.destination)
  const arrivalInfo = useArrivalInfo(route?.destination ?? '', route?.days[0]?.city ?? '', route?.origin ?? '')

  const pago = usePagoActivo()
  if (!route) return null

  const legs = legsOf(route, arrivalInfo)
  const lastDayId = route.days[route.days.length - 1]?.id
  const firstDayId = route.days[0]?.id
  // Con lo de pago encendido, la llegada y la vuelta y la zona del alojamiento de RESERVAS cuentan como el transporte y el alojamiento del primer destino.
  const transportDone = new Set(Object.keys(transportBookings))
  // (Tanda 10G: guardar el vuelo o el tren es gratis, así que cuenta en la gratis también; lo de pago es lo que la app hace con él.)
  if (legs.arrival.done && firstDayId) transportDone.add(firstDayId)
  if (legs.departure.done && lastDayId) transportDone.add(lastDayId)
  // Alojamiento (Tanda 6z): de pago y con un solo destino cuenta la zona elegida (el hotel que cuenta el viajero solo informa); con varios destinos, el alojamiento que ha puesto en cada uno.
  // (Tanda 6y4: la misma regla que la tarjeta de RESERVAS y el aviso de DÍAS, `alojamientoCubierto`.)
  const segmentos = buildDestinationSegments(route.days)
  const unDestino = segmentos.length <= 1
  const accommodationDone = new Set<string>()
  for (const segmento of segmentos) {
    const id = segmento.dayIds[0]
    if (alojamientoCubierto({ pago, unDestino, selections: accommodationSelections, zona: route.accommodationZone, segmentDayId: id })) accommodationDone.add(id)
  }

  const resolved: ReadinessResolvedState = {
    transportBookedDayIds: transportDone,
    accommodationSegmentIds: accommodationDone,
    insuranceBooked: Boolean(insuranceBooking),
    n26Added,
    rentalVehicleBooked: Boolean(rentalVehicleBooking),
    esimResolvedCountries: new Set(Object.keys(esimSelections)),
  }

  const bloque = buildEntradasBloque(route, destinationInfo.entradasOrden, destinationInfo.entradas, reservations)
  const entries: EntryRow[] = bloque.enRuta.map((item) => ({ id: item.name, name: item.name, placeNames: item.placeNames, day: item.day, reservation: item.reservation }))
  const excursion = destinationInfo.excursions.length > 0 && hasEnoughDaysForExcursions(route, destinationInfo.fromDays) ? buildExcursionRow(route, reservations) : null
  // (Tanda 10G: el vuelo o el tren y el alojamiento se guardan gratis: sus casillas cuentan en las dos versiones.)
  const items = buildReadinessItems(route, resolved, { entries, excursion })
  const percent = computeReadinessPercent(items)

  return { route, items, percent }
}
