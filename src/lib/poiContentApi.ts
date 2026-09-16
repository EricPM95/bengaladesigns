/**
 * Ficha completa (Resumen/Tips) de un POI del mapa de "Añadir parada" — a diferencia de
 * describeStopApi.ts (solo cache en memoria de esta sesión), esto persiste PARA SIEMPRE en Supabase
 * (tabla place_content_cache, ver server/index.js) por lugar+destino: el primer viajero que abre un
 * lugar paga la llamada a Claude, todos los siguientes lo reciben gratis. Cache en memoria aquí
 * también, solo para no repetir el fetch de red si el viajero reabre el mismo POI en la misma sesión.
 */

export interface PoiContent {
  summary: string
  tips: string[]
  hoursDetail: string | null
  hoursShort: string | null
  category: string
  visitDurationMin: number
  isFreeAccess: boolean
  officialUrl: string | null
}

const cache = new Map<string, PoiContent>()
const inFlight = new Map<string, Promise<PoiContent | null>>()

function cacheKey(placeName: string, destination: string): string {
  return `${placeName.toLowerCase()}|${destination.toLowerCase()}`
}

export async function fetchPoiContent(placeName: string, destination: string, mapboxId?: string): Promise<PoiContent | null> {
  const key = cacheKey(placeName, destination)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<PoiContent | null> => {
    try {
      const response = await fetch('/api/poi-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_name: placeName, destination, mapbox_id: mapboxId }),
      })
      if (!response.ok) return null
      const data = await response.json()
      const content: PoiContent = {
        summary: data.content?.summary ?? '',
        tips: Array.isArray(data.content?.tips) ? data.content.tips : [],
        hoursDetail: data.content?.hours_detail ?? null,
        hoursShort: data.content?.hours_short ?? null,
        category: data.content?.category ?? 'Punto de interés',
        visitDurationMin: typeof data.content?.visit_duration_min === 'number' ? data.content.visit_duration_min : 60,
        isFreeAccess: Boolean(data.content?.is_free_access),
        officialUrl: data.content?.official_url ?? null,
      }
      if (!content.summary) return null
      cache.set(key, content)
      return content
    } catch {
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
