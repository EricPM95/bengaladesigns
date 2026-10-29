import { create } from 'zustand'

/**
 * La pantalla del presupuesto (Tanda 6z2): la abre SOLO la cartera de la cabecera (`BotonCartera`, la de arriba de la app y la de RESERVAS; Tanda 6z6b). Estado de pantalla: no se guarda con el viaje.
 * (Tanda 10N10 §5b) `pestana`: «Mi cuenta» o la cuenta común. Al abrir, siempre «Mi cuenta» (salvo que se pida otra: `abrir('comun')`).
 */
interface PresupuestoUiState {
  abierto: boolean
  pestana: 'mia' | 'comun'
  abrir: (pestana?: 'mia' | 'comun') => void
  cerrar: () => void
  ponerPestana: (pestana: 'mia' | 'comun') => void
}

export const usePresupuestoUi = create<PresupuestoUiState>((set) => ({
  abierto: false,
  pestana: 'mia',
  abrir: (pestana) => set({ abierto: true, pestana: pestana === 'comun' ? 'comun' : 'mia' }),
  cerrar: () => set({ abierto: false }),
  ponerPestana: (pestana) => set({ pestana }),
}))
