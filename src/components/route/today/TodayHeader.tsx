import { formatShortDateEs } from '../../../lib/dateRange'
import { useRouteStore } from '../../../store/useRouteStore'

interface TodayHeaderProps {
  dayId: string
  dateIso: string
  city: string
}

/** "HOY · {día} {fecha}" + destino, con enlace directo a la pestaña DIAS completa para ese día. */
export function TodayHeader({ dayId, dateIso, city }: TodayHeaderProps) {
  const setMode = useRouteStore((state) => state.setMode)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)

  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4">
      <div>
        <p className="text-caption font-semibold uppercase tracking-wide text-accent">HOY · {formatShortDateEs(dateIso)}</p>
        <h1 className="font-display text-h2 font-semibold text-text">{city}</h1>
      </div>
      <button
        type="button"
        onClick={() => {
          setActiveDayId(dayId)
          setMode('days')
        }}
        className="shrink-0 pt-1 text-caption font-medium text-accent hover:text-accent-hover"
      >
        Ver el día →
      </button>
    </div>
  )
}
