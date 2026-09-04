import type { Route } from '../../../lib/types'
import type { DestinationSegment } from '../../../lib/destinationSegments'
import { computeDayTravelInfo } from '../../../lib/dayTravelInfo'
import { TransportRow } from './TransportRow'
import { AccommodationRow } from './AccommodationRow'
import { EsimRow } from './EsimRow'
import { N26Row } from './N26Row'

interface DestinationReservasAccordionProps {
  route: Route
  segment: DestinationSegment
  isLastSegment: boolean
  expanded: boolean
  onToggle: () => void
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/**
 * Acordeón de un destino en RESERVAS — mismos destinos/orden que RUTA. Transporte de llegada
 * siempre; transporte de vuelta SOLO en el último destino; alojamiento salvo vehículo camper;
 * N26/eSIM del país (si se conoce), con el mismo estado sincronizado entre destinos que en el resto
 * de la app. Seguro de viaje y vehículo de alquiler viven en ReservasPanel.tsx como secciones
 * generales del viaje (no por destino) — no se repiten aquí.
 */
export function DestinationReservasAccordion({ route, segment, isLastSegment, expanded, onToggle }: DestinationReservasAccordionProps) {
  const firstDayIndex = route.days.findIndex((day) => day.id === segment.dayIds[0])
  const arrival = computeDayTravelInfo(route, firstDayIndex)
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const lastDay = route.days[route.days.length - 1]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2 p-3.5 text-left transition-colors hover:bg-bg-hover">
        <ChevronIcon expanded={expanded} />
        <span className="font-display text-h2 font-bold text-text">{segment.city}</span>
      </button>

      {expanded && (
        <div className="divide-y divide-border border-t border-border">
          {arrival && <TransportRow dayId={segment.dayIds[0]} label={`${arrival.fromCity} → ${arrival.toCity}`} />}
          {!isCamper && segment.nights > 0 && <AccommodationRow segmentDayId={segment.dayIds[0]} city={segment.city} totalNights={segment.nights} />}
          {isLastSegment && <TransportRow dayId={lastDay.id} label={`${segment.city} → ${route.origin}`} />}
          <N26Row />
          {segment.countryCode && <EsimRow countryCode={segment.countryCode} />}
        </div>
      )}
    </div>
  )
}
