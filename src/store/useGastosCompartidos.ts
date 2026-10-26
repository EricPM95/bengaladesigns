import { create } from 'zustand'
import type { GastoCompartido } from '../lib/gastosCompartidos'
import type { PagoMarcado } from '../lib/cuentasGrupo'
import { backendSupabase, type Backend, type CambiosDeGasto, type ExMiembro, type NuevoGasto } from '../lib/gastosCompartidosRed'
import type { Importe } from '../lib/dinero'
import { useAvisosStore } from './useAvisosStore'

/**
 * LOS GASTOS COMPARTIDOS DEL VIAJE ABIERTO (Tanda 10N, apartado 9). Los carga `GastosCompartidosHost` (al abrir el viaje, en tiempo real y cada poco con la app a la vista).
 * `disponible` es null hasta saber si la tabla existe (migración 0037): si no existe, la app se queda con el presupuesto de siempre.
 * Cuando un gasto MÍO pasa de pendiente a aceptado o rechazado mientras tengo la app abierta, sale la franja de arriba («Eric ha aceptado tu gasto», que se va sola) y el gasto se marca en verde un momento.
 */
export interface FranjaDeGasto {
  /** Cambia en cada franja: la pantalla la usa para reiniciar el temporizador. */
  n: number
  resultado: 'aceptado' | 'rechazado'
  nombre: string
  precio: Importe
  gastoId: string
}

interface GastosState {
  tripId: string | null
  yoId: string | null
  gastos: GastoCompartido[]
  /** Los «Ya está pagado» (Tanda 10N2) y quien salió del viaje (su nombre, para las cuentas). */
  pagos: PagoMarcado[]
  exMiembros: ExMiembro[]
  /** ¿Existe la migración 0040 (¿Entre quién?, pagos)? */
  cuentas: boolean
  disponible: boolean | null
  franja: FranjaDeGasto | null
  /** El gasto que se marca en verde un momento (el que acaban de aceptar). */
  resaltado: string | null
  cargar: (tripId: string | null) => Promise<void>
  recargar: () => Promise<void>
  anadir: (g: Omit<NuevoGasto, 'tripId'>) => Promise<string | null>
  decidir: (id: string, estado: 'aceptado' | 'rechazado') => Promise<string | null>
  editar: (id: string, cambios: CambiosDeGasto) => Promise<string | null>
  marcarPago: (p: { deudorId: string; acreedorId: string; importe: { amount: number; currency: string } }) => Promise<string | null>
  deshacerPago: (id: string) => Promise<string | null>
  quitar: (id: string) => Promise<string | null>
  cerrarFranja: () => void
  poner: (datos: Partial<Pick<GastosState, 'tripId' | 'yoId' | 'gastos' | 'disponible' | 'pagos' | 'exMiembros' | 'cuentas'>>) => void
}

let backend: Backend = backendSupabase
/** Cambia dónde se guardan los gastos (en desarrollo, uno en memoria; vuelve al de Supabase con `null`). */
export function usarBackendDeGastos(b: Backend | null): void {
  backend = b ?? backendSupabase
}
export const backendDeGastos = (): Backend => backend

let contadorFranja = 0
let temporizadorVerde: ReturnType<typeof setTimeout> | null = null

export const useGastosCompartidos = create<GastosState>((set, get) => ({
  tripId: null,
  yoId: null,
  gastos: [],
  pagos: [],
  exMiembros: [],
  cuentas: false,
  disponible: null,
  franja: null,
  resaltado: null,
  cargar: async (tripId) => {
    if (!tripId) {
      set({ tripId: null, gastos: [], pagos: [], exMiembros: [], cuentas: false, disponible: null, franja: null, resaltado: null })
      return
    }
    if (get().tripId !== tripId) set({ tripId, gastos: [], pagos: [], exMiembros: [], cuentas: false, disponible: null, franja: null, resaltado: null })
    const yo = get().yoId ?? (await backend.yo())
    const r = await backend.cargar(tripId)
    if (get().tripId !== tripId) return // (mientras tanto se abrió otro viaje)
    set({ yoId: yo, gastos: r.gastos, pagos: r.pagos, exMiembros: r.exMiembros, cuentas: r.cuentas, disponible: r.disponible })
  },
  recargar: async () => {
    const { tripId, gastos: antes, yoId } = get()
    if (!tripId) return
    const r = await backend.cargar(tripId)
    if (get().tripId !== tripId) return
    // ¿Alguno de MIS gastos pendientes lo han decidido? → la franja de arriba y el verde de un momento.
    const decidido = r.gastos.find((g) => g.autorId === yoId && g.ambito === 'grupo' && g.estado !== 'pendiente' && antes.some((a) => a.id === g.id && a.estado === 'pendiente'))
    set({ gastos: r.gastos, pagos: r.pagos, exMiembros: r.exMiembros, cuentas: r.cuentas, disponible: r.disponible })
    if (decidido) {
      set({ franja: { n: ++contadorFranja, resultado: decidido.estado === 'aceptado' ? 'aceptado' : 'rechazado', nombre: decidido.nombre, precio: decidido.precio, gastoId: decidido.id } })
      if (decidido.estado === 'aceptado') {
        set({ resaltado: decidido.id })
        if (temporizadorVerde) clearTimeout(temporizadorVerde)
        temporizadorVerde = setTimeout(() => set({ resaltado: null }), 3500)
      }
      // El aviso de la campanita ya lo creó la base de datos: se vuelve a leer para que salga sin esperar al minuto.
      void useAvisosStore.getState().cargar()
    }
  },
  anadir: async (g) => {
    const { tripId } = get()
    if (!tripId) return 'No hay un viaje abierto.'
    const error = await backend.anadir({ ...g, tripId })
    if (!error) await get().recargar()
    return error
  },
  decidir: async (id, estado) => {
    const error = await backend.decidir(id, estado)
    await get().recargar()
    void useAvisosStore.getState().cargar()
    return error
  },
  editar: async (id, cambios) => {
    const error = await backend.editar(id, cambios)
    if (!error) await get().recargar()
    return error
  },
  marcarPago: async (p) => {
    const { tripId } = get()
    if (!tripId) return 'No hay un viaje abierto.'
    const error = await backend.marcarPago({ ...p, tripId })
    if (!error) await get().recargar()
    return error
  },
  deshacerPago: async (id) => {
    const error = await backend.deshacerPago(id)
    if (!error) await get().recargar()
    return error
  },
  quitar: async (id) => {
    const error = await backend.quitar(id)
    if (!error) await get().recargar()
    return error
  },
  cerrarFranja: () => set({ franja: null }),
  poner: (datos) => set(datos),
}))

// Solo desarrollo: window.__gastos.getState().poner({ ... }) para probar las pantallas sin servidor.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __gastos: typeof useGastosCompartidos }).__gastos = useGastosCompartidos
// Solo desarrollo: el servidor de mentira para las capturas y la prueba de las pantallas (window.__gastosFalsos).
if (import.meta.env.DEV && typeof window !== 'undefined') void import('../dev/gastosFalsos')
