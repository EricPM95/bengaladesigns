/**
 * La ruta a mano por dentro (Tanda 6y, parte C): lo que pasa DENTRO de los días de una ruta que monta el viajero («Quiero hacerla yo»).
 *
 * UNA sola regla, en un solo sitio: `isManualRoute(route)`. Con ella la app NO mete nada sola, NO reordena nada (ni por las reservas ni por los horarios) y NO
 * propone paradas. Todo lo que, en una ruta nuestra, mueve o quita paradas por su cuenta (rehacer un día con el motor al reservar, traer la parada de otro día,
 * ordenar por hora…) pregunta aquí antes de hacerlo. Funciones puras, sin React, y sin importar nada de reservas (para no hacer un círculo con `bookings.ts`, que
 * es quien aplica la regla a las reservas: `placeReservedEntrance`).
 *
 * Quién crea la ruta (formulario y `buildManualRoute`) es otra parte de la 6y; aquí solo se lee `route.planMode`.
 */
import type { DayPlan, Route } from './types'
import type { DestinationPlace } from './destinationPlacesApi'

/** ¿Es una ruta que monta el viajero? (`planMode: 'manual'`). */
export function isManualRoute(route: Pick<Route, 'planMode'> | null | undefined): boolean {
  return route?.planMode === 'manual'
}

/** ¿Es un día propio del viajero en una ruta a mano? (`dayType: 'manual'`). */
export function isManualPlanDay(route: Pick<Route, 'planMode'> | null | undefined, day: Pick<DayPlan, 'dayType'>): boolean {
  return isManualRoute(route) && day.dayType === 'manual'
}

/**
 * El orden de la lista completa del destino en una ruta a mano (EXPLORAR y «Añadir parada»): primero lo que más «me gusta» tiene DE VERDAD (`place_likes`; los números de
 * prueba de `?prueba=1` solo se pintan, nunca ordenan), luego los imprescindibles (la lista a mano del destino, en su orden), luego los de nivel 1 y, al final, el resto.
 * Dentro de cada grupo, el orden de siempre (nivel, orden editorial, alfabético).
 */
export function compareManualExplorer(a: DestinationPlace, b: DestinationPlace, likeCounts: ReadonlyMap<string, number>): number {
  if (Boolean(a.solo_entradas) !== Boolean(b.solo_entradas)) return a.solo_entradas ? -1 : 1
  const likeDiff = (likeCounts.get(b.name) ?? 0) - (likeCounts.get(a.name) ?? 0)
  if (likeDiff !== 0) return likeDiff
  const rankA = a.essential_rank ?? Number.POSITIVE_INFINITY
  const rankB = b.essential_rank ?? Number.POSITIVE_INFINITY
  if (rankA !== rankB) return rankA < rankB ? -1 : 1
  const levelOneDiff = Number(b.level === 1) - Number(a.level === 1)
  if (levelOneDiff !== 0) return levelOneDiff
  const levelDiff = (a.level ?? 9) - (b.level ?? 9)
  if (levelDiff !== 0) return levelDiff
  if (a.order !== undefined && b.order !== undefined) return a.order - b.order
  return a.name.localeCompare(b.name, 'es')
}
