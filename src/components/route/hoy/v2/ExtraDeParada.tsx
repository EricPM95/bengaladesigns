import type { Stop } from '../../../../lib/types'
import { PendienteDeParada } from '../../../logros/visto/PendienteDeParada'

/**
 * PUNTO DE EXTENSIÓN (Tanda 8B). Aquí engancha el flujo del Visto su pieza extra de cada parada de HOY.
 * `contexto`: 'tarjeta' (debajo de los botones de la siguiente parada: nada) o 'fila' (bajo el nombre de una parada de la lista: V6, «Haz una foto y gana tu pedazo»,
 * «Te espera una sorpresa: sube tu foto» o «Guarda un recuerdo», con su botón de cámara). Con los logros apagados no pinta nada.
 */
export function ExtraDeParada({ parada, dayId, vista, contexto }: { parada: Stop; dayId: string; vista: boolean; contexto: 'tarjeta' | 'fila' }) {
  if (contexto !== 'fila') return null
  return <PendienteDeParada dayId={dayId} stopId={parada.id} visto={vista} />
}
