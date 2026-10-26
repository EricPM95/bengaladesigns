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

type Fila = { id: string; trip_id: string; author_id: string; tipo: TipoDeRecomendacion; payload: Record<string, unknown>; estado: EstadoDeRecomendacion; created_at: string; decisiones?: Record<string, 'aceptado' | 'rechazado'> | null }
const deFila = (f: Fila): Recomendacion => ({ id: f.id, tripId: f.trip_id, authorId: f.author_id, tipo: f.tipo, payload: f.payload, estado: f.estado, creadaEn: f.created_at, decisiones: f.decisiones ?? {} })

/** El invitado manda una recomendación. */
async function recomendarDeVerdad(tripId: string, tipo: TipoDeRecomendacion, payload: Record<string, unknown>): Promise<string | null> {
  if (!supabase) return SIN_NUBE
  const { error } = await supabase.from('trip_recommendations').insert({ trip_id: tripId, tipo, payload })
  return error ? 'No se ha podido mandar la recomendación. Inténtalo de nuevo.' : null
}

/** Las recomendaciones de un viaje: el administrador ve todas; cada invitado, las suyas. */
export async function listarRecomendaciones(tripId: string, soloPendientes = false): Promise<Recomendacion[]> {
  if (!supabase) return []
  try {
    const pedir = (columnas: string) => {
      let consulta = supabase!.from('trip_recommendations').select(columnas).eq('trip_id', tripId).order('created_at', { ascending: true })
      if (soloPendientes) consulta = consulta.eq('estado', 'pendiente')
      return consulta
    }
    // (Tanda 10N: con la migración 0039 hay `decisiones` por cada cambio; sin ella la columna no existe y se pide como siempre.)
    let { data, error } = await pedir('id, trip_id, author_id, tipo, payload, estado, created_at, decisiones')
    if (error) ({ data, error } = await pedir('id, trip_id, author_id, tipo, payload, estado, created_at'))
    return error || !data ? [] : (data as unknown as Fila[]).map(deFila)
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

/* ------------------------------------------------------------------ */
/* Tanda 10N: la propuesta de cambios sueltos                          */
/* ------------------------------------------------------------------ */

/**
 * Lo único que toca la red en la propuesta (las pruebas lo cambian por uno de mentira, `window.__puente` en desarrollo):
 *   · `recomendar`: manda la propuesta (una sola fila con todos los cambios);
 *   · `leerDecisiones`: lo que ya se ha decidido de una propuesta (para que, si dos la miran a la vez, valga lo que decida el primero);
 *   · `guardarDecisiones`: guarda lo decidido (y, si ya está todo decidido, la deja aceptada o rechazada).
 */
export interface PuenteDeRecomendaciones {
  recomendar: (tripId: string, tipo: TipoDeRecomendacion, payload: Record<string, unknown>) => Promise<string | null>
  leerDecisiones: (recId: string) => Promise<Record<string, 'aceptado' | 'rechazado'> | null>
  guardarDecisiones: (recId: string, decisiones: Record<string, 'aceptado' | 'rechazado'>, estado: EstadoDeRecomendacion | null) => Promise<string | null>
}

export const puente: PuenteDeRecomendaciones = {
  recomendar: recomendarDeVerdad,
  leerDecisiones: async (recId) => {
    if (!supabase) return null
    const { data, error } = await supabase.from('trip_recommendations').select('decisiones').eq('id', recId).maybeSingle()
    return error || !data ? null : ((data as { decisiones?: Record<string, 'aceptado' | 'rechazado'> | null }).decisiones ?? {})
  },
  guardarDecisiones: async (recId, decisiones, estado) => {
    if (!supabase) return SIN_NUBE
    const { error } = await supabase.from('trip_recommendations').update({ decisiones, ...(estado ? { estado } : {}) }).eq('id', recId)
    if (!error) return null
    // Sin la migración 0039 no existe `decisiones`: se guarda al menos el estado cuando ya está todo decidido.
    if (!estado) return null
    const { error: e2 } = await supabase.from('trip_recommendations').update({ estado }).eq('id', recId)
    return e2 ? 'No se ha podido guardar tu respuesta. Inténtalo de nuevo.' : null
  },
}
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __puente: PuenteDeRecomendaciones }).__puente = puente

/** El invitado manda una recomendación (o su propuesta). */
export const recomendar = (tripId: string, tipo: TipoDeRecomendacion, payload: Record<string, unknown>): Promise<string | null> => puente.recomendar(tripId, tipo, payload)
