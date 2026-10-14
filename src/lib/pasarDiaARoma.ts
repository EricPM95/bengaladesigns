import { useRouteStore } from '../store/useRouteStore'
import { cambiarConDeshacer } from '../store/useAddFlowStore'
import { dayOfReservation } from './bookings'
import { isManualRoute } from './manualPlan'
import { rehacerDiaConReservas } from './rebuildDay'
import { cambiarInterruptor } from './dayInterruptor'

/**
 * [Pasar este día a Roma] (Tanda 7, punto 14): el aviso de la campana «tu excursión vuelve a Roma a las 20:00: no te da tiempo» ofrece dos salidas: revisar la reserva o dejar ese día como un día de Roma.
 * Esto es lo segundo, y solo lo hace el viajero al pulsarlo (la app no cambia nada sola). El día vuelve a ser un día de la ciudad: el motor lo rehace con la hora del viajero, sin la excursión. La
 * excursión NO se borra: sigue en sus reservas, marcada para que no vuelva a ocupar ese día (`noMueve`), y el viajero decide si la cancela o la cambia. Con «Deshacer» todo vuelve como estaba (el día, la
 * reserva y su marca). Devuelve si se pudo.
 */
export async function pasarDiaARoma(dayNumber: number): Promise<boolean> {
  const { route, reservations } = useRouteStore.getState()
  const day = route?.days.find((candidate) => candidate.dayNumber === dayNumber)
  if (!route || !day) return false
  const delDia = reservations.filter((reserva) => reserva.kind === 'excursion' && dayOfReservation(route, reserva)?.id === day.id)
  if (delDia.length === 0 && day.dayType !== 'excursion') return false
  const ids = new Set(delDia.map((reserva) => reserva.id))
  return cambiarConDeshacer('Día pasado a Roma', async () => {
    useRouteStore.setState((state) => ({ reservations: state.reservations.map((reserva) => (ids.has(reserva.id) ? { ...reserva, noMueve: true } : reserva)) }))
    const actual = useRouteStore.getState().route?.days.find((candidate) => candidate.id === day.id)
    if (!actual) return false
    // Un día con el interruptor [Roma | Excursión] (el día 4) usa el de siempre.
    if (actual.interruptor && actual.interruptor.mode === 'excursion') return (await cambiarInterruptor(actual.id, 'roma')).ok
    // Una ruta a mano no la rehace el motor, y un día que el viajero ya cambió tampoco: el día deja de ser de excursión y se queda con lo que tenía.
    if (isManualRoute(route) || actual.originalSnapshot) {
      useRouteStore.getState().convertDayType(actual.id, 'normal')
      return true
    }
    await rehacerDiaConReservas(actual.id)
    const rehecho = useRouteStore.getState().route?.days.find((candidate) => candidate.id === day.id)
    if (rehecho && rehecho.dayType === 'excursion') useRouteStore.getState().convertDayType(rehecho.id, 'normal')
    return true
  })
}
