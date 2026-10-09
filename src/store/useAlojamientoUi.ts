import { create } from 'zustand'

/**
 * «Lleva al alojamiento» (Tanda 6z): todos los sitios de la app que hablan de hoteles abren lo mismo, la pantalla del mapa de alojamientos (a pantalla completa) o la hoja «Tu alojamiento»; nunca otra web.
 * `segmentDayId` es el primer día del destino al que pertenece (null = el primero del viaje). Estado de pantalla: no se guarda con el viaje.
 */
interface AlojamientoUiState {
  mapa: { segmentDayId: string | null } | null
  hoja: { segmentDayId: string | null } | null
  abrirMapa: (segmentDayId?: string | null) => void
  cerrarMapa: () => void
  abrirTuAlojamiento: (segmentDayId?: string | null) => void
  cerrarHoja: () => void
}

export const useAlojamientoUi = create<AlojamientoUiState>((set) => ({
  mapa: null,
  hoja: null,
  abrirMapa: (segmentDayId = null) => set({ mapa: { segmentDayId } }),
  cerrarMapa: () => set({ mapa: null }),
  abrirTuAlojamiento: (segmentDayId = null) => set({ hoja: { segmentDayId } }),
  cerrarHoja: () => set({ hoja: null }),
}))
