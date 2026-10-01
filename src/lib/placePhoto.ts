import type { Route } from './types'
import { addDaysToIso } from './dateRange'

/**
 * Foto real de un lugar. Desde el Prompt 5 la resuelve el SERVIDOR (`/api/place-photo`), no el
 * cliente, por dos razones:
 *
 * 1. La clave de Unsplash no puede salir al bundle público. Con `VITE_` se publicaría, y sin
 *    prefijo Vite no la expone — así que la llamada tiene que vivir donde ya viven la de Anthropic
 *    y la service key de Supabase.
 * 2. La caché pasa a ser COMPARTIDA (Supabase) en vez de por sesión: cada foto se busca una sola
 *    vez para todos los viajeros, que es lo que hace viable el límite de 50 peticiones/hora.
 *
 * El servidor aplica la cascada completa: caché -> Unsplash (solo si la foto MENCIONA el lugar en
 * su descripción o tags) -> Wikipedia -> nada. Aquí solo queda una memoria de sesión para no
 * repetir la misma petición al backend en cada render.
 */

const TIMEOUT_MS = 6000

export interface PlacePhoto {
  /** `propia`: una foto nuestra del destino (public/fotos/, ver data/dias/<destino>/_fotos.json). */
  source: 'unsplash' | 'wikipedia' | 'propia'
  /** Para listas y miniaturas (Unsplash w=200; en Wikipedia es la misma URL en todos los tamaños). */
  thumb: string
  /** Para tarjetas y fichas (Unsplash w=400). */
  small: string
  /** Para cabeceras a pantalla completa (Unsplash w=1080). */
  regular: string
  /** Placeholder mientras carga — solo lo traen las de Unsplash. */
  blurHash: string | null
  /** Unsplash exige atribución visible allí donde la foto se ve a tamaño real; las de Wikipedia no. */
  /** (`site`: «Unsplash» o «Pexels» en las fotos propias; sin él, Unsplash.) */
  attribution: { photographer: string; photographerUrl: string; unsplashUrl: string; site?: string } | null
}

const cache = new Map<string, PlacePhoto | null>()

// ── Lo guardado en el navegador (PARA_CODE_TODO_2026-10-01, paso 7) ─────────────────────────────────────────────────────────────
// Una foto ya resuelta no se vuelve a pedir en el siguiente viaje, ni en Explorar ni en Añadir parada: se guarda 24 h. Las fotos propias
// llevan su versión en la URL (`?v=`), así que una foto que cambia cambia de dirección y el navegador la renueva sola.
const STORE_PREFIX = 'photo:v1:'
const STORE_TTL_MS = 24 * 60 * 60 * 1000
const STORE_MAX_ENTRIES = 400

function readStored(key: string): PlacePhoto | undefined {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as { at: number; photo: PlacePhoto }
    if (!parsed?.photo || Date.now() - parsed.at > STORE_TTL_MS) {
      localStorage.removeItem(STORE_PREFIX + key)
      return undefined
    }
    return parsed.photo
  } catch {
    return undefined
  }
}

function writeStored(key: string, photo: PlacePhoto): void {
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify({ at: Date.now(), photo }))
    // Sin crecer sin fin: pasadas las 400, se tiran las más viejas.
    const keys = Object.keys(localStorage).filter((name) => name.startsWith(STORE_PREFIX))
    if (keys.length > STORE_MAX_ENTRIES) {
      const dated = keys.map((name) => ({ name, at: (JSON.parse(localStorage.getItem(name) ?? '{}') as { at?: number }).at ?? 0 })).sort((a, b) => a.at - b.at)
      for (const { name } of dated.slice(0, keys.length - STORE_MAX_ENTRIES)) localStorage.removeItem(name)
    }
  } catch {
    // sin espacio o sin localStorage: se sigue sin guardar
  }
}

// ── Las fotos del pool, de una vez ────────────────────────────────────────────────────────────────────────────────────────────
const poolPhotos = new Map<string, string>()
const poolInFlight = new Map<string, Promise<void>>()

/** La foto pequeña de un lugar del pool, si ya está traída (o guardada de otra vez). */
export function getPoolPhoto(destination: string, name: string): string | null {
  const key = `${destination.trim().toLowerCase()}|${name.toLowerCase()}`
  const cached = poolPhotos.get(key)
  if (cached) return cached
  try {
    const raw = localStorage.getItem(`poolphoto:v1:${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; url: string }
    if (Date.now() - parsed.at > STORE_TTL_MS) return null
    poolPhotos.set(key, parsed.url)
    return parsed.url
  } catch {
    return null
  }
}

/**
 * Trae en una sola petición las fotos pequeñas (las ligeras: 640 px) de los lugares del pool y las deja guardadas y precargadas. Se llama en
 * cuanto se sabe el destino, mientras el viajero rellena los pasos de antes: al llegar al pool, salen al momento.
 */
export function prefetchPoolPhotos(destination: string, names: string[], dateIso?: string | null): Promise<void> {
  const pending = names.filter((name) => !getPoolPhoto(destination, name))
  if (pending.length === 0) return Promise.resolve()
  const flightKey = `${destination.toLowerCase()}|${pending.join('|')}`
  const running = poolInFlight.get(flightKey)
  if (running) return running
  const job = fetch('/api/pool-photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination, names: pending, ...(dateIso ? { date: dateIso } : {}) }),
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { photos?: Record<string, { url: string }> } | null) => {
      for (const [name, entry] of Object.entries(data?.photos ?? {})) {
        if (!entry?.url) continue
        const key = `${destination.trim().toLowerCase()}|${name.toLowerCase()}`
        poolPhotos.set(key, entry.url)
        try {
          localStorage.setItem(`poolphoto:v1:${key}`, JSON.stringify({ at: Date.now(), url: entry.url }))
        } catch {
          // sin espacio: se sigue en memoria
        }
        // Precargada: cuando la baldosa la pida, ya está en el navegador.
        if (typeof Image !== 'undefined') new Image().src = entry.url
      }
    })
    .catch(() => undefined)
    .finally(() => poolInFlight.delete(flightKey))
  poolInFlight.set(flightKey, job)
  return job
}
const inFlight = new Map<string, Promise<PlacePhoto | null>>()

/** (Con la fecha del día: las fotos de unas fechas, las de Navidad, dependen de ella.) */
function cacheKey(name: string, city: string, dateIso?: string | null, excludeOwn = false): string {
  return `${name.toLowerCase()}|${city.toLowerCase()}|${dateIso ?? ''}${excludeOwn ? '|sin_propia' : ''}`
}

/**
 * Ficha completa de la foto de un lugar — la necesita quien tenga que pintar la atribución. Nunca
 * lanza: sin foto (o con el backend caído) devuelve null y el componente enseña su icono de
 * categoría, que es el comportamiento de siempre.
 */
export async function fetchPlacePhotoDetail(name: string, city: string, wikipediaTitle?: string | null, dateIso?: string | null, excludeOwn = false): Promise<PlacePhoto | null> {
  const key = cacheKey(name, city, dateIso, excludeOwn)
  if (cache.has(key)) return cache.get(key) ?? null
  const stored = readStored(key)
  if (stored) {
    cache.set(key, stored)
    return stored
  }
  // Varias tarjetas del mismo lugar en pantalla no deben disparar varias peticiones idénticas.
  const pending = inFlight.get(key)
  if (pending) return pending

  const job = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const response = await fetch('/api/place-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, wikipedia_title: wikipediaTitle ?? null, ...(dateIso ? { date: dateIso } : {}), ...(excludeOwn ? { exclude_own: true } : {}) }),
        signal: controller.signal,
      })
      if (!response.ok) return null
      const data = await response.json()
      if (data?.photo_source === 'unsplash') {
        const photo: PlacePhoto = {
          source: 'unsplash',
          thumb: data.unsplash_thumb ?? data.photo_url,
          small: data.unsplash_small ?? data.photo_url,
          regular: data.unsplash_regular ?? data.photo_url,
          blurHash: data.unsplash_blur_hash ?? null,
          attribution: data.unsplash_photographer
            ? {
                photographer: data.unsplash_photographer,
                photographerUrl: data.unsplash_photographer_url ?? '',
                unsplashUrl: data.unsplash_url ?? 'https://unsplash.com',
              }
            : null,
        }
        return photo.thumb ? photo : null
      }
      if (data?.photo_source === 'propia' && data.photo_url) {
        // Foto nuestra: la grande para la ficha y la pequeña para tarjetas y miniaturas. El crédito, solo si lo trae.
        const credit = data.photo_credit
        const photo: PlacePhoto = {
          source: 'propia',
          thumb: data.photo_small ?? data.photo_url,
          small: data.photo_small ?? data.photo_url,
          regular: data.photo_url,
          blurHash: null,
          attribution: credit?.autor && credit.enlace ? { photographer: credit.autor, photographerUrl: credit.enlace, unsplashUrl: credit.enlace, site: credit.fuente } : null,
        }
        return photo
      }
      if (data?.photo_source === 'wikipedia' && data.photo_url) {
        // Wikipedia devuelve una sola imagen: la misma sirve para los tres tamaños.
        const photo: PlacePhoto = { source: 'wikipedia', thumb: data.photo_url, small: data.photo_url, regular: data.photo_url, blurHash: null, attribution: null }
        return photo
      }
      return null
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  })()

  inFlight.set(key, job)
  const result = await job
  inFlight.delete(key)
  cache.set(key, result)
  if (result) writeStored(key, result)
  return result
}

/**
 * Solo la URL, en el tamaño que pida quien llama — la firma que ya usaban las miniaturas y las
 * paradas de la ruta. `wikipediaTitle` se sigue aceptando para destinos SIN JSON curado, donde el
 * servidor no tiene de dónde sacarlo; en los curados lo lee él del propio destino.
 */
export async function fetchPlacePhoto(
  name: string,
  city: string,
  wikipediaTitle?: string | null,
  size: 'thumb' | 'small' | 'regular' = 'small',
  dateIso?: string | null,
  excludeOwn = false,
): Promise<string | null> {
  const photo = await fetchPlacePhotoDetail(name, city, wikipediaTitle, dateIso, excludeOwn)
  return photo ? photo[size] : null
}

/**
 * El nombre con el que se pide la foto de una parada: el suyo y, si es una experiencia o un paseo nocturno,
 * "… (noche)", para que el servidor busque ese lugar de noche (y, si no hay, ese mismo lugar de día; nunca otro).
 */
export function photoNameOf(stop: { name: string; photoName?: string | null; isNightExperience?: boolean; isNightView?: boolean }): string {
  const name = stop.photoName ?? stop.name
  // (Regla 411: una parada lleva siempre su foto de día, aunque caiga después del atardecer —un mirador que llega ya de
  // noche—; la de noche, solo las experiencias y los paseos nocturnos.)
  const night = Boolean(stop.isNightExperience)
  return night && !/\(noche\)$|\sde noche$/i.test(name) ? `${name} (noche)` : name
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
  // (La fecha real de cada día, si el viaje la tiene: las fotos de Navidad solo salen en sus fechas.)
  const startIso = route.answers.dateRange?.start ?? null
  const jobs = route.days.flatMap((day) =>
    day.stops.map((stop) =>
      // `regular`: la foto de una parada se ve a pantalla completa en su ficha.
      stop.isBreak || stop.fixedPhotoUrl || (stop.isFreeWalk && !stop.photoName)
        ? Promise.resolve()
        : fetchPlacePhoto(photoNameOf(stop), day.city, stop.wikipediaTitle, 'regular', startIso ? addDaysToIso(startIso, day.dayNumber - 1) : null, Boolean(stop.noOwnPhoto)).then((photo) => {
            if (photo) stop.photoUrl = photo
          }),
    ),
  )
  await Promise.allSettled(jobs)
  // Nunca la misma foto en dos tarjetas del mismo día (PARA_CODE_TODO_2026-10-01, 5.2): la segunda, sin foto (el color neutro).
  for (const day of route.days) {
    const used = new Set<string>()
    for (const stop of day.stops) {
      if (!stop.photoUrl) continue
      if (used.has(stop.photoUrl)) stop.photoUrl = ''
      else used.add(stop.photoUrl)
    }
  }
  return route
}
