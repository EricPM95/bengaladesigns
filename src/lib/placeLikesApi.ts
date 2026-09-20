import { supabase } from './supabaseClient'
import { bootstrapTraveler } from './tripPersistence'

/**
 * "Me gusta" por lugar — ordena la pestaña "Recomendados" de la pantalla de explorar/añadir parada.
 *
 * Usa la MISMA sesión anónima que ya usa la persistencia de viajes (bootstrapTraveler): cada
 * dispositivo tiene un `auth.uid()` estable sin registro, y la tabla impone 1 like por usuario y
 * lugar (ver supabase/migrations/0012_place_likes.sql). El total no se guarda denormalizado: se
 * cuenta sobre las filas, que es lo único que no puede desviarse.
 *
 * TODO degrada a silencio: sin Supabase configurado, o con la migración 0012 aún sin aplicar en el
 * dashboard, `fetchPlaceLikes` devuelve un mapa vacío y `togglePlaceLike` no hace nada. La pantalla
 * sigue funcionando entera — "Recomendados" simplemente ordena por nivel curado en vez de por likes.
 */
export interface PlaceLikes {
  /** nombre del lugar → nº total de likes de todos los viajeros. */
  counts: Map<string, number>
  /** nombres a los que ESTE viajero ya ha dado like. */
  mine: Set<string>
}

export const EMPTY_PLACE_LIKES: PlaceLikes = { counts: new Map(), mine: new Set() }

export async function fetchPlaceLikes(destination: string): Promise<PlaceLikes> {
  if (!supabase) return EMPTY_PLACE_LIKES
  try {
    const userId = await bootstrapTraveler().catch(() => null)
    const { data, error } = await supabase.from('place_likes').select('place_name, user_id').eq('destination', destination)
    if (error) {
      console.warn('[place-likes] no se pudieron leer los likes:', error.message)
      return EMPTY_PLACE_LIKES
    }
    const counts = new Map<string, number>()
    const mine = new Set<string>()
    for (const row of data ?? []) {
      counts.set(row.place_name, (counts.get(row.place_name) ?? 0) + 1)
      if (userId && row.user_id === userId) mine.add(row.place_name)
    }
    return { counts, mine }
  } catch (error) {
    console.warn('[place-likes] fallo leyendo likes:', error)
    return EMPTY_PLACE_LIKES
  }
}

/**
 * Da o quita el like de ESTE viajero. Devuelve el estado resultante (`true` = ahora le gusta) o
 * `null` si no se pudo escribir — quien llama revierte su estado optimista en ese caso.
 */
export async function togglePlaceLike(destination: string, placeName: string, liked: boolean): Promise<boolean | null> {
  if (!supabase) return null
  try {
    const userId = await bootstrapTraveler()
    if (liked) {
      // `user_id` explícito además del default de la tabla: la policy comprueba auth.uid() = user_id,
      // y mandarlo hace que un desajuste falle aquí y no en silencio.
      const { error } = await supabase.from('place_likes').insert({ place_name: placeName, destination, user_id: userId })
      // 23505 = unique_violation: ya tenía like (doble pulsación rápida). No es un error real.
      if (error && error.code !== '23505') {
        console.warn('[place-likes] no se pudo dar like:', error.message)
        return null
      }
      return true
    }
    const { error } = await supabase.from('place_likes').delete().eq('destination', destination).eq('place_name', placeName).eq('user_id', userId)
    if (error) {
      console.warn('[place-likes] no se pudo quitar el like:', error.message)
      return null
    }
    return false
  } catch (error) {
    console.warn('[place-likes] fallo escribiendo el like:', error)
    return null
  }
}
