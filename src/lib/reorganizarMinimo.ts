/**
 * (V68, apartado 4) REORGANIZAR NUNCA QUITA NADA DEL VIAJE, Y CAMBIA LO MÍNIMO.
 *
 * Qué pasaba (V61): el motor, al poner un vuelo de llegada tardío (15:30, 17:30), rehacía CADA día del viaje «en cadena» (el día 1 pasa entero al día 2, el 2 al 3, y el último se «cae»), y como cada día
 * se rehace por separado, lo del día caído desaparecía: la hoja decía «Se quita de tu viaje» en 17 tarjetas y proponía 45 cambios moviendo todos los días.
 *
 * Ahora, con el vuelo de llegada:
 *  1. SOLO cambia el día de la llegada (lo que el motor monta para esa hora). Los demás días no se tocan, salvo para recibir algo que no cabía.
 *  2. Lo que no cabe ese día va al día POSTERIOR donde mejor quepa (al final, abierto, antes de la cena, sin quitar nada); si no cabe en ninguno, a «Lugares pendientes» (`spareStops`). Un sitio con reserva o
 *     el Free Tour nunca se manda a otro día solo: se queda en pendientes con su reserva, nunca desaparece.
 *  3. Los días que ya pasaron y lo ya hecho de hoy están bloqueados (`diaBloqueado`): Reorganizar no los toca.
 *  4. Una red de seguridad (`garantizarNadaSeQuita`): todo sitio que estaba en el viaje sigue en alguna parada o en pendientes; un sitio que la propuesta dejaría en dos días se queda solo en el primero
 *     (o en el de su reserva). Lo que no está en el motor (cualquier destino) lo cubre esta misma función: vale igual para Roma, Lanzarote y los que vengan.
 * Todo es puro salvo la carga (una vez) de los horarios del destino, para no mandar un sitio a un día en que está cerrado.
 */
import type { DayPlan, Route, Stop } from './types'
import type { DiaAdaptado } from './adaptarVuelos'
import { aplicarOpADia, conMeal, delDia, limiteDelDia, minDe, sube10, viajeMin, type Op } from './hoyCambiarPlan'
import { cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, normalizaNombre } from './horarioDeParada'
import { fechaDelDia } from './nombreDeDia'
import { hasRealCoordinates, haversineMeters } from './distanceMock'
import { esSoloDeDia, minutosDeLaHora } from './sitiosDeDia'
import { atardecerDelDestino, horaDelSol } from './puestaDeSolYManana'

const MOTIVO_VUELO = 'Con tu vuelo no te da tiempo ese día.'

/** El nombre de un sitio sin la nota entre paréntesis del final («Piazza Navona (noche)» = «Piazza Navona»): con él se emparejan los sitios de antes y de después. */
export const claveDeSitio = (name: string): string => normalizaNombre(name.replace(/\s*\([^)]*\)\s*$/, ''))
const esSitio = (stop: Stop): boolean => !stop.isArrival && !stop.isBreak
const esFijo = (stop: Stop): boolean => Boolean(stop.reservedId || stop.reservationTime || stop.isFreeTour)
const firma = (day: DayPlan): string => JSON.stringify([day.stops.map((stop) => `${stop.name}@${stop.time ?? ''}`), day.meals.map((meal) => `${meal.mealTime}@${meal.time ?? ''}`), (day.spareStops ?? []).map((stop) => stop.name)])

const hoyIso = (): string => {
  const ahora = new Date()
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
}

/** Un día que Reorganizar no toca: uno que ya pasó, o el de hoy si ya se ha visto o saltado algo. (Sin fechas no hay días pasados.) */
export function diaBloqueado(route: Route, day: DayPlan, hoy: string = hoyIso()): boolean {
  const fecha = fechaDelDia(route, day.dayNumber)
  if (fecha && fecha < hoy) return true
  if (fecha && fecha === hoy && day.stops.some((stop) => stop.checkedInAt || stop.saltada)) return true
  return false
}

const sePuedeRecibir = (day: DayPlan): boolean => !day.isReturnLeg && !day.isExcursionDay && day.dayType !== 'excursion' && day.dayType !== 'manual' && day.interruptor?.mode !== 'excursion' && !day.originalSnapshot && !day.userAdded && !day.ownDay

export interface OpcionesDelMinimo {
  /** Hay vuelo de llegada: solo cambia el día de la llegada y lo que reciben los demás. */
  hayLlegada: boolean
  /** Hay vuelo de vuelta: se mantienen las propuestas del último día y del de vuelta. */
  hayVuelta: boolean
  enCoche: boolean
  hoy?: string
}

/**
 * El cambio mínimo. `propuestos` = lo que el motor propone día por día (puede ser TODO el viaje en cadena). Devuelve solo lo que de verdad hay que cambiar. Pura salvo la carga de los horarios.
 */
export async function cambioMinimo(route: Route, propuestos: DiaAdaptado[], opciones: OpcionesDelMinimo): Promise<DiaAdaptado[]> {
  const hoy = opciones.hoy ?? hoyIso()
  const ciudad = route.days.filter((day) => !day.isReturnLeg)
  const primero = ciudad[0]
  const ultimo = ciudad[ciudad.length - 1]
  const diaDe = (id: string) => route.days.find((day) => day.id === id)
  const quedan = new Map<string, DiaAdaptado>()
  for (const propuesto of propuestos) {
    const dia = diaDe(propuesto.dayId)
    if (!dia || diaBloqueado(route, dia, hoy)) continue
    // Con vuelo de llegada, el motor rehace los demás días «en cadena»: solo vale lo del día de la llegada y, si hay vuelo de vuelta, lo del último día y el de vuelta.
    if (opciones.hayLlegada && dia.id !== primero?.id && !(opciones.hayVuelta && (dia.isReturnLeg || dia.id === ultimo?.id))) continue
    quedan.set(dia.id, propuesto)
  }
  const trabajo = new Map<string, DayPlan>(route.days.map((day) => [day.id, quedan.get(day.id)?.next ?? day]))
  const movidas = new Map<string, Set<string>>()
  const anotar = (dayId: string, stopId: string) => movidas.set(dayId, (movidas.get(dayId) ?? new Set<string>()).add(stopId))

  const propuesto1 = primero ? quedan.get(primero.id) : undefined
  if (opciones.hayLlegada && primero && propuesto1) {
    const original = primero
    const r1 = propuesto1.next
    const enR1 = new Set([...r1.stops.filter(esSitio), ...(r1.spareStops ?? [])].map((stop) => claveDeSitio(stop.name)))
    // 1. Lo que el motor pone el día 1 y estaba en otro día: sale de ese día (no se repite).
    const sitiosDeR1 = new Set(r1.stops.filter(esSitio).map((stop) => claveDeSitio(stop.name)))
    const antesEnPrimero = new Set(original.stops.filter(esSitio).map((stop) => claveDeSitio(stop.name)))
    for (const day of route.days) {
      if (day.id === primero.id || diaBloqueado(route, day, hoy)) continue
      const actual = trabajo.get(day.id) as DayPlan
      const sobran = actual.stops.filter((stop) => esSitio(stop) && sitiosDeR1.has(claveDeSitio(stop.name)) && !antesEnPrimero.has(claveDeSitio(stop.name)) && !stop.reservedId)
      if (sobran.length > 0) trabajo.set(day.id, { ...actual, stops: actual.stops.filter((stop) => !sobran.includes(stop)) })
    }
    // 2. Lo que no cabe el día de la llegada: al día posterior donde mejor quepa; si no, a pendientes.
    const sobra = original.stops.filter((stop) => esSitio(stop) && !stop.checkedInAt && !enR1.has(claveDeSitio(stop.name)))
    await cargaDatosDeHorario(route.destination).catch(() => undefined)
    const horarios = datosDeHorarioEnMemoria(route.destination)
    const aPendientes: Stop[] = []
    for (const stop of sobra) {
      const sitio = esFijo(stop) ? null : mejorDia(route, trabajo, primero, stop, horarios, opciones.enCoche, hoy)
      if (!sitio) {
        aPendientes.push({ ...stop, spareReason: MOTIVO_VUELO })
        continue
      }
      trabajo.set(sitio.dia.id, sitio.dia)
      anotar(sitio.dia.id, stop.id)
    }
    const ya = new Set((r1.spareStops ?? []).map((stop) => claveDeSitio(stop.name)))
    const previos = (original.spareStops ?? []).filter((stop) => !ya.has(claveDeSitio(stop.name)))
    const nuevas = aPendientes.filter((stop) => !ya.has(claveDeSitio(stop.name)) && !previos.some((x) => claveDeSitio(x.name) === claveDeSitio(stop.name)))
    trabajo.set(primero.id, { ...r1, spareStops: [...previos, ...(r1.spareStops ?? []), ...nuevas] })
  }

  // 3. La red de seguridad: nada desaparece y nada se repite.
  const salida = garantizarNadaSeQuita(route, trabajo)
  const resultado: DiaAdaptado[] = []
  for (const day of route.days) {
    const siguiente = salida.get(day.id) as DayPlan
    const propuesto = quedan.get(day.id)
    if (firma(siguiente) === firma(day)) continue
    const idsMovidas = [...(propuesto?.movidas ?? []), ...(movidas.get(day.id) ?? [])]
    resultado.push({ dayId: day.id, dayNumber: day.dayNumber, next: siguiente, movidas: [...new Set(idsMovidas)], ...(propuesto?.noCaben ? { noCaben: propuesto.noCaben } : {}) })
  }
  return resultado
}

/** El día POSTERIOR donde la parada cabe: abierto ese día, a continuación de la última visita y antes de la hora de cenar; el más cercano y menos lleno. null si no cabe en ninguno. */
function mejorDia(route: Route, trabajo: Map<string, DayPlan>, desde: DayPlan, stop: Stop, horarios: Map<string, Record<string, unknown>>, enCoche: boolean, hoy: string): { dia: DayPlan } | null {
  const duracion = stop.durationMinutes || 45
  let mejor: { dia: DayPlan; puntos: number } | null = null
  for (const original of route.days) {
    if (original.dayNumber <= desde.dayNumber || diaBloqueado(route, original, hoy)) continue
    const dia = trabajo.get(original.id) as DayPlan
    if (!sePuedeRecibir(dia)) continue
    const visitas = delDia(dia)
    // La última parada con hora del día (de las de día: las de noche van después de cenar y no cuentan), sea una visita o un paseo.
    const ultima = dia.stops.filter((x) => esSitio(x) && !x.saltada && !x.isNightExperience && !x.isNightView && minDe(x.time) != null).at(-1)
    if (!ultima) continue
    const fecha = fechaDelDia(route, dia.dayNumber)
    const datos = (stop.hoursData as Record<string, unknown> | null | undefined) ?? horarios.get(normalizaNombre(stop.name)) ?? null
    const horario = datos ? horarioDeParada({ hoursData: datos }, fecha, route.answers.month ?? null) : null
    if (horario?.cerrado) continue
    const inicio = sube10((minDe(ultima.time) as number) + (ultima.durationMinutes || 0) + viajeMin(ultima, stop, enCoche))
    if (inicio + duracion > limiteDelDia(dia)) continue
    const abre = minDe(horario?.abre)
    const cierra = minDe(horario?.cierra)
    if ((abre != null && inicio < abre) || (cierra != null && inicio + duracion > cierra)) continue
    // Un sitio que solo se ve de día (miradores, playas, naturaleza) no se manda a una hora en que ya se ha puesto el sol.
    if (esSoloDeDia(stop.name)) {
      const sol = minutosDeLaHora(horaDelSol(dia) ?? atardecerDelDestino(route.destination, fecha ?? undefined)?.hora)
      if (sol != null && inicio + duracion > sol) continue
    }
    const metros = hasRealCoordinates(stop.coordinates) && hasRealCoordinates(ultima.coordinates) ? Math.min(haversineMeters(stop.coordinates, ultima.coordinates), 8000) : 8000
    const puntos = metros + visitas.length * 120
    if (mejor && mejor.puntos <= puntos) continue
    const indice = dia.stops.findIndex((x) => x.id === ultima.id) + 1
    const nuevo: Stop = { ...stop, checkedInAt: undefined, saltada: false, time: `${String(Math.floor(inicio / 60)).padStart(2, '0')}:${String(inicio % 60).padStart(2, '0')}`, nextLegPending: true }
    const operacion: Op = { t: 'meter', dia: dia.id, stop: nuevo, indice, ...conMeal(dia, indice, true) }
    mejor = { dia: aplicarOpADia(dia, operacion, 'adelante'), puntos }
  }
  return mejor ? { dia: mejor.dia } : null
}

/**
 * LA RED DE SEGURIDAD: con los días como quedarían (`trabajo`), todo sitio que había en el viaje sigue en una parada o en «Lugares pendientes» (si no, va a los pendientes del día en que estaba), y un sitio que
 * la propuesta dejaría en DOS días se queda solo en el primero (o en el que lo tiene reservado). Los repetidos que ya había en el viaje no se tocan. Devuelve los días resultantes.
 */
export function garantizarNadaSeQuita(route: Route, trabajo: Map<string, DayPlan>): Map<string, DayPlan> {
  const salida = new Map(trabajo)
  const lista = (): DayPlan[] => route.days.map((day) => salida.get(day.id) as DayPlan)
  // Repetidos nuevos.
  const cuenta = (dias: DayPlan[]): Map<string, number> => {
    const mapa = new Map<string, number>()
    for (const day of dias) for (const stop of day.stops.filter(esSitio)) mapa.set(claveDeSitio(stop.name), (mapa.get(claveDeSitio(stop.name)) ?? 0) + 1)
    return mapa
  }
  const antes = cuenta(route.days)
  const ahora = cuenta(lista())
  for (const [clave, veces] of ahora) {
    if (veces <= (antes.get(clave) ?? 0) || veces < 2) continue
    const donde = lista().filter((day) => day.stops.some((stop) => esSitio(stop) && claveDeSitio(stop.name) === clave))
    const conservar = donde.find((day) => day.stops.some((stop) => claveDeSitio(stop.name) === clave && stop.reservedId)) ?? donde[0]
    for (const day of donde) {
      if (day.id === conservar.id) continue
      const original = route.days.find((x) => x.id === day.id) as DayPlan
      if (diaBloqueado(route, original)) continue
      salida.set(day.id, { ...day, stops: day.stops.filter((stop) => !(esSitio(stop) && claveDeSitio(stop.name) === clave && !stop.reservedId)) })
    }
  }
  // Lo que desaparecería.
  const presentes = new Set(lista().flatMap((day) => [...day.stops.filter(esSitio), ...(day.spareStops ?? [])].map((stop) => claveDeSitio(stop.name))))
  for (const original of route.days) {
    const perdidos = original.stops.filter((stop) => esSitio(stop) && !presentes.has(claveDeSitio(stop.name)))
    if (perdidos.length === 0) continue
    const dia = salida.get(original.id) as DayPlan
    const ya = new Set((dia.spareStops ?? []).map((stop) => claveDeSitio(stop.name)))
    const nuevos = perdidos.filter((stop, i) => !ya.has(claveDeSitio(stop.name)) && perdidos.findIndex((x) => claveDeSitio(x.name) === claveDeSitio(stop.name)) === i).map((stop) => ({ ...stop, spareReason: MOTIVO_VUELO }))
    salida.set(original.id, { ...dia, spareStops: [...(dia.spareStops ?? []), ...nuevos] })
    for (const stop of perdidos) presentes.add(claveDeSitio(stop.name))
  }
  return salida
}
