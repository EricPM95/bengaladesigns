import { create } from 'zustand'
import type { Route } from '../lib/types'
import { useRouteStore } from './useRouteStore'

/**
 * La pantalla de añadir de todo el viaje ("+ Añadir día", "+ Añadir lugares", el "+ Añadir" de Explorar) y el aviso
 * corto de abajo con "Deshacer". No se guarda con el viaje: es estado de pantalla.
 */
interface AddFlowState {
  /** Abierta: el día al que apunta (null = desde Explorar, sin día). */
  addFlow: { dayId: string | null } | null
  openAddFlow: (dayId: string | null) => void
  closeAddFlow: () => void
  /** «Crear mi propio día»: la pantalla de elegir varios sitios para este día (Tanda 6g). */
  ownDayFlow: { dayId: string } | null
  openOwnDayFlow: (dayId: string) => void
  closeOwnDayFlow: () => void
  /** La parada recién añadida: DayDetailPanel se desplaza hasta ella. */
  focusStopId: string | null
  setFocusStopId: (id: string | null) => void
  /** Aviso con "Deshacer": la ruta de antes del cambio. */
  toast: { message: string; previous: Route | null; id: number } | null
  dismissToast: () => void
  undo: () => void
}

export const useAddFlowStore = create<AddFlowState>((set, get) => ({
  addFlow: null,
  openAddFlow: (dayId) => set({ addFlow: { dayId } }),
  closeAddFlow: () => set({ addFlow: null }),
  ownDayFlow: null,
  openOwnDayFlow: (dayId) => set({ ownDayFlow: { dayId } }),
  closeOwnDayFlow: () => set({ ownDayFlow: null }),
  focusStopId: null,
  setFocusStopId: (id) => set({ focusStopId: id }),
  toast: null,
  dismissToast: () => set({ toast: null }),
  undo: () => {
    const previous = get().toast?.previous
    if (previous) useRouteStore.setState({ route: previous })
    set({ toast: null })
  },
}))

/** Hace el cambio y deja el aviso con "Deshacer" (vuelve la ruta tal cual estaba). */
export function withUndo(message: string, change: () => void): void {
  const previous = useRouteStore.getState().route
  change()
  useAddFlowStore.setState({ toast: { message, previous, id: Date.now() } })
}
