/**
 * Transporte público en los festivos con servicio recortado (PROMPT_ROMA_NAVIDAD, 1): en Roma, el 24 de diciembre el bus,
 * el tranvía y el metro paran a las 21:00; el 25 solo circulan de 8:30 a 13:00 y de 16:30 a 21:00; el 31 el bus para a las
 * 21:00… Los datos viven en el JSON del destino (`destination_config.transporte_festivos`), con su fuente y su fecha.
 *
 *   transporte_festivos: { fechas: { "12-25": { servicio: ["08:30-13:00", "16:30-21:00"] },
 *                                    "12-31": { bus: ["05:30-21:00"], metro: ["05:30-26:30"] } } }
 *
 * `servicio` vale para todo (bus, tranvía y metro); `bus` y `metro`, para cada uno. Una hora por encima de 24:00 es de la
 * madrugada siguiente ("26:30" = las 2:30). Regla: fuera de esas horas, el tramo va andando o en taxi, nunca en bus ni metro.
 */

import { matchesDateToken } from './openingHours.js'

const toMinutes = (hhmm) => {
  const [hours, minutes] = String(hhmm).split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

/** Las reglas de ese día (null = servicio normal). */
export function holidayTransitRule(destData, dateIso) {
  if (!dateIso) return null
  const dates = destData?.destination_config?.transporte_festivos?.fechas ?? {}
  for (const [token, rule] of Object.entries(dates)) if (matchesDateToken(token, dateIso)) return rule
  return null
}

/** ¿Es transporte público lo que dice el texto ("el bus 115", "el metro A (Spagna → Termini) o un taxi")? Y cuál. */
export function publicTransitKind(how) {
  const text = String(how ?? '')
  if (/metro/i.test(text)) return 'metro'
  if (/\bbus\b|autob[uú]s|tranv/i.test(text)) return 'bus'
  return null
}

/**
 * ¿Circula ese día a esas horas (de `fromMin` a `toMin`, minutos desde las 00:00)? Sin regla para ese día, sí.
 * @param {'bus'|'metro'} kind
 */
export function transitRuns(destData, dateIso, kind, fromMin, toMin = fromMin) {
  const rule = holidayTransitRule(destData, dateIso)
  if (!rule) return true
  const windows = rule[kind] ?? rule.servicio ?? null
  if (!windows) return true
  return windows.some((window) => {
    const [open, close] = String(window).split('-').map(toMinutes)
    return fromMin >= open && toMin <= close
  })
}

/**
 * El transporte de un tramo, corregido para ese día: si lo escrito es bus o metro y a esa hora no circula, en taxi
 * (nunca en bus ni metro). Devuelve `how` tal cual si circula o si ya era un taxi.
 */
export function transitHowOn(destData, dateIso, how, fromMin, minutes = 0) {
  const kind = publicTransitKind(how)
  if (!kind || transitRuns(destData, dateIso, kind, fromMin, fromMin + minutes)) return how
  return 'un taxi'
}

/** ¿Circula algo (bus o metro) ese día a esa hora? Para los textos que dicen "o en bus o taxi". */
export function anyTransitRuns(destData, dateIso, fromMin, toMin = fromMin) {
  return transitRuns(destData, dateIso, 'bus', fromMin, toMin) || transitRuns(destData, dateIso, 'metro', fromMin, toMin)
}
