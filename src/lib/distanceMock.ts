import type { Coordinates } from './types'

/**
 * No hay integración real con Google Maps Distance Matrix (ni clave, ni proxy en server/index.js
 * — ver package.json) — igual que el resto de distancias de la app (ver mockDayDetail.ts
 * `buildRealDisplacement`), se calcula localmente. La posición del viajero SÍ es real (Geolocation
 * del navegador); solo la conversión distancia→tiempo de trayecto es una estimación a pie de
 * andar, no una consulta real de tráfico/transporte. El día que haya backend con clave, solo cambia
 * `estimateWalkMinutes`/la llamada en sí — el `source: 'gps' | 'estimate'` ya distingue en la UI
 * cuándo el dato viene de la ubicación real.
 */

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 1000) / 1000
  }
}

export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** ~5 km/h a pie, con un pequeño margen por cruces/semáforos. */
export function estimateWalkMinutes(meters: number): number {
  return Math.max(1, Math.round((meters / 1000 / 5) * 60 * 1.15))
}

const GEOLOCATION_TIMEOUT_MS = 6000

function getCurrentPositionSafe(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 60_000 },
    )
  })
}

export interface StopDistance {
  meters: number
  walkMinutes: number
  source: 'gps' | 'estimate'
}

function mockDistanceFor(seed: string): StopDistance {
  const rand = seededRandom(seed)
  const meters = 150 + Math.floor(rand() * 750)
  return { meters, walkMinutes: estimateWalkMinutes(meters), source: 'estimate' }
}

const NULL_ISLAND: Coordinates = { lat: 0, lng: 0 }

function hasRealCoordinates(coordinates: Coordinates | undefined): coordinates is Coordinates {
  return Boolean(coordinates) && (coordinates!.lat !== NULL_ISLAND.lat || coordinates!.lng !== NULL_ISLAND.lng)
}

/**
 * Distancia real (GPS del navegador + Haversine) desde la posición actual del viajero hasta una
 * parada — si la parada no tiene coordenadas reales (paradas de plantilla/mock) o no se pudo
 * obtener la ubicación (denegada, no disponible, timeout), cae a una estimación mock determinista
 * por parada, igual que el resto de distancias de la app.
 */
export async function getDistanceToStop(stopId: string, coordinates: Coordinates | undefined): Promise<StopDistance> {
  if (!hasRealCoordinates(coordinates)) return mockDistanceFor(stopId)

  const here = await getCurrentPositionSafe()
  if (!here) return mockDistanceFor(stopId)

  const meters = Math.round(haversineMeters(here, coordinates))
  return { meters, walkMinutes: estimateWalkMinutes(meters), source: 'gps' }
}
