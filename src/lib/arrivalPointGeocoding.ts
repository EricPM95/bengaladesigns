import type { Coordinates } from './types'
import { searchAttractions } from './mapboxAttractionsSearch'
import { arrivalSearchQueryFor } from './arrivalIcon'

/**
 * Coordenadas reales de un punto de llegada (aeropuerto/puerto/estación) — para el marcador morado
 * del mapa de la ficha de Llegada y de RUTA. Overrides fijos para los aeropuertos ya nombrados en
 * MULTI_AIRPORT_CITIES (mockDayDetail.ts) — evita una llamada de geocoding para los casos ya
 * conocidos; el resto se resuelve en vivo vía Mapbox Search Box (mismo proveedor que el resto de la
 * app) y se cachea en memoria por sesión.
 */
const KNOWN_COORDINATES: Record<string, Coordinates> = {
  'fiumicino (fco)': { lat: 41.8003, lng: 12.2389 },
  'ciampino (cia)': { lat: 41.7998, lng: 12.5949 },
}

const cache = new Map<string, Coordinates | null>()
const inFlight = new Map<string, Promise<Coordinates | null>>()

/** `knownKey` opcional — para los aeropuertos con nombre+código ya fijo en KNOWN_COORDINATES (ej. "Fiumicino (FCO)"), evita el geocoding en vivo por completo. */
export async function resolveArrivalPointCoordinates(
  cityName: string,
  rawMode: string | null | undefined,
  knownKey?: string,
): Promise<Coordinates | null> {
  const known = knownKey ? KNOWN_COORDINATES[knownKey.toLowerCase()] : undefined
  if (known) return known

  const query = arrivalSearchQueryFor(cityName, rawMode)
  const key = query.toLowerCase()
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<Coordinates | null> => {
    try {
      const results = await searchAttractions(query)
      const coordinates = results[0]?.coordinates ?? null
      cache.set(key, coordinates)
      return coordinates
    } catch {
      cache.set(key, null)
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
