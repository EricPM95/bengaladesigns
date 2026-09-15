/**
 * Nombre de zona reconocible por un turista (acordeón dorado "Hora de comer"/"Hora de cenar",
 * MealTimeAccordion.tsx) — /api/zona-turistica comprueba primero el caché permanente en Supabase
 * (tabla zona_turistica) antes de resolver con Claude; aquí solo hay un caché EN MEMORIA de la propia
 * sesión, mismo patrón que mealRecommendationsApi.ts/anchorTipsApi.ts, para no repetir la llamada de
 * red si el viajero pasa varias veces por la misma zona en bruto. `null` es un resultado válido y
 * cacheable: significa que ningún nombre turístico reconocible aplica a esa zona en bruto (ver
 * BLOQUE C, feedback de calidad) — el acordeón debe caer a "Hora de comer" sin zona en ese caso.
 */

const cache = new Map<string, string | null>()
const inFlight = new Map<string, Promise<string | null>>()

function cacheKey(destino: string, zonaBruta: string): string {
  return `${destino.toLowerCase()}|${zonaBruta.toLowerCase()}`
}

export async function fetchZonaTuristica(destino: string, zonaBruta: string): Promise<string | null> {
  const key = cacheKey(destino, zonaBruta)
  if (cache.has(key)) return cache.get(key) ?? null

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/zona-turistica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino, zona_bruta: zonaBruta }),
      })
      if (!response.ok) return null
      const data = await response.json()
      const zonaTuristica: string | null = typeof data.zona_turistica === 'string' ? data.zona_turistica : null
      cache.set(key, zonaTuristica)
      return zonaTuristica
    } catch {
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
