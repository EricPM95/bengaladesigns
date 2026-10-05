/**
 * La hora límite de la noche de un destino (una sola copia: la usan el motor de días escritos y el formato del día).
 *   · `destination_config.noche_limite` ({ hora, meses: { 7: "23:30" } }): la hora a la que, como tarde, acaba la última nocturna.
 *   · `destination_config.noche_larga` ({ hora_inicio, meses, sol_despues_de }): en esas noches (de mayo a septiembre y con el sol después de las 19:45) la última nocturna puede
 *     EMPEZAR hasta las 23:45.
 */
export function nightLimitOf(destData, dateIso) {
  const config = destData.destination_config?.noche_limite
  if (!config?.hora) return null
  const month = dateIso ? String(Number(String(dateIso).slice(5, 7))) : null
  const value = (month && config.meses?.[month]) || config.hora
  const [h, m] = String(value).split(':').map(Number)
  return h * 60 + (m || 0)
}

/** La hora a la que EMPIEZA como tarde la última nocturna en las noches largas, o null (entonces vale `nightLimitOf`: tiene que acabar antes). */
export function writtenNightStartLimit(destData, dateIso, sunset) {
  const config = destData.destination_config?.noche_larga
  if (!config?.hora_inicio) return null
  const month = dateIso ? Number(String(dateIso).slice(5, 7)) : null
  const [h, m] = String(config.hora_inicio).split(':').map(Number)
  const [dh, dm] = String(config.sol_despues_de ?? '19:45').split(':').map(Number)
  const byMonth = month != null && (config.meses ?? []).includes(month)
  const bySun = sunset != null && sunset >= dh * 60 + (dm || 0)
  return byMonth || bySun ? h * 60 + (m || 0) : null
}

/** ¿Vale una nocturna que empieza en `start` y dura `minutes`? (Noche larga: empieza antes del límite de inicio; si no, acaba antes de la hora límite.) */
export function nocheValida(destData, dateIso, sunset, start, minutes) {
  const startLimit = writtenNightStartLimit(destData, dateIso, sunset)
  if (startLimit != null) return start <= startLimit
  const limit = nightLimitOf(destData, dateIso)
  return limit == null ? true : start + minutes <= limit
}
