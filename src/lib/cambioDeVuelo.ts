import type { DayPlan, Route } from './types'
import type { LegKind } from './reservasLegs'
import { useRouteStore } from '../store/useRouteStore'
import { useAddFlowStore } from '../store/useAddFlowStore'
import { useResumenVueloStore } from '../store/useResumenVueloStore'
import { pagoActivo } from './pago'
import { isManualRoute } from './manualPlan'
import { construirResumen, firmaDeLosDias } from './resumenDeVuelo'

/**
 * EL ENGANCHE `onCambioDeVuelo` (Tanda 7): cada vez que el viajero PONE, CAMBIA o BORRA una hora de Roma, un punto de Roma o la zona del alojamiento en RESERVAS, las pantallas (`LlegadaYVuelta`,
 * `AlojamientoReservas`) llaman a `onCambioDeVuelo(cambio)`. `ReservasPanel` lo recibe como prop opcional y, si no se le pasa otro, usa `rehacerPorCambioDeVuelo`.
 *
 * NO avisan de un cambio: el código del vuelo, la compañía, el precio, las casillas opcionales (el otro punto y la otra hora) ni la dirección del alojamiento; para el motor no cambian nada.
 *
 * LO QUE PASA DESPUÉS (Tanda 7, punto 4 de la conexión):
 *  1. `rehacerPorCambioDeVuelo` rehace los días en segundo plano con el rehacer de siempre (`regenerateRouteForDates`, la barrita «Actualizando tu ruta…» de `ActualizandoRuta`; «gana el último»:
 *     un cambio nuevo cancela el rehacer anterior y la hoja cuenta los dos). Los datos del viajero (`llegada`/`vuelta` con su hora, punto y zona) viajan en cada petición (`llegadaVuelta.ts`).
 *  2. Al acabar (`terminarRehacer`, que llama `RehacerRuta`) los días que el viajero cambió a mano se quedan como estaban, las reservas siguen en su día (el motor las recibe), y sale UNA
 *     sola hoja del resumen (`resumenDeVuelo.ts`) con lo que ha cambiado.
 *  3. Si el cambio fue quitar el vuelo, el aviso «Deshacer» corta el rehacer que siga en marcha (`cortarRehacerPorVuelo`); si ya había acabado, «Deshacer» devuelve la ruta entera de antes.
 * Gratis, ruta a mano, coche o sin hora: no se rehace nada y no sale hoja; las horas guardadas no se borran.
 */
export interface CambioDeVuelo {
  /** Qué ha cambiado: la hora de Roma de la ida o de la vuelta, su punto, la zona del alojamiento, o el vuelo entero quitado. */
  que: 'hora' | 'punto' | 'zona' | 'quitar'
  /** La mitad afectada (`arrival` = llegada, `departure` = vuelta); `null` en la zona. */
  mitad: LegKind | null
}

export type EnCambioDeVuelo = (cambio: CambioDeVuelo) => void

/** ¿Hay un rehacer por un cambio de vuelo en marcha? (el de la generación actual). */
export function rehacerPorVueloEnMarcha(): boolean {
  const { rehaciendoRuta, rehacerGeneracion } = useRouteStore.getState()
  const pendiente = useResumenVueloStore.getState().pendiente
  return rehaciendoRuta && pendiente !== null && pendiente.generacion === rehacerGeneracion
}

/**
 * El rehacer de siempre (`regenerateRouteForDates`: sin Claude, en segundo plano, «gana el último»), puesto en marcha por un cambio de vuelo. Solo de pago, solo en rutas nuestras de un destino
 * curado (la ruta a mano no se rehace nunca: los vuelos solo ponen la barra, el billete y los avisos). Devuelve si se puso en marcha.
 */
export function rehacerPorCambioDeVuelo(cambio: CambioDeVuelo, route?: Route | null): boolean {
  if (!pagoActivo()) return false
  const ruta = route ?? useRouteStore.getState().route
  if (!ruta || isManualRoute(ruta)) return false
  const curado = ruta.days.some((day) => day.timesAreFinal)
  if (!curado) return false
  const estado = useRouteStore.getState()
  // Si ya había uno en marcha, el nuevo lo sustituye y la hoja cuenta los dos cambios.
  const enMarcha = rehacerPorVueloEnMarcha() ? estado.rehacerGeneracion : null
  useResumenVueloStore.getState().iniciar(cambio, estado.rehacerGeneracion + 1, enMarcha)
  estado.regenerateRouteForDates(ruta.answers.dateRange)
  // Quitar el vuelo deja el aviso «Deshacer»: si se pulsa con el rehacer en marcha, se corta (su resultado no debe acabar encima de lo deshecho).
  if (cambio.que === 'quitar') {
    const generacion = useRouteStore.getState().rehacerGeneracion
    useAddFlowStore.setState((state) => (state.toast ? { toast: { ...state.toast, alDeshacer: () => cortarRehacerPorVuelo(generacion) } } : state))
  }
  return true
}

/**
 * Corta el rehacer por un cambio de vuelo que sigue en marcha (si es el de esa generación): la ruta se queda como está y no sale hoja. Lo llama «Deshacer».
 * Si el rehacer ya había acabado no hace falta: «Deshacer» devuelve la ruta entera de antes (días incluidos).
 */
export function cortarRehacerPorVuelo(generacion?: number): void {
  const estado = useRouteStore.getState()
  const pendiente = useResumenVueloStore.getState().pendiente
  if (estado.rehaciendoRuta && pendiente && (generacion === undefined || generacion === estado.rehacerGeneracion)) estado.dejarRutaComoEstaba()
  useResumenVueloStore.getState().limpiarPendiente()
  useResumenVueloStore.getState().cerrar()
}

/**
 * Los días que el viajero cambió a mano (los que guardan su copia original) se quedan como estaban en el rehacer, en su número de día. Devuelve la ruta nueva con ellos puestos y la lista de los
 * que se han dejado (para decirlo en la hoja). Los días libres y los añadidos ya los devuelve `setRoute`.
 */
export function conservarLoCambiadoAMano(nueva: Route, actual: Route | null): { ruta: Route; mantenidos: DayPlan[] } {
  if (!actual) return { ruta: nueva, mantenidos: [] }
  const mios = new Map(actual.days.filter((day) => day.originalSnapshot && !day.userAdded && (day.dayType ?? 'normal') !== 'manual').map((day) => [day.dayNumber, day]))
  if (mios.size === 0) return { ruta: nueva, mantenidos: [] }
  const mantenidos: DayPlan[] = []
  const days = nueva.days.map((day) => {
    const suyo = mios.get(day.dayNumber)
    if (!suyo) return day
    mantenidos.push(suyo)
    return { ...suyo, id: day.id }
  })
  return { ruta: { ...nueva, days }, mantenidos }
}

/**
 * Lo que `RehacerRuta` hace cuando acaba un rehacer: si lo puso en marcha un cambio de vuelo (el pendiente es de esta generación) deja lo del viajero como estaba y enseña la hoja del resumen;
 * si no (las fechas), `setRoute` a secas, como siempre. Devuelve si era un cambio de vuelo.
 */
export function terminarRehacer(nueva: Route, generacion: number): boolean {
  const pendiente = useResumenVueloStore.getState().pendiente
  const store = useRouteStore.getState()
  if (!pendiente || pendiente.generacion !== generacion) {
    store.setRoute(nueva)
    return false
  }
  const actual = store.route
  const { ruta, mantenidos } = conservarLoCambiadoAMano(nueva, actual)
  const firmaAntes = firmaDeLosDias(actual)
  store.setRoute(ruta)
  // (`setRoute` da la ruta por no tocada a mano; lo que el viajero cambió se quedó, así que sigue siéndolo.)
  if (mantenidos.length > 0 || actual?.editedManually) useRouteStore.setState((state) => (state.route ? { route: { ...state.route, editedManually: true } } : state))
  const despues = useRouteStore.getState().route
  useResumenVueloStore.getState().limpiarPendiente()
  if (!despues) return true
  const cambioReal = firmaDeLosDias(despues) !== firmaAntes
  // Un cambio de punto o de zona que no mueve ningún día no merece una hoja (no hay nada que contar).
  const soloPuntoOZona = pendiente.cambios.every((cambio) => cambio.que === 'punto' || cambio.que === 'zona')
  if (soloPuntoOZona && !cambioReal) return true
  useResumenVueloStore.getState().mostrar(construirResumen({ route: despues, cambios: pendiente.cambios, mantenidos }))
  return true
}
