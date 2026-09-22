/**
 * Qué excursiones tiene un destino, y de qué tipo.
 *
 * Vive en su propio módulo porque lo leen los dos lados: routeAlgorithm.js (que monta el día de
 * excursión y la carga del servidor) y engine/preplan.js (que decide qué mañanas se van fuera).
 * Cuando el mismo filtro vive copiado en dos sitios, uno se actualiza y el otro se queda con un
 * formato que el dato ya no tiene — y se queda mudo sin dar ningún error, como pasó con `closed_on`.
 *
 * Dos tipos, y son decisiones distintas:
 *   - jornada completa: se come el día entero, va en el día `core_days` del destino
 *   - medio día (`half_day: true`): ocupa la mañana de un día de revisitas y deja la tarde para la
 *     ciudad
 */

/** Las de jornada completa, en orden editorial (lo más imprescindible primero). */
export function fullDayExcursions(destData) {
  return (destData?.excursions?.options ?? []).filter((option) => !option.half_day)
}

/** Las de medio día, en orden editorial. */
export function halfDayExcursions(destData) {
  return (destData?.excursions?.options ?? []).filter((option) => option.half_day === true)
}

/**
 * La excursión que el destino deja ya marcada en el día de excursión.
 *
 * Vive en la propia opción (`preselected: true`), que es donde está el dato. Se sigue leyendo
 * `destination_config.default_excursion` como reserva por si algún JSON de destino no se ha
 * migrado todavía — pero no se escriben los dos: dos fuentes para el mismo dato acaban siempre
 * con una de las dos desactualizada.
 */
export function preselectedExcursionId(destData) {
  const marcada = (destData?.excursions?.options ?? []).find((option) => option.preselected === true)
  return marcada?.id ?? destData?.destination_config?.default_excursion ?? null
}
