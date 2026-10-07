import { create } from 'zustand'
import { cambiarInterruptor, excursionReservationOf } from '../lib/dayInterruptor'
import { useRouteStore } from './useRouteStore'

/**
 * Estado de pantalla del interruptor [Roma | Excursión] del día 4 (Tanda 6g): qué día está cambiando, el aviso de «Tienes reservada la excursión…» y si el cambio ha fallado. No se guarda
 * con el viaje. Lo comparten la tarjeta del día (el interruptor) y la página de la excursión (el botón «Prefiero quedarme en Roma»).
 */
interface InterruptorUiState {
  /** El día con el aviso «Tienes reservada la excursión…» abierto (al pasar a Roma con la excursión confirmada). */
  warnDayId: string | null
  /** El día que está cambiando (pidiendo el otro lado al servidor). */
  busyDayId: string | null
  /** El día cuyo último cambio no se pudo hacer (sin conexión). */
  failedDayId: string | null
  /** Una reserva impide el cambio: el día y el aviso («Tienes una reserva el día 5 (…): no puedes mover este día»). */
  blocked: { dayId: string; aviso: string } | null
  /** El viajero toca el interruptor: pasa a Excursión sin más; a Roma con la excursión confirmada, antes se le avisa. */
  pedir: (dayId: string, target: 'roma' | 'excursion') => Promise<void>
  /** «Cambiar a Roma» en el aviso: la reserva se queda en Reservas. */
  confirmarRoma: (dayId: string) => Promise<void>
  /** «Seguir con la excursión»: no cambia nada. */
  cancelarAviso: () => void
}

export const useInterruptorUiStore = create<InterruptorUiState>((set, get) => {
  const ejecutar = async (dayId: string, target: 'roma' | 'excursion') => {
    set({ busyDayId: dayId, warnDayId: null, failedDayId: null, blocked: null })
    const result = await cambiarInterruptor(dayId, target)
    set({ busyDayId: null, failedDayId: 'motivo' in result && result.motivo === 'error' ? dayId : null, blocked: 'motivo' in result && result.motivo === 'bloqueado' ? { dayId, aviso: result.aviso } : null })
  }
  return {
    warnDayId: null,
    busyDayId: null,
    failedDayId: null,
    blocked: null,
    pedir: async (dayId, target) => {
      if (get().busyDayId) return
      const { route, reservations } = useRouteStore.getState()
      const day = route?.days.find((other) => other.id === dayId)
      if (!route || !day?.interruptor || day.interruptor.mode === target) return
      if (target === 'roma' && excursionReservationOf(route, reservations, day)) {
        // (Con una reserva en un día de después que se movería, ni el aviso: el interruptor no deja pasar.)
        set({ warnDayId: dayId, failedDayId: null, blocked: null })
        return
      }
      await ejecutar(dayId, target)
    },
    confirmarRoma: (dayId) => ejecutar(dayId, 'roma'),
    cancelarAviso: () => set({ warnDayId: null }),
  }
})
