import type { Route } from './types'
import type { Reservation } from './bookings'
import type { GeneralBooking, TransportBooking } from './readiness'
import type { TuAlojamiento } from './tuAlojamiento'
import { precioDeAlojamiento } from './tuAlojamiento'
import { convertir, leerImporte, precioGuardado, sumar, type Cambio, type Importe } from './dinero'
import { buildDestinationSegments } from './destinationSegments'
import { countryDisplayName } from './readiness'

/**
 * El presupuesto del viaje (Tanda 6z2): UN solo cálculo, puro, con lo que el viajero ha puesto con su precio. Nunca un número inventado: lo que no tiene precio no sale (no es un gasto de 0)
 * y el Free Tour no suma nunca (es gratis). Todo se suma en la moneda del viajero; lo que está en otra se pasa con el cambio del día y, si no hay cambio de esa moneda, sale aparte sin sumar.
 */

/** A qué hoja se vuelve al tocar una línea (la misma de siempre; en el presupuesto no se reserva nada). */
export type AbrirLinea =
  | { tipo: 'reserva'; reservationId: string }
  | { tipo: 'llegada' | 'vuelta' }
  | { tipo: 'alojamiento'; segmentDayId: string }
  | { tipo: 'transporte'; dayId: string }
  | { tipo: 'seguro' }
  | { tipo: 'coche' }
  | { tipo: 'esim'; pais: string }
  | { tipo: 'extra'; id: string }

export interface LineaPresupuesto {
  id: string
  nombre: string
  /** El día («Mié 11») o el destino, bajo el nombre. */
  sub?: string
  /** Tal como lo puso el viajero, en su moneda. */
  precio: Importe
  /** Pasado a la moneda del viajero con el cambio del día; null si no hay cambio de esa moneda. */
  enMonedaViajero: Importe | null
  abrir: AbrirLinea
}

export type BloqueId = 'transporte' | 'ruta' | 'util' | 'extras'

export interface BloquePresupuesto {
  id: BloqueId
  titulo: string
  lineas: LineaPresupuesto[]
  /** La suma de lo que se puede pasar a la moneda del viajero. */
  suma: Importe
}

export interface Presupuesto {
  moneda: string
  bloques: BloquePresupuesto[]
  total: Importe
  /** Gastos en una moneda sin cambio: salen aparte, en su moneda, sin sumar. */
  sinCambio: LineaPresupuesto[]
  /** ¿Algún gasto está en otra moneda y se ha pasado con el cambio? (para la línea «Cambio aproximado del …»). */
  hayConversion: boolean
}

export interface EntradaPresupuesto {
  route: Route
  reservations: Reservation[]
  accommodationSelections: Record<string, TuAlojamiento>
  transportBookings: Record<string, TransportBooking>
  insuranceBooking: GeneralBooking | null
  rentalVehicleBooking: GeneralBooking | null
  esimPrecios: Record<string, Importe>
  moneda: string
  cambio: Cambio | null
  /** Lo de pago (los billetes de llegada y vuelta) solo cuenta con la versión de pago. */
  pago: boolean
}

const TITULOS: Record<BloqueId, string> = { transporte: 'Transporte y alojamiento', ruta: 'Ruta', util: 'Útil para el viaje', extras: 'Extras' }
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** «Mié 11». */
export function diaCorto(dateIso: string): string {
  const fecha = new Date(`${dateIso}T00:00:00`)
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()}`
}

export function construirPresupuesto(entrada: EntradaPresupuesto): Presupuesto {
  const { route, moneda, cambio } = entrada
  const linea = (id: string, nombre: string, precio: Importe | null, abrir: AbrirLinea, sub?: string): LineaPresupuesto | null =>
    precio ? { id, nombre, sub, precio, enMonedaViajero: convertir(precio, moneda, cambio), abrir } : null
  const sinNulos = (lineas: (LineaPresupuesto | null)[]): LineaPresupuesto[] => lineas.filter((l): l is LineaPresupuesto => l !== null)

  const ciudad = route.days[0]?.city ?? route.destination
  const transporte = sinNulos([
    entrada.pago ? linea('llegada', `Ida a ${ciudad}`, leerImporte(route.arrivalPrecio), { tipo: 'llegada' }) : null,
    entrada.pago ? linea('vuelta', `Vuelta a ${route.origin}`, leerImporte(route.departurePrecio), { tipo: 'vuelta' }) : null,
    ...Object.entries(entrada.transportBookings).map(([dayId, booking]) => linea(`transporte-${dayId}`, booking.operator, precioGuardado(booking), { tipo: 'transporte', dayId })),
    ...buildDestinationSegments(route.days)
      .filter((segment) => segment.nights > 0)
      .map((segment) => {
        const hotel = entrada.accommodationSelections[segment.dayIds[0]]
        return hotel ? linea(`aloj-${segment.dayIds[0]}`, hotel.name, precioDeAlojamiento(hotel), { tipo: 'alojamiento', segmentDayId: segment.dayIds[0] }, segment.city) : null
      }),
    entrada.rentalVehicleBooking ? linea('coche', `Coche de alquiler · ${entrada.rentalVehicleBooking.provider}`, precioGuardado(entrada.rentalVehicleBooking), { tipo: 'coche' }) : null,
  ])

  // Las entradas y las excursiones, con su día debajo. El Free Tour no lleva precio ni suma nunca.
  const ruta = sinNulos(
    [...entrada.reservations]
      .filter((reserva) => reserva.refId !== 'Free Tour')
      .sort((a, b) => (a.dateIso ?? '9999').localeCompare(b.dateIso ?? '9999') || a.time.localeCompare(b.time))
      .map((reserva) => linea(`reserva-${reserva.id}`, reserva.name, leerImporte(reserva.precio), { tipo: 'reserva', reservationId: reserva.id }, reserva.dateIso ? diaCorto(reserva.dateIso) : reserva.dayNumber ? `Día ${reserva.dayNumber}` : undefined)),
  )

  const util = sinNulos([
    entrada.insuranceBooking ? linea('seguro', 'Seguro de viaje', precioGuardado(entrada.insuranceBooking), { tipo: 'seguro' }) : null,
    ...Object.entries(entrada.esimPrecios).map(([pais, precio]) => linea(`esim-${pais}`, `eSIM de ${countryDisplayName(pais)}`, leerImporte(precio), { tipo: 'esim', pais })),
  ])

  const extras = sinNulos((route.gastosExtras ?? []).map((extra) => linea(`extra-${extra.id}`, extra.nombre, leerImporte(extra.precio), { tipo: 'extra', id: extra.id })))

  const bloques: BloquePresupuesto[] = (
    [
      { id: 'transporte', lineas: transporte },
      { id: 'ruta', lineas: ruta },
      { id: 'util', lineas: util },
      { id: 'extras', lineas: extras },
    ] as { id: BloqueId; lineas: LineaPresupuesto[] }[]
  )
    .filter((bloque) => bloque.lineas.length > 0)
    .map((bloque) => ({ ...bloque, titulo: TITULOS[bloque.id], suma: sumar(bloque.lineas.flatMap((l) => (l.enMonedaViajero ? [l.enMonedaViajero] : [])), moneda) }))

  const todas = bloques.flatMap((bloque) => bloque.lineas)
  return {
    moneda,
    bloques,
    total: sumar(bloques.map((bloque) => bloque.suma), moneda),
    sinCambio: todas.filter((l) => l.enMonedaViajero === null),
    hayConversion: todas.some((l) => l.enMonedaViajero !== null && l.precio.currency !== moneda),
  }
}
