/**
 * Días libres ("+ Añadir día", decisión del usuario 2026-09-28): el viajero añade un día suyo al final del viaje y lo
 * llena con lo que quiera. Aquí solo hay funciones puras sobre la ruta; el store las envuelve en acciones.
 *
 * Un día añadido es de tipo `manual` y lleva `userAdded`: el motor no lo toca nunca (tampoco al rehacer el viaje), y
 * es el único que se puede quitar. Va detrás del último día de ruta; si hay día de vuelta, la vuelta se mueve un día.
 */
import type { ChosenRestaurant, Coordinates, DayPlan, MealSlot, Route, Stop } from './types'
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
  return timeForStopAfter(previous, day.stops[0]?.time ?? FREE_DAY_FIRST_STOP, stop)
}

/** Días renumerados 1..n y fechas del viaje movidas `delta` días por el final. */
function withDayCount(route: Route, days: DayPlan[], delta: number): Route {
  const range = route.answers.dateRange
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
  return { route: withDayCount(route, days, 1), dayId: day.id }
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
  return withDayCount(route, days, userDays.length)
}

/** Quita un día añadido por el viajero (los nuestros no se quitan). */
export function removeFreeDay(route: Route, dayId: string): Route {
  const day = route.days.find((candidate) => candidate.id === dayId)
  if (!day?.userAdded) return route
  return withDayCount(route, route.days.filter((candidate) => candidate.id !== dayId), -1)
}

export function renameDay(route: Route, dayId: string, name: string): Route {
  const title = name.trim().slice(0, FREE_DAY_NAME_MAX) || FREE_DAY_DEFAULT_NAME
  return { ...route, days: route.days.map((day) => (day.id === dayId ? { ...day, title, curatedTitle: title } : day)) }
}

/** ¿Se puede mover el día libre un puesto antes / después? Nunca al sitio del Día 1 ni al del día de vuelta. */
export function canMoveDay(route: Route, dayId: string, direction: -1 | 1): boolean {
  const index = route.days.findIndex((day) => day.id === dayId)
  const target = index + direction
  return index >= 0 && target >= 1 && target < route.days.length && !route.days[target].isReturnLeg && route.days[target].city === route.days[index].city
}

export function moveDay(route: Route, dayId: string, direction: -1 | 1): Route {
  if (!canMoveDay(route, dayId, direction)) return route
  const index = route.days.findIndex((day) => day.id === dayId)
  const days = [...route.days]
  ;[days[index], days[index + direction]] = [days[index + direction], days[index]]
  return withDayCount(route, days, 0)
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
