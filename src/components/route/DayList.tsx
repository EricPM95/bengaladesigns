import { useState } from 'react'
import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { DayPlan, Route, Stop, TripPace } from '../../lib/types'
import { addDaysToIso, formatShortDateEs } from '../../lib/dateRange'
import { closedWeekdaysFromSchedule, weekdayNameEs } from '../../lib/stopHoursTag'
import { SortableDay } from './SortableDay'
import { computeDayTravelInfo } from '../../lib/dayTravelInfo'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { seedStopsFromTemplate } from '../../lib/mockDayDetail'
import { orderStopsGeographically } from '../../lib/geographicStopOrder'
import { useRouteStore } from '../../store/useRouteStore'
import { AttractionsFinder } from './attractionsFinder/AttractionsFinder'
import { DayDetailPanel } from './dayDetail/DayDetailPanel'
import { DayMenu } from './dayDetail/DayMenu'
import { MissingAccommodationBanner } from './MissingAccommodationBanner'
import { ContextBanner } from './ContextBanner'

/** Techo "cómodo" de paradas/día según el ritmo elegido en el cuestionario (mismos rangos que paceOptions en Questionnaire.tsx: zen 2-3, balanced 4-5, nonstop 6+) — a partir de aquí, "Regenerar este día" avisa (sin bloquear) que el día queda apretado. */
const PACE_COMFORTABLE_MAX: Record<TripPace, number> = { zen: 3, balanced: 5, nonstop: 8 }

interface DayListProps {
  route: Route
  activeDayId: string | null
  onSelectDay: (dayId: string | null) => void
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-text-muted"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

/**
 * Lista de todos los días del viaje en orden (única navegación entre días de DIAS — ya no hay tira
 * horizontal de chips aparte), cada uno como una caja individual sobre fondo gris — fecha + destino,
 * o las dos ciudades en rojo unidas por línea punteada en días de traslado (ver
 * computeDayTravelInfo). Cada caja es solo un punto de navegación: tocarla abre la pantalla completa
 * de ese día (DayDetailPanel, con su propio botón "Volver"), ya no expande contenido inline — así
 * que `activeDayId` aquí solo decide QUÉ pantalla de día está abierta, no si lo está (no hay toggle
 * de cerrar tocando la misma fila). El banner "¿Necesitas alojamiento?" vive DENTRO de este mismo
 * contenedor con scroll (antes vivía fuera, en RouteView.tsx, por lo que quedaba fijo en pantalla
 * mientras el resto del contenido se desplazaba) — así se desplaza junto con el resto.
 */
export function DayList({ route, activeDayId, onSelectDay }: DayListProps) {
  const regenerateDayStops = useRouteStore((state) => state.regenerateDayStops)
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const reorderDays = useRouteStore((state) => state.reorderDays)
  const [regenerateDayId, setRegenerateDayId] = useState<string | null>(null)
  const [dayReorderWarning, setDayReorderWarning] = useState<string | null>(null)

  // Mismos umbrales que al reordenar paradas (ver DayDetailPanel.tsx): 8 px de margen para que un
  // toque torpe no cuente como arrastre, y retardo en táctil para no secuestrar el scroll.
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  )

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

  /**
   * Un día se puede mover si no es de llegada, traslado ni vuelta. Esos tres son el esqueleto del
   * viaje: llevan el transporte y abren el tramo con su alojamiento, así que moverlos no reordena
   * el viaje, lo rompe. Lo que el viajero quiere mover son los días de ciudad, y esos sí se mueven.
   */
  const isMovableDay = (day: DayPlan, index: number) =>
    !day.isReturnLeg && !computeDayTravelInfo(route, index) && !stayByFirstDayId.has(day.id)

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = route.days.map((day) => day.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    // Soltar encima de un día que no se mueve (o de otra ciudad) no hace nada: cambiar un día de
    // Roma por uno de Florencia no es reordenar, es rehacer el viaje entero.
    if (!isMovableDay(route.days[to], to) || route.days[to].city !== route.days[from].city) return

    const next = [...ids]
    next.splice(to, 0, next.splice(from, 1)[0])
    setDayReorderWarning(closureWarningFor(next))
    reorderDays(next)
  }

  /**
   * Qué se queda cerrado por haber movido el día. Solo con fechas reales: sin ellas no hay día de
   * la semana del que hablar, y el aviso sería inventado.
   *
   * Mira TODOS los días que cambian de fecha, no solo el arrastrado — mover el día 5 al 2 empuja a
   * los de en medio, y el museo que se queda en lunes puede ser el de cualquiera de ellos.
   */
  const closureWarningFor = (orderedIds: string[]): string | null => {
    if (!tripStartIso) return null
    const daysById = new Map(route.days.map((day) => [day.id, day]))
    const choques: { dayNumber: number; weekday: number; stopName: string }[] = []
    orderedIds.forEach((id, index) => {
      const day = daysById.get(id)
      if (!day || day.dayNumber === index + 1) return
      const weekday = new Date(`${addDaysToIso(tripStartIso, index)}T00:00:00`).getDay()
      const stops = day.stops.length > 0 ? day.stops : seedStopsFromTemplate(day)
      for (const stop of stops) {
        if (closedWeekdaysFromSchedule(stop.scheduleText ?? stop.hours).includes(weekday)) {
          choques.push({ dayNumber: index + 1, weekday, stopName: stop.name })
        }
      }
    })
    if (choques.length === 0) return null
    const [primero, ...resto] = choques
    const extra = resto.length === 0 ? '' : ` Y ${resto.length === 1 ? 'otra parada queda' : `otras ${resto.length} paradas quedan`} igual.`
    return `El Día ${primero.dayNumber} pasa a caer en ${weekdayNameEs(primero.weekday)} y ${primero.stopName} cierra ese día.${extra}`
  }

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
      <MissingAccommodationBanner route={route} />
      {dayReorderWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
          <p className="min-w-0 flex-1 text-caption leading-relaxed text-text-soft">{dayReorderWarning}</p>
          <button type="button" onClick={() => setDayReorderWarning(null)} className="shrink-0 text-caption font-semibold text-text-muted">
            Vale
          </button>
        </div>
      )}
      {/* Por qué la ruta es como es: uno solo, encima del Día 1. */}
      <ContextBanner route={route} />
      <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
      <SortableContext items={route.days.map((day) => day.id)} strategy={verticalListSortingStrategy}>
      {route.days.map((day, index) => {
        const travel = computeDayTravelInfo(route, index)
        const dateIso = tripStartIso ? addDaysToIso(tripStartIso, day.dayNumber - 1) : null
        const expanded = activeDayId === day.id

        return (
          <SortableDay key={day.id} id={day.id} disabled={!isMovableDay(day, index)}>
            {(dragHandle) => (
          <div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectDay(day.id)
                }
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-bg-card px-4 py-4 text-left transition-colors hover:bg-bg-card/80"
            >
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                {index > 0 && <span className="absolute bottom-full left-1/2 h-4 w-px -translate-x-1/2 bg-border" />}
                <span className="z-10 flex h-7 w-7 items-center justify-center rounded-md border border-text-muted/30 bg-bg-hover text-small font-semibold text-text">
                  {day.dayNumber}
                </span>
                {index < route.days.length - 1 && <span className="absolute top-full left-1/2 h-4 w-px -translate-x-1/2 bg-border" />}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
                  {dateIso ? formatShortDateEs(dateIso) : `Día ${day.dayNumber}`}
                </p>
                <p className="truncate text-body font-semibold text-text">{travel ? `${travel.fromCity} → ${travel.toCity}` : day.city}</p>
                {travel && (
                  <p className="text-caption font-medium" style={{ color: '#E24C4C' }}>
                    Día de viaje
                  </p>
                )}
              </div>

              {dragHandle}

              {!day.isReturnLeg && (
                <span onClick={(event) => event.stopPropagation()}>
                  <DayMenu onRegenerate={() => setRegenerateDayId(day.id)} />
                </span>
              )}

              <ChevronIcon />
            </div>

            {expanded && (
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
                onBack={() => onSelectDay(null)}
              />
            )}
          </div>
            )}
          </SortableDay>
        )
      })}
      </SortableContext>
      </DndContext>

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
