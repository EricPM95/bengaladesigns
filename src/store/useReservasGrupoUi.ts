import { create } from 'zustand'

/**
 * Lo que la campana le pide a RESERVAS (Tanda 10N §8): «Reservar la mía a la misma hora» y «Ya la tengo» de un aviso de «Eric ha reservado el Coliseo…». La campana cambia a RESERVAS y deja aquí el
 * pedido; la lista de entradas lo recoge, abre lo que toca (la compra con el día y la hora del dueño, o la hoja para añadir la que ya tiene) y lo limpia.
 */
export interface PedidoDeGrupo {
  accion: 'misma-hora' | 'ya-la-tengo'
  /** El id de la reserva del dueño. */
  reservaId: string
}

interface Estado {
  pedido: PedidoDeGrupo | null
  pedir: (pedido: PedidoDeGrupo) => void
  limpiar: () => void
}

export const useReservasGrupoUi = create<Estado>((set) => ({
  pedido: null,
  pedir: (pedido) => set({ pedido }),
  limpiar: () => set({ pedido: null }),
}))
