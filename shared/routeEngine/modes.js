/**
 * Los dos ritmos del motor v3, como DATOS. Mismo código para los dos: nunca
 * `if (pace === 'tranquilo') { ... }` con lógica propia.
 *
 * Decisiones del 2026-09-23 que fijan estos números:
 *   - Comida 13:00-14:00 y cena 20:00-21:00 en los DOS ritmos. La cena del tranquilo se había bajado
 *     a 19:30 para tapar una hora muerta antes de cenar; eso era síntoma de que faltaba planificar
 *     la tarde hacia la cena, y se arregla ahí, no moviendo la cena.
 *   - Comer: 60 min en completo, 90 en tranquilo (con sobremesa).
 *   - El día acaba CON la cena hacia las 21:30. De ahí sale la última hora a la que se puede
 *     empezar a cenar: 20:30 en completo, 20:00 en tranquilo. Las nocturnas van aparte, después.
 *   - "Visita larga" = 180 min o más (Vaticano, Coliseo+Foro). Las de 120 min comparten día con una
 *     larga si el programador confirma que cabe.
 *   - Dentro de un grupo, o a menos de 3 min a pie, se encadena sin redondear.
 */

const HHMM = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

const SHARED = {
  // Franja de comida (Paso 2, 2026-09-24): empieza a las 13:00 —como muy tarde a las 13:30 si hay un
  // grupo en marcha— y dura `lunchBlockMinutes`: llegar, comer y andar hasta la siguiente parada.
  // Una visita NUEVA solo empieza antes de comer si acaba a las 13:00 (lunchWindow[0]).
  lunchWindow: [HHMM('13:00'), HHMM('13:30')],
  dinnerWindow: [HHMM('20:00'), HHMM('21:00')],
  dayEndWithDinner: HHMM('21:30'),
  chainMaxWalkMinutes: 3,
  longVisitMinutes: 180,
  // Día con excursión de medio día: la mañana (08:00-14:00) es la excursión, 14:00-16:00 es volver
  // y comer, y la ciudad empieza aquí. La hora la pone el operador de la excursión, no el ritmo.
  halfDayRouteStart: HHMM('16:00'),
}

export const MODES_V3 = {
  completo: {
    ...SHARED,
    id: 'completo',
    dayStart: HHMM('08:00'),
    mealMinutes: 60,
    lunchBlockMinutes: 90,
    visitDurationBonus: 0,
    gapTolerance: 45,
    targetStops: [8, 10],
    fillLevels: [1, 2, 3],
  },
  tranquilo: {
    ...SHARED,
    id: 'tranquilo',
    dayStart: HHMM('10:00'),
    mealMinutes: 90,
    lunchBlockMinutes: 120,
    visitDurationBonus: 15,
    gapTolerance: 60,
    targetStops: [5, 7],
    fillLevels: [1, 2],
  },
}

/** El cuestionario manda 'nonstop'/'tranquilo'. */
export function modeV3For(pace) {
  return pace === 'tranquilo' ? MODES_V3.tranquilo : MODES_V3.completo
}

/**
 * En verano se cena después del atardecer (Parte A, regla 8): si el día tiene una parada al atardecer y
 * el sol se pone a las 20:15 o más tarde, la cena pasa a las 21:00.
 */
export const LATE_SUNSET_MINUTES = HHMM('20:15')
export const LATE_DINNER_START = HHMM('21:00')

/** Última hora a la que se puede empezar a cenar sin pasarse del fin del día. */
export function latestDinnerStart(mode) {
  return Math.min(mode.dinnerWindow[1], mode.dayEndWithDinner - mode.mealMinutes)
}
