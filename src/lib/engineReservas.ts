import type { Reservation } from './bookings'

/**
 * Las reservas con hora que el motor de días escritos necesita para correr las horas alrededor de la entrada (5-oct-2026).
 * Cada una dice qué sitios cubre, su fecha (o el número de día, sin fechas) y la hora.
 */
export function reservasParaMotor(reservations: Reservation[]): { placeNames: string[]; dateIso: string | null; dayNumber: number | null; time: string }[] {
  return reservations
    .filter((reservation) => reservation.kind === 'entrada' && !reservation.noMueve && /^\d{1,2}:\d{2}$/.test(reservation.time))
    .map((reservation) => ({ placeNames: reservation.placeNames, dateIso: reservation.dateIso, dayNumber: reservation.dayNumber, time: reservation.time }))
}

/** Las reservas de ahora, leídas del estado (import dinámico: este fichero lo usa el generador de rutas y el estado no puede cargarlo a él). */
export async function reservasActuales() {
  const { useRouteStore } = await import('../store/useRouteStore')
  return reservasParaMotor(useRouteStore.getState().reservations)
}
