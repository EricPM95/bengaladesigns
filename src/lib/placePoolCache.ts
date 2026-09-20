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

// Ronda 8D (issue A — bug real de fondo de 6 rondas de "el pool no aparece"): esta caché nunca
// caduca por diseño ("el JSON curado cambia solo cuando cambia, no con el tiempo") — cierto para
// ediciones normales de contenido, FALSO para un cambio de FUENTE de datos. Roma cambió de origen
// (destinations.json antiguo → data/pipeline_v2/roma.json, ronda 5) con nombres de lugar distintos —
// cualquier navegador que hubiera cargado el pool de Roma ANTES de ese cambio se quedó con los
// nombres viejos en localStorage para siempre, sin volver a pedirle nada al servidor jamás
// (readCache no tiene TTL ni versión — si hay algo cacheado, se devuelve tal cual). Cada fix de
// backend desde entonces (BUG 14, related_to, fuzzy matching...) era invisible para cualquier
// navegador que ya hubiera visitado Roma una vez — exactamente el patrón reportado: funciona en las
// pruebas nuevas de Code (sin caché previa), nunca en la app real del usuario (con 8+ rondas de
// caché acumulada). CACHE_VERSION en la propia clave — cualquier cambio de fuente/forma de los datos
// futuro solo necesita subir este número para invalidar toda caché vieja de un plumazo, sin tener
// que enumerar ni borrar claves a mano.
// Ronda 10: v3 porque el pool cambió de FORMA — de 3 niveles cargados por separado ("Ver más
// lugares") a un solo bloque de ~20 lugares ('pool'). La clave lleva el nivel, así que una caché v2
// de Nivel 1 no se confundiría con la nueva, pero subirlo evita arrastrar niveles 2/3 huérfanos en
// localStorage de todos los navegadores que ya los tenían.
const CACHE_VERSION = 3

/** Ronda 10: 'pool' es el bloque único que usa la app; 1|2|3 siguen existiendo para depurar. */
export type PoolLevel = 'pool' | 1 | 2 | 3

function cacheKey(destination: string, level: PoolLevel): string {
  return `pool:v${CACHE_VERSION}:${destination.trim().toLowerCase()}:level${level}`
}

/**
 * Caché en localStorage del "Pool de lugares" (punto 6 del prompt DEFINITIVO) — persiste entre
 * sesiones/pestañas para que el siguiente viajero que confirme el mismo destino vea los lugares al
 * instante, sin ni siquiera pasar por /api/curated-places-pool. Solo guarda destinos curados (found:
 * true) — un destino no encontrado nunca llega a llamarse con `set`. Sin fecha de expiración: es el
 * mismo JSON curado del servidor, cambia solo cuando el propio JSON cambia, no con el tiempo — ver
 * CACHE_VERSION arriba para el caso real en que sí hace falta invalidar todo.
 */
function readCache(destination: string, level: PoolLevel): PoolPlace[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(destination, level))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCache(destination: string, level: PoolLevel, places: PoolPlace[]): void {
  try {
    localStorage.setItem(cacheKey(destination, level), JSON.stringify(places))
  } catch {
    // localStorage lleno/bloqueado (privado, cuota) — la pantalla sigue funcionando sin caché persistente.
  }
}

/**
 * Trae un nivel del pool de lugares — primero localStorage (instantáneo), si no hay nada pide al
 * backend (cero coste, JSON curado directo, ver /api/curated-places-pool) y cachea el resultado.
 * Las fotos NO se cachean aquí — el propio CuratedPlacesPool las pide por separado con
 * fetchPlacePhoto (misma fuente gratuita, Wikipedia, que ya usa el resto de la app) para poder
 * pintar la lista al instante y dejar que cada foto aparezca según va llegando, en vez de esperar a
 * todas antes de mostrar nada. Devuelve `found: false` si el destino no está en el JSON curado —
 * Questionnaire.tsx usa esto para decidir si el último paso ("Elige lugares") muestra el pool curado
 * o el flujo de siempre con sugerencias de Claude (PlaceSelector).
 */
export async function fetchPoolLevel(destination: string, level: PoolLevel): Promise<{ found: boolean; places: PoolPlace[] }> {
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
