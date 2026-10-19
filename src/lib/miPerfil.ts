import { quitarMetadatosJpeg } from './fotosViaje'
import { supabase } from './supabaseClient'

/**
 * LA FOTO Y EL NOMBRE DEL PERFIL (cuentas parte 3, punto 6).
 *   · El nombre: el de pila de Google; si entra con el email, «Viajero» hasta que ponga uno. Se cambia en el mismo sitio que la foto (tocar el círculo del Perfil).
 *   · La foto: hecha con la cámara o elegida de la galería. PEQUEÑA (unos pocos KB: un cuadrado de 256 px o menos, JPEG, que se vuelve a dibujar y por eso no lleva ningún dato escondido),
 *     en la nube (almacén PRIVADO `perfiles`, una carpeta por persona; migraciones 0026 y 0027: la ven la propia persona y la gente de sus viajes y pases, con enlaces que caducan) y se borra con la cuenta. Si entra con Google, su foto de Google hasta que ponga otra. Sin foto, la inicial.
 *   · Dónde sale: el Perfil, «Hola, {nombre}», el pie de Compartir y lo que ven los demás del viaje (el «E» y el «L» de la campanita y de R2).
 */

export const BUCKET_PERFILES = 'perfiles'
/** La foto no pasa de esto (unos pocos KB). */
export const OBJETIVO_BYTES_FOTO_PERFIL = 40 * 1024
/** El primer intento y los siguientes si pesa demasiado: lado en píxeles y calidad del JPEG. */
export const PASOS_DE_FOTO_DE_PERFIL: { lado: number; calidad: number }[] = [
  { lado: 256, calidad: 0.72 },
  { lado: 256, calidad: 0.6 },
  { lado: 224, calidad: 0.55 },
  { lado: 192, calidad: 0.5 },
  { lado: 160, calidad: 0.45 },
  { lado: 128, calidad: 0.4 },
]

/** «Viajero» mientras no haya un nombre puesto. */
export const nombreParaMostrar = (nombre: string | null | undefined): string => nombre?.trim() || 'Viajero'

/** El nombre de pila de un nombre completo: «Laura García» → «Laura». Sin nombre, null. */
export function nombreDePila(completo: string | null | undefined): string | null {
  const primero = String(completo ?? '').trim().split(/\s+/)[0]
  return primero ? primero.slice(0, 40) : null
}

/** La inicial para el círculo cuando no hay foto. */
export const inicialDeNombre = (nombre: string | null | undefined): string => (nombreParaMostrar(nombre)[0] ?? 'V').toUpperCase()

/** Cuánto dura el enlace de una foto de perfil (el almacén es privado: cada enlace caduca a la hora). */
export const CADUCA_FOTO_S = 3600
/** Se pide un enlace nuevo antes de que caduque el anterior (margen de 5 minutos). */
const MARGEN_FOTO_MS = 5 * 60 * 1000
const firmadas = new Map<string, { url: string; hasta: number }>()

/** Pura: cuándo hay que volver a pedir un enlace pedido ahora: el momento de caducar menos el margen. */
export const renovarEnMs = (ahoraMs: number, caducaS = CADUCA_FOTO_S): number => ahoraMs + caducaS * 1000 - MARGEN_FOTO_MS

/**
 * Los enlaces de las fotos de perfil (almacén privado, cuentas parte 3B): solo los consigue quien tiene permiso (la propia persona y la gente de sus viajes y pases) y caducan a la hora.
 * Devuelve ruta → enlace; lo que no se puede ver (sin permiso, borrada, sin conexión) no sale. Los enlaces vivos se guardan para no pedirlos otra vez.
 */
export async function firmarFotosDePerfil(rutas: string[], ahoraMs = Date.now()): Promise<Record<string, string>> {
  const salida: Record<string, string> = {}
  const pedir: string[] = []
  for (const ruta of new Set(rutas.filter(Boolean))) {
    const guardada = firmadas.get(ruta)
    if (guardada && guardada.hasta > ahoraMs) salida[ruta] = guardada.url
    else pedir.push(ruta)
  }
  if (pedir.length === 0 || !supabase) return salida
  try {
    const { data, error } = await supabase.storage.from(BUCKET_PERFILES).createSignedUrls(pedir, CADUCA_FOTO_S)
    if (error || !data) return salida
    for (const f of data) {
      if (f.path && f.signedUrl && !f.error) {
        firmadas.set(f.path, { url: f.signedUrl, hasta: renovarEnMs(ahoraMs) })
        salida[f.path] = f.signedUrl
      }
    }
  } catch {
    /* sin conexión: se queda la inicial */
  }
  return salida
}

/** Olvida los enlaces guardados (al cambiar o quitar una foto). */
export const olvidarFotosFirmadas = (): void => firmadas.clear()

/** Pura: el nombre del archivo nuevo de la foto (cambia cada vez: así nadie ve una foto vieja en la caché). */
export const rutaNuevaDeFoto = (uid: string, ahoraMs: number): string => `${uid}/foto-${ahoraMs}.jpg`

/** Pura: lo que se enseña de la foto: el enlace de la subida, o la de Google mientras no haya otra, o nada (la inicial). */
export function fotoParaMostrar(urlDeLaSubida: string | null | undefined, fotoGoogle: string | null | undefined): string | null {
  return urlDeLaSubida || fotoGoogle || null
}

async function aJpeg(archivo: Blob, lado: number, calidad: number): Promise<Blob | null> {
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(1, lado / Math.min(bitmap.width, bitmap.height))
  // Un cuadrado recortado del centro (así el círculo no deforma).
  const ladoFuente = Math.min(bitmap.width, bitmap.height)
  const salida = Math.max(16, Math.round(ladoFuente * escala))
  const lienzo = document.createElement('canvas')
  lienzo.width = salida
  lienzo.height = salida
  const ctx = lienzo.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(bitmap, (bitmap.width - ladoFuente) / 2, (bitmap.height - ladoFuente) / 2, ladoFuente, ladoFuente, 0, 0, salida, salida)
  bitmap.close?.()
  return new Promise((ok) => lienzo.toBlob((b) => ok(b), 'image/jpeg', calidad))
}

/** La foto lista para subir: un cuadrado pequeño en JPEG, sin ningún dato escondido. Devuelve null si el archivo no es una imagen que se pueda leer. */
export async function reducirFotoDePerfil(archivo: Blob): Promise<Blob | null> {
  try {
    let ultima: Blob | null = null
    for (const paso of PASOS_DE_FOTO_DE_PERFIL) {
      const b = await aJpeg(archivo, paso.lado, paso.calidad)
      if (!b) return null
      const limpio = new Blob([quitarMetadatosJpeg(new Uint8Array(await b.arrayBuffer())) as BlobPart], { type: 'image/jpeg' })
      ultima = limpio
      if (limpio.size <= OBJETIVO_BYTES_FOTO_PERFIL) break
    }
    return ultima
  } catch {
    return null
  }
}

export interface DatosDelPerfil {
  nombre: string | null
  fotoPath: string | null
}

export async function cargarMiPerfil(uid: string): Promise<DatosDelPerfil | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('travelers').select('nombre, foto_path').eq('id', uid).maybeSingle()
  if (error || !data) return null
  return { nombre: (data as { nombre: string | null }).nombre ?? null, fotoPath: (data as { foto_path: string | null }).foto_path ?? null }
}

export async function guardarMiNombre(uid: string, nombre: string): Promise<string | null> {
  if (!supabase) return 'Necesita conexión con tu cuenta.'
  const limpio = nombreDePila(nombre)
  const { error } = await supabase.from('travelers').update({ nombre: limpio }).eq('id', uid)
  return error ? 'No se ha podido guardar tu nombre. Inténtalo de nuevo.' : null
}

/** Sube la foto nueva, apunta su ruta y borra la anterior. Devuelve la ruta nueva o el error en palabras sencillas. */
export async function subirMiFoto(uid: string, archivo: Blob, rutaAnterior: string | null): Promise<{ ruta: string | null; error: string | null }> {
  if (!supabase) return { ruta: null, error: 'Necesita conexión con tu cuenta.' }
  const foto = await reducirFotoDePerfil(archivo)
  if (!foto) return { ruta: null, error: 'No se ha podido leer esa foto. Prueba con otra.' }
  const ruta = rutaNuevaDeFoto(uid, Date.now())
  const subida = await supabase.storage.from(BUCKET_PERFILES).upload(ruta, foto, { contentType: 'image/jpeg', upsert: true })
  if (subida.error) return { ruta: null, error: 'No se ha podido subir la foto. Inténtalo de nuevo.' }
  const { error } = await supabase.from('travelers').update({ foto_path: ruta }).eq('id', uid)
  if (error) return { ruta: null, error: 'No se ha podido guardar la foto. Inténtalo de nuevo.' }
  if (rutaAnterior) await supabase.storage.from(BUCKET_PERFILES).remove([rutaAnterior])
  olvidarFotosFirmadas()
  return { ruta, error: null }
}

export async function quitarMiFoto(uid: string, rutaAnterior: string | null): Promise<string | null> {
  if (!supabase) return 'Necesita conexión con tu cuenta.'
  const { error } = await supabase.from('travelers').update({ foto_path: null }).eq('id', uid)
  if (error) return 'No se ha podido quitar la foto. Inténtalo de nuevo.'
  if (rutaAnterior) await supabase.storage.from(BUCKET_PERFILES).remove([rutaAnterior])
  olvidarFotosFirmadas()
  return null
}
