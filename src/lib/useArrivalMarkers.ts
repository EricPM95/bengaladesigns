import { useEffect, useState } from 'react'
import type { Route } from './types'
import type { DestinationSegment } from './destinationSegments'
import { buildArrivalDepartureDetail } from './mockDayDetail'
import { resolveArrivalPointCoordinates } from './arrivalPointGeocoding'
import { ARRIVAL_MARKER_BG, ARRIVAL_MARKER_TEXT, arrivalIconFor } from './arrivalIcon'
import type { StopsMapMarker } from '../components/map/StopsMapView'

/** Día 1 y el de vuelta no tienen su propio TransportSegment (city_transitions solo cubre
    transiciones ENTRE destinos del propio viaje) — para el primer segmento se usa el modo elegido en
    el cuestionario (transport_option); cualquier otro segmento (cambio de ciudad dentro de un viaje
    multidestino) sí tiene su propio day.transport, ver DayDetailPanel.tsx (misma lógica). */
function segmentArrivalMode(route: Route, segment: DestinationSegment, index: number): string | null {
  if (index === 0) return route.transportContext.transport_option?.id ?? null
  const firstDay = route.days.find((day) => day.id === segment.dayIds[0])
  return firstDay?.transport?.mode ?? null
}

/**
 * Un marcador morado (avión/barco/tren) por destino de la ruta, en las coordenadas REALES de su
 * aeropuerto/puerto/estación de llegada — mismo dato/mismo icono que ArrivalDetailSheet.tsx, aquí
 * resuelto para TODOS los segmentos a la vez para el mapa de RUTA (RouteView.tsx). Empieza vacío y
 * se rellena en cuanto resuelve el geocoding — nunca bloquea el primer render del mapa.
 */
export function useArrivalMarkers(route: Route | null, segments: DestinationSegment[]): StopsMapMarker[] {
  const [markers, setMarkers] = useState<StopsMapMarker[]>([])
  const segmentsKey = segments.map((segment) => segment.id).join(',')

  useEffect(() => {
    if (!route) {
      setMarkers([])
      return
    }
    let cancelled = false
    Promise.all(
      segments.map(async (segment, index) => {
        const mode = segmentArrivalMode(route, segment, index)
        const airport = buildArrivalDepartureDetail(segment.city, route.origin, 'arrival').airports[0]
        const knownKey = airport.code ? `${airport.name} (${airport.code})` : undefined
        const coords = await resolveArrivalPointCoordinates(segment.city, mode, knownKey)
        if (!coords) return null
        const marker: StopsMapMarker = {
          id: `arrival-point-${segment.id}`,
          name: segment.city,
          coordinates: coords,
          number: 0,
          bg: ARRIVAL_MARKER_BG,
          text: ARRIVAL_MARKER_TEXT,
          icon: arrivalIconFor(mode),
        }
        return marker
      }),
    ).then((results) => {
      if (!cancelled) setMarkers(results.filter((marker): marker is StopsMapMarker => Boolean(marker)))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentsKey])

  return markers
}
