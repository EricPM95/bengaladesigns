/**
 * «Crear mi propio día» (Tanda 6g): el viajero elige sitios en EXPLORAR y la app monta con ellos el día. Se hace un día escrito más, al vuelo, con la misma forma que los de
 * `listas.json` (franjas, paradas, comida y cena), y el motor de listas lo trata como a cualquier otro: nada cerrado, por dentro una sola vez en el viaje, sin repetir restaurantes.
 *
 *   · El ORDEN es el de «Reorganizar este día» (Tanda 6y, reorganizarDia.js): un solo sitio en el código para ordenar. Cada sitio va con su grupo de nuestros días escritos, en el orden de
 *     ese día; lo de primera hora sin gente, al principio; el paseo de Trastevere, al final de la tarde; y los grupos entre sí por cercanía, sin zigzag.
 *   · La mañana es lo que queda antes de la comida (donde la pone ese orden) y el resto es la tarde.
 *   · (V38) SIN comida ni cena: quedaban feas y el viajero no las ha pedido; si las quiere, las añade él desde EXPLORAR. (La comida sigue contando para partir la mañana de la tarde.) Los días curados no cambian.
 *   · Sin nocturna (si el viajero la quiere, la añade él).
 *
 * Puro: recibe los datos del destino y sus días escritos, y devuelve el día.
 */
import { reorganizarDia } from './reorganizarDia.js'


const coordsOf = (place) => (Array.isArray(place.entrada) && place.type === 'interior' ? place.entrada : place.coordinates) ?? null
const asPair = (c) => (Array.isArray(c) ? c : c && Number.isFinite(c.lat) ? [c.lat, c.lng] : null)

/**
 * @param {object} args  destData, written (los días escritos del destino: { days }), placeNames (los sitios que ha elegido el viajero), insideMinutes (`minutos_por_dentro` del destino), id (el del día escrito),
 *                       name (cómo se llama el día), overrides ({ sitio: { modo, min } }: lo que el motor hizo de verdad con cada sitio en una primera vuelta —un sitio ya visto por dentro en el viaje
 *                       pasa a verse por fuera—, para repartir bien la mañana y la tarde)
 * @returns {{ id:string, dia:object, sitios:string[] }} el día en el formato de `listas.json` y los sitios que se han podido usar (los que no están en los datos del destino se dejan fuera)
 */
export function diaPropio({ destData, written, placeNames, insideMinutes = {}, id = 'DX', name = 'Tu día', overrides = {} }) {
  const byName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const places = [...new Set(placeNames)].map((n) => byName.get(n)).filter((place) => place && asPair(coordsOf(place)))
  // El orden y dónde cae la comida: los mismos de «Reorganizar este día».
  const orden = reorganizarDia({ stops: places.map((place) => ({ id: place.name, name: place.name, coordinates: asPair(coordsOf(place)) })), written, destData, hasLunch: true, hasDinner: true })
  const ordered = orden.order.map((n) => byName.get(n))
  const stopOf = (place) => {
    const inside = place.type === 'interior'
    const min = inside ? insideMinutes[place.name] ?? place.duration_minutes ?? 60 : place.minutos_fuera ?? Math.min(place.duration_minutes ?? 15, 20)
    const real = overrides[place.name]
    // (V38B) Un sitio que el viaje ya lleva por dentro otro día pasa a verse por fuera; la parada dice en qué día (`fuera_ya_dentro_dia`: «Por fuera · ya lo ves por dentro el día 2»).
    return { tipo: 'parada', lugar: place.name, modo: real ? real.modo : inside ? 'dentro' : null, doc: place.name, min: real?.min ?? min, ...(real?.yaDentroDia ? { fuera_ya_dentro_dia: real.yaDentroDia } : {}) }
  }
  // La mañana llega hasta donde pone la comida ese orden; si todo cabe en la mañana (un solo sitio), no hay tarde.
  const lunchAt = orden.mealAfter.lunch ?? ordered.length - 1
  const morning = ordered.slice(0, lunchAt + 1).map(stopOf)
  const afternoon = ordered.slice(lunchAt + 1).map(stopOf)
  const dia = {
    id,
    nombre: name,
    titulo_documento: `${name} · ${id}`,
    partes: { unica: { manana: morning, comida: null, tarde: afternoon, cena: null, noche: null } },
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
