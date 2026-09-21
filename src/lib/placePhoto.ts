import type { Route } from './types'

/**
 * Foto real de una parada vía Wikipedia en español (búsqueda + resumen con thumbnail) — mejor
 * esfuerzo, nunca bloquea ni rompe la ruta: si falla, tarda demasiado, o no hay página/miniatura,
 * simplemente no se sustituye nada y la parada se queda con el placeholder de picsum.photos que le
 * puso mapGeneratedRoute.ts (ver buildPlaceholderPhotoUrl ahí — ese SÍ es aleatorio, sin relación
 * con el lugar; esto es el intento real de mostrar una foto que corresponda).
 */

const TIMEOUT_MS = 4000
/** Wikipedia devuelve miniaturas de icono (ej. de una página de desambiguación) a veces — se
    descartan por ser peor que el propio placeholder. */
const MIN_THUMBNAIL_WIDTH = 300

const cache = new Map<string, string | null>()

function cacheKey(name: string, city: string): string {
  return `${name.toLowerCase()}|${city.toLowerCase()}`
}

/**
 * Un `wikipedia_title` del JSON del destino puede llevar prefijo de idioma ("en:Colosseum",
 * "it:Giardino degli Aranci"). Existe porque la foto de cabecera del artículo en español no siempre
 * sirve: la del Coliseo es una foto del "Europe Day 2024", la de la Galería Borghese es su
 * logotipo, y la de la Galería Nacional de Arte Moderno también. Sin prefijo, español.
 */
function parseWikipediaTitle(value: string): { lang: string; title: string } {
  const match = value.match(/^([a-z]{2}):(.+)$/)
  return match ? { lang: match[1], title: match[2] } : { lang: 'es', title: value }
}

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    return response
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * `wikipediaTitle` (opcional) salta la búsqueda por nombre y va directo a ese artículo. La búsqueda
 * acierta en la gran mayoría de los lugares, pero cuando falla lo hace de formas que no se arreglan
 * afinando el texto: buscar "Barrio Judío Roma" devolvía una judería de Segovia y "Jardín de los
 * Naranjos Roma" los jardines de Versalles. Solo se declara en el dato donde hace falta — ver
 * `wikipedia_title` en data/pipeline_v2/<destino>.json.
 */
export async function fetchPlacePhoto(name: string, city: string, wikipediaTitle?: string | null): Promise<string | null> {
  const key = cacheKey(wikipediaTitle ? `title:${wikipediaTitle}` : name, city)
  if (cache.has(key)) return cache.get(key) ?? null

  if (wikipediaTitle) {
    const { lang, title } = parseWikipediaTitle(wikipediaTitle)
    const response = await fetchWithTimeout(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    const data = response?.ok ? await response.json() : null
    const source = data?.thumbnail?.source
    const photo = typeof source === 'string' && (data?.thumbnail?.width ?? 0) >= MIN_THUMBNAIL_WIDTH ? source : null
    cache.set(key, photo)
    return photo
  }

  try {
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      `${name} ${city}`,
    )}&format=json&origin=*&srlimit=1`
    const searchResponse = await fetchWithTimeout(searchUrl)
    if (!searchResponse?.ok) {
      cache.set(key, null)
      return null
    }
    const searchData = await searchResponse.json()
    const title = searchData?.query?.search?.[0]?.title
    if (typeof title !== 'string' || !title) {
      cache.set(key, null)
      return null
    }

    const summaryUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const summaryResponse = await fetchWithTimeout(summaryUrl)
    if (!summaryResponse?.ok) {
      cache.set(key, null)
      return null
    }
    const summaryData = await summaryResponse.json()
    const thumbnailSource = summaryData?.thumbnail?.source
    const thumbnailWidth = summaryData?.thumbnail?.width ?? 0
    const photo = typeof thumbnailSource === 'string' && thumbnailWidth >= MIN_THUMBNAIL_WIDTH ? thumbnailSource : null
    cache.set(key, photo)
    return photo
  } catch {
    cache.set(key, null)
    return null
  }
}

/**
 * Sustituye en el sitio el photoUrl placeholder de cada parada por una foto real cuando se
 * encuentra una — todas las paradas se resuelven EN PARALELO (Promise.allSettled), así que el
 * coste total añadido a la pantalla de carga es como mucho ~TIMEOUT_MS, no la suma de todas.
 * Llamar DESPUÉS de mapGeneratedRouteToRoute/applyRealStopSchedule y ANTES de mostrar la ruta al
 * viajero (ver finalizeRoute en App.tsx) — los Stop recién mapeados no están compartidos con nada
 * más todavía, así que mutarlos aquí es seguro.
 */
export async function enrichRoutePhotos(route: Route): Promise<Route> {
  const jobs = route.days.flatMap((day) =>
    day.stops.map((stop) =>
      fetchPlacePhoto(stop.name, day.city, stop.wikipediaTitle).then((photo) => {
        if (photo) stop.photoUrl = photo
      }),
    ),
  )
  await Promise.allSettled(jobs)
  return route
}
