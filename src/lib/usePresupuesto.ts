import { useMemo } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { pagoActivo, usePagoActivo } from './pago'
import { construirPresupuesto, type Presupuesto } from './presupuesto'
import { monedaDelViajero, useCambio } from './useMoneda'
import type { Cambio } from './dinero'
import { gastosQueVeo } from './gastosCompartidos'
import { useGastosCompartidos } from '../store/useGastosCompartidos'
import { useViajeCompartido } from '../store/useViajeCompartido'
import { useGastosDelViaje } from '../hooks/useGastosDelViaje'
import { useLoSuyo } from '../store/useLoSuyo'
import { useMisReservas } from '../store/useMisReservas'
import { idsConLoSuyo } from './loSuyo'
import { modoDeCuentas } from './modoCuentas'
import { useModoCuentas } from './modoCuentas'
import { cuentaDelViaje, entreSinDecir, esFamilia } from './cuentaDelViaje'

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
    compartido: compartidoDeEstado(),
  })
}

/** (Tanda 10N, apartado 9) Los gastos compartidos de ahora, sin React: solo si el viaje ya tiene más gente y la tabla existe. Para el PDF. */
function compartidoDeEstado() {
  const g = useGastosCompartidos.getState()
  if (g.disponible === false || useViajeCompartido.getState().gente.length < 2) return undefined
  // (Tanda 10N8 §0b-6) Con quién se reparte y quién mira: así el PDF de quien tiene algo «Solo tú» lleva «Lo tuyo», y el de los demás no.
  const gente = useViajeCompartido.getState().gente
  const yo = gente.find((p) => p.esYo)?.id ?? g.yoId ?? null
  const lo = useLoSuyo.getState()
  const esInvitado = Boolean(yo) && !gente.find((p) => p.id === yo)?.esAdmin
  return {
    gastos: gastosQueVeo(g.gastos, g.yoId),
    extrasDeLaRutaMios: !esInvitado,
    reparto: { yoId: yo, adminId: gente.find((p) => p.esAdmin)?.id ?? null, modo: modoDeCuentas(), esInvitado, todos: gente.map((p) => p.id), porDefecto: entreSinDecir(useRouteStore.getState().route, cuentaDelViaje(gente.length, esFamilia(useRouteStore.getState().route)), gente.map((p) => p.id)), entreDe: useRouteStore.getState().route?.cuentasEntre ?? null, conVueloPropio: idsConLoSuyo(lo.grupo, 'vuelo'), conAlojamientoPropio: idsConLoSuyo(lo.grupo, 'alojamiento'), reservasPropias: esInvitado ? useMisReservas.getState().lista : [], entradasDeInvitados: lo.entradas, loSuyo: lo.mio },
  }
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
  const pago = usePagoActivo()
  // (Tanda 10N, apartado 9) En un viaje compartido, los Extras son los gastos compartidos que veo; lo de la ruta, anterior a compartir, es solo del administrador.
  const { compartido, gastos: gastosCompartidos, esInvitado, personas, yoId } = useGastosDelViaje()
  // (Tanda 10N6 §1k y 0a-8) Quién es quién y lo suyo de cada uno: el presupuesto de cada persona enseña lo suyo, y lo personal no es del grupo.
  const grupoLoSuyo = useLoSuyo((s) => s.grupo)
  const entradasInv = useLoSuyo((s) => s.entradas)
  const miLoSuyo = useLoSuyo((s) => s.mio)
  const misReservas = useMisReservas((s) => s.lista)
  const { modo } = useModoCuentas()
  const adminId = personas.find((p) => p.esAdmin)?.id ?? null
  const todosIds = useMemo(() => personas.map((p) => p.id), [personas])
  const presupuesto = useMemo(
    () =>
      route
        ? construirPresupuesto({ route, reservations, accommodationSelections, transportBookings, insuranceBooking, rentalVehicleBooking, esimPrecios, moneda: monedaDelViajero(route), cambio, pago, compartido: compartido ? { gastos: gastosCompartidos, extrasDeLaRutaMios: !esInvitado, reparto: { yoId, adminId, modo, esInvitado, todos: todosIds, porDefecto: entreSinDecir(route, cuentaDelViaje(todosIds.length, esFamilia(route)), todosIds), entreDe: route.cuentasEntre ?? null, conVueloPropio: idsConLoSuyo(grupoLoSuyo, 'vuelo'), conAlojamientoPropio: idsConLoSuyo(grupoLoSuyo, 'alojamiento'), reservasPropias: esInvitado ? misReservas : [], entradasDeInvitados: entradasInv, loSuyo: miLoSuyo } } : undefined })
        : null,
    [route, reservations, accommodationSelections, transportBookings, insuranceBooking, rentalVehicleBooking, esimPrecios, cambio, pago, modo, compartido, gastosCompartidos, esInvitado, yoId, adminId, todosIds, grupoLoSuyo, entradasInv, miLoSuyo, misReservas],
  )
  return { presupuesto, cambio }
}
