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
