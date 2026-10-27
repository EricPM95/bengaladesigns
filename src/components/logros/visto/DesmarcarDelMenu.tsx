import { logrosActivos } from '../../../lib/logros'
import { ICONOS_OPCION, OpcionTarjeta } from '../../ui/HojaOpciones'
import type { Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { alQuitarVisto } from './VistoFlujo'
import { useVistoStore } from './vistoStore'

/**
 * «Desmarcar visto» en el menú «···» de la parada (DÍAS), mientras la parada no tenga foto para los logros (apartado 25 de los apuntes). Con la foto subida, lo ganado ya no se
 * deshace y la opción no sale. Con los logros apagados no pinta nada. Se monta con UNA línea dentro del menú: `<DesmarcarDelMenu dayId stop className onHecho />`.
 */
export function DesmarcarDelMenu({ dayId, stop, onHecho }: { dayId: string; stop: Stop; onHecho: () => void }) {
  if (!logrosActivos()) return null
  return <Opcion dayId={dayId} stop={stop} onHecho={onHecho} />
}

function Opcion({ dayId, stop, onHecho }: { dayId: string; stop: Stop; onHecho: () => void }) {
  const setStopVisto = useRouteStore((s) => s.setStopVisto)
  const conFoto = useVistoStore((s) => Boolean(s.conFoto[stop.id]))
  if (!stop.checkedInAt || stop.saltada || conFoto) return null
  return (
    <OpcionTarjeta
      tono="gris"
      icono={ICONOS_OPCION.circulo}
      titulo="Desmarcar visto"
      linea="Quita el visto de esta parada"
      atributos={{ 'data-visto': 'desmarcar-menu' }}
      onClick={() => {
        setStopVisto(dayId, stop.id, false)
        alQuitarVisto(stop.id)
        onHecho()
      }}
    />
  )
}
