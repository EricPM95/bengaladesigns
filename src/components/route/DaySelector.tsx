import type { DayPlan } from '../../lib/types'
import { addDaysToIso, formatWeekdayAbbrEs } from '../../lib/dateRange'

interface DaySelectorProps {
  days: DayPlan[]
  activeDayId: string | null
  onSelect: (dayId: string) => void
  /** Fecha ISO de inicio del viaje, si el viajero fijó fechas exactas — si no, se muestra "DÍA {N}" en vez del día de la semana/mes. */
  tripStartIso: string | undefined
}

/** Tira horizontal de chips pequeños, uno por día del viaje — día de la semana arriba, número del día del mes debajo, sin iconos. */
export function DaySelector({ days, activeDayId, onSelect, tripStartIso }: DaySelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-bg-card px-3 py-2">
      {days.map((day) => {
        const dateIso = tripStartIso ? addDaysToIso(tripStartIso, day.dayNumber - 1) : null
        const active = activeDayId === day.id

        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onSelect(day.id)}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg border px-2 py-1 transition-colors ${
              active ? 'border-accent' : 'border-border hover:border-border-accent'
            }`}
          >
            <span className={`text-caption font-semibold uppercase tracking-wide ${active ? 'text-accent' : 'text-text-muted'}`}>
              {dateIso ? formatWeekdayAbbrEs(dateIso) : 'DÍA'}
            </span>
            <span className="font-display text-body font-bold text-accent">
              {dateIso ? new Date(`${dateIso}T00:00:00`).getDate() : day.dayNumber}
            </span>
          </button>
        )
      })}
    </div>
  )
}
