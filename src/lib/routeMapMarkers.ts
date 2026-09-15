import type { DayPlan } from './types'
import type { StopsMapMarker } from '../components/map/StopsMapView'
import { dayColorPastel, dayColorStrong } from './dayColors'
import { hasRealCoordinates } from './distanceMock'

/** Mismo gris neutro que StopDetailSheet.tsx (MUTED_MARKER_BG/MUTED_MARKER_TEXT) — un pin "atenuado" en cualquier mapa de la app se ve igual. */
const MUTED_MARKER_BG = '#E5E7EB'
const MUTED_MARKER_TEXT = '#6B7280'

/**
 * Marcadores de TODOS los días del viaje a la vez, coloreados por día (mismo criterio que el círculo
 * numerado de cada parada en StopAccordion.tsx) — nunca solo el día activo (BLOQUE B, feedback de
 * calidad: "el mapa de DIAS solo marca un lugar"). `highlightDayId` es opcional: si se da, los
 * marcadores de ese día conservan su color y el resto se atenúa a gris (mismo mecanismo de
 * "activo/atenuado" que StopDetailSheet.tsx, aplicado aquí por DÍA en vez de por parada) — nunca se
 * ocultan, solo se atenúan. Sin `highlightDayId`, todos los días se muestran a color completo.
 */
export function buildCombinedDaysMarkers(days: DayPlan[], highlightDayId?: string | null): StopsMapMarker[] {
  return days
    .filter((day) => !day.isReturnLeg)
    .flatMap((day, dayIndex) => {
      const isHighlighted = !highlightDayId || day.id === highlightDayId
      return day.stops
        // Paradas de plantilla/mock sin generar todavía llevan coordenadas (0,0) (ver
        // hasRealCoordinates en distanceMock.ts) — incluirlas reventaría el encuadre del mapa
        // combinado (fitBounds acaba abarcando medio planeta para llegar hasta "null island").
        .filter((stop) => hasRealCoordinates(stop.coordinates))
        .map((stop, stopIndex): StopsMapMarker => ({
          id: stop.id,
          name: stop.name,
          coordinates: stop.coordinates,
          number: stopIndex + 1,
          bg: isHighlighted ? dayColorPastel(dayIndex) : MUTED_MARKER_BG,
          text: isHighlighted ? dayColorStrong(dayIndex) : MUTED_MARKER_TEXT,
          photoUrl: stop.photoUrl,
        }))
    })
}
