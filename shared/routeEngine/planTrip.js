/**
 * El REPARTIDOR del motor v3: qué va en cada día del viaje.
 *
 * El fallo raíz del motor anterior (diagnóstico del 2026-09-23) era que el repartidor decidía con
 * minutos supuestos —"esto cuesta su duración + 22"— y el constructor descubría después, con el
 * reloj de verdad, que no cabía, y lo tiraba en silencio. Aquí el repartidor no supone nada: cada
 * vez que quiere meter algo en un día se lo PREGUNTA al programador (`openDay().tryAdd`), que lo
 * prueba con los trayectos reales, los horarios y las comidas. Lo que el reparto da por hecho, el
 * día final lo contiene.
 *
 * Orden de colocación (decisiones del 2026-09-23):
 *   1. Esqueleto: tipo de cada día (excursión, en blanco, media jornada, revisitas).
 *   2. Imprescindibles que el reparto curado FIJA a un día (el Coliseo, el día de Roma Antigua).
 *   3. El pool, en el orden en que el viajero lo eligió: lo antes posible y cerca de lo que ya hay.
 *      Puede mover un imprescindible a otro día; nunca quitarlo del viaje.
 *   4. El resto de imprescindibles, donde quepan mejor. Un imprescindible no se cae por el ritmo:
 *      si no cabe, ese día pasa al horario normal (con aviso).
 *   5. La cuota de experiencias: al menos una cosa del tema por día, si hay algo cerca.
 *   6. Relleno hasta el objetivo de paradas del ritmo, repartido por turnos entre los días.
 *
 * "Cerca" se mide en minutos REALES andando desde las paradas que el día ya tiene (matriz de
 * tiempos), no por centros de zona: con centros, Villa Farnesina (Trastevere) contaba como vecina
 * del Centro Histórico y acababa a 27 minutos de la Fontana de Trevi.
 *
 * Función pura: mismos argumentos, mismo resultado. Cada día se genera en su propia llamada y
 * todas recalculan el viaje entero (invariante 20).
 */

import { buildUnits } from './units.js'
import { TAG_INTEREST_MAP, categoryCapFor, categoryOfTags, interestTagsFor } from './experienceTags.js'
import { MAX_REVISITS_PER_DAY, RELAXED_DAY_TARGET_STOPS, canRevisit, revisitReasonFor } from './revisits.js'
import { tripDays } from './tripSkeleton.js'
import { MODES_V3, modeV3For } from './modes.js'
import { PRIORITY, openDay } from './scheduleDay.js'

/** Hasta dónde se va andando a buscar algo para un día: más lejos ya no es "de camino". */
const NEAR_WALK_MINUTES = 20

/**
 * Pesos del relleno. Solo ordenan candidatos que YA caben. El tema pesa poco a propósito: la cuota
 * (paso 5) ya garantiza uno por día, y con 60 puntos una iglesia a 27 minutos ganaba a una plaza
 * de camino — el día 2 de Roma acababa con cuatro iglesias cruzando la ciudad. Cada minuto de
 * paseo o espera que añade el candidato resta el doble.
 */
const FILL_SCORE = { theme: 20, level1: 50, level2: 30, curatedForDay: 25, revisit: -40, perAddedMinute: 2 }

/** Relleno que añade más que esto en paseo + espera no compensa: no es "de camino", es un desvío. */
const MAX_FILL_ADDED_MINUTES = 30

/** Por encima del mínimo de paradas del ritmo solo entra lo que cae de camino. */
const CHEAP_FILL_ADDED_MINUTES = 10

/**
 * Los lugares de una unidad, listos para el programador: con la hora fija del Free Tour y la marca
 * de par inseparable leída de `groups.<id>.inseparable` del JSON del destino. Se marca en el dato,
 * no se deduce por distancia: Plaza de San Pedro y la Basílica son el mismo sitio aunque las
 * coordenadas estén a 200 m, y dos sitios a 200 m no tienen por qué serlo.
 */
export function placesForScheduler(unit, destData, freeTourTime) {
  const pairs = destData.groups?.[unit.id]?.inseparable ?? []
  const joined = (a, b) => pairs.some((pair) => pair.includes(a) && pair.includes(b))
  return unit.places.map((place, index) => {
    const next = unit.places[index + 1]
    return {
      ...place,
      ...(place.isFreeTour && freeTourTime ? { fixed_start: freeTourTime } : {}),
      ...(next && joined(place.name, next.name) ? { inseparableWithNext: true } : {}),
    }
  })
}

/** Zonas por prioridad, para los días que no tienen reparto curado (6+ días, destinos nuevos). */
function zonesByPriority(destData) {
  return Object.entries(destData?.zones ?? {})
    .map(([id, zone]) => ({ id, priority: zone.zone_priority ?? 9, center: zone.center }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'es'))
}

/**
 * @param {object} args
 * @param {object} args.destData
 * @param {number} args.totalDays          días del viaje CONTANDO la vuelta (invariante 21)
 * @param {string} args.pace               'nonstop' | 'tranquilo'
 * @param {boolean} args.hasFreeTour
 * @param {string[]} [args.poolNames]      lo que eligió el viajero, en el orden en que lo eligió
 * @param {string[]} [args.experiencesPositive]
 * @param {string|null} [args.dateRangeStartIso]
 * @param {{leg: Function}} args.travel    createTravelTimes(matriz)
 */
export function planTrip({ destData, totalDays, pace, hasFreeTour, poolNames = [], experiencesPositive = [], dateRangeStartIso = null, travel }) {
  const mode = modeV3For(pace)
  // Plan B de un imprescindible: el horario normal (el del completo, sin el extra de duración).
  const normal = { ...mode, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const fallbackMode = normal.dayStart !== mode.dayStart || normal.visitDurationBonus !== mode.visitDurationBonus ? normal : null
  const freeTourTime = destData.default_free_tour?.default_time ?? null

  const selectedThemes = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const interestTags = interestTagsFor(selectedThemes)
  const matchesTheme = (unit) => unit.tags.some((tag) => interestTags.has(tag))

  // ── Unidades, con su prioridad ────────────────────────────────────────────────────────────
  const poolIndexOf = (unit) => {
    const indices = unit.places.map((place) => poolNames.indexOf(place.name)).filter((index) => index >= 0)
    return indices.length > 0 ? Math.min(...indices) : null
  }
  const units = buildUnits(destData, hasFreeTour)
    .map((unit) => {
      const poolIndex = poolIndexOf(unit)
      const priority =
        poolIndex !== null || unit.isFreeTour
          ? PRIORITY.POOL
          : unit.level === 1
            ? unit.places.some((place) => place.tier === 'joya')
              ? PRIORITY.JOYA
              : PRIORITY.ESSENTIAL
            : matchesTheme(unit)
              ? PRIORITY.THEME
              : PRIORITY.FILLER
      return {
        ...unit,
        places: placesForScheduler(unit, destData, freeTourTime),
        priority,
        poolIndex,
        isLong: !unit.isFreeTour && unit.minutes >= mode.longVisitMinutes,
      }
    })

  // ── Paso 1: esqueleto ──────────────────────────────────────────────────────────────────────
  const skeleton = tripDays({ destData, totalDays, hasFreeTour, dateRangeStartIso })
  const zones = zonesByPriority(destData)
  const cityDays = []
  let nextZone = 0
  let nextRepetitionZone = 0
  for (const day of skeleton) {
    if (day.isBlank || day.isExcursion) continue
    const curatedNames = [...(day.curated?.morning?.places ?? []), ...(day.curated?.afternoon?.places ?? [])]
    // Semilla geográfica de un día sin curado: la siguiente zona por prioridad. Un día de revisitas
    // vuelve a las tres mejores en vez de bajar hacia la periferia (Prompt 9, Parte 13).
    const seedZone = day.curated?.morning?.zone ?? (day.allowsRepetition ? zones[nextRepetitionZone++ % Math.min(3, zones.length)] : zones[nextZone++ % zones.length])?.id
    const seedCenter = destData.zones?.[seedZone]?.center ?? null
    cityDays.push({
      ...day,
      curatedNames,
      seedCoords: Array.isArray(seedCenter) ? seedCenter : null,
      revisits: 0,
      open: openDay({
        mode,
        travel,
        start: { minutes: day.halfDayExcursion ? mode.halfDayRouteStart : mode.dayStart, coordinates: null },
        pendingMeals: { lunch: !day.halfDayExcursion, dinner: true },
        longVisitsAnytime: skeleton.filter((d) => !d.isBlank && !d.isExcursion).length === 1,
      }),
    })
  }

  const placedDay = new Map() // unit.id -> dayNumber
  const revisited = new Set()

  // ── Utilidades ─────────────────────────────────────────────────────────────────────────────
  const dayUnits = (day) => day.open.units()
  const stopCount = (day) => dayUnits(day).reduce((sum, unit) => sum + unit.places.length, 0)
  const curatedIndexIn = (day, unit) => {
    const index = unit.places.map((place) => day.curatedNames.indexOf(place.name)).filter((i) => i >= 0)
    return index.length > 0 ? Math.min(...index) : null
  }

  /** Minutos andando desde lo más cercano que el día ya tiene (o su zona semilla si está vacío). */
  function walkFromDay(day, unit) {
    const anchors = dayUnits(day).flatMap((u) => u.places.map((p) => p.coordinates))
    if (anchors.length === 0 && day.seedCoords) anchors.push(day.seedCoords)
    if (anchors.length === 0) return 0
    let best = Infinity
    for (const anchor of anchors) {
      for (const place of unit.places) best = Math.min(best, travel.leg(anchor, place.coordinates)?.minutes ?? Infinity)
    }
    return best
  }

  /** ¿Puede ir este día, antes de preguntar al programador? Cierres, visita larga, tope de tema. */
  function eligible(day, unit) {
    if (unit.closedOn.length > 0 && day.weekday && unit.closedOn.includes(day.weekday)) return false
    if (unit.isLong && cityDays.length > 1 && dayUnits(day).some((u) => u.isLong)) return false
    if (unit.priority > PRIORITY.ESSENTIAL) {
      const category = categoryOfTags(unit.tags)
      const cap = categoryCapFor(destData, category, selectedThemes)
      const sameCategory = dayUnits(day).filter((u) => u.priority > PRIORITY.ESSENTIAL && categoryOfTags(u.tags) === category).length
      if (category && sameCategory >= cap) return false
    }
    return true
  }

  /** Mete la unidad en el día si el programador dice que cabe (con plan B si es imprescindible). */
  function placeOnDay(day, unit) {
    if (!eligible(day, unit)) return false
    const withIndex = { ...unit, curatedIndex: curatedIndexIn(day, unit) }
    if (day.open.add(withIndex) || (unit.priority <= PRIORITY.ESSENTIAL && day.open.tryWithFallback(withIndex, fallbackMode))) {
      placedDay.set(unit.id, day.dayNumber)
      return true
    }
    return false
  }

  /** Días donde probar una unidad: primero los que la tienen cerca, y de esos el más temprano. */
  function daysByProximity(unit, { earliestFirst = false } = {}) {
    return cityDays
      .map((day) => ({ day, walk: walkFromDay(day, unit) }))
      .sort((a, b) =>
        earliestFirst
          ? Number(a.walk > NEAR_WALK_MINUTES) - Number(b.walk > NEAR_WALK_MINUTES) || a.day.dayNumber - b.day.dayNumber
          : a.walk - b.walk || a.day.dayNumber - b.day.dayNumber,
      )
      .map((item) => item.day)
  }

  const unplacedPool = []
  const unplacedEssentials = []
  // Días que se quedan sin su tema, y por qué. Nunca en silencio (ver paso 5).
  const quotaMisses = []

  // ── Paso 2: imprescindibles fijados por el reparto curado ─────────────────────────────────
  for (const day of cityDays) {
    const anchors = units
      .filter((unit) => !placedDay.has(unit.id) && (unit.level === 1 || unit.isFreeTour) && curatedIndexIn(day, unit) !== null)
      .sort((a, b) => curatedIndexIn(day, a) - curatedIndexIn(day, b))
    for (const unit of anchors) placeOnDay(day, unit) // si no cabe aquí, el paso 4 le busca otro día
  }

  // ── Paso 3: el pool, en el orden en que se eligió ─────────────────────────────────────────
  for (const unit of units.filter((u) => u.poolIndex !== null).sort((a, b) => a.poolIndex - b.poolIndex)) {
    if (placedDay.has(unit.id)) continue // ya estaba como imprescindible fijado: ahí se queda
    const candidates = daysByProximity(unit, { earliestFirst: true })
    if (candidates.some((day) => placeOnDay(day, unit))) continue

    // No cabe en ningún día tal cual: se le hace sitio moviendo un imprescindible a OTRO día.
    let placed = false
    for (const day of candidates) {
      if (placed || !eligible(day, unit)) continue
      // Se mueve antes un imprescindible que una joya; y de igual escalón, lo más largo.
      const movable = dayUnits(day)
        .filter((u) => u.priority > PRIORITY.POOL && u.priority <= PRIORITY.ESSENTIAL)
        .sort((a, b) => b.priority - a.priority || b.minutes - a.minutes || a.id.localeCompare(b.id, 'es'))
      for (const victim of movable) {
        const before = day.open.snapshot()
        day.open.remove(victim.id)
        placedDay.delete(victim.id)
        if (placeOnDay(day, unit)) {
          const elsewhere = daysByProximity(victim).filter((other) => other !== day)
          if (elsewhere.some((other) => placeOnDay(other, victim))) {
            placed = true
            break
          }
        }
        // Se deshace tal cual estaba: un imprescindible no puede perderse por un intento fallido.
        day.open.restore(before)
        placedDay.delete(unit.id)
        placedDay.set(victim.id, day.dayNumber)
      }
    }
    if (!placed) {
      const closedEveryDay = cityDays.every((day) => day.weekday && unit.closedOn.includes(day.weekday))
      unplacedPool.push({ unitId: unit.id, name: unit.places[0].name, reason: closedEveryDay ? 'closed_every_day' : unit.isLong ? 'no_room_long_visit' : 'no_room', closedOn: unit.closedOn })
    }
  }

  // ── Paso 4: el resto de imprescindibles ───────────────────────────────────────────────────
  // Primero las joyas, luego los imprescindibles: si no cabe todo, lo que se queda fuera es de abajo.
  const pendingLevel1 = units.filter((u) => u.priority > PRIORITY.POOL && u.priority <= PRIORITY.ESSENTIAL && !placedDay.has(u.id))
  for (const unit of pendingLevel1.sort((a, b) => a.priority - b.priority || b.minutes - a.minutes || a.id.localeCompare(b.id, 'es'))) {
    if (!daysByProximity(unit).some((day) => placeOnDay(day, unit))) {
      unplacedEssentials.push({ unitId: unit.id, name: unit.places[0].name, reason: 'no_room' })
    }
  }

  // ── Paso 5: cuota de experiencias — al menos una del tema por día, si hay algo cerca ─────
  /** Intenta dejar el día con algo del tema. null si lo lleva; si no, el motivo. */
  function fulfilQuota(day, theme) {
    const tags = new Set(TAG_INTEREST_MAP[theme])
    const ofTheme = (unit) => unit.tags.some((tag) => tags.has(tag))
    if (dayUnits(day).some(ofTheme)) return null
    const candidates = units
      .filter((unit) => !placedDay.has(unit.id) && ofTheme(unit))
      .map((unit) => ({ unit, walk: walkFromDay(day, unit) }))
      // Nunca cruzar la ciudad para cumplir la cuota: si no hay nada cerca, el día se queda sin.
      .filter((item) => item.walk <= NEAR_WALK_MINUTES)
      .sort((a, b) => a.unit.level - b.unit.level || a.walk - b.walk || a.unit.id.localeCompare(b.unit.id, 'es'))
    // La cuota SÍ puede usar nivel 3 en tranquilo: es lo que el viajero pidió, no relleno genérico
    // (casi todo "Naturaleza y vistas" de Roma son fuentes de nivel 3).
    if (candidates.some((item) => placeOnDay(day, item.unit))) return null
    return candidates.length === 0 ? 'none_near' : 'no_room'
  }
  for (const theme of selectedThemes) {
    for (const day of cityDays) {
      const reason = fulfilQuota(day, theme)
      if (reason) quotaMisses.push({ dayNumber: day.dayNumber, theme, reason })
    }
  }

  // ── Paso 6: relleno, por turnos entre días ─────────────────────────────────────────────────
  // Por turnos y no día a día: llenando el día 1 del todo primero, se quedaba con lo mejor de la
  // zona que comparte con el día 3.
  // El objetivo es el MÍNIMO del ritmo (8 completo, 5 tranquilo); hasta el máximo solo se sube con
  // paradas que caen de camino. Rellenar hasta 10 a cualquier precio es el "relleno obsesivo" que
  // se quería quitar.
  const minTargetOf = (day) => (day.allowsRepetition ? RELAXED_DAY_TARGET_STOPS : mode.targetStops[0])
  const maxTargetOf = (day) => (day.allowsRepetition ? RELAXED_DAY_TARGET_STOPS : mode.targetStops[1])
  let progress = true
  while (progress) {
    progress = false
    for (const day of cityDays) {
      if (stopCount(day) >= maxTargetOf(day)) continue
      const aboveMinimum = stopCount(day) >= minTargetOf(day)
      const fresh = units.filter((unit) => !placedDay.has(unit.id))
      // Revisitas: solo en días de repetición, de algo visto en un día ANTERIOR, una vez por viaje.
      const revisits = day.allowsRepetition && day.revisits < MAX_REVISITS_PER_DAY
        ? units
            .filter((unit) => placedDay.has(unit.id) && placedDay.get(unit.id) < day.dayNumber && !revisited.has(unit.id) && canRevisit(unit))
            .map((unit) => ({ ...unit, id: `${unit.id} (revisita)`, originalId: unit.id, isRevisit: true, revisitReason: revisitReasonFor(unit), priority: PRIORITY.FILLER }))
        : []

      let best = null
      for (const unit of [...fresh, ...revisits]) {
        // En tranquilo el nivel 3 no entra como relleno: 5-7 paradas gastadas en tercera fila es lo
        // que hace que un día tranquilo se sienta vacío en vez de tranquilo.
        if (unit.priority > PRIORITY.ESSENTIAL && !mode.fillLevels.includes(unit.level)) continue
        if (walkFromDay(day, unit) > NEAR_WALK_MINUTES || !eligible(day, unit)) continue
        const attempt = day.open.tryAdd({ ...unit, curatedIndex: curatedIndexIn(day, unit) })
        if (!attempt) continue
        if (attempt.addedCost > (aboveMinimum ? CHEAP_FILL_ADDED_MINUTES : MAX_FILL_ADDED_MINUTES)) continue
        const score =
          (matchesTheme(unit) ? FILL_SCORE.theme : 0) +
          (unit.level === 1 ? FILL_SCORE.level1 : unit.level === 2 ? FILL_SCORE.level2 : 0) +
          (curatedIndexIn(day, unit) !== null ? FILL_SCORE.curatedForDay : 0) +
          (unit.isRevisit ? FILL_SCORE.revisit : 0) -
          attempt.addedCost * FILL_SCORE.perAddedMinute
        if (!best || score > best.score || (score === best.score && unit.id.localeCompare(best.unit.id, 'es') < 0)) best = { unit, attempt, score }
      }
      if (!best) continue
      day.open.add(best.attempt)
      if (best.unit.isRevisit) {
        revisited.add(best.unit.originalId)
        day.revisits++
      } else {
        placedDay.set(best.unit.id, day.dayNumber)
      }
      progress = true
    }
  }

  // Segundo repaso de la cuota con los días ya completos: en el paso 5 el día solo tenía sus
  // imprescindibles, y "no hay nada del tema cerca" era verdad entonces pero puede dejar de serlo
  // cuando el relleno lo acerca a otra zona.
  for (const miss of [...quotaMisses]) {
    const reason = fulfilQuota(cityDays.find((day) => day.dayNumber === miss.dayNumber), miss.theme)
    if (reason) miss.reason = reason
    else quotaMisses.splice(quotaMisses.indexOf(miss), 1)
  }

  // ── Resultado ─────────────────────────────────────────────────────────────────────────────
  const finished = new Map(cityDays.map((day) => [day.dayNumber, { units: dayUnits(day), schedule: day.open.finish() }]))
  return {
    mode,
    days: skeleton.map((day) => ({ ...day, ...(finished.get(day.dayNumber) ?? { units: [], schedule: null }) })),
    placedDay,
    unplacedPool,
    unplacedEssentials,
    quotaMisses,
  }
}
