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
import { closedOnDay } from './openingHours.js'
import { sunsetFor } from './sunset.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'
import { lunchSpots } from './lunchSpots.js'
import { tripDays } from './tripSkeleton.js'
import { availableForTrip } from './availability.js'
import { blockedByRedundancy, breaksOneBigVisit, isPaidMuseum, paidMuseumQuota } from './localRules.js'

/** Lo que dura pasar por un sitio "de paso". */
const PASS_THROUGH_MINUTES = 10
/** Prioridad para caerse si algo no cabe: cuanto más alta, antes se cae. */
const DROP_RANK = { ancla: 1, joya: 1, pool: 2, parada: 3, atardecer: 3, de_paso: 5, extra: 4 }
/** Un medio día sin tipo: como mucho estas paradas improvisadas, a 15 min o menos una de otra. */
const UNTYPED_MAX_STOPS = { completo: 4, tranquilo: 3 }
const UNTYPED_MAX_WALK = 15
/** El primer salto del medio día sin tipo puede ser más largo: salir de un barrio apartado (Testaccio). */
const UNTYPED_FIRST_HOP = 30
/** Hasta cuántas paradas sueltas se prueban todos los órdenes (6! = 720). */
const UNTYPED_REORDER_MAX = 6
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
/** Un imprescindible rescatado va de camino: como mucho este desvío. */
const RESCUE_MAX_DETOUR = 15
/** Una espera de más de esto dentro del día se rellena con algo de camino. */
const WAIT_FILL_MINUTES = 60
/** Más que esto parado antes de cenar es una hora muerta (Parte A, regla 7). */
const DEAD_HOURS_MINUTES = 90
const CURATED_AFTERNOON_OFFSET = 100
/** Más espera que esto antes del mirador del atardecer: lo que va detrás en el bloque pasa delante. */
const SUNSET_WAIT_MAX = 45
/** Adelantar una parada por delante del mirador obliga a volver: cuesta más que verla de paso bajando. */
const SUNSET_MOVE_COST = 80
const SUNSET_PASS_COST = 40
/** Saltarse lo de "antes del atardecer" por falta de tiempo: cuesta, pero menos que perder paradas. */
const SUNSET_SKIP_COST = 120
/** Motivos del programador que son de horario: esa parada, a esa hora, va de paso. */
const HOURS_DROP_REASONS = new Set(['closed', 'closes_during_visit', 'after_last_entry', 'after_latest_end'])
/** Bajar del mirador por lo que el bloque ponía antes (solo con lo de antes del atardecer saltado). */
const SUNSET_DESCENT_COST = 20

/** ¿Meter algo en la posición `at` deja en medio de un grupo del JSON (Panteón … Navona)? */
function splitsGroup(units, at) {
  const groupAt = (index) => units.slice(0, index).flatMap((unit) => unit.places.map((place) => place.group)).filter(Boolean)
  const before = new Set(groupAt(at))
  return units.slice(at).some((unit) => unit.places.some((place) => place.group && before.has(place.group)))
}

/** La espera más larga del día entre dos paradas (o entre la comida y la siguiente), sin el paseo. */
function longestWait(result) {
  let worst = 0
  const visits = result.visits ?? []
  for (let i = 1; i < visits.length; i++) {
    const meal = (result.meals ?? []).find((m) => m.start >= visits[i - 1].end && m.start < visits[i].start)
    // Después de comer cuenta desde que se acaba de comer, no desde el final de la franja (que incluye el paseo).
    const from = meal ? meal.start + (meal.eatMinutes ?? meal.end - meal.start) : visits[i - 1].end
    worst = Math.max(worst, visits[i].start - from - (visits[i].walkMinutes ?? 0))
  }
  return worst
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
  for (let round = 0; round < REPAIR_ROUNDS; round++) {
    const dead = [...new Set([...deadDays(best), ...shortDays(best)])]
    if (dead.length === 0) break
    let improved = null
    for (const day of dead) {
      // Sin esa tarde ese día; y si la tarde no tiene bloque, sin esa mañana (la del Aventino no tiene
      // ninguna tarde que encaje).
      const candidates = day.blocks.filter((block) => block.id).flatMap((block) => [`${day.dayNumber}:${block.id}`, `todos:${block.id}`])
      for (const ban of candidates) {
        if (bans.has(ban)) continue
        const trial = planBlockTripOnce(args, new Set([...bans, ban]))
        if (tripCost(trial) < tripCost(improved?.trial ?? best)) improved = { trial, ban }
      }
    }
    if (!improved) break
    bans.add(improved.ban)
    best = improved.trial
  }
  return best
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
  return 100 * deadDays(trip).length + 60 * shortDays(trip).length + 400 * trip.unplacedEssentials.length + 80 * trip.unplacedPool.length + 60 * trip.untypedHalves + trip.days.reduce((sum, day) => sum + (day.schedule?.walkMinutes ?? 0), 0) / 2
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
  const selectedMornings = []
  for (const block of morningOrder) {
    if (selectedMornings.length >= morningDays.length) break
    if (matchable([...selectedMornings, block])) selectedMornings.push(block)
  }
  for (const block of selectedMornings) {
    const rest = selectedMornings.filter((other) => other !== block && !usedMornings.has(other.id))
    const day = morningDays.find((candidate) => !morningOf.has(candidate.dayNumber) && opensOn(block, candidate) && matchable(rest, new Map([...morningOf.entries(), [candidate.dayNumber, block]])))
    if (!day) continue
    morningOf.set(day.dayNumber, block)
    usedMornings.add(block.id)
  }
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
  const allUnits = buildUnits(destData, hasFreeTour)
  const plannedNames = new Set([...morningOf.values()].flatMap((block) => block.paradas.map((stop) => stop.lugar)))

  /**
   * Las paradas de un bloque para un día: el papel de cada una, lo que se salta y lo que va de paso.
   * @returns {{ place: object, role: string, name: string }[]}
   */
  function stopsOf(block, day, dayPlaces) {
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
        dropRank: joyaNames.has(name) ? DROP_RANK.joya : role === 'pool' ? DROP_RANK.pool : DROP_RANK[role] ?? DROP_RANK.parada,
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
  function schedule(day, units, dinner, { morning = true } = {}) {
    const hours = hoursOf(day)
    const run = (dayMode) =>
      scheduleFixedOrder({
        units,
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
    // Lo imprescindible de la mañana del bloque que se ha ido detrás de la comida (el Foro, después
    // del Coliseo): la mañana tipo no se hace como dice.
    const morningIds = new Set(units.filter((unit) => unit.slot === 'manana').map((unit) => unit.id))
    const slid = (result) => result.kept.filter((unit) => morningIds.has(unit.id) && unit.slot === 'tarde' && essential(unit))
    let result = run(mode)
    let modeFallback = null
    // Madrugar solo si hace falta (revisión 16), y con el motivo de lo que se recupera.
    if (hasPlanB && morning && (lost(result) > 0 || slid(result).length > 0)) {
      const alt = run(normalMode)
      if (lost(alt) < lost(result) || (lost(alt) === lost(result) && slid(alt).length < slid(result).length)) {
        const recovered = [
          ...result.dropped.filter(({ unit }) => !alt.dropped.some((d) => d.unit.id === unit.id)).map(({ unit }) => unit.id),
          ...slid(result).filter((unit) => !slid(alt).some((other) => other.id === unit.id)).map((unit) => unit.id),
        ]
        modeFallback = { recoveredUnitIds: recovered, startedAt: normalMode.dayStart }
        result = alt
      }
    }
    return { ...result, modeFallback }
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
    // Cuántas paradas del bloque pasan delante del mirador: la que menos pierda, luego la que menos
    // espere, luego la que menos cambie el orden. Si ninguna guarda el atardecer, el mirador va como
    // una parada más, en su sitio (en abril el sol se pone tarde para cenar a las 20:00 después).
    const options = []
    // Nunca pasa delante el ancla ni lo que va detrás de ella: el bloque acaba donde acaba (Trastevere,
    // bajando del Janículo), sin vaivenes.
    const anchorAt = afternoonUnits.findIndex((unit) => unit.role === 'ancla')
    const lastMovable = anchorAt > at ? anchorAt : afternoonUnits.length
    for (let moved = 0; at + moved < lastMovable; moved++) {
      const list = [...afternoonUnits.slice(0, at), ...afternoonUnits.slice(at + 1, at + 1 + moved), afternoonUnits[at], ...afternoonUnits.slice(at + 1 + moved)]
      const result = run(list)
      if (!result.visits.some((visit) => visit.place.sunset != null)) continue
      options.push({ units: [...morningUnits, ...list], result, cost: 300 * lossOf(result) + lateDinnerCost(result) + Math.max(0, waitBefore(result) - SUNSET_WAIT_MAX) + result.walkMinutes + SUNSET_MOVE_COST * moved })
    }
    // Lo que va detrás del mirador y no cabe entero antes de cenar se ve de paso bajando (Piazza del
    // Popolo, al bajar del Pincio): mejor que adelantarlo y volver a subir.
    const after = afternoonUnits.map((unit, index) => ({ unit, index })).filter(({ unit, index }) => index > at && unit.role !== 'ancla' && unit.role !== 'de_paso')
    for (let k = 1; k <= after.length; k++) {
      const converted = new Set(after.slice(after.length - k).map(({ index }) => index))
      const list = afternoonUnits.map((unit, index) => (converted.has(index) ? asPassThrough(unit) : unit))
      const result = run(list)
      if (!result.visits.some((visit) => visit.place.sunset != null)) continue
      options.push({ units: [...morningUnits, ...list], result, cost: 300 * lossOf(result) + lateDinnerCost(result) + Math.max(0, waitBefore(result) - SUNSET_WAIT_MAX) + result.walkMinutes + SUNSET_PASS_COST * k })
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
      const descending = [...kept.slice(0, sunsetAt).filter((unit) => !between.includes(unit)), kept[sunsetAt], ...between, ...kept.slice(sunsetAt + 1)]
      const skipped = afternoonUnits.length - kept.length
      for (const [list, extra] of [[kept, 0], [descending, SUNSET_DESCENT_COST]]) {
        const result = run(list)
        if (!result.visits.some((visit) => visit.place.sunset != null)) continue
        options.push({ units: [...morningUnits, ...list], result, cost: 300 * lossOf(result) + lateDinnerCost(result) + Math.max(0, waitBefore(result) - SUNSET_WAIT_MAX) + result.walkMinutes + SUNSET_SKIP_COST * skipped + extra, descent: extra > 0 })
      }
    }
    const plain = afternoonUnits.map((unit, index) => (index === at ? { ...unit, places: unit.places.map(({ sunset, ...place }) => place) } : unit))
    const plainResult = run(plain)
    // Sin atardecer cuenta como perder media parada: solo si así se pierde menos.
    options.push({ units: [...morningUnits, ...plain], result: plainResult, cost: 300 * lossOf(plainResult) + 500 + plainResult.walkMinutes })
    return options.sort((a, b) => a.cost - b.cost)[0]
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
      const byHours = new Set(result.dropped.filter(({ unit, reason }) => HOURS_DROP_REASONS.has(reason) && unit.slot === 'tarde' && unit.role !== 'de_paso' && unit.role !== 'ancla' && current.some((other) => other.id === unit.id)).map(({ unit }) => unit.id))
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
    while (numbered([...morningStops, ...list]) > limit) {
      const candidates = list
        .map((stop, index) => ({ stop, index }))
        .filter(({ stop }) => stop.role === 'parada' && !joyaNames.has(stop.name) && stop.place.level !== 1)
        .sort((a, b) => (b.stop.place.level ?? 3) - (a.stop.place.level ?? 3) || b.index - a.index)
      if (candidates.length === 0) break
      list = list.filter((_, index) => index !== candidates[0].index)
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
      const meal = (chosen.result.meals ?? []).find((m) => m.start >= visits[index - 1].end && m.start < visits[index].start)
      const from = meal?.coordinates ?? visits[index - 1].place.end_coordinates ?? visits[index - 1].place.coordinates
      const to = visits[index].place.coordinates
      const today = new Set(visits.map((visit) => visit.place.name))
      const candidates = (destData.places ?? [])
        .filter((place) => !seen.has(place.name) && !today.has(place.name) && !otherMorningNames.has(place.name) && !tourCovers.has(place.name) && !anchorsLeft.has(place.name) && !place.group)
        .filter((place) => !(isPaidMuseum(place) && paidMuseums >= museumQuota) && !closedThatDay(place.name, day))
        .filter((place) => !blockedByRedundancy(destData, place.name, new Set([...seen, ...today]), { contentDays, experienceMatches: matches(place) }))
        .filter((place) => (place.duration_minutes ?? 30) <= wait)
        .map((place) => ({ place, walk: (travel.leg(from, place.coordinates)?.minutes ?? Infinity) + (travel.leg(place.coordinates, to)?.minutes ?? Infinity) }))
        .filter((item) => item.walk <= 2 * TAIL_MAX_WALK)
        .sort((a, b) => (a.place.level ?? 3) - (b.place.level ?? 3) || Number(matches(b.place)) - Number(matches(a.place)) || a.walk - b.walk)
      const unitIndex = chosen.result.kept.findIndex((unit) => unit.id === visits[index].unitId)
      let placed = false
      for (const { place } of candidates.slice(0, 6)) {
        const [scheduled] = placesForScheduler({ id: place.name, places: [place] }, destData, freeTourTime)
        const kept = chosen.result.kept
        const unit = { id: `espera:${place.name}`, group: null, places: [scheduled], slot: kept[unitIndex]?.slot ?? 'tarde', blockId: 'extra', role: 'extra', dropRank: DROP_RANK.extra, priority: PRIORITY.FILLER, curatedIndex: null, poolIndex: null }
        if (unitIndex < 0 || splitsGroup(kept, unitIndex)) break
        const units = [...kept.slice(0, unitIndex), unit, ...kept.slice(unitIndex)]
        const result = schedule(day, units, chosen.dinner, { morning: !day.halfDayExcursion })
        if (!result.kept.some((other) => other.id === unit.id) || result.dropped.length > 0 || longestWait(result) >= wait) continue
        // Sin dejar otra espera por encima de la tolerancia del ritmo entre dos paradas.
        if (longestWait(result) > mode.gapTolerance) continue
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
    const ok = (result) => result.dropped.length === 0 && longestWait(result) <= waitLimit && (result.idleBeforeDinner ?? 0) <= idleLimit
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
        const unit = { id: `experiencia:${place.name}`, group: null, places: [scheduled], slot: 'tarde', blockId: 'extra', role: 'extra', dropRank: DROP_RANK.extra, priority: PRIORITY.THEME, curatedIndex: null, poolIndex: null, experienceTheme: id }
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

  function extendTail(day, chosen, otherMorningNames) {
    const unusedAnchors = () =>
      new Set([...(destData.afternoon_flows ?? []).filter((block) => !usedAfternoons.has(block.id) && block.id !== chosen.block?.id), ...mornings.filter((block) => !usedMornings.has(block.id))].map(anchorOf).filter(Boolean))
    const dinnerPoint = chosen.dinner?.coordinates ?? null
    const matches = (place) => (place.tags ?? []).some((tag) => selected.some((id) => TAG_INTEREST_MAP[id].includes(tag)))
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
        .filter((place) => !seen.has(place.name) && !today.has(place.name) && !otherMorningNames.has(place.name) && !tourCovers.has(place.name) && !unusedAnchors().has(place.name))
        // Lo que va en grupo (el Aventino: Boca de la Verdad, Naranjos, Cerradura) se ve entero o no se ve.
        .filter((place) => !place.group)
        .filter((place) => !(isPaidMuseum(place) && paidMuseums >= museumQuota) && !closedThatDay(place.name, day))
        .filter((place) => !blockedByRedundancy(destData, place.name, new Set([...seen, ...today]), { contentDays, experienceMatches: matches(place) }))
        .filter((place) => !breaksOneBigVisit([place], chosen.result.visits.map((visit) => visit.place)))
        .map((place) => {
          const walk = travel.leg(from, place.coordinates)?.minutes ?? Infinity
          const detour = dinnerPoint ? walk + (travel.leg(place.coordinates, dinnerPoint)?.minutes ?? Infinity) - direct : 0
          return { place, walk, detour }
        })
        .filter((item) => item.walk <= TAIL_MAX_WALK && item.detour <= TAIL_MAX_WALK && (item.place.duration_minutes ?? 30) <= Math.max(idle - TAIL_IDLE_TARGET + 30, idle - 15))
        .sort((a, b) => Number(inPool(b.place.name)) - Number(inPool(a.place.name)) || (a.place.level ?? 3) - (b.place.level ?? 3) || Number(matches(b.place)) - Number(matches(a.place)) || a.walk - b.walk)
      let placed = false
      for (const { place } of candidates.slice(0, 5)) {
        const [scheduled] = placesForScheduler({ id: place.name, places: [place] }, destData, freeTourTime)
        const unit = { id: `extra:${place.name}`, group: null, places: [scheduled], slot: 'tarde', blockId: 'extra', role: 'extra', dropRank: DROP_RANK.extra, priority: PRIORITY.FILLER, curatedIndex: null, poolIndex: null, isTailExtra: true }
        // Donde menos se ande: de camino, no necesariamente al final (sin tocar el orden del bloque,
        // que va entre sus paradas y no las cambia de sitio).
        const kept = chosen.result.kept
        const firstAfternoon = Math.max(0, kept.findIndex((other) => other.slot === 'tarde'))
        let best = null
        for (let at = firstAfternoon; at <= kept.length; at++) {
          if (splitsGroup(kept, at)) continue
          const units = [...kept.slice(0, at), unit, ...kept.slice(at)]
          const result = schedule(day, units, chosen.dinner, { morning: !day.halfDayExcursion })
          if (!result.kept.some((other) => other.id === unit.id) || result.dropped.length > 0 || (result.idleBeforeDinner ?? 0) >= idle) continue
          // Sin esperas nuevas entre paradas (el Gesù, que abre a las 16:00, no va nada más comer).
          if ((result.idleMinutes ?? 0) > (chosen.result.idleMinutes ?? 0) + TAIL_MAX_NEW_WAIT) continue
          if (longestWait(result) > Math.max(longestWait(chosen.result), mode.gapTolerance)) continue
          if (!best || result.walkMinutes < best.result.walkMinutes) best = { units, result }
        }
        if (best) {
          chosen.units = best.units
          chosen.result = { ...best.result, dropped: chosen.result.dropped }
          placed = true
          break
        }
      }
      if (!placed) return
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

    const candidates = (destData.afternoon_flows ?? [])
      .filter((block) => !usedAfternoons.has(block.id) && !excludedInTrip.has(block.id) && !sameDayExcluded.has(block.id) && !bans.has(`${day.dayNumber}:${block.id}`))
      .filter((block) => fitsAfter(block) || fitsAfterFallback(block))
      .filter((block) => (block.minimo_dias_viaje ?? 0) <= contentDays || blockHasPool(block))
      .filter((block) => {
        // La tarde cuya ancla es la de una mañana (el Vaticano por la tarde): solo si esa mañana no va.
        const anchor = anchorOf(block)
        return !anchor || !allMorningAnchors.has(anchor) || !morningAnchors.has(anchor)
      })
      .filter((block) => !closedThatDay(anchorOf(block), day) && !otherMorningNames.has(anchorOf(block)))
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
        return { block, order, score: 100 * Number(fitsAfter(block)) + 50 * Number(blockHasPool(block)) + joyaAnchor + 3 * newEssentials + 15 * lastChance + 2 * blockMatches(block) - repeats - 10 * stolen }
      })
      .sort((a, b) => b.score - a.score || a.order - b.order)

    let chosen = null
    for (const { block: original, score } of candidates) {
      const block = oriented(original, morningStops.at(-1)?.place ?? null)
      const afternoonStops = trimForPace(stopsOf(block, day, morningPlaces), morningStops)
      const anchor = anchorOf(block)
      if (anchor && !afternoonStops.some((stop) => stop.name === anchor)) continue
      const dinner = dinnerFor(block, afternoonStops.at(-1)?.place.coordinates ?? null)
      const { units, result } = withSunsetFilled(day, morningUnits, unitsOf(afternoonStops, block, 'tarde', day), dinner)
      // El ancla tiene que caber; si no, otra tarde. Salvo que sea de "antes del atardecer" y se haya
      // saltado para llegar al mirador a tiempo (Trastevere en invierno: se cena allí igualmente).
      const anchorSkippedForSunset = afternoonStops.some((stop) => stop.name === anchor && stop.beforeSunset) && result.visits.some((visit) => visit.place.sunset != null)
      if (anchor && !anchorSkippedForSunset && !result.kept.some((unit) => unit.places.some((place) => place.name === anchor))) continue
      // La mejor tarde es la que encaja, no se queda a medias y no deja horas muertas antes de cenar
      // (ya alargada de camino a la cena).
      const candidate = { block, units, dinner, result, afternoonStops }
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
    // Lo que se ha visto de verdad (lo que el programador mantiene) cuenta para el resto del viaje.
    for (const unit of chosen.result.kept) {
      for (const place of unit.places) {
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
        ...(chosen.block ? [{ id: chosen.block.id, slot: 'tarde', label: chosen.block.nombre }] : [{ id: null, slot: 'tarde', label: 'Medio día sin tipo' }]),
      ],
      untypedAfternoon: !chosen.block,
      curated: null,
    })
  }

  /**
   * Lo del pool y los imprescindibles que no han entrado en ningún bloque: se meten en el día y en el
   * sitio donde menos se ande (de camino: el Altar de la Patria al salir de los Foros). Puede caerse
   * algo "de paso" o añadido para hacerle sitio; nada del bloque ni otro imprescindible.
   */
  const rescue = (name, role) => {
    const place = placeByName.get(name)
    if (!place || seen.has(name)) return true
    // Con su grupo del JSON, en su orden (la Plaza Venecia y luego el Altar): lo que va junto, junto.
    const members = place.group
      ? (destData.places ?? []).filter((other) => other.group === place.group && !seen.has(other.name)).sort((x, y) => (x.group_order ?? 0) - (y.group_order ?? 0))
      : [place]
    const scheduled = placesForScheduler({ id: place.group ?? name, places: members }, destData, freeTourTime)
    const extra = { id: `${role}:${name}`, group: place.group ?? null, places: scheduled, slot: 'tarde', blockId: role, role, dropRank: DROP_RANK.pool, priority: role === 'pool' ? PRIORITY.POOL : PRIORITY.ESSENTIAL, curatedIndex: null, poolIndex: inPool(name) ? poolNames.indexOf(name) : null }
    const cheap = (unit) => (unit.role === 'de_paso' || unit.role === 'extra') && !unit.places.some((p) => p.level === 1 || joyaNames.has(p.name))
    let best = null
    for (const day of days.filter((d) => d.schedule && !closedThatDay(name, d))) {
      if (isPaidMuseum(place) && !inPool(name) && paidMuseums >= museumQuota) break
      // Nunca dentro de la mañana del bloque: al acabarla o por la tarde.
      const morningEnd = day.units.map((unit) => unit.slot).lastIndexOf('manana') + 1
      for (let at = morningEnd; at <= day.units.length; at++) {
        if (splitsGroup(day.units, at)) continue
        // De camino: 15 min de desvío como mucho entre lo de antes y lo de después.
        const prev = day.units[at - 1]?.places.at(-1)
        const next = day.units[at]?.places[0]
        const leg = (x, y) => (x?.coordinates && y?.coordinates ? travel.leg(x.end_coordinates ?? x.coordinates, y.coordinates)?.minutes ?? Infinity : 0)
        if (leg(prev, members[0]) + leg(members.at(-1), next) - leg(prev, next) > RESCUE_MAX_DETOUR) continue
        const slot = day.units[at]?.slot ?? 'tarde'
        const units = [...day.units.slice(0, at), { ...extra, slot }, ...day.units.slice(at)]
        const result = schedule(day, units, day.dinnerCoords ? { coordinates: day.dinnerCoords } : null, { morning: !day.halfDayExcursion })
        // Entero: si el grupo pierde a alguien por el camino, no vale.
        const keptExtra = result.kept.find((unit) => unit.id === extra.id)
        if (!keptExtra || keptExtra.places.length !== members.length || !result.dropped.every(({ unit }) => cheap(unit))) continue
        const cost = result.walkMinutes + result.idleMinutes + 30 * result.dropped.length
        if (!best || cost < best.cost) best = { day, result, cost }
      }
    }
    if (!best) return false
    Object.assign(best.day, { units: best.result.kept, schedule: { ...best.result, dropped: [...best.day.schedule.dropped, ...best.result.dropped] } })
    for (const member of members) seen.add(member.name)
    return true
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
    if (place.level === 1 && !tourCovers.has(place.name)) rescue(place.name, 'imprescindible')
  }

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

  return {
    mode,
    days,
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
  }
}
