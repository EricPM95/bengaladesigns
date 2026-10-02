import { useEffect, useRef, useState } from 'react'
import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { DayPlan, Route } from '../../lib/types'
import { addDaysToIso } from '../../lib/dateRange'
import type { DateNotice } from '../../lib/types'

/** Una fecha especial va con su FECHA, no con el número del día: si se borra el día 1, la audiencia del miércoles sigue en el miércoles. */
const noticeIsForDay = (notice: DateNotice, dayNumber: number, dateIso: string | null) =>
  notice.dateIso && dateIso ? notice.dateIso === dateIso : notice.dayNumber === dayNumber
import { KIND_STYLE, numberedStopsOf, stopKindOf } from '../../lib/stopKind'
import { dayColor, dayColorIndex } from '../../lib/dayColors'
import { closedWeekdaysFromSchedule, weekdayNameEs } from '../../lib/stopHoursTag'
import { SortableDay } from './SortableDay'
import { computeDayTravelInfo } from '../../lib/dayTravelInfo'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { seedStopsFromTemplate } from '../../lib/mockDayDetail'
import { useRouteStore } from '../../store/useRouteStore'
import { DayDetailPanel, type DayMapView } from './dayDetail/DayDetailPanel'
import { DayMenu } from './dayDetail/DayMenu'
import { MissingAccommodationBanner } from './MissingAccommodationBanner'
import { ContextBanner } from './ContextBanner'
import { ConfirmDialog } from './ConfirmDialog'
import { DateNoticeTag } from './DateNoticesModal'
import { AddDayButton, DayNameSheet } from './freeDay/DayNameSheet'
import { AddDayChooser } from './freeDay/AddDayChooser'
import { useDestinationExcursions } from '../../lib/destinationExcursions'
import { useExcursionsStore } from '../../store/useExcursionsStore'
import { dayOfReservation, isDayPinned } from '../../lib/bookings'
import { displayStopName } from '../../lib/format'
import { SaleCards } from './reservas/SaleCards'
import { DayReservedTag } from './reservas/ReservedMarks'
import { dayName } from './freeDay/AddToDaySheet'
import { canAddDay, canMoveDay, isFreeDay } from '../../lib/freeDays'
import { useAddFlowStore, withUndo } from '../../store/useAddFlowStore'

interface DayListProps {
  route: Route
  activeDayId: string | null
  onSelectDay: (dayId: string | null) => void
  /** Ver DayDetailPanel: lo que el día abierto enseña en el mapa de arriba, y si hay una pantalla encima. */
  onDayMapChange?: (map: DayMapView | null) => void
  onDayOverlayChange?: (open: boolean) => void
  showAllDaysOnMap?: boolean
  /** «Añade un día más a tu viaje»: abre el calendario de fechas de la cabecera del mapa. */
  onOpenDates?: () => void
}

const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** "DÍA 3 · JUE 16 JUL" (sin fechas, "DÍA 3"). */
function dayLabel(dayNumber: number, dateIso: string | null): string {
  if (!dateIso) return `Día ${dayNumber}`
  const date = new Date(`${dateIso}T00:00:00`)
  return `Día ${dayNumber} · ${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
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
      className="h-[18px] w-[18px] shrink-0"
    >
      <path d="M9 6l6 6-6 6" />
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
export function DayList({ route, activeDayId, onSelectDay, onDayMapChange, onDayOverlayChange, showAllDaysOnMap, onOpenDates }: DayListProps) {
  const reorderDays = useRouteStore((state) => state.reorderDays)
  const listRef = useRef<HTMLDivElement>(null)
  // La pregunta antes de recuperar el original de un día («Recuperar este día», en los tres puntos). La de toda la ruta vive en la tarjeta del destino, en Ruta.
  const [askRestore, setAskRestore] = useState<{ dayId: string; dayNumber: number } | null>(null)
  // Al abrir un día, los demás se cierran (activeDayId es uno solo) y la pantalla sube sola hasta el principio de ese día: si se
  // estaba leyendo el final del Día 1 y se toca el Día 2, se abre por su primera parada (paso 6.5).
  useEffect(() => {
    if (!activeDayId) return
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        const card = listRef.current?.querySelector(`[data-day-id="${activeDayId}"]`)
        card?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      })
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [activeDayId])
  const [dayReorderWarning, setDayReorderWarning] = useState<string | null>(null)
  const addFreeDay = useRouteStore((state) => state.addFreeDay)
  const renameDay = useRouteStore((state) => state.renameDay)
  const moveFreeDay = useRouteStore((state) => state.moveFreeDay)
  const deleteDay = useRouteStore((state) => state.deleteDay)
  const restoreOriginalDay = useRouteStore((state) => state.restoreOriginalDay)
  const openAddFlow = useAddFlowStore((state) => state.openAddFlow)
  /** La ventana del nombre: crear un día o cambiar el de uno libre. */
  const [nameSheet, setNameSheet] = useState<{ dayId: string | null } | null>(null)
  // «+ Añadir día»: primero qué quieres hacer, si el destino tiene excursiones (PARA_CODE_EXCURSIONES, 5).
  const [chooserOpen, setChooserOpen] = useState(false)
  const excursionInfo = useDestinationExcursions(route.destination)
  const openExcursionsPage = useExcursionsStore((state) => state.openPage)
  const tripDays = route.answers.days ?? route.days.length
  const reservations = useRouteStore((state) => state.reservations)
  const [removeDayId, setRemoveDayId] = useState<string | null>(null)
  const removeDay = route.days.find((day) => day.id === removeDayId) ?? null

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
  const nonReturnIndex = new Map(route.days.filter((candidate) => !candidate.isReturnLeg).map((candidate, position) => [candidate.id, position]))
  const allDays = route.days.filter((candidate) => !candidate.isReturnLeg).map((candidate) => ({ id: candidate.id, dayNumber: candidate.dayNumber, city: candidate.city }))

  /**
   * Un día se puede mover si no es de llegada, traslado ni vuelta. Esos tres son el esqueleto del
   * viaje: llevan el transporte y abren el tramo con su alojamiento, así que moverlos no reordena
   * el viaje, lo rompe. Lo que el viajero quiere mover son los días de ciudad, y esos sí se mueven.
   */
  // Todos los días se mueven, también el de llegada y el de vuelta (PROMPT_UI_REPASO 10): el que queda primero hereda el
  // alojamiento y la llegada, y el último la vuelta, porque van con la posición. Solo no se mueven el día sintético de
  // vuelta ni un cambio de ciudad a mitad de un viaje con varios destinos.
  const lastContentIndex = route.days.reduce((last, candidate, position) => (candidate.isReturnLeg ? last : position), 0)
  const isMovableDay = (day: DayPlan, index: number) =>
    !day.isReturnLeg && (index === 0 || index === lastContentIndex || !computeDayTravelInfo(route, index))

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

  return (
    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3.5 pb-36 pt-4">
      <MissingAccommodationBanner route={route} />
      {dayReorderWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
          <p className="min-w-0 flex-1 text-caption leading-relaxed text-text-soft">{dayReorderWarning}</p>
          <button type="button" onClick={() => setDayReorderWarning(null)} className="shrink-0 text-caption font-semibold text-text-muted">
            Vale
          </button>
        </div>
      )}
      {/* Por qué la ruta es como es: uno solo, encima del Día 1 (la nota de temporada pasa a la ventana de los avisos). */}
      <ContextBanner route={route} />
      {/* Una venta del afiliado con el código de este viaje: «Hemos visto que has reservado… ¿La ponemos en tu Día n?» (PARA_CODE_RESERVAS, 5). */}
      <SaleCards route={route} />
      <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
      <SortableContext items={route.days.map((day) => day.id)} strategy={verticalListSortingStrategy}>
      {route.days.map((day, index) => {
        const travel = computeDayTravelInfo(route, index)
        const dateIso = tripStartIso ? addDaysToIso(tripStartIso, day.dayNumber - 1) : null
        const expanded = activeDayId === day.id
        // Título real del día curado ("Roma Antigua y el centro barroco"); de viaje, el trayecto.
        // (Un día que crea el viajero, una excursión en un día nuevo, se llama como lo llamó, aunque quede el último.)
        const title = day.userAdded ? (day.curatedTitle ?? day.title ?? day.city) : travel ? `${travel.fromCity} → ${travel.toCity}` : (day.curatedTitle ?? day.city)
        const numbered = numberedStopsOf(day)
        const toggle = () => onSelectDay(expanded ? null : day.id)
        // El color va con el día, no con su posición (PROMPT_UI, Parte 1).
        const colorIndex = dayColorIndex(day, nonReturnIndex.get(day.id) ?? index)

        return (
          <SortableDay key={day.id} id={day.id} disabled={!isMovableDay(day, index) || isDayPinned(route, reservations, day)}>
            {(dragHandle) => (
          <div
            data-day-id={day.id}
            className={`relative scroll-mt-3 ml-2.5 rounded-3xl border bg-bg-card shadow-[0_1px_2px_rgba(28,34,48,.05),0_12px_30px_-20px_rgba(28,34,48,.3)] transition-colors ${expanded ? 'border-text/[.14]' : 'border-text/[.06]'}`}
          >
            {/* La franja del color del día, fina y en diagonal (el mismo color que sus pines y su línea en el mapa). Solo
                cerrado: abierto, el color del día se queda en los números de las paradas (decisión del usuario, 2026-09-29). */}
            {!day.isReturnLeg && !expanded && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[14px] overflow-hidden rounded-l-3xl">
                <span className="absolute inset-0" style={{ background: dayColor(colorIndex), clipPath: 'polygon(0 0, 9px 0, 4px 100%, 0 100%)' }} />
              </span>
            )}
            {/* El asa, a la izquierda del todo y asomando por el borde (44 × 44 de zona de toque). */}
            {dragHandle && <span className="absolute -left-[34px] top-[18px] z-10">{dragHandle}</span>}
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
              className="flex min-h-20 w-full cursor-pointer items-center gap-3.5 py-3 pl-4 pr-3 text-left"
            >
              {/* El cuadrado y el número, en el color neutro de siempre en todos los días: la franja ya dice qué color es. */}
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-[22px] leading-none transition-colors ${expanded ? 'bg-text text-bg' : 'bg-bg-hover text-text'}`}
              >
                {day.dayNumber}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[.14em] text-text/50">{dayLabel(day.dayNumber, dateIso)}</p>
                <p className="font-display text-[22px] leading-[1.08] text-text [overflow-wrap:anywhere]">{title}</p>
                {travel && !day.userAdded && <p className="text-[12.5px] font-medium text-accent-red">Día de viaje</p>}
                {/* Fechas especiales de este día ("Todos los Santos"): al tocarla vuelve a salir su tarjeta. */}
                {(route.dateNotices ?? []).some((notice) => noticeIsForDay(notice, day.dayNumber, dateIso)) && (
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {(route.dateNotices ?? []).filter((notice) => noticeIsForDay(notice, day.dayNumber, dateIso)).map((notice) => (
                      <DateNoticeTag key={notice.id} notice={notice} />
                    ))}
                  </span>
                )}
                {/* Lo reservado de ese día (una entrada, una excursión, el Free Tour): el candado y lo fijado, en verde. */}
                {!expanded && (
                  <DayReservedTag
                    items={reservations
                      .filter((reservation) => dayOfReservation(route, reservation)?.id === day.id)
                      .map((reservation) => ({
                        name: reservation.kind === 'entrada' ? displayStopName(day.stops.find((stop) => stop.reservedId === reservation.id)?.name ?? reservation.placeNames[0] ?? reservation.name) : reservation.name,
                        time: reservation.time,
                      }))}
                  />
                )}
                {/* Cerrado: un puntito por parada, del color de su tipo, y cuántas son. */}
                {!expanded && numbered.length > 0 && (
                  <span className="mt-1 flex flex-wrap items-center gap-1">
                    {numbered.map((stop) => (
                      <span key={stop.id} className="h-[7px] w-[7px] rounded-full" style={{ background: KIND_STYLE[stopKindOf(stop)].color }} />
                    ))}
                    <span className="ml-1 text-[12px] text-text/55">
                      {numbered.length} parada{numbered.length === 1 ? '' : 's'}
                    </span>
                  </span>
                )}
              </div>

              <span onClick={(event) => event.stopPropagation()}>
                <DayMenu
                  // «Recuperar este día»: solo en los días con cambios; nunca en uno del viajero (no hay ruta nuestra que recuperar) ni en uno fijado por una reserva.
                  onRestoreDay={!isFreeDay(day) && !day.userAdded && !isDayPinned(route, reservations, day) && day.originalSnapshot ? () => setAskRestore({ dayId: day.id, dayNumber: day.dayNumber }) : undefined}
                  onDelete={isDayPinned(route, reservations, day) ? null : () => setRemoveDayId(day.id)}
                  freeDay={
                    isFreeDay(day) || day.userAdded
                      ? {
                          onAddPlaces: () => openAddFlow(day.id),
                          onRename: () => setNameSheet({ dayId: day.id }),
                          onMoveBefore: canMoveDay(route, day.id, -1) && !isDayPinned(route, reservations, day) ? () => moveFreeDay(day.id, -1) : null,
                          onMoveAfter: canMoveDay(route, day.id, 1) && !isDayPinned(route, reservations, day) ? () => moveFreeDay(day.id, 1) : null,
                        }
                      : undefined
                  }
                />
              </span>

              <span className="flex w-[22px] justify-center text-text/45 transition-transform duration-[400ms]" style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}>
                <ChevronIcon />
              </span>
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
                onMapChange={onDayMapChange}
                onOverlayChange={onDayOverlayChange}
                showAllDaysOnMap={showAllDaysOnMap}
              />
            )}
          </div>
            )}
          </SortableDay>
        )
      })}
      </SortableContext>
      </DndContext>

      {/* Un día fuera: al final de la lista, solo si el viaje no lleva ya una excursión (PROMPT_UI, Parte 2). */}
      {/* "+ Añadir día" (decisión del usuario, 2026-09-28): debajo del último día; hasta 14 días por viaje. */}
      <AddDayButton onClick={() => (excursionInfo.excursions.length > 0 ? setChooserOpen(true) : setNameSheet({ dayId: null }))} disabled={!canAddDay(route)} />
      {/* Más días en la lista que en el viaje (PARA_CODE_EXCURSIONES, 4): una línea, con el enlace al calendario. Sin nada más. */}
      {route.days.length > tripDays && (
        <p className="mt-3 flex items-start gap-2 px-1 text-[13.5px] leading-snug text-text-soft">
          <svg viewBox="0 0 24 24" className="mt-[2px] h-[15px] w-[15px] shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4 3 19h18L12 4Z" />
            <path d="M12 10v4M12 16.8v.1" />
          </svg>
          <span>
            Tu viaje es de {tripDays} {tripDays === 1 ? 'día' : 'días'} y ahora tienes {route.days.length}.{' '}
            <button type="button" onClick={onOpenDates} className="font-semibold text-accent underline underline-offset-2">
              Añade un día más a tu viaje
            </button>{' '}
            o elimina el que menos te convenga.
          </span>
        </p>
      )}
      {chooserOpen && (
        <AddDayChooser
          dayNumber={route.days.filter((day) => !day.isReturnLeg).length + 1}
          examples={excursionInfo.examples}
          onClose={() => setChooserOpen(false)}
          onPlaces={() => {
            setChooserOpen(false)
            setNameSheet({ dayId: null })
          }}
          onExcursion={() => {
            setChooserOpen(false)
            openExcursionsPage(true)
          }}
        />
      )}
      {nameSheet && (
        <DayNameSheet
          title={nameSheet.dayId ? 'Cambiar el nombre' : 'Añadir un día'}
          example={excursionInfo.dayNameExample}
          initialName={nameSheet.dayId ? dayName(route.days.find((day) => day.id === nameSheet.dayId) ?? route.days[0]) : ''}
          confirmLabel={nameSheet.dayId ? 'Guardar' : 'Crear día'}
          onClose={() => setNameSheet(null)}
          onConfirm={(name) => {
            if (nameSheet.dayId) renameDay(nameSheet.dayId, name)
            else {
              const dayId = addFreeDay(name)
              if (dayId) openAddFlow(dayId)
            }
            setNameSheet(null)
          }}
        />
      )}
      {askRestore && (
        <ConfirmDialog
          eyebrow={`Día ${askRestore.dayNumber}`}
          text="¿Recuperar este día?"
          detail="Quedará tal como te lo preparamos y se perderán los cambios que has hecho en él. Lo que tienes reservado se queda en su día y a su hora."
          confirmLabel="Recuperar"
          cancelLabel="Cancelar"
          onCancel={() => setAskRestore(null)}
          onConfirm={() => {
            const ask = askRestore
            setAskRestore(null)
            withUndo('Día recuperado', () => restoreOriginalDay(ask.dayId))
          }}
        />
      )}
      {removeDay && (
        <ConfirmDialog
          eyebrow={`Día ${removeDay.dayNumber} · ${dayName(removeDay)}`}
          text={`¿Eliminar el día ${removeDay.dayNumber}? Puedes recuperarlo con «Volver a mi ruta original».`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onCancel={() => setRemoveDayId(null)}
          onConfirm={() => {
            if (activeDayId === removeDay.id) onSelectDay(null)
            withUndo('Día eliminado', () => deleteDay(removeDay.id))
            setRemoveDayId(null)
          }}
        />
      )}
    </div>
  )
}
