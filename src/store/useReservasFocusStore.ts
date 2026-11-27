import { create } from 'zustand'
import type { Excursion } from '../lib/types'

/**
 * «Llévame a ese bloque de RESERVAS» (Tanda 6s): las fichas del resumen de arriba, el «+ AÑADIR VUELO» de la barra de DÍAS y el «Editar» de la ventana de llegada piden
 * un bloque; RESERVAS lo abre, baja hasta él (y, si es la llegada y vuelta, abre la mitad que se pide) y borra el pedido. Estado de pantalla: no se guarda con el viaje.
 */
export type BloqueReservasId = 'llegada' | 'aloj' | 'entradas' | 'excursiones' | 'coche' | 'util'

interface PedidoReservas {
  bloque: BloqueReservasId
  /** Solo en la llegada y vuelta: qué mitad se abre. */
  mitad?: 'arrival' | 'departure'
  /** (10S10 §6) Solo despliega el bloque (el [Ver] de DÍAS): no abre la hoja del vuelo. */
  soloBloque?: boolean
  id: number
}

/** (10S10 §4) «¿Ya la has reservado? Añade tu confirmación» de la página del día de excursión: abre RESERVAS › Excursiones y, dentro, la hoja de ESA excursión con el día puesto. */
interface PedidoExcursion {
  excursion: Excursion
  dayId: string
  id: number
}

interface ReservasFocusState {
  pedido: PedidoReservas | null
  excursionPedida: PedidoExcursion | null
  /** (V22) La tarjeta de «Útil para el viaje» que pidió una ficha del resumen (el seguro, la eSIM de un país): baja a ella y la abre. */
  utilPedida: string | null
  limpiarUtil: () => void
  /** (V75) «+ Añadir una reserva» › Entrada / Excursión o tour: abre la hoja de siempre de ese bloque (el buscador de la entrada; la lista de excursiones). */
  hojaPedida: { tipo: 'entrada' | 'excursion'; id: number } | null
  pedirHoja: (tipo: 'entrada' | 'excursion') => void
  limpiarHoja: () => void
  pedir: (bloque: BloqueReservasId, mitad?: 'arrival' | 'departure', soloBloque?: boolean, tarjeta?: string) => void
  pedirExcursion: (excursion: Excursion, dayId: string) => void
  limpiarExcursion: () => void
  limpiar: () => void
}

export const useReservasFocusStore = create<ReservasFocusState>((set) => ({
  pedido: null,
  excursionPedida: null,
  utilPedida: null,
  limpiarUtil: () => set({ utilPedida: null }),
  hojaPedida: null,
  pedirHoja: (tipo) => set({ hojaPedida: { tipo, id: Date.now() } }),
  limpiarHoja: () => set({ hojaPedida: null }),
  pedir: (bloque, mitad, soloBloque, tarjeta) => set({ pedido: { bloque, mitad, soloBloque, id: Date.now() }, utilPedida: tarjeta ?? null }),
  pedirExcursion: (excursion, dayId) => set({ pedido: { bloque: 'excursiones', id: Date.now() }, excursionPedida: { excursion, dayId, id: Date.now() } }),
  limpiarExcursion: () => set({ excursionPedida: null }),
  limpiar: () => set({ pedido: null }),
}))
