import type { Route, Stop } from '../../../../lib/types'
import type { Reservation } from '../../../../lib/bookings'
import { TuEntradaEnHoy } from '../TuEntradaEnHoy'
import { PendienteDeParada } from '../../../logros/visto/PendienteDeParada'

/**
 * PUNTO DE EXTENSIÓN (Tanda 8B). Aquí engancha el flujo del Visto su pieza extra de cada parada de HOY.
 * `contexto`: 'tarjeta' (debajo de los botones de la siguiente parada: nada) o 'fila' (bajo el nombre de una parada de la lista: V6, «Haz una foto y gana tu pedazo»,
 * «Te espera una sorpresa: sube tu foto» o «Guarda un recuerdo», con su botón de cámara). Con los logros apagados no pinta nada.
 */
export function ExtraDeParada({ parada, dayId, vista, contexto, route, reserva }: { parada: Stop; dayId: string; vista: boolean; contexto: 'tarjeta' | 'fila'; /** (10S7, E4) La ruta y la reserva de esa parada: con ellas, la fila «Tu entrada» (solo con pase y si la entrada tiene su código). */ route?: Route; reserva?: Reservation | null }) {
  if (contexto === 'tarjeta') return route && reserva ? <TuEntradaEnHoy route={route} reserva={reserva} /> : null
  if (contexto !== 'fila') return null
  return <PendienteDeParada dayId={dayId} stopId={parada.id} visto={vista} />
}
