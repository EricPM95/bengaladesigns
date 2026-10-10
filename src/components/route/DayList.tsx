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
import { numberedStopsOf } from '../../lib/stopKind'
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
import { ConfirmDialog } from './ConfirmDialog'
import { DateNoticeTag } from './DateNoticesModal'
import { AddDayButton, DayNameSheet } from './freeDay/DayNameSheet'
import { AddDayChooser } from './freeDay/AddDayChooser'
import { useDestinationExcursions } from '../../lib/destinationExcursions'
import { useExcursionsStore } from '../../store/useExcursionsStore'
import { isDayPinned } from '../../lib/bookings'
import { SaleCards } from './reservas/SaleCards'
import { diaCorto, diaProsa, elDia, fechaDelDia, fichaDelDia } from '../../lib/nombreDeDia'
import { dayName } from './freeDay/AddToDaySheet'
import { canAddDay, canMoveDay, isFreeDay } from '../../lib/freeDays'
import { useAddFlowStore, withUndo } from '../../store/useAddFlowStore'
import { DayCardSwitch } from './DayCardSwitch'
import { ExcursionCardMeta } from './dayDetail/excursion/ExcursionCardMeta'
import { excursionReservationOf, viewedExcursion, volverAlDiaPropuesto } from '../../lib/dayInterruptor'
import { Icono } from '../ui/Icono'

interface DayListProps {
  route: Route
  activeDayId: string | null
  onSelectDay: (dayId: string | null) => void
  /** Ver DayDetailPanel: lo que el día abierto enseña en el mapa de arriba, y si hay una pantalla encima. */
  onDayMapChange?: (map: DayMapView | null) => void
  onDayOverlayChange?: (open: boolean) => void
  showAllDaysOnMap?: boolean
}

function ChevronIcon() {
  return (
    <Icono nombre="adelante" className="h-[18px] w-[18px] shrink-0" />
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
export function DayList({ route, activeDayId, onSelectDay, onDayMapChange, onDayOverlayChange, showAllDaysOnMap }: DayListProps) {
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
    const choques: { antes: number; weekday: number; stopName: string }[] = []
    orderedIds.forEach((id, index) => {
      const day = daysById.get(id)
      if (!day || day.dayNumber === index + 1) return
      const weekday = new Date(`${addDaysToIso(tripStartIso, index)}T00:00:00`).getDay()
      const stops = day.stops.length > 0 ? day.stops : seedStopsFromTemplate(day)
      for (const stop of stops) {
        if (closedWeekdaysFromSchedule(stop.scheduleText ?? stop.hours).includes(weekday)) {
          choques.push({ antes: day.dayNumber, weekday, stopName: stop.name })
        }
      }
    })
    if (choques.length === 0) return null
    const [primero, ...resto] = choques
    const extra = resto.length === 0 ? '' : ` Y ${resto.length === 1 ? 'otra parada queda' : `otras ${resto.length} paradas quedan`} igual.`
    // Con fechas el día se llama por la que tenía antes de moverlo: «Tu lunes 13 pasa a caer en jueves…».
    return `Tu ${diaProsa(route, primero.antes)} pasa a caer en ${weekdayNameEs(primero.weekday)} y ${primero.stopName} cierra ese día.${extra}`
  }

  return (
    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3.5 pb-6 pt-4">
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
      {/* Una venta del afiliado con el código de este viaje: «Hemos visto que has reservado… ¿La ponemos en tu Día n?» (PARA_CODE_RESERVAS, 5). */}
      <SaleCards route={route} />
      <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
      <SortableContext items={route.days.map((day) => day.id)} strategy={verticalListSortingStrategy}>
      {route.days.map((day, index) => {
        const travel = computeDayTravelInfo(route, index)
        const dateIso = fechaDelDia(route, day.dayNumber)
        const ficha = fichaDelDia(route, day.dayNumber)
        const expanded = activeDayId === day.id
        // Título real del día curado ("Roma Antigua y el centro barroco"); de viaje, el trayecto.
        // (Un día que crea el viajero, una excursión en un día nuevo, se llama como lo llamó, aunque quede el último.)
        // (El día 4 con el interruptor en Excursión se llama «Excursión desde Roma», Tanda 6g.)
        const enExcursion = day.interruptor?.mode === 'excursion'
        const title = day.userAdded ? (day.curatedTitle ?? day.title ?? day.city) : enExcursion ? `Excursión desde ${day.city}` : travel ? `${travel.fromCity} → ${travel.toCity}` : (day.curatedTitle ?? day.city)
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
              {/* El cuadrado, en el color neutro de siempre en todos los días: la franja ya dice qué color es. Con fechas es la ficha de la fecha («LUN» y «13»);
                  sin fechas, el número del día (tanda 6z3, punto 5). */}
              {ficha ? (
                <span
                  className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl transition-colors ${expanded ? 'bg-text text-bg' : 'bg-bg-hover text-text'}`}
                >
                  <span className="font-mono text-[9px] font-medium uppercase leading-none tracking-[.12em] opacity-60">{ficha.semana}</span>
                  <span className="mt-[3px] font-display text-[22px] leading-none">{ficha.numero}</span>
                </span>
              ) : (
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-[22px] leading-none transition-colors ${expanded ? 'bg-text text-bg' : 'bg-bg-hover text-text'}`}
                >
                  {day.dayNumber}
                </span>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                {/* Con fechas la ficha ya dice qué día es: la línea pequeña solo queda sin fechas («DÍA 3»). */}
                {!ficha && <p className="font-mono text-[10px] font-medium uppercase tracking-[.14em] text-text/50">{diaCorto(route, day.dayNumber)}</p>}
                <p className="font-display text-[22px] leading-[1.08] text-text [overflow-wrap:anywhere]">{title}</p>
                {/* Las etiquetas de día van en el naranja de la app: el rojo es solo para avisos de verdad (Tanda 6g). */}
                {travel && !day.userAdded && <p className="text-[12.5px] font-medium text-accent">Día de viaje</p>}
                {/* El día de la excursión lleva su etiqueta, como el primero y el último llevan «Día de viaje» (tanda 3); en el día 4 con interruptor, con sus horas y la reserva. */}
                {enExcursion && !travel && <ExcursionCardMeta excursion={viewedExcursion(day)} reservedName={excursionReservationOf(route, reservations, day)?.name.replace(/^Excursión (a la|a los|a las|al|a)\s+/i, '') ?? null} />}
                {day.dayType === 'excursion' && !enExcursion && !travel && <p className="text-[12.5px] font-medium text-accent">Día de excursión</p>}
                {/* Fechas especiales de este día ("Todos los Santos"): al tocarla vuelve a salir su tarjeta. */}
                {(route.dateNotices ?? []).some((notice) => noticeIsForDay(notice, day.dayNumber, dateIso)) && (
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {(route.dateNotices ?? []).filter((notice) => noticeIsForDay(notice, day.dayNumber, dateIso)).map((notice) => (
                      <DateNoticeTag key={notice.id} notice={notice} />
                    ))}
                  </span>
                )}
                {/* (Ya no hay aquí la línea de lo reservado con su hora, «🔒 Coliseo · 10:00»: la hora está en la pestañita verde de la parada. Tanda 6z3.) */}
                {/* Cerrado: cuántas paradas son (sin puntitos de colores, Tanda 6j). */}
                {!expanded && numbered.length > 0 && (
                  <span className="mt-1 text-[12px] text-text/55">
                    {numbered.length} parada{numbered.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <span onClick={(event) => event.stopPropagation()}>
                <DayMenu
                  // «Recuperar este día»: solo en los días con cambios; nunca en uno del viajero (no hay ruta nuestra que recuperar) ni en uno fijado por una reserva.
                  onBackToProposed={day.interruptor && day.ownDay ? () => void volverAlDiaPropuesto(day.id) : undefined}
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

            {/* El interruptor [Roma | Excursión] del día 4: debajo del título, a la vista aunque la tarjeta esté plegada (Tanda 6g). */}
            {day.interruptor && <DayCardSwitch day={day} route={route} reservations={reservations} />}

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
      {/* El aviso de «más días que fechas» ahora sale en la campana de la cabecera (useAppNotices.ts). */}
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
          eyebrow={diaCorto(route, askRestore.dayNumber)}
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
          eyebrow={`${diaCorto(route, removeDay.dayNumber)} · ${dayName(removeDay)}`}
          text={`¿Eliminar ${elDia(route, removeDay.dayNumber)}? Puedes recuperarlo con «Volver a mi ruta original».`}
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
