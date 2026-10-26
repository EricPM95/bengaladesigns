import { create } from 'zustand'
import type { GastoCompartido } from '../lib/gastosCompartidos'
import { backendSupabase, type Backend, type NuevoGasto } from '../lib/gastosCompartidosRed'
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
  disponible: boolean | null
  franja: FranjaDeGasto | null
  /** El gasto que se marca en verde un momento (el que acaban de aceptar). */
  resaltado: string | null
  cargar: (tripId: string | null) => Promise<void>
  recargar: () => Promise<void>
  anadir: (g: Omit<NuevoGasto, 'tripId'>) => Promise<string | null>
  decidir: (id: string, estado: 'aceptado' | 'rechazado') => Promise<string | null>
  quitar: (id: string) => Promise<string | null>
  cerrarFranja: () => void
  poner: (datos: Partial<Pick<GastosState, 'tripId' | 'yoId' | 'gastos' | 'disponible'>>) => void
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
  disponible: null,
  franja: null,
  resaltado: null,
  cargar: async (tripId) => {
    if (!tripId) {
      set({ tripId: null, gastos: [], disponible: null, franja: null, resaltado: null })
      return
    }
    if (get().tripId !== tripId) set({ tripId, gastos: [], disponible: null, franja: null, resaltado: null })
    const yo = get().yoId ?? (await backend.yo())
    const r = await backend.cargar(tripId)
    if (get().tripId !== tripId) return // (mientras tanto se abrió otro viaje)
    set({ yoId: yo, gastos: r.gastos, disponible: r.disponible })
  },
  recargar: async () => {
    const { tripId, gastos: antes, yoId } = get()
    if (!tripId) return
    const r = await backend.cargar(tripId)
    if (get().tripId !== tripId) return
    // ¿Alguno de MIS gastos pendientes lo han decidido? → la franja de arriba y el verde de un momento.
    const decidido = r.gastos.find((g) => g.autorId === yoId && g.ambito === 'grupo' && g.estado !== 'pendiente' && antes.some((a) => a.id === g.id && a.estado === 'pendiente'))
    set({ gastos: r.gastos, disponible: r.disponible })
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
