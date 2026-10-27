import { useRouteStore } from '../../../store/useRouteStore'
import { diaCorto } from '../../../lib/nombreDeDia'
import { HojaOpciones, ICONOS_OPCION, OpcionTarjeta } from '../../ui/HojaOpciones'

/**
 * «+ Añadir día», primero qué quieres hacer (PARA_CODE_EXCURSIONES, 5): sube la hoja de opciones (Tanda 10N4 §3: `HojaOpciones`, el formato de «Hojas Opciones» de Design) con dos tarjetas.
 * «Añadir lugares» sigue como hasta ahora (pide el nombre del día y abre Explorar);
 * «Añadir una excursión» abre la página de excursiones y la excursión va directa al día nuevo. Sin excursiones en el destino, esta ventana
 * no sale (se pide el nombre directamente).
 */
export function AddDayChooser({ dayNumber, examples, onPlaces, onExcursion, onClose }: { dayNumber: number; examples: string | null; onPlaces: () => void; onExcursion: () => void; onClose: () => void }) {
  const route = useRouteStore((state) => state.route)
  return (
    <HojaOpciones onCerrar={onClose} etiqueta={`${diaCorto(route, dayNumber)} · Nuevo`} titulo="¿Qué quieres hacer este día?" datos="add-day-chooser" z={90}>
      <OpcionTarjeta tono="salvia" icono={ICONOS_OPCION.pin} titulo="Añadir lugares" linea="Monumentos, barrios, miradores…" onClick={onPlaces} />
      <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.mochila} titulo="Añadir una excursión" linea={examples ?? 'Una excursión desde la ciudad'} onClick={onExcursion} />
    </HojaOpciones>
  )
}
