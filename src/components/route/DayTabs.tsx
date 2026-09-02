import { useDroppable } from '@dnd-kit/core'
import type { DayPlan } from '../../lib/types'

interface DayTabsProps {
  days: DayPlan[]
  activeDayId: string | null
  onSelect: (dayId: string) => void
  /** Tope de días contratados originalmente (pestaña RUTA, punto 4) — si `days` tiene más (noches añadidas de más), DIAS no genera pestañas por encima de este número. */
  maxDays?: number
}

function DayTab({ day, active, onSelect }: { day: DayPlan; active: boolean; onSelect: (dayId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-tab-${day.id}` })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(day.id)}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-small font-medium transition-colors ${
        active ? 'bg-accent text-white' : 'bg-bg-hover text-text-soft hover:bg-border'
      } ${isOver ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg-card' : ''}`}
    >
      D{day.dayNumber}
    </button>
  )
}

export function DayTabs({ days, activeDayId, onSelect, maxDays }: DayTabsProps) {
  const visibleDays = maxDays !== undefined ? days.slice(0, maxDays) : days
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border bg-bg-card px-4 py-3">
      {visibleDays.map((day) => (
        <DayTab key={day.id} day={day} active={activeDayId === day.id} onSelect={onSelect} />
      ))}
    </div>
  )
}
