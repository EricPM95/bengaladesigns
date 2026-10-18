import { create } from 'zustand'

/** Qué pantalla de Ajustes está abierta (cuentas parte 3): P3 (Ajustes) o P4 (Mis pases). El botón de Ajustes del Perfil la abre. */
interface AjustesUiState {
  pantalla: 'ajustes' | 'pases' | null
  editandoPerfil: boolean
  abrir: (pantalla?: 'ajustes' | 'pases') => void
  cerrar: () => void
  editarPerfil: (abierto: boolean) => void
}

export const useAjustesUi = create<AjustesUiState>((set) => ({
  pantalla: null,
  editandoPerfil: false,
  abrir: (pantalla = 'ajustes') => set({ pantalla }),
  cerrar: () => set({ pantalla: null }),
  editarPerfil: (abierto) => set({ editandoPerfil: abierto }),
}))

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __ajustes: typeof useAjustesUi }).__ajustes = useAjustesUi
