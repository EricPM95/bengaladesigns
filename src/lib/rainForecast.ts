import { addDaysToIso } from './dateRange'
import { lluviaDePruebaActiva } from './lluviaDePrueba'
import type { Coordinates } from './types'

/**
 * Previsión de lluvia de un día, pedida a NUESTRO servidor (/api/tiempo/*; él habla con Open-Meteo y la guarda ~3 h): la app nunca llama al proveedor. Se guarda en memoria por (lugar, fecha) para no repetir la
 * llamada; a las 3 horas se vuelve a pedir, así que la previsión de la víspera se refresca esa misma mañana.
 */
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
  // «Lluvia de prueba» del panel de pruebas (solo en local y vistas previas): como si nuestro servidor dijera que llueve todo ese día.
  if (lluviaDePruebaActiva()) return Promise.resolve({ probability: new Array<number>(24).fill(90), precipitation: new Array<number>(24).fill(2) })
  const key = `${at.lat.toFixed(2)},${at.lng.toFixed(2)},${dateIso}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value
  const value = (async () => {
    try {
      const response = await fetch(`/api/tiempo/horas?lat=${at.lat.toFixed(2)}&lng=${at.lng.toFixed(2)}&fecha=${encodeURIComponent(dateIso)}`)
      if (!response.ok) return null
      const data = (await response.json()) as { ok?: boolean; probability?: number[]; precipitation?: number[] }
      if (!data.ok || !Array.isArray(data.probability) || !Array.isArray(data.precipitation)) return null
      return { probability: data.probability, precipitation: data.precipitation }
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

/** La previsión de un día entero (Tanda 6z3, «El tiempo en {destino}» de HOY): temperaturas y probabilidad de lluvia. */
export interface DiaDeTiempo {
  dateIso: string
  maxima: number | null
  minima: number | null
  /** Probabilidad máxima de lluvia del día (%). */
  lluvia: number | null
}

/** Los días de la lluvia de prueba: del primero al último (hasta 16), llueve en los pares (0, 2, 4…). */
function diasDeLluviaDePrueba(startIso: string, endIso: string): DiaDeTiempo[] {
  const dias: DiaDeTiempo[] = []
  for (let i = 0; i < 16; i++) {
    const dateIso = addDaysToIso(startIso, i)
    if (dateIso > endIso) break
    dias.push({ dateIso, maxima: 17 - (i % 3), minima: 10, lluvia: i % 2 === 0 ? 80 : 10 })
  }
  return dias
}

const cacheDiaria = new Map<string, { at: number; value: Promise<DiaDeTiempo[] | null> }>()

/** La previsión de cada día entre dos fechas (Open-Meteo da hasta 16 días); null si no hay (la fecha queda muy lejos o no responde). */
export function fetchDailyWeather(at: Coordinates, startIso: string, endIso: string): Promise<DiaDeTiempo[] | null> {
  // «Lluvia de prueba»: como si el servidor dijera que llueve un día sí y otro no (el primero llueve).
  if (lluviaDePruebaActiva()) return Promise.resolve(diasDeLluviaDePrueba(startIso, endIso))
  const key = `${at.lat.toFixed(2)},${at.lng.toFixed(2)},${startIso},${endIso}`
  const cached = cacheDiaria.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value
  const value = (async () => {
    try {
      const response = await fetch(`/api/tiempo/dias?lat=${at.lat.toFixed(2)}&lng=${at.lng.toFixed(2)}&desde=${encodeURIComponent(startIso)}&hasta=${encodeURIComponent(endIso)}`)
      if (!response.ok) return null
      const data = (await response.json()) as { ok?: boolean; dias?: DiaDeTiempo[] }
      return data.ok && Array.isArray(data.dias) && data.dias.length > 0 ? data.dias : null
    } catch {
      return null
    }
  })()
  cacheDiaria.set(key, { at: Date.now(), value })
  value.then((result) => {
    if (result === null) cacheDiaria.delete(key)
  })
  return value
}
