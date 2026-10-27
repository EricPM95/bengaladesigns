import type { TransportMode } from '../../../lib/mockDayDetail'
import { buildAppleMapsUrl, buildGoogleMapsUrl } from '../../../lib/mapsLinks'
import { HojaOpciones, ICONOS_OPCION, OpcionTarjeta } from '../../ui/HojaOpciones'

interface OpenInMapsSheetProps {
  open: boolean
  onClose: () => void
  origin: string
  destination: string
  mode: TransportMode
}

/**
 * App web, no nativa — no se puede invocar el selector "Open in Maps" del sistema operativo, así
 * que se muestran nuestras propias dos opciones (Tanda 10N4 §3: la hoja de opciones de Design). El sistema abre la app correspondiente si está
 * instalada, o la web si no, sin que la aplicación tenga que detectarlo.
 */
export function OpenInMapsSheet({ open, onClose, origin, destination, mode }: OpenInMapsSheetProps) {
  if (!open) return null
  return (
    <HojaOpciones onCerrar={onClose} etiqueta="Ruta" titulo="Abrir ruta en…" datos="abrir-ruta-en" z={96}>
      <OpcionTarjeta tono="azul" icono={ICONOS_OPCION.mapa} titulo="Abrir en Apple Maps" linea="Con la app del iPhone" href={buildAppleMapsUrl(origin, destination, mode)} onClick={onClose} />
      <OpcionTarjeta tono="salvia" icono={ICONOS_OPCION.mapa} titulo="Abrir en Google Maps" linea="Con la app o en la web" href={buildGoogleMapsUrl(origin, destination, mode)} onClick={onClose} />
    </HojaOpciones>
  )
}
