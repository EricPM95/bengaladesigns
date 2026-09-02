import type { Place, TransportOption } from './types'
import type { TransportFeasibility } from './transportFeasibility'
import { buildFerryOption, buildFlightOption, buildOwnVehicleOption, buildTrainOption, sortByRecommended } from './transportFeasibility'

export { buildFerryOption, buildFlightOption, buildOwnVehicleOption, buildTrainOption }

/**
 * Paso B: de lo que Paso A marcó como geográficamente viable, base_y_excursiones puede ofrecer
 * las cuatro vías — a diferencia de roadtrip_exclusivo, aquí el tren sí encaja. Ferry y road
 * trip con vehículo propio nunca conviven a la vez porque Paso A ya los garantiza mutuamente
 * excluyentes por construcción geográfica. Si ninguna vía pasa el filtro (caso raro), avión hace
 * de red de seguridad.
 */
export function getBaseExcursionesCandidates(feasibility: TransportFeasibility, origin: Place | null): TransportOption[] {
  const candidates: TransportOption[] = []
  if (feasibility.flight.feasible) candidates.push(buildFlightOption(feasibility.flight))
  if (feasibility.train.feasible) candidates.push(buildTrainOption(feasibility.train))
  if (feasibility.ferry.feasible) candidates.push(buildFerryOption(feasibility.ferry))
  if (feasibility.roadtrip.feasible) candidates.push(buildOwnVehicleOption(feasibility.roadtrip, origin))
  if (candidates.length === 0) candidates.push(buildFlightOption(feasibility.flight))
  return sortByRecommended(candidates)
}
