import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { addMinutesToTime } from '../../../lib/time'
import { KIND_ICON } from '../../../lib/stopKind'
import { TrazoCard } from './TrazoCards'

interface BreakCardProps {
  stop: MockStopDetail
  startTime?: string
  /** Menú "···" (quitar, mover…), igual que en las paradas. */
  menu?: ReactNode
}

/**
 * Una pausa con nombre del día curado (el desayuno romano): no es un lugar, así que se pinta como la
 * comida (terracota, sin número ni foto), con su franja, su texto y dos cafés cerca. Sin ficha: no se
 * abre, así que nunca pide nada al servidor ni a Claude.
 */
export function BreakCard({ stop, startTime, menu }: BreakCardProps) {
  const endTime = startTime ? addMinutesToTime(startTime, stop.durationMinutes) : null
  const suggestions = stop.breakSuggestions ?? []
  return (
    <TrazoCard
      kind="comida"
      iconPath={KIND_ICON.coffee}
      time={startTime ? (endTime ? `${startTime} – ${endTime}` : startTime) : null}
      name={stop.name}
      sub={stop.why ?? null}
      meta={suggestions.map((item) => ({ icon: 'pin' as const, text: `${item.name} · ${item.walkMinutes} min` }))}
      noPhoto
      menu={menu}
    />
  )
}
