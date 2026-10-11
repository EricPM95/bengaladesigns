import { create } from 'zustand'
import type { Excursion } from '../lib/types'

/**
 * La página de excursiones y su ventana «¿Dónde la ponemos?» (PARA_CODE_EXCURSIONES). Estado de pantalla: no se guarda con el viaje.
 */
interface ExcursionsState {
  /**
   * Abierta la página. `toNewDay`: viene de «+ Añadir día → Añadir una excursión»: la excursión va directa al día nuevo.
   * `toDayId` (ruta a mano, Tanda 6y): viene de [Añadir excursión] de un día en blanco: la excursión va directa a ESE día, sin preguntar dónde.
   */
  page: { toNewDay: boolean; toDayId?: string } | null
  /** La excursión a la que se está eligiendo día (la ventana «¿Dónde la ponemos?»). */
  picking: Excursion | null
  openPage: (toNewDay?: boolean) => void
  /** [Añadir excursión] de un día en blanco de una ruta a mano. */
  openPageForDay: (dayId: string) => void
  closePage: () => void
  pick: (excursion: Excursion | null) => void
}

export const useExcursionsStore = create<ExcursionsState>((set) => ({
  page: null,
  picking: null,
  openPage: (toNewDay = false) => set({ page: { toNewDay }, picking: null }),
  openPageForDay: (dayId) => set({ page: { toNewDay: false, toDayId: dayId }, picking: null }),
  closePage: () => set({ page: null, picking: null }),
  pick: (excursion) => set({ picking: excursion }),
}))
