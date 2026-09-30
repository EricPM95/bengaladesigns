import { useState } from 'react'
import type { Route } from '../../lib/types'
import { buildDestinationSegments, formatSegmentNightsLabel, segmentCentroid } from '../../lib/destinationSegments'
import { dayCountryCode, flagStripesGradient } from '../../lib/flagColors'
import { addDaysToIso } from '../../lib/dateRange'
import { useRouteStore } from '../../store/useRouteStore'
import { DestinationDistanceConnector } from './DestinationDistanceConnector'
import { DestinationDetailModal } from './DestinationDetailModal'

interface RouteOverviewProps {
  route: Route
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
/** «03 sept» */
const shortDate = (iso: string) => `${iso.slice(8, 10)} ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]}`

/**
 * Pestaña RUTA (PROMPT_UI_REPASO_3, 1): una tarjeta por destino, en el orden del viaje, con la bandera de su país, el
 * nombre del destino y sus días y fechas («4 días · 03 sept – 06 sept»; sin fechas, solo «4 días»). Entre dos destinos,
 * la distancia. Tocar una tarjeta abre la ventana del destino, con sus hoteles y sus actividades.
 */
export function RouteOverview({ route }: RouteOverviewProps) {
  const [detailCity, setDetailCity] = useState<string | null>(null)

  // Rutas guardadas antes de que la ruta llevara el país: el del destino elegido en el formulario.
  const fallbackCountry = useRouteStore((state) => state.destinationPlace?.countryCode ?? null)
  const segments = buildDestinationSegments(route.days).map((segment) => (segment.countryCode ? segment : { ...segment, countryCode: dayCountryCode(fallbackCountry, segment.city) }))
  const detailSegment = detailCity ? segments.find((segment) => segment.city === detailCity) : undefined
  const tripStart = route.answers.dateRange?.start ?? null

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-3.5 pb-36 pt-4">
      {segments.map((segment, index) => {
        const segmentDays = route.days.filter((day) => segment.dayIds.includes(day.id) && !day.isReturnLeg)
        const count = segmentDays.length
        const firstNumber = segmentDays[0]?.dayNumber ?? 1
        const lastNumber = segmentDays[segmentDays.length - 1]?.dayNumber ?? firstNumber
        const dates = tripStart ? `${shortDate(addDaysToIso(tripStart, firstNumber - 1))} – ${shortDate(addDaysToIso(tripStart, lastNumber - 1))}` : null
        return (
          <div key={segment.id}>
            {index > 0 && <DestinationDistanceConnector from={segmentCentroid(segments[index - 1], route.days)} to={segmentCentroid(segment, route.days)} />}
            <button
              type="button"
              onClick={() => setDetailCity(segment.city)}
              className="relative flex h-20 w-full items-center gap-3.5 overflow-hidden rounded-3xl border border-text/10 bg-bg-card pl-4 pr-3 text-left shadow-[0_1px_2px_rgba(28,34,48,.05),0_12px_30px_-20px_rgba(28,34,48,.3)]"
            >
              {/* La bandera: sus colores en franjas inclinadas, en un cuadrado de esquinas redondeadas. */}
              <span
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(28,34,48,.08)]"
                style={{ background: flagStripesGradient(segment.countryCode) }}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="truncate font-display text-[24px] leading-[1.05] text-text">{segment.city}</span>
                <span className="whitespace-nowrap text-[12px] text-text/55">
                  {count} día{count === 1 ? '' : 's'}
                  {dates ? ` · ${dates}` : ''}
                </span>
              </span>
              <span className="flex w-[22px] justify-center text-text/45">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </button>
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
