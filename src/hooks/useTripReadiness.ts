import { useRouteStore } from '../store/useRouteStore'
import { buildReadinessItems, computeReadinessPercent, type ReadinessResolvedState } from '../lib/readiness'
import { buildEntradasBloque, buildExcursionRow, hasEnoughDaysForExcursions, type EntryRow } from '../lib/bookings'
import { useDestinationExcursions } from '../lib/destinationExcursions'
import { useArrivalInfo } from '../lib/arrivalReturn'
import { legsOf } from '../lib/reservasLegs'
import { pagoActivo } from '../lib/pago'

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

  if (!route) return null

  const pago = pagoActivo()
  const legs = legsOf(route, arrivalInfo)
  const lastDayId = route.days[route.days.length - 1]?.id
  const firstDayId = route.days[0]?.id
  // Con lo de pago encendido, la llegada y la vuelta y la zona del alojamiento de RESERVAS cuentan como el transporte y el alojamiento del primer destino.
  const transportDone = new Set(Object.keys(transportBookings))
  if (pago && legs.arrival.done && firstDayId) transportDone.add(firstDayId)
  if (pago && legs.departure.done && lastDayId) transportDone.add(lastDayId)
  const accommodationDone = new Set(Object.keys(accommodationSelections))
  if (pago && route.accommodationZone && route.accommodationZone !== 'nose' && firstDayId) accommodationDone.add(firstDayId)

  const resolved: ReadinessResolvedState = {
    transportBookedDayIds: transportDone,
    accommodationSegmentIds: accommodationDone,
    insuranceBooked: Boolean(insuranceBooking),
    n26Added,
    rentalVehicleBooked: Boolean(rentalVehicleBooking),
    esimResolvedCountries: new Set(Object.keys(esimSelections)),
  }

  const bloque = buildEntradasBloque(route, destinationInfo.entradasOrden, destinationInfo.entradas, reservations)
  const entries: EntryRow[] = [...bloque.arriba, ...bloque.mas].map((item) => ({ id: item.name, name: item.name, placeNames: item.placeNames, day: item.day, reservation: item.reservation }))
  const excursion = destinationInfo.excursions.length > 0 && hasEnoughDaysForExcursions(route, destinationInfo.fromDays) ? buildExcursionRow(route, reservations) : null
  // Sin lo de pago no hay dónde poner el vuelo ni la zona del alojamiento: esas dos casillas no cuentan (el alojamiento y el billete se buscan fuera).
  const items = buildReadinessItems(route, resolved, { entries, excursion }).filter((item) => pago || (item.kind !== 'transport' && item.kind !== 'accommodation'))
  const percent = computeReadinessPercent(items)

  return { route, items, percent }
}
