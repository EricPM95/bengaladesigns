/**
 * La nota de temporada de arriba de la ruta (decisión del usuario, 2026-09-28; cambiada en la Tanda 10L, 2026-10-25): SOLO queda la de Navidad. Las de primavera, verano, otoño e invierno se quitaron: no aportan nada
 * (el tiempo de verdad lo da HOY). Cada destino lleva sus textos navideños (`destination_config.nota_temporada`); sin ellos, no sale nada. Sale una vez, arriba de la ruta, y se puede cerrar (no es ventana emergente).
 *
 * La nota navideña (PROMPT_FECHAS_SENCILLAS, 6): si el primer día del viaje cae en la `temporada_navidad` del destino, sale, y solo promete lo que hay en ese viaje: el mercadillo si está abierto y en la ruta; árboles y
 * belenes desde que se montan; antes, solo las luces; «iluminado» si alguna noche sale a pasear (las variantes `*_sin_noche` no lo dicen). {destino}: el del viaje. Ya no se habla del atardecer (no se trabaja con él).
 * No cambia cómo se reparten los días: solo es un texto.
 */

import { withinMonthDays } from '../../shared/routeEngine/openingHours.js'

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

/**
 * La nota de arriba de la ruta: solo la de Navidad (null en cualquier otra fecha: ya no hay tarjetas de estación).
 * @param {object} destData
 * @param {object} trip   la salida del planificador (días con `hours` y `schedule`, `calendar`)
 * @param {{ hasNight: boolean }} facts
 * @returns {{ season: 'navidad', title: string, text: string, promises: string[], icon: string } | null}
 */
export function seasonNoteFor(destData, trip, { hasNight }) {
  const calendar = trip.calendar ?? {}
  if (!calendar.hasDates) return null
  const destino = String(destData.destination ?? 'tu destino').split(',')[0].trim()
  const firstIso = (trip.days ?? []).find((day) => day.hours?.dateIso)?.hours?.dateIso ?? null
  // Navidad: el primer día dentro de la temporada del destino.
  const christmasWindow = destData.destination_config?.temporada_navidad
  const md = (iso) => Number(iso.slice(5, 7)) * 100 + Number(iso.slice(8, 10))
  const firstInChristmas = Boolean(christmasWindow?.desde && firstIso && withinMonthDays(md(firstIso), christmasWindow.desde, christmasWindow.hasta))
  if (!firstInChristmas) return null
  const christmas = christmasNoteKey(destData, trip, hasNight)
  if (!christmas) return null
  const texts = destData.destination_config?.nota_temporada ?? {}
  const promises = hasNight ? ['noche'] : []
  return { season: 'navidad', title: `Navidad en ${destino}`, icon: 'navidad', text: String(texts[christmas.key]).replaceAll('{destino}', destino), promises }
}
