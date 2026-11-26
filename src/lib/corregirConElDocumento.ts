import type { Reservation } from './bookings'
import type { Excursion } from './types'
import { dayOnDate } from './bookings'
import { fechaCorta } from './excursionMove'
import { useRouteStore } from '../store/useRouteStore'
import { withUndo } from '../store/useAddFlowStore'
import { useSyncStore } from '../store/useSyncStore'
import { fechaEnProsa } from './nombreDeDia'
import { ponerAvisoDeDocumento, quitarAvisoDeDocumento } from './avisoDeDocumento'

/**
 * (V50) AL SUBIR UNA ENTRADA O UNA EXCURSIÓN CUYO DOCUMENTO TRAE OTRO DÍA U OTRA HORA, la app lo CORRIGE y lo dice (como ya hace con el vuelo): la reserva pasa al día y a la hora del documento, con el aviso de abajo
 * y su [Deshacer] («Tu entrada es del jueves 26 a las 10:00: hemos cambiado tu reserva»). Solo se cambia con lo que el documento trae de verdad (la fecha, si cae en un día del viaje; la hora, si es una hora); lo que no
 * trae se queda como estaba. Devuelve la reserva como queda (la misma si no hay nada que corregir).
 * `nombre`: cómo se llama lo subido en el aviso («entrada» o «reserva»).
 * (V66, 3.1) Con OTRO día del viaje la app YA NO la mueve sola: pregunta antes (`PreguntaDeDiaDelDocumento`: «¿La pasamos al jueves?», [Pasarla al jueves] / [Dejarla el martes]); esta función solo mueve cuando se le dice
 * (`mover: true`, tras el sí). Sin `mover`, un documento de otro día del viaje no cambia nada (ni la hora): lo decide la pregunta. La hora sola (mismo día) se sigue corrigiendo sola, como en la V50.
 */
export function corregirConElDocumento(reserva: Reservation, doc: { fecha: string | null; hora: string | null }, nombre: 'entrada' | 'reserva', excursion?: Excursion | null, mover = false): Reservation {
  const { route, addReservation } = useRouteStore.getState()
  if (!route) return reserva
  const fechaValida = doc.fecha && route.answers.dateRange && dayOnDate(route, doc.fecha) ? doc.fecha : null
  const horaValida = doc.hora && /^\d{1,2}:\d{2}$/.test(doc.hora) ? (doc.hora.length === 4 ? `0${doc.hora}` : doc.hora) : null
  marcarDocumentoFueraDelViaje(reserva, doc, nombre)
  const cambiaFecha = Boolean(fechaValida && fechaValida !== reserva.dateIso)
  const cambiaHora = Boolean(horaValida && horaValida !== reserva.time)
  if (!cambiaFecha && !cambiaHora) return reserva
  if (cambiaFecha && !mover) return reserva
  const dia = fechaValida ? dayOnDate(route, fechaValida) : null
  const nueva: Reservation = { ...reserva, ...(cambiaFecha && fechaValida ? { dateIso: fechaValida, dayNumber: dia?.dayNumber ?? reserva.dayNumber } : {}), ...(cambiaHora && horaValida ? { time: horaValida } : {}) }
  const cuando = [cambiaFecha && fechaValida ? `del ${fechaCorta(fechaValida, dia?.dayNumber ?? 0)}` : null, cambiaHora ? `a las ${horaValida}` : null].filter(Boolean).join(' ')
  withUndo(`Tu ${nombre} es ${cuando}: hemos cambiado tu reserva`, () => addReservation(nueva, excursion ?? null, null))
  return nueva
}

/**
 * (V70, V64-26; Eric) AL LEER un documento de entrada o excursión la reserva NO se toca: se enseña «Revisa los datos» con lo leído y la reserva solo se corrige al pulsar [Guardar] (como el vuelo).
 * Lo único que se hace al leer es la MARCA del documento (no es un cambio de la reserva): si trae un día que NO está en el viaje, la línea naranja «Esta entrada es del… Revisa que sea la buena» con [Es correcta] (V52 §5b);
 * si el día vale (o no trae), se quita la que hubiera. Todo en el móvil, sin consultas a Supabase.
 */
export function marcarDocumentoFueraDelViaje(reserva: Reservation, doc: { fecha: string | null; hora: string | null }, nombre: 'entrada' | 'reserva'): void {
  const route = useRouteStore.getState().route
  if (!route) return
  const fechaValida = doc.fecha && route.answers.dateRange && dayOnDate(route, doc.fecha) ? doc.fecha : null
  const tripId = useSyncStore.getState().activeTripId
  if (doc.fecha && !fechaValida && route.answers.dateRange) ponerAvisoDeDocumento(tripId, reserva.id, `${nombre === 'entrada' ? 'Esta entrada' : 'Esta reserva'} es del ${fechaEnProsa(doc.fecha)} y tu viaje es del ${fechaEnProsa(route.answers.dateRange.start)} al ${fechaEnProsa(route.answers.dateRange.end)}. Revisa que sea la buena`)
  else quitarAvisoDeDocumento(tripId, reserva.id)
}

/** (V66, 3.1) El día del viaje que trae el documento, si es OTRO distinto del de la reserva (y cae dentro del viaje); si no, null. */
export function diaDistintoDelDocumento(reserva: Reservation, fecha: string | null): { iso: string; dayNumber: number } | null {
  const route = useRouteStore.getState().route
  if (!route || !fecha || !route.answers.dateRange || fecha === reserva.dateIso) return null
  const dia = dayOnDate(route, fecha)
  return dia ? { iso: fecha, dayNumber: dia.dayNumber } : null
}
