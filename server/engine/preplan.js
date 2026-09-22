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
import { AVG_ROUNDING_LOSS_MINUTES, AVG_TRAVEL_MINUTES, halfDaySlotBudgets, modeConfigFor, slotBudgets } from './modeConfig.js'
import { categoryCapFor, categoryOfTags, interestTagsFor } from './experienceTags.js'
import { halfDayExcursions } from './excursions.js'
import { planRevisits } from './revisits.js'

// ── Prioridades de la cascada ───────────────────────────────────────────────────────────────
//
// El orden lo es todo, y es el arreglo del bug más grave que tenía el motor viejo: los
// imprescindibles llenaban el día PRIMERO, así que elegir "Arte y museos" o marcar la Galería
// Borghese en el pool no cambiaba nada. Medido: elegir museos en un viaje de 3 días no metía ni un
// museo. Ahora lo que el viajero eligió se coloca antes que nada y el resto se acomoda alrededor.

export const TIER = {
  POOL: 0, // lo eligió a mano: va sí o sí
  ESSENTIAL: 1, // nivel 1 del destino ("si no lo ves, la ruta ha fallado"): entra SIEMPRE
  FILLER_2: 2,
  FILLER_3: 3,
}

const SLOTS = ['morning', 'afternoon']

/**
 * Cuántas unidades de RELLENO de esa categoría hay ya ese día, contando las dos franjas.
 *
 * Los imprescindibles no cuentan para el tope. Si el nivel 1 entra al margen de lo que el viajero
 * elija (ver assignTiers), tampoco puede gastarle su cupo temático: con el tope en 2 y el Vaticano
 * y los Capitolinos dentro, elegir "Arte y Museos" no podía añadir un solo museo — solo cambiaba
 * cuáles, y la elección del viajero no se notaba en la ruta.
 */
function categoryCountInDay(day, category, tiers) {
  if (!category) return 0
  return SLOTS.reduce(
    (count, slotName) =>
      count +
      day.slots[slotName].units.filter(
        (unit) => categoryOfTags(unit.tags) === category && tiers.get(unit.id) > TIER.ESSENTIAL,
      ).length,
    0,
  )
}

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

export function zonesAreAdjacent(destData, a, b) {
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
/**
 * Cuánto material del tema elegido tiene cada zona, en nivel 2-3. Es el bonus de zona: si "Arte y
 * Museos" está marcado, las zonas con más museos e iglesias se adelantan en el reparto por días.
 *
 * Solo cuenta nivel 2-3: el nivel 1 entra siempre y en todas partes, así que contarlo no distingue
 * una zona de otra.
 */
function themeCountByZone(destData, interestTags) {
  const counts = new Map()
  if (interestTags.size === 0) return counts
  for (const place of destData?.places ?? []) {
    if ((place.level ?? 3) === 1) continue
    if (!(place.tags ?? []).some((tag) => interestTags.has(tag))) continue
    counts.set(place.zone, (counts.get(place.zone) ?? 0) + 1)
  }
  return counts
}

/** Cuánto puede adelantar el tema a una zona. Tope bajo a propósito: que una zona con museos suba
    un puesto está bien; que mande al viajero al otro lado de la ciudad, no. */
const MAX_THEME_ZONE_BONUS = 1.5
const THEME_ZONE_BONUS_PER_PLACE = 0.4

function defaultZonesFor(destData, totalDays, hasFreeTour, dayNumber, themeCounts = new Map(), repetitionDay = false) {
  const variant = destData?.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  const franja = variant?.franjas?.find((f) => f.day === dayNumber)
  if (franja) {
    return {
      morning: franja.morning?.zone ?? null,
      afternoon: franja.afternoon?.zone ?? franja.morning?.zone ?? null,
      curated: franja,
    }
  }
  // Sin curado (días 6-7, destinos nuevos): las zonas por prioridad, con el tema elegido
  // adelantando a las que tienen más material suyo. Aquí SÍ hay una decisión de zona que sesgar —
  // en los viajes con reparto curado no la hay, porque las zonas vienen escritas a mano.
  const ordered = Object.entries(destData?.zones ?? {})
    .map(([id, zone]) => {
      const base = zone.zone_priority ?? 9
      const bonus = Math.min((themeCounts.get(id) ?? 0) * THEME_ZONE_BONUS_PER_PLACE, MAX_THEME_ZONE_BONUS)
      return { id, priority: base - bonus }
    })
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'es'))
  // Un día de repetición VUELVE a las zonas buenas en vez de seguir bajando por la lista hacia la
  // periferia. Es lo que pide la Parte 13 del Prompt 9 —"pasar la mañana entera en Trastevere en
  // vez de cruzarlo en una hora"— y sin esto las revisitas no existían: los días tardíos caían en
  // Esquilino o la Via Appia, donde no hay nada que revisitar porque su poco contenido ya se está
  // usando como parada nueva.
  const pool = repetitionDay ? ordered.slice(0, Math.max(1, Math.min(3, ordered.length))) : ordered
  const index = (dayNumber - 1) % Math.max(1, pool.length)
  return { morning: pool[index]?.id ?? null, afternoon: pool[index]?.id ?? null, curated: null }
}

function buildDaySkeleton(destData, totalDays, hasFreeTour, pace, dateRangeStartIso, themeCounts = new Map()) {
  const mode = modeConfigFor(pace)
  const budgets = slotBudgets(mode)
  const config = destData?.destination_config ?? {}
  const coreDays = config.core_days ?? totalDays
  const maxAutoDays = config.max_auto_days ?? totalDays
  // El último día es la vuelta y no lleva ruta (invariante 21).
  const contentDays = Math.max(1, totalDays - 1)

  // Unidad -> franja en la que quedó. Lo necesitan las revisitas, que van a la OTRA franja.
  const placedSlot = new Map()
  // Dónde cae la excursión de día completo: SIEMPRE en el día `core_days` del destino, y el core
  // day que desplaza pasa al siguiente. Es universal y escala con cada destino — Roma (core 4) la
  // pone el día 4, Lisboa (core 3) el día 3.
  //
  // Se mide en días de CONTENIDO, no en días de viaje: el último día del viaje es la vuelta y no
  // lleva ruta (invariante 21), así que un viaje de 5 días tiene 4 de contenido y la excursión cae
  // en el último de ellos. Un viaje que no llega a `core_days` de contenido no lleva excursión:
  // con tres días en Roma nadie se va a Pompeya.
  const excursionDay = contentDays >= coreDays ? coreDays : null

  // Las de MEDIO DÍA van en los días de revisitas y en ningún otro: son la mañana de un día en el
  // que ya no queda ciudad nueva que enseñar, no una alternativa a un día de ruta. Una por día y sin
  // repetir en el viaje — se reparten en orden editorial y cuando se acaban, se acabaron. Roma tiene
  // dos (Ostia y Tívoli), así que un viaje de 8 días cubre sus dos días de revisitas y uno de 9 ya
  // no: el tercer día de revisitas se queda como estaba, con la mañana en la ciudad.
  const mediaJornada = halfDayExcursions(destData)
  const halfDayBudgets = halfDaySlotBudgets(mode)
  let siguienteMediaJornada = 0

  const days = []
  for (let dayNumber = 1; dayNumber <= contentDays; dayNumber++) {
    // El día siguiente a la excursión es el core day desplazado: ruta nueva, no revisitas. La
    // repetición empieza un día después.
    const esRepeticion = dayNumber > coreDays + (excursionDay ? 1 : 0)
    const esExcursion = dayNumber === excursionDay
    const esBlanco = dayNumber > maxAutoDays
    // Un día en blanco no recibe excursión: está en blanco porque a partir de ahí manda el viajero,
    // y colocarle una propuesta encima es lo contrario de dejárselo en blanco.
    const mediaJornadaDelDia =
      esRepeticion && !esBlanco && siguienteMediaJornada < mediaJornada.length ? mediaJornada[siguienteMediaJornada++] : null
    const zones = defaultZonesFor(destData, totalDays, hasFreeTour, dayNumber, themeCounts, esRepeticion)
    days.push({
      dayNumber,
      weekday: weekdayForDay(dateRangeStartIso, dayNumber),
      // Pasado el contenido nuevo del destino, repetir deja de ser un defecto: a Roma le quedan 10
      // lugares en 5 zonas fuera del curado, así que los días 5+ se montan con revisitas.
      allowsRepetition: esRepeticion,
      isBlank: esBlanco,
      curated: zones.curated,
      // La excursión de medio día de este día, si le toca una. La mañana se queda sin presupuesto
      // (el viajero está fuera) y la tarde arranca a las 16:00 en vez de a las 14:00.
      halfDayExcursion: mediaJornadaDelDia,
      // Un día de excursión no tiene paradas de ciudad: el viajero está fuera. Sus franjas se
      // quedan vacías a propósito y la cascada las salta (ver unitFitsDay).
      isExcursion: esExcursion,
      slots: {
        morning: { zone: zones.morning, units: [], budget: mediaJornadaDelDia ? halfDayBudgets.morning : budgets.morning, used: 0 },
        afternoon: { zone: zones.afternoon, units: [], budget: mediaJornadaDelDia ? halfDayBudgets.afternoon : budgets.afternoon, used: 0 },
      },
      hasLongVisit: false,
    })
  }
  return { mode, days, placedSlot }
}

// ── Paso 3: la cascada ──────────────────────────────────────────────────────────────────────

/**
 * A qué prioridad pertenece cada unidad.
 *
 * El nivel 1 entra SIEMPRE, elija el viajero las experiencias que elija. "Imprescindibles" como
 * tarjeta es una promesa de la pantalla —"te hemos preparado lo esencial"—, no un interruptor: si
 * alguien que repite destino no quiere el Coliseo, lo quita desde el menú de la parada, que ya
 * funciona. Apagarlo desde el cuestionario dejaría sin Coliseo a un viajero primerizo que solo
 * quiso marcar tres temas que le gustan.
 *
 * Lo que hacen las experiencias elegidas es SESGAR el relleno: entre dos lugares de nivel 2 o 3 que
 * compiten por el mismo hueco, gana el que encaje con lo que el viajero marcó.
 */
function assignTiers(units, poolNames) {
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
    if (unit.level === 1) {
      tiers.set(unit.id, TIER.ESSENTIAL)
      continue
    }
    tiers.set(unit.id, unit.level === 2 ? TIER.FILLER_2 : TIER.FILLER_3)
  }
  return tiers
}

function unitFitsDay(unit, day, mode) {
  if (day.isBlank || day.isExcursion) return false
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
function scoreSlot(destData, unit, day, slotName, mode, tier, totalContentDays, matchesInterest = false) {
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

  // El Free Tour va por la mañana y punto, por encima incluso de la zona (invariante 1: es la
  // PRIMERA parada de su día). Sin esto acababa en la TARDE del día 1: el tour es del centro
  // histórico y la tarde de ese día también, así que ganaba por coincidencia de zona. Un free tour
  // a las 15:00 no existe — se reservan a las 10:00 y quien llega tarde se queda fuera.
  if (unit.isFreeTour) score += slotName === 'morning' ? 2000 : -2000

  // best_time como BONUS de desempate, nunca como requisito (solo lo llevan 3 lugares de 67, y
  // ningún mirador — por eso dejó de tener sentido como restricción).
  if (unit.bestTime) {
    const wantsEarly = /primera hora|mañana|08:|09:/i.test(unit.bestTime)
    if (wantsEarly && slotName === 'morning') score += 50
  }

  const remaining = slot.budget - slot.used
  const cost = slotCost(unit, slot, mode)
  if (cost > remaining) score -= 300 + (cost - remaining)

  // El tema que el viajero eligió gana los huecos disputados. Va aquí y no solo en el orden de la
  // cola porque el orden decide a quién se coloca ANTES, no a quién se prefiere para un hueco
  // concreto: solo con el orden, elegir "Arte y Museos" metía el Circo Máximo y la Fuente de las
  // Tortugas — efectos de rebote de una colocación voraz, no preferencia.
  if (matchesInterest) score += 120

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
function placeUnit(destData, unit, plan, tiers, mode, evicted, matchesInterest = false, selectedCategories = []) {
  const tier = tiers.get(unit.id)
  const category = categoryOfTags(unit.tags)
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
      // Tope de categoría: una vez el día tiene sus dos museos, el relleno pasa a otra cosa.
      if (tier > TIER.ESSENTIAL && category && categoryCountInDay(day, category, tiers) >= categoryCapFor(destData, category, selectedCategories)) continue
      const score = scoreSlot(destData, unit, day, slotName, mode, tier, plan.days.length, matchesInterest)
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
  plan.placedSlot.set(unit.id, best.slotName)
  if (unit.isLong) best.day.hasLongVisit = true
  // La franja ADOPTA la zona de lo primero que cae dentro. Y si lo primero es una elección del
  // pool, se queda con su zona aunque el reparto curado dijera otra: así es como elegir la Galería
  // Borghese sube Villa Borghese al día 1 (invariante 7). Sin esto el día decía "Roma Antigua" y
  // empezaba a cuatro kilómetros de Roma Antigua.
  if (!slot.zone || (slot.units.length === 1 && tier === TIER.POOL)) slot.zone = unit.zone
  return best.day
}

/**
 * Hace sitio a un imprescindible que se ha quedado sin día, desplazando lo de menor prioridad que
 * baste. Devuelve el día donde acaba, o null si no hay forma.
 */
function rescueEssential(destData, unit, plan, tiers, mode, placed) {
  for (const day of plan.days) {
    if (!unitFitsDay(unit, day, mode)) continue

    // Otro imprescindible NUNCA es víctima: cambiar el Coliseo por el Vaticano no rescata nada,
    // solo mueve el agujero de sitio. Pasó tal cual en el primer intento de esta función.
    const untouchable = (other) => other.level === 1 || tiers.get(other.id) === TIER.POOL

    // Una visita larga necesita además que el día se quede SIN otra larga, o se incumpliría la
    // regla que causó el problema. Si la larga que ocupa el día es intocable, este día no sirve.
    const longsInDay = SLOTS.flatMap((slotName) => day.slots[slotName].units.filter((u) => u.isLong))
    if (unit.isLong && longsInDay.some(untouchable)) continue

    for (const slotName of SLOTS) {
      const slot = day.slots[slotName]
      const cost = slotCost(unit, slot, mode)

      if (slot.used + cost <= slot.budget && (!unit.isLong || longsInDay.length === 0)) {
        slot.units.push(unit)
        slot.used += cost
        if (unit.isLong) day.hasLongVisit = true
        return day
      }

      // Sacrificio: primero lo obligatorio (las largas del día, si entra una larga), luego lo menos
      // importante hasta que quepa. Sin lo segundo, meter 210 minutos expulsando solo una unidad de
      // 120 seguía sin caber y el rescate se iba a otro día a romperlo.
      const mandatory = unit.isLong ? slot.units.filter((u) => u.isLong && !untouchable(u)) : []
      const optional = slot.units
        .filter((u) => !untouchable(u) && !mandatory.includes(u))
        .sort((a, b) => tiers.get(b.id) - tiers.get(a.id) || a.minutes - b.minutes)

      const kicked = [...mandatory]
      let freed = kicked.reduce((sum, u) => sum + slotCost(u, slot, mode), 0)
      for (const victim of optional) {
        if (slot.used - freed + cost <= slot.budget) break
        freed += slotCost(victim, slot, mode)
        kicked.push(victim)
      }
      if (kicked.length === 0 || slot.used - freed + cost > slot.budget) continue
      // Si entra una larga, la otra franja tampoco puede tener una larga intocable.
      if (unit.isLong && longsInDay.some((u) => !kicked.includes(u))) continue

      for (const victim of kicked) {
        slot.units = slot.units.filter((u) => u.id !== victim.id)
        slot.used -= slotCost(victim, slot, mode)
        placed.delete(victim.id)
      }
      slot.units.push(unit)
      slot.used += cost
      day.hasLongVisit = SLOTS.some((s2) => day.slots[s2].units.some((u) => u.isLong))
      return day
    }
  }
  return null
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
  dateRangeStartIso = null,
}) {
  const units = buildUnits(destData, hasFreeTour)
  const tiers = assignTiers(units, poolNames)
  // Lo que le interesa a este viajero: no cambia QUÉ prioridad tiene un lugar, cambia a quién se
  // elige entre iguales cuando compiten por el mismo hueco.
  const interestTags = interestTagsFor(experiencesPositive)
  const matchesInterest = (unit) => interestTags.size > 0 && unit.tags.some((tag) => interestTags.has(tag))
  const plan = buildDaySkeleton(destData, totalDays, hasFreeTour, pace, dateRangeStartIso, themeCountByZone(destData, interestTags))

  // Orden determinista: primero por prioridad, luego lo más imprescindible, luego lo más largo (lo
  // grande necesita el hueco grande y hay que colocarlo antes), y el nombre para desempatar.
  // El relleno de nivel 2 y el de nivel 3 son UNA sola banda a la hora de ordenar. Separarlos hacía
  // que el tema elegido nunca adelantara al nivel: las dos fuentes de Roma son nivel 3, así que con
  // "Naturaleza y Vistas" marcado seguían entrando detrás de todo el nivel 2 y se quedaban fuera.
  // El nivel sigue contando, pero DESPUÉS del tema, no antes.
  const band = (unit) => Math.min(tiers.get(unit.id), TIER.FILLER_2)

  const queue = [...units].sort(
    (a, b) =>
      band(a) - band(b) ||
      // Dentro de la misma banda manda el tema que el viajero eligió: es lo que hace que "Arte
      // y Museos" llene los huecos de museos en vez de con lo primero que pase por la zona.
      Number(matchesInterest(b)) - Number(matchesInterest(a)) ||
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
    const day = placeUnit(destData, unit, plan, tiers, plan.mode, evicted, matchesInterest(unit), experiencesPositive ?? [])
    if (day) placed.set(unit.id, day.dayNumber)
    else unplaced.push(unit)
  }

  // Rescate de imprescindibles (invariante 10: NEVER_MISS_LANDMARKS).
  //
  // Aquí chocan dos reglas de verdad, y se vio en una ruta real: con "Arte y museos" elegido en un
  // viaje de 3 días, las tres jornadas se quedaban con su visita larga (Capitolinos, Vaticano,
  // Borghese, todas de la experiencia) y el Coliseo era la cuarta — se caía del viaje entero. La
  // cascada dice experiencias por encima de nivel 1; el invariante dice que un imprescindible no
  // desaparece en silencio.
  //
  // El arbitraje: las experiencias mandan en el REPARTO (se colocan antes y se quedan los mejores
  // huecos), pero no pueden dejar un nivel 1 FUERA DEL VIAJE. Si un nivel 1 se ha quedado sin sitio,
  // desplaza a la unidad de menor prioridad que le haga hueco — aunque sea de una experiencia. Lo
  // desplazado vuelve a la cola e intenta recolocarse.
  for (const unit of queue) {
    if (placed.has(unit.id) || unit.level !== 1) continue
    if (tiers.get(unit.id) > TIER.ESSENTIAL) continue // "Imprescindibles" apagado: no se rescata
    const rescued = rescueEssential(destData, unit, plan, tiers, plan.mode, placed)
    if (rescued) {
      placed.set(unit.id, rescued.dayNumber)
      const index = unplaced.findIndex((u) => u.id === unit.id)
      if (index >= 0) unplaced.splice(index, 1)
    }
  }

  // Segunda pasada: lo que fue desalojado por el pool tiene que volver a entrar en algún sitio. Un
  // nivel 1 nunca se cae del viaje, solo cambia de día (invariante 10).
  for (const unit of queue) {
    if (placed.has(unit.id)) continue
    if (!evicted.has(unit.id)) continue
    const day = placeUnit(destData, unit, plan, tiers, plan.mode, new Set(), matchesInterest(unit), experiencesPositive ?? [])
    if (day) {
      placed.set(unit.id, day.dayNumber)
      const index = unplaced.findIndex((u) => u.id === unit.id)
      if (index >= 0) unplaced.splice(index, 1)
    }
  }

  // Lo que el viajero eligió y no ha cabido, CON el motivo. Es mejor avisar que dejarlo fuera en
  // silencio: el viajero decide si mueve algo de día, alarga el viaje o cambia de ritmo — el motor
  // no decide por él. Viaja hasta la UI por el canal `not_included`, que ya existe.
  const unplacedPool = unplaced
    .filter((unit) => tiers.get(unit.id) === TIER.POOL)
    .map((unit) => {
      const cierraSiempre = plan.days.every((day) => day.weekday && unit.closedOn.includes(day.weekday))
      return {
        name: unit.places[0]?.name ?? unit.id,
        unitId: unit.id,
        minutes: unit.minutes,
        reason: cierraSiempre ? 'closed_every_day' : unit.isLong ? 'no_room_long_visit' : 'no_room',
        closedOn: unit.closedOn,
      }
    })

  // Revisitas: los días por encima de `core_days` se completan volviendo a sitios de días
  // anteriores a otra hora, en vez de rascar relleno de tercera que nadie ha pedido (ver
  // revisits.js). Va al final, cuando ya se sabe qué hay en cada día y cuánto hueco queda.
  planRevisits(
    plan,
    units,
    placed,
    plan.placedSlot,
    (unit, slot) => slotCost(unit, slot, plan.mode),
    (zoneA, zoneB) => zonesAreAdjacent(destData, zoneA, zoneB),
  )

  return { ...plan, tiers, placed, unplaced, unplacedPool, units }
}
