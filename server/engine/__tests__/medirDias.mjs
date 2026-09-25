/**
 * Métricas de calidad del DÍA CONSTRUIDO, para comparar motores con la misma vara.
 *
 *   node server/engine/__tests__/medirDias.mjs                       # motor nuevo, todas las variantes
 *   node server/engine/__tests__/medirDias.mjs --motor ambos          # viejo y nuevo lado a lado
 *   node server/engine/__tests__/medirDias.mjs --motor todos          # viejo, nuevo y v3
 *   node server/engine/__tests__/medirDias.mjs --salida docs/metricas/motor-actual.json
 *   node server/engine/__tests__/medirDias.mjs --caso 3 nonstop arte_museos,free_tour
 *   node server/engine/__tests__/medirDias.mjs --motor v3 --semaforo              # destino listo = todo en verde
 *   node server/engine/__tests__/medirDias.mjs --destino lisboa --motor v3 --semaforo
 *
 * Por qué hace falta además de verifyPreplan/verifyDays: esos dos comprueban reglas (pasa o no
 * pasa) y verifyPreplan mira el REPARTO. El reparto de la ruta de Roma de 3 días salía perfecto —
 * 0 errores en 336 días— mientras el día construido perdía el Coliseo y acababa a las 17:20. Lo
 * que el viajero ve es el día construido, así que es lo que se mide aquí, y con números: horas
 * muertas, a qué hora acaba, qué se ha perdido por el camino.
 *
 * Los tiempos a pie salen de la matriz precalculada (data/pipeline_v2/travel/roma.json), que se
 * generó con la misma API que el motor usa en producción. Las llamadas del motor a Mapbox se
 * contestan desde la matriz: la medición es determinista, sin red y sin coste.
 *
 * Las referencias contra las que se mide son las DECISIONES del motor nuevo (2026-09-23), no las
 * constantes del motor actual: comida 13:00-14:00, cena 20:00-21:00 en los dos ritmos, comida de 60
 * min en completo y 90 en tranquilo, día que acaba con la cena hacia las 21:30.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTravelTimes } from '../../../shared/routeEngine/travelTimes.js'
import { earliestVisitStart, effectiveSchedule, lastEntryMinutes, seasonKey } from '../../../shared/routeEngine/openingHours.js'
import { tripCalendar } from '../../../shared/routeEngine/tripCalendar.js'
import { roundUpToQuarter } from '../../../shared/routeEngine/time.js'
import { dinnerZones } from '../../../shared/routeEngine/dinnerZones.js'
import { buildDayBlockV3 } from '../index.js'
import { preplanTrip } from '../preplan.js'
import { interestTagsFor, TAG_INTEREST_MAP } from '../experienceTags.js'
import { buildDayBlockV2, findPipelineV2Data, parseHoursSessions } from '../../routeAlgorithm.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
// Cualquier destino curado (--destino roma por defecto); su matriz: data/pipeline_v2/travel/<destino>.json.
const destinoIndex = process.argv.indexOf('--destino')
const DESTINO = (destinoIndex >= 0 ? process.argv[destinoIndex + 1] : 'roma').toLowerCase()
const D = findPipelineV2Data(DESTINO)
if (!D) throw new Error(`medirDias: no hay datos de "${DESTINO}" en data/pipeline_v2/`)
// Regla general: afternoon_flow y short_trips son OPCIONALES — el motor tiene que dar buenas rutas
// sin ellos (el kit los propone como borrador). Con --sin-opcionales se mide así.
if (process.argv.includes('--sin-opcionales')) {
  delete D.afternoon_flow
  delete D.short_trips
}
const MATRIX = JSON.parse(readFileSync(join(ROOT, `data/pipeline_v2/travel/${DESTINO}.json`), 'utf8'))
const travel = createTravelTimes(MATRIX)

// ── Argumentos ──────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const flag = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}
const MOTORES = { nuevo: ['nuevo'], viejo: ['viejo'], v3: ['v3'], ambos: ['viejo', 'nuevo'], todos: ['viejo', 'nuevo', 'v3'] }[flag('--motor') ?? 'nuevo']
const SALIDA = flag('--salida')
const SEMAFORO = args.includes('--semaforo')
const FECHA = flag('--fecha') // sin fecha, closed_on no se aplica (igual que en la app)
// Época del formulario (winter | spring | summer | autumn): horarios por temporada. Sin ella, los
// prudentes. Con --fecha, la época sale de la fecha y el horario es el del día de la semana.
const TEMPORADA = flag('--temporada')
// Mes del viaje sin fechas (1-12, como se dice: --mes 10 = octubre). El motor usa el día 15 de ese mes
// (Estaciones, Parte 1). --temporada queda como compatibilidad: su mes central.
const MES = flag('--mes') ? Number(flag('--mes')) - 1 : null
const CALENDARIO = tripCalendar({ dateRangeStartIso: FECHA, month: MES, season: TEMPORADA })
const HOURS = { season: CALENDARIO.season ?? seasonKey(TEMPORADA, FECHA), dateIso: CALENDARIO.referenceIso }
const casoIndex = args.indexOf('--caso')
const CASO = casoIndex >= 0 ? { days: Number(args[casoIndex + 1]), pace: args[casoIndex + 2], exps: (args[casoIndex + 3] ?? '').split(',').filter(Boolean) } : null

// ── Referencias (las decisiones del motor nuevo) ────────────────────────────────────────────

const REF = {
  lunchWindow: [13 * 60, 14 * 60],
  dinnerWindow: [20 * 60, 21 * 60],
  mealMinutes: { nonstop: 60, tranquilo: 90 },
  gapTolerance: { nonstop: 45, tranquilo: 60 },
  dayEndWithDinner: 21 * 60 + 30,
}

// ── Mapbox contestado desde la matriz ───────────────────────────────────────────────────────

let legsFromMatrix = 0
let legsEstimated = 0
globalThis.fetch = async (url) => {
  const match = String(url).match(/directions\/v5\/mapbox\/walking\/([-\d.]+),([-\d.]+);([-\d.]+),([-\d.]+)/)
  if (!match) throw new Error(`medirDias: llamada de red inesperada: ${String(url).slice(0, 80)}`)
  const [, lng1, lat1, lng2, lat2] = match.map(Number)
  const leg = travel.leg([lat1, lng1], [lat2, lng2])
  if (leg.source === 'matrix') legsFromMatrix++
  else legsEstimated++
  return { ok: true, json: async () => ({ routes: [{ duration: leg.minutes * 60, distance: leg.meters }] }) }
}

// ── Utilidades ──────────────────────────────────────────────────────────────────────────────

const t2m = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}
const m2t = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(Math.round(total % 60)).padStart(2, '0')}`
const placeByName = new Map(D.places.map((place) => [place.name, place]))
const coordsOfStop = (stop) => [stop.latitude, stop.longitude]
const walk = (a, b) => travel.leg(coordsOfStop(a), coordsOfStop(b))

/** Grupos del JSON: nombre del grupo -> miembros en su orden. */
const GROUPS = new Map()
for (const place of D.places) {
  if (!place.group) continue
  if (!GROUPS.has(place.group)) GROUPS.set(place.group, [])
  GROUPS.get(place.group).push(place)
}
for (const members of GROUPS.values()) members.sort((a, b) => (a.group_order ?? 0) - (b.group_order ?? 0))

const DINNER_ZONES = dinnerZones(D)
const LEVEL1_NAMES = D.places.filter((place) => place.level === 1).map((place) => place.name)

/** ¿Está abierto de `start` a `start + duration`? Con `last_entry` si el lugar lo trae (campo opcional). */
function outOfHours(stop) {
  const place = placeByName.get(stop.name)
  // Una parada "de paso" se ve por fuera (el Foro, desde la Via dei Fori Imperiali): no tiene puerta.
  if (!place || stop.is_pass_by || stop.pass_through) return null
  const start = t2m(stop.suggested_time)
  const end = start + stop.duration_minutes
  const lastEntry = lastEntryMinutes(place, start, HOURS)
  if (lastEntry !== null && start > lastEntry) return `empieza ${stop.suggested_time}, última entrada ${m2t(lastEntry)}`
  // El horario de la parada tal como lo manda el motor (el del día: fecha, época o lunes a viernes);
  // si no lo trae, el efectivo del motor v3 (interiores sin horario: 09:00-17:00).
  const schedule = stop.hours ?? effectiveSchedule(place, HOURS)
  const sessions = parseHoursSessions(schedule)
  if (sessions.length === 0) return null
  const inside = sessions.some((session) => start >= session.open && end <= session.close)
  return inside ? null : `${stop.suggested_time}-${m2t(end)} fuera de "${schedule}"`
}

/** Piezas de tarde hasta las que se prueban todos los órdenes para el mínimo (8! = 40.320). */
const MAX_PIEZAS_TARDE = 8

/**
 * Km de la tarde: los que se andan y el MÍNIMO posible con las mismas paradas (decisión del
 * 2026-09-23: "km andados frente al mínimo posible"). Mismo punto de salida (la última parada antes
 * de comer), misma llegada (el barrio de la cena, si el motor lo dice) y respetando horarios y
 * grupos del JSON; lo que va dentro de otro (`contained_in`) sigue a su contenedor y lo "de paso",
 * al final. El orden curado NO se respeta aquí: el mínimo es el de verdad, así que lo que quede de
 * diferencia en v3 es lo que cuesta mantener el orden escrito a mano.
 * @returns {{real: number, min: number} | null}  metros; null si la tarde no se puede medir
 */
function afternoonMeters(dayStops, lunchAt, pace, dinnerStop, lunchCoords = null) {
  if (lunchAt === null) return null
  const before = dayStops.filter((stop) => t2m(stop.suggested_time) < lunchAt)
  const after = dayStops.filter((stop) => t2m(stop.suggested_time) >= lunchAt)
  if (after.length < 2) return null
  // La tarde sale del restaurante de la comida (Paso 2), si el motor lo dice.
  const start = lunchCoords ?? (before.length ? coordsOfStop(before[before.length - 1]) : null)
  const end = dinnerStop?.coordinates ?? null

  // Piezas: un grupo del JSON o un contenedor con lo suyo van juntos; lo de paso, fijo al final.
  const pieces = []
  const tail = []
  for (const stop of after) {
    if (stop.is_pass_by) {
      tail.push(stop)
      continue
    }
    const place = placeByName.get(stop.name)
    const last = pieces[pieces.length - 1]
    const lastPlace = last ? placeByName.get(last[last.length - 1].name) : null
    const sameGroup = last && place?.group && lastPlace?.group === place.group
    const inside = last && place?.contained_in && last.some((s) => s.name === place.contained_in || placeByName.get(s.name)?.contained_in === place.contained_in)
    // La bajada natural (`leads_to`: del Campidoglio al Barrio Judío) va seguida, como en el motor.
    const leads = last && (lastPlace?.leads_to ?? []).includes(stop.name)
    if (sameGroup || inside || leads) last.push(stop)
    else pieces.push([stop])
  }
  if (pieces.length > MAX_PIEZAS_TARDE) return null

  const firstStart = t2m(after[0].suggested_time)
  // Como el motor: primero los órdenes sin esperas por encima de la tolerancia del ritmo (no se
  // espera dos horas al atardecer pudiendo aprovecharlas), y de esos el que menos camina.
  let longWait = false
  const measure = (order, checkHours) => {
    let cursor = firstStart
    let position = start
    let meters = 0
    longWait = false
    for (const stop of order.flat().concat(tail)) {
      const coords = coordsOfStop(stop)
      const leg = position ? travel.leg(position, coords) : { minutes: 0, meters: 0 }
      meters += leg.meters
      const place = placeByName.get(stop.name)
      let at = roundUpToQuarter(cursor + leg.minutes)
      // El mirador del atardecer tiene su ventana (de 45 min antes a 15 min después de la puesta de sol).
      if (checkHours && stop.sunset_minutes != null) {
        at = Math.max(at, stop.sunset_minutes - 45)
        if (at > stop.sunset_minutes + 15) return null
      }
      if (checkHours && place && !stop.is_pass_by) {
        // El horario del DÍA que trae la parada (el del día de la semana o la época), como el motor.
        at = earliestVisitStart(stop.hours ?? effectiveSchedule(place, HOURS), at, stop.duration_minutes, roundUpToQuarter)
        if (at === null) return null
      }
      if (checkHours && at - (cursor + leg.minutes) > REF.gapTolerance[pace]) longWait = true
      cursor = at + stop.duration_minutes
      position = coords
    }
    if (end) {
      const leg = travel.leg(position, end)
      meters += leg.meters
      if (checkHours && dinnerStop.at !== null && cursor + leg.minutes > dinnerStop.at) return null
    }
    return meters
  }
  const real = measure(pieces, false)
  let min = real
  let minWithoutLongWait = Infinity
  // El orden curado del día (fijado a mano) no se invierte: el mínimo es el de las mismas paradas
  // respetándolo, así que el coste de ese orden no cuenta como zigzag (decisión del 2026-09-24).
  const curatedOf = (piece) => piece.find((stop) => stop.curated_index != null)?.curated_index ?? null
  const keepsCurated = (order) => {
    const indices = order.map(curatedOf).filter((index) => index !== null)
    return indices.every((index, i) => i === 0 || index >= indices[i - 1])
  }
  // Un grupo que la comida parte en dos (Panteón → comida → Navona) sigue justo al volver: su parte
  // de la tarde va fija delante.
  const lastMorningGroup = before.length ? placeByName.get(before[before.length - 1].name)?.group : null
  const pinned = lastMorningGroup ? pieces.find((piece) => placeByName.get(piece[0].name)?.group === lastMorningGroup) : null
  const permute = (rest, order) => {
    if (pinned && order.length > 0 && order[0] !== pinned) return
    if (!keepsCurated(order)) return
    if (rest.length === 0) {
      const meters = measure(order, true)
      if (meters !== null && meters < min) min = meters
      if (meters !== null && !longWait && meters < minWithoutLongWait) minWithoutLongWait = meters
      return
    }
    for (let i = 0; i < rest.length; i++) permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...order, rest[i]])
  }
  permute(pieces, [])
  // Si hay algún orden sin esperas largas, el mínimo es el de esos (y nunca por debajo del real si el real es uno de ellos).
  if (Number.isFinite(minWithoutLongWait)) min = Math.min(real, minWithoutLongWait)
  return { real, min }
}

// ── Construcción de un viaje con un motor ───────────────────────────────────────────────────

async function buildTrip(motor, contentDays, pace, exps) {
  const totalDays = contentDays + 1 // el servidor suma la vuelta: all_days.length + 1
  const hasFreeTour = exps.includes('free_tour')
  const experiencesPositive = ['imprescindibles', ...exps]
  const days = []
  for (let dayNumber = 1; dayNumber <= contentDays; dayNumber++) {
    const day =
      motor !== 'viejo'
        ? await buildDayBlockV3(D, totalDays, hasFreeTour, dayNumber, pace, 'matriz', FECHA, [], experiencesPositive, { city: D.destination, scheduler: motor === 'v3' ? 'v3' : undefined, month: MES, season: TEMPORADA })
        : await buildDayBlockV2(D, totalDays, hasFreeTour, dayNumber, pace, 'matriz', FECHA, [], experiencesPositive)
    days.push(day)
  }
  // En v3 no hay un reparto aparte con el que comparar: el reparto ya le pregunta al programador.
  const plan = motor === 'nuevo' ? preplanTrip({ destData: D, totalDays, pace, hasFreeTour, poolNames: [], experiencesPositive, dateRangeStartIso: FECHA }) : null
  return { days, plan, totalDays, hasFreeTour, experiencesPositive, motor }
}

// ── Métricas de un día ──────────────────────────────────────────────────────────────────────

function measureDay(day, pace, interestTags, plannedNames) {
  if (!day) return { kind: 'sin_dia' }
  if (day.type === 'excursion' || (Array.isArray(day.excursion_options) && day.excursion_options.length > 0 && !(day.stops?.length > 0))) return { kind: 'excursion' }
  const dayStops = (day.stops ?? []).filter((stop) => !stop.is_night_experience)
  if (dayStops.length === 0) return { kind: 'vacio' }

  const lunch = day.meals?.find((meal) => meal.time === 'lunch')
  const dinner = day.meals?.find((meal) => meal.time === 'dinner')
  const lunchAt = lunch ? t2m(lunch.suggested_time) : null
  const dinnerAt = dinner ? t2m(dinner.suggested_time) : null
  const meal = REF.mealMinutes[pace]

  const gaps = []
  let walkMeters = 0
  for (let i = 1; i < dayStops.length; i++) {
    const prev = dayStops[i - 1]
    const next = dayStops[i]
    const prevEnd = t2m(prev.suggested_time) + prev.duration_minutes
    const nextStart = t2m(next.suggested_time)
    const leg = walk(prev, next)
    walkMeters += leg?.meters ?? 0
    // Entre la mañana y la tarde está la comida: ese tramo se mide aparte.
    if (lunchAt !== null && prevEnd <= lunchAt && nextStart >= lunchAt) continue
    // toFixedTime: la espera antes de algo con hora fija (el Free Tour) es a propósito, no un hueco del motor.
    gaps.push({ from: prev.name, to: next.name, idle: nextStart - prevEnd - (leg?.minutes ?? 0), walk: leg?.minutes ?? 0, toFixedTime: Boolean(next.is_free_tour || next.sunset_minutes != null) })
  }

  const morning = lunchAt === null ? [] : dayStops.filter((stop) => t2m(stop.suggested_time) < lunchAt)
  const afternoon = lunchAt === null ? dayStops : dayStops.filter((stop) => t2m(stop.suggested_time) >= lunchAt)
  const endOf = (stop) => t2m(stop.suggested_time) + stop.duration_minutes
  const lastEnd = endOf(dayStops[dayStops.length - 1])

  const builtNames = new Set(dayStops.map((stop) => stop.name))
  const dropped = plannedNames ? [...plannedNames].filter((name) => !builtNames.has(name)) : []

  const freeTour = dayStops.find((stop) => stop.is_free_tour)
  const dinnerCoords = day.dinner_zone ? (DINNER_ZONES.find((zone) => zone.id === day.dinner_zone)?.coordinates ?? D.meal_zones?.[day.dinner_zone]?.cena?.coordinates ?? null) : null
  const lunchMeal = (day.meals ?? []).find((meal) => meal.time === 'lunch')
  const lunchCoords = typeof lunchMeal?.latitude === 'number' ? [lunchMeal.latitude, lunchMeal.longitude] : null
  const tarde = afternoonMeters(dayStops, lunchAt, pace, dinnerCoords ? { coordinates: dinnerCoords, at: dinnerAt } : null, lunchCoords)

  return {
    kind: 'ciudad',
    stops: dayStops.length,
    // Para el ritmo, el Free Tour cuenta como los lugares que recorre (decisión del 2026-09-23).
    placesSeen: dayStops.reduce((sum, stop) => sum + (stop.is_free_tour ? Math.max(1, stop.free_tour_covers?.length ?? 1) : 1), 0),
    firstStart: t2m(dayStops[0].suggested_time),
    lastEnd,
    idleBetweenStops: gaps.reduce((sum, gap) => sum + Math.max(0, gap.idle), 0),
    maxGap: gaps.reduce((max, gap) => Math.max(max, gap.idle), 0),
    gapsOverTolerance: gaps.filter((gap) => gap.idle > REF.gapTolerance[pace]),
    waitBeforeLunch: lunchAt !== null && morning.length > 0 ? lunchAt - endOf(morning[morning.length - 1]) : null,
    // Contra la comida de REFERENCIA del ritmo: en tranquilo sale negativo si la tarde pisa la sobremesa.
    idleAfterLunch: lunchAt !== null && afternoon.length > 0 && t2m(afternoon[0].suggested_time) >= lunchAt ? t2m(afternoon[0].suggested_time) - (lunchAt + meal) : null,
    deadBeforeDinner: dinnerAt !== null ? dinnerAt - lastEnd : null,
    // Tarde libre: el destino ya no daba para más ese día (decisión del 2026-09-24). Amarillo, no rojo.
    freeAfternoon: Boolean(day.free_afternoon),
    // El hueco más largo del día (Parte A, regla 7): entre paradas, antes de comer o la tarde libre.
    deadMax: Math.max(
      0,
      ...gaps.map((gap) => gap.idle),
      lunchAt !== null && morning.length > 0 ? lunchAt - endOf(morning[morning.length - 1]) : 0,
      day.free_afternoon?.minutes ?? 0,
    ),
    lunchInWindow: lunchAt === null ? null : lunchAt >= REF.lunchWindow[0] && lunchAt <= REF.lunchWindow[1],
    dinnerInWindow: dinnerAt === null ? null : dinnerAt >= REF.dinnerWindow[0] && dinnerAt <= REF.dinnerWindow[1],
    dayEndWithDinner: dinnerAt !== null ? dinnerAt + meal : lastEnd,
    walkKm: walkMeters / 1000,
    revisits: dayStops.filter((stop) => stop.is_revisit && !stop.is_pass_by).length,
    afternoonKm: tarde ? tarde.real / 1000 : null,
    afternoonMinKm: tarde ? tarde.min / 1000 : null,
    outOfHours: dayStops.map((stop) => ({ name: stop.name, why: outOfHours(stop) })).filter((item) => item.why),
    dropped,
    themeStops: dayStops.filter((stop) => (placeByName.get(stop.name)?.tags ?? []).some((tag) => interestTags.has(tag))).length,
    zones: new Set(dayStops.map((stop) => placeByName.get(stop.name)?.zone).filter(Boolean)).size,
    freeTourStart: freeTour ? freeTour.suggested_time : null,
    timeline: dayStops.map((stop) => `${stop.suggested_time} ${stop.name} (${stop.duration_minutes}m)`),
    meals: { lunch: lunch?.suggested_time ?? null, lunchEnd: lunch?.window_end ?? null, lunchAt: lunch?.restaurant ?? lunch?.zone ?? null, dinner: dinner?.suggested_time ?? null },
    gaps,
    unscheduled: day.unscheduled ?? null,
  }
}

// ── Métricas del viaje ──────────────────────────────────────────────────────────────────────

function measureTrip(trip, pace, exps) {
  const interestTags = interestTagsFor(exps.filter((id) => id !== 'free_tour'))
  const dayMetrics = trip.days.map((day, index) => {
    const planDay = trip.plan?.days.find((d) => d.dayNumber === index + 1)
    const planned = planDay && !planDay.isBlank && !planDay.isExcursion
      ? new Set(['morning', 'afternoon'].flatMap((slot) => planDay.slots[slot].units.filter((u) => !u.isFreeTour).flatMap((u) => u.places.map((p) => p.name))))
      : null
    const measured = measureDay(day, pace, interestTags, planned)
    // v3: lo que no ha cabido en ningún día viaja en not_included, con su motivo.
    if (trip.motor === 'v3' && measured.kind === 'ciudad' && index === 0) measured.dropped = (day.not_included ?? []).map((item) => item.name)
    return { dayNumber: index + 1, isLastDay: index === trip.days.length - 1, untypedHalves: day?.untyped_halves ?? 0, ...measured }
  })

  // Dónde cae cada lugar en el viaje, para grupos y nivel 1.
  const dayOf = new Map()
  const positionOf = new Map()
  // Lo que va entre dos del mismo grupo por orden de un bloque curado (mañanas y tardes tipo): el
  // bloque manda (Panteón → Minerva → San Luigi → Navona).
  const curatedAt = new Map()
  trip.days.forEach((day, index) => {
    // Lo visto "de paso" por un imprescindible que no llega a su cierre (el Foro desde la Via dei Fori
    // Imperiali, decisión del 2026-09-24) cuenta como visto para su grupo.
    ;(day?.stops ?? []).filter((stop) => !stop.is_night_experience && (!stop.is_revisit || stop.instead_of_visit)).forEach((stop, position) => {
      // Lo de pago visto por fuera desde su grupo (el Castillo desde el Puente) también.
      for (const name of [stop.place_name ?? stop.name, ...(stop.instead_of_visit ? stop.pass_by_includes ?? [] : []), ...(stop.outside_of ?? [])]) {
        if (!dayOf.has(name)) {
          dayOf.set(name, index + 1)
          positionOf.set(name, position)
        }
        curatedAt.set(`${index + 1}:${position}`, stop.curated_index != null)
      }
    })
  })
  // Lo que recorre el Free Tour se ve con el tour (motor v3): cuenta como visto para nivel 1, pero
  // no como parada, así que no entra en la comprobación de grupos.
  const seenWithTour = new Set()
  trip.days.forEach((day, index) => {
    for (const stop of day?.stops ?? []) {
      for (const name of stop.free_tour_covers ?? []) {
        if (dayOf.has(name)) continue
        seenWithTour.add(name)
        dayOf.set(name, index + 1)
      }
    }
  })

  const brokenGroups = []
  for (const [group, members] of GROUPS) {
    const present = members.filter((member) => dayOf.has(member.name) && !seenWithTour.has(member.name))
    if (present.length === 0) continue
    // Lo que se ve con el Free Tour (Navona, del grupo Panteón + Navona) cuenta como visto: no falta.
    const missing = members.filter((member) => !dayOf.has(member.name) && !seenWithTour.has(member.name))
    if (missing.length > 0) {
      brokenGroups.push(`${group}: solo ${present.map((m) => m.name).join(' + ')} (faltan ${missing.map((m) => m.name).join(', ')})`)
      continue
    }
    const days = new Set(present.map((member) => dayOf.get(member.name)))
    if (days.size > 1) brokenGroups.push(`${group}: repartido en días ${[...days].join(', ')}`)
    else {
      // Lo visto desde un paso por fuera comparte parada con él: se cuentan paradas distintas.
      const positions = [...new Set(present.map((member) => positionOf.get(member.name)))]
      const day = [...days][0]
      const between = []
      for (let p = Math.min(...positions) + 1; p < Math.max(...positions); p++) if (!positions.includes(p)) between.push(p)
      const byBlock = between.every((p) => curatedAt.get(`${day}:${p}`)) && positions.every((p) => curatedAt.get(`${day}:${p}`))
      if (between.length > 0 && !byBlock) brokenGroups.push(`${group}: con otras paradas en medio`)
    }
  }

  const cityDays = dayMetrics.filter((d) => d.kind === 'ciudad').length
  const missingLevel1 = cityDays > 0 ? LEVEL1_NAMES.filter((name) => !dayOf.has(name)) : []
  const defaultTime = D.default_free_tour?.default_time ?? null
  const freeTourOffTime = trip.hasFreeTour ? dayMetrics.filter((d) => d.freeTourStart && d.freeTourStart !== defaultTime).length : 0

  return { days: dayMetrics, brokenGroups, missingLevel1, freeTourOffTime }
}

// ── Variantes ───────────────────────────────────────────────────────────────────────────────

const THEMES = [[], ['arte_museos'], ['barrios_sabores'], ['naturaleza_vistas']]
const variants = []
if (CASO) variants.push(CASO)
else {
  for (const pace of ['nonstop', 'tranquilo']) {
    for (let days = 1; days <= 7; days++) {
      for (const themes of THEMES) {
        for (const ft of [false, true]) variants.push({ days, pace, exps: [...themes, ...(ft ? ['free_tour'] : [])] })
      }
    }
  }
}

const results = []
for (const motor of MOTORES) {
  for (const variant of variants) {
    const trip = await buildTrip(motor, variant.days, variant.pace, variant.exps)
    results.push({ motor, ...variant, ...measureTrip(trip, variant.pace, variant.exps) })
  }
}

// ── Informe ─────────────────────────────────────────────────────────────────────────────────

const avg = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const fmt = (value, digits = 0) => (value === null || value === undefined ? '—' : Number(value).toFixed(digits))
const pct = (values) => (values.length ? `${Math.round((values.filter(Boolean).length / values.length) * 100)}%` : '—')

function summarize(rows) {
  const cityDays = rows.flatMap((row) => row.days.filter((d) => d.kind === 'ciudad'))
  return {
    viajes: rows.length,
    diasCiudad: cityDays.length,
    paradasMedia: avg(cityDays.map((d) => d.stops)),
    muertoEntreParadas: avg(cityDays.map((d) => d.idleBetweenStops)),
    huecoMaximo: Math.max(0, ...cityDays.map((d) => d.maxGap)),
    huecosSobreTolerancia: cityDays.reduce((sum, d) => sum + d.gapsOverTolerance.length, 0),
    esperaAntesDeComer: avg(cityDays.map((d) => d.waitBeforeLunch).filter((v) => v !== null)),
    muertoTrasComer: avg(cityDays.map((d) => d.idleAfterLunch).filter((v) => v !== null)),
    muertoAntesDeCenar: avg(cityDays.map((d) => d.deadBeforeDinner).filter((v) => v !== null)),
    finUltimaParada: avg(cityDays.map((d) => d.lastEnd)),
    comidaEnVentana: pct(cityDays.map((d) => d.lunchInWindow).filter((v) => v !== null)),
    cenaEnVentana: pct(cityDays.map((d) => d.dinnerInWindow).filter((v) => v !== null)),
    kmAPie: avg(cityDays.map((d) => d.walkKm)),
    // Tarde: cuánto de más se anda frente al mínimo con las mismas paradas (en % de ese mínimo).
    kmTardeDeMas: (() => {
      const measured = cityDays.filter((d) => d.afternoonKm !== null)
      const real = measured.reduce((sum, d) => sum + d.afternoonKm, 0)
      const min = measured.reduce((sum, d) => sum + d.afternoonMinKm, 0)
      return min > 0 ? ((real - min) / min) * 100 : null
    })(),
    tardesConZigzag: cityDays.filter((d) => d.afternoonKm !== null && d.afternoonKm - d.afternoonMinKm > 0.4).length,
    fueraDeHorario: cityDays.reduce((sum, d) => sum + d.outOfHours.length, 0),
    perdidasPorElConstructor: cityDays.reduce((sum, d) => sum + d.dropped.length, 0),
    viajesSinAlgunNivel1: rows.filter((row) => row.missingLevel1.length > 0).length,
    gruposRotos: rows.reduce((sum, row) => sum + row.brokenGroups.length, 0),
    freeTourFueraDeHora: rows.reduce((sum, row) => sum + row.freeTourOffTime, 0),
  }
}

function printSummaryTable(motor) {
  const rows = results.filter((r) => r.motor === motor)
  console.log(`\n=== Motor ${motor} — ${rows.length} viajes ===`)
  console.log('ritmo      días  paradas  muerto  hueco>tol  pre-comer  post-comer  pre-cena  fin      km  tarde+%  zigzag  fuera  perdidas  sinL1  grupos')
  for (const pace of ['nonstop', 'tranquilo']) {
    for (let days = 1; days <= 7; days++) {
      const group = rows.filter((r) => r.pace === pace && r.days.length === days)
      if (group.length === 0) continue
      const s = summarize(group)
      console.log(
        `${pace.padEnd(10)} ${String(days).padStart(4)}  ${fmt(s.paradasMedia, 1).padStart(7)}  ${fmt(s.muertoEntreParadas).padStart(6)}  ${String(s.huecosSobreTolerancia).padStart(9)}  ${fmt(s.esperaAntesDeComer).padStart(9)}  ${fmt(s.muertoTrasComer).padStart(10)}  ${fmt(s.muertoAntesDeCenar).padStart(8)}  ${(s.finUltimaParada ? m2t(s.finUltimaParada) : '—').padStart(5)}  ${fmt(s.kmAPie, 1).padStart(5)}  ${fmt(s.kmTardeDeMas, 1).padStart(7)}  ${String(s.tardesConZigzag).padStart(6)}  ${String(s.fueraDeHorario).padStart(5)}  ${String(s.perdidasPorElConstructor).padStart(8)}  ${String(s.viajesSinAlgunNivel1).padStart(5)}  ${String(s.gruposRotos).padStart(6)}`,
      )
    }
  }
  const total = summarize(rows)
  console.log('\nTotal:', JSON.stringify({ ...total, finUltimaParada: total.finUltimaParada ? m2t(total.finUltimaParada) : null }, null, 1))
}

function printCase() {
  for (const row of results) {
    console.log(`\n=== ${row.motor}: ${row.days.length} días, ${row.pace}, ${row.exps.join('+') || 'solo imprescindibles'} ===`)
    for (const day of row.days) {
      console.log(`\nDía ${day.dayNumber} (${day.kind})`)
      if (day.kind !== 'ciudad') continue
      for (const line of day.timeline) console.log(`   ${line}`)
      console.log(`   comida ${day.meals.lunch ?? '—'}${day.meals.lunchEnd ? `-${day.meals.lunchEnd}` : ''}${day.meals.lunchAt ? ` (${day.meals.lunchAt})` : ''} · cena ${day.meals.dinner ?? '—'}`)
      for (const gap of day.gaps.filter((g) => g.idle > 0)) console.log(`   · ${gap.idle} min parado entre ${gap.from} → ${gap.to} (${gap.walk} min a pie)`)
      console.log(`   muerto entre paradas ${day.idleBetweenStops} min · antes de comer ${day.waitBeforeLunch ?? '—'} · tras comer ${day.idleAfterLunch ?? '—'} · antes de cenar ${day.deadBeforeDinner ?? '—'} · ${day.walkKm.toFixed(1)} km${day.afternoonKm !== null ? ` (tarde ${day.afternoonKm.toFixed(2)} km, mínimo ${day.afternoonMinKm.toFixed(2)})` : ''}`)
      if (day.dropped.length) console.log(`   NO PROGRAMADAS: ${day.dropped.map((name) => { const u = day.unscheduled?.find((item) => item.places.includes(name)); return u ? `${name} (${u.reason})` : name }).join(', ')}`)
      if (day.outOfHours.length) console.log(`   FUERA DE HORARIO: ${day.outOfHours.map((o) => `${o.name} (${o.why})`).join('; ')}`)
    }
    if (row.brokenGroups.length) console.log(`\nGrupos rotos: ${row.brokenGroups.join(' | ')}`)
    if (row.missingLevel1.length) console.log(`Nivel 1 ausente: ${row.missingLevel1.join(', ')}`)
  }
}

/**
 * Material para decidir la cuota de experiencias: cuántas unidades de cada tema hay por zona, y
 * cuántas paradas del tema salen hoy por día cuando el viajero lo elige.
 */
function printThemeSupply() {
  console.log('\n=== Oferta por tema y zona (lugares; entre paréntesis, de nivel 1) ===')
  for (const [theme, tags] of Object.entries(TAG_INTEREST_MAP)) {
    if (theme === 'free_tour') continue
    const byZone = new Map()
    for (const place of D.places) {
      if (!(place.tags ?? []).some((tag) => tags.includes(tag))) continue
      const entry = byZone.get(place.zone) ?? { all: 0, l1: 0 }
      entry.all++
      if (place.level === 1) entry.l1++
      byZone.set(place.zone, entry)
    }
    const zones = [...byZone.entries()].sort((a, b) => b[1].all - a[1].all)
    console.log(`${theme.padEnd(18)} ${zones.map(([zone, e]) => `${zone} ${e.all}(${e.l1})`).join(' · ')}`)
    for (const motor of MOTORES) {
      const days = results.filter((r) => r.motor === motor && r.exps.includes(theme)).flatMap((r) => r.days.filter((d) => d.kind === 'ciudad'))
      if (days.length === 0) continue
      const counts = days.map((d) => d.themeStops)
      const zeroDays = counts.filter((c) => c === 0).length
      console.log(`${''.padEnd(18)} motor ${motor}: ${fmt(avg(counts), 1)} paradas del tema por día · ${zeroDays}/${days.length} días sin ninguna`)
    }
  }
}

// ── Semáforo: ¿está listo el destino? ───────────────────────────────────────────────────────
//
// Límites sacados de las DECISIONES del motor (INVARIANTES_MOTOR.md), no de lo que da un destino:
// cada criterio es algo que el viajero vería mal en pantalla. Destino listo = todo en verde.
// Lo que se decidió NO perseguir (el tiempo libre antes de cenar) se enseña, pero no puntúa.

const sum = (list, fn) => list.reduce((total, item) => total + fn(item), 0)
const LATEST_FIRST_AFTERNOON_END = 16 * 60
// Los días por encima de core_days (repaso, excursión de medio día) tienen sus propias reglas
// (decisión del 2026-09-23): son días más cortos a propósito y no se miden con "acaba antes de las 16:00".
const CORE_DAYS = D.destination_config?.core_days ?? 4
const isCoreDay = (day) => day.dayNumber <= CORE_DAYS
/** Más que esto parado en mitad del viaje es una hora muerta (Parte A, regla 7). */
const DEAD_HOURS_MINUTES = 90
/** Como mucho 3 revisitas por día de repaso: más nuevos que repetidos (revisits.js). */
const MAX_REVISITS_PER_DAY = 3
const SEMAFORO_CRITERIOS = [
  { id: 'horario', label: 'Paradas fuera de horario', limite: '0', value: (rows, days) => sum(days, (d) => d.outOfHours.length), ok: (v) => v === 0 },
  { id: 'grupos', label: 'Grupos del JSON rotos (separados o incompletos)', limite: '0', value: (rows) => sum(rows, (r) => r.brokenGroups.length), ok: (v) => v === 0 },
  { id: 'freeTour', label: 'Free Tour fuera de su hora', limite: '0', value: (rows) => sum(rows, (r) => r.freeTourOffTime), ok: (v) => v === 0 },
  {
    id: 'comidas',
    label: 'Comida y cena dentro de su ventana',
    limite: '100%',
    value: (rows, days) => {
      const checks = days.flatMap((d) => [d.lunchInWindow, d.dinnerInWindow]).filter((v) => v !== null)
      return checks.length ? Math.round((checks.filter(Boolean).length / checks.length) * 100) : 100
    },
    ok: (v) => v === 100,
    fmt: (v) => `${v}%`,
  },
  // En 1-2 días no cabe todo por diseño: lo que se queda fuera sale en "No te dio tiempo".
  { id: 'nivel1', label: 'Viajes de 3+ días sin algún imprescindible', limite: '0', applies: (n) => n >= 3, value: (rows) => rows.filter((r) => r.missingLevel1.length > 0).length, ok: (v) => v === 0 },
  { id: 'fuera', label: 'Lugares que no caben, viajes de 3+ días', limite: '0', applies: (n) => n >= 3, value: (rows, days) => sum(days, (d) => d.dropped.length), ok: (v) => v === 0 },
  {
    id: 'huecos',
    label: 'Huecos entre paradas por encima de la tolerancia del ritmo (sin contar la espera a una hora fija)',
    limite: '0',
    value: (rows, days, pace) => sum(days, (d) => d.gaps.filter((g) => !g.toFixedTime && g.idle > REF.gapTolerance[pace]).length),
    ok: (v) => v === 0,
  },
  { id: 'zigzag', label: 'Tardes que andan más de 400 m de más frente al mínimo', limite: '0', value: (rows, days) => days.filter((d) => d.afternoonKm !== null && d.afternoonKm - d.afternoonMinKm > 0.4).length, ok: (v) => v === 0 },
  {
    id: 'tardeKm',
    label: 'Km de más por la tarde frente al mínimo con las mismas paradas',
    limite: '≤ 2%',
    value: (rows, days) => {
      const measured = days.filter((d) => d.afternoonKm !== null)
      const min = sum(measured, (d) => d.afternoonMinKm)
      return min > 0 ? ((sum(measured, (d) => d.afternoonKm) - min) / min) * 100 : 0
    },
    ok: (v) => v <= 2,
    fmt: (v) => `${v.toFixed(1)}%`,
  },
  { id: 'sinTarde', label: `Días de ciudad hasta core_days (${CORE_DAYS}) que acaban antes de las 16:00 (sin contar las tardes libres)`, limite: '0', value: (rows, days) => days.filter((d) => isCoreDay(d) && !d.freeAfternoon && d.lastEnd < LATEST_FIRST_AFTERNOON_END).length, ok: (v) => v === 0 },
  // Amarillo (se mira, no bloquea): tardes libres, y la que caiga en el día 2 de un viaje de 3+ días,
  // que debería estar al final.
  // Nada de horas muertas en mitad del viaje (Parte A, regla 7): un hueco de más de 90 min que no sea el
  // último día significa que falta un bloque.
  { id: 'muertas', label: 'Huecos de más de 90 min en mitad del viaje (falta un bloque)', limite: '0', value: (rows, days) => days.filter((d) => d.kind === 'ciudad' && !d.isLastDay && d.deadMax > DEAD_HOURS_MINUTES).length, ok: (v) => v === 0 },
  // Mañanas y tardes tipo (Parte B): un medio día que ningún bloque cubre se improvisa. Se mira, no bloquea.
  { id: 'sinTipo', warnOnly: true, label: 'Medios días sin tipo (ningún bloque encaja: se improvisan)', limite: '—', value: (rows, days) => days.reduce((sum, d) => sum + (d.untypedHalves ?? 0), 0), ok: (v) => v === 0 },
  { id: 'libre', warnOnly: true, label: 'Tardes libres del último día', limite: '—', value: (rows, days) => days.filter((d) => d.freeAfternoon && d.isLastDay).length, ok: (v) => v === 0 },
  {
    id: 'repaso',
    label: `Días de repaso (más allá de core_days) con más de ${MAX_REVISITS_PER_DAY} revisitas`,
    limite: '0',
    applies: (n) => n > CORE_DAYS,
    value: (rows, days) => days.filter((d) => !isCoreDay(d) && d.revisits > MAX_REVISITS_PER_DAY).length,
    ok: (v) => v === 0,
  },
  {
    id: 'ritmo',
    label: 'Días con menos lugares que el mínimo del ritmo (8 completo / 5 tranquilo; el Free Tour cuenta lo que recorre) y tarde sin llenar, hasta core_days',
    limite: '0',
    applies: (n) => n >= 2 && n <= (D.destination_config?.core_days ?? 4),
    // Un día con pocos lugares pero LLENO (grandes museos hasta la cena) no es un día corto: solo
    // cuenta si además le sobra tarde antes de cenar.
    // Una tarde libre (el destino ya no da para más ese día) es amarillo, no rojo: se cuenta aparte.
    value: (rows, days, pace) => days.filter((d) => !d.freeAfternoon && d.placesSeen < (pace === 'tranquilo' ? 5 : 8) && (d.deadBeforeDinner ?? Infinity) > REF.gapTolerance[pace]).length,
    ok: (v) => v === 0,
  },
]

function printSemaforo(motor) {
  const rows = results.filter((r) => r.motor === motor)
  const cells = []
  console.log(`\n=== Semáforo · ${D.destination} · motor ${motor} · ${rows.length} viajes ===`)
  console.log(`ritmo      días  ${SEMAFORO_CRITERIOS.map((c) => c.id.padStart(8)).join(' ')}   libre antes de cenar`)
  for (const pace of ['nonstop', 'tranquilo']) {
    for (let n = 1; n <= 7; n++) {
      const group = rows.filter((r) => r.pace === pace && r.days.length === n)
      if (group.length === 0) continue
      const days = group.flatMap((r) => r.days.filter((d) => d.kind === 'ciudad'))
      const line = SEMAFORO_CRITERIOS.map((c) => {
        if (c.applies && !c.applies(n)) return '·'.padStart(8)
        const value = c.value(group, days, pace)
        const ok = c.ok(value)
        cells.push({ criterio: c, ok, pace, n, value })
        return `${ok ? '🟢' : c.warnOnly ? '🟡' : '🔴'}${(c.fmt ?? String)(value)}`.padStart(8)
      })
      const idle = avg(days.map((d) => d.deadBeforeDinner).filter((v) => v !== null))
      console.log(`${pace.padEnd(10)} ${String(n).padStart(4)}  ${line.join(' ')}   ${fmt(idle)} min`)
    }
  }
  console.log('\nLímites (verde si se cumple):')
  for (const c of SEMAFORO_CRITERIOS) {
    const reds = cells.filter((cell) => cell.criterio === c && !cell.ok)
    const mark = reds.length ? (c.warnOnly ? '🟡' : '🔴') : '🟢'
    console.log(`  ${mark} ${c.id.padEnd(9)} ${c.limite.padEnd(5)} ${c.label}${reds.length ? ` — en ${c.warnOnly ? 'amarillo' : 'rojo'}: ${reds.map((r) => `${r.pace} ${r.n}d`).join(', ')}` : ''}`)
  }
  const blocking = cells.filter((cell) => !cell.ok && !cell.criterio.warnOnly)
  // --rojos: qué viaje pone cada casilla en rojo, con su detalle (para diagnosticar).
  if (args.includes('--rojos')) {
    for (const cell of blocking) {
      for (const row of rows.filter((r) => r.pace === cell.pace && r.days.length === cell.n)) {
        const days = row.days.filter((d) => d.kind === 'ciudad')
        if (cell.criterio.ok(cell.criterio.value([row], days, cell.pace))) continue
        const detail = cell.criterio.id === 'grupos' ? row.brokenGroups.join(' | ') : cell.criterio.id === 'nivel1' ? row.missingLevel1.join(', ') : cell.criterio.id === 'muertas' ? days.filter((d) => !d.isLastDay && d.deadMax > DEAD_HOURS_MINUTES).map((d) => `D${d.dayNumber} ${d.deadMax} min`).join(', ') : cell.criterio.id === 'zigzag' || cell.criterio.id === 'tardeKm' ? days.filter((d) => d.afternoonKm !== null && d.afternoonKm - d.afternoonMinKm > 0.05).map((d) => `D${d.dayNumber} ${d.afternoonKm.toFixed(2)}/${d.afternoonMinKm.toFixed(2)} km`).join(', '): cell.criterio.id === 'fuera' ? days.flatMap((d) => d.dropped ?? []).join(', ') : ''
        console.log(`  [${cell.criterio.id}] ${cell.pace} ${cell.n}d ${row.exps.join('+') || '—'}: ${detail}`)
      }
    }
  }
  const ready = blocking.length === 0
  console.log(`\n${ready ? '✅ DESTINO LISTO: todo en verde (amarillos: se miran, no bloquean)' : `❌ DESTINO NO LISTO: ${blocking.length} casillas en rojo`}`)
  return ready
}

if (CASO) printCase()
else if (SEMAFORO) {
  const ready = MOTORES.map((motor) => printSemaforo(motor)).every(Boolean)
  if (!ready) process.exitCode = 1
} else {
  for (const motor of MOTORES) printSummaryTable(motor)
  printThemeSupply()
}
console.log(`\nTramos: ${legsFromMatrix} de la matriz, ${legsEstimated} estimados`)

if (SALIDA) {
  const path = join(ROOT, SALIDA)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify({ generado_con: 'server/engine/__tests__/medirDias.mjs', referencias: REF, fecha: FECHA, resultados: results }, null, 1))
  console.log(`Guardado en ${SALIDA}`)
}
