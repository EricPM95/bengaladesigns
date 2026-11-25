import { cierraElSitio } from './articulos'
import { fechaDelDia, ElDia } from './nombreDeDia'
import { placeHoursOnDate } from './placeHoursOnDate'
import type { Route, Stop } from './types'

/**
 * (V63 §12) Al AÑADIR una parada a un día en que ese sitio cierra, se avisa (igual que al moverla: «Cerrado ese día» en la lista de días), sin obligar a nada.
 * Solo cuenta el cierre del día entero (cierre semanal, fecha cerrada); sin fechas en el viaje no se sabe qué día es y no se avisa. Sin consultas: los datos de horario ya van con la parada.
 */
export function cierraEseDia(route: Route, dayNumber: number, stop: Pick<Stop, 'hoursData' | 'scheduleText' | 'hours'>): boolean {
  const dateIso = fechaDelDia(route, dayNumber)
  if (!dateIso) return false
  const datos = stop.hoursData && Object.keys(stop.hoursData).length > 0 ? stop.hoursData : stop.scheduleText || stop.hours ? { schedule: stop.scheduleText ?? stop.hours } : null
  return Boolean(datos && placeHoursOnDate(datos, dateIso)?.closed)
}

/** «Ojo: el jueves cierra el Coliseo. Lo has añadido igualmente.» */
export const avisoDeCierreAlAnadir = (route: Route, dayNumber: number, nombre: string): string => `Ojo: ${ElDia(route, dayNumber).toLowerCase()} ${cierraElSitio(nombre)}. Lo has añadido igualmente.`
