import type { DayPlan, MealSlot, Route, Stop } from './types'
import { addDaysToIso, todayIso } from './dateRange'
import { parseTimeToMinutes } from './time'
import { seedStopsFromTemplate } from './mockDayDetail'

/**
 * Franjas reservadas del día — el pipeline de generación (Paso 6/8) ya descuenta estos huecos al
 * repartir paradas, así que cualquier hueco libre detectado en Modo Hoy que caiga aquí se trata
 * como comida/cena (recomendación de restaurante), nunca como "añadir algo cerca" genérico.
 */
export const LUNCH_WINDOW: [number, number] = [13 * 60, 14 * 60 + 30]
export const DINNER_WINDOW: [number, number] = [20 * 60 + 30, 22 * 60]

export type MealWindowKind = 'lunch' | 'dinner'

export function minutesSinceMidnight(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function getMealWindowAt(nowMin: number): MealWindowKind | null {
  if (nowMin >= LUNCH_WINDOW[0] && nowMin <= LUNCH_WINDOW[1]) return 'lunch'
  if (nowMin >= DINNER_WINDOW[0] && nowMin <= DINNER_WINDOW[1]) return 'dinner'
  return null
}

export interface TodayTripContext {
  day: DayPlan
  dayIndex: number
  dateIso: string
}

/**
 * Día del viaje cuya fecha real (o simulada, `todayIsoOverride` — solo para depuración en
 * desarrollo, ver DevDateSimulator.tsx) coincide con hoy — null si el viaje no tiene fechas
 * exactas fijadas (`answers.dateRange`) o si esa fecha cae fuera del rango. Es la condición de
 * activación del CONTENIDO de Modo Hoy (no de la pestaña en sí — ver getTodayTripStatus, que
 * también cubre "antes"/"después" del viaje).
 */
export function getTodayTripContext(route: Route, todayIsoOverride?: string): TodayTripContext | null {
  const tripStartIso = route.answers.dateRange?.start
  if (!tripStartIso) return null

  const currentIso = todayIsoOverride ?? todayIso()
  const dayIndex = route.days.findIndex((day) => addDaysToIso(tripStartIso, day.dayNumber - 1) === currentIso)
  if (dayIndex === -1) return null

  return { day: route.days[dayIndex], dayIndex, dateIso: currentIso }
}

export type TodayTripStatus =
  | { phase: 'before'; startIso: string; endIso: string }
  | { phase: 'after'; startIso: string; endIso: string }
  | { phase: 'during'; startIso: string; endIso: string; context: TodayTripContext }

/**
 * Fase del viaje respecto a la fecha actual (o simulada) — determina qué debe mostrar la pestaña
 * Hoy: el estado vacío "antes de empezar", el contenido real de Modo Hoy, o el estado vacío "ya
 * terminó". null cuando el viaje no tiene fechas exactas fijadas — en ese caso la pestaña ni
 * siquiera se muestra (ver ModeSwitcher/RouteView), así que este caso no debería alcanzar la UI.
 *
 * `endIso` se calcula del ÚLTIMO día real de `route.days` (incluye el día sintético de vuelta,
 * ver appendReturnLegDay) — nunca de `answers.dateRange.end`, que representa la última NOCHE, no
 * necesariamente el mismo día que el de regreso.
 */
export function getTodayTripStatus(route: Route, todayIsoOverride?: string): TodayTripStatus | null {
  const startIso = route.answers.dateRange?.start
  const lastDay = route.days[route.days.length - 1]
  if (!startIso || !lastDay) return null

  const endIso = addDaysToIso(startIso, lastDay.dayNumber - 1)
  const currentIso = todayIsoOverride ?? todayIso()

  if (currentIso < startIso) return { phase: 'before', startIso, endIso }
  if (currentIso > endIso) return { phase: 'after', startIso, endIso }

  const dayIndex = route.days.findIndex((day) => addDaysToIso(startIso, day.dayNumber - 1) === currentIso)
  const day = route.days[dayIndex]
  // Defensivo — no debería pasar nunca (dayNumber es secuencial sin huecos entre startIso y endIso).
  if (!day) return { phase: 'after', startIso, endIso }

  return { phase: 'during', startIso, endIso, context: { day, dayIndex, dateIso: currentIso } }
}

/** Paradas reales del día — igual que DayDetailPanel: mientras no haya edición, se usa la plantilla mock "cristalizada" para tener horarios/duraciones sobre los que operar. */
export function resolveRealStops(day: DayPlan): Stop[] {
  return day.stops.length > 0 ? day.stops : seedStopsFromTemplate(day)
}

export interface StopWindow {
  startMin: number
  endMin: number
}

export function getStopPlannedWindow(stop: Stop): StopWindow {
  const startMin = parseTimeToMinutes(stop.time)
  return { startMin, endMin: startMin + stop.durationMinutes }
}

export type StopRuntimeState = 'upcoming' | 'now' | 'confirm' | 'done'

/** Cuánto tiempo, tras anotar "dame más tiempo", se deja de insistir con "¿Sigues aquí?" antes de volver a preguntar. */
const DELAY_GRACE_MINUTES = 45

export function getStopRuntimeState(stop: Stop, nowMin: number): StopRuntimeState {
  if (stop.checkedInAt) return 'done'

  const { startMin, endMin } = getStopPlannedWindow(stop)
  if (nowMin < startMin) return 'upcoming'
  if (nowMin <= endMin) return 'now'

  if (stop.delayNotedAt) {
    const notedMin = minutesSinceMidnight(new Date(stop.delayNotedAt))
    if (nowMin - notedMin < DELAY_GRACE_MINUTES) return 'now'
  }

  return 'confirm'
}

/** Primera parada de hoy que aún no tiene check-in, en orden — -1 si ya se hizo check-in en todas. */
export function findCurrentStopIndex(stops: Stop[], nowMin: number): number {
  return stops.findIndex((stop) => getStopRuntimeState(stop, nowMin) !== 'done')
}

export type CheckInPace = 'early' | 'normal' | 'late'

/** Margen de la franja EARLY/LATE en minutos — por debajo/encima de la hora prevista de fin. */
const EARLY_MARGIN_MINUTES = 20
const LATE_MARGIN_MINUTES = 30

/**
 * Compara el check-in real contra la hora de fin PREVISTA de la parada — no contra la de inicio,
 * porque lo que importa es si el viajero ha ido más rápido o más lento de lo planeado, no cuándo
 * empezó. Usado tanto para el check-in normal como para "Ya terminé, seguir" desde "¿Sigues aquí?".
 */
export function computeCheckInPace(stop: Stop, nowMin: number): CheckInPace {
  const { endMin } = getStopPlannedWindow(stop)
  if (nowMin <= endMin - EARLY_MARGIN_MINUTES) return 'early'
  if (nowMin >= endMin + LATE_MARGIN_MINUTES) return 'late'
  return 'normal'
}

/** Umbral a partir del cual el hueco libre antes de la siguiente parada merece un aviso (pasivo o de check-in adelantado). */
export const FREE_GAP_THRESHOLD_MINUTES = 15

/** Minutos libres hasta que debería empezar `nextStop` (o la próxima parada sin check-in) — null si no hay siguiente parada. */
export function computeFreeGapMinutes(stops: Stop[], currentIndex: number, nowMin: number): number | null {
  const nextStop = stops[currentIndex]
  if (!nextStop) return null
  const { startMin } = getStopPlannedWindow(nextStop)
  return startMin - nowMin
}

const HOURS_RANGE_RE = /(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/

/**
 * "Abierto · cierra en 45 min" / "Cierra en breve" / "Cerrado ahora" a partir del horario mock del
 * lugar (`MockStopDetail.hours`) y la hora real del dispositivo — null cuando no hay horario
 * conocido (acceso libre, sin horario fijo).
 */
export function computeOpenStatusLabel(hours: string | null, nowMin: number): string | null {
  if (!hours) return null
  const match = HOURS_RANGE_RE.exec(hours)
  if (!match) return null

  const openMin = parseTimeToMinutes(match[1])
  const closeMin = parseTimeToMinutes(match[2])
  if (nowMin < openMin || nowMin > closeMin) return 'Cerrado ahora'

  const minutesLeft = closeMin - nowMin
  if (minutesLeft <= 30) return `Abierto · cierra en ${minutesLeft} min`
  if (minutesLeft < 60) return `Abierto · cierra en ${minutesLeft} min`
  const hoursLeft = Math.floor(minutesLeft / 60)
  const restMin = minutesLeft % 60
  return `Abierto · cierra en ${hoursLeft}h${restMin > 0 ? ` ${restMin}min` : ''}`
}

/** Busca en `day.meals` (Paso 8, ruta real) la comida cuya hora cae dentro de la franja dada — null si no hay ninguna generada todavía (rutas dev/preview). */
export function findGeneratedMealForWindow(day: DayPlan, window: MealWindowKind): MealSlot | null {
  const [start, end] = window === 'lunch' ? LUNCH_WINDOW : DINNER_WINDOW
  return day.meals.find((meal) => {
    const time = parseTimeToMinutes(meal.time)
    return time >= start && time <= end
  }) ?? null
}
