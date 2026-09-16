import type { Coordinates } from './types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface MapboxSearchBoxFeature {
  properties: {
    name: string
    mapbox_id: string
    full_address?: string
    place_formatted?: string
    poi_category?: string[]
    coordinates: { latitude: number; longitude: number }
  }
}

interface MapboxSearchBoxResponse {
  features?: MapboxSearchBoxFeature[]
}

export interface AttractionSearchResult {
  id: string
  name: string
  address: string
  category: string
  coordinates: Coordinates
  photoUrl: string
}

function toResult(feature: MapboxSearchBoxFeature): AttractionSearchResult {
  return {
    id: feature.properties.mapbox_id,
    name: feature.properties.name,
    address: feature.properties.full_address ?? feature.properties.place_formatted ?? '',
    category: feature.properties.poi_category?.[0] ?? '',
    coordinates: { lat: feature.properties.coordinates.latitude, lng: feature.properties.coordinates.longitude },
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(feature.properties.mapbox_id)}/400/280`,
  }
}

/**
 * Búsqueda libre de lugares (no por categoría) vía el endpoint `forward` de la Search Box API de
 * Mapbox (mismo proveedor/token que el resto de la app, ver mapboxGeocoding.ts/nearbyPlacesSearch.ts)
 * — sin restricción geográfica DURA al destino del viaje (el viajero puede seguir buscando
 * cualquier sitio, dentro o fuera de su ruta), pero con `proximity` centrado en el destino cuando se
 * conoce, para que Mapbox priorice/ordene resultados cercanos por delante de homónimos lejanos (ej.
 * "Pantheon" en Roma por delante de uno sin relación en otro país) — `language=es` para nombres en
 * español cuando Mapbox tenga esa traducción disponible (si no, cae al idioma que la API devuelva
 * por defecto, sin traducción manual). `forward` en vez de `suggest`+`retrieve`: un único fetch por
 * tecleo en vez de dos pasos con session_token, más simple para un autocompletado que no necesita
 * optimizar la facturación por sesión.
 *
 * `bbox` (opcional, ver buildBoundingBox en nearbyPlacesSearch.ts): a diferencia de `proximity`
 * (solo reordena, nunca excluye), esto SÍ acota el área — usado por AddStopScreen.tsx, donde el
 * feedback de calidad pedía explícitamente que "museos" en Roma nunca devolviera resultados de otra
 * ciudad. El resto de usos (AttractionsFinder.tsx) se quedan solo con `proximity`, sin bbox, para no
 * cambiarles el comportamiento ya validado.
 */
export async function searchAttractions(
  query: string,
  proximity?: Coordinates | null,
  signal?: AbortSignal,
  bbox?: [number, number, number, number],
): Promise<AttractionSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed || !MAPBOX_TOKEN) return []

  const url = new URL('https://api.mapbox.com/search/searchbox/v1/forward')
  url.searchParams.set('q', trimmed)
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('language', 'es')
  url.searchParams.set('limit', '8')
  url.searchParams.set('types', 'poi')
  if (proximity) url.searchParams.set('proximity', `${proximity.lng},${proximity.lat}`)
  if (bbox) url.searchParams.set('bbox', bbox.join(','))

  const response = await fetch(url.toString(), { signal })
  if (!response.ok) return []

  const data = (await response.json()) as MapboxSearchBoxResponse
  return (data.features ?? []).map(toResult)
}
