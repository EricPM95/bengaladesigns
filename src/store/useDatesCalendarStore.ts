import { create } from 'zustand'

/**
 * «Añade un día más a tu viaje» (la línea de más días que el viaje) abre el mismo calendario de fechas de la cabecera del mapa.
 * Estado de pantalla: la cabecera lo recoge al montarse o al cambiar y lo apaga.
 */
interface DatesCalendarState {
  pending: boolean
  request: () => void
  clear: () => void
}

export const useDatesCalendarStore = create<DatesCalendarState>((set) => ({
  pending: false,
  request: () => set({ pending: true }),
  clear: () => set({ pending: false }),
}))
