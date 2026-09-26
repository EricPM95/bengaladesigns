/**
 * Avisos de cerrado (decisión del 2026-09-26): un imprescindible cerrado todos los días posibles del viaje no
 * desaparece; se enseña por fuera y la parada lo dice, con el motivo ("El Coliseo está cerrado el 25 de
 * diciembre por Navidad: te lo enseñamos por fuera, merece la pena igual."). Lo que no se ve por fuera (los
 * Museos Vaticanos) no sale, pero sí su grupo, con su aviso. Las plantillas y los nombres de los festivos viven
 * en el JSON del destino (`destination_config.closed_notices`).
 */

import { closedOnDay, matchesDateToken } from './openingHours.js'
import { placeWithArticle } from './whyTexts.js'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** "25 de diciembre" */
export function dayOfMonth(dateIso) {
  const [, month, day] = String(dateIso).slice(0, 10).split('-').map(Number)
  return `${day} de ${MONTHS[month - 1]}`
}

const weekdayOf = (dateIso) => WEEKDAYS[new Date(`${String(dateIso).slice(0, 10)}T12:00:00Z`).getUTCDay()]

/**
 * Por qué cierra ese día: un festivo (`closed_dates`) o el cierre semanal (`closed_on`). Null si abre.
 * @returns {{ kind: 'festivo', token: string } | { kind: 'semanal', weekday: string } | null}
 */
export function closedReason(place, hours = {}) {
  const dateIso = hours.dateIso ?? null
  if (!closedOnDay(place, hours.weekday ?? null, hours.weekday ? dateIso : null)) return null
  const token = dateIso ? (place.closed_dates ?? []).find((candidate) => matchesDateToken(candidate, dateIso)) : null
  if (token) return { kind: 'festivo', token }
  return { kind: 'semanal', weekday: hours.weekday ?? (dateIso ? weekdayOf(dateIso) : null) }
}

/** "El Coliseo" / "La Basílica" / "Los Museos": con mayúscula, y la concordancia de "está cerrado". */
function agreement(place) {
  const named = placeWithArticle(place)
  const article = (/^(el|la|los|las)\s/i.exec(named)?.[1] ?? 'el').toLowerCase()
  return {
    Lugar: named.charAt(0).toUpperCase() + named.slice(1),
    esta: article === 'los' || article === 'las' ? 'están' : 'está',
    cerrado: { el: 'cerrado', la: 'cerrada', los: 'cerrados', las: 'cerradas' }[article],
  }
}

const fill = (text, values) => String(text).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)

/** El motivo, en palabras: "Navidad", "cierre semanal". */
function reasonText(config, reason) {
  return reason.kind === 'festivo' ? config.festivos?.[reason.token] ?? 'festivo' : config.cierre_semanal ?? 'cierre semanal'
}

/** El aviso de una parada que se enseña por fuera porque ese día está cerrada. Null si no toca. */
export function closedOutsideNotice(destData, place, hours = {}) {
  const config = destData?.destination_config?.closed_notices
  const reason = place ? closedReason(place, hours) : null
  if (!config?.por_fuera || !reason) return null
  const dia = reason.kind === 'festivo' && hours.dateIso ? dayOfMonth(hours.dateIso) : reason.weekday ?? ''
  return fill(config.por_fuera, { ...agreement(place), dia, motivo: reasonText(config, reason) })
}

/**
 * El aviso de lo que cierra todo el viaje y no se ve por fuera (los Museos Vaticanos del 1 y el 2 de mayo),
 * con lo que sí se ve de su grupo ({resto}: "la Plaza de San Pedro y la Basílica de San Pedro").
 * @param {string[]} datesIso  los días del viaje en que cierra
 * @param {object[]} rest      los lugares de su grupo que sí se ven
 */
export function closedAnchorNotice(destData, place, datesIso, rest, joinSpanish) {
  const config = destData?.destination_config?.closed_notices
  if (!config?.sin_visita_por_fuera || !place) return null
  const fechas = joinSpanish(
    datesIso.map((dateIso) => {
      const reason = closedReason(place, { dateIso, weekday: weekdayOf(dateIso) })
      // Entre paréntesis, sin artículo: "(Día del Trabajo)", "(domingo)".
      const why = reason?.kind === 'festivo' ? reasonText(config, reason).replace(/^(el|la|los|las)\s+/i, '') : weekdayOf(dateIso)
      return `el ${dayOfMonth(dateIso)} (${why})`
    }),
  )
  return fill(config.sin_visita_por_fuera, { ...agreement(place), fechas, resto: joinSpanish(rest.map(placeWithArticle)) })
}
