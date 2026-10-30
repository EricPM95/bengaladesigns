import { create } from 'zustand'

/**
 * (10S5) «Propón un sitio»: la hoja se puede abrir DESDE CUALQUIER SITIO (hoy, desde [Añadir otra reserva] cuando el sitio no está en JUTRIP; mañana, desde un botón de proponer sitios o de avisar de un error).
 * Basta con llamar a `abrirProponerSitio({ nombre, origen })` (fuera de React) o a `useProponerSitio()` (en un componente): `ProponerSitioHost`, montado una sola vez en App, pinta la hoja.
 * `nombre` = lo que ya había escrito (sale escrito en «Nombre del sitio»); `origen` = desde qué pantalla se manda (se guarda: «reservas», «explorar»…).
 */
export interface AperturaProponerSitio {
  nombre?: string
  origen?: string
}

interface ProponerSitioState {
  abierta: boolean
  nombre: string
  origen: string
  abrir: (apertura?: AperturaProponerSitio) => void
  cerrar: () => void
}

export const useProponerSitioStore = create<ProponerSitioState>((set) => ({
  abierta: false,
  nombre: '',
  origen: '',
  abrir: (apertura) => set({ abierta: true, nombre: (apertura?.nombre ?? '').trim(), origen: apertura?.origen ?? '' }),
  cerrar: () => set({ abierta: false }),
}))

/** Abre la hoja «Propón un sitio» desde donde sea (no hace falta estar dentro de un componente). */
export function abrirProponerSitio(apertura?: AperturaProponerSitio): void {
  useProponerSitioStore.getState().abrir(apertura)
}

/** El gancho global: `const proponerSitio = useProponerSitio(); proponerSitio({ nombre: 'Torre Eiffel', origen: 'reservas' })`. */
export function useProponerSitio(): (apertura?: AperturaProponerSitio) => void {
  return useProponerSitioStore((s) => s.abrir)
}
