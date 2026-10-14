import type { Route } from './types'
import type { Reservation } from './bookings'
import { fallbackArrivalInfo, fetchArrivalInfo, medioOf, puntoDeLaMitad, tripModes, type ArrivalInfo, type ArrivalMode } from './arrivalReturn'
import { pagoActivo } from './pago'
import { isManualRoute } from './manualPlan'
import { addDaysToIso } from './dateRange'

/**
 * LO QUE LA APP LE DICE AL MOTOR DE LA LLEGADA Y DE LA VUELTA (Tanda 7, de pago).
 *
 * El viajero pone en RESERVAS la hora de llegada a Roma y la de salida, con su punto y la zona del alojamiento. Aquí se convierte en los dos objetos que lee `engineExtrasFromRequest`
 * (server/index.js): `llegada` y `vuelta`. Todas las llamadas que piden un día al servidor (generar, rehacer, reservar, ajustar en HOY…) los mandan con `datosParaMotor`: si uno de
 * ellos falta, el día 1 o el de vuelta salen sin sus horas y no coinciden con los demás.
 *
 * Solo se manda lo que pone el viajero:
 *  - la gratis (`pagoActivo()` apagado), la ruta a mano, el coche y una mitad sin hora: NO se manda (las horas guardadas no se borran; el motor no las usa);
 *  - una mitad con hora y sin punto (un viaje de antes): el punto del traslado más largo de su medio (`puntoDeLaMitad`, dato del destino);
 *  - ninguna hora calculada: solo la hora del viajero y la de sus reservas.
 * Para los AVISOS de reservas contra el vuelo (`/api/avisos-de-vuelo`), la ruta a mano también los pide (`paraAvisos`): ese endpoint solo devuelve los avisos y nunca cambia ni devuelve ningún día.
 */

export interface LlegadaParaMotor {
  hora: string
  medio: Exclude<ArrivalMode, 'coche'>
  puntoId: string | null
  zona: string | null
  excursionReservada?: { dateIso: string | null; dayNumber: number | null; salida: string; vuelta: string | null; nombre: string }
}

export interface VueltaParaMotor {
  hora: string
  modo: Exclude<ArrivalMode, 'coche'>
  puntoId: string | null
  zona: string | null
  excursion?: { nombre: string; vuelve: string | null; medioDia: boolean; dateIso: string | null; dayNumber: number | null }
}

export interface DatosParaMotor {
  llegada?: LlegadaParaMotor
  vuelta?: VueltaParaMotor
}

const esHora = (hora: string | null | undefined): hora is string => /^\d{1,2}:\d{2}$/.test(hora ?? '')

/** El nombre de una excursión como lo dicen los textos del motor («Pompeya y Sorrento»: «tu excursión a Pompeya y Sorrento»). */
function nombreDeLaExcursion(reserva: Reservation): string {
  const page = reserva.excursionData?.page
  if (page?.nameDestination) return `${page.nameDestination}${page.nameAfter ?? ''}`.trim()
  return reserva.name.replace(/^excursi[oó]n\s+(a|al|a la)\s+/i, '').trim() || reserva.name
}

function esDeEseDia(route: Route, reserva: Reservation, dayNumber: number): boolean {
  const inicio = route.answers.dateRange?.start
  if (reserva.dateIso && inicio) return reserva.dateIso === addDaysToIso(inicio, dayNumber - 1)
  return Number(reserva.dayNumber) === dayNumber
}

/** La excursión reservada para el día 1 (el motor avisa si sale antes de estar libre). */
function excursionDeLaLlegada(route: Route, reservas: Reservation[]): LlegadaParaMotor['excursionReservada'] | undefined {
  const reserva = reservas.find((candidata) => candidata.kind === 'excursion' && !candidata.noMueve && esHora(candidata.time) && esDeEseDia(route, candidata, 1))
  if (!reserva) return undefined
  return { dateIso: reserva.dateIso, dayNumber: reserva.dateIso ? null : reserva.dayNumber, salida: reserva.time, vuelta: esHora(reserva.returnTime) ? reserva.returnTime! : null, nombre: nombreDeLaExcursion(reserva) }
}

/** La excursión reservada el día de vuelta o el último día de ruta (el motor decide cuál de los dos y si vuelve tarde). */
function excursionDeLaVuelta(route: Route, reservas: Reservation[]): VueltaParaMotor['excursion'] | undefined {
  const rutas = route.days.filter((day) => !day.isReturnLeg)
  const ultimo = rutas.at(-1)?.dayNumber ?? route.days.length
  const candidatas = reservas.filter((candidata) => candidata.kind === 'excursion' && !candidata.noMueve && esHora(candidata.time) && (esDeEseDia(route, candidata, ultimo + 1) || esDeEseDia(route, candidata, ultimo)))
  const reserva = candidatas.find((candidata) => esDeEseDia(route, candidata, ultimo + 1)) ?? candidatas[0]
  if (!reserva) return undefined
  return {
    nombre: nombreDeLaExcursion(reserva),
    vuelve: esHora(reserva.returnTime) ? reserva.returnTime! : null,
    medioDia: reserva.excursionData?.page?.halfDay === true,
    dateIso: reserva.dateIso,
    dayNumber: reserva.dateIso ? null : reserva.dayNumber,
  }
}

/**
 * La llegada y la vuelta que se mandan al motor. `paraAvisos`: la ruta a mano también se manda, solo para los avisos de reservas contra el vuelo (el servidor no devuelve ningún día).
 * Devuelve `{}` en la gratis, sin ruta, en la ruta a mano (salvo `paraAvisos`) y en coche; cada mitad sin hora se deja fuera.
 */
export function datosParaMotor(route: Route | null | undefined, reservas: Reservation[], info: ArrivalInfo | null, opciones: { paraAvisos?: boolean } = {}): DatosParaMotor {
  if (!route || !pagoActivo()) return {}
  const aMano = isManualRoute(route)
  if (aMano && !opciones.paraAvisos) return {}
  const modos = tripModes(route)
  const datos = info ?? fallbackArrivalInfo(route.destination, route.origin)
  const zona = route.accommodationZone ?? null
  const salida: DatosParaMotor = {}

  if (modos.arrival !== 'coche' && esHora(route.arrivalFlightTime)) {
    const { point } = puntoDeLaMitad(medioOf(datos, modos.arrival), route.arrivalPointId, true)
    const excursionReservada = excursionDeLaLlegada(route, reservas)
    salida.llegada = {
      hora: route.arrivalFlightTime,
      medio: modos.arrival,
      puntoId: info && point ? point.id : null,
      zona,
      ...(excursionReservada ? { excursionReservada } : {}),
    }
  }
  if (modos.departure !== 'coche' && esHora(route.departureFlightTime)) {
    const { point } = puntoDeLaMitad(medioOf(datos, modos.departure), route.departurePointId, true)
    const excursion = excursionDeLaVuelta(route, reservas)
    salida.vuelta = {
      hora: route.departureFlightTime,
      modo: modos.departure,
      puntoId: info && point ? point.id : null,
      zona,
      ...(excursion ? { excursion } : {}),
    }
  }
  return salida
}

/**
 * Lo de arriba con lo que hay ahora en el estado (import dinámico: el estado no puede cargar este fichero al arrancar). `soloSiRehace`: el generador de rutas lo llama también al crear un viaje
 * nuevo, donde el estado aún puede traer la ruta de otro viaje; solo se manda cuando es el mismo viaje que se rehace (`keepBookingsOnNextRoute`).
 */
export async function llegadaVueltaActuales(opciones: { soloSiRehace?: boolean; paraAvisos?: boolean } = {}): Promise<DatosParaMotor> {
  const { useRouteStore } = await import('../store/useRouteStore')
  const { route, reservations, keepBookingsOnNextRoute } = useRouteStore.getState()
  if (!route || (opciones.soloSiRehace && !keepBookingsOnNextRoute)) return {}
  if (!pagoActivo()) return {}
  const info = await fetchArrivalInfo(route.destination).catch(() => null)
  return datosParaMotor(route, reservations, info, { paraAvisos: opciones.paraAvisos })
}

/** Lo mismo para una ruta y unas reservas que ya se tienen (los sitios que no leen el estado). */
export async function llegadaVueltaDe(route: Route, reservas: Reservation[]): Promise<DatosParaMotor> {
  if (!pagoActivo()) return {}
  const info = await fetchArrivalInfo(route.destination).catch(() => null)
  return datosParaMotor(route, reservas, info)
}
