import type { Coordinates } from './types'

/**
 * Previsión de lluvia de un día con Open-Meteo (gratis, sin clave). Se guarda en memoria por (lugar, fecha) para no repetir la
 * llamada; a las 3 horas se vuelve a pedir, así que la previsión de la víspera se refresca esa misma mañana.
 */
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const CACHE_TTL_MS = 3 * 60 * 60 * 1000
/** Umbrales de «hay previsión de lluvia» (PARA_CODE_TANDA6, punto 5). */
export const RAIN_PROBABILITY_THRESHOLD = 50
export const RAIN_MM_THRESHOLD = 0.5

export interface HourlyRain {
  /** Hora del día (0-23) → probabilidad (%) y precipitación (mm). */
  probability: number[]
  precipitation: number[]
}

const cache = new Map<string, { at: number; value: Promise<HourlyRain | null> }>()

export function fetchHourlyRain(at: Coordinates, dateIso: string): Promise<HourlyRain | null> {
  const key = `${at.lat.toFixed(2)},${at.lng.toFixed(2)},${dateIso}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value
  const value = (async () => {
    try {
      const url = new URL(FORECAST_URL)
      url.searchParams.set('latitude', String(at.lat))
      url.searchParams.set('longitude', String(at.lng))
      url.searchParams.set('hourly', 'precipitation_probability,precipitation')
      url.searchParams.set('timezone', 'auto')
      url.searchParams.set('start_date', dateIso)
      url.searchParams.set('end_date', dateIso)
      const response = await fetch(url.toString())
      if (!response.ok) return null
      const data = (await response.json()) as { hourly?: { time?: string[]; precipitation_probability?: (number | null)[]; precipitation?: (number | null)[] } }
      const times = data.hourly?.time
      if (!times) return null
      const probability = new Array<number>(24).fill(0)
      const precipitation = new Array<number>(24).fill(0)
      times.forEach((time, index) => {
        const hour = Number(time.slice(11, 13))
        if (Number.isNaN(hour) || hour < 0 || hour > 23) return
        probability[hour] = data.hourly?.precipitation_probability?.[index] ?? 0
        precipitation[hour] = data.hourly?.precipitation?.[index] ?? 0
      })
      return { probability, precipitation }
    } catch {
      return null
    }
  })()
  cache.set(key, { at: Date.now(), value })
  // Un fallo no se queda guardado: la próxima vez se vuelve a intentar.
  value.then((result) => {
    if (result === null) cache.delete(key)
  })
  return value
}

/** ¿Llueve (por previsión) en alguna de estas horas? Las horas son enteras 0-23. */
export function rainsInHours(rain: HourlyRain, hours: number[]): boolean {
  return hours.some((hour) => (rain.probability[hour] ?? 0) >= RAIN_PROBABILITY_THRESHOLD || (rain.precipitation[hour] ?? 0) >= RAIN_MM_THRESHOLD)
}
