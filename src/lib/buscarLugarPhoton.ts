import type { Coordinates } from './types'

/**
 * (V45) BUSCAR UN LUGAR CON PHOTON (https://photon.komoot.io, datos de OpenStreetMap). Se usa en lugar de Mapbox Search porque los resultados de Mapbox no se pueden guardar y estos sí
 * (OpenStreetMap, licencia ODbL: se guarda la dirección y el punto, y el mapa lleva «© OpenStreetMap contributors»).
 *
 * Condiciones de la instancia pública (photon.komoot.io): sin cifra de límite; «uso razonable», con aviso de que el abuso se frena o se bloquea; no prohíbe buscar mientras se escribe;
 * no pide clave, ni User-Agent, ni Referer. Cómo se cumple: SOLO se busca cuando el viajero deja de escribir (el que llama espera ≥ 700 ms), con 3 letras como mínimo, cancelando la petición
 * anterior (`AbortController`), con un máximo de 8 resultados y sin repetir una búsqueda igual (caché en memoria de la sesión). Sin parámetro `lang` (la instancia solo admite unos pocos idiomas y
 * con otro devuelve error): los nombres salen en el idioma local.
 */
export const MIN_LETRAS_PHOTON = 3
export const ESPERA_PHOTON_MS = 700

/** Hasta dónde llega «la ciudad del viaje»: se descarta lo que queda a más de esto de cualquier punto del viaje (las islas, como Lanzarote, se miden desde sus paradas). */
export const RADIO_CIUDAD_KM = 30

export interface LugarPhoton {
  /** Primera línea: «Via del Corso, 18» o el nombre del sitio. */
  titulo: string
  /** Segunda línea: «00186 Roma». */
  detalle: string
  /** Lo que se guarda como dirección: «Via del Corso, 18, 00186 Roma». */
  direccion: string
  lat: number
  lng: number
}

interface FeaturePhoton {
  geometry?: { coordinates?: [number, number] }
  properties?: { name?: string; street?: string; housenumber?: string; postcode?: string; city?: string; district?: string; locality?: string; county?: string; state?: string; country?: string }
}

const RAD = Math.PI / 180
/** Distancia en km entre dos puntos (haversine). */
export function distanciaKm(a: Coordinates, b: Coordinates): number {
  const dLat = (b.lat - a.lat) * RAD
  const dLng = (b.lng - a.lng) * RAD
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Pasa un resultado de Photon a lo que enseña y guarda la app. */
export function lugarDeFeature(f: FeaturePhoton): LugarPhoton | null {
  const c = f.geometry?.coordinates
  const p = f.properties ?? {}
  if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null
  const calle = [p.street, p.housenumber].filter(Boolean).join(', ')
  const titulo = (p.name && p.name !== p.street ? p.name : calle) || p.name || ''
  if (!titulo) return null
  const ciudad = p.city ?? p.locality ?? p.district ?? p.county ?? ''
  const postal = p.postcode && ciudad ? `${p.postcode} ${ciudad}` : ciudad || p.postcode || ''
  // Un sitio con nombre (un hotel) lleva además su calle en la segunda línea.
  const conCalle = Boolean(p.name && calle && p.name !== p.street)
  const detalleFinal = conCalle ? [calle, postal].filter(Boolean).join(' · ') : postal
  const direccion = [conCalle ? calle : titulo, postal].filter(Boolean).join(', ')
  return { titulo, detalle: detalleFinal, direccion, lat: c[1], lng: c[0] }
}

/** Solo lo de la ciudad del viaje: dentro de `RADIO_CIUDAD_KM` de alguno de los puntos de referencia (el centro del destino y sus paradas). */
export function soloDeLaCiudad(lugares: LugarPhoton[], referencias: Coordinates[], radioKm = RADIO_CIUDAD_KM): LugarPhoton[] {
  if (referencias.length === 0) return lugares
  return lugares.filter((l) => referencias.some((r) => distanciaKm(r, l) <= radioKm))
}

const cache = new Map<string, LugarPhoton[]>()

/**
 * Busca `q` cerca de `centro`. Una petición GET a photon.komoot.io/api cada vez que el viajero PARA de escribir (≥ 700 ms, ≥ 3 letras, la anterior se cancela); baja ~1-3 KB (hasta 10 resultados).
 * Ninguna llamada a Supabase. Devuelve [] si falla o se cancela.
 */
export async function buscarLugarPhoton(q: string, centro: Coordinates | null, referencias: Coordinates[], senal?: AbortSignal): Promise<LugarPhoton[]> {
  const texto = q.trim().replace(/\s+/g, ' ')
  if (texto.length < MIN_LETRAS_PHOTON) return []
  const clave = `${texto.toLowerCase()}|${centro ? `${centro.lat.toFixed(2)},${centro.lng.toFixed(2)}` : ''}`
  const guardado = cache.get(clave)
  if (guardado) return soloDeLaCiudad(guardado, referencias).slice(0, 5)
  const params = new URLSearchParams({ q: texto, limit: '10', location_bias_scale: '0.6', zoom: '11' })
  if (centro) {
    params.set('lat', String(centro.lat))
    params.set('lon', String(centro.lng))
  }
  try {
    const r = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, { signal: senal })
    if (!r.ok) return []
    const j = (await r.json()) as { features?: FeaturePhoton[] }
    const vistos = new Set<string>()
    const todos = (j.features ?? []).flatMap((f) => {
      const l = lugarDeFeature(f)
      if (!l) return []
      const k = `${l.titulo}|${l.detalle}`
      if (vistos.has(k)) return []
      vistos.add(k)
      return [l]
    })
    cache.set(clave, todos)
    return soloDeLaCiudad(todos, referencias).slice(0, 5)
  } catch {
    return []
  }
}

/**
 * La dirección de un punto (cuando el viajero mueve el pin). Una petición a photon.komoot.io/reverse cada vez que el mapa se queda quieto tras moverlo con el dedo (nunca en bucle); baja <1 KB.
 */
export async function direccionDePhoton(lat: number, lng: number, senal?: AbortSignal): Promise<string | null> {
  try {
    const r = await fetch(`https://photon.komoot.io/reverse?${new URLSearchParams({ lat: String(lat), lon: String(lng), limit: '1' }).toString()}`, { signal: senal })
    if (!r.ok) return null
    const j = (await r.json()) as { features?: FeaturePhoton[] }
    const l = j.features?.[0] ? lugarDeFeature(j.features[0]) : null
    return l?.direccion ?? null
  } catch {
    return null
  }
}

/** Los puntos de referencia de «la ciudad del viaje»: el centro del destino y las coordenadas reales de sus paradas. */
export function referenciasDelViaje(route: { destinationCoordinates?: Coordinates | null; days?: { stops: { coordinates?: Coordinates | null }[] }[] } | null | undefined): Coordinates[] {
  const salida: Coordinates[] = []
  const pon = (c: Coordinates | null | undefined) => {
    if (c && (c.lat !== 0 || c.lng !== 0)) salida.push(c)
  }
  pon(route?.destinationCoordinates)
  const vistas = new Set<string>()
  for (const d of route?.days ?? []) {
    for (const s of d.stops) {
      const c = s.coordinates
      if (!c || (c.lat === 0 && c.lng === 0)) continue
      const k = `${c.lat.toFixed(2)},${c.lng.toFixed(2)}`
      if (vistas.has(k)) continue
      vistas.add(k)
      salida.push(c)
    }
  }
  return salida
}

/** «Via del Corso, 18, 00186 Roma» → [«Via del Corso, 18», «00186 Roma»] (la calle y el código postal con la ciudad); sin código postal, se parte en la primera coma. */
export function partirDireccion(direccion: string): [string, string] {
  const m = /^(.*?),\s*(\d{4,6}\s.*)$/.exec(direccion)
  if (m) return [m[1], m[2]]
  const i = direccion.indexOf(',')
  return i < 0 ? [direccion, ''] : [direccion.slice(0, i), direccion.slice(i + 1).trim()]
}
