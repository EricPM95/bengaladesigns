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

async function fetchCategory(canonicalCategoryId: string, near: Coordinates, signal?: AbortSignal): Promise<MapboxSearchBoxFeature[]> {
  if (!MAPBOX_TOKEN) return []

  const url = new URL(`https://api.mapbox.com/search/searchbox/v1/category/${canonicalCategoryId}`)
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('proximity', `${near.lng},${near.lat}`)
  url.searchParams.set('limit', '10')
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
 */
export async function searchNearbyPlaces(canonicalCategoryIds: string[], near: Coordinates, categoryLabel: string, signal?: AbortSignal): Promise<NearbyPlaceResult[]> {
  const results = await Promise.all(canonicalCategoryIds.map((categoryId) => fetchCategory(categoryId, near, signal)))
  const seen = new Set<string>()
  const merged: MapboxSearchBoxFeature[] = []
  for (const feature of results.flat()) {
    if (seen.has(feature.properties.mapbox_id)) continue
    seen.add(feature.properties.mapbox_id)
    merged.push(feature)
  }

  return merged.map((feature) => enrichWithMockRating(feature, categoryLabel))
}
