import type { Coordinates } from './types'
import type { PlaceFilterCategory } from './placeCategories'

/**
 * Catálogo COMPLETO de lugares de un destino curado — el pool de la pantalla de explorar / añadir
 * parada. Sin tope, a diferencia del pool del cuestionario (20 lugares): aquel influye en la
 * generación y por eso es corto; este es edición manual sobre una ruta ya hecha.
 *
 * Es contenido estático del repo, así que se cachea en memoria por destino para toda la sesión: la
 * pantalla se abre y se cierra muchas veces seguidas y no tiene sentido volver a pedir los 61.
 */
export interface DestinationPlace {
  name: string
  coordinates: Coordinates
  filter_category: PlaceFilterCategory | null
  zone: string | null
  zone_label: string | null
  duration_min: number | null
  type: string | null
  tags: string[]
  level: number | null
  schedule: string | null
}

const cache = new Map<string, DestinationPlace[]>()
const inFlight = new Map<string, Promise<DestinationPlace[]>>()

export async function fetchDestinationPlaces(destination: string): Promise<DestinationPlace[]> {
  const key = destination.trim().toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<DestinationPlace[]> => {
    try {
      const response = await fetch('/api/destination-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      })
      if (!response.ok) return []
      const data = await response.json()
      const places: DestinationPlace[] = data?.found === true && Array.isArray(data.places) ? data.places : []
      // Un destino sin catálogo curado devuelve [] y no se cachea: si mañana lo tiene, se verá sin
      // tener que recargar la app.
      if (places.length > 0) cache.set(key, places)
      return places
    } catch {
      return []
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
