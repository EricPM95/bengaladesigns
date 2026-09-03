import { useEffect, useState } from 'react'
import type { DayPlan, Stop } from '../../../lib/types'
import type { DayTravelInfo } from '../../../lib/dayTravelInfo'
import type { ConnectorInfo, TransportMode } from '../../../lib/mockDayDetail'
import { dayColorPastel, dayColorStrong } from '../../../lib/dayColors'
import {
  buildAccommodationConnectorInfo,
  buildArrivalDepartureDetail,
  buildConnectorInfo,
  refineConnectorWithRealDistance,
  resolveDisplayStops,
  seedStopsFromTemplate,
} from '../../../lib/mockDayDetail'
import { useRouteStore } from '../../../store/useRouteStore'
import { AccommodationBlock } from './AccommodationBlock'
import { ArrivalDepartureAccordion } from './ArrivalDepartureAccordion'
import { PlaceFinderPanel } from '../placeFinder/PlaceFinderPanel'
import { StopAccordion } from './StopAccordion'
import { StopConnector } from './StopConnector'
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
}

const DEFAULT_MODE: TransportMode = 'walking'

/**
 * Contenido de un día al expandirlo en la pestaña DIAS — bloque(s) "dónde duermes" (estáticos, no
 * acordeón) primero: el de vehículo (camper, o coche de alquiler además del de alojamiento) SOLO en
 * `route.days[0]` (reserva única del viaje, ver VehicleBlock.tsx), luego el de alojamiento cuando
 * este día es el primer día de una estancia sin resolver, LUEGO el acordeón de llegada/vuelta si
 * aplica, y luego una parada por lugar, todo conectado por StopConnector. Solo un acordeón abierto a
 * la vez, con estado propio de este panel (independiente del acordeón "día" de DayList, que ya
 * decidió mostrar este panel).
 *
 * Las paradas se muestran vía `resolveDisplayStops` — plantilla mock mientras `day.stops` esté
 * vacío, paradas reales (editables) en cuanto hay alguna edición (añadir/quitar/mover/cambiar) —
 * ver mockDayDetail.ts. Los conectores no necesitan invalidación explícita: se derivan del ORDEN e
 * ÍNDICE de las paradas en cada render, así que cualquier edición ya los recalcula gratis.
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
}: DayDetailPanelProps) {
  const accommodationResolved = useRouteStore((state) => (stay ? Boolean(state.accommodationSelections[stay.segmentDayId]) : false))
  const tonightHotel = useRouteStore((state) => (nightSegmentDayId ? state.accommodationSelections[nightSegmentDayId] : undefined))
  const previousNightHotel = useRouteStore((state) =>
    previousNightSegmentDayId ? state.accommodationSelections[previousNightSegmentDayId] : undefined,
  )
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const insertStopAt = useRouteStore((state) => state.insertStopAt)

  const [openId, setOpenId] = useState<string | null>(null)
  const [modeOverrides, setModeOverrides] = useState<Record<string, TransportMode>>({})
  const [dayDefaultMode, setDayDefaultMode] = useState<TransportMode | null>(null)
  const [hiddenConnectors, setHiddenConnectors] = useState<Set<string>>(new Set())
  const [insertAt, setInsertAt] = useState<number | null>(null)
  // Distancias/tiempos reales (Directions API de Mapbox) que van sustituyendo al mock inicial de
  // cada conector parada→parada en cuanto resuelven — ver el useEffect más abajo y
  // refineConnectorWithRealDistance en mockDayDetail.ts. Empieza vacío: el primer render siempre
  // muestra el mock (instantáneo), nunca un spinner.
  const [refinedConnectors, setRefinedConnectors] = useState<Record<string, ConnectorInfo>>({})

  const arrivalDetail = travel
    ? buildArrivalDepartureDetail(isLastDay ? travel.fromCity : travel.toCity, origin, isLastDay ? 'departure' : 'arrival')
    : null
  const arrivalId = `${day.id}-arrival`

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

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id))

  const renderConnector = (
    connectorKey: string,
    connector: ReturnType<typeof buildConnectorInfo>,
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
    <div className="space-y-2 px-3 pb-3">
      {isFirstDayOfTrip && showCamperBlock && <VehicleBlock kind="camper" />}

      {stay && !accommodationResolved && <AccommodationBlock city={day.city} segmentDayId={stay.segmentDayId} totalNights={stay.totalNights} />}

      {isFirstDayOfTrip && showRentalCarBlock && <VehicleBlock kind="rental-car" />}

      {arrivalDetail && <ArrivalDepartureAccordion detail={arrivalDetail} expanded={openId === arrivalId} onToggle={() => toggle(arrivalId)} />}

      {stops.map((stop, index) => {
        const connectorKey = `${day.id}-connector-${index}`
        const fromAccommodation = index === 0 && useAccommodationOrigin && previousNightHotel
        const connector = fromAccommodation
          ? buildAccommodationConnectorInfo(`${day.id}-from-accommodation-${previousNightHotel.id}`)
          : (refinedConnectors[connectorKey] ?? buildConnectorInfo(day.id, index))
        const fromName = fromAccommodation ? previousNightHotel.name : index === 0 ? (arrivalDetail ? arrivalDetail.cityName : day.city) : stops[index - 1].name

        return (
          <div key={stop.id}>
            {renderConnector(connectorKey, connector, fromName, stop.name, index)}
            <StopAccordion
              index={index}
              stop={stop}
              circleBg={stopCircleBg}
              circleText={stopCircleText}
              expanded={openId === stop.id}
              onToggle={() => toggle(stop.id)}
              menu={<StopMenu dayId={day.id} city={day.city} stop={realStops[index]} index={index} realStops={realStops} otherDays={otherDays} />}
            />
          </div>
        )
      })}

      {stops.length > 0 &&
        renderConnector(
          `${day.id}-connector-accommodation`,
          tonightHotel
            ? buildAccommodationConnectorInfo(`${day.id}-to-accommodation-${tonightHotel.id}`)
            : { hasRealDisplacement: false, label: 'Fin del día.' },
          stops[stops.length - 1].name,
          tonightHotel?.name ?? '',
          stops.length,
        )}

      <PlaceFinderPanel
        open={insertAt !== null}
        city={day.city}
        excludeStopIds={realStops.map((stop) => stop.id)}
        onPick={(newStop) => {
          if (day.stops.length === 0) seedDayStops(day.id, realStops)
          if (insertAt !== null) insertStopAt(day.id, insertAt, newStop)
          setInsertAt(null)
        }}
        onClose={() => setInsertAt(null)}
      />
    </div>
  )
}
