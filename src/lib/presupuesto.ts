import type { Route } from './types'
import type { Reservation } from './bookings'
import type { GeneralBooking, TransportBooking } from './readiness'
import type { TuAlojamiento } from './tuAlojamiento'
import { precioDeAlojamiento } from './tuAlojamiento'
import { convertir, leerImporte, precioGuardado, sumar, type Cambio, type Importe } from './dinero'
import { buildDestinationSegments } from './destinationSegments'
import { countryDisplayName } from './readiness'
import { vistaDeGasto, type GastoCompartido, type VistaDeGasto } from './gastosCompartidos'
import { entreDeLoDelAdmin, esSoloDe, reservaEsPersonalSegunModo, type LoSuyoDeCadaUno, type ModoDeLasCuentas } from './loSuyo'

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
  /** Solo en los Extras de un viaje compartido (Tanda 10N, apartado 9): de quién es el gasto y cómo se ve (del grupo, pendiente, «solo para ti» o rechazado). Solo suma al total lo del grupo. */
  compartido?: { gastoId: string | null; vista: VistaDeGasto; autorId: string | null; pagadoPor: string[] }
  /** (Tanda 10N6 §1k) Entre quién se reparte (reservas, alojamiento, coche, vuelos de un viaje compartido); sin él, entre todos. */
  entre?: string[]
  /** (Tanda 10N6 §1k) Solo para quien lo paga: no es del grupo; sale con el candado y «Solo tú». */
  personal?: boolean
}

/** ¿Esta línea suma al total? Todo suma, salvo lo que en un viaje compartido es solo de una persona (los [Para mí], los pendientes y los rechazados): eso no cuenta para el grupo. */
export const lineaCuenta = (linea: Pick<LineaPresupuesto, 'compartido'>): boolean => !linea.compartido || linea.compartido.vista === 'grupo'

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
  /** (Tanda 10N6 §1k) Lo del grupo que esta persona no ve en su presupuesto (el vuelo del administrador si no va en él…): no suma aquí, pero las cuentas del grupo lo necesitan. */
  ocultas: LineaPresupuesto[]
  /** (Tanda 10N7 §1b) Solo en una cuenta conjunta: lo «Solo para mí» de quien mira (reservas, vuelos, alojamiento, gastos). Va aparte, en «Lo tuyo»; no suma en `total` (lo común). */
  loTuyo: LineaPresupuesto[]
  /** La suma de `loTuyo` en la moneda del viajero. */
  sumaLoTuyo: Importe
  /** Lo común más lo tuyo («De los dos 180 € · Lo tuyo 40 € · Total 220 €»). Sin lo tuyo, es igual que `total`. */
  totalConLoTuyo: Importe
}

/**
 * (Tanda 10N6 §1k y 0a-8) Cómo se reparte y quién mira, en un viaje compartido. Quien mira ve LO SUYO: el administrador, todo; un invitado, lo que le incluye (y lo suyo propio: su vuelo, su alojamiento, sus entradas).
 * Lo personal (solo para quien lo paga) sale con el candado y no cuenta en «Del grupo».
 */
export interface RepartoDelViaje {
  yoId: string | null
  adminId: string | null
  /** (Tanda 10N7) Cómo se llevan las cuentas: en la conjunta, lo común es todo menos lo «solo para mí», que sale aparte en «Lo tuyo». */
  modo?: ModoDeLasCuentas
  esInvitado: boolean
  todos: string[]
  entreDe?: Record<string, string[]> | null
  conVueloPropio?: ReadonlySet<string>
  conAlojamientoPropio?: ReadonlySet<string>
  /** Las entradas que ha comprado quien mira, si es invitado. */
  reservasPropias?: readonly Reservation[]
  /** Las entradas de los invitados reservadas para otras personas (las personales no llegan). */
  entradasDeInvitados?: readonly { userId: string; reservas: readonly Reservation[] }[]
  /** Su vuelo y su alojamiento, si tiene los suyos. */
  loSuyo?: LoSuyoDeCadaUno | null
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
  /** Viaje compartido (Tanda 10N, apartado 9): los Extras salen de los gastos compartidos que veo (no de la ruta). `extrasDeLaRutaMios`: los de la ruta (anteriores a compartir) son del administrador: «solo para ti». */
  compartido?: { gastos: GastoCompartido[]; extrasDeLaRutaMios: boolean; reparto?: RepartoDelViaje }
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

  // (Tanda 10N6 §1k y 0a-8) En un viaje compartido cada línea del administrador (y las de los invitados) sabe entre quién va: lo personal sale con el candado (y solo a su dueño), lo del grupo solo a quien incluye.
  const rep = entrada.compartido?.reparto
  const ocultas: LineaPresupuesto[] = []
  const soyAdmin = Boolean(rep && rep.adminId && rep.yoId === rep.adminId)
  const conjunta = rep?.modo === 'conjunta'
  const mio = (l: LineaPresupuesto, entre: string[]): LineaPresupuesto => ({ ...l, entre, personal: true, compartido: { gastoId: null, vista: 'mio', autorId: rep?.yoId ?? null, pagadoPor: [] } })
  /** Lo que pone el administrador, con su «entre quién»: personal (solo suyo), del grupo, o escondido a quien no va en ello. */
  const delAdmin = (l: LineaPresupuesto | null, entre: string[] | null): LineaPresupuesto | null => {
    if (!l || !rep) return l
    const e = entre && entre.length > 0 ? entre : rep.todos
    if (esSoloDe(e, rep.adminId)) {
      if (soyAdmin) return mio(l, e)
      ocultas.push({ ...l, entre: e })
      return null
    }
    if (rep.esInvitado && rep.yoId && !e.includes(rep.yoId)) {
      ocultas.push({ ...l, entre: e })
      return null
    }
    return { ...l, entre: e }
  }
  const delVuelo = (id: 'llegada' | 'vuelta', l: LineaPresupuesto | null) => delAdmin(l, rep ? entreDeLoDelAdmin({ tipo: 'vuelo', clave: id, entreDe: rep.entreDe, todos: rep.todos, adminId: rep.adminId, conVueloPropio: rep.conVueloPropio }) : null)

  const ciudad = route.days[0]?.city ?? route.destination
  const suyo = rep?.loSuyo ?? null
  const transporte = sinNulos([
    entrada.pago ? delVuelo('llegada', linea('llegada', `Ida a ${ciudad}`, leerImporte(route.arrivalPrecio), { tipo: 'llegada' })) : null,
    entrada.pago ? delVuelo('vuelta', linea('vuelta', `Vuelta a ${route.origin}`, leerImporte(route.departurePrecio), { tipo: 'vuelta' })) : null,
    // (Tanda 10N6 0a-8) Su vuelo y su alojamiento, si tiene los suyos: solo suyos (candado), nunca del grupo.
    ...(rep && suyo?.vuelo?.ida?.precio ? [mio(linea('mi-ida', 'Tu vuelo de ida', suyo.vuelo.ida.precio, { tipo: 'extra', id: 'mi-ida' })!, rep.yoId ? [rep.yoId] : [])] : []),
    ...(rep && suyo?.vuelo?.vuelta?.precio ? [mio(linea('mi-vuelta', 'Tu vuelo de vuelta', suyo.vuelo.vuelta.precio, { tipo: 'extra', id: 'mi-vuelta' })!, rep.yoId ? [rep.yoId] : [])] : []),
    ...(rep && suyo?.alojamiento?.precio ? [mio(linea('mi-aloj', `Tu alojamiento · ${suyo.alojamiento.name}`, suyo.alojamiento.precio, { tipo: 'extra', id: 'mi-aloj' })!, rep.yoId ? [rep.yoId] : [])] : []),
    ...Object.entries(entrada.transportBookings).map(([dayId, booking]) => linea(`transporte-${dayId}`, booking.operator, precioGuardado(booking), { tipo: 'transporte', dayId })),
    ...buildDestinationSegments(route.days)
      .filter((segment) => segment.nights > 0)
      .map((segment) => {
        const hotel = entrada.accommodationSelections[segment.dayIds[0]]
        if (!hotel) return null
        const id = `aloj-${segment.dayIds[0]}`
        return delAdmin(linea(id, hotel.name, precioDeAlojamiento(hotel), { tipo: 'alojamiento', segmentDayId: segment.dayIds[0] }, segment.city), rep ? entreDeLoDelAdmin({ tipo: 'alojamiento', clave: id, entreDe: rep.entreDe, todos: rep.todos, adminId: rep.adminId, conAlojamientoPropio: rep.conAlojamientoPropio }) : null)
      }),
    entrada.rentalVehicleBooking ? delAdmin(linea('coche', `Coche de alquiler · ${entrada.rentalVehicleBooking.provider}`, precioGuardado(entrada.rentalVehicleBooking), { tipo: 'coche' }), rep ? entreDeLoDelAdmin({ tipo: 'coche', clave: 'coche', entreDe: rep.entreDe, todos: rep.todos, adminId: rep.adminId }) : null) : null,
  ])

  // Las entradas y las excursiones, con su día debajo. El Free Tour no lleva precio ni suma nunca.
  const lineaDeReserva = (reserva: Reservation) => linea(`reserva-${reserva.id}`, reserva.name, leerImporte(reserva.precio), { tipo: 'reserva', reservationId: reserva.id }, reserva.dateIso ? diaCorto(reserva.dateIso) : reserva.dayNumber ? `Día ${reserva.dayNumber}` : undefined)
  const candidatas: { reserva: Reservation; l: LineaPresupuesto | null }[] = entrada.reservations
    .filter((reserva) => reserva.refId !== 'Free Tour')
    .map((reserva) => {
      const l = lineaDeReserva(reserva)
      // Las del administrador: personal si es solo para él (o de antes de compartir); del grupo, entre los marcados.
      return { reserva, l: rep && l ? delAdmin(l, reservaEsPersonalSegunModo(rep.modo, reserva.paraQuien, rep.adminId) && rep.adminId ? [rep.adminId] : conjunta ? null : (reserva.paraQuien ?? null)) : l }
    })
  if (rep) {
    // Las que compra el invitado: las suyas (personal si es solo para él) y las de los demás invitados que le incluyen (o, para el administrador, todas las del grupo).
    for (const reserva of rep.reservasPropias ?? []) {
      if (reserva.refId === 'Free Tour' || candidatas.some((c) => c.reserva.id === reserva.id)) continue
      const l = lineaDeReserva(reserva)
      if (!l) continue
      candidatas.push({ reserva, l: reservaEsPersonalSegunModo(rep.modo, reserva.paraQuien, rep.yoId) ? mio(l, rep.yoId ? [rep.yoId] : []) : { ...l, entre: conjunta ? rep.todos : (reserva.paraQuien ?? []) } })
    }
    for (const grupo of rep.entradasDeInvitados ?? []) {
      if (grupo.userId === rep.yoId) continue
      for (const reserva of grupo.reservas) {
        if (reserva.kind !== 'entrada' || reserva.refId === 'Free Tour' || reservaEsPersonalSegunModo(rep.modo, reserva.paraQuien, grupo.userId) || candidatas.some((c) => c.reserva.id === reserva.id)) continue
        const l = lineaDeReserva(reserva)
        if (!l) continue
        const e = conjunta ? rep.todos : (reserva.paraQuien ?? [])
        if (rep.esInvitado && rep.yoId && !e.includes(rep.yoId)) {
          ocultas.push({ ...l, entre: e })
          continue
        }
        candidatas.push({ reserva, l: { ...l, entre: e } })
      }
    }
  }
  const ruta = sinNulos(
    candidatas
      .sort((a, b) => (a.reserva.dateIso ?? '9999').localeCompare(b.reserva.dateIso ?? '9999') || a.reserva.time.localeCompare(b.reserva.time))
      .map((c) => c.l),
  )

  const util = sinNulos([
    entrada.insuranceBooking ? linea('seguro', 'Seguro de viaje', precioGuardado(entrada.insuranceBooking), { tipo: 'seguro' }) : null,
    ...Object.entries(entrada.esimPrecios).map(([pais, precio]) => linea(`esim-${pais}`, `eSIM de ${countryDisplayName(pais)}`, leerImporte(precio), { tipo: 'esim', pais })),
  ])

  const deLaRuta = sinNulos((route.gastosExtras ?? []).map((extra) => linea(`extra-${extra.id}`, extra.nombre, leerImporte(extra.precio), { tipo: 'extra', id: extra.id })))
  const extras: LineaPresupuesto[] = entrada.compartido
    ? [
        ...(entrada.compartido.extrasDeLaRutaMios ? deLaRuta.map((l): LineaPresupuesto => ({ ...l, compartido: { gastoId: null, vista: conjunta ? 'grupo' : 'mio', autorId: null, pagadoPor: [] } })) : []),
        ...entrada.compartido.gastos.map((g): LineaPresupuesto => ({ id: `gasto-${g.id}`, nombre: g.nombre, precio: g.precio, enMonedaViajero: convertir(g.precio, moneda, cambio), abrir: { tipo: 'extra', id: g.id }, compartido: { gastoId: g.id, vista: vistaDeGasto(g), autorId: g.autorId, pagadoPor: g.pagadoPor } })),
      ]
    : deLaRuta

  // (Tanda 10N7 §1b) En una cuenta conjunta lo «solo para mí» sale de sus bloques y va aparte, en «Lo tuyo»: cada uno el suyo, y nunca suma en lo común.
  // (Tanda 10N8 §8b-d) Igual en «Cada uno lo suyo»: lo «Solo tú» va en su bloque, no dentro de «Ruta». Viajando solo (sin reparto), todo suma en su bloque como siempre.
  const esDeLoTuyo = (l: LineaPresupuesto) => Boolean(rep) && (l.personal === true || l.compartido?.vista === 'mio')
  const loTuyo = [...transporte, ...ruta, ...util, ...extras].filter(esDeLoTuyo)
  const bloques: BloquePresupuesto[] = (
    [
      { id: 'transporte', lineas: transporte },
      { id: 'ruta', lineas: ruta },
      { id: 'util', lineas: util },
      { id: 'extras', lineas: extras },
    ] as { id: BloqueId; lineas: LineaPresupuesto[] }[]
  )
    .map((bloque) => ({ ...bloque, lineas: bloque.lineas.filter((l) => !esDeLoTuyo(l)) }))
    .filter((bloque) => bloque.lineas.length > 0)
    .map((bloque) => ({ ...bloque, titulo: TITULOS[bloque.id], suma: sumar(bloque.lineas.flatMap((l) => (lineaCuenta(l) && l.enMonedaViajero ? [l.enMonedaViajero] : [])), moneda) }))

  const todas = bloques.flatMap((bloque) => bloque.lineas).filter(lineaCuenta)
  const total = sumar(bloques.map((bloque) => bloque.suma), moneda)
  const sumaLoTuyo = sumar(loTuyo.flatMap((l) => (l.enMonedaViajero ? [l.enMonedaViajero] : [])), moneda)
  return {
    moneda,
    bloques,
    total,
    loTuyo,
    sumaLoTuyo,
    totalConLoTuyo: sumar([total, sumaLoTuyo], moneda),
    sinCambio: todas.filter((l) => l.enMonedaViajero === null),
    hayConversion: todas.some((l) => l.enMonedaViajero !== null && l.precio.currency !== moneda),
    ocultas,
  }
}
