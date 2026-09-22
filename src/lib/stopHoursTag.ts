/**
 * Etiqueta de horario para la ficha de una parada (StopDetailSheet) — azul "Abierto · HH:MM–HH:MM"
 * si la hora actual del dispositivo cae dentro del rango, rojo "Cerrado · abre a las HH:MM" si no,
 * o "Acceso libre" (sin horario fijo, siempre accesible — ej. fuentes/plazas/arcos al aire libre)
 * cuando `hours` es null (BLOQUE B, feedback de calidad: distinguir de un horario real). Distinto de
 * `computeOpenStatusLabel` (todayMode.ts), que da una cuenta atrás ("cierra en 45 min") pensada para
 * Modo Hoy — aquí se muestra el rango completo tal cual, como en la ficha de referencia.
 */

const HOURS_RANGE_RE = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g

export type StopHoursVariant = 'open' | 'closed' | 'always'

export interface StopHoursTag {
  label: string
  variant: StopHoursVariant
}

export interface HoursSession {
  open: number
  close: number
}

function formatMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * TODOS los tramos "HH:MM–HH:MM" que aparecen en el texto de horario, en orden. Un mismo horario
 * puede traer varios por dos motivos distintos, y el texto no siempre los distingue:
 *
 *  - Sesiones del mismo día: "10:00-12:30, 15:00-19:00" (media Roma cierra al mediodía).
 *  - Temporadas o días distintos: "08:30-19:15 (verano), 08:30-16:30 (invierno)".
 *
 * Leerlos todos es lo que permite no equivocarse en los dos sentidos: quedarse con el primero hacía
 * que una iglesia con cierre al mediodía "cerrara" a las 12:30 para siempre (y quedara descartada de
 * cualquier tarde), y mirar solo la apertura del primero daba la hora del lunes en un horario que
 * empieza por el lunes.
 */
export function parseHoursSessions(hours: string | null | undefined): HoursSession[] {
  if (!hours) return []
  const sessions: HoursSession[] = []
  for (const match of hours.matchAll(HOURS_RANGE_RE)) {
    const open = Number(match[1]) * 60 + Number(match[2])
    const close = Number(match[3]) * 60 + Number(match[4])
    if (close > open) sessions.push({ open, close })
  }
  return sessions
}

/** Minuto de apertura más temprano de todos los tramos — null si no hay horario real (acceso libre)
    o el formato no se reconoce. Compartido con stopScheduling.ts para que ninguna parada se programe
    antes de que el lugar abra de verdad. Es el MÁS TEMPRANO y no el del primer tramo del texto: con
    horarios por temporada o por día de la semana, el primero que aparezca escrito no tiene por qué
    ser el que aplica al viaje. */
export function parseOpeningMinutes(hours: string | null | undefined): number | null {
  const sessions = parseHoursSessions(hours)
  return sessions.length > 0 ? Math.min(...sessions.map((session) => session.open)) : null
}

/** Cierre más tardío de todos los tramos — ver `parseOpeningMinutes`. */
export function parseClosingMinutes(hours: string | null | undefined): number | null {
  const sessions = parseHoursSessions(hours)
  return sessions.length > 0 ? Math.max(...sessions.map((session) => session.close)) : null
}

/**
 * La hora a la que se puede entrar de verdad partiendo de `minutes`: la misma si ya está abierto, la
 * apertura del siguiente tramo si cae en un cierre (el del mediodía, sobre todo), o `null` si ya no
 * queda ningún tramo por delante. Sin horario reconocible devuelve `minutes` — no bloquear nada es
 * mejor que adivinar.
 *
 * Es lo que hace que el cierre del mediodía cuente de verdad: San Luigi dei Francesi
 * ("10:00-12:30, 15:00-19:00") está cerrado a las 13:00 aunque su horario "vaya" de 10:00 a 19:00, y
 * el clamp anterior (solo apertura) daba esa hora por buena porque 13:00 > 10:00.
 */
export function nextOpenMinutes(hours: string | null | undefined, minutes: number): number | null {
  const sessions = parseHoursSessions(hours)
  if (sessions.length === 0) return minutes
  if (sessions.some((session) => minutes >= session.open && minutes <= session.close)) return minutes
  const upcoming = sessions.filter((session) => session.open > minutes).map((session) => session.open)
  return upcoming.length > 0 ? Math.min(...upcoming) : null
}

export function computeStopHoursTag(hours: string | null, nowMinutes: number): StopHoursTag {
  const sessions = parseHoursSessions(hours)
  if (sessions.length === 0) return { label: 'Acceso libre', variant: 'always' }

  const current = sessions.find((session) => nowMinutes >= session.open && nowMinutes <= session.close)
  if (current) return { label: `Abierto · ${formatMinutes(current.open)}–${formatMinutes(current.close)}`, variant: 'open' }

  // Cerrado: interesa cuándo vuelve a abrir HOY (el siguiente tramo por delante), y si ya no queda
  // ninguno, la hora de apertura general.
  const next = sessions.filter((session) => session.open > nowMinutes).sort((a, b) => a.open - b.open)[0]
  const reopen = next ? next.open : Math.min(...sessions.map((session) => session.open))
  return { label: `Cerrado · abre a las ${formatMinutes(reopen)}`, variant: 'closed' }
}

// ── Días de cierre ────────────────────────────────────────────

/** Índice de `Date.getDay()` por nombre de día, sin tildes y en singular. */
const WEEKDAY_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
}

/**
 * Qué días de la semana cierra un lugar, según su horario escrito.
 *
 * Solo lee la forma EXPLÍCITA ("Cerrado lunes", "Cerrado domingos", "Cerrado lunes y martes"), que
 * es la que usa el dato curado. No intenta deducir el cierre de un listado positivo ("Lun-Sáb
 * 09:00-14:00"): ahí el rango se puede escribir de diez maneras y una deducción equivocada sale más
 * cara que no avisar, porque el aviso lo lee alguien que ya ha movido el día.
 *
 * Devuelve índices de `Date.getDay()` — 0 es domingo.
 */
export function closedWeekdaysFromSchedule(schedule: string | null | undefined): number[] {
  if (!schedule) return []
  const normalizado = schedule.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const dias = new Set<number>()
  // Cada "cerrado ..." abarca hasta el siguiente punto: así "Cerrado domingos (excepto el último
  // del mes). Mar-Sab 09:00" no se come la frase de al lado.
  for (const match of normalizado.matchAll(/cerrad[oa]s?\s+([^.]*)/g)) {
    // Por palabras sueltas y no por expresión regular montada con el nombre dentro: `\b` dentro de
    // una plantilla de texto es el carácter de retroceso, no un límite de palabra, y la regla se
    // quedaba muda sin dar ningún error (lo destapó probarla contra los horarios reales de Roma).
    const palabras = new Set(match[1].split(/[^a-z]+/).filter(Boolean))
    for (const [nombre, indice] of Object.entries(WEEKDAY_INDEX)) {
      if (palabras.has(nombre) || palabras.has(`${nombre}s`)) dias.add(indice)
    }
  }
  return [...dias].sort()
}

/**
 * "lunes", "sábado"... a partir del índice de `Date.getDay()`, para escribir el aviso.
 * Con tildes: las claves de WEEKDAY_INDEX van sin ellas porque ahí sirven para comparar, no para leer.
 */
const WEEKDAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function weekdayNameEs(index: number): string {
  return WEEKDAY_NAMES_ES[index] ?? ''
}
