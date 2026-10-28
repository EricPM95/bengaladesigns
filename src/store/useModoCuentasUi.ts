import { create } from 'zustand'

/**
 * Las hojas de «cómo lleváis las cuentas» (Tanda 10N7): la de elegir (se abre desde el botón del presupuesto, desde la pregunta de arriba o desde el aviso «Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?»)
 * y la de ponerle nombre a la cuenta conjunta. Estado de pantalla: no se guarda con el viaje. Las pinta `ModoCuentasHost`, siempre montado.
 */
interface ModoCuentasUiState {
  eligiendo: boolean
  renombrando: boolean
  abrirEleccion: () => void
  cerrarEleccion: () => void
  abrirNombre: () => void
  cerrarNombre: () => void
}

export const useModoCuentasUi = create<ModoCuentasUiState>((set) => ({
  eligiendo: false,
  renombrando: false,
  abrirEleccion: () => set({ eligiendo: true }),
  cerrarEleccion: () => set({ eligiendo: false }),
  abrirNombre: () => set({ renombrando: true }),
  cerrarNombre: () => set({ renombrando: false }),
}))
