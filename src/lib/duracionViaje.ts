import type { Route } from './types'

/**
 * CÓMO SE ENSEÑA LA DURACIÓN DE UN VIAJE (Tanda 7, punto 1). Una sola regla, en un solo sitio: siempre los dos, primero los días y después las noches —
 * «{n+1} días · {n} noches» (del 10 al 14 de octubre: «5 días · 4 noches»); con una sola fecha, «1 día». Todo texto visible que cuente los días de un viaje llama a estas funciones.
 *
 * Por dentro no cambia nada: los viajes guardan `days` (= noches + 1) como siempre y la ruta lleva el día de vuelta aparte (invariante 21: `contentDays = días − 1`); aquí solo se cambia cómo se escribe.
 * `dias` es siempre el TOTAL del viaje (el día de vuelta incluido), nunca los días de ruta.
 */

/** «1 noche» / «4 noches». */
export function textoDeNoches(noches: number): string {
  return `${noches} ${noches === 1 ? 'noche' : 'noches'}`
}

/** «1 día» / «5 días». */
export function textoDeDias(dias: number): string {
  return `${dias} ${dias === 1 ? 'día' : 'días'}`
}

/**
 * «5 días · 4 noches»; con un solo día, «1 día». Sin días (0 o menos), vacío.
 * `noches`: solo cuando no son los días menos uno (el tramo de un viaje de varios destinos, que duerme su último día).
 */
export function textoDeDuracion(dias: number, noches: number = dias - 1): string {
  if (!Number.isFinite(dias) || dias < 1) return ''
  return dias === 1 ? textoDeDias(1) : `${textoDeDias(dias)} · ${textoDeNoches(noches)}`
}

/** Los días del viaje entero, el de vuelta incluido: los de la ruta o, si aún no la hay, los que eligió el viajero (`answers.days`). 0 si no se sabe. */
export function diasDelViaje(route: Pick<Route, 'days' | 'answers'>): number {
  return route.days.length || (route.answers?.days ?? 0)
}
