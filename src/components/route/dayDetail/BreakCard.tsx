import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { KIND_ICON } from '../../../lib/stopKind'
import { TrazoCard } from './TrazoCards'
import { BREAKFAST_PHOTO_URL } from '../../../lib/breakfastPhoto'

interface BreakCardProps {
  stop: MockStopDetail
  startTime?: string
  /** Menú "···" (quitar, mover…), igual que en las paradas. */
  menu?: ReactNode
  /** Abre su ficha: el texto va dentro (la tarjeta no lleva texto, decisión del usuario 2026-09-28). */
  onOpen?: () => void
}

/**
 * Una pausa con nombre del día curado (el desayuno romano): no es un lugar. La tarjeta de siempre, con su franja de
 * color y la diagonal, sin número de orden; en la diagonal, la misma foto en todos los destinos, un café
 * (BREAKFAST_PHOTO_URL; decisión del usuario, 2026-09-29). Su texto va en la ficha; la ficha de una pausa nunca pide nada
 * al servidor ni a Claude.
 */
export function BreakCard({ stop, menu, onOpen }: BreakCardProps) {
  const suggestions = stop.breakSuggestions ?? []
  return (
    <TrazoCard
      kind="comida"
      iconPath={KIND_ICON.coffee}
      name={stop.name}
      meta={suggestions.map((item) => ({ icon: 'pin' as const, text: `${item.name} · ${item.walkMinutes} min` }))}
      photoUrl={BREAKFAST_PHOTO_URL}
      menu={menu}
      onOpen={onOpen}
    />
  )
}
