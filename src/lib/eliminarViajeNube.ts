/**
 * ELIMINAR UN VIAJE, LO DE LA NUBE (Tanda 10F). Sin imports de la app (el cliente de Supabase entra por parámetro) para poder probarlo entero contra una base de datos de verdad (PGlite, con las migraciones reales).
 *
 * Qué pasa en Supabase con cada cosa ligada al viaje (migraciones 0018 a 0031):
 *   SE BORRA con la fila de `trips` (`on delete cascade`): trip_members, trip_invitations, trip_recommendations, stop_visits, logro_avisos.
 *   SE QUEDA (`on delete set null`, solo pierde la referencia al viaje): passes (el Pase de Roma), achievements y logro_hechos (los logros, sellos y EXP) y hoy_prueba.
 *   NO cuelga de `trips` (`trip_photos.trip_id` es el id de la RUTA, texto, sin clave ajena): las fotos y sus archivos de Storage no se borran solos. Por eso aquí se borran a mano, ANTES que el viaje:
 *     1. los archivos del almacén (la grande y la pequeña de cada foto) y 2. las filas de `trip_photos` (y, en cascada, `trip_photo_meta`).
 *   Las fotos de OTRAS personas del mismo viaje (los invitados) solo las puede borrar su dueña: con la migración 0031 un disparador de `trips` las apunta en `fotos_por_borrar` y cada persona
 *   las borra al abrir la app (`limpiarFotosPendientes`). Sin la 0031 todo funciona igual, salvo que esas fotos ajenas se quedan hasta aplicarla.
 */

/** Lo mínimo que se usa del cliente de Supabase (así una base de pruebas puede hacer de Supabase). */
export interface ClienteNube {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(tabla: string): any
  storage: { from(cubo: string): { remove(rutas: string[]): PromiseLike<{ error: { message: string } | null }> } }
}

export const CUBO_FOTOS = 'fotos-viaje'

/** La copia pequeña de una foto: `…/abc.jpg` → `…/abc_min.jpg` (la misma regla que `rutaMiniatura` de fotosViaje.ts). */
export const rutaPequena = (ruta: string): string => ruta.replace(/\.jpe?g$/i, '_min.jpg')

const TROZO = 100

/** Quita del almacén las rutas dadas (y sus copias pequeñas), de 100 en 100. Devuelve el error en palabras sencillas, o null. */
async function quitarArchivos(nube: ClienteNube, rutas: string[]): Promise<string | null> {
  for (let i = 0; i < rutas.length; i += TROZO) {
    const trozo = rutas.slice(i, i + TROZO).flatMap((r) => [r, rutaPequena(r)])
    const { error } = await nube.storage.from(CUBO_FOTOS).remove(trozo)
    if (error) return 'No se han podido borrar las fotos del viaje.'
  }
  return null
}

/** Cuántas fotos de ESTE viaje tiene esta persona (para decir «Tienes 155 fotos en este viaje»). */
export async function contarMisFotos(nube: ClienteNube, userId: string, rutaId: string): Promise<number> {
  const { data } = await nube.from('trip_photos').select('id').eq('user_id', userId).eq('trip_id', rutaId)
  return Array.isArray(data) ? data.length : 0
}

/**
 * Borra DE VERDAD las fotos de este viaje de esta persona: primero los archivos y solo si salió bien, las filas (si falla el almacén no se toca nada y se puede reintentar; si falla la tabla, el reintento
 * vuelve a pedir el borrado de archivos, que es inocuo si ya no están). Devuelve el error en palabras sencillas, o null.
 */
export async function borrarMisFotosDelViaje(nube: ClienteNube, userId: string, rutaId: string): Promise<string | null> {
  const { data, error } = await nube.from('trip_photos').select('id, storage_path').eq('user_id', userId).eq('trip_id', rutaId)
  if (error) return 'No se han podido leer las fotos del viaje.'
  const filas = (Array.isArray(data) ? data : []) as { id: string; storage_path: string }[]
  if (filas.length === 0) return null
  const fallo = await quitarArchivos(nube, filas.map((f) => f.storage_path))
  if (fallo) return fallo
  const { error: errorFilas } = await nube.from('trip_photos').delete().eq('user_id', userId).eq('trip_id', rutaId)
  return errorFilas ? 'No se han podido borrar las fotos del viaje.' : null
}

/** Una persona invitada sale del viaje: solo se quita ella (su fila de `trip_members`); el viaje sigue para los demás. */
export async function salirDelViaje(nube: ClienteNube, userId: string, filaDelViaje: string): Promise<string | null> {
  const { error } = await nube.from('trip_members').delete().eq('trip_id', filaDelViaje).eq('user_id', userId)
  return error ? 'No se ha podido salir del viaje. Inténtalo de nuevo.' : null
}

/** Quien creó el viaje lo borra: se borra la fila y, con ella, todo lo suyo. */
export async function borrarFilaDelViaje(nube: ClienteNube, filaDelViaje: string): Promise<string | null> {
  const { error } = await nube.from('trips').delete().eq('id', filaDelViaje)
  return error ? 'No se ha podido eliminar el viaje. Inténtalo de nuevo.' : null
}

export interface ViajeABorrar {
  /** El id de la RUTA (con el que se guardan las fotos). */
  rutaId: string
  /** La fila de `trips`; null si el viaje nunca llegó a guardarse en la nube. */
  filaId: string | null
  /** true: es de otra persona y esta está invitada (no lo borra: sale). */
  esInvitado: boolean
}

/**
 * Elimina el viaje de la nube. Orden: las fotos primero (si no se pueden borrar, el viaje se queda y se avisa: nunca fotos sin viaje), después la fila (o, si es invitada, solo su pertenencia).
 * Devuelve el error en palabras sencillas, o null.
 */
export async function eliminarViajeEnLaNube(nube: ClienteNube, userId: string, viaje: ViajeABorrar): Promise<string | null> {
  const fotos = await borrarMisFotosDelViaje(nube, userId, viaje.rutaId)
  if (fotos) return fotos
  if (!viaje.filaId) return null
  return viaje.esInvitado ? salirDelViaje(nube, userId, viaje.filaId) : borrarFilaDelViaje(nube, viaje.filaId)
}

/**
 * Las fotos que dejó pendientes un viaje borrado por otra persona (migración 0031: `fotos_por_borrar`): se quitan los archivos y después la anotación. Sin la tabla, no hace nada.
 * Devuelve cuántas quitó.
 */
export async function limpiarFotosPendientes(nube: ClienteNube, userId: string): Promise<number> {
  const { data, error } = await nube.from('fotos_por_borrar').select('id, storage_path').eq('user_id', userId)
  if (error || !Array.isArray(data) || data.length === 0) return 0
  const filas = data as { id: string; storage_path: string }[]
  if (await quitarArchivos(nube, filas.map((f) => f.storage_path))) return 0
  const { error: errorBorrar } = await nube.from('fotos_por_borrar').delete().eq('user_id', userId)
  return errorBorrar ? 0 : filas.length
}
