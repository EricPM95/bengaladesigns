/** Fecha de hoy en formato ISO yyyy-mm-dd, en huso horario local. */
export function todayIso(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

/** Suma `days` días (puede ser negativo) a una fecha ISO yyyy-mm-dd y devuelve otra fecha ISO. */
export function addDaysToIso(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Fecha ISO (yyyy-mm-dd) → Date en huso horario local, sin el desfase de `new Date(iso)` (que la interpreta en UTC). Antes duplicada en DurationSelector.tsx — centralizada aquí en la Ronda 9 al necesitarse también en la cabecera del mapa. */
export function isoToLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/** Date → fecha ISO (yyyy-mm-dd) usando los componentes LOCALES — nunca `.toISOString()`, que desplaza el día según el huso horario. */
export function localDateToIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Número de días de un rango [start, end] ambos inclusive, o null si las fechas no son válidas. */
export function daysBetweenInclusive(startIso: string, endIso: string): number | null {
  const start = new Date(`${startIso}T00:00:00Z`)
  const end = new Date(`${endIso}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  return diffDays > 0 ? diffDays : null
}

const WEEKDAY_ABBR_FORMAT = new Intl.DateTimeFormat('es', { weekday: 'short' })
const MONTH_ABBR_FORMAT = new Intl.DateTimeFormat('es', { month: 'short' })

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** "LUN", "MIÉ", "SÁB"... — para el chip selector de días en la pestaña DIAS. */
export function formatWeekdayAbbrEs(dateIso: string): string {
  return WEEKDAY_ABBR_FORMAT.format(new Date(`${dateIso}T00:00:00`)).replace('.', '').toUpperCase()
}

/** "Mar, 1 Sep" — para la fila de la lista de días en la pestaña DIAS. */
export function formatShortDateEs(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`)
  const weekday = capitalize(WEEKDAY_ABBR_FORMAT.format(date).replace('.', ''))
  const month = capitalize(MONTH_ABBR_FORMAT.format(date).replace('.', ''))
  return `${weekday}, ${date.getDate()} ${month}`
}

/** "01-09 Sep" (mismo mes) o "28 Ago - 03 Sep" (meses distintos) — subtítulo compacto del rango del viaje ("Tu Planificador de Viaje"). */
export function formatCompactDateRangeEs(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T00:00:00`)
  const startDay = String(start.getDate()).padStart(2, '0')
  const endDay = String(end.getDate()).padStart(2, '0')
  const startMonth = capitalize(MONTH_ABBR_FORMAT.format(start).replace('.', ''))
  const endMonth = capitalize(MONTH_ABBR_FORMAT.format(end).replace('.', ''))
  if (startMonth === endMonth) return `${startDay}-${endDay} ${endMonth}`
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`
}

/** "3 sept — 5 sept 2024" — cabecera del mapa (Ronda 9, Mejora 2). Mes en minúsculas (no abreviatura
    en mayúsculas como el resto de formatos de esta pestaña) y el año solo al final, una vez. */
export function formatHeaderDateRangeEs(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T00:00:00`)
  const startMonth = MONTH_ABBR_FORMAT.format(start).replace('.', '')
  const endMonth = MONTH_ABBR_FORMAT.format(end).replace('.', '')
  return `${start.getDate()} ${startMonth} — ${end.getDate()} ${endMonth} ${end.getFullYear()}`
}
