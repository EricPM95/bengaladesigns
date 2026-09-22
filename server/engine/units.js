/**
 * Paso 0 del motor nuevo: convertir el catálogo de lugares en UNIDADES.
 *
 * El motor no reparte lugares, reparte unidades indivisibles. Un `group` del JSON (Coliseo + Foro +
 * Arco de Constantino) es una sola unidad con su orden interno; todo lo demás es una unidad de uno.
 *
 * Esto no es una optimización, es lo que hace que tres reglas se cumplan SIN escribirlas:
 *   - Coliseo y Foro no pueden acabar en días distintos, porque son el mismo objeto.
 *   - El orden dentro de un grupo no puede alterarse, porque nadie lo ve por separado.
 *   - "Una visita larga por día" se mide por unidad. Los 285 minutos del Vaticano son UNA visita
 *     larga, no tres cosas de menos de 90 que caben sueltas.
 *
 * Ver docs/PREPLAN_MOTOR.md y docs/INVARIANTES_MOTOR.md (invariantes 14 y 15).
 */

/** Por encima de esto una visita ocupa media jornada y no puede compartir día con otra igual. */
const LONG_VISIT_MINUTES = 90

/**
 * @typedef {object} Unit
 * @property {string} id            Nombre del grupo, o el del lugar si va solo.
 * @property {object[]} places      Los lugares que la componen, ya en `group_order`.
 * @property {string} zone
 * @property {number} minutes       Suma de duraciones (sin el extra del ritmo, que es del modo).
 * @property {number} level         El más bajo de sus miembros: un grupo con un nivel 1 dentro es
 *                                  tan imprescindible como ese nivel 1.
 * @property {string[]} closedOn    Unión de los cierres semanales de sus miembros.
 * @property {boolean} isLong
 * @property {boolean} isFreeTour
 * @property {{lat:number,lng:number}} coords
 * @property {string[]} tags
 * @property {boolean} requiresTicket
 * @property {string|null} bestTime
 * @property {string|null} containedIn  Lugar que la CONTIENE, si lo hay (ver abajo).
 */

/**
 * Cierres semanales de un lugar, normalizados a minúsculas.
 *
 * En roma.json `closed_on` es un ARRAY (`["lunes"]`), pero se acepta también la forma de cadena
 * separada por comas: al escribir esto solo se contempló la cadena y la regla se quedó silenciosa
 * — cero lugares cerrados, ningún error, los Museos Vaticanos programados un domingo. Un filtro que
 * no encuentra nada se parece demasiado a un filtro que funciona (invariante 3).
 */
function closedDaysOf(place) {
  const raw = place.closed_on
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : []
  return list.map((day) => String(day).trim().toLowerCase()).filter(Boolean)
}

/**
 * Si hay que pagar para entrar. MISMA regla que el filtro "Entradas" de la UI y que el pipeline
 * viejo: lo que se visita por dentro cobra, salvo que el JSON lo desmienta a mano (una iglesia, un
 * mercado). Es deducido y no un campo porque solo 4 de los 67 lugares de Roma lo traen escrito
 * (invariante 24).
 */
function requiresTicket(place) {
  return !(place.is_free_access ?? place.type === 'exterior')
}

function unitFromPlaces(id, places) {
  const first = places[0]
  const minutes = places.reduce((sum, place) => sum + (Number.isFinite(place.duration_minutes) ? place.duration_minutes : 30), 0)
  return {
    id,
    places,
    zone: first.zone ?? null,
    minutes,
    // Una unidad larga ocupa media jornada y no comparte día con otra igual. Se mide sobre la
    // unidad ENTERA: los 285 minutos del Vaticano son una visita larga, no tres cosas sueltas.
    isLong: minutes > LONG_VISIT_MINUTES,
    level: Math.min(...places.map((place) => (Number.isFinite(place.level) ? place.level : 3))),
    closedOn: [...new Set(places.flatMap(closedDaysOf))],
    isFreeTour: false,
    coords: { lat: first.coordinates?.[0], lng: first.coordinates?.[1] },
    tags: [...new Set(places.flatMap((place) => place.tags ?? []))],
    requiresTicket: places.some(requiresTicket),
    bestTime: places.map((place) => place.best_time).find(Boolean) ?? null,
    // `contained_in` NO fusiona unidades: la Galería Borghese y el Bioparque están los dos dentro
    // del Parque de Villa Borghese, y fusionarlos daría una unidad de 330 minutos que obliga a ver
    // el zoo y la galería el mismo día. Significa "si los dos entran, van seguidos y en la misma
    // franja" — no se visita el parque a las 10:00 y la galería que está dentro a las 17:00.
    containedIn: places.length === 1 ? (first.contained_in ?? null) : null,
  }
}

/**
 * El Free Tour es una unidad especial: no sale de `places` (no es un lugar, es un recorrido a pie
 * por varios puntos) y **no cuenta como visita larga** aunque dure 150 minutos — puede convivir con
 * el Vaticano el mismo día (invariante 15).
 */
function freeTourUnit(destData) {
  const tour = destData?.default_free_tour
  if (!tour) return null
  return {
    id: tour.name,
    places: [tour],
    zone: tour.zone ?? null,
    minutes: tour.duration_minutes ?? 150,
    level: 1,
    closedOn: [],
    isFreeTour: true,
    isLong: false,
    coords: { lat: tour.coordinates?.[0], lng: tour.coordinates?.[1] },
    tags: [],
    requiresTicket: false,
    bestTime: tour.default_time ?? null,
    containedIn: null,
  }
}

/**
 * Catálogo entero del destino como unidades, en orden determinista (invariante 20: cada llamada
 * recalcula esto y tiene que salirle exactamente lo mismo).
 *
 * @param {object} destData
 * @param {boolean} hasFreeTour
 * @returns {Unit[]}
 */
export function buildUnits(destData, hasFreeTour = false) {
  const places = destData?.places ?? []
  const byGroup = new Map()
  const singles = []

  for (const place of places) {
    if (typeof place?.name !== 'string' || !place.name.trim()) continue
    if (place.group) {
      if (!byGroup.has(place.group)) byGroup.set(place.group, [])
      byGroup.get(place.group).push(place)
    } else {
      singles.push(place)
    }
  }

  const units = []
  for (const [group, members] of byGroup) {
    members.sort((a, b) => (a.group_order ?? 0) - (b.group_order ?? 0) || a.name.localeCompare(b.name, 'es'))
    units.push(unitFromPlaces(group, members))
  }
  for (const place of singles) units.push(unitFromPlaces(place.name, [place]))

  // Orden estable por nombre: el reparto recorre esta lista y dos llamadas distintas tienen que
  // recorrerla igual, pase lo que pase con el orden del JSON.
  units.sort((a, b) => a.id.localeCompare(b.id, 'es'))

  if (hasFreeTour) {
    const tour = freeTourUnit(destData)
    if (tour) units.unshift(tour)
  }
  return units
}

/** Índice nombre-de-lugar -> unidad que lo contiene, para resolver pool y `contained_in`. */
export function indexUnitsByPlaceName(units) {
  const index = new Map()
  for (const unit of units) for (const place of unit.places) index.set(place.name, unit)
  return index
}

export { LONG_VISIT_MINUTES }
