import { supabase } from './supabaseClient'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { comprobarEncaje, type EstadoDeRecomendacion, type Recomendacion, type TipoDeRecomendacion } from './aplicarRecomendacion'

/**
 * Las recomendaciones de un viaje compartido (cuentas, parte 2, punto 5), contra la base de datos. El invitado recomienda (un cambio suelto, un día nuevo o la ruta
 * entera); el administrador acepta o no. Al aceptar, la ruta cambia de verdad. Si la ruta cambió desde que se mandó y la recomendación ya no encaja, no se aplica a
 * ciegas: se marca «ya no encaja» y se le dice. La parte pura (qué encaja, qué lleva cada tipo) está en aplicarRecomendacion.ts.
 */

const SIN_NUBE = 'Las recomendaciones necesitan conexión con el servidor; ahora mismo no está disponible.'

type Fila = { id: string; trip_id: string; author_id: string; tipo: TipoDeRecomendacion; payload: Record<string, unknown>; estado: EstadoDeRecomendacion; created_at: string }
const deFila = (f: Fila): Recomendacion => ({ id: f.id, tripId: f.trip_id, authorId: f.author_id, tipo: f.tipo, payload: f.payload, estado: f.estado, creadaEn: f.created_at })

/** El invitado manda una recomendación. */
export async function recomendar(tripId: string, tipo: TipoDeRecomendacion, payload: Record<string, unknown>): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  const { error } = await supabase.from('trip_recommendations').insert({ trip_id: tripId, tipo, payload })
  return error ? 'No se ha podido mandar la recomendación. Inténtalo de nuevo.' : null
}

/** Las recomendaciones de un viaje: el administrador ve todas; cada invitado, las suyas. */
export async function listarRecomendaciones(tripId: string, soloPendientes = false): Promise<Recomendacion[]> {
  if (!supabase) return []
  try {
    let consulta = supabase.from('trip_recommendations').select('id, trip_id, author_id, tipo, payload, estado, created_at').eq('trip_id', tripId).order('created_at', { ascending: true })
    if (soloPendientes) consulta = consulta.eq('estado', 'pendiente')
    const { data, error } = await consulta
    return error || !data ? [] : (data as Fila[]).map(deFila)
  } catch {
    return []
  }
}

async function marcar(id: string, estado: EstadoDeRecomendacion): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  const { error } = await supabase.from('trip_recommendations').update({ estado }).eq('id', id)
  return error ? 'No se ha podido guardar tu respuesta. Inténtalo de nuevo.' : null
}

export async function rechazarRecomendacion(id: string): Promise<string | null> {
  return marcar(id, 'rechazada')
}

export type ResultadoDeAceptar = { estado: 'aceptada' | 'ya_no_encaja' | 'error'; mensaje: string | null }

/**
 * El administrador acepta. Solo vale si el viaje abierto es el de la recomendación. Si encaja, cambia la ruta (con la copia de antes para la varita) y se marca
 * «aceptada»; si no, se marca «ya no encaja» y se le dice por qué. La ruta cambiada se guarda sola, como cualquier cambio.
 */
export async function aceptarRecomendacion(rec: Recomendacion): Promise<ResultadoDeAceptar> {
  const abierto = useSyncStore.getState().activeTripId
  if (!abierto || abierto !== rec.tripId) return { estado: 'error', mensaje: 'Abre primero ese viaje para aceptar la recomendación.' }
  const route = useRouteStore.getState().route
  const encaje = comprobarEncaje(route, rec)
  if (encaje.encaja === false) {
    const error = await marcar(rec.id, 'ya_no_encaja')
    return { estado: 'ya_no_encaja', mensaje: error ?? `Esta recomendación ya no encaja: ${encaje.motivo}` }
  }
  const aplicada = useRouteStore.getState().aplicarRecomendacion(rec)
  if (!aplicada.ok) {
    const error = await marcar(rec.id, 'ya_no_encaja')
    return { estado: 'ya_no_encaja', mensaje: error ?? `Esta recomendación ya no encaja: ${aplicada.motivo ?? 'la ruta ha cambiado'}` }
  }
  const error = await marcar(rec.id, 'aceptada')
  return { estado: 'aceptada', mensaje: error }
}
