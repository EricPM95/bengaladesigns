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

/**
 * @param {{ weekday?: string|null, season?: string|null }} [hours]  el día del viaje (ver
 *   `scheduleForDay`): con horario estructurado (`windows`/`by_day`/`by_season`) se usa el de ese
 *   día; si no, el `schedule` de siempre.
 */
export function effectiveSchedule(place, hours = {}) {
  const structured = Boolean(place?.windows || place?.by_day || place?.by_season || place?.by_period)
  const text = structured ? scheduleForDay(place, hours ?? {}) : place?.schedule
  if (parseHoursSessions(text).length > 0) return text
  if (structured && text == null) return null // abierto siempre ("00:00-24:00")
  if (place?.type === 'exterior' || place?.isFreeTour) return text ?? null
  return DEFAULT_INDOOR_SCHEDULE
}

const hhmmToMinutes = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim())
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/**
 * Última hora a la que se puede EMPEZAR la visita (`last_entry` del JSON), en minutos, o null si no
 * hay. Formatos (horarios auditados, 2026-09-24):
 *   - "HH:MM".
 *   - Por franja: { manana, tarde } — la de la franja en la que empieza la visita (Catacumbas:
 *     11:45 por la mañana, 16:45 por la tarde).
 *   - Por época: { invierno, primavera, verano, otono } — mientras el motor no sepa la época, la más
 *     PRUDENTE (la más temprana); con `season`, la de esa época.
 */
export function lastEntryMinutes(place, visitStart, seasonOrHours = null) {
  const hours = typeof seasonOrHours === 'object' && seasonOrHours !== null ? seasonOrHours : { season: seasonOrHours }
  const season = hours.season ?? null
  // Con horario por periodo (Estaciones, Parte 2), la última entrada es la de ese periodo (null = no
  // hay), por encima de la de la época.
  const period = periodFor(place, hours.dateIso)
  if (period) return period.last_entry == null ? null : hhmmToMinutes(period.last_entry)
  const raw = place?.last_entry
  if (raw == null) return null
  if (typeof raw === 'string') return hhmmToMinutes(raw)
  if (typeof raw !== 'object') return null
  if ('manana' in raw || 'tarde' in raw) {
    const sessions = parseHoursSessions(effectiveSchedule(place, hours)).sort((a, b) => a.open - b.open)
    const index = sessions.findIndex((session) => visitStart >= session.open && visitStart <= session.close)
    const key = index > 0 ? 'tarde' : 'manana'
    return hhmmToMinutes(raw[key]) ?? hhmmToMinutes(raw.tarde) ?? hhmmToMinutes(raw.manana)
  }
  if (season && raw[season] != null) return hhmmToMinutes(raw[season])
  const values = Object.values(raw).map(hhmmToMinutes).filter((v) => v !== null)
  return values.length > 0 ? Math.min(...values) : null
}

// ── Horario del día: by_day (con fechas), by_season (con época) o lunes a viernes ─────────────
//
// Decisión del 2026-09-24 (horarios auditados):
//   - Con fechas de viaje: el horario EXACTO de ese día de la semana (`by_day`), sin avisos.
//   - Con época (el formulario la pregunta siempre): `by_season` de esa época.
//   - Sin fechas: el horario de LUNES A VIERNES (`by_day`), no la intersección prudente de todos los
//     días (`windows`), que dejaba el Panteón cerrado todas las tardes a partir de las 16:00 por el
//     sábado. Lo que algún otro día esté cerrado a esa hora se avisa en la parada (`hoursWarning`).
//   - Si el lugar no trae nada de eso, `windows` y, si tampoco, el `schedule` de siempre.

const DAY_ABBR = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const DAY_NAME = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const stripAccents = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Índice 0-6 (0 = domingo) de un día escrito ("lunes", "sábado", "mie"). -1 si no se reconoce. */
function dayIndex(text) {
  const abbr = stripAccents(text).slice(0, 3)
  return DAY_ABBR.indexOf(abbr)
}

/** Días (0-6) que cubre una clave de `by_day`: "lun-vie", "sab", "lun,mar,jue", "vie-dom". */
function daysOfKey(key) {
  const days = new Set()
  for (const part of String(key).split(',')) {
    const [from, to] = part.split('-').map((p) => dayIndex(p.trim()))
    if (from < 0) continue
    if (to === undefined || to < 0) {
      days.add(from)
      continue
    }
    // Rango en orden de semana empezando en lunes ("vie-dom" = viernes, sábado, domingo).
    const order = [1, 2, 3, 4, 5, 6, 0]
    const i = order.indexOf(from)
    const j = order.indexOf(to)
    for (let k = i; k <= j; k++) days.add(order[k])
  }
  return days
}

/** Temporada del JSON ("invierno"...) desde la del formulario ("winter"...) o una fecha ISO. */
export function seasonKey(season, dateIso = null) {
  const map = { winter: 'invierno', spring: 'primavera', summer: 'verano', autumn: 'otono', invierno: 'invierno', primavera: 'primavera', verano: 'verano', otono: 'otono', 'otoño': 'otono' }
  if (dateIso) {
    const month = Number(String(dateIso).slice(5, 7))
    if (month >= 1 && month <= 12) return month === 12 || month <= 2 ? 'invierno' : month <= 5 ? 'primavera' : month <= 8 ? 'verano' : 'otono'
  }
  return map[season] ?? null
}

// ── Horarios por periodo (Estaciones, Parte 2, 2026-09-25) ──────────────────────────────────
//
// `by_period`: lista de periodos que cubre el año entero, `from`/`to` en MM-DD (ambos incluidos; un
// periodo puede cruzar el año: 10-25 → 02-29), con sus `windows` y su `last_entry` (o null). Se usa
// con la fecha real del día o, sin fechas, el día 15 del mes (tripCalendar.js).

/** "2026-10-30" o "10-30" → 1030, para comparar fechas del año. */
const monthDayOf = (text) => {
  const match = /(\d{2})-(\d{2})$/.exec(String(text ?? '').slice(0, 10))
  return match ? Number(match[1]) * 100 + Number(match[2]) : null
}

/** ¿Cae el día del año `md` (MMDD) dentro de `from`-`to`, contando los que cruzan el año? */
export function withinMonthDays(md, from, to) {
  const a = monthDayOf(from)
  const b = monthDayOf(to)
  if (md === null || a === null || b === null) return false
  return a <= b ? md >= a && md <= b : md >= a || md <= b
}

/** El periodo de `by_period` que toca en esa fecha (null si el lugar no trae periodos o no hay fecha). */
export function periodFor(place, dateIso) {
  if (!Array.isArray(place?.by_period) || !dateIso) return null
  const md = monthDayOf(dateIso)
  return place.by_period.find((period) => withinMonthDays(md, period.from, period.to)) ?? null
}

/**
 * ¿Cierra el lugar ese día por fecha (`closed_dates`, MM-DD: el 25 de diciembre)? Solo con fechas
 * reales: sin ellas el día 15 del mes es una referencia, no un día del viaje.
 */
export function closedOnDate(place, dateIso) {
  if (!dateIso || !Array.isArray(place?.closed_dates)) return false
  const md = monthDayOf(dateIso)
  return place.closed_dates.some((date) => monthDayOf(date) === md)
}

/**
 * La palabra `sunset` en una franja ("07:00-sunset": parques que cierran al anochecer) pasa a la hora
 * de la puesta de sol de ese día. Sin puesta de sol conocida, las 17:00: lo prudente (la más temprana
 * del año en Europa ronda las 16:30-17:00).
 */
function resolveSunsetWord(windows, sunsetMinutes) {
  if (!windows.some((w) => /sunset/i.test(w))) return windows
  const at = Number.isFinite(sunsetMinutes) ? sunsetMinutes : 17 * 60
  const text = `${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}`
  return windows.map((w) => w.replace(/sunset/gi, text))
}

/** La entrada de `by_day` que se usa sin fechas: la que cubre más días de lunes a viernes. */
function weekdayEntry(byDay) {
  let best = null
  for (const [key, windows] of Object.entries(byDay ?? {})) {
    const covered = [...daysOfKey(key)].filter((d) => d >= 1 && d <= 5).length
    if (covered > 0 && (!best || covered > best.covered)) best = { key, windows, covered }
  }
  return best
}

/**
 * Las franjas de un lugar para un día concreto del viaje.
 * @param {object} place
 * @param {{ weekday?: string|null, season?: string|null }} [hours]  weekday: "lunes"... (con fechas)
 * @returns {string[]|null}  null = el lugar no trae horario estructurado (usar `schedule`)
 */
export function placeWindows(place, hours = {}) {
  const windows = rawWindows(place, hours)
  return windows ? resolveSunsetWord(windows, hours.sunset) : null
}

/**
 * Orden (Estaciones, Parte 2): `by_day` con fechas (el día de la semana real) → `by_period` (la fecha
 * real o el 15 del mes) → `by_season` (reserva de destinos sin periodos) → `by_day` de laborables sin
 * fechas → `windows`. Los cierres (`closed_on`, `closed_dates`) van antes, en el reparto.
 */
function rawWindows(place, hours) {
  const byDay = place?.by_day
  if (hours.weekday && byDay) {
    const day = dayIndex(hours.weekday)
    const entry = Object.entries(byDay).find(([key]) => daysOfKey(key).has(day))
    if (entry) return entry[1]
  }
  const period = periodFor(place, hours.dateIso)
  if (period && Array.isArray(period.windows)) return period.windows
  if (hours.season && place?.by_season?.[hours.season]) return place.by_season[hours.season]
  if (byDay) {
    const entry = weekdayEntry(byDay)
    if (entry) return entry.windows
  }
  return Array.isArray(place?.windows) && place.windows.length > 0 ? place.windows : null
}

/** El horario de ese día como texto que leen el programador y la app ("09:00-12:30, 15:00-18:00"). */
export function scheduleForDay(place, hours = {}) {
  const windows = placeWindows(place, hours)
  if (!windows) return place?.schedule ?? null
  if (windows.every((w) => /^00:00\s*-\s*24:00$/.test(w))) return null
  return windows.join(', ')
}

const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function labelOfKey(key) {
  const days = [...daysOfKey(key)]
  if (days.length === 1) return `el ${DAY_NAME[days[0]]}`
  const parts = String(key).split(',')
  if (parts.length === 1 && key.includes('-')) {
    const [from, to] = key.split('-').map((p) => DAY_NAME[dayIndex(p)])
    return `de ${from} a ${to}`
  }
  const names = days.map((d) => DAY_NAME[d])
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names.at(-1)}` : names[0]
}

/**
 * Aviso para una visita SIN fechas: los días de la semana en que, a esa hora, el lugar está cerrado
 * (misas, cierres de fin de semana) y los días que cierra entero. null si no hay nada que avisar o si
 * el viaje tiene fechas (entonces el horario ya es el real de ese día).
 * Ej.: "Ojo: el domingo de 09:30 a 11:45 no se puede visitar. Cierra los lunes."
 */
export function hoursWarning(place, start, end, hours = {}) {
  if (hours.weekday) return null
  // Los días de la semana en los que, a la hora de la visita, no se puede: con su horario de esos días
  // ("Domingos y festivos, solo de 16:30 a 18:00"). Decisión del 2026-09-25.
  const notes = []
  for (const [key, windows] of Object.entries(place?.by_day ?? {})) {
    const sessions = parseHoursSessions(windows.join(', ')).sort((a, b) => a.open - b.open)
    if (sessions.some((s) => start >= s.open && end <= s.close)) continue
    const spans = sessions.map((s) => `de ${fmt(s.open)} a ${fmt(s.close)}`)
    notes.push(`${pluralLabelOfKey(key)}, solo ${spans.length > 1 ? `${spans.slice(0, -1).join(', ')} y ${spans.at(-1)}` : spans[0]}.`)
  }
  const closed = (Array.isArray(place?.closed_on) ? place.closed_on : []).map((d) => DAY_NAME[dayIndex(d)]).filter(Boolean)
  // En plural: "los lunes", "los domingos".
  const plural = closed.map((day) => (day.endsWith('s') ? day : `${day}s`))
  if (plural.length > 0) notes.push(`Cierra los ${plural.length > 1 ? `${plural.slice(0, -1).join(', ')} y ${plural.at(-1)}` : plural[0]}.`)
  return notes.length > 0 ? notes.join(' ') : null
}

/** "dom" → "Domingos y festivos"; "sab" → "Sábados"; "lun-sab" → "De lunes a sábado"; "lun,mar,jue" → "Lunes, martes y jueves". */
function pluralLabelOfKey(key) {
  const plural = (index) => (index === 0 ? 'domingos y festivos' : index === 6 ? 'sábados' : DAY_NAME[index])
  const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1)
  const days = [...daysOfKey(key)]
  if (days.length === 1) return capital(plural(days[0]))
  const parts = String(key).split(',')
  if (parts.length === 1 && key.includes('-')) {
    const [from, to] = key.split('-').map((p) => DAY_NAME[dayIndex(p)])
    return `De ${from} a ${to}`
  }
  const names = days.map(plural)
  return capital(`${names.slice(0, -1).join(', ')} y ${names.at(-1)}`)
}
