import { create } from 'zustand'
import type { Excursion } from '../lib/types'

/**
 * La página de excursiones y su ventana «¿Dónde la ponemos?» (PARA_CODE_EXCURSIONES). Estado de pantalla: no se guarda con el viaje.
 */
interface ExcursionsState {
  /** Abierta la página. `toNewDay`: viene de «+ Añadir día → Añadir una excursión»: la excursión va directa al día nuevo. */
  page: { toNewDay: boolean } | null
  /** La excursión a la que se está eligiendo día (la ventana «¿Dónde la ponemos?»). */
  picking: Excursion | null
  openPage: (toNewDay?: boolean) => void
  closePage: () => void
  pick: (excursion: Excursion | null) => void
}

export const useExcursionsStore = create<ExcursionsState>((set) => ({
  page: null,
  picking: null,
  openPage: (toNewDay = false) => set({ page: { toNewDay }, picking: null }),
  closePage: () => set({ page: null, picking: null }),
  pick: (excursion) => set({ picking: excursion }),
}))
