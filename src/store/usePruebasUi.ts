import { create } from 'zustand'

/**
 * El panel de pruebas (Tanda 6z6; solo en local y vistas previas): si la hoja está abierta y un contador que sube cada vez que cambia la versión o los números de prueba, para que la app
 * se vuelva a pintar entera con lo nuevo (lo de pago se lee al pintar, no se suscribe a nada).
 */
interface PruebasUiState {
  abierto: boolean
  version: number
  abrir: () => void
  cerrar: () => void
  /** Vuelve a pintar toda la app (RouteView usa este número como `key`). */
  repintar: () => void
}

export const usePruebasUi = create<PruebasUiState>((set) => ({
  abierto: false,
  version: 0,
  abrir: () => set({ abierto: true }),
  cerrar: () => set({ abierto: false }),
  repintar: () => set((state) => ({ version: state.version + 1 })),
}))
