/**
 * EL PASE Y LOS LOGROS (Tanda 8A, apartado 4). Una sola función que dice si una cuenta puede ganar logros en un viaje y un día.
 *
 *   - El cobro todavía no existe (va en la parte 3 de las cuentas): con el cobro apagado, siempre sí.
 *   - Con el cobro encendido: con el pase de ese destino, o en su día de prueba (el primer día entero del primer viaje a ese destino).
 *   - Lo ganado en la prueba no se pierde nunca (los logros ya concedidos no se quitan al acabar la prueba).
 *   - Si compra el pase más tarde, lo de los días anteriores se gana con las fotos de la galería («Lo de ayer también cuenta»), dentro del plazo de 30 días.
 */

/** El cobro está encendido solo con PASES_COBRO_ACTIVO=true en el servidor. */
export function cobroActivo(env = process.env) {
  return String(env.PASES_COBRO_ACTIVO ?? '').toLowerCase() === 'true'
}

/**
 * El día de prueba de un destino: el primer día ENTERO del primer viaje a ese destino. Un día «entero» es uno que no es el de llegada ni el de vuelta; en un viaje de
 * 1 o 2 días no hay ninguno y vale el primero (decisión de Claude, ver el informe).
 * @param {Array<{ id, destino, inicio, fin, dias: Array<{ fecha }> }>} viajes los viajes de la persona a ese destino
 * @returns {{ trip_id: string, fecha: string } | null}
 */
export function diaDePrueba(viajes) {
  const primero = [...viajes].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)))[0]
  if (!primero) return null
  const dias = primero.dias ?? []
  const fechas = dias.map((d) => d.fecha).sort()
  if (fechas.length === 0) return { trip_id: primero.id, fecha: primero.inicio }
  const enteros = fechas.length >= 3 ? fechas.slice(1, -1) : fechas.slice(0, 1)
  return { trip_id: primero.id, fecha: enteros[0] }
}

/**
 * ¿Puede esta cuenta ganar logros en este viaje y este día?
 * @param {object} p
 * @param {boolean} p.cobro        si el cobro está encendido
 * @param {string} p.destino       clave del destino («roma»)
 * @param {string} p.tripId
 * @param {string} p.fecha         el día del hecho, en la hora del destino
 * @param {Array<{ destino: string }>} p.pases   los pases que tiene la cuenta (suyos o a los que se ha unido)
 * @param {{ trip_id: string, fecha: string } | null} p.prueba el día de prueba de ese destino
 */
export function puedeGanarLogros({ cobro, destino, tripId, fecha, pases = [], prueba = null }) {
  if (!cobro) return { puede: true, motivo: 'cobro_apagado' }
  if (pases.some((x) => String(x.destino).toLowerCase() === String(destino).toLowerCase())) return { puede: true, motivo: 'con_pase' }
  if (prueba && prueba.trip_id === tripId && prueba.fecha === fecha) return { puede: true, motivo: 'dia_de_prueba' }
  return { puede: false, motivo: 'sin_pase' }
}
