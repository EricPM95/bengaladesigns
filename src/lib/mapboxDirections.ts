import type { Coordinates } from './types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export type RoutingProfile = 'walking' | 'driving'

export interface RoutedDistance {
  meters: number
  minutes: number
}

interface DirectionsResponse {
  routes?: { distance: number; duration: number }[]
}

function cacheKey(profile: RoutingProfile, a: Coordinates, b: Coordinates): string {
  const round = (n: number) => n.toFixed(5)
  return `${profile}:${round(a.lat)},${round(a.lng)}:${round(b.lat)},${round(b.lng)}`
}

async function fetchRoute(profile: RoutingProfile, a: Coordinates, b: Coordinates, signal?: AbortSignal): Promise<RoutedDistance | null> {
  if (!MAPBOX_TOKEN) return null
  try {
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${a.lng},${a.lat};${b.lng},${b.lat}`)
    url.searchParams.set('access_token', MAPBOX_TOKEN)
    url.searchParams.set('overview', 'false')
    url.searchParams.set('alternatives', 'false')

    const response = await fetch(url.toString(), { signal })
    if (!response.ok) return null

    const data = (await response.json()) as DirectionsResponse
    const route = data.routes?.[0]
    if (!route) return null

    return { meters: Math.round(route.distance), minutes: Math.max(1, Math.round(route.duration / 60)) }
  } catch {
    return null
  }
}

// Cacheado en memoria por (perfil, par de coordenadas) — misma sesión, mismo par de puntos nunca
// repite la llamada a la API, sea que lo pida un solo conector o varios renders del mismo.
const cache = new Map<string, Promise<RoutedDistance | null>>()

/** Distancia/tiempo real vía Mapbox Directions API (mismo proveedor/token que el resto de la app — geocoding, Search Box, mapas). null si falla (sin token, sin red, sin ruta encontrada) — quien llama decide el fallback. */
export function getRoutedDistance(profile: RoutingProfile, a: Coordinates, b: Coordinates, signal?: AbortSignal): Promise<RoutedDistance | null> {
  const key = cacheKey(profile, a, b)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = fetchRoute(profile, a, b, signal)
  cache.set(key, pending)
  // Si falla, no dejamos el fallo cacheado para siempre — un reintento posterior (otro conector,
  // otro render) puede volver a intentarlo en vez de quedarse con `null` cacheado indefinidamente.
  pending.then((result) => {
    if (result === null) cache.delete(key)
  })
  return pending
}
