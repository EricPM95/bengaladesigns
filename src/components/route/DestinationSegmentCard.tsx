import type { DestinationSegment } from '../../lib/destinationSegments'
import { FlagIcon } from '../ui/FlagIcon'

interface DestinationSegmentCardProps {
  segment: DestinationSegment
  index: number
  nightsLabel: string
  onOpenDetail: () => void
}

/**
 * Fila de un destino en la pestaña RUTA — bandera → (nº) → ciudad, noches y fechas debajo. Las
 * noches son fijas (decididas en el cuestionario); para cambiarlas hay que rehacer la ruta, no se
 * edita aquí. Click abre el detalle del destino.
 */
export function DestinationSegmentCard({ segment, index, nightsLabel, onOpenDetail }: DestinationSegmentCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDetail()
        }
      }}
      className="flex w-full cursor-pointer items-start gap-3 border-b border-border px-4 py-4 text-left transition-colors hover:bg-bg-hover"
    >
      <FlagIcon countryCode={segment.countryCode} className="mt-1.5 shrink-0 text-body" />
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-small font-semibold text-accent-hover">
        {index + 1}
      </span>
      <div className="min-w-0">
        <p className="truncate text-body font-semibold text-text">{segment.city}</p>
        <p className="text-small text-text-soft">{nightsLabel}</p>
      </div>
    </div>
  )
}
