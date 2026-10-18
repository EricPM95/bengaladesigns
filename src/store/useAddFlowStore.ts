import { create } from 'zustand'
import type { Route } from '../lib/types'
import type { Reservation } from '../lib/bookings'
import { FREE_TOUR_REF } from '../lib/freeTourManual'
import { useRouteStore } from './useRouteStore'

/**
 * La pantalla de añadir de todo el viaje ("+ Añadir día", "+ Añadir lugares", el "+ Añadir" de Explorar) y el aviso
 * corto de abajo con "Deshacer". No se guarda con el viaje: es estado de pantalla.
 */
interface AddFlowState {
  /** Abierta: el día al que apunta (null = desde Explorar, sin día). */
  addFlow: { dayId: string | null; /** El nombre de un sitio que ya viene puesto (desde la hoja de logros: «Añadir a mi ruta»); la pantalla lo busca en el catálogo y pregunta a qué día. */ lugar?: string } | null
  openAddFlow: (dayId: string | null, lugar?: string) => void
  closeAddFlow: () => void
  /** «Crear mi propio día»: la pantalla de elegir varios sitios para este día (Tanda 6g). */
  ownDayFlow: { dayId: string } | null
  openOwnDayFlow: (dayId: string) => void
  closeOwnDayFlow: () => void
  /** La parada recién añadida: DayDetailPanel se desplaza hasta ella. */
  focusStopId: string | null
  setFocusStopId: (id: string | null) => void
  /** Aviso con "Deshacer": la ruta de antes del cambio. */
  toast: { message: string; previous: Route | null; previousReservations?: Reservation[]; previousBookings?: BookingsSnapshot; id: number; /** Lo que hay que hacer además de devolver la ruta (Tanda 7: cortar el rehacer por un cambio de vuelo que sigue en marcha). */ alDeshacer?: () => void } | null
  dismissToast: () => void
  undo: () => void
}

export const useAddFlowStore = create<AddFlowState>((set, get) => ({
  addFlow: null,
  openAddFlow: (dayId, lugar) => set({ addFlow: { dayId, ...(lugar ? { lugar } : {}) } }),
  closeAddFlow: () => set({ addFlow: null }),
  ownDayFlow: null,
  openOwnDayFlow: (dayId) => set({ ownDayFlow: { dayId } }),
  closeOwnDayFlow: () => set({ ownDayFlow: null }),
  focusStopId: null,
  setFocusStopId: (id) => set({ focusStopId: id }),
  toast: null,
  dismissToast: () => set({ toast: null }),
  undo: () => {
    const previous = get().toast?.previous
    const previousReservations = get().toast?.previousReservations
    const previousBookings = get().toast?.previousBookings
    const alDeshacer = get().toast?.alDeshacer
    // (Tanda 7: «Quitar el vuelo» + «Deshacer» mientras el rehacer sigue en marcha: se corta ANTES de devolver la ruta, o su resultado acabaría encima de lo deshecho.)
    alDeshacer?.()
    // (Con las reservas de antes: si el cambio las borró —la varita—, volver atrás las devuelve. Y, si el aviso es de quitar una reserva de cualquier tipo (`quitarConDeshacer`), TODO lo reservado de antes:
    // entradas, excursiones, alojamiento, billetes, seguro, eSIM, tarjeta y coche, tal cual estaban.)
    if (previous) useRouteStore.setState({ route: previous, ...(previousReservations ? { reservations: previousReservations } : {}), ...(previousBookings ?? {}) })
    set({ toast: null })
  },
}))

/** Hace el cambio y deja el aviso con "Deshacer" (vuelve la ruta tal cual estaba). */
export function withUndo(message: string, change: () => void): void {
  const previous = useRouteStore.getState().route
  const previousReservations = useRouteStore.getState().reservations
  change()
  useAddFlowStore.setState({ toast: { message, previous, previousReservations, id: Date.now() } })
}

/** Todo lo reservado que guarda el viaje, para devolverlo tal cual con «Deshacer». */
export interface BookingsSnapshot {
  reservations: Reservation[]
  transportBookings: ReturnType<typeof useRouteStore.getState>['transportBookings']
  accommodationSelections: ReturnType<typeof useRouteStore.getState>['accommodationSelections']
  insuranceBooking: ReturnType<typeof useRouteStore.getState>['insuranceBooking']
  n26Added: boolean
  rentalVehicleBooking: ReturnType<typeof useRouteStore.getState>['rentalVehicleBooking']
  esimSelections: ReturnType<typeof useRouteStore.getState>['esimSelections']
  esimPrecios: ReturnType<typeof useRouteStore.getState>['esimPrecios']
}

function bookingsNow(): BookingsSnapshot {
  const state = useRouteStore.getState()
  return {
    reservations: state.reservations,
    transportBookings: state.transportBookings,
    accommodationSelections: state.accommodationSelections,
    insuranceBooking: state.insuranceBooking,
    n26Added: state.n26Added,
    rentalVehicleBooking: state.rentalVehicleBooking,
    esimSelections: state.esimSelections,
    esimPrecios: state.esimPrecios,
  }
}

/**
 * LA ÚNICA manera de quitar algo reservado desde la pantalla (Tanda 6y4): una entrada, el Free Tour, una excursión, el alojamiento, un billete de transporte, el vuelo de llegada o de vuelta, el seguro,
 * la eSIM, la tarjeta o el coche de alquiler. Hace el cambio y deja el aviso corto de abajo con «Deshacer», que devuelve la ruta y TODO lo reservado tal cual estaba (precios incluidos).
 * Ningún sitio de la pantalla llama a las funciones de quitar del almacén sin pasar por aquí (lo comprueba `scripts/destino/pruebaFase6y4_reservas.mjs`).
 */
export function quitarConDeshacer(message: string, change: () => void): void {
  cambiarConDeshacer(message, change)
}

/**
 * Hace el cambio (síncrono o no) y deja el aviso con «Deshacer», que devuelve la ruta (días, fechas y vuelta) y TODO lo reservado tal cual estaba. Es la pieza de siempre de `quitarConDeshacer`,
 * para cambios que no quitan reservas (Tanda 6y10: la excursión en un día nuevo o en lugar de un día). Devuelve lo que devuelva el cambio.
 */
export function cambiarConDeshacer<T>(message: string, change: () => T): T {
  const previous = useRouteStore.getState().route
  const previousBookings = bookingsNow()
  const result = change()
  const avisar = () => useAddFlowStore.setState({ toast: { message, previous, previousReservations: previousBookings.reservations, previousBookings, id: Date.now() } })
  // (Un cambio que tarda, como el interruptor del día 4, deja el aviso cuando acaba; la ruta de «antes» se tomó antes de empezar.)
  if (result instanceof Promise) return result.then((hecho) => (avisar(), hecho)) as T
  avisar()
  return result
}

/**
 * Vuelta a Días tras poner una excursión con los días llenos (Tanda 6y10): el aviso ya lo dejó `cambiarConDeshacer` (con su «Deshacer»); aquí solo se cierra la pantalla de añadir y se abre el día.
 */
export function openDayAfterExcursion(dayId: string): void {
  useAddFlowStore.setState({ addFlow: null, focusStopId: null })
  const store = useRouteStore.getState()
  store.setMode('days')
  store.setActiveDayId(dayId)
}

/** El aviso de cada tipo de reserva al quitarla. */
export function mensajeDeQuitar(reservation: Pick<Reservation, 'kind' | 'refId'> | undefined): string {
  if (!reservation) return 'Reserva quitada del viaje'
  if (reservation.kind === 'excursion') return 'Excursión quitada del viaje'
  if (reservation.refId === FREE_TOUR_REF) return 'Free Tour quitado del viaje'
  return 'Entrada quitada del viaje'
}

/**
 * Quita una reserva de entrada o de excursión (con «Deshacer»). Si es el Free Tour de una ruta a mano, también se va su parada del día (Tanda 6y3), y «Deshacer» devuelve la reserva y la parada, tal cual estaban.
 */
export function removeReservationWithUndo(id: string): void {
  const { reservations, removeReservation } = useRouteStore.getState()
  const reservation = reservations.find((item) => item.id === id)
  quitarConDeshacer(mensajeDeQuitar(reservation), () => removeReservation(id))
}
