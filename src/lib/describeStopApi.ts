/**
 * Contenido editorial real (Resumen de StopDetailSheet) de UNA parada — llamada bajo demanda a
 * Claude (/api/describe-stop) al abrir la ficha, nunca en el pipeline de generación de la ruta.
 * Cache en memoria por `name|city` (misma parada reabierta en la sesión no vuelve a pedirse) — se
 * pierde al recargar la página, igual que el cache de getRoutedDistance en mapboxDirections.ts.
 */

export interface StopDescription {
  description: string
  whatYoullSee: string
  whyRecommended: string
  address: string | null
  officialWebsite: string | null
}

const cache = new Map<string, StopDescription>()
const inFlight = new Map<string, Promise<StopDescription | null>>()

function cacheKey(name: string, city: string): string {
  return `${name.toLowerCase()}|${city.toLowerCase()}`
}

export async function describeStop(name: string, city: string, category?: string): Promise<StopDescription | null> {
  const key = cacheKey(name, city)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<StopDescription | null> => {
    try {
      const response = await fetch('/api/describe-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, category }),
      })
      if (!response.ok) return null
      const data = await response.json()
      const result: StopDescription = {
        description: data.description ?? '',
        whatYoullSee: data.what_youll_see ?? '',
        whyRecommended: data.why_recommended ?? '',
        address: data.address ?? null,
        officialWebsite: data.official_website ?? null,
      }
      if (!result.description) return null
      cache.set(key, result)
      return result
    } catch {
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
