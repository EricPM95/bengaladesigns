import type { ReadinessItem } from '../../../lib/readiness'
import type { Route } from '../../../lib/types'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { TransportRow } from './TransportRow'
import { AccommodationRow } from './AccommodationRow'
import { InsuranceRow } from './InsuranceRow'
import { N26Row } from './N26Row'
import { RentalVehicleRow } from './RentalVehicleRow'
import { EsimRow } from './EsimRow'

interface ReadinessBreakdownRowProps {
  item: ReadinessItem
  route: Route
}

/** Dispatcher que renderiza el mismo componente de fila interactivo (con su propio modal) que RESERVAS, según el tipo de ítem — así "Añadir" en el panel rápido del % (TripReadinessQuickPanel.tsx) abre la ficha real, no es decorativo. */
export function ReadinessBreakdownRow({ item, route }: ReadinessBreakdownRowProps) {
  if (item.kind === 'transport') {
    const dayId = item.id.slice('transport-'.length)
    return <TransportRow dayId={dayId} label={item.label} />
  }

  if (item.kind === 'accommodation') {
    const segmentDayId = item.id.slice('accommodation-'.length)
    const segment = buildDestinationSegments(route.days).find((candidate) => candidate.dayIds[0] === segmentDayId)
    if (!segment) return null
    return <AccommodationRow segmentDayId={segmentDayId} city={segment.city} totalNights={segment.nights} />
  }

  if (item.kind === 'insurance') return <InsuranceRow />
  if (item.kind === 'n26') return <N26Row />
  if (item.kind === 'rental-vehicle') return <RentalVehicleRow />

  if (item.kind === 'esim') {
    const countryCode = item.id.slice('esim-'.length)
    return <EsimRow countryCode={countryCode} />
  }

  return null
}
