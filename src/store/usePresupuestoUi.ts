import { create } from 'zustand'

/** La pantalla del presupuesto (Tanda 6z2): la abren el botón de la barra de abajo y la fila «Presupuesto · 334 €» de RESERVAS. Estado de pantalla: no se guarda con el viaje. */
interface PresupuestoUiState {
  abierto: boolean
  abrir: () => void
  cerrar: () => void
}

export const usePresupuestoUi = create<PresupuestoUiState>((set) => ({
  abierto: false,
  abrir: () => set({ abierto: true }),
  cerrar: () => set({ abierto: false }),
}))
