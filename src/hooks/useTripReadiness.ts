import { useRouteStore } from '../store/useRouteStore'
import { buildReadinessItems, computeReadinessPercent, type ReadinessResolvedState } from '../lib/readiness'

/** null cuando no hay ruta cargada todavía. */
export function useTripReadiness() {
  const route = useRouteStore((state) => state.route)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const transportBookings = useRouteStore((state) => state.transportBookings)
  const insuranceBooking = useRouteStore((state) => state.insuranceBooking)
  const n26Added = useRouteStore((state) => state.n26Added)
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const esimSelections = useRouteStore((state) => state.esimSelections)

  if (!route) return null

  const resolved: ReadinessResolvedState = {
    transportBookedDayIds: new Set(Object.keys(transportBookings)),
    accommodationSegmentIds: new Set(Object.keys(accommodationSelections)),
    insuranceBooked: Boolean(insuranceBooking),
    n26Added,
    rentalVehicleBooked: Boolean(rentalVehicleBooking),
    esimResolvedCountries: new Set(Object.keys(esimSelections)),
  }

  const items = buildReadinessItems(route, resolved)
  const percent = computeReadinessPercent(items)

  return { route, items, percent }
}
