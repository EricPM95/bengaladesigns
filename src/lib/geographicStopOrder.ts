import type { Coordinates, Stop } from './types'
import { hasRealCoordinates } from './distanceMock'

/** Distancia euclídea en grados — de sobra para comparar QUÉ parada está más cerca dentro de una misma ciudad/día, no hace falta la precisión de una fórmula de Haversine aquí. */
function roughDistance(a: Coordinates, b: Coordinates): number {
  const dLat = a.lat - b.lat
  const dLng = a.lng - b.lng
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

/**
 * Reordena un conjunto de paradas por proximidad geográfica — heurística del vecino más cercano
 * (greedy): empieza en la primera parada con coordenadas reales y, en cada paso, salta a la más
 * cercana de las que quedan. No es el recorrido óptimo (eso sería un TSP completo, innecesario para
 * un puñado de paradas de un día), pero evita el caso típico de ir y volver cruzando la ciudad.
 * Usado por "Regenerar este día" (DayMenu.tsx) para reordenar lo que el viajero marcó SIN pedirle
 * nada nuevo a Claude — los lugares del Pool ya traen contenido generado, solo hace falta decidir en
 * qué orden visitarlos.
 *
 * Las paradas sin coordenadas reales (plantilla mock, (0,0), ver hasRealCoordinates en
 * distanceMock.ts) se dejan al FINAL en su orden original — no hay forma de ordenarlas por
 * cercanía, y anteponerlas mezclado con paradas reales daría un resultado sin sentido.
 */
export function orderStopsGeographically(stops: Stop[]): Stop[] {
  const withCoords = stops.filter((stop) => hasRealCoordinates(stop.coordinates))
  const withoutCoords = stops.filter((stop) => !hasRealCoordinates(stop.coordinates))
  if (withCoords.length <= 1) return [...withCoords, ...withoutCoords]

  const remaining = [...withCoords]
  const ordered: Stop[] = [remaining.shift()!]

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1]
    let closestIndex = 0
    let closestDistance = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const distance = roughDistance(current.coordinates, remaining[i].coordinates)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }
    ordered.push(remaining.splice(closestIndex, 1)[0])
  }

  return [...ordered, ...withoutCoords]
}
