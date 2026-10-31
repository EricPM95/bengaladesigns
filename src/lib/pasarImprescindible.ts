import type { NoCabe } from './adaptarVuelos'
import { alDia } from './nombreDeDia'
import { useRouteStore } from '../store/useRouteStore'
import { useReorganizarStore } from '../store/useReorganizarStore'
import { withUndo } from '../store/useAddFlowStore'

/**
 * (Tanda 10S7c) [Pasarlo a otro día] de un imprescindible que no cabía en el día adaptado al vuelo: sale de «Si te sobra tiempo» de ese día y entra en el día que el viajero elige
 * como LA PRIMERA parada (como toda parada nueva, 10S7: coge la hora de la que era primera y las de detrás se empujan lo justo). Con [Deshacer] (vuelve a «Si te sobra tiempo»). Devuelve false si no se pudo.
 */
export function pasarImprescindibleAOtroDia(item: NoCabe, aDayId: string): boolean {
  const state = useRouteStore.getState()
  const route = state.route
  const origen = route?.days.find((day) => day.id === item.dayId)
  const destino = route?.days.find((day) => day.id === aDayId)
  const parada = origen?.spareStops?.find((stop) => stop.id === item.stopId)
  if (!route || !origen || !destino || !parada || origen.id === destino.id) return false
  const { spareReason: _motivo, ...limpia } = parada
  void _motivo
  withUndo(`Pasado ${alDia(route, destino.dayNumber)}: ${parada.name}`, () => {
    useRouteStore.getState().addStop(aDayId, { ...limpia, addedByUser: true, saltada: false })
    useRouteStore.setState((actual) =>
      actual.route
        ? { route: { ...actual.route, days: actual.route.days.map((day) => (day.id === origen.id ? { ...day, spareStops: (day.spareStops ?? []).filter((stop) => stop.id !== item.stopId) } : day)) } }
        : actual,
    )
  })
  useReorganizarStore.getState().quitarNoCaben(item.stopId)
  return true
}
