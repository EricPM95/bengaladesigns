import { supabase } from './supabaseClient'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { resolverRecomendacion, vistaPrevia, type CambioDeUnDia, type DiaPosible, type EstadoDeRecomendacion, type Recomendacion, type TipoDeRecomendacion } from './aplicarRecomendacion'

/**
 * Las recomendaciones de un viaje compartido (cuentas, parte 2, punto 5), contra la base de datos. El invitado recomienda (un cambio suelto, un día nuevo o la ruta
 * entera); el administrador acepta o no. Al aceptar, la ruta cambia de verdad y lo recomendado SUSTITUYE a lo que tiene ahora, aunque su ruta haya cambiado después (ya no hay
 * «ya no encaja»). Si el día de la recomendación ya no existe, tiene que elegir en qué día la pone. La parte pura está en aplicarRecomendacion.ts.
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

export type ResultadoDeAceptar =
  | { estado: 'aceptada'; mensaje: string | null }
  | { estado: 'necesita_dia'; mensaje: string; diasPosibles: DiaPosible[] }
  | { estado: 'error'; mensaje: string | null }

/**
 * El antes y el después de aceptar (R2), con la ruta de AHORA, por días: solo los que cambian, con lo que sale y lo que entra. null si hay que elegir un día primero
 * (usa `diaElegido`) o no se puede.
 */
export function vistaPreviaDeAceptar(rec: Pick<Recomendacion, 'tipo' | 'payload'>, diaElegido?: string | null): CambioDeUnDia[] | null {
  const route = useRouteStore.getState().route
  if (!route) return null
  const r = resolverRecomendacion(route, rec, diaElegido)
  return r.ok ? vistaPrevia(route, r.accion) : null
}

/**
 * El administrador acepta. Solo vale si el viaje abierto es el de la recomendación. Siempre se puede: cambia la ruta de ahora (con la copia de antes para la varita) y se marca
 * «aceptada». Si el día de la recomendación ya no existe, devuelve `necesita_dia` con los días entre los que elegir y no aplica nada hasta que llegue `diaElegido`.
 */
export async function aceptarRecomendacion(rec: Recomendacion, diaElegido?: string | null): Promise<ResultadoDeAceptar> {
  const abierto = useSyncStore.getState().activeTripId
  if (!abierto || abierto !== rec.tripId) return { estado: 'error', mensaje: 'Abre primero ese viaje para aceptar la recomendación.' }
  const aplicada = useRouteStore.getState().aplicarRecomendacion(rec, diaElegido)
  if (!aplicada.ok) {
    if (aplicada.necesitaDia) return { estado: 'necesita_dia', mensaje: aplicada.motivo ?? 'Elige en qué día la pones.', diasPosibles: aplicada.diasPosibles ?? [] }
    return { estado: 'error', mensaje: aplicada.motivo ?? 'No se ha podido aplicar la recomendación.' }
  }
  const error = await marcar(rec.id, 'aceptada')
  return { estado: 'aceptada', mensaje: error ?? aplicada.nota ?? null }
}
