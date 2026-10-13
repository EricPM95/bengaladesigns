/**
 * Una excursión cuando no cabe en ningún día (Tanda 6y10). Funciones puras, sin React, iguales para todos los destinos: lo que pesa cada sitio viene del dato del destino
 * (`importanciaPorSitio`, ver shared/routeEngine/importanciaDeSitios.js) y nada se escribe a mano para Roma.
 *
 * Dos salidas, las dos con «Deshacer» (pieza de siempre, `cambiarConDeshacer`):
 *  - en un día nuevo al final: el viaje gana un día (`placeExcursionIn` con `extendTrip`);
 *  - en lugar de un día: la lista (`opcionesDeCambio`) lleva cada día con lo que se pierde, el que menos pierde va arriba como «Recomendado» y un día con una reserva del viajero no se puede elegir.
 *
 * «El que menos se pierde» se compara en este orden, y gana el menor: 1) cuántos imprescindibles pierde, 2) cuántos sitios de nivel 1, 3) cuántas paradas más. Si empatan, el de siempre (el primero de la lista).
 */
import type { DayPlan, Excursion, Route, Stop } from './types'
import { dayOfReservation, type Reservation } from './bookings'
import { excursionTargetDays } from './excursionOffer'
import { hasFullDayExcursion, placeExcursionIn } from './freeDays'
import { diaProsa, elDia } from './nombreDeDia'

export type PesoDeSitio = 'imprescindible' | 'nivel1'
/** Nombre de sitio → cuánto pesa. Un sitio que no sale es de los demás. */
export type ImportanciaPorSitio = Record<string, PesoDeSitio>

const normal = (texto: string): string => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Lo que pesa una parada (null = de las demás). Se busca por su nombre y su nombre completo, sin mirar mayúsculas ni acentos. */
export function pesoDeParada(stop: Pick<Stop, 'name' | 'fullName'>, importancia: ImportanciaPorSitio): PesoDeSitio | null {
  const indice = new Map(Object.entries(importancia).map(([nombre, peso]) => [normal(nombre), peso]))
  for (const nombre of [stop.name, stop.fullName]) {
    const peso = nombre ? indice.get(normal(nombre)) : undefined
    if (peso) return peso
  }
  return null
}

/** Lo que se pierde al cambiar un día por la excursión. */
export interface PerdidaDelDia {
  imprescindibles: string[]
  nivel1: string[]
  /** Paradas que no son ni imprescindibles ni de nivel 1. */
  otras: number
  /** El día ya llevaba una excursión (de medio día o elegida) que también se va. */
  llevabaExcursion: boolean
}

/** Las paradas que se van al cambiar ese día por la excursión (las que ya no están en el día cuando la excursión entra; una de medio día solo quita las de la mañana). */
export function paradasQueSePierden(route: Route, day: DayPlan, excursion: Excursion): Stop[] {
  // El día 4 con su interruptor se cambia con otro camino (`ponerExcursionEnElDia`): lo que lleva se guarda en el interruptor, pero a la vista se va.
  if (day.interruptor) return day.stops
  const colocada = placeExcursionIn(route, excursion, { dayId: day.id })
  const despues = new Set((colocada?.route.days.find((candidate) => candidate.id === day.id)?.stops ?? []).map((stop) => stop.id))
  return day.stops.filter((stop) => !despues.has(stop.id))
}

/** Lo que pierde ese día. Los descansos y los huecos libres no cuentan como paradas. */
export function perdidaDeCambiar(route: Route, day: DayPlan, excursion: Excursion, importancia: ImportanciaPorSitio): PerdidaDelDia {
  const perdida: PerdidaDelDia = { imprescindibles: [], nivel1: [], otras: 0, llevabaExcursion: Boolean(day.selectedExcursionId) || Boolean(day.halfDayExcursion && !day.halfDayExcursionDeclined) }
  for (const stop of paradasQueSePierden(route, day, excursion)) {
    if (stop.isBreak || stop.isFreeTime) continue
    const peso = pesoDeParada(stop, importancia)
    if (peso === 'imprescindible') perdida.imprescindibles.push(stop.name)
    else if (peso === 'nivel1') perdida.nivel1.push(stop.name)
    else perdida.otras++
  }
  return perdida
}

/** Una fila de «Cambiar un día por la excursión». */
export interface OpcionDeCambio {
  day: DayPlan
  perdida: PerdidaDelDia
  /** El viajero tiene una reserva ese día: no se puede elegir. */
  reservado: boolean
  /** El que menos pierde de los que se pueden elegir (solo uno). */
  recomendado: boolean
}

/** ¿Tiene el viajero una reserva (entrada, Free Tour o excursión) en ese día? */
export function diaConReserva(route: Route, reservations: Reservation[], day: DayPlan): boolean {
  return reservations.some((reservation) => dayOfReservation(route, reservation)?.id === day.id)
}

/** Menor = se pierde menos. */
function comparaPerdida(a: PerdidaDelDia, b: PerdidaDelDia): number {
  return a.imprescindibles.length - b.imprescindibles.length || a.nivel1.length - b.nivel1.length || a.otras - b.otras
}

/**
 * Los días que se pueden cambiar por la excursión, con el recomendado arriba y los demás en el orden de siempre. Nunca el día de llegada ni el de vuelta (`excursionTargetDays`) ni uno que ya
 * es una excursión de día entero.
 */
export function opcionesDeCambio(route: Route, reservations: Reservation[], excursion: Excursion, importancia: ImportanciaPorSitio): OpcionDeCambio[] {
  const candidatos = excursionTargetDays(route).filter((day) => !hasFullDayExcursion(day))
  const opciones: OpcionDeCambio[] = candidatos.map((day) => ({ day, perdida: perdidaDeCambiar(route, day, excursion, importancia), reservado: diaConReserva(route, reservations, day), recomendado: false }))
  let mejor: OpcionDeCambio | null = null
  for (const opcion of opciones) {
    if (opcion.reservado) continue
    if (!mejor || comparaPerdida(opcion.perdida, mejor.perdida) < 0) mejor = opcion
  }
  if (!mejor) return opciones
  mejor.recomendado = true
  return [mejor, ...opciones.filter((opcion) => opcion !== mejor)]
}

const lista = (nombres: string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`)

/** Los nombres que se dicen en el «¿Estás seguro?» antes de contar el resto («y 3 paradas más»). */
const NOMBRES_A_LA_VISTA = 4

/**
 * El texto del «¿Estás seguro?» al cambiar un día por la excursión: qué día pasa a ser la excursión y qué se pierde, con los imprescindibles primero.
 * «Martes 14 pasará a ser «Excursión a Pompeya». Se pierde lo que tienes ese día: los imprescindibles Coliseo y Foro Romano, Panteón y 3 paradas más.»
 */
export function textoDeConfirmar(route: Route, day: DayPlan, excursion: Excursion, perdida: PerdidaDelDia): string {
  const dia = diaProsa(route, day.dayNumber)
  const cabeza = `${dia.charAt(0).toUpperCase()}${dia.slice(1)} pasará a ser «${excursion.title}».`
  const nombres = [...perdida.imprescindibles, ...perdida.nivel1]
  const visibles = nombres.slice(0, NOMBRES_A_LA_VISTA)
  const partes: string[] = []
  const imprescindiblesVisibles = visibles.filter((nombre) => perdida.imprescindibles.includes(nombre))
  const nivel1Visibles = visibles.filter((nombre) => !perdida.imprescindibles.includes(nombre))
  if (imprescindiblesVisibles.length > 0) partes.push(`${imprescindiblesVisibles.length === 1 ? 'el imprescindible' : 'los imprescindibles'} ${lista(imprescindiblesVisibles)}`)
  if (nivel1Visibles.length > 0) partes.push(lista(nivel1Visibles))
  const resto = nombres.length - visibles.length + perdida.otras
  if (resto > 0) partes.push(`${resto} ${resto === 1 ? 'parada más' : 'paradas más'}`)
  if (partes.length === 0) return perdida.llevabaExcursion ? `${cabeza} Se va la excursión que tenías ese día.` : `${cabeza} Ese día no llevaba paradas.`
  return `${cabeza} Se pierde lo que tienes ese día: ${lista(partes)}.${perdida.llevabaExcursion ? ' Y la excursión que tenías.' : ''}`
}

/** El aviso corto de abajo (con «Deshacer») al cambiar un día. */
export function mensajeDeCambio(route: Route, day: DayPlan): string {
  return `Cambiado ${elDia(route, day.dayNumber)} por la excursión`
}
