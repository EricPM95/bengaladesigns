/**
 * Pasos 2-5 del motor nuevo: repartir el viaje ENTERO antes de construir ningún día.
 *
 * Por qué existe este archivo (invariante 20): `generate-day-block` construye UN día por llamada y
 * no recuerda nada entre llamadas. Pero casi toda decisión interesante es del viaje entero — en qué
 * día cae el Vaticano, dónde va la Galería Borghese que el viajero eligió, qué no se repite. La
 * salida no es guardar estado, es que este reparto sea una FUNCIÓN PURA que cada llamada recalcula
 * completa y de la que solo usa su día. Sin I/O, sin azar, sin `Date.now()`.
 *
 * Si dos llamadas calculasen cosas distintas saldrían duplicados y huecos: así es como "Plaza
 * Colonna" acabó dos veces en el mismo viaje.
 *
 * Ver docs/PREPLAN_MOTOR.md para el diseño completo.
 */

import { buildUnits, indexUnitsByPlaceName } from './units.js'
import { AVG_ROUNDING_LOSS_MINUTES, AVG_TRAVEL_MINUTES, modeConfigFor, slotBudgets } from './modeConfig.js'

// ── Prioridades de la cascada ───────────────────────────────────────────────────────────────
//
// El orden lo es todo, y es el arreglo del bug más grave que tenía el motor viejo: los
// imprescindibles llenaban el día PRIMERO, así que elegir "Arte y museos" o marcar la Galería
// Borghese en el pool no cambiaba nada. Medido: elegir museos en un viaje de 3 días no metía ni un
// museo. Ahora lo que el viajero eligió se coloca antes que nada y el resto se acomoda alrededor.

export const TIER = {
  POOL: 0, // lo eligió a mano: va sí o sí
  EXPERIENCE: 1, // encaja con una categoría que marcó
  ESSENTIAL: 2, // nivel 1 del destino ("si no lo ves, la ruta ha fallado")
  FILLER_2: 3,
  FILLER_3: 4,
}

/** Experiencia del cuestionario -> tags del JSON que la representan. */
const TAG_INTEREST_MAP = {
  sabores_locales: ['gastronomia', 'mercado'],
  arte_museos: ['museo', 'arte'],
  miradores_atardeceres: ['mirador'],
}

const SLOTS = ['morning', 'afternoon']

// ── Geografía ───────────────────────────────────────────────────────────────────────────────

/** Metros entre dos puntos (equirectangular: a escala de ciudad el error es despreciable). */
export function metersBetween(a, b) {
  if (!Number.isFinite(a?.lat) || !Number.isFinite(b?.lat)) return Infinity
  const toRad = Math.PI / 180
  const x = (b.lng - a.lng) * toRad * Math.cos(((a.lat + b.lat) / 2) * toRad)
  const y = (b.lat - a.lat) * toRad
  return Math.sqrt(x * x + y * y) * 6371000
}

/** Dos zonas son vecinas si sus centros están a menos de esto: se puede encadenar a pie. */
const ADJACENT_ZONE_METERS = 1500

function zoneCenter(destData, zone) {
  const center = destData?.zones?.[zone]?.center
  return Array.isArray(center) ? { lat: center[0], lng: center[1] } : null
}

function zonesAreAdjacent(destData, a, b) {
  if (!a || !b) return false
  if (a === b) return true
  const ca = zoneCenter(destData, a)
  const cb = zoneCenter(destData, b)
  if (!ca || !cb) return false
  return metersBetween(ca, cb) <= ADJACENT_ZONE_METERS
}

// ── Paso 2: esqueleto de días ───────────────────────────────────────────────────────────────

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Qué día de la semana es el día N del viaje. Null si el viajero no fijó fechas. */
function weekdayForDay(dateRangeStartIso, dayNumber) {
  if (!dateRangeStartIso) return null
  const start = new Date(`${dateRangeStartIso}T12:00:00`)
  if (Number.isNaN(start.getTime())) return null
  start.setDate(start.getDate() + (dayNumber - 1))
  return WEEKDAYS[start.getDay()]
}

/**
 * Zonas por defecto de cada franja, en este orden de mando (invariante 7):
 *   1. el reparto curado de esa duración, si existe — es conocimiento real de cómo se visita
 *   2. `zone_priority`, para lo que no tiene curado (días 6-7, destinos nuevos)
 * El pool puede cambiarlas después: la zona de una franja se recalcula con lo que acabe dentro.
 */
function defaultZonesFor(destData, totalDays, hasFreeTour, dayNumber) {
  const variant = destData?.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  const franja = variant?.franjas?.find((f) => f.day === dayNumber)
  if (franja) {
    return {
      morning: franja.morning?.zone ?? null,
      afternoon: franja.afternoon?.zone ?? franja.morning?.zone ?? null,
      curated: franja,
    }
  }
  // Sin curado: las zonas por prioridad, repartidas de dos en dos por día.
  const ordered = Object.entries(destData?.zones ?? {})
    .map(([id, zone]) => ({ id, priority: zone.zone_priority ?? 9 }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'es'))
  const index = (dayNumber - 1) % Math.max(1, ordered.length)
  return { morning: ordered[index]?.id ?? null, afternoon: ordered[index]?.id ?? null, curated: null }
}

function buildDaySkeleton(destData, totalDays, hasFreeTour, pace, dateRangeStartIso) {
  const mode = modeConfigFor(pace)
  const budgets = slotBudgets(mode)
  const config = destData?.destination_config ?? {}
  const coreDays = config.core_days ?? totalDays
  const maxAutoDays = config.max_auto_days ?? totalDays
  // El último día es la vuelta y no lleva ruta (invariante 21).
  const contentDays = Math.max(1, totalDays - 1)

  const days = []
  for (let dayNumber = 1; dayNumber <= contentDays; dayNumber++) {
    const zones = defaultZonesFor(destData, totalDays, hasFreeTour, dayNumber)
    days.push({
      dayNumber,
      weekday: weekdayForDay(dateRangeStartIso, dayNumber),
      // Pasado el contenido nuevo del destino, repetir deja de ser un defecto: a Roma le quedan 10
      // lugares en 5 zonas fuera del curado, así que los días 5+ se montan con revisitas.
      allowsRepetition: dayNumber > coreDays,
      isBlank: dayNumber > maxAutoDays,
      curated: zones.curated,
      slots: {
        morning: { zone: zones.morning, units: [], budget: budgets.morning, used: 0 },
        afternoon: { zone: zones.afternoon, units: [], budget: budgets.afternoon, used: 0 },
      },
      hasLongVisit: false,
    })
  }
  return { mode, days }
}

// ── Paso 3: la cascada ──────────────────────────────────────────────────────────────────────

/** A qué prioridad pertenece cada unidad, ya resuelto el pool y las experiencias. */
function assignTiers(units, poolNames, experiencesPositive, essentialsOn) {
  const interestTags = new Set((experiencesPositive ?? []).flatMap((id) => TAG_INTEREST_MAP[id] ?? []))
  const pool = new Set(poolNames ?? [])
  const tiers = new Map()

  for (const unit of units) {
    const inPool = unit.places.some((place) => pool.has(place.name))
    if (inPool) {
      tiers.set(unit.id, TIER.POOL)
      continue
    }
    // El Free Tour se comporta como una elección explícita: si el viajero lo marcó, va.
    if (unit.isFreeTour) {
      tiers.set(unit.id, TIER.POOL)
      continue
    }
    if (interestTags.size > 0 && unit.tags.some((tag) => interestTags.has(tag))) {
      tiers.set(unit.id, TIER.EXPERIENCE)
      continue
    }
    if (unit.level === 1) {
      // "Imprescindibles" apagado: los nivel 1 dejan de entrar solos y bajan a relleno. Para quien
      // repite destino y ya vio el Coliseo (invariante 11).
      tiers.set(unit.id, essentialsOn ? TIER.ESSENTIAL : TIER.FILLER_2)
      continue
    }
    tiers.set(unit.id, unit.level === 2 ? TIER.FILLER_2 : TIER.FILLER_3)
  }
  return tiers
}

function unitFitsDay(unit, day, mode) {
  if (day.isBlank) return false
  if (unit.closedOn.length > 0 && day.weekday && unit.closedOn.includes(day.weekday)) return false
  return true
}

/**
 * Lo que cuesta meter una unidad en una franja CONCRETA.
 *
 * El trayecto y la pérdida por redondeo solo existen ENTRE paradas: la primera de la mañana no
 * viene de ninguna parte. Cobrárselos a todas hacía que `vaticano_core` (285 min) costara 307
 * contra un presupuesto de 300 y **no cupiera en ninguna parte**: un viaje de 3 días a Roma se
 * quedaba sin Vaticano. Visto en el primer trazado del motor nuevo.
 */
function slotCost(unit, slot, mode) {
  const bonus = unit.isFreeTour ? 0 : mode.visitDurationBonus * unit.places.length
  const overhead = slot.units.length > 0 ? AVG_TRAVEL_MINUTES + AVG_ROUNDING_LOSS_MINUTES : 0
  return unit.minutes + bonus + overhead
}

/** Puntuación de meter `unit` en una franja concreta. Más alto, mejor. */
function scoreSlot(destData, unit, day, slotName, mode, tier, totalContentDays) {
  const slot = day.slots[slotName]
  let score = 0

  if (slot.zone && unit.zone === slot.zone) score += 1000
  else if (zonesAreAdjacent(destData, slot.zone, unit.zone)) score += 200
  else if (slot.units.length === 0) score += 100 // franja aún sin dueño: puede adoptar esta zona

  // El pool va lo antes posible en el viaje: es lo que el viajero eligió y quiere verlo pronto,
  // no el penúltimo día (invariante 7).
  if (tier === TIER.POOL) score -= 150 * (day.dayNumber - 1)

  // Las visitas largas van por la mañana: con 285 minutos por delante, empezarlas después de comer
  // es no terminarlas.
  if (unit.isLong) score += slotName === 'morning' ? 300 : -300

  // best_time como BONUS de desempate, nunca como requisito (solo lo llevan 3 lugares de 67, y
  // ningún mirador — por eso dejó de tener sentido como restricción).
  if (unit.bestTime) {
    const wantsEarly = /primera hora|mañana|08:|09:/i.test(unit.bestTime)
    if (wantsEarly && slotName === 'morning') score += 50
  }

  const remaining = slot.budget - slot.used
  const cost = slotCost(unit, slot, mode)
  if (cost > remaining) score -= 300 + (cost - remaining)

  // Reparto: a igualdad de todo, el día más vacío. Evita que el día 1 se quede con todo y el 4 con
  // tres paradas, que es lo que hacía el motor viejo antes de sus parches.
  score -= slot.units.length * 10
  void totalContentDays
  return score
}

/**
 * Coloca una unidad en el mejor sitio posible. Devuelve el día donde cayó, o null.
 *
 * `evictions` recoge lo que haya que recolocar: cuando una unidad del pool no cabe en su mejor
 * franja, se expulsa lo de prioridad estrictamente menor hasta hacerle sitio (invariante 8). Lo
 * expulsado vuelve a la cola — y un nivel 1 desalojado se MUEVE de día, nunca se borra del viaje
 * (invariante 10).
 */
function placeUnit(destData, unit, plan, tiers, mode, evicted) {
  const tier = tiers.get(unit.id)
  // TODOS los candidatos ordenados de mejor a peor, no solo el mejor. Quedarse con el primero y
  // rendirse si no cabe tenía una consecuencia concreta: el Vaticano (285 min) ganaba la mañana por
  // puntuación y la mañana de ritmo tranquilo solo tiene 180 minutos, así que se caía del viaje en
  // vez de irse a la tarde, donde cabía de sobra.
  const candidates = []

  for (const day of plan.days) {
    if (!unitFitsDay(unit, day, mode)) continue
    // Una visita larga por día, salvo que solo haya un día de contenido: ahí el viajero eligió
    // meterlo todo y se respeta (Prompt 9, Parte 10).
    if (unit.isLong && day.hasLongVisit && plan.days.length > 1) continue
    for (const slotName of SLOTS) {
      // La geografía no es una preferencia que se pueda comprar con puntos: una franja ya asentada
      // en una zona NO acepta nada de una zona que no sea la suya o vecina. Sin este corte, el
      // relleno se dispersaba por toda la ciudad — el día 1 "de Roma Antigua" acababa conteniendo
      // la Galería Borghese y San Juan de Letrán, a 4 km.
      //
      // Con una excepción, y es la regla que manda sobre todo lo demás: lo que el viajero eligió a
      // mano NO se queda fuera por geografía. El Mercado de Testaccio elegido en el pool se caía del
      // viaje porque las dos franjas del único día ya se habían asentado lejos.
      const slot = day.slots[slotName]
      if (tier !== TIER.POOL && slot.zone && slot.units.length > 0 && !zonesAreAdjacent(destData, slot.zone, unit.zone)) continue
      const score = scoreSlot(destData, unit, day, slotName, mode, tier, plan.days.length)
      candidates.push({ day, slotName, score })
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.day.dayNumber - b.day.dayNumber || a.slotName.localeCompare(b.slotName))

  for (const candidate of candidates) {
    const placedDay = tryPlaceIn(unit, candidate, plan, tiers, mode, evicted, tier)
    if (placedDay) return placedDay
  }
  return null
}

/** Intenta meter la unidad en ESTE candidato. Devuelve el día si entra, null si no. */
function tryPlaceIn(unit, best, plan, tiers, mode, evicted, tier) {
  const slot = best.day.slots[best.slotName]
  const cost = slotCost(unit, slot, mode)

  if (slot.used + cost > slot.budget) {
    if (tier !== TIER.POOL) return null
    // Desalojo: solo para el pool, y solo contra prioridades estrictamente menores.
    const removable = slot.units
      .filter((other) => tiers.get(other.id) > tier && !evicted.has(other.id))
      .sort((a, b) => tiers.get(b.id) - tiers.get(a.id) || b.minutes - a.minutes)
    let freed = 0
    const kicked = []
    for (const other of removable) {
      if (slot.used - freed + cost <= slot.budget) break
      freed += slotCost(other, slot, mode)
      kicked.push(other)
    }
    if (slot.used - freed + cost > slot.budget) return null
    for (const other of kicked) {
      slot.units = slot.units.filter((u) => u.id !== other.id)
      slot.used -= slotCost(other, slot, mode)
      // Marcada para no volver a desalojarla: así no hay bucles de expulsiones cruzadas.
      evicted.add(other.id)
      if (other.isLong) best.day.hasLongVisit = slot.units.some((u) => u.isLong)
    }
  }

  slot.units.push(unit)
  slot.used += cost
  if (unit.isLong) best.day.hasLongVisit = true
  // La franja ADOPTA la zona de lo primero que cae dentro. Y si lo primero es una elección del
  // pool, se queda con su zona aunque el reparto curado dijera otra: así es como elegir la Galería
  // Borghese sube Villa Borghese al día 1 (invariante 7). Sin esto el día decía "Roma Antigua" y
  // empezaba a cuatro kilómetros de Roma Antigua.
  if (!slot.zone || (slot.units.length === 1 && tier === TIER.POOL)) slot.zone = unit.zone
  return best.day
}

/**
 * Reparto completo del viaje. Función pura: mismos argumentos, mismo resultado, siempre.
 *
 * @returns {{mode:object, days:object[], placed:Map<string,number>, unplaced:object[]}}
 */
export function preplanTrip({
  destData,
  totalDays,
  pace,
  hasFreeTour = false,
  poolNames = [],
  experiencesPositive = [],
  essentialsOn = true,
  dateRangeStartIso = null,
}) {
  const units = buildUnits(destData, hasFreeTour)
  const tiers = assignTiers(units, poolNames, experiencesPositive, essentialsOn)
  const plan = buildDaySkeleton(destData, totalDays, hasFreeTour, pace, dateRangeStartIso)

  // Orden determinista: primero por prioridad, luego lo más imprescindible, luego lo más largo (lo
  // grande necesita el hueco grande y hay que colocarlo antes), y el nombre para desempatar.
  const queue = [...units].sort(
    (a, b) =>
      tiers.get(a.id) - tiers.get(b.id) ||
      a.level - b.level ||
      b.minutes - a.minutes ||
      a.id.localeCompare(b.id, 'es'),
  )

  const evicted = new Set()
  const placed = new Map()
  const unplaced = []

  for (const unit of queue) {
    // En tranquilo el nivel 3 no entra: 5-7 paradas gastadas en relleno de tercer nivel es lo que
    // hace que un día tranquilo se sienta vacío en vez de tranquilo.
    if (tiers.get(unit.id) === TIER.FILLER_3 && !plan.mode.fillLevels.includes(3)) continue
    const day = placeUnit(destData, unit, plan, tiers, plan.mode, evicted)
    if (day) placed.set(unit.id, day.dayNumber)
    else unplaced.push(unit)
  }

  // Segunda pasada: lo que fue desalojado por el pool tiene que volver a entrar en algún sitio. Un
  // nivel 1 nunca se cae del viaje, solo cambia de día (invariante 10).
  for (const unit of queue) {
    if (placed.has(unit.id)) continue
    if (!evicted.has(unit.id)) continue
    const day = placeUnit(destData, unit, plan, tiers, plan.mode, new Set())
    if (day) {
      placed.set(unit.id, day.dayNumber)
      const index = unplaced.findIndex((u) => u.id === unit.id)
      if (index >= 0) unplaced.splice(index, 1)
    }
  }

  return { ...plan, tiers, placed, unplaced, units }
}
