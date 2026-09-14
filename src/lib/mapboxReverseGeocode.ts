import type { Coordinates } from './types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface MapboxGeocodingFeature {
  text: string
}

interface MapboxGeocodingResponse {
  features?: MapboxGeocodingFeature[]
}

/**
 * Nombre de barrio/zona a partir de unas coordenadas — usado por el acordeón dorado "Hora de
 * comer"/"Hora de cenar" (DayDetailPanel.tsx/MealTimeAccordion.tsx) para titular con la zona REAL
 * donde cae ese punto del itinerario ("Trastevere"), no con el nombre genérico de la ciudad. Pide
 * `neighborhood` primero y cae a `locality` (barrio más amplio) si Mapbox no tiene un barrio
 * concreto para ese punto — null si ninguno de los dos resuelve (quien llama cae al nombre de la
 * ciudad en ese caso).
 */
export async function reverseGeocodeZone(coordinates: Coordinates, signal?: AbortSignal): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json`)
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('types', 'neighborhood,locality')
  url.searchParams.set('language', 'es')
  url.searchParams.set('limit', '1')

  const response = await fetch(url.toString(), { signal })
  if (!response.ok) return null

  const data = (await response.json()) as MapboxGeocodingResponse
  return data.features?.[0]?.text ?? null
}
