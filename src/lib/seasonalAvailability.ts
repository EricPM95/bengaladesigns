import type { DateRange } from './types'

/**
 * Ventanas de temporada de las experiencias de un destino (Estaciones, Parte 4) y cómo cae el viaje
 * respecto a ellas. Copia en TypeScript de shared/routeEngine/availability.js (el cliente no importa
 * el motor): si cambia una regla allí, cambia aquí.
 */
export interface SeasonalWindow {
  from: string
  to: string
  /** "del 1 de diciembre al 6 de enero" */
  label: string
}

export type SeasonStatus = 'in' | 'out' | 'border'

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const md = (text: string) => {
  const match = /(\d{2})-(\d{2})$/.exec(text.slice(0, 10))
  return match ? Number(match[1]) * 100 + Number(match[2]) : null
}
function within(day: number | null, window: SeasonalWindow): boolean {
  const a = md(window.from)
  const b = md(window.to)
  if (day === null || a === null || b === null) return false
  return a <= b ? day >= a && day <= b : day >= a || day <= b
}

/** Con fechas: dentro si algún día del viaje cae en la ventana. Con mes: entero dentro, fuera o frontera. */
export function seasonStatus(window: SeasonalWindow | undefined, month: number | undefined, dateRange?: DateRange): SeasonStatus {
  if (!window) return 'in'
  if (dateRange?.start && dateRange?.end) {
    const start = Date.parse(`${dateRange.start}T12:00:00Z`)
    const end = Date.parse(`${dateRange.end}T12:00:00Z`)
    for (let t = start; t <= end; t += 86400000) if (within(md(new Date(t).toISOString().slice(0, 10)), window)) return 'in'
    return 'out'
  }
  if (month === undefined) return 'in'
  let inside = 0
  for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) if (within((month + 1) * 100 + day, window)) inside++
  return inside === DAYS_IN_MONTH[month] ? 'in' : inside === 0 ? 'out' : 'border'
}

const cache = new Map<string, Promise<Record<string, SeasonalWindow>>>()

/** Las ventanas del destino (sin datos, {}). Se cachea por destino durante la sesión. */
export function fetchSeasonalWindows(destination: string): Promise<Record<string, SeasonalWindow>> {
  const key = destination.trim().toLowerCase()
  if (!cache.has(key)) {
    cache.set(
      key,
      fetch('/api/destination-seasonal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination }) })
        .then((response) => (response.ok ? response.json() : { experiences: {} }))
        .then((data) => (data?.experiences ?? {}) as Record<string, SeasonalWindow>)
        .catch(() => {
          cache.delete(key)
          return {}
        }),
    )
  }
  return cache.get(key)!
}
