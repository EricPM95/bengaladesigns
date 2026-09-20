import type { StopTip } from './anchorTipsApi'
import type { StopDescription } from './describeStopApi'
import type { NearbyTransit, TransitStop } from './nearbyTransitApi'

/**
 * Ficha ampliada de un lugar de un destino curado — el texto largo escrito a mano que alimenta las 3
 * pestañas de StopDetailSheet (Resumen / Entradas / Tips). Vive en
 * data/pipeline_v2/detalle/<destino>/<zona>.json y se pide lugar a lugar (ver /api/place-detail).
 *
 * Cuando existe, SUSTITUYE a las tres llamadas a Claude que hasta ahora llenaban esa ficha
 * (describeStop, anchorTips y nearbyTransit): contenido mejor, instantáneo y gratis. Cuando no
 * existe — cualquier destino sin ficha escrita — no pasa nada: la ficha sigue por el camino de
 * siempre.
 */
export interface PlaceDetailSchedulePeriod {
  dates: string
  hours: string
  last_entry?: string
}

export interface PlaceDetailSchedule {
  periods?: PlaceDetailSchedulePeriod[]
  closed?: string[]
  free_days?: string[]
  notes?: string
}

export interface PlaceDetailTransport {
  type: string
  icon?: string
  /** Una sola línea ("Línea A") o varias (["23", "280"]) según el medio — el JSON usa uno u otro. */
  line?: string
  lines?: string[]
  stop: string
  note?: string
}

export interface PlaceDetail {
  name: string
  description?: string
  what_to_see?: string[]
  schedule?: PlaceDetailSchedule
  transport?: PlaceDetailTransport[]
  extras?: { official_url?: string; booking_url?: string; address?: string }
  tips?: string[]
  secrets?: string[]
}

// Mismo criterio que placePoolCache.ts: es contenido estático del repo, no cambia con el tiempo ni
// con el viajero, así que se cachea sin caducidad y se invalida subiendo la versión de la clave.
const CACHE_VERSION = 1

function cacheKey(destination: string, name: string): string {
  return `place-detail:v${CACHE_VERSION}:${destination.trim().toLowerCase()}:${name.trim().toLowerCase()}`
}

/** `null` cacheado = "ya preguntamos y este lugar no tiene ficha" — para no repetir la llamada. */
const memory = new Map<string, PlaceDetail | null>()
const inFlight = new Map<string, Promise<PlaceDetail | null>>()

export async function fetchPlaceDetail(destination: string, name: string): Promise<PlaceDetail | null> {
  const key = cacheKey(destination, name)
  if (memory.has(key)) return memory.get(key) ?? null

  try {
    const cached = localStorage.getItem(key)
    if (cached) {
      const parsed = cached === 'null' ? null : (JSON.parse(cached) as PlaceDetail)
      memory.set(key, parsed)
      return parsed
    }
  } catch {
    // localStorage bloqueado (modo privado, cuota) — se pide al servidor y ya.
  }

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<PlaceDetail | null> => {
    try {
      const response = await fetch('/api/place-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, name }),
      })
      if (!response.ok) return null
      const data = await response.json()
      const detail: PlaceDetail | null = data?.found === true && data.detail ? (data.detail as PlaceDetail) : null
      memory.set(key, detail)
      try {
        localStorage.setItem(key, detail ? JSON.stringify(detail) : 'null')
      } catch {
        // Sin persistencia: la caché en memoria de esta sesión sigue evitando repetir la llamada.
      }
      return detail
    } catch {
      // Red caída: NO se cachea el fallo — la próxima vez que se abra la ficha se reintenta.
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}

// ── Adaptadores a lo que ya pinta StopDetailSheet ────────────────────────────────────────────
//
// La ficha ya sabe pintar `StopDescription`, `StopTip[]` y `NearbyTransit`. En vez de duplicar el
// render para la versión curada, se traduce la ficha curada a esas mismas formas — así el contenido
// nuevo entra sin tocar el layout, y las secciones que no tenga (p.ej. una plaza sin horario) se
// omiten exactamente igual que cuando Claude no las devuelve.

/** Texto del horario para la sección "Horario", montado desde la estructura del JSON curado. */
export function formatScheduleDetail(schedule: PlaceDetailSchedule | undefined): string | null {
  if (!schedule) return null
  const lines: string[] = []
  for (const period of schedule.periods ?? []) {
    if (!period?.hours) continue
    const lastEntry = period.last_entry ? ` (última entrada ${period.last_entry})` : ''
    lines.push(period.dates ? `${period.dates}: ${period.hours}${lastEntry}` : `${period.hours}${lastEntry}`)
  }
  if (schedule.closed?.length) lines.push(`Cerrado: ${schedule.closed.join('; ')}`)
  if (schedule.free_days?.length) lines.push(`Entrada gratuita: ${schedule.free_days.join('; ')}`)
  if (schedule.notes) lines.push(schedule.notes)
  return lines.length > 0 ? lines.join('\n') : null
}

export function toStopDescription(detail: PlaceDetail): StopDescription {
  return {
    description: detail.description ?? '',
    // `whatYoullSee`/`whyRecommended` son los campos de texto suelto de Claude; la ficha curada trae
    // una LISTA de puntos concretos, que se pinta aparte (ver `whatToSee` en StopDetailSheet).
    whatYoullSee: '',
    whyRecommended: '',
    address: detail.extras?.address ?? null,
    officialWebsite: detail.extras?.official_url ?? null,
    hoursDetail: formatScheduleDetail(detail.schedule),
    tips: [],
  }
}

/** tips → prácticos, secrets → secretos. Es exactamente la distinción que ya hace la pestaña Tips. */
export function toStopTips(detail: PlaceDetail): StopTip[] {
  return [
    ...(detail.tips ?? []).map((texto): StopTip => ({ tipo: 'practico', texto })),
    ...(detail.secrets ?? []).map((texto): StopTip => ({ tipo: 'secreto', texto })),
  ]
}

/** El JSON trae metro/bus/tram; la ficha solo distingue metro y "lo demás" (bus), que es como se
    pinta hoy. El tram entra como bus: mismo icono de superficie, misma información útil. */
export function toNearbyTransit(detail: PlaceDetail): NearbyTransit {
  const metro: TransitStop[] = []
  const bus: TransitStop[] = []
  for (const entry of detail.transport ?? []) {
    if (!entry?.stop) continue
    const linea = entry.line ?? (entry.lines?.length ? entry.lines.join(', ') : '')
    const parada = entry.note ? `${entry.stop} · ${entry.note}` : entry.stop
    ;(entry.type === 'metro' ? metro : bus).push({ linea, parada })
  }
  return { metro, bus }
}
