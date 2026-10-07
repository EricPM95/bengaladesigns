/**
 * «Crear mi propio día» (Tanda 6g): el viajero elige sitios en EXPLORAR y la app monta con ellos el día. Se hace un día escrito más, al vuelo, con la misma forma que los de
 * `listas.json` (franjas, paradas, comida y cena), y el motor de listas lo trata como a cualquier otro: nada cerrado, por dentro una sola vez en el viaje, sin repetir restaurantes.
 *
 *   · En orden y sin zigzag: el camino más corto entre los sitios (el mejor de probar cada punto de salida, mejorado con 2-opt).
 *   · La mañana llega hasta la hora de comer (unas 4 h de visitas, andando incluido) y el resto es la tarde.
 *   · La comida va donde acaba la mañana y la cena donde acaba la tarde: los restaurantes de verdad más cercanos (el motor se queda con el primero que no salga ya en el viaje).
 *   · Sin nocturna (si el viajero la quiere, la añade él).
 *
 * Puro: recibe los datos del destino y devuelve el día.
 */
import { straightLineMeters } from './travelTimes.js'

const METERS_PER_MIN = 80
const WALK_FACTOR = 1.3
const MORNING_MINUTES = 240
const RESTAURANT_TYPES = ['restaurante', 'pizzeria']

const coordsOf = (place) => (Array.isArray(place.entrada) && place.type === 'interior' ? place.entrada : place.coordinates) ?? null
const asPair = (c) => (Array.isArray(c) ? c : c && Number.isFinite(c.lat) ? [c.lat, c.lng] : null)
const walkMin = (a, b) => (a && b ? Math.round((straightLineMeters(a, b) * WALK_FACTOR) / METERS_PER_MIN) : 10)

/** El camino más corto que pasa por todos los puntos (no vuelve al principio): lo mejor de salir de cada uno, con 2-opt. Devuelve los índices en orden. */
export function shortestPath(points) {
  const n = points.length
  if (n <= 2) return points.map((_, i) => i)
  const dist = (i, j) => (points[i] && points[j] ? straightLineMeters(points[i], points[j]) : 0)
  const length = (path) => path.slice(1).reduce((sum, at, i) => sum + dist(path[i], at), 0)
  let best = null
  for (let start = 0; start < n; start++) {
    const path = [start]
    const left = new Set(points.map((_, i) => i).filter((i) => i !== start))
    while (left.size > 0) {
      const last = path.at(-1)
      let next = null
      for (const candidate of left) if (next == null || dist(last, candidate) < dist(last, next)) next = candidate
      path.push(next)
      left.delete(next)
    }
    let improved = true
    while (improved) {
      improved = false
      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          const candidate = [...path.slice(0, i), ...path.slice(i, j + 1).reverse(), ...path.slice(j + 1)]
          if (length(candidate) + 1 < length(path)) { path.splice(0, n, ...candidate); improved = true }
        }
      }
    }
    if (!best || length(path) < length(best)) best = [...path]
  }
  return best
}

/** Los tres restaurantes de verdad más cercanos a un punto (el primero es el que va; los otros, sus alternativas). */
function nearestRestaurants(destData, from, exclude = new Set()) {
  return (destData.restaurants ?? [])
    .filter((restaurant) => RESTAURANT_TYPES.includes(restaurant.tipo_local) && !exclude.has(restaurant.name))
    .map((restaurant) => ({ name: restaurant.name, meters: from && asPair(restaurant.coordinates) ? straightLineMeters(from, asPair(restaurant.coordinates)) : Infinity }))
    .sort((a, b) => a.meters - b.meters || a.name.localeCompare(b.name, 'es'))
    .slice(0, 3)
    .map((restaurant) => restaurant.name)
}

/**
 * @param {object} args  destData, placeNames (los sitios que ha elegido el viajero), insideMinutes (`minutos_por_dentro` del destino), id (el del día escrito), name (cómo se llama el día),
 *                       overrides ({ sitio: { modo, min } }: lo que el motor hizo de verdad con cada sitio en una primera vuelta —un sitio ya visto por dentro en el viaje pasa a verse por fuera—,
 *                       para repartir bien la mañana y la tarde)
 * @returns {{ id:string, dia:object, sitios:string[] }} el día en el formato de `listas.json` y los sitios que se han podido usar (los que no están en los datos del destino se dejan fuera)
 */
export function diaPropio({ destData, placeNames, insideMinutes = {}, id = 'DX', name = 'Tu día', overrides = {} }) {
  const byName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const places = [...new Set(placeNames)].map((n) => byName.get(n)).filter((place) => place && asPair(coordsOf(place)))
  const points = places.map((place) => asPair(coordsOf(place)))
  const ordered = shortestPath(points).map((i) => places[i])
  const stopOf = (place) => {
    const inside = place.type === 'interior'
    const min = inside ? insideMinutes[place.name] ?? place.duration_minutes ?? 60 : place.minutos_fuera ?? Math.min(place.duration_minutes ?? 15, 20)
    const real = overrides[place.name]
    return { tipo: 'parada', lugar: place.name, modo: real ? real.modo : inside ? 'dentro' : null, doc: place.name, min: real?.min ?? min }
  }
  // La mañana: hasta que las visitas (con lo andado entre ellas) llegan a unas 4 h; lo que queda es la tarde (si todo cabe en la mañana, no hay tarde).
  const morning = []
  let used = 0
  for (const place of ordered) {
    const stop = stopOf(place)
    const walk = morning.length > 0 ? walkMin(asPair(coordsOf(byName.get(morning.at(-1).lugar))), asPair(coordsOf(place))) : 0
    if (morning.length > 0 && used + walk + stop.min > MORNING_MINUTES) break
    morning.push(stop)
    used += walk + stop.min
  }
  const afternoon = ordered.slice(morning.length).map(stopOf)
  const lastOf = (list) => (list.length > 0 ? asPair(coordsOf(byName.get(list.at(-1).lugar))) : null)
  const lunch = nearestRestaurants(destData, lastOf(morning))
  const lunchSet = new Set(lunch.slice(0, 1))
  const dinner = afternoon.length > 0 ? nearestRestaurants(destData, lastOf(afternoon), lunchSet) : []
  const meal = (names) => ({ restaurante: names[0] ?? null, alternativa: names[1] ?? null, tercera: names[2] ?? null, zona: null, doc: names.join(' · ') })
  const dia = {
    id,
    nombre: name,
    titulo_documento: `${name} · ${id}`,
    partes: { unica: { manana: morning, comida: lunch.length > 0 ? meal(lunch) : null, tarde: afternoon, cena: dinner.length > 0 ? meal(dinner) : null, noche: null } },
    lluvia: null,
    quedarme: null,
    fechas_malas: {},
    variantes: [],
    pool: {},
    experiencias: {},
    propio: true,
  }
  return { id, dia, sitios: ordered.map((place) => place.name) }
}
