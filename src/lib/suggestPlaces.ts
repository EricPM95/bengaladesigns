import type { ExperienceId, PlaceCandidate } from './types'
import { isKnownExperienceId } from './experienceBank'

interface RawPlace {
  id?: unknown
  name?: unknown
  description?: unknown
  category?: unknown
  latitude?: unknown
  longitude?: unknown
}

/** Pide a Claude una lista amplia (18-30) de lugares concretos del destino, afines a las experiencias ya elegidas. Devuelve null si la llamada falla. */
export async function suggestPlaces(destination: string, experienceIds: ExperienceId[]): Promise<PlaceCandidate[] | null> {
  try {
    const response = await fetch('/api/suggest-places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, experience_ids: experienceIds }),
    })
    if (!response.ok) return null

    const data = (await response.json()) as { places?: unknown }
    if (!Array.isArray(data.places)) return null

    // Defensa en profundidad, mismo principio que sanitizeExperienceIds en el backend — no confiar
    // ciegamente en que el servidor ya validó bien.
    const places: PlaceCandidate[] = (data.places as RawPlace[])
      .filter((place): place is RawPlace & { id: string; name: string } => typeof place.id === 'string' && typeof place.name === 'string' && place.name.trim().length > 0)
      .map((place) => ({
        id: place.id,
        name: place.name,
        description: typeof place.description === 'string' ? place.description : '',
        category: typeof place.category === 'string' && isKnownExperienceId(place.category) ? place.category : 'joyas_ocultas',
        coordinates: {
          lat: typeof place.latitude === 'number' ? place.latitude : 0,
          lng: typeof place.longitude === 'number' ? place.longitude : 0,
        },
      }))

    return places.length > 0 ? places : null
  } catch {
    return null
  }
}
