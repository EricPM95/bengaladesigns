/**
 * Disponibilidad por fechas (Estaciones, Parte 4, 2026-09-25): `available: { from: "MM-DD", to: "MM-DD" }`
 * en lugares, experiencias, nocturnas y excursiones (ambos días incluidos; puede cruzar el año: el
 * mercadillo de Navidad, 12-01 → 01-06). Fuera de esa ventana, no entra en la ruta.
 *
 *   - Con fechas: se aplica directamente, día a día.
 *   - Con solo el mes: el mes entero dentro → entra; entero fuera → no entra (y la experiencia no se
 *     ofrece en el formulario); MES FRONTERA (solo una parte dentro) → entra solo si el viajero lo
 *     eligió y confirmó que viaja en esas fechas. Un lugar de temporada que no eligió no entra solo en
 *     un mes frontera: sigue en "Añadir parada" con la nota de cuándo abre.
 *
 * Módulo puro: lo usan el servidor, el motor y el cliente.
 */

import { withinMonthDays } from './openingHours.js'

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const monthDayOf = (text) => {
  const match = /(\d{2})-(\d{2})$/.exec(String(text ?? '').slice(0, 10))
  return match ? Number(match[1]) * 100 + Number(match[2]) : null
}
const isWindow = (available) => Boolean(available && typeof available.from === 'string' && typeof available.to === 'string')

/** ¿Está disponible ESE día (fecha ISO)? Sin ventana, siempre. */
export function availableOn(available, dateIso) {
  if (!isWindow(available)) return true
  return withinMonthDays(monthDayOf(dateIso), available.from, available.to)
}

/**
 * Cómo cae un mes (0-11) respecto a la ventana: 'in' (entero dentro), 'out' (entero fuera) o
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
 * ¿Entra en la ruta ese día del viaje?
 * @param {{from:string,to:string}|null|undefined} available
 * @param {{ hasDates: boolean, month: number|null }} calendar   (tripCalendar.js)
 * @param {string|null} dateIso   la fecha de ese día (con fechas)
 * @param {boolean} [chosen]      el viajero lo eligió y, en mes frontera, confirmó las fechas
 */
export function availableForTrip(available, calendar, dateIso, chosen = false) {
  if (!isWindow(available)) return true
  if (calendar?.hasDates) return availableOn(available, dateIso)
  const status = monthAvailability(available, calendar?.month)
  return status === 'in' || (status === 'border' && chosen)
}

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** "12-01" → "1 de diciembre". */
export function monthDayLabel(text) {
  const md = monthDayOf(text)
  if (md === null) return String(text ?? '')
  return `${md % 100} de ${MONTH_NAMES[Math.floor(md / 100) - 1]}`
}

/** "Del 1 de diciembre al 6 de enero" — para la nota de "Añadir parada" y la pregunta del formulario. */
export function availabilityLabel(available) {
  if (!isWindow(available)) return null
  return `del ${monthDayLabel(available.from)} al ${monthDayLabel(available.to)}`
}
