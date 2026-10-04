/**
 * Nota de temporada (decisión del usuario, 2026-09-28, general para todos los destinos): no es un aviso de cuidado,
 * le cuenta al viajero, en general, que su ruta está pensada para su época. Sale una vez, arriba de la ruta, y se
 * puede cerrar (no es ventana emergente). Cada destino lleva sus textos (`destination_config.nota_temporada`); sin
 * ellos, el de reserva del kit, sin promesas concretas.
 *
 * Lo que dice tiene que ser verdad en ese viaje:
 *  - invierno, "y veas Roma iluminada": alguna noche lleva paseo o experiencia nocturna; si no, "para que llegues a todo";
 *  - verano, "a primera hora de la mañana": en la mayoría de los días la primera visita es un imprescindible antes de
 *    las 10:00; si no, la versión sin esa promesa.
 *
 * La nota navideña (PROMPT_FECHAS_SENCILLAS, 6): si algún día del viaje cae en la `temporada_navidad` del destino, sale en
 * lugar de la de invierno, y solo promete lo que hay en ese viaje: el mercadillo si está abierto y en la ruta; árboles y
 * belenes desde que se montan; antes, solo las luces; «iluminado» si alguna noche sale a pasear. {destino}: el del viaje.
 * {hora_atardecer}: la real de las fechas del viaje (sin fechas, la típica del mes), redondeada al cuarto de hora.
 */

import { withinMonthDays } from '../../shared/routeEngine/openingHours.js'

const HHMM = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`

/**
 * El texto navideño de ese viaje (null si ningún día cae en la temporada o el destino no la tiene).
 * @returns {{ key: string } | null}
 */
export function christmasNoteKey(destData, trip, hasNight) {
  const season = destData.destination_config?.temporada_navidad
  const texts = destData.destination_config?.nota_temporada ?? {}
  if (!season?.desde || !season.hasta || !trip.calendar?.hasDates) return null
  const days = (trip.days ?? []).filter((day) => day.hours?.dateIso)
  const md = (iso) => Number(iso.slice(5, 7)) * 100 + Number(iso.slice(8, 10))
  const inside = days.filter((day) => withinMonthDays(md(day.hours.dateIso), season.desde, season.hasta))
  if (inside.length === 0) return null
  const market = season.mercadillo
  const marketInRoute = Boolean(market) && inside.some((day) => withinMonthDays(md(day.hours.dateIso), market.desde, market.hasta) && ((day.schedule?.visits ?? []).some((visit) => market.lugares.includes(visit.place.name)) || (trip.nightsByDay?.get(day.dayNumber) ?? []).some((night) => market.lugares.includes(night.name))))
  const trees = !season.arboles_desde || inside.some((day) => withinMonthDays(md(day.hours.dateIso), season.arboles_desde, season.hasta))
  const base = !trees ? 'navidad_luces' : marketInRoute ? 'navidad_mercadillo' : 'navidad'
  const key = !hasNight && texts[`${base}_sin_noche`] ? `${base}_sin_noche` : base
  return texts[key] ? { key } : null
}

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

/** La estación de una fecha (PROMPT_TARJETA_TEMPORADA, 2): primavera del 20 de marzo al 20 de junio, verano del 21 de
 * junio al 22 de septiembre, otoño del 23 de septiembre al 20 de diciembre e invierno del 21 de diciembre al 19 de marzo. */
export function seasonOfDate(dateIso) {
  const md = Number(String(dateIso).slice(5, 7)) * 100 + Number(String(dateIso).slice(8, 10))
  if (md >= 320 && md <= 620) return 'primavera'
  if (md >= 621 && md <= 922) return 'verano'
  if (md >= 923 && md <= 1220) return 'otono'
  return 'invierno'
}

const SEASON_NAME = { primavera: 'Primavera', verano: 'Verano', otono: 'Otoño', invierno: 'Invierno', navidad: 'Navidad' }
/** Los textos de la tarjeta (PROMPT_TARJETA_TEMPORADA, 3), para cualquier destino: {destino}, {hora} (el atardecer real, al
 * cuarto de hora) y el trozo entre llaves que sale solo si se cumple su condición. Un destino puede traer los suyos en
 * `destination_config.nota_temporada` con las mismas claves. */
export const SEASON_CARD_TEXTS = {
  primavera: '¡Vas a vivir {destino} en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las {hora}, hemos preparado tu ruta para aprovechar la luz{atardecer}.',
  primavera_atardecer: ' y llegar a los miradores con el atardecer',
  verano: '¡Vas a vivir {destino} en verano! Días largos, noches templadas y la ciudad en la calle. Y como anochece sobre las {hora}, las mejores vistas llegan al atardecer.',
  verano_manana: 'lo más importante, a primera hora',
  verano_siesta: 'después de comer, descanso o sitios a cubierto',
  otono: '¡Vas a vivir {destino} en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las {hora}, hemos colocado tu ruta para que veas lo mejor con luz{atardecer}.',
  otono_atardecer: ' y llegues a los miradores con el atardecer',
  invierno: '¡Vas a vivir {destino} en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las {hora}, hemos adaptado tu ruta: lo que se ve al aire libre, con luz{noche}.',
  invierno_noche: ', y por la noche, {destino} iluminada',
}
/** Los meses con la regla de verano del motor (de 14:00 a 16:30, descanso o a cubierto; shared/routeEngine/writtenTrip.js). */
const SUMMER_SHADE_MONTHS = [7, 8]
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/**
 * La tarjeta de temporada de cada viaje (PROMPT_TARJETA_TEMPORADA, INVARIANTES 415): todos los viajes la llevan y solo
 * dice lo que la ruta hace de verdad.
 *  - La estación: con fechas, la del primer día (`seasonOfDate`); si ese día cae en la `temporada_navidad` del destino,
 *    la de Navidad. Sin fechas, la del formulario.
 *  - El texto: el de la estación, con sus trozos solo si se cumplen (un atardecer en la ruta; lo importante a primera
 *    hora; la regla de verano; un paseo nocturno). La Navidad, con sus textos de siempre.
 * @param {object} destData
 * @param {object} trip   la salida del planificador (días con `hours` y `schedule`, `calendar`)
 * @param {{ hasNight: boolean }} facts
 * @returns {{ season: string, title: string, text: string, promises: string[], icon?: string } | null}
 */
export function seasonNoteFor(destData, trip, { hasNight }) {
  const calendar = trip.calendar ?? {}
  const destino = String(destData.destination ?? 'tu destino').split(',')[0].trim()
  const firstIso = (trip.days ?? []).find((day) => day.hours?.dateIso)?.hours?.dateIso ?? null
  const baseSeason = calendar.hasDates && firstIso ? seasonOfDate(firstIso) : calendar.season ?? null
  if (!baseSeason) return null
  const firstDay = (trip.days ?? []).find((day) => day.schedule && day.hours?.sunset != null)
  const sunset = firstDay?.hours?.sunset ?? null
  let hora = sunset != null ? HHMM(Math.round(sunset / 15) * 15) : null
  // Con el cambio de hora dentro del viaje (Semana Santa), una sola hora sería falsa la mitad del viaje: las dos, con el
  // día del cambio (PROMPT_REPASO_LOCAL_ROMA, 5).
  const withSun = (trip.days ?? []).filter((day) => day.schedule && day.hours?.sunset != null)
  const jump = withSun.findIndex((day, at) => at > 0 && Math.abs(day.hours.sunset - withSun[at - 1].hours.sunset) >= 45)
  if (hora && jump > 0) {
    const after = withSun[jump]
    const iso = String(after.hours.dateIso ?? '')
    const when = iso ? `el ${WEEKDAYS[new Date(`${iso.slice(0, 10)}T12:00:00Z`).getUTCDay()]} ${Number(iso.slice(8, 10))}` : 'el día del cambio de hora'
    hora = `${hora} (desde ${when}, con el cambio de hora, hasta las ${HHMM(Math.round(after.hours.sunset / 15) * 15)})`
  }
  if (!hora) return null
  const texts = { ...SEASON_CARD_TEXTS, ...(destData.destination_config?.nota_temporada ?? {}) }
  const fill = (text) => text.replaceAll('{destino}', destino).replaceAll('{hora_atardecer}', hora).replaceAll('{hora}', hora)
  const promises = []
  // Navidad: el primer día dentro de la temporada del destino.
  const christmasWindow = destData.destination_config?.temporada_navidad
  const md = (iso) => Number(iso.slice(5, 7)) * 100 + Number(iso.slice(8, 10))
  const firstInChristmas = Boolean(christmasWindow?.desde && firstIso && calendar.hasDates && withinMonthDays(md(firstIso), christmasWindow.desde, christmasWindow.hasta))
  const christmas = firstInChristmas ? christmasNoteKey(destData, trip, hasNight) : null
  if (christmas) {
    if (hasNight) promises.push('noche')
    return { season: 'navidad', title: `Navidad en ${destino}`, icon: 'navidad', text: fill(texts[christmas.key]), promises }
  }
  const season = baseSeason
  const hasSunset = (trip.days ?? []).some((day) => (day.schedule?.visits ?? []).some((visit) => visit.place?.sunset != null))
  let text
  if (season === 'primavera' || season === 'otono') {
    if (hasSunset) promises.push('atardecer')
    text = texts[season].replace('{atardecer}', hasSunset ? texts[`${season}_atardecer`] : '')
  } else if (season === 'verano') {
    const early = earlyMornings(destData, trip)
    const months = (trip.days ?? []).filter((day) => day.schedule && day.hours?.dateIso).map((day) => Number(day.hours.dateIso.slice(5, 7)))
    const siesta = false // (sin regla del calor: ya no se promete descanso a la sombra)
    if (early) promises.push('primera_hora')
    if (siesta) promises.push('descanso')
    const parts = [early ? texts.verano_manana : null, siesta ? texts.verano_siesta : null].filter(Boolean)
    text = texts.verano.replace('{calor}', parts.length ? `: ${parts.join(', y ')}` : '')
  } else {
    if (hasNight) promises.push('noche')
    text = texts.invierno.replace('{noche}', hasNight ? texts.invierno_noche : '')
  }
  return { season, title: `${SEASON_NAME[season]} en ${destino}`, text: fill(text), promises }
}
