/**
 * Contenido editorial real (Resumen de StopDetailSheet) de UNA parada — llamada bajo demanda a
 * Claude (/api/describe-stop) al abrir la ficha, nunca en el pipeline de generación de la ruta.
 * Cache en memoria por `name|city` (misma parada reabierta en la sesión no vuelve a pedirse) — se
 * pierde al recargar la página, igual que el cache de getRoutedDistance en mapboxDirections.ts.
 */

import type { StopTip } from './anchorTipsApi'

export interface StopDescription {
  description: string
  whatYoullSee: string
  whyRecommended: string
  address: string | null
  officialWebsite: string | null
  /** Horario con matices (temporada/día de la semana) cuando aplica — null si el rango simple de
      Stop.hours ya lo dice todo. Ver "TIPS DE ORO"/"HORARIOS" del feedback de calidad. */
  hoursDetail: string | null
  /** 0-3 tips generados solo con el conocimiento de Claude (sin búsqueda web) — para paradas que NO
      son ancla, ver anchorTipsApi.ts para esas (esas sí usan búsqueda web). Entradas combinadas,
      acceso gratuito parcial, horarios estratégicos, datos prácticos — nunca relleno genérico. */
  tips: StopTip[]
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
        hoursDetail: data.hours_detail ?? null,
        tips: Array.isArray(data.tips) ? data.tips : [],
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

/**
 * StopDescription "local", sin llamar a Claude — para paradas del pipeline v2 (ver
 * routeAlgorithm.js) que ya traen `description`/`tip` reales del JSON curado a mano. describe-stop
 * es puro coste evitable ahí: la parada ya tiene contenido editorial real, pedírselo a Claude de
 * nuevo al abrir la ficha no añade nada, solo gasta. whatYoullSee/whyRecommended/address/
 * officialWebsite quedan vacíos (el JSON curado no los tiene) — StopDetailSheet.tsx ya omite esas
 * secciones cuando faltan, así que la ficha se queda sin ellas en vez de inventarlas.
 */
export function buildCuratedStopDescription(description: string, tip?: string | null): StopDescription {
  return {
    description,
    whatYoullSee: '',
    whyRecommended: '',
    address: null,
    officialWebsite: null,
    hoursDetail: null,
    tips: tip ? [{ tipo: 'practico', texto: tip }] : [],
  }
}
