import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route } from '../../lib/types'
import { useRouteStore } from '../../store/useRouteStore'
import { useReservasFocusStore, type BloqueReservasId } from '../../store/useReservasFocusStore'
import { useDatesCalendarStore } from '../../store/useDatesCalendarStore'
import { detectFlightOpportunities } from '../../lib/flightOpportunity'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { buildEntradasBloque, hasEnoughDaysForExcursions } from '../../lib/bookings'
import { useDestinationExcursions } from '../../lib/destinationExcursions'
import { centerMinutesOf, leaveMinutesOf, medioOf, tripModes, useArrivalInfo } from '../../lib/arrivalReturn'
import { legsOf, type LegKind } from '../../lib/reservasLegs'
import { pagoActivo } from '../../lib/pago'
import { EXPLORE_ICONS } from '../../lib/exploreStyle'
import { DestinationReservasAccordion } from './reservas/DestinationReservasAccordion'
import { FlightAdjustSheet } from './reservas/FlightAdjustSheet'
import { TripReadinessBadge } from './reservas/TripReadinessBadge'
import { ResumenViaje } from './reservas/ResumenViaje'
import { LlegadaYVuelta } from './reservas/LlegadaYVuelta'
import { AlojamientoReservas, alojamientoHecho } from './reservas/AlojamientoReservas'
import { EntradasYFreeTour } from './reservas/EntradasYFreeTour'
import { ExcursionesReservas } from './reservas/ExcursionesReservas'
import { UtilParaElViaje } from './reservas/UtilParaElViaje'

interface ReservasPanelProps {
  route: Route
  onClose: () => void
}

const MES = new Intl.DateTimeFormat('es-ES', { month: 'short' })

/** «10 – 14 ago 2027», «30 sep – 3 oct 2027» o, sin fechas, «5 días». */
function rangoDelViaje(route: Route): string {
  const range = route.answers.dateRange
  if (!range?.start || !range?.end) return `${route.days.filter((day) => !day.isReturnLeg).length} días`
  const start = new Date(`${range.start}T12:00:00`)
  const end = new Date(`${range.end}T12:00:00`)
  const mes = (date: Date) => MES.format(date).replace('.', '')
  return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    ? `${start.getDate()} – ${end.getDate()} ${mes(end)} ${end.getFullYear()}`
    : `${start.getDate()} ${mes(start)} – ${end.getDate()} ${mes(end)} ${end.getFullYear()}`
}

/**
 * Pestaña RESERVAS (Tanda 6s, diseño «Reservas v4») — pantalla completa (mismo ✕ que RUTA/EXPLORAR), sin mapa. De arriba abajo: el resumen (solo de pago), Llegada y vuelta (solo de pago), Alojamiento,
 * Entradas y Free Tour, Excursiones y Útil para el viaje. Todo lo de pago va detrás del mismo interruptor (`pagoActivo`, src/lib/pago.ts). En el ordenador, en dos columnas. Los viajes de varios
 * destinos conservan además el acordeón de cada destino. El % de «viaje listo» se calcula en useTripReadiness.ts y sale en la cabecera (TripReadinessBadge).
 */
export function ReservasPanel({ route, onClose }: ReservasPanelProps) {
  const pago = pagoActivo()
  const setMode = useRouteStore((state) => state.setMode)
  const setActiveDayId = useRouteStore((state) => state.setActiveDayId)
  const setFlightAdjust = useRouteStore((state) => state.setFlightAdjust)
  const fitDayToTrip = useRouteStore((state) => state.fitDayToTrip)
  const reservations = useRouteStore((state) => state.reservations)
  const accommodationZone = useRouteStore((state) => state.route?.accommodationZone ?? null)
  const pedido = useReservasFocusStore((state) => state.pedido)
  const limpiarPedido = useReservasFocusStore((state) => state.limpiar)
  const pedir = useReservasFocusStore((state) => state.pedir)
  const [openCity, setOpenCity] = useState<string | null>(null)
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({})
  /** La mitad de «Llegada y vuelta» abierta: undefined = la que falta; null = ninguna. */
  const [mitad, setMitad] = useState<LegKind | null | undefined>(undefined)
  /** La ventana «¿Ajustamos tu ruta a tu vuelo?»: sale al terminar de poner la hora de llegada o de salida. */
  const [adjustSheetOpen, setAdjustSheetOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const info = useDestinationExcursions(route.destination)
  // Las excursiones solo salen en los viajes de los días que marca el destino (`excursiones_desde_dias`): si no, ni el hueco.
  const hayExcursiones = info.excursions.length > 0 && hasEnoughDaysForExcursions(route, info.fromDays)
  const arrivalInfo = useArrivalInfo(route.destination, route.days[0]?.city ?? route.destination, route.origin)
  const modes = tripModes(route)
  const opportunities = detectFlightOpportunities(route)
  const segments = buildDestinationSegments(route.days)
  const unDestino = segments.length <= 1
  const ciudad = route.days[0]?.city ?? route.destination
  const day1Id = route.days[0]?.id

  const abrir = (bloque: string, valor = true) => setAbiertos((previous) => ({ ...previous, [bloque]: valor }))
  const alternar = (bloque: string) => setAbiertos((previous) => ({ ...previous, [bloque]: !previous[bloque] }))

  // Las fichas del resumen, el «+ AÑADIR VUELO» de DÍAS y el «Editar» de la ventana de llegada piden un bloque: se abre y se baja hasta él.
  useEffect(() => {
    if (!pedido) return
    const bloque: BloqueReservasId = pedido.bloque
    abrir(bloque)
    if (bloque === 'llegada') setMitad(pedido.mitad ?? undefined)
    limpiarPedido()
    window.setTimeout(() => {
      const destino = scrollRef.current?.querySelector(`[data-blk="${bloque}"]`) as HTMLElement | null
      destino?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 80)
  }, [pedido, limpiarPedido])

  /** «¿Llegas o te vas otro día? Cambia las fechas del viaje»: el cambio de fechas que ya existe (el calendario de la cabecera del mapa, en Días). */
  const abrirFechas = () => {
    setActiveDayId(null)
    setMode('days')
    useDatesCalendarStore.getState().request()
  }

  const handleRecalculate = async (dayId: string) => {
    // Recalcula el horario REAL de ESTE día a partir del vuelo introducido (ver stopScheduling.ts, "Optimizar ruta") — día 1 usa la hora de llegada, el último día la de vuelta.
    const kind = dayId === day1Id ? 'arrival' : 'departure'
    const flightTime = kind === 'arrival' ? route.arrivalFlightTime : route.departureFlightTime
    const medio = medioOf(arrivalInfo, kind === 'arrival' ? modes.arrival : modes.departure)
    const pointId = kind === 'arrival' ? route.arrivalPointId : route.departurePointId
    const point = medio?.puntos.find((candidate) => candidate.id === pointId) ?? medio?.puntos[0] ?? null
    const keyMinutes = kind === 'arrival' ? centerMinutesOf(flightTime, point) : leaveMinutesOf(flightTime, modes.departure, medio, point)
    if (keyMinutes != null) await fitDayToTrip(dayId, kind, keyMinutes)
  }
  /** «Sí, ajústala por mí»: lo que la app ya hacía con «Optimizar ruta», en cada día con oportunidad, con las horas que ya hay. */
  const adjustForMe = async () => {
    setAdjustSheetOpen(false)
    setFlightAdjust('auto')
    for (const opportunity of opportunities) if (opportunity.actionable) await handleRecalculate(opportunity.dayId)
  }
  const adjustMyself = () => {
    setAdjustSheetOpen(false)
    setFlightAdjust('manual')
  }

  // El resumen de arriba (de pago): tres fichas.
  const { enRuta: entradas } = buildEntradasBloque(route, info.entradasOrden, info.entradas, reservations)
  const legs = legsOf(route, arrivalInfo)
  const fichas = [
    { bloque: 'llegada' as const, nombre: 'Llegada y vuelta', hecho: legs.arrival.done && legs.departure.done },
    { bloque: 'aloj' as const, nombre: 'Alojamiento', hecho: alojamientoHecho(accommodationZone) },
    ...(entradas.length > 0 ? [{ bloque: 'entradas' as const, nombre: `Entradas ${entradas.filter((item) => item.reservation).length}/${entradas.length}`, hecho: entradas.every((item) => item.reservation) }] : []),
  ]

  const llegada = pago && unDestino && (
    <>
      <LlegadaYVuelta
        route={route}
        info={arrivalInfo}
        abierto={Boolean(abiertos.llegada)}
        onToggle={() => alternar('llegada')}
        onAbrir={() => abrir('llegada')}
        mitadAbierta={mitad}
        onMitad={setMitad}
        onGuardada={() => setAdjustSheetOpen(true)}
        onFechas={abrirFechas}
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
    </>
  )

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden overflow-x-hidden bg-bg">
        <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-4 md:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-bg-card text-accent"
            style={{ border: '1.5px solid oklch(0.55 0.15 45)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={EXPLORE_ICONS.close} />
            </svg>
          </button>
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="font-display" style={{ fontSize: 30, lineHeight: 1 }}>
              Reservas
            </span>
            <span className="text-text/55" style={{ font: "500 11px/1.35 'Geist Mono',monospace", letterSpacing: '.04em' }}>
              {route.origin} → {route.destination} · {rangoDelViaje(route)}
            </span>
          </span>
          <TripReadinessBadge />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-2 md:px-8">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 md:max-w-[1120px]">
            {pago && unDestino && <ResumenViaje ciudad={ciudad} fichas={fichas} onFicha={(bloque) => pedir(bloque)} />}

            <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="flex min-w-0 flex-col gap-3.5">
                {llegada}
                {unDestino ? (
                  <AlojamientoReservas route={route} info={info} pago={pago} />
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                      Destinos
                    </span>
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
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-3.5">
                <EntradasYFreeTour route={route} info={info} abierto={Boolean(abiertos.entradas)} onToggle={() => alternar('entradas')} />
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {hayExcursiones && (
                <div className="flex min-w-0 flex-col gap-2.5" data-blk="excursiones">
                  <ExcursionesReservas route={route} info={info} />
                </div>
              )}
              <div className={hayExcursiones ? 'contents' : 'md:col-span-2'}>
                <UtilParaElViaje route={route} pago={pago} />
              </div>
            </div>
          </div>
        </div>

        {adjustSheetOpen && <FlightAdjustSheet onAuto={adjustForMe} onManual={adjustMyself} onClose={() => setAdjustSheetOpen(false)} />}
      </motion.div>
    </AnimatePresence>
  )
}
