import { listarFotos, ubicacionesDeFotos, type FotoViaje } from './fotosViaje'
import type { Route } from './types'
import { BUCKET_PERFILES, firmarFotosDePerfil } from './miPerfil'
import { supabase } from './supabaseClient'
import { cuentasActivas } from './cuentas'
import { bootstrapTraveler } from './tripPersistence'

/**
 * LA PORTADA DE UN VIAJE EN «MIS VIAJES» (Tanda 10N3, §3b.6): lo que no es React. La foto del destino por defecto, las fotos del viaje entre las que elegir, la foto de la galería (se achica y se sube) y la
 * regla del primer día de viaje acabado. Lo elegido lo guarda `usePortadas`.
 */

const sinAcentos = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

/**
 * Las fotos PROPIAS de cada destino que valen de portada (public/fotos/<destino>/, con su crédito en data/dias/<destino>/_fotos.json). La misma para todos los viajes a ese sitio. Roma: el Coliseo de día
 * (David Libeert, Unsplash; la copia de 640 px de ancho para la tarjeta). Un destino sin foto propia pide la suya al servidor de fotos de la app (Unsplash/Wikipedia con su crédito) y, si tampoco hay, el degradado.
 */
export const PORTADAS_PROPIAS: Record<string, { url: string; credito: string }> = {
  roma: { url: '/fotos/roma/dia_coliseo_p.jpg', credito: 'Foto: David Libeert · Unsplash' },
  // LZ1: Lanzarote (oculto, solo administrador). Portada elegida por Eric (4-nov): la cala de Papagayo.
  lanzarote: { url: '/fotos/lanzarote/playas_de_papagayo_p.jpg', credito: 'Foto: Lviatour · CC BY-SA 3.0' },
}

export const portadaPropiaDe = (destino: string): { url: string; credito: string } | null => PORTADAS_PROPIAS[sinAcentos(destino)] ?? null

/** Las fotos del viaje (las de sus paradas), por día y hora. En desarrollo, `window.__fotosDePrueba[tripId]` las sustituye (para probar sin Supabase). */
export async function fotosParaPortada(tripId: string): Promise<FotoViaje[]> {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const falsas = (window as unknown as { __fotosDePrueba?: Record<string, FotoViaje[]> }).__fotosDePrueba?.[tripId]
    if (falsas) return falsas
  }
  return listarFotos(tripId)
}

/** Pura: la primera foto del viaje (la del primer día, la más antigua), o null. */
export function primeraFoto(fotos: FotoViaje[]): FotoViaje | null {
  return [...fotos].sort((a, b) => a.dayNumber - b.dayNumber || a.createdAt.localeCompare(b.createdAt))[0] ?? null
}

/** El enlace de una foto de la galería ya subida (almacén `perfiles`, privado). */
export async function enlaceDeGaleria(ruta: string): Promise<string | null> {
  const r = await firmarFotosDePerfil([ruta])
  return r[ruta] ?? null
}

async function aJpegAncho(archivo: Blob, ladoLargo: number, calidad: number): Promise<Blob | null> {
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(1, ladoLargo / Math.max(bitmap.width, bitmap.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.max(16, Math.round(bitmap.width * escala))
  lienzo.height = Math.max(16, Math.round(bitmap.height * escala))
  const ctx = lienzo.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height)
  bitmap.close?.()
  return new Promise((ok) => lienzo.toBlob((b) => ok(b), 'image/jpeg', calidad))
}

const aDataUrl = (b: Blob): Promise<string> =>
  new Promise((ok, mal) => {
    const l = new FileReader()
    l.onload = () => ok(String(l.result))
    l.onerror = () => mal(l.error)
    l.readAsDataURL(b)
  })

/**
 * Una foto de la galería como portada: se achica (lado largo 1000 px, JPEG; se vuelve a dibujar, así no lleva ningún dato escondido). Con cuenta se sube al almacén `perfiles` (su carpeta) y
 * se devuelve la ruta; sin cuenta, la propia foto pequeña (en este móvil). Devuelve el error en palabras sencillas si no se pudo.
 */
export async function subirPortadaDeGaleria(tripId: string, archivo: Blob): Promise<{ portada: { f: 'galeria'; ruta?: string; data?: string } | null; error: string | null }> {
  let foto: Blob | null = null
  try {
    foto = (await aJpegAncho(archivo, 1000, 0.8)) ?? null
  } catch {
    foto = null
  }
  if (!foto) return { portada: null, error: 'No se ha podido leer esa foto. Prueba con otra.' }
  const uid = supabase && cuentasActivas() ? await bootstrapTraveler().catch(() => null) : null
  if (uid && supabase) {
    const ruta = `${uid}/portada-${tripId.slice(0, 8)}-${Date.now()}.jpg`
    const { error } = await supabase.storage.from(BUCKET_PERFILES).upload(ruta, foto, { contentType: 'image/jpeg', upsert: true })
    if (!error) return { portada: { f: 'galeria', ruta }, error: null }
  }
  // Sin cuenta (o sin conexión): la foto pequeña se queda en este móvil.
  try {
    const pequena = (await aJpegAncho(foto, 720, 0.7)) ?? foto
    return { portada: { f: 'galeria', data: await aDataUrl(pequena) }, error: null }
  } catch {
    return { portada: null, error: 'No se ha podido guardar esa foto. Inténtalo de nuevo.' }
  }
}

/* ------------------------------------------------------------------ */
/* (V14) La foto de portada del RESUMEN del viaje                      */
/* ------------------------------------------------------------------ */

const norma = (t: string): string => sinAcentos(t.replace(/\s*\((noche|de noche)\)\s*$/i, ''))
const distanciaEnKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const rad = (g: number) => (g * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** El centro de las paradas de la ruta y hasta dónde llega el destino (la parada más lejana del centro, con un margen): «dentro del destino». */
export function zonaDelDestino(paradas: { lat: number; lng: number }[]): { centro: { lat: number; lng: number }; radioKm: number } | null {
  const ps = paradas.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))
  if (ps.length === 0) return null
  const centro = { lat: ps.reduce((n, p) => n + p.lat, 0) / ps.length, lng: ps.reduce((n, p) => n + p.lng, 0) / ps.length }
  const lejos = Math.max(...ps.map((p) => distanciaEnKm(centro, p)))
  return { centro, radioKm: Math.max(15, lejos * 1.5 + 5) }
}

/**
 * Qué foto sale de portada en el resumen del viaje: una hecha EN el destino (con su ubicación dentro de la zona del viaje) y, mejor, la de un sitio con logro (la foto es de una parada que es de alguna colección;
 * antes la de un sitio ya visto). Una foto sin ubicación, o hecha fuera del destino (la maleta en casa), no vale. Sin ninguna: null (y se pone la del destino de nuestros datos).
 * sitiosConLogro: los nombres de los sitios de las colecciones, con si ya se han visto.
 */
export function elegirFotoDePortada(fotos: FotoViaje[], zona: { centro: { lat: number; lng: number }; radioKm: number } | null, sitiosConLogro: { nombre: string; visto: boolean }[]): FotoViaje | null {
  if (!zona) return null
  const logro = new Map<string, boolean>()
  for (const s of sitiosConLogro) logro.set(norma(s.nombre), (logro.get(norma(s.nombre)) ?? false) || s.visto)
  const candidatas = fotos
    .filter((f) => typeof f.lat === 'number' && typeof f.lng === 'number' && distanciaEnKm(zona.centro, { lat: f.lat as number, lng: f.lng as number }) <= zona.radioKm)
    .map((f) => {
      const k = f.stopName ? logro.get(norma(f.stopName)) : undefined
      return { f, puntos: k === undefined ? 0 : k ? 2 : 1 }
    })
  candidatas.sort((a, b) => b.puntos - a.puntos || a.f.dayNumber - b.f.dayNumber || a.f.createdAt.localeCompare(b.f.createdAt))
  return candidatas[0]?.f ?? null
}

/**
 * (V15) LA REGLA DE LA PORTADA, UNA SOLA PARA TODA LA APP (la de la V14): de las fotos del viajero, una hecha EN el destino y, mejor, la de un sitio con logro; si no hay ninguna, null (y sale la del
 * destino de nuestros datos). La usan el Perfil, el resumen y los recuerdos. Las ubicaciones guardadas solo se piden si con lo que ya se sabe no sirve ninguna (y sin esperar más de 4 s).
 */
export async function fotoDePortadaPorRegla(idDeFotos: string, route: Route | null | undefined, sitios: { nombre: string; visto: boolean }[] = [], lista?: FotoViaje[]): Promise<FotoViaje | null> {
  const fotos = lista ?? (await fotosParaPortada(idDeFotos))
  if (!fotos.length || !route) return null
  const paradas = (route.days ?? []).flatMap((d) => (d.stops ?? []).filter((s) => !s.isZoneWalk && s.coordinates).map((s) => ({ lat: Number(s.coordinates.lat), lng: Number(s.coordinates.lng) })))
  const zona = zonaDelDestino(paradas)
  let f = elegirFotoDePortada(fotos, zona, sitios)
  if (!f) {
    const sinUbicacion = fotos.filter((x) => typeof x.lat !== 'number').map((x) => x.id)
    if (sinUbicacion.length) {
      const ubic = await Promise.race([ubicacionesDeFotos(sinUbicacion), new Promise<Map<string, { lat: number; lng: number }>>((r) => setTimeout(() => r(new Map()), 4000))])
      f = elegirFotoDePortada(fotos.map((x) => (typeof x.lat === 'number' ? x : { ...x, lat: ubic.get(x.id)?.lat ?? null, lng: ubic.get(x.id)?.lng ?? null })), zona, sitios)
    }
  }
  return f
}

/** Una miniatura (data URL) de una foto, para guardarla en el móvil y enseñarla AL INSTANTE la próxima vez (las direcciones firmadas caducan). null si no se pudo. */
export async function miniaturaEnTexto(url: string, ancho = 420): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob()
    const bitmap = await createImageBitmap(blob)
    const k = Math.min(1, ancho / bitmap.width)
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.max(16, Math.round(bitmap.width * k))
    lienzo.height = Math.max(16, Math.round(bitmap.height * k))
    lienzo.getContext('2d')?.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height)
    return lienzo.toDataURL('image/jpeg', 0.7)
  } catch {
    return null
  }
}
