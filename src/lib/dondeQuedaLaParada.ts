/**
 * (Tanda 10N8, apartado 3f) DÓNDE QUEDA UNA PARADA QUE LLEGA A UN DÍA (porque se añade un sitio o porque se pasa de otro día). Una sola regla para toda la app:
 *   · el Free Tour, siempre de primero por la mañana (con pase o sin él);
 *   · lo demás, SIN pase: de primero en el día (el viajero lo ve enseguida, sin bajar hasta el final, y desde ahí lo coloca él);
 *   · lo demás, CON pase: donde mejor encaja (donde menos hay que andar de más y con el sitio abierto: `mejorHuecoEnElDia`, la lógica de la 10O).
 * Y una segunda regla: se mueve SOLO la parada, nunca su franja. «Mañana», «Tarde» y «Noche» son del día, no de la parada: la que llega pierde la franja que traía y entra en la que le toque
 * en su sitio nuevo (la de su vecina de delante o, si es la primera, la de la de detrás). Sin esto aparecía un «MAÑANA» suelto en mitad del día.
 */
import type { DayPlan, Stop } from './types'
import { pagoActivo } from './pago'
import { isFreeDay } from './freeDays'
import { fechaDelDia } from './nombreDeDia'
import { indiceDeDestino } from './propuesta'
import type { Route } from './types'

/** Cómo se llama la regla que se aplicó: sirve a las pruebas y a quien quiera saber por qué quedó ahí. */
export type ReglaDeLugar = 'free_tour' | 'primero_sin_pase' | 'mejor_hueco_con_pase' | 'dia_libre'

/**
 * El índice (en `dia.stops`, que NO debe llevar ya la parada) donde entra. `conPase` se puede forzar (las pruebas); por defecto, lo que dice la app ahora mismo (`pagoActivo()`).
 */
export function dondeQueda(route: Route, dia: DayPlan, parada: Stop, opciones: { conPase?: boolean } = {}): { indice: number; regla: ReglaDeLugar } {
  if (parada.isFreeTour) return { indice: 0, regla: 'free_tour' }
  if (isFreeDay(dia)) return { indice: dia.stops.length, regla: 'dia_libre' }
  const conPase = opciones.conPase ?? pagoActivo()
  if (!conPase) return { indice: 0, regla: 'primero_sin_pase' }
  return { indice: indiceDeDestino(dia, parada, undefined, fechaDelDia(route, dia.dayNumber)), regla: 'mejor_hueco_con_pase' }
}

/**
 * La parada, lista para entrar en `dia` en `indice`: sin la franja que traía de otro día. Entra en la de su vecina de delante, o en la de detrás si es la primera; el Free Tour, siempre en «Mañana».
 * (`dia.stops` NO lleva ya la parada.)
 */
export function sinSuFranja(dia: DayPlan, parada: Stop, indice: number): Stop {
  const { franja: _vieja, ...resto } = parada
  void _vieja
  if (parada.isFreeTour) return { ...resto, franja: 'manana' }
  const vecina = dia.stops[indice - 1] ?? dia.stops[indice]
  return vecina?.franja ? { ...resto, franja: vecina.franja } : resto
}
