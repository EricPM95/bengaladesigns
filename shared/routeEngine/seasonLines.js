/**
 * Las líneas de temporada de las fichas (PROMPT_ROMA_NAVIDAD, 3): cuando la ruta YA pasa por un sitio en sus fechas, la
 * ficha de esa parada lleva una línea arriba, destacada («En Navidad, la escalinata tiene su árbol y su belén…»). No se
 * añaden paradas. Los datos viven en el JSON del destino (`navidad_lineas.lineas`):
 *
 *   { id, lugares: [<parada>…], desde: "MM-DD", hasta: "MM-DD", excepto?: ["MM-DD"], texto, fuente, comprobado,
 *     verificar?: true, siguiente_si_ocupada?: [<parada>…], no_si_mercadillo?: true }
 *
 * Reglas:
 *   - una línea por parada como mucho; si hay dos, gana la de la fecha más concreta (la ventana más corta);
 *   - con `verificar`, la línea no sale hasta que el dato esté confirmado ese año;
 *   - `siguiente_si_ocupada`: si su parada ya lleva otra línea, va en la siguiente de esa lista que salga ese día;
 *   - `no_si_mercadillo`: no se repite el día en que la ruta ya cuenta el mercadillo (su parada con título propio o el
 *     texto de fechas del paseo de noche);
 *   - una línea sale una vez por viaje: en el primer día que pasa por su sitio en sus fechas (`skipIds`: las que ya
 *     salieron en un día anterior);
 *   - solo con fechas reales: sin fechas no hay «24 de diciembre».
 */

import { withinMonthDays } from './openingHours.js'

const monthDay = (text) => {
  const match = /(\d{2})-(\d{2})$/.exec(String(text ?? '').slice(0, 10))
  return match ? Number(match[1]) * 100 + Number(match[2]) : null
}
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const dayOfYear = (md) => DAYS_IN_MONTH.slice(0, Math.floor(md / 100) - 1).reduce((sum, days) => sum + days, 0) + (md % 100)
/** Cuántos días abarca la ventana (puede cruzar el año). */
const spanOf = (line) => (dayOfYear(monthDay(line.hasta)) - dayOfYear(monthDay(line.desde)) + 366) % 366

/** Las líneas que valen ese día (en fechas, sin `verificar`), de la más concreta a la menos. */
export function seasonLinesOn(destData, dateIso) {
  if (!dateIso) return []
  const md = monthDay(dateIso)
  return (destData?.navidad_lineas?.lineas ?? [])
    .filter((line) => !line.verificar && line.texto && withinMonthDays(md, line.desde, line.hasta) && !(line.excepto ?? []).some((day) => monthDay(day) === md))
    .sort((a, b) => spanOf(a) - spanOf(b))
}

/**
 * Pone su línea a las paradas del día (`stop.season_line = { text, icon }`). Las nocturnas no llevan: tienen su texto.
 * @param {object} destData
 * @param {{ name: string, is_night_experience?: boolean, date_text?: boolean, display_title?: string }[]} stops
 * @param {string|null} dateIso  la fecha real de ese día (null sin fechas: no hay líneas)
 * @param {Set<string>} [skipIds]  las líneas que ya lleva un día anterior del viaje
 */
export function applySeasonLines(destData, stops, dateIso, skipIds = new Set()) {
  const lines = seasonLinesOn(destData, dateIso).filter((line) => !skipIds.has(line.id))
  if (lines.length === 0) return stops
  const dayStops = stops.filter((stop) => !stop.is_night_experience)
  // El día ya cuenta el mercadillo: la parada con su título propio, o el texto de fechas de la nocturna.
  const marketToday = stops.some((stop) => stop.date_text || /mercadillo/i.test(stop.display_title ?? ''))
  const taken = new Set()
  const put = (stop, line) => {
    stop.season_line = { id: line.id, text: line.texto, icon: line.icono ?? 'navidad' }
    taken.add(stop.name)
  }
  for (const line of lines) {
    if (line.no_si_mercadillo && marketToday) continue
    const own = dayStops.find((stop) => (line.lugares ?? []).includes(stop.name))
    if (!own) continue
    if (!taken.has(own.name)) put(own, line)
    else {
      const next = (line.siguiente_si_ocupada ?? []).map((name) => dayStops.find((stop) => stop.name === name)).find((stop) => stop && !taken.has(stop.name))
      if (next) put(next, line)
    }
  }
  return stops
}
