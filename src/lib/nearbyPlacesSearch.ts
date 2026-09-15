import type { Coordinates } from './types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface MapboxSearchBoxFeature {
  properties: {
    name: string
    mapbox_id: string
    full_address?: string
    place_formatted?: string
    coordinates: { latitude: number; longitude: number }
  }
}

interface MapboxSearchBoxResponse {
  features?: MapboxSearchBoxFeature[]
}

export interface NearbyPlaceResult {
  id: string
  name: string
  address: string
  coordinates: Coordinates
  categoryLabel: string
  photoUrl: string
  /** 0 cuando no hay suficientes reseñas mock para simular una valoración fiable. */
  rating: number
  reviewCount: number
}

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 1000) / 1000
  }
}

/** Nombre/dirección/coordenadas ya vienen reales de Mapbox — solo la valoración/nº de reseñas es mock, determinista por lugar. */
function enrichWithMockRating(feature: MapboxSearchBoxFeature, categoryLabel: string): NearbyPlaceResult {
  const rand = seededRandom(feature.properties.mapbox_id)
  return {
    id: feature.properties.mapbox_id,
    name: feature.properties.name,
    address: feature.properties.full_address ?? feature.properties.place_formatted ?? '',
    coordinates: { lat: feature.properties.coordinates.latitude, lng: feature.properties.coordinates.longitude },
    categoryLabel,
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(feature.properties.mapbox_id)}/400/280`,
    rating: Math.round((3.6 + rand() * 1.3) * 10) / 10,
    reviewCount: 20 + Math.floor(rand() * 1400),
  }
}

/** Metros por grado de latitud ~constante en toda la Tierra; longitud se corrige por coseno de la latitud (los grados de longitud se acortan según te alejas del ecuador). */
const METERS_PER_DEGREE_LAT = 111_320

/** Caja delimitadora cuadrada de `radiusMeters` alrededor de `center` — `bbox` de la Search Box API de Mapbox, la única forma real de limitar (o ampliar) el radio efectivo de búsqueda: `proximity` por sí sola solo ordena por cercanía, no acota el área (ver BLOQUE C, feedback de calidad: el radio efectivo se sentía demasiado estrecho). */
function buildBoundingBox(center: Coordinates, radiusMeters: number): [number, number, number, number] {
  const latDelta = radiusMeters / METERS_PER_DEGREE_LAT
  const lngDelta = radiusMeters / (METERS_PER_DEGREE_LAT * Math.cos((center.lat * Math.PI) / 180))
  return [center.lng - lngDelta, center.lat - latDelta, center.lng + lngDelta, center.lat + latDelta]
}

async function fetchCategory(canonicalCategoryId: string, near: Coordinates, radiusMeters: number | undefined, signal?: AbortSignal): Promise<MapboxSearchBoxFeature[]> {
  if (!MAPBOX_TOKEN) return []

  const url = new URL(`https://api.mapbox.com/search/searchbox/v1/category/${canonicalCategoryId}`)
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('proximity', `${near.lng},${near.lat}`)
  if (radiusMeters) url.searchParams.set('bbox', buildBoundingBox(near, radiusMeters).join(','))
  url.searchParams.set('limit', radiusMeters ? '20' : '10')
  url.searchParams.set('language', 'es')

  const response = await fetch(url.toString(), { signal })
  if (!response.ok) return []

  const data = (await response.json()) as MapboxSearchBoxResponse
  return data.features ?? []
}

/**
 * Nombre y ubicación REALES vía la Search Box API de Mapbox (mismo proveedor/token que el resto de
 * la app, ver mapboxGeocoding.ts) — búsqueda por categoría canónica cerca de `near`, no por texto
 * libre (la Geocoding API v5 clásica no sirve para esto: `types=poi` con un término genérico como
 * "restaurante" no devuelve resultados reales en el plan de este token, confirmado probando contra
 * la API real). Valoración/reseñas SÍ son mock — ninguna API ya integrada expone esos datos (eso es
 * específico de Google Places, sin integrar). `canonicalCategoryIds` admite varias categorías
 * (ej. restaurant + cafe para "Comer y beber") — se combinan y deduplican por `mapbox_id`.
 * `radiusMeters` es opcional (sin él, se mantiene el comportamiento de siempre: solo `proximity`,
 * sin acotar área) — MealTimeAccordion.tsx lo pasa explícitamente para ampliar el radio efectivo de
 * restaurantes (BLOQUE C, feedback de calidad: el radio por defecto se sentía demasiado estrecho).
 */
export async function searchNearbyPlaces(
  canonicalCategoryIds: string[],
  near: Coordinates,
  categoryLabel: string,
  signal?: AbortSignal,
  radiusMeters?: number,
): Promise<NearbyPlaceResult[]> {
  const results = await Promise.all(canonicalCategoryIds.map((categoryId) => fetchCategory(categoryId, near, radiusMeters, signal)))
  const seen = new Set<string>()
  const merged: MapboxSearchBoxFeature[] = []
  for (const feature of results.flat()) {
    if (seen.has(feature.properties.mapbox_id)) continue
    seen.add(feature.properties.mapbox_id)
    merged.push(feature)
  }

  return merged.map((feature) => enrichWithMockRating(feature, categoryLabel))
}
