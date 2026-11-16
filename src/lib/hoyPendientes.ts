import type { DayPlan, Route, Stop } from './types'
import { numberedStopsOf } from './stopKind'

/**
 * «LUGARES PENDIENTES» Y «NUNCA MANDAR A UN SITIO CERRADO» (Tanda V2, apartados 6 y 9). Lógica pura, sin React, para poder probarla (`pruebaV2Hoy`).
 *
 * Qué es un lugar pendiente (todo se deduce de la ruta; no hay nada nuevo que guardar):
 *   · lo SALTADO hoy (la parada con `saltada`);
 *   · lo que YA HA CERRADO o habrá cerrado al llegar (la parada siguiente no sale como siguiente: pasa sola aquí y sale la siguiente abierta);
 *   · lo que quedó sin ver de los días ANTERIORES (saltado o que no dio tiempo): al acabar el día pasa solo y sigue saliendo los días siguientes hasta que el viajero decide
 *     ([Pasar a otro día], [Recuperar hoy], [Ya lo visité] o [Quitar]: cada una cambia la ruta y la parada deja de estar pendiente).
 * Los días anteriores solo cuentan si ese día se usó la app (alguna parada hecha): un viaje que se hizo sin abrir HOY no llena la lista de todo lo no marcado.
 */
export type MotivoPendiente = 'saltada' | 'cerrada' | 'sin_tiempo'

export interface Pendiente {
  stop: Stop
  dayId: string
  dayNumber: number
  motivo: MotivoPendiente
  /** «Saltada hoy», «Ya ha cerrado», «Saltada el día 2», «No dio tiempo el día 2». */
  texto: string
}

/** Lo que hace falta de un horario (el `HorarioDeParada` de `horarioDeParada.ts`, sin depender de él). */
export interface HorarioMin {
  cerrado: boolean
  tramos: { abre: string; cierra: string }[]
  ultimaEntrada: string | null
}

const aMin = (hora: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora ?? '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** ¿Es una parada a la que se aplica «cerrado»? Solo las que se visitan por dentro y sin hora fija propia (una reserva ya tiene su aviso). */
export function seMiraSiCierra(s: Stop): boolean {
  return !(s.isBreak || s.isArrival || s.isZoneWalk || s.isFreeWalk || s.passThrough || s.isNightExperience || s.isNightView || s.isFreeTour || s.isSunset || s.reservedId || s.reservationTime || s.visitMode === 'fuera')
}

/**
 * ¿Estará cerrado al llegar? `llegadaMin` = ahora + el trayecto hasta allí. Cerrado = ese día no abre, o la llegada cae después del último cierre (o de la última entrada).
 * Entre dos tramos (la pausa de mediodía) o antes de abrir no es «cerrado»: se espera, sin más.
 */
export function cerradoAlLlegar(h: HorarioMin | null, llegadaMin: number): boolean {
  if (!h) return false
  if (h.cerrado) return true
  if (h.tramos.length === 0) return false
  const ultimo = h.tramos[h.tramos.length - 1]
  const cierra = aMin(ultimo.cierra)
  if (cierra == null) return false
  const entrada = aMin(h.ultimaEntrada)
  const limite = entrada != null && entrada <= cierra ? entrada : cierra
  return llegadaMin > limite
}

/**
 * Las paradas por hacer que YA están cerradas (o lo estarán al llegar), en el orden del día. `trayectoMin(stop)` = lo que se tarda en llegar a esa parada desde donde está el viajero.
 * Solo se mira desde la siguiente en adelante, y solo hasta la primera abierta: lo que viene después se mira cuando le toque.
 */
export function cerradasDeHoy(p: { day: DayPlan; horarioDe: (s: Stop) => HorarioMin | null; ahoraMin: number; trayectoMin: (s: Stop) => number }): Set<string> {
  const cerradas = new Set<string>()
  for (const s of numberedStopsOf(p.day)) {
    if (s.saltada || s.checkedInAt) continue
    if (!seMiraSiCierra(s)) return cerradas
    if (cerradoAlLlegar(p.horarioDe(s), p.ahoraMin + p.trayectoMin(s))) cerradas.add(s.id)
    else return cerradas
  }
  return cerradas
}

/** La lista de «Lugares pendientes» de HOY. */
export function lugaresPendientes(p: { route: Route; day: DayPlan; cerradas: Set<string> }): Pendiente[] {
  const { route, day, cerradas } = p
  const salida: Pendiente[] = []
  for (const s of numberedStopsOf(day)) {
    if (s.checkedInAt) continue
    if (s.saltada) salida.push({ stop: s, dayId: day.id, dayNumber: day.dayNumber, motivo: 'saltada', texto: 'Saltada hoy' })
    else if (cerradas.has(s.id)) salida.push({ stop: s, dayId: day.id, dayNumber: day.dayNumber, motivo: 'cerrada', texto: 'Ya ha cerrado' })
  }
  for (const d of route.days) {
    if (d.isReturnLeg || d.id === day.id || d.dayNumber >= day.dayNumber) continue
    const paradas = numberedStopsOf(d)
    if (!paradas.some((s) => s.checkedInAt)) continue
    for (const s of paradas) {
      if (s.checkedInAt) continue
      salida.push(s.saltada ? { stop: s, dayId: d.id, dayNumber: d.dayNumber, motivo: 'saltada', texto: `Saltada el día ${d.dayNumber}` } : { stop: s, dayId: d.id, dayNumber: d.dayNumber, motivo: 'sin_tiempo', texto: `No dio tiempo el día ${d.dayNumber}` })
    }
  }
  return salida
}

/** El aviso de abajo cuando una parada pasa sola a pendientes por cerrada. */
export const avisoDeCerrada = (nombre: string): string => `${nombre} ya ha cerrado · la tienes en Lugares pendientes`
export const AVISO_SALTADA = 'Parada saltada · la tienes en Lugares pendientes'
