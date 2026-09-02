import type { TransportMode } from '../../../lib/mockDayDetail'
import { buildAppleMapsUrl, buildGoogleMapsUrl } from '../../../lib/mapsLinks'
import { Modal } from '../../ui/Modal'

interface OpenInMapsSheetProps {
  open: boolean
  onClose: () => void
  origin: string
  destination: string
  mode: TransportMode
}

/**
 * App web, no nativa — no se puede invocar el selector "Open in Maps" del sistema operativo, así
 * que se muestran nuestros propios dos botones. El sistema abre la app correspondiente si está
 * instalada, o la web si no, sin que la aplicación tenga que detectarlo.
 */
export function OpenInMapsSheet({ open, onClose, origin, destination, mode }: OpenInMapsSheetProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-3">
        <h2 className="font-display text-h2 font-semibold text-text">Abrir ruta en…</h2>
        <a
          href={buildAppleMapsUrl(origin, destination, mode)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-3 text-body font-medium text-text transition-colors hover:bg-bg-hover"
        >
          Abrir en Apple Maps
        </a>
        <a
          href={buildGoogleMapsUrl(origin, destination, mode)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-3 text-body font-medium text-text transition-colors hover:bg-bg-hover"
        >
          Abrir en Google Maps
        </a>
      </div>
    </Modal>
  )
}
