/**
 * Viajes de 1 y 1,5 días: rutas CURADAS a mano (short_trips del JSON del destino).
 *
 * El destino fija QUÉ se ve y EN QUÉ ORDEN, por bloques de media jornada (Roma: A Roma Antigua,
 * B Centro, C Vaticano). El motor solo:
 *   - elige los bloques (combinations) y los reparte en las franjas del viaje;
 *   - aplica el ritmo (completo = core + extras, tranquilo = solo core), los cambios por
 *     experiencia (swaps) y el pool (sustituye a la parada de menor prioridad);
 *   - pone las horas con el programador en modo de orden fijo, comprobando horarios, últimas
 *     entradas y cierres. Lo que no cabe va a "No te dio tiempo" con su motivo.
 *
 * Una FRANJA es una mañana (hasta la comida) o una tarde (de la comida a la cena). 1 día = 2
 * franjas, 1,5 días = 3. Salen de los días del viaje y, cuando los haya, de los vuelos: por eso la
 * entrada es la lista de franjas y no un número de días.
 *
 * Módulo puro, como el resto del motor v3.
 */

import { buildUnits } from './units.js'
import { placesForScheduler } from './planTrip.js'
import { PRIORITY, scheduleFixedOrder } from './scheduleDay.js'
import { dinnerZones } from './dinnerZones.js'
import { MODES_V3, modeV3For } from './modes.js'
import { toMinutes } from './time.js'
import { seasonKey } from './openingHours.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'
import { lunchSpots } from './lunchSpots.js'
import { weekdayForDay } from './tripSkeleton.js'

/** Hora por defecto a la que empieza una tarde que no viene de una mañana (llegada, o C de tarde). */
const DEFAULT_AFTERNOON_START = '14:30'

/** Prioridad para caerse cuando algo no cabe: cuanto más alta, antes se cae. */
const DROP_RANK = { extra: 4, core: 3, pool: 2, joya: 1 }

/** Las franjas de cada forma de viaje corto. */
export function shortTripSlots(kind) {
  switch (kind) {
    case '1_dia':
      return [{ dayNumber: 1, slot: 'manana' }, { dayNumber: 1, slot: 'tarde' }]
    case '1_5_dias_llegada_tarde': // tarde - mañana - tarde
      return [{ dayNumber: 1, slot: 'tarde' }, { dayNumber: 2, slot: 'manana' }, { dayNumber: 2, slot: 'tarde' }]
    case '1_5_dias_salida_mediodia': // mañana - tarde - mañana
      return [{ dayNumber: 1, slot: 'manana' }, { dayNumber: 1, slot: 'tarde' }, { dayNumber: 2, slot: 'manana' }]
    default:
      throw new Error(`Viaje corto desconocido: ${kind}`)
  }
}

/**
 * Todas las formas válidas de repartir los bloques en las franjas, de más a menos franjas
 * preferidas. Reglas (short_trips): cada bloque en una de sus `allowed_slots`; el Free Tour (que
 * sustituye a B) va de mañana, a su hora; A solo va de tarde si el Free Tour ocupa la mañana. Cuál
 * se usa lo decide después el reloj (ver planShortTrip): la preferida no siempre cabe.
 */
function assignSlots(blockIds, slots, blocks, freeTourBlock) {
  const permutations = (list) => (list.length <= 1 ? [list] : list.flatMap((item, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [item, ...rest])))
  const valid = []
  for (const order of permutations(slots.map((_, i) => i))) {
    const assignment = blockIds.map((id, i) => ({ id, ...slots[order[i]] }))
    const fits = assignment.every(({ id, slot }) => {
      if (id === freeTourBlock) return slot === 'manana'
      if (!(blocks[id].allowed_slots ?? ['manana', 'tarde']).includes(slot)) return false
      if (id === 'A' && slot === 'tarde') return Boolean(freeTourBlock) && assignment.some((a) => a.id === freeTourBlock && a.slot === 'manana')
      return true
    })
    if (!fits) continue
    const score = assignment.reduce((sum, { id, slot }) => sum + (id !== freeTourBlock && blocks[id].preferred_slot === slot ? 1 : 0), 0)
    valid.push({ assignment, score })
  }
  // Orden estable: a igual puntuación, el de las permutaciones (el orden de la combinación).
  return valid.sort((a, b) => b.score - a.score).map((item) => item.assignment)
}

/** Cuánto pierde un reparto: una joya pesa más que un imprescindible, y este más que un extra. */
const LOSS_WEIGHT = { joya: 100, core: 10, pool: 5, extra: 1 }

/**
 * Qué se ve en un bloque, en orden, con el papel de cada lugar (core/extra), ya con el ritmo y los
 * cambios por experiencia aplicados. Si dos experiencias sustituyen lo mismo, gana la que el
 * viajero eligió primero; las que añaden se aplican todas.
 */
function blockStops(block, pace, experiencesPositive, destData) {
  // Un extra de pago no es relleno (Paso 3): solo va si una experiencia elegida lo cubre, y entonces
  // entra por ella (el Castillo de Sant'Angelo del bloque del Vaticano, solo con Arte).
  const placeOf = (name) => destData.places?.find((place) => place.name === name)
  const paid = (place) => Boolean(place) && !(place.is_free_access ?? place.type === 'exterior')
  const themeOf = (place) => (experiencesPositive ?? []).find((theme) => theme in TAG_INTEREST_MAP && theme !== 'free_tour' && (place?.tags ?? []).some((tag) => TAG_INTEREST_MAP[theme].includes(tag))) ?? null
  const extras = (pace === 'tranquilo' ? [] : (block.extras_completo ?? []))
    .map((name) => ({ name, place: placeOf(name) }))
    .filter(({ place }) => !paid(place) || themeOf(place))
    .map(({ name, place }) => (paid(place) ? { name, role: 'extra', swappedBy: themeOf(place) } : { name, role: 'extra' }))
  const stops = [...block.core.map((name) => ({ name, role: 'core' })), ...extras]
  const replaced = new Set()
  for (const experience of experiencesPositive) {
    const swap = block.swaps?.[experience]
    if (!swap) continue
    if (swap.replace) {
      // Solo si lo que sustituye está en la ruta (en tranquilo no hay extras que sustituir) y no lo
      // ha sustituido ya una experiencia elegida antes.
      const targets = swap.replace.filter((name) => stops.some((stop) => stop.name === name) && !replaced.has(name))
      if (targets.length === 0) continue
      const at = stops.findIndex((stop) => targets.includes(stop.name))
      const role = stops[at].role
      for (const name of targets) replaced.add(name)
      stops.splice(at, 0, ...swap.with.map((name) => ({ name, role, swappedBy: experience })))
      for (const name of targets) stops.splice(stops.findIndex((stop) => stop.name === name), 1)
    }
    if (swap.add && swap.insert_before) {
      const at = stops.findIndex((stop) => stop.name === swap.insert_before)
      stops.splice(at >= 0 ? at : stops.length, 0, ...swap.add.map((name) => ({ name, role: 'extra', swappedBy: experience })))
    }
    if (swap.add_at_end) stops.push(...swap.add_at_end.map((name) => ({ name, role: 'extra', swappedBy: experience })))
  }
  return stops
}

/**
 * @param {object} args
 * @param {object} args.destData
 * @param {{dayNumber: number, slot: 'manana'|'tarde'}[]} args.slots   ver shortTripSlots
 * @param {string} args.pace
 * @param {boolean} [args.hasFreeTour]
 * @param {string[]} [args.poolNames]           en el orden en que se eligió
 * @param {string[]} [args.experiencesPositive] en el orden en que se eligió
 * @param {{leg: Function}} args.travel
 * @param {string|null} [args.season]            época del formulario ("winter"...), para los horarios
 * @param {string|null} [args.dateRangeStartIso]  con fechas, el horario exacto de cada día
 */
export function planShortTrip({ destData, slots, pace, hasFreeTour = false, poolNames = [], experiencesPositive = [], travel, season = null, dateRangeStartIso = null }) {
  const config = destData.short_trips
  const { blocks } = config
  const mode = modeV3For(pace)
  // Plan B (decisión del 2026-09-24, también en viajes de un día): si un imprescindible no cabe con
  // el ritmo, el día empieza a las 08:00 y sin el extra de duración, con aviso (pace_notice).
  const normalMode = { ...mode, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const hasPlanB = normalMode.dayStart !== mode.dayStart || normalMode.visitDurationBonus !== mode.visitDurationBonus
  const seasonOfTrip = seasonKey(season, dateRangeStartIso)
  const lunchSpotList = lunchSpots(destData)
  const hoursFor = (dayNumber) => ({ weekday: weekdayForDay(dateRangeStartIso, dayNumber), season: seasonOfTrip })
  const notIncluded = []
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))

  // ── Bloques: la combinación por número de franjas, y el cambio de A por C si el pool pide el
  //    Vaticano en un viaje de un día.
  const combination = slots.length >= 3 ? config.combinations['1_5_dias'] : config.combinations['1_dia']
  let blockIds = [...combination.default]
  let nightHint = null
  for (const [name, rule] of Object.entries(combination.if_pool_contains ?? {})) {
    if (!poolNames.includes(name)) continue
    blockIds = [...rule.blocks]
    nightHint = rule.night_hint ?? null
    break
  }
  for (const [blockId, text] of Object.entries(combination.not_included ?? {})) {
    if (!blockIds.includes(blockId)) notIncluded.push({ name: blocks[blockId].label, reason: text })
  }

  const freeTourBlock = hasFreeTour && blocks.B?.free_tour?.replaces_block && blockIds.includes('B') ? 'B' : null
  const assignments = assignSlots(blockIds, slots, blocks, freeTourBlock)
  if (assignments.length === 0) throw new Error(`short_trips: no hay forma de repartir ${blockIds.join('+')} en ${slots.map((s) => s.slot).join('-')}`)

  // ── Qué se ve en cada bloque.
  const stopsByBlock = new Map(
    blockIds.map((id) => [id, id === freeTourBlock ? [{ name: destData.default_free_tour.name, role: 'core', freeTour: true }] : blockStops(blocks[id], pace, experiencesPositive, destData)]),
  )

  // ── Pool: lo que pida y no esté sustituye a la parada de menor prioridad (primero extras, luego
  //    core que no sea joya), en el bloque más cercano a ese lugar. Si no hay a quién sustituir, va a
  //    "No te dio tiempo". El orden de selección decide.
  const substitutions = []
  const isInseparablePair = (a, b) => Object.values(destData.groups ?? {}).some((group) => (group.inseparable ?? []).some((pair) => pair.includes(a) && pair.includes(b)))
  const inRoute = (name) => [...stopsByBlock.values()].some((stops) => stops.some((stop) => stop.name === name))
  for (const name of poolNames) {
    if (inRoute(name) || combination.if_pool_contains?.[name]) continue
    const place = placeByName.get(name)
    if (!place) continue
    const candidates = []
    for (const [blockId, stops] of stopsByBlock) {
      stops.forEach((stop, index) => {
        if (stop.removedBySubstitution) return
        const isJoya = placeByName.get(stop.name)?.tier === 'joya'
        const rank = stop.role === 'extra' ? 0 : stop.role === 'core' && !isJoya && !stop.freeTour ? 1 : null
        if (rank === null) return
        const walk = travel.leg(placeByName.get(stop.name).coordinates, place.coordinates)?.minutes ?? Infinity
        candidates.push({ blockId, index, rank, walk })
      })
    }
    // Primero extras, luego core; a igualdad, la parada más cercana al lugar pedido; y de ahí, la última.
    candidates.sort((a, b) => a.rank - b.rank || a.walk - b.walk || b.index - a.index)
    const target = candidates[0]
    if (!target) {
      notIncluded.push({ name, reason: 'No te dio tiempo' })
      continue
    }
    const stops = stopsByBlock.get(target.blockId)
    // Un par inseparable (Plaza Venecia + Altar) se sustituye entero: quitar solo la plaza dejaba el
    // Altar suelto y sin sitio.
    const original = stops[target.index]
    const partnerIndex = stops.findIndex((stop, i) => i !== target.index && !stop.removedBySubstitution && isInseparablePair(original.name, stop.name))
    const partner = partnerIndex >= 0 ? stops[partnerIndex] : null
    substitutions.push({ poolName: name, blockId: target.blockId, index: target.index, original, partnerIndex, partner })
    stops[target.index] = { name, role: 'pool', poolIndex: poolNames.indexOf(name) }
    if (partner) stops[partnerIndex] = { ...partner, removedBySubstitution: true }
  }

  // ── Unidades en orden. Lugares seguidos del mismo grupo del JSON van en una sola unidad (para
  //    encadenarse y para que un par inseparable no se separe), en el orden del BLOQUE.
  const groupOf = new Map(buildUnits(destData, true).flatMap((unit) => (unit.places.length > 1 ? unit.places.map((place) => [place.name, unit.id]) : [])))
  const freeTourTime = destData.default_free_tour?.default_time ?? null
  function unitsForBlock(blockId, slot) {
    const units = []
    for (const stop of stopsByBlock.get(blockId)) {
      if (stop.removedBySubstitution) continue
      const place = stop.freeTour ? { ...destData.default_free_tour, isFreeTour: true, duration_minutes: destData.default_free_tour.duration_minutes ?? 150 } : placeByName.get(stop.name)
      if (!place) continue
      const group = groupOf.get(stop.name) ?? null
      const last = units[units.length - 1]
      const rank = place.tier === 'joya' ? DROP_RANK.joya : stop.role === 'pool' ? DROP_RANK.pool + (stop.poolIndex ?? 0) / 100 : DROP_RANK[stop.role]
      if (last && group && last.group === group) {
        last.places.push(place)
        last.dropRank = Math.min(last.dropRank, rank)
        continue
      }
      units.push({
        id: group ? `${group}:${blockId}` : stop.name,
        group,
        places: [place],
        dropRank: rank,
        slot,
        blockId,
        role: stop.role,
        priority: PRIORITY.ESSENTIAL,
        // Entró por una experiencia elegida (cambio del bloque o extra de pago): la app lo etiqueta.
        ...(stop.swappedBy ? { experienceTheme: stop.swappedBy } : {}),
      })
    }
    return units.map((unit) => {
      const places = placesForScheduler({ id: unit.group ?? unit.id, places: unit.places }, destData, freeTourTime)
      // C por la tarde no empieza antes de su hora (short_trips: afternoon_start).
      const notBefore = slot === 'tarde' ? blocks[blockId]?.afternoon_start : null
      if (notBefore && places[0]) places[0] = { ...places[0], not_before: notBefore }
      return { ...unit, places }
    })
  }

  // ── Un día por cada día del viaje, con sus franjas. Se prueba cada reparto válido con el reloj
  //    y se queda el que menos pierde: con llegada por la tarde, el Centro en esa tarde dejaba el
  //    Vaticano para la tarde siguiente, detrás de Roma Antigua y la comida, y no cabía entero.
  const dayNumbers = [...new Set(slots.map((s) => s.dayNumber))]
  const buildDays = (assignment) => dayNumbers.map((dayNumber) => {
    const daySlots = assignment.filter((a) => a.dayNumber === dayNumber)
    const morning = daySlots.find((a) => a.slot === 'manana') ?? null
    const afternoon = daySlots.find((a) => a.slot === 'tarde') ?? null
    const units = [...(morning ? unitsForBlock(morning.id, 'manana') : []), ...(afternoon ? unitsForBlock(afternoon.id, 'tarde') : [])]
    // Si el Free Tour sustituye a B, comida y cena del bloque B siguen valiendo (recorre el Centro).
    const lunchZone = morning ? blocks[morning.id].lunch_zone_if_morning : null
    // La cena, en el barrio de cena más cercano a donde acaba la tarde (dinnerZones.js): el bloque ya
    // no lo dice. Sin barrios de cena en el destino, el que diga el bloque, si lo dice.
    const lastOfAfternoon = afternoon ? unitsForBlock(afternoon.id, 'tarde').at(-1)?.places.at(-1) : null
    const nearestDinner = lastOfAfternoon
      ? dinnerZones(destData)
          .map((option) => ({ option, walk: travel.leg(lastOfAfternoon.end_coordinates ?? lastOfAfternoon.coordinates, option.coordinates)?.minutes ?? Infinity }))
          .sort((a, b) => a.walk - b.walk || a.option.id.localeCompare(b.option.id, 'es'))[0]?.option ?? null
      : null
    const dinnerZone = nearestDinner?.id ?? (afternoon ? blocks[afternoon.id].dinner_zone_if_afternoon ?? null : null)
    const dinnerCoords = nearestDinner?.coordinates ?? (dinnerZone ? destData.meal_zones?.[dinnerZone]?.cena?.coordinates ?? null : null)
    const hours = hoursFor(dayNumber)
    const run = (dayMode, dayUnits) =>
      scheduleFixedOrder({
        units: dayUnits,
        mode: dayMode,
        travel,
        start: { minutes: morning ? dayMode.dayStart : toMinutes(blocks[afternoon.id]?.afternoon_start ?? DEFAULT_AFTERNOON_START), coordinates: null },
        pendingMeals: { lunch: Boolean(morning), dinner: Boolean(afternoon) },
        dinnerPoint: dinnerCoords,
        // Una mañana sin tarde (la de la salida) acaba en la comida.
        visitsEndByLunch: Boolean(morning) && !afternoon,
        hours,
        lunchSpots: lunchSpotList,
      })
    const essentialLoss = (result) => result.dropped.flatMap(({ unit }) => unit.places).filter((place) => place.level === 1).length
    let schedule = run(mode, units)
    let modeFallback = null
    if (hasPlanB && morning && essentialLoss(schedule) > 0) {
      const alt = run(normalMode, units)
      if (essentialLoss(alt) < essentialLoss(schedule)) {
        const recovered = schedule.dropped.filter(({ unit }) => !alt.dropped.some((d) => d.unit === unit)).map(({ unit }) => unit.id)
        schedule = alt
        modeFallback = { recoveredUnitIds: recovered, startedAt: normalMode.dayStart }
      }
    }
    // Un imprescindible con `pass_by` que no llega a su cierre (el Foro, con Roma Antigua por la
    // tarde) se ve POR FUERA: paso gratis al final del día, con su mensaje (decisión del 2026-09-24).
    // Si el grupo entero se cae (ritmo tranquilo con horario de invierno: el Coliseo no llega), se ven
    // por fuera todos los suyos que tengan paso, antes que dejar la tarde vacía.
    const passByUnits = []
    for (const { unit } of schedule.dropped) {
      for (const place of unit.places) {
        if (place.level !== 1 || !place.pass_by || !place.group) continue
        const label = place.pass_by.label ?? place.name
        const capitalized = `${label.charAt(0).toUpperCase()}${label.slice(1)}`
        // Visto desde un sitio (el Foro desde la Via dei Fori Imperiali): "a tus pies"; si no, por fuera.
        const reason = place.pass_by.from
          ? `${capitalized} por dentro no da tiempo hoy, pero desde aquí lo tienes entero a tus pies.`
          : `${capitalized} por dentro no da tiempo hoy, pero por fuera lo tienes entero.`
        passByUnits.push({
          group: place.group,
          groupOrder: place.group_order ?? 0,
          id: `${place.name} (de paso)`,
          places: [{ name: place.name, coordinates: place.pass_by.coordinates ?? place.coordinates, duration_minutes: place.pass_by.minutes ?? 15, type: 'exterior', tags: place.tags ?? [], wikipedia_title: place.wikipedia_title, zone: place.zone, level: 1, passBy: { seenOnDay: null, includes: place.pass_by.includes ?? [], from: place.pass_by.from ?? null } }],
          dropRank: DROP_RANK.extra,
          slot: 'tarde',
          role: 'extra',
          priority: PRIORITY.FILLER,
          isRevisit: true,
          revisitReason: reason,
        })
      }
    }
    if (passByUnits.length > 0) {
      passByUnits.sort((a, b) => a.groupOrder - b.groupOrder)
      // Cada paso por fuera va pegado a su grupo (justo después de lo que queda de él, o donde
      // estaba), no al final del día: el grupo no se parte con otras paradas en medio.
      const keptById = new Map(schedule.kept.map((unit) => [unit.id, unit]))
      const sequence = []
      for (const unit of units) {
        if (keptById.has(unit.id)) sequence.push(keptById.get(unit.id))
        const groups = new Set(unit.places.map((place) => place.group).filter(Boolean))
        sequence.push(...passByUnits.filter((passBy) => groups.has(passBy.group) && !sequence.includes(passBy)))
      }
      const withPassBy = run(modeFallback ? normalMode : mode, sequence)
      if (withPassBy.dropped.length === 0) schedule = { ...withPassBy, dropped: [...schedule.dropped] }
    }
    const kept = schedule.kept
    return {
      dayNumber,
      weekday: hours.weekday,
      hours,
      units: kept,
      schedule: { ...schedule, modeFallback },
      lunchZone,
      dinnerZone,
      blocks: daySlots.map((a) => ({ id: a.id, slot: a.slot, label: a.id === freeTourBlock ? 'Free Tour' : blocks[a.id].label })),
      isBlank: false,
      isExcursion: false,
      halfDayExcursion: null,
      curated: null,
    }
  })
  // Lugar a lugar, no por unidad: el Vaticano son tres lugares (una joya y dos imprescindibles), y
  // contado como una sola joya salía "más barato" tirarlo entero que perder Trevi y Plaza de España.
  const lossOf = (days) =>
    days
      .flatMap((day) => day.schedule.dropped)
      .flatMap(({ unit }) => unit.places.map((place) => (place.tier === 'joya' ? LOSS_WEIGHT.joya : LOSS_WEIGHT[unit.role] ?? LOSS_WEIGHT.core)))
      .reduce((sum, weight) => sum + weight, 0)
  const chooseBest = () => {
    let best = null
    for (const assignment of assignments) {
      const days = buildDays(assignment)
      const loss = lossOf(days)
      if (!best || loss < best.loss) best = { assignment, days, loss }
      if (loss === 0) break
    }
    return best
  }
  let best = chooseBest()
  // Lo que el pool pidió y no ha cabido devuelve su sitio a lo que sustituyó: si no, se perdían los
  // dos (la Galería Borghese no cabía y la Plaza Venecia ya se había quitado para hacerle hueco).
  const droppedNames = () => new Set(best.days.flatMap((day) => day.schedule.dropped.flatMap(({ unit }) => unit.places.map((place) => place.name))))
  const undone = substitutions.filter((sub) => droppedNames().has(sub.poolName))
  if (undone.length > 0) {
    for (const sub of undone) {
      stopsByBlock.get(sub.blockId)[sub.index] = sub.original
      if (sub.partner) stopsByBlock.get(sub.blockId)[sub.partnerIndex] = sub.partner
      notIncluded.push({ name: sub.poolName, reason: 'No te dio tiempo' })
    }
    best = chooseBest()
  }
  for (const sub of substitutions) {
    if (undone.includes(sub)) continue
    for (const replaced of [sub.original, sub.partner].filter(Boolean)) notIncluded.push({ name: replaced.name, reason: `Sustituido por ${sub.poolName}, que elegiste` })
  }
  const { assignment, days } = best
  for (const day of days) {
    for (const { unit, reason } of day.schedule.dropped) {
      for (const place of unit.places) notIncluded.push({ name: place.name, reason: 'No te dio tiempo', detail: reason })
    }
  }
  if (nightHint) days[days.length - 1].nightHint = nightHint

  return { days, notIncluded, assignment }
}
