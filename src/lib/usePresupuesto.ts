import { useMemo } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { pagoActivo } from './pago'
import { construirPresupuesto, type Presupuesto } from './presupuesto'
import { monedaDelViajero, useCambio } from './useMoneda'
import type { Cambio } from './dinero'

/** El presupuesto del estado de ahora (sin React): para el PDF y para quien lo necesite fuera de una pantalla. */
export function presupuestoDeEstado(cambio: Cambio | null): Presupuesto | null {
  const state = useRouteStore.getState()
  if (!state.route) return null
  return construirPresupuesto({
    route: state.route,
    reservations: state.reservations,
    accommodationSelections: state.accommodationSelections,
    transportBookings: state.transportBookings,
    insuranceBooking: state.insuranceBooking,
    rentalVehicleBooking: state.rentalVehicleBooking,
    esimPrecios: state.esimPrecios,
    moneda: monedaDelViajero(state.route),
    cambio,
    pago: pagoActivo(),
  })
}

/** El presupuesto del viaje (Tanda 6z2), siempre al día con lo que el viajero ha puesto; null sin ruta. */
export function usePresupuesto(): { presupuesto: Presupuesto | null; cambio: Cambio | null } {
  const route = useRouteStore((state) => state.route)
  const reservations = useRouteStore((state) => state.reservations)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const transportBookings = useRouteStore((state) => state.transportBookings)
  const insuranceBooking = useRouteStore((state) => state.insuranceBooking)
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const esimPrecios = useRouteStore((state) => state.esimPrecios)
  const cambio = useCambio()
  const pago = pagoActivo()
  const presupuesto = useMemo(
    () =>
      route
        ? construirPresupuesto({ route, reservations, accommodationSelections, transportBookings, insuranceBooking, rentalVehicleBooking, esimPrecios, moneda: monedaDelViajero(route), cambio, pago })
        : null,
    [route, reservations, accommodationSelections, transportBookings, insuranceBooking, rentalVehicleBooking, esimPrecios, cambio, pago],
  )
  return { presupuesto, cambio }
}
