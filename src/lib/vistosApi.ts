import type { Route } from './types'
import { supabase } from './supabaseClient'

/**
 * Los «Visto» de CADA persona (tabla `stop_visits`, migración 0020), aunque compartan viaje. Hoy el ✓ de una parada vive dentro de la ruta del viaje
 * (`checkedInAt`, que es del viaje, no de la persona); la tabla es donde irán los de cada uno cuando lleguen las pantallas de la parte 2.
 * Sin Supabase o con la migración sin aplicar, todo degrada en silencio (nada lanza).
 */

export interface VistoDeParada {
  tripId: string
  dayId: string
  stopId: string
  vistoEn: string
}

/** Pura: los vistos que lleva una ruta dentro (`checkedInAt` de cada parada). */
export function vistosDeLaRuta(tripId: string, route: Pick<Route, 'days'> | null | undefined): VistoDeParada[] {
  const salida: VistoDeParada[] = []
  for (const day of route?.days ?? []) {
    for (const stop of day.stops ?? []) {
      const cuando = (stop as { checkedInAt?: string | null }).checkedInAt
      if (cuando) salida.push({ tripId, dayId: day.id, stopId: stop.id, vistoEn: cuando })
    }
  }
  return salida
}

/** Guarda (o quita) el Visto de esta persona en esa parada de ese viaje. Devuelve un error en palabras sencillas o null. */
export async function guardarVisto(visto: Omit<VistoDeParada, 'vistoEn'>, marcado: boolean): Promise<string | null> {
  if (!supabase) return null
  try {
    if (marcado) {
      const { error } = await supabase.from('stop_visits').upsert({ trip_id: visto.tripId, day_id: visto.dayId, stop_id: visto.stopId }, { onConflict: 'user_id,trip_id,stop_id', ignoreDuplicates: true })
      return error ? 'No se ha podido guardar el Visto.' : null
    }
    const { error } = await supabase.from('stop_visits').delete().eq('trip_id', visto.tripId).eq('stop_id', visto.stopId)
    return error ? 'No se ha podido quitar el Visto.' : null
  } catch {
    return 'No se ha podido guardar el Visto.'
  }
}

/** Los vistos de esta persona en un viaje. Sin nube o sin la migración: []. */
export async function listarMisVistos(tripId: string): Promise<VistoDeParada[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase.from('stop_visits').select('trip_id, day_id, stop_id, visto_en').eq('trip_id', tripId)
    if (error || !data) return []
    return (data as { trip_id: string; day_id: string; stop_id: string; visto_en: string }[]).map((f) => ({ tripId: f.trip_id, dayId: f.day_id, stopId: f.stop_id, vistoEn: f.visto_en }))
  } catch {
    return []
  }
}

/**
 * Al entrar con una cuenta: los vistos que el administrador ya tiene en la ruta de sus viajes se copian a su tabla. Es idempotente (repetirlo no duplica nada).
 * Solo copia los viajes que son suyos (los que administra).
 */
export async function copiarVistosDeLosViajes(uid: string): Promise<number> {
  if (!supabase) return 0
  try {
    const { data, error } = await supabase.from('trips').select('id, route').eq('traveler_id', uid)
    if (error || !data) return 0
    const filas = (data as { id: string; route: Route }[]).flatMap((viaje) =>
      vistosDeLaRuta(viaje.id, viaje.route).map((v) => ({ trip_id: v.tripId, day_id: v.dayId, stop_id: v.stopId, visto_en: v.vistoEn })),
    )
    if (filas.length === 0) return 0
    const { error: errorCopia } = await supabase.from('stop_visits').upsert(filas, { onConflict: 'user_id,trip_id,stop_id', ignoreDuplicates: true })
    return errorCopia ? 0 : filas.length
  } catch {
    return 0
  }
}
