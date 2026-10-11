import type { DateRange, DayPlan, Route } from './types'
import { daysBetweenInclusive } from './dateRange'
import { diaCorto } from './nombreDeDia'
import { manualDayName } from './manualRoute'
import { MAX_TRIP_DAYS } from './freeDays'

/**
 * CAMBIAR LAS FECHAS DE UNA RUTA A MANO A OTRA DURACIÓN (Tanda 6y2). Funciones puras, sin React:
 *  - MÁS días: se añaden días vacíos justo antes del último (el día de la vuelta); con un solo día, detrás;
 *  - MENOS días: se quitan primero los días vacíos (los últimos antes de la vuelta, luego el primero y, si no queda otro, el de la vuelta);
 *  - un día con paradas, con una comida elegida o con una excursión NUNCA se quita sin preguntar: `planManualResize` los lista en `ask` y `resizeManualRoute` solo los quita si
 *    quien llama trae la decisión del viajero ('move' = pasar lo suyo a otro día; 'drop' = quitarlo). Sin decisión, el día se queda (y el viaje queda con un día de más).
 *  - «Pasarlas a otro día» = al FINAL del día más cercano ANTERIOR que se queda (si es el primero, al más cercano posterior): así el orden del viajero no se rompe y la app no
 *    inventa un sitio nuevo; la pregunta lo dice antes de hacerlo.
 */

export type RemovedDayChoice = 'move' | 'drop'

/** Lo que lleva un día de verdad: paradas y restaurantes elegidos (una comida sin restaurante elegido no cuenta). */
export function dayContentCount(day: DayPlan): number {
  return day.stops.length + day.meals.filter((meal) => meal.chosenRestaurant).length
}

/** ¿Lleva el día algo que el viajero puso (paradas, comida elegida o una excursión)? */
export function dayHasContent(day: DayPlan): boolean {
  return dayContentCount(day) > 0 || Boolean(day.selectedExcursionId) || Boolean(day.halfDayExcursion && !day.halfDayExcursionDeclined) || day.dayType === 'excursion'
}

export interface ManualResizeQuestion {
  dayId: string
  dayNumber: number
  /** «jue 16» (sin fechas, «día 3»), tal como se ve el día antes del cambio. */
  label: string
  /** Paradas y restaurantes elegidos del día. */
  count: number
  /** El día es (o lleva) una excursión: no se puede «pasar» a otro día, solo quitar. */
  excursion: boolean
  /** El día al que irían sus paradas (null si es una excursión). */
  moveToDayId: string | null
  moveToLabel: string | null
}

export interface ManualResizePlan {
  current: number
  /** null: no cambia la duración (se quitaron las fechas o no son válidas). */
  target: number | null
  add: number
  /** Ids de los días a quitar (vacíos primero). */
  remove: string[]
  /** De los que se quitan, los que llevan algo: hay que preguntar uno a uno. */
  ask: ManualResizeQuestion[]
}

const labelOf = (route: Route, dayNumber: number): string => {
  const corto = diaCorto(route, dayNumber)
  return corto.startsWith('Día ') ? `día ${dayNumber}` : corto
}

/** Los días que dejan de estar, dado el rango nuevo, y los que hay que preguntar. */
export function planManualResize(route: Route, dateRange: DateRange | undefined): ManualResizePlan {
  const current = route.days.length
  const span = dateRange ? daysBetweenInclusive(dateRange.start, dateRange.end) : null
  if (span == null) return { current, target: null, add: 0, remove: [], ask: [] }
  const target = Math.min(MAX_TRIP_DAYS, Math.max(1, span))
  if (target >= current) return { current, target, add: target - current, remove: [], ask: [] }
  const quitar = current - target
  // Orden de salida: primero los vacíos, luego los que llevan algo; dentro de cada grupo, los del medio empezando por el último antes de la vuelta, después el primero y por último la vuelta.
  const rank = (index: number) => (index >= 1 && index <= current - 2 ? current - 2 - index : index === 0 ? current : current * 2)
  const ordered = route.days
    .map((day, index) => ({ day, index, key: (dayHasContent(day) ? 1000 : 0) + rank(index) }))
    .sort((a, b) => a.key - b.key)
    .slice(0, quitar)
  const remove = ordered.map((entry) => entry.day.id)
  const removed = new Set(remove)
  const ask = ordered
    .filter((entry) => dayHasContent(entry.day))
    .sort((a, b) => a.index - b.index)
    .map(({ day, index }): ManualResizeQuestion => {
      const excursion = Boolean(day.selectedExcursionId) || day.dayType === 'excursion' || Boolean(day.halfDayExcursion && !day.halfDayExcursionDeclined)
      const to = excursion ? null : moveTargetOf(route.days, removed, index)
      return {
        dayId: day.id,
        dayNumber: day.dayNumber,
        label: labelOf(route, day.dayNumber),
        count: dayContentCount(day),
        excursion,
        moveToDayId: to?.id ?? null,
        moveToLabel: to ? labelOf(route, to.dayNumber) : null,
      }
    })
  return { current, target, add: 0, remove, ask }
}

/** El día más cercano ANTERIOR que se queda; si no hay (es el primero), el más cercano posterior. */
function moveTargetOf(days: DayPlan[], removed: Set<string>, index: number): DayPlan | null {
  for (let i = index - 1; i >= 0; i--) if (!removed.has(days[i].id)) return days[i]
  for (let i = index + 1; i < days.length; i++) if (!removed.has(days[i].id)) return days[i]
  return null
}

function freshDayId(days: DayPlan[], taken: Set<string>): string {
  let n = 1
  const used = new Set([...days.map((day) => day.id), ...taken])
  while (used.has(`day-manual-${n}`)) n++
  return `day-manual-${n}`
}

/**
 * Pone las fechas nuevas en la ruta a mano y ajusta sus días: añade vacíos, quita vacíos, y los días con algo solo se quitan con la decisión del viajero (ver arriba).
 * Los días que aún se llaman como los puso la app («lun 13 oct», «Día 2») pasan a llamarse por las fechas nuevas; los que el viajero renombró se quedan.
 */
export function resizeManualRoute(route: Route, dateRange: DateRange | undefined, decisions: Record<string, RemovedDayChoice> = {}): Route {
  const antes = route.answers
  const plan = planManualResize(route, dateRange)
  // Qué días llevan todavía el nombre de la app (con el número que tenían, antes de renumerar).
  const nombreDeLaApp = new Set(route.days.filter((day) => !day.userAdded && !day.nameByUser && day.title === manualDayName({ answers: antes }, day.dayNumber)).map((day) => day.id))
  const quitar = new Set(plan.remove.filter((id) => {
    const day = route.days.find((candidate) => candidate.id === id)
    return day && (!dayHasContent(day) || decisions[id] !== undefined)
  }))
  let days = route.days.map((day) => ({ ...day, stops: [...day.stops], meals: [...day.meals] }))
  // Lo que se pasa a otro día va al final del día que se queda (el orden del viajero no cambia).
  for (const question of plan.ask) {
    if (decisions[question.dayId] !== 'move' || !quitar.has(question.dayId) || question.excursion) continue
    const from = route.days.find((day) => day.id === question.dayId)
    const index = route.days.findIndex((day) => day.id === question.dayId)
    const to = from ? moveTargetOf(route.days, quitar, index) : null
    if (!from || !to) continue
    days = days.map((day) => {
      if (day.id !== to.id) return day
      const meals = [...day.meals]
      for (const meal of from.meals) if (meal.chosenRestaurant && !meals.some((own) => own.mealTime === meal.mealTime && own.chosenRestaurant)) meals.push(meal)
      return { ...day, stops: [...day.stops, ...from.stops], meals }
    })
  }
  days = days.filter((day) => !quitar.has(day.id))
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
