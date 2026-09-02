import type { TransportOption } from './types'
import type { TransportFeasibility } from './transportFeasibility'
import { buildBusOption, buildFlightOption, buildTrainOption, sortByRecommended } from './transportFeasibility'

export { buildFlightOption }

/**
 * Paso B: de lo que Paso A marcó como geográficamente viable, multidestino_tren_o_vuelo ofrece
 * Avión / Tren / Autobús desde el origen real hasta la primera ciudad del viaje — nunca ferry ni
 * roadtrip con vehículo propio, que no encajan en un arquetipo diseñado para no depender de
 * coche en ningún tramo (ni de llegada, ni entre ciudades). Si ninguna vía pasa el filtro (caso
 * raro), avión hace de red de seguridad.
 */
export function getMultidestinoCandidates(feasibility: TransportFeasibility): TransportOption[] {
  const candidates: TransportOption[] = []
  if (feasibility.flight.feasible) candidates.push(buildFlightOption(feasibility.flight))
  if (feasibility.train.feasible) candidates.push(buildTrainOption(feasibility.train))
  if (feasibility.bus.feasible) candidates.push(buildBusOption(feasibility.bus))
  if (candidates.length === 0) candidates.push(buildFlightOption(feasibility.flight))
  return sortByRecommended(candidates)
}
