import { create } from 'zustand'
import type { Coordinates } from '../lib/types'

/**
 * Abrir EXPLORAR ya con un filtro y un punto de partida (Tanda 6z6): lo usa «Cerca de ti» de HOY (Baños / Fuentes / Comer). Quien lo pide lo deja aquí y pasa a la pestaña EXPLORAR;
 * `ExplorePanel` lo lee y lo vacía al abrir (un pedido se usa una sola vez).
 */
export interface AperturaExplorar {
  categoria: 'banos' | 'fuentes' | 'restaurantes'
  /** Desde dónde se ordena por cercanía (donde está el viajero, o la siguiente parada). null: la ubicación se pide como siempre. */
  origen: Coordinates | null
}

interface ExploreAperturaState {
  pedido: AperturaExplorar | null
  pedir: (apertura: AperturaExplorar) => void
  /** Lo lee y lo vacía de una vez. */
  tomar: () => AperturaExplorar | null
}

export const useExploreAperturaStore = create<ExploreAperturaState>((set, get) => ({
  pedido: null,
  pedir: (apertura) => set({ pedido: apertura }),
  tomar: () => {
    const pedido = get().pedido
    if (pedido) set({ pedido: null })
    return pedido
  },
}))
