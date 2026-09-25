/**
 * Cómo planifica un local (PROMPT_MANANAS_Y_TARDES.md, Parte A, 2026-09-25). Reglas generales que usan el
 * reparto improvisado (planTrip) y los bloques de mañana y tarde. Los datos van en el JSON del destino:
 * `museos_de_pago` (cuántos museos de pago caben por viaje) y `redundancias` (museos parecidos).
 *
 * Módulo puro.
 */

/** Una visita grande: más de esto. Como máximo una al día (el pool va aparte). */
export const BIG_VISIT_MINUTES = 90
/** Otra visita de pago por dentro el mismo día, solo si es corta (una iglesia, el Panteón). */
export const SHORT_INSIDE_MINUTES = 45

const requiresTicket = (place) => !(place.is_free_access ?? place.type === 'exterior')

/**
 * Un museo de pago "de más": tag `museo`, con entrada, y que no es joya ni imprescindible (los
 * Capitolinos, la Galería Borghese, el Castillo). Los de nivel 1 no cuentan: van siempre.
 */
export function isPaidMuseum(place) {
  return Boolean(place) && (place.tags ?? []).includes('museo') && requiresTicket(place) && place.level !== 1 && place.tier !== 'joya'
}

/**
 * Cuántos museos de pago de más caben en un viaje de `contentDays` días (`museos_de_pago`): hasta 3
 * días, 0; 4 días, 1; 5-6, 2; 7 o más, 3. Sin dato en el destino, sin tope.
 */
export function paidMuseumQuota(destData, contentDays) {
  const quota = destData?.museos_de_pago
  if (!quota) return Infinity
  if (contentDays <= 3) return quota.hasta_3_dias ?? 0
  if (contentDays === 4) return quota['4_dias'] ?? 1
  if (contentDays <= 6) return quota['5_6_dias'] ?? 2
  return quota['7_dias_o_mas'] ?? 3
}

/**
 * ¿Lo impide un museo parecido que ya está en el viaje (`redundancias`)? Con los Museos Vaticanos en el
 * viaje, los Capitolinos no entran — salvo que el viajero los ponga en su pool, o el viaje sea de 5 días
 * o más con la experiencia que los pide.
 * @param {string} name
 * @param {Set<string>} tripNames   lo que ya está en el viaje
 * @param {{ chosen?: boolean, contentDays?: number, experienceMatches?: boolean }} context
 */
export function blockedByRedundancy(destData, name, tripNames, { chosen = false, contentDays = 0, experienceMatches = false } = {}) {
  const rule = destData?.redundancias?.[name]
  if (!rule || chosen) return false
  if (contentDays >= 5 && experienceMatches) return false
  return tripNames.has(rule.redundant_with)
}

/** Duración de la visita más larga de un conjunto de lugares (una unidad o un bloque). */
export function longestVisit(places) {
  return Math.max(0, ...places.map((place) => place.duration_minutes ?? 30))
}

/**
 * ¿Rompe la regla de "una visita grande al día"? `unitPlaces` es lo que se quiere meter; `dayPlaces`,
 * lo que el día ya tiene (de otras unidades). Una visita grande (más de 90 min) como mucho al día; y
 * junto a ella, otra de pago por dentro solo si dura 45 min o menos. Lo imprescindible (nivel 1) no se
 * mira: va siempre.
 */
export function breaksOneBigVisit(unitPlaces, dayPlaces) {
  const optional = unitPlaces.filter((place) => place.level !== 1)
  if (optional.length === 0) return false
  const big = (place) => (place.duration_minutes ?? 30) > BIG_VISIT_MINUTES
  const paidLong = (place) => requiresTicket(place) && (place.duration_minutes ?? 30) > SHORT_INSIDE_MINUTES
  const dayHasBig = dayPlaces.some(big)
  if (optional.some(big) && dayHasBig) return true
  if (dayHasBig && optional.some(paidLong)) return true
  if (optional.some(big) && dayPlaces.some((place) => place.level !== 1 && paidLong(place))) return true
  return false
}

/** Una calle no es una parada: sale como "Pasas por…" (menos el Foro visto desde la Via dei Fori Imperiali). */
export function isStreet(place) {
  return (place?.tags ?? []).includes('calle') && !place?.passBy
}
/** Lo que dura "pasar por" una calle. */
export const STREET_MINUTES = 10
