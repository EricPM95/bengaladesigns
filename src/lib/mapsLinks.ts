import type { TransportMode } from './mockDayDetail'

/**
 * App web (no nativa) — no se puede invocar el selector nativo "Open in Maps" de iOS, así que se
 * muestran dos botones propios ("Abrir en Apple Maps" / "Abrir en Google Maps"), cada uno con su
 * propio enlace; el sistema operativo abre la app correspondiente si está instalada, la web si no.
 */

const APPLE_MAPS_DIRFLG: Record<TransportMode, string> = {
  driving: 'd',
  walking: 'w',
  transit: 'r',
}

export function buildAppleMapsUrl(origin: string, destination: string, mode: TransportMode): string {
  const params = new URLSearchParams({ saddr: origin, daddr: destination, dirflg: APPLE_MAPS_DIRFLG[mode] })
  return `https://maps.apple.com/?${params.toString()}`
}

export function buildGoogleMapsUrl(origin: string, destination: string, mode: TransportMode): string {
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: mode })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** Modo Hoy — "Cómo llegar" desde donde está el viajero AHORA (sin `saddr`/`origin`, ambas apps usan la ubicación actual del dispositivo por defecto). */
export function buildAppleMapsUrlFromHere(destination: string): string {
  const params = new URLSearchParams({ daddr: destination, dirflg: 'w' })
  return `https://maps.apple.com/?${params.toString()}`
}

export function buildGoogleMapsUrlFromHere(destination: string): string {
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'walking' })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
