import { addDaysToIso } from './dateRange'
import { numberedStopsOf } from './stopKind'
import type { DayPlan, Route, Stop } from './types'

/**
 * (V59; Design «Cierre del día», H1 a H5) CUÁNDO SALE LA HOJA DE CIERRE. Pura (sin React ni almacén): la usan `HoyDuranteV2` (la hoja) y `MomentosHost` (el resumen del día, que sale DESPUÉS de la hoja).
 *   · H2, «Por hoy ya está»: a las 22:00 o al hacer la última parada (lo que pase antes). Si quedan paradas NOCTURNAS por hacer (Trevi de noche…), espera a que se terminen.
 *   · H3, «Ayer te quedaron N sitios sin ver»: a la mañana siguiente, si la noche anterior no se abrió la hoja.
 * (H1, la de «durante el día», ya la decide `yaNoDaTiempo`, en hoyCambiarPlan.ts.) Cada una sale UNA vez por viaje y día (`avisosUnaVez`, con la clave de abajo). Nunca el día de vuelta. Vale igual en todos los destinos.
 */
export const HORA_DEL_CIERRE_MIN = 22 * 60

/** La clave de `avisosUnaVez` de la hoja de cierre de ese día (H2 o H3: una sola entre las dos). */
export const CLAVE_DEL_CIERRE = 'cierre-del-dia'

const esNocturna = (s: Stop) => Boolean(s.isNightExperience || s.isNightView)

/** Los sitios que se quedaron sin ver ese día: ni hechos ni saltados. Las paradas nocturnas no cuentan («sin ver»): lo suyo es esperar a la noche. */
// (La misma lista que `delDia` de hoyCambiarPlan.ts, escrita aquí para que el anfitrión de los momentos, que va en el paquete de arranque, no arrastre todo ese módulo.)
const NO_ES_VISITA = (s: Stop) => Boolean(s.isBreak || s.isZoneWalk || s.isFreeWalk || s.isFreeTime || s.passThrough || s.isArrival)
const visitasDelDia = (day: DayPlan): Stop[] => numberedStopsOf(day).filter((s) => !s.saltada && !NO_ES_VISITA(s) && !esNocturna(s))
export const sinVerDelDia = (day: DayPlan): Stop[] => visitasDelDia(day).filter((s) => !s.checkedInAt)

/** Las paradas nocturnas que aún se pueden hacer (ni hechas ni saltadas). */
export const nocturnasPorHacer = (day: DayPlan): Stop[] => numberedStopsOf(day).filter((s) => esNocturna(s) && !s.saltada && !s.checkedInAt)

/** ¿Se usó ese día? Al menos una parada hecha o saltada (si no, no hay nada que cerrar). */
export const diaUsado = (day: DayPlan): boolean => numberedStopsOf(day).some((s) => Boolean(s.checkedInAt) || Boolean(s.saltada))

/** ¿Está hecha la ÚLTIMA parada de día (sin contar las nocturnas)? */
export function ultimaParadaHecha(day: DayPlan): boolean {
  const diurnas = numberedStopsOf(day).filter((s) => !esNocturna(s) && !s.saltada)
  return diurnas.length > 0 && Boolean(diurnas[diurnas.length - 1].checkedInAt)
}

/** H2: ¿toca la hoja «Por hoy ya está» en ese día, ahora? (el día es el de hoy). */
export function tocaCierreDeHoy(p: { day: DayPlan; ahoraMin: number }): boolean {
  if (p.day.isReturnLeg) return false
  if (sinVerDelDia(p.day).length === 0) return false
  if (nocturnasPorHacer(p.day).length > 0) return false
  return p.ahoraMin >= HORA_DEL_CIERRE_MIN || ultimaParadaHecha(p.day)
}

/** El día de AYER del viaje (el que se cerraría en H3), con su fecha; null si no hay o no se usó. */
export function diaDeAyer(route: Route, hoyIso: string): { day: DayPlan; iso: string } | null {
  const inicio = route.answers.dateRange?.start
  if (!inicio) return null
  const iso = addDaysToIso(hoyIso, -1)
  const day = route.days.find((d) => addDaysToIso(inicio, d.dayNumber - 1) === iso)
  return day && !day.isReturnLeg && diaUsado(day) ? { day, iso } : null
}
