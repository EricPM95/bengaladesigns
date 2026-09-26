/**
 * Mañanas y tardes tipo (PROMPT_MANANAS_Y_TARDES.md, Parte B, 2026-09-25): rutas que haría un local.
 *
 * El destino se cura en bloques de medio día (`morning_flows`, `afternoon_flows`), como los haría alguien
 * que vive en la ciudad. El motor ELIGE una mañana y una tarde para cada día, las ORDENA y CALCULA horas,
 * cierres, atardecer, comida y cena; solo improvisa un medio día si ningún bloque encaja ("medio día sin
 * tipo", que el semáforo marca en amarillo).
 *
 * Cómo:
 *   1. Cada día es una mañana tipo + una tarde tipo (los días de excursión o en blanco, como siempre; el
 *      de excursión de medio día, solo tarde).
 *   2. Mañanas por `prioridad`, respetando pool, experiencias, cierres de ese día, `minimo_dias_viaje` y
 *      lo que excluyen. El Free Tour es una mañana más (y sustituye a la mañana que recorre lo mismo).
 *   3. Tardes: la que mejor encaja con dónde acaba la mañana (`encaja_despues_de`), con las experiencias
 *      (más coincidencias, mejor) y con el pool; sin repetir ni lo que otro bloque excluye. Una tarde
 *      cuya ancla es la de una mañana (el Vaticano por la tarde) solo si esa mañana no está en el viaje.
 *   4. Dentro del bloque: el orden; el `ancla` tiene que caber (si no, otro bloque); `solo_con`, solo con
 *      esa experiencia o el pool; lo cerrado se salta o se ve de paso; `de_paso` sale como "Pasas por…";
 *      `atardecer` a su hora; cena en el barrio de `cena` de la tarde; nocturnas de su lista.
 *   5. Las reglas de un local (localRules.js): una visita grande al día, museos de pago según los días,
 *      museos parecidos.
 *
 * Devuelve lo mismo que planTrip (días con unidades y horas) para que el servidor no cambie.
 * Módulo puro.
 */

import { buildUnits } from './units.js'
import { placesForScheduler } from './planTrip.js'
import { PRIORITY, scheduleFixedOrder } from './scheduleDay.js'
import { dinnerZones, restaurantZonesNamedIn } from './dinnerZones.js'
import { LATE_DINNER_START, LATE_SUNSET_MINUTES, MODES_V3, modeV3For } from './modes.js'
import { tripCalendar } from './tripCalendar.js'
import { closedOnDay, effectiveSchedule, parseHoursSessions } from './openingHours.js'
import { sunsetFor } from './sunset.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'
import { lunchSpots } from './lunchSpots.js'
import { tripDays } from './tripSkeleton.js'
import { availableForTrip } from './availability.js'
import { blockedByRedundancy, breaksOneBigVisit, isPaidMuseum, paidMuseumQuota } from './localRules.js'

/** Lo que dura pasar por un sitio "de paso". */
const PASS_THROUGH_MINUTES = 10
/** Prioridad para caerse si algo no cabe: cuanto más alta, antes se cae. */
/** Lo mejor primero: una joya tiene que salir como muy tarde este día (y nunca solo el último). */
const EARLY_JOYA_LAST_DAY = 3
/** Lo que pesa, al elegir la tarde, traer una joya que si no saldría tarde. */
const EARLY_JOYA_BONUS = 60
/** Lo que tiene que quedarle a la mañana de la que una tarde adelanta una joya (sus paradas propias). */
const EARLY_JOYA_MORNING_LEFT = 3
/** Lo que cuesta en un viaje cada joya que sale tarde, con un tope: siempre menos que algo del pool fuera (80)
    o un día muerto (100). */
const LATE_JOYA_COST = 40
const LATE_JOYA_CAP = 70
/** Empezar antes para no perder un nivel 1: se prueba de media en media hora, lo justo. */
const WAKE_EARLY_STEP = 30
/** Un mirador "al atardecer" que llega más tarde que esto después de la puesta de sol ya es de noche. */
const MIRADOR_LATE_MINUTES = 30
const DROP_RANK = { ancla: 1, joya: 1, pool: 2, parada: 3, atardecer: 3, de_paso: 5, extra: 4 }
/** Tranquilo: el nivel 3 antes que el nivel 2, y los dos antes que lo de paso (los rellenos, antes que todo). */
const DROP_RANK_BY_LEVEL = { 3: 7, 2: 6, de_paso: 5.5, extra: 8 }
/** Un medio día sin tipo: como mucho estas paradas improvisadas, a 15 min o menos una de otra. */
const UNTYPED_MAX_STOPS = { completo: 4, tranquilo: 3 }
const UNTYPED_MAX_WALK = 15
/** El primer salto del medio día sin tipo puede ser más largo: salir de un barrio apartado (Testaccio). */
const UNTYPED_FIRST_HOP = 30
/** Hasta cuántas paradas sueltas se prueban todos los órdenes (6! = 720). */
const UNTYPED_REORDER_MAX = 6
/** Hasta cuántos rellenos se prueban todas las posiciones a la vez en el repaso final. */
const POLISH_JOINT_MAX = 3
/** Hacer un bloque reversible en el sentido que empieza más lejos cuesta un poco. */
const ORIENTATION_FAR_PENALTY = 5
/** Cuántas veces se replanifica el viaje para quitar horas muertas. */
const REPAIR_ROUNDS = Number(process.env.REPAIR_ROUNDS ?? 4)
/** Dónde acaba el Free Tour, para las tardes (su recorrido termina en Piazza Navona). */
const FREE_TOUR_ENDS_IN = 'centro'
/** Encaje por cercanía: la tarde empieza a esto andando, como mucho, de donde acaba la mañana. */
const NEAR_START_TIERS = [20, 30]
/** La tarde que acaba antes de tiempo se alarga de camino a la cena hasta dejar esto de margen. */
const TAIL_IDLE_TARGET = 60
/** Lo que se añade al final de la tarde: a esto andando, como mucho, de la parada anterior. */
const TAIL_MAX_WALK = 15
const TAIL_MAX_NEW_WAIT = 15
const TAIL_TOTAL_DETOUR = 20
/** Un imprescindible rescatado va de camino: como mucho este desvío. */
const RESCUE_MAX_DETOUR = 15
/** Un imprescindible que se ve desde la calle, de paso: 15 min y hasta este desvío (el bloque que pase más cerca). */
const OUTSIDE_ESSENTIAL_MINUTES = 15
const OUTSIDE_ESSENTIAL_MAX_DETOUR = 25
/** "De camino" para ver algo de paso en vez de madrugar (el Altar): desvío de 10 min como mucho. */
const OUTSIDE_ON_THE_WAY_MINUTES = 10
/** El callejeo de un bloque (un barrio) se puede recortar hasta aquí para hacer sitio a un imprescindible. */
const CALLEJEO_MIN_MINUTES = 20
/** Más que esto andando entre la mañana y la tarde, el día avisa del traslado. */
const TRANSFER_NOTICE_MINUTES = 25
/** Una tarde cuya ancla va de paso (ya salió otro día) tiene que traer al menos esto de paradas nuevas. */
const ANCHOR_PASS_BY_MIN_NEW = 2
/** Se ve desde la calle: un exterior, o algo con paso por fuera o visible desde fuera. */
const fromStreet = (place) => Boolean(place) && (place.type === 'exterior' || Boolean(place.pass_by) || Boolean(place.visible_from_outside))
/** Una espera de más de esto dentro del día se rellena con algo de camino. */
const WAIT_FILL_MINUTES = 60
/** Lo que rellena una espera, a esto andando como mucho de cada extremo de la espera original. */
const WAIT_FILL_REACH = 20
/** Más que esto parado antes de cenar es una hora muerta (Parte A, regla 7). */
const DEAD_HOURS_MINUTES = 90
/** Lo que cuesta en un viaje cada día con horas muertas. */
const DEAD_DAY_COST = 100
const CURATED_AFTERNOON_OFFSET = 100
/** Más espera que esto antes del mirador del atardecer: lo que va detrás en el bloque pasa delante. */
const SUNSET_WAIT_MAX = 45
/** Adelantar una parada por delante del mirador obliga a volver: cuesta más que verla de paso bajando. */
/** Esperas antes del mirador que se reparten en lo de "antes del atardecer" (y lo que se deja de margen). */
const SUNSET_STRETCH_MIN = 20
const SUNSET_STRETCH_SLACK = 10
/** Lo que se deja de "Tiempo libre" antes del mirador cuando la espera se rellena. */
const SUNSET_FREE_TIME_MAX = 60
/** Lo que rellena la espera al atardecer, con este desvío como mucho (sin bajar y volver a subir). */
const SUNSET_FILL_MAX_DETOUR = 10
/** Una espera muerta (más de 90 min) antes del atardecer cuesta más que renunciar a él. */
const SUNSET_DEAD_WAIT_COST = 600
const SUNSET_PASS_COST = 40
/** Saltarse lo de "antes del atardecer" por falta de tiempo: cuesta, pero menos que perder paradas. */
const SUNSET_SKIP_COST = 120
/** Comida acortada para no perder un imprescindible: 60 min comiendo, 75 con el paseo. */
const SHORT_LUNCH_MINUTES = 60
/** Un imprescindible de una mañana tiene que abrir, como tarde, a esta hora para que esa mañana vaya ese día. */
const MORNING_OPENS_BY = 11 * 60
const SHORT_LUNCH_BLOCK_MINUTES = 75
/** El horario del día de un lugar (null si no tiene: se puede ver a cualquier hora). */
const effectiveScheduleOf = (place, hours) => effectiveSchedule(place, hours)
/** Motivos del programador que son de horario: esa parada, a esa hora, va de paso. */
const HOURS_DROP_REASONS = new Set(['closed', 'closes_during_visit', 'after_last_entry', 'after_latest_end'])
/** Bajar del mirador por lo que el bloque ponía antes (solo con lo de antes del atardecer saltado). */
const SUNSET_DESCENT_COST = 20
/** Recuperar al bajar lo que se saltó a la ida vale algo (por parada). */
const SUNSET_RETURN_BONUS = 40

/** ¿Meter algo en la posición `at` deja en medio de un grupo del JSON (Panteón … Navona)? */
function splitsGroup(units, at) {
  const groupAt = (index) => units.slice(0, index).flatMap((unit) => unit.places.map((place) => place.group)).filter(Boolean)
  const before = new Set(groupAt(at))
  return units.slice(at).some((unit) => unit.places.some((place) => place.group && before.has(place.group)))
}

/** La espera más larga del día entre dos paradas (o entre la comida y la siguiente), sin el paseo. */
function longestWait(result, { skipSunset = false } = {}) {
  let worst = 0
  const visits = result.visits ?? []
  for (let i = 1; i < visits.length; i++) {
    if (skipSunset && visits[i].place.sunset != null) continue
    const meal = (result.meals ?? []).find((m) => m.start >= visits[i - 1].end && m.start < visits[i].start)
    // Después de comer cuenta desde que se acaba de comer, no desde el final de la franja (que incluye el paseo).
    const from = meal ? meal.start + (meal.eatMinutes ?? meal.end - meal.start) : visits[i - 1].end
    worst = Math.max(worst, visits[i].start - from - (visits[i].walkMinutes ?? 0))
  }
  return worst
}

/**
 * Los bloques del día cuyas paradas no van en el orden del JSON (o al revés, si el bloque es reversible y
 * se ha hecho al revés). Lo que se salta no cuenta; la bajada que dice el bloque (`descentAfterSunset`),
 * tampoco.
 */
function reorderedBlocks(blocks, result) {
  const kept = new Map(result.kept.map((unit) => [unit.id, unit]))
  return blocks
    .filter((block) => {
      const order = block.paradas.map((stop) => stop.lugar)
      const indices = result.visits
        .filter((visit) => String(visit.unitId).startsWith(`${block.id}:`) && !kept.get(visit.unitId)?.descentAfterSunset)
        .map((visit) => order.indexOf(visit.place.name))
        .filter((index) => index >= 0)
      return indices.some((index, i) => i > 0 && index < indices[i - 1])
    })
    .map((block) => block.id)
}

/** Todos los órdenes de una lista corta. */
function permutations(list) {
  if (list.length <= 1) return [list]
  return list.flatMap((item, index) => permutations([...list.slice(0, index), ...list.slice(index + 1)]).map((rest) => [item, ...rest]))
}

const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * @param {object} args  como planTrip
 * @returns {object} { days, unplacedPool, unplacedEssentials, coveredByFreeTour, blockSummary, untypedHalves, ... }
 */
export function planBlockTrip(args) {
  // Se elige día a día; si un día que no es el último se queda con horas muertas (más de 90 min parado),
  // se prueba el viaje entero sin esa tarde ese día y se queda el mejor (Parte A, regla 7).
  const bans = new Set()
  let best = planBlockTripOnce(args, bans)
  // Con Free Tour y 3+ días (decisión del 2026-09-26): la tarde que encaja detrás del tour y trae una joya
  // (el Vaticano por la tarde) va el día del tour, y su mañana (la del Vaticano) sale del reparto. Se
  // queda si no se pierde nada del pool ni ningún imprescindible, y no deja un medio día sin tipo (en 3 días
  // con Free Tour no queda mañana para el día 3: el tour ya enseña el centro y las demás piden 4 días).
  if (args.hasFreeTour && best.days.length >= 3) {
    const joyas = new Set(best.joyaNames ?? [])
    const anchorOfBlock = (block) => block.paradas.find((stop) => stop.rol === 'ancla')?.lugar ?? null
    const afterTourAnchors = new Set((args.destData.afternoon_flows ?? []).filter((block) => (block.encaja_despues_de ?? []).includes('free_tour')).map(anchorOfBlock).filter((anchor) => joyas.has(anchor)))
    const tourBans = (args.destData.morning_flows ?? []).filter((block) => afterTourAnchors.has(anchorOfBlock(block))).map((block) => `todos:${block.id}`)
    if (tourBans.length > 0) {
      const trial = planBlockTripOnce(args, new Set(tourBans))
      if (trial.unplacedPool.length <= best.unplacedPool.length && trial.unplacedEssentials.length <= best.unplacedEssentials.length && trial.untypedHalves <= best.untypedHalves) {
        for (const ban of tourBans) bans.add(ban)
        best = trial
      }
    }
  }
  for (let round = 0; round < REPAIR_ROUNDS; round++) {
    const dead = [...new Set([...deadDays(best), ...shortDays(best)])]
    const wakes = wakeBans(best).filter((ban) => !bans.has(ban))
    // Lo mejor primero: sin la mañana que deja una joya para el final (el Vaticano el día 3), para que
    // esa joya pueda ir como tarde de un día temprano (el Vaticano por la tarde del día 1).
    // Se prueba la mañana en otro día y, si no, sin ella. El Free Tour solo se mueve de día: nunca se quita
    // (lo ha elegido el viajero).
    const earlier = [...new Set(lateJoyasOf(best).filter((late) => late.morningId).flatMap((late) => [`${late.dayNumber}:${late.morningId}`, ...(late.morningId === 'free_tour' ? [] : [`todos:${late.morningId}`])]))].filter((ban) => !bans.has(ban))
    if (dead.length === 0 && wakes.length === 0 && earlier.length === 0) break
    const deadNumbers = new Set(dead.map((day) => day.dayNumber))
    let improved = null
    const consider = (trial, added) => {
      if (tripCost(trial) < tripCost(improved?.trial ?? best)) improved = { trial, added }
    }
    // Un madrugón solo vale si lo que faltaba entra ese mismo día (si no, es madrugar para nada).
    const wokeFor = (trial, ban) => {
      const [, dayNumber, names] = ban.match(/^madruga:(\d+):(.*)$/) ?? []
      const day = trial.days.find((candidate) => candidate.dayNumber === Number(dayNumber))
      return (names ?? '').split('|').some((name) => (day?.schedule?.visits ?? []).some((visit) => visit.place.name === name))
    }
    for (const ban of wakes) {
      const trial = planBlockTripOnce(args, new Set([...bans, ban]))
      if (wokeFor(trial, ban)) consider(trial, [ban])
    }
    // Y sin perder la visita: todas las joyas se siguen visitando por dentro (no solo el Coliseo de paso).
    const visitedJoyas = (trip) => new Set(trip.days.flatMap((day) => (day.schedule?.visits ?? []).filter((visit) => !visit.place.passThrough).map((visit) => visit.place.name)))
    const bestVisited = visitedJoyas(best)
    for (const ban of earlier) {
      const trial = planBlockTripOnce(args, new Set([...bans, ban]))
      const trialVisited = visitedJoyas(trial)
      if ((best.joyaNames ?? []).every((name) => !bestVisited.has(name) || trialVisited.has(name))) consider(trial, [ban])
    }
    for (const day of dead) {
      for (const ban of repairBans(args, best, day)) {
        if (bans.has(ban) || (best.pinnedMornings ?? []).includes(ban) || (best.pinnedMornings ?? []).some((pin) => ban === `todos:${pin.split(':')[1]}`)) continue
        const trial = planBlockTripOnce(args, new Set([...bans, ban]))
        consider(trial, [ban])
        // Si sin ese bloque el día muerto solo se ha ido a otro día (el Borghese pasa al día 3 y allí
        // espera a que abra la Vittoria), se prueba también sin el bloque que lo deja muerto allí.
        const moved = deadDays(trial).filter((other) => !deadNumbers.has(other.dayNumber))
        if (tripCost(trial) >= tripCost(best) + DEAD_DAY_COST || moved.length === 0) continue
        for (const other of moved) {
          for (const second of repairBans(args, trial, other)) {
            if (bans.has(second) || second === ban || (best.pinnedMornings ?? []).includes(second) || (best.pinnedMornings ?? []).some((pin) => second === `todos:${pin.split(':')[1]}`)) continue
            consider(planBlockTripOnce(args, new Set([...bans, ban, second])), [ban, second])
          }
        }
      }
    }
    if (!improved) break
    for (const ban of improved.added) bans.add(ban)
    best = improved.trial
  }
  best.settleMiradores?.()
  delete best.settleMiradores
  return best
}

/**
 * Lo mejor primero (decisión del 2026-09-26): en viajes de 3+ días, las joyas que salen después del día 3
 * o solo el último día. Con el día en que salen y el bloque de mañana que las lleva allí.
 */
function lateJoyasOf(trip) {
  const last = trip.days.length
  if (last < 3 || !trip.joyaNames) return []
  const firstDay = new Map()
  for (const day of trip.days) {
    for (const visit of day.schedule?.visits ?? []) {
      for (const name of [visit.place.name, ...(visit.place.outsideOf ?? []), ...(visit.place.isFreeTour ? visit.place.covers ?? [] : [])]) if (!firstDay.has(name)) firstDay.set(name, day.dayNumber)
    }
  }
  return trip.joyaNames
    .filter((name) => firstDay.has(name) && (firstDay.get(name) > EARLY_JOYA_LAST_DAY || firstDay.get(name) === last))
    .map((name) => {
      const day = trip.days.find((candidate) => candidate.dayNumber === firstDay.get(name))
      return { name, dayNumber: day.dayNumber, morningId: day.blocks?.find((block) => block.slot === 'manana')?.id ?? null }
    })
}

/**
 * Madrugar como reparación (decisión del 2026-09-26): si un imprescindible se queda fuera de todo el
 * viaje, se prueba a madrugar cada día de ritmo tranquilo en que un nivel 1 de la mañana pasó a después de
 * comer (el Foro tras el Coliseo): ese rato de tarde es el que le faltaba (el Altar de la Patria).
 */
function wakeBans(trip) {
  // Lo que falta del todo, y lo que solo entra de paso rescatado en otro día (el Altar al final del día del
  // Vaticano, lejos de todo): con el madrugón puede volver a su sitio, detrás del Foro.
  const rescuedOutside = trip.days
    .flatMap((day) => (day.schedule?.kept ?? []).filter((unit) => String(unit.id).startsWith('de paso:')).flatMap((unit) => unit.places.map((place) => place.name)))
    .filter((name) => (trip.rescueDetours?.[name] ?? Infinity) > OUTSIDE_ON_THE_WAY_MINUTES)
  const missing = [...new Set([...(trip.unplacedEssentials ?? []).map((item) => item.name), ...rescuedOutside])]
  if (missing.length === 0 || trip.mode?.dayStart === MODES_V3.completo.dayStart) return []
  // Cualquier día de tranquilo que empiece después de las 08:00 (con madrugón "lo justo" incluido): la
  // prueba se queda solo si el viaje sale mejor (entra lo que faltaba).
  return trip.days
    .filter((day) => day.schedule && !day.halfDayExcursion && (day.schedule.modeFallback?.dayStart ?? trip.mode.dayStart) > MODES_V3.completo.dayStart)
    .map((day) => `madruga:${day.dayNumber}:${missing.join('|')}`)
}

/**
 * Lo que se prueba a quitar para arreglar un día muerto: sus bloques (ese día y en todo el viaje); y si
 * la tarde lleva su ancla de paso, el bloque de otro día que la enseñó (sin él, esa tarde va entera).
 */
function repairBans(args, trip, day) {
  // El Free Tour nunca se quita: lo ha elegido el viajero.
  const bans = day.blocks.filter((block) => block.id && block.id !== 'free_tour').flatMap((block) => [`${day.dayNumber}:${block.id}`, `todos:${block.id}`])
  const passByAnchor = day.blocks.find((block) => block.passByAnchor)?.passByAnchor
  if (!passByAnchor) return bans
  const blockById = new Map([...(args.destData.morning_flows ?? []), ...(args.destData.afternoon_flows ?? [])].map((block) => [block.id, block]))
  for (const other of trip.days) {
    if (other.dayNumber >= day.dayNumber) continue
    for (const block of other.blocks ?? []) {
      if (block.id && blockById.get(block.id)?.paradas.some((stop) => stop.lugar === passByAnchor)) bans.push(`${other.dayNumber}:${block.id}`)
    }
  }
  return bans
}

/** Días de ciudad (sin contar el último) con más de 90 min parado: entre paradas, tras comer o antes de cenar. */
function deadDays(trip) {
  const cityDays = trip.days.filter((day) => day.schedule)
  const last = cityDays.at(-1)
  return cityDays.filter((day) => day !== last && Math.max(longestWait(day.schedule), day.schedule.idleBeforeDinner ?? 0) > DEAD_HOURS_MINUTES)
}

/**
 * Días del núcleo (hasta core_days, sin el último) con pocas paradas y tarde sin llenar: menos lugares
 * que el mínimo del ritmo y más espera antes de cenar que su tolerancia.
 */
function shortDays(trip) {
  const cityDays = trip.days.filter((day) => day.schedule)
  const last = cityDays.at(-1)
  const minimum = trip.mode?.targetStops?.[0] ?? 0
  // Como el semáforo (ritmo): solo en viajes de hasta core_days días, y lo de paso también es un lugar visto.
  if (trip.days.length > (trip.coreDays ?? Infinity)) return []
  return cityDays.filter((day) => day.schedule.visits.length < minimum && (day.schedule.idleBeforeDinner ?? 0) > (trip.mode?.gapTolerance ?? Infinity))
}

/** Lo que cuesta un viaje: horas muertas, imprescindibles fuera, pool fuera, medios días sin tipo. */
function tripCost(trip) {
  return Math.min(LATE_JOYA_CAP, LATE_JOYA_COST * lateJoyasOf(trip).length) + DEAD_DAY_COST * deadDays(trip).length + 60 * shortDays(trip).length + 400 * trip.unplacedEssentials.length + 80 * trip.unplacedPool.length + 60 * trip.untypedHalves + trip.days.reduce((sum, day) => sum + (day.schedule?.walkMinutes ?? 0), 0) / 2
}

function planBlockTripOnce({ destData, totalDays, pace, hasFreeTour = false, poolNames = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel }, bans) {
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  const mode = modeV3For(pace)
  const normalMode = { ...mode, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const hasPlanB = normalMode.dayStart !== mode.dayStart
  const lunchSpotList = lunchSpots(destData)
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const tour = destData.default_free_tour ?? null
  const freeTourTime = tour?.default_time ?? null
  const selected = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const skeleton = tripDays({ destData, totalDays, hasFreeTour, dateRangeStartIso })
  const contentDays = skeleton.length
  const inPool = (name) => poolNames.includes(name)
  const blockHasPool = (block) => block.paradas.some((stop) => inPool(stop.lugar))
  const blockMatches = (block) => (block.experiencias ?? []).filter((id) => selected.includes(id)).length
  const tourCovers = new Set(hasFreeTour ? (tour?.covers ?? []) : [])
  const joyaNames = new Set((destData.places ?? []).filter((place) => place.tier === 'joya').map((place) => place.name))

  // Las horas de cada día: fecha (o el 15 del mes), día de la semana y puesta de sol.
  const hoursOf = (day) => {
    const dateIso = calendar.dateOfDay(day.dayNumber)
    return { weekday: day.weekday ?? null, season: calendar.season, dateIso, sunset: sunsetFor(destData, { dateIso, season: calendar.season }) }
  }
  const closedThatDay = (name, day) => {
    const place = placeByName.get(name)
    if (!place) return false
    const hours = hoursOf(day)
    return closedOnDay(place, hours.weekday, calendar.hasDates ? hours.dateIso : null) || !availableForTrip(place.available, calendar, hours.dateIso, inPool(name))
  }
  const anchorOf = (block) => block.paradas.find((stop) => stop.rol === 'ancla')?.lugar ?? null
  // La excursión de día completo no le quita a una joya su único día bueno (decisión del 2026-09-26): 4 días
  // desde el domingo de Pascua, el Vaticano cierra el domingo y el lunes; la excursión (día 3) pasa al lunes
  // y el Vaticano va el día 3, no el último.
  {
    const excursionAt = skeleton.findIndex((day) => day.isExcursion)
    const before = excursionAt > 0 ? skeleton.slice(0, excursionAt).filter((day) => !day.isBlank && !day.halfDayExcursion) : []
    const stuck = [...joyaNames].find((name) => before.length > 0 && before.every((day) => closedThatDay(name, day)) && !closedThatDay(name, skeleton[excursionAt]))
    if (stuck) {
      const target = skeleton.indexOf(before.at(-1))
      skeleton[excursionAt] = { ...skeleton[excursionAt], isExcursion: false, curated: skeleton[target].curated }
      skeleton[target] = { ...skeleton[target], isExcursion: true, curated: null }
    }
  }

  // ── Mañanas ─────────────────────────────────────────────────────────────────────────────────
  // Un bloque que necesita transporte (la Via Appia: bus o taxi) se trata como excursión de medio día
  // mientras no haya saltos de transporte: no es una mañana de ciudad.
  const mornings = (destData.morning_flows ?? []).filter((block) => !block.transporte)
  const isTourMorning = (block) => block.paradas.some((stop) => stop.lugar === tour?.name)
  const eligibleMorning = (block) => {
    if (isTourMorning(block)) return hasFreeTour
    // El Free Tour sustituye a la mañana que recorre lo mismo (todas sus paradas las enseña el tour).
    if (hasFreeTour && block.paradas.every((stop) => tourCovers.has(stop.lugar))) return false
    return (block.minimo_dias_viaje ?? 0) <= contentDays || blockHasPool(block)
  }
  // Lo que el viajero eligió y solo sale en una mañana (la Galería Borghese no, que también tiene tarde):
  // esa mañana va delante. Si también sale en una tarde, se deja a las tardes, que lo prefieren.
  // Lo que se visita en alguna tarde (verlo de paso no cuenta: el Coliseo al anochecer en "letran_celio").
  const afternoonNames = new Set((destData.afternoon_flows ?? []).flatMap((block) => block.paradas.filter((stop) => stop.rol !== 'de_paso').map((stop) => stop.lugar)))
  // Una joya que solo sale en una mañana (el Coliseo) le gana el sitio a la que también tiene tarde
  // (el Vaticano tiene "vaticano_por_la_tarde"): 2 días con Free Tour son Roma Antigua por la mañana y
  // el Vaticano por la tarde, no al revés.
  const onlyMorningJoya = (block) => block.paradas.some((stop) => joyaNames.has(stop.lugar) && !afternoonNames.has(stop.lugar))
  const needsMorning = (block) => block.paradas.some((stop) => inPool(stop.lugar) && !afternoonNames.has(stop.lugar))
  // Primero las que van con el viaje (imprescindibles o alguna experiencia elegida); después, si faltan
  // mañanas, las demás por prioridad: las experiencias ordenan, no dejan un día sin mañana.
  const fitsTrip = (block) => (block.experiencias ?? []).includes('imprescindibles') || blockMatches(block) > 0 || blockHasPool(block)
  const morningOrder = mornings
    .filter(eligibleMorning)
    .sort((a, b) => Number(isTourMorning(b)) - Number(isTourMorning(a)) || Number(onlyMorningJoya(b)) - Number(onlyMorningJoya(a)) || Number(needsMorning(b)) - Number(needsMorning(a)) || Number(fitsTrip(b)) - Number(fitsTrip(a)) || (a.prioridad ?? 9) - (b.prioridad ?? 9) || blockMatches(b) - blockMatches(a))
  const cityDays = skeleton.filter((day) => !day.isBlank && !day.isExcursion)
  const morningOf = new Map()
  const usedMornings = new Set()
  // Cada mañana elegida va a un día en que su ancla está abierta: primero se eligen las mañanas por
  // prioridad mientras todas quepan en algún día (el Vaticano, que solo abre el sábado de un viaje que
  // cae en domingo, lunes de excursión y 8 de diciembre, no se queda fuera porque el Coliseo se quedó el
  // sábado); después, por prioridad, cada una al primer día que deja sitio a las demás.
  const morningDays = cityDays.filter((day) => !day.halfDayExcursion)
  // Una mañana prohibida ese día (o en todo el viaje) por la reparación no va.
  const opensOn = (block, day) => !closedThatDay(anchorOf(block), day) && !bans.has(`${day.dayNumber}:${block.id}`) && !bans.has(`todos:${block.id}`)
  const matchable = (blocks, taken = new Map()) => {
    const owner = new Map(taken)
    const tryPlace = (block, seenDays) => {
      for (const day of morningDays) {
        if (seenDays.has(day.dayNumber) || !opensOn(block, day)) continue
        seenDays.add(day.dayNumber)
        const current = owner.get(day.dayNumber)
        if (!current || (!taken.has(day.dayNumber) && tryPlace(current, seenDays))) {
          owner.set(day.dayNumber, block)
          return true
        }
      }
      return false
    }
    return blocks.every((block) => tryPlace(block, new Set()))
  }
  const opensInMorning = (block, day) =>
    block.paradas
      .filter((stop) => stop.rol !== 'de_paso' && placeByName.get(stop.lugar)?.level === 1)
      .every((stop) => {
        const schedule = effectiveSchedule(placeByName.get(stop.lugar), hoursOf(day))
        if (!schedule) return true
        const sessions = parseHoursSessions(schedule)
        return sessions.length === 0 || Math.min(...sessions.map((session) => session.open)) <= MORNING_OPENS_BY
      })
  const selectedMornings = []
  for (const block of morningOrder) {
    if (selectedMornings.length >= morningDays.length) break
    if (matchable([...selectedMornings, block])) selectedMornings.push(block)
  }
  // El orden del pool manda también en los días (ajustes B.4): lo primero del pool, en los primeros días.
  const poolRank = (block) => Math.min(...block.paradas.filter((stop) => stop.rol !== 'de_paso' && inPool(stop.lugar)).map((stop) => poolNames.indexOf(stop.lugar)), Infinity)
  selectedMornings.sort((a, b) => poolRank(a) - poolRank(b))
  // Una joya cerrada los primeros días (el Vaticano el domingo y el lunes de Pascua) va el primer día que
  // abre, si llega a tiempo para lo mejor primero (decisión del 2026-09-26: el día 3, no el último).
  const pinnedDayOf = new Map()
  for (const block of selectedMornings) {
    const anchor = anchorOf(block)
    if (!anchor || !joyaNames.has(anchor)) continue
    const firstOpen = morningDays.find((candidate) => !closedThatDay(anchor, candidate))
    if (firstOpen && firstOpen !== morningDays[0] && firstOpen.dayNumber <= Math.min(EARLY_JOYA_LAST_DAY, contentDays - 1)) pinnedDayOf.set(block.id, firstOpen.dayNumber)
  }
  selectedMornings.sort((a, b) => Number(pinnedDayOf.has(b.id)) - Number(pinnedDayOf.has(a.id)))
  for (const block of selectedMornings) {
    const rest = selectedMornings.filter((other) => other !== block && !usedMornings.has(other.id))
    const free = (candidate) => !morningOf.has(candidate.dayNumber) && opensOn(block, candidate) && matchable(rest, new Map([...morningOf.entries(), [candidate.dayNumber, block]]))
    // Mejor un día en que todo lo imprescindible de la mañana abre por la mañana (el miércoles la
    // Basílica no abre hasta las 12:30): solo si no hay otro, ese día.
    const pinned = pinnedDayOf.has(block.id) ? morningDays.find((candidate) => candidate.dayNumber === pinnedDayOf.get(block.id) && free(candidate)) : null
    const day = pinned ?? morningDays.find((candidate) => free(candidate) && opensInMorning(block, candidate)) ?? morningDays.find(free)
    if (!day) continue
    morningOf.set(day.dayNumber, block)
    usedMornings.add(block.id)
  }
  // Lo mejor primero: el último día en que una joya todavía llega a tiempo (el 3, o el penúltimo si el
  // viaje es de 3) y las joyas que, con el reparto de mañanas, saldrían más tarde o no saldrían.
  const earlyLimit = Math.min(EARLY_JOYA_LAST_DAY, contentDays - 1)
  const joyaMorningDay = new Map()
  for (const [dayNumber, block] of morningOf.entries()) {
    for (const stop of block.paradas) if (stop.rol !== 'de_paso' && joyaNames.has(stop.lugar) && !joyaMorningDay.has(stop.lugar)) joyaMorningDay.set(stop.lugar, dayNumber)
  }
  const lateJoyas = new Set([...joyaNames].filter((name) => !tourCovers.has(name) && (!joyaMorningDay.has(name) || joyaMorningDay.get(name) > earlyLimit)))
  // Lo que excluyen las mañanas elegidas, para todo el viaje.
  const excludedInTrip = new Set([...morningOf.values()].flatMap((block) => block.excluye_tardes_mismo_viaje ?? []))
  const morningAnchors = new Set([...morningOf.values()].map(anchorOf).filter(Boolean))
  const allMorningAnchors = new Set(mornings.map(anchorOf).filter(Boolean))

  // ── Estado del viaje ─────────────────────────────────────────────────────────────────────────
  const seen = new Set(hasFreeTour ? [...tourCovers].filter((name) => {
    const place = placeByName.get(name)
    return place && (place.is_free_access ?? place.type === 'exterior')
  }) : [])
  let paidMuseums = 0
  const museumQuota = paidMuseumQuota(destData, contentDays)
  const usedAfternoons = new Set()
  // Experiencias sin bloque que ya han salido de camino en el viaje.
  const shownExperiences = new Set()
  const blockSummary = []
  let untypedHalves = 0
  const unplacedPool = []
  // Lo rescatado de paso y su desvío (la reparación solo madruga por lo que queda lejos de camino).
  const rescueDetours = new Map()
  const droppedForTime = new Set()
  const allUnits = buildUnits(destData, hasFreeTour)
  const plannedNames = new Set([...morningOf.values()].flatMap((block) => block.paradas.map((stop) => stop.lugar)))

  /**
   * Las paradas de un bloque para un día: el papel de cada una, lo que se salta y lo que va de paso.
   * @returns {{ place: object, role: string, name: string }[]}
   */
  function stopsOf(block, day, dayPlaces, passByNames = new Set()) {
    const list = []
    for (const stop of block.paradas) {
      const name = stop.lugar
      if (name === tour?.name) {
        list.push({ name, role: 'ancla', place: { ...tour, isFreeTour: true, duration_minutes: tour.duration_minutes ?? 150 } })
        continue
      }
      const place = placeByName.get(name)
      if (!place) continue
      if (stop.solo_con && !selected.includes(stop.solo_con) && !inPool(name)) {
        skippedOutside(list, place)
        continue
      }
      const chosen = inPool(name)
      // El ancla que ya sale otro día y se ve desde la calle va de paso (la Plaza de España camino del Pincio).
      if (passByNames.has(name)) {
        list.push({ name, role: 'de_paso', place })
        continue
      }
      // Ya visto en el viaje: no se repite (lo que enseñó el Free Tour, de paso).
      if (seen.has(name) || dayPlaces.some((other) => other.name === name)) {
        if (tourCovers.has(name) && stop.rol !== 'de_paso') list.push({ name, role: 'de_paso', place })
        continue
      }
      // Reglas de un local (Parte A), salvo el pool y lo imprescindible.
      if (!chosen && place.level !== 1) {
        if (isPaidMuseum(place) && paidMuseums >= museumQuota) {
          skippedOutside(list, place)
          continue
        }
        if (blockedByRedundancy(destData, name, new Set([...seen, ...plannedNames]), { contentDays, experienceMatches: (place.tags ?? []).some((tag) => selected.some((id) => TAG_INTEREST_MAP[id].includes(tag))) })) continue
        if (stop.rol !== 'de_paso' && breaksOneBigVisit([place], [...dayPlaces, ...list.map((item) => item.place)])) {
          skippedOutside(list, place)
          continue
        }
      }
      // Cerrado ese día: se ve de paso si se ve por fuera; si no, se salta.
      if (closedThatDay(name, day)) {
        if (place.visible_from_outside || place.pass_by || place.type === 'exterior') list.push({ name, role: 'de_paso', place })
        continue
      }
      list.push({ name, role: chosen ? 'pool' : stop.rol, place, beforeSunset: Boolean(stop.antes_del_atardecer) })
    }
    return list
  }

  /**
   * Lo de pago que el bloque se salta (solo con Arte, o fuera de la cuota de museos) se ve por fuera
   * desde la parada de su mismo grupo que va justo antes: el Castillo de Sant'Angelo desde el Puente.
   */
  function skippedOutside(list, place) {
    const previous = list.at(-1)
    if (!previous || !place.group || previous.place.group !== place.group) return
    previous.place = { ...previous.place, outsideOf: [...(previous.place.outsideOf ?? []), place.name] }
  }

  /**
   * Qué se cae antes cuando el día no da (el más alto primero). Tranquilo (`dropByLevel`, decisión del
   * 2026-09-26): los rellenos, el nivel 3, el nivel 2 y lo de paso, en ese orden; nunca un nivel 1 ni una joya.
   */
  function dropRankOf(name, role, place, stops) {
    if (joyaNames.has(name) || (mode.dropByLevel && place.level === 1)) return DROP_RANK.joya
    if (role === 'pool') return DROP_RANK.pool
    if (role === 'de_paso' && place.group && stops.some((other) => other.name !== name && other.role !== 'de_paso' && other.place?.group === place.group)) return DROP_RANK.parada
    if (mode.dropByLevel && role !== 'ancla') return role === 'de_paso' ? DROP_RANK_BY_LEVEL.de_paso : DROP_RANK_BY_LEVEL[place.level ?? 3] ?? DROP_RANK_BY_LEVEL[3]
    return DROP_RANK[role] ?? DROP_RANK.parada
  }

  /** Las unidades que el programador entiende, en orden, a partir de las paradas de un bloque. */
  function unitsOf(stops, block, slot, day) {
    const hours = hoursOf(day)
    return stops.map(({ name, role, place, beforeSunset }, index) => {
      let ready = place
      if (role === 'de_paso') {
        ready = { ...place, passThrough: true, duration_minutes: Math.min(place.duration_minutes ?? PASS_THROUGH_MINUTES, PASS_THROUGH_MINUTES), windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior' }
      } else if (role === 'atardecer' && hours.sunset != null) {
        ready = { ...place, sunset: hours.sunset }
      }
      const [scheduled] = placesForScheduler({ id: name, places: [ready] }, destData, freeTourTime)
      const theme = selected.find((id) => (place.tags ?? []).some((tag) => TAG_INTEREST_MAP[id].includes(tag))) ?? null
      return {
        id: `${block.id}:${name}`,
        // `antes_del_atardecer`: llena el tiempo antes del mirador; sin tiempo (invierno), se salta a la ida.
        ...(beforeSunset ? { beforeSunset: true } : {}),
        group: null,
        places: [scheduled],
        slot,
        blockId: block.id,
        role,
        // Lo de paso que es del grupo de otra parada del bloque (Plaza Venecia con el Altar) no se cae antes
        // que el resto de lo de paso: el grupo no se parte.
        dropRank: dropRankOf(name, role, place, stops),
        priority: place.level === 1 ? PRIORITY.ESSENTIAL : role === 'pool' ? PRIORITY.POOL : PRIORITY.THEME,
        // Un solo orden para todo el día: la mañana delante de la tarde.
        curatedIndex: (slot === 'manana' ? 0 : CURATED_AFTERNOON_OFFSET) + index,
        poolIndex: inPool(name) ? poolNames.indexOf(name) : null,
        ...(theme && place.level !== 1 ? { experienceTheme: theme } : {}),
      }
    })
  }
  
  /** El barrio de cena que dice la tarde ("Trastevere", "Tridente / Spagna"); si no hay, el más cercano. */
  function dinnerFor(block, lastCoords) {
    const options = dinnerZones(destData)
    const named = restaurantZonesNamedIn(block?.cena, destData, 'cena')
    const pool = named.length > 0 ? named : options
    if (!lastCoords) return pool[0] ?? null
    return pool
      .map((option) => ({ option, walk: travel.leg(lastCoords, option.coordinates)?.minutes ?? Infinity }))
      .sort((a, b) => a.walk - b.walk)[0]?.option ?? null
  }

  /** Programa un día con sus unidades; con plan B (madrugar) si se pierde un imprescindible. */
  function schedule(day, input, dinner, { morning = true } = {}) {
    // Lo de la mañana del bloque vuelve a ser de la mañana en cada programación: si en una anterior pasó
    // a después de comer (la Plaza y la Basílica de San Pedro), esa marca no se arrastra. Si no, madrugar
    // no las devolvía a la mañana y quedaban dos horas muertas antes de comer.
    const units = morning ? input.map((unit) => (unit.slot === 'tarde' && unit.curatedIndex != null && unit.curatedIndex < CURATED_AFTERNOON_OFFSET ? { ...unit, slot: 'manana' } : unit)) : input
    const hours = hoursOf(day)
    const run = (dayMode, list = units) =>
      scheduleFixedOrder({
        units: list,
        mode: dayMode,
        travel,
        start: { minutes: morning ? dayMode.dayStart : dayMode.halfDayRouteStart ?? mode.halfDayRouteStart, coordinates: null },
        pendingMeals: { lunch: morning, dinner: true },
        dinnerPoint: dinner?.coordinates ?? null,
        hours,
        lunchSpots: lunchSpotList,
        keepOrder: true,
      })
    const essential = (unit) => unit.places.some((place) => place.level === 1 || joyaNames.has(place.name))
    const lost = (result) => result.dropped.filter(({ unit }) => essential(unit)).length
    // La mañana del bloque: lo suyo que se va detrás de la comida (el Foro, después del Coliseo) no se
    // hace como dice.
    const morningIds = new Set(units.filter((unit) => unit.slot === 'manana').map((unit) => unit.id))
    let result = run(mode)
    let modeFallback = null
    let shortenedLunch = null
    // Madrugar solo si un imprescindible de nivel 1 se queda fuera del día entero (decisiones del
    // 2026-09-26): ni por las joyas ni porque se deslicen paradas normales. Que pase a después de comer
    // el mismo día NO es perderlo (el Foro detrás del Coliseo y la comida; la Plaza y la Basílica de San
    // Pedro detrás de los Museos; Navona detrás del Panteón). Lo demás que no llega va de paso o a "No te
    // dio tiempo". Se probó madrugar lo justo (09:00, 09:30) y descolocaba el día: a las 08:00.
    const levelOne = (unit) => unit.places.some((place) => place.level === 1)
    const lostLevelOne = (candidate) => candidate.dropped.filter(({ unit }) => levelOne(unit)).length
    // Un nivel 1 que se ve desde fuera (`pass_by`: el Altar desde Piazza Venezia) y se ha caído, de paso en
    // su sitio del recorrido, si el desvío es de 10 min como mucho. Null si así no se recupera nada.
    let outsideCache = null
    const outsideInsteadOfWaking = (candidate) => {
      if (outsideCache && outsideCache.from === candidate) return outsideCache.result
      let list = units
      for (const { unit } of candidate.dropped) {
        const place = unit.places.find((other) => other.level === 1 && placeByName.get(other.name)?.pass_by)
        if (!place || unit.role === 'de_paso') continue
        const passBy = placeByName.get(place.name).pass_by
        const at = list.indexOf(unit)
        if (at < 0) continue
        const coordinates = passBy.coordinates ?? place.coordinates
        const prev = list[at - 1]?.places.at(-1)
        const next = list[at + 1]?.places[0]
        const leg = (x, y) => (x?.coordinates && y?.coordinates ? travel.leg(x.end_coordinates ?? x.coordinates, y.coordinates)?.minutes ?? Infinity : 0)
        const detour = leg(prev, { coordinates }) + (next ? leg({ coordinates }, next) - leg(prev, next) : 0)
        if (detour > OUTSIDE_ON_THE_WAY_MINUTES) continue
        const outside = { ...asPassThrough(unit), places: [{ ...asPassThrough(unit).places[0], coordinates, duration_minutes: passBy.minutes ?? OUTSIDE_ESSENTIAL_MINUTES, ...(passBy.includes?.length ? { outsideOf: passBy.includes } : {}) }] }
        list = list.map((other) => (other === unit ? outside : other))
      }
      const trial = list === units ? null : run(mode, list)
      const result = trial && lostLevelOne(trial) < lostLevelOne(candidate) ? trial : null
      outsideCache = { from: candidate, result }
      return result
    }
    // La reparación del viaje puede pedir madrugar un día (`madruga:<día>:<nombres>`): un imprescindible
    // se queda fuera de todo el viaje (o solo entra de paso rescatado lejos): se prueba empezar a las 08:00.
    const forcedWake = hasPlanB && morning ? [...bans].find((ban) => ban.startsWith(`madruga:${day.dayNumber}:`)) : null
    // Empezar antes, lo justo (decisión del 2026-09-26): de media en media hora hasta las 08:00, la
    // primera hora que consigue lo mismo que las 08:00.
    const wakeAsLateAsPossible = (good) => {
      const earliest = run(normalMode)
      if (!good(earliest)) return null
      for (let start = mode.dayStart - WAKE_EARLY_STEP; start > normalMode.dayStart; start -= WAKE_EARLY_STEP) {
        const trial = run({ ...normalMode, dayStart: start })
        if (good(trial) && lostLevelOne(trial) <= lostLevelOne(earliest)) return { result: trial, start }
      }
      return { result: earliest, start: normalMode.dayStart }
    }
    // Pedido por la reparación: a las 08:00. Lo que faltaba (el Altar) entra después, en el rescate, con el
    // tiempo que deja; la reparación solo se queda el madrugón si así el viaje sale mejor.
    const woken = forcedWake ? ((earliest) => (lostLevelOne(earliest) <= lostLevelOne(result) ? { result: earliest, start: normalMode.dayStart } : null))(run(normalMode)) : null
    if (woken) {
      result = woken.result
      modeFallback = { recoveredUnitIds: [], recoveredNames: forcedWake.split(':').slice(2).join(':').split('|'), startedAt: woken.start, dayStart: woken.start }
    } else if (hasPlanB && morning && lostLevelOne(result) > 0 && outsideInsteadOfWaking(result)) {
      // Antes que madrugar (decisión del 2026-09-26): lo que se ve desde fuera (el Altar, desde Piazza
      // Venezia) va de paso, 15 min, si queda de camino.
      result = outsideInsteadOfWaking(result)
    } else if (hasPlanB && morning && lostLevelOne(result) > 0) {
      const baseLost = lostLevelOne(result)
      const found = wakeAsLateAsPossible((trial) => lostLevelOne(trial) < baseLost)
      const alt = found?.result ?? result
      if (found) {
        const startedAt = found.start
        const lostUnits = (candidate) => candidate.dropped.map(({ unit }) => unit).filter(levelOne)
        const recovered = lostUnits(result).filter((unit) => !lostUnits(alt).some((other) => other.id === unit.id)).map((unit) => unit.id)
        // El aviso nombra el nivel 1 que se recupera, sea de la mañana o de la tarde (con el Foro después de
        // comer, lo que se perdía era el Panteón de la tarde).
        modeFallback = { recoveredUnitIds: [...new Set(recovered)], startedAt, dayStart: startedAt }
        result = alt
      }
    }
    // Si aún se pierde un imprescindible, se acorta la comida (60 min comiendo, como mínimo) antes que
    // quitarlo (ajustes C: la Basílica con el Vaticano por la tarde en tranquilo).
    // Antes de acortar la comida (decisión del 2026-09-26): fuera las paradas de paso secundarias de la
    // tarde (no nivel 1, sin grupo con otra parada), de la última hacia atrás, solo las que hagan falta.
    if (lost(result) > 0) {
      const dayMode = modeFallback ? { ...normalMode, dayStart: modeFallback.dayStart } : mode
      const secondary = units.filter((unit) => !morningIds.has(unit.id) && unit.role === 'de_paso' && !levelOne(unit) && !unit.places.some((place) => place.group && units.some((other) => other !== unit && other.role !== 'de_paso' && other.places.some((mate) => mate.group === place.group))))
      let list = units
      const removed = []
      for (const unit of [...secondary].reverse()) {
        const trial = run(dayMode, list.filter((other) => other !== unit))
        if (lost(trial) > lost(result)) continue
        list = list.filter((other) => other !== unit)
        removed.push(unit)
        if (lost(trial) < lost(result)) {
          result = { ...trial, dropped: [...trial.dropped, ...removed.map((other) => ({ unit: other, reason: 'lunch_kept' }))] }
          if (lost(result) === 0) break
        }
      }
    }
    if (lost(result) > 0) {
      const base = modeFallback ? { ...normalMode, dayStart: modeFallback.dayStart } : mode
      // Nunca por debajo de 60 min comiendo (decisión del 2026-09-26).
      const shortLunch = { ...base, mealMinutes: Math.max(SHORT_LUNCH_MINUTES, Math.min(base.mealMinutes, SHORT_LUNCH_MINUTES)), lunchBlockMinutes: Math.min(base.lunchBlockMinutes, SHORT_LUNCH_BLOCK_MINUTES), visitDurationBonus: 0 }
      const alt = run(shortLunch)
      if (lost(alt) < lost(result)) {
        shortenedLunch = result.dropped.filter(({ unit }) => essential(unit) && !alt.dropped.some((d) => d.unit.id === unit.id)).flatMap(({ unit }) => unit.places.map((place) => place.name))
        result = alt
      }
    }
    // Lo que sobra de la mañana no arrastra la tarde (ajustes B.2): lo que no cabe antes de comer va de
    // paso si se ve desde la calle; si no, fuera. Salvo un nivel 1: va después de comer, entero y en su
    // orden, antes de la tarde (decisión del 2026-09-26).
    const overflowOf = (candidate) => candidate.kept.filter((unit) => morningIds.has(unit.id) && unit.slot === 'tarde' && !levelOne(unit))
    if (overflowOf(result).length > 0) {
      const dayMode = modeFallback ? { ...normalMode, dayStart: modeFallback.dayStart } : mode
      const seenFromStreet = (unit) => unit.places.every((place) => place.passThrough || place.type === 'exterior' || place.visible_from_outside || place.pass_by)
      // Con su grupo del JSON entero: si la Cerradura no llega, el Aventino (Boca, Naranjos, Cerradura) va junto.
      // Salvo que en el grupo haya un ancla o un imprescindible (el Vaticano: la Basílica sola va a la tarde).
      const heavyGroups = new Set(units.filter((unit) => morningIds.has(unit.id) && (unit.role === 'ancla' || essential(unit))).flatMap((unit) => unit.places.map((place) => place.group)).filter(Boolean))
      const overflowGroups = new Set(overflowOf(result).flatMap((unit) => unit.places.map((place) => place.group)).filter((group) => group && !heavyGroups.has(group)))
      const overflow = new Set(units.filter((unit) => overflowOf(result).some((other) => other.id === unit.id) || (unit.slot === 'manana' && unit.places.some((place) => overflowGroups.has(place.group)))).map((unit) => unit.id))
      let list = units.map((unit) => (overflow.has(unit.id) && unit.role !== 'de_paso' && seenFromStreet(unit) ? asPassThrough(unit) : unit))
      let trial = run(dayMode, list)
      const stillBase = overflowOf(trial)
      const stillGroups = new Set(stillBase.flatMap((unit) => unit.places.map((place) => place.group)).filter((group) => group && !heavyGroups.has(group)))
      const still = trial.kept.filter((unit) => stillBase.includes(unit) || (morningIds.has(unit.id) && unit.places.some((place) => stillGroups.has(place.group))))
      const left = []
      if (still.length > 0) {
        const out = new Set(still.map((unit) => unit.id))
        left.push(...still.map((unit) => ({ unit, reason: 'morning_overflow' })))
        list = list.filter((unit) => !out.has(unit.id))
        trial = run(dayMode, list)
      }
      result = { ...trial, dropped: [...trial.dropped, ...left] }
    }
    return { ...result, modeFallback, ...(shortenedLunch ? { shortenedLunch } : {}) }
  }

  /**
   * La comida solo se acorta si sin acortarla la parada no cabe ese día (decisión del 2026-09-26). Con el
   * día ya montado (rellenos, orden final), se prueba con la comida normal: tal cual y, si no, quitando
   * rellenos del final hacia atrás. Si así la parada sigue cabiendo, la comida vuelve a su duración: un
   * relleno (Largo di Torre Argentina) no justifica comer deprisa.
   */
  function lunchBackToNormal(day, current, dinner) {
    const needed = current.shortenedLunch ?? []
    if (needed.length === 0) return null
    // Con la comida normal, lo que hizo acortarla tiene que seguir entrando, y nada del día (salvo los
    // rellenos que se quitan aquí) puede caerse.
    const fits = (list, result) =>
      !result.shortenedLunch &&
      needed.every((name) => result.visits.some((visit) => visit.place.name === name)) &&
      list.every((unit) => result.kept.some((other) => other.id === unit.id))
    const attempt = (list) => {
      const result = schedule(day, list, dinner, { morning: !day.halfDayExcursion })
      return fits(list, result) ? result : null
    }
    let list = [...current.kept]
    let result = attempt(list)
    const fillers = list.filter((unit) => unit.role === 'extra')
    while (!result && fillers.length > 0) {
      const filler = fillers.pop()
      list = list.filter((unit) => unit !== filler)
      result = attempt(list)
    }
    return result ? { list, result: { ...result, dropped: current.dropped } } : null
  }

  /**
   * El mirador del atardecer va a su hora y el tiempo que sobra se usa ANTES (formato del bloque): si
   * se llega con mucha antelación, lo que el bloque pone detrás (la Fontana dell'Acqua Paola y el
   * Tempietto, detrás del Janículo) pasa delante, en su orden, mientras siga habiendo espera.
   */
  function withSunsetFilled(day, morningUnits, afternoonUnits, dinner) {
    const run = (list) => scheduleBlock(day, morningUnits, list, dinner)
    const at = afternoonUnits.findIndex((unit) => unit.places.some((place) => place.sunset != null))
    if (at < 0) return { units: [...morningUnits, ...afternoonUnits], result: run(afternoonUnits) }
    const waitBefore = (result) => {
      const index = result.visits.findIndex((visit) => visit.place.sunset != null)
      if (index <= 0) return 0
      return result.visits[index].start - result.visits[index - 1].end - (result.visits[index].walkMinutes ?? 0)
    }
    // El orden del bloque no se cambia nunca para rellenar tiempo (ajustes B.1): si sobra antes del
    // atardecer, se alarga lo marcado `antes_del_atardecer` (callejear Trastevere) o queda un "Tiempo
    // libre" justo antes del mirador. Si ni así se guarda el atardecer, el mirador va como una parada
    // más, en su sitio (en abril el sol se pone tarde para cenar a las 20:00 después).
    const options = []
    {
      const result = run(afternoonUnits)
      if (result.visits.some((visit) => visit.place.sunset != null)) {
        options.push({ units: [...morningUnits, ...afternoonUnits], result, cost: 300 * lossOf(result) + lateDinnerCost(result) + sunsetWaitCost(waitBefore(result)) + result.walkMinutes })
      }
    }
    // Lo que va detrás del mirador y no cabe entero antes de cenar se ve de paso bajando (Piazza del
    // Popolo, al bajar del Pincio): mejor que adelantarlo y volver a subir.
    const after = afternoonUnits.map((unit, index) => ({ unit, index })).filter(({ unit, index }) => index > at && unit.role !== 'ancla' && unit.role !== 'de_paso')
    for (let k = 1; k <= after.length; k++) {
      const converted = new Set(after.slice(after.length - k).map(({ index }) => index))
      const list = afternoonUnits.map((unit, index) => (converted.has(index) ? asPassThrough(unit) : unit))
      const result = run(list)
      if (!result.visits.some((visit) => visit.place.sunset != null)) continue
      options.push({ units: [...morningUnits, ...list], result, cost: 300 * lossOf(result) + lateDinnerCost(result) + sunsetWaitCost(waitBefore(result)) + result.walkMinutes + SUNSET_PASS_COST * k })
    }
    // Sin tiempo antes del atardecer (invierno), lo marcado `antes_del_atardecer` se salta a la ida y se
    // sube directo al mirador: mejor que perder el atardecer.
    // Lo que queda entre lo saltado y el mirador se ve bajando (la nota del bloque: del Puente se sube
    // directo al Janículo y se baja por el Tempietto y Acqua Paola a cenar a Trastevere).
    if (afternoonUnits.some((unit) => unit.beforeSunset)) {
      const kept = afternoonUnits.filter((unit) => !unit.beforeSunset)
      const sunsetAt = kept.findIndex((unit) => unit.places.some((place) => place.sunset != null))
      const lastSkipped = afternoonUnits.map((unit) => unit.beforeSunset).lastIndexOf(true)
      const between = kept.filter((unit, index) => index < sunsetAt && afternoonUnits.indexOf(unit) > lastSkipped)
      // La bajada la dice el propio bloque (su nota): no cuenta como reordenar.
      const descending = [...kept.slice(0, sunsetAt).filter((unit) => !between.includes(unit)), kept[sunsetAt], ...between.map((unit) => ({ ...unit, descentAfterSunset: true })), ...kept.slice(sunsetAt + 1)]
      const skipped = afternoonUnits.length - kept.length
      // Y bajando a cenar, lo que se saltó a la ida (callejear Trastevere de noche, camino de la cena).
      const skippedUnits = afternoonUnits.filter((unit) => unit.beforeSunset).map((unit) => ({ ...unit, descentAfterSunset: true }))
      const withReturn = [...descending.filter((unit) => !afternoonUnits.slice(afternoonUnits.indexOf(kept[sunsetAt]) + 1).includes(unit) || between.some((b) => b.id === unit.id)), ...skippedUnits, ...kept.slice(sunsetAt + 1).filter((unit) => !between.includes(unit))]
      for (const [list, extra] of [[kept, 0], [descending, SUNSET_DESCENT_COST], [withReturn, SUNSET_DESCENT_COST - SUNSET_RETURN_BONUS * skippedUnits.length]]) {
        const result = run(list)
        if (!result.visits.some((visit) => visit.place.sunset != null)) continue
        options.push({ units: [...morningUnits, ...list], result, cost: 300 * lossOf(result) + lateDinnerCost(result) + sunsetWaitCost(waitBefore(result)) + result.walkMinutes + SUNSET_SKIP_COST * skipped + extra, descent: extra > 0 })
      }
    }
    const plain = afternoonUnits.map((unit, index) => (index === at ? { ...unit, places: unit.places.map(({ sunset, ...place }) => place) } : unit))
    const plainResult = run(plain)
    // Sin atardecer cuenta como perder media parada: solo si así se pierde menos.
    options.push({ units: [...morningUnits, ...plain], result: plainResult, cost: 300 * lossOf(plainResult) + 500 + plainResult.walkMinutes })
    const best = options.sort((a, b) => a.cost - b.cost)[0]
    return stretchBeforeSunset(best, run, morningUnits)
  }

  /**
   * El tiempo que sobra antes del atardecer se queda en lo marcado `antes_del_atardecer` (se callejea
   * Trastevere más rato), sin tocar el orden: se alarga la última de esas paradas antes del mirador, en
   * cuartos de hora, mientras no se caiga nada.
   */
  function stretchBeforeSunset(option, run, morningUnits) {
    const visits = option.result.visits
    const sunsetAt = visits.findIndex((visit) => visit.place.sunset != null)
    if (sunsetAt <= 0) return option
    const wait = visits[sunsetAt].start - visits[sunsetAt - 1].end - (visits[sunsetAt].walkMinutes ?? 0)
    const afternoonUnits = option.units.slice(morningUnits.length)
    // Primero lo que es para callejear (un barrio, algo por fuera): Trastevere, no la iglesia.
    const candidates = afternoonUnits.filter((unit) => unit.beforeSunset && visits.slice(0, sunsetAt).some((visit) => visit.unitId === unit.id))
    const isBarrio = (unit) => unit.places.some((place) => (place.tags ?? []).includes('barrio'))
    const outdoors = (unit) => unit.places.some((place) => place.type === 'exterior')
    const target = [...candidates].reverse().find(isBarrio) ?? [...candidates].reverse().find(outdoors) ?? candidates.at(-1)
    if (!target || wait <= SUNSET_STRETCH_MIN) return option
    for (let extra = Math.floor((wait - SUNSET_STRETCH_SLACK) / 15) * 15; extra >= 15; extra -= 15) {
      const list = afternoonUnits.map((unit) => (unit === target ? { ...unit, places: unit.places.map((place, index) => (index === unit.places.length - 1 ? { ...place, duration_minutes: (place.duration_minutes ?? 30) + extra, stretchBase: place.stretchBase ?? place.duration_minutes ?? 30 } : place)) } : unit))
      const result = run(list)
      if (result.dropped.length <= option.result.dropped.length && result.visits.some((visit) => visit.place.sunset != null)) return { ...option, units: [...morningUnits, ...list], result }
    }
    return option
  }

  /**
   * Parejas mañana-tarde que el JSON declara compatibles aunque estén lejos (Navona → Museos Vaticanos,
   * 38 min a pie): se quedan como excepción, pero si el traslado pasa de 25 min andando el día lo dice,
   * con cómo moverse si el bloque lo trae (`traslados[acaba_en]`); si no, "bus o metro".
   */
  function longWalksOf(day) {
    const flowById = new Map([...(destData.morning_flows ?? []), ...(destData.afternoon_flows ?? [])].map((block) => [block.id, block]))
    const morningBlock = flowById.get(day.blocks?.find((block) => block.slot === 'manana')?.id) ?? null
    const afternoonBlock = flowById.get(day.blocks?.find((block) => block.slot === 'tarde')?.id) ?? null
    const visits = day.schedule?.visits ?? []
    const lunch = (day.schedule?.meals ?? []).find((meal) => meal.type === 'lunch')
    const firstAfternoon = afternoonBlock ? visits.find((visit) => String(visit.unitId).startsWith(`${afternoonBlock.id}:`)) : null
    const walks = []
    for (let i = 1; i < visits.length; i++) {
      const visit = visits[i]
      const previous = visits[i - 1]
      // Con la comida en medio, se sale del restaurante.
      const fromLunch = lunch?.coordinates && lunch.start >= previous.end && lunch.start < visit.start
      const from = fromLunch ? lunch.coordinates : previous.place.end_coordinates ?? previous.place.coordinates
      const minutes = travel.leg(from, visit.place.coordinates)?.minutes ?? 0
      if (minutes <= TRANSFER_NOTICE_MINUTES) continue
      const place = placeByName.get(visit.place.name)
      const blockHow = visit === firstAfternoon && morningBlock ? afternoonBlock.traslados?.[morningBlock.acaba_en] ?? null : null
      walks.push({ minutes, from: fromLunch ? 'la comida' : previous.place.name, to: visit.place.name, uphill: Boolean(place?.uphill), how: blockHow ?? place?.uphill?.transit ?? null })
    }
    return walks
  }

  /**
   * Un bloque `reversible` se hace al revés cuando se llega por el otro extremo: desde Trastevere o
   * Testaccio, el centro barroco empieza por el Ghetto y acaba en el Panteón.
   */
  function oriented(block, from) {
    if (!block.reversible || !from?.coordinates) return block
    const first = placeByName.get(block.paradas[0]?.lugar)
    const last = placeByName.get(block.paradas.at(-1)?.lugar)
    if (!first?.coordinates || !last?.coordinates) return block
    const origin = from.end_coordinates ?? from.coordinates
    const toFirst = travel.leg(origin, first.coordinates)?.minutes ?? Infinity
    const toLast = travel.leg(origin, last.coordinates)?.minutes ?? Infinity
    return toLast < toFirst ? { ...block, paradas: [...block.paradas].reverse(), reversed: true } : block
  }

  /**
   * Programa la tarde de un bloque. Lo que se cae por el horario (cerrado a esa hora, cierra durante la
   * visita, pasada la última entrada) no se pierde: el bloque pasa por delante, así que va de paso
   * ("Pasas por…"). El Tempietto a las 17:40 en abril, que cierra a las 18:00.
   */
  function scheduleBlock(day, morningUnits, list, dinner) {
    let current = list
    for (let round = 0; round < 3; round++) {
      const result = schedule(day, [...morningUnits, ...current], dinner, { morning: !day.halfDayExcursion })
      const byHours = new Set(result.dropped.filter(({ unit, reason }) => HOURS_DROP_REASONS.has(reason) && unit.slot === 'tarde' && unit.role !== 'de_paso' && unit.role !== 'ancla' && !unit.places.some((place) => place.level === 1) && current.some((other) => other.id === unit.id)).map(({ unit }) => unit.id))
      // Lo que obliga a esperar a que abra más que la tolerancia del ritmo (Santa Cecilia abre a las 16:00
      // y se llega a las 14:30): a esa hora está cerrado, así que también va de paso.
      const blockIds = new Set(current.map((unit) => unit.id))
      result.visits.forEach((visit, index) => {
        if (index === 0 || visit.place.sunset != null || visit.place.fixed_start) return
        const unit = current.find((other) => other.id === visit.unitId)
        if (!unit || !blockIds.has(unit.id) || unit.role === 'de_paso' || unit.role === 'ancla' || unit.slot !== 'tarde' || unit.places.some((place) => place.level === 1)) return
        const meal = (result.meals ?? []).find((m) => m.start >= result.visits[index - 1].end && m.start < visit.start)
        const from = meal ? meal.start + (meal.eatMinutes ?? meal.end - meal.start) : result.visits[index - 1].end
        if (visit.start - from - (visit.walkMinutes ?? 0) > mode.gapTolerance && effectiveScheduleOf(visit.place, hoursOf(day))) byHours.add(unit.id)
      })
      if (byHours.size === 0) return result
      current = current.map((unit) => (byHours.has(unit.id) ? asPassThrough(unit) : unit))
      if (round === 2) return schedule(day, [...morningUnits, ...current], dinner, { morning: !day.halfDayExcursion })
    }
    return schedule(day, [...morningUnits, ...current], dinner, { morning: !day.halfDayExcursion })
  }

  /** Una unidad que pasa a verse de paso (10 min, sin horario). */
  const asPassThrough = (unit) => ({
    ...unit,
    role: 'de_paso',
    dropRank: DROP_RANK.de_paso,
    places: unit.places.map((place) => ({ ...place, passThrough: true, duration_minutes: Math.min(place.duration_minutes ?? PASS_THROUGH_MINUTES, PASS_THROUGH_MINUTES), windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior' })),
  })

  /** Esperar al atardecer: lo que pasa de 45 min cuesta; más de 90 (horas muertas), mucho: mejor el mirador en su sitio. */
  const sunsetWaitCost = (wait) => Math.max(0, wait - SUNSET_WAIT_MAX) + (wait > DEAD_HOURS_MINUTES ? SUNSET_DEAD_WAIT_COST : 0)

  /** La cena de verano es a las 21:00 (Parte A, regla 8): más tarde, solo si no hay otra. */
  const lateDinnerCost = (result) => {
    const dinner = result.meals?.find((meal) => meal.type === 'dinner')
    return dinner && dinner.start > LATE_DINNER_START ? 400 : 0
  }

  /** Lo que se pierde de un bloque: cuenta lo numerado entero y lo de paso a medias. */
  const lossOf = (result) => result.dropped.reduce((sum, { unit }) => sum + (unit.role === 'de_paso' ? 1 : 3) * unit.places.length, 0)

  /**
   * Tranquilo es menos paradas, no más largas (revisión 16): el día no pasa de las paradas del ritmo
   * (lo "de paso" no cuenta). Se quita primero lo de la tarde menos importante: nivel 3, luego 2; nunca
   * el ancla, el atardecer ni lo del pool.
   */
  function trimForPace(afternoonStops, morningStops) {
    const numbered = (list) => list.filter((stop) => stop.role !== 'de_paso').length
    const limit = mode.targetStops?.[1] ?? Infinity
    let list = [...afternoonStops]
    // Un grupo del JSON (Boca de la Verdad, Naranjos, Cerradura) no se parte: si uno no se puede quitar
    // (el ancla), no se quita ninguno.
    const protectedGroups = new Set(list.filter((stop) => stop.role !== 'parada' || stop.place.level === 1 || joyaNames.has(stop.name)).map((stop) => stop.place.group).filter(Boolean))
    while (numbered([...morningStops, ...list]) > limit) {
      const candidates = list
        .map((stop, index) => ({ stop, index }))
        .filter(({ stop }) => stop.role === 'parada' && !joyaNames.has(stop.name) && stop.place.level !== 1 && !protectedGroups.has(stop.place.group))
        .sort((a, b) => (b.stop.place.level ?? 3) - (a.stop.place.level ?? 3) || b.index - a.index)
      if (candidates.length === 0) break
      const group = candidates[0].stop.place.group
      list = list.filter((stop, index) => index !== candidates[0].index && !(group && stop.place.group === group))
    }
    return list
  }

  /**
   * Nada de horas muertas (Parte A, regla 7): si la tarde acaba y quedan más de 90 min hasta la cena,
   * se sigue con lo que pilla de camino al barrio de la cena (a 15 min o menos de la parada anterior y
   * sin desviarse más de 15), hasta dejar una hora de margen. Primero lo más importante y lo de las
   * experiencias; nunca lo ya visto ni lo de la mañana de otro día.
   */
  /**
   * Una espera larga dentro del día (la Vittoria abre a las 16:00 y se come a las 13:00): se rellena con
   * lo que pille entre donde se está y la parada que espera (a 15 min de cada lado), justo antes de ella.
   */
  function fillWait(day, chosen, otherMorningNames) {
    const matches = (place) => (place.tags ?? []).some((tag) => selected.some((id) => TAG_INTEREST_MAP[id].includes(tag)))
    const anchorsLeft = new Set([...(destData.afternoon_flows ?? []).filter((block) => !usedAfternoons.has(block.id) && block.id !== chosen.block?.id), ...mornings.filter((block) => !usedMornings.has(block.id))].map(anchorOf).filter(Boolean))
    // Los extremos de la espera ORIGINAL: lo que se añade tiene que estar entre los dos, no ir derivando.
    let ends = null
    for (let added = 0; added < 3; added++) {
      const wait = longestWait(chosen.result)
      if (wait <= Math.min(WAIT_FILL_MINUTES, mode.gapTolerance)) return
      const visits = chosen.result.visits
      const index = visits.findIndex((visit, i) => {
        if (i === 0) return false
        const meal = (chosen.result.meals ?? []).find((m) => m.start >= visits[i - 1].end && m.start < visit.start)
        const from = meal ? meal.start + (meal.eatMinutes ?? meal.end - meal.start) : visits[i - 1].end
        return visit.start - from - (visit.walkMinutes ?? 0) === wait
      })
      if (index < 1) return
      // La espera al atardecer es el "Tiempo libre" antes del mirador (B.1): solo se rellena si pasa de 90
      // min (horas muertas), y hasta dejarla en una hora.
      if (visits[index].place.sunset != null && wait <= (ends ? SUNSET_FREE_TIME_MAX : DEAD_HOURS_MINUTES)) return
      const meal = (chosen.result.meals ?? []).find((m) => m.start >= visits[index - 1].end && m.start < visits[index].start)
      const from = meal?.coordinates ?? visits[index - 1].place.end_coordinates ?? visits[index - 1].place.coordinates
      const to = visits[index].place.coordinates
      if (!ends) ends = { from, to, target: visits[index].unitId }
      else if (visits[index].unitId !== ends.target) return
      const today = new Set(visits.map((visit) => visit.place.name))
      const candidates = (destData.places ?? [])
        .filter((place) => !seen.has(place.name) && !today.has(place.name) && !otherMorningNames.has(place.name) && !tourCovers.has(place.name) && !anchorsLeft.has(place.name) && !place.group && !dayBlockNames(day, chosen).has(place.name))
        .filter((place) => !(isPaidMuseum(place) && paidMuseums >= museumQuota) && !closedThatDay(place.name, day))
        .filter((place) => !blockedByRedundancy(destData, place.name, new Set([...seen, ...today]), { contentDays, experienceMatches: matches(place) }))
        .filter((place) => (place.duration_minutes ?? 30) <= wait)
        .map((place) => ({ place, fromOrigin: travel.leg(ends.from, place.coordinates)?.minutes ?? Infinity, toTarget: travel.leg(place.coordinates, ends.to)?.minutes ?? Infinity, walk: (travel.leg(from, place.coordinates)?.minutes ?? Infinity) + (travel.leg(place.coordinates, to)?.minutes ?? Infinity) }))
        .filter((item) => item.walk <= 2 * TAIL_MAX_WALK && item.fromOrigin <= WAIT_FILL_REACH && item.toTarget <= WAIT_FILL_REACH && (visits[index].place.sunset != null ? item.walk - (travel.leg(from, to)?.minutes ?? 0) <= SUNSET_FILL_MAX_DETOUR : item.toTarget <= (travel.leg(from, to)?.minutes ?? Infinity) + 5))
        // (y acercándose a la parada que espera, sin ir y volver)
        .sort((a, b) => (a.place.level ?? 3) - (b.place.level ?? 3) || Number(matches(b.place)) - Number(matches(a.place)) || a.walk - b.walk)
      const unitIndex = chosen.result.kept.findIndex((unit) => unit.id === visits[index].unitId)
      let placed = false
      for (const { place } of candidates.slice(0, 6)) {
        const [scheduled] = placesForScheduler({ id: place.name, places: [place] }, destData, freeTourTime)
        const kept = chosen.result.kept
        const unit = { id: `espera:${place.name}`, group: null, places: [scheduled], slot: kept[unitIndex]?.slot ?? 'tarde', blockId: 'extra', role: 'extra', dropRank: mode.dropByLevel ? DROP_RANK_BY_LEVEL.extra : DROP_RANK.extra, priority: PRIORITY.FILLER, curatedIndex: null, poolIndex: null }
        if (unitIndex < 0 || splitsGroup(kept, unitIndex)) break
        const units = [...kept.slice(0, unitIndex), unit, ...kept.slice(unitIndex)]
        const result = schedule(day, units, chosen.dinner, { morning: !day.halfDayExcursion })
        if (!result.kept.some((other) => other.id === unit.id) || result.dropped.length > 0 || longestWait(result) >= wait) continue
        // Cada parada tiene que acortar la espera de verdad (un cuarto de hora como mínimo).
        if (longestWait(result) > wait - 15) continue
        chosen.units = units
        chosen.result = { ...result, dropped: chosen.result.dropped }
        placed = true
        break
      }
      if (!placed) return
    }
  }

  /**
   * Lo añadido (rellenos de espera y de camino a la cena) se ha ido metiendo de uno en uno: al final se
   * prueba cada uno en cada sitio de la tarde, sin tocar el orden del bloque, y se queda donde menos se
   * anda. Sin caerse nada, sin esperas nuevas por encima de la tolerancia y sin horas muertas nuevas.
   */
  function polishExtras(day, chosen) {
    const run = (units) => schedule(day, units, chosen.dinner, { morning: !day.halfDayExcursion })
    const waitLimit = Math.max(mode.gapTolerance, longestWait(chosen.result))
    const idleLimit = Math.max(DEAD_HOURS_MINUTES, chosen.result.idleBeforeDinner ?? 0)
    // La espera al mirador es tiempo libre legítimo mientras no sean horas muertas.
    const waitLimitOf = (result) => longestWait(result, { skipSunset: true })
    const ok = (result) => result.dropped.length === 0 && waitLimitOf(result) <= Math.max(mode.gapTolerance, waitLimitOf(chosen.result)) && longestWait(result) <= Math.max(DEAD_HOURS_MINUTES, waitLimit) && (result.idleBeforeDinner ?? 0) <= idleLimit
    // Pocos rellenos (3 o menos): todas sus posiciones a la vez, en su orden relativo o no.
    const extras = chosen.result.kept.filter((unit) => unit.role === 'extra')
    if (extras.length > 0 && extras.length <= POLISH_JOINT_MAX) {
      const base = chosen.result.kept.filter((unit) => unit.role !== 'extra')
      const firstAfternoon = Math.max(0, base.findIndex((other) => other.slot === 'tarde'))
      let best = null
      const place = (list, remaining) => {
        if (remaining.length === 0) {
          if (list.every((unit, index) => unit.id === chosen.result.kept[index]?.id)) return
          const result = run(list)
          if (ok(result) && result.meters < (best?.result.meters ?? chosen.result.meters - 1)) best = { list, result }
          return
        }
        const [unit, ...rest] = remaining
        const start = list.findIndex((other) => other.slot === 'tarde')
        for (let at = Math.max(0, start < 0 ? firstAfternoon : start); at <= list.length; at++) {
          if (splitsGroup(list, at)) continue
          place([...list.slice(0, at), unit, ...list.slice(at)], rest)
        }
      }
      place(base, extras)
      if (best) {
        chosen.units = best.list
        chosen.result = { ...best.result, dropped: chosen.result.dropped }
      }
    }
    for (let round = 0; round < 3; round++) {
      let improved = false
      const kept = chosen.result.kept
      for (const unit of kept.filter((candidate) => candidate.role === 'extra')) {
        const rest = chosen.result.kept.filter((other) => other.id !== unit.id)
        const firstAfternoon = Math.max(0, rest.findIndex((other) => other.slot === 'tarde'))
        for (let at = firstAfternoon; at <= rest.length; at++) {
          if (splitsGroup(rest, at)) continue
          const units = [...rest.slice(0, at), unit, ...rest.slice(at)]
          if (units.every((other, index) => other.id === chosen.result.kept[index]?.id)) continue
          const result = run(units)
          if (ok(result) && result.meters < chosen.result.meters - 1) {
            chosen.units = units
            chosen.result = { ...result, dropped: chosen.result.dropped }
            improved = true
          }
        }
      }
      if (!improved) return
    }
  }

  /**
   * Una experiencia elegida que ningún bloque del viaje trae (los mercadillos de Navidad) entra de
   * camino: lo más cercano de esa experiencia, con 15 min de desvío como mucho, donde menos se ande y sin
   * que se caiga nada. Una vez por viaje.
   */
  function experienceOnTheWay(day, chosen, morningBlock, otherMorningNames) {
    const allBlocks = [...(destData.morning_flows ?? []), ...(destData.afternoon_flows ?? [])]
    for (const id of selected) {
      if (allBlocks.some((block) => (block.experiencias ?? []).includes(id)) || shownExperiences.has(id)) continue
      const tags = TAG_INTEREST_MAP[id] ?? []
      const today = new Set(chosen.result.visits.map((visit) => visit.place.name))
      const candidates = (destData.places ?? []).filter((place) => (place.tags ?? []).some((tag) => tags.includes(tag)) && !seen.has(place.name) && !today.has(place.name) && !otherMorningNames.has(place.name) && !closedThatDay(place.name, day))
      let best = null
      for (const place of candidates) {
        const [scheduled] = placesForScheduler({ id: place.name, places: [place] }, destData, freeTourTime)
        const unit = { id: `experiencia:${place.name}`, group: null, places: [scheduled], slot: 'tarde', blockId: 'extra', role: 'extra', dropRank: mode.dropByLevel ? DROP_RANK_BY_LEVEL.extra : DROP_RANK.extra, priority: PRIORITY.THEME, curatedIndex: null, poolIndex: null, experienceTheme: id }
        const kept = chosen.result.kept
        for (let at = 1; at <= kept.length; at++) {
          if (splitsGroup(kept, at)) continue
          const prev = kept[at - 1]?.places.at(-1)
          const next = kept[at]?.places[0]
          const leg = (x, y) => (x?.coordinates && y?.coordinates ? travel.leg(x.end_coordinates ?? x.coordinates, y.coordinates)?.minutes ?? Infinity : 0)
          if (leg(prev, place) + leg(place, next) - leg(prev, next) > TAIL_MAX_WALK) continue
          const units = [...kept.slice(0, at), { ...unit, slot: kept[at]?.slot ?? 'tarde' }, ...kept.slice(at)]
          const result = schedule(day, units, chosen.dinner, { morning: !day.halfDayExcursion })
          if (!result.kept.some((other) => other.id === unit.id) || result.dropped.length > 0) continue
          if (!best || result.walkMinutes < best.result.walkMinutes) best = { units, result }
        }
      }
      if (best) {
        chosen.units = best.units
        chosen.result = { ...best.result, dropped: chosen.result.dropped }
        shownExperiences.add(id)
      }
    }
  }

  /** Lo que el bloque del día se ha saltado a propósito (recorte de tranquilo, solo_con, cuota) no vuelve como relleno. */
  const dayBlockNames = (day, chosen) => new Set([...(chosen.block?.paradas ?? []), ...(morningOf.get(day.dayNumber)?.paradas ?? [])].map((stop) => stop.lugar))

  function extendTail(day, chosen, otherMorningNames) {
    const unusedAnchors = () =>
      new Set([...(destData.afternoon_flows ?? []).filter((block) => !usedAfternoons.has(block.id) && block.id !== chosen.block?.id), ...mornings.filter((block) => !usedMornings.has(block.id))].map(anchorOf).filter(Boolean))
    let dinnerPoint = chosen.dinner?.coordinates ?? null
    const matches = (place) => (place.tags ?? []).some((tag) => selected.some((id) => TAG_INTEREST_MAP[id].includes(tag)))
    // Si cerca del barrio de la cena ya no queda nada (Trastevere, visto entero otro día) y el día se
    // quedaría con horas muertas, se sigue por lo que pilla a 15 min de donde acaba y se cena en el barrio
    // de cena más cercano a donde se termine.
    let flexibleDinner = false
    // Todo lo añadido junto se desvía como mucho TAIL_TOTAL_DETOUR del camino directo a la cena desde
    // donde acaba el bloque (sin ir a Monti y volver a Trevi).
    const blockEnd = chosen.result.visits.at(-1)?.place
    const blockEndCoords = blockEnd?.end_coordinates ?? blockEnd?.coordinates
    let tailWalk = 0
    for (let added = 0; added < 4; added++) {
      const idle = chosen.result.idleBeforeDinner ?? 0
      // También si el día se queda por debajo de las paradas mínimas del ritmo con tarde de sobra.
      const fewStops = chosen.result.visits.length < (mode.targetStops?.[0] ?? 0) && idle > mode.gapTolerance
      if (idle <= DEAD_HOURS_MINUTES && !fewStops) return
      // Solo pasa de las paradas del ritmo tranquilo si no queda otra: una hora muerta es peor (regla 7).
      const last = chosen.result.visits.at(-1)?.place
      const from = last?.end_coordinates ?? last?.coordinates
      if (!from) return
      const today = new Set(chosen.result.visits.map((visit) => visit.place.name))
      const direct = dinnerPoint ? (travel.leg(from, dinnerPoint)?.minutes ?? 0) : 0
      const candidates = (destData.places ?? [])
        // Lo que es el ancla de otro bloque tampoco: sería quitarle a ese bloque su razón de ser.
        .filter((place) => !seen.has(place.name) && !today.has(place.name) && !otherMorningNames.has(place.name) && !tourCovers.has(place.name) && !unusedAnchors().has(place.name) && !dayBlockNames(day, chosen).has(place.name))
        // Lo que va en grupo (el Aventino: Boca de la Verdad, Naranjos, Cerradura) se ve entero o no se ve.
        .filter((place) => !place.group)
        .filter((place) => !(isPaidMuseum(place) && paidMuseums >= museumQuota) && !closedThatDay(place.name, day))
        .filter((place) => !blockedByRedundancy(destData, place.name, new Set([...seen, ...today]), { contentDays, experienceMatches: matches(place) }))
        .filter((place) => !breaksOneBigVisit([place], chosen.result.visits.map((visit) => visit.place)))
        .map((place) => {
          const walk = travel.leg(from, place.coordinates)?.minutes ?? Infinity
          const toDinner = dinnerPoint ? (travel.leg(place.coordinates, dinnerPoint)?.minutes ?? Infinity) : 0
          const detour = dinnerPoint ? walk + toDinner - direct : 0
          const totalDetour = dinnerPoint && blockEndCoords ? tailWalk + walk + toDinner - (travel.leg(blockEndCoords, dinnerPoint)?.minutes ?? 0) : 0
          return { place, walk, detour, toDinner, totalDetour }
        })
        // Siempre cerca de donde se cena: sin irse al otro lado y volver.
        .filter((item) => item.walk <= TAIL_MAX_WALK && (flexibleDinner || (item.detour <= TAIL_MAX_WALK && item.toDinner <= TAIL_MAX_WALK && item.totalDetour <= TAIL_TOTAL_DETOUR)) && (item.place.duration_minutes ?? 30) <= Math.max(idle - TAIL_IDLE_TARGET + 30, idle - 15))
        .sort((a, b) => Number(inPool(b.place.name)) - Number(inPool(a.place.name)) || (a.place.level ?? 3) - (b.place.level ?? 3) || Number(matches(b.place)) - Number(matches(a.place)) || a.walk - b.walk)
      let placed = false
      for (const { place } of candidates.slice(0, 5)) {
        const [scheduled] = placesForScheduler({ id: place.name, places: [place] }, destData, freeTourTime)
        const unit = { id: `extra:${place.name}`, group: null, places: [scheduled], slot: 'tarde', blockId: 'extra', role: 'extra', dropRank: mode.dropByLevel ? DROP_RANK_BY_LEVEL.extra : DROP_RANK.extra, priority: PRIORITY.FILLER, curatedIndex: null, poolIndex: null, isTailExtra: true }
        // Donde menos se ande: de camino, no necesariamente al final (sin tocar el orden del bloque,
        // que va entre sus paradas y no las cambia de sitio).
        const kept = chosen.result.kept
        const firstAfternoon = Math.max(0, kept.findIndex((other) => other.slot === 'tarde'))
        let best = null
        // Con la cena cambiada, lo añadido va al final (la cena, donde se acabe).
        const dinnerHere = flexibleDinner ? dinnerFor(null, place.coordinates) : chosen.dinner
        for (let at = flexibleDinner ? kept.length : firstAfternoon; at <= kept.length; at++) {
          if (splitsGroup(kept, at)) continue
          const units = [...kept.slice(0, at), unit, ...kept.slice(at)]
          const result = schedule(day, units, dinnerHere, { morning: !day.halfDayExcursion })
          if (!result.kept.some((other) => other.id === unit.id) || result.dropped.length > 0 || (result.idleBeforeDinner ?? 0) >= idle) continue
          // Sin esperas nuevas entre paradas (el Gesù, que abre a las 16:00, no va nada más comer).
          if ((result.idleMinutes ?? 0) > (chosen.result.idleMinutes ?? 0) + TAIL_MAX_NEW_WAIT) continue
          if (longestWait(result) > Math.max(longestWait(chosen.result), mode.gapTolerance)) continue
          if (!best || result.walkMinutes < best.result.walkMinutes) best = { units, result, dinner: dinnerHere }
        }
        if (best) {
          chosen.units = best.units
          chosen.result = { ...best.result, dropped: chosen.result.dropped }
          tailWalk += travel.leg(from, place.coordinates)?.minutes ?? 0
          if (best.dinner !== chosen.dinner) {
            chosen.dinner = best.dinner
            dinnerPoint = best.dinner?.coordinates ?? dinnerPoint
          }
          placed = true
          break
        }
      }
      if (!placed) {
        if (flexibleDinner || (chosen.result.idleBeforeDinner ?? 0) <= DEAD_HOURS_MINUTES) return
        flexibleDinner = true
      }
    }
  }

  // ── Tardes y días ────────────────────────────────────────────────────────────────────────────
  const days = []
  for (const day of skeleton) {
    if (day.isBlank || day.isExcursion) {
      days.push({ ...day, units: [], schedule: null, hours: hoursOf(day) })
      continue
    }
    const morningBlock = morningOf.get(day.dayNumber) ?? null
    const morningStops = morningBlock ? stopsOf(morningBlock, day, []) : []
    const morningUnits = morningBlock ? unitsOf(morningStops, morningBlock, 'manana', day) : []
    const morningPlaces = morningStops.map((stop) => stop.place)
    const sameDayExcluded = new Set(morningBlock?.excluye_tardes_mismo_dia ?? [])
    // La tarde que es la ÚNICA que encaja después de la mañana de un día posterior (tras el Vaticano,
    // "vaticano_trastevere") se reserva: su ancla no se gasta antes (Trastevere en "trastevere_a_fondo").
    const reservedAnchors = new Set(
      [...morningOf.entries()]
        .filter(([number]) => number > day.dayNumber)
        .map(([, block]) => (destData.afternoon_flows ?? []).filter((other) => !usedAfternoons.has(other.id) && !excludedInTrip.has(other.id) && (other.encaja_despues_de ?? []).includes(block.acaba_en) && !(block.excluye_tardes_mismo_dia ?? []).includes(other.id) && !(anchorOf(other) && morningAnchors.has(anchorOf(other)))))
        .filter((fits) => fits.length === 1)
        .map(([only]) => anchorOf(only))
        .filter(Boolean),
    )
    // ¿El ancla ya salió otro día? Solo lo ya visto: la que va en la mañana de un día posterior no se
    // adelanta de paso (arrastraría lo que esa mañana hace alrededor, como Navona con el Panteón).
    const anchorElsewhere = (name) => Boolean(name) && seen.has(name)
    const otherMorningNames = new Set(
      [...morningOf.entries()].filter(([number]) => number > day.dayNumber).flatMap(([, block]) => block.paradas.map((stop) => stop.lugar)),
    )
    const endsAt = morningBlock?.acaba_en ?? null
    // El Free Tour acaba en el centro (Piazza Navona): después, las tardes que encajan tras "free_tour"
    // y, si no queda ninguna, las que encajan tras "centro".
    const fitsAfter = (block) => {
      const after = block.encaja_despues_de ?? []
      return !endsAt || day.halfDayExcursion || after.includes(endsAt)
    }
    // Sin ninguna tarde que diga encajar con esta mañana (Trastevere, el Aventino), la que empieza a
    // 20 min o menos andando de donde acaba.
    const morningEnd = morningStops.at(-1)?.place ?? null
    const anyFits = (destData.afternoon_flows ?? []).some((block) => (block.encaja_despues_de ?? []).includes(endsAt === 'free_tour' ? FREE_TOUR_ENDS_IN : endsAt) || (block.encaja_despues_de ?? []).includes(endsAt))
    const startsNear = (block) => {
      const first = placeByName.get(block.paradas[0]?.lugar)
      return Boolean(morningEnd?.coordinates && first?.coordinates) && (travel.leg(morningEnd.end_coordinates ?? morningEnd.coordinates, first.coordinates)?.minutes ?? Infinity) <= nearLimit
    }
    // A 20 min; si ninguna, a 30 (Testaccio queda apartado de todo).
    const nearLimit = NEAR_START_TIERS.find((limit) => {
      const probe = (block) => {
        const first = placeByName.get(block.paradas[0]?.lugar)
        return Boolean(morningEnd?.coordinates && first?.coordinates) && (travel.leg(morningEnd.end_coordinates ?? morningEnd.coordinates, first.coordinates)?.minutes ?? Infinity) <= limit
      }
      return (destData.afternoon_flows ?? []).some((block) => !usedAfternoons.has(block.id) && !excludedInTrip.has(block.id) && probe(block))
    }) ?? NEAR_START_TIERS[0]
    const fitsAfterFallback = (block) =>
      (endsAt === 'free_tour' && (block.encaja_despues_de ?? []).includes(FREE_TOUR_ENDS_IN)) || (Boolean(endsAt) && !anyFits && startsNear(block))

    // Lo mejor primero (decisión del 2026-09-26): en viajes de 3+ días, una joya que si no saldría tarde
    // (después del día 3, o solo el último día) se adelanta a la tarde de un día temprano, aunque su
    // mañana vaya otro día (el Panteón del centro barroco, detrás del Coliseo).
    const earlyDay = contentDays >= 3 && day.dayNumber <= earlyLimit
    // Y solo si la mañana de la que se toma (la del centro, el día 5) sigue siendo una mañana: al menos 3
    // paradas propias sin lo que se lleva la tarde. Si no, se deja; la reparación prueba a mover esa mañana.
    const leftInMorning = (block) => {
      const morning = [...morningOf.entries()].find(([number, other]) => number > day.dayNumber && other.paradas.some((stop) => stop.rol !== 'de_paso' && block.paradas.some((mine) => mine.lugar === stop.lugar)))
      // El último día puede quedarse corto (Trevi y España al amanecer y el resto libre): no cuenta.
      if (!morning || morning[0] === contentDays) return Infinity
      const taken = new Set(block.paradas.map((stop) => stop.lugar))
      return morning[1].paradas.filter((stop) => stop.rol !== 'de_paso' && !taken.has(stop.lugar) && !seen.has(stop.lugar)).length
    }
    const lateJoya = (name) => earlyDay && lateJoyas.has(name) && !seen.has(name) && !morningPlaces.some((place) => place.name === name)
    const takesLateJoya = (block) => block.paradas.some((stop) => stop.rol !== 'de_paso' && lateJoya(stop.lugar)) && leftInMorning(block) >= EARLY_JOYA_MORNING_LEFT
    const candidates = (destData.afternoon_flows ?? [])
      .filter((block) => !usedAfternoons.has(block.id) && !excludedInTrip.has(block.id) && !sameDayExcluded.has(block.id) && !bans.has(`${day.dayNumber}:${block.id}`))
      .filter((block) => fitsAfter(block) || fitsAfterFallback(block))
      .filter((block) => (block.minimo_dias_viaje ?? 0) <= contentDays || blockHasPool(block))
      .filter((block) => {
        // La tarde cuya ancla es la de una mañana (el Vaticano por la tarde): solo si esa mañana no va.
        const anchor = anchorOf(block)
        return !anchor || !allMorningAnchors.has(anchor) || !morningAnchors.has(anchor)
      })
      // Un ancla ya vista otro día solo vale si se ve desde la calle: entonces va de paso (decisión del
      // 2026-09-26). Si no, la tarde no va. La que es de la mañana de otro día, tampoco.
      .filter((block) => !closedThatDay(anchorOf(block), day) && (!otherMorningNames.has(anchorOf(block)) || (lateJoya(anchorOf(block)) && takesLateJoya(block))) && (!anchorElsewhere(anchorOf(block)) || fromStreet(placeByName.get(anchorOf(block)))))
      .map((block, order) => {
        const anchor = anchorOf(block)
        const newEssentials = block.paradas.filter((stop) => placeByName.get(stop.lugar)?.level === 1 && !seen.has(stop.lugar) && !morningPlaces.some((place) => place.name === stop.lugar)).length
        const repeats = block.paradas.filter((stop) => seen.has(stop.lugar)).length
        // Última oportunidad: un imprescindible que no sale en ninguna otra tarde que quede (el Altar solo
        // está en "campidoglio_ghetto") ni en la mañana de otro día.
        const lastChance = block.paradas.filter((stop) => stop.rol !== 'de_paso' && placeByName.get(stop.lugar)?.level === 1 && !seen.has(stop.lugar) && !otherMorningNames.has(stop.lugar) && !(destData.afternoon_flows ?? []).some((other) => other.id !== block.id && !usedAfternoons.has(other.id) && !excludedInTrip.has(other.id) && other.paradas.some((o) => o.lugar === stop.lugar && o.rol !== 'de_paso'))).length
        // Lo que va en la mañana de OTRO día no se adelanta a esta tarde: esa mañana se quedaría vacía.
        const stolen = block.paradas.filter((stop) => stop.rol !== 'de_paso' && otherMorningNames.has(stop.lugar)).length + 3 * block.paradas.filter((stop) => reservedAnchors.has(stop.lugar) && anchorOf(block) !== stop.lugar).length + 3 * Number(reservedAnchors.has(anchorOf(block)))
        const joyaAnchor = anchor && joyaNames.has(anchor) && !seen.has(anchor) ? 20 : 0
        const earlyJoyas = takesLateJoya(block) ? block.paradas.filter((stop) => stop.rol !== 'de_paso' && lateJoya(stop.lugar)).length : 0
        return { block, order, score: 100 * Number(fitsAfter(block)) + 50 * Number(blockHasPool(block)) + joyaAnchor + 3 * newEssentials + 5 * lastChance + 20 * blockMatches(block) - repeats - 10 * stolen + EARLY_JOYA_BONUS * earlyJoyas }
      })
      .sort((a, b) => b.score - a.score || a.order - b.order)

    let chosen = null
    // Un bloque reversible se prueba en los dos sentidos (el Panteón al final cierra a las 16:00 los
    // sábados): se queda el que mejor sale; a igualdad, el que empieza más cerca.
    const orientations = candidates.flatMap(({ block: original, score }) => {
      const near = oriented(original, morningStops.at(-1)?.place ?? null)
      if (!original.reversible) return [{ block: near, score }]
      const other = near.reversed ? original : { ...original, paradas: [...original.paradas].reverse(), reversed: true }
      return [{ block: near, score }, { block: other, score: score - ORIENTATION_FAR_PENALTY }]
    })
    // Lo que la mañana no llega a hacer antes de comer (el Pincio y Popolo tras la Borghese) puede salir en
    // la tarde si su bloque lo lleva: no cuenta como visto por la mañana.
    const morningOverflow = morningBlock && !day.halfDayExcursion
      ? new Set(schedule(day, morningUnits, null, { morning: true }).dropped.filter(({ reason }) => reason === 'morning_overflow').flatMap(({ unit }) => unit.places.map((place) => place.name)))
      : new Set()
    for (const { block, score } of orientations) {
      const blockNames = new Set(block.paradas.map((stop) => stop.lugar))
      const movedToAfternoon = (name) => morningOverflow.has(name) && blockNames.has(name)
      const morningPlacesHere = morningPlaces.filter((place) => !movedToAfternoon(place.name))
      const morningStopsHere = morningStops.filter((stop) => !movedToAfternoon(stop.name))
      const morningUnitsHere = morningUnits.filter((unit) => !unit.places.some((place) => movedToAfternoon(place.name)))
      const anchor = anchorOf(block)
      const anchorPassBy = anchor && anchorElsewhere(anchor) && fromStreet(placeByName.get(anchor)) ? new Set([anchor]) : new Set()
      const afternoonStops = trimForPace(stopsOf(block, day, morningPlacesHere, anchorPassBy), morningStopsHere)
      if (anchor && !afternoonStops.some((stop) => stop.name === anchor)) continue
      // Con el ancla de paso, la tarde tiene que traer al menos dos paradas nuevas (el Pincio y Popolo).
      if (anchorPassBy.size > 0 && afternoonStops.filter((stop) => stop.role !== 'de_paso').length < ANCHOR_PASS_BY_MIN_NEW) continue
      const dinner = dinnerFor(block, afternoonStops.at(-1)?.place.coordinates ?? null)
      const { units, result } = withSunsetFilled(day, morningUnitsHere, unitsOf(afternoonStops, block, 'tarde', day), dinner)
      // El ancla tiene que caber; si no, otra tarde. Salvo que sea de "antes del atardecer" y se haya
      // saltado para llegar al mirador a tiempo (Trastevere en invierno: se cena allí igualmente).
      const anchorSkippedForSunset = afternoonStops.some((stop) => stop.name === anchor && stop.beforeSunset) && result.visits.some((visit) => visit.place.sunset != null)
      if (anchor && !anchorSkippedForSunset && !result.kept.some((unit) => unit.places.some((place) => place.name === anchor))) continue
      // La mejor tarde es la que encaja, no se queda a medias y no deja horas muertas antes de cenar
      // (ya alargada de camino a la cena).
      const candidate = { block, units, dinner, result, afternoonStops, passByAnchor: anchorPassBy.size > 0 ? anchor : null }
      fillWait(day, candidate, otherMorningNames)
      extendTail(day, candidate, otherMorningNames)
      const idle = Math.max(candidate.result.idleBeforeDinner ?? 0, longestWait(candidate.result))
      candidate.value = score - 5 * lossOf(result) - lateDinnerCost(candidate.result) / 10 - (idle > DEAD_HOURS_MINUTES ? 20 + (idle - DEAD_HOURS_MINUTES) / 5 : 0)
      if (!chosen || candidate.value > chosen.value) chosen = candidate
    }

    if (!chosen) {
      // Medio día sin tipo: se improvisa con lo más cercano que falte (reserva) y el semáforo lo marca.
      untypedHalves++
      const from = morningPlaces.at(-1)?.coordinates ?? destData.zones?.centro_historico?.center ?? null
      const maxStops = UNTYPED_MAX_STOPS[mode.id] ?? 3
      const anchorsLeft = new Set((destData.afternoon_flows ?? []).filter((block) => !usedAfternoons.has(block.id)).map(anchorOf).filter(Boolean))
      const pool = allUnits
        .flatMap((unit) => unit.places)
        .filter((place) => !seen.has(place.name) && !morningPlaces.some((other) => other.name === place.name) && !plannedNames.has(place.name) && (place.level ?? 3) <= 2)
        .filter((place) => !place.group && !anchorsLeft.has(place.name) && !place.isFreeTour)
        .filter((place) => !(isPaidMuseum(place) && paidMuseums >= museumQuota) && !closedThatDay(place.name, day))
      // De cerca en cerca (15 min) desde cada primer salto posible (hasta 30 min): la cadena más larga.
      const chainFrom = (first) => {
        const chain = [first]
        while (chain.length < maxStops) {
          const cursor = chain.at(-1).coordinates
          const next = pool
            .filter((place) => !chain.includes(place))
            .map((place) => ({ place, walk: travel.leg(cursor, place.coordinates)?.minutes ?? Infinity }))
            .filter((item) => item.walk <= UNTYPED_MAX_WALK)
            .sort((a, b) => a.walk - b.walk)[0]
          if (!next) break
          chain.push(next.place)
        }
        return chain
      }
      const firstHops = from ? pool.map((place) => ({ place, walk: travel.leg(from, place.coordinates)?.minutes ?? Infinity })).filter((item) => item.walk <= UNTYPED_FIRST_HOP) : []
      const improvised =
        firstHops
          .map(({ place, walk }) => ({ chain: chainFrom(place), walk }))
          .sort((a, b) => b.chain.length - a.chain.length || a.walk - b.walk)[0]?.chain ?? []
      const pseudo = { id: `sin_tipo_${day.dayNumber}`, paradas: [] }
      const stops = improvised.map((place) => ({ name: place.name, role: 'parada', place }))
      // Sin bloque no hay orden curado: se prueba cada orden (son 4 como mucho) y se queda el que menos anda.
      const improvisedUnits = unitsOf(stops, pseudo, 'tarde', day).map((unit) => ({ ...unit, curatedIndex: null }))
      const dinner = dinnerFor(null, improvised.at(-1)?.coordinates ?? from)
      let bestOrder = null
      for (const order of permutations(improvisedUnits)) {
        const units = [...morningUnits, ...order]
        const result = schedule(day, units, dinner, { morning: !day.halfDayExcursion })
        if (!bestOrder || result.dropped.length < bestOrder.result.dropped.length || (result.dropped.length === bestOrder.result.dropped.length && result.walkMinutes + result.idleMinutes < bestOrder.result.walkMinutes + bestOrder.result.idleMinutes)) bestOrder = { units, result }
      }
      chosen = { block: null, units: bestOrder.units, dinner, result: bestOrder.result, afternoonStops: stops }
      fillWait(day, chosen, otherMorningNames)
      extendTail(day, chosen, otherMorningNames)
      // Con lo añadido, otra vez el orden que menos anda (sin bloque, no hay orden que respetar).
      const free = chosen.result.kept.filter((unit) => unit.slot === 'tarde' && unit.curatedIndex == null)
      const fixed = chosen.result.kept.filter((unit) => !free.includes(unit))
      if (free.length > 1) {
        const waitLimit = Math.max(mode.gapTolerance, longestWait(chosen.result))
        const good = (result) => result.dropped.length === 0 && longestWait(result) <= waitLimit
        const run = (order) => schedule(day, [...fixed, ...order], dinner, { morning: !day.halfDayExcursion })
        let best = chosen.result
        let bestOrder = free
        if (free.length <= UNTYPED_REORDER_MAX) {
          for (const order of permutations(free)) {
            const result = run(order)
            if (good(result) && result.meters < best.meters) {
              best = result
              bestOrder = order
            }
          }
        } else {
          // Más paradas: 2-opt (dar la vuelta a un tramo) mientras mejore.
          for (let improved = true; improved; ) {
            improved = false
            for (let i = 0; i < bestOrder.length - 1 && !improved; i++) {
              for (let j = i + 1; j < bestOrder.length && !improved; j++) {
                const order = [...bestOrder.slice(0, i), ...bestOrder.slice(i, j + 1).reverse(), ...bestOrder.slice(j + 1)]
                const result = run(order)
                if (good(result) && result.meters < best.meters) {
                  best = result
                  bestOrder = order
                  improved = true
                }
              }
            }
          }
        }
        if (best !== chosen.result) chosen.result = { ...best, dropped: chosen.result.dropped }
      }
    }

    experienceOnTheWay(day, chosen, morningBlock, otherMorningNames)
    polishExtras(day, chosen)
    const normalLunch = lunchBackToNormal(day, chosen.result, chosen.dinner)
    if (normalLunch) {
      chosen.units = normalLunch.list
      chosen.result = normalLunch.result
    }
    if (!morningBlock && !day.halfDayExcursion) untypedHalves++
    if (chosen.block) {
      usedAfternoons.add(chosen.block.id)
      for (const id of chosen.block.excluye ?? []) excludedInTrip.add(id)
    }
    // Lo de un grupo que no ha cabido (el Castillo por dentro) se ve por fuera desde su compañero (el Puente).
    for (const { unit } of chosen.result.dropped) {
      for (const place of unit.places) {
        if (!place.group || unit.role === 'de_paso') continue
        const partner = chosen.result.visits.find((visit) => visit.place.group === place.group)
        if (partner) partner.place = { ...partner.place, outsideOf: [...new Set([...(partner.place.outsideOf ?? []), place.name])] }
      }
    }
    // Lo de un bloque que no ha cabido ese día (sin madrugar: ya no se madruga por él) va a "No te dio
    // tiempo", salvo que salga otro día.
    for (const { unit } of chosen.result.dropped ?? []) {
      if (!unit.blockId || String(unit.blockId).startsWith('sin_tipo') || unit.role === 'de_paso' || unit.role === 'extra') continue
      for (const place of unit.places) if (!place.passThrough && !place.isFreeTour) droppedForTime.add(place.name)
    }
    // Lo que se ha visto de verdad (lo que el programador mantiene) cuenta para el resto del viaje.
    for (const unit of chosen.result.kept) {
      for (const place of unit.places) {
        // Lo que hoy solo se ve de paso y tiene su visita en la mañana de otro día (la Plaza de España,
        // de paso camino del Pincio) no cuenta como visto: esa mañana la sigue haciendo entera.
        if (place.passThrough && otherMorningNames.has(place.name)) continue
        seen.add(place.name)
        if (isPaidMuseum(placeByName.get(place.name)) && unit.poolIndex == null) paidMuseums++
      }
    }
    const lateDinner = chosen.result.kept.some((unit) => unit.places.some((place) => place.sunset != null && place.sunset >= LATE_SUNSET_MINUTES))
    blockSummary.push({ dayNumber: day.dayNumber, morning: morningBlock?.id ?? (day.halfDayExcursion ? `media_jornada:${day.halfDayExcursion.id}` : null), afternoon: chosen.block?.id ?? null, lateDinner })
    days.push({
      ...day,
      hours: hoursOf(day),
      units: chosen.result.kept,
      schedule: chosen.result,
      lunchZone: null,
      dinnerZone: chosen.dinner?.id ?? null,
      dinnerPlaceZone: chosen.dinner?.placeZone ?? null,
      dinnerCoords: chosen.dinner?.coordinates ?? null,
      // Las nocturnas de la tarde (su lista); sin tarde tipo, las de siempre.
      nightNames: chosen.block ? chosen.block.nocturnas ?? [] : null,
      blocks: [
        ...(morningBlock ? [{ id: morningBlock.id, slot: 'manana', label: morningBlock.nombre }] : day.halfDayExcursion ? [] : [{ id: null, slot: 'manana', label: 'Medio día sin tipo' }]),
        ...(chosen.block ? [{ id: chosen.block.id, slot: 'tarde', label: chosen.block.nombre, passByAnchor: chosen.passByAnchor ?? null }] : [{ id: null, slot: 'tarde', label: 'Medio día sin tipo' }]),
      ],
      untypedAfternoon: !chosen.block,
      // Bloques cuyo orden no es el del JSON (ajustes B.8: tiene que ser 0; el semáforo lo marca en rojo).
      reorderedBlocks: reorderedBlocks([morningBlock, chosen.block].filter(Boolean), chosen.result),
      curated: null,
    })
  }

  /**
   * Lo del pool y los imprescindibles que no han entrado en ningún bloque: se meten en el día y en el
   * sitio donde menos se ande (de camino: el Altar de la Patria al salir de los Foros). Puede caerse
   * algo "de paso" o añadido para hacerle sitio; nada del bloque ni otro imprescindible.
   */
  /** El día en que ya va algo del grupo del lugar (Navona va con el Panteón): el rescate solo va ahí. */
  const groupDay = (place) => (place.group ? days.find((d) => d.schedule && d.units.some((unit) => unit.places.some((p) => p.group === place.group && p.name !== place.name))) ?? null : null)
  const unstretched = (list) => list.map((unit) => (unit.places.some((place) => place.stretchBase != null) ? { ...unit, places: unit.places.map(({ stretchBase, ...place }) => (stretchBase != null ? { ...place, duration_minutes: stretchBase } : place)) } : unit))
  const rescue = (name, role) => {
    const place = placeByName.get(name)
    if (!place || seen.has(name)) return true
    // Con su grupo del JSON, en su orden (la Plaza Venecia y luego el Altar): lo que va junto, junto.
    const members = place.group
      ? (destData.places ?? []).filter((other) => other.group === place.group && !seen.has(other.name)).sort((x, y) => (x.group_order ?? 0) - (y.group_order ?? 0))
      : [place]
    const scheduled = placesForScheduler({ id: place.group ?? name, places: members }, destData, freeTourTime)
    const extra = { id: `${role}:${name}`, group: place.group ?? null, places: scheduled, slot: 'tarde', blockId: role, role, dropRank: DROP_RANK.pool, priority: role === 'pool' ? PRIORITY.POOL : PRIORITY.ESSENTIAL, curatedIndex: null, poolIndex: inPool(name) ? poolNames.indexOf(name) : null }
    // Para hacer sitio solo se caen rellenos y lo de paso suelto; lo de paso con grupo (la Plaza Venecia, del
    // Altar) no: rompería el grupo.
    const cheap = (unit) => (unit.role === 'extra' || (unit.role === 'de_paso' && !unit.places.some((p) => p.group))) && !unit.places.some((p) => p.level === 1 || joyaNames.has(p.name))
    let best = null
    const partnerDay = groupDay(place)
    for (const day of days.filter((d) => d.schedule && !closedThatDay(name, d) && (!partnerDay || d === partnerDay))) {
      if (isPaidMuseum(place) && !inPool(name) && paidMuseums >= museumQuota) break
      // Nunca dentro de la mañana del bloque: al acabarla o por la tarde.
      const morningEnd = day.units.map((unit) => unit.slot).lastIndexOf('manana') + 1
      // Si su grupo ya va ese día (la Plaza de San Pedro, el miércoles), justo detrás de él: nada en medio.
      const groupAt = place.group ? day.units.map((unit) => unit.places.some((p) => p.group === place.group)).lastIndexOf(true) : -1
      for (let at = morningEnd; at <= day.units.length; at++) {
        if (groupAt >= 0 && at !== Math.max(groupAt + 1, morningEnd)) continue
        if (splitsGroup(day.units, at)) continue
        // De camino: 15 min de desvío como mucho entre lo de antes y lo de después.
        const prev = day.units[at - 1]?.places.at(-1)
        const next = day.units[at]?.places[0]
        const leg = (x, y) => (x?.coordinates && y?.coordinates ? travel.leg(x.end_coordinates ?? x.coordinates, y.coordinates)?.minutes ?? Infinity : 0)
        if (leg(prev, members[0]) + leg(members.at(-1), next) - leg(prev, next) > RESCUE_MAX_DETOUR) continue
        const slot = day.units[at]?.slot ?? 'tarde'
        // Lo alargado para esperar al atardecer es tiempo libre: el rescate puede usarlo.
        const units = [...unstretched(day.units).slice(0, at), { ...extra, slot }, ...unstretched(day.units).slice(at)]
        // Como un bloque: lo que por el horario ya no llega va de paso (el Tempietto, que cierra a las 18:00).
        const result = scheduleBlock(day, [], units, day.dinnerCoords ? { coordinates: day.dinnerCoords } : null)
        // Entero: si el grupo pierde a alguien por el camino, no vale.
        const keptExtra = result.kept.find((unit) => unit.id === extra.id)
        if (!keptExtra || keptExtra.places.length !== members.length || !result.dropped.every(({ unit }) => cheap(unit))) continue
        const cost = result.walkMinutes + result.idleMinutes + 30 * result.dropped.length
        if (!best || cost < best.cost) best = { day, result, cost }
      }
    }
    if (!best) return false
    // Lo rescatado ya no está entre lo que se cayó.
    const rescued = new Set(members.map((member) => member.name))
    const stillDropped = best.day.schedule.dropped.filter(({ unit }) => !unit.places.some((p) => rescued.has(p.name)))
    Object.assign(best.day, { units: best.result.kept, schedule: { ...best.result, dropped: [...stillDropped, ...best.result.dropped] } })
    for (const member of members) seen.add(member.name)
    return true
  }
  /**
   * Un imprescindible que se ve desde la calle (la Plaza de España, el Altar de la Patria) nunca se queda
   * fuera (ajustes B.5): si no cabe su visita, entra de paso, 15 min, en el bloque que pase más cerca
   * (desde su punto de paso si lo tiene: `pass_by`), sin que se caiga nada del bloque.
   */
  const rescueOutside = (place, { upToDay = null } = {}) => {
    // `upToDay`: lo mejor primero, una joya que ya sale pero tarde (Trevi el último día) entra también de
    // paso en un día temprano.
    if (seen.has(place.name) && upToDay === null) return true
    const fromStreet = place.type === 'exterior' || place.pass_by || place.visible_from_outside
    if (!fromStreet) return false
    const coordinates = place.pass_by?.coordinates ?? place.coordinates
    const minutes = place.pass_by?.minutes ?? OUTSIDE_ESSENTIAL_MINUTES
    const unit = {
      id: `de paso:${place.name}`,
      group: null,
      // Lo que se ve desde ese mismo paso (la Plaza Venecia, desde el Altar) cuenta como visto por fuera.
      places: [{ name: place.name, coordinates, duration_minutes: minutes, type: 'exterior', passThrough: true, tags: place.tags ?? [], zone: place.zone, level: 1, group: place.group, wikipedia_title: place.wikipedia_title, ...(place.pass_by?.includes?.length ? { outsideOf: place.pass_by.includes } : {}) }],
      slot: 'tarde', blockId: 'de_paso', role: 'de_paso', dropRank: DROP_RANK.extra, priority: PRIORITY.ESSENTIAL, curatedIndex: null, poolIndex: null,
    }
    // Para hacerle sitio se recorta en este orden (ajustes de bloques, 2 días desde el sábado): 1) el tiempo
    // libre (los rellenos); 2) el callejeo de un bloque (un barrio, a la mitad, 20 min como mínimo); 3) UNA
    // parada de paso de menos peso (sin grupo). Nunca el orden de un bloque ni su parada principal.
    const isFiller = (other) => other.role === 'extra' && !other.places.some((p) => p.level === 1)
    const isLightPass = (other) => other.role === 'de_paso' && !other.places.some((p) => p.group || p.level === 1)
    const shortenCallejeo = (list) =>
      list.map((other) =>
        other.role !== 'de_paso' && other.places.some((p) => (p.tags ?? []).includes('barrio') && (p.duration_minutes ?? 0) > CALLEJEO_MIN_MINUTES)
          ? { ...other, places: other.places.map((p) => ((p.tags ?? []).includes('barrio') ? { ...p, duration_minutes: Math.max(CALLEJEO_MIN_MINUTES, Math.round((p.duration_minutes ?? 45) / 2 / 5) * 5) } : p)) }
          : other,
      )
    const stages = [
      { transform: (list) => list, allows: (dropped) => dropped.every(({ unit: other }) => isFiller(other)) },
      { transform: shortenCallejeo, allows: (dropped) => dropped.every(({ unit: other }) => isFiller(other)) },
      { transform: shortenCallejeo, allows: (dropped) => dropped.every(({ unit: other }) => isFiller(other) || isLightPass(other)) && dropped.filter(({ unit: other }) => isLightPass(other)).length <= 1 },
      // Para adelantar una joya (Trevi de paso el día 1, no el último): lo de paso secundario que haga falta.
      ...(upToDay !== null ? [{ transform: shortenCallejeo, allows: (dropped) => dropped.every(({ unit: other }) => isFiller(other) || isLightPass(other)) }] : []),
    ]
    const partnerDay = groupDay(place)
    for (const stage of stages) {
      const best = tryOutsideStage(stage, partnerDay, unit, coordinates, place, upToDay)
      if (!best) continue
      const stillDropped = best.day.schedule.dropped.filter(({ unit: other }) => !other.places.some((p) => p.name === place.name))
      Object.assign(best.day, { units: best.result.kept, schedule: { ...best.result, dropped: [...stillDropped, ...best.result.dropped] } })
      rescueDetours.set(place.name, best.detour)
      seen.add(place.name)
      for (const name of place.pass_by?.includes ?? []) seen.add(name)
      return true
    }
    return false
  }
  function tryOutsideStage(stage, partnerDay, unit, coordinates, place, upToDay = null) {
    let best = null
    for (const day of days.filter((d) => d.schedule && (!partnerDay || d === partnerDay) && (upToDay === null || d.dayNumber <= upToDay))) {
      if (upToDay !== null && day.schedule.visits.some((visit) => visit.place.name === place.name)) continue
      // Con su grupo ese día, pegado a él.
      const groupAt = place.group ? day.units.map((unit) => unit.places.some((p) => p.group === place.group)).lastIndexOf(true) : -1
      for (let at = 1; at <= day.units.length; at++) {
        if (groupAt >= 0 && at !== groupAt + 1) continue
        if (splitsGroup(day.units, at)) continue
        const prev = day.units[at - 1]?.places.at(-1)
        const next = day.units[at]?.places[0]
        const leg = (x, y) => (x?.coordinates && y?.coordinates ? travel.leg(x.end_coordinates ?? x.coordinates, y ? y.coordinates : null)?.minutes ?? Infinity : 0)
        const detour = leg(prev, { coordinates }) + (next ? leg({ coordinates }, next) - leg(prev, next) : 0)
        if (detour > OUTSIDE_ESSENTIAL_MAX_DETOUR) continue
        const base = stage.transform(unstretched(day.units))
        const units = [...base.slice(0, at), { ...unit, slot: day.units[at]?.slot ?? 'tarde' }, ...base.slice(at)]
        // Como un bloque: lo que por el horario ya no llega va de paso (el Tempietto, que cierra a las 18:00).
        const result = scheduleBlock(day, [], units, day.dinnerCoords ? { coordinates: day.dinnerCoords } : null)
        if (!result.kept.some((other) => other.id === unit.id) || !stage.allows(result.dropped)) continue
        if (!best || detour < best.detour) best = { day, result, detour }
      }
    }
    return best
  }
  for (const name of poolNames) {
    if (rescue(name, 'pool')) continue
    // Con su motivo: fuera de temporada todo el viaje, cerrado todos los días o sin sitio.
    const place = placeByName.get(name)
    const cityDays = days.filter((day) => !day.isBlank && !day.isExcursion)
    const outOfSeason = place && cityDays.every((day) => !availableForTrip(place.available, calendar, hoursOf(day).dateIso, true))
    const closedEvery = place && cityDays.every((day) => closedOnDay(place, hoursOf(day).weekday, calendar.hasDates ? hoursOf(day).dateIso : null))
    unplacedPool.push({
      unitId: name,
      name,
      reason: outOfSeason ? 'out_of_season' : closedEvery ? 'closed_every_day' : 'no_room',
      closedOn: place?.closed_on ?? [],
      ...(outOfSeason ? { available: Array.isArray(place.available) ? place.available[0] : place.available } : {}),
    })
  }
  for (const place of destData.places ?? []) {
    if (place.level !== 1 || tourCovers.has(place.name) || seen.has(place.name)) continue
    // Lo que se ve desde la calle (la Plaza de España, Trevi, Navona) entra de paso, 15 min (B.5); lo de
    // dentro (el Panteón, la Basílica), con su visita, de camino.
    // Una joya (el Panteón) va siempre por dentro si cabe.
    const fromStreet = place.tier !== 'joya' && (place.type === 'exterior' || place.pass_by || place.visible_from_outside)
    if (fromStreet ? !rescueOutside(place) : !rescue(place.name, 'imprescindible')) {
      if (fromStreet) rescue(place.name, 'imprescindible')
      else rescueOutside(place)
    }
  }

  // Lo mejor primero (decisión del 2026-09-26): una joya que se ve desde la calle (la Fontana de Trevi) y
  // que solo sale después del día 3 o el último día entra también de paso en un día temprano, de camino.
  if (contentDays >= 3) {
    const firstDayOf = (name) => days.find((day) => (day.schedule?.visits ?? []).some((visit) => visit.place.name === name || (visit.place.outsideOf ?? []).includes(name)))?.dayNumber ?? null
    for (const name of joyaNames) {
      const place = placeByName.get(name)
      if (!place || tourCovers.has(name) || !fromStreet(place)) continue
      const first = firstDayOf(name)
      if (first !== null && first <= earlyLimit && first < contentDays) continue
      rescueOutside(place, { upToDay: earlyLimit })
    }
  }

  // El rescate puede haber acortado una comida para meter un imprescindible; si con el día ya montado
  // cabe con la comida normal (sin algún relleno), vuelve a su duración.
  for (const day of days.filter((d) => d.schedule?.shortenedLunch?.length)) {
    const normalLunch = lunchBackToNormal(day, day.schedule, day.dinnerCoords ? { coordinates: day.dinnerCoords } : null)
    if (normalLunch) Object.assign(day, { units: normalLunch.list, schedule: normalLunch.result })
  }

  // Miradores del atardecer que caen de noche (decisión del 2026-09-26: el Janículo a las 19:15 en enero).
  // Más de 30 min después de la puesta de sol: se adelanta quitando lo de paso secundario de delante, sin
  // tocar el orden del bloque; si ni así llega, se presenta como vistas de la ciudad iluminada (nightView).
  // Solo sobre el plan ya elegido (planBlockTrip lo llama al final): dentro de cada intento cambiaba el
  // coste y el reparto cambiaba de tarde (4 días en diciembre perdía la Galería Borghese por el Pincio).
  const settleMiradores = () => days.filter((d) => d.schedule).forEach((day) => {
    const sunset = hoursOf(day).sunset
    if (sunset == null) return
    const roleOf = (visit) => day.schedule.kept.find((unit) => unit.id === visit.unitId)?.role
    const late = day.schedule.visits.find((visit) => roleOf(visit) === 'atardecer' && visit.start > sunset + MIRADOR_LATE_MINUTES)
    if (!late) return
    const at = day.units.findIndex((unit) => unit.id === late.unitId)
    const expendable = day.units.slice(0, Math.max(0, at)).filter((unit) => unit.slot === 'tarde' && unit.role === 'de_paso' && !unit.places.some((place) => place.level === 1 || place.group))
    let list = day.units
    let fixed = null
    for (const unit of [...expendable].reverse()) {
      list = list.filter((other) => other !== unit)
      const result = schedule(day, list, day.dinnerCoords ? { coordinates: day.dinnerCoords } : null, { morning: !day.halfDayExcursion })
      const visit = result.visits.find((candidate) => candidate.unitId === late.unitId)
      if (visit && visit.start <= sunset + MIRADOR_LATE_MINUTES && result.dropped.every(({ unit: other }) => other.role === 'extra' || other.role === 'de_paso')) {
        fixed = { list, result }
        break
      }
    }
    if (fixed) {
      Object.assign(day, { units: fixed.list, schedule: { ...fixed.result, dropped: day.schedule.dropped } })
      day.longWalks = longWalksOf(day)
    } else late.place = { ...late.place, nightView: true }
  })

  // Traslados largos (más de 25 min andando), con el día ya montado: lo de paso que ha metido el rescate
  // también cuenta (decisión del 2026-09-26). No son un fallo: se dicen, andando primero y con la alternativa.
  for (const day of days.filter((d) => d.schedule)) day.longWalks = longWalksOf(day)

  // Joyas e imprescindibles que no han salido en ningún día.
  // Lo de un grupo que no se visita en todo el viaje se ve por fuera desde su compañero (el Castillo de
  // Sant'Angelo desde el Puente: una visita grande al día, y ese día ya es el Vaticano).
  for (const day of days.filter((d) => d.schedule)) {
    for (const visit of day.schedule.visits) {
      const group = visit.place.group
      if (!group || visit.place.passBy) continue
      const partners = (destData.places ?? []).filter((other) => other.group === group && other.name !== visit.place.name && !seen.has(other.name) && other.type === 'interior')
      if (partners.length > 0) visit.place = { ...visit.place, outsideOf: [...new Set([...(visit.place.outsideOf ?? []), ...partners.map((other) => other.name)])] }
    }
  }

  const unplacedEssentials = (destData.places ?? [])
    .filter((place) => place.level === 1 && !seen.has(place.name) && !tourCovers.has(place.name))
    .map((place) => ({ unitId: place.name, name: place.name, reason: 'no_room' }))

  // Lo que se cayó por tiempo y no ha salido en ningún otro día (ni está ya en otra lista).
  const listed = new Set([...unplacedPool.map((item) => item.name), ...unplacedEssentials.map((item) => item.name)])
  const notEnoughTime = [...droppedForTime].filter((name) => !seen.has(name) && !tourCovers.has(name) && !listed.has(name)).map((name) => ({ name, reason: 'no_time' }))

  return {
    mode,
    days,
    joyaNames: [...joyaNames],
    // Las mañanas fijadas por cierre (el Vaticano el día 3 en Pascua): la reparación no las mueve.
    pinnedMornings: [...pinnedDayOf.entries()].filter(([id, dayNumber]) => morningOf.get(dayNumber)?.id === id).map(([id, dayNumber]) => `${dayNumber}:${id}`),
    rescueDetours: Object.fromEntries(rescueDetours),
    notEnoughTime,
    coreDays: destData.destination_config?.core_days ?? null,
    placedDay: new Map(),
    unplacedPool,
    unplacedEssentials,
    quotaMisses: [],
    experienceRange: null,
    experienceCounts: {},
    coveredByFreeTour: hasFreeTour ? [{ unitId: tour?.name, names: [...tourCovers], dayNumber: [...morningOf.entries()].find(([, block]) => isTourMorning(block))?.[0] ?? 1 }] : [],
    movedForJoya: [],
    blockSummary,
    untypedHalves,
    calendar: { hasDates: calendar.hasDates, month: calendar.month, season: calendar.season, referenceIso: calendar.referenceIso },
    settleMiradores,
  }
}
