import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import type { Coordinates, DayPlan, Stop } from '../../../lib/types'
import type { DayTravelInfo } from '../../../lib/dayTravelInfo'
import type { ConnectorInfo, TransportMode } from '../../../lib/mockDayDetail'
import { addDaysToIso } from '../../../lib/dateRange'
import { displayStopName } from '../../../lib/format'
import {
  buildCombinedDaysLines,
  buildCombinedDaysMarkers,
  buildExcursionDayLines,
  buildExcursionDayMarkers,
  buildSingleDayLine,
  buildSingleDayMarkers,
} from '../../../lib/routeMapMarkers'
import { minutesToTime, parseTimeToMinutes, roundToNearestQuarterHour, roundUpToQuarterHour } from '../../../lib/time'
import { parseOpeningMinutes } from '../../../lib/stopHoursTag'
import { buildCuratedStopDescription } from '../../../lib/describeStopApi'
import {
  buildAccommodationConnectorInfo,
  buildArrivalDepartureDetail,
  buildConnectorInfo,
  refineConnectorWithRealDistance,
  resolveDisplayStops,
  seedStopsFromTemplate,
} from '../../../lib/mockDayDetail'
import { useRouteStore } from '../../../store/useRouteStore'
import type { StopsMapMarker, StopsMapMarkerLine } from '../../map/StopsMapView'
import { dayColorIndex, dayColorPastel, dayColorStrong } from '../../../lib/dayColors'
import { excursionOfferDay } from '../../../lib/excursionOffer'
import { KIND_ICON, PERIOD_WITH_HEADER, stopNumbersOf, type DayPeriod } from '../../../lib/stopKind'
import { PeriodHeader, TrazoCard } from './TrazoCards'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { searchPlaces } from '../../../lib/mapboxGeocoding'
import { dinnerWindowFor } from '../../../lib/todayMode'
import {
  CuratedAlternativeBanner,
  BlankDayFullExcursion,
  ExcursionDayProposal,
  FreeAfternoonBlock,
  HalfDayExcursionBlock,
  ExcursionLink,
  ExcursionOptions,
  ManualDayOptions,
} from './ExcursionBlocks'
import { ZoneWalkCard } from './ZoneWalkCard'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableStop } from './SortableStop'
import { AccommodationBlock } from './AccommodationBlock'
import { ArrivalDetailSheet } from './ArrivalDetailSheet'
import { ArrivalReturnBar } from './ArrivalReturnBar'
import { ArrivalReturnSheet } from './ArrivalReturnSheet'
import { barTextOf, centerMinutesOf, leaveMinutesOf, medioOf, tripModes, useArrivalInfo, type ArrivalMode } from '../../../lib/arrivalReturn'
import { AddStopScreen } from '../addStop/AddStopScreen'
import { PlaceExplorerScreen } from '../placeExplorer/PlaceExplorerScreen'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { MealDetailSheet } from './MealDetailSheet'
import { MealTimeAccordion } from './MealTimeAccordion'
import { StopAccordion } from './StopAccordion'
import { WantInsideDialog, useWantInside } from './WantInsideDialog'
import { StopConnector } from './StopConnector'
import { StopDetailSheet, type DayStopRef } from './StopDetailSheet'
import { StopMenu } from './StopMenu'
import { VehicleBlock } from './VehicleBlock'
import { FreeTimeBlock } from './FreeTimeBlock'
import { AperitivoCard } from './AperitivoCard'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { estimatedWalkMinutes, hasOwnTime } from '../../../lib/freeDays'
import { freeDayStopWarning, placeHoursOnDate } from '../../../lib/placeHoursOnDate'

/** Por debajo de esto, lo que queda antes de cenar es caminar tranquilo; por encima, tiempo libre que se dice. */
const FREE_TIME_MIN_MINUTES = 45

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
  /** Día abierto como acordeón en la lista (diseño "Trazo Itinerario", 2026-09-27): el mapa es el
      compartido de RouteView, que enseña lo que este panel le publica aquí (null al cerrarse). */
  onMapChange?: (map: DayMapView | null) => void
  /** true mientras hay una pantalla completa con su propio mapa encima (ficha, comida, llegada,
      añadir parada): RouteView desmonta el suyo mientras tanto (ver dayDetailOpen en RouteView.tsx). */
  onOverlayChange?: (open: boolean) => void
  /** "Ver todo" del mapa compartido: todos los días a la vez en vez de solo este. */
  showAllDaysOnMap?: boolean
}

/** Lo que el día abierto enseña en el mapa compartido de RouteView. */
export interface DayMapView {
  markers: StopsMapMarker[]
  lines: StopsMapMarkerLine[]
  center: Coordinates | null
}

/** Un elemento de la línea del día, en orden: parada, comida, cena, tiempo libre o el hueco final. */
type TimelineItem =
  | { type: 'stop'; index: number }
  | { type: 'free'; index: number; entry: FreeTimeEntry }
  | { type: 'lunch'; index: number }
  | { type: 'dinnerFree'; index: number }
  | { type: 'dinner'; index: number }
  /** El hueco con "+ Añadir parada" antes de la comida o la cena: al final del tramo de antes. */
  | { type: 'mealGap'; index: number }
  | { type: 'end' }

interface PlacedItem {
  item: TimelineItem
  period: DayPeriod
  start: number
  end: number
}

const DEFAULT_MODE: TransportMode = 'walking'
/**
 * A partir de cuántos minutos a pie deja de tener sentido enseñar el tramo como un paseo. Por
 * debajo, andar es lo natural en una ciudad y lo que el viajero va a hacer igualmente; por encima,
 * enseñarle "35 min a pie" como única opción es esconderle que hay metro. Sobre este umbral el hueco
 * pasa a mostrar el transporte propio del destino (ver Route.defaultTransport) con el tiempo a pie
 * debajo como alternativa — nunca desaparece, solo deja de ser lo primero.
 */
const LONG_WALK_MINUTES = 20
/** Hora asumida de inicio de la jornada cuando la primera parada no trae una `time` real (rutas dev/plantilla) — ver `computeStopSchedule`. */
const DAY_START_MINUTES = 9 * 60
/** Sin comida en el día (media jornada, día libre), la tarde empieza aquí. */
const AFTERNOON_FROM = 14 * 60
/** Minutos a pie entre dos paradas cuando el conector no trae un `walkMinutes` real todavía (ni mock ni refinado por Mapbox) — mismo valor de reserva que `retimeStops` en useRouteStore.ts, para que el horario calculado aquí no se desvíe del que ya usa Modo Hoy. */
const DEFAULT_WALK_MINUTES = 15
/** Una nocturna añadida a mano empieza esto después de la hora de la cena (20:00 → 21:30, como el motor). */
const NIGHT_AFTER_DINNER_MINUTES = 90
/** Entre dos nocturnas seguidas. */
const NIGHT_GAP_MINUTES = 10
/** Duración de una nocturna sin la suya en el JSON. */
const NIGHT_DEFAULT_MINUTES = 30

/** Clave de un conector: el par de paradas que une (la primera, la llegada del día), no su posición. */
function pairConnectorKey(dayId: string, stops: Stop[], index: number): string {
  return index === 0 || !stops[index - 1] || !stops[index] ? `${dayId}-connector-${index}` : `${dayId}-${stops[index - 1].id}>${stops[index].id}`
}
/** El otro extremo de un tiempo libre cuando es la comida (lo que manda el motor v3). */
const LUNCH_FREE_LABEL = 'la comida'
type FreeTimeEntry = NonNullable<DayPlan['freeTime']> & { title?: string | null }
/** Los huecos con nombre del día: la lista nueva o, de rutas guardadas antes, el único que había. */
const freeTimesOf = (day: DayPlan): FreeTimeEntry[] => day.freeTimes ?? (day.freeTime ? [day.freeTime] : [])

type TimeSlot = 'mañana' | 'tarde' | 'noche'


interface StopSchedule {
  slot: TimeSlot
  startMinutes: number
  endMinutes: number
}

/**
 * Hora de inicio/fin real de cada parada, acumulando desde `firstStopStartMinutes` (la `time` real
 * de la primera parada cuando la trae — rutas generadas por IA, ver `suggested_time` en
 * mapGeneratedRoute.ts — o `DAY_START_MINUTES` si no) + su `durationMinutes` + los minutos a pie
 * REALES hasta la siguiente (del propio conector ya calculado para esa parada, refinado por Mapbox
 * cuando hay coordenadas reales — ver `connectorEntries`/`walkMinutes` en ConnectorInfo, mismo dato
 * que ya alimenta el resumen "X km a pie"). Mismo reloj acumulado que `retimeStops` en
 * useRouteStore.ts (la base de Modo Hoy), reutilizado aquí en vez de reinventado — solo que además
 * usa el conector YA refinado por Mapbox en vez de un `?? 15` genérico cuando está disponible. El
 * tercio del día (Mañana/Tarde/Noche) se deriva de esta misma hora de inicio, ya no de un
 * acumulador propio aparte.
 */
function computeStopSchedule(
  stops: { durationMinutes: number }[],
  walkMinutesBetween: (index: number) => number,
  firstStopStartMinutes: number,
): StopSchedule[] {
  let minutes = firstStopStartMinutes
  return stops.map((stop, index) => {
    if (index > 0) minutes = roundToNearestQuarterHour(minutes + stops[index - 1].durationMinutes + walkMinutesBetween(index))
    const startMinutes = minutes
    const endMinutes = startMinutes + stop.durationMinutes
    const slot: TimeSlot = startMinutes < 13 * 60 ? 'mañana' : startMinutes < 19 * 60 ? 'tarde' : 'noche'
    return { slot, startMinutes, endMinutes }
  })
}

const LUNCH_WINDOW: [number, number] = [13 * 60, 14 * 60 + 30]

/** Índice de la parada TRAS la que insertar el acordeón dorado "Hora de comer"/"Hora de cenar" — el primer hueco (entre esa parada y la siguiente, o tras la última si el día termina dentro de la ventana) cuyo rango se solapa con la franja horaria dada. null si el día nunca llega a cruzarla (ej. un día corto que termina a las 12:00). */
function findMealInsertionIndex(schedule: StopSchedule[], window: [number, number]): number | null {
  for (let index = 0; index < schedule.length; index++) {
    const gapStart = schedule[index].endMinutes
    const gapEnd = index + 1 < schedule.length ? schedule[index + 1].startMinutes : Infinity
    if (gapEnd >= window[0] && gapStart <= window[1]) return index
  }
  return null
}

function formatWalkKm(totalMeters: number): string {
  if (totalMeters <= 0) return '0 km'
  return `${(totalMeters / 1000).toFixed(1).replace('.', ',')} km`
}

/** «7 h 30», «45 min» (de 5 en 5). */
function formatActivityDuration(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes / 5) * 5
  if (minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const rest = minutes % 60
  return rest === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, '0')}`
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
 * agrupadas por franja horaria (Mañana/Tarde/Noche, ver `computeStopSchedule`) conectadas por
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
  onMapChange,
  onOverlayChange,
  showAllDaysOnMap = false,
}: DayDetailPanelProps) {
  const accommodationResolved = useRouteStore((state) => (stay ? Boolean(state.accommodationSelections[stay.segmentDayId]) : false))
  const tonightHotel = useRouteStore((state) => (nightSegmentDayId ? state.accommodationSelections[nightSegmentDayId] : undefined))
  const previousNightHotel = useRouteStore((state) =>
    previousNightSegmentDayId ? state.accommodationSelections[previousNightSegmentDayId] : undefined,
  )
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)
  const convertDayType = useRouteStore((state) => state.convertDayType)
  const openAddFlow = useAddFlowStore((state) => state.openAddFlow)
  const focusStopId = useAddFlowStore((state) => state.focusStopId)
  const setFocusStopId = useAddFlowStore((state) => state.setFocusStopId)
  const panelRef = useRef<HTMLDivElement>(null)
  // Recién añadida desde la pantalla de añadir: se desplaza hasta ella.
  useEffect(() => {
    if (!focusStopId) return
    const target = panelRef.current?.querySelector(`[data-stop-id="${focusStopId}"]`)
    if (!target) return
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFocusStopId(null)
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusStopId, day.stops.length])
  const reorderStops = useRouteStore((state) => state.reorderStops)
  const setLegToNext = useRouteStore((state) => state.setLegToNext)
  // Prompt 6: paseos que el viajero ha quitado. No vuelven a proponerse en este día — "el algoritmo
  // propone, el viajero dispone". Vive en el panel y no en el store porque el paseo tampoco es una
  // parada real: no está en day.stops del store, lo añade el servidor al generar.
  const [dismissedWalks, setDismissedWalks] = useState<Set<string>>(new Set())
  /** Aviso tras arrastrar una parada a un hueco en el que su sitio todavía está cerrado. */
  const [reorderWarning, setReorderWarning] = useState<string | null>(null)
  const selectDayExcursion = useRouteStore((state) => state.selectDayExcursion)
  const declineHalfDayExcursion = useRouteStore((state) => state.declineHalfDayExcursion)
  const addBlankDayExcursion = useRouteStore((state) => state.addBlankDayExcursion)
  const route = useRouteStore((state) => state.route)
  // "Quiero entrar" (PROMPT_PENDIENTE F): rehacer este día con una parada por dentro.
  const wantInside = useWantInside(route, day)

  const [detailIndex, setDetailIndex] = useState<number | null>(null)
  const [arrivalSheetOpen, setArrivalSheetOpen] = useState(false)
  // Qué bloque de comida/cena está abierto a pantalla completa (MealDetailSheet) — `stopIndex` es la
  // parada tras la que cae esa franja (ancla geográfica), mismo dato que antes recibía
  // MealTimeAccordion directamente. null = cerrado.
  const [mealSheet, setMealSheet] = useState<{ franja: 'comida' | 'cena'; stopIndex: number; coordinates?: Coordinates } | null>(null)
  // Día con excursión de medio día y sin paradas de tarde: los restaurantes de la vuelta se
  // ofrecen en el centro de la ciudad del día (mismo geocodificado que "Añadir parada").
  const [cityCenter, setCityCenter] = useState<Coordinates | null>(null)
  const needsCityCenter = Boolean(day.halfDayExcursion && !day.halfDayExcursionDeclined) && !day.stops.some((stop) => hasRealCoordinates(stop.coordinates))
  useEffect(() => {
    if (!needsCityCenter) return
    let cancelled = false
    searchPlaces(day.city).then((places) => {
      if (!cancelled) setCityCenter(places[0]?.coordinates ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [needsCityCenter, day.city])
  const [modeOverrides, setModeOverrides] = useState<Record<string, TransportMode>>({})
  const [dayDefaultMode, setDayDefaultMode] = useState<TransportMode | null>(null)
  const [hiddenConnectors, setHiddenConnectors] = useState<Set<string>>(new Set())
  const [insertAt, setInsertAt] = useState<number | null>(null)
  // El "+" que se ha pulsado está después de la cena: lo que se puede ver de noche entra como nocturna.
  const [insertAfterDinner, setInsertAfterDinner] = useState(false)
  /** Dónde centrar "Añadir parada" cuando se abre desde el bloque de tiempo libre: donde está el viajero. */
  const [addStopFocus, setAddStopFocus] = useState<Coordinates | null>(null)
  /** Precarga del buscador de AddStopScreen cuando se abre desde el botón "Añadir como parada" de una tarjeta de segunda visita recomendada (ver day.recommendedRevisits) — undefined = buscador vacío, comportamiento normal del "+". */
  const [addStopInitialQuery, setAddStopInitialQuery] = useState<string | undefined>(undefined)
  const [dismissedRevisits, setDismissedRevisits] = useState<Set<string>>(new Set())
  // Distancias/tiempos reales (Directions API de Mapbox) que van sustituyendo al mock inicial de
  // cada conector parada→parada en cuanto resuelven — ver el useEffect más abajo y
  // refineConnectorWithRealDistance en mockDayDetail.ts. Empieza vacío: el primer render siempre
  // muestra el mock (instantáneo), nunca un spinner.
  const [refinedConnectors, setRefinedConnectors] = useState<Record<string, ConnectorInfo>>({})
  const refinedConnectorsRef = useRef(refinedConnectors)
  refinedConnectorsRef.current = refinedConnectors

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

  // La llegada y la vuelta (PROMPT_UI, Parte 3): van con la POSICIÓN, no con el día — la llegada en el primer día del
  // viaje y la vuelta en el último, así que si se borra o se mueve uno, el nuevo primero o último las hereda. La hora
  // en el centro y la de salir marcan las paradas que no caben («Llegas después», «Ya te has ido»).
  const arrivalInfo = useArrivalInfo(route?.destination ?? day.city, day.city, origin)
  const modes: { arrival: ArrivalMode; departure: ArrivalMode } = route ? tripModes(route) : { arrival: 'avion', departure: 'avion' }
  const arrivalMedio = medioOf(arrivalInfo, modes.arrival)
  const departureMedio = medioOf(arrivalInfo, modes.departure)
  const arrivalPoint = arrivalMedio?.puntos.find((point) => point.id === route?.arrivalPointId) ?? arrivalMedio?.puntos[0] ?? null
  const departurePoint = departureMedio?.puntos.find((point) => point.id === route?.departurePointId) ?? departureMedio?.puntos[0] ?? null
  const arrivalTime = route?.arrivalFlightTime ?? null
  const departureTime = route?.departureFlightTime ?? null
  const centerMinutes = isFirstDayOfTrip && modes.arrival !== 'coche' ? centerMinutesOf(arrivalTime, arrivalPoint) : null
  const leaveMinutes = isLastDay ? leaveMinutesOf(departureTime, modes.departure, departureMedio) : null
  const arrivalBarText = barTextOf({ kind: 'llegada', mode: modes.arrival, point: arrivalPoint, origin, time: modes.arrival === 'coche' ? null : arrivalTime, keyMinutes: centerMinutes })
  const returnBarText = barTextOf({ kind: 'vuelta', mode: modes.departure, point: departurePoint, origin, time: modes.departure === 'coche' ? null : departureTime, keyMinutes: leaveMinutes })
  const [arrivalSheet, setArrivalSheet] = useState<'llegada' | 'vuelta' | null>(null)
  const setArrivalPointId = useRouteStore((state) => state.setArrivalPointId)
  const fitDayToTrip = useRouteStore((state) => state.fitDayToTrip)
  const setMode = useRouteStore((state) => state.setMode)
  /** «+ AÑADIR VUELO» y «Editar»: a Reservas, a la casilla de esa hora. */
  const goToBooking = (which: 'llegada' | 'vuelta') => {
    setArrivalSheet(null)
    setMode('bookings')
    window.setTimeout(() => {
      const input = document.getElementById(which === 'llegada' ? 'reservas-hora-llegada' : 'reservas-hora-salida') as HTMLInputElement | null
      input?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      input?.focus()
    }, 450)
  }

  const stops = resolveDisplayStops(day)
  // Un día LIBRE está vacío a propósito y no tiene plantilla que cristalizar — misma distinción que
  // hace resolveDisplayStops, y tiene que ser la misma o los dos arrays dejan de ir en paralelo.
  //
  // Sin esto, añadir la primera parada a un día en blanco le metía la plantilla mock ENTERA: el
  // lugar elegido entraba bien y detrás aparecían "Catedral de Roma" y "Yacimiento arqueológico de
  // Roma" a las 09:00, que no son lugares, son relleno de maqueta.
  const realStops: Stop[] = day.stops.length > 0 || (day.dayType ?? 'normal') === 'manual' ? day.stops : seedStopsFromTemplate(day)
  const stopIdsKey = realStops.map((stop) => stop.id).join(',')

  // Progresivo: pide la distancia/tiempo REAL (Mapbox Directions) de cada conector parada→parada
  // en cuanto se conocen las paradas del día — el conector ya se ve con el mock instantáneo (ver
  // buildConnectorInfo más abajo) y este efecto solo lo sustituye si/cuando resuelve. No hace nada
  // para paradas de plantilla (coordenadas (0,0)): refineConnectorWithRealDistance devuelve null y
  // el mock se queda tal cual, sin re-render de más.
  //
  // La clave es el PAR de paradas, no la posición: al quitar una, las demás se quedan con su tramo ya
  // resuelto y solo se pide el del par que queda junto. Si ese tramo estaba pendiente (nextLegPending,
  // ver withoutStop en el store), se guarda su tiempo a pie y la siguiente se mueve solo si hace falta.
  useEffect(() => {
    let cancelled = false
    for (let index = 1; index < realStops.length; index++) {
      const previousStop = realStops[index - 1]
      const connectorKey = pairConnectorKey(day.id, realStops, index)
      const known = refinedConnectorsRef.current[connectorKey]
      if (known) {
        if (previousStop.nextLegPending && known.walkMinutes != null) setLegToNext(day.id, previousStop.id, known.walkMinutes)
        continue
      }
      refineConnectorWithRealDistance(previousStop.coordinates, realStops[index].coordinates).then((refined) => {
        if (cancelled || !refined) return
        setRefinedConnectors((prev) => ({ ...prev, [connectorKey]: refined }))
        if (previousStop.nextLegPending && refined.walkMinutes != null) setLegToNext(day.id, previousStop.id, refined.walkMinutes)
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
  const dayIndex = dayColorIndex(day, allDays.findIndex((candidate) => candidate.id === day.id))
  /** Los números de las paradas, del color del día, como sus pines (PROMPT_UI, Parte 2): relleno claro y número fuerte. */
  const numberColors = { bg: dayColorPastel(dayIndex), text: dayColorStrong(dayIndex) }
  // El primero de los días en blanco por límite: es el único que lleva la explicación.
  // `allDays` viene recortado a id/número/ciudad, así que la marca se busca en la ruta entera.
  const isFirstBeyondAutoDay = (route?.days ?? []).find((candidate) => candidate.beyondAutoDays)?.id === day.id

  // Arrastrar paradas para cambiarlas de orden dentro del día. El umbral de 8 px evita que un tap
  // torpe cuente como arrastre, y el retardo en táctil deja que el dedo haga scroll por la lista
  // sin secuestrar el gesto a la primera.
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  )

  const handleStopDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = realStops.map((realStop) => realStop.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    const next = [...ids]
    next.splice(to, 0, next.splice(from, 1)[0])
    // Mientras las paradas del día sigan siendo la plantilla, `day.stops` está vacío y el store no
    // encuentra nada que reordenar: hay que cristalizarlas primero, igual que hace añadir una
    // parada. Sin esto el arrastre se ve, suelta, y no pasa absolutamente nada.
    if (day.stops.length === 0) seedDayStops(day.id, realStops)

    // Mover una parada puede dejarla antes de que su sitio abra. No se impide —el viajero manda—
    // pero se dice, porque es justo lo que no se ve a simple vista al arrastrar.
    const movedStop = realStops[from]
    const nuevaPosicion = schedule[to]
    // El horario se lee de la parada MOSTRADA, en el mismo orden de preferencia que la tarjeta
    // (ver StopAccordion): así el aviso y lo que el viajero está leyendo en pantalla dicen la
    // misma hora, en vez de que uno hable del horario general y el otro del de esta visita.
    const mostrada = stops[from]
    const abreA = parseOpeningMinutes(
      mostrada?.scheduleText ?? mostrada?.hours ?? movedStop?.scheduleText ?? movedStop?.hours ?? null,
    )
    if (movedStop && nuevaPosicion && abreA !== null && nuevaPosicion.startMinutes < abreA) {
      setReorderWarning(`${movedStop.name} abre a las ${minutesToTime(abreA)} — en ese hueco todavía está cerrado.`)
    } else {
      setReorderWarning(null)
    }
    // El store recoloca las horas por posición (reassignTimesByPosition): la parada que pasa a ser
    // la tercera hereda el hueco de la tercera, no se lleva su hora antigua a otro sitio del día.
    reorderStops(day.id, next)
  }
  // El número de cada tarjeta es el de su pin en el mapa: misma lista y mismo orden de hora (stopNumbersOf).
  const stopNumbers = stopNumbersOf(day)
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
    const connectorKey = pairConnectorKey(day.id, realStops, index)
    const fromAccommodation = index === 0 && useAccommodationOrigin && previousNightHotel
    const connector = fromAccommodation
      ? buildAccommodationConnectorInfo(`${day.id}-from-accommodation-${previousNightHotel.id}`)
      : (refinedConnectors[connectorKey] ?? buildConnectorInfo(day.id, index))
    const fromName = fromAccommodation ? previousNightHotel.name : index === 0 ? (arrivalDetail ? arrivalDetail.cityName : day.city) : stops[index - 1].name
    return { connectorKey, connector, fromName, fromAccommodation: Boolean(fromAccommodation) }
  })
  const finalConnector: ConnectorInfo | null =
    stops.length > 0
      ? tonightHotel
        ? buildAccommodationConnectorInfo(`${day.id}-to-accommodation-${tonightHotel.id}`)
        : { hasRealDisplacement: false, label: 'Fin del día.' }
      : null

  // Prompt 6: un paseo por barrio es una sugerencia para un hueco, no un lugar que el viaje
  // incluya — no se cuenta ni en "N paradas" ni en el mapa (ver realStops en routeMapMarkers.ts).
  // Las mismas que llevan número (sin pausas, paseos, "de paso" ni tiempo libre): igual que la tarjeta cerrada del día.
  const visitCount = stopNumbers.size
  // Los metros hasta el paseo tampoco cuentan: su conector ni siquiera se pinta (no se va a un
  // barrio, se pasea por él), así que sumarlos falsearía el "a pie" de la cabecera.
  const totalWalkMeters =
    connectorEntries.reduce((sum, entry, index) => (realStops[index]?.isZoneWalk ? sum : sum + (entry.connector.meters ?? 0)), 0) +
    (finalConnector?.meters ?? 0)
  const totalActivityMinutes = stops.reduce((sum, stop) => sum + stop.durationMinutes, 0)
  // Ronda 9 (Mejora 1A/1C): "solo este día" es la vista por defecto (marcadores + línea de ruta de
  // este día únicamente, mismo color que su círculo numerado) — "Ver todo" cambia a todos los días
  // a la vez, con el activo a opacidad completa y el resto atenuado (BLOQUE B, feedback de calidad:
  // "el mapa solo marca un lugar" — sigue disponible, ahora es opcional en vez de forzoso).
  const routeDayMarkers = showAllDaysOnMap ? buildCombinedDaysMarkers(route?.days ?? [day], day.id) : buildSingleDayMarkers(day, dayIndex)
  // Catálogo curado de la ciudad (solo se pide cuando se abre el "+"): si lo hay, "Añadir parada" es
  // la pantalla nueva de lugares del destino; si no, sigue siendo el buscador de POIs de Mapbox de
  // siempre, que funciona en cualquier ciudad aunque no tengamos JSON escrito para ella.
  /** "Cambiar" restaurante de una comida o una cena: el mapa de restaurantes de su zona. */
  const [mealPicker, setMealPicker] = useState<{ mealTime: 'lunch' | 'dinner'; coordinates: Coordinates | null; zone: string | null } | null>(null)
  const setMealRestaurant = useRouteStore((state) => state.setMealRestaurant)
  const { places: curatedPool, excursions: curatedExcursions, resolved: curatedPoolResolved } = useDestinationPool(day.city, insertAt !== null || mealPicker !== null)
  /** El restaurante de la comida o la cena: el que ha elegido el viajero o, si no, el recomendado. */
  const restaurantOf = (mealTime: 'lunch' | 'dinner') => {
    const meal = day.meals.find((candidate) => candidate.mealTime === mealTime)
    return meal?.chosenRestaurant ?? meal?.recommendedRestaurant ?? null
  }
  /** Los minutos andando que se enseñan, medidos desde el restaurante: ninguna hora se mueve al cambiarlo. */
  const mealWalkNote = (mealTime: 'lunch' | 'dinner', index: number): string | null => {
    const restaurant = restaurantOf(mealTime)
    if (!restaurant) return null
    const before = realStops[index]
    const after = realStops.slice(index + 1).find((candidate) => !candidate.isNightExperience)
    // Desde el bloque de justo antes (PROMPT_UI_REPASO 14): con aperitivo antes de cenar, desde el aperitivo, no desde la
    // última parada; y a menos de 1 min, «Justo al lado».
    const fromAperitivo = mealTime === 'dinner' && Boolean(day.aperitivo)
    const fromName = fromAperitivo ? 'el aperitivo' : before?.name
    const walkFrom = before ? estimatedWalkMinutes(before.coordinates, restaurant.coordinates) : null
    const parts = [
      before && fromName ? (walkFrom != null && walkFrom < 1 ? `Justo al lado de ${fromName}` : `${walkFrom} min andando desde ${fromName}`) : null,
      after ? `${estimatedWalkMinutes(restaurant.coordinates, after.coordinates)} min hasta ${after.name}` : null,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' · ') : null
  }
  const openMealPicker = (mealTime: 'lunch' | 'dinner') => {
    const restaurant = restaurantOf(mealTime)
    const meal = day.meals.find((candidate) => candidate.mealTime === mealTime)
    setMealPicker({ mealTime, coordinates: restaurant?.coordinates ?? meal?.coordinates ?? null, zone: restaurant?.zone ?? meal?.curatedZone ?? null })
  }

  // "+" entre dos paradas: el lugar elegido entra EXACTAMENTE en ese hueco (no al final del día), y
  // a partir de ahí manda el store — recalcula solo el tramo con la parada anterior y redondea al
  // cuarto más cercano, sin volver a replanificar nada del día (ver insertStopAt en useRouteStore.ts).
  const addStopBefore = insertAt !== null && insertAt > 0 ? (realStops[insertAt - 1]?.name ?? null) : null
  const addStopAfter = insertAt !== null && insertAt < realStops.length ? (realStops[insertAt]?.name ?? null) : null
  const addStopSubtitle = addStopBefore && addStopAfter ? `Entre ${addStopBefore} y ${addStopAfter}` : addStopBefore ? `Después de ${addStopBefore}` : addStopAfter ? `Antes de ${addStopAfter}` : day.city

  const addPickedStop = (picked: Stop) => {
    if (day.stops.length === 0) seedDayStops(day.id, realStops)
    const newStop = insertAfterDinner && insertAt !== null ? asNightExperience(picked, insertAt) : picked
    // La primera parada de una tarde que arranca tras una excursión de medio día empieza a las
    // 16:00, no a la hora de siempre: el viajero está volviendo hasta entonces. A partir de ahí el
    // store encadena las demás desde esta, como en cualquier otro día.
    const conHoraDeTarde =
      day.halfDayExcursion && !day.halfDayExcursionDeclined && day.stops.length === 0
        ? { ...newStop, time: day.halfDayExcursion.routeStartsAt }
        : newStop
    if (insertAt !== null) insertStopAt(day.id, insertAt, conHoraDeTarde)
    setInsertAt(null)
    setInsertAfterDinner(false)
    setAddStopInitialQuery(undefined)
    setAddStopFocus(null)
  }

  /**
   * Bug del 2026-09-26: un lugar que se puede ver de noche (el Coliseo, la Fontana de Trevi) añadido
   * después de la cena entraba como una parada normal, encadenada a la última de la tarde. Ahora entra
   * como su experiencia nocturna (la del JSON si la hay), después de cenar o de la nocturna anterior.
   */
  const asNightExperience = (stop: Stop, index: number): Stop => {
    const place = curatedPool.find((candidate) => candidate.name === stop.name)
    if (!place?.night_experience) return stop
    const dinner = day.meals.find((meal) => meal.mealTime === 'dinner')
    const dinnerStart = dinner ? parseTimeToMinutes(dinner.time) : NaN
    const afterDinner = (Number.isNaN(dinnerStart) ? dinnerWindowFor(day)[0] : dinnerStart) + NIGHT_AFTER_DINNER_MINUTES
    const previousNight = [...realStops.slice(0, index)].reverse().find((candidate) => candidate.isNightExperience)
    const previousNightEnd = previousNight ? parseTimeToMinutes(previousNight.time) + previousNight.durationMinutes + NIGHT_GAP_MINUTES : NaN
    const start = roundUpToQuarterHour(Number.isNaN(previousNightEnd) ? afterDinner : Math.max(afterDinner, previousNightEnd))
    return {
      ...stop,
      name: place.night?.name ?? `${stop.name} (noche)`,
      durationMinutes: place.night?.duration_min ?? NIGHT_DEFAULT_MINUTES,
      time: minutesToTime(start),
      hours: null,
      isNightExperience: true,
    }
  }

  const closeAddStop = () => {
    setInsertAt(null)
    setInsertAfterDinner(false)
    setAddStopInitialQuery(undefined)
    setAddStopFocus(null)
  }
  const routeDayLines = showAllDaysOnMap ? buildCombinedDaysLines(route?.days ?? [day], day.id) : buildSingleDayLine(day, dayIndex)

  // Hora real de inicio de cada parada: si el día ya tiene paradas REALES (editadas a mano o
  // generadas por IA, day.stops.length > 0), cada una trae su propia `time` fiable — real
  // suggested_time de Claude, o recalculada por retimeStops en cada edición del store (añadir/
  // quitar/insertar/mover, ver useRouteStore.ts) — así que se muestra tal cual, exactamente igual
  // que ya hace Modo Hoy (getStopPlannedWindow en todayMode.ts), sin recalcular nada aquí. Un día
  // 100% de plantilla (sin editar todavía) no tiene ninguna `time` real que mostrar — ahí sí se
  // acumula desde DAY_START_MINUTES con la duración real de cada parada + el tiempo a pie del
  // conector (refinado por Mapbox cuando hay coordenadas reales), ver computeStopSchedule.
  const schedule: StopSchedule[] =
    day.stops.length > 0
      ? stops.map((stop, index) => {
          const rawTime = realStops[index]?.time
          const parsed = rawTime ? parseTimeToMinutes(rawTime) : NaN
          const startMinutes = Number.isNaN(parsed) ? DAY_START_MINUTES : parsed
          const endMinutes = startMinutes + stop.durationMinutes
          // Para días del pipeline v2 (day.timesAreFinal), NOCHE es SOLO para paradas de "experiencia
          // nocturna" reales (stop.isNightExperience) — no un umbral de hora, o una parada de relleno
          // normal a las 19:00+ (p.ej. Regla A del algoritmo) se clasificaría como NOCHE por error.
          // El resto de destinos (Claude-driven) sigue usando el umbral de hora de siempre — ahí no
          // existe el flag, y quitar el umbral les dejaría sin sección NOCHE en absoluto.
          const slot: TimeSlot = day.timesAreFinal
            ? realStops[index]?.isNightExperience
              ? 'noche'
              : startMinutes < 13 * 60
                ? 'mañana'
                : 'tarde'
            : startMinutes < 13 * 60
              ? 'mañana'
              : startMinutes < 19 * 60
                ? 'tarde'
                : 'noche'
          return { slot, startMinutes, endMinutes }
        })
      : computeStopSchedule(stops, (index) => connectorEntries[index].connector.walkMinutes ?? DEFAULT_WALK_MINUTES, DAY_START_MINUTES)

  // Acordeón dorado "Hora de comer"/"Hora de cenar" — se inserta tras la parada donde cae ese hueco
  // del timeline (ver findMealInsertionIndex), anclado a las coordenadas de ESA parada tanto para
  // geocodificar el barrio como para "Rápido y cerca" (MealTimeAccordion.tsx). route?.destination
  // solo falta en rutas sin generar aún (no debería pasar aquí, pero evita reventar el render).
  const lunchCuratedZone = day.meals.find((meal) => meal.mealTime === 'lunch')?.curatedZone ?? null
  const dinnerCuratedZone = day.meals.find((meal) => meal.mealTime === 'dinner')?.curatedZone ?? null
  const lunchCuratedZoneDisplay = day.meals.find((meal) => meal.mealTime === 'lunch')?.curatedZoneDisplay ?? null
  const dinnerCuratedZoneDisplay = day.meals.find((meal) => meal.mealTime === 'dinner')?.curatedZoneDisplay ?? null
  // Con la franja del motor (v3), la comida va en su posición REAL: detrás de la última parada que
  // empieza antes de la franja. Sin franja (rutas antiguas), por la ventana de siempre.
  const lunchMeal = day.meals.find((meal) => meal.mealTime === 'lunch')
  const lunchStart = lunchMeal?.windowEnd ? parseTimeToMinutes(lunchMeal.time) : NaN
  const lastBeforeLunch = Number.isNaN(lunchStart) ? -1 : schedule.filter((item) => item.startMinutes < lunchStart).length - 1
  // «Ajustar este día a tu llegada / vuelta» quita la comida o la cena que ya no toca (antes de llegar, después de irte):
  // sin ella en el día, el primer o el último día no la vuelven a poner por franja.
  const mealDroppedByTrip = (mealTime: 'lunch' | 'dinner') => (centerMinutes != null || leaveMinutes != null) && day.meals.length > 0 && !day.meals.some((meal) => meal.mealTime === mealTime)
  const lunchInsertionIndex = mealDroppedByTrip('lunch') ? null : lastBeforeLunch >= 0 ? lastBeforeLunch : findMealInsertionIndex(schedule, LUNCH_WINDOW)
  const lunchTimeRange = lunchMeal?.windowEnd ? `${lunchMeal.time} – ${lunchMeal.windowEnd}` : null
  const lunchCoordinates = lunchMeal?.coordinates && hasRealCoordinates(lunchMeal.coordinates) ? lunchMeal.coordinates : null
  // La ventana de cena la decide el día (20:00 o 20:30, ver dinnerWindowFor) — ya no es constante.
  const dinnerInsertionIndex = mealDroppedByTrip('dinner') ? null : findMealInsertionIndex(schedule, dinnerWindowFor(day))
  const destino = route?.destination ?? day.city

  /**
   * Un hueco del timeline. Se pinta SIEMPRE (ver StopConnector): la cadena "+ Añadir parada" no
   * puede tener agujeros, porque el hueco es el único sitio desde el que se inserta una parada ahí.
   * `connector` a null = hueco sin información de desplazamiento que mostrar (antes de la primera
   * parada, cambio de franja, junto a un bloque de comida, o un conector que el viajero ocultó);
   * el botón sigue estando.
   */
  /** Modo que se enseña en un hueco mientras el viajero no elija otro — ver LONG_WALK_MINUTES. */
  const defaultModeFor = (connector: ConnectorInfo | null): TransportMode => {
    const walkMinutes = connector?.walkMinutes
    if (walkMinutes === undefined || walkMinutes <= LONG_WALK_MINUTES) return DEFAULT_MODE
    if ((route?.defaultTransport ?? 'public') === 'car') return 'driving'
    // Transporte público solo si ahorra tiempo real puerta a puerta; si no, a pie.
    return connector?.transitSavesTime ? 'transit' : DEFAULT_MODE
  }

  const renderGap = (
    connectorKey: string,
    connector: ConnectorInfo | null,
    fromName: string,
    toName: string,
    addStopIndex: number,
    afterDinner = false,
    transitLabel: string | null = null,
  ) => {
    const resolvedMode = modeOverrides[connectorKey] ?? dayDefaultMode ?? defaultModeFor(connector)
    return (
      <StopConnector
        key={connectorKey}
        connector={hiddenConnectors.has(connectorKey) ? null : connector}
        transitLabel={transitLabel}
        fromName={fromName}
        toName={toName}
        mode={resolvedMode}
        onSelectMode={(selected) => setModeOverrides((prev) => ({ ...prev, [connectorKey]: selected }))}
        onHide={() => setHiddenConnectors((prev) => new Set(prev).add(connectorKey))}
        onSetDefaultForDay={(selected) => {
          setDayDefaultMode(selected)
          setModeOverrides({})
        }}
        onAddStop={() => {
          setInsertAt(addStopIndex)
          setInsertAfterDinner(afterDinner)
        }}
      />
    )
  }

  // Hueco junto a un bloque de comida/cena (BLOQUE B): no hay desplazamiento calculado hacia una
  // comida (MealTimeAccordion no es una parada real), así que es un hueco sin conector. Solo se
  // pinta el de ANTES de la tarjeta dorada — el de después ya lo cubre el hueco que abre la
  // siguiente parada (o el de fin de día si la comida cierra el día), y pintar los dos dejaría dos
  // botones pegados.
  const renderFreeTime = (entry: FreeTimeEntry, index: number, time: string | null) => (
    <div key={`free-${entry.after}-${entry.before}`}>
      <FreeTimeBlock
        time={time}
        hours={0}
        city={day.city}
        midDay={{ minutes: entry.minutes, before: entry.before, hint: entry.hint, title: entry.title }}
        onOpenMap={() => {
          const here = realStops[index]?.coordinates
          setAddStopFocus(here && hasRealCoordinates(here) ? here : null)
          setInsertAt(index + 1)
        }}
        suggestions={entry.suggestions}
        onPickSuggestion={(name) => {
          const here = realStops[index]?.coordinates
          setAddStopFocus(here && hasRealCoordinates(here) ? here : null)
          setAddStopInitialQuery(name)
          setInsertAt(index + 1)
        }}
      />
    </div>
  )
  const renderMealGap = (insertIndex: number) => renderGap(`${day.id}-meal-gap-${insertIndex}`, null, '', '', insertIndex)

  // StopDetailSheet/ArrivalDetailSheet abren su PROPIO mapa encima de este mismo panel — dos
  // canvas WebGL de Mapbox GL montados a la vez arriesgan que el de abajo se "filtre" por encima
  // del overlay que se supone que lo tapa (compositing GPU del canvas, no un problema de z-index —
  // ver el comentario junto a dayDetailOpen en RouteView.tsx, mismo motivo). Se trata igual que el
  // colapsado manual: mientras cualquiera de esos esté abierto, este mapa ni se monta.
  // `insertAt !== null` = está abierta la pantalla de añadir parada, que también trae su propio
  // mapa: sin esto el mapa del día se veía POR ENCIMA de ella, con su cabecera y su "Ver todo".
  const mapHiddenBySheet = detailIndex !== null || arrivalSheetOpen || mealSheet !== null || insertAt !== null || mealPicker !== null

  // ── Prompt 4: tipo de día y prominencia de excursión ────────────────────────────────────────
  const dayType = day.dayType ?? 'normal'
  const prominence = day.excursionProminence ?? 'none'
  // Un día de excursión o libre no enseña paradas: las suyas (si las tenía) siguen guardadas para
  // poder volver a la ruta, pero el contenido del día es otro.
  const showsRoute = dayType === 'normal' || dayType === 'smart_route'
  const excursionOptions = day.excursions ?? []
  // Los días de llegada y de vuelta no pueden ser una excursión (decisión del usuario, 2026-09-29).
  const arrivalOrReturnDay = isFirstDayOfTrip || isLastDay || Boolean(day.isReturnLeg)
  // El banner de la oferta: en su día, o en el día completo más cercano si el de la oferta es el de llegada o vuelta.
  const offerPlacement = route ? excursionOfferDay(route) : null
  const bannerOffer =
    offerPlacement && offerPlacement.day.id === day.id && offerPlacement.offerFrom.excursionOffer
      ? { offer: offerPlacement.offerFrom.excursionOffer, highlights: offerPlacement.offerFrom.excursionHighlights ?? [] }
      : !offerPlacement && prominence === 'prominent' && day.excursionHighlights && day.excursionHighlights.length > 0 && !day.excursionOffer
        ? { offer: null, highlights: day.excursionHighlights }
        : null
  const convertDay = (next: typeof dayType) => convertDayType(day.id, next)

  // ── El mapa se adapta al tipo de día ────────────────────────────────────────────────────────
  // La ciudad base es la primera parada real que tenga el viaje en esta ciudad: un día de excursión
  // o un día libre no tienen paradas propias de las que sacar el centro, pero el mapa tiene que
  // enseñar algo mejor que "Mapa no disponible".
  const cityBaseCoords =
    (route?.days ?? [day])
      .filter((candidate) => candidate.city === day.city)
      .flatMap((candidate) => candidate.stops)
      .find((stop) => hasRealCoordinates(stop.coordinates))?.coordinates ?? null

  const selectedExcursion = dayType === 'excursion' ? (excursionOptions.find((option) => option.id === day.selectedExcursionId) ?? null) : null
  // La de medio día no vive en `selectedExcursionId` (ese es el día de excursión entero): el día
  // sigue siendo un día de ciudad y la excursión solo le ocupa la mañana.
  const halfDayExcursion =
    day.halfDayExcursion && !day.halfDayExcursionDeclined
      ? (excursionOptions.find((option) => option.id === day.halfDayExcursion!.id) ?? null)
      : null

  // ── Día en blanco con excursión puesta a mano ───────────────────────────────────────────────
  // Solo los días que el destino ya no sabe llenar (`beyondAutoDays`). Los que coloca el motor
  // (día de excursión y media jornada en día de revisitas) tienen su propia lógica y no pasan por
  // aquí. Lo que decide qué ve el viajero es la DURACIÓN de lo que eligió, no cómo llegó hasta él.
  const esDiaEnBlanco = Boolean(day.beyondAutoDays || day.userAdded)
  const excursionElegidaEnBlanco = esDiaEnBlanco
    ? (excursionOptions.find((option) => option.id === day.selectedExcursionId) ?? null)
    : null
  const excursionEnteraEnBlanco = excursionElegidaEnBlanco?.length === 'full-day' ? excursionElegidaEnBlanco : null
  /** Media jornada a mano y todavía sin paradas por la tarde: hay que ofrecerle montarla. */
  const tardeLibreEnBlanco = esDiaEnBlanco && halfDayExcursion !== null && stops.length === 0
  // Dónde se ofrecen restaurantes al volver de la excursión: donde empieza la tarde.
  const halfDayLunchCoordinates = realStops.find((realStop) => hasRealCoordinates(realStop.coordinates))?.coordinates ?? cityCenter
  /** ¿Está el día enseñando su lista de paradas? Lo comparten la lista y el hueco de fin de día. */
  const muestraParadas = showsRoute || (dayType === 'manual' && stops.length > 0)
  const excursionTarget =
    selectedExcursion?.destinationCoords && hasRealCoordinates(selectedExcursion.destinationCoords)
      ? { name: selectedExcursion.title, coordinates: selectedExcursion.destinationCoords }
      : null

  const dayMarkers =
    dayType === 'excursion' ? buildExcursionDayMarkers(day.id, dayIndex, cityBaseCoords, excursionTarget) : routeDayMarkers
  const dayMapLines =
    dayType === 'excursion' ? buildExcursionDayLines(day.id, dayIndex, cityBaseCoords, excursionTarget?.coordinates ?? null) : routeDayLines
  // Un día libre sin montar no tiene pines: el mapa enseña la ciudad y ya.
  const dayMapCenter = dayMarkers.length === 0 ? cityBaseCoords : null

  // ── Mapa compartido (RouteView): lo que enseña mientras este día está abierto ───────────────
  const mapKey = JSON.stringify([
    dayMarkers.map((marker) => [marker.id, marker.number, marker.bg, marker.coordinates.lat, marker.coordinates.lng, marker.opacity ?? 1, marker.icon ?? '']),
    dayMapLines.map((line) => [line.id, line.coordinates.length, line.color, line.opacity ?? 1]),
    dayMapCenter,
  ])
  useEffect(() => {
    onMapChange?.({ markers: dayMarkers, lines: dayMapLines, center: dayMapCenter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapKey])
  useEffect(() => {
    onOverlayChange?.(mapHiddenBySheet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapHiddenBySheet])
  useEffect(
    () => () => {
      onMapChange?.(null)
      onOverlayChange?.(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // ── La línea del día, por franjas (Mañana, Mediodía, Tarde, Atardecer, Noche) ───────────────
  // Todo lo que pasa en el día en orden, cada cosa con su hora; la franja sale de la hora y nunca
  // retrocede (ver periodFor), así que las franjas van SIEMPRE en orden de hora.
  const dinnerStartMinutes = parseTimeToMinutes(day.meals.find((meal) => meal.mealTime === 'dinner')?.time ?? '')
  const lunchEndMinutes = lunchMeal?.windowEnd ? parseTimeToMinutes(lunchMeal.windowEnd) : NaN
  const dinnerFreeMinutes = (index: number): number | null => {
    const lastEnd = schedule[index]?.endMinutes
    if (Number.isNaN(dinnerStartMinutes) || lastEnd == null || schedule[0] == null) return null
    const free = dinnerStartMinutes - lastEnd - (day.dinnerWalkMinutes ?? 0)
    return free < FREE_TIME_MIN_MINUTES ? null : free
  }
  const timeline: TimelineItem[] = []
  /** Día libre (decisión del usuario, 2026-09-28): solo paradas, en el orden del viajero; la hora, la que él ponga. */
  const freeDay = (day.dayType ?? 'normal') === 'manual'
  // Un día movido de su fecha (PROMPT_UI_REPASO 10): si en la nueva cae un cierre, la marca roja de siempre en esa parada.
  const originalDayNumber = route?.originalRoute?.days.find((candidate) => candidate.id === day.id)?.dayNumber
  const movedDay = !freeDay && originalDayNumber != null && originalDayNumber !== day.dayNumber
  /** «Llegas después» (empieza antes de que estés en el centro) o «Ya te has ido» (acaba después de la hora de salir). */
  const tripWarningOf = (start: number, end: number, passThrough?: boolean): string | null => {
    if (freeDay || day.untimed) return null
    if (centerMinutes != null && start < centerMinutes) return 'Llegas después'
    if (leaveMinutes != null && end > leaveMinutes && !passThrough) return 'Ya te has ido'
    if (leaveMinutes != null && start >= leaveMinutes) return 'Ya te has ido'
    return null
  }
  const arrivalConflict = centerMinutes != null && realStops.length > 0 && schedule.some((entry, index) => tripWarningOf(entry.startMinutes, entry.endMinutes, stops[index]?.passThrough) === 'Llegas después')
  // La primera parada de verdad del día (ni de paso ni una pausa), con su número del mapa, para la ficha de la llegada.
  const firstVisitIndex = stops.findIndex((stop, index) => !stop.passThrough && !stop.isBreak && !realStops[index]?.isZoneWalk)
  const firstVisit = firstVisitIndex >= 0 ? realStops[firstVisitIndex] : null
  const firstStopForSheet = firstVisit
    ? {
        number: stopNumbers.get(firstVisit.id) ?? null,
        name: displayStopName(firstVisit.name),
        howTo: firstVisit.transitLabel
          ? `Desde tu alojamiento: ${firstVisit.transitLabel}.`
          : `El ${stopNumbers.get(firstVisit.id) ?? 1} en el mapa del día. Desde tu alojamiento, andando o en metro según dónde duermas.`,
      }
    : null
  const departureConflict =leaveMinutes != null && realStops.length > 0 && schedule.some((entry, index) => tripWarningOf(entry.startMinutes, entry.endMinutes, stops[index]?.passThrough) === 'Ya te has ido')
  if (muestraParadas) {
    stops.forEach((_stop, index) => {
      timeline.push({ type: 'stop', index })
      for (const entry of freeTimesOf(day)) {
        if (realStops[index]?.name === entry.after && entry.before !== LUNCH_FREE_LABEL && realStops[index + 1]?.name === entry.before) timeline.push({ type: 'free', index, entry })
      }
      if (lunchInsertionIndex === index && !freeDay) {
        for (const entry of freeTimesOf(day)) {
          if (realStops[index]?.name === entry.after && entry.before === LUNCH_FREE_LABEL) timeline.push({ type: 'free', index, entry })
        }
        timeline.push({ type: 'mealGap', index })
        timeline.push({ type: 'lunch', index })
        for (const entry of freeTimesOf(day)) {
          if (entry.after === LUNCH_FREE_LABEL && realStops[index + 1]?.name === entry.before) timeline.push({ type: 'free', index: -1 - index, entry })
        }
      }
      if (dinnerInsertionIndex === index && !freeDay) {
        const hasFree = dinnerFreeMinutes(index) !== null
        timeline.push({ type: 'mealGap', index })
        if (hasFree) timeline.push({ type: 'dinnerFree', index })
        timeline.push({ type: 'dinner', index })
      }
    })
    if (stops.length > 0) timeline.push({ type: 'end' })
  }
  // Los trayectos en bus o metro que se pintan antes del tiempo libre (no se repiten delante de su parada).
  const transitMovedBeforeFree = new Set<number>()
  const placed: PlacedItem[] = []
  // Los tramos (PROMPT_UI, Parte 2): lo de antes de comer es la mañana (el Panteón a las 12:30 también); después, la
  // tarde; las nocturnas y lo de después de cenar, la noche. La comida y la cena, entre tramos; en invierno, si la cena
  // va después de las nocturnas, dentro de la noche, al final.
  const hasLunch = timeline.some((item) => item.type === 'lunch')
  let phase: DayPeriod = 'manana'
  for (const item of timeline) {
    const floor = placed.length > 0 ? placed[placed.length - 1].period : null
    let start = floor ? placed[placed.length - 1].end : DAY_START_MINUTES
    let end = start
    let flags: { sunset?: boolean; night?: boolean } = {}
    if (item.type === 'stop') {
      start = schedule[item.index]?.startMinutes ?? start
      end = schedule[item.index]?.endMinutes ?? start
      const realStop = realStops[item.index]
      flags = { sunset: Boolean(realStop?.isSunset), night: Boolean(realStop?.isNightExperience || realStop?.isNightView) }
    } else if (item.type === 'free') {
      // Índice negativo = el hueco de DESPUÉS de la comida (empieza al acabar la franja de comer).
      const after = item.index < 0 ? -1 - item.index : item.index
      start = item.index < 0 && !Number.isNaN(lunchEndMinutes) ? lunchEndMinutes : (schedule[after]?.endMinutes ?? start)
      // Si a lo siguiente se va en bus o metro, el tiempo libre es al llegar (decisión del usuario, 2026-09-28): acaba
      // cuando empieza la parada.
      if (item.index >= 0 && realStops[after + 1]?.transitLabel && schedule[after + 1]) start = schedule[after + 1].startMinutes - item.entry.minutes
      end = start + item.entry.minutes
    } else if (item.type === 'lunch') {
      start = Number.isNaN(lunchStart) ? (schedule[item.index]?.endMinutes ?? start) : lunchStart
      end = Number.isNaN(lunchEndMinutes) ? start + 75 : lunchEndMinutes
    } else if (item.type === 'dinnerFree') {
      start = schedule[item.index]?.endMinutes ?? start
      end = start + (dinnerFreeMinutes(item.index) ?? 0)
    } else if (item.type === 'dinner') {
      start = Number.isNaN(dinnerStartMinutes) ? start : dinnerStartMinutes
      end = start + 90
      flags = { night: true }
    }
    let period: DayPeriod = phase
    if (item.type === 'lunch') {
      period = 'comida'
      phase = 'tarde'
    } else if (item.type === 'dinner') {
      period = phase === 'noche' ? 'noche' : 'cena'
      phase = 'noche'
    } else if (item.type === 'stop') {
      // (Sin comida en el día —media jornada, día libre—, la tarde empieza a las 14:00.)
      if (!hasLunch && phase === 'manana' && start >= AFTERNOON_FROM) phase = 'tarde'
      if (flags.night && phase !== 'manana') phase = 'noche'
      period = phase
    }
    placed.push({ item, period, start, end })
  }
  const periodGroups: { period: DayPeriod; range: string; items: PlacedItem[] }[] = []
  for (const entry of placed) {
    const last = periodGroups[periodGroups.length - 1]
    if (last && last.period === entry.period) last.items.push(entry)
    else periodGroups.push({ period: entry.period, range: '', items: [entry] })
  }
  for (const group of periodGroups) {
    const timed = group.items.filter((entry) => entry.item.type !== 'end' && entry.item.type !== 'mealGap')
    if (timed.length === 0) continue
    const from = Math.min(...timed.map((entry) => entry.start))
    const to = Math.max(...timed.map((entry) => entry.end))
    // De 5 en 5, como las horas de las paradas: con cuartos, la Tarde decía 14:30 y su primera parada era a las 14:25.
    const step5 = (minutes: number) => Math.round(minutes / 5) * 5
    group.range = `${minutesToTime(step5(from))} — ${minutesToTime(step5(to))}`
  }

  /** Un elemento de la línea del día. `firstInPeriod`: abre franja (sin información de trayecto antes). */
  const renderTimelineItem = ({ item, start }: PlacedItem, firstInPeriod: boolean) => {
    if (item.type === 'end') {
      return renderGap(`${day.id}-connector-accommodation`, finalConnector, stops[stops.length - 1].name, tonightHotel?.name ?? '', stops.length, dinnerInsertionIndex !== null)
    }
    if (item.type === 'free') {
      const index = item.index < 0 ? -1 - item.index : item.index
      // El trayecto en bus o metro va antes del tiempo libre: primero se llega y luego se pasea (Villa Borghese).
      const next = index + 1
      if (item.index >= 0 && realStops[next]?.transitLabel && connectorEntries[next]) {
        transitMovedBeforeFree.add(next)
        const { connectorKey, connector, fromName } = connectorEntries[next]
        return (
          <div key={`free-transit-${index}`}>
            {renderGap(connectorKey, connector, fromName, stops[next].name, next, false, realStops[next].transitLabel ?? null)}
            {renderFreeTime(item.entry, index, minutesToTime(start))}
          </div>
        )
      }
      return renderFreeTime(item.entry, index, minutesToTime(start))
    }
    if (item.type === 'mealGap') return <div key={`meal-gap-${item.index}-${start}`}>{renderMealGap(item.index + 1)}</div>
    if (item.type === 'lunch') {
      const index = item.index
      return (
        <div key={`lunch-${index}`}>
          <MealTimeAccordion
            destino={destino}
            city={day.city}
            coordinates={lunchCoordinates ?? realStops[index].coordinates}
            curatedZone={lunchCuratedZone}
            curatedZoneDisplay={lunchCuratedZoneDisplay}
            franja="comida"
            timeRange={lunchTimeRange}
            chosenName={restaurantOf('lunch')?.name ?? null}
            walkNote={mealWalkNote('lunch', index)}
            onChange={() => openMealPicker('lunch')}
            onOpen={() => setMealSheet({ franja: 'comida', stopIndex: index })}
          />
        </div>
      )
    }
    if (item.type === 'dinnerFree') {
      const index = item.index
      const lastEnd = schedule[index]?.endMinutes ?? 0
      const firstStart = schedule[0]?.startMinutes ?? lastEnd
      return (
        <div key={`dinner-free-${index}`}>
          {/* El aperitivo, como una tarjeta más (PROMPT_UI_REPASO 13); sin él, el tiempo libre de siempre. */}
          {day.aperitivo ? (
            <AperitivoCard
              time={minutesToTime(lastEnd)}
              title={day.aperitivo.title}
              minutes={day.aperitivo.minutes}
              barrio={day.aperitivo.barrio}
              city={day.city}
              suggestions={day.aperitivo.suggestions}
              onPickSuggestion={(name) => {
                const here = realStops[index]?.coordinates
                setAddStopFocus(here && hasRealCoordinates(here) ? here : null)
                setAddStopInitialQuery(name)
                setInsertAt(index + 1)
              }}
            />
          ) : (
          <FreeTimeBlock
            time={minutesToTime(lastEnd)}
            hours={Math.max(1, Math.round((lastEnd - firstStart) / 60))}
            city={day.city}
            onOpenMap={() => {
              const here = realStops[index]?.coordinates
              setAddStopFocus(here && hasRealCoordinates(here) ? here : null)
              setInsertAt(index + 1)
            }}
            suggestions={day.aperitivo?.suggestions ?? day.freeAfternoon?.suggestions}
            aperitivo={day.aperitivo ? { title: day.aperitivo.title, minutes: day.aperitivo.minutes } : undefined}
            onPickSuggestion={(name) => {
              const here = realStops[index]?.coordinates
              setAddStopFocus(here && hasRealCoordinates(here) ? here : null)
              setAddStopInitialQuery(name)
              setInsertAt(index + 1)
            }}
          />
          )}
        </div>
      )
    }
    if (item.type === 'dinner') {
      const index = item.index
      return (
        <div key={`dinner-${index}`}>
          <MealTimeAccordion
            destino={destino}
            city={day.city}
            coordinates={realStops[index].coordinates}
            curatedZone={dinnerCuratedZone}
            curatedZoneDisplay={dinnerCuratedZoneDisplay}
            franja="cena"
            timeRange={Number.isNaN(dinnerStartMinutes) ? null : minutesToTime(dinnerStartMinutes)}
            chosenName={restaurantOf('dinner')?.name ?? null}
            walkNote={mealWalkNote('dinner', index)}
            onChange={() => openMealPicker('dinner')}
            onOpen={() => setMealSheet({ franja: 'cena', stopIndex: index })}
          />
        </div>
      )
    }
    // Una parada.
    const index = item.index
    const stop = stops[index]
    const realStop = realStops[index]
    const { connectorKey, connector, fromName, fromAccommodation } = connectorEntries[index]
    const { startMinutes } = schedule[index]
    // La primera parada del día no lleva el conector de relleno genérico; sí el real desde el
    // alojamiento de anoche. Al abrir franja tampoco (la cabecera ya separa). El paseo por barrio no
    // lleva conector: "6 min · 540 m" hasta un barrio entero no significa nada.
    // Día libre: siempre los minutos andando entre una parada y la siguiente (no hay franjas).
    const showConnector = realStop?.isZoneWalk ? false : index === 0 ? fromAccommodation : freeDay || !firstInPeriod
    const walkDismissed = Boolean(realStop?.isZoneWalk) && dismissedWalks.has(stop.name)
    return (
      // El paseo por barrio no se arrastra: no es una parada del viaje, es una sugerencia para un hueco.
      <SortableStop key={stop.id} id={realStop?.id ?? stop.id} disabled={Boolean(realStop?.isZoneWalk)}>
        <div data-stop-id={realStop?.id ?? stop.id}>
          {/* El hueco SIEMPRE se pinta (es desde donde se inserta una parada ahí); `showConnector`
              decide solo si además lleva el trayecto. Un paseo quitado no deja ni rastro. */}
          {walkDismissed ? null : transitMovedBeforeFree.has(index) ? null : renderGap(connectorKey, showConnector ? connector : null, fromName, stop.name, index, dinnerInsertionIndex !== null && index > dinnerInsertionIndex, realStop?.transitLabel ?? null)}
          {realStop?.isZoneWalk ? (
            walkDismissed ? null : (
              <ZoneWalkCard stop={stop} startTime={freeDay ? (realStop && hasOwnTime(realStop) ? realStop.time : undefined) : day.untimed ? undefined : minutesToTime(startMinutes)} onDismiss={() => setDismissedWalks((prev) => new Set(prev).add(stop.name))} />
            )
          ) : (
            <StopAccordion
              number={realStop ? (stopNumbers.get(realStop.id) ?? null) : null}
              numberColors={numberColors}
              // Día libre: el horario de ese día y de esa época (el mismo con el que sale "Cerrado a esa hora").
              stop={freeDay && dateIso && realStop?.hoursData ? { ...stop, scheduleText: placeHoursOnDate(realStop.hoursData, dateIso)?.schedule ?? stop.scheduleText } : stop}
              startTime={freeDay ? (realStop && hasOwnTime(realStop) ? realStop.time : undefined) : day.untimed ? undefined : minutesToTime(startMinutes)}
              freeDayWarning={freeDay && realStop ? freeDayStopWarning(realStop, dateIso) : undefined}
              tripWarning={tripWarningOf(startMinutes, startMinutes + stop.durationMinutes, stop.passThrough) ?? (movedDay && realStop && stop.visitMode !== 'fuera' ? freeDayStopWarning({ ...realStop, time: minutesToTime(startMinutes) }, dateIso) : null)}
              addedByUser={Boolean(realStop?.addedByUser)}
              onOpen={() => setDetailIndex(index)}
              menu={<StopMenu dayId={day.id} city={day.city} stop={realStop} index={index} realStops={realStops} otherDays={otherDays} freeDay={dayType === 'manual'} />}
            />
          )}
        </div>
      </SortableStop>
    )
  }

  return (
    // Acordeón dentro de la tarjeta del día (diseño "Trazo Itinerario"): sin mapa propio (el de arriba
    // enseña este día) ni cabecera propia (ya la lleva la tarjeta del día en DayList).
    <div ref={panelRef} className="border-t border-dashed border-text/[.12] px-3 pb-4" style={{ animation: 'trazo-pop .45s cubic-bezier(.2,.8,.2,1) backwards' }}>
      <WantInsideDialog route={route} day={day} state={wantInside.state} onClose={wantInside.close} onAccepted={() => setDetailIndex(null)} />
      <div className="pt-3">
        {/* Por qué hoy se madruga: una línea discreta, no un banner — es una explicación, no una
            decisión que haya que tomar. */}
        {showsRoute && day.paceNotice && <p className="px-1 text-[12.5px] leading-[1.4] text-text/55">{day.paceNotice}</p>}
        {/* "Volver al día original" va en el menú "···" del día (PROMPT_UI, Parte 2). */}
        {/* Día libre: con horas sugeridas o "Sin hora" (las paradas en orden, con el paseo entre ellas). */}
        {showsRoute && day.transferNotice && <p className="whitespace-pre-line px-1 text-[12.5px] leading-[1.4] text-text/55">{day.transferNotice}</p>}
        {/* Las cifras del día (PROMPT_UI_REPASO 5): tres en fila, separadas por una línea fina, el número en Instrument Serif y
            la palabra debajo en mono; sin iconos ni caja, centradas. */}
        {showsRoute && stops.length > 0 && (
          <div className="flex items-stretch justify-center pt-2">
            {[
              { value: String(visitCount), label: visitCount === 1 ? 'parada' : 'paradas' },
              { value: formatWalkKm(totalWalkMeters).replace(' km', ''), label: 'km a pie' },
              { value: formatActivityDuration(totalActivityMinutes), label: 'de actividad' },
            ].map((figure, index) => (
              <div key={figure.label} className={`flex flex-col items-center px-4 max-[479px]:px-3 ${index > 0 ? 'border-l border-text/[.12]' : ''}`}>
                <span className="font-display text-[18px] leading-none text-text">{figure.value}</span>
                <span className="mt-1 whitespace-nowrap font-mono text-[9.5px] font-semibold uppercase tracking-[.1em] text-text/50">{figure.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

        <div className="space-y-2 pt-1">
          {/* Regla de oro del pool: lo marcado que no ha cabido se dice aquí, en su día, con su motivo. */}
          {(day.poolNotices ?? []).map((notice) => (
            <div key={notice.name} className="mt-2 flex items-start gap-2.5 rounded-2xl border border-accent-gold/40 bg-accent-gold/10 px-3.5 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent-gold" aria-hidden="true">
                <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
              <p className="min-w-0 flex-1 text-[13px] leading-[1.45] text-text">
                No hemos podido incluir <span className="font-semibold">{notice.name}</span> porque {notice.reason.charAt(0).toLowerCase() + notice.reason.slice(1)}.
              </p>
            </div>
          ))}
          {/* Prominente: el banner va ENCIMA de la ruta y no la quita — el viajero ve las dos cosas
              y elige. Se puede cerrar sin perder nada (regla 9). */}
          {/* El banner de excursiones de jornada completa no sale en un día que YA tiene una de
              medio día por la mañana: "muchos viajeros aprovechan este día para salir de Roma"
              encima de una mañana que ya sale de Roma es contradecirse en dos centímetros. */}
          {/* (Nunca en el día de llegada ni en el de vuelta: la oferta pasa al día completo más cercano.) */}
          {/* (El banner de la oferta ya no sale: PROMPT_UI_REPASO 2. Queda solo el enlace pequeño al final del día de la oferta.) */}

          {/* Día en blanco al que el viajero le ha puesto una excursión de jornada completa: el día
              está resuelto y no hay hueco que ofrecer. */}
          {excursionEnteraEnBlanco && (
            <BlankDayFullExcursion
              excursion={excursionEnteraEnBlanco}
              onRemove={() => {
                selectDayExcursion(day.id, null)
                convertDay('manual')
              }}
            />
          )}

          {dayType === 'excursion' && !excursionEnteraEnBlanco && (
            <div className="space-y-3 pt-1">
              {/* Regla 10: si este día tenía ruta curada, SIEMPRE se ofrece volver a ella. */}
              {day.curatedAlternative && <CuratedAlternativeBanner alternative={day.curatedAlternative} onRestore={() => convertDay('normal')} />}
              {esDiaEnBlanco ? (
                // En un día en blanco no se propone: el viajero vino a elegir. Y no lleva la salida
                // "te montamos otro día de ruta" — este día está en blanco justamente porque el
                // destino ya no da para más, así que sería prometerle algo que no existe.
                <div className="space-y-2">
                  <p className="text-small leading-relaxed text-text-soft">Elige una excursión para el día {day.dayNumber}.</p>
                  <ExcursionOptions
                    options={excursionOptions}
                    selectedId={day.selectedExcursionId ?? null}
                    onSelect={(id) => {
                      const elegida = excursionOptions.find((option) => option.id === id)
                      if (elegida) addBlankDayExcursion(day.id, elegida)
                      else selectDayExcursion(day.id, null)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => convertDay('manual')}
                    className="w-full pt-1 text-center text-caption text-text-muted underline transition-colors hover:text-text-soft"
                  >
                    Mejor monto el día yo
                  </button>
                </div>
              ) : excursionOptions.length > 0 ? (
                <ExcursionDayProposal
                  destination={day.city}
                  options={excursionOptions}
                  selectedId={day.selectedExcursionId ?? null}
                  socialProof={day.excursionSocialProof}
                  onSelect={(id) => selectDayExcursion(day.id, id)}
                  // Rechazar no decide por el viajero: "ruta" devuelve el día a ciudad (el motor ya
                  // tiene el core day desplazado esperando, así que no queda vacío ni repetido) y
                  // "vacío" lo deja libre para que lo monte él.
                  onDecline={(fill) => convertDay(fill === 'route' ? 'normal' : 'manual')}
                />
              ) : (
                <p className="py-6 text-center text-small text-text-soft">Todavía no tenemos excursiones seleccionadas para {day.city}.</p>
              )}
            </div>
          )}

          {/* Con la mañana ya resuelta por una excursión de medio día, la tarde tiene su propio
              bloque (arriba) y estas dos salidas sobran: "buscar excursiones" le ofrecería una
              segunda excursión al mismo día. */}
          {dayType === 'manual' && stops.length === 0 && !halfDayExcursion && !day.userAdded && (
            <div className="space-y-2 pt-1">
              {/* Solo en el día en blanco por límite del destino, y solo en el PRIMERO: repetirlo en
                  cada día a partir del octavo sería regañar al viajero por alargar su viaje. No es
                  un error ni un bloqueo — a partir de aquí manda él. */}
              {day.beyondAutoDays && isFirstBeyondAutoDay && (
                <p className="rounded-xl bg-bg-hover px-3 py-2.5 text-small leading-relaxed text-text-soft">
                  A partir del día {day.dayNumber}, tú decides. Añade las paradas que quieras y nosotros organizamos los tiempos.
                </p>
              )}
              <ManualDayOptions onSearchPlaces={() => setInsertAt(0)} onSearchExcursions={() => convertDay('excursion')} />
            </div>
          )}

          {isFirstDayOfTrip && showCamperBlock && <VehicleBlock kind="camper" />}

          {stay && !accommodationResolved && <AccommodationBlock city={day.city} segmentDayId={stay.segmentDayId} totalNights={stay.totalNights} />}

          {isFirstDayOfTrip && showRentalCarBlock && <VehicleBlock kind="rental-car" />}

          {/* Llegada o vuelta: la misma tarjeta, en azul petróleo, sin número (no es una parada). */}
          {/* La llegada: el primer día, después del alojamiento y antes del primer tramo. */}
          {isFirstDayOfTrip && route && (
            // (50 px hasta «MAÑANA», como entre los demás bloques: PROMPT_UI_REPASO 4.)
            <div className="mb-[50px] space-y-1.5 pt-2">
              <ArrivalReturnBar mode={modes.arrival} text={arrivalBarText} onOpen={() => setArrivalSheet('llegada')} onAdd={() => goToBooking('llegada')} />
              {arrivalConflict && centerMinutes != null && (
                <button
                  type="button"
                  onClick={() => fitDayToTrip(day.id, 'arrival', centerMinutes)}
                  className="px-1 text-[12.5px] font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  Ajustar este día a tu llegada
                </button>
              )}
            </div>
          )}

          {/* Un cambio de ciudad a mitad del viaje: la tarjeta de siempre. */}
          {arrivalDetail && !isFirstDayOfTrip && !isLastDay && (
            <div className="pt-2">
              <TrazoCard kind="transporte" iconPath={KIND_ICON.plane} name={arrivalDetail.headline} sub={arrivalDetail.subtitle} noPhoto onOpen={() => setArrivalSheetOpen(true)} />
            </div>
          )}

          {/* Un día de EXCURSIÓN guarda su ruta para poder volver a ella, pero no la enseña. Un día
              LIBRE sí enseña lo que el viajero ya haya montado. */}
          {reorderWarning && (
            <div className="flex items-start gap-2 rounded-xl border border-accent-gold/40 bg-accent-gold/10 px-3 py-2.5">
              <span aria-hidden="true">⚠️</span>
              <p className="min-w-0 flex-1 text-caption leading-relaxed text-text-soft">{reorderWarning}</p>
              <button type="button" onClick={() => setReorderWarning(null)} aria-label="Cerrar aviso" className="shrink-0 text-caption text-text-muted hover:text-text">
                ✕
              </button>
            </div>
          )}

          {/* La excursión de medio día ocupa la mañana de este día y las paradas de abajo empiezan
              a las 16:00. Entre las dos va SIEMPRE la comida (Paso 2, 2026-09-24): no se sabe si la
              excursión la incluye, así que se pregunta y se ofrecen restaurantes donde empieza la
              tarde o, si no hay paradas de tarde, en el centro de la ciudad del día. */}
          {halfDayExcursion && (
            <HalfDayExcursionBlock
              excursion={halfDayExcursion}
              startsAt={day.halfDayExcursion!.startsAt}
              endsAt={day.halfDayExcursion!.endsAt}
              onDismiss={() => declineHalfDayExcursion(day.id)}
              dismissLabel={esDiaEnBlanco ? 'Quitar esta excursión' : undefined}
            />
          )}
          {halfDayExcursion && halfDayLunchCoordinates && (
            <div className="pt-2">
              <MealTimeAccordion
                destino={destino}
                city={day.city}
                coordinates={halfDayLunchCoordinates}
                franja="comida"
                subtitle={`¿Tu excursión incluye comida? Si no, cuando vuelvas a ${day.city} aquí tienes restaurantes perfectos para ti`}
                onOpen={() => setMealSheet({ franja: 'comida', stopIndex: 0, coordinates: halfDayLunchCoordinates })}
              />
            </div>
          )}

          {/* Media jornada en un día en blanco: la tarde queda suya y hay que decírselo, con la
              hora a la que empieza. El hueco 14:00-16:00 no se pinta, igual que en los días que
              monta el motor. */}
          {tardeLibreEnBlanco && (
            <FreeAfternoonBlock
              destination={day.city}
              startsAt={day.halfDayExcursion!.routeStartsAt}
              onAddStops={() => setInsertAt(0)}
            />
          )}

          {muestraParadas && (
          <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleStopDragEnd}>
          <SortableContext items={realStops.map((realStop) => realStop.id)} strategy={verticalListSortingStrategy}>
          {periodGroups.map((group, groupIndex) => (
            // (50 px encima de cada tramo y de la comida y la cena: cinco bloques bien separados.)
            // (PROMPT_UI_REPASO 7-8: 50 px encima de cada cabecera; la comida y la cena, 50 encima y 50 debajo, como bloque propio.)
            <div key={`${group.period}-${groupIndex}`} className={freeDay ? '' : `${groupIndex > 0 ? 'mt-[50px]' : ''} ${group.period === 'comida' || group.period === 'cena' ? 'mb-[50px]' : ''}`}>
              {!freeDay && PERIOD_WITH_HEADER.has(group.period) && <PeriodHeader period={group.period} range={day.untimed ? null : group.range} />}
              {/* La línea punteada del día; las tarjetas cuelgan de ella. La comida y la cena, sin ella. */}
              <div className={`relative flex flex-col ${PERIOD_WITH_HEADER.has(group.period) || freeDay ? 'pl-[26px]' : ''}`}>
                {(PERIOD_WITH_HEADER.has(group.period) || freeDay) && <div className="absolute bottom-0 left-[11px] top-0 border-l-[1.5px] border-dashed border-text/[.18]" aria-hidden="true" />}
                {group.items.map((entry, itemIndex) => renderTimelineItem(entry, itemIndex === 0))}
              </div>
            </div>
          ))}
          </SortableContext>
          </DndContext>
          )}

          {/* Día libre sin paradas con su comida o su cena ya elegida: se ve igual. */}
          {dayType === 'manual' && day.meals.some((meal) => meal.chosenRestaurant) && (
            <div className="space-y-2 pt-2">
              {[...day.meals]
                .filter((meal) => meal.chosenRestaurant)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((meal) => (
                  <MealTimeAccordion
                    key={meal.id}
                    destino={destino}
                    city={day.city}
                    coordinates={meal.chosenRestaurant!.coordinates}
                    franja={meal.mealTime === 'dinner' ? 'cena' : 'comida'}
                    timeRange={null}
                    chosenName={meal.chosenRestaurant!.name}
                    onChange={() => openMealPicker(meal.mealTime === 'dinner' ? 'dinner' : 'lunch')}
                    onOpen={() => setMealSheet({ franja: meal.mealTime === 'dinner' ? 'cena' : 'comida', stopIndex: 0, coordinates: meal.chosenRestaurant!.coordinates })}
                  />
                ))}
            </div>
          )}

          {/* "+ Añadir lugares" (decisión del usuario, 2026-09-28): abajo del todo en el día libre, vacío o con cosas. */}
          {/* Con una excursión de día entero no sale: su tarjeta ya dice que ocupa el día entero. */}
          {dayType === 'manual' && (
              <button
                type="button"
                onClick={() => openAddFlow(day.id)}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-text/25 text-[14px] font-medium text-text/70 transition-colors hover:bg-bg-hover"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Añadir lugares
              </button>
          )}

          {/* Salidas del día. En prominencia sutil el link es lo ÚNICO que se ve de excursiones, y
              tiene que quedarse pequeño: el 90% de los viajeros no busca una excursión el día 2. */}
          {/* Solo en el día de la oferta (PROMPT_UI_REPASO 2): el resto de días, nada de excursiones. */}
          {showsRoute && !halfDayExcursion && !arrivalOrReturnDay && bannerOffer && !day.excursionDeclined && (
            <ExcursionLink label="¿Prefieres una excursión este día?" onClick={() => convertDay('excursion')} />
          )}
          {/* Rechazada: no se vuelve a proponer sola, pero el camino de vuelta queda abierto. */}
          {showsRoute && day.excursionDeclined && <ExcursionLink label="Añadir excursión" onClick={() => convertDay('excursion')} />}
          {/* No en un día en blanco: está en blanco porque el destino ya no da para más contenido
              nuevo, así que "generamos una ruta" sería prometerle algo que no existe. */}
          {dayType === 'excursion' && !esDiaEnBlanco && (
            <ExcursionLink label="Generar una ruta para este día" onClick={() => convertDay('smart_route')} />
          )}
          {/* "Montar día manualmente" ya no sale: para eso está "+ Añadir día" (PROMPT_UI, Parte 2). */}

          {day.recommendedRevisits && day.recommendedRevisits.length > 0 && (
            <div className="space-y-2 pt-3">
              {day.recommendedRevisits
                .filter((rec) => !dismissedRevisits.has(rec.name))
                .map((rec) => (
                  <div key={rec.name} className="relative rounded-xl border border-accent/30 bg-accent/5 p-3 pr-8">
                    <button
                      type="button"
                      onClick={() => setDismissedRevisits((prev) => new Set(prev).add(rec.name))}
                      aria-label="Descartar sugerencia"
                      className="absolute right-2 top-2 rounded-full p-1 text-text-muted hover:bg-bg-hover hover:text-text"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                    <div className="flex items-start gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      >
                        <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-small font-medium text-text">Segunda visita recomendada: {rec.name}</p>
                        <p className="mt-0.5 text-caption text-text-soft">{rec.reason}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddStopInitialQuery(rec.name)
                        setInsertAt(realStops.length)
                      }}
                      className="mt-2 rounded-full bg-accent px-3 py-1.5 text-caption font-semibold text-white transition-colors hover:bg-accent-hover"
                    >
                      Añadir como parada
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* La vuelta: el último día, al final del todo, y la despedida en el idioma del destino. */}
          {isLastDay && route && (
            <div className="space-y-1.5 pt-6">
              {departureConflict && leaveMinutes != null && (
                <button
                  type="button"
                  onClick={() => fitDayToTrip(day.id, 'departure', leaveMinutes)}
                  className="px-1 text-[12.5px] font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  Ajustar este día a tu vuelta
                </button>
              )}
              <ArrivalReturnBar mode={modes.departure} text={returnBarText} onOpen={() => setArrivalSheet('vuelta')} onAdd={() => goToBooking('vuelta')} />
              <p className="pt-4 text-center font-display text-[19px] italic text-text/60">
                Fin del viaje.{arrivalInfo.despedida ? ` ${arrivalInfo.despedida}` : ''}
              </p>
            </div>
          )}

          {/* En el body: la animación del panel del día hace de caja de los position: fixed. */}
          {route && mealPicker && curatedPool.length > 0 && createPortal(
            <PlaceExplorerScreen
              open
              destination={day.city}
              places={curatedPool}
              title={`${mealPicker.mealTime === 'dinner' ? 'Cena' : 'Comida'} — Día ${day.dayNumber}`}
              subtitle={mealPicker.zone}
              route={route}
              dayMarkers={dayMarkers}
              dayNumber={day.dayNumber}
              dateIso={dateIso}
              initialFilters={['restaurantes']}
              focusCoordinates={mealPicker.coordinates}
              recommendedZone={mealPicker.zone}
              quickAddLabel="Elegir"
              onQuickAdd={(place) => {
                // Cambiar de restaurante no mueve ninguna hora: solo cambian los minutos andando que se enseñan.
                setMealRestaurant(day.id, mealPicker.mealTime, { name: place.name, coordinates: place.coordinates, zone: place.zone_label ?? null })
                setMealPicker(null)
              }}
              onClose={() => setMealPicker(null)}
            />,
            document.body,
          )}

          {route && insertAt !== null && curatedPool.length > 0 && (
            <PlaceExplorerScreen
              open
              destination={day.city}
              places={curatedPool}
              // Las excursiones se ENSEÑAN aquí (son una respuesta legítima a "¿qué hago este
              // día?") pero no se pueden añadir: un día entero fuera de la ciudad no es una parada
              // que quepa en un hueco de la tarde. Para eso está convertir el día a excursión.
              excursions={curatedExcursions}
              title={`Añadir parada — Día ${day.dayNumber}`}
              subtitle={addStopSubtitle}
              route={route}
              dayMarkers={dayMarkers}
              dayNumber={day.dayNumber}
              dateIso={dateIso}
              initialQuery={addStopInitialQuery}
              focusCoordinates={addStopFocus}
              onPick={addPickedStop}
              onClose={closeAddStop}
            />
          )}

          {route && curatedPoolResolved && curatedPool.length === 0 && (
            <AddStopScreen
              route={route}
              city={day.city}
              dayNumber={day.dayNumber}
              open={insertAt !== null}
              beforeStopName={insertAt !== null && insertAt > 0 ? (realStops[insertAt - 1]?.name ?? null) : null}
              afterStopName={insertAt !== null && insertAt < realStops.length ? (realStops[insertAt]?.name ?? null) : null}
              anchorCoordinates={insertAt !== null && insertAt > 0 ? (realStops[insertAt - 1]?.coordinates ?? null) : null}
              dayMarkers={dayMarkers}
              initialQuery={addStopInitialQuery}
              onPick={addPickedStop}
              onClose={closeAddStop}
            />
          )}
        </div>

      {/* Las fichas a pantalla completa, en el body: dentro del panel del día quedaban por debajo de la cabecera de la app
          (la hoja de abajo hace su propio contexto de apilamiento). */}
      {createPortal(
        <>
      <StopDetailSheet
        stop={detailIndex !== null ? stops[detailIndex] : null}
        visitTime={detailIndex !== null && schedule[detailIndex] ? minutesToTime(schedule[detailIndex].startMinutes) : null}
        city={day.city}
        dayNumber={day.dayNumber}
        dateIso={dateIso}
        dayStops={dayStopRefs}
        // Fix 7 bonus + verificación ronda 4: en días del pipeline v2 (day.timesAreFinal), ninguna
        // parada cuenta como "ancla" — anchorNamesLower para estas rutas viene de TODOS los lugares
        // reales del viaje (ver anchorNames en routeGenerationOrchestrator.ts), no de un puñado de
        // intocables, así que casi cualquier parada normal (Coliseo, Fontana de día...) coincidía y
        // disparaba fetchAnchorTips (Claude + búsqueda web) igualmente, aunque ya tuviera tip real del
        // JSON — el Fix 7 original solo cubrió describe-stop, no este otro efecto. Al quedar
        // `isAnchor` en false aquí, `tips` (más abajo) cae a `description?.tips`, que para estas
        // paradas ya viene de `buildCuratedStopDescription` — mismo tip real, cero coste.
        isAnchor={detailIndex !== null && !day.timesAreFinal && anchorNamesLower.has(stops[detailIndex].name.toLowerCase())}
        // Fix 7 bonus (ronda 2): en días del pipeline v2, la parada ya trae description/tip reales
        // del JSON curado (ver routeAlgorithm.js) — sustituye la llamada interna a describe-stop
        // (Claude) por ese contenido tal cual, sin gastar nada. Free Tour queda fuera a propósito
        // (StopDetailSheet ya lo trata aparte, nunca llama a describe-stop para él de todos modos).
        externalContent={
          detailIndex !== null && day.timesAreFinal && !stops[detailIndex].isFreeTour && stops[detailIndex].description
            ? { description: buildCuratedStopDescription(stops[detailIndex].description, stops[detailIndex].tips[0]), loading: false }
            : undefined
        }
        onClose={() => setDetailIndex(null)}
        onWantInside={detailIndex !== null && stops[detailIndex]?.visitMode === 'fuera' && stops[detailIndex]?.outsideKind === 'no_cabe' ? () => wantInside.ask(stops[detailIndex].name) : undefined}
      />

      <ArrivalDetailSheet
        detail={arrivalSheetOpen ? arrivalDetail : null}
        dayNumber={day.dayNumber}
        dateIso={dateIso}
        dayStops={dayStopRefs}
        transportModeId={arrivalTransportModeId}
        onClose={() => setArrivalSheetOpen(false)}
      />

      {route && (
        <ArrivalReturnSheet
          open={arrivalSheet !== null}
          route={route}
          kind={arrivalSheet ?? 'llegada'}
          mode={arrivalSheet === 'vuelta' ? modes.departure : modes.arrival}
          info={arrivalInfo}
          medio={arrivalSheet === 'vuelta' ? departureMedio : arrivalMedio}
          origin={origin}
          dateIso={dateIso}
          time={arrivalSheet === 'vuelta' ? departureTime : arrivalTime}
          pointId={arrivalSheet === 'vuelta' ? (route.departurePointId ?? null) : (route.arrivalPointId ?? null)}
          onPickPoint={(pointId) => setArrivalPointId(arrivalSheet === 'vuelta' ? 'departure' : 'arrival', pointId)}
          keyMinutes={arrivalSheet === 'vuelta' ? leaveMinutes : centerMinutes}
          firstStop={firstStopForSheet}
          onEditBooking={() => goToBooking(arrivalSheet ?? 'llegada')}
          onClose={() => setArrivalSheet(null)}
        />
      )}

      <MealDetailSheet
        open={mealSheet !== null}
        destino={destino}
        city={day.city}
        coordinates={mealSheet ? (mealSheet.coordinates ?? (mealSheet.franja === 'comida' ? lunchCoordinates : null) ?? realStops[mealSheet.stopIndex].coordinates) : { lat: 0, lng: 0 }}
        curatedZone={mealSheet?.franja === 'cena' ? dinnerCuratedZone : lunchCuratedZone}
        curatedZoneDisplay={mealSheet?.franja === 'cena' ? dinnerCuratedZoneDisplay : lunchCuratedZoneDisplay}
        franja={mealSheet?.franja ?? 'comida'}
        dayStops={dayStopRefs}
        onClose={() => setMealSheet(null)}
      />
        </>,
        document.body,
      )}
    </div>
  )
}
