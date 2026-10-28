/**
 * (Tanda 10N6, apartado 1c) QUITAR UNA PARADA QUE TIENE ENTRADA (o reserva): que no se pierda la entrada.
 * Antes, «Quitar del viaje» borraba también la reserva de RESERVAS (pagada, y con el archivo del QR en la 10T). Ahora el viajero elige:
 *   · «Quitar solo de la ruta»: la parada sale del día y la entrada SE QUEDA en RESERVAS, con la marca `fueraDeRuta` («Ya no está en tu ruta») y la opción de volver a ponerla en su día.
 *   · «Quitar también la entrada»: sale la parada y se borra la reserva (con [Deshacer]).
 * Por defecto nunca se borra la entrada sin que lo elija. (10N8) Sirve igual para el Free Tour, que es una parada más: sale del día sin rehacer ningún día.
 * Todo con [Deshacer]: la ruta y todo lo reservado vuelven tal cual estaban.
 */
import type { Reservation } from './bookings'
import { dayOfReservation, placeReservedEntrance, unpinReservedStops } from './bookings'
import { cambiarConDeshacer, useAddFlowStore } from '../store/useAddFlowStore'
import { useRouteStore } from '../store/useRouteStore'
import { diaDeLaReservaEnPalabras, horaCorta } from './reservasGrupo'
import { FREE_TOUR_REF } from './freeTourManual'
import { limpiarFreeTourSiYaNoHay } from './freeTourEnDia'
import { ponerParadaEnElDia } from './cambiarParada'
import { isManualRoute } from './manualPlan'
import type { Route, Stop } from './types'

export type ModoQuitar = 'solo' | 'tambien'

/** La reserva (entrada o Free Tour) que lleva esta parada: la que la fija o, en el Free Tour, su reserva. */
export function reservaDeLaParada(stop: Stop, reservations: Reservation[]): Reservation | null {
  const fijada = stop.reservedId ? reservations.find((reserva) => reserva.id === stop.reservedId) : null
  if (fijada) return fijada
  if (stop.isFreeTour) return reservations.find((reserva) => reserva.kind === 'entrada' && reserva.refId === FREE_TOUR_REF && !reserva.fueraDeRuta) ?? null
  return null
}

/** «el jueves 26 a las 8:00» (sin fechas, «el día 2 a las 8:00»). */
export function cuandoEsLaEntrada(route: Route, reserva: Reservation): string {
  const dia = diaDeLaReservaEnPalabras(route, reserva)
  const hora = reserva.time ? ` a las ${horaCorta(reserva.time)}` : ''
  return `${dia ? `el ${dia}` : ''}${hora}`.trim()
}

/** Quita la parada con su entrada, como eligió el viajero. (10N8) Siempre al momento: ni el Free Tour rehace días; sale del día como cualquier parada. */
export async function quitarParadaConEntrada(dayId: string, stop: Stop, reserva: Reservation, modo: ModoQuitar): Promise<void> {
  const nombre = stop.name
  const antes = useRouteStore.getState()
  const manual = antes.route ? isManualRoute(antes.route) : false
  const mensaje = modo === 'solo' ? `Quitada de tu ruta: ${nombre}` : `Quitadas: ${nombre} y su entrada`

  const marcarFuera = () => {
    const parada: Stop = { ...stop, reservedId: null }
    useRouteStore.setState((state) => ({ reservations: state.reservations.map((otra) => (otra.id === reserva.id ? { ...otra, fueraDeRuta: true, paradaQuitada: parada } : otra)) }))
  }
  const quitarReserva = () => {
    useRouteStore.setState((state) => ({ reservations: state.reservations.filter((otra) => otra.id !== reserva.id) }))
    void import('../store/useNoticesStore').then(({ useNoticesStore }) => {
      for (const aviso of useNoticesStore.getState().pushed) if (aviso.id.includes(reserva.id)) useNoticesStore.getState().remove(aviso.id)
    })
  }
  const sacarParada = () => {
    useRouteStore.setState((state) => (state.route ? { route: unpinReservedStops(state.route, reserva.id) } : state))
    useRouteStore.getState().removeStop(dayId, stop.id)
  }

  cambiarConDeshacer(mensaje, () => {
    if (modo === 'solo') marcarFuera()
    sacarParada()
    if (modo === 'tambien') {
      if (manual) useRouteStore.getState().removeReservation(reserva.id)
      else quitarReserva()
    }
    if (stop.isFreeTour) limpiarFreeTourSiYaNoHay()
  })
}

/** Texto de la caja que avisa en RESERVAS: la entrada que se quedó sin parada. */
export const AVISO_FUERA_DE_RUTA = 'Ya no está en tu ruta'

/** Vuelve a poner en su día (el de su fecha) la parada de una entrada que se quedó fuera de la ruta. Con [Deshacer]. Devuelve false si no hay día donde ponerla. (10N8) Donde queda lo dice `dondeQueda` (el Free Tour, de primero por la mañana). */
export async function volverAPonerEnSuDia(reservaId: string, diaId?: string): Promise<boolean> {
  const { route, reservations } = useRouteStore.getState()
  const reserva = reservations.find((otra) => otra.id === reservaId)
  if (!route || !reserva || !reserva.fueraDeRuta) return false
  const dia = (diaId ? route.days.find((d) => d.id === diaId) : null) ?? dayOfReservation(route, reserva)
  if (!dia) return false
  const nombre = reserva.paradaQuitada?.name ?? reserva.name
  const libre = () => useRouteStore.setState((state) => ({ reservations: state.reservations.map((otra) => (otra.id === reservaId ? { ...otra, fueraDeRuta: false, paradaQuitada: null } : otra)) }))
  const hecho = cambiarConDeshacer(`Vuelve a tu ruta: ${nombre}`, () => {
    libre()
    // (Si el sitio ya está en ese día —porque se rehizo el viaje mientras tanto—, no se repite: solo se vuelve a fijar a su hora.)
    const yaEsta = dia.stops.some((parada) => (reserva.paradaQuitada ? parada.name === reserva.paradaQuitada.name : reserva.placeNames.includes(parada.name)))
    if (reserva.paradaQuitada && !yaEsta) ponerParadaEnElDia(dia.id, { ...reserva.paradaQuitada, reservedId: null, time: reserva.time || reserva.paradaQuitada.time })
    const actual = useRouteStore.getState().reservations.find((otra) => otra.id === reservaId)
    if (actual) useRouteStore.setState((state) => (state.route ? { route: placeReservedEntrance(state.route, actual) } : state))
    return true
  })
  if (hecho === false) {
    useRouteStore.setState({ route, reservations })
    useAddFlowStore.setState({ toast: { message: 'No se ha podido volver a ponerla. Prueba otra vez.', previous: null, id: Date.now() } })
    return false
  }
  return true
}
