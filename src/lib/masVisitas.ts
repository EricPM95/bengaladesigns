import type { Coordinates, DayPlan, Route, Stop } from './types'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { esDiaDeLlegada } from './tituloDelDia'

/**
 * «MÁS PARA TU DÍA» EN HOY (Tanda 7, punto 11; de pago). En los días que el motor ha dejado en una versión recortada (la ruta del centro «a buen paso», la rápida y la de tarde del día de llegada, y las mañanas
 * del día de vuelta), HOY enseña el botón [+ Más visitas]: una hoja con las paradas escritas de ese día que la versión recortada dejó en «Si te sobra tiempo», de la más importante a la menos y, a igual
 * importancia, la más cercana primero. Esta pieza decide qué días son esos, qué sale en la lista, en qué orden y dónde entra cada visita (donde menos rodeo hace). Sin React: la prueba la mira tal cual.
 */

/** Los casos de la llegada (`plan.llegada.caso`) en que el día 1 sale recortado. La ruta del centro entera (`ruta_del_centro_entera`), el anochecer y la noche no son recortes: son su propia lista. */
const CASOS_DE_LLEGADA_RECORTADOS = new Set(['rapido', 'de_tarde', 'ruta_del_centro'])

/** El caso sin lo que lleva detrás de un `+` (`rapido+reserva_grande` → `rapido`). */
export const casoBase = (caso: string | null | undefined): string => (caso ?? '').split('+')[0]

/**
 * ¿El día salió en una versión recortada? Lo marca el motor en los planes de la ruta: el día de llegada con la llegada rápida, de tarde o de la ruta del centro a buen paso (`Route.planLlegada.caso`), y el día de vuelta
 * con una mañana (`Route.planVuelta.contenido === 'manana'`: las mañanas cortas y las que dejan lo de después de la comida en «Si te sobra tiempo»).
 */
export function diaRecortado(route: Pick<Route, 'days' | 'arrivalFlightTime' | 'planLlegada' | 'planVuelta'>, day: DayPlan): boolean {
  if (esDiaDeLlegada(route, day) && route.planLlegada && CASOS_DE_LLEGADA_RECORTADOS.has(casoBase(route.planLlegada.caso))) return true
  return day.isReturnLeg === true && route.planVuelta?.contenido === 'manana'
}

/** Cuánto pesa un sitio: 0 imprescindible, 1 nivel 1, 2 nivel 2, 3 nivel 3, 4 lo demás. Sale de los datos de cada destino (`importancia_por_sitio` y el `level` del catálogo); nada escrito para Roma. */
export type Peso = 0 | 1 | 2 | 3 | 4

export interface DatosDeImportancia {
  /** `{ nombre: 'imprescindible' | 'nivel1' }` (`importancia_por_sitio` del destino). */
  importanciaPorSitio: Record<string, 'imprescindible' | 'nivel1'>
  /** El nivel (1, 2, 3) de cada sitio por nombre, del catálogo del destino. */
  nivelPorSitio: Record<string, number | null>
}

export function pesoDe(nombre: string, datos: DatosDeImportancia): Peso {
  const importante = datos.importanciaPorSitio[nombre]
  if (importante === 'imprescindible') return 0
  if (importante === 'nivel1') return 1
  const nivel = datos.nivelPorSitio[nombre]
  return nivel === 2 ? 2 : nivel === 3 ? 3 : nivel === 1 ? 1 : 4
}

export interface MasVisita {
  stop: Stop
  peso: Peso
  /** Metros hasta la parada del día más cercana (null si no se sabe: sin coordenadas). Solo sirve para ordenar; no se enseña. */
  metros: number | null
}

/** Lo que no es una visita que se pueda añadir: la comida, las pausas, un paseo sugerido, una calle por la que se pasa. */
const noEsVisita = (stop: Stop): boolean => Boolean(stop.isBreak || stop.isZoneWalk || stop.isFreeWalk || stop.isFreeTime || stop.passThrough || stop.isArrival)

function metrosAlDia(stop: Stop, paradas: Stop[]): number | null {
  if (!hasRealCoordinates(stop.coordinates)) return null
  let mejor: number | null = null
  for (const otra of paradas) {
    if (!hasRealCoordinates(otra.coordinates)) continue
    const metros = haversineMeters(stop.coordinates, otra.coordinates)
    if (mejor === null || metros < mejor) mejor = metros
  }
  return mejor
}

/**
 * La lista de la hoja «Más para tu día»: lo que hay en «Si te sobra tiempo» del día (el motor ya deja fuera restaurantes y nocturnas), sin lo que el día ya lleva, de la más importante a la menos y, a igual peso, la más
 * cercana a la ruta de hoy primero. Vacía si el día no salió recortado.
 */
export function masVisitasDe(route: Pick<Route, 'days' | 'arrivalFlightTime' | 'planLlegada' | 'planVuelta'>, day: DayPlan, datos: DatosDeImportancia): MasVisita[] {
  if (!diaRecortado(route, day)) return []
  const enElDia = new Set(day.stops.map((stop) => stop.name))
  const candidatas = (day.spareStops ?? []).filter((stop) => !noEsVisita(stop) && !stop.isNightExperience && !enElDia.has(stop.name))
  const lista = candidatas.map((stop) => ({ stop, peso: pesoDe(stop.name, datos), metros: metrosAlDia(stop, day.stops) }))
  return lista.sort((a, b) => a.peso - b.peso || (a.metros ?? Infinity) - (b.metros ?? Infinity) || a.stop.name.localeCompare(b.stop.name))
}

/**
 * Dónde entra una visita en la ruta de hoy para dar el menor rodeo: el hueco (antes de la primera, entre dos o después de la última) en que más poco se alarga el camino. Nunca antes de una parada ya
 * vista (`desde`: el primer hueco posible; lo ya hecho no se toca). Sin coordenadas, al final. Sin quitar ni mover nada.
 */
export function posicionDeMenosRodeo(stops: Stop[], punto: Coordinates | undefined, desde = 0): number {
  const primero = Math.min(Math.max(desde, 0), stops.length)
  if (!hasRealCoordinates(punto)) return stops.length
  const coordenadas = (indice: number): Coordinates | null => {
    const parada = stops[indice]
    return parada && hasRealCoordinates(parada.coordinates) ? parada.coordinates : null
  }
  let mejor = stops.length
  let menor = Infinity
  for (let hueco = primero; hueco <= stops.length; hueco++) {
    const antes = hueco > 0 ? coordenadas(hueco - 1) : null
    const despues = coordenadas(hueco)
    let extra: number
    if (antes && despues) extra = haversineMeters(antes, punto) + haversineMeters(punto, despues) - haversineMeters(antes, despues)
    else if (antes) extra = haversineMeters(antes, punto)
    else if (despues) extra = haversineMeters(punto, despues)
    else extra = 0
    // (A igualdad, el hueco más tardío: lo añadido cae detrás de lo que ya iba.)
    if (extra <= menor) {
      menor = extra
      mejor = hueco
    }
  }
  return mejor
}

/** El primer hueco en que se puede entrar hoy: detrás de la última parada que el viajero ya ha visto o saltado. */
export function primerHuecoLibre(stops: Stop[]): number {
  let ultima = -1
  stops.forEach((stop, indice) => {
    if (stop.checkedInAt || stop.saltada) ultima = indice
  })
  return ultima + 1
}
