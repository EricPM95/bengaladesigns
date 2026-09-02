import type { TransportMode, TransportSegment, TransportSegmentAlternative } from './types'

/**
 * Hechos de un tramo entre dos ciudades de una ruta ya generada (multidestino_tren_o_vuelo,
 * Paso 4) — devueltos por Claude en la misma llamada de generación de ruta, junto al esqueleto
 * de días (Paso 3, fuera del alcance de este archivo). Mismo espíritu que TransportFeasibility
 * (Paso A): solo hechos, nunca decide qué mostrar ni redacta copy — eso vive aquí, en el
 * "Paso B" de este tramo.
 */
export interface CityTransitionFact {
  dayNumber: number
  fromCity: string
  toCity: string
  train: { feasible: boolean; duration_label: string; price_label: string }
  flight: { feasible: boolean; duration_label: string; price_label: string }
  bus: { feasible: boolean; duration_label: string; price_label: string }
  /** Cuál de las vías feasible=true es la mejor para un viajero medio — null si ninguna lo es. */
  recommended: 'train' | 'flight' | 'bus' | null
  /** Solo relevante si hay un pase activo para el viaje: false si este tramo concreto no lo cubre bien. */
  pass_covers_leg: boolean
}

/** Icono por modo — cubre los siete valores reales de TransportMode, no solo los tres que usa este archivo. Compartido por TransportSection.tsx para cualquier arquetipo. */
const MODE_ICON: Record<TransportMode, string> = {
  train: '🚆',
  flight: '✈️',
  bus: '🚌',
  car: '🚗',
  ferry: '⛴️',
  multimodal: '🔀',
  campervan: '🚐',
  transfer: '🚖',
}

/**
 * Enlace de búsqueda GENÉRICO (Google), no una integración de afiliación real — no existe ningún
 * programa de afiliados (Skyscanner/Travelpayouts) ni mapa curado de webs oficiales de pase/
 * operadora/alquiler en la app todavía. Ver FLUJO_TRANSPORTE.md para la decisión de alcance.
 * Compartido con `phaseTransitionTransport.ts` (multidestino_mixto_o_circuito) — mismo criterio
 * de "enlace de búsqueda, no integración real" para cualquier modo de cualquier archetype.
 */
export function buildSearchUrl(
  mode: 'train' | 'flight' | 'bus' | 'ferry' | 'transfer' | 'car' | 'campervan' | 'pass',
  fromCity: string,
  toCity: string,
  paseDominante?: string | null,
): string {
  if (mode === 'flight') {
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(`vuelos de ${fromCity} a ${toCity}`)}`
  }
  if (mode === 'pass' && paseDominante) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${paseDominante} comprar oficial`)}`
  }
  if (mode === 'transfer') {
    return `https://www.google.com/search?q=${encodeURIComponent(`transfer privado ${fromCity} a ${toCity} 12Go Asia`)}`
  }
  if (mode === 'car' || mode === 'campervan') {
    return `https://www.google.com/search?q=${encodeURIComponent(`alquiler de ${mode === 'campervan' ? 'camper autocaravana' : 'coche'} ${fromCity} a ${toCity}`)}`
  }
  if (mode === 'ferry') {
    return `https://www.google.com/search?q=${encodeURIComponent(`ferry de ${fromCity} a ${toCity}`)}`
  }
  const noun = mode === 'train' ? 'tren' : 'autobús'
  return `https://www.google.com/search?q=${encodeURIComponent(`${noun} de ${fromCity} a ${toCity}`)}`
}

function buildAlternative(mode: 'train' | 'flight' | 'bus', fact: CityTransitionFact): TransportSegmentAlternative {
  const leg = fact[mode]
  return {
    mode: mode as TransportMode,
    durationLabel: leg.duration_label,
    priceLabel: leg.price_label,
    searchUrl: buildSearchUrl(mode, fact.fromCity, fact.toCity),
  }
}

/**
 * Paso B de este tramo: a partir de los hechos (feasible por vía + recomendada + cobertura del
 * pase), decide el TransportSegment final — igual principio que getRoadtripCandidates/
 * getUrbanoCandidates, pero para un tramo entre ciudades de una ruta ya generada en vez de la
 * Fase 1 de llegada.
 *
 * - Pase activo Y cubre el tramo → resuelto automáticamente con el pase, sin alternativas.
 * - Pase activo pero NO cubre el tramo → excepción: se avisa (nunca se oculta) y se ofrece vuelo
 *   interno como única alternativa real, resuelta automáticamente (1 candidata, como en Fase 1).
 * - Sin pase (o el viajero no lo usa): tren y vuelo compiten como candidatos reales, filtrados
 *   por su propio "feasible" — nunca autobús como tercera tarjeta normal.
 * - Si ni tren ni vuelo son razonables para este tramo concreto: autobús como única alternativa
 *   real, resuelto automáticamente con el motivo explicado (nunca oculto).
 */
export function buildTransportSegment(fact: CityTransitionFact, paseDominante: string | null, travelPassConfirmed: boolean | null): TransportSegment {
  const id = `transport-${fact.dayNumber}-${fact.fromCity}-${fact.toCity}`
  const base = { id, fromCity: fact.fromCity, toCity: fact.toCity }

  if (paseDominante && travelPassConfirmed) {
    if (fact.pass_covers_leg) {
      return {
        ...base,
        mode: 'train',
        durationLabel: fact.train.feasible ? fact.train.duration_label : fact.recommended ? fact[fact.recommended].duration_label : '',
        priceLabel: `Incluido en tu ${paseDominante}`,
        searchUrl: buildSearchUrl('pass', fact.fromCity, fact.toCity, paseDominante),
        confirmed: true,
        alternatives: [],
        coveredByPass: paseDominante,
      }
    }

    const flightAlt = buildAlternative('flight', fact)
    return {
      ...base,
      mode: 'flight',
      durationLabel: flightAlt.durationLabel,
      priceLabel: flightAlt.priceLabel,
      searchUrl: flightAlt.searchUrl,
      confirmed: true,
      alternatives: [],
      passException: true,
      forcedReason: `Este tramo no lo cubre bien tu ${paseDominante} — aquí compensa volar.`,
    }
  }

  const realCandidates: Array<'train' | 'flight'> = []
  if (fact.train.feasible) realCandidates.push('train')
  if (fact.flight.feasible) realCandidates.push('flight')

  if (realCandidates.length === 0) {
    const busAlt = buildAlternative('bus', fact)
    return {
      ...base,
      mode: 'bus',
      durationLabel: busAlt.durationLabel,
      priceLabel: busAlt.priceLabel,
      searchUrl: busAlt.searchUrl,
      confirmed: true,
      alternatives: [],
      forcedReason: 'Aquí no hay tren ni vuelo directo con sentido — la opción real es autobús.',
    }
  }

  const alternatives = realCandidates
    .map((mode) => buildAlternative(mode, fact))
    .sort((a, b) => (a.mode === fact.recommended ? -1 : b.mode === fact.recommended ? 1 : 0))

  if (alternatives.length === 1) {
    const only = alternatives[0]
    return {
      ...base,
      mode: only.mode,
      durationLabel: only.durationLabel,
      priceLabel: only.priceLabel,
      searchUrl: only.searchUrl,
      confirmed: true,
      alternatives: [],
    }
  }

  return { ...base, mode: alternatives[0].mode, durationLabel: '', priceLabel: '', confirmed: false, alternatives }
}

export function transportModeIcon(mode: TransportMode): string {
  return MODE_ICON[mode]
}
