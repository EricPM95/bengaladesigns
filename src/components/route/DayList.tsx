import { useState } from 'react'
import type { Route, Stop, TripPace } from '../../lib/types'
import { addDaysToIso, formatShortDateEs } from '../../lib/dateRange'
import { computeDayTravelInfo } from '../../lib/dayTravelInfo'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { seedStopsFromTemplate } from '../../lib/mockDayDetail'
import { orderStopsGeographically } from '../../lib/geographicStopOrder'
import { useRouteStore } from '../../store/useRouteStore'
import { AttractionsFinder } from './attractionsFinder/AttractionsFinder'
import { DayDetailPanel } from './dayDetail/DayDetailPanel'
import { DayMenu } from './dayDetail/DayMenu'

/** Techo "cómodo" de paradas/día según el ritmo elegido en el cuestionario (mismos rangos que paceOptions en Questionnaire.tsx: zen 2-3, balanced 4-5, nonstop 6+) — a partir de aquí, "Regenerar este día" avisa (sin bloquear) que el día queda apretado. */
const PACE_COMFORTABLE_MAX: Record<TripPace, number> = { zen: 3, balanced: 5, nonstop: 8 }

interface DayListProps {
  route: Route
  activeDayId: string | null
  onSelectDay: (dayId: string | null) => void
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/**
 * Lista de todos los días del viaje en orden, cada uno como una caja individual sobre fondo gris —
 * fecha + destino, o las dos ciudades en rojo unidas por línea punteada en días de traslado (ver
 * computeDayTravelInfo). Cada caja es un acordeón: el día "expandido" es simplemente `activeDayId`
 * (mismo estado que el DaySelector de arriba) — así la sincronización entre ambos es automática y
 * solo puede haber un día abierto a la vez, sin estado propio en este componente. Click en el día ya
 * expandido lo contrae (pasa `null`). El contenido detallado de cada día (transporte, hotel,
 * paradas) se implementará en una fase posterior — por ahora el panel expandido queda vacío.
 */
export function DayList({ route, activeDayId, onSelectDay }: DayListProps) {
  const regenerateDayStops = useRouteStore((state) => state.regenerateDayStops)
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const [regenerateDayId, setRegenerateDayId] = useState<string | null>(null)

  const tripStartIso = route.answers.dateRange?.start
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'
  const segments = buildDestinationSegments(route.days)
  const stayByFirstDayId = new Map(segments.map((segment) => [segment.dayIds[0], segment]))
  /** Segmento (con su alojamiento) al que pertenece CADA día del tramo, no solo su primer día — para saber qué alojamiento cubre la noche de un día cualquiera (ver DayDetailPanel.tsx, punto 4). */
  const segmentByDayId = new Map(segments.flatMap((segment) => segment.dayIds.map((dayId) => [dayId, segment])))
  const allDays = route.days.filter((candidate) => !candidate.isReturnLeg).map((candidate) => ({ id: candidate.id, dayNumber: candidate.dayNumber, city: candidate.city }))

  const regenerateDay = route.days.find((day) => day.id === regenerateDayId) ?? null
  const regenerateDayRealStops: Stop[] = regenerateDay ? (regenerateDay.stops.length > 0 ? regenerateDay.stops : seedStopsFromTemplate(regenerateDay)) : []

  const handleConfirmRegenerate = (stops: Stop[]) => {
    if (!regenerateDay) return
    // Primer edición de este día en concreto: "cristaliza" el pool de plantilla en Stop[] reales
    // antes de sustituirlo — no-op si el día ya tenía paradas reales (mismo patrón que StopMenu.tsx).
    seedDayStops(regenerateDay.id, regenerateDayRealStops)
    regenerateDayStops(regenerateDay.id, orderStopsGeographically(stops))
    setRegenerateDayId(null)
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto bg-bg-hover p-3">
      {route.days.map((day, index) => {
        const travel = computeDayTravelInfo(route, index)
        const dateIso = tripStartIso ? addDaysToIso(tripStartIso, day.dayNumber - 1) : null
        const expanded = activeDayId === day.id

        return (
          <div key={day.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(expanded ? null : day.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectDay(expanded ? null : day.id)
                }
              }}
              className={`flex w-full cursor-pointer items-center gap-3 bg-bg-card px-4 py-4 text-left transition-colors hover:bg-bg-card/80 ${
                expanded ? 'rounded-t-xl' : 'rounded-xl'
              }`}
            >
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                {index > 0 && <span className="absolute bottom-full left-1/2 h-4 w-px -translate-x-1/2 bg-border" />}
                <span className="z-10 flex h-7 w-7 items-center justify-center rounded-md border border-text-muted/30 bg-bg-hover text-small font-semibold text-text">
                  {day.dayNumber}
                </span>
                {index < route.days.length - 1 && <span className="absolute top-full left-1/2 h-4 w-px -translate-x-1/2 bg-border" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-text">{dateIso ? formatShortDateEs(dateIso) : `Día ${day.dayNumber}`}</p>
                {travel && <p className="text-caption font-medium text-accent-red">Día de viaje</p>}
              </div>

              {travel ? (
                <div className="flex shrink-0 items-center gap-1.5 text-caption font-medium text-text">
                  <span>{travel.fromCity}</span>
                  <span className="h-px w-3 shrink-0 border-t border-dashed border-text-muted" />
                  <span>{travel.toCity}</span>
                </div>
              ) : (
                <span className="shrink-0 text-caption font-medium text-text">{day.city}</span>
              )}

              {!day.isReturnLeg && (
                <span onClick={(event) => event.stopPropagation()}>
                  <DayMenu onRegenerate={() => setRegenerateDayId(day.id)} />
                </span>
              )}

              <ChevronIcon expanded={expanded} />
            </div>

            {expanded && (
              <div className="rounded-b-xl bg-bg-card">
                <DayDetailPanel
                  day={day}
                  travel={travel}
                  isLastDay={index === route.days.length - 1}
                  origin={route.origin}
                  stay={
                    !isCamper && stayByFirstDayId.has(day.id) && stayByFirstDayId.get(day.id)!.nights > 0
                      ? { segmentDayId: day.id, totalNights: stayByFirstDayId.get(day.id)!.nights }
                      : null
                  }
                  nightSegmentDayId={!isCamper ? (segmentByDayId.get(day.id)?.dayIds[0] ?? null) : null}
                  previousNightSegmentDayId={!isCamper ? (segmentByDayId.get(route.days[index - 1]?.id ?? '')?.dayIds[0] ?? null) : null}
                  isRoadtripHop={segmentByDayId.get(day.id)?.nights === 1}
                  allDays={allDays}
                  isFirstDayOfTrip={index === 0}
                  showCamperBlock={isCamper && hasRentalVehicle}
                  showRentalCarBlock={!isCamper && hasRentalVehicle}
                />
              </div>
            )}
          </div>
        )
      })}

      {regenerateDay && (
        <AttractionsFinder
          route={route}
          city={regenerateDay.city}
          open
          title={`Regenerar el Día ${regenerateDay.dayNumber} · ${regenerateDay.city}`}
          onClose={() => setRegenerateDayId(null)}
          multiSelect={{
            initialSelected: regenerateDayRealStops,
            onConfirm: handleConfirmRegenerate,
            confirmLabel: 'Regenerar día con esta selección',
            tightWarningThreshold: PACE_COMFORTABLE_MAX[route.answers.pace ?? 'balanced'],
          }}
        />
      )}
    </div>
  )
}
