import { useState } from 'react'
import type { SavedTrip } from '../../lib/tripPersistence'
import { formatCompactDateRangeEs } from '../../lib/dateRange'
import { FlagIcon } from '../ui/FlagIcon'
import { Card } from '../ui/Card'

interface TripCardProps {
  trip: SavedTrip
  onOpen: () => void
  onDelete: () => void
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

/** Subtítulo de fecha de la tarjeta — rango exacto si se fijó, o "{días} días" si el viaje solo tiene duración (sin fechas concretas). */
function dateSubtitle(trip: SavedTrip): string {
  const { dateRange, days } = trip.route.answers
  if (dateRange) return formatCompactDateRangeEs(dateRange.start, dateRange.end)
  return days ? `${days} días` : ''
}

/**
 * Tarjeta de un viaje guardado en "Mis viajes" — bandera + destino, rango de fechas, papelera
 * discreta en la esquina para borrar (con confirmación inline, mismo patrón que
 * ConfirmDeleteButton.tsx). Sin miniatura de mapa/imagen por ahora (se dejó fuera a propósito, ver
 * el prompt original — no era trivial de generar barato).
 */
export function TripCard({ trip, onOpen, onDelete }: TripCardProps) {
  const [confirming, setConfirming] = useState(false)
  const countryCode = trip.route.days[0]?.countryCode ?? null

  if (confirming) {
    return (
      <Card className="space-y-3 border-accent-red/30 bg-accent-red/5 p-4">
        <p className="text-small text-text">¿Seguro que quieres eliminar tu viaje a {trip.route.destination}?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-lg bg-bg-hover py-1.5 text-small font-medium text-text hover:bg-border"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex-1 rounded-lg bg-accent-red py-1.5 text-small font-semibold text-white hover:opacity-90"
          >
            Sí, eliminar
          </button>
        </div>
      </Card>
    )
  }

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
          setConfirming(true)
        }}
        aria-label={`Eliminar viaje a ${trip.route.destination}`}
        title="Eliminar viaje"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover hover:text-accent-red"
      >
        <TrashIcon />
      </button>
    </Card>
  )
}
