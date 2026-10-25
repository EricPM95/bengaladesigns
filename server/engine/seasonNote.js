/**
 * Las tarjetas especiales del principio de la ruta (Tanda 10M, 2026-10-25): una sola por viaje y un solo texto por tarjeta.
 *   - navidad:           algún día del viaje cae en la `temporada_navidad` del destino (en Roma, del 26 de noviembre al 6 de enero).
 *   - semana_santa:      algún día del viaje cae entre el Domingo de Ramos (easter-7) y el Lunes de Pascua (easter+1).
 *   - cumpleanos_ciudad: algún día del viaje es el de la fecha del destino (en Roma, el 21 de abril).
 * Si el viaje cae en dos, solo la de Semana Santa. Los textos, los títulos y los iconos viven en el destino
 * (`destination_config.nota_temporada.<clave>`); sin la clave, el destino no tiene esa tarjeta. {destino}: el del viaje.
 * No cambia cómo se reparten los días: solo es un texto.
 */

import { easterIso, withinMonthDays } from '../../shared/routeEngine/openingHours.js'

const md = (iso) => Number(iso.slice(5, 7)) * 100 + Number(iso.slice(8, 10))
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

/** ¿Cae esa fecha entre el Domingo de Ramos y el Lunes de Pascua de su año? */
export function isHolyWeek(dateIso) {
  const iso = String(dateIso).slice(0, 10)
  const easter = easterIso(Number(iso.slice(0, 4)))
  return iso >= addDays(easter, -7) && iso <= addDays(easter, 1)
}

/**
 * Las fechas del viaje: todas las que da `facts.tripDates` (incluido el día de vuelta) o, sin ellas, las de los días de ciudad.
 * @returns {string[]}
 */
function tripDatesOf(trip, facts) {
  const given = (facts?.tripDates ?? []).filter(Boolean).map((iso) => String(iso).slice(0, 10))
  if (given.length > 0) return given
  return (trip.days ?? []).map((day) => day.hours?.dateIso).filter(Boolean).map((iso) => String(iso).slice(0, 10))
}

/**
 * La tarjeta especial del viaje (null si ningún día cae en una).
 * @param {object} destData
 * @param {object} trip   la salida del planificador (`calendar`, días con `hours`)
 * @param {{ tripDates?: string[] }} [facts]
 * @returns {{ season: 'navidad'|'semana_santa'|'cumpleanos_ciudad', title: string, text: string, icon: string } | null}
 */
export function seasonNoteFor(destData, trip, facts = {}) {
  if (!trip.calendar?.hasDates) return null
  const cards = destData.destination_config?.nota_temporada ?? {}
  const destino = String(destData.destination ?? 'tu destino').split(',')[0].trim()
  const dates = tripDatesOf(trip, facts)
  if (dates.length === 0) return null
  const christmas = destData.destination_config?.temporada_navidad
  const rules = {
    semana_santa: () => dates.some(isHolyWeek),
    navidad: () => Boolean(christmas?.desde && christmas.hasta) && dates.some((iso) => withinMonthDays(md(iso), christmas.desde, christmas.hasta)),
    cumpleanos_ciudad: () => /^\d{2}-\d{2}$/.test(String(cards.cumpleanos_ciudad?.fecha ?? '')) && dates.some((iso) => iso.slice(5) === cards.cumpleanos_ciudad.fecha),
  }
  // (Semana Santa primero: si el viaje cae también en otra, gana ella.)
  for (const season of ['semana_santa', 'navidad', 'cumpleanos_ciudad']) {
    const card = cards[season]
    if (!card?.texto || !rules[season]()) continue
    const fill = (text) => String(text).replaceAll('{destino}', destino)
    return { season, title: fill(card.titulo ?? destino), text: fill(card.texto), icon: card.icono ?? season }
  }
  return null
}
