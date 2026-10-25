import type { Coordinates, DayPlan, Route, Stop } from './types'
import type { DestinationPlace } from './destinationPlacesApi'
import { hasRealCoordinates } from './distanceMock'
import { fechaDelDia } from './nombreDeDia'
import { hasFullDayExcursion, isFreeDay, timeForStopAfter } from './freeDays'
import { placeHoursOnDate } from './placeHoursOnDate'
import { closedWeekdaysFromSchedule, nextOpenMinutes, parseClosingMinutes } from './stopHoursTag'
import { parseTimeToMinutes } from './time'

/**
 * DÓNDE VA UN SITIO NUEVO EN UN DÍA (Tanda 10O): la app ya no pide la hora, solo el día, y lo coloca donde mejor encaje:
 *   1. entre las paradas de ese día, donde MENOS HAY QUE ANDAR DE MÁS (lo que se añade al camino: ir de la anterior al sitio y del sitio a la siguiente, menos ir de una a otra);
 *   2. mirando por dentro los horarios de ese día (el mismo cálculo de siempre, `placeHoursOnDate`): el sitio no queda en un hueco en que esté cerrado.
 * Si ese día cierra (o no hay hueco en que esté abierto) se dice (`cierra`) y se busca el siguiente día en que sí (`otroDia`); nunca se niega nada: `hueco` es siempre el mejor hueco aunque cierre.
 * Pura (sin React ni almacén): el almacén recibe el índice y la hora la calcula desde la parada de delante (`insertStopAt`).
 */
export interface Hueco {
  /** El índice de `day.stops` en el que entra (0 = la primera). */
  indice: number
  /** Lo que se añade al camino con ese hueco (metros en línea recta; 0 si faltan coordenadas). */
  extraMetros: number
  /** La hora que le toca (la de detrás de la parada anterior, como en el almacén); '' en un día libre. */
  hora: string
  /** ¿Está abierto a esa hora? */
  abierto: boolean
}

export interface Colocacion {
  /** El mejor hueco (el de menos camino de más entre los que están abiertos; si no hay ninguno abierto, el de menos camino de más). */
  hueco: Hueco
  /** Ese día el sitio no se puede ver (cierra el día entero o no hay hueco en que esté abierto). */
  cierra: boolean
}

const RAD = Math.PI / 180
/** Metros en línea recta entre dos puntos. */
export function metros(a: Coordinates | undefined, b: Coordinates | undefined): number {
  if (!a || !b || !hasRealCoordinates(a) || !hasRealCoordinates(b)) return 0
  const dLat = (b.lat - a.lat) * RAD
  const dLng = (b.lng - a.lng) * RAD
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

/** El horario del sitio ese día (con fechas, el de ese día y esa época; sin ellas, el general). `cerrado`: cierra el día entero. */
function horarioDelDia(place: DestinationPlace, dateIso: string | null): { cerrado: boolean; horario: string | null } {
  const onDate = dateIso ? placeHoursOnDate(place.hours_data, dateIso) : null
  const horario = onDate ? onDate.schedule : (place.schedule ?? null)
  const cerrado = onDate ? onDate.closed : dateIso ? closedWeekdaysFromSchedule(horario).includes(new Date(`${dateIso}T00:00:00`).getDay()) : false
  return { cerrado, horario }
}

/** ¿Abre a esa hora y sigue abierto cuando acaba la visita? Sin horario, sí. */
function abiertoA(horario: string | null, inicio: number, minutos: number): boolean {
  if (!horario || Number.isNaN(inicio)) return true
  if (nextOpenMinutes(horario, inicio) !== inicio) return false
  const cierre = parseClosingMinutes(horario)
  return cierre === null || inicio + minutos <= cierre
}

/** El mejor hueco de un sitio en un día (sin tocar nada). `dateIso`: la fecha de ese día (null = el viaje no tiene fechas). */
export function mejorHuecoEnElDia(day: DayPlan, draft: Stop, place: DestinationPlace, dateIso: string | null, minutos: number): Colocacion {
  const stops = day.stops
  // Las experiencias nocturnas van detrás de todo: nada entra entre ellas ni después.
  const primeraNocturna = stops.findIndex((stop) => stop.isNightExperience)
  const limite = primeraNocturna >= 0 ? primeraNocturna : stops.length
  if (isFreeDay(day)) return { hueco: { indice: stops.length, extraMetros: 0, hora: '', abierto: true }, cierra: horarioDelDia(place, dateIso).cerrado }

  const { cerrado, horario } = horarioDelDia(place, dateIso)
  const candidatos: Hueco[] = []
  // Con paradas, el sitio nunca entra el primero: su hora saldría de la nada y se pisaría con la primera (el almacén solo calcula la hora desde la parada de delante).
  for (let indice = stops.length === 0 ? 0 : 1; indice <= limite; indice++) {
    const anterior = stops[indice - 1]
    const siguiente = indice < limite ? stops[indice] : undefined
    const hasta = metros(anterior?.coordinates, draft.coordinates)
    const desde = metros(draft.coordinates, siguiente?.coordinates)
    const directo = metros(anterior?.coordinates, siguiente?.coordinates)
    const extraMetros = Math.max(0, Math.round(hasta + desde - (anterior && siguiente ? directo : 0)))
    const hora = timeForStopAfter(anterior, draft.time || '09:00', draft)
    candidatos.push({ indice, extraMetros, hora, abierto: !cerrado && abiertoA(horario, parseTimeToMinutes(hora), minutos) })
  }
  const porCamino = (a: Hueco, b: Hueco) => a.extraMetros - b.extraMetros || a.indice - b.indice
  const abiertos = candidatos.filter((hueco) => hueco.abierto).sort(porCamino)
  if (abiertos.length > 0) return { hueco: abiertos[0], cierra: false }
  return { hueco: [...candidatos].sort(porCamino)[0], cierra: true }
}

export interface OtroDia {
  day: DayPlan
  dateIso: string | null
}

/**
 * El día más cercano a `day` (primero los de detrás, luego los de delante) en el que el sitio SÍ se puede ver: sin excursión de día entero, sin tenerlo ya, y con un hueco en que esté abierto.
 * Null si no hay ninguno (o el viaje no tiene fechas: sin fechas no se sabe qué día cierra).
 */
export function otroDiaAbierto(route: Route, day: DayPlan, draft: Stop, place: DestinationPlace, minutos: number): OtroDia | null {
  if (!route.answers.dateRange?.start) return null
  const dias = route.days.filter((candidate) => !candidate.isReturnLeg)
  const orden = [...dias.filter((candidate) => candidate.dayNumber > day.dayNumber), ...[...dias.filter((candidate) => candidate.dayNumber < day.dayNumber)].reverse()]
  for (const candidato of orden) {
    if (hasFullDayExcursion(candidato) || candidato.stops.some((stop) => stop.name === place.name)) continue
    const iso = fechaDelDia(route, candidato.dayNumber)
    if (!mejorHuecoEnElDia(candidato, draft, place, iso, minutos).cierra) return { day: candidato, dateIso: iso }
  }
  return null
}
