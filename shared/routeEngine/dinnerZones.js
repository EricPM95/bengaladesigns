/**
 * Barrios de cena, calculados de los restaurantes curados del destino (decisión del 2026-09-23).
 *
 * Nada de listas a mano: una zona es barrio de cena si tiene MIN_DINNER_RESTAURANTS o más
 * restaurantes curados que sirven cenas (`meal` "cena" o "ambos"). La zona es la que el propio
 * restaurante dice (`zone` del JSON), por su parte PRINCIPAL: "Monti / Fori Imperiali" y "Monti" son
 * Monti; "Tridente / Spagna", Tridente. El punto de la cena es el centro de esos restaurantes y el
 * nombre que se enseña, la etiqueta completa más repetida. Sirve igual para cualquier destino.
 *
 * Módulo puro (lo usan el motor, el servidor y los scripts).
 */

import { straightLineMeters } from './travelTimes.js'
import { closedOnDay } from './openingHours.js'

export const MIN_DINNER_RESTAURANTS = 3

/** "Tridente / Spagna" -> "tridente_spagna": sin tildes ni símbolos, estable entre llamadas. */
export function zoneIdOf(label) {
  return String(label)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/** "Monti / Fori Imperiali" -> "Monti": la zona principal de la etiqueta de un restaurante. */
export function mainZoneOf(label) {
  return String(label).split('/')[0].trim()
}

/**
 * Los barrios a los que pertenece un restaurante: su parte principal y, de las demás partes de la
 * etiqueta, las que son barrio por sí mismas en el destino (la parte principal de algún restaurante).
 * "Trastevere / Testaccio" cuenta para Trastevere y para Testaccio (que existe: "Testaccio" a secas);
 * "Tridente / Spagna" solo para Tridente (nadie dice "Spagna" delante). Así el barrio de un bloque
 * ("cena en Testaccio") y el de los restaurantes usan el mismo nombre (Mañanas y tardes, ajustes A.3).
 */
export function zonesOfLabel(label, mains) {
  const parts = String(label).split('/').map((part) => part.trim()).filter(Boolean)
  return [...new Set([parts[0], ...parts.slice(1).filter((part) => mains.has(part))])].filter(Boolean)
}

/** Las partes principales de todas las etiquetas de restaurantes del destino. */
export function mainZonesOf(destData) {
  return new Set((destData?.restaurants ?? []).filter((r) => r.zone).map((r) => mainZoneOf(r.zone)))
}

const normText = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Los barrios de restaurantes que nombra el texto `comida` o `cena` de un bloque ("Trastevere (se
 * baja del Janículo…)", "Vaticano / Borgo o Prati"). Para la cena, solo barrios de cena (3+ que den
 * cenas); para la comida, cualquier barrio con un restaurante que dé comidas. Vacío si no nombra
 * ninguno: `validar.mjs` lo avisa y el motor usa el más cercano.
 * @param {'comida'|'cena'} meal
 */
export function restaurantZonesNamedIn(text, destData, meal) {
  const t = normText(text)
  if (!t) return []
  const matches = (name) => {
    const n = normText(name)
    return n.length > 0 && new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(t)
  }
  if (meal === 'cena') return dinnerZones(destData).filter((zone) => matches(zone.label) || matches(zone.id.replace(/_/g, ' ')) || matches(mainZoneOf(zone.label)))
  const mains = mainZonesOf(destData)
  const names = new Set((destData?.restaurants ?? []).filter((r) => servesLunch(r) && r.zone).flatMap((r) => zonesOfLabel(r.zone, mains)))
  return [...names].filter(matches)
}

/** ¿Sirve cenas? `meal` del JSON: "comida" | "cena" | "ambos". */
export function servesDinner(restaurant) {
  return restaurant?.meal === 'cena' || restaurant?.meal === 'ambos'
}

/** ¿Sirve comidas? */
export function servesLunch(restaurant) {
  return restaurant?.meal === 'comida' || restaurant?.meal === 'ambos'
}

/** [lat, lng] de un restaurante (en el JSON van como {lat, lng}). */
export function restaurantCoordinates(restaurant) {
  const c = restaurant?.coordinates
  if (Array.isArray(c)) return c
  return Number.isFinite(c?.lat) && Number.isFinite(c?.lng) ? [c.lat, c.lng] : null
}

/**
 * Los barrios de cena del destino, en orden estable.
 * @returns {{ id: string, label: string, display: string, coordinates: [number, number],
 *             restaurants: string[], placeZone: string|null }[]}
 *   `placeZone`: la zona de lugares del destino más cercana (para el paseo nocturno).
 */
export function dinnerZones(destData) {
  const byLabel = new Map()
  const mains = mainZonesOf(destData)
  for (const restaurant of destData?.restaurants ?? []) {
    const coordinates = restaurantCoordinates(restaurant)
    if (!servesDinner(restaurant) || !restaurant.zone || !coordinates) continue
    for (const zone of zonesOfLabel(restaurant.zone, mains)) {
      if (!byLabel.has(zone)) byLabel.set(zone, [])
      // El nombre que se enseña sale de las etiquetas que empiezan por el barrio ("Vaticano / Borgo"),
      // no de las que lo llevan detrás ("Prati / Vaticano" es Prati).
      byLabel.get(zone).push({ name: restaurant.name, coordinates, label: mainZoneOf(restaurant.zone) === zone ? restaurant.zone : zone })
    }
  }
  const zones = Object.entries(destData?.zones ?? {}).filter(([, zone]) => Array.isArray(zone.center))
  return [...byLabel.entries()]
    .filter(([, list]) => list.length >= MIN_DINNER_RESTAURANTS)
    .map(([main, list]) => {
      // El nombre que se enseña: la etiqueta completa más repetida ("Tridente / Spagna").
      const labels = list.map((r) => r.label)
      const label = labels.sort((a, b) => labels.filter((l) => l === b).length - labels.filter((l) => l === a).length || a.localeCompare(b, 'es'))[0] ?? main
      const coordinates = [average(list.map((r) => r.coordinates[0])), average(list.map((r) => r.coordinates[1]))]
      const nearest = zones.map(([id, zone]) => ({ id, meters: straightLineMeters(coordinates, zone.center) })).sort((a, b) => a.meters - b.meters)[0]
      return {
        id: zoneIdOf(main),
        label,
        display: `en ${label.replace(/\s*\/\s*/g, ' y ')}`,
        coordinates,
        restaurants: list.map((r) => r.name),
        placeZone: nearest?.id ?? null,
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'es'))
}

function average(values) {
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10000) / 10000
}

/**
 * ¿Está abierto a esa hora (minutos desde las 0:00)? Del texto `hours` solo se leen los tramos «HH:MM-HH:MM» (la unión de todos, sin mirar el día de la
 * semana: el día lo dice `closed_on`); si el texto no trae tramos, se da por abierto. Un cierre de madrugada (hasta 01:00, o 00:00) cuenta hasta las 24+.
 * Hay que llegar con al menos 15 min antes del cierre.
 */
export function restaurantOpenAt(restaurant, minutes) {
  const text = String(restaurant?.hours ?? '')
  // (Un horario con «desde», «hasta», «~» o «según el día» no se entiende como tramos: se da por abierto.)
  if (/desde|hasta|~|según|sin confirmar/i.test(text)) return true
  const ranges = [...text.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)].map((m) => {
    const open = Number(m[1]) * 60 + Number(m[2])
    let close = Number(m[3]) * 60 + Number(m[4])
    if (close <= open) close += 24 * 60
    return { open, close }
  })
  if (ranges.length === 0) return true
  return ranges.some((range) => minutes >= range.open && minutes <= range.close - 15)
}

/**
 * El restaurante recomendado de una comida o una cena (decisión del usuario, 2026-09-28: cada comida y cada cena lleva
 * un restaurante curado nuestro, que el viajero puede cambiar). De `names` (los de su barrio) o, sin ellos, de todos los
 * que dan esa comida: el que abre ese día (`closed_on` / `closed_dates`) y queda más cerca de `near`. Si los de su barrio
 * cierran todos ese día, uno de la misma zona que abra. null si no hay ninguno.
 * @param {{ names?: string[]|null, meal: 'comida'|'cena', near: [number, number]|null, weekday?: string|null, dateIso?: string|null }} options
 * @returns {{ name: string, coordinates: [number, number], zone: string|null } | null}
 */
export function recommendedRestaurant(destData, { names = null, meal, near, weekday = null, dateIso = null, exclude = null, at = null }) {
  const serves = meal === 'cena' ? servesDinner : servesLunch
  const all = (destData?.restaurants ?? []).filter((restaurant) => serves(restaurant) && restaurantCoordinates(restaurant))
  // (`exclude`: los que ya salen en el viaje; solo si no queda otro, se repite. `at`: la hora (minutos) a la que se llega a la mesa: tiene que estar abierto a esa hora.)
  const open = (restaurant) => !closedOnDay(restaurant, weekday, dateIso) && !exclude?.has(restaurant.name) && (at == null || restaurantOpenAt(restaurant, at))
  const wanted = names?.length ? all.filter((restaurant) => names.includes(restaurant.name)) : all
  const mains = new Set(wanted.map((restaurant) => mainZoneOf(restaurant.zone ?? '')))
  const sameZone = all.filter((restaurant) => mains.has(mainZoneOf(restaurant.zone ?? '')))
  const pool = [wanted.filter(open), sameZone.filter(open)].find((list) => list.length > 0) ?? []
  if (pool.length === 0) return null
  const distance = (restaurant) => (near ? straightLineMeters(near, restaurantCoordinates(restaurant)) : 0)
  const best = [...pool].sort((a, b) => distance(a) - distance(b) || a.name.localeCompare(b.name, 'es'))[0]
  return { name: best.name, coordinates: restaurantCoordinates(best), zone: best.zone ?? null }
}
