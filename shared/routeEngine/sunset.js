/**
 * Hora de la puesta de sol (decisión del 2026-09-25): con fechas, calculada con la fórmula
 * astronómica de siempre (Almanac for Computers, cenit oficial 90° 50'), con las coordenadas y la
 * zona horaria del destino; sin fechas, la tabla por época del destino (`sunset_by_season`).
 *
 * Módulo puro: sin red. La zona horaria se resuelve con Intl (el propio JS), así que el horario de
 * verano sale solo.
 */

const RAD = Math.PI / 180
const ZENITH = 90.833

/** Minutos UTC (desde las 00:00 UTC de ese día) de la puesta de sol; null si ese día no se pone. */
function sunsetUtcMinutes(year, month, day, lat, lng) {
  const start = Date.UTC(year, 0, 0)
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - start) / 86400000)
  const lngHour = lng / 15
  const t = dayOfYear + (18 - lngHour) / 24
  const M = 0.9856 * t - 3.289
  let L = M + 1.916 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 282.634
  L = ((L % 360) + 360) % 360
  let RA = Math.atan(0.91764 * Math.tan(L * RAD)) / RAD
  RA = ((RA % 360) + 360) % 360
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15
  const sinDec = 0.39782 * Math.sin(L * RAD)
  const cosDec = Math.cos(Math.asin(sinDec))
  const cosH = (Math.cos(ZENITH * RAD) - sinDec * Math.sin(lat * RAD)) / (cosDec * Math.cos(lat * RAD))
  if (cosH < -1 || cosH > 1) return null
  const H = Math.acos(cosH) / RAD / 15
  const T = H + RA - 0.06571 * t - 6.622
  const UT = (((T - lngHour) % 24) + 24) % 24
  return Math.round(UT * 60)
}

/** Minutos locales (desde las 00:00 en la zona horaria del destino) de un instante UTC. */
function localMinutes(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(utcMs))
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)
  return hour * 60 + minute
}

/**
 * Puesta de sol en hora local de una fecha ("2026-11-14"). null si no se puede calcular.
 * @param {string} dateIso
 * @param {[number, number]} coordinates  [lat, lng]
 * @param {string} timeZone               "Europe/Rome"
 */
export function sunsetMinutesOn(dateIso, coordinates, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateIso ?? ''))
  if (!match || !Array.isArray(coordinates) || !timeZone) return null
  const [year, month, day] = match.slice(1).map(Number)
  const utc = sunsetUtcMinutes(year, month, day, coordinates[0], coordinates[1])
  if (utc === null) return null
  return localMinutes(Date.UTC(year, month - 1, day) + utc * 60000, timeZone)
}

/** El punto del destino para el sol: su primera zona con centro, o el primer lugar. */
export function destinationPoint(destData) {
  const zone = Object.values(destData?.zones ?? {}).find((candidate) => Array.isArray(candidate.center))
  return zone?.center ?? destData?.places?.[0]?.coordinates ?? null
}

/**
 * La puesta de sol de un día del viaje: con fecha, la calculada; sin fecha, la de la época
 * (`destination_config.sunset_by_season`); sin nada, null (no se sabe: el motor no promete atardecer).
 * @param {object} destData
 * @param {{dateIso?: string|null, season?: string|null}} day
 */
export function sunsetFor(destData, { dateIso = null, season = null } = {}) {
  if (dateIso) {
    const exact = sunsetMinutesOn(dateIso, destinationPoint(destData), destData?.timezone ?? null)
    if (exact !== null) return exact
  }
  const text = season ? destData?.destination_config?.sunset_by_season?.[season] : null
  if (typeof text !== 'string') return null
  const [h, m] = text.split(':').map(Number)
  return h * 60 + m
}

/** Ventana del atardecer (Paso 5 revisado): cuenta como atardecer llegar de 60 min antes a 15 después;
    lo ideal, de 45 a 30 min antes. */
export const SUNSET_WINDOW = { earliestBefore: 60, idealFrom: 45, idealTo: 30, latestAfter: 15 }
