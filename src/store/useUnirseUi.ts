import { create } from 'zustand'

/** LA HOJA «ESCRIBE EL CÓDIGO» (Tanda 10N5, apartado 3): un solo almacén para abrirla desde la primera pantalla, el [+] del Perfil y los Ajustes. */
interface UnirseUiState {
  abierta: boolean
  abrir: () => void
  cerrar: () => void
}

export const useUnirseUi = create<UnirseUiState>((set) => ({
  abierta: false,
  abrir: () => set({ abierta: true }),
  cerrar: () => set({ abierta: false }),
}))
