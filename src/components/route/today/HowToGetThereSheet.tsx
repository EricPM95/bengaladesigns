import { buildAppleMapsUrlFromHere, buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { Modal } from '../../ui/Modal'

interface HowToGetThereSheetProps {
  open: boolean
  onClose: () => void
  destination: string
}

/** Variante de OpenInMapsSheet.tsx para Modo Hoy: origen = ubicación actual del dispositivo, no un lugar con nombre. */
export function HowToGetThereSheet({ open, onClose, destination }: HowToGetThereSheetProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-3">
        <h2 className="font-display text-h2 font-semibold text-text">Cómo llegar a {destination}</h2>
        <a
          href={buildAppleMapsUrlFromHere(destination)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-3 text-body font-medium text-text transition-colors hover:bg-bg-hover"
        >
          Abrir en Apple Maps
        </a>
        <a
          href={buildGoogleMapsUrlFromHere(destination)}
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
