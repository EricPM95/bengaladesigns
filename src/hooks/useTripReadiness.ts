import { useRouteStore } from '../store/useRouteStore'
import { buildReadinessItems, computeReadinessPercent, type ReadinessResolvedState } from '../lib/readiness'
import { buildEntryRows, buildExcursionRow, hasEnoughDaysForExcursions } from '../lib/bookings'
import { useDestinationExcursions } from '../lib/destinationExcursions'

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
  // Las entradas imprescindibles y la excursión salen de la ruta y de los datos del destino (PARA_CODE_RESERVAS, 3).
  const destinationInfo = useDestinationExcursions(route?.destination)

  if (!route) return null

  const resolved: ReadinessResolvedState = {
    transportBookedDayIds: new Set(Object.keys(transportBookings)),
    accommodationSegmentIds: new Set(Object.keys(accommodationSelections)),
    insuranceBooked: Boolean(insuranceBooking),
    n26Added,
    rentalVehicleBooked: Boolean(rentalVehicleBooking),
    esimResolvedCountries: new Set(Object.keys(esimSelections)),
  }

  const entries = buildEntryRows(route, destinationInfo.entradas, reservations).main
  const excursion = destinationInfo.excursions.length > 0 && hasEnoughDaysForExcursions(route, destinationInfo.fromDays) ? buildExcursionRow(route, reservations) : null
  const items = buildReadinessItems(route, resolved, { entries, excursion })
  const percent = computeReadinessPercent(items)

  return { route, items, percent }
}
