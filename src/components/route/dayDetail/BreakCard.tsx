import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { addMinutesToTime } from '../../../lib/time'

const GOLD_BG = '#FDF3E2'
const GOLD_BORDER = '#F3DDA9'

interface BreakCardProps {
  stop: MockStopDetail
  startTime?: string
  /** Menú "..." (quitar, mover…), igual que en las paradas. */
  menu?: ReactNode
}

/**
 * Una pausa con nombre del día curado (el desayuno romano): no es un lugar, así que se pinta como la
 * comida (MealTimeAccordion), con su icono, su franja, su texto y dos cafés cerca. Sin foto, sin horario,
 * sin etiquetas y sin ficha: no se abre, así que nunca pide nada al servidor ni a Claude.
 */
export function BreakCard({ stop, startTime, menu }: BreakCardProps) {
  const endTime = startTime ? addMinutesToTime(startTime, stop.durationMinutes) : null
  const suggestions = stop.breakSuggestions ?? []
  return (
    <div className="relative rounded-xl border p-3" style={{ backgroundColor: GOLD_BG, borderColor: GOLD_BORDER }}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body" style={{ backgroundColor: GOLD_BORDER }}>
          {stop.breakIcon ?? '☕'}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-body font-semibold text-text">{stop.name}</p>
          {startTime && <p className="text-caption text-text-soft">{endTime ? `${startTime} – ${endTime}` : startTime}</p>}
          {stop.why && <p className="text-caption italic text-text-soft">{stop.why}</p>}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestions.map((item) => (
                <span key={item.name} className="rounded-full border px-2.5 py-1 text-caption font-medium text-text" style={{ borderColor: GOLD_BORDER }}>
                  {item.name} · {item.walkMinutes} min
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {menu && <div className="absolute -right-2 -top-2 z-20">{menu}</div>}
    </div>
  )
}
