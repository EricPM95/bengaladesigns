/**
 * Disponibilidad por fechas (Estaciones, Parte 4, 2026-09-25): `available: { from: "MM-DD", to: "MM-DD" }`
 * en lugares, experiencias, nocturnas y excursiones (ambos días incluidos; puede cruzar el año: el
 * mercadillo de Navidad, 12-01 → 01-06). Fuera de esa ventana, no entra en la ruta.
 *
 * Sin `aprox`, estricta:
 *   - con fechas, día a día;
 *   - con solo el mes, entra si el mes cae ENTERO dentro. En un mes frontera no entra, salvo un lugar
 *     que el viajero puso en su pool (`chosen`).
 *
 * Con `aprox: true` (mercadillos, fiestas, eventos con fechas que cambian cada año), con aviso en vez
 * de pregunta (revisión del 2026-09-25):
 *   - dentro del rango entra normal;
 *   - hasta 15 días antes o después, entra con el aviso del propio dato (`notice_before`:
 *     "Es probable que algunos mercadillos aún no hayan abierto.", `notice_after`: "…ya hayan cerrado.");
 *   - más lejos, no se ofrece.
 *   Con solo el mes: el mes entero dentro → normal; si toca el rango o está a 15 días o menos → con aviso.
 *
 * Módulo puro: lo usan el servidor, el motor y el cliente (copia en src/lib/seasonalAvailability.ts).
 */

import { withinMonthDays } from './openingHours.js'

/** Días de margen de una ventana aproximada, antes y después. */
export const APROX_MARGIN_DAYS = 15
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const monthDayOf = (text) => {
  const match = /(\d{2})-(\d{2})$/.exec(String(text ?? '').slice(0, 10))
  return match ? Number(match[1]) * 100 + Number(match[2]) : null
}
const isWindow = (available) => Boolean(available && typeof available.from === 'string' && typeof available.to === 'string')

/** Día del año (0-365, año bisiesto) de un MMDD. */
const dayOfYear = (md) => {
  const month = Math.floor(md / 100) - 1
  return DAYS_IN_MONTH.slice(0, month).reduce((sum, days) => sum + days, 0) + (md % 100) - 1
}
/** Días que faltan (hacia delante, dando la vuelta al año) de `a` a `b`. */
const daysForward = (a, b) => (dayOfYear(b) - dayOfYear(a) + 366) % 366

/**
 * Cómo cae un día (MMDD) respecto a la ventana: 'in', 'before' (a 15 días o menos de que empiece),
 * 'after' (a 15 días o menos de que acabe) u 'out'.
 */
function dayStatus(md, available) {
  if (withinMonthDays(md, available.from, available.to)) return 'in'
  const toStart = daysForward(md, monthDayOf(available.from))
  const sinceEnd = daysForward(monthDayOf(available.to), md)
  if (toStart <= APROX_MARGIN_DAYS && toStart <= sinceEnd) return 'before'
  if (sinceEnd <= APROX_MARGIN_DAYS) return 'after'
  return 'out'
}

/** ¿Está disponible ESE día (fecha ISO), sin margen? Sin ventana, siempre. */
export function availableOn(available, dateIso) {
  if (!isWindow(available)) return true
  return withinMonthDays(monthDayOf(dateIso), available.from, available.to)
}

/**
 * Cómo cae un mes (0-11) respecto a la ventana, sin margen: 'in' (entero dentro), 'out' (entero fuera) o
 * 'border' (una parte). Sin ventana, 'in'. Febrero cuenta con 29 días: la ventana es de calendario.
 */
export function monthAvailability(available, month) {
  if (!isWindow(available) || !Number.isInteger(month)) return 'in'
  let inside = 0
  const days = DAYS_IN_MONTH[month]
  for (let day = 1; day <= days; day++) {
    if (withinMonthDays((month + 1) * 100 + day, available.from, available.to)) inside++
  }
  return inside === days ? 'in' : inside === 0 ? 'out' : 'border'
}

/**
 * ¿Entra en la ruta, y con qué aviso?
 * @param {{from:string,to:string,aprox?:boolean,notice_before?:string,notice_after?:string}|null|undefined} available
 * @param {{ hasDates: boolean, month: number|null }} calendar   (tripCalendar.js)
 * @param {string|null} dateIso   la fecha de ese día (con fechas)
 * @param {boolean} [chosen]      el viajero lo puso en su pool (solo cuenta sin `aprox`, en mes frontera)
 * @returns {{ enters: boolean, notice: string|null }}
 */
export function seasonFit(available, calendar, dateIso, chosen = false) {
  if (!isWindow(available)) return { enters: true, notice: null }
  const noticeFor = (side) => (side === 'before' ? available.notice_before : available.notice_after) ?? null
  if (calendar?.hasDates) {
    const status = dayStatus(monthDayOf(dateIso), available)
    if (status === 'in') return { enters: true, notice: null }
    if (available.aprox && status !== 'out') return { enters: true, notice: noticeFor(status) }
    return { enters: false, notice: null }
  }
  const month = calendar?.month
  const whole = monthAvailability(available, month)
  if (whole === 'in') return { enters: true, notice: null }
  if (available.aprox) {
    // Algún día del mes dentro del rango o a 15 días o menos: entra con aviso (del lado que toque).
    const statuses = Array.from({ length: DAYS_IN_MONTH[month] ?? 0 }, (_, i) => dayStatus((month + 1) * 100 + i + 1, available))
    if (statuses.every((status) => status === 'out')) return { enters: false, notice: null }
    const side = statuses.find((status) => status === 'before' || status === 'after') ?? (statuses[0] === 'in' ? 'after' : 'before')
    return { enters: true, notice: noticeFor(side) }
  }
  return { enters: whole === 'border' && chosen, notice: null }
}

/** ¿Entra en la ruta ese día del viaje? (seasonFit sin el aviso) */
export function availableForTrip(available, calendar, dateIso, chosen = false) {
  return seasonFit(available, calendar, dateIso, chosen).enters
}

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** "12-01" → "1 de diciembre". */
export function monthDayLabel(text) {
  const md = monthDayOf(text)
  if (md === null) return String(text ?? '')
  return `${md % 100} de ${MONTH_NAMES[Math.floor(md / 100) - 1]}`
}

/** "del 1 de diciembre al 6 de enero" — para la nota de "Añadir parada". */
export function availabilityLabel(available) {
  if (!isWindow(available)) return null
  return `del ${monthDayLabel(available.from)} al ${monthDayLabel(available.to)}${available.aprox ? ' (aproximadamente)' : ''}`
}
