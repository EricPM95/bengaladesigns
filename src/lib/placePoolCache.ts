export interface PoolPlace {
  name: string
  category: string | null
  type: string | null
  duration_min: number | null
  is_free_access: boolean | null
}

interface RawPoolPlace {
  name?: unknown
  category?: unknown
  type?: unknown
  duration_min?: unknown
  is_free_access?: unknown
}

function sanitizePlace(raw: unknown): PoolPlace | null {
  const place = raw as RawPoolPlace
  if (!place || typeof place.name !== 'string' || !place.name.trim()) return null
  return {
    name: place.name,
    category: typeof place.category === 'string' ? place.category : null,
    type: typeof place.type === 'string' ? place.type : null,
    duration_min: typeof place.duration_min === 'number' ? place.duration_min : null,
    is_free_access: typeof place.is_free_access === 'boolean' ? place.is_free_access : null,
  }
}

function cacheKey(destination: string, level: 1 | 2 | 3): string {
  return `pool:${destination.trim().toLowerCase()}:level${level}`
}

/**
 * Caché en localStorage del "Pool de lugares" (punto 6 del prompt DEFINITIVO) — persiste entre
 * sesiones/pestañas para que el siguiente viajero que confirme el mismo destino vea los lugares al
 * instante, sin ni siquiera pasar por /api/curated-places-pool. Solo guarda destinos curados (found:
 * true) — un destino no encontrado nunca llega a llamarse con `set`. Sin fecha de expiración: es el
 * mismo JSON curado del servidor, cambia solo cuando el propio JSON cambia, no con el tiempo.
 */
function readCache(destination: string, level: 1 | 2 | 3): PoolPlace[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(destination, level))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(destination: string, level: 1 | 2 | 3, places: PoolPlace[]): void {
  try {
    localStorage.setItem(cacheKey(destination, level), JSON.stringify(places))
  } catch {
    // localStorage lleno/bloqueado (privado, cuota) — la pantalla sigue funcionando sin caché persistente.
  }
}

/**
 * Trae un nivel del pool de lugares — primero localStorage (instantáneo), si no hay nada pide al
 * backend (cero coste, JSON curado directo, ver /api/curated-places-pool) y cachea el resultado.
 * Las fotos NO se cachean aquí — el propio PlacesPoolScreen las pide por separado con
 * fetchPlacePhoto (misma fuente gratuita, Wikipedia, que ya usa el resto de la app) para poder
 * pintar la lista al instante y dejar que cada foto aparezca según va llegando, en vez de esperar a
 * todas antes de mostrar nada. Devuelve `found: false` si el destino no está en el JSON curado (la
 * pantalla entera no debe mostrarse en ese caso, ver PlacesPoolScreen).
 */
export async function fetchPoolLevel(destination: string, level: 1 | 2 | 3): Promise<{ found: boolean; places: PoolPlace[] }> {
  const cached = readCache(destination, level)
  if (cached) return { found: true, places: cached }

  try {
    const response = await fetch('/api/curated-places-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, level }),
    })
    if (!response.ok) return { found: false, places: [] }
    const data = await response.json()
    if (data?.found !== true) return { found: false, places: [] }

    const places = (Array.isArray(data.places) ? data.places : []).map(sanitizePlace).filter((place): place is PoolPlace => place !== null)
    writeCache(destination, level, places)
    return { found: true, places }
  } catch {
    return { found: false, places: [] }
  }
}
