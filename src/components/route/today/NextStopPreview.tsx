import type { MockStopDetail } from '../../../lib/mockDayDetail'
import type { Coordinates, Stop } from '../../../lib/types'
import { LegLine } from './TodayPlan'

/**
 * Tanda 6d: si se llega antes de que abra un sitio, HOY lo dice: «Santa Maria del Popolo (los Caravaggio) abre en 20 min. Mientras, haz unas fotos en la Piazza del Popolo».
 * El texto de «mientras» sale de la parada de antes (o «aprovecha {la parada de antes}»). Devuelve null si no hay que esperar.
 */
export function waitNotice(stop: Stop, name: string, nowMin: number): string | null {
  if (!stop.waitOpensAt || !/^\d{1,2}:\d{2}$/.test(stop.waitOpensAt)) return null
  const [hours, minutes] = stop.waitOpensAt.split(':').map(Number)
  const left = hours * 60 + minutes - nowMin
  if (left <= 0) return null
  return `${name} abre en ${left} min.${stop.waitHint ? ` ${stop.waitHint}` : ''}`
}

interface NextStopPreviewProps {
  realStop: Stop
  displayStop: MockStopDetail
  /** Dónde estás (la parada actual): de ahí sale el trayecto hasta esta. */
  from?: Coordinates
  nowMin?: number
}

/** "A continuación" — preview de la siguiente parada, opacidad reducida, sin interacción. */
export function NextStopPreview({ realStop, displayStop, from, nowMin }: NextStopPreviewProps) {
  const wait = nowMin != null ? waitNotice(realStop, displayStop.name, nowMin) : null
  return (
    <div className="mx-4 flex items-center gap-3 rounded-xl border border-dashed border-border p-3 opacity-60">
      <img src={displayStop.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">A continuación{realStop.reservationTime ? ` · ${realStop.reservationTime}` : ''}</p>
        <p className="truncate text-small font-medium text-text">{displayStop.name}</p>
        <LegLine from={from} to={realStop} />
        {wait && <p className="mt-1 text-small leading-snug text-text">{wait}</p>}
      </div>
    </div>
  )
}
