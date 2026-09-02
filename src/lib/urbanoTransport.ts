import type { Place, TransportOption } from './types'
import type { TransportFeasibility } from './transportFeasibility'
import { buildBusOption, buildFerryOption, buildFlightOption, buildOwnVehicleOption, buildTrainOption, sortByRecommended } from './transportFeasibility'

export { buildFlightOption }

/**
 * Paso B: de lo que Paso A marcó como geográficamente viable, urbano_clasico ofrece las cinco
 * vías — cualquiera real, incluida cuando la ciudad está en una isla y depende de un ferry real
 * (ej. Tenerife → Las Palmas, con conexión real Fred Olsen/Naviera Armas), de un trayecto en
 * coche razonable entre dos ciudades cercanas (ej. Florencia → Roma, ~3h), o de un autobús
 * directo/con 1 trasbordo (ej. Barcelona → Madrid). El umbral de cada modo es el mismo que en el
 * resto de arquetipos — ni más permisivo ni más estricto; no hay ninguna exclusión especial aquí.
 * Si ninguna vía pasa el filtro (caso raro), avión hace de red de seguridad.
 */
export function getUrbanoCandidates(feasibility: TransportFeasibility, origin: Place | null): TransportOption[] {
  const candidates: TransportOption[] = []
  if (feasibility.flight.feasible) candidates.push(buildFlightOption(feasibility.flight))
  if (feasibility.train.feasible) candidates.push(buildTrainOption(feasibility.train))
  if (feasibility.bus.feasible) candidates.push(buildBusOption(feasibility.bus))
  if (feasibility.ferry.feasible) candidates.push(buildFerryOption(feasibility.ferry))
  if (feasibility.roadtrip.feasible) candidates.push(buildOwnVehicleOption(feasibility.roadtrip, origin))
  if (candidates.length === 0) candidates.push(buildFlightOption(feasibility.flight))
  return sortByRecommended(candidates)
}
