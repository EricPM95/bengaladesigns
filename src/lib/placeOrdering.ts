import type { ExperienceId, PlaceCandidate } from './types'

/**
 * Ordena los lugares sugeridos para que los afines a las experiencias ya elegidas salgan primero,
 * intercalados por turnos entre categorías (no en bloques monótonos "10 de una, luego 5 de otra")
 * — un lugar de la primera categoría elegida, uno de la segunda, etc., dando otra vuelta hasta
 * agotar cada categoría. Los lugares que no encajan en ninguna categoría elegida van al final, en
 * su orden original.
 */
export function orderPlacesByExperience(places: PlaceCandidate[], selectedExperiences: ExperienceId[]): PlaceCandidate[] {
  const selectedSet = new Set(selectedExperiences)
  const buckets = selectedExperiences.map((id) => places.filter((place) => place.category === id))
  const rest = places.filter((place) => !selectedSet.has(place.category))

  const interleaved: PlaceCandidate[] = []
  let remaining = buckets.reduce((sum, bucket) => sum + bucket.length, 0)
  let cursor = 0
  while (remaining > 0) {
    const bucket = buckets[cursor % buckets.length]
    const next = bucket.shift()
    if (next) {
      interleaved.push(next)
      remaining -= 1
    }
    cursor += 1
  }

  return [...interleaved, ...rest]
}
