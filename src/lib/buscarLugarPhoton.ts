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
  properties?: { type?: string; osm_key?: string; name?: string; street?: string; housenumber?: string; postcode?: string; city?: string; district?: string; locality?: string; county?: string; state?: string; country?: string }
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

/** Sin tildes ni mayúsculas, para buscar y comparar («Vía» = «Via»); lo que se ve en pantalla no se toca. */
export function sinTildes(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** El recuadro de «la ciudad del viaje» (minLon,minLat,maxLon,maxLat) con ~0,27° de margen (~30 km): Photon solo busca dentro. */
function bboxDe(referencias: Coordinates[]): string | null {
  if (referencias.length === 0) return null
  const m = 0.27
  const lats = referencias.map((r) => r.lat)
  const lngs = referencias.map((r) => r.lng)
  return [Math.min(...lngs) - m, Math.min(...lats) - m, Math.max(...lngs) + m, Math.max(...lats) + m].map((n) => n.toFixed(4)).join(',')
}

/** Pide a Photon y pasa los resultados a lugares, sin repetidos (mismo título + ciudad). */
async function pedir(params: URLSearchParams, senal?: AbortSignal): Promise<{ lugar: LugarPhoton; calle: boolean; calleDe: string }[]> {
  const r = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, { signal: senal })
  if (!r.ok) return []
  const j = (await r.json()) as { features?: FeaturePhoton[] }
  const vistos = new Set<string>()
  return (j.features ?? []).flatMap((f) => {
    const l = lugarDeFeature(f)
    if (!l) return []
    const k = sinTildes(`${l.titulo}|${l.detalle}`)
    if (vistos.has(k)) return []
    vistos.add(k)
    return [{ lugar: l, calle: f.properties?.type === 'street' || f.properties?.osm_key === 'highway', calleDe: sinTildes([f.properties?.street, f.properties?.housenumber].filter(Boolean).join(' ')) }]
  })
}

/**
 * Busca `q` en la ciudad del viaje. Orden: PRIMERO las calles (capa «street» de Photon), DESPUÉS los sitios con nombre y portales; sin repetidos. Las tildes se quitan antes de buscar.
 * Hasta 2 peticiones GET a photon.komoot.io/api (calles + todo) cada vez que el viajero PARA de escribir (≥ 700 ms, ≥ 3 letras, la anterior se cancela); si lo escrito lleva un número («Via Nazionale 22»)
 * solo se pide lo segundo. Cada una baja ~1-3 KB (hasta 10 resultados), `bbox` limita a la ciudad. Ninguna llamada a Supabase. Devuelve [] si falla o se cancela.
 */
export async function buscarLugarPhoton(q: string, centro: Coordinates | null, referencias: Coordinates[], senal?: AbortSignal): Promise<LugarPhoton[]> {
  const mostrado = q.trim().replace(/\s+/g, ' ')
  if (mostrado.length < MIN_LETRAS_PHOTON) return []
  const texto = sinTildes(mostrado)
  const caja = bboxDe(referencias)
  const clave = `${texto}|${centro ? `${centro.lat.toFixed(2)},${centro.lng.toFixed(2)}` : ''}|${caja ?? ''}`
  const guardado = cache.get(clave)
  if (guardado) return soloDeLaCiudad(guardado, referencias).slice(0, 5)
  const base = () => {
    const p = new URLSearchParams({ q: texto, limit: '10', location_bias_scale: '0.6', zoom: '11' })
    if (centro) {
      p.set('lat', String(centro.lat))
      p.set('lon', String(centro.lng))
    }
    if (caja) p.set('bbox', caja)
    return p
  }
  try {
    const conNumero = /\d/.test(texto)
    const pCalles = base()
    pCalles.set('layer', 'street')
    const [calles, todo] = await Promise.all([conNumero ? Promise.resolve([]) : pedir(pCalles, senal), pedir(base(), senal)])
    // Las calles que más se parecen a lo escrito, primero (las que empiezan igual, luego las que lo contienen).
    const empieza = (t: string) => sinTildes(t).startsWith(texto)
    const callesOrden = [...calles.filter((c) => empieza(c.lugar.titulo)), ...calles.filter((c) => !empieza(c.lugar.titulo))]
    // Con un número escrito, una calle suelta que no es la que se escribe no sirve (la calle con portal sale como sitio, con su número).
    const callesDeTodo = conNumero ? [] : todo.filter((t) => t.calle && sinTildes(t.lugar.titulo).includes(texto))
    // Los sitios: los que llevan lo escrito entero (en su nombre o en su calle y número) primero; el resto solo si no hay nada más.
    const sitios = todo.filter((t) => !t.calle)
    const coinciden = sitios.filter((t) => sinTildes(t.lugar.titulo).includes(texto) || t.calleDe.includes(texto))
    const sitiosOrden = coinciden.length > 0 || callesOrden.length > 0 ? coinciden : sitios
    const vistos = new Set<string>()
    const resultado: LugarPhoton[] = []
    for (const t of [...callesOrden, ...callesDeTodo, ...sitiosOrden]) {
      const k = sinTildes(`${t.lugar.titulo}|${t.lugar.detalle}`)
      if (vistos.has(k)) continue
      vistos.add(k)
      resultado.push(t.lugar)
    }
    cache.set(clave, resultado)
    return soloDeLaCiudad(resultado, referencias).slice(0, 5)
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
