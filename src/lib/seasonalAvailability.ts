import type { DateRange } from './types'

/**
 * Ventanas de temporada de las experiencias de un destino (Estaciones, Parte 4) y cómo cae el viaje
 * respecto a ellas. Copia en TypeScript de seasonFit (shared/routeEngine/availability.js; el cliente no
 * importa el motor): si cambia una regla allí, cambia aquí.
 */
export interface SeasonalWindow {
  from: string
  to: string
  /** Fechas que cambian cada año (mercadillos, fiestas): margen de 15 días con aviso. */
  aprox?: boolean
  /** "Es probable que algunos mercadillos aún no hayan abierto." */
  notice_before?: string
  /** "Es probable que algunos mercadillos ya hayan cerrado." */
  notice_after?: string
  /** "del 1 de diciembre al 6 de enero" */
  label: string
}

/** in = entra normal; notice = entra con aviso (margen de una ventana aproximada); out = no se ofrece. */
export interface SeasonFit {
  status: 'in' | 'notice' | 'out'
  notice: string | null
}

const MARGIN_DAYS = 15
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const md = (text: string) => {
  const match = /(\d{2})-(\d{2})$/.exec(text.slice(0, 10))
  return match ? Number(match[1]) * 100 + Number(match[2]) : null
}
const dayOfYear = (value: number) => DAYS_IN_MONTH.slice(0, Math.floor(value / 100) - 1).reduce((sum, days) => sum + days, 0) + (value % 100) - 1
const daysForward = (a: number, b: number) => (dayOfYear(b) - dayOfYear(a) + 366) % 366
function within(day: number | null, window: SeasonalWindow): boolean {
  const a = md(window.from)
  const b = md(window.to)
  if (day === null || a === null || b === null) return false
  return a <= b ? day >= a && day <= b : day >= a || day <= b
}
function dayStatus(day: number, window: SeasonalWindow): 'in' | 'before' | 'after' | 'out' {
  if (within(day, window)) return 'in'
  const toStart = daysForward(day, md(window.from) ?? day)
  const sinceEnd = daysForward(md(window.to) ?? day, day)
  if (toStart <= MARGIN_DAYS && toStart <= sinceEnd) return 'before'
  if (sinceEnd <= MARGIN_DAYS) return 'after'
  return 'out'
}

/** Con fechas: el mejor de los días del viaje. Con mes: entero dentro, con aviso (si `aprox`) o fuera. */
export function seasonStatus(window: SeasonalWindow | undefined, month: number | undefined, dateRange?: DateRange): SeasonFit {
  if (!window) return { status: 'in', notice: null }
  const noticeFor = (side: 'before' | 'after') => (side === 'before' ? window.notice_before : window.notice_after) ?? null
  let statuses: ReturnType<typeof dayStatus>[] = []
  if (dateRange?.start && dateRange?.end) {
    const start = Date.parse(`${dateRange.start}T12:00:00Z`)
    const end = Date.parse(`${dateRange.end}T12:00:00Z`)
    for (let t = start; t <= end; t += 86400000) statuses.push(dayStatus(md(new Date(t).toISOString().slice(0, 10)) ?? 0, window))
    if (statuses.includes('in')) return { status: 'in', notice: null }
  } else {
    if (month === undefined) return { status: 'in', notice: null }
    statuses = Array.from({ length: DAYS_IN_MONTH[month] }, (_, i) => dayStatus((month + 1) * 100 + i + 1, window))
    if (statuses.every((status) => status === 'in')) return { status: 'in', notice: null }
  }
  if (!window.aprox) return { status: 'out', notice: null }
  if (statuses.every((status) => status === 'out')) return { status: 'out', notice: null }
  const side = statuses.find((status): status is 'before' | 'after' => status === 'before' || status === 'after') ?? (statuses[0] === 'in' ? 'after' : 'before')
  return { status: 'notice', notice: noticeFor(side) }
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
