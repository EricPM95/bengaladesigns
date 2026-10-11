import type { DateRange, DayPlan, Route } from './types'
import { daysBetweenInclusive } from './dateRange'
import { diaCorto } from './nombreDeDia'
import { manualDayName } from './manualRoute'
import { MAX_TRIP_DAYS } from './freeDays'
import { dayOfReservation, type Reservation } from './bookings'
import { labelOf as etiquetaDeReserva } from './reservationOverlaps'
import { buildDestinationSegments } from './destinationSegments'

/**
 * CAMBIAR LAS FECHAS DE UNA RUTA A MANO A OTRA DURACIÓN (Tanda 6y2, simplificado en la 6y3). Funciones puras, sin React:
 *  - MÁS días: se añaden días vacíos justo antes del último (el día de la vuelta); con un solo día, detrás. Sin preguntar;
 *  - MENOS días: se quitan días, y la app NO pregunta qué hacer con sus cosas: avisa con el «¿Estás seguro?» de siempre diciendo QUÉ días se quitan y QUÉ reservas se van con ellos (`manualRemovalText`)
 *    y, si el viajero dice que sí, esos días se quitan con todo lo que tengan (paradas, comida, excursión y las reservas de esos días, también del presupuesto). Si dice que no, las fechas no cambian.
 *    Las paradas NUNCA pasan a otro día. Tras quitar NO hay «Deshacer»: la confirmación previa lo sustituye (Tanda 6y4).
 *  - Qué días se quitan: primero los vacíos del medio, del último antes de la vuelta hacia atrás; solo si hay que tocar más, los del medio que llevan algo; el primero y el de la
 *    vuelta, que son los de llegada y salida, solo si no queda otro (antes los vacíos).
 *  - Un día con una excursión reservada se quita igual que los demás (Tanda 6y4): el viaje NUNCA se queda con días de más.
 */

/** Lo que lleva un día de verdad: paradas y restaurantes elegidos (una comida sin restaurante elegido no cuenta). */
export function dayContentCount(day: DayPlan): number {
  return day.stops.length + day.meals.filter((meal) => meal.chosenRestaurant).length
}

/** ¿Lleva el día algo que el viajero puso (paradas, comida elegida o una excursión)? */
export function dayHasContent(day: DayPlan): boolean {
  return dayContentCount(day) > 0 || Boolean(day.selectedExcursionId) || Boolean(day.halfDayExcursion && !day.halfDayExcursionDeclined) || day.dayType === 'excursion'
}

/** Un día que se quita al acortar el viaje. */
export interface ManualRemovedDay {
  dayId: string
  dayNumber: number
  /** «jue 16» (sin fechas, «día 3»), tal como se ve el día antes del cambio. */
  label: string
  /** Lleva algo (paradas, comida elegida o excursión). */
  hasContent: boolean
  /** Lleva paradas o comida elegida (no solo una excursión). */
  hasStops: boolean
}

export interface ManualResizePlan {
  current: number
  /** null: no cambia la duración (se quitaron las fechas o no son válidas). */
  target: number | null
  add: number
  /** Ids de los días a quitar. */
  remove: string[]
  /** Los mismos días, por orden de viaje, con su nombre para el aviso. */
  removed: ManualRemovedDay[]
}

const labelOf = (route: Route, dayNumber: number): string => {
  const corto = diaCorto(route, dayNumber)
  return corto.startsWith('Día ') ? `día ${dayNumber}` : corto
}

/** Los días que dejan de estar, dado el rango nuevo. */
export function planManualResize(route: Route, dateRange: DateRange | undefined): ManualResizePlan {
  const current = route.days.length
  const span = dateRange ? daysBetweenInclusive(dateRange.start, dateRange.end) : null
  if (span == null) return { current, target: null, add: 0, remove: [], removed: [] }
  const target = Math.min(MAX_TRIP_DAYS, Math.max(1, span))
  if (target >= current) return { current, target, add: target - current, remove: [], removed: [] }
  const quitar = current - target
  // Orden de salida: 1) los vacíos del medio, del último antes de la vuelta hacia atrás; 2) los del medio que llevan algo, igual; 3) el primero y 4) el de la vuelta, que son los de
  // llegada y salida y solo se tocan si no queda otro (antes los vacíos que los que llevan algo). Quitar por el final deja las fechas de lo de antes como estaban.
  const key = (day: DayPlan, index: number): number => {
    const lleno = dayHasContent(day)
    if (index >= 1 && index <= current - 2) return (lleno ? 100 : 0) + (current - 2 - index)
    if (index === 0) return lleno ? 400 : 200
    return lleno ? 500 : 300
  }
  const ordered = route.days
    .map((day, index) => ({ day, index, key: key(day, index) }))
    .sort((a, b) => a.key - b.key)
    .slice(0, quitar)
  const remove = ordered.map((entry) => entry.day.id)
  const removed = [...ordered]
    .sort((a, b) => a.index - b.index)
    .map(({ day }): ManualRemovedDay => ({ dayId: day.id, dayNumber: day.dayNumber, label: labelOf(route, day.dayNumber), hasContent: dayHasContent(day), hasStops: dayContentCount(day) > 0 }))
  return { current, target, add: 0, remove, removed }
}

/** Las reservas que se van con los días que se quitan, por orden de día y hora. */
export function reservationsOfDays(route: Route, reservations: Reservation[], dayIds: ReadonlySet<string>): Reservation[] {
  return reservations
    .filter((reservation) => {
      const day = dayOfReservation(route, reservation)
      return day != null && dayIds.has(day.id)
    })
    .sort((a, b) => (dayOfReservation(route, a)?.dayNumber ?? 0) - (dayOfReservation(route, b)?.dayNumber ?? 0) || a.time.localeCompare(b.time))
}

/**
 * Lo que está guardado POR DÍA y se va con los días que se quitan (Tanda 6y4):
 *  - el billete de transporte de un día (`transportBookings`, clave = id del día): se quita con su día;
 *  - el alojamiento (`accommodationSelections`, clave = id del primer día de la estancia): es de TODA la estancia, no de un día. Si se quita el primer día pero la estancia sigue, el hotel pasa a la
 *    clave de su nuevo primer día (se queda, con su precio); solo se quita si la estancia desaparece entera.
 * Las reservas de entrada y excursión (`reservations`) van aparte (`reservationsOfDays`). Lo que no depende de un día (seguro, eSIM, tarjeta, coche de alquiler, vuelos) no se toca.
 */
export function bookingsAfterRemovingDays<T, H>(route: Route, removedIds: ReadonlySet<string>, transportBookings: Record<string, T>, accommodationSelections: Record<string, H>): { transportBookings: Record<string, T>; accommodationSelections: Record<string, H> } {
  const transport = Object.fromEntries(Object.entries(transportBookings).filter(([dayId]) => !removedIds.has(dayId)))
  const hoteles: Record<string, H> = {}
  const tramos = buildDestinationSegments(route.days)
  const clavesDeTramos = new Set(tramos.map((tramo) => tramo.dayIds[0]))
  for (const tramo of tramos) {
    const hotel = accommodationSelections[tramo.dayIds[0]]
    if (hotel === undefined) continue
    const quedan = tramo.dayIds.filter((id) => !removedIds.has(id))
    if (quedan.length > 0) hoteles[quedan[0]] = hotel
  }
  // (Una clave que no es de ningún tramo y no es de un día quitado se deja como estaba.)
  for (const [clave, hotel] of Object.entries(accommodationSelections)) if (!clavesDeTramos.has(clave) && !removedIds.has(clave)) hoteles[clave] = hotel
  return { transportBookings: transport, accommodationSelections: hoteles }
}

const unir = (lista: string[]): string => (lista.length <= 1 ? (lista[0] ?? '') : `${lista.slice(0, -1).join(', ')} y ${lista.at(-1)}`)

/**
 * El texto del «¿Estás seguro?» al acortar el viaje: «Se quitarán el jue 16 y el vie 17, con sus paradas y tu excursión a Pompeya.» (un día: «Se quitará el jue 16, con sus paradas.»; sin fechas, «el día 3»).
 * «con sus paradas» solo si algún día de esos lleva paradas o comida elegida (o algo que no es una excursión reservada: esa se nombra aparte); un día vacío se quita sin más. Cada reserva de esos días
 * se nombra: la entrada con su día («tu entrada al Coliseo del vie 16») y la excursión sin él («tu excursión a Pompeya»; con dos o más excursiones, con el día para distinguirlas).
 */
export function manualRemovalText(removed: ManualRemovedDay[], reservations: Reservation[] = [], route?: Route, nombresCortos?: Record<string, string>): string {
  if (removed.length === 0) return ''
  const list = unir(removed.map((day) => `el ${day.label}`))
  const excursiones = reservations.filter((reservation) => reservation.kind === 'excursion')
  const diaDe = (reservation: Reservation) => {
    const day = route ? dayOfReservation(route, reservation) : null
    return day ? (removed.find((item) => item.dayId === day.id) ?? null) : null
  }
  const reservas = reservations.map((reservation) => {
    const dia = diaDe(reservation)
    const delDia = dia ? ` del ${dia.label}` : ''
    if (reservation.kind === 'excursion') return `tu ${reservation.name.charAt(0).toLowerCase()}${reservation.name.slice(1)}${excursiones.length > 1 ? delDia : ''}`
    return `${etiquetaDeReserva(reservation, nombresCortos)}${delDia}`
  })
  // (Un día cuyo único contenido es una excursión reservada no cuenta como «paradas»: la excursión se nombra aparte.)
  const soloExcursion = (day: ManualRemovedDay) => !day.hasStops && excursiones.some((reservation) => diaDe(reservation)?.dayId === day.dayId)
  const conParadas = removed.some((day) => day.hasContent && !soloExcursion(day))
  const cosas = [...(conParadas ? ['sus paradas'] : []), ...reservas]
  return `Se quitar${removed.length === 1 ? 'á' : 'án'} ${list}${cosas.length > 0 ? `, con ${unir(cosas)}` : ''}.`
}

/** Lo que dice el «¿Estás seguro?» de acortar el viaje. `null` si las fechas nuevas no quitan ningún día (se ponen sin preguntar). */
export interface ManualShrinkNotice {
  dateRange: DateRange | undefined
  /** Los días que se quitan (por orden de viaje). */
  removed: ManualRemovedDay[]
  /** Las reservas de esos días, que se quitan con ellos (también del presupuesto). */
  removedReservations: Reservation[]
  /** «Se quitarán el jue 16 y el vie 17, con sus paradas y tu excursión a Pompeya.» */
  text: string
}

export function manualShrinkNotice(route: Route, dateRange: DateRange | undefined, reservations: Reservation[], nombresCortos?: Record<string, string>): ManualShrinkNotice | null {
  const plan = planManualResize(route, dateRange)
  if (plan.removed.length === 0) return null
  const removedReservations = reservationsOfDays(route, reservations, new Set(plan.remove))
  return { dateRange, removed: plan.removed, removedReservations, text: manualRemovalText(plan.removed, removedReservations, route, nombresCortos) }
}

function freshDayId(days: DayPlan[], taken: Set<string>): string {
  let n = 1
  const used = new Set([...days.map((day) => day.id), ...taken])
  while (used.has(`day-manual-${n}`)) n++
  return `day-manual-${n}`
}

/**
 * Pone las fechas nuevas en la ruta a mano y ajusta sus días: añade vacíos o quita los que `planManualResize` dice (con todo lo que tengan: quien llama ya preguntó).
 * Los días que aún se llaman como los puso la app («lun 13 oct», «Día 2») pasan a llamarse por las fechas nuevas; los que el viajero renombró se quedan.
 */
export function resizeManualRoute(route: Route, dateRange: DateRange | undefined): Route {
  const antes = route.answers
  const plan = planManualResize(route, dateRange)
  // Qué días llevan todavía el nombre de la app (con el número que tenían, antes de renumerar).
  const nombreDeLaApp = new Set(route.days.filter((day) => !day.userAdded && !day.nameByUser && day.title === manualDayName({ answers: antes }, day.dayNumber)).map((day) => day.id))
  const quitar = new Set(plan.remove)
  let days = route.days.filter((day) => !quitar.has(day.id)).map((day) => ({ ...day, stops: [...day.stops], meals: [...day.meals] }))
  const nuevos: string[] = []
  if (plan.add > 0) {
    const template = days[0]
    const taken = new Set<string>()
    const added: DayPlan[] = Array.from({ length: plan.add }, () => {
      const id = freshDayId(days, taken)
      taken.add(id)
      nuevos.push(id)
      return { id, dayNumber: 0, city: template?.city ?? route.destination, countryCode: template?.countryCode ?? null, title: '', curatedTitle: '', stops: [], meals: [], dayType: 'manual' as const }
    })
    // Delante del último día (la vuelta); con un solo día, detrás.
    const at = days.length > 1 ? days.length - 1 : days.length
    days = [...days.slice(0, at), ...added, ...days.slice(at)]
  }
  days = days.map((day, index) => ({ ...day, dayNumber: index + 1 }))
  const answers = { ...antes, dateRange, days: plan.target != null ? days.length : antes.days }
  const next: Route = { ...route, days, answers }
  const auto = new Set([...nombreDeLaApp, ...nuevos])
  return {
    ...next,
    days: next.days.map((day) => {
      if (!auto.has(day.id)) return day
      const title = manualDayName(next, day.dayNumber)
      return title === day.title && title === day.curatedTitle ? day : { ...day, title, curatedTitle: title }
    }),
  }
}
