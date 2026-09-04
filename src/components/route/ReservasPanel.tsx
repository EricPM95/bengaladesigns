import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route, Stop } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { detectFlightOpportunities } from '../../lib/flightOpportunity'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { Button } from '../ui/Button'
import { AttractionsFinder } from './attractionsFinder/AttractionsFinder'
import { DestinationReservasAccordion } from './reservas/DestinationReservasAccordion'
import { InsuranceRow } from './reservas/InsuranceRow'
import { RentalVehicleRow } from './reservas/RentalVehicleRow'
import { TransportRow } from './reservas/TransportRow'
import { AccommodationRow } from './reservas/AccommodationRow'
import { N26Row } from './reservas/N26Row'
import { EsimRow } from './reservas/EsimRow'

interface ReservasPanelProps {
  route: Route
  onClose: () => void
}

type LuggageChoice = 'hotel-first' | 'visit-first'

const timeInputClasses = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-body text-text focus:border-accent focus:outline-none'

/**
 * Pestaña RESERVAS — pantalla completa (mismo patrón ✕ que RUTA/EXPLORAR, ver DestinationDetailModal
 * / AttractionsFinder), sin mapa. Horarios de vuelo con "doble camino" (Recalcular con IA / Añadir yo
 * mismo, ver `manualAddDayId`), "Imprescindibles" (solo Seguro de viaje, rojo), lista plana si el
 * viaje es de un único destino o acordeón por destino si son varios (ver DestinationReservasAccordion),
 * y el vehículo de alquiler general (fuera de "Imprescindibles" — no cuenta para su alerta). El % de
 * "viaje listo" se calcula en useTripReadiness.ts y se muestra en la cabecera (TripReadinessBadge).
 */
export function ReservasPanel({ route, onClose }: ReservasPanelProps) {
  const setArrivalFlightTime = useRouteStore((state) => state.setArrivalFlightTime)
  const setDepartureFlightTime = useRouteStore((state) => state.setDepartureFlightTime)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const transportBookings = useRouteStore((state) => state.transportBookings)
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
  const [simulatedIds, setSimulatedIds] = useState<Set<string>>(new Set())
  const [luggageChoices, setLuggageChoices] = useState<Record<string, LuggageChoice>>({})
  const [openCity, setOpenCity] = useState<string | null>(null)
  const [manualAddDayId, setManualAddDayId] = useState<string | null>(null)

  const opportunities = detectFlightOpportunities(route)
  const segments = buildDestinationSegments(route.days)
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'
  const firstSegment = segments[0]
  const lastDay = route.days[route.days.length - 1]

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

  const manualAddDay = manualAddDayId ? route.days.find((day) => day.id === manualAddDayId) : null

  const handleManualPick = (stop: Stop) => {
    if (!manualAddDay) return
    if (manualAddDay.stops.length === 0) seedDayStops(manualAddDay.id, manualAddDay.stops)
    insertStopAt(manualAddDay.id, manualAddDay.stops.length, stop)
    setManualAddDayId(null)
    setSimulatedIds((prev) => new Set(prev).add(manualAddDay.id))
  }

  // Banner ámbar de bienvenida — solo mientras falte lo esencial (vuelo de llegada + alojamiento/
  // camper del primer destino); nunca menciona ambas palabras a la vez, solo la que aplica a este viaje.
  const arrivalMissing = firstSegment ? !transportBookings[firstSegment.dayIds[0]] : false
  const accommodationOrCamperMissing = isCamper ? !rentalVehicleBooking : firstSegment ? !accommodationSelections[firstSegment.dayIds[0]] : false
  const showWelcomeBanner = arrivalMissing || accommodationOrCamperMissing

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden overflow-x-hidden bg-bg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
          className="fixed left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-md transition-colors hover:bg-bg-hover"
        >
          ✕
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-20">
          <div className="mx-auto w-full max-w-lg space-y-5">
            {showWelcomeBanner && (
              <div className="rounded-xl border border-accent-gold/40 bg-accent-gold/10 p-3 text-small text-text">
                Para darte una ruta personalizada adaptada a tu viaje, añade cuanto antes tu vuelo y tu{' '}
                {isCamper ? 'camper/autocaravana' : 'alojamiento'} — si aún no lo tienes, puedes reservarlo desde aquí. ¡Corre que vuelan!
              </div>
            )}

            <div>
              <h2 className="font-display text-h2 font-semibold text-text">Vuelos</h2>
              <p className="mt-1 text-small text-text-soft">
                Si ya tienes el billete, indica aquí las horas para ajustar los traslados de la ruta. Para buscar y reservar el vuelo en sí,
                hazlo desde «Transporte» dentro de cada destino, más abajo.
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
                            : ` El Día ${opportunity.dayNumber} se actualizó con lo que hayas añadido.`}
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
                      <div className="flex gap-2">
                        <Button onClick={() => handleRecalculate(opportunity.dayId)} className="flex-1 text-caption font-bold shadow-sm">
                          ✨ Recalcular con IA
                        </Button>
                        <Button onClick={() => setManualAddDayId(opportunity.dayId)} variant="secondary" className="flex-1 text-caption font-bold">
                          Añadir yo mismo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="space-y-2">
              <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Imprescindibles</h3>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
                <InsuranceRow />
              </div>
            </div>

            {hasRentalVehicle && (
              <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
                <RentalVehicleRow />
              </div>
            )}

            {segments.length <= 1 && firstSegment ? (
              <div className="space-y-2">
                <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Para tu viaje a {firstSegment.city}</h3>
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
                  <TransportRow dayId={firstSegment.dayIds[0]} label={`${route.origin} → ${firstSegment.city}`} />
                  <TransportRow dayId={lastDay.id} label={`${firstSegment.city} → ${route.origin}`} />
                  {!isCamper && firstSegment.nights > 0 && (
                    <AccommodationRow segmentDayId={firstSegment.dayIds[0]} city={firstSegment.city} totalNights={firstSegment.nights} />
                  )}
                  <N26Row />
                  {firstSegment.countryCode && <EsimRow countryCode={firstSegment.countryCode} />}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">Destinos</h3>
                <div className="space-y-2">
                  {segments.map((segment, index) => (
                    <DestinationReservasAccordion
                      key={segment.id}
                      route={route}
                      segment={segment}
                      isFirstSegment={index === 0}
                      isLastSegment={index === segments.length - 1}
                      expanded={openCity === segment.id}
                      onToggle={() => setOpenCity((current) => (current === segment.id ? null : segment.id))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {manualAddDay && (
          <AttractionsFinder route={route} city={manualAddDay.city} open title={`Añadir en el Día ${manualAddDay.dayNumber}`} onPick={handleManualPick} onClose={() => setManualAddDayId(null)} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
