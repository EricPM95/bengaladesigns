/**
 * Fechas especiales del destino (`fechas_especiales` del JSON, PROMPT_AVISO_FECHAS.md): festivos, eventos y
 * temporadas que se cuentan al viajero, y sus horarios especiales.
 *
 *   { id, fecha: "MM-DD" | "easter" | "easter±N", hasta?: "MM-DD", tipo, icono, titulo, texto,
 *     verificar?: true, horario_especial?: { confirmado, lugares: { <lugar>: { windows, last_entry? } } } }
 */

import { matchesDateRange } from './openingHours.js'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const FIXED = /^(\d{2})-(\d{2})$/

/** ¿Cae la fecha en esa entrada (su día o su rango)? */
export function specialDateMatches(entry, dateIso) {
  return matchesDateRange(entry?.fecha, entry?.hasta, dateIso)
}

/**
 * Sin fechas, solo con el mes (0-11): las entradas de temporada que tocan ese mes y las de fecha fija de ese mes,
 * con su etiqueta ("el 29 de junio", "los días del 24 al 26 de diciembre"). Nunca las móviles (Pascua): sin año
 * no se sabe en qué mes caen.
 */
export function specialDatesOfMonth(entries, month) {
  const out = []
  for (const entry of entries ?? []) {
    const from = FIXED.exec(String(entry.fecha ?? ''))
    if (!from) continue
    const to = FIXED.exec(String(entry.hasta ?? entry.fecha))
    const fromMonth = Number(from[1]) - 1
    const toMonth = Number(to[1]) - 1
    const covers = fromMonth <= toMonth ? month >= fromMonth && month <= toMonth : month >= fromMonth || month <= toMonth
    if (!covers) continue
    if (entry.tipo !== 'temporada' && fromMonth !== month) continue
    const label = entry.hasta && entry.hasta !== entry.fecha
      ? `los días del ${Number(from[2])} al ${Number(to[2])} de ${MONTHS[toMonth]}`
      : `el ${Number(from[2])} de ${MONTHS[fromMonth]}`
    out.push({ entry, label })
  }
  return out
}

/**
 * Los lugares que una fecha especial puede dejar sin mañana (`horario_especial` confirmado o `"probable"`: el
 * Coliseo y el Foro el 2 de junio). El reparto evita ponerlos ese día si puede.
 * @returns {{ fecha: string, hasta: string|null, lugares: string[], confirmado: true|'probable' }[]}
 */
export function specialHoursToAvoid(destData) {
  return (destData?.fechas_especiales?.fechas ?? [])
    .filter((entry) => entry.horario_especial && (entry.horario_especial.confirmado === true || entry.horario_especial.confirmado === 'probable'))
    .map((entry) => ({ fecha: entry.fecha, hasta: entry.hasta ?? null, lugares: Object.keys(entry.horario_especial.lugares ?? {}), confirmado: entry.horario_especial.confirmado }))
}

/**
 * Pone en cada lugar sus horarios especiales confirmados (`special_hours`), para que el programador y la app los
 * lean como un horario más. Solo `confirmado: true`: sin confirmar, el motor sigue con el horario de siempre.
 */
export function attachSpecialHours(destData) {
  const byName = new Map((destData?.places ?? []).map((place) => [place.name, place]))
  for (const entry of destData?.fechas_especiales?.fechas ?? []) {
    const rule = entry.horario_especial
    // Solo `confirmado: true`: con "probable" el horario no se aplica (el reparto solo evita ese día, specialHoursToAvoid).
    if (rule?.confirmado !== true) continue
    for (const [name, hours] of Object.entries(rule.lugares ?? {})) {
      const place = byName.get(name)
      if (!place || !Array.isArray(hours.windows)) continue
      place.special_hours = [...(place.special_hours ?? []), { fecha: entry.fecha, hasta: entry.hasta ?? null, windows: hours.windows, last_entry: hours.last_entry ?? null, id: entry.id }]
    }
  }
  return destData
}
