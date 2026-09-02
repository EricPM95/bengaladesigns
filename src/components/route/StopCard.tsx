import type { DayPlan, Stop } from '../../lib/types'
import { formatDuration } from '../../lib/format'
import { TourOptions } from './TourOptions'
import { StopMenu } from './StopMenu'

interface StopCardProps {
  stop: Stop
  dayId: string
  days: DayPlan[]
  onOpenDetail: (stop: Stop) => void
  dragHandleProps?: Record<string, unknown>
}

export function StopCard({ stop, dayId, days, onOpenDetail, dragHandleProps }: StopCardProps) {
  return (
    <div className="group flex gap-3 px-4 py-4">
      <div
        {...dragHandleProps}
        className="mt-1 hidden shrink-0 cursor-grab text-text-muted opacity-0 transition-opacity group-hover:opacity-100 sm:block"
      >
        ⠿
      </div>
      <img src={stop.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(stop)}
            className="text-left text-body font-medium text-text hover:text-accent-hover"
          >
            📍 {stop.time} → {stop.name}
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-small text-text-muted">⏱ {formatDuration(stop.durationMinutes)}</span>
            <StopMenu stop={stop} dayId={dayId} days={days} />
          </div>
        </div>

        <p className="mt-1 text-small text-text-soft">{stop.description}</p>

        {stop.priceInfo && <p className="mt-1.5 text-small text-text-soft">💰 {stop.priceInfo}</p>}
        {stop.insiderTip && <p className="mt-1 text-small italic text-accent-hover">⚡ {stop.insiderTip}</p>}

        {stop.ticketOptions && stop.ticketOptions.length > 0 && (
          <div className="mt-2">
            <TourOptions ticketOptions={stop.ticketOptions} contextLabel={stop.name} />
          </div>
        )}

        {stop.detail && (
          <button
            type="button"
            onClick={() => onOpenDetail(stop)}
            className="mt-2 text-small font-medium text-accent hover:text-accent-hover"
          >
            📋 Ver ficha completa
          </button>
        )}

        {stop.walkingTimeToNextMinutes != null && (
          <p className="mt-3 text-small text-text-muted">
            ↓ {stop.walkingTimeToNextMinutes} min hasta la siguiente parada{stop.nextStopNote ? ` · ${stop.nextStopNote}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}
