import { useState } from 'react'
import type { Route } from '../../lib/types'
import { buildDestinationSegments, formatSegmentNightsLabel, segmentCentroid } from '../../lib/destinationSegments'
import { DestinationSegmentCard } from './DestinationSegmentCard'
import { DestinationDistanceConnector } from './DestinationDistanceConnector'
import { DestinationDetailModal } from './DestinationDetailModal'

interface RouteOverviewProps {
  route: Route
}

/**
 * Pestaña RUTA — lista de destinos numerada (una sola fila si el viaje es de un único destino) y
 * la vista de detalle al pulsar una tarjeta. Las noches por destino son fijas, decididas en el
 * cuestionario inicial — no se editan aquí.
 */
export function RouteOverview({ route }: RouteOverviewProps) {
  const [detailCity, setDetailCity] = useState<string | null>(null)

  const segments = buildDestinationSegments(route.days)
  const detailSegment = detailCity ? segments.find((segment) => segment.city === detailCity) : undefined

  return (
    <div className="flex-1 overflow-y-auto">
      <div>
        {segments.map((segment, index) => (
          <div key={segment.id}>
            {index > 0 && (
              <DestinationDistanceConnector from={segmentCentroid(segments[index - 1], route.days)} to={segmentCentroid(segment, route.days)} />
            )}
            <DestinationSegmentCard
              segment={segment}
              index={index}
              nightsLabel={formatSegmentNightsLabel(segment, route.days, route.answers.dateRange?.start)}
              onOpenDetail={() => setDetailCity(segment.city)}
            />
          </div>
        ))}
      </div>

      <DestinationDetailModal
        city={detailCity}
        days={route.days}
        nightsLabel={detailSegment ? formatSegmentNightsLabel(detailSegment, route.days, route.answers.dateRange?.start) : null}
        isCamper={route.transportContext.vehicle_type === 'camper'}
        onClose={() => setDetailCity(null)}
      />
    </div>
  )
}
