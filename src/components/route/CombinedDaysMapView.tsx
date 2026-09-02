import { useState } from 'react'
import type { Route } from '../../lib/types'
import { dayColor } from '../../lib/dayColors'
import { AllDaysMapPlaceholder } from '../map/AllDaysMapPlaceholder'

interface CombinedDaysMapViewProps {
  route: Route
  onClose: () => void
}

/**
 * Vista alternativa dentro de DIAS — todas las paradas de todos los días a la vez, coloreadas por
 * día (ver dayColors.ts), con chips para aislar un día concreto o volver a "Ver todos". Se abre
 * desde el botón flotante de mapa (ver RouteView.tsx); el mapa "solo del día activo" (tirador gris,
 * 40-55% de pantalla) sigue siendo el comportamiento por defecto al navegar por los días — esto es
 * una pantalla completa aparte, no lo sustituye.
 */
export function CombinedDaysMapView({ route, onClose }: CombinedDaysMapViewProps) {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const days = route.days.filter((day) => !day.isReturnLeg)

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="relative flex-1">
        <AllDaysMapPlaceholder destination={route.destination} days={days} selectedDayId={selectedDayId} />
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-bg-card/90 px-3 py-2 text-caption font-semibold text-text shadow-md backdrop-blur-sm hover:bg-bg-card"
        >
          ← Volver
        </button>
      </div>

      <div className="shrink-0 space-y-2 border-t border-border bg-bg-card p-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">Filtrar por día</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedDayId(null)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors ${
              selectedDayId === null ? 'border-accent bg-accent text-white' : 'border-border text-text-soft hover:border-border-accent'
            }`}
          >
            Ver todos
          </button>
          {days.map((day, index) => {
            const active = selectedDayId === day.id
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDayId(day.id)}
                style={active ? { backgroundColor: dayColor(index), borderColor: dayColor(index) } : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors ${
                  active ? 'text-white' : 'border-border text-text-soft hover:border-border-accent'
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dayColor(index) }} aria-hidden="true" />
                Día {day.dayNumber}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
