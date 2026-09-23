/**
 * "Nuestra selección" del acordeón dorado "Hora de comer"/"Hora de cenar" (DayDetailPanel.tsx) —
 * /api/meal-recommendations en el servidor comprueba primero el caché permanente en Supabase (tabla
 * zona_restaurantes) antes de generar con búsqueda web real; aquí solo hay un caché EN MEMORIA de la
 * propia sesión, mismo patrón que anchorTipsApi.ts, para no repetir la llamada de red si el viajero
 * cierra y reabre el mismo acordeón.
 */

import type { Coordinates } from './types'

export interface CuratedRestaurant {
  nombre: string
  foto: string
  motivo: string
  presupuesto: '€' | '€€' | '€€€'
  /** null si Claude no dio coordenadas válidas (o si el resultado viene de un caché anterior a este campo) — ese restaurante se muestra igual en la lista, solo se omite su pin en el mapa (MealDetailSheet.tsx). */
  latitude: number | null
  longitude: number | null
}

type Franja = 'comida' | 'cena'

const cache = new Map<string, CuratedRestaurant[]>()
const inFlight = new Map<string, Promise<CuratedRestaurant[]>>()

// Con coordenadas: en un destino curado la selección son los restaurantes del JSON cercanos a ESE
// punto, así que dos paradas de la misma zona pueden dar listas distintas.
function cacheKey(destino: string, zona: string, franja: Franja, coordinates?: Coordinates): string {
  const where = coordinates ? `|${coordinates.lat.toFixed(3)},${coordinates.lng.toFixed(3)}` : ''
  return `${franja}|${destino.toLowerCase()}|${zona.toLowerCase()}${where}`
}

export async function fetchCuratedRestaurants(destino: string, zona: string, franja: Franja, coordinates?: Coordinates): Promise<CuratedRestaurant[]> {
  const key = cacheKey(destino, zona, franja, coordinates)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<CuratedRestaurant[]> => {
    try {
      const response = await fetch('/api/meal-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino, zona, franja, coordinates }),
      })
      if (!response.ok) return []
      const data = await response.json()
      const raw: unknown[] = Array.isArray(data.seleccion) ? data.seleccion : []
      // Coerción defensiva de latitude/longitude — filas cacheadas en Supabase ANTES de que este
      // campo existiera vienen sin ellas (undefined, no null), ver zona_restaurantes.sql.
      const seleccion: CuratedRestaurant[] = raw.map((entry) => {
        const restaurant = entry as CuratedRestaurant
        return {
          ...restaurant,
          latitude: typeof restaurant.latitude === 'number' ? restaurant.latitude : null,
          longitude: typeof restaurant.longitude === 'number' ? restaurant.longitude : null,
        }
      })
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
