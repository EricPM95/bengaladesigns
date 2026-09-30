const HHMM = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

/**
 * El modo del motor viejo (preplan), como DATOS. Hay una sola ruta (2026-09-30): el motor no recibe ni mira ningún ritmo.
 * El objetivo de paradas sale del presupuesto del día: 660 min útiles ÷ ~67 por parada ≈ 9,8 → 8-10.
 */
export const MODE_CONFIG = {
    id: 'completo',
    /** El primer hueco (8:00-9:00) es SIEMPRE un exterior: casi nada abre antes de las 9:00. No es
        un fallo de horario, es un paseo por la zona mientras abren (invariante 26). */
    dayStart: HHMM('08:00'),
    morningEnd: HHMM('13:00'),
    lunchWindow: [HHMM('13:00'), HHMM('14:00')],
    lunchMinutes: 60,
    afternoonStart: HHMM('14:00'),
    dayEndTarget: HHMM('20:00'),
    /** Por debajo de esta hora el día se ha quedado corto y hay que rellenarlo (ver Paso 5). */
    dayEndFloor: HHMM('18:00'),
    dinnerWindow: [HHMM('20:00'), HHMM('21:00')],
    targetStops: [8, 10],
    /** Hueco que NO se rellena: es caminar tranquilo, hacer fotos, un helado. Parte del viaje. */
    gapTolerance: 45,
    fillLevels: [1, 2, 3],
    visitDurationBonus: 0,
}

/**
 * Minutos que "cuesta" una unidad dentro del presupuesto de una franja: su duración con el extra
 * del ritmo, más lo que se va en llegar y en el redondeo. Sirve para repartir, no para poner horas
 * — las horas reales las calcula el constructor del día con los trayectos de verdad.
 */
export const AVG_TRAVEL_MINUTES = 10
export const AVG_ROUNDING_LOSS_MINUTES = 12

export function unitCostMinutes(unit, mode) {
  const bonus = unit.isFreeTour ? 0 : mode.visitDurationBonus
  return unit.minutes + bonus * unit.places.length + AVG_TRAVEL_MINUTES + AVG_ROUNDING_LOSS_MINUTES
}

/** Presupuesto en minutos de cada franja del día. */
export function slotBudgets(mode) {
  return {
    morning: mode.morningEnd - mode.dayStart,
    afternoon: mode.dayEndTarget - mode.afternoonStart,
  }
}

/**
 * Un día de excursión de MEDIO DÍA, en horas:
 *
 *   EXCURSIÓN   08:00 - 14:00   la mañana entera, sin paradas de ciudad
 *   DESCANSO    14:00 - 16:00   vacío a propósito: se vuelve, se come, se deja la mochila
 *   RUTA        16:00 en adelante
 *
 * Las horas de la excursión las pone el operador, no el ritmo del viaje: una excursión sale cuando
 * sale. Lo que sí depende del ritmo es hasta cuándo llega la tarde, así que el presupuesto se
 * calcula contra el `dayEndTarget` de cada modo (completo 20:00 → 4h; tranquilo 19:30 → 3,5h).
 */
export const HALF_DAY_EXCURSION_START = HHMM('08:00')
export const HALF_DAY_EXCURSION_END = HHMM('14:00')
export const HALF_DAY_ROUTE_START = HHMM('16:00')

export function halfDaySlotBudgets(mode) {
  return {
    morning: 0,
    afternoon: Math.max(0, mode.dayEndTarget - HALF_DAY_ROUTE_START),
  }
}
