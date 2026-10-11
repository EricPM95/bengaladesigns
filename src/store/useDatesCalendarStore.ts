import { create } from 'zustand'

/**
 * El calendario de fechas de dentro de la app (Tanda 6y4): UNA sola puerta para abrirlo, desde donde sea (la cabecera del mapa, «Pon tus fechas» de HOY,
 * «Cambia las fechas del viaje» de RESERVAS, el aviso «Pon tus fechas» de la campana, «Añade un día más a tu viaje»). `DatesCalendarModal` (montado en RouteView) lo
 * pinta solo, a pantalla completa y por encima de todo, sin cambiar de pestaña: al guardar o cerrar, el viajero sigue donde estaba.
 */
interface DatesCalendarState {
  open: boolean
  request: () => void
  close: () => void
}

export const useDatesCalendarStore = create<DatesCalendarState>((set) => ({
  open: false,
  request: () => set({ open: true }),
  close: () => set({ open: false }),
}))
