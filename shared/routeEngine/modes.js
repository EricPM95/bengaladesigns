/**
 * El modo del motor v3, como DATOS. Hay una sola ruta (2026-09-30): la que era «completo». El motor no recibe ni mira
 * ningún ritmo; el viajero aligera su ruta quitando paradas, y las opcionales se ven como tales.
 *
 * Decisiones que fijan estos números:
 *   - Comida 13:00-14:00 y cena 20:00-21:00. Comer, 60 min; cenar, 60 min.
 *   - El día acaba CON la cena hacia las 21:30. De ahí sale la última hora a la que se puede empezar a cenar: 20:30.
 *     Las nocturnas van aparte, después.
 *   - "Visita larga" = 180 min o más (Vaticano, Coliseo+Foro). Las de 120 min comparten día con una larga si el
 *     programador confirma que cabe.
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
  dinnerMinutes: 60,
  chainMaxWalkMinutes: 3,
  // Dentro de un mismo bloque curado se encadena hasta 10 min andando (decisión del 2026-09-26).
  blockChainMaxWalkMinutes: 12,
  groupChainMaxWalkMinutes: 15,
  longVisitMinutes: 180,
  // Día con excursión de medio día: la mañana (08:00-14:00) es la excursión, 14:00-16:00 es volver
  // y comer, y la ciudad empieza aquí. La hora la pone el operador de la excursión, no el ritmo.
  halfDayRouteStart: HHMM('16:00'),
}

export const MODE_V3 = {
  ...SHARED,
  id: 'completo',
  dayStart: HHMM('08:00'),
  mealMinutes: 60,
  lunchBlockMinutes: 90,
  visitDurationBonus: 0,
  gapTolerance: 45,
  targetStops: [8, 10],
  fillLevels: [1, 2, 3],
}

/**
 * En verano se cena después del atardecer (Parte A, regla 8): si el día tiene una parada al atardecer y
 * el sol se pone a las 20:15 o más tarde, la cena pasa a las 21:00.
 */
export const LATE_SUNSET_MINUTES = HHMM('20:00')
export const LATE_DINNER_START = HHMM('21:00')

/** Última hora a la que se puede empezar a cenar sin pasarse del fin del día. */
export function latestDinnerStart(mode) {
  return Math.min(mode.dinnerWindow[1], mode.dayEndWithDinner - (mode.dinnerMinutes ?? mode.mealMinutes))
}
