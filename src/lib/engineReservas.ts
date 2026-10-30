import type { Reservation } from './bookings'

/**
 * (10S3b) El Free Tour es una parada más: reservarlo o cambiarle la hora NUNCA rehace ni mueve días. El servidor convierte cualquier reserva del Free Tour que le llegue en `reservas` en "Free Tour puesto" (respuestasConFreeTour),
 * y eso cambia los días; por eso no viaja al motor al rehacer días (rebuildDay, interruptor, avisos de vuelo, plan de reservas). Solo la generación del viaje desde cero lo pide, con `conFreeTour`.
 */
const esFreeTour = (reservation: Reservation): boolean => reservation.refId === 'Free Tour' || reservation.placeNames.some((name) => /^free tour/i.test(name))

/**
 * Las reservas con hora que el motor de días escritos necesita para correr las horas alrededor de la entrada (5-oct-2026).
 * Cada una dice qué sitios cubre, su fecha (o el número de día, sin fechas) y la hora.
 */
export function reservasParaMotor(reservations: Reservation[], opciones: { conFreeTour?: boolean } = {}): { placeNames: string[]; dateIso: string | null; dayNumber: number | null; time: string }[] {
  return reservations
    .filter((reservation) => reservation.kind === 'entrada' && (opciones.conFreeTour || !esFreeTour(reservation)) && !reservation.noMueve && !reservation.fueraDeRuta && /^\d{1,2}:\d{2}$/.test(reservation.time))
    .map((reservation) => ({ placeNames: reservation.placeNames, dateIso: reservation.dateIso, dayNumber: reservation.dayNumber, time: reservation.time }))
}

/** Las reservas de ahora, leídas del estado (import dinámico: este fichero lo usa el generador de rutas y el estado no puede cargarlo a él). */
export async function reservasActuales() {
  const { useRouteStore } = await import('../store/useRouteStore')
  return reservasParaMotor(useRouteStore.getState().reservations, { conFreeTour: true })
}
