/**
 * Días libres ("+ Añadir día", decisión del usuario 2026-09-28): el viajero añade un día suyo al final del viaje y lo
 * llena con lo que quiera. Aquí solo hay funciones puras sobre la ruta; el store las envuelve en acciones.
 *
 * Un día añadido es de tipo `manual` y lleva `userAdded`: el motor no lo toca nunca (tampoco al rehacer el viaje), y
 * es el único que se puede quitar. Va detrás del último día de ruta; si hay día de vuelta, la vuelta se mueve un día.
 */
import type { ChosenRestaurant, Coordinates, DayPlan, Excursion, MealSlot, Route, Stop } from './types'
import { addDaysToIso } from './dateRange'
import { minutesToTime, parseTimeToMinutes, roundUpToQuarterHour } from './time'

/** Máximo de días por viaje (contando el de vuelta). */
export const MAX_TRIP_DAYS = 14
/** La primera parada de un día libre (lo organiza el viajero), si no trae hora. */
export const FREE_DAY_FIRST_STOP = '09:30'
/** Nombre de un día añadido sin nombre. */
export const FREE_DAY_DEFAULT_NAME = 'Día libre'
export const FREE_DAY_NAME_MAX = 40
/** Horas sugeridas de un restaurante en un día libre. */
export const FREE_DAY_MEAL_TIME: Record<'lunch' | 'dinner', string> = { lunch: '13:30', dinner: '20:30' }
const MEAL_MINUTES: Record<'lunch' | 'dinner', number> = { lunch: 75, dinner: 90 }

/** Paseo estimado entre dos puntos (línea recta con el rodeo de la ciudad, a 80 m/min) hasta que Mapbox da el real. */
export function estimatedWalkMinutes(from: Coordinates | undefined, to: Coordinates | undefined): number {
  if (!from || !to || !Number.isFinite(from.lat) || !Number.isFinite(to.lat) || (from.lat === 0 && from.lng === 0) || (to.lat === 0 && to.lng === 0)) return 15
  const rad = Math.PI / 180
  const dLat = (to.lat - from.lat) * rad
  const dLng = (to.lng - from.lng) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLng / 2) ** 2
  const meters = 2 * 6371000 * Math.asin(Math.sqrt(a))
  return Math.round((meters * 1.3) / 80)
}

/**
 * La hora de una parada nueva detrás de `previous` (Retocar la ruta, decisión del usuario 2026-09-28): cuando acaba la
 * anterior, más el paseo hasta la nueva, redondeado al cuarto de hora; con menos de 3 min andando, encadenada sin
 * redondear. Sin anterior, `fallback`.
 */
export function timeForStopAfter(previous: Stop | undefined, fallback: string, next?: Stop): string {
  if (!previous) return fallback
  const previousStart = parseTimeToMinutes(previous.time)
  if (Number.isNaN(previousStart)) return fallback
  const walk = next ? estimatedWalkMinutes(previous.coordinates, next.coordinates) : (previous.walkingTimeToNextMinutes ?? 15)
  const end = previousStart + previous.durationMinutes
  return minutesToTime(walk < 3 ? end + walk : roundUpToQuarterHour(end + walk))
}

/** El día 4 con una excursión de medio día: la hora a la que vuelve el viajero (14:00), desde la que va la tarde que él añade. Null en cualquier otro día. */
export function halfDayReturnTime(day: DayPlan): string | null {
  if (day.interruptor?.mode !== 'excursion') return null
  const viewed = (day.excursions ?? []).find((option) => option.id === (day.interruptor?.excursionId ?? day.selectedExcursionId))
  return viewed?.page?.halfDay ? (viewed.page.returnTime ?? '14:00') : null
}

export const isFreeDay = (day: DayPlan): boolean => (day.dayType ?? 'normal') === 'manual'

/**
 * Días libres: solo paradas, y la hora la pone el viajero (decisión del usuario, 2026-09-28). Una parada de un día libre
 * sin hora lleva `time: ''`; la app no calcula, no mueve y no reordena por esa hora.
 */
export const hasOwnTime = (stop: Stop): boolean => /^\d{1,2}:\d{2}$/.test(stop.time ?? '')

/** La hora sugerida para `stop` al final de un día nuestro. En un día libre, ninguna (''). */
export function suggestedTimeFor(day: DayPlan, stop: Stop): string {
  if (isFreeDay(day)) return ''
  const previous = [...day.stops].reverse().find((candidate) => !candidate.isNightExperience)
  return timeForStopAfter(previous, halfDayReturnTime(day) ?? day.stops[0]?.time ?? FREE_DAY_FIRST_STOP, stop)
}

/**
 * Días renumerados 1..n. La duración del viaje (`answers.days` y sus fechas) es lo que eligió el viajero: añadir un día (o una excursión
 * en un día nuevo) NO la alarga, y por eso puede haber más días en la lista que días de viaje (la línea «Tu viaje es de 4 días y ahora
 * tienes 5»). Solo se acorta si quedan menos días que la duración (PARA_CODE_EXCURSIONES, 4).
 */
function withDayCount(route: Route, days: DayPlan[]): Route {
  const range = route.answers.dateRange
  const base = route.answers.days ?? route.days.length
  // Quitar días solo acorta el viaje si no eran de los de más; añadir o mover no lo cambia.
  const removed = Math.max(0, route.days.length - days.length)
  const delta = -Math.max(0, removed - Math.max(0, route.days.length - base))
  return {
    ...route,
    days: days.map((day, index) => (day.dayNumber === index + 1 ? day : { ...day, dayNumber: index + 1 })),
    answers: {
      ...route.answers,
      days: (route.answers.days ?? route.days.length) + delta,
      dateRange: range ? { ...range, end: addDaysToIso(range.end, delta) } : range,
    },
  }
}

/**
 * Una excursión sustituye un día del viaje o va a un día nuevo (PARA_CODE_EXCURSIONES, 3): el día pasa a ser la excursión y se llama como ella; sus
 * paradas se quitan y el resto del viaje no cambia. Una de medio día solo ocupa la mañana (hasta las 14:00). Devuelve la ruta y el día, o null si ya
 * hay 14 días.
 */
export function placeExcursionIn(route: Route, excursion: Excursion, target: { dayId: string } | { newDay: true }): { route: Route; dayId: string } | null {
  let next = route
  let dayId: string
  const isNew = 'newDay' in target
  if (isNew) {
    const added = addFreeDay(route, excursion.title)
    if (!added) return null
    next = withDayColors(added.route)
    dayId = added.dayId
  } else dayId = target.dayId
  const half = excursion.length === 'half-day'
  next = {
    ...next,
    days: next.days.map((day) =>
      day.id !== dayId
        ? day
        : {
            ...day,
            title: excursion.title,
            curatedTitle: excursion.title,
            excursions: (day.excursions ?? []).some((other) => other.id === excursion.id) ? day.excursions : [...(day.excursions ?? []), excursion],
            selectedExcursionId: excursion.id,
            excursionDeclined: false,
            halfDayExcursionDeclined: false,
            ...(half
              ? {
                  dayType: isNew ? ('manual' as const) : day.dayType,
                  halfDayExcursion: { id: excursion.id, startsAt: '08:00', endsAt: '14:00', routeStartsAt: '14:00' },
                  stops: isNew ? [] : day.stops.filter((stop) => !(stop.time && stop.time < '14:00')),
                }
              : { dayType: 'excursion' as const, halfDayExcursion: null, stops: [], meals: [] }),
          },
    ),
  }
  return { route: next, dayId }
}

/**
 * El día 4 con su interruptor y una excursión de su página (reservada, o elegida): se queda elegida y, con el interruptor en Excursión, es la que enseña el día. Con el interruptor en Roma no cambia
 * el día (el viajero lo dejó así a propósito): solo se acuerda de la excursión para cuando vuelva.
 */
export function withExcursionOnSwitchDay(route: Route, dayId: string, excursion: Excursion): Route {
  return {
    ...route,
    days: route.days.map((day) => {
      if (day.id !== dayId || !day.interruptor) return day
      const excursions = (day.excursions ?? []).some((other) => other.id === excursion.id) ? day.excursions : [...(day.excursions ?? []), excursion]
      return {
        ...day,
        excursions,
        interruptor: { ...day.interruptor, excursionId: excursion.id },
        ...(day.interruptor.mode === 'excursion' ? { selectedExcursionId: excursion.id } : {}),
      }
    }),
  }
}

/** ¿Se puede añadir otro día? */
export const canAddDay = (route: Route): boolean => route.days.length < MAX_TRIP_DAYS

/** Añade un día libre con ese nombre detrás del último día de ruta. Devuelve la ruta y el id del día, o null. */
export function addFreeDay(route: Route, name: string): { route: Route; dayId: string } | null {
  if (!canAddDay(route)) return null
  const returnAt = route.days.findIndex((day) => day.isReturnLeg)
  const at = returnAt >= 0 ? returnAt : route.days.length
  const template = [...route.days.slice(0, at)].reverse()[0] ?? route.days[0]
  const title = name.trim().slice(0, FREE_DAY_NAME_MAX) || FREE_DAY_DEFAULT_NAME
  const day: DayPlan = {
    id: `day-manual-${Date.now()}`,
    dayNumber: at + 1,
    city: template?.city ?? route.destination,
    countryCode: template?.countryCode ?? null,
    phaseType: template?.phaseType,
    title,
    curatedTitle: title,
    stops: [],
    meals: [],
    excursions: template?.excursions,
    dayType: 'manual',
    userAdded: true,
  }
  const days = [...route.days.slice(0, at), day, ...route.days.slice(at)]
  return { route: withDayCount(route, days), dayId: day.id }
}

/** Los días añadidos por el viajero: al rehacer el viaje, el motor planifica sin ellos (ver regenerateRouteForDates). */
export const userAddedDays = (route: Route | null): DayPlan[] => (route?.days ?? []).filter((day) => day.userAdded)

/**
 * Rehacer el viaje: los días añadidos vuelven igual, en su número de día (sin pasar del de vuelta), y el viaje recupera
 * sus días de más.
 */
export function withUserDaysBack(route: Route, userDays: DayPlan[]): Route {
  if (userDays.length === 0) return route
  const days = [...route.days]
  for (const day of [...userDays].sort((a, b) => a.dayNumber - b.dayNumber)) {
    const returnAt = days.findIndex((candidate) => candidate.isReturnLeg)
    const limit = returnAt >= 0 ? returnAt : days.length
    days.splice(Math.min(Math.max(day.dayNumber - 1, 1), limit), 0, day)
  }
  return withDayCount(route, days)
}

/** Quita un día añadido por el viajero (los nuestros no se quitan). */
export function removeFreeDay(route: Route, dayId: string): Route {
  const day = route.days.find((candidate) => candidate.id === dayId)
  if (!day?.userAdded) return route
  return withDayCount(route, route.days.filter((candidate) => candidate.id !== dayId))
}

/**
 * "Eliminar día" (PROMPT_UI, Parte 1): cualquier día, también el de llegada y el de vuelta. Los demás se renumeran y el
 * viaje acaba un día antes (o empieza uno después, si era el primero). Se recupera con "Volver a mi ruta original".
 */
export function removeAnyDay(route: Route, dayId: string): Route {
  const index = route.days.findIndex((candidate) => candidate.id === dayId)
  if (index < 0 || route.days.length <= 1) return route
  const days = route.days.filter((candidate) => candidate.id !== dayId)
  const range = route.answers.dateRange
  // (Con días de más sobre la duración del viaje, quitar uno no cambia las fechas: solo desaparece uno de los de más.)
  const inExcess = route.days.length > (route.answers.days ?? route.days.length)
  if (index === 0 && range && !inExcess) {
    const moved = withDayCount({ ...route, answers: { ...route.answers, dateRange: { ...range, start: addDaysToIso(range.start, 1), end: addDaysToIso(range.end, 1) } } }, days)
    return moved
  }
  return withDayCount(route, days)
}

/**
 * El color de cada día va con el día, no con su posición (PROMPT_UI, Parte 1): el que no lo tiene todavía recibe el
 * primero libre de la paleta, en el orden del viaje. Los que ya lo tienen no cambian nunca.
 */
export function withDayColors(route: Route): Route {
  if (route.days.every((day) => day.isReturnLeg || day.colorIndex != null)) return route
  const used = new Set(route.days.map((day) => day.colorIndex).filter((index): index is number => index != null))
  let next = 0
  const days = route.days.map((day) => {
    if (day.isReturnLeg || day.colorIndex != null) return day
    while (used.has(next)) next++
    used.add(next)
    return { ...day, colorIndex: next }
  })
  return { ...route, days }
}

/** La copia de la ruta tal como se crea: la que recupera "Volver a mi ruta original". Sin copias de copias. */
export function originalRouteOf(route: Route): NonNullable<Route['originalRoute']> {
  const days = route.days.map(({ originalSnapshot: _snapshot, ...day }) => (void _snapshot, day as DayPlan))
  return JSON.parse(JSON.stringify({ days, answers: route.answers })) as NonNullable<Route['originalRoute']>
}

export function renameDay(route: Route, dayId: string, name: string): Route {
  const title = name.trim().slice(0, FREE_DAY_NAME_MAX) || FREE_DAY_DEFAULT_NAME
  return { ...route, days: route.days.map((day) => (day.id === dayId ? { ...day, title, curatedTitle: title } : day)) }
}

/** ¿Se puede mover el día libre un puesto antes / después? Nunca al sitio del Día 1 ni al del día de vuelta. */
export function canMoveDay(route: Route, dayId: string, direction: -1 | 1): boolean {
  const index = route.days.findIndex((day) => day.id === dayId)
  const target = index + direction
  // (También al primer puesto: el día de llegada se mueve como los demás, PROMPT_UI_REPASO 10.)
  return index >= 0 && target >= 0 && target < route.days.length && !route.days[index].isReturnLeg && !route.days[target].isReturnLeg && route.days[target].city === route.days[index].city
}

export function moveDay(route: Route, dayId: string, direction: -1 | 1): Route {
  if (!canMoveDay(route, dayId, direction)) return route
  const index = route.days.findIndex((day) => day.id === dayId)
  const days = [...route.days]
  ;[days[index], days[index + direction]] = [days[index + direction], days[index]]
  return withDayCount(route, days)
}

/**
 * Un restaurante en su comida o su cena. En un día nuestro sustituye a esa comida; en uno libre entra a su hora
 * (13:30 o 20:30) si todavía no la tenía.
 */
export function withMealRestaurant(day: DayPlan, mealTime: 'lunch' | 'dinner', restaurant: ChosenRestaurant | null): DayPlan {
  const existing = day.meals.find((meal) => meal.mealTime === mealTime)
  if (existing) return { ...day, meals: day.meals.map((meal) => (meal === existing ? { ...meal, chosenRestaurant: restaurant } : meal)) }
  if (!restaurant) return day
  const time = FREE_DAY_MEAL_TIME[mealTime]
  const meal: MealSlot = {
    id: `meal-${mealTime}-${Date.now()}`,
    time,
    windowEnd: minutesToTime(parseTimeToMinutes(time) + MEAL_MINUTES[mealTime]),
    label: mealTime === 'lunch' ? 'Comida' : 'Cena',
    nearbyNote: '',
    restaurants: [],
    mealTime,
    coordinates: restaurant.coordinates,
    chosenRestaurant: restaurant,
  }
  return { ...day, meals: [...day.meals, meal] }
}

/**
 * Una parada nueva en el día, a la hora que diga el viajero: en su sitio por hora (en un día sin horas, al final). La
 * anterior pasa a tener el tramo pendiente (lo pide DayDetailPanel a Mapbox); ninguna otra hora se mueve.
 */
export function withStopAt(day: DayPlan, stop: Stop, time: string | null): DayPlan {
  const start = time ? parseTimeToMinutes(time) : NaN
  const newStop: Stop = { ...stop, time: isFreeDay(day) ? '' : (time ?? suggestedTimeFor(day, stop)), addedByUser: true }
  let at = day.stops.length
  // En un día libre, al final: el orden es el que pone el viajero.
  if (!isFreeDay(day) && !Number.isNaN(start)) {
    const later = day.stops.findIndex((other) => !other.isNightExperience && parseTimeToMinutes(other.time) > start)
    if (later >= 0) at = later
  }
  const stops = day.stops.map((other, index) => (index === at - 1 ? { ...other, nextLegPending: true } : other))
  stops.splice(at, 0, { ...newStop, nextLegPending: at < day.stops.length || undefined })
  return { ...day, stops }
}

/** Los ids de los días que llevan una excursión de día entero. */
export function hasFullDayExcursion(day: DayPlan): boolean {
  if (day.dayType !== 'excursion') return false
  const chosen = (day.excursions ?? []).find((excursion) => excursion.id === day.selectedExcursionId)
  return Boolean(chosen && chosen.length === 'full-day')
}

/** Un día sin nada todavía (para las excursiones). */
export const isEmptyDay = (day: DayPlan): boolean => day.stops.length === 0 && !day.selectedExcursionId && !(day.halfDayExcursion && !day.halfDayExcursionDeclined)
