/**
 * El aviso de una reserva que cae con el sitio cerrado (Tanda 6z5, decidido por Eric el 10-oct-2026): si la hora que pone el viajero cae cuando ese sitio está cerrado ese día (los días especiales:
 * Navidad, Nochevieja, Reyes, Semana Santa…, con la auditoría de horarios), sale «Ese día (25 dic) el Coliseo cierra a las 14:00. Revisa tu reserva.» con [Ver mi reserva], en la hoja de abajo y en la campana,
 * igual que «coinciden». AVISAMOS, no prohibimos: la rueda de la hora ofrece todas las horas, la reserva se queda como la puso y su día pasa con su bloque, como siempre. No se toca nada más.
 *
 * Los horarios son datos reales (`horarioDeParada.ts`, los mismos que enseña la tarjeta); la hora de la reserva es la que puso el viajero. La app no calcula ninguna hora.
 */
import type { Route } from './types'
import { dayOfReservation, type Reservation } from './bookings'
import { horarioDeParada, normalizaNombre, type HorarioDeParada } from './horarioDeParada'

/** El aviso: mismo molde que el de «coinciden» (`reservationOverlaps.ts`), para que la hoja y la campana lo traten igual. */
export interface ReservaEnCierre {
  /** Estable mientras sea la misma reserva a la misma hora y el mismo día: lo que usa la campana para no repetirlo. */
  id: string
  kind: 'cierra'
  reservation: Reservation
  text: string
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const aMinutos = (hhmm: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/** «25 dic». */
const fechaCorta = (dateIso: string): string => {
  const [, mes, dia] = dateIso.split('-').map(Number)
  return `${dia} ${MESES[mes - 1]}`
}

type DatosPorNombre = Map<string, Record<string, unknown>>

/** El nombre con artículo de la reserva («el Coliseo»): el suyo o el de los datos del destino; sin ellos, el nombre completo. */
const nombreDe = (reservation: Reservation, shortNames?: Record<string, string>): string => reservation.shortName?.trim() || shortNames?.[reservation.refId]?.trim() || reservation.name

/** Qué dice el horario de ese día de la hora de la reserva: null si abre a esa hora (o no se sabe); si no, la frase («cierra a las 14:00»). */
function frase(horario: HorarioDeParada, minutos: number): string | null {
  if (horario.cerrado) return 'está cerrado'
  const tramos = horario.tramos.map((tramo) => ({ abre: aMinutos(tramo.abre) ?? 0, cierra: aMinutos(tramo.cierra) ?? 24 * 60, textoAbre: tramo.abre, textoCierra: tramo.cierra }))
  if (tramos.length === 0 || tramos.some((tramo) => minutos >= tramo.abre && minutos < tramo.cierra)) return null
  if (minutos < tramos[0].abre) return `abre a las ${tramos[0].textoAbre}`
  const siguiente = tramos.find((tramo) => tramo.abre > minutos)
  if (siguiente) return `a esa hora está cerrado y vuelve a abrir a las ${siguiente.textoAbre}`
  return `cierra a las ${tramos.at(-1)!.textoCierra}`
}

/**
 * Las reservas de entrada con fecha cuya hora cae con el sitio cerrado ese día. Con el primer sitio de la reserva que tenga horario en los datos (el Coliseo, en «Coliseo, Foro y Palatino»).
 * Sin fecha (viaje sin fechas), el Free Tour o un sitio sin horario, no avisa.
 */
export function reservasEnCierre(route: Route, reservations: Reservation[], datos: DatosPorNombre, shortNames?: Record<string, string>): ReservaEnCierre[] {
  const avisos: ReservaEnCierre[] = []
  for (const reservation of reservations) {
    if (reservation.kind !== 'entrada' || reservation.refId === 'Free Tour' || !reservation.dateIso) continue
    if (!dayOfReservation(route, reservation)) continue
    const minutos = aMinutos(reservation.time)
    if (minutos == null) continue
    const nombres = [...reservation.placeNames, reservation.refId]
    for (const nombre of nombres) {
      const hoursData = datos.get(normalizaNombre(nombre))
      const horario = hoursData ? horarioDeParada({ hoursData }, reservation.dateIso) : null
      if (!horario) continue
      const dice = frase(horario, minutos)
      if (dice) avisos.push({ id: `cierra:${reservation.id}:${reservation.dateIso}:${reservation.time}`, kind: 'cierra', reservation, text: `Ese día (${fechaCorta(reservation.dateIso)}) ${nombreDe(reservation, shortNames)} ${dice}. Revisa tu reserva.` })
      break
    }
  }
  return avisos
}
