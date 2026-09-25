/**
 * El calendario del viaje (Estaciones, Parte 1, 2026-09-25): el motor SIEMPRE conoce la fecha o, como
 * mínimo, el mes. Recibe una de estas dos cosas:
 *   - fechas exactas (`dateRangeStartIso`): cada día usa su fecha real y su día de la semana;
 *   - número de días + mes (`month`, 0-11): todos los días usan el DÍA 15 de ese mes para horarios y
 *     puesta de sol, sin día de la semana (horario de laborables + aviso en la parada).
 * La temporada ya no es una entrada: se deduce del mes y solo sirve para mostrarla y como reserva
 * (`by_season`) en destinos sin horarios por periodo.
 *
 * Compatibilidad: un viaje antiguo que solo trae temporada pasa a su mes central (primavera → abril,
 * verano → julio, otoño → octubre, invierno → enero).
 *
 * Módulo puro: lo usan el servidor, el motor y el cliente.
 */

/** Mes central (0-11) de cada temporada, para los viajes antiguos que solo tienen temporada. */
export const CENTRAL_MONTH = { winter: 0, spring: 3, summer: 6, autumn: 9, invierno: 0, primavera: 3, verano: 6, otono: 9, 'otoño': 9 }

/** Temporada del JSON ("invierno"...) de un mes 0-11 (hemisferio norte: dic-feb invierno). */
export function seasonOfMonth(month) {
  if (!Number.isInteger(month) || month < 0 || month > 11) return null
  if (month === 11 || month <= 1) return 'invierno'
  if (month <= 4) return 'primavera'
  if (month <= 7) return 'verano'
  return 'otono'
}

/**
 * El año del mes elegido sin fechas: la próxima vez que llega ese mes (el actual cuenta).
 * `today` se puede fijar para que las pruebas no dependan del reloj.
 */
export function yearForMonth(month, today = new Date()) {
  const current = today.getUTCMonth()
  return month >= current ? today.getUTCFullYear() : today.getUTCFullYear() + 1
}

const pad = (n) => String(n).padStart(2, '0')

/**
 * @param {object} args
 * @param {string|null} [args.dateRangeStartIso]  primer día del viaje (YYYY-MM-DD), si hay fechas
 * @param {number|null} [args.month]              mes 0-11, si no hay fechas
 * @param {string|null} [args.season]             SOLO compatibilidad (viajes antiguos): su mes central
 * @param {Date} [args.today]
 * @returns {{ hasDates: boolean, month: number|null, season: string|null, referenceIso: string|null, dateOfDay: (dayNumber: number) => string|null }}
 *   `dateOfDay`: la fecha real de ese día (con fechas) o el día 15 del mes (sin fechas). null si no se
 *   sabe nada (no debería pasar: el formulario exige el mes).
 */
export function tripCalendar({ dateRangeStartIso = null, month = null, season = null, today = new Date() } = {}) {
  const start = typeof dateRangeStartIso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateRangeStartIso) ? dateRangeStartIso.slice(0, 10) : null
  if (start) {
    const startMs = Date.parse(`${start}T12:00:00Z`)
    const startMonth = Number(start.slice(5, 7)) - 1
    return {
      hasDates: true,
      month: startMonth,
      season: seasonOfMonth(startMonth),
      referenceIso: start,
      dateOfDay: (dayNumber) => new Date(startMs + (dayNumber - 1) * 86400000).toISOString().slice(0, 10),
    }
  }
  const resolvedMonth = Number.isInteger(month) && month >= 0 && month <= 11 ? month : (CENTRAL_MONTH[season] ?? null)
  if (resolvedMonth === null) return { hasDates: false, month: null, season: null, referenceIso: null, dateOfDay: () => null }
  const referenceIso = `${yearForMonth(resolvedMonth, today)}-${pad(resolvedMonth + 1)}-15`
  return {
    hasDates: false,
    month: resolvedMonth,
    season: seasonOfMonth(resolvedMonth),
    referenceIso,
    dateOfDay: () => referenceIso,
  }
}
