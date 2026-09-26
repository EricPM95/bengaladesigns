import type { DayPlan } from '../../lib/types'
import type { DestinationSegment } from '../../lib/destinationSegments'
import { flagColors } from '../../lib/flagColors'
import { KIND_ICON, numberedStopsOf } from '../../lib/stopKind'

interface DestinationSegmentCardProps {
  segment: DestinationSegment
  index: number
  days: DayPlan[]
  nightsLabel: string
  onOpenDetail: () => void
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  )
}

/**
 * Un destino dentro de su tarjeta de país (diseño "Trazo Itinerario"): la misma tarjeta alargada que
 * las paradas de DIAS, con la franja en los colores de la bandera. Días del tramo, ciudad, y sus días,
 * noches y paradas reales. Las noches son fijas (decididas en el cuestionario). Tocar abre el detalle.
 */
export function DestinationSegmentCard({ segment, index, days, nightsLabel, onOpenDetail }: DestinationSegmentCardProps) {
  const [first, second, third] = flagColors(segment.countryCode)
  const segmentDays = days.filter((day) => segment.dayIds.includes(day.id))
  const firstNumber = segmentDays[0]?.dayNumber ?? 1
  const lastNumber = segmentDays[segmentDays.length - 1]?.dayNumber ?? firstNumber
  const stopCount = segmentDays.reduce((sum, day) => sum + numberedStopsOf(day).length, 0)

  return (
    <div className="relative pl-[26px]">
      <div className="absolute bottom-0 left-[11px] top-0 border-l-[1.5px] border-dashed border-text/[.18]" aria-hidden="true" />
      <button
        type="button"
        onClick={onOpenDetail}
        className="relative flex min-h-[88px] w-full rounded-[18px] border border-text/[.08] bg-white text-left shadow-[0_1px_2px_rgba(28,34,48,.05),0_10px_24px_-18px_rgba(28,34,48,.35)] dark:bg-bg-hover"
      >
        <div className="relative w-[104px] shrink-0 overflow-hidden rounded-l-[17px]" style={{ marginRight: -14 }}>
          <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 58px 0, 32px 100%, 0 100%)', background: first }} />
          <span className="absolute bottom-0 left-0 top-0 flex w-9 items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={KIND_ICON.pin} />
            </svg>
          </span>
          <div
            className="absolute bottom-0 left-[30px] right-0 top-0"
            style={{ clipPath: 'polygon(26px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)', background: `linear-gradient(106deg, ${second ?? first} 0 50%, ${third ?? second ?? first} 50%)` }}
          />
        </div>
        <span
          className="absolute -left-[9px] -top-[9px] z-[2] flex h-6 w-6 items-center justify-center rounded-full border-[2.5px] border-bg-card text-[11px] font-semibold text-white"
          style={{ background: first }}
        >
          {index + 1}
        </span>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[3px] py-[9px] pl-[18px] pr-3">
          <span className="font-mono text-[10.5px] font-semibold tracking-[.04em] text-text/60">
            {firstNumber === lastNumber ? `DÍA ${firstNumber}` : `DÍAS ${firstNumber} — ${lastNumber}`}
          </span>
          <span className="truncate font-display text-[17px] leading-[1.1] text-text">{segment.city}</span>
          <span className="flex flex-wrap gap-x-[9px] gap-y-0.5 text-[11px] text-text/60">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Icon d={KIND_ICON.clock} />
              {segmentDays.length} día{segmentDays.length === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Icon d={KIND_ICON.moon} />
              {nightsLabel}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Icon d={KIND_ICON.pin} />
              {stopCount} parada{stopCount === 1 ? '' : 's'}
            </span>
          </span>
        </div>
      </button>
    </div>
  )
}
