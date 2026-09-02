import type { ExperienceId } from './types'
import { isKnownExperienceId } from './experienceBank'

/** Pide a Claude 4-8 experiencias del banco de 18 relevantes para este destino. Devuelve null si la llamada falla. */
export async function suggestExperiences(destination: string): Promise<ExperienceId[] | null> {
  try {
    const response = await fetch('/api/suggest-experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination }),
    })
    if (!response.ok) return null

    const data = (await response.json()) as { experience_ids?: unknown }
    if (!Array.isArray(data.experience_ids)) return null

    // Defensa en profundidad: no confiar ciegamente en que el backend ya filtró bien — mismo
    // principio que mapCityTransitionFacts re-sanitiza hechos ya sanitizados en el servidor.
    const ids = data.experience_ids.filter((id): id is ExperienceId => typeof id === 'string' && isKnownExperienceId(id))
    return ids.length > 0 ? ids : null
  } catch {
    return null
  }
}
