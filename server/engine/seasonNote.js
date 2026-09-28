/**
 * Nota de temporada (decisión del usuario, 2026-09-28, general para todos los destinos): no es un aviso de cuidado,
 * le cuenta al viajero, en general, que su ruta está pensada para su época. Sale una vez, arriba de la ruta, y se
 * puede cerrar (no es ventana emergente). Cada destino lleva sus textos (`destination_config.nota_temporada`); sin
 * ellos, el de reserva del kit, sin promesas concretas.
 *
 * Lo que dice tiene que ser verdad en ese viaje:
 *  - invierno, "y veas Roma iluminada": alguna noche lleva paseo o experiencia nocturna; si no, "para que llegues a todo";
 *  - verano, "a primera hora de la mañana": en la mayoría de los días la primera visita es un imprescindible antes de
 *    las 10:00; si no (ritmo tranquilo), la versión sin esa promesa.
 * {hora_atardecer}: la real de las fechas del viaje (sin fechas, la típica del mes), redondeada al cuarto de hora.
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const EPOCA = { invierno: 'invierno', primavera: 'primavera', verano: 'verano', otono: 'otoño' }
/** Con el sol antes de esto, la nota es la de invierno (de finales de octubre a febrero en Roma). */
const WINTER_NOTE_SUNSET_BEFORE = 17 * 60 + 30
const HHMM = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1)

/** ¿La mayoría de los días empieza por un imprescindible antes de las 10:00? */
export function earlyMornings(destData, trip) {
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const cityDays = (trip.days ?? []).filter((day) => day.schedule?.visits?.length)
  if (cityDays.length === 0) return false
  const early = cityDays.filter((day) => {
    const first = day.schedule.visits.find((visit) => !visit.place.isBreak && !visit.place.passThrough)
    return first && placeByName.get(first.place.name)?.level === 1 && first.start < 10 * 60
  })
  return early.length > cityDays.length / 2
}

/**
 * @param {object} destData
 * @param {object} trip   la salida del planificador (días con `hours` y `schedule`, `calendar`)
 * @param {{ hasNight: boolean, dateNotices?: object[] }} facts
 * @returns {{ season: string, text: string, promises: string[] } | null}
 */
export function seasonNoteFor(destData, trip, { hasNight, dateNotices = [] }) {
  const calendar = trip.calendar ?? {}
  // La época, la de los horarios (`by_period`): el horario de invierno empieza con el cambio de hora (el Coliseo, el 25
  // de octubre), así que con el sol antes de las 17:30 es invierno aunque el mes diga otoño (noviembre).
  const firstSunset = (trip.days ?? []).find((day) => day.schedule && day.hours?.sunset != null)?.hours?.sunset ?? null
  const season = firstSunset != null && firstSunset < WINTER_NOTE_SUNSET_BEFORE ? 'invierno' : calendar.season ?? null
  if (!season) return null
  // Si otro aviso de fechas ya habla de la época (una fecha "temporada"), sale uno.
  const seasonalIds = new Set((destData.fechas_especiales?.fechas ?? []).filter((entry) => entry.tipo === 'temporada').map((entry) => entry.id))
  if (dateNotices.some((notice) => [...seasonalIds].some((id) => String(notice.id ?? '').endsWith(id)))) return null
  const firstDay = (trip.days ?? []).find((day) => day.schedule && day.hours?.sunset != null)
  const sunset = firstDay?.hours?.sunset ?? null
  const hora = sunset != null ? HHMM(Math.round(sunset / 15) * 15) : null
  const texts = destData.destination_config?.nota_temporada ?? null
  const promises = []
  let text
  if (!texts) {
    text = `Tu ruta está pensada para disfrutar ${destData.destination ?? 'tu destino'} en ${EPOCA[season] ?? season}.`
  } else if (season === 'invierno') {
    if (hasNight) promises.push('noche')
    text = hasNight ? texts.invierno : texts.invierno_sin_noche ?? texts.invierno
  } else if (season === 'verano') {
    const early = earlyMornings(destData, trip)
    if (early) promises.push('primera_hora')
    text = early ? texts.verano : texts.verano_sin_manana ?? texts.verano
  } else text = texts.primavera_otono
  if (!text) return null
  if (text.includes('{hora_atardecer}')) {
    if (!hora) return null
    text = text.replace('{hora_atardecer}', hora)
  }
  // Sin fechas, con el mes: "Si viajas en marzo, …".
  if (!calendar.hasDates && Number.isInteger(calendar.month)) text = `Si viajas en ${MESES[calendar.month]}, ${lowerFirst(text)}`
  return { season, text, promises }
}
