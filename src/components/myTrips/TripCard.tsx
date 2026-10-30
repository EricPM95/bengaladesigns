import { dayCountryCode } from '../../lib/flagColors'
import type { SavedTrip } from '../../lib/tripPersistence'
import { formatCompactDateRangeEs } from '../../lib/dateRange'
import { FlagIcon } from '../ui/FlagIcon'
import { Card } from '../ui/Card'
import { Icono } from '../ui/Icono'
import { textoDeDuracion } from '../../lib/duracionViaje'

interface TripCardProps {
  trip: SavedTrip
  onOpen: () => void
  onDelete: () => void
}

function TrashIcon() {
  return (
    <Icono nombre="papelera" className="h-4 w-4" />
  )
}

/** Subtítulo de fecha de la tarjeta — rango exacto si se fijó, o «5 días · 4 noches» si el viaje solo tiene duración (sin fechas concretas). */
function dateSubtitle(trip: SavedTrip): string {
  const { dateRange, days } = trip.route.answers
  if (dateRange) return formatCompactDateRangeEs(dateRange.start, dateRange.end)
  return days ? textoDeDuracion(days) : ''
}

/**
 * Tarjeta de un viaje guardado en "Mis viajes" — bandera + destino, rango de fechas, papelera
 * discreta en la esquina para borrar (Tanda 10F: abre la hoja de eliminar del Perfil; antes, con confirmación inline, mismo patrón que
 * ConfirmDeleteButton.tsx). Sin miniatura de mapa/imagen por ahora (se dejó fuera a propósito, ver
 * el prompt original — no era trivial de generar barato).
 */
export function TripCard({ trip, onOpen, onDelete }: TripCardProps) {
  const countryCode = dayCountryCode(trip.route.days[0]?.countryCode, trip.route.days[0]?.city)

  return (
    <Card className="relative">
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-bg-hover">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-body font-semibold text-text">
            <FlagIcon countryCode={countryCode} />
            <span className="truncate">{trip.route.destination}</span>
          </p>
          <p className="mt-0.5 text-small text-text-soft">{dateSubtitle(trip)}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
        aria-label={`Eliminar viaje a ${trip.route.destination}`}
        title="Eliminar viaje"
        className="zona-toque absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover hover:text-accent-red"
      >
        <TrashIcon />
      </button>
    </Card>
  )
}
