import type { ArrivalMode, ArrivalPoint } from './arrivalReturn'
import { puntoCorto } from './arrivalReturn'

/**
 * Los textos de HOY en el día de llegada y en el de vuelta (Tanda 7, punto 15; de pago). Solo palabras y el punto: ninguna hora (las horas que se ven son las del viajero, en su billete).
 *  - Día de llegada, antes de la primera parada: «Llegada a Fiumicino» (o a Ciampino, Termini, Tiburtina, Civitavecchia).
 *  - Día de vuelta, después de la última parada: «Llegada al aeropuerto de Fiumicino», «Llegada a la estación de Termini», «Llegada al puerto de Civitavecchia».
 */

export const tituloDeLlegada = (point: ArrivalPoint): string => `Llegada a ${puntoCorto(point)}`

/** «Llegada al aeropuerto de Fiumicino» / «Llegada a la estación de Termini» / «Llegada al puerto de Civitavecchia». En coche no hay. */
export function tituloDeVuelta(mode: ArrivalMode, point: ArrivalPoint): string | null {
  const nombre = puntoCorto(point)
  if (mode === 'avion') return `Llegada al aeropuerto de ${nombre}`
  if (mode === 'tren' || mode === 'bus') return `Llegada a la estación de ${nombre}`
  if (mode === 'ferry') return `Llegada al puerto de ${nombre}`
  return null
}

/** Lo que se le da a Google Maps para llegar al punto: el aeropuerto con su ciudad, o el nombre de la estación o del puerto tal como está en los datos. */
export function destinoDelPunto(mode: ArrivalMode, point: ArrivalPoint, ciudad: string): string {
  return mode === 'avion' ? `Aeropuerto de ${puntoCorto(point)}, ${ciudad}` : point.nombre
}
