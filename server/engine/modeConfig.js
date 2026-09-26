/**
 * Paso 1 del motor nuevo: los dos ritmos, como DATOS.
 *
 * Completo y tranquilo usan exactamente el mismo código. Lo único que cambia son estos números.
 * Nunca `if (pace === 'nonstop') { ... } else { ... }` con lógica distinta: en cuanto los dos modos
 * tienen ramas propias, dejan de probarse igual y uno de los dos se queda atrás.
 *
 * De dónde salen los objetivos de paradas, para que no parezcan elegidos a ojo. Cada parada consume
 * `duración (+ extra del ritmo) + trayecto (~10 min) + pérdida por redondeo (~12 min)`:
 *
 *   completo:  660 min útiles ÷ ~67 por parada ≈ 9,8  → objetivo 8-10
 *   tranquilo: 510 min útiles ÷ ~82 por parada ≈ 6,2  → objetivo 5-7
 *
 * Es decir, el redondeo a :00/:30 y el número de paradas NO se contradicen: salen del mismo
 * presupuesto. Si al medir con rutas reales el número no sale, se ajusta el objetivo — nunca el
 * redondeo, que es lo que hace que el día se lea como un plan y no como un horario de tren.
 */

const HHMM = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

export const MODE_CONFIG = {
  completo: {
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
  },
  tranquilo: {
    id: 'tranquilo',
    dayStart: HHMM('10:00'),
    morningEnd: HHMM('13:00'),
    lunchWindow: [HHMM('13:00'), HHMM('14:00')],
    lunchMinutes: 60,
    afternoonStart: HHMM('14:00'),
    dayEndTarget: HHMM('19:30'),
    // Más bajo que en completo a propósito: quien elige tranquilo quiere tardes libres. Un día que
    // acaba a las 16:00 es una tarde para perderse, no un fallo. Lo que no vale es acabar a las
    // 13:45, que es lo que hacía el motor viejo.
    dayEndFloor: HHMM('16:00'),
    // Baja respecto a completo porque el día acaba antes: con la ventana de 20:00-21:00 quedaba una
    // hora muerta entre la última parada y la cena (invariante 25).
    dinnerWindow: [HHMM('19:30'), HHMM('20:30')],
    targetStops: [5, 7],
    gapTolerance: 60,
    // Sin nivel 3: en tranquilo caben 5-7 paradas y gastarlas en relleno de tercer nivel es
    // justamente lo que hace que un día tranquilo se sienta vacío en vez de tranquilo.
    fillLevels: [1, 2],
    visitDurationBonus: 15,
  },
}

/** El cuestionario manda 'nonstop' o 'zen'/'balanced'/'tranquilo'; el motor piensa en completo/tranquilo. */
export function modeConfigFor(pace) {
  return pace === 'tranquilo' || pace === 'zen' || pace === 'balanced' ? MODE_CONFIG.tranquilo : MODE_CONFIG.completo
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
