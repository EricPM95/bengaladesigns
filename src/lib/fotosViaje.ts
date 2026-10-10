import { supabase } from './supabaseClient'
import { bootstrapTraveler } from './tripPersistence'
import { pagoActivo } from './pago'

/**
 * Las fotos del viaje (Tanda 6z3, punto 6): el viajero hace o sube fotos durante el viaje y se
 * ven luego en «Después del viaje». Bucket PRIVADO `fotos-viaje` + tabla `trip_photos` (ver
 * supabase/migrations/0018_fotos_viaje.sql), con la misma sesión anónima que el resto de la app.
 *
 * Privacidad: la ubicación de una foto sale de la PARADA a la que se asocia, nunca de la foto.
 * Por eso antes de subir se re-codifica el JPEG con un canvas (que ya descarta el EXIF) y, por
 * seguridad, el resultado pasa SIEMPRE por `quitarMetadatosJpeg`.
 *
 * TODO degrada a silencio, como placeLikesApi.ts: sin Supabase configurado, o con la migración 0018
 * sin aplicar, listar devuelve [] y subir/borrar devuelven un error en palabras sencillas. Nunca
 * lanzan: la pantalla sigue funcionando.
 */

export const BUCKET_FOTOS = 'fotos-viaje'
/** Lado largo máximo de la foto subida, como las capturas del resto de la app. */
export const LADO_MAXIMO_PX = 1600
export const CALIDAD_JPEG = 0.82
/** Cuánto vive una URL firmada (el bucket es privado). La app las pide de nuevo al refrescar. */
export const SEGUNDOS_URL_FIRMADA = 3600

const SIN_CUENTA = 'Las fotos necesitan conexión con tu cuenta; ahora mismo no está disponible.'

export interface FotoViaje {
  id: string
  tripId: string
  dayId: string
  dayNumber: number
  stopName: string | null
  storagePath: string
  width: number
  height: number
  bytes: number
  createdAt: string
  /** URL firmada de corta duración; '' si no se pudo firmar. */
  url: string
}

/* ------------------------------------------------------------------ */
/* Cuántas fotos (Tanda 6z6): la regla, en UN solo sitio               */
/* ------------------------------------------------------------------ */

/**
 * Gratis: UNA foto por parada (el «sitio» de una foto es su parada; una foto sin parada cuenta como «el día» y también es una sola por día). De pago: sin límite.
 * Todo lo que sube fotos pasa por `subirFoto`, que aplica esto; las pantallas solo preguntan `modoDeFoto` para poner «Añadir foto» o «Cambiar foto».
 */
export function limiteDeFotos(): { porParada: number | null } {
  return { porParada: pagoActivo() ? null : 1 }
}

type SitioDeFoto = Pick<FotoViaje, 'dayNumber' | 'stopName'>

/** Las fotos que ya hay en ese sitio (día + parada, o el día entero si no hay parada). */
export function fotosDelSitio<T extends SitioDeFoto>(fotos: T[], dayNumber: number, stopName?: string | null): T[] {
  return fotos.filter((foto) => foto.dayNumber === dayNumber && (foto.stopName ?? null) === (stopName ?? null))
}

/** «anadir» si cabe otra foto en ese sitio; «cambiar» si ya está completo (gratis, con su foto): entonces la nueva sustituye a la vieja. */
export function modoDeFoto(fotos: SitioDeFoto[], dayNumber: number, stopName?: string | null): 'anadir' | 'cambiar' {
  const { porParada } = limiteDeFotos()
  return porParada !== null && fotosDelSitio(fotos, dayNumber, stopName).length >= porParada ? 'cambiar' : 'anadir'
}

export interface FotoPreparada {
  blob: Blob
  width: number
  height: number
  bytes: number
}

/* ------------------------------------------------------------------ */
/* Quitar metadatos de un JPEG (función pura)                          */
/* ------------------------------------------------------------------ */

/**
 * Elimina del JPEG todos los segmentos que pueden llevar datos del móvil o del lugar: APP1
 * (EXIF/XMP, donde van el GPS, el modelo y la hora), APP13 (Photoshop/IPTC), el resto de APPn
 * salvo los tres que hacen falta para pintar bien (APP0 JFIF, APP2 perfil de color ICC, APP14
 * Adobe) y los comentarios (COM). La imagen en sí (los bytes desde SOS) no se toca.
 * Lanza si lo que recibe no es un JPEG.
 */
export function quitarMetadatosJpeg(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('No es un JPEG.')
  const trozos: Uint8Array[] = [bytes.subarray(0, 2)]
  let i = 2
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) throw new Error('JPEG dañado.')
    // Bytes de relleno 0xFF antes del marcador.
    let j = i
    while (j < bytes.length && bytes[j] === 0xff) j++
    if (j >= bytes.length) throw new Error('JPEG dañado.')
    const marcador = bytes[j]
    const inicio = j - 1
    if (marcador === 0xd9) {
      trozos.push(bytes.subarray(inicio, j + 1))
      break
    }
    // Marcadores sin longitud.
    if (marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
      trozos.push(bytes.subarray(inicio, j + 1))
      i = j + 1
      continue
    }
    if (j + 2 >= bytes.length) throw new Error('JPEG dañado.')
    const longitud = (bytes[j + 1] << 8) | bytes[j + 2]
    const fin = j + 1 + longitud
    if (longitud < 2 || fin > bytes.length) throw new Error('JPEG dañado.')
    if (marcador === 0xda) {
      // Empieza la imagen: el resto (datos comprimidos hasta EOI) se copia tal cual.
      trozos.push(bytes.subarray(inicio))
      break
    }
    const esApp = marcador >= 0xe0 && marcador <= 0xef
    const sePierde = marcador === 0xfe || (esApp && marcador !== 0xe0 && marcador !== 0xe2 && marcador !== 0xee)
    if (!sePierde) trozos.push(bytes.subarray(inicio, fin))
    i = fin
  }
  const total = trozos.reduce((suma, t) => suma + t.length, 0)
  const salida = new Uint8Array(total)
  let pos = 0
  for (const t of trozos) {
    salida.set(t, pos)
    pos += t.length
  }
  return salida
}

/* ------------------------------------------------------------------ */
/* Preparar la foto en el navegador                                    */
/* ------------------------------------------------------------------ */

/** Lee la foto (con su orientación), la reduce a 1.600 px, la pasa a JPEG y le quita los metadatos. */
export async function prepararFoto(file: File | Blob): Promise<FotoPreparada> {
  // 'from-image' aplica la orientación del móvil: el canvas sale derecho y sin necesitar el EXIF.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.max(1, Math.round(bitmap.width * escala))
  const alto = Math.max(1, Math.round(bitmap.height * escala))
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar la foto.')
  ctx.drawImage(bitmap, 0, 0, ancho, alto)
  bitmap.close?.()
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG))
  if (!jpeg) throw new Error('No se pudo preparar la foto.')
  const limpio = quitarMetadatosJpeg(new Uint8Array(await jpeg.arrayBuffer()))
  const blob = new Blob([limpio as BlobPart], { type: 'image/jpeg' })
  return { blob, width: ancho, height: alto, bytes: blob.size }
}

/* ------------------------------------------------------------------ */
/* Subir, listar, borrar                                               */
/* ------------------------------------------------------------------ */

type Fila = {
  id: string
  trip_id: string
  day_id: string
  day_number: number
  stop_name: string | null
  storage_path: string
  width: number
  height: number
  bytes: number
  created_at: string
}

const COLUMNAS = 'id, trip_id, day_id, day_number, stop_name, storage_path, width, height, bytes, created_at'

function deFila(fila: Fila, url: string): FotoViaje {
  return {
    id: fila.id,
    tripId: fila.trip_id,
    dayId: fila.day_id,
    dayNumber: fila.day_number,
    stopName: fila.stop_name,
    storagePath: fila.storage_path,
    width: fila.width,
    height: fila.height,
    bytes: fila.bytes,
    createdAt: fila.created_at,
    url,
  }
}

/** Quien muestra fotos se entera de que han cambiado (useFotosViaje). */
const oyentes = new Set<() => void>()
export function alCambiarFotos(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
function avisarCambio() {
  oyentes.forEach((oyente) => oyente())
}

function idUnico(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export interface SubirFotoArgs {
  tripId: string
  dayId: string
  dayNumber: number
  stopName?: string | null
  file: File | Blob
}

export type ResultadoSubida = { foto: FotoViaje | null; error: string | null }

/**
 * Prepara la foto, la sube a Storage y guarda la fila. Si la fila falla, retira el objeto recién
 * subido: nunca queda una cosa sin la otra. Devuelve la foto o un error en palabras sencillas.
 */
export async function subirFoto(args: SubirFotoArgs): Promise<ResultadoSubida> {
  if (!supabase) return { foto: null, error: SIN_CUENTA }
  let preparada: FotoPreparada
  try {
    preparada = await prepararFoto(args.file)
  } catch {
    return { foto: null, error: 'No hemos podido leer esa foto. Prueba con otra.' }
  }
  return subirRespetandoLimite(args, preparada)
}

/**
 * La parte de «cuántas fotos» de subirFoto, aparte para poder probarla sin navegador. Gratis, con su foto ya puesta en ese sitio: primero se sube la nueva y solo si sale bien
 * se borra la vieja (nunca se queda sin ninguna). De pago: se sube y ya.
 */
export async function subirRespetandoLimite(args: Omit<SubirFotoArgs, 'file'>, preparada: FotoPreparada): Promise<ResultadoSubida> {
  const { porParada } = limiteDeFotos()
  const previas = porParada === null ? [] : fotosDelSitio(await listarFotos(args.tripId), args.dayNumber, args.stopName)
  const resultado = await subirFotoPreparada(args, preparada)
  if (resultado.foto) for (const vieja of previas) await borrarFoto(vieja)
  return resultado
}

/** La parte de red de subirFoto, aparte para poder probarla sin navegador. */
export async function subirFotoPreparada(args: Omit<SubirFotoArgs, 'file'>, preparada: FotoPreparada): Promise<ResultadoSubida> {
  if (!supabase) return { foto: null, error: SIN_CUENTA }
  let ruta = ''
  try {
    const userId = await bootstrapTraveler()
    ruta = `${userId}/${args.tripId}/${idUnico()}.jpg`
    const { error: errorSubida } = await supabase.storage.from(BUCKET_FOTOS).upload(ruta, preparada.blob, { contentType: 'image/jpeg', upsert: false })
    if (errorSubida) {
      console.warn('[fotos] no se pudo subir:', errorSubida.message)
      return { foto: null, error: 'No se ha podido subir la foto. Inténtalo de nuevo en un momento.' }
    }
    const { data, error: errorFila } = await supabase
      .from('trip_photos')
      .insert({ user_id: userId, trip_id: args.tripId, day_id: args.dayId, day_number: args.dayNumber, stop_name: args.stopName ?? null, storage_path: ruta, width: preparada.width, height: preparada.height, bytes: preparada.bytes })
      .select(COLUMNAS)
      .single()
    if (errorFila || !data) {
      console.warn('[fotos] no se pudo guardar la foto:', errorFila?.message)
      await supabase.storage.from(BUCKET_FOTOS).remove([ruta]).catch(() => undefined)
      return { foto: null, error: 'No se ha podido guardar la foto. Inténtalo de nuevo en un momento.' }
    }
    const { data: firmada } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrl(ruta, SEGUNDOS_URL_FIRMADA)
    const foto = deFila(data as Fila, firmada?.signedUrl ?? '')
    avisarCambio()
    return { foto, error: null }
  } catch (error) {
    console.warn('[fotos] fallo subiendo la foto:', error)
    if (ruta) await supabase.storage.from(BUCKET_FOTOS).remove([ruta]).catch(() => undefined)
    return { foto: null, error: 'No se ha podido subir la foto. Inténtalo de nuevo en un momento.' }
  }
}

/** Las fotos del viaje, por día y hora, con URLs firmadas de corta duración. Sin Supabase o sin la migración: []. */
export async function listarFotos(tripId: string): Promise<FotoViaje[]> {
  if (!supabase) return []
  try {
    const userId = await bootstrapTraveler().catch(() => null)
    if (!userId) return []
    const { data, error } = await supabase.from('trip_photos').select(COLUMNAS).eq('user_id', userId).eq('trip_id', tripId).order('day_number', { ascending: true }).order('created_at', { ascending: true })
    if (error || !data) {
      if (error) console.warn('[fotos] no se pudieron leer las fotos:', error.message)
      return []
    }
    const filas = data as Fila[]
    if (filas.length === 0) return []
    const { data: firmadas } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrls(
      filas.map((f) => f.storage_path),
      SEGUNDOS_URL_FIRMADA,
    )
    const porRuta = new Map<string, string>()
    for (const f of firmadas ?? []) if (f.path && f.signedUrl) porRuta.set(f.path, f.signedUrl)
    return filas.map((fila) => deFila(fila, porRuta.get(fila.storage_path) ?? ''))
  } catch (error) {
    console.warn('[fotos] fallo leyendo las fotos:', error)
    return []
  }
}

/**
 * Borra DE VERDAD la foto: primero el objeto del almacén y después la fila. Si falla el objeto, no
 * se toca la fila (la foto sigue ahí y se puede reintentar); si falla la fila, el reintento vuelve
 * a pedir el borrado del objeto, que es inocuo si ya no existe. Nunca queda una foto a medias sin
 * que se diga. Devuelve `null` si todo fue bien, o el error en palabras sencillas.
 */
export async function borrarFoto(foto: Pick<FotoViaje, 'id' | 'storagePath'>): Promise<string | null> {
  if (!supabase) return SIN_CUENTA
  try {
    const { error: errorObjeto } = await supabase.storage.from(BUCKET_FOTOS).remove([foto.storagePath])
    if (errorObjeto) {
      console.warn('[fotos] no se pudo borrar el archivo:', errorObjeto.message)
      return 'No se ha podido eliminar la foto. Inténtalo de nuevo.'
    }
    const { error: errorFila } = await supabase.from('trip_photos').delete().eq('id', foto.id)
    if (errorFila) {
      console.warn('[fotos] no se pudo borrar la fila:', errorFila.message)
      return 'No se ha podido eliminar la foto del todo. Inténtalo de nuevo.'
    }
    avisarCambio()
    return null
  } catch (error) {
    console.warn('[fotos] fallo borrando la foto:', error)
    return 'No se ha podido eliminar la foto. Inténtalo de nuevo.'
  }
}
