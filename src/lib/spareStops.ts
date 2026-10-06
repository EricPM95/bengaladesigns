import type { Stop } from './types'
import { parseTimeToMinutes } from './time'

/**
 * Dónde entra una parada que viene de «Si te sobra tiempo» (o de la alternativa de lluvia): al final de su franja,
 * es decir, detrás de la última parada del día cuya hora orientativa no sea posterior a la suya. Sin hora, al final.
 * La hora es solo una pista de FRANJA: no mueve nada por sí misma.
 */
export function spareInsertIndex(stops: Stop[], stop: Stop): number {
  const minutes = /^\d{1,2}:\d{2}$/.test(stop.time ?? '') ? parseTimeToMinutes(stop.time) : null
  if (minutes == null) return stops.length
  let at = 0
  stops.forEach((other, index) => {
    if (/^\d{1,2}:\d{2}$/.test(other.time ?? '') && parseTimeToMinutes(other.time) <= minutes) at = index + 1
  })
  return at
}
