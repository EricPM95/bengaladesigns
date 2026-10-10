import type { Coordinates, Stop } from './types'
import { getRoutedDistance } from './mapboxDirections'
import { hasRealCoordinates } from './distanceMock'

/**
 * El trayecto entre dos paradas como lo lee el viajero (Tanda 6: «8 min andando», «Taxi, 15 min», «Bus 23, 20 min»).
 * Si la parada llega en bus, metro, tranvía o taxi (`transitLabel`: «Bus 118 o el 870, unos 25 min») se enseña eso, con la
 * primera opción; si no, el tiempo andando de Mapbox. Sin coordenadas reales ni línea, null (nunca un número inventado).
 */
export function formatTransitLeg(label: string): string {
  const minutes = /(\d+)\s*min/.exec(label)
  const clean = label.replace(/^[^\p{L}\p{N}]+/u, '')
  const head = clean.split(',')[0].split(/\s+o\s+/)[0].trim().replace(/^(un|una|el|la)\s+/i, '')
  const line = head.charAt(0).toUpperCase() + head.slice(1)
  return minutes ? `${line}, ${minutes[1]} min` : line
}

export async function legLabelBetween(from: Coordinates | undefined, to: Stop): Promise<string | null> {
  if (to.transitLabel) return formatTransitLeg(to.transitLabel)
  if (!hasRealCoordinates(from) || !hasRealCoordinates(to.coordinates)) return null
  const walking = await getRoutedDistance('walking', from, to.coordinates)
  return walking ? `${walking.minutes} min andando` : null
}

/** Minutos andando entre dos puntos (Mapbox), o null. Para la cuenta atrás de una reserva. */
export async function walkMinutesBetween(from: Coordinates | undefined, to: Coordinates | undefined): Promise<number | null> {
  if (!hasRealCoordinates(from) || !hasRealCoordinates(to)) return null
  const walking = await getRoutedDistance('walking', from, to)
  return walking ? walking.minutes : null
}
