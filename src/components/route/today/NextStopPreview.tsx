import type { MockStopDetail } from '../../../lib/mockDayDetail'
import type { Coordinates, Stop } from '../../../lib/types'
import { LegLine } from './TodayPlan'

interface NextStopPreviewProps {
  realStop: Stop
  displayStop: MockStopDetail
  /** Dónde estás (la parada actual): de ahí sale el trayecto hasta esta. */
  from?: Coordinates
}

/** "A continuación" — preview de la siguiente parada, opacidad reducida, sin interacción. */
export function NextStopPreview({ realStop, displayStop, from }: NextStopPreviewProps) {
  return (
    <div className="mx-4 flex items-center gap-3 rounded-xl border border-dashed border-border p-3 opacity-60">
      <img src={displayStop.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">A continuación{realStop.time ? (realStop.orientativeTime ? ` · hacia las ${realStop.time}` : ` · ${realStop.time}`) : ''}</p>
        <p className="truncate text-small font-medium text-text">{displayStop.name}</p>
        <LegLine from={from} to={realStop} />
      </div>
    </div>
  )
}
