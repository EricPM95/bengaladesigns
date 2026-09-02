import type { Place, TransportOption } from './types'

/**
 * Hechos de viabilidad geográfica (Paso A) — universal, igual para cualquier arquetipo. No sabe
 * nada de cómo se disfruta el destino ni decide qué mostrar; eso es responsabilidad de cada
 * arquetipo (Paso B, ver getRoadtripCandidates / getBaseExcursionesCandidates /
 * getUrbanoCandidates en sus propios módulos). Los cinco modos son candidatos independientes,
 * salvo ferry/roadtrip, que Claude ya garantiza mutuamente excluyentes por construcción
 * geográfica (si hay una barrera marítima insalvable, no puede existir a la vez un trayecto
 * terrestre completo — ver el prompt en el backend).
 */
export interface TransportFeasibility {
  flight: { feasible: boolean; recommended: boolean; duration_label: string; price_label: string; via_label: string }
  ferry: { feasible: boolean; recommended: boolean; duration_label: string; price_label: string; route_label: string }
  train: { feasible: boolean; recommended: boolean; duration_label: string; price_label: string; station_label: string }
  bus: { feasible: boolean; recommended: boolean; duration_label: string; price_label: string; station_label: string }
  roadtrip: { feasible: boolean; recommended: boolean; duration_label: string; price_label: string; highlight: string }
  /** Característica del destino, no del origen: si sus carreteras admiten circular con camper/autocaravana. */
  camper_access: { feasible: boolean; reason: string }
}

/** Copy neutra — no presupone nada sobre cómo se mueve el viajero tras aterrizar. */
export function buildFlightOption(flight: TransportFeasibility['flight']): TransportOption {
  return {
    id: 'flight',
    icon: '✈️',
    title: 'Avión',
    description: flight.via_label ? `Vuelas hasta ${flight.via_label} y sigues desde ahí.` : 'La forma más rápida de plantarte allí.',
    subtitle: 'Aterrizas y decides cómo moverte después',
    estimated_duration: flight.duration_label,
    estimated_price: flight.price_label,
    recommended: flight.recommended,
    includes_vehicle: false,
    vehicle_type: null,
    accommodation_type: 'hotel',
  }
}

export function buildFerryOption(ferry: TransportFeasibility['ferry']): TransportOption {
  return {
    id: 'ferry',
    icon: '⛴️',
    title: 'Ferry',
    description: ferry.route_label ? `Travesía ${ferry.route_label}` : 'El viaje empieza en cuanto zarpas.',
    subtitle: 'El primer tramo de la aventura, ya en el mar',
    estimated_duration: ferry.duration_label,
    estimated_price: ferry.price_label,
    recommended: ferry.recommended,
    includes_vehicle: false,
    vehicle_type: null,
    accommodation_type: 'hotel',
  }
}

export function buildTrainOption(train: TransportFeasibility['train']): TransportOption {
  return {
    id: 'train',
    icon: '🚆',
    title: 'Tren',
    description: train.station_label ? `Llegas hasta ${train.station_label} y sigues desde ahí.` : 'Directo hasta un punto cómodo de la zona.',
    subtitle: 'Sin volante hasta el último tramo',
    estimated_duration: train.duration_label,
    estimated_price: train.price_label,
    recommended: train.recommended,
    includes_vehicle: false,
    vehicle_type: null,
    accommodation_type: 'hotel',
  }
}

export function buildBusOption(bus: TransportFeasibility['bus']): TransportOption {
  return {
    id: 'bus',
    icon: '🚌',
    title: 'Autobús',
    description: bus.station_label ? `Llegas hasta ${bus.station_label} y sigues desde ahí.` : 'La opción más económica para llegar.',
    subtitle: 'Más lento, pero cuida el bolsillo',
    estimated_duration: bus.duration_label,
    estimated_price: bus.price_label,
    recommended: bus.recommended,
    includes_vehicle: false,
    vehicle_type: null,
    accommodation_type: 'hotel',
  }
}

export function buildOwnVehicleOption(roadtrip: TransportFeasibility['roadtrip'], origin: Place | null): TransportOption {
  const originName = origin?.name ?? 'tu ciudad'
  return {
    id: 'own_vehicle',
    icon: '🛣️',
    title: `Ruta por libre desde ${originName}`,
    description: roadtrip.highlight,
    subtitle: 'Con tu propio vehículo, al ritmo que tú marques',
    estimated_duration: roadtrip.duration_label,
    estimated_price: roadtrip.price_label,
    recommended: roadtrip.recommended,
    includes_vehicle: true,
    vehicle_type: null,
    accommodation_type: 'hotel',
  }
}

/**
 * La tarjeta "Recomendada" (si hay alguna entre los candidatos) siempre va primera en el
 * listado de Fase 1 — el resto conserva su orden relativo. Propiedad global del sistema de
 * tarjetas (como el propio flag `recommended`), no de la lógica de un arquetipo concreto: cada
 * `getXCandidates` de Paso B la aplica justo antes de devolver su lista final.
 */
export function sortByRecommended(candidates: TransportOption[]): TransportOption[] {
  const recommendedIndex = candidates.findIndex((option) => option.recommended)
  if (recommendedIndex <= 0) return candidates
  return [candidates[recommendedIndex], ...candidates.slice(0, recommendedIndex), ...candidates.slice(recommendedIndex + 1)]
}
