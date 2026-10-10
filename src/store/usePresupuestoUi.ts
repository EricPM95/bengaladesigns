import { create } from 'zustand'

/** La pantalla del presupuesto (Tanda 6z2): la abre SOLO la cartera de la cabecera (`BotonCartera`, la de arriba de la app y la de RESERVAS; Tanda 6z6b). Estado de pantalla: no se guarda con el viaje. */
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
