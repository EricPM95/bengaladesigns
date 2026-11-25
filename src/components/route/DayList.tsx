import { Fragment, useEffect, useRef, useState } from 'react'
import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { DayPlan, Route } from '../../lib/types'
import { addDaysToIso } from '../../lib/dateRange'
import { dayColorIndex } from '../../lib/dayColors'
import { closedWeekdaysFromSchedule, weekdayNameEs } from '../../lib/stopHoursTag'
import { SortableDay } from './SortableDay'
import { computeDayTravelInfo } from '../../lib/dayTravelInfo'
import { buildDestinationSegments } from '../../lib/destinationSegments'
import { seedStopsFromTemplate } from '../../lib/mockDayDetail'
import { useRouteStore } from '../../store/useRouteStore'
import { DayDetailPanel, type DayMapView } from './dayDetail/DayDetailPanel'
import { DayMenu } from './dayDetail/DayMenu'
import { usePermisosDelViaje } from '../../hooks/usePermisosDelViaje'
import { EspacioParaElLapiz } from '../propuesta/BotonDePropuesta'
import { TarjetaDeDia } from './TarjetaDeDia'
import { MissingAccommodationBanner } from './MissingAccommodationBanner'
import { ConfirmDialog } from './ConfirmDialog'
import { AddDayButton, DayNameSheet } from './freeDay/DayNameSheet'
import { AddDayChooser } from './freeDay/AddDayChooser'
import { useDestinationExcursions } from '../../lib/destinationExcursions'
import { useExcursionsStore } from '../../store/useExcursionsStore'
import { isDayPinned } from '../../lib/bookings'
import { nombrePropioDelDia, useNombreDeDias } from '../../lib/tituloDelDia'
import { SaleCards } from './reservas/SaleCards'
import { diaCorto, diaProsa, elDia, fichaDelDia } from '../../lib/nombreDeDia'
import { canAddDay, canMoveDay, isFreeDay } from '../../lib/freeDays'
import { useAddFlowStore, withUndo } from '../../store/useAddFlowStore'
import { DayCardSwitch } from './DayCardSwitch'
import { useInterruptorUiStore } from '../../store/useInterruptorUiStore'
import { logrosActivos } from '../../lib/logros'
import { volverAlDiaPropuesto } from '../../lib/dayInterruptor'
import { diaDeHoy, diaQueSeAbreAlEntrar } from '../../lib/diaDeHoy'
import { esDiaCompleto } from '../../lib/diaCompleto'
import { usePagoActivo } from '../../lib/pago'
import { reorganizarDias, sePuedeReorganizar } from '../../lib/reorganizarDia'
import { PiezaSegura } from '../PiezaSegura'
import { AccommodationBlock } from './dayDetail/AccommodationBlock'
import { VehicleBlock } from './dayDetail/VehicleBlock'
import { diasPasados, ordenRespetaLosPasados } from '../../lib/diasPasados'
import { useFotosPorDia } from '../../hooks/useFotosPorDia'
import { useReservasFocusStore } from '../../store/useReservasFocusStore'

interface DayListProps {
  route: Route
  activeDayId: string | null
  onSelectDay: (dayId: string | null) => void
  /** Ver DayDetailPanel: lo que el día abierto enseña en el mapa de arriba, y si hay una pantalla encima. */
  onDayMapChange?: (map: DayMapView | null) => void
  onDayOverlayChange?: (open: boolean) => void
  showAllDaysOnMap?: boolean
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
  const setMode = useRouteStore((state) => state.setMode)
  const pedirReservas = useReservasFocusStore((state) => state.pedir)
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
  // Tanda 10N §6b: quien solo recomienda no tiene los tres puntitos del día ni las rayitas para arrastrar días (no mueve días enteros; sí propone mover paradas).
  const { soloRecomienda } = usePermisosDelViaje()
  const conPase = usePagoActivo()
  /** La ventana del nombre: crear un día o cambiar el de uno libre. */
  const [nameSheet, setNameSheet] = useState<{ dayId: string | null } | null>(null)
  // «+ Añadir día»: primero qué quieres hacer, si el destino tiene excursiones (PARA_CODE_EXCURSIONES, 5).
  const [chooserOpen, setChooserOpen] = useState(false)
  const excursionInfo = useDestinationExcursions(route.destination)
  // El título de cada día (tanda 6y7): UNA regla compartida con HOY y con todo lo que nombra un día (src/lib/tituloDelDia.ts).
  const nombreDe = useNombreDeDias(route)
  const openExcursionsPage = useExcursionsStore((state) => state.openPage)
  const reservations = useRouteStore((state) => state.reservations)
  const simuladaIso = useRouteStore((state) => state.dev_simulated_today_iso)
  // Durante el viaje, DÍAS se abre sola en el día de hoy y lo marca con «HOY» (Tanda 6z6). Solo al entrar (o si cambia el día de hoy): si el viajero lo cierra, se queda cerrado.
  const hoyId = diaDeHoy(route, simuladaIso)?.id ?? null
  // (V24) Los días que ya pasaron: «Hecho», sin cambios (ver src/lib/diasPasados.ts).
  const pasados = diasPasados(route, simuladaIso)
  const fotosPorDia = useFotosPorDia(pasados.size > 0)
  useEffect(() => {
    const abrir = diaQueSeAbreAlEntrar(route, simuladaIso, activeDayId)
    if (abrir) onSelectDay(abrir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoyId])
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
    // (V24) Un día que ya pasó no se mueve y ningún día se pone delante de él.
    if (!ordenRespetaLosPasados(route, next, simuladaIso)) return
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
    <div ref={listRef} className={`flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3.5 pt-4 ${logrosActivos() ? 'pb-28' : 'pb-6'}`}>
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
        const ficha = fichaDelDia(route, day.dayNumber)
        const expanded = activeDayId === day.id
        // El título del día sale de lo que se ve ese día (tanda 6y7, src/lib/tituloDelDia.ts): «Centro histórico», «Free Tour y Trastevere»… El día de viaje lleva además su trayecto, pequeño, junto a «Día de viaje».
        // (Un día que crea el viajero, o al que le pone nombre, se llama como lo llamó. El día de excursión se llama «Excursión desde Roma», Tanda 6g.)
        const nombre = nombreDe(day)
        const title = nombre.titulo
        const toggle = () => onSelectDay(expanded ? null : day.id)
        const pasado = pasados.has(day.id)
        const fotosDelDia = fotosPorDia.get(day.dayNumber) ?? 0
        // (V53 §5) «Hecho» solo si ese día hizo algo: al menos una foto o una parada marcada como vista ([He terminado] / «Ya he estado aquí»). Si no, «Ya pasó», sin ✓ verde. Igual en todos los destinos.
        const hizoAlgo = fotosDelDia > 0 || day.stops.some((stop) => !!stop.checkedInAt)
        // «Hoy es un día completo: te recomendamos madrugar.» solo avisa: no mueve ni quita nada del día (Tanda 6z6).
        const diaCompleto = esDiaCompleto(route, day, reservations)
        // El color va con el día, no con su posición (PROMPT_UI, Parte 1).
        const colorIndex = dayColorIndex(day, nonReturnIndex.get(day.id) ?? index)
        // (V24) Antes de este día, los bloques del viaje: el alojamiento de su destino (y, en el primero, el vehículo de alquiler). Fuera de los días y no repetidos dentro de ellos.
        const estancia = stayByFirstDayId.get(day.id)
        const conAlojamiento = !isCamper && Boolean(estancia) && (estancia?.nights ?? 0) > 0
        const conVehiculo = index === 0 && hasRentalVehicle

        return (
          <Fragment key={day.id}>
          {(conAlojamiento || conVehiculo) && (
            <div data-bloques-del-viaje={day.id} className="space-y-2">
              {conAlojamiento && <AccommodationBlock city={day.city} segmentDayId={day.id} totalNights={estancia?.nights ?? 0} onAnadir={() => { setMode('bookings'); pedirReservas('aloj') }} />}
              {conVehiculo && <VehicleBlock kind={isCamper ? 'camper' : 'rental-car'} />}
            </div>
          )}
          <SortableDay id={day.id} disabled={soloRecomienda || pasado || !isMovableDay(day, index) || isDayPinned(route, reservations, day)}>
            {(dragHandle) => (
          <PiezaSegura nombre={`día ${day.dayNumber} de DÍAS`}>
          <TarjetaDeDia
            route={route}
            day={day}
            reservations={reservations}
            colorIndex={colorIndex}
            expanded={expanded}
            pasado={pasado}
            hizoAlgo={hizoAlgo}
            fotosDelDia={fotosDelDia}
            diaCompleto={diaCompleto}
            travel={travel}
            nombre={nombre}
            ficha={ficha}
            dragHandle={dragHandle}
            onToggle={toggle}
            onPonleNombre={() => setNameSheet({ dayId: day.id })}
            menu={
              pasado && !hizoAlgo ? null : pasado ? (
                <span data-dia-hecho-marca="1" aria-label="Día hecho" role="img" className="flex h-[26px] w-[26px] items-center justify-center rounded-full" style={{ background: '#DCEBDD', color: '#2F6B43' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
              ) : soloRecomienda ? null : (
                <DayMenu
                  titulo={[diaProsa(route, day.dayNumber).replace(/^./, (c) => c.toUpperCase()), title].filter(Boolean).join(' · ')}
                  // «Recuperar este día»: solo en los días con cambios; nunca en uno del viajero (no hay ruta nuestra que recuperar) ni en uno fijado por una reserva.
                  onBackToProposed={day.interruptor && day.ownDay ? () => void volverAlDiaPropuesto(day.id) : undefined}
                  onRestoreDay={!isFreeDay(day) && !day.userAdded && !isDayPinned(route, reservations, day) && day.originalSnapshot ? () => setAskRestore({ dayId: day.id, dayNumber: day.dayNumber }) : undefined}
                  onDelete={isDayPinned(route, reservations, day) ? null : () => setRemoveDayId(day.id)}
                  onAddPlaces={() => openAddFlow(day.id)}
                  // (10S7) «Reorganizar este día»: solo con pase (sin pase no sale) y no para quien solo recomienda (ese menú ni se pinta).
                  onReorganize={conPase && sePuedeReorganizar(day) ? () => void reorganizarDias([day.id], { avisar: true }) : undefined}
                  // (Tanda 10N4 §3) «Añadir una excursión» hace lo mismo que el interruptor [Roma | Excursión]: solo cabe donde el día lleva interruptor (no en el de llegada ni en el de vuelta).
                  excursion={{
                    cabe: Boolean(day.interruptor),
                    modo: day.interruptor?.mode ?? 'roma',
                    motivo: index === 0 ? 'No cabe en el día de llegada' : day.isReturnLeg || index === lastContentIndex ? 'No cabe en el día de vuelta' : 'No cabe una excursión este día',
                    onCambiar: () => void useInterruptorUiStore.getState().pedir(day.id, day.interruptor?.mode === 'excursion' ? 'roma' : 'excursion'),
                  }}
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
              )
            }
          >
            {/* El interruptor [Roma | Excursión] del día 4: debajo del título, a la vista aunque la tarjeta esté plegada (Tanda 6g). */}
            {day.interruptor && !pasado && <DayCardSwitch day={day} route={route} reservations={reservations} />}

            {expanded && (
              <DayDetailPanel
                day={day}
                travel={travel}
                isLastDay={index === route.days.length - 1}
                origin={route.origin}
                allDays={allDays}
                isFirstDayOfTrip={index === 0}
                soloLectura={pasado}
                onMapChange={onDayMapChange}
                onOverlayChange={onDayOverlayChange}
                showAllDaysOnMap={showAllDaysOnMap}
              />
            )}
          </TarjetaDeDia>
          </PiezaSegura>
            )}
          </SortableDay>
          </Fragment>
        )
      })}
      </SortableContext>
      </DndContext>

      {/* Un día fuera: al final de la lista, solo si el viaje no lleva ya una excursión (PROMPT_UI, Parte 2). */}
      {/* "+ Añadir día" (decisión del usuario, 2026-09-28): debajo del último día; hasta 14 días por viaje. */}
      <AddDayButton onClick={() => (excursionInfo.excursions.length > 0 ? setChooserOpen(true) : setNameSheet({ dayId: null }))} disabled={!canAddDay(route)} />
      <EspacioParaElLapiz />
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
          initialName={nameSheet.dayId ? nombrePropioDelDia(route.days.find((day) => day.id === nameSheet.dayId)) : ''}
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
          text={`¿Recuperamos ${elDia(route, askRestore.dayNumber)} como te lo preparamos?`}
          detail="Quedará tal como te lo preparamos y se perderán los cambios que has hecho en él. Lo que tienes reservado se queda en su día y a su hora."
          confirmLabel="Sí, recuperar"
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
          eyebrow={`${diaCorto(route, removeDay.dayNumber)} · ${nombreDe(removeDay).titulo}`}
          text={`¿Quitamos ${elDia(route, removeDay.dayNumber)} de tu viaje?`}
          detail="Puedes recuperarlo con «Volver a mi ruta original» o con [Deshacer]."
          peligro
          confirmLabel="Sí, quitar"
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
