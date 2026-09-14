import { useEffect, useState } from 'react'
import type { DayPlan, Stop } from '../../../lib/types'
import type { DayTravelInfo } from '../../../lib/dayTravelInfo'
import type { ConnectorInfo, TransportMode } from '../../../lib/mockDayDetail'
import { dayColorPastel, dayColorStrong } from '../../../lib/dayColors'
import { addDaysToIso, formatShortDateEs } from '../../../lib/dateRange'
import {
  buildAccommodationConnectorInfo,
  buildArrivalDepartureDetail,
  buildConnectorInfo,
  refineConnectorWithRealDistance,
  resolveDisplayStops,
  seedStopsFromTemplate,
} from '../../../lib/mockDayDetail'
import { useRouteStore } from '../../../store/useRouteStore'
import { StopsMapView, type StopsMapMarker } from '../../map/StopsMapView'
import { AccommodationBlock } from './AccommodationBlock'
import { ArrivalDetailSheet } from './ArrivalDetailSheet'
import { AttractionsFinder } from '../attractionsFinder/AttractionsFinder'
import { StopAccordion } from './StopAccordion'
import { StopConnector } from './StopConnector'
import { StopDetailSheet, type DayStopRef } from './StopDetailSheet'
import { StopMenu } from './StopMenu'
import { VehicleBlock } from './VehicleBlock'

interface DayDetailPanelProps {
  day: DayPlan
  travel: DayTravelInfo | null
  isLastDay: boolean
  origin: string
  /** Presente solo cuando `day` es el primer día de una estancia (ver DayList.tsx) — dispara el bloque de alojamiento. */
  stay: { segmentDayId: string; totalNights: number } | null
  /** Clave de `accommodationSelections` (id del primer día del tramo) para el alojamiento de ESTA noche — null si es camper o si el día no tiene noche (día sintético de vuelta). */
  nightSegmentDayId: string | null
  /** Igual que `nightSegmentDayId` pero para la noche ANTERIOR (el tramo del día de ayer) — null en el día 1 o si es camper. */
  previousNightSegmentDayId: string | null
  /** true cuando el tramo de esta noche es de 1 sola noche (roadtrip: cada día es su propia parada) — la noche anterior y la de hoy son alojamientos distintos que hay que tratar por separado (ver mockDayDetail.ts). */
  isRoadtripHop: boolean
  /** Todos los días del viaje (menos el sintético de vuelta) — para el "Mover a otro día" del menú "..." de cada parada. */
  allDays: { id: string; dayNumber: number; city: string }[]
  /** true solo para `route.days[0]` — el bloque de vehículo es una reserva única para todo el viaje, nunca se repite por estancia/día (ver VehicleBlock.tsx). */
  isFirstDayOfTrip: boolean
  /** vehicle_type camper + vehicle_ownership rental — sustituye a AccommodationBlock (donde duermes es la propia camper). */
  showCamperBlock: boolean
  /** vehicle_type car + vehicle_ownership rental — aparece ADEMÁS de AccommodationBlock (logística de vehículo aparte del alojamiento). */
  showRentalCarBlock: boolean
  /** Vuelve a la lista de días (DayList) — este panel es ahora una pantalla completa de navegación, no un acordeón inline. */
  onBack: () => void
}

const DEFAULT_MODE: TransportMode = 'walking'
/** Hora asumida de inicio de la jornada (mock, sin dato real de horario por parada) — punto de partida para repartir las paradas entre Mañana/Tarde/Noche, ver `computeTimeSlots`. */
const DAY_START_MINUTES = 9 * 60

type TimeSlot = 'mañana' | 'tarde' | 'noche'

const SLOT_LABELS: Record<TimeSlot, string> = { mañana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }

/** Reparte las paradas del día en Mañana (<13:00) / Tarde (13:00-19:00) / Noche (≥19:00) acumulando su `durationMinutes` desde `DAY_START_MINUTES` — sin dato real de hora de visita (mock), es la mejor aproximación disponible y coincide con el diseño de referencia (franjas por posición, no por horario de apertura). */
function computeTimeSlots(stops: { durationMinutes: number }[]): TimeSlot[] {
  let minutes = DAY_START_MINUTES
  return stops.map((stop) => {
    const slot: TimeSlot = minutes < 13 * 60 ? 'mañana' : minutes < 19 * 60 ? 'tarde' : 'noche'
    minutes += stop.durationMinutes
    return slot
  })
}

function formatWalkKm(totalMeters: number): string {
  if (totalMeters <= 0) return '0 km'
  return `${(totalMeters / 1000).toFixed(1).replace('.', ',')} km`
}

function formatActivityDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0h'
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.round((totalMinutes / 60) * 2) / 2
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1).replace('.', ',')}h`
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

/** Apunta hacia arriba (mapa visible, tocar para colapsar) o hacia abajo (mapa colapsado, tocar para expandir) — mismo icono, solo rotado. */
function MapToggleIcon({ mapVisible }: { mapVisible: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 transition-transform ${mapVisible ? '' : 'rotate-180'}`}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

/** Los 3 iconos de la fila resumen (paradas/km a pie/horas de actividad) — mismo estilo lineal fino, sin relleno, y se pintan todos del mismo verde oscuro (text-accent-hover) desde quien los usa, ver el JSX del resumen más abajo. */
function SummaryPinIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 shrink-0 ${className}`}>
      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function SummaryWalkIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 shrink-0 ${className}`}>
      <ellipse cx="8" cy="15.5" rx="2.6" ry="4.4" transform="rotate(-12 8 15.5)" />
      <ellipse cx="16" cy="8.5" rx="2.6" ry="4.4" transform="rotate(12 16 8.5)" />
    </svg>
  )
}

function SummaryClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  )
}

/** Mismo color por día que el círculo numerado de cada parada (ver dayIndex más abajo) — así el pin del mini-mapa de esta pantalla coincide con el resto de mapas de la app. */
function buildDayMarkers(stops: Stop[], dayIndex: number): StopsMapMarker[] {
  return stops.map((stop, index) => ({
    id: stop.id,
    name: stop.name,
    coordinates: stop.coordinates,
    number: index + 1,
    bg: dayColorPastel(dayIndex),
    text: dayColorStrong(dayIndex),
    photoUrl: stop.photoUrl,
  }))
}

/**
 * Pantalla completa de un día en la pestaña DIAS — navegación desde DayList.tsx (ya no es un
 * acordeón inline: cada día abre esta pantalla y `onBack` vuelve a la lista). Mini-mapa arriba
 * (con su propio colapsar/expandir, independiente del mapa compartido de RouteView.tsx, que queda
 * cubierto detrás), cabecera con día/fecha/ciudad y un resumen en una fila (paradas · km a pie ·
 * horas de actividad) — luego bloque(s) "dónde duermes" (estáticos, no acordeón): el de vehículo
 * (camper, o coche de alquiler además del de alojamiento) SOLO en `route.days[0]` (reserva única
 * del viaje, ver VehicleBlock.tsx), el de alojamiento cuando este día es el primer día de una
 * estancia sin resolver, LUEGO el acordeón de llegada/vuelta si aplica, y luego las paradas
 * agrupadas por franja horaria (Mañana/Tarde/Noche, ver `computeTimeSlots`) conectadas por
 * StopConnector. Solo un acordeón de parada abierto a la vez, con estado propio de este panel.
 *
 * Las paradas se muestran vía `resolveDisplayStops` — plantilla mock mientras `day.stops` esté
 * vacío, paradas reales (editables) en cuanto hay alguna edición (añadir/quitar/mover/cambiar) —
 * ver mockDayDetail.ts. Los conectores no necesitan invalidación explícita: se derivan del ORDEN e
 * ÍNDICE de las paradas en cada render, así que cualquier edición ya los recalcula gratis. El
 * conector entre dos paradas de FRANJAS distintas se sustituye por la cabecera de la franja nueva
 * (sin fila de desplazamiento ahí, igual que en el diseño de referencia) — excepto el primero del
 * día, que conserva su conector (llegada/instalación) bajo la cabecera "Mañana".
 *
 * El modo de transporte de cada conector es propio de este panel: `modeOverrides` guarda las
 * elecciones puntuales por conector, `dayDefaultMode` es el predeterminado aplicado a todos cuando
 * se usa "Cambiar predeterminado en todos los lugares" — un override puntual posterior sigue
 * ganando sobre el predeterminado del día para ESE conector.
 *
 * Recálculo silencioso con el alojamiento real (sin aviso al usuario, solo actualiza tiempo/
 * distancia — nunca reordena paradas): el conector previo a la primera parada usa el alojamiento de
 * ANOCHE como origen (en vez del texto genérico) cuando el día continúa la misma estancia (`!travel`)
 * o es un salto de roadtrip de 1 noche (`isRoadtripHop`); y se añade un conector final, tras la
 * última parada, hacia el alojamiento de ESTA noche, cuando se conoce. Ninguno de los dos aparece si
 * el alojamiento correspondiente no está reservado todavía.
 */
export function DayDetailPanel({
  day,
  travel,
  isLastDay,
  origin,
  stay,
  nightSegmentDayId,
  previousNightSegmentDayId,
  isRoadtripHop,
  allDays,
  isFirstDayOfTrip,
  showCamperBlock,
  showRentalCarBlock,
  onBack,
}: DayDetailPanelProps) {
  const accommodationResolved = useRouteStore((state) => (stay ? Boolean(state.accommodationSelections[stay.segmentDayId]) : false))
  const tonightHotel = useRouteStore((state) => (nightSegmentDayId ? state.accommodationSelections[nightSegmentDayId] : undefined))
  const previousNightHotel = useRouteStore((state) =>
    previousNightSegmentDayId ? state.accommodationSelections[previousNightSegmentDayId] : undefined,
  )
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)
  const route = useRouteStore((state) => state.route)

  const [detailIndex, setDetailIndex] = useState<number | null>(null)
  const [arrivalSheetOpen, setArrivalSheetOpen] = useState(false)
  const [modeOverrides, setModeOverrides] = useState<Record<string, TransportMode>>({})
  const [dayDefaultMode, setDayDefaultMode] = useState<TransportMode | null>(null)
  const [hiddenConnectors, setHiddenConnectors] = useState<Set<string>>(new Set())
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [mapCollapsed, setMapCollapsed] = useState(false)
  // Distancias/tiempos reales (Directions API de Mapbox) que van sustituyendo al mock inicial de
  // cada conector parada→parada en cuanto resuelven — ver el useEffect más abajo y
  // refineConnectorWithRealDistance en mockDayDetail.ts. Empieza vacío: el primer render siempre
  // muestra el mock (instantáneo), nunca un spinner.
  const [refinedConnectors, setRefinedConnectors] = useState<Record<string, ConnectorInfo>>({})

  const arrivalDetail = travel
    ? buildArrivalDepartureDetail(isLastDay ? travel.fromCity : travel.toCity, origin, isLastDay ? 'departure' : 'arrival')
    : null
  // Modo de transporte para el pin morado del mapa de ArrivalDetailSheet (ver arrivalIcon.ts): el
  // día 1 y el de vuelta no tienen su propio TransportSegment (city_transitions solo cubre
  // transiciones ENTRE destinos del propio viaje, no el tramo origen↔destino) — para esos dos se usa
  // el modo elegido en el cuestionario (transport_option); cualquier otro día de traslado (cambio de
  // ciudad dentro de un viaje multidestino) sí tiene su propio day.transport.
  const arrivalTransportModeId =
    day.dayNumber === 1 || isLastDay ? (route?.transportContext.transport_option?.id ?? null) : (day.transport?.mode ?? null)

  const stops = resolveDisplayStops(day)
  const realStops: Stop[] = day.stops.length > 0 ? day.stops : seedStopsFromTemplate(day)
  const stopIdsKey = realStops.map((stop) => stop.id).join(',')

  // Progresivo: pide la distancia/tiempo REAL (Mapbox Directions) de cada conector parada→parada
  // en cuanto se conocen las paradas del día — el conector ya se ve con el mock instantáneo (ver
  // buildConnectorInfo más abajo) y este efecto solo lo sustituye si/cuando resuelve. No hace nada
  // para paradas de plantilla (coordenadas (0,0)): refineConnectorWithRealDistance devuelve null y
  // el mock se queda tal cual, sin re-render de más.
  useEffect(() => {
    let cancelled = false
    for (let index = 1; index < realStops.length; index++) {
      const connectorKey = `${day.id}-connector-${index}`
      refineConnectorWithRealDistance(realStops[index - 1].coordinates, realStops[index].coordinates).then((refined) => {
        if (!cancelled && refined) setRefinedConnectors((prev) => ({ ...prev, [connectorKey]: refined }))
      })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.id, stopIdsKey])

  const otherDays = allDays.filter((candidate) => candidate.id !== day.id)
  // Mismo índice que usa el mapa combinado de todos los días (CombinedDaysMapView.tsx) para asignar
  // color por día — así el círculo numerado de cada parada coincide exactamente con el color de ese
  // día ahí (fondo pastel + número en la versión oscura/saturada del mismo tono). `allDays` excluye
  // a propósito el día sintético de vuelta (ver DayList.tsx), así que si `day` ES ese día,
  // `findIndex` no lo encuentra (-1) — dayColor(-1) reventaría (DAY_COLORS[-1] es undefined). No
  // pasa nada con el fallback a 0: un día de vuelta nunca tiene paradas (buildMockStopsForDay corta
  // en seco con isReturnLeg), así que estos colores no llegan a pintarse ahí de todas formas.
  const dayIndex = Math.max(
    allDays.findIndex((candidate) => candidate.id === day.id),
    0,
  )
  const stopCircleBg = dayColorPastel(dayIndex)
  const stopCircleText = dayColorStrong(dayIndex)
  const useAccommodationOrigin = Boolean(previousNightHotel) && (!travel || isRoadtripHop)

  const tripStartIso = route?.answers.dateRange?.start
  const dateIso = tripStartIso ? addDaysToIso(tripStartIso, day.dayNumber - 1) : null
  // Paradas REALES del día (con coordenadas) para el mapa de StopDetailSheet — mismo orden que
  // `stops` (contenido rico mock/real), así que `realStops[index]` siempre es la pareja correcta.
  const dayStopRefs: DayStopRef[] = realStops.map((realStop) => ({
    id: realStop.id,
    name: realStop.name,
    coordinates: realStop.coordinates,
    photoUrl: realStop.photoUrl,
  }))
  // Nombres de ancla en minúsculas, para StopDetailSheet (tips con búsqueda web + caché vs. tip
  // simple) — vacío en rutas dev/manuales, que no pasan por /api/generate-anchors.
  const anchorNamesLower = new Set((route?.anchorNames ?? []).map((name) => name.toLowerCase()))

  // Un conector por parada (llegada/instalación → parada 1, o parada→parada) — calculado una sola
  // vez y reutilizado tanto para el render como para el resumen "km a pie" de la cabecera.
  const connectorEntries = stops.map((_stop, index) => {
    const connectorKey = `${day.id}-connector-${index}`
    const fromAccommodation = index === 0 && useAccommodationOrigin && previousNightHotel
    const connector = fromAccommodation
      ? buildAccommodationConnectorInfo(`${day.id}-from-accommodation-${previousNightHotel.id}`)
      : (refinedConnectors[connectorKey] ?? buildConnectorInfo(day.id, index))
    const fromName = fromAccommodation ? previousNightHotel.name : index === 0 ? (arrivalDetail ? arrivalDetail.cityName : day.city) : stops[index - 1].name
    return { connectorKey, connector, fromName }
  })
  const finalConnector: ConnectorInfo | null =
    stops.length > 0
      ? tonightHotel
        ? buildAccommodationConnectorInfo(`${day.id}-to-accommodation-${tonightHotel.id}`)
        : { hasRealDisplacement: false, label: 'Fin del día.' }
      : null

  const timeSlots = computeTimeSlots(stops)
  const totalWalkMeters = connectorEntries.reduce((sum, entry) => sum + (entry.connector.meters ?? 0), 0) + (finalConnector?.meters ?? 0)
  const totalActivityMinutes = stops.reduce((sum, stop) => sum + stop.durationMinutes, 0)
  const dayMarkers = buildDayMarkers(realStops, dayIndex)

  const renderConnector = (
    connectorKey: string,
    connector: ConnectorInfo,
    fromName: string,
    toName: string,
    addStopIndex: number,
  ) => {
    const resolvedMode = modeOverrides[connectorKey] ?? dayDefaultMode ?? DEFAULT_MODE
    if (hiddenConnectors.has(connectorKey)) return null
    return (
      <StopConnector
        connector={connector}
        fromName={fromName}
        toName={toName}
        mode={resolvedMode}
        onSelectMode={(selected) => setModeOverrides((prev) => ({ ...prev, [connectorKey]: selected }))}
        onHide={() => setHiddenConnectors((prev) => new Set(prev).add(connectorKey))}
        onSetDefaultForDay={(selected) => {
          setDayDefaultMode(selected)
          setModeOverrides({})
        }}
        onAddStop={() => setInsertAt(addStopIndex)}
      />
    )
  }

  return (
    <div className="map-cover-overlay fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
      {mapCollapsed ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-bg-card p-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            title="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-sm transition-colors hover:bg-bg-hover"
          >
            <BackIcon />
          </button>
          <button
            type="button"
            onClick={() => setMapCollapsed(false)}
            aria-label="Mostrar mapa"
            title="Mostrar mapa"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text-soft shadow-sm transition-colors hover:bg-bg-hover"
          >
            <MapToggleIcon mapVisible={false} />
          </button>
        </div>
      ) : (
        <div className="relative h-48 shrink-0">
          <StopsMapView markers={dayMarkers} />
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            title="Volver"
            className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-md transition-colors hover:bg-bg-hover"
          >
            <BackIcon />
          </button>
          <button
            type="button"
            onClick={() => setMapCollapsed(true)}
            aria-label="Ocultar mapa"
            title="Ocultar mapa"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text-soft shadow-md transition-colors hover:bg-bg-hover"
          >
            <MapToggleIcon mapVisible />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
            Día {day.dayNumber}
            {dateIso ? ` · ${formatShortDateEs(dateIso).toUpperCase()}` : ''}
          </p>
          <h1 className="font-display text-h1 font-bold text-text">{day.city}</h1>
          <div className="mt-2.5 mb-4 flex items-center gap-2.5 overflow-x-auto rounded-xl bg-bg-hover px-3 py-2.5 text-small text-text-soft">
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <SummaryPinIcon className="text-accent-hover" />
              {stops.length} parada{stops.length === 1 ? '' : 's'}
            </span>
            <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <SummaryWalkIcon className="text-accent-hover" />
              {formatWalkKm(totalWalkMeters)} a pie
            </span>
            <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <SummaryClockIcon className="text-accent-hover" />
              {formatActivityDuration(totalActivityMinutes)} actividad
            </span>
          </div>
        </div>

        <div className="space-y-2 px-3 pb-3">
          {isFirstDayOfTrip && showCamperBlock && <VehicleBlock kind="camper" />}

          {stay && !accommodationResolved && <AccommodationBlock city={day.city} segmentDayId={stay.segmentDayId} totalNights={stay.totalNights} />}

          {isFirstDayOfTrip && showRentalCarBlock && <VehicleBlock kind="rental-car" />}

          {arrivalDetail && (
            <button
              type="button"
              onClick={() => setArrivalSheetOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-hover"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-hover text-white" aria-hidden="true">
                ✈
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-text">{arrivalDetail.headline}</p>
                <p className="truncate text-caption text-text-soft">{arrivalDetail.subtitle}</p>
              </div>
            </button>
          )}

          {stops.map((stop, index) => {
            const { connectorKey, connector, fromName } = connectorEntries[index]
            const slot = timeSlots[index]
            const showSlotHeader = index === 0 || slot !== timeSlots[index - 1]
            const showConnector = index === 0 || slot === timeSlots[index - 1]

            return (
              <div key={stop.id}>
                {showSlotHeader && (
                  <p className="px-1 pb-1 pt-6 text-caption font-semibold uppercase tracking-wide text-text-muted">
                    {SLOT_LABELS[slot]}
                  </p>
                )}
                {showConnector && renderConnector(connectorKey, connector, fromName, stop.name, index)}
                <StopAccordion
                  index={index}
                  stop={stop}
                  circleBg={stopCircleBg}
                  circleText={stopCircleText}
                  onOpen={() => setDetailIndex(index)}
                  menu={<StopMenu dayId={day.id} city={day.city} stop={realStops[index]} index={index} realStops={realStops} otherDays={otherDays} />}
                />
              </div>
            )
          })}

          {stops.length > 0 &&
            finalConnector &&
            renderConnector(`${day.id}-connector-accommodation`, finalConnector, stops[stops.length - 1].name, tonightHotel?.name ?? '', stops.length)}

          {route && (
            <AttractionsFinder
              route={route}
              city={day.city}
              open={insertAt !== null}
              title="Añadir una parada"
              onPick={(newStop) => {
                if (day.stops.length === 0) seedDayStops(day.id, realStops)
                if (insertAt !== null) insertStopAt(day.id, insertAt, newStop)
                setInsertAt(null)
              }}
              onClose={() => setInsertAt(null)}
            />
          )}
        </div>
      </div>

      <StopDetailSheet
        stop={detailIndex !== null ? stops[detailIndex] : null}
        city={day.city}
        dayNumber={day.dayNumber}
        dateIso={dateIso}
        dayStops={dayStopRefs}
        isAnchor={detailIndex !== null && anchorNamesLower.has(stops[detailIndex].name.toLowerCase())}
        onClose={() => setDetailIndex(null)}
      />

      <ArrivalDetailSheet
        detail={arrivalSheetOpen ? arrivalDetail : null}
        dayNumber={day.dayNumber}
        dateIso={dateIso}
        dayStops={dayStopRefs}
        transportModeId={arrivalTransportModeId}
        onClose={() => setArrivalSheetOpen(false)}
      />
    </div>
  )
}
