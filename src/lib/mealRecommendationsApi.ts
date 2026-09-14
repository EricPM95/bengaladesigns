/**
 * "Nuestra selección" del acordeón dorado "Hora de comer"/"Hora de cenar" (DayDetailPanel.tsx) —
 * /api/meal-recommendations en el servidor comprueba primero el caché permanente en Supabase (tabla
 * zona_restaurantes) antes de generar con búsqueda web real; aquí solo hay un caché EN MEMORIA de la
 * propia sesión, mismo patrón que anchorTipsApi.ts, para no repetir la llamada de red si el viajero
 * cierra y reabre el mismo acordeón.
 */

export interface CuratedRestaurant {
  nombre: string
  foto: string
  motivo: string
  presupuesto: '€' | '€€' | '€€€'
}

type Franja = 'comida' | 'cena'

const cache = new Map<string, CuratedRestaurant[]>()
const inFlight = new Map<string, Promise<CuratedRestaurant[]>>()

function cacheKey(destino: string, zona: string, franja: Franja): string {
  return `${franja}|${destino.toLowerCase()}|${zona.toLowerCase()}`
}

export async function fetchCuratedRestaurants(destino: string, zona: string, franja: Franja): Promise<CuratedRestaurant[]> {
  const key = cacheKey(destino, zona, franja)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<CuratedRestaurant[]> => {
    try {
      const response = await fetch('/api/meal-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino, zona, franja }),
      })
      if (!response.ok) return []
      const data = await response.json()
      const seleccion: CuratedRestaurant[] = Array.isArray(data.seleccion) ? data.seleccion : []
      cache.set(key, seleccion)
      return seleccion
    } catch {
      return []
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
