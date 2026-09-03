import type { ExperienceId, PlaceCandidate } from './types'
import { isKnownExperienceId } from './experienceBank'

interface RawPlace {
  id?: unknown
  name?: unknown
  description?: unknown
  category?: unknown
  is_main_attraction?: unknown
  latitude?: unknown
  longitude?: unknown
}

/** Defensa en profundidad, mismo principio que sanitizeExperienceIds en el backend — no confiar ciegamente en que el servidor ya validó bien cada línea NDJSON. */
function sanitizeOnePlace(raw: unknown): PlaceCandidate | null {
  const place = raw as RawPlace
  if (!place || typeof place.id !== 'string' || typeof place.name !== 'string' || !place.name.trim()) return null
  return {
    id: place.id,
    name: place.name,
    description: typeof place.description === 'string' ? place.description : '',
    category: typeof place.category === 'string' && isKnownExperienceId(place.category) ? place.category : 'joyas_ocultas',
    isMainAttraction: place.is_main_attraction === true,
    coordinates: {
      lat: typeof place.latitude === 'number' ? place.latitude : 0,
      lng: typeof place.longitude === 'number' ? place.longitude : 0,
    },
  }
}

/**
 * Pide a Claude una lista amplia (18-30) de lugares concretos del destino, afines a las
 * experiencias ya elegidas — el backend (/api/suggest-places) la va generando y transmitiendo como
 * NDJSON (una línea `{"type":"place",...}` por cada lugar en cuanto Claude termina de escribirlo,
 * en vez de esperar a la respuesta completa) para que "Elige lugares" pueda pintarlos según van
 * llegando. `onPlace` se llama una vez por cada lugar, en el mismo orden en que Claude los generó.
 *
 * Devuelve `true` si el stream terminó con éxito (línea final `{"type":"done"}`), `false` si falló
 * del todo o a medias (`{"type":"error"}`, la petición HTTP falló, o la conexión se cortó) — quien
 * llama decide qué hacer con lo ya recibido hasta ese punto (ver suggestPlacesInBackground.ts /
 * suggestPlacesOnDemand.ts: con 0 lugares es un fallo real, con algunos ya en pantalla no hace
 * falta alarmar al viajero, solo dejar de mostrar "cargando más").
 */
export async function suggestPlaces(destination: string, experienceIds: ExperienceId[], onPlace: (place: PlaceCandidate) => void): Promise<boolean> {
  try {
    const response = await fetch('/api/suggest-places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, experience_ids: experienceIds }),
    })
    if (!response.ok || !response.body) return false

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let done = false
    let errored = false

    while (true) {
      const { done: streamDone, value } = await reader.read()
      if (streamDone) break
      buffer += decoder.decode(value, { stream: true })

      let newlineIndex: number
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        if (!line) continue

        let parsed: { type?: unknown; place?: unknown }
        try {
          parsed = JSON.parse(line)
        } catch {
          continue
        }

        if (parsed.type === 'place') {
          const place = sanitizeOnePlace(parsed.place)
          if (place) onPlace(place)
        } else if (parsed.type === 'done') {
          done = true
        } else if (parsed.type === 'error') {
          errored = true
        }
      }
    }

    return done && !errored
  } catch {
    return false
  }
}
