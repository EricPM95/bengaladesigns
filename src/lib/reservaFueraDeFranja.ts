import type { DayPeriod } from './stopKind'

/**
 * (Tanda 10S3, apartado 6) ¿La hora de una reserva cuadra con la franja donde está la parada? Los cortes de la tanda: Mañana hasta las 14:00, Tarde hasta las 20:00 y Noche después.
 * Sin pase, la parada se queda donde está (con su hora nueva) y, si no cuadra, la app dice que con el pase las reservas se colocan solas. Pura, sin React.
 */
export const CORTE_MANANA_MIN = 14 * 60
export const CORTE_TARDE_MIN = 20 * 60

export type FranjaDeReserva = 'manana' | 'tarde' | 'noche'

export function franjaDeLaHoraDeReserva(hora: string | null | undefined): FranjaDeReserva | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora ?? ''))
  if (!m) return null
  const min = Number(m[1]) * 60 + Number(m[2])
  return min < CORTE_MANANA_MIN ? 'manana' : min < CORTE_TARDE_MIN ? 'tarde' : 'noche'
}

/** `periodo`: la franja con la que se pinta la parada en DÍAS. La comida y la cena no son franjas de paradas: no cuentan. */
export function reservaNoCuadraConSuFranja(periodo: DayPeriod | null | undefined, hora: string | null | undefined): boolean {
  if (periodo !== 'manana' && periodo !== 'tarde' && periodo !== 'noche') return false
  const franja = franjaDeLaHoraDeReserva(hora)
  return franja !== null && franja !== periodo
}
