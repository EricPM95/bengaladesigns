import { create } from 'zustand'

/**
 * EL BOTÓN «REORGANIZAR» DEL PASE (Tanda 10S7, apartado 2; `Piezas/Reorganizar` R1-R3). Estado de pantalla (no se guarda con el viaje):
 *  - `dias`: los días en los que reorganizar CAMBIARÍA algo (ya calculado). Con alguno, sale el botón flotante.
 *  - `alerta`: la alerta «¿Reorganizamos tu día?» abierta.
 *  - `iluminadas`: los ids de las paradas que se acaban de mover (se iluminan un momento).
 * «Ahora no» y el botón de la alerta lo dejan todo a cero: el botón no vuelve hasta el próximo cambio que de verdad lo pida.
 */
interface ReorganizarState {
  dias: string[]
  alerta: boolean
  trabajando: boolean
  iluminadas: string[]
  /** Un cambio nuevo ha calculado estos días: se suman los que cambian y se quitan los que ya están bien. */
  poner: (cambian: string[], revisados: string[]) => void
  abrirAlerta: () => void
  cerrarAlerta: () => void
  /** «Ahora no»: el botón se esconde hasta el próximo cambio. */
  ahoraNo: () => void
  fijarTrabajando: (trabajando: boolean) => void
  iluminar: (ids: string[]) => void
  limpiarIluminadas: () => void
  reiniciar: () => void
  /** Reorganizado: el botón y la alerta se van, pero lo movido sigue iluminado un momento. */
  terminar: () => void
}

export const useReorganizarStore = create<ReorganizarState>((set) => ({
  dias: [],
  alerta: false,
  trabajando: false,
  iluminadas: [],
  poner: (cambian, revisados) =>
    set((state) => {
      const resto = state.dias.filter((id) => !revisados.includes(id))
      const dias = [...new Set([...resto, ...cambian])]
      return dias.length === state.dias.length && dias.every((id, i) => id === state.dias[i]) ? state : { dias, alerta: dias.length === 0 ? false : state.alerta }
    }),
  abrirAlerta: () => set({ alerta: true }),
  cerrarAlerta: () => set({ alerta: false }),
  ahoraNo: () => set({ alerta: false, dias: [] }),
  fijarTrabajando: (trabajando) => set({ trabajando }),
  iluminar: (ids) => set({ iluminadas: ids }),
  limpiarIluminadas: () => set({ iluminadas: [] }),
  reiniciar: () => set({ dias: [], alerta: false, trabajando: false, iluminadas: [] }),
  terminar: () => set({ dias: [], alerta: false, trabajando: false }),
}))
