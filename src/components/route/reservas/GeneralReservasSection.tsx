import type { Route } from '../../../lib/types'
import { InsuranceRow } from './InsuranceRow'
import { N26Row } from './N26Row'
import { RentalVehicleRow } from './RentalVehicleRow'

interface GeneralReservasSectionProps {
  route: Route
}

/** Bloque "Imprescindibles" — Seguro/N26/Vehículo de alquiler (si aplica), una única reserva para todo el recorrido. Mismos componentes de fila que se repiten dentro de cada acordeón de destino, mismo estado compartido. */
export function GeneralReservasSection({ route }: GeneralReservasSectionProps) {
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'

  return (
    <div className="space-y-2">
      <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Imprescindibles</h3>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
        <InsuranceRow />
        <N26Row />
        {hasRentalVehicle && <RentalVehicleRow />}
      </div>
    </div>
  )
}
