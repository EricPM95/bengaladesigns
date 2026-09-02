import { useState } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DayPlan, MealSlot, Stop } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { TransportSection } from './TransportSection'
import { HotelSection } from './HotelSection'
import { StopCard } from './StopCard'
import { MealSection } from './MealSection'
import { ExcursionSection } from './ExcursionSection'
import { ExtrasPanel } from './ExtrasPanel'
import { AddStopButton } from './AddStopButton'
import { PlaceDetailModal } from './PlaceDetailModal'
import { addMinutesToTime } from '../../lib/time'
import { buildUrbanMobilityTip, isSoutheastAsianDestination } from '../../lib/urbanPhaseMobility'

interface DayItineraryProps {
  day: DayPlan
  days: DayPlan[]
}

type TimelineEntry = { time: string; kind: 'stop'; stop: Stop } | { time: string; kind: 'meal'; meal: MealSlot }

const paceLabels: Record<string, string> = {
  zen: 'zen',
  balanced: 'equilibrado',
  nonstop: 'sin parar',
}

function buildTimeline(day: DayPlan): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...day.stops.map((stop) => ({ time: stop.time, kind: 'stop' as const, stop })),
    ...day.meals.map((meal) => ({ time: meal.time, kind: 'meal' as const, meal })),
  ]
  return entries.sort((a, b) => a.time.localeCompare(b.time))
}

function SortableStop({ stop, dayId, days, onOpenDetail }: { stop: Stop; dayId: string; days: DayPlan[]; onOpenDetail: (stop: Stop) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <StopCard stop={stop} dayId={dayId} days={days} onOpenDetail={onOpenDetail} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

export function DayItinerary({ day, days }: DayItineraryProps) {
  const [detailStop, setDetailStop] = useState<Stop | null>(null)
  const [dismissedOverload, setDismissedOverload] = useState(false)
  const pace = useRouteStore((state) => state.route?.answers.pace)
  const destination = useRouteStore((state) => state.route?.destination)
  const timeline = buildTimeline(day)

  const paceLimit = pace === 'zen' ? 3 : pace === 'nonstop' ? Infinity : 5
  const isOverloaded = day.stops.length > paceLimit && !dismissedOverload
  const lastTime = timeline.length > 0 ? timeline[timeline.length - 1].time : '09:00'
  const extrasDefaultTime = addMinutesToTime(lastTime, 30)

  // Paso 4 de multidestino_mixto_o_circuito: aviso de movilidad local solo el primer día de cada
  // fase urbana (no se repite cada día de la estancia) — copy fija en el frontend, con Grab
  // mencionado explícitamente cuando el destino es del sudeste asiático.
  const dayIndex = days.findIndex((d) => d.id === day.id)
  const previousDay = dayIndex > 0 ? days[dayIndex - 1] : null
  const isFirstDayInPhase = !previousDay || previousDay.city !== day.city
  const showUrbanMobilityTip = day.phaseType === 'urbana' && isFirstDayInPhase

  return (
    <div className="divide-y divide-border pb-8">
      {day.transport && <TransportSection transport={day.transport} dayId={day.id} />}
      {showUrbanMobilityTip && (
        <p className="px-4 py-3 text-small text-text-soft">📱 {buildUrbanMobilityTip(day.city, isSoutheastAsianDestination(destination ?? ''))}</p>
      )}
      {day.hotel && <HotelSection hotel={day.hotel} dayId={day.id} />}
      {day.rainPlanB && <div className="bg-accent-soft/40 px-4 py-3 text-small text-accent-hover">🌧 {day.rainPlanB.note}</div>}

      {isOverloaded && (
        <div className="space-y-1 bg-accent-warm/10 px-4 py-3 text-small text-accent-warm">
          <p>
            El día {day.dayNumber} ya tiene {day.stops.length} paradas. Tu ritmo es '{pace ? paceLabels[pace] : ''}' (se recomiendan{' '}
            {paceLimit === Infinity ? '6+' : `${paceLimit - 2}-${paceLimit}`}).
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDismissedOverload(true)} className="font-medium underline">
              No pasa nada
            </button>
            <span className="text-text-muted">Arrastra el tirador ⠿ de una parada a otro día para reequilibrar.</span>
          </div>
        </div>
      )}

      <SortableContext items={day.stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
        {timeline.map((entry, index) =>
          entry.kind === 'stop' ? (
            <div key={entry.stop.id}>
              <SortableStop stop={entry.stop} dayId={day.id} days={days} onOpenDetail={setDetailStop} />
              {index < timeline.length - 1 && <AddStopButton dayId={day.id} insertAfterTime={entry.time} suggestions={day.didntMakeCut ?? []} />}
            </div>
          ) : (
            <MealSection key={entry.meal.id} meal={entry.meal} />
          ),
        )}
      </SortableContext>

      {day.excursions && day.excursions.length > 0 && <ExcursionSection excursions={day.excursions} />}

      {day.didntMakeCut && <ExtrasPanel dayId={day.id} items={day.didntMakeCut} defaultTime={extrasDefaultTime} />}

      <PlaceDetailModal stop={detailStop} onClose={() => setDetailStop(null)} />
    </div>
  )
}
