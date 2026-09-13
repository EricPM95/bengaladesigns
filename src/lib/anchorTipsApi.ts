/**
 * Tips de una ANCLA (lugar obligatorio del destino, ver Route.anchorNames) — /api/anchor-tips en el
 * servidor comprueba primero el caché permanente en Supabase (tabla tips_anclas) antes de generar
 * con búsqueda web real; aquí solo hay un cache EN MEMORIA de la propia sesión, para no repetir la
 * llamada de red si el viajero cierra y reabre la misma parada. Para paradas que NO son ancla, ver
 * el campo `localTip` de describeStopApi.ts en su lugar — ese nunca usa búsqueda web ni se cachea.
 */

export interface StopTip {
  tipo: 'practico' | 'secreto'
  texto: string
}

const cache = new Map<string, StopTip[]>()
const inFlight = new Map<string, Promise<StopTip[]>>()

function cacheKey(destino: string, lugar: string): string {
  return `${destino.toLowerCase()}|${lugar.toLowerCase()}`
}

export async function fetchAnchorTips(destino: string, lugar: string): Promise<StopTip[]> {
  const key = cacheKey(destino, lugar)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<StopTip[]> => {
    try {
      const response = await fetch('/api/anchor-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino, lugar }),
      })
      if (!response.ok) return []
      const data = await response.json()
      const tips: StopTip[] = Array.isArray(data.tips) ? data.tips : []
      cache.set(key, tips)
      return tips
    } catch {
      return []
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
