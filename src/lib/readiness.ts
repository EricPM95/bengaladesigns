import type { Route } from './types'
import { buildDestinationSegments } from './destinationSegments'
import { computeDayTravelInfo } from './dayTravelInfo'
import { todayIso } from './dateRange'

export type ReadinessItemKind = 'transport' | 'accommodation' | 'insurance' | 'n26' | 'rental-vehicle' | 'esim'

/** Ficha de reserva de un tramo de transporte (llegada o vuelta) — vuelo o tren. */
export interface TransportBooking {
  operator: string
  dateTime: string
  price: number
  locator: string
}

/** Ficha de reserva genérica para Seguro de viaje / Vehículo de alquiler — mismos campos, distinto label según el uso. */
export interface GeneralBooking {
  provider: string
  startDate: string
  endDate: string
  price: number
}

export type EsimStatus = 'have' | 'booked'

export interface ReadinessItem {
  id: string
  kind: ReadinessItemKind
  label: string
  /** 2 = imprescindible, 1 = recomendable. */
  weight: 1 | 2
  /** Ciudad del destino al que pertenece, o null para los ítems de "Imprescindibles". */
  destinationCity: string | null
  resolved: boolean
}

/** Estado ya resuelto de cada tipo de ítem, leído del store — buildReadinessItems es una función pura sobre esto. */
export interface ReadinessResolvedState {
  transportBookedDayIds: Set<string>
  /** Claves = id del primer día de la estancia (mismas claves que accommodationSelections). */
  accommodationSegmentIds: Set<string>
  insuranceBooked: boolean
  n26Added: boolean
  rentalVehicleBooked: boolean
  /** Claves = código de país en minúsculas. */
  esimResolvedCountries: Set<string>
}

const COUNTRY_NAMES: Record<string, string> = {
  es: 'España',
  it: 'Italia',
  fr: 'Francia',
  pt: 'Portugal',
  de: 'Alemania',
  gb: 'Reino Unido',
  nl: 'Países Bajos',
  gr: 'Grecia',
  at: 'Austria',
  ch: 'Suiza',
  be: 'Bélgica',
  us: 'Estados Unidos',
  jp: 'Japón',
  is: 'Islandia',
}

export function countryDisplayName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode.toLowerCase()] ?? countryCode.toUpperCase()
}

/**
 * Lista canónica de ítems del viaje, UNA sola vez cada uno (el eSIM de un país que se repite en
 * varios destinos cuenta una sola vez aquí) — es la que alimenta el cálculo del % y el panel rápido
 * de ítems urgentes (`pickUrgentPendingItems`). La agrupación visual por destino vive directamente
 * en los acordeones de RESERVAS (DestinationReservasAccordion.tsx), que repite el eSIM donde
 * corresponda sin duplicar su peso aquí.
 */
export function buildReadinessItems(route: Route, resolved: ReadinessResolvedState): ReadinessItem[] {
  const items: ReadinessItem[] = []
  const segments = buildDestinationSegments(route.days)
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'

  segments.forEach((segment, index) => {
    const firstDayIndex = route.days.findIndex((day) => day.id === segment.dayIds[0])
    const arrival = computeDayTravelInfo(route, firstDayIndex)
    items.push({
      id: `transport-${segment.dayIds[0]}`,
      kind: 'transport',
      label: arrival ? `${arrival.fromCity} → ${arrival.toCity}` : `Llegada a ${segment.city}`,
      weight: 2,
      destinationCity: segment.city,
      resolved: resolved.transportBookedDayIds.has(segment.dayIds[0]),
    })

    if (!isCamper) {
      items.push({
        id: `accommodation-${segment.dayIds[0]}`,
        kind: 'accommodation',
        label: `Alojamiento en ${segment.city}`,
        weight: 2,
        destinationCity: segment.city,
        resolved: resolved.accommodationSegmentIds.has(segment.dayIds[0]),
      })
    }

    if (index === segments.length - 1) {
      const lastDay = route.days[route.days.length - 1]
      items.push({
        id: `transport-${lastDay.id}`,
        kind: 'transport',
        label: `${segment.city} → ${route.origin}`,
        weight: 2,
        destinationCity: segment.city,
        resolved: resolved.transportBookedDayIds.has(lastDay.id),
      })
    }
  })

  const distinctCountries = [...new Set(segments.map((segment) => segment.countryCode).filter((code): code is string => Boolean(code)))]
  for (const countryCode of distinctCountries) {
    items.push({
      id: `esim-${countryCode}`,
      kind: 'esim',
      label: `eSIM ${countryDisplayName(countryCode)}`,
      weight: 1,
      destinationCity: null,
      resolved: resolved.esimResolvedCountries.has(countryCode),
    })
  }

  items.push({ id: 'general-insurance', kind: 'insurance', label: 'Seguro de viaje', weight: 2, destinationCity: null, resolved: resolved.insuranceBooked })
  items.push({ id: 'general-n26', kind: 'n26', label: 'Tarjeta N26', weight: 1, destinationCity: null, resolved: resolved.n26Added })
  if (hasRentalVehicle) {
    items.push({
      id: 'general-rental-vehicle',
      kind: 'rental-vehicle',
      label: 'Vehículo de alquiler',
      weight: 1,
      destinationCity: null,
      resolved: resolved.rentalVehicleBooked,
    })
  }

  return items
}

/** % de 0 a 100 — suma de los % individuales (peso/pesoTotal) de los ítems ya resueltos. Dinámico: el peso total varía con el nº real de ítems del viaje. */
export function computeReadinessPercent(items: ReadinessItem[]): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return 0
  const resolvedWeight = items.filter((item) => item.resolved).reduce((sum, item) => sum + item.weight, 0)
  return Math.round((resolvedWeight / totalWeight) * 100)
}

/** Rojo (0%, nada reservado) → naranja (algo pero no todo) → verde (100%) — mismo criterio para el punto de color del indicador de la cabecera. */
export function readinessStateColor(percent: number): 'red' | 'orange' | 'green' {
  if (percent <= 0) return 'red'
  if (percent >= 100) return 'green'
  return 'orange'
}

function resolveDayNumber(route: Route, dayId: string): number {
  return route.days.find((day) => day.id === dayId)?.dayNumber ?? Number.MAX_SAFE_INTEGER
}

/**
 * "Día de vencimiento" aproximado de un ítem, para ordenar por urgencia en el panel rápido del
 * indicador de % — transporte/alojamiento usan el día real al que pertenecen, eSIM usa el primer
 * día del viaje en ese país, y seguro/N26/vehículo de alquiler se consideran necesarios antes de
 * salir (día 1), así que siempre quedan primero.
 */
function itemDueDayNumber(route: Route, item: ReadinessItem): number {
  if (item.kind === 'transport') return resolveDayNumber(route, item.id.slice('transport-'.length))
  if (item.kind === 'accommodation') return resolveDayNumber(route, item.id.slice('accommodation-'.length))
  if (item.kind === 'esim') {
    const countryCode = item.id.slice('esim-'.length)
    return route.days.find((day) => day.countryCode === countryCode)?.dayNumber ?? Number.MAX_SAFE_INTEGER
  }
  return 0
}

/** Por debajo de este nº de días para el viaje, el argumento "sube de precio cuanto más se espera" deja de aplicar — todo es igual de urgente, así que se prioriza solo por fecha real dentro del viaje (ver pickUrgentPendingItems). */
const IMMINENT_TRIP_DAYS_THRESHOLD = 15

/** Transporte y alojamiento primero (precio/disponibilidad que empeora con el tiempo), seguro justo después (imprescindible, pero sin esa presión de precio) — eSIM/N26/vehículo de alquiler NUNCA se muestran mientras quede alguno de estos tres pendiente. */
const URGENT_KIND_ORDER: ReadinessItemKind[] = ['transport', 'accommodation', 'insurance']
/** Solo se usa una vez los tres de arriba están completados — ninguno de estos tiene presión de precio, se resuelven el mismo día si hace falta. */
const RELAXED_KIND_ORDER: ReadinessItemKind[] = ['esim', 'n26', 'rental-vehicle']

function daysUntilTrip(route: Route): number | null {
  const startIso = route.answers.dateRange?.start
  if (!startIso) return null
  const start = new Date(`${startIso}T00:00:00`)
  const today = new Date(`${todayIso()}T00:00:00`)
  return Math.round((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

function sortByDueDate(route: Route, list: ReadinessItem[]): ReadinessItem[] {
  return list
    .map((item, index) => ({ item, index, due: itemDueDayNumber(route, item) }))
    .sort((a, b) => a.due - b.due || a.index - b.index)
    .map((entry) => entry.item)
}

/**
 * Los `limit` ítems pendientes más urgentes — para el panel rápido que abre el indicador de % en
 * la cabecera. Dos modos, según cuánto falte para el viaje:
 * - Viaje lejano (≥ IMMINENT_TRIP_DAYS_THRESHOLD días): prioridad por categoría —
 *   transporte → alojamiento → seguro primero (siempre, en ese orden); eSIM/N26/vehículo de
 *   alquiler NUNCA aparecen mientras quede pendiente cualquiera de esos tres, ni siquiera para
 *   rellenar hueco si sobra sitio en el top `limit`. Dentro de la misma categoría (ej. dos tramos
 *   de transporte sin reservar), desempata por fecha real más próxima.
 * - Viaje inminente (< threshold): el argumento de precio ya no aplica — se ignora la categoría
 *   por completo y se ordena todo lo pendiente por fecha real más próxima dentro del viaje (ej. si
 *   solo falta el vuelo de vuelta, ese tramo concreto manda, no "Vuelos" en genérico).
 * El conjunto de ítems de partida (`items`) ya viene filtrado a lo que aplica a ESTE viaje en
 * concreto por `buildReadinessItems` (sin vehículo de alquiler si no aplica, sin alojamiento si es
 * camper, etc.) — esta función nunca asume una lista fija.
 */
export function pickUrgentPendingItems(route: Route, items: ReadinessItem[], limit: number): ReadinessItem[] {
  const pending = items.filter((item) => !item.resolved)
  const daysUntil = daysUntilTrip(route)
  const isImminent = daysUntil !== null && daysUntil < IMMINENT_TRIP_DAYS_THRESHOLD

  if (isImminent) return sortByDueDate(route, pending).slice(0, limit)

  const urgentPending = pending.filter((item) => URGENT_KIND_ORDER.includes(item.kind))
  const pool = urgentPending.length > 0 ? urgentPending : pending.filter((item) => RELAXED_KIND_ORDER.includes(item.kind))
  const kindOrder = urgentPending.length > 0 ? URGENT_KIND_ORDER : RELAXED_KIND_ORDER

  return pool
    .map((item, index) => ({ item, index, due: itemDueDayNumber(route, item) }))
    .sort((a, b) => {
      const tierDiff = kindOrder.indexOf(a.item.kind) - kindOrder.indexOf(b.item.kind)
      return tierDiff !== 0 ? tierDiff : a.due - b.due || a.index - b.index
    })
    .slice(0, limit)
    .map((entry) => entry.item)
}
