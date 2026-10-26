import { create } from 'zustand'
import { miPermisoAhora } from '../hooks/useModoInvitado'

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
  // (Tanda 10N3 §1) Las fechas del viaje las cambia solo el administrador: para quien «Puede editar» o «Solo recomienda» el calendario no se abre desde ningún sitio.
  request: () => {
    if (miPermisoAhora() !== 'admin') return
    set({ open: true })
  },
  close: () => set({ open: false }),
}))
