import type { Route } from './types'
import type { Importe } from './dinero'
import { buildDestinationSegments } from './destinationSegments'
import { computeDayTravelInfo } from './dayTravelInfo'
import type { EntryRow, ExcursionRowData } from './bookings'

export type ReadinessItemKind = 'transport' | 'accommodation' | 'insurance' | 'n26' | 'rental-vehicle' | 'esim' | 'entrada' | 'excursion'

/** Ficha de reserva de un tramo de transporte (llegada o vuelta) — vuelo o tren. */
export interface TransportBooking {
  operator: string
  dateTime: string
  precio: Importe | null
  locator: string
}

/** Ficha de reserva genérica para Seguro de viaje / Vehículo de alquiler — mismos campos, distinto label según el uso. */
export interface GeneralBooking {
  provider: string
  startDate: string
  endDate: string
  precio: Importe | null
}

export type EsimStatus = 'have' | 'booked'

/**
 * Prioridad visual del ítem sin resolver (borde de ReservasItemRow) — independiente del peso usado
 * para el % de "viaje listo": rojo (solo Seguro de viaje, "Imprescindibles", no cuenta para la
 * alerta de la pestaña), ámbar (transporte, alojamiento/camper, y vehículo de alquiler SOLO si
 * `vehiculo_altamente_recomendado` — cuenta para la alerta), gris (N26, eSIM, y vehículo de
 * alquiler cuando no está altamente recomendado — no cuenta para la alerta). Resuelto siempre pinta
 * verde sin importar esta prioridad (ver ReservasItemRow.tsx).
 */
export type ReadinessPriority = 'red' | 'yellow' | 'gray'

export interface ReadinessItem {
  id: string
  kind: ReadinessItemKind
  label: string
  /** 2 = imprescindible, 1 = recomendable. */
  weight: 1 | 2
  /** Ciudad del destino al que pertenece, o null para los ítems de "Imprescindibles". */
  destinationCity: string | null
  resolved: boolean
  priority: ReadinessPriority
  /** Entradas y excursión: el día de la ruta en que están (para ordenarlas por fecha). */
  dayNumber?: number
}

/**
 * Lo que Reservas calcula desde la ruta y suma al %: las entradas imprescindibles que están en la ruta y la excursión, solo si el viaje tiene un
 * día de excursión (PARA_CODE_RESERVAS, 3). No cuentan las de «Ver más» ni la fila «Excursiones desde {destino}» sin excursión: un viaje sin
 * excursión llega al 100 %.
 */
export interface ReadinessExtras {
  entries: EntryRow[]
  excursion: ExcursionRowData | null
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
 * varios destinos cuenta una sola vez aquí) — es la que alimenta el cálculo del %. La agrupación visual por destino vive directamente
 * en los acordeones de RESERVAS (DestinationReservasAccordion.tsx), que repite el eSIM donde
 * corresponda sin duplicar su peso aquí.
 */
export function buildReadinessItems(route: Route, resolved: ReadinessResolvedState, extras?: ReadinessExtras): ReadinessItem[] {
  const items: ReadinessItem[] = []
  const segments = buildDestinationSegments(route.days)
  const isCamper = route.transportContext.vehicle_type === 'camper'
  const hasRentalVehicle = route.transportContext.vehicle_ownership === 'rental'

  const rentalVehiclePriority: ReadinessPriority = route.transportContext.vehiculo_altamente_recomendado ? 'yellow' : 'gray'

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
      priority: 'yellow',
    })

    if (!isCamper) {
      items.push({
        id: `accommodation-${segment.dayIds[0]}`,
        kind: 'accommodation',
        label: `Alojamiento en ${segment.city}`,
        weight: 2,
        destinationCity: segment.city,
        resolved: resolved.accommodationSegmentIds.has(segment.dayIds[0]),
        priority: 'yellow',
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
        priority: 'yellow',
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
      priority: 'gray',
    })
  }

  items.push({
    id: 'general-insurance',
    kind: 'insurance',
    label: 'Seguro de viaje',
    weight: 2,
    destinationCity: null,
    resolved: resolved.insuranceBooked,
    priority: 'red',
  })
  items.push({ id: 'general-n26', kind: 'n26', label: 'Tarjeta N26', weight: 1, destinationCity: null, resolved: resolved.n26Added, priority: 'gray' })
  for (const entry of extras?.entries ?? []) {
    items.push({ id: `entrada-${entry.id}`, kind: 'entrada', label: entry.name, weight: 1, destinationCity: null, resolved: Boolean(entry.reservation), priority: 'gray', dayNumber: entry.day?.dayNumber })
  }
  if (extras?.excursion?.day && extras.excursion.excursion) {
    items.push({
      id: `excursion-${extras.excursion.excursion.id}`,
      kind: 'excursion',
      label: extras.excursion.excursion.title,
      weight: 1,
      destinationCity: null,
      resolved: Boolean(extras.excursion.reservation),
      priority: 'gray',
      dayNumber: extras.excursion.day.dayNumber,
    })
  }
  if (hasRentalVehicle) {
    items.push({
      id: 'general-rental-vehicle',
      kind: 'rental-vehicle',
      label: 'Vehículo de alquiler',
      weight: 1,
      destinationCity: null,
      resolved: resolved.rentalVehicleBooked,
      priority: rentalVehiclePriority,
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

/** true si queda algún ítem ámbar (alta prioridad: transporte, alojamiento/camper, o vehículo de alquiler altamente recomendado) sin resolver — enciende el icono de alerta (!) de la pestaña Reservas del menú. El seguro de viaje (rojo) nunca cuenta aquí aunque sea igual de crítico, a propósito (ver Prompt 5, punto 7). */
export function hasUnresolvedYellowItems(items: ReadinessItem[]): boolean {
  return items.some((item) => item.priority === 'yellow' && !item.resolved)
}
