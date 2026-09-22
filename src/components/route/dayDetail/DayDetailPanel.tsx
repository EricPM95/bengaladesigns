import { Fragment, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { DayPlan, Stop } from '../../../lib/types'
import type { DayTravelInfo } from '../../../lib/dayTravelInfo'
import type { ConnectorInfo, TransportMode } from '../../../lib/mockDayDetail'
import { dayColorPastel, dayColorStrong } from '../../../lib/dayColors'
import { addDaysToIso, formatShortDateEs } from '../../../lib/dateRange'
import {
  buildCombinedDaysLines,
  buildCombinedDaysMarkers,
  buildExcursionDayLines,
  buildExcursionDayMarkers,
  buildSingleDayLine,
  buildSingleDayMarkers,
} from '../../../lib/routeMapMarkers'
import { minutesToTime, parseTimeToMinutes, roundToNearestQuarterHour } from '../../../lib/time'
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
import { StopsMapView } from '../../map/StopsMapView'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { dinnerWindowFor } from '../../../lib/todayMode'
import {
  CuratedAlternativeBanner,
  ExcursionBanner,
  ExcursionDayProposal,
  ExcursionLink,
  ManualDayLink,
  ManualDayOptions,
} from './ExcursionBlocks'
import { ZoneWalkCard } from './ZoneWalkCard'
import { MapDestinationHeader } from '../MapDestinationHeader'
import { AccommodationBlock } from './AccommodationBlock'
import { ArrivalDetailSheet } from './ArrivalDetailSheet'
import { AddStopScreen } from '../addStop/AddStopScreen'
import { PlaceExplorerScreen } from '../placeExplorer/PlaceExplorerScreen'
import { useDestinationPool } from '../../../lib/useDestinationPool'
import { MealDetailSheet } from './MealDetailSheet'
import { MealTimeAccordion } from './MealTimeAccordion'
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
/** Minutos a pie entre dos paradas cuando el conector no trae un `walkMinutes` real todavía (ni mock ni refinado por Mapbox) — mismo valor de reserva que `retimeStops` en useRouteStore.ts, para que el horario calculado aquí no se desvíe del que ya usa Modo Hoy. */
const DEFAULT_WALK_MINUTES = 15
// Mismos límites/valor por defecto que el tirador de mapa de StopDetailSheet.tsx/ArrivalDetailSheet.tsx — ninguno de los dos lados puede llegar a desaparecer del todo.
const MAP_MIN_VH = 15
const MAP_MAX_VH = 75
const DEFAULT_MAP_VH = 28

type TimeSlot = 'mañana' | 'tarde' | 'noche'

const SLOT_LABELS: Record<TimeSlot, string> = { mañana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }

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
  onBack,
}: DayDetailPanelProps) {
  const accommodationResolved = useRouteStore((state) => (stay ? Boolean(state.accommodationSelections[stay.segmentDayId]) : false))
  const tonightHotel = useRouteStore((state) => (nightSegmentDayId ? state.accommodationSelections[nightSegmentDayId] : undefined))
  const previousNightHotel = useRouteStore((state) =>
    previousNightSegmentDayId ? state.accommodationSelections[previousNightSegmentDayId] : undefined,
  )
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)
  const convertDayType = useRouteStore((state) => state.convertDayType)
  // Prompt 6: paseos que el viajero ha quitado. No vuelven a proponerse en este día — "el algoritmo
  // propone, el viajero dispone". Vive en el panel y no en el store porque el paseo tampoco es una
  // parada real: no está en day.stops del store, lo añade el servidor al generar.
  const [dismissedWalks, setDismissedWalks] = useState<Set<string>>(new Set())
  const selectDayExcursion = useRouteStore((state) => state.selectDayExcursion)
  const route = useRouteStore((state) => state.route)
  const setRouteDateRange = useRouteStore((state) => state.setRouteDateRange)

  const [detailIndex, setDetailIndex] = useState<number | null>(null)
  const [arrivalSheetOpen, setArrivalSheetOpen] = useState(false)
  // Qué bloque de comida/cena está abierto a pantalla completa (MealDetailSheet) — `stopIndex` es la
  // parada tras la que cae esa franja (ancla geográfica), mismo dato que antes recibía
  // MealTimeAccordion directamente. null = cerrado.
  const [mealSheet, setMealSheet] = useState<{ franja: 'comida' | 'cena'; stopIndex: number } | null>(null)
  const [modeOverrides, setModeOverrides] = useState<Record<string, TransportMode>>({})
  const [dayDefaultMode, setDayDefaultMode] = useState<TransportMode | null>(null)
  const [hiddenConnectors, setHiddenConnectors] = useState<Set<string>>(new Set())
  const [insertAt, setInsertAt] = useState<number | null>(null)
  /** Precarga del buscador de AddStopScreen cuando se abre desde el botón "Añadir como parada" de una tarjeta de segunda visita recomendada (ver day.recommendedRevisits) — undefined = buscador vacío, comportamiento normal del "+". */
  const [addStopInitialQuery, setAddStopInitialQuery] = useState<string | undefined>(undefined)
  const [dismissedRevisits, setDismissedRevisits] = useState<Set<string>>(new Set())
  const [mapCollapsed, setMapCollapsed] = useState(false)
  // Ronda 9 (Mejora 1A/1C): por defecto el mapa muestra SOLO el día que se está viendo — antes
  // siempre mostraba todos los días a la vez (con el activo resaltado y el resto atenuado a gris),
  // sin ninguna forma de aislar uno. "Ver todo" alterna a esa vista combinada bajo demanda.
  const [showAllDaysOnMap, setShowAllDaysOnMap] = useState(false)
  const [mapVh, setMapVh] = useState(DEFAULT_MAP_VH)
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
  const visitCount = stops.reduce((count, _stop, index) => (realStops[index]?.isZoneWalk ? count : count + 1), 0)
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
  const { places: curatedPool, excursions: curatedExcursions, resolved: curatedPoolResolved } = useDestinationPool(day.city, insertAt !== null)

  // "+" entre dos paradas: el lugar elegido entra EXACTAMENTE en ese hueco (no al final del día), y
  // a partir de ahí manda el store — recalcula solo el tramo con la parada anterior y redondea al
  // cuarto más cercano, sin volver a replanificar nada del día (ver insertStopAt en useRouteStore.ts).
  const addStopBefore = insertAt !== null && insertAt > 0 ? (realStops[insertAt - 1]?.name ?? null) : null
  const addStopAfter = insertAt !== null && insertAt < realStops.length ? (realStops[insertAt]?.name ?? null) : null
  const addStopSubtitle = addStopBefore && addStopAfter ? `Entre ${addStopBefore} y ${addStopAfter}` : addStopBefore ? `Después de ${addStopBefore}` : addStopAfter ? `Antes de ${addStopAfter}` : day.city

  const addPickedStop = (newStop: Stop) => {
    if (day.stops.length === 0) seedDayStops(day.id, realStops)
    if (insertAt !== null) insertStopAt(day.id, insertAt, newStop)
    setInsertAt(null)
    setAddStopInitialQuery(undefined)
  }

  const closeAddStop = () => {
    setInsertAt(null)
    setAddStopInitialQuery(undefined)
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
  const lunchInsertionIndex = findMealInsertionIndex(schedule, LUNCH_WINDOW)
  // La ventana de cena la decide el día (20:00 o 20:30, ver dinnerWindowFor) — ya no es constante.
  const dinnerInsertionIndex = findMealInsertionIndex(schedule, dinnerWindowFor(day))
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
    return (route?.defaultTransport ?? 'public') === 'car' ? 'driving' : 'transit'
  }

  const renderGap = (
    connectorKey: string,
    connector: ConnectorInfo | null,
    fromName: string,
    toName: string,
    addStopIndex: number,
  ) => {
    const resolvedMode = modeOverrides[connectorKey] ?? dayDefaultMode ?? defaultModeFor(connector)
    return (
      <StopConnector
        key={connectorKey}
        connector={hiddenConnectors.has(connectorKey) ? null : connector}
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

  // Hueco junto a un bloque de comida/cena (BLOQUE B): no hay desplazamiento calculado hacia una
  // comida (MealTimeAccordion no es una parada real), así que es un hueco sin conector. Solo se
  // pinta el de ANTES de la tarjeta dorada — el de después ya lo cubre el hueco que abre la
  // siguiente parada (o el de fin de día si la comida cierra el día), y pintar los dos dejaría dos
  // botones pegados.
  const renderMealGap = (insertIndex: number) => renderGap(`${day.id}-meal-gap-${insertIndex}`, null, '', '', insertIndex)

  // Mismo patrón de tirador arrastrable que StopDetailSheet.tsx/ArrivalDetailSheet.tsx — agranda/encoge el mini-mapa, clamped entre MAP_MIN_VH y MAP_MAX_VH.
  const handleMapDragStart = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startVh = mapVh
    const vhUnit = window.innerHeight / 100
    const clampedVh = (clientY: number) => Math.min(MAP_MAX_VH, Math.max(MAP_MIN_VH, startVh + (clientY - startY) / vhUnit))
    const onPointerMove = (moveEvent: PointerEvent) => setMapVh(clampedVh(moveEvent.clientY))
    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      setMapVh(clampedVh(upEvent.clientY))
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // StopDetailSheet/ArrivalDetailSheet abren su PROPIO mapa encima de este mismo panel — dos
  // canvas WebGL de Mapbox GL montados a la vez arriesgan que el de abajo se "filtre" por encima
  // del overlay que se supone que lo tapa (compositing GPU del canvas, no un problema de z-index —
  // ver el comentario junto a dayDetailOpen en RouteView.tsx, mismo motivo). Se trata igual que el
  // colapsado manual: mientras cualquiera de esos esté abierto, este mapa ni se monta.
  // `insertAt !== null` = está abierta la pantalla de añadir parada, que también trae su propio
  // mapa: sin esto el mapa del día se veía POR ENCIMA de ella, con su cabecera y su "Ver todo".
  const mapHiddenBySheet = detailIndex !== null || arrivalSheetOpen || mealSheet !== null || insertAt !== null

  // ── Prompt 4: tipo de día y prominencia de excursión ────────────────────────────────────────
  const dayType = day.dayType ?? 'normal'
  const prominence = day.excursionProminence ?? 'none'
  // Un día de excursión o libre no enseña paradas: las suyas (si las tenía) siguen guardadas para
  // poder volver a la ruta, pero el contenido del día es otro.
  const showsRoute = dayType === 'normal' || dayType === 'smart_route'
  const excursionOptions = day.excursions ?? []
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

  return (
    <div className="map-cover-overlay fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
      {mapCollapsed || mapHiddenBySheet ? (
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
        <div className="relative shrink-0" style={{ height: `${mapVh}vh` }}>
          <StopsMapView markers={dayMarkers} lines={dayMapLines} center={dayMapCenter} />
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            title="Volver"
            className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-bg-card text-text shadow-md transition-colors hover:bg-bg-hover"
          >
            <BackIcon />
          </button>
          {/* Ronda 10: la cabecera destino + fechas va también aquí, arriba centrada — el sitio que
              ocupaba "Ver todo" hasta ahora. Misma cabecera y mismo calendario que en RUTA y DIAS,
              para que el destino y las fechas del viaje se vean desde cualquier mapa de la app. */}
          {route && (
            <MapDestinationHeader destination={route.destination} dateRange={route.answers.dateRange} onChangeDateRange={setRouteDateRange} />
          )}
          {/* Ronda 9 (Mejora 1C): alterna entre "solo este día" (por defecto) y "Ver todo" — texto
              en vez de icono a propósito, es un cambio de MODO del mapa, no una acción puntual como
              el resto de botones circulares de esta cabecera. Ronda 10: abajo a la izquierda y en
              gris discreto — es un ajuste de la vista, no un protagonista de la pantalla, y arriba
              estorbaba a la cabecera del viaje. */}
          <button
            type="button"
            onClick={() => setShowAllDaysOnMap((prev) => !prev)}
            className="absolute bottom-3 left-3 z-10 rounded-full border border-border bg-bg-card/90 px-3 py-1.5 text-caption font-medium text-text-soft shadow-sm backdrop-blur-sm transition-colors hover:bg-bg-hover hover:text-text"
          >
            {showAllDaysOnMap ? 'Solo este día' : 'Ver todo'}
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

      {!mapCollapsed && (
        <div onPointerDown={handleMapDragStart} className="flex shrink-0 cursor-row-resize touch-none items-center justify-center bg-bg-card py-2">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
            Día {day.dayNumber}
            {dateIso ? ` · ${formatShortDateEs(dateIso).toUpperCase()}` : ''}
          </p>
          <h1 className="font-display text-h1 font-bold text-text">{day.city}</h1>
          <div className={`mt-2.5 mb-4 items-center gap-2.5 overflow-x-auto rounded-xl bg-bg-hover px-3 py-2.5 text-small text-text-soft ${showsRoute && stops.length > 0 ? 'flex' : 'hidden'}`}>
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <SummaryPinIcon className="text-accent-hover" />
              {visitCount} parada{visitCount === 1 ? '' : 's'}
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
          {/* Prominente: el banner va ENCIMA de la ruta y no la quita — el viajero ve las dos cosas
              y elige. Se puede cerrar sin perder nada (regla 9). */}
          {showsRoute && prominence === 'prominent' && day.excursionHighlights && day.excursionHighlights.length > 0 && (
            <ExcursionBanner destination={day.city} highlights={day.excursionHighlights} onSeeAll={() => convertDay('excursion')} />
          )}

          {dayType === 'excursion' && (
            <div className="space-y-3 pt-1">
              {/* Regla 10: si este día tenía ruta curada, SIEMPRE se ofrece volver a ella. */}
              {day.curatedAlternative && <CuratedAlternativeBanner alternative={day.curatedAlternative} onRestore={() => convertDay('normal')} />}
              {excursionOptions.length > 0 ? (
                <ExcursionDayProposal
                  destination={day.city}
                  options={excursionOptions}
                  selectedId={day.selectedExcursionId ?? null}
                  socialProof={day.excursionSocialProof}
                  onSelect={(id) => selectDayExcursion(day.id, id)}
                  // Rechazar devuelve el día a ruta de ciudad. El motor ya tiene el core day
                  // desplazado esperando, así que el día no se queda vacío ni repetido.
                  onDecline={() => convertDay('normal')}
                />
              ) : (
                <p className="py-6 text-center text-small text-text-soft">Todavía no tenemos excursiones seleccionadas para {day.city}.</p>
              )}
            </div>
          )}

          {dayType === 'manual' && stops.length === 0 && (
            <div className="pt-1">
              <ManualDayOptions onSearchPlaces={() => setInsertAt(0)} onSearchExcursions={() => convertDay('excursion')} />
            </div>
          )}

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

          {/* Un día de EXCURSIÓN guarda su ruta para poder volver a ella, pero no la enseña. Un día
              LIBRE sí enseña lo que el viajero ya haya montado. */}
          {(showsRoute || (dayType === 'manual' && stops.length > 0)) &&
            stops.map((stop, index) => {
            const { connectorKey, connector, fromName, fromAccommodation } = connectorEntries[index]
            const { slot, startMinutes } = schedule[index]
            const showSlotHeader = index === 0 || slot !== schedule[index - 1].slot
            // La primera parada del día nunca lleva el conector de relleno genérico ("Después de
            // instalarte...", "Buen momento para parar a comer algo..." — ver TEXT_ONLY_CONNECTORS
            // en mockDayDetail.ts): el viajero decide por su cuenta cómo llegar desde el alojamiento,
            // la ruta empieza directamente en el lugar 1. SÍ se muestra cuando el conector es real
            // (viene del alojamiento de anoche, con distancia/tiempo real) — ese es información útil,
            // no relleno.
            // El paseo por barrio no lleva conector: "6 min · 540 m" hasta un barrio entero no
            // significa nada — el paseo empieza donde acabó la parada anterior.
            const showConnector = realStops[index]?.isZoneWalk ? false : index === 0 ? fromAccommodation : slot === schedule[index - 1].slot
            const walkDismissed = Boolean(realStops[index]?.isZoneWalk) && dismissedWalks.has(stop.name)
            const showLunchAccordion = lunchInsertionIndex === index
            const showDinnerAccordion = dinnerInsertionIndex === index

            // Rango horario de la franja completa (ej. "09:00 — 13:30") — busca hasta dónde llega
            // esta misma franja (mismo criterio que `showConnector`: mientras el slot no cambie) para
            // usar el fin de la ÚLTIMA parada de la franja, no solo el de esta.
            let slotRangeLabel = ''
            if (showSlotHeader) {
              let lastIndexInSlot = index
              while (lastIndexInSlot + 1 < schedule.length && schedule[lastIndexInSlot + 1].slot === slot) lastIndexInSlot++
              // Redondeo hacia arriba al cuarto de hora en los dos extremos del rango — el de inicio
              // ya suele venir redondeado desde el propio `schedule`, pero el de fin es fin+duración
              // (no necesariamente un cuarto de hora exacto), así que se redondea aquí explícitamente.
              slotRangeLabel = `${minutesToTime(roundToNearestQuarterHour(startMinutes))} — ${minutesToTime(roundToNearestQuarterHour(schedule[lastIndexInSlot].endMinutes))}`
            }

            return (
              <Fragment key={stop.id}>
                <div>
                  {showSlotHeader && (
                    <p className="px-1 pb-1 pt-6 text-caption font-semibold uppercase tracking-wide text-text-muted">
                      {SLOT_LABELS[slot]} · {slotRangeLabel}
                    </p>
                  )}
                  {/* El hueco SIEMPRE se pinta; `showConnector` decide solo si además lleva la
                      información de desplazamiento (ver renderGap). Única excepción: un paseo que el
                      viajero ya ha quitado no deja ni rastro — ni tarjeta ni su "+ Añadir parada",
                      que si no quedarían dos seguidos. */}
                  {walkDismissed ? null : renderGap(connectorKey, showConnector ? connector : null, fromName, stop.name, index)}
                  {realStops[index]?.isZoneWalk ? (
                    walkDismissed ? null : (
                      <ZoneWalkCard
                        stop={stop}
                        startTime={minutesToTime(startMinutes)}
                        onDismiss={() => setDismissedWalks((prev) => new Set(prev).add(stop.name))}
                      />
                    )
                  ) : (
                    <StopAccordion
                      index={index}
                      stop={stop}
                      circleBg={stopCircleBg}
                      circleText={stopCircleText}
                      startTime={minutesToTime(startMinutes)}
                      onOpen={() => setDetailIndex(index)}
                      menu={<StopMenu dayId={day.id} city={day.city} stop={realStops[index]} index={index} realStops={realStops} otherDays={otherDays} />}
                    />
                  )}
                </div>
                {showLunchAccordion && (
                  <>
                    {renderMealGap(index + 1)}
                    <div className="pt-2">
                      <MealTimeAccordion
                        destino={destino}
                        city={day.city}
                        coordinates={realStops[index].coordinates}
                        curatedZone={lunchCuratedZone}
                        curatedZoneDisplay={lunchCuratedZoneDisplay}
                        franja="comida"
                        onOpen={() => setMealSheet({ franja: 'comida', stopIndex: index })}
                      />
                    </div>
                  </>
                )}
                {showDinnerAccordion && (
                  <>
                    {renderMealGap(index + 1)}
                    <div className="pt-2">
                      <MealTimeAccordion
                        destino={destino}
                        city={day.city}
                        coordinates={realStops[index].coordinates}
                        curatedZone={dinnerCuratedZone}
                        curatedZoneDisplay={dinnerCuratedZoneDisplay}
                        franja="cena"
                        onOpen={() => setMealSheet({ franja: 'cena', stopIndex: index })}
                      />
                    </div>
                  </>
                )}
              </Fragment>
            )
          })}

          {/* Hueco de fin de día: también se pinta siempre, aunque todavía no se sepa dónde se
              duerme (sin alojamiento elegido no hay `finalConnector` que mostrar, pero sí tiene que
              poder añadirse una parada al final del día). */}
          {stops.length > 0 &&
            renderGap(`${day.id}-connector-accommodation`, finalConnector, stops[stops.length - 1].name, tonightHotel?.name ?? '', stops.length)}

          {/* Salidas del día. En prominencia sutil el link es lo ÚNICO que se ve de excursiones, y
              tiene que quedarse pequeño: el 90% de los viajeros no busca una excursión el día 2. */}
          {showsRoute && prominence === 'subtle' && !day.excursionDeclined && (
            <ExcursionLink label="¿Prefieres una excursión este día?" onClick={() => convertDay('excursion')} />
          )}
          {/* Rechazada: no se vuelve a proponer sola, pero el camino de vuelta queda abierto. */}
          {showsRoute && day.excursionDeclined && <ExcursionLink label="Añadir excursión" onClick={() => convertDay('excursion')} />}
          {dayType === 'excursion' && (
            <ExcursionLink label="Generar una ruta para este día" onClick={() => convertDay('smart_route')} />
          )}
          {dayType !== 'manual' && prominence !== 'none' && <ManualDayLink onClick={() => convertDay('manual')} />}

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
      </div>

      <StopDetailSheet
        stop={detailIndex !== null ? stops[detailIndex] : null}
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
      />

      <ArrivalDetailSheet
        detail={arrivalSheetOpen ? arrivalDetail : null}
        dayNumber={day.dayNumber}
        dateIso={dateIso}
        dayStops={dayStopRefs}
        transportModeId={arrivalTransportModeId}
        onClose={() => setArrivalSheetOpen(false)}
      />

      <MealDetailSheet
        open={mealSheet !== null}
        destino={destino}
        city={day.city}
        coordinates={mealSheet ? realStops[mealSheet.stopIndex].coordinates : { lat: 0, lng: 0 }}
        curatedZone={mealSheet?.franja === 'cena' ? dinnerCuratedZone : lunchCuratedZone}
        curatedZoneDisplay={mealSheet?.franja === 'cena' ? dinnerCuratedZoneDisplay : lunchCuratedZoneDisplay}
        franja={mealSheet?.franja ?? 'comida'}
        dayStops={dayStopRefs}
        onClose={() => setMealSheet(null)}
      />
    </div>
  )
}
