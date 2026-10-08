import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { detectFlightOpportunities } from '../../lib/flightOpportunity'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { DestinationReservasAccordion } from './reservas/DestinationReservasAccordion'
import { InsuranceRow } from './reservas/InsuranceRow'
import { RentalVehicleRow } from './reservas/RentalVehicleRow'
import { TransportRow } from './reservas/TransportRow'
import { AccommodationRow } from './reservas/AccommodationRow'
import { N26Row } from './reservas/N26Row'
import { EsimRow } from './reservas/EsimRow'
import { EntradasExcursionSections } from './reservas/EntradasExcursionSections'
import { FirstLastDayCard, FlightAdjustSheet, FlightTicket, hhmmToMinutes, ticketDate } from './reservas/FlightTickets'
import { TripReadinessBadge } from './reservas/TripReadinessBadge'
import { EXPLORE_ICONS } from '../../lib/exploreStyle'
import { bookingLabelsOf, centerMinutesOf, leaveMinutesOf, medioOf, tripModes, useArrivalInfo } from '../../lib/arrivalReturn'

interface ReservasPanelProps {
  route: Route
  onClose: () => void
}

const sectionTitleStyle = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const }

/**
 * Pestaña RESERVAS — pantalla completa (mismo patrón ✕ que RUTA/EXPLORAR, ver DestinationDetailModal
 * / AttractionsFinder), sin mapa. Horarios de vuelo con "doble camino" (Optimizar ruta / Añadir yo
 * mismo, ver `manualAddDayId`) SOLO cuando la oportunidad es accionable (ver `actionable` en
 * flightOpportunity.ts — una llegada de madrugada no ofrece nada real que optimizar, solo un aviso
 * neutro sin botones), "Imprescindibles" (solo Seguro de viaje, rojo), lista plana si el
 * viaje es de un único destino o acordeón por destino si son varios (ver DestinationReservasAccordion),
 * y el vehículo de alquiler general (fuera de "Imprescindibles" — no cuenta para su alerta). El % de
 * "viaje listo" se calcula en useTripReadiness.ts y se muestra en la cabecera (TripReadinessBadge).
 */
export function ReservasPanel({ route, onClose }: ReservasPanelProps) {
  const setArrivalFlightTime = useRouteStore((state) => state.setArrivalFlightTime)
  const setDepartureFlightTime = useRouteStore((state) => state.setDepartureFlightTime)
  const setArrivalPointId = useRouteStore((state) => state.setArrivalPointId)
  const setFlightAdjust = useRouteStore((state) => state.setFlightAdjust)
  const fitDayToTrip = useRouteStore((state) => state.fitDayToTrip)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const transportBookings = useRouteStore((state) => state.transportBookings)
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const [, setRecalculatingId] = useState<string | null>(null)
  const [openCity, setOpenCity] = useState<string | null>(null)
  /** La ventana «¿Ajustamos tu ruta a tu vuelo?»: sale al terminar de poner la hora de llegada o de salida (se vuelve a abrir si la cambia otra vez). */
  const [adjustSheetOpen, setAdjustSheetOpen] = useState(false)

  const opportunities = detectFlightOpportunities(route)
  const modes = tripModes(route)
  const bookingLabels = bookingLabelsOf(modes)
  const arrivalInfo = useArrivalInfo(route.destination, route.days[0]?.city ?? route.destination, route.origin)
  const segments = buildDestinationSegments(route.days)
  // El aeropuerto o la estación de cada trayecto (Fiumicino a la ida y Ciampino a la vuelta): lo que se elige aquí manda en las barras y en las ventanas.
  const pointPicks = (['arrival', 'departure'] as const).map((kind) => {
    const medio = medioOf(arrivalInfo, kind === 'arrival' ? modes.arrival : modes.departure)
    const points = medio?.puntos ?? []
    const time = kind === 'arrival' ? route.arrivalFlightTime : route.departureFlightTime
    const chosenId = (kind === 'arrival' ? route.arrivalPointId : route.departurePointId) ?? points[0]?.id
    return { kind, points, time, chosenId, show: Boolean(time) && points.length > 1 && modes[kind] !== 'coche' }
  })
  const arrivalPoint = pointPicks[0].points.find((point) => point.id === pointPicks[0].chosenId) ?? pointPicks[0].points[0] ?? null
  const departurePoint = pointPicks[1].points.find((point) => point.id === pointPicks[1].chosenId) ?? pointPicks[1].points[0] ?? null
  const firstFree = centerMinutesOf(route.arrivalFlightTime, arrivalPoint)
  const lastFree = leaveMinutesOf(route.departureFlightTime, modes.departure, medioOf(arrivalInfo, modes.departure), departurePoint)
  const dateRange = route.answers.dateRange
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'
  const firstSegment = segments[0]
  const lastDay = route.days[route.days.length - 1]

  const day1Id = route.days[0]?.id

  const handleRecalculate = async (dayId: string) => {
    setRecalculatingId(dayId)
    // Recalcula el horario REAL de ESTE día a partir del vuelo introducido (ver stopScheduling.ts,
    // "Optimizar ruta") — día 1 usa la hora de llegada, el último día la de vuelta; el resto del
    // viaje no se toca.
    const kind = dayId === day1Id ? 'arrival' : 'departure'
    const flightTime = kind === 'arrival' ? route.arrivalFlightTime : route.departureFlightTime
    // Las mismas horas que la barra del día: en el centro (llegada) o la de salir (vuelta).
    const medio = medioOf(arrivalInfo, kind === 'arrival' ? modes.arrival : modes.departure)
    const pointId = kind === 'arrival' ? route.arrivalPointId : route.departurePointId
    const point = medio?.puntos.find((candidate) => candidate.id === pointId) ?? medio?.puntos[0] ?? null
    const keyMinutes = kind === 'arrival' ? centerMinutesOf(flightTime, point) : leaveMinutesOf(flightTime, modes.departure, medio, point)
    if (keyMinutes != null) await fitDayToTrip(dayId, kind, keyMinutes)
    setRecalculatingId(null)
  }

  /** «Sí, ajústala por mí»: lo que la app ya hacía con «Optimizar ruta», en cada día con oportunidad (llegada temprano, salida por la tarde), con las horas que ya hay. */
  const adjustForMe = async () => {
    setAdjustSheetOpen(false)
    setFlightAdjust('auto')
    for (const opportunity of opportunities) if (opportunity.actionable) await handleRecalculate(opportunity.dayId)
  }
  const adjustMyself = () => {
    setAdjustSheetOpen(false)
    setFlightAdjust('manual')
  }

  // Banner ámbar de bienvenida — solo mientras falte lo esencial (vuelo de llegada + alojamiento/
  // camper del primer destino); nunca menciona ambas palabras a la vez, solo la que aplica a este viaje.
  const arrivalMissing = firstSegment ? !transportBookings[firstSegment.dayIds[0]] : false
  const accommodationOrCamperMissing = isCamper ? !rentalVehicleBooking : firstSegment ? !accommodationSelections[firstSegment.dayIds[0]] : false
  const showWelcomeBanner = arrivalMissing || accommodationOrCamperMissing

  const flightsSet = (route.arrivalFlightTime ? 1 : 0) + (route.departureFlightTime ? 1 : 0)
  const cityName = firstSegment?.city ?? route.destination
  const destinationBig = (point: typeof arrivalPoint) => point?.codigo ?? cityName
  const destinationSmall = (point: typeof arrivalPoint) => (point?.codigo ? cityName : point?.nombre)
  const originName = route.origin

  const pointPills = (index: 0 | 1, kind: 'arrival' | 'departure') =>
    pointPicks[index].show ? (
      <div className="flex flex-wrap gap-1.5">
        {pointPicks[index].points.map((point) => (
          <button
            key={point.id}
            type="button"
            onClick={() => setArrivalPointId(kind, point.id)}
            className={`rounded-full border px-2.5 py-1 text-caption font-medium transition-colors ${
              point.id === pointPicks[index].chosenId ? 'border-text bg-text text-bg' : 'border-text/20 text-text/70 hover:border-text/40'
            }`}
          >
            {point.nombre}
          </button>
        ))}
      </div>
    ) : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden overflow-x-hidden bg-bg"
      >
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-bg-card text-accent"
            style={{ border: '1.5px solid oklch(0.55 0.15 45)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={EXPLORE_ICONS.close} />
            </svg>
          </button>
          <TripReadinessBadge />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-1">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5">
            {showWelcomeBanner && (
              <div className="flex flex-none items-start gap-3" style={{ borderRadius: 20, padding: '16px 18px', background: 'linear-gradient(120deg,oklch(0.93 0.06 75),oklch(0.9 0.07 55))' }}>
                <span className="mt-0.5 flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[#1C2230]" style={{ color: 'oklch(0.8 0.14 70)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={EXPLORE_ICONS.plane} />
                  </svg>
                </span>
                <p className="m-0" style={{ font: "400 14px/1.5 'Geist'", color: '#3A2A14' }}>
                  Para darte una ruta personalizada adaptada a tu viaje, añade cuanto antes tu vuelo y tu {isCamper ? 'camper/autocaravana' : 'alojamiento'}. Si todavía no los tienes,
                  puedes reservarlos desde aquí. <strong style={{ fontWeight: 600 }}>¡Corre que vuelan!</strong>
                </p>
              </div>
            )}

            <div className="mt-1.5 flex flex-none flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="font-display" style={{ fontSize: 32, lineHeight: 1 }}>{bookingLabels.heading}</span>
                <span style={{ font: "500 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase', color: flightsSet === 2 ? 'oklch(0.5 0.13 150)' : 'rgba(28,34,48,.5)' }}>
                  {flightsSet === 2 ? '2 de 2 ✓' : flightsSet === 1 ? '1 de 2' : 'Sin añadir'}
                </span>
              </div>
              <span className="text-text/65" style={{ font: "400 13.5px/1.45 'Geist'" }}>
                Si ya tienes el billete, indica las horas de llegada y de salida para ajustar el primer y el último día.
              </span>
            </div>

            <FlightTicket
              kind="arrival"
              mode={modes.arrival}
              label={bookingLabels.arrival}
              date={ticketDate(dateRange?.start)}
              fromBig={originName}
              toBig={destinationBig(arrivalPoint)}
              toSmall={destinationSmall(arrivalPoint)}
              value={route.arrivalFlightTime}
              onChange={(value) => {
                setArrivalFlightTime(value || null)
              }}
              onCommit={() => setAdjustSheetOpen(true)}
              extra={pointPills(0, 'arrival')}
            />
            <FlightTicket
              kind="departure"
              mode={modes.departure}
              label={bookingLabels.departure}
              date={ticketDate(dateRange?.end)}
              fromBig={destinationBig(departurePoint)}
              fromSmall={destinationSmall(departurePoint)}
              toBig={originName}
              value={route.departureFlightTime}
              onChange={(value) => {
                setDepartureFlightTime(value || null)
              }}
              onCommit={() => setAdjustSheetOpen(true)}
              extra={pointPills(1, 'departure')}
            />

            <FirstLastDayCard
              adjusted={route.flightAdjust === 'auto' && flightsSet > 0}
              adjustLabel={route.flightAdjust === 'auto' && flightsSet > 0 ? 'Ajustado' : route.flightAdjust === 'manual' && flightsSet > 0 ? 'Lo ajustas tú' : 'Por ajustar'}
              first={{ day: `Día 1${dateRange?.start ? ` · ${ticketDate(dateRange.start).split(' · ')[1]}` : ''}`, flightTime: route.arrivalFlightTime ?? null, startMinutes: hhmmToMinutes(route.arrivalFlightTime) == null ? null : firstFree }}
              last={{ day: `Día ${lastDay?.dayNumber ?? ''}${dateRange?.end ? ` · ${ticketDate(dateRange.end).split(' · ')[1]}` : ''}`, flightTime: route.departureFlightTime ?? null, endMinutes: hhmmToMinutes(route.departureFlightTime) == null ? null : lastFree }}
            />

            {opportunities
              .filter((opportunity) => !opportunity.actionable)
              .map((opportunity) => (
                <div key={opportunity.dayId} className="flex items-start gap-3 rounded-[20px] border border-border bg-bg-hover p-3.5">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-body">
                    🌙
                  </span>
                  <p className="min-w-0 flex-1 text-small text-text">{opportunity.reason}</p>
                </div>
              ))}

            <span className="mt-2 flex-none text-text/55" style={sectionTitleStyle}>
              Imprescindibles
            </span>
            <div className="space-y-2.5">
              <InsuranceRow />
            </div>

            {hasRentalVehicle && (
              <div className="space-y-2.5">
                <RentalVehicleRow />
              </div>
            )}

            {segments.length <= 1 && firstSegment ? (
              <>
                <span className="mt-2 flex-none text-text/55" style={sectionTitleStyle}>
                  Para tu viaje a {firstSegment.city}
                </span>
                <div className="space-y-2.5">
                  <TransportRow dayId={firstSegment.dayIds[0]} label={`${route.origin} → ${firstSegment.city}`} />
                  <TransportRow dayId={lastDay.id} label={`${firstSegment.city} → ${route.origin}`} />
                  {!isCamper && firstSegment.nights > 0 && (
                    <AccommodationRow segmentDayId={firstSegment.dayIds[0]} city={firstSegment.city} totalNights={firstSegment.nights} />
                  )}
                  <N26Row />
                  {firstSegment.countryCode && <EsimRow countryCode={firstSegment.countryCode} />}
                </div>
              </>
            ) : (
              <>
                <span className="mt-2 flex-none text-text/55" style={sectionTitleStyle}>
                  Destinos
                </span>
                <div className="space-y-2.5">
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
              </>
            )}

            {/* «ENTRADAS» y «EXCURSIÓN»: se calculan desde la ruta (PARA_CODE_RESERVAS, 1 y 2). */}
            <EntradasExcursionSections route={route} />
          </div>
        </div>

        {adjustSheetOpen && <FlightAdjustSheet onAuto={adjustForMe} onManual={adjustMyself} onClose={() => setAdjustSheetOpen(false)} />}

      </motion.div>
    </AnimatePresence>
  )
}
