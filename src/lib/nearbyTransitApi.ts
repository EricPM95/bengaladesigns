/**
 * Transporte público cercano a UN lugar concreto (StopDetailSheet.tsx, pestaña "Resumen") —
 * /api/nearby-transit comprueba primero el caché permanente en Supabase (tabla transporte_cercano)
 * antes de generar con búsqueda web real; aquí solo hay un cache EN MEMORIA de la propia sesión. A
 * diferencia de anchorTipsApi.ts (solo anclas), esto se pide para CUALQUIER parada — es un hecho
 * geográfico fijo, independiente del viajero o del viaje.
 */

export interface TransitStop {
  linea: string
  parada: string
}

export interface NearbyTransit {
  metro: TransitStop[]
  bus: TransitStop[]
}

const cache = new Map<string, NearbyTransit>()
const inFlight = new Map<string, Promise<NearbyTransit>>()

function cacheKey(destino: string, lugar: string): string {
  return `${destino.toLowerCase()}|${lugar.toLowerCase()}`
}

const EMPTY: NearbyTransit = { metro: [], bus: [] }

export async function fetchNearbyTransit(destino: string, lugar: string): Promise<NearbyTransit> {
  const key = cacheKey(destino, lugar)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<NearbyTransit> => {
    try {
      const response = await fetch('/api/nearby-transit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino, lugar }),
      })
      if (!response.ok) return EMPTY
      const data = await response.json()
      const result: NearbyTransit = {
        metro: Array.isArray(data.metro) ? data.metro : [],
        bus: Array.isArray(data.bus) ? data.bus : [],
      }
      cache.set(key, result)
      return result
    } catch {
      return EMPTY
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
