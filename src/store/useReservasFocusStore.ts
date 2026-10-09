import { create } from 'zustand'

/**
 * «Llévame a ese bloque de RESERVAS» (Tanda 6s): las fichas del resumen de arriba, el «+ AÑADIR VUELO» de la barra de DÍAS y el «Editar» de la ventana de llegada piden
 * un bloque; RESERVAS lo abre, baja hasta él (y, si es la llegada y vuelta, abre la mitad que se pide) y borra el pedido. Estado de pantalla: no se guarda con el viaje.
 */
export type BloqueReservasId = 'llegada' | 'aloj' | 'entradas' | 'excursiones'

interface PedidoReservas {
  bloque: BloqueReservasId
  /** Solo en la llegada y vuelta: qué mitad se abre. */
  mitad?: 'arrival' | 'departure'
  id: number
}

interface ReservasFocusState {
  pedido: PedidoReservas | null
  pedir: (bloque: BloqueReservasId, mitad?: 'arrival' | 'departure') => void
  limpiar: () => void
}

export const useReservasFocusStore = create<ReservasFocusState>((set) => ({
  pedido: null,
  pedir: (bloque, mitad) => set({ pedido: { bloque, mitad, id: Date.now() } }),
  limpiar: () => set({ pedido: null }),
}))
