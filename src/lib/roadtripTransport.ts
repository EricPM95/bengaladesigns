import type { Place, TransportOption } from './types'
import type { TransportFeasibility } from './transportFeasibility'
import { buildFerryOption, buildOwnVehicleOption, sortByRecommended } from './transportFeasibility'

export { buildFerryOption, buildOwnVehicleOption }

/**
 * Copy propia de roadtrip_exclusivo (no la neutra de transportFeasibility.ts): presupone que el
 * viajero va a conducir en cuanto aterriza, cosa que no es cierta para el resto de arquetipos.
 */
export function buildFlightOption(flight: TransportFeasibility['flight']): TransportOption {
  return {
    id: 'flight',
    icon: '✈️',
    title: 'Avión',
    description: flight.via_label ? `Vuelas hasta ${flight.via_label} y recoges tu vehículo allí.` : 'La forma más rápida de plantarte allí y empezar a rodar.',
    subtitle: 'Aterrizas y recoges tu vehículo',
    estimated_duration: flight.duration_label,
    estimated_price: flight.price_label,
    recommended: flight.recommended,
    includes_vehicle: false,
    vehicle_type: null,
    accommodation_type: 'hotel',
  }
}

/**
 * Paso B: de lo que Paso A marcó como geográficamente viable, roadtrip_exclusivo nunca ofrece
 * Tren (no encaja con "la carretera es la experiencia") — sí puede ofrecer ruta con vehículo
 * propio, avión y ferry. Si ninguna vía pasa el filtro (caso raro), avión hace de red de
 * seguridad — nunca se deja al usuario sin ninguna opción.
 */
export function getRoadtripCandidates(feasibility: TransportFeasibility, origin: Place | null): TransportOption[] {
  const candidates: TransportOption[] = []
  if (feasibility.roadtrip.feasible) candidates.push(buildOwnVehicleOption(feasibility.roadtrip, origin))
  if (feasibility.flight.feasible) candidates.push(buildFlightOption(feasibility.flight))
  if (feasibility.ferry.feasible) candidates.push(buildFerryOption(feasibility.ferry))
  if (candidates.length === 0) candidates.push(buildFlightOption(feasibility.flight))
  return sortByRecommended(candidates)
}
