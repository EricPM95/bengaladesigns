/**
 * «Día completo» (Tanda 6z6, decidido por Eric el 10-oct-2026): si las paradas de un día con reserva suman más de lo que cabe de las 9:00 a las 22:00 (con lo que se anda), la línea pequeña
 * «Hoy es un día completo: te recomendamos madrugar.» en la cabecera de ese día en DÍAS (y en HOY, en la de pago). Solo avisa: sin hoja ni campana, no mueve ni quita nada del día.
 *
 * No enseña ninguna hora: solo compara la suma de lo que dura el día con lo que cabe.
 */
import type { DayPlan, Route, Stop } from './types'
import { dayOfReservation, type Reservation } from './bookings'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { isNumberedStop } from './stopKind'

/** De las 9:00 a las 22:00. */
export const MINUTOS_DEL_DIA = (22 - 9) * 60
/** Lo que se anda en un minuto, a paso normal. */
const METROS_POR_MINUTO = 80
/** Lo que dura comer y cenar, cuando el día no lo dice. */
const COMIDA_MIN = 60
const CENA_MIN = 75
/** Un trayecto que no se anda (autobús, metro, taxi) cuenta como mucho esto. */
const TRAYECTO_MAXIMO_MIN = 30

/** Lo que dura una parada: su duración, o 30 min si no la trae. */
const minutosDe = (stop: Stop): number => (stop.durationMinutes && stop.durationMinutes > 0 ? stop.durationMinutes : 30)

/** Lo que ocupa el día: las paradas, lo que se anda entre ellas y las dos comidas. */
export function minutosDelDia(day: DayPlan): number {
  const paradas = day.stops.filter((stop) => isNumberedStop(stop) && !stop.saltada)
  let total = paradas.reduce((suma, stop) => suma + minutosDe(stop), 0)
  for (let i = 1; i < paradas.length; i++) {
    const a = paradas[i - 1].coordinates
    const b = paradas[i].coordinates
    if (hasRealCoordinates(a) && hasRealCoordinates(b)) total += Math.min(TRAYECTO_MAXIMO_MIN, Math.round(haversineMeters(a, b) / METROS_POR_MINUTO))
  }
  const comidas = new Set((day.meals ?? []).map((meal) => meal.mealTime))
  total += (comidas.has('lunch') || comidas.size === 0 ? COMIDA_MIN : 0) + (comidas.has('dinner') || comidas.size === 0 ? CENA_MIN : 0)
  return total
}

/** ¿Es un día completo? Solo cuenta un día con reserva (el viajero ya ha puesto una hora), y solo si lo que ocupa pasa de lo que cabe. */
export function esDiaCompleto(route: Route, day: DayPlan, reservations: Reservation[]): boolean {
  const conReserva = reservations.some((reserva) => reserva.kind === 'entrada' && dayOfReservation(route, reserva)?.id === day.id)
  return conReserva && minutosDelDia(day) > MINUTOS_DEL_DIA
}

export const TEXTO_DIA_COMPLETO = 'Hoy es un día completo: te recomendamos madrugar.'
