/**
 * (Tanda 10N6, apartado 1c) QUITAR UNA PARADA QUE TIENE ENTRADA (o reserva): que no se pierda la entrada.
 * Antes, «Quitar del viaje» borraba también la reserva de RESERVAS (pagada, y con el archivo del QR en la 10T). Ahora el viajero elige:
 *   · «Quitar solo de la ruta»: la parada sale del día y la entrada SE QUEDA en RESERVAS, con la marca `fueraDeRuta` («Ya no está en tu ruta») y la opción de volver a ponerla en su día.
 *   · «Quitar también la entrada»: sale la parada y se borra la reserva (con [Deshacer]).
 * Por defecto nunca se borra la entrada sin que lo elija. Sirve igual para el Free Tour (en una ruta nuestra rehace los días como antes «Quitar el Free Tour»; en una ruta a mano quita su parada).
 * Todo con [Deshacer]: la ruta y todo lo reservado vuelven tal cual estaban.
 */
import type { Reservation } from './bookings'
import { dayOfReservation, unpinReservedStops } from './bookings'
import { cambiarConDeshacer, useAddFlowStore } from '../store/useAddFlowStore'
import { useRouteStore } from '../store/useRouteStore'
import { diaDeLaReservaEnPalabras, horaCorta } from './reservasGrupo'
import { FREE_TOUR_REF } from './freeTourManual'
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

/** Quita la parada con su entrada, como eligió el viajero. Devuelve cuando ha acabado (el Free Tour de una ruta nuestra rehace días). */
export async function quitarParadaConEntrada(dayId: string, stop: Stop, reserva: Reservation, modo: ModoQuitar): Promise<void> {
  const nombre = stop.name
  const antes = useRouteStore.getState()
  const manual = antes.route ? isManualRoute(antes.route) : false
  const esFreeTourNuestro = Boolean(stop.isFreeTour) && !manual
  const mensaje = modo === 'solo' ? `Quitada de tu ruta: ${nombre}` : `Quitadas: ${nombre} y su entrada`
  const previousRoute = antes.route
  const previousReservations = antes.reservations

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

  const resultado = await cambiarConDeshacer(mensaje, async () => {
    if (modo === 'solo') marcarFuera()
    if (esFreeTourNuestro) {
      // Una ruta nuestra: quitar el Free Tour es volver a sus días de siempre (el motor los rehace, sin el Free Tour).
      if (modo === 'tambien') quitarReserva()
      const { aplicarFreeTour } = await import('./rebuildDay')
      return aplicarFreeTour(null)
    }
    sacarParada()
    if (modo === 'tambien') {
      if (manual) useRouteStore.getState().removeReservation(reserva.id)
      else quitarReserva()
    }
    return true
  })
  if (resultado === false) {
    // No se pudo rehacer: todo como estaba.
    useRouteStore.setState({ route: previousRoute, reservations: previousReservations })
    useAddFlowStore.setState({ toast: { message: 'No se ha podido quitar el Free Tour. Prueba otra vez.', previous: null, id: Date.now() } })
  }
}

/** Quitar el Free Tour (sin reserva) de una ruta nuestra: «Quitar parada» sobre su parada. Los días vuelven a los de siempre; con [Deshacer]. */
export async function quitarFreeTourSinReserva(): Promise<void> {
  const antes = useRouteStore.getState()
  const resultado = await cambiarConDeshacer('Free Tour quitado de tu ruta', async () => {
    const { aplicarFreeTour } = await import('./rebuildDay')
    return aplicarFreeTour(null)
  })
  if (resultado === false) {
    useRouteStore.setState({ route: antes.route, reservations: antes.reservations })
    useAddFlowStore.setState({ toast: { message: 'No se ha podido quitar el Free Tour. Prueba otra vez.', previous: null, id: Date.now() } })
  }
}

/** Texto de la caja que avisa en RESERVAS: la entrada que se quedó sin parada. */
export const AVISO_FUERA_DE_RUTA = 'Ya no está en tu ruta'

/** Vuelve a poner en su día (el de su fecha) la parada de una entrada que se quedó fuera de la ruta. Con [Deshacer]. Devuelve false si no hay día donde ponerla. */
export async function volverAPonerEnSuDia(reservaId: string): Promise<boolean> {
  const { route, reservations } = useRouteStore.getState()
  const reserva = reservations.find((otra) => otra.id === reservaId)
  if (!route || !reserva || !reserva.fueraDeRuta) return false
  const dia = dayOfReservation(route, reserva)
  if (!dia) return false
  const nombre = reserva.paradaQuitada?.name ?? reserva.name
  const libre = () => useRouteStore.setState((state) => ({ reservations: state.reservations.map((otra) => (otra.id === reservaId ? { ...otra, fueraDeRuta: false, paradaQuitada: null } : otra)) }))
  const hecho = await cambiarConDeshacer(`Vuelve a tu ruta: ${nombre}`, async () => {
    libre()
    if (reserva.paradaQuitada?.isFreeTour && !isManualRoute(route)) {
      const { ponerFreeTourEnDia } = await import('./freeTourEnDia')
      const r = await ponerFreeTourEnDia(dia.id)
      return r.ok
    }
    // (Si el sitio ya está en ese día —porque se rehizo el viaje mientras tanto—, no se repite: solo se vuelve a fijar a su hora.)
    const yaEsta = dia.stops.some((parada) => (reserva.paradaQuitada ? parada.name === reserva.paradaQuitada.name : reserva.placeNames.includes(parada.name)))
    if (reserva.paradaQuitada && !yaEsta) useRouteStore.getState().addPlaceToDay(dia.id, { ...reserva.paradaQuitada, reservedId: null }, reserva.time || null)
    const actual = useRouteStore.getState().reservations.find((otra) => otra.id === reservaId)
    if (actual) {
      const { placeReservedEntrance } = await import('./bookings')
      useRouteStore.setState((state) => (state.route ? { route: placeReservedEntrance(state.route, actual) } : state))
    }
    return true
  })
  if (hecho === false) {
    useRouteStore.setState({ route, reservations })
    useAddFlowStore.setState({ toast: { message: 'No se ha podido volver a ponerla. Prueba otra vez.', previous: null, id: Date.now() } })
    return false
  }
  return true
}
