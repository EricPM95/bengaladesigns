import { create } from 'zustand'

/**
 * (Tanda 10N5, apartado 2) LO NUEVO DE UN CAMBIO DEL VIAJE, MARCADO. Al tocar el aviso «Eric ha movido el Coliseo al jueves 12» se abre DÍAS en el primer día que ha cambiado y las paradas que Eric movió o añadió
 * salen con su etiqueta, «Movida» o «Nueva», igual que en el detalle de una propuesta. La marca se quita sola al cabo de un rato o al tocar otro aviso; no se guarda con el viaje. Pura pantalla.
 */
export type MarcaDeCambio = 'movida' | 'nueva'

interface CambiosMarcadosState {
  tripId: string | null
  /** Por nombre de parada normalizado (sin tildes ni mayúsculas ni «(noche)»). */
  marcas: Record<string, MarcaDeCambio>
  /** Los números de los días que han cambiado (el primero es al que se abre). */
  dias: number[]
  poner: (tripId: string | null, marcas: Record<string, MarcaDeCambio>, dias: number[]) => void
  quitar: () => void
}

let temporizador: ReturnType<typeof setTimeout> | null = null

export const normaDeParada = (s: string): string => String(s ?? '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

export const useCambiosMarcados = create<CambiosMarcadosState>((set) => ({
  tripId: null,
  marcas: {},
  dias: [],
  poner: (tripId, marcas, dias) => {
    if (temporizador) clearTimeout(temporizador)
    set({ tripId, marcas, dias })
    // Se quitan solas a los 2 minutos: es una ayuda para ver lo que cambió, no un estado del viaje.
    temporizador = setTimeout(() => set({ tripId: null, marcas: {}, dias: [] }), 120_000)
  },
  quitar: () => {
    if (temporizador) clearTimeout(temporizador)
    set({ tripId: null, marcas: {}, dias: [] })
  },
}))
