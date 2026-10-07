import type { Coordinates } from './types'
import { findTransitLine } from '../../shared/routeEngine/transitLines.js'

/**
 * «Transporte público» solo si existe una línea real entre los dos sitios (Tanda 6f, 4k); las líneas y la regla están en shared/routeEngine/transitLines.js (las comparte el informe).
 * Devuelve null si no hay ninguna: entonces la opción no sale.
 */
export function findTransitOption(city: string, from: Coordinates | undefined, to: Coordinates | undefined): { line: string; kind: 'metro' | 'tranvia' | 'bus'; minutes: number } | null {
  if (!from || !to) return null
  return findTransitLine(city, [from.lat, from.lng], [to.lat, to.lng])
}
