import type { DateRange, DayPlan, Route } from './types'
import { daysBetweenInclusive } from './dateRange'
import { diaCorto } from './nombreDeDia'
import { manualDayName } from './manualRoute'
import { MAX_TRIP_DAYS } from './freeDays'
import { dayOfReservation, isDayPinned, type Reservation } from './bookings'

/**
 * CAMBIAR LAS FECHAS DE UNA RUTA A MANO A OTRA DURACIÓN (Tanda 6y2, simplificado en la 6y3). Funciones puras, sin React:
 *  - MÁS días: se añaden días vacíos justo antes del último (el día de la vuelta); con un solo día, detrás. Sin preguntar;
 *  - MENOS días: se quitan días, y la app NO pregunta qué hacer con sus cosas: avisa con el «¿Estás seguro?» de siempre diciendo QUÉ días se quitan (`manualRemovalText`) y, si el
 *    viajero dice que sí, esos días se quitan con todo lo que tengan (paradas, comida, excursión). Si dice que no, las fechas no cambian. Las paradas NUNCA pasan a otro día.
 *  - Qué días se quitan: primero los vacíos del medio, del último antes de la vuelta hacia atrás; solo si hay que tocar más, los del medio que llevan algo; el primero y el de la
 *    vuelta, que son los de llegada y salida, solo si no queda otro (antes los vacíos).
 *  - Un día fijado por una reserva (una excursión reservada) no se quita nunca, como en «Eliminar día»: el viaje queda entonces con un día de más (`pinned`).
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

/** Los días que dejan de estar, dado el rango nuevo. `pinned`: ids de días que no se pueden quitar (fijados por una excursión reservada). */
export function planManualResize(route: Route, dateRange: DateRange | undefined, pinned: ReadonlySet<string> = new Set()): ManualResizePlan {
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
    .filter((entry) => !pinned.has(entry.day.id))
    .sort((a, b) => a.key - b.key)
    .slice(0, quitar)
  const remove = ordered.map((entry) => entry.day.id)
  const removed = [...ordered]
    .sort((a, b) => a.index - b.index)
    .map(({ day }): ManualRemovedDay => ({ dayId: day.id, dayNumber: day.dayNumber, label: labelOf(route, day.dayNumber), hasContent: dayHasContent(day) }))
  return { current, target, add: 0, remove, removed }
}

/**
 * El texto del «¿Estás seguro?» al acortar el viaje: «Se quitarán el jue 16 y el vie 17, con sus paradas.» (un día: «Se quitará el jue 16, con sus paradas.»; sin fechas, «el día 3»).
 * «con sus paradas» solo si algún día de esos lleva algo; un día vacío se quita sin más.
 */
export function manualRemovalText(removed: ManualRemovedDay[]): string {
  if (removed.length === 0) return ''
  const names = removed.map((day) => `el ${day.label}`)
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
  return `Se quitar${removed.length === 1 ? 'á' : 'án'} ${list}${removed.some((day) => day.hasContent) ? ', con sus paradas' : ''}.`
}

/** Lo que dice el «¿Estás seguro?» de acortar el viaje. `null` si las fechas nuevas no quitan ningún día (se ponen sin preguntar). */
export interface ManualShrinkNotice {
  dateRange: DateRange | undefined
  /** Los días que se quitan (por orden de viaje). */
  removed: ManualRemovedDay[]
  /** «Se quitarán el jue 16 y el vie 17, con sus paradas.» */
  text: string
  /** Lo que no se puede quitar o no se borra: «Tus reservas de esos días se quedan en RESERVAS.» (la reserva no se borra, como al eliminar un día) y los días que se quedan por una excursión reservada; si no hay nada, null. */
  detail: string | null
  /** Días que se habrían quitado pero no se pueden (fijados por una excursión reservada): el viaje queda con esos días de más. */
  keptPinned: string[]
}

export function manualShrinkNotice(route: Route, dateRange: DateRange | undefined, reservations: Reservation[]): ManualShrinkNotice | null {
  const pinned = new Set(route.days.filter((day) => isDayPinned(route, reservations, day)).map((day) => day.id))
  const plan = planManualResize(route, dateRange, pinned)
  if (plan.removed.length === 0) return null
  const ids = new Set(plan.remove)
  const conReserva = reservations.some((reservation) => {
    const day = dayOfReservation(route, reservation)
    return day != null && ids.has(day.id)
  })
  const sinFijar = planManualResize(route, dateRange)
  const keptPinned = sinFijar.removed.filter((day) => pinned.has(day.dayId)).map((day) => day.label)
  const partes = [
    conReserva ? 'Tus reservas de esos días se quedan en RESERVAS.' : '',
    keptPinned.length > 0 ? `${keptPinned.length === 1 ? `El ${keptPinned[0]} se queda` : `${keptPinned.map((label) => `el ${label}`).join(' y ')} se quedan`}, porque tiene${keptPinned.length === 1 ? '' : 'n'} una excursión reservada.` : '',
  ].filter(Boolean)
  return { dateRange, removed: plan.removed, text: manualRemovalText(plan.removed), detail: partes.length > 0 ? partes.join(' ') : null, keptPinned }
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
export function resizeManualRoute(route: Route, dateRange: DateRange | undefined, pinned: ReadonlySet<string> = new Set()): Route {
  const antes = route.answers
  const plan = planManualResize(route, dateRange, pinned)
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
