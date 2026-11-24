import { create } from 'zustand'

/**
 * LOS AVISOS DE ABAJO DE HOY (Tanda V2, H5): UNO A LA VEZ, en la misma zona (encima de las pestañas, a todo lo ancho) y se van solos. Antes cada aviso (parada saltada, «Plan actualizado»,
 * «Más tiempo», «Ya ha cerrado»…) se pintaba por su cuenta y podían salir apilados. Ahora todos pasan por esta cola: el que llega con otro a la vista espera su turno.
 * Los pone cualquiera con `avisarAbajo(...)`; los pinta `AvisoDeAbajoHost` (v2/AvisoDeAbajo.tsx), montado una sola vez en HOY.
 */
export interface AvisoDeAbajo {
  /** Para no repetirlo: un aviso con el mismo id que otro que espera o se ve se descarta. */
  id: string
  texto: string
  /** Una acción (p. ej. [Deshacer]). «Parada saltada» NO lleva [Deshacer]; «Plan actualizado» sí. */
  accion?: { etiqueta: string; alTocar: () => void }
  /** Cuánto se queda a la vista (por defecto 6 s; con acción, 12 s). */
  ms?: number
  /** Se llama al irse (solo o con la acción). */
  alIrse?: () => void
  /** (V43 §6) Los ids de los avisos sin [Deshacer] que se han juntado en este (nunca hay más de uno a la vista). */
  juntos?: string[]
}

interface Estado {
  actual: AvisoDeAbajo | null
  cola: AvisoDeAbajo[]
  avisar: (a: AvisoDeAbajo) => void
  /** Quita el que se ve y pasa al siguiente. */
  siguiente: () => void
  vaciar: () => void
}

export const useAvisoDeAbajo = create<Estado>((set, get) => ({
  actual: null,
  cola: [],
  avisar: (a) => {
    const { actual, cola } = get()
    if (actual?.id === a.id || actual?.juntos?.includes(a.id) || cola.some((x) => x.id === a.id)) return
    // (V43 §6) Sin [Deshacer], nunca más de uno a la vista: si hay varios, se juntan en uno.
    if (actual && !actual.accion && !a.accion) {
      set({ actual: { ...actual, texto: `${actual.texto} ${a.texto}`, juntos: [...(actual.juntos ?? [actual.id]), a.id], alIrse: () => { actual.alIrse?.(); a.alIrse?.() } } })
      return
    }
    if (!actual) set({ actual: a })
    else set({ cola: [...cola, a] })
  },
  siguiente: () => {
    const { actual, cola } = get()
    actual?.alIrse?.()
    set({ actual: cola[0] ?? null, cola: cola.slice(1) })
  },
  vaciar: () => set({ actual: null, cola: [] }),
}))

export const avisarAbajo = (a: AvisoDeAbajo): void => useAvisoDeAbajo.getState().avisar(a)
