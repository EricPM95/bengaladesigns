import { listarFotos, type FotoViaje } from './fotosViaje'
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
