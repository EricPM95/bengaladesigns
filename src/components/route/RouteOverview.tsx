import { useState } from 'react'
import type { Route } from '../../lib/types'
import { buildDestinationSegments, formatSegmentNightsLabel, segmentCentroid, type DestinationSegment } from '../../lib/destinationSegments'
import { countryNameEs, dayCountryCode, flagDots, flagStripesGradient } from '../../lib/flagColors'
import { useRouteStore } from '../../store/useRouteStore'
import { DestinationSegmentCard } from './DestinationSegmentCard'
import { DestinationDistanceConnector } from './DestinationDistanceConnector'
import { DestinationDetailModal } from './DestinationDetailModal'

interface RouteOverviewProps {
  route: Route
}

interface CountryGroup {
  countryCode: string | null
  segments: { segment: DestinationSegment; index: number }[]
}

/** Destinos seguidos del mismo país → una tarjeta de país. */
function groupByCountry(segments: DestinationSegment[]): CountryGroup[] {
  const groups: CountryGroup[] = []
  segments.forEach((segment, index) => {
    const last = groups[groups.length - 1]
    if (last && last.countryCode === segment.countryCode) last.segments.push({ segment, index })
    else groups.push({ countryCode: segment.countryCode, segments: [{ segment, index }] })
  })
  return groups
}

/**
 * Pestaña RUTA (diseño "Trazo Itinerario"): una tarjeta por país — su bandera en franjas inclinadas,
 * "PAÍS 1", el nombre, tres puntitos con sus colores y "1 destino · 3 días" — que se abre en sus
 * destinos (con la distancia entre uno y otro). Las noches por destino son fijas, decididas en el
 * cuestionario inicial; tocar un destino abre su detalle.
 */
export function RouteOverview({ route }: RouteOverviewProps) {
  const [detailCity, setDetailCity] = useState<string | null>(null)
  const [openCountries, setOpenCountries] = useState<Set<number>>(new Set())

  // Rutas guardadas antes de que la ruta llevara el país: el del destino elegido en el formulario.
  const fallbackCountry = useRouteStore((state) => state.destinationPlace?.countryCode ?? null)
  const segments = buildDestinationSegments(route.days).map((segment) => (segment.countryCode ? segment : { ...segment, countryCode: dayCountryCode(fallbackCountry, segment.city) }))
  const detailSegment = detailCity ? segments.find((segment) => segment.city === detailCity) : undefined
  const groups = groupByCountry(segments)
  const tripDays = route.days.filter((day) => !day.isReturnLeg)

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-3.5 pb-36 pt-4">
      {groups.map((group, groupIndex) => {
        const open = openCountries.has(groupIndex)
        const days = tripDays.filter((day) => group.segments.some(({ segment }) => segment.dayIds.includes(day.id))).length
        const destinations = group.segments.length
        const toggle = () =>
          setOpenCountries((prev) => {
            const next = new Set(prev)
            if (next.has(groupIndex)) next.delete(groupIndex)
            else next.add(groupIndex)
            return next
          })
        return (
          <div
            key={`${group.countryCode}-${groupIndex}`}
            className="relative overflow-hidden rounded-3xl border border-text/10 bg-bg-card shadow-[0_1px_2px_rgba(28,34,48,.05),0_12px_30px_-20px_rgba(28,34,48,.3)]"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={toggle}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  toggle()
                }
              }}
              className="flex h-20 cursor-pointer items-center gap-3.5 pl-4 pr-3"
            >
              {/* La bandera: sus colores en franjas inclinadas, en un cuadrado de esquinas redondeadas. */}
              <span
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(28,34,48,.08)]"
                style={{ background: flagStripesGradient(group.countryCode) }}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[.14em] text-text/50">País {groupIndex + 1}</span>
                <span className="truncate font-display text-[24px] leading-[1.05] text-text">{countryNameEs(group.countryCode)}</span>
                <span className="mt-1 flex items-center gap-1">
                  {flagDots(group.countryCode).map((color, index) => (
                    <span key={index} className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
                  ))}
                  <span className="ml-1 whitespace-nowrap text-[12px] text-text/55">
                    {destinations} destino{destinations === 1 ? '' : 's'} · {days} día{days === 1 ? '' : 's'}
                  </span>
                </span>
              </span>
              {/* El asa y el "···" solo tienen sentido con varios países (hasta entonces, ocultos). */}
              {groups.length > 1 && (
                <>
                  <span title="Arrastrar para reordenar" aria-hidden="true" className="flex h-9 w-7 shrink-0 items-center justify-center text-text/40">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M5 9h14M5 12h14M5 15h14" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Opciones del país"
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[14px] font-bold leading-none tracking-[1px] text-text/60"
                  >
                    ···
                  </button>
                </>
              )}
              <span className="flex w-[22px] justify-center text-text/45 transition-transform duration-[400ms]" style={{ transform: open ? 'rotate(90deg)' : 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </div>

            {open && (
              <div className="border-t border-dashed border-text/[.12] px-3 pb-4 pt-4" style={{ animation: 'trazo-pop .45s cubic-bezier(.2,.8,.2,1) backwards' }}>
                {group.segments.map(({ segment, index }, positionInGroup) => (
                  <div key={segment.id}>
                    {positionInGroup > 0 && (
                      <DestinationDistanceConnector from={segmentCentroid(segments[index - 1], route.days)} to={segmentCentroid(segment, route.days)} />
                    )}
                    <DestinationSegmentCard
                      segment={segment}
                      index={index}
                      days={route.days}
                      nightsLabel={formatSegmentNightsLabel(segment, route.days, route.answers.dateRange?.start)}
                      onOpenDetail={() => setDetailCity(segment.city)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <DestinationDetailModal
        city={detailCity}
        days={route.days}
        nightsLabel={detailSegment ? formatSegmentNightsLabel(detailSegment, route.days, route.answers.dateRange?.start) : null}
        isCamper={route.transportContext.vehicle_type === 'camper'}
        onClose={() => setDetailCity(null)}
      />
    </div>
  )
}
