/**
 * (Tanda 10N8, apartado 3) EL FREE TOUR ES UNA PARADA MÁS, SIN MOVER DÍAS. Antes (10N5) añadirlo o pasarlo de día rehacía días enteros con el motor (el día escrito `D3`, la pareja `D1-FT`…): días en gris sin
 * motivo, «Ningún día encaja», 26 cambios en una propuesta y un Free Tour que decía «quitado» y no se quitaba. Se acabó:
 *   · AÑADIRLO (desde EXPLORAR, su ficha, «+ Añadir parada» o RESERVAS): la hoja de elegir día (`Hoja Dia`) y va DE PRIMERA PARADA, POR LA MAÑANA, de ese día. El resto del día queda como estaba.
 *   · MOVERLO a otro día («···» › «Mover a otro día»): lo mismo, de primero por la mañana del día elegido (`moverParadaAOtroDia`, que lo sabe por `dondeQueda`).
 *   · UNA SOLA VEZ en la ruta (excepción a poder repetir un sitio): si ya está, «✓ En ruta» y sin «+»; se mueve desde su propia parada.
 *   · QUITARLO, como cualquier parada: «Quitar parada», al momento y con [Deshacer] (si tiene reserva, la pregunta de `quitarConEntrada`).
 *   · NUESTRO DÍA ESCRITO CON FREE TOUR (el D3, a las 10:00) se queda como está mientras nadie lo toque.
 * Ningún día se bloquea, salvo el día entero de una excursión («El jueves 12 es el día de tu excursión.»). No toca el motor de rutas.
 */
import type { DayPlan, Route, Stop } from './types'
import { hasFullDayExcursion } from './freeDays'
import { fetchDestinationPlaces } from './destinationPlacesApi'
import { freeTourStopFrom } from './freeTourManual'
import { enrichRoutePhotos } from './placePhoto'
import { ElDia, fechaDelDia } from './nombreDeDia'
import { diaDeSemanaYNumero } from '../../shared/avisos/cambioViaje.js'
import { useRouteStore } from '../store/useRouteStore'
import { useAddFlowStore } from '../store/useAddFlowStore'
import { ponerParadaEnElDia, llevarALaParada } from './cambiarParada'

const delViaje = (route: Route): DayPlan[] => route.days.filter((day) => !day.isReturnLeg)

/** ¿Este viaje ya lleva el Free Tour? Solo cuenta una parada del Free Tour en algún día (las paradas son la verdad; ya no hay nada «pedido» por detrás). */
export function viajeConFreeTour(route: Route): boolean {
  return route.days.some((day) => day.stops.some((stop) => stop.isFreeTour))
}

/** El día (y la parada) donde está el Free Tour, o null. */
export function dondeEstaElFreeTour(route: Route): { dia: DayPlan; parada: Stop } | null {
  for (const dia of route.days) {
    const parada = dia.stops.find((stop) => stop.isFreeTour)
    if (parada) return { dia, parada }
  }
  return null
}

/** «jueves 12» (con fechas) o «día 3». */
export function nombreCortoDelDia(route: Route, dayNumber: number): string {
  return diaDeSemanaYNumero(fechaDelDia(route, dayNumber)) || `día ${dayNumber}`
}

/**
 * Por qué un día no se puede elegir para el Free Tour (null = se puede). Solo el día entero de una excursión: es el día entero y no hay paradas donde ponerlo.
 * Un día con entradas con hora, cosas puestas a mano o un día propio SÍ se puede: el Free Tour solo entra de primero, no mueve nada.
 */
export function bloqueoParaElFreeTour(route: Route, day: DayPlan): string | null {
  return hasFullDayExcursion(day) ? `${ElDia(route, day.dayNumber)} es el día de tu excursión.` : null
}

/** El día que sale marcado al abrir la hoja: el primero que se puede (el primero del viaje o, si se llega tarde ese día, el siguiente). */
export function diaSugeridoParaFreeTour(route: Route): string | null {
  const dias = delViaje(route)
  const llegaTarde = (route.planLlegada?.entrada?.hora ?? '') >= '14:00'
  const candidatos = dias.filter((_day, i) => !(i === 0 && llegaTarde && dias.length > 1))
  const bueno = candidatos.find((day) => !bloqueoParaElFreeTour(route, day))
  return bueno?.id ?? dias.find((day) => !bloqueoParaElFreeTour(route, day))?.id ?? null
}

export type ResultadoFreeTour = { ok: true; dayNumber: number; stopId: string } | { ok: false; texto: string }

/** La parada del Free Tour de este destino (con los datos del catálogo si los hay; sin ellos, una mínima con su nombre), con su foto pedida. */
export async function crearParadaDelFreeTour(route: Route, day: DayPlan): Promise<Stop> {
  const catalogo = await fetchDestinationPlaces(day.city || route.destination).catch(() => null)
  const entrada = catalogo?.freeTourEntry ?? (route.destination !== day.city ? (await fetchDestinationPlaces(route.destination).catch(() => null))?.freeTourEntry ?? null : null)
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const stop = freeTourStopFrom(entrada, { id, name: 'Free Tour', placeNames: [], time: day.stops[0]?.time ?? '10:00' })
  await enrichRoutePhotos({ ...route, days: [{ ...day, stops: [stop] }] }).catch(() => undefined)
  return stop
}

/** El aviso de abajo al añadirlo: «Añadido el Free Tour · jueves 12». */
export const mensajeDeFreeTourAnadido = (route: Route, dayNumber: number): string => `Añadido el Free Tour · ${nombreCortoDelDia(route, dayNumber)}`

/**
 * Pone el Free Tour de primera parada, por la mañana, del día elegido, con el aviso «Añadido el Free Tour · jueves 12» y [Deshacer], y lleva al viajero hasta él. Una sola vez en la ruta.
 * Quien solo recomienda lo hace igual en SU ruta: su propuesta lo cuenta como UN solo cambio, «Añadir el Free Tour al jueves 12» (`cambiosDeLaPropuesta`).
 */
export async function anadirFreeTourEnDia(dayId: string, opciones: { llevar?: boolean } = {}): Promise<ResultadoFreeTour> {
  const { route, reservations } = useRouteStore.getState()
  if (!route) return { ok: false, texto: 'No hay ningún viaje abierto.' }
  const dia = route.days.find((d) => d.id === dayId && !d.isReturnLeg)
  if (!dia) return { ok: false, texto: 'Ese día ya no está en el viaje.' }
  if (viajeConFreeTour(route)) return { ok: false, texto: 'El Free Tour ya está en tu ruta. Se mueve desde su propia parada.' }
  const bloqueo = bloqueoParaElFreeTour(route, dia)
  if (bloqueo) return { ok: false, texto: bloqueo }
  const parada = await crearParadaDelFreeTour(route, dia)
  // (Mientras llegaba el catálogo, el viajero pudo añadirlo por otro lado: una sola vez.)
  const ahora = useRouteStore.getState().route
  if (!ahora || viajeConFreeTour(ahora)) return { ok: false, texto: 'El Free Tour ya está en tu ruta. Se mueve desde su propia parada.' }
  const previous = ahora
  ponerParadaEnElDia(dayId, parada)
  const despues = useRouteStore.getState().route
  const donde = despues?.days.find((d) => d.id === dayId)
  if (!despues || !donde) return { ok: false, texto: 'No se ha podido añadir el Free Tour. Prueba otra vez.' }
  useAddFlowStore.setState({ toast: { message: mensajeDeFreeTourAnadido(despues, donde.dayNumber), previous, previousReservations: reservations, id: Date.now() } })
  if (opciones.llevar !== false) llevarALaParada(dayId, parada.id)
  return { ok: true, dayNumber: donde.dayNumber, stopId: parada.id }
}

/**
 * Tras quitar la parada del Free Tour (o al deshacer su alta), la ruta ya no lo pide: se apaga la experiencia por si venía de nuestro día escrito (D3). Si todavía queda otra parada del Free Tour, nada.
 */
export function limpiarFreeTourSiYaNoHay(): void {
  const { route, setFreeTourChoice } = useRouteStore.getState()
  if (!route || viajeConFreeTour(route)) return
  if ((route.answers.experiencesPositive ?? []).includes('free_tour') || route.answers.freeTourDespues) setFreeTourChoice(null)
}
