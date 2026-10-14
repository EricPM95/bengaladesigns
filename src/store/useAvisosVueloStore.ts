import { create } from 'zustand'
import type { AvisoDelMotor } from '../lib/planLlegadaVuelta'

/**
 * Los avisos de reservas contra los vuelos que dieron los motores (Tanda 7), tal cual llegaron de `/api/avisos-de-vuelo`. Lo escribe `useAvisosDeVuelo` (que vuelve a preguntar cuando cambia una reserva,
 * una hora, un punto o las fechas) y lo lee la campana (`useAppNotices`). Estado de pantalla: no se guarda con el viaje, se vuelve a pedir al abrirlo.
 */
interface AvisosVueloState {
  avisos: { llegada: AvisoDelMotor[]; vuelta: AvisoDelMotor[] }
  poner: (avisos: { llegada: AvisoDelMotor[]; vuelta: AvisoDelMotor[] }) => void
  vaciar: () => void
}

export const useAvisosVueloStore = create<AvisosVueloState>((set) => ({
  avisos: { llegada: [], vuelta: [] },
  poner: (avisos) => set({ avisos }),
  vaciar: () => set((state) => (state.avisos.llegada.length === 0 && state.avisos.vuelta.length === 0 ? state : { avisos: { llegada: [], vuelta: [] } })),
}))
