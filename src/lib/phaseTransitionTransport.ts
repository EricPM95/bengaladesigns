import type { PhaseType, TransportMode, TransportSegment, TransportSegmentAlternative } from './types'
import { buildSearchUrl, transportModeIcon } from './cityTransitionTransport'

export { transportModeIcon }

interface FeasibilityLeg {
  feasible: boolean
  duration_label: string
  price_label: string
}

/**
 * Hechos de un tramo entre dos FASES de una ruta ya generada (multidestino_mixto_o_circuito,
 * Paso 3) — devueltos por Claude en la misma llamada de generación de ruta, junto al esqueleto de
 * días (city/phase_type por día, Paso 2, fuera del alcance de este archivo). Mismo espíritu que
 * CityTransitionFact (multidestino_tren_o_vuelo): solo hechos, nunca decide qué mostrar.
 *
 * A diferencia de CityTransitionFact, aquí el TIPO de cada fase (urbana/naturaleza/isla) decide
 * qué subconjunto de estos hechos importa — ver `legKind` más abajo. Claude rellena todos los
 * campos que tengan sentido para ese par concreto y deja el resto en feasible=false.
 */
export interface PhaseTransitionFact {
  dayNumber: number
  fromPhase: string
  toPhase: string
  fromPhaseType: PhaseType
  toPhaseType: PhaseType
  train: FeasibilityLeg
  flight: FeasibilityLeg
  bus: FeasibilityLeg
  ferry: FeasibilityLeg
  transferOrganizado: FeasibilityLeg
  roadtripAlquiler: FeasibilityLeg & {
    /** true solo si esta región concreta tiene cultura real de alquiler de camper/autocaravana (excepción, no la norma en este arquetipo). */
    aptoCamperAutocaravana: boolean
  }
  /** Cuál candidato es el mejor para un viajero medio — 'roadtrip' cubre tanto 'car' como 'campervan', sin decidir entre ellos. null si ninguno es feasible. */
  recommended: 'train' | 'flight' | 'bus' | 'ferry' | 'transfer' | 'roadtrip' | null
}

type LegKind = 'urban_urban' | 'urban_nature' | 'island'

/**
 * El tipo de las dos fases decide qué candidatos tienen sentido — nunca se confía solo en que
 * Claude haya marcado feasible=false en los campos que no aplican (defensa en profundidad, mismo
 * principio que el resto de la app: el código decide qué se muestra, no el modelo).
 */
function legKind(fromType: PhaseType, toType: PhaseType): LegKind {
  if (fromType === 'isla' || toType === 'isla') return 'island'
  if (fromType === 'urbana' && toType === 'urbana') return 'urban_urban'
  return 'urban_nature'
}

/** 'car' y 'campervan' son ambos variantes de "roadtrip de alquiler" a efectos de qué candidato quedó recomendado. */
function candidateCategory(mode: TransportMode): string {
  return mode === 'car' || mode === 'campervan' ? 'roadtrip' : mode
}

function buildSimpleAlternative(mode: 'train' | 'flight' | 'bus' | 'ferry' | 'transfer', leg: FeasibilityLeg, fact: PhaseTransitionFact): TransportSegmentAlternative {
  return {
    mode: mode as TransportMode,
    durationLabel: leg.duration_label,
    priceLabel: leg.price_label,
    searchUrl: buildSearchUrl(mode, fact.fromPhase, fact.toPhase),
  }
}

/**
 * El coche de alquiler es un candidato ("roadtrip") con hasta dos variantes: Coche siempre que
 * roadtripAlquiler sea viable, y además Camper/Autocaravana solo cuando `aptoCamperAutocaravana`
 * — la mayoría de destinos de este arquetipo (Tailandia, Vietnam, Malasia, Perú, Colombia...) no
 * tienen cultura de autocaravana, así que por defecto solo se ofrece Coche. Deja constancia de en
 * qué ciudad se recoge/devuelve el vehículo (asumiendo alquiler de un solo sentido, siguiendo la
 * dirección del tramo) — la lógica de posible cargo por devolución en otra ciudad queda para más
 * adelante, pero el dato ya vive en la estructura.
 */
function buildRoadtripAlternatives(fact: PhaseTransitionFact): TransportSegmentAlternative[] {
  const leg = fact.roadtripAlquiler
  if (!leg.feasible) return []

  const base = {
    durationLabel: leg.duration_label,
    priceLabel: leg.price_label,
    rentalPickupCity: fact.fromPhase,
    rentalReturnCity: fact.toPhase,
  }

  const alternatives: TransportSegmentAlternative[] = [{ mode: 'car', ...base, searchUrl: buildSearchUrl('car', fact.fromPhase, fact.toPhase) }]
  if (leg.aptoCamperAutocaravana) {
    alternatives.push({ mode: 'campervan', ...base, searchUrl: buildSearchUrl('campervan', fact.fromPhase, fact.toPhase) })
  }
  return alternatives
}

function buildUrbanUrbanCandidates(fact: PhaseTransitionFact): TransportSegmentAlternative[] {
  const candidates: TransportSegmentAlternative[] = []
  if (fact.flight.feasible) candidates.push(buildSimpleAlternative('flight', fact.flight, fact))
  if (fact.train.feasible) candidates.push(buildSimpleAlternative('train', fact.train, fact))
  if (fact.bus.feasible) candidates.push(buildSimpleAlternative('bus', fact.bus, fact))
  return candidates
}

function buildIslandCandidates(fact: PhaseTransitionFact): TransportSegmentAlternative[] {
  const candidates: TransportSegmentAlternative[] = []
  if (fact.ferry.feasible) candidates.push(buildSimpleAlternative('ferry', fact.ferry, fact))
  if (fact.flight.feasible) candidates.push(buildSimpleAlternative('flight', fact.flight, fact))
  return candidates
}

function buildUrbanNatureCandidates(fact: PhaseTransitionFact): TransportSegmentAlternative[] {
  const candidates: TransportSegmentAlternative[] = []
  if (fact.transferOrganizado.feasible) candidates.push(buildSimpleAlternative('transfer', fact.transferOrganizado, fact))
  candidates.push(...buildRoadtripAlternatives(fact))
  if (fact.bus.feasible) candidates.push(buildSimpleAlternative('bus', fact.bus, fact))
  return candidates
}

/**
 * Paso B de este tramo: qué candidatos ofrecer depende SOLO del tipo de las dos fases, nunca de
 * lo que Claude haya rellenado de más — mismo principio que getRoadtripCandidates/
 * getUrbanoCandidates, pero para un tramo entre fases de una ruta ya generada.
 *
 * - Urbana↔Urbana: Avión/Tren/Autobús compiten como candidatos normales (igual que urbano_clasico).
 * - Cualquier fase↔Isla: solo Ferry o Avión — coche/transfer nunca cruzan a una isla.
 * - Urbana↔Naturaleza o Naturaleza↔Naturaleza: Transfer organizado / Roadtrip de alquiler (Coche,
 *   y Camper/Autocaravana si la región es apta) / Autobús si existe línea pública real — los tres
 *   compiten, con "Recomendada" decidiendo cuál destacar.
 *
 * Si por algún motivo ningún candidato resultó viable (caso raro — Claude no rellenó nada útil),
 * cae en un candidato de seguridad razonable para ese tipo de tramo, con el motivo siempre visible.
 */
export function buildPhaseTransportSegment(fact: PhaseTransitionFact): TransportSegment {
  const id = `phase-transport-${fact.dayNumber}-${fact.fromPhase}-${fact.toPhase}`
  const base = { id, fromCity: fact.fromPhase, toCity: fact.toPhase }
  const kind = legKind(fact.fromPhaseType, fact.toPhaseType)

  const candidates = kind === 'urban_urban' ? buildUrbanUrbanCandidates(fact) : kind === 'island' ? buildIslandCandidates(fact) : buildUrbanNatureCandidates(fact)

  if (candidates.length === 0) {
    const fallback = kind === 'urban_nature' ? buildSimpleAlternative('transfer', fact.transferOrganizado, fact) : buildSimpleAlternative('flight', fact.flight, fact)
    return {
      ...base,
      mode: fallback.mode,
      durationLabel: fallback.durationLabel,
      priceLabel: fallback.priceLabel,
      searchUrl: fallback.searchUrl,
      confirmed: true,
      alternatives: [],
      forcedReason: 'No hay datos claros de transporte real para este tramo — mostramos una opción segura mientras lo confirmas por tu cuenta.',
    }
  }

  const sorted = [...candidates].sort((a, b) => {
    const aMatch = candidateCategory(a.mode) === fact.recommended
    const bMatch = candidateCategory(b.mode) === fact.recommended
    return aMatch === bMatch ? 0 : aMatch ? -1 : 1
  })

  if (sorted.length === 1) {
    const only = sorted[0]
    return {
      ...base,
      mode: only.mode,
      durationLabel: only.durationLabel,
      priceLabel: only.priceLabel,
      searchUrl: only.searchUrl,
      rentalPickupCity: only.rentalPickupCity,
      rentalReturnCity: only.rentalReturnCity,
      confirmed: true,
      alternatives: [],
    }
  }

  return { ...base, mode: sorted[0].mode, durationLabel: '', priceLabel: '', confirmed: false, alternatives: sorted }
}
