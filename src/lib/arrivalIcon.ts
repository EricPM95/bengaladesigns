/**
 * Icono + color del marcador de "punto de llegada" (aeropuerto/puerto/estación) — usado tanto en el
 * mapa de la ficha de Llegada (ArrivalDetailSheet.tsx) como en el mapa de RUTA (RouteOverviewMap.tsx/
 * StopsMapView.tsx vía RouteView.tsx). Morado a propósito, para distinguirse de un vistazo de los
 * círculos numerados (día/orden) y de los pines de parada normales.
 */

export type ArrivalIconMode = 'flight' | 'ferry' | 'train' | 'other'

export const ARRIVAL_MARKER_BG = '#7C3AED'
export const ARRIVAL_MARKER_TEXT = '#ffffff'

const ICON_BY_MODE: Record<ArrivalIconMode, string> = {
  flight: '✈',
  ferry: '⛴',
  train: '🚆',
  other: '✈',
}

/** `route.transportContext.transport_option?.id` (día 1) o `TransportSegment.mode` (transiciones entre destinos) — ambos usan las mismas strings ('flight'|'ferry'|'train'|'bus'|'roadtrip'|'car'|...), aquí solo nos interesan los 3 que tienen icono propio. */
export function resolveArrivalIconMode(rawMode: string | null | undefined): ArrivalIconMode {
  if (rawMode === 'flight') return 'flight'
  if (rawMode === 'ferry') return 'ferry'
  if (rawMode === 'train') return 'train'
  return 'other'
}

export function arrivalIconFor(rawMode: string | null | undefined): string {
  return ICON_BY_MODE[resolveArrivalIconMode(rawMode)]
}

/** Texto de búsqueda Mapbox más probable de acertar el punto real según el modo — "estación de tren"/"puerto" son más específicos que un genérico "llegada". */
export function arrivalSearchQueryFor(cityName: string, rawMode: string | null | undefined): string {
  const mode = resolveArrivalIconMode(rawMode)
  if (mode === 'ferry') return `Puerto de ${cityName}`
  if (mode === 'train') return `Estación de tren de ${cityName}`
  return `Aeropuerto de ${cityName}`
}
