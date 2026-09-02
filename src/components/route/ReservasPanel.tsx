import { useState } from 'react'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { detectFlightOpportunities } from '../../lib/flightOpportunity'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { Button } from '../ui/Button'
import { DestinationReservasAccordion } from './reservas/DestinationReservasAccordion'
import { GeneralReservasSection } from './reservas/GeneralReservasSection'

interface ReservasPanelProps {
  route: Route
}

type LuggageChoice = 'hotel-first' | 'visit-first'

const timeInputClasses = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none'

/**
 * Pestaña RESERVAS — horarios de vuelo, un acordeón por destino (transporte de llegada, vuelta
 * solo en el último, alojamiento salvo camper, eSIM del país) y el bloque "General del viaje"
 * (Seguro/N26/Vehículo). El % de "viaje listo" se calcula en useTripReadiness.ts y se muestra en
 * la cabecera (TripReadinessBadge) — ver [[project_route_planner_day_detail]].
 */
export function ReservasPanel({ route }: ReservasPanelProps) {
  const setArrivalFlightTime = useRouteStore((state) => state.setArrivalFlightTime)
  const setDepartureFlightTime = useRouteStore((state) => state.setDepartureFlightTime)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
  const [simulatedIds, setSimulatedIds] = useState<Set<string>>(new Set())
  const [luggageChoices, setLuggageChoices] = useState<Record<string, LuggageChoice>>({})
  const [openCity, setOpenCity] = useState<string | null>(null)

  const opportunities = detectFlightOpportunities(route)
  const segments = buildDestinationSegments(route.days)

  /** La pregunta de maletas solo aplica a la oportunidad del día 1 (llegada), y solo si su alojamiento ya está reservado — ver flightOpportunity.ts, que ya dispara día 1 y último día de forma independiente entre sí. */
  const day1Id = route.days[0]?.id
  const day1HotelKnown = Boolean(segments[0] && accommodationSelections[segments[0].dayIds[0]])

  const handleRecalculate = (dayId: string, luggageChoice?: LuggageChoice) => {
    if (luggageChoice) setLuggageChoices((prev) => ({ ...prev, [dayId]: luggageChoice }))
    setRecalculatingId(dayId)
    setTimeout(() => {
      setRecalculatingId(null)
      setSimulatedIds((prev) => new Set(prev).add(dayId))
    }, 900)
  }

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4">
      <div>
        <h2 className="font-display text-h2 font-semibold text-text">Vuelos</h2>
        <p className="mt-1 text-small text-text-soft">
          Añade tus horarios de vuelo para afinar los traslados de llegada/vuelta y detectar si merece la pena ajustar la ruta.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-small font-medium text-text">Vuelo de llegada</span>
          <input
            type="time"
            value={route.arrivalFlightTime ?? ''}
            onChange={(event) => setArrivalFlightTime(event.target.value || null)}
            className={timeInputClasses}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-small font-medium text-text">Vuelo de salida</span>
          <input
            type="time"
            value={route.departureFlightTime ?? ''}
            onChange={(event) => setDepartureFlightTime(event.target.value || null)}
            className={timeInputClasses}
          />
        </label>
      </div>

      {opportunities.map((opportunity) => {
        const isRecalculating = recalculatingId === opportunity.dayId
        const isDone = simulatedIds.has(opportunity.dayId)
        const chosenLuggage = luggageChoices[opportunity.dayId]
        const needsLuggageQuestion = opportunity.dayId === day1Id && day1HotelKnown && !chosenLuggage && !isDone && !isRecalculating

        return (
          <div key={opportunity.dayId} className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft/40 p-3">
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-body">
              ✨
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-small text-text">{opportunity.reason}</p>

              {isDone ? (
                <p className="text-caption font-medium text-accent-hover">
                  ✓ (Simulado){' '}
                  {chosenLuggage === 'hotel-first'
                    ? ` La ruta del Día ${opportunity.dayNumber} pasaría primero por el hotel a dejar las maletas.`
                    : chosenLuggage === 'visit-first'
                      ? ` La ruta del Día ${opportunity.dayNumber} empezaría a visitar directamente, dejando el hotel para más tarde.`
                      : ` Aquí se recalcularía el Día ${opportunity.dayNumber}.`}
                </p>
              ) : isRecalculating ? (
                <p className="text-caption font-medium text-text-soft">Recalculando…</p>
              ) : needsLuggageQuestion ? (
                <div className="space-y-2">
                  <p className="text-small font-medium text-text">
                    ¿Prefieres pasar primero por el hotel a dejar las maletas, o empezar a visitar directamente desde el centro?
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleRecalculate(opportunity.dayId, 'hotel-first')} className="flex-1 text-caption font-bold shadow-sm">
                      Pasar por el hotel primero
                    </Button>
                    <Button
                      onClick={() => handleRecalculate(opportunity.dayId, 'visit-first')}
                      variant="secondary"
                      className="flex-1 text-caption font-bold"
                    >
                      Empezar a visitar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => handleRecalculate(opportunity.dayId)} className="font-bold shadow-sm">
                  Recalcular ruta con estos horarios
                </Button>
              )}
            </div>
          </div>
        )
      })}

      <GeneralReservasSection route={route} />

      <div className="space-y-2">
        <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Destinos</h3>
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <DestinationReservasAccordion
              key={segment.id}
              route={route}
              segment={segment}
              isLastSegment={index === segments.length - 1}
              expanded={openCity === segment.id}
              onToggle={() => setOpenCity((current) => (current === segment.id ? null : segment.id))}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
