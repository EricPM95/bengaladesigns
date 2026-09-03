import type { Route } from '../../../lib/types'
import type { DestinationSegment } from '../../../lib/destinationSegments'
import { computeDayTravelInfo } from '../../../lib/dayTravelInfo'
import { TransportRow } from './TransportRow'
import { AccommodationRow } from './AccommodationRow'
import { EsimRow } from './EsimRow'
import { InsuranceRow } from './InsuranceRow'
import { N26Row } from './N26Row'
import { RentalVehicleRow } from './RentalVehicleRow'

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
 * eSIM del país (si se conoce); y los ítems de "General del viaje" repetidos con el mismo estado
 * compartido que el bloque general (ver GeneralReservasSection).
 */
export function DestinationReservasAccordion({ route, segment, isLastSegment, expanded, onToggle }: DestinationReservasAccordionProps) {
  const firstDayIndex = route.days.findIndex((day) => day.id === segment.dayIds[0])
  const arrival = computeDayTravelInfo(route, firstDayIndex)
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'
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
          {segment.countryCode && <EsimRow countryCode={segment.countryCode} />}
          <InsuranceRow />
          <N26Row />
          {hasRentalVehicle && <RentalVehicleRow />}
        </div>
      )}
    </div>
  )
}
