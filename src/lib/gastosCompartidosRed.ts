import { supabase } from './supabaseClient'
import { convertir, leerImporte, type Importe } from './dinero'
import type { AmbitoGasto, EstadoGasto, GastoCompartido } from './gastosCompartidos'
import type { PagoMarcado } from './cuentasGrupo'
import { aCentimos } from './cuentasGrupo'
import { cambioActual } from './useMoneda'

/** (10N7) Las cuentas se llevan en euros: un pago marcado en otra moneda (los de antes de la 10N7) se pasa con el cambio del día; sin cambio, tal cual. */
const aBaseDeCuentas = (i: Importe): Importe => (i.currency === 'EUR' ? i : (convertir(i, 'EUR', cambioActual()) ?? i))

/**
 * La parte con red de los gastos compartidos (Tanda 10N, apartado 9) y de las cuentas del grupo (Tanda 10N2): Supabase detrás de un `Backend` que se puede cambiar. La parte pura está en gastosCompartidos.ts
 * y cuentasGrupo.ts. Sin la migración 0040 (columna `entre`, tablas `trip_pagos` y `trip_ex_miembros`) todo sigue como en la 10N: gastos entre todos y sin pagos.
 */
export interface NuevoGasto {
  tripId: string
  nombre: string
  precio: Importe
  ambito: AmbitoGasto
  estado: EstadoGasto
  pagadoPor: string[]
  /** Entre quién se reparte (ids). Vacío = entre todos. */
  entre?: string[]
}

export interface CambiosDeGasto {
  nombre: string
  precio: Importe
  pagadoPor: string[]
  entre: string[]
}

/** Quien salió del viaje (o a quien quitaron): su nombre, para que sus gastos sigan con él en las cuentas. */
export interface ExMiembro {
  id: string
  nombre: string | null
}

export interface CargaDelViaje {
  gastos: GastoCompartido[]
  pagos: PagoMarcado[]
  exMiembros: ExMiembro[]
  /** `false` cuando la tabla no existe (la migración 0037 sin aplicar) o no hay servidor: la app se queda con el presupuesto de siempre. */
  disponible: boolean
  /** `false` sin la 0040: no hay «¿Entre quién?», ni pagos, ni nombres de quien salió. */
  cuentas: boolean
}

export interface Backend {
  yo: () => Promise<string | null>
  cargar: (tripId: string) => Promise<CargaDelViaje>
  anadir: (g: NuevoGasto) => Promise<string | null>
  editar: (id: string, c: CambiosDeGasto) => Promise<string | null>
  decidir: (id: string, estado: 'aceptado' | 'rechazado') => Promise<string | null>
  quitar: (id: string) => Promise<string | null>
  marcarPago: (p: { tripId: string; deudorId: string; acreedorId: string; importe: Importe }) => Promise<string | null>
  deshacerPago: (id: string) => Promise<string | null>
  /** Avisa cuando algo cambia en el viaje (tiempo real); devuelve cómo dejar de escuchar. */
  escuchar: (tripId: string, alCambiar: () => void) => () => void
}

type Fila = { id: string; trip_id: string; autor_id: string; nombre: string; precio: unknown; ambito: AmbitoGasto; estado: EstadoGasto; pagado_por: string[] | null; entre?: string[] | null; decidido_por: string | null; created_at: string }
const COLUMNAS = 'id, trip_id, autor_id, nombre, precio, ambito, estado, pagado_por, decidido_por, created_at'

export function deFila(f: Fila): GastoCompartido | null {
  const precio = leerImporte(f.precio)
  if (!precio) return null
  return { id: f.id, tripId: f.trip_id, autorId: f.autor_id, nombre: f.nombre, precio, ambito: f.ambito, estado: f.estado, pagadoPor: f.pagado_por ?? [], entre: f.entre ?? [], decididoPor: f.decidido_por, creadoEn: f.created_at }
}

const MENSAJE_ERROR = 'No se ha podido guardar el gasto. Inténtalo de nuevo.'
const SIN_NUBE = 'Sin conexión con el servidor.'

type FilaPago = { id: string; deudor_id: string; acreedor_id: string; importe: unknown; marcado_por: string }

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
    if (!supabase) return { gastos: [], pagos: [], exMiembros: [], disponible: false, cuentas: false }
    try {
      // Con la 0040: también `entre`. Sin ella, esa columna no existe y se vuelve a pedir lo de la 0037.
      let cuentas = true
      let r: { data: unknown; error: unknown } = await supabase.from('trip_gastos').select(`${COLUMNAS}, entre`).eq('trip_id', tripId).order('created_at', { ascending: true })
      if (r.error) {
        cuentas = false
        r = await supabase.from('trip_gastos').select(COLUMNAS).eq('trip_id', tripId).order('created_at', { ascending: true })
      }
      if (r.error) return { gastos: [], pagos: [], exMiembros: [], disponible: false, cuentas: false }
      const gastos = ((r.data ?? []) as unknown as Fila[]).map(deFila).filter((g): g is GastoCompartido => g !== null)
      let pagos: PagoMarcado[] = []
      let exMiembros: ExMiembro[] = []
      if (cuentas) {
        const p = await supabase.from('trip_pagos').select('id, deudor_id, acreedor_id, importe, marcado_por').eq('trip_id', tripId).order('created_at', { ascending: true })
        if (p.error) cuentas = false
        else
          pagos = ((p.data ?? []) as FilaPago[]).flatMap((x) => {
            const importe = leerImporte(x.importe)
            return importe ? [{ id: x.id, deudorId: x.deudor_id, acreedorId: x.acreedor_id, centimos: aCentimos(aBaseDeCuentas(importe)), marcadoPor: x.marcado_por }] : []
          })
        const e = await supabase.from('trip_ex_miembros').select('user_id, nombre').eq('trip_id', tripId)
        if (!e.error) exMiembros = ((e.data ?? []) as { user_id: string; nombre: string | null }[]).map((x) => ({ id: x.user_id, nombre: x.nombre }))
      }
      return { gastos, pagos, exMiembros, disponible: true, cuentas }
    } catch {
      return { gastos: [], pagos: [], exMiembros: [], disponible: false, cuentas: false }
    }
  },
  anadir: async (g) => {
    if (!supabase) return 'El presupuesto compartido necesita conexión con el servidor; ahora mismo no está disponible.'
    const fila = { trip_id: g.tripId, nombre: g.nombre, precio: g.precio, ambito: g.ambito, estado: g.estado, pagado_por: g.ambito === 'mio' ? [] : g.pagadoPor }
    let { error } = await supabase.from('trip_gastos').insert({ ...fila, entre: g.ambito === 'mio' ? [] : (g.entre ?? []) })
    // Sin la 0040 no existe la columna `entre`: se guarda como en la 10N (entre todos).
    if (error) ({ error } = await supabase.from('trip_gastos').insert(fila))
    return error ? MENSAJE_ERROR : null
  },
  editar: async (id, c) => {
    if (!supabase) return SIN_NUBE
    const { error } = await supabase.from('trip_gastos').update({ nombre: c.nombre, precio: c.precio, pagado_por: c.pagadoPor, entre: c.entre }).eq('id', id)
    return error ? 'No se han podido guardar los cambios. Inténtalo de nuevo.' : null
  },
  decidir: async (id, estado) => {
    if (!supabase) return SIN_NUBE
    // Solo cambia si sigue pendiente (vale lo que decida el primero): sin filas cambiadas = ya estaba decidido.
    const { count, error } = await supabase.from('trip_gastos').update({ estado }, { count: 'exact' }).eq('id', id).eq('estado', 'pendiente')
    if (error) return 'No se ha podido guardar tu respuesta. Inténtalo de nuevo.'
    return (count ?? 0) > 0 ? null : 'YA_DECIDIDO'
  },
  quitar: async (id) => {
    if (!supabase) return SIN_NUBE
    const { error } = await supabase.from('trip_gastos').delete().eq('id', id)
    return error ? 'No se ha podido quitar el gasto. Inténtalo de nuevo.' : null
  },
  marcarPago: async (p) => {
    if (!supabase) return SIN_NUBE
    const { error } = await supabase.from('trip_pagos').insert({ trip_id: p.tripId, deudor_id: p.deudorId, acreedor_id: p.acreedorId, importe: p.importe })
    return error ? 'No se ha podido marcar el pago. Inténtalo de nuevo.' : null
  },
  deshacerPago: async (id) => {
    if (!supabase) return SIN_NUBE
    const { error } = await supabase.from('trip_pagos').delete().eq('id', id)
    return error ? 'No se ha podido deshacer el pago. Inténtalo de nuevo.' : null
  },
  escuchar: (tripId, alCambiar) => {
    if (!supabase) return () => undefined
    const filtro = `trip_id=eq.${tripId}`
    const canal = supabase
      .channel(`gastos-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_gastos', filter: filtro }, alCambiar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_pagos', filter: filtro }, alCambiar)
      .subscribe()
    return () => {
      void supabase!.removeChannel(canal)
    }
  },
}
