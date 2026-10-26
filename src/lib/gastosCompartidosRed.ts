import { supabase } from './supabaseClient'
import { leerImporte, type Importe } from './dinero'
import type { AmbitoGasto, EstadoGasto, GastoCompartido } from './gastosCompartidos'

/** La parte con red de los gastos compartidos (Tanda 10N, apartado 9): Supabase detrás de un `Backend` que se puede cambiar. La parte pura está en gastosCompartidos.ts. */
// ── La red ────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface NuevoGasto {
  tripId: string
  nombre: string
  precio: Importe
  ambito: AmbitoGasto
  estado: EstadoGasto
  pagadoPor: string[]
}

/** `disponible: false` cuando la tabla no existe (la migración 0037 sin aplicar) o no hay servidor: la app se queda con el presupuesto de siempre. */
export interface Backend {
  yo: () => Promise<string | null>
  cargar: (tripId: string) => Promise<{ gastos: GastoCompartido[]; disponible: boolean }>
  anadir: (g: NuevoGasto) => Promise<string | null>
  decidir: (id: string, estado: 'aceptado' | 'rechazado') => Promise<string | null>
  quitar: (id: string) => Promise<string | null>
  /** Avisa cuando algo cambia en el viaje (tiempo real); devuelve cómo dejar de escuchar. */
  escuchar: (tripId: string, alCambiar: () => void) => () => void
}

type Fila = { id: string; trip_id: string; autor_id: string; nombre: string; precio: unknown; ambito: AmbitoGasto; estado: EstadoGasto; pagado_por: string[] | null; decidido_por: string | null; created_at: string }
const COLUMNAS = 'id, trip_id, autor_id, nombre, precio, ambito, estado, pagado_por, decidido_por, created_at'

export function deFila(f: Fila): GastoCompartido | null {
  const precio = leerImporte(f.precio)
  if (!precio) return null
  return { id: f.id, tripId: f.trip_id, autorId: f.autor_id, nombre: f.nombre, precio, ambito: f.ambito, estado: f.estado, pagadoPor: f.pagado_por ?? [], decididoPor: f.decidido_por, creadoEn: f.created_at }
}

const MENSAJE_ERROR = 'No se ha podido guardar el gasto. Inténtalo de nuevo.'

export const backendSupabase: Backend = {
  yo: async () => {
    if (!supabase) return null
    try {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    } catch {
      return null
    }
  },
  cargar: async (tripId) => {
    if (!supabase) return { gastos: [], disponible: false }
    try {
      const { data, error } = await supabase.from('trip_gastos').select(COLUMNAS).eq('trip_id', tripId).order('created_at', { ascending: true })
      if (error) return { gastos: [], disponible: false }
      return { gastos: ((data ?? []) as Fila[]).map(deFila).filter((g): g is GastoCompartido => g !== null), disponible: true }
    } catch {
      return { gastos: [], disponible: false }
    }
  },
  anadir: async (g) => {
    if (!supabase) return 'El presupuesto compartido necesita conexión con el servidor; ahora mismo no está disponible.'
    const { error } = await supabase.from('trip_gastos').insert({ trip_id: g.tripId, nombre: g.nombre, precio: g.precio, ambito: g.ambito, estado: g.estado, pagado_por: g.ambito === 'mio' ? [] : g.pagadoPor })
    return error ? MENSAJE_ERROR : null
  },
  decidir: async (id, estado) => {
    if (!supabase) return 'Sin conexión con el servidor.'
    // Solo cambia si sigue pendiente (vale lo que decida el primero): sin filas cambiadas = ya estaba decidido.
    const { count, error } = await supabase.from('trip_gastos').update({ estado }, { count: 'exact' }).eq('id', id).eq('estado', 'pendiente')
    if (error) return 'No se ha podido guardar tu respuesta. Inténtalo de nuevo.'
    return (count ?? 0) > 0 ? null : 'YA_DECIDIDO'
  },
  quitar: async (id) => {
    if (!supabase) return 'Sin conexión con el servidor.'
    const { error } = await supabase.from('trip_gastos').delete().eq('id', id)
    return error ? 'No se ha podido quitar el gasto. Inténtalo de nuevo.' : null
  },
  escuchar: (tripId, alCambiar) => {
    if (!supabase) return () => undefined
    const canal = supabase
      .channel(`gastos-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_gastos', filter: `trip_id=eq.${tripId}` }, alCambiar)
      .subscribe()
    return () => {
      void supabase!.removeChannel(canal)
    }
  },
}
