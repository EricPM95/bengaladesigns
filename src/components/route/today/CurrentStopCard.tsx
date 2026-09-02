import { useEffect, useState } from 'react'
import type { DayPlan, Stop } from '../../../lib/types'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { computeOpenStatusLabel, getStopPlannedWindow, type StopRuntimeState } from '../../../lib/todayMode'
import { formatDuration } from '../../../lib/format'
import { getDistanceToStop, type StopDistance } from '../../../lib/distanceMock'
import { Button } from '../../ui/Button'
import { TipBox } from '../dayDetail/TipBox'
import { PurchaseSection } from '../dayDetail/PurchaseSection'
import { StopMenu } from '../dayDetail/StopMenu'
import { HowToGetThereSheet } from './HowToGetThereSheet'

interface CurrentStopCardProps {
  day: DayPlan
  index: number
  realStop: Stop
  displayStop: MockStopDetail
  state: StopRuntimeState
  nowMin: number
  realStops: Stop[]
  otherDays: { id: string; dayNumber: number; city: string }[]
  onCheckIn: () => void
  onNoteDelay: () => void
}

/**
 * Tarjeta de la parada actual de Modo Hoy — tres diseños según `state` (ver getStopRuntimeState):
 * "upcoming" cuenta atrás suave, "now" el diseño completo ya validado, "confirm" el aviso discreto
 * "¿Sigues aquí?". Nunca recibe `state === 'done'` (TodayView ya avanza a la siguiente parada).
 */
export function CurrentStopCard({ day, index, realStop, displayStop, state, nowMin, realStops, otherDays, onCheckIn, onNoteDelay }: CurrentStopCardProps) {
  const [distance, setDistance] = useState<StopDistance | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [mapsOpen, setMapsOpen] = useState(false)

  useEffect(() => {
    if (state !== 'now') return
    let cancelled = false
    setDistance(null)
    getDistanceToStop(realStop.id, realStop.coordinates).then((result) => {
      if (!cancelled) setDistance(result)
    })
    return () => {
      cancelled = true
    }
  }, [state, realStop.id])

  if (state === 'upcoming') {
    const { startMin } = getStopPlannedWindow(realStop)
    const minutesLeft = Math.max(0, startMin - nowMin)
    return (
      <div className="mx-4 space-y-2 rounded-2xl border border-border bg-bg-card p-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">Próxima parada</p>
        <p className="text-body font-semibold text-text">{displayStop.name}</p>
        <p className="text-small text-text-soft">
          Empieza sobre las {realStop.time} — te quedan {minutesLeft} min
        </p>
      </div>
    )
  }

  if (state === 'confirm') {
    return (
      <div className="mx-4 space-y-3 rounded-2xl border border-accent-gold/40 bg-accent-gold/10 px-4 py-3.5">
        <p className="text-body font-medium text-text">¿Sigues en {displayStop.name}?</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onNoteDelay} className="flex-1">
            Sí, dame más tiempo
          </Button>
          <Button onClick={onCheckIn} className="flex-1">
            Ya terminé, seguir
          </Button>
        </div>
      </div>
    )
  }

  const openStatus = computeOpenStatusLabel(displayStop.hours, nowMin)

  return (
    <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-bg-card">
      <img src={displayStop.photoUrl} alt="" className="h-40 w-full object-cover" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-body font-semibold text-text">{displayStop.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-soft">
              {openStatus && <span className={openStatus === 'Cerrado ahora' ? 'font-medium text-accent-red' : 'font-medium text-accent-hover'}>{openStatus}</span>}
              {distance && (
                <span>
                  · a {distance.meters < 1000 ? `${distance.meters} m` : `${(distance.meters / 1000).toFixed(1)} km`} ({formatDuration(distance.walkMinutes)} andando)
                </span>
              )}
            </div>
          </div>
          <StopMenu dayId={day.id} city={day.city} stop={realStop} index={index} realStops={realStops} otherDays={otherDays} />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setMapsOpen(true)} className="flex-1">
            Cómo llegar
          </Button>
          <Button variant="secondary" onClick={() => setDetailOpen((value) => !value)} className="flex-1">
            {detailOpen ? 'Ocultar detalle' : 'Ver detalle'}
          </Button>
        </div>

        {detailOpen && (
          <div className="space-y-3 border-t border-border pt-3">
            <p className="text-small text-text-soft">{displayStop.description}</p>
            {displayStop.sections?.map((section) => (
              <div key={section.heading} className="space-y-1">
                <h4 className="text-body font-semibold text-text">{section.heading}</h4>
                <p className="text-small text-text-soft">{section.body}</p>
              </div>
            ))}
            {displayStop.tips.map((tip) => (
              <TipBox key={tip}>{tip}</TipBox>
            ))}
            {displayStop.purchase && <PurchaseSection purchase={displayStop.purchase} />}
          </div>
        )}

        <Button onClick={onCheckIn} className="w-full font-bold shadow-sm">
          ✓ Ya he estado aquí — siguiente parada
        </Button>
      </div>

      <HowToGetThereSheet open={mapsOpen} onClose={() => setMapsOpen(false)} destination={displayStop.name} />
    </div>
  )
}
