/**
 * El horario de un lugar un día concreto, con el MISMO módulo que el motor (shared/routeEngine/openingHours.js): por
 * época (`by_period`), por día de la semana, días de cierre y fechas cerradas. Lo usa la ventana de "+ Añadir" para
 * avisar "A esa hora está cerrado: abre de 8:30 a 19:15." con el horario de ese día y de esa época.
 */
import { closedOnDay, effectiveSchedule, seasonKey } from '../../shared/routeEngine/openingHours.js'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export interface PlaceHoursOnDate {
  /** Ese día no abre. */
  closed: boolean
  /** Los tramos de ese día ("08:30-19:15"), o null si no hay horario (acceso libre). */
  schedule: string | null
}

export function placeHoursOnDate(hoursData: Record<string, unknown> | null | undefined, dateIso: string): PlaceHoursOnDate | null {
  if (!hoursData || Object.keys(hoursData).length === 0) return null
  const weekday = WEEKDAYS[new Date(`${dateIso}T00:00:00`).getDay()]
  const hours = { weekday, season: seasonKey(null, dateIso), dateIso }
  return { closed: Boolean(closedOnDay(hoursData, weekday, dateIso)), schedule: (effectiveSchedule(hoursData, hours) as string | null) ?? null }
}

/**
 * Lo único que sale en rojo en una parada de un día libre (decisión del usuario, 2026-09-28): "Hoy cierra" y, si el
 * viajero le ha puesto hora, "Cerrado a esa hora". null si no pasa nada (o sin fechas).
 */
export function freeDayStopWarning(stop: { time?: string; durationMinutes: number; hoursData?: Record<string, unknown> | null; scheduleText?: string | null; hours?: string | null }, dateIso: string | null): string | null {
  if (!dateIso) return null
  const onDate = placeHoursOnDate(stop.hoursData ?? (stop.scheduleText || stop.hours ? { schedule: stop.scheduleText ?? stop.hours } : null), dateIso)
  if (!onDate) return null
  if (onDate.closed) return 'Hoy cierra'
  const match = /^(\d{1,2}):(\d{2})$/.exec(stop.time ?? '')
  if (!match || !onDate.schedule) return null
  const start = Number(match[1]) * 60 + Number(match[2])
  const end = start + stop.durationMinutes
  const sessions = [...onDate.schedule.matchAll(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g)].map((m) => ({ open: Number(m[1]) * 60 + Number(m[2]), close: Number(m[3]) * 60 + Number(m[4]) }))
  if (sessions.length === 0) return null
  return sessions.some((session) => start >= session.open && end <= session.close) ? null : 'Cerrado a esa hora'
}
