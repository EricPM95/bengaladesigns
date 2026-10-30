import type { Route } from './types'
import { puntoCorto, type ArrivalMode, type ArrivalPoint } from './arrivalReturn'
import { cityCode } from '../components/trazo/cityCode'

/**
 * EL BILLETE (Tanda 7, de pago): la tarjeta del vuelo (o del tren, el autobús o el barco) del acordeón del día de llegada y del de vuelta de DÍAS. Esta pieza saca los datos, sin React.
 * Solo las horas que pone el viajero: la de Roma (obligatoria, es la que cuenta para el motor) y, si las puso, el punto del otro lado y la otra hora. Ninguna hora la calcula la app.
 */

export interface DatosBillete {
  kind: 'llegada' | 'vuelta'
  mode: Exclude<ArrivalMode, 'coche'>
  /** Arriba, en pequeño: «LLEGADA · VUELO IB3214», «VUELTA · TREN», «LLEGADA · BARCO». */
  encabezado: string
  /** La hora del lado de Roma (la de llegada a Roma en la ida, la de salida de Roma en la vuelta) y su código («FCO», «TERMINI»). */
  horaRoma: string
  codigoRoma: string
  /** El otro lado, solo si el viajero lo puso: la hora (salida de la ida / llegada de la vuelta) y el código del punto («BCN»). Cada uno puede faltar sin el otro. */
  horaOtra: string | null
  codigoOtro: string | null
}

const PALABRA: Record<Exclude<ArrivalMode, 'coche'>, string> = { avion: 'VUELO', tren: 'TREN', bus: 'AUTOBÚS', ferry: 'BARCO' }

/**
 * El código corto de un punto escrito a mano: lo que va entre paréntesis si parece un código («Barcelona-El Prat (BCN)» → «BCN»); si no, el texto tal cual, en mayúsculas.
 */
export function codigoDeUnPunto(texto: string | null | undefined): string | null {
  const limpio = (texto ?? '').replace(/\s+/g, ' ').trim()
  if (!limpio) return null
  const entreParentesis = limpio.match(/\(([A-Za-z0-9]{2,5})\)\s*$/)
  return (entreParentesis ? entreParentesis[1] : limpio).toUpperCase()
}

/**
 * (10S3) El código del lado de fuera del billete: el que lleve el texto escrito entre paréntesis («Barcelona-El Prat (BCN)» → «BCN»); si no lleva, el código de la ciudad de salida del viaje, el mismo de la primera
 * pantalla («BCN», «MAD»). Nunca el texto largo («BARCELONA-EL PRAT»). Sin ciudad de salida (solo en las pruebas), el texto tal cual, como antes.
 */
export function codigoDelOtroLado(texto: string | null | undefined, ciudadDeSalida: string | null | undefined): string | null {
  const limpio = (texto ?? '').replace(/\s+/g, ' ').trim()
  const entreParentesis = limpio.match(/\(([A-Za-z0-9]{2,5})\)\s*$/)
  if (entreParentesis) return entreParentesis[1].toUpperCase()
  const ciudad = (ciudadDeSalida ?? '').trim()
  if (ciudad) return cityCode({ name: ciudad }) || null
  return codigoDeUnPunto(limpio)
}

/** El código del lado de Roma: el IATA del aeropuerto si lo tiene (FCO); si no, la barra del punto (TERMINI, CIVITAVECCHIA). */
export function codigoDeRoma(point: ArrivalPoint | null): string {
  if (!point) return 'ROMA'
  return (point.codigo ?? point.barra ?? puntoCorto(point)).toUpperCase()
}

/** El billete de una mitad, o null (en coche no hay billete; sin la hora de Roma, tampoco: lo que sale entonces es la barra de siempre). */
export function billeteDe(input: {
  route: Pick<Route, 'arrivalFlightTime' | 'departureFlightTime' | 'arrivalCodigo' | 'departureCodigo' | 'arrivalOtroPunto' | 'arrivalOtraHora' | 'departureOtroPunto' | 'departureOtraHora'> & { origin?: string | null; originPlace?: { name: string } | null }
  kind: 'llegada' | 'vuelta'
  mode: ArrivalMode
  point: ArrivalPoint | null
}): DatosBillete | null {
  const { route, kind, mode, point } = input
  if (mode === 'coche') return null
  const llegada = kind === 'llegada'
  const horaRoma = (llegada ? route.arrivalFlightTime : route.departureFlightTime) || null
  if (!horaRoma) return null
  const codigo = ((llegada ? route.arrivalCodigo : route.departureCodigo) ?? '').replace(/\s+/g, '').toUpperCase()
  const otroPunto = llegada ? route.arrivalOtroPunto : route.departureOtroPunto
  const otraHora = (llegada ? route.arrivalOtraHora : route.departureOtraHora) || null
  return {
    kind,
    mode,
    encabezado: `${llegada ? 'LLEGADA' : 'VUELTA'} · ${PALABRA[mode]}${codigo ? ` ${codigo}` : ''}`,
    horaRoma,
    codigoRoma: codigoDeRoma(point),
    horaOtra: otraHora,
    // (10S3) Con la hora del otro lado puesta y sin nada escrito, también sale el código de la ciudad de salida: «BCN 08:30».
    codigoOtro: (otroPunto ?? '').trim() || otraHora ? codigoDelOtroLado(otroPunto, route.originPlace?.name ?? route.origin) : null,
  }
}
