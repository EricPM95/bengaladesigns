/**
 * Horarios de apertura, leídos del texto libre de `schedule` del JSON del destino.
 *
 * Es la ÚNICA copia del parser en el servidor: server/routeAlgorithm.js la reexporta en vez de
 * tener la suya. Vive aquí porque el motor tiene que poder correr sin Node (Modo Hoy), y el parser
 * es un invariante comprado con bugs (invariante 2: una iglesia con cierre al mediodía "cerraba"
 * a las 12:30 para siempre cuando solo se leía el primer tramo). La copia del cliente
 * (src/lib/stopHoursTag.ts) sigue aparte por el mismo motivo de siempre: TypeScript de Vite.
 */

/**
 * Todos los tramos "HH:MM-HH:MM" del texto, en minutos. Un horario puede traer varios: cierre al
 * mediodía ("09:00-12:30, 14:00-18:00") o temporadas ("08:30-19:15 (verano), 08:30-16:30 (invierno)").
 */
export function parseHoursSessions(schedule) {
  if (typeof schedule !== 'string') return []
  const sessions = []
  for (const match of schedule.matchAll(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g)) {
    const open = Number(match[1]) * 60 + Number(match[2])
    const close = Number(match[3]) * 60 + Number(match[4])
    if (close > open) sessions.push({ open, close })
  }
  return sessions
}

/**
 * La hora a la que se puede entrar de verdad, partiendo de `minutes`: la misma si ya está abierto,
 * la apertura del siguiente tramo si cae en un cierre, `null` si ya no abre más ese día.
 */
export function nextOpenMinutes(schedule, minutes) {
  const sessions = parseHoursSessions(schedule)
  if (sessions.length === 0) return minutes
  if (sessions.some((session) => minutes >= session.open && minutes <= session.close)) return minutes
  const upcoming = sessions.filter((session) => session.open > minutes).map((session) => session.open)
  return upcoming.length > 0 ? Math.min(...upcoming) : null
}

/**
 * La hora de cierre general: la más tardía de todos los tramos. Sirve para saber si un sitio sigue
 * abierto "hoy", NO para saber si una visita concreta cabe — para eso está `closesDuringVisit`.
 */
export function parseClosingMinutes(schedule) {
  const sessions = parseHoursSessions(schedule)
  if (sessions.length > 0) return Math.max(...sessions.map((session) => session.close))
  const matches = typeof schedule === 'string' ? [...schedule.matchAll(/(\d{1,2}):(\d{2})/g)] : []
  if (matches.length < 2) return null
  const [, h, m] = matches[1]
  return Number(h) * 60 + Number(m)
}

/**
 * ¿Una visita de `start` a `end` choca con un cierre? Se mira el tramo en el que EMPIEZA, no el
 * cierre general: una iglesia de 07:30-12:30 y 16:30-20:00 no admite una visita de 12:00 a 12:45
 * aunque "cierre a las 20:00". Con varios tramos que contienen la hora (temporadas), vale el más
 * generoso: el texto no dice qué temporada es, y el motor no adivina fechas.
 */
export function closesDuringVisit(schedule, start, end) {
  const sessions = parseHoursSessions(schedule).filter((session) => start >= session.open && start <= session.close)
  if (sessions.length === 0) return false
  return end > Math.max(...sessions.map((session) => session.close))
}

/**
 * La primera hora, desde `from`, a la que una visita de `duration` minutos cabe ENTERA dentro de un
 * tramo de apertura. Si en el tramo actual no da tiempo antes del cierre, espera al siguiente: una
 * iglesia de 07:30-12:30 y 16:30-20:00 a la que se llega a las 12:00 con 45 min de visita va a las
 * 16:30, no se descarta. `round` se aplica cuando hay que esperar a una apertura (al :00/:30).
 * Sin horario escrito, cualquier hora vale. null si ese día ya no hay tramo donde quepa.
 */
export function earliestVisitStart(schedule, from, duration, round = (minutes) => minutes) {
  const sessions = parseHoursSessions(schedule)
  if (sessions.length === 0) return from
  const fits = sessions
    .map((session) => (from >= session.open ? from : round(session.open)))
    .filter((start, index) => start <= sessions[index].close && start + duration <= sessions[index].close)
  return fits.length > 0 ? Math.min(...fits) : null
}

/**
 * Lo que se supone de un lugar CUBIERTO que no trae horario legible (decisión del 2026-09-23):
 * abierto de 09:00 a 17:00, no todo el día. Sin esto, la Domus Aurea ("Solo Vie-Sáb-Dom, visita
 * guiada con reserva") salía a las 08:00. Los exteriores (plazas, fuentes, calles) no tienen puerta
 * que cerrar y se quedan sin horario, que el motor lee como "siempre": si no, la Fontana de Trevi
 * no podría ir a las 08:00.
 */
export const DEFAULT_INDOOR_SCHEDULE = '09:00-17:00'

export function effectiveSchedule(place) {
  if (parseHoursSessions(place?.schedule).length > 0) return place.schedule
  if (place?.type === 'exterior' || place?.isFreeTour) return place?.schedule ?? null
  return DEFAULT_INDOOR_SCHEDULE
}
