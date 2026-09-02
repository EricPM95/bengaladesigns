import type { DestinationSegment } from '../../lib/destinationSegments'
import { FlagIcon } from '../ui/FlagIcon'

interface DestinationSegmentCardProps {
  segment: DestinationSegment
  index: number
  nightsLabel: string
  onOpenDetail: () => void
}

/**
 * Fila de un destino en la pestaña RUTA — (nº) bandera + ciudad, noches y fechas debajo. Las
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-small font-semibold text-accent-hover">
        {index + 1}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-body font-semibold text-text">
          <FlagIcon countryCode={segment.countryCode} />
          <span className="truncate">{segment.city}</span>
        </p>
        <p className="text-small text-text-soft">{nightsLabel}</p>
      </div>
    </div>
  )
}
