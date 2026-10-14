import { create } from 'zustand'
import type { Coordinates } from '../lib/types'

/**
 * Abrir EXPLORAR ya con un filtro y un punto de partida (Tanda 6z6): lo usa «Cerca de ti» de HOY (Baños / Fuentes / Comer). Quien lo pide lo deja aquí y pasa a la pestaña EXPLORAR;
 * `ExplorePanel` lo lee y lo vacía al abrir (un pedido se usa una sola vez).
 */
export interface AperturaExplorar {
  /** (Tanda 7: 'atracciones' es el chip de los monumentos —«Atracciones» hoy—; lo usa «Explorar monumentos» de la tarjeta «Hoy vuelves a casa».) */
  categoria: 'banos' | 'fuentes' | 'restaurantes' | 'atracciones'
  /** Desde dónde se ordena por cercanía (donde está el viajero, o la siguiente parada). null: la ubicación se pide como siempre. */
  origen: Coordinates | null
  /** Abrir directamente en «Cerca de mí» aunque no haya punto de partida (de pago; la ubicación se pide al entrar). Sin él, se abre en «Recomendados» (con «Cerca de mí» a un toque). */
  cerca?: boolean
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
