import type { Route } from './types'
import { centerMinutesOf, minutesToHHMM, medioOf, puntoCorto, tripModes, type ArrivalInfo, type ArrivalMode, type ArrivalPoint } from './arrivalReturn'

/**
 * La ida y la vuelta de RESERVAS (de pago, Tanda 6s): para cada mitad, el medio que eligió el viajero en el formulario, su hora, su punto y si está hecha.
 * Se guarda en lo que ya existía (`arrivalFlightTime`, `departureFlightTime`, `arrivalPointId`, `departurePointId`). Ningún punto viene marcado de serie:
 * solo si el medio tiene un único punto (el puerto de Civitavecchia) ese es el punto.
 */
export type LegKind = 'arrival' | 'departure'

export interface LegState {
  kind: LegKind
  mode: ArrivalMode
  time: string | null
  /** Los puntos para elegir (Fiumicino · Ciampino); con uno solo o en coche, sin botones. */
  points: ArrivalPoint[]
  hasButtons: boolean
  /** El punto elegido, o el único que hay; null = sin elegir. */
  point: ArrivalPoint | null
  /** Hecha: en coche siempre; si no, con hora y punto. */
  done: boolean
  dateIso: string | null
  dayNumber: number
  /** «¿Fiumicino o Ciampino?». */
  question: string | null
  /** Solo la ida: «13:15» (la hora en la que ya estás libre en el centro, el mismo cálculo de la barra de DÍAS). */
  freeFrom: string | null
}

const WEEKDAY = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })

/** «mar 10» (con fechas) o «Día 1» (sin fechas). */
export function legDayText(leg: Pick<LegState, 'dateIso' | 'dayNumber'>): string {
  if (!leg.dateIso) return `Día ${leg.dayNumber}`
  const date = new Date(`${leg.dateIso}T12:00:00`)
  return `${WEEKDAY.format(date).replace('.', '').toLowerCase()} ${date.getDate()}`
}

export function legOf(route: Route, info: ArrivalInfo, kind: LegKind): LegState {
  const modes = tripModes(route)
  const mode = kind === 'arrival' ? modes.arrival : modes.departure
  const medio = medioOf(info, mode)
  const points = mode === 'coche' ? [] : (medio?.puntos ?? [])
  const chosenId = kind === 'arrival' ? route.arrivalPointId : route.departurePointId
  const point = points.find((candidate) => candidate.id === chosenId) ?? (points.length === 1 ? points[0] : null)
  const time = (kind === 'arrival' ? route.arrivalFlightTime : route.departureFlightTime) || null
  const done = mode === 'coche' || (Boolean(time) && (points.length === 0 || point !== null))
  const range = route.answers.dateRange
  const dateIso = (kind === 'arrival' ? range?.start : range?.end) ?? null
  const last = [...route.days].reverse().find((day) => !day.isReturnLeg) ?? route.days.at(-1)
  const freeMinutes = kind === 'arrival' && mode !== 'coche' && time && point ? centerMinutesOf(time, point) : null
  return {
    kind,
    mode,
    time,
    points,
    hasButtons: points.length > 1,
    point,
    done,
    dateIso,
    dayNumber: kind === 'arrival' ? 1 : (last?.dayNumber ?? route.days.length),
    question: points.length > 1 ? `¿${points.map(puntoCorto).join(' o ')}?` : null,
    freeFrom: freeMinutes != null ? minutesToHHMM(freeMinutes) : null,
  }
}

/** Las dos mitades. */
export const legsOf = (route: Route, info: ArrivalInfo): { arrival: LegState; departure: LegState } => ({ arrival: legOf(route, info, 'arrival'), departure: legOf(route, info, 'departure') })

const MODE_WORD: Record<ArrivalMode, { noun: string; search: string; searchLabel: string }> = {
  avion: { noun: 'vuelo', search: '¿Aún no tienes vuelo?', searchLabel: 'Buscar vuelos' },
  tren: { noun: 'tren', search: '¿Aún no tienes tren?', searchLabel: 'Buscar tren' },
  bus: { noun: 'autobús', search: '¿Aún no tienes autobús?', searchLabel: 'Buscar autobús' },
  ferry: { noun: 'ferry', search: '¿Aún no tienes ferry?', searchLabel: 'Buscar ferry' },
  coche: { noun: 'viaje en coche', search: '', searchLabel: '' },
}
export const legWord = (mode: ArrivalMode) => MODE_WORD[mode]

/** La línea de cada mitad, cerrada: «Ida · mar 10 · 11:15 · Fiumicino · libre hacia las 13:15». Nunca «null» ni un hueco. */
export function legLine(leg: LegState): string {
  const head = `${leg.kind === 'arrival' ? 'Ida' : 'Vuelta'} · ${legDayText(leg)}`
  if (leg.mode === 'coche') return `${head} · ${leg.kind === 'arrival' ? 'Llegas en coche' : 'Te vas en coche'}`
  if (!leg.done || !leg.time) return head
  const parts = [head, leg.time]
  if (leg.point) parts.push(puntoCorto(leg.point))
  if (leg.freeFrom) parts.push(`libre hacia las ${leg.freeFrom}`)
  return parts.join(' · ')
}

/** La etiqueta de la derecha del bloque. */
export function legsTag(arrival: LegState, departure: LegState): string {
  if (arrival.done && departure.done) return '✓ Listo'
  if (!arrival.done && !departure.done) return 'Falta'
  return arrival.done ? 'Falta la vuelta' : 'Falta la ida'
}
