import { create } from 'zustand'

/**
 * La hoja «Personas del viaje» (Tanda 10N §4a): la abre la tarjeta de RUTA (las caras con el número) y la hoja de invitar («Personas del viaje · 4 ›»).
 * Y la hoja «Permiso de Ana» / «¿Quitar a Luis…?» / «¿Salir del viaje?» que se abren desde dentro de ella viven en su propio estado local.
 */
interface PersonasState {
  abierta: boolean
  abrir: () => void
  cerrar: () => void
}

export const usePersonasStore = create<PersonasState>((set) => ({
  abierta: false,
  abrir: () => set({ abierta: true }),
  cerrar: () => set({ abierta: false }),
}))
