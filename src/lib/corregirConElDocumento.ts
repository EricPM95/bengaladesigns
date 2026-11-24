import type { Reservation } from './bookings'
import type { Excursion } from './types'
import { dayOnDate } from './bookings'
import { fechaCorta } from './excursionMove'
import { useRouteStore } from '../store/useRouteStore'
import { withUndo } from '../store/useAddFlowStore'

/**
 * (V50) AL SUBIR UNA ENTRADA O UNA EXCURSIÓN CUYO DOCUMENTO TRAE OTRO DÍA U OTRA HORA, la app lo CORRIGE y lo dice (como ya hace con el vuelo): la reserva pasa al día y a la hora del documento, con el aviso de abajo
 * y su [Deshacer] («Tu entrada es del jueves 26 a las 10:00: hemos cambiado tu reserva»). Solo se cambia con lo que el documento trae de verdad (la fecha, si cae en un día del viaje; la hora, si es una hora); lo que no
 * trae se queda como estaba. Devuelve la reserva como queda (la misma si no hay nada que corregir).
 * `nombre`: cómo se llama lo subido en el aviso («entrada» o «reserva»).
 */
export function corregirConElDocumento(reserva: Reservation, doc: { fecha: string | null; hora: string | null }, nombre: 'entrada' | 'reserva', excursion?: Excursion | null): Reservation {
  const { route, addReservation } = useRouteStore.getState()
  if (!route) return reserva
  const fechaValida = doc.fecha && route.answers.dateRange && dayOnDate(route, doc.fecha) ? doc.fecha : null
  const horaValida = doc.hora && /^\d{1,2}:\d{2}$/.test(doc.hora) ? (doc.hora.length === 4 ? `0${doc.hora}` : doc.hora) : null
  const cambiaFecha = Boolean(fechaValida && fechaValida !== reserva.dateIso)
  const cambiaHora = Boolean(horaValida && horaValida !== reserva.time)
  if (!cambiaFecha && !cambiaHora) return reserva
  const dia = fechaValida ? dayOnDate(route, fechaValida) : null
  const nueva: Reservation = { ...reserva, ...(cambiaFecha && fechaValida ? { dateIso: fechaValida, dayNumber: dia?.dayNumber ?? reserva.dayNumber } : {}), ...(cambiaHora && horaValida ? { time: horaValida } : {}) }
  const cuando = [cambiaFecha && fechaValida ? `del ${fechaCorta(fechaValida, dia?.dayNumber ?? 0)}` : null, cambiaHora ? `a las ${horaValida}` : null].filter(Boolean).join(' ')
  withUndo(`Tu ${nombre} es ${cuando}: hemos cambiado tu reserva`, () => addReservation(nueva, excursion ?? null, null))
  return nueva
}
