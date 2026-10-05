/**
 * Motor v4: días escritos (docs/DIAS_ESCRITOS_FORMATO.md, decisión del usuario del 2026-09-28).
 *
 * El motor NO inventa ni repara. Con las fechas del viajero:
 *   1. elige qué días van (la tabla del destino por días de ciudad) y los ordena (cierres de cada día de la semana,
 *      joyas pronto, medias jornadas en su día);
 *   2. elige la versión de la tarde por la hora del sol (cortes de `_destino.json`);
 *   3. aplica lo escrito para ese día: Free Tour, día de la semana, fecha especial, ritmo, experiencias y pool;
 *   4. calcula las horas desde las duraciones y las horas fijas, con la matriz de tiempos andando;
 *   5. ajusta la parada elástica de la tarde (±lo que diga) para que el mirador llegue a su hora;
 *   6. si algo está cerrado, usa lo escrito (`si_cerrado`); si no hay nada escrito, lo apunta (la prueba lo marca).
 *
 * Devuelve lo mismo que planCuratedTrip (días con unidades, visitas, comidas, nocturnas), para que el servidor y el
 * formato de siempre no cambien. Puro: los días escritos llegan leídos (`written`).
 */

import { placesForScheduler } from './planTrip.js'
import { PRIORITY } from './scheduleDay.js'
import { dinnerZones, recommendedRestaurant, mainZoneOf } from './dinnerZones.js'
import { MODE_V3 } from './modes.js'
import { tripCalendar } from './tripCalendar.js'
import { closedOnDay, effectiveSchedule, lastEntryMinutes, massWeekday, matchesDateRange, matchesDateToken, parseHoursSessions } from './openingHours.js'
import { specialHoursToAvoid } from './specialDates.js'
import { anyTransitRuns, publicTransitKind, transitRuns } from './holidayTransit.js'
import { sunsetFor } from './sunset.js'
import { tripDays } from './tripSkeleton.js'
import { straightLineMeters } from './travelTimes.js'
import { componerDia, esFija } from './componerDia.js'
import { nocheValida } from './nightLimit.js'
import { availableForTrip, seasonFit } from './availability.js' // eslint-disable-line no-unused-vars
import { joinSpanish } from './whyTexts.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'
import { isStreet } from './localRules.js'
import { paseoMaxOf } from './curatedTrip.js'
import { elegirTabla, idDeFila, aplicarAcciones, correrHoras, resolverTaxis, adelantar, ajustarAtardecer, aplicarExtra, vale, recortarSalida, anotarCambios, esAncla, antesDeLlegar, hueco, finDe, toMin as filaMin, toHHMM as filaHHMM } from './escritos.js'

const OUTSIDE_REASONS = { cerrado: 'Hoy cierra', ya_cerrado: 'A esta hora ya ha cerrado', no_abre: 'A esta hora no abre', no_cabe: 'Hoy lo ves por fuera para llegar a todo lo del día', viaje_corto: 'En un viaje corto lo ves por fuera: no da tiempo a entrar' }
/** Cortes de luz por defecto (Roma, 2026-09-28): A antes de 17:40, B hasta 18:44, C hasta 19:44, D desde 19:45. */
const DEFAULT_CUTS = ['17:40', '18:45', '19:45']
const VERSIONS = ['A', 'B', 'C', 'D']
/** El mirador: se llega 25 min antes del sol (el paseo al atardecer por la avenida, 30) y se queda 15 después. */
const SUNSET_LEAD = 25
const SHORT_WALK = 12 // un traslado escrito no se usa si andando son estos minutos o menos
const LONG_WALK = 25 // más de esto andando, en taxi si no hay otro transporte escrito
const STOP_MIN = 15 // una parada no se recorta por debajo de 15 min (ni del 75 % de lo escrito)
const BARRIO_MIN = 20 // un barrio, 20
const ELASTIC_DROP = 15 // si la elástica tendría que bajar de 15 min, se quita
const NEIGHBOUR_WINDOW = 15 // en la frontera entre dos versiones de luz, si la elástica no llega, la vecina
const LEAD_FLEX = 10 // al mirador se llega entre 15 y 35 min antes del sol: lo que la elástica no llega a absorber
const SUNSET_MAX_WAIT = 30 // el mirador no hace esperar más de esto sin nada
const SUNSET_STAY = 15
const SUNSET_STAY_EXTRA = 30 // si la cena espera, el mirador se alarga hasta 30 min más
/** A la entrada con turno se llega 10 min antes (recoger la entrada). */
const TICKET_MARGIN = 10
/** La entrada reservada con hora: se llega 30 min antes. */
const ENTRY_ARRIVAL_MARGIN = 30
/** Si una parada abre dentro de estos minutos, se espera; si no, cuenta como cerrada a esa hora. */
const OPEN_WAIT_MAX = 40
const OPEN_WAIT_AUTHORED = 20
const OPEN_WAIT_MAX_POOL = 45 // lo que el viajero ha elegido se espera más antes que verlo por fuera (las Termas de Caracalla el 1 de enero, que abren a las 9:30)
const PASS_THROUGH_MINUTES = 10
const OUTSIDE_MINUTES = 15
const LUNCH_EARLIEST = 12 * 60 + 30
const LUNCH_MIN = 45
/** A partir de aquí una visita es «de tarde» (para la nocturna del mismo sitio ese día). */
const AFTERNOON_FROM = 13 * 60
/** Con una entrada reservada, la comida se adapta a ella (3-oct-2026): algo rápido desde las 12:00 (30 min) o una comida tranquila, según la hora. */
const LUNCH_EARLIEST_RESERVED = 11 * 60 + 30 // (REGLAS_RUTAS 2: con una entrada con hora detrás, la comida puede ir antes)
const LUNCH_MIN_RESERVED = 30
const isReservedDraft = (draft) => (draft?.applied ?? []).some((label) => String(label).startsWith('reserva:'))
/** Una hora fija de verdad (REGLAS_RUTAS 2): reserva o turno. Una `orientativa` no lo es: llegar unos minutos tarde no es llegar tarde. */
const isHardHour = (stop) => stop?.hora != null && stop.hora_tipo !== 'orientativa'
/** Con una hora fija justo detrás (la primera parada de la tarde), la comida se adapta: unos 30 min. Sin ella, de 45 a 90. */
const hardHourBehind = (draft) => {
  const first = (draft?.tarde ?? []).find((stop) => stop.tipo !== 'opcional' && stop.modo !== 'camino')
  return isHardHour(first)
}
const lunchMinOf = (draft) => (isReservedDraft(draft) || hardHourBehind(draft) ? LUNCH_MIN_RESERVED : LUNCH_MIN)
const LUNCH_DEFAULT = 60
const DINNER_MINUTES = 90
const DINNER_EARLIEST = 19 * 60 + 30
const DINNER_EARLIEST_SUMMER = 20 * 60 + 30 // (por defecto; el dato del destino `cena_horas` manda)
const BREAKFAST_AFTER_BEFORE = 9 * 60 + 30 // el desayuno va después de una visita con hora hasta esta hora (Trevi a las 8:30)

const LUNCH_MAX_COMPLETO = 90 // en completo, 90
/** Verano (julio y agosto): de 14:00 a 16:30, nada al sol (INVARIANTES 413). */
/** Sin huecos antes de cenar (PARA_CODE_TARDE_VATICANO, 3): desde cuántos minutos libres se busca un sitio, a cuánto
 * andando como mucho, cuánto dura (entre 20 y 45) y el paseo que se cuenta hasta la cena. */
const NEXT_TO_ESSENTIAL_WALK = 5 // junto a un imprescindible: a 5 min andando o menos (el exterior de lo cerrado se ve y se fotografía)
const FILLER_IDLE_MIN = 45
const FILLER_WALK_MAX = 12
const FILLER_MINUTES_MIN = 20
const FILLER_MINUTES_MAX = 45
const FILLER_DINNER_WALK = 10
const REST_AFTER_LUNCH_MAX = 90 // (por defecto; el dato del destino manda)
const DINNER_WALK_MAX = 15 // y la de la cena, igual
const NIGHT_DINNER_WALK_MAX = 20 // y de la cena a la nocturna (REGLAS_RUTAS 37)
const LUNCH_WALK_MAX = 15 // el restaurante de la comida, a 15 min andando como mucho de la parada de antes
const HALF_DAY_AFTERNOON = 16 * 60
/** A qué hora se está de vuelta de la excursión de medio día (de 8:00 a 14:00), para comer. */
const HALF_DAY_BACK = 14 * 60 + 15
const TRANSFER_NOTICE_MINUTES = 25
const NIGHT_FALLBACK_METERS = 1200
// (La nocturna a unos 20 min andando de la cena, el descanso, etc.: `destination_config.alcance`.)
const LATE_VISIT_MINUTES = 17 * 60
const WINTER_SUNSET_BEFORE = 18 * 60 + 30
const SPECIAL_HOURS_COST = 400
const EVITAR_COST = 300
const CURATED_AFTERNOON_OFFSET = 100
const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + (m || 0)
}
/** Margen de una hora escrita que no es un turno ni una entrada con hora. */
const FIXED_HOUR_SLACK = 10
/** Con un día que empieza más tarde por una fecha especial, la comida como muy tarde (si el destino no dice otra hora). */
const LATE_START_LUNCH_BY = 14 * 60 + 30
const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.round(minutes % 60)).padStart(2, '0')}`
const roundUp15 = (minutes) => Math.ceil(minutes / 15) * 15
const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))

function metersBetween(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return Infinity
  const toRad = Math.PI / 180
  const x = (b[1] - a[1]) * toRad * Math.cos(((a[0] + b[0]) / 2) * toRad)
  const y = (b[0] - a[0]) * toRad
  return Math.sqrt(x * x + y * y) * 6371000
}

function permutations(list) {
  if (list.length <= 1) return [list]
  return list.flatMap((item, index) => permutations([...list.slice(0, index), ...list.slice(index + 1)]).map((rest) => [item, ...rest]))
}

/** Cuántos extras del pool se pueden elegir: 2 días, 2; 3, 3; 4, 4; 5 o más, 5. */
export function poolExtrasLimit(contentDays) {
  return Math.max(2, Math.min(5, contentDays))
}

/**
 * Qué lugares de `pool_lista` ya van en la ruta de ese viaje (sin elegir nada): salen como «Ya incluido en tu ruta»
 * y no cuentan como elección. Con el límite de extras.
 */
export function poolStatusFor(args) {
  const plan = planWrittenTrip({ ...args, poolNames: [] })
  if (!plan) return null
  const inside = new Set(plan.days.flatMap((day) => day.schedule?.visits ?? []).filter((visit) => !visit.place.passThrough && !visit.place.passBy).map((visit) => visit.place.name))
  // (Lo que sale de noche, la Fontana de Trevi en 2 días, también va en la ruta.)
  for (const chain of plan.nightsByDay.values()) for (const entry of chain) for (const name of entry.conflicts_with ?? []) inside.add(name)
  const covered = new Set(args.hasFreeTour ? args.destData.default_free_tour?.covers ?? [] : [])
  const lista = args.destData.pool_lista?.lugares ?? []
  return {
    included: lista.filter((name) => inside.has(name) || (covered.has(name) && args.destData.places?.find((place) => place.name === name)?.type !== 'interior')),
    extras: lista.filter((name) => !inside.has(name) && !(covered.has(name) && args.destData.places?.find((place) => place.name === name)?.type !== 'interior')),
    maxExtras: poolExtrasLimit(plan.days.length),
  }
}

/** La versión de la tarde (A-D) para un atardecer, con los cortes del destino. */
export function lightVersionOf(sunset, cuts = DEFAULT_CUTS) {
  if (sunset == null) return 'C'
  return VERSIONS[cuts.map(toMin).filter((cut) => sunset >= cut).length]
}

/** ¿Vale esta clave de variante de fecha para ese día? "fecha:12-25", "fecha:easter+1", "fecha:primer_domingo", "fecha:ultimo_domingo". */
function dateKeyMatches(key, dateIso) {
  if (!dateIso) return false
  const token = key.slice('fecha:'.length)
  const date = new Date(`${dateIso}T12:00:00Z`)
  if (token === 'primer_domingo') return date.getUTCDay() === 0 && date.getUTCDate() <= 7
  if (token === 'ultimo_domingo') return date.getUTCDay() === 0 && new Date(date.getTime() + 7 * 86400000).getUTCMonth() !== date.getUTCMonth()
  return token.split('|').some((part) => (part.includes('..') ? matchesDateRange(part.split('..')[0], part.split('..')[1], dateIso) : matchesDateToken(part, dateIso)))
}

/**
 * @param {object} args  como planCuratedTrip, más `written` ({ destino, days }: server/engine/writtenDays.js)
 * @returns el plan (misma forma que planCuratedTrip), o null si falta algún día escrito
 */
export function planWrittenTrip(args) {
  const { destData, written, totalDays, hasFreeTour: hasFreeTourIn = false, poolNames: poolNamesIn = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel, insideNames = [], forceOrder = null, blockedPoolSites = [], entradas = {}, freeTourDespues: freeTourDespuesIn = null, dropTarde = [], recortesCena = 0, mediaJornada = null, sinExcursion = false } = args
  if (!written?.days) return null
  let poolNames = poolNamesIn
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  // La cena entre dos horas, del dato del destino (`cena_horas`): la normal y la de la versión D de la tarde.
  const dinnerHoursOf = (draft) => {
    const cfg = destData.destination_config?.cena_horas ?? {}
    const own = (draft.version === 'D' ? cfg.D : cfg.normal) ?? {}
    return { desde: own.desde ? toMin(own.desde) : draft.version === 'D' ? DINNER_EARLIEST_SUMMER : DINNER_EARLIEST, hasta: own.hasta ? toMin(own.hasta) : null }
  }
  const mode = MODE_V3
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const placeNameById = new Map((destData.places ?? []).filter((place) => place.id).map((place) => [place.id, place.name]))
  const selected = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const inPool = (name) => poolNames.includes(name)
  const tour = destData.default_free_tour ?? null
  const joyaNames = new Set((destData.places ?? []).filter((place) => place.tier === 'joya').map((place) => place.name))
  const cuts = written.destino?.cortes_luz ?? DEFAULT_CUTS
  const skeleton = tripDays({ destData, totalDays, hasFreeTour: hasFreeTourIn, dateRangeStartIso, sinExcursion })
  const contentDays = skeleton.length
  const cityDays = skeleton.filter((day) => !day.isBlank && !day.isExcursion)
  const earlyLimit = Math.min(3, Math.max(1, cityDays.length - 1))
  // Free Tour: en un viaje de 1,5 días o menos NO se ofrece (tanda 2, 5-oct-2026): el motor no lo pone aunque llegue marcado. Desde 2 días, sí.
  const shortNoTour = cityDays.length === 1 || (cityDays.length === 2 && Boolean(mediaJornada))
  const hasFreeTour = shortNoTour ? false : hasFreeTourIn
  const freeTourDespues = shortNoTour ? null : freeTourDespuesIn
  const tourCovers = new Set(hasFreeTour || freeTourDespues ? tour?.covers ?? [] : [])

  const hoursOf = (day) => {
    const dateIso = calendar.dateOfDay(day.dayNumber)
    return { weekday: day.weekday ?? null, season: calendar.season, dateIso, sunset: sunsetFor(destData, { dateIso, season: calendar.season }) }
  }
  const realDateIso = (day) => (calendar.hasDates ? hoursOf(day).dateIso : null)
  const closedThatDay = (name, day) => {
    const place = placeByName.get(name)
    if (!place) return false
    const hours = hoursOf(day)
    return closedOnDay(place, hours.weekday, calendar.hasDates ? hours.dateIso : null) || !availableForTrip(place.available, calendar, hours.dateIso, inPool(name))
  }
  const isWinter = (day) => {
    const sunset = hoursOf(day).sunset
    return sunset != null && sunset < WINTER_SUNSET_BEFORE
  }
  /**
   * Un día que no empieza antes de cierta hora por una fecha especial (`empieza_desde: { hora, si_viaje_incluye }`): el 1
   * de enero, si el viajero pasó la Nochevieja en el destino (el 31 está en su viaje), desde las 10:00.
   */
  const notBeforeOf = (day) => {
    const iso = realDateIso(day)
    if (!iso) return null
    for (const entry of destData.fechas_especiales?.fechas ?? []) {
      const rule = entry.empieza_desde
      if (!rule?.hora || !matchesDateRange(entry.fecha, entry.hasta, iso)) continue
      if (rule.si_viaje_incluye && !skeleton.some((other) => other !== day && realDateIso(other) && matchesDateToken(rule.si_viaje_incluye, realDateIso(other)))) continue
      return { at: toMin(rule.hora), fallback: rule.si_no_cabe ? toMin(rule.si_no_cabe) : null, lunchBy: rule.comida_como_tarde ? toMin(rule.comida_como_tarde) : LATE_START_LUNCH_BY, id: entry.id }
    }
    return null
  }

  // ── 1. Qué días van: la tabla del destino por días de ciudad ────────────────────────────────
  const sinGaleria = !inPool('Galería Borghese') && !selected.includes('arte_museos')
  const routeTable = destData.curated_routes?.por_dias_ciudad ?? {}
  const keys = Object.keys(routeTable).map(Number).sort((a, b) => a - b)
  const key = keys.filter((k) => k <= cityDays.length).at(-1)
  const row = key != null ? routeTable[String(key)]?.[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] ?? [] : []
  // (1,5 días, tanda 2: el día entero de la Roma antigua, el centro y Trastevere, todo por fuera (D1-corto), y medio día del Vaticano (D0-medio); el medio día va primero
  // si se llega a mediodía, y último si es la última mañana. 2,5 días: los dos días enteros del viaje de 2 días y un medio día —el del Tridente y el Pincio (DT-medio) o,
  // con Free Tour de mañana y de mañana, el de Monti (DM-medio)—.)
  const wholeRow = (routeTable['2'] ?? {})[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] ?? ['D1', 'D2']
  let chosen
  let halfPosition = null
  // (El medio día de tarde es el de llegada y el de mañana el de salida; `mediaJornada.posicion` ('primero' o 'ultimo') lo cambia: salir por la tarde, el último día.)
  const halfFirst = mediaJornada?.posicion ? mediaJornada.posicion === 'primero' : mediaJornada?.franja === 'tarde'
  if (mediaJornada && cityDays.length === 2) {
    chosen = halfFirst ? ['D0-medio', 'D1-corto'] : ['D1-corto', 'D0-medio']
    halfPosition = halfFirst ? 0 : 1
  } else if (mediaJornada && cityDays.length === 3 && written.days['DT-medio']) {
    const half = hasFreeTour && mediaJornada.franja === 'manana' && written.days['DM-medio'] ? 'DM-medio' : 'DT-medio'
    chosen = halfFirst ? [half, ...wholeRow] : [...wholeRow, half]
    halfPosition = halfFirst ? 0 : 2
  } else if (mediaJornada && cityDays.length === 4 && written.days['DA-medio']) {
    // 3,5 días (tanda 3): los tres días enteros del viaje de 3 días y el Aventino y Testaccio por la mañana de vuelta (DA-medio). El medio día de llegada (tarde) lo traerá
    // «Llegada según la hora» (aún no): mientras, el medio día del Tridente (provisional, PREGUNTAS_TANDA3).
    const whole = (routeTable['3'] ?? {})[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] ?? ['D1', 'D2', 'D4']
    const half = halfFirst ? 'DT-medio' : 'DA-medio'
    chosen = halfFirst ? [half, ...whole] : [...whole, half]
    halfPosition = halfFirst ? 0 : 3
  } else chosen = row.map((item) => (typeof item === 'string' ? item : sinGaleria && contentDays < 4 ? item.sin_galeria : item.con_galeria)).slice(0, cityDays.length)
  if (chosen.some((id) => !written.days[id])) return null
  const halfDayOwner = Object.fromEntries(Object.entries(destData.curated_routes?.excursiones?.media_jornada ?? {}).map(([id, excursion]) => [excursion, id]))

  // ── 2. En qué orden (los mismos costes que el motor de días curados) ─────────────────────────
  const stopsOf = (w) => [...(w.manana?.paradas ?? []), ...VERSIONS.flatMap((v) => (Array.isArray(w.tarde?.[v]?.paradas) ? w.tarde[v].paradas : []))]
  const carries = (w, name) => stopsOf(w).some((stop) => stop.lugar === name && stop.modo !== 'camino')
  /**
   * ¿Hay Free Tour ese día? Las fechas sin tour viven en `default_free_tour.disponibilidad.sin_tour` (MM-DD, "easter" o
   * fecha completa), cada una con su fuente y su fecha de comprobación. Sin dato, hay tour.
   */
  const noTourOn = (day) => {
    const iso = realDateIso(day)
    if (!hasFreeTour || !iso) return false
    return (tour?.disponibilidad?.sin_tour ?? []).some((entry) => matchesDateToken(typeof entry === 'string' ? entry : entry.fecha, iso))
  }
  const carriesTour = (w) => Boolean(tour) && JSON.stringify([w.manana, w.tarde]).includes(`"${tour.name}"`)
  const violatesRules = (w, day) => (w.no_en ?? []).some((rule) => {
    if (rule.evitar) return false
    if (rule.fecha) return Boolean(realDateIso(day)) && matchesDateToken(rule.fecha, realDateIso(day))
    if (rule.dia_semana) return Boolean(hoursOf(day).weekday) && norm(hoursOf(day).weekday) === norm(rule.dia_semana) && (!rule.si_lleva || carries(w, rule.si_lleva))
    return false
  })
  const violates = (w, day) => violatesRules(w, day) || (carriesTour(w) && noTourOn(day))
  /** Lo que le va mal a un día escrito en una fecha (`fechas_malas`: días de la semana, fechas MM-DD y sitios que ese día cierran): 1000 por cada una. */
  const badDateCost = (w, day) => {
    const bad = w.fechas_malas
    if (!bad || !calendar.hasDates) return 0
    const hours = hoursOf(day)
    let cost = 0
    if (hours.weekday && (bad.dias_semana ?? []).includes(norm(hours.weekday))) cost += 1000
    if (hours.dateIso && (bad.fechas ?? []).some((token) => matchesDateToken(token, hours.dateIso))) cost += 1000
    if ((bad.cerrado ?? []).some((name) => closedThatDay(name, day))) cost += 1000
    // (`cerrado_a`: un sitio que a esa hora no abre —la Cúpula a las 8:00 el miércoles con audiencia—.)
    if ((bad.cerrado_a ?? []).some(({ lugar, hora }) => placeByName.get(lugar) && openCheck(placeByName.get(lugar), toMin(hora), 15, hours).ok !== true)) cost += 1000
    return cost
  }
  // (`evitar` con `fecha`: mejor otro día si el viaje lo permite, el Viernes Santo junto al Coliseo por la tarde.)
  const avoids = (w, day) => (w.no_en ?? []).some((rule) => rule.evitar && (rule.fecha ? Boolean(realDateIso(day)) && matchesDateToken(rule.fecha, realDateIso(day)) : rule.dia_semana && Boolean(hoursOf(day).weekday) && norm(hoursOf(day).weekday) === norm(rule.dia_semana) && (!rule.invierno || isWinter(day))))
  const avoidSpecial = calendar.hasDates ? specialHoursToAvoid(destData) : []
  let order = chosen
  // (Solo para las pruebas: un orden dado, para ver un día escrito en una fecha concreta.)
  if (Array.isArray(forceOrder) && forceOrder.length === chosen.length && forceOrder.every((id) => written.days[id])) order = forceOrder
  else if (chosen.length > 1) {
    // (Lo que no depende del orden, una vez por día escrito y fecha: con 6 días de ciudad hay 720 órdenes.)
    const fixedCost = new Map()
    for (const id of chosen) {
      const w = written.days[id]
      const entries = [...new Set(stopsOf(w).filter((stop) => stop.entrada && !(w.joyas ?? []).includes(stop.lugar)).map((stop) => stop.lugar))]
      fixedCost.set(id, cityDays.map((day) => {
        let cost = 0
        if (violates(w, day)) cost += 1000
        if (avoids(w, day)) cost += EVITAR_COST
        // La media jornada (Ostia, Tívoli) va en el día que la lleva, y ese día no va en uno entero.
        const halfId = day.halfDayExcursion?.id ?? null
        if (halfId ? halfDayOwner[halfId] !== id : Object.values(halfDayOwner).includes(id)) cost += 5000
        for (const joya of w.joyas ?? []) if (closedThatDay(joya, day)) cost += placeByName.get(joya)?.pass_by ? 300 : 2000
        for (const name of entries) if (closedThatDay(name, day)) cost += EVITAR_COST
        for (const rule of avoidSpecial) if (hoursOf(day).dateIso && matchesDateRange(rule.fecha, rule.hasta, hoursOf(day).dateIso) && rule.lugares.some((name) => carries(w, name))) cost += SPECIAL_HOURS_COST
        // Orden de los días (tanda 2): si un día cae en una fecha que le va mal y se puede cambiar con otro día del viaje, se cambian (`fechas_malas` del día escrito).
        cost += badDateCost(w, day)
        // (Lo marcado en el pool que ese día no abre —la Galería Borghese el lunes— va mejor en el otro día.)
        for (const name of poolNames) if (w.pool?.[name] && !w.pool[name].pendiente && !w.pool[name].no_cabe && closedThatDay(name, day)) cost += 600
        return cost
      }))
    }
    let best = null
    // (Con un medio día, este se queda donde está —el de llegada primero, el de salida último— y solo se cambian los días enteros.)
    const candidates = halfPosition == null ? permutations(chosen) : permutations(chosen.filter((_, index) => index !== halfPosition)).map((whole) => [...whole.slice(0, halfPosition), chosen[halfPosition], ...whole.slice(halfPosition)])
    for (const candidate of candidates) {
      let cost = 0
      candidate.forEach((id, index) => {
        const w = written.days[id]
        cost += fixedCost.get(id)[index]
        for (const joya of w.joyas ?? []) {
          const first = candidate.findIndex((other) => (written.days[other].joyas ?? []).includes(joya))
          if (first === index && (index + 1 > earlyLimit || (cityDays.length >= 3 && index === cityDays.length - 1))) cost += 100
          if (first === index) cost += index
        }
        cost += Math.abs(index - chosen.indexOf(id))
      })
      if (!best || cost < best.cost) best = { candidate, cost }
    }
    order = best.candidate
  }
  // Navidad y Año Nuevo (tanda 2): si el Día de la Roma antigua cae el 25 de diciembre o el 1 de enero, se usa el D1-corto (todo por fuera).
  if (calendar.hasDates && written.days['D1-corto']) {
    order = order.map((id, index) => {
      if (id !== 'D1') return id
      const mmdd = String(hoursOf(cityDays[index]).dateIso ?? '').slice(5)
      return mmdd === '12-25' || mmdd === '01-01' ? 'D1-corto' : id
    })
  }
  const dateMoves = []
  if (calendar.hasDates) {
    order.forEach((id, index) => {
      const w = written.days[id]
      const placed = cityDays[index]
      const noEn = (other, name) => (w.no_en ?? []).some((rule) => !rule.evitar && rule.dia_semana && hoursOf(other).weekday && norm(hoursOf(other).weekday) === norm(rule.dia_semana) && (rule.si_lleva ? rule.si_lleva === name && carries(w, name) : (w.joyas ?? []).includes(name)))
      const names = [...new Set([...(w.joyas ?? []), ...poolNames.filter((name) => carries(w, name)), ...(w.no_en ?? []).filter((rule) => rule.si_lleva && carries(w, rule.si_lleva)).map((rule) => rule.si_lleva)])]
      for (const name of names) {
        if (closedThatDay(name, placed)) continue
        for (const other of cityDays) {
          if (other === placed || !(closedThatDay(name, other) || noEn(other, name))) continue
          dateMoves.push({ name, dayId: id, blockedDayNumber: other.dayNumber, blockedDateIso: hoursOf(other).dateIso, placedDayNumber: placed.dayNumber, placedDateIso: hoursOf(placed).dateIso })
        }
      }
    })
  }

  // ── 3. Lo escrito para cada día: versión, variantes, ritmo, experiencias ─────────────────────
  const findIndex = (list, name) => list.findIndex((stop) => stop.lugar === name || (typeof name === 'string' && name.includes(':') && `${stop.lugar}:${stop.modo ?? 'parada'}` === name))
  /** Aplica una operación escrita a una lista de paradas. */
  const applyListOp = (list, op) => {
    let out = op.paradas ? clone(op.paradas) : list
    for (const name of op.quitar ?? []) {
      const at = findIndex(out, name)
      if (at >= 0) out = [...out.slice(0, at), ...out.slice(at + 1)]
    }
    for (const [name, stop] of Object.entries(op.cambiar ?? {})) {
      const at = findIndex(out, name)
      if (at >= 0) out = [...out.slice(0, at), { ...clone(stop) }, ...out.slice(at + 1)]
    }
    for (const [name, where] of Object.entries(op.mover ?? {})) {
      const at = findIndex(out, name)
      if (at < 0) continue
      const stop = out[at]
      const rest = [...out.slice(0, at), ...out.slice(at + 1)]
      const [kind, anchor] = String(where).split(':')
      const to = findIndex(rest, anchor)
      if (to < 0) continue
      out = kind === 'antes_de' ? [...rest.slice(0, to), stop, ...rest.slice(to)] : [...rest.slice(0, to + 1), stop, ...rest.slice(to + 1)]
    }
    for (const insert of op.insertar ?? []) {
      const anchor = insert.despues_de ?? insert.antes_de ?? null
      const at = anchor ? findIndex(out, anchor) : -1
      const stop = clone(insert.parada)
      if (out.some((other) => other.lugar === stop.lugar)) continue
      if (at < 0) out = insert.al_principio ? [stop, ...out] : [...out, stop]
      else out = insert.antes_de ? [...out.slice(0, at), stop, ...out.slice(at)] : [...out.slice(0, at + 1), stop, ...out.slice(at + 1)]
    }
    for (const [name, patch] of Object.entries(op.ajustar ?? {})) {
      const at = findIndex(out, name)
      if (at >= 0) out = [...out.slice(0, at), { ...out[at], ...clone(patch) }, ...out.slice(at + 1)]
    }
    return out
  }
  const applyOps = (draft, ops, label) => {
    if (!ops) return
    for (const [target, op] of Object.entries(ops)) {
      if (target.startsWith('_')) continue
      if (target === 'nombre' || target === 'noche' || target === 'barrio_cena' || target === 'noche_si_cae') {
        draft[target] = op
        continue
      }
      if (target === 'manana') {
        draft.manana = applyListOp(draft.manana, op)
        if (op.comida) draft.comida = { ...draft.comida, ...op.comida }
        if (op.restaurante?.comida) draft.comida = { ...draft.comida, restaurante: op.restaurante.comida, alternativa: op.restaurante.alternativa ?? draft.comida?.alternativa }
        // (Si la variante reescribe las paradas de la mañana, la hora de empezar escrita del día no vale: los Museos a las 8:00.)
        if (op.paradas) delete draft.manana_empieza
        if (op.empieza) draft.manana_empieza = op.empieza
        continue
      }
      const match = /^tarde(?:\.(\*|[A-D]))?$/.exec(target)
      if (!match) continue
      if (match[1] && match[1] !== '*' && match[1] !== draft.version) continue
      // (Lo que la mañana ya lleva no se inserta otra vez por la tarde: los Museos Capitolinos de Arte, los sábados.)
      const inMorning = (insert) => draft.manana.some((stop) => stop.lugar === insert.parada?.lugar && (!stop.si_experiencia || selected.includes(stop.si_experiencia) || (stop.o_si_pool && inPool(stop.lugar))))
      draft.tarde = applyListOp(draft.tarde, op.insertar?.some(inMorning) ? { ...op, insertar: op.insertar.filter((insert) => !inMorning(insert)) } : op)
      if (op.empieza) draft.empieza = op.empieza
      if (op.cena) draft.cena = { ...draft.cena, ...op.cena }
      if (op.restaurante?.cena) draft.cena = { ...draft.cena, restaurante: op.restaurante.cena, alternativa: op.restaurante.alternativa ?? draft.cena?.alternativa }
    }
    if (label) draft.applied.push(label)
  }
  // (Una versión puede ser "igual que A" entera, o traer lo suyo y decir "igual que A" solo en las paradas.)
  const versionOf = (tarde, version, depth = 0) => {
    let value = tarde?.[version]
    if (typeof value === 'string') return depth < 4 ? versionOf(tarde, /[A-D]/.exec(value)?.[0], depth + 1) : null
    if (value && typeof value.paradas === 'string' && depth < 4) {
      const base = versionOf(tarde, /[A-D]/.exec(value.paradas)?.[0], depth + 1) ?? {}
      value = { ...base, ...value, paradas: base.paradas ?? [], cena: value.cena ?? base.cena }
    }
    return value ?? null
  }

  /**
   * Las capas que lleva este viaje y en qué día va cada una: los lugares con `capa_de` de las experiencias elegidas, en
   * el primer día (por orden) cuyo día escrito lleva la parada de debajo y en el que la capa está en fechas.
   */
  let tripLayers = null
  const layersOfTrip = () => {
    if (tripLayers) return tripLayers
    tripLayers = []
    const tags = new Set(selected.flatMap((exp) => TAG_INTEREST_MAP[exp] ?? []))
    for (const place of destData.places ?? []) {
      if (!place.capa_de || !(place.tags ?? []).some((tag) => tags.has(tag))) continue
      for (let i = 0; i < order.length; i++) {
        const fit = seasonFit(place.available, calendar, hoursOf(cityDays[i]).dateIso)
        if (!fit.enters) continue
        const w = written.days[order[i]]
        // (Si el Free Tour ya pasa por ahí, su parada suelta no sale ese viaje: la capa va en otro día o en la nocturna.)
        if (!JSON.stringify([w.manana, w.tarde]).includes(`"lugar":"${place.capa_de}"`) && !JSON.stringify([w.manana, w.tarde]).includes(`"lugar": "${place.capa_de}"`)) continue
        tripLayers.push({ place, dayIndex: i, notice: fit.notice })
        break
      }
    }
    return tripLayers
  }

  // Free Tour añadido después (3-oct-2026): el tour sustituye la parte del día que enseña lo mismo. `freeTourDespues: { franja: 'manana' | 'tarde' | 'noche', hora }`;
  // va en el primer día (por orden) cuyo día escrito trae la variante `free_tour_despues:<franja>`.
  // El tour se clasifica por su hora, no por su nombre (3-oct-2026): antes de las 13:00 es de mañana; de las 13:00 a las 18:59, de tarde; a partir de las 19:00, de noche.
  const ftHour = freeTourDespues?.hora ? toMin(freeTourDespues.hora) : null
  const ftFranja = ftHour != null ? (ftHour < 13 * 60 ? 'manana' : ftHour < 19 * 60 ? 'tarde' : 'noche') : freeTourDespues?.franja ?? null
  const ftKey = ftFranja ? `free_tour_despues:${ftFranja}` : null
  let ftDayIndex = -1
  const ftWhy = [] // por qué un día que trae el tour no lo lleva (para las pruebas)
  // ── Días escritos (docs/dias/DIAS_ESCRITOS_ROMA.md) ─────────────────────────────────────────────
  // Un día escrito es una tabla con horas. El motor solo ajusta lo que el documento dice (cierres, miércoles, domingo, reservas, pool,
  // experiencias, Free Tour) y corre las horas con los márgenes (escritos.js).
  const makeEscritoDraft = (w, id, index, version, day, hours) => {
    const franjaMedio = id === 'D0-medio' || id === 'DT-medio' || id === 'DM-medio' ? (mediaJornada?.franja ?? (index === 0 ? 'tarde' : 'manana')) : null
    const tabla = elegirTabla(w, {
      letra: version,
      weekday: hours.weekday,
      dateIso: calendar.hasDates ? hours.dateIso : null,
      sunset: hours.sunset,
      reservas: entradas ?? {},
      pool: poolNames,
      conFreeTour: hasFreeTour,
      museosCerrados: closedThatDay('Museos Vaticanos y Capilla Sixtina', day),
      freeTourHora: id === 'D1' && freeTourDespues?.hora ? freeTourDespues.hora : null,
      franja: franjaMedio,
      llegada: mediaJornada?.llegada ?? null,
      cerrado: (name) => closedThatDay(name, day),
      abre: (name, hhmm) => {
        const place = placeByName.get(name)
        return !place || openCheck(place, toMin(hhmm), 15, hours).ok === true
      },
    })
    // El miércoles por la mañana (audiencia del Papa), sin Museos: la mañana empieza en el Castillo y el Puente, y la Plaza y la Basílica (por fuera) van al final,
    // si da tiempo antes de irse (el documento no trae esta tabla: se deriva de la mañana normal; lo apunta el registro).
    const cambiosIniciales = []
    // (Una tabla que el documento dice «con las horas corridas desde…»: la fila marcada se queda en su hora y lo de después corre con los márgenes.)
    const corrida = tabla.rows.find((row) => row.recorrer_desde)
    if (corrida) cambiosIniciales.push({ id: corrida.id, lugar: corrida.titulo ?? corrida.lugar, que: 'hora', causa: corrida.recorrer_desde })
    if (id === 'D0-medio' && franjaMedio === 'manana' && tabla.version === 'manana' && norm(hours.weekday) === 'miercoles') {
      const por = (lugar) => tabla.rows.find((row) => row.lugar === lugar)
      const castillo = por("Castillo de Sant'Angelo")
      const puente = por("Puente Sant'Angelo")
      const comida = tabla.rows.find((row) => row.tipo === 'comida')
      const plaza = por('Plaza de San Pedro')
      const basilica = por('Basílica de San Pedro')
      const medio = tabla.rows.filter((row) => ![castillo, puente, comida, plaza, basilica].includes(row) && row.lugar !== 'Borgo Pio' && row.lugar !== 'Via della Conciliazione')
      if (castillo && puente && comida && plaza && basilica) {
        const salida = tabla.rows[0].hora
        tabla.rows = [{ ...castillo, hora: salida }, puente, ...medio, comida, { ...plaza, modo: 'fuera', min: 15 }, { ...basilica, modo: 'fuera', min: 5 }]
        cambiosIniciales.push({ id: castillo.id ?? 'parada_castillo', lugar: "Castillo de Sant'Angelo", que: 'orden', causa: 'miércoles por la mañana: la Plaza de San Pedro está ocupada por la audiencia del Papa hasta mediodía' })
        tabla.etiquetas.push('miercoles_audiencia')
      }
    }
    // 2,5 días con Free Tour de mañana, medio día de tarde: el tour ya pasa por la Plaza de España, que va de camino (5 min); el tiempo que sobra, al colchón.
    if (id === 'DT-medio' && franjaMedio === 'tarde' && hasFreeTour) {
      const espana = tabla.rows.find((row) => row.lugar === 'Plaza de España' && row.modo !== 'camino')
      const colchon = [...tabla.rows].reverse().find((row) => row.colchon)
      if (espana) {
        const sobra = (espana.min ?? 20) - 5
        tabla.rows = tabla.rows.map((row) => (row === espana ? { ...row, modo: 'camino', min: 5 } : row === colchon ? { ...row, min: row.min + sobra } : row))
        cambiosIniciales.push({ id: espana.id ?? 'parada_plaza_de_espana', lugar: 'Plaza de España', que: 'modo+min', causa: 'Free Tour de mañana: el tour ya pasa por la Plaza de España' })
        if (colchon) cambiosIniciales.push({ id: colchon.id, lugar: colchon.titulo ?? colchon.lugar, que: 'min', causa: 'Free Tour de mañana: el rato que sobra de la Plaza de España va al colchón' })
      }
    }
    // 3 días con Free Tour de mañana (tanda 3), D4: el tour ya pasó por Trevi, la Plaza de España y Via Condotti: la mañana empieza a las 9:00 en la Fuente del Tritón (desayuno en el hotel),
    // sin Trevi; la Plaza de España y Via Condotti van de camino (5 min) y el tiempo que sobra pasa al colchón del Tridente.
    if (id === 'D4' && hasFreeTour) {
      const causa = 'Free Tour de mañana: el tour ya pasó por Trevi, la Plaza de España y Via Condotti'
      const sin = tabla.rows.filter((row) => !((row.lugar === 'Fontana de Trevi' && row.tipo === 'parada') || row.tipo === 'desayuno'))
      const espana = sin.find((row) => row.lugar === 'Plaza de España' && row.tipo === 'parada' && row.modo !== 'camino')
      const condotti = sin.find((row) => row.lugar === 'Via Condotti' && row.tipo === 'parada')
      const colchon = [...sin].reverse().find((row) => row.colchon && /Tridente/.test(row.titulo ?? row.texto_documento ?? ''))
      const sobra = (espana ? espana.min - 5 : 0) + (condotti && condotti.min > 5 ? condotti.min - 5 : 0)
      tabla.rows = sin.map((row, i) => (i === 0 ? { ...row, hora: '09:00' } : row === espana ? { ...row, modo: 'camino', min: 5 } : row === condotti ? { ...row, min: 5 } : row === colchon ? { ...row, min: row.min + sobra } : row))
      cambiosIniciales.push({ id: tabla.rows[0].id, lugar: tabla.rows[0].titulo ?? tabla.rows[0].lugar, que: 'hora', causa })
      if (espana) cambiosIniciales.push({ id: espana.id, lugar: 'Plaza de España', que: 'modo+min', causa })
      if (colchon && sobra > 0) cambiosIniciales.push({ id: colchon.id, lugar: colchon.titulo ?? colchon.lugar, que: 'min', causa: causa + ': el rato que sobra va al colchón del Tridente' })
    }
    return {
      cambiosIniciales,
      recorrer: cambiosIniciales.length > 0,
      causaRecorrer: cambiosIniciales[0]?.causa ?? null,
      id,
      day,
      version,
      escrito: true,
      nombre: w.nombre,
      noche: null,
      noche_despues_de_cenar: false,
      noche_antes_de_cenar: false,
      noche_minutos: null,
      noche_si_cae: null,
      barrio_cena: null,
      manana: [],
      comida: null,
      tarde: [],
      empieza: null,
      cena: null,
      applied: [version, ...tabla.etiquetas.filter((label) => label !== version)],
      suggestions: [],
      index,
      poolOps: [],
      poolInside: [],
      rows: tabla.rows,
      tablaVersion: tabla.version,
      tablaClave: tabla.clave,
      notasTabla: tabla.notas,
      extrasNoIncluidos: [],
    }
  }
  const makeDraft = (id, index, version) => {
    const w = written.days[id]
    const day = cityDays[index]
    const hours = hoursOf(day)
    if (w.formato === 'escrito') return makeEscritoDraft(w, id, index, version, day, hours)
    const tardeVersion = versionOf(w.tarde, version) ?? {}
    const draft = {
      id,
      day,
      version,
      // (Una versión de la tarde puede traer su nombre y su paseo de noche: la D de D2, con el atardecer en el Puente
      // Sant'Angelo; la D de D1-FT, que ya pasa la tarde en Trastevere y de noche va al centro.)
      nombre: tardeVersion.nombre ?? w.nombre,
      noche: tardeVersion.noche ?? w.noche ?? null,
      // (`noche_despues_de_cenar`: el paseo de noche va siempre después de cenar, aunque quepa antes: el viaje de 1 día, Trevi y la Plaza de España.)
      noche_despues_de_cenar: Boolean(tardeVersion.noche_despues_de_cenar ?? w.noche_despues_de_cenar),
      // (`noche_antes_de_cenar`: en verano el paseo de noche va antes de cenar y la cena se retrasa a después: si no, la Plaza de España pasa de las 23:00.)
      noche_antes_de_cenar: Boolean(tardeVersion.noche_antes_de_cenar ?? w.noche_antes_de_cenar),
      noche_minutos: tardeVersion.noche_minutos ?? w.noche_minutos ?? null,
      noche_si_cae: null,
      barrio_cena: tardeVersion.barrio_cena ?? w.barrio_cena ?? null,
      manana: clone(w.manana?.paradas ?? []),
      comida: clone(w.manana?.comida ?? null),
      tarde: clone(tardeVersion.paradas ?? []),
      empieza: tardeVersion.empieza ?? w.tarde?.empieza ?? null,
      cena: clone(tardeVersion.cena ?? w.tarde?.cena ?? null),
      // (`manana.empieza`: la hora a la que empieza la mañana, sin nada fijo delante: el desayuno antes del Free Tour.)
      ...(w.manana?.empieza ? { manana_empieza: w.manana.empieza } : {}),
      applied: [version],
      suggestions: [],
      index,
      poolOps: [],
      poolInside: [],
    }
    const variants = w.variantes ?? {}
    if (hasFreeTour && variants.con_free_tour) applyOps(draft, variants.con_free_tour, 'con_free_tour')
    // Entrada reservada (3-oct-2026, PARA_CODE_D1_D2_D4_SEGUNDO_ORDEN): el día trae su orden de siempre y uno o dos órdenes nuevos según la
    // hora de la entrada (`entradas`: { lugar: { franja: [desde, hasta] } }, la primera franja es la de siempre). Cada orden nuevo es la variante
    // `entrada:<franja>`, y lo que cambia en un día de la semana con ese orden va en `entrada:<franja>@<día>` (si no, vale el del día de siempre).
    let entryKey = null
    let entryReserved = null
    for (const [place, franjas] of Object.entries(w.entradas ?? {})) {
      const hour = entradas?.[place]
      if (hour == null) continue
      const at = toMin(hour)
      const names = Object.keys(franjas)
      const named = names.find((name) => at >= toMin(franjas[name][0]) && at <= toMin(franjas[name][1])) ?? names.at(-1)
      entryReserved = { place, hour: at }
      if (named !== names[0]) entryKey = `entrada:${named}`
    }
    // (El Free Tour de por la mañana trae el orden de tarde de la entrada: `usa_entrada`.)
    const ftHere = ftDayIndex === index ? variants[ftKey] : null
    if (!entryKey && ftHere?.usa_entrada) entryKey = `entrada:${ftHere.usa_entrada}`
    if (entryKey && variants[entryKey]) applyOps(draft, variants[entryKey], entryKey)
    if (ftHere) {
      applyOps(draft, ftHere, ftKey)
      for (const list of [draft.manana, draft.tarde]) for (const item of list) if (item.lugar === tour?.name) Object.assign(item, { tipo: 'fija', hora: freeTourDespues.hora, hora_tipo: 'turno' })
    }
    // (La víspera de un festivo con misa —el Panteón, 17:00— va como un sábado: el Panteón deja de vender entradas a las 16:00 y el día usa su variante «sabado», con el Panteón nada más comer.)
    const eveAsSaturday = hours.weekday && calendar.hasDates && norm(hours.weekday) !== 'sabado' && (destData.places ?? []).some((place) => place.misas_festivos && massWeekday(place, hours) === 'sábado')
    const weekdayKey = hours.weekday && calendar.hasDates ? (eveAsSaturday ? 'sabado' : norm(hours.weekday)) : null
    if (weekdayKey) {
      const own = entryKey && variants[`${entryKey}@${weekdayKey}`]
      if (own) applyOps(draft, own, `${entryKey}@${weekdayKey}`)
      else if (variants[weekdayKey] && !(entryKey && variants[entryKey]?.sin_dia_semana)) applyOps(draft, variants[weekdayKey], weekdayKey)
    }
    // `cerrado:<lugar>`: el día cambia si ese lugar cierra ese día (los Museos Vaticanos en sus festivos).
    // (También si abre ese día pero no a su hora escrita: los Museos Vaticanos el último domingo de mes, de 9:00 a 14:00,
    // con la visita escrita a las 14:45.)
    const closedAtWrittenHour = (name) => {
      if (!calendar.hasDates) return false
      const stop = [...draft.manana, ...draft.tarde].find((candidate) => candidate.lugar === name && candidate.hora != null)
      const place = placeByName.get(name)
      if (!stop || !place) return false
      return Boolean(openCheck(place, toMin(stop.hora), stop.min ?? place.duration_minutes ?? 60, hours).closed)
    }
    for (const [key, ops] of Object.entries(variants)) {
      const name = key.startsWith('cerrado:') ? key.slice('cerrado:'.length) : null
      if (name && (closedThatDay(name, day) || closedAtWrittenHour(name))) applyOps(draft, ops, key)
    }
    // (La fecha, después del cierre: es lo más concreto y manda; Navidad en D2 con los Museos cerrados.)
    // (Y puede depender de dónde cae otro día del viaje, "fecha:12-24&D1-FT@12-25": el 24 de diciembre, si el día D1-FT cae
    // el 25. Así dos días se reparten algo entre los dos, cada uno con su mitad escrita: el Free Tour que el 24 no cabe
    // pasa al 25. Las que dependen de otro día van después de las de la fecha sola: son más concretas.)
    const otherDayOn = (condition) => {
      const [otherId, otherDate] = condition.split('@')
      const at = order.indexOf(otherId)
      return at >= 0 && dateKeyMatches(`fecha:${otherDate}`, hoursOf(cityDays[at]).dateIso)
    }
    const dateVariant = (key) => {
      if (!key.startsWith('fecha:') || !calendar.hasDates) return null
      const [own, ...others] = key.split('&')
      if (!dateKeyMatches(own, hours.dateIso) || !others.every(otherDayOn)) return null
      return others.length
    }
    for (const depth of [0, 1]) for (const [key, ops] of Object.entries(variants)) if (dateVariant(key) != null && Math.min(dateVariant(key), 1) === depth) applyOps(draft, ops, key)
    // (`si_disponible`: lo escrito para una experiencia solo vale los días en que ese lugar está en fechas, sin margen: la
    // cena junto a Piazza Navona solo si esa noche hay mercadillo.)
    const inDates = (name) => {
      const fit = seasonFit(placeByName.get(name)?.available, calendar, hours.dateIso)
      return fit.enters && !fit.notice
    }
    for (const exp of selected) if (w.experiencias?.[exp] && (!w.experiencias[exp].si_disponible || inDates(w.experiencias[exp].si_disponible))) applyOps(draft, w.experiencias[exp], exp)
    // (Si lo que cambia ese día, el domingo o una fecha, reescribió las paradas y se llevó el tour, el tour vuelve: su hora no se mueve ni se quita, INVARIANTES 466.)
    if (ftHere && tour && ![...draft.manana, ...draft.tarde].some((stop) => stop.lugar === tour.name)) {
      applyOps(draft, ftHere, `${ftKey}:otra_vez`)
      for (const list of [draft.manana, draft.tarde]) for (const item of list) if (item.lugar === tour.name) Object.assign(item, { tipo: 'fija', hora: freeTourDespues.hora, hora_tipo: 'turno' })
    }
    // Lo que depende del viaje: `no_si_dia` (la Isla Tiberina en D5 si el viaje ya lleva D1-FT) y `desde_dias` (solo en
    // viajes de tantos días o más).
    // (`sol_desde` / `sol_hasta`: la parada va solo si el sol se pone a partir de / antes de esa hora; una versión abarca una hora de sol.)
    const bySun = (stop) => hours.sunset == null || (!(stop.sol_desde && hours.sunset < toMin(stop.sol_desde)) && !(stop.sol_hasta && hours.sunset >= toMin(stop.sol_hasta)))
    // (`meses` / `no_meses`: la parada va solo esos meses, o todos menos esos (1-12). El descanso largo de después de comer
    // es cosa del verano: de junio a agosto. Sin fechas, el mes del viaje.)
    const monthOfDay = hours.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : Number.isInteger(calendar.month) ? calendar.month + 1 : null
    const byMonth = (stop) => !(stop.meses && !(monthOfDay != null && stop.meses.includes(monthOfDay))) && !(stop.no_meses && monthOfDay != null && stop.no_meses.includes(monthOfDay))
    // (`si_experiencia`: la parada va solo si el viajero eligió esa experiencia. Para lo que una experiencia añade en otro
    // sitio según la variante del día: los Museos Capitolinos por la mañana los sábados, junto al Campidoglio.)
    // (`o_si_pool`: o si el viajero marcó ese lugar en «Elige lugares».)
    // (`no_si_experiencia` / `no_si_pool`: al revés, la parada no va si el viajero eligió esa experiencia o marcó ese lugar: el
    // sábado, con los Museos Capitolinos por la mañana, el Largo Argentina y el Ghetto no caben antes del Panteón.)
    const keep = (stop) => !(stop.si_pool && !inPool(stop.si_pool)) && !(stop.si_entrada_desde && !(entryReserved && entryReserved.hour >= toMin(stop.si_entrada_desde))) && !(stop.no_si_experiencia && selected.includes(stop.no_si_experiencia)) && !(stop.no_si_pool && inPool(stop.no_si_pool)) && !(stop.si_experiencia && !selected.includes(stop.si_experiencia) && !(stop.o_si_pool && inPool(stop.lugar))) && byMonth(stop) && bySun(stop) && !(stop.no_si_dia ?? []).some((other) => order.includes(other)) && !(stop.si_dia && !stop.si_dia.some((other) => order.includes(other))) && !(stop.desde_dias && contentDays < stop.desde_dias)
    // Lo de temporada que está fuera de sus fechas ese día no va: un "de camino" (los 100 Presepi en febrero) o una parada
    // escrita con `si_cerrado: "quitar"` (el paseo de las luces de Navidad). Lo demás lo resuelve su `si_cerrado`.
    // (Sin margen: en los 15 días de antes o de después de una ventana aproximada, lo insertado no va; el aviso lo lleva la capa.)
    const inSeason = (list) => list.flatMap((stop) => {
      const available = placeByName.get(stop.lugar)?.available
      if (!available || !(stop.modo === 'camino' || stop.si_cerrado === 'quitar')) return [stop]
      const fit = seasonFit(available, calendar, hours.dateIso)
      return fit.enters && !fit.notice ? [stop] : []
    })
    draft.manana = inSeason(draft.manana.filter(keep))
    draft.tarde = inSeason(draft.tarde.filter(keep))
    // Un día sin Free Tour (festivo): el tour no se pone, y el viajero ve el aviso.
    if (tour && noTourOn(day) && [...draft.manana, ...draft.tarde].some((stop) => stop.lugar === tour.name)) {
      draft.manana = draft.manana.filter((stop) => stop.lugar !== tour.name)
      draft.tarde = draft.tarde.filter((stop) => stop.lugar !== tour.name)
      draft.noTour = true
      draft.applied.push('sin_free_tour')
    }
    // Las capas de una experiencia elegida (PROMPT_ROMA_NAVIDAD 2): un lugar con `capa_de` no es una parada más, cambia la
    // parada que ya existe en ese sitio (el mercadillo de Navidad → «Piazza Navona y su mercadillo de Navidad», con más
    // tiempo y su texto). Solo en sus fechas, y una vez por viaje: en el primer día que lleva esa parada.
    for (const layer of layersOfTrip()) {
      if (layer.dayIndex !== index) continue
      // (En el margen de sus fechas, «es probable que el mercadillo ya haya cerrado»: la parada se queda como es, con el aviso.)
      const apply = (list) => list.map((stop) => (stop.lugar !== layer.place.capa_de || stop.modo === 'camino' || stop.modo === 'fuera'
        ? stop
        : layer.notice
        ? { ...stop, aviso: layer.notice }
        : { ...stop, titulo: layer.place.titulo_parada ?? layer.place.name, texto_titulo: layer.place.texto_parada ?? null, min: Math.max(stop.min ?? 0, layer.place.duration_minutes ?? 0) || stop.min, capa: layer.place.name, tipo: stop.tipo === 'opcional' ? 'normal' : stop.tipo }))
      draft.manana = apply(draft.manana)
      draft.tarde = apply(draft.tarde)
      if (!draft.applied.includes(`capa:${layer.place.name}`)) draft.applied.push(`capa:${layer.place.name}`)
    }
    // La hora reservada manda: la parada de ese lugar sale a esa hora y se llega 30 min antes.
    if (entryReserved) {
      // (Un mismo sitio, una vez al día: si el día de la fecha especial ya lo traía en la otra parte del día, queda el de la hora reservada.)
      const hasInside = (list) => list.some((stop) => stop.lugar === entryReserved.place && stop.modo === 'dentro')
      if (hasInside(draft.manana) && hasInside(draft.tarde)) {
        const drop = entryReserved.hour >= AFTERNOON_FROM ? 'manana' : 'tarde'
        draft[drop] = draft[drop].filter((stop) => stop.lugar !== entryReserved.place)
      }
      // Una hora escrita que choca con la reservada (la Basílica a las 12:00 el Jueves Santo) pasa a después de la reserva: manda la entrada.
      const reservedAt = [draft.manana, draft.tarde].map((list) => list.find((stop) => stop.lugar === entryReserved.place && stop.modo === 'dentro')).findIndex(Boolean)
      if (reservedAt >= 0) {
        const home = reservedAt === 0 ? 'manana' : 'tarde'
        const reservedStop = draft[home].find((stop) => stop.lugar === entryReserved.place && stop.modo === 'dentro')
        // (Desde 90 min antes de la entrada: 30 de llegada, 30 de comida rápida y el paseo hasta la puerta.)
        const from = entryReserved.hour - 90
        const to = entryReserved.hour + (reservedStop.min ?? 60)
        const moved = []
        for (const part of ['manana', 'tarde']) {
          draft[part] = draft[part].filter((stop) => {
            if (stop === reservedStop || stop.hora == null || stop.lugar === tour?.name || stop.tipo === 'opcional') return true
            const start = toMin(stop.hora)
            if (!(start < to && start + (stop.min ?? 30) > from)) return true
            const { hora, tipo, ...rest } = stop
            moved.push(rest)
            return false
          })
        }
        if (moved.length > 0) {
          // (Después de la reserva, y después de la Plaza de San Pedro si va justo detrás de ella: la Plaza antes que la Basílica.)
          let at = draft[home].indexOf(reservedStop)
          if (draft[home][at + 1]?.lugar === 'Plaza de San Pedro') at++
          draft[home] = [...draft[home].slice(0, at + 1), ...moved, ...draft[home].slice(at + 1)]
          draft.applied.push(`despues_de_la_reserva:${moved.map((stop) => stop.lugar).join('+')}`)
        }
      }
      for (const list of [draft.manana, draft.tarde]) for (const stop of list) if (stop.lugar === entryReserved.place && stop.modo === 'dentro') Object.assign(stop, { tipo: 'fija', reserva_manda: true, hora: toHHMM(entryReserved.hour), hora_tipo: 'reserva', llegar_antes: ENTRY_ARRIVAL_MARGIN, turno: true, recorta_al_cierre: true })
      draft.applied.push(`reserva:${toHHMM(entryReserved.hour)}`)
    }
    return draft
  }
  // (El tour va en el primer día, por orden, cuyo día escrito trae la variante y cuyo borrador acaba llevando el tour: un domingo, un festivo sin tour o una fecha que
  // reescribe el día pueden quitarlo, y entonces va en el siguiente.)
  if (ftKey && tour) {
    for (let candidate = 0; candidate < order.length; candidate++) {
      if (!written.days[order[candidate]].variantes?.[ftKey]) continue
      ftDayIndex = candidate
      const trial = makeDraft(order[candidate], candidate, lightVersionOf(hoursOf(cityDays[candidate]).sunset, cuts))
      if ([...trial.manana, ...trial.tarde].some((stop) => stop.lugar === tour.name)) break
      ftWhy.push(`${order[candidate]}: ${noTourOn(cityDays[candidate]) ? 'ese día no hay Free Tour (festivo)' : 'el día escrito de ese día no lo lleva'}`)
      ftDayIndex = -1
    }
  }
  const drafts = order.map((id, index) => makeDraft(id, index, lightVersionOf(hoursOf(cityDays[index]).sunset, cuts)))
  // Lo que un día escrito enseña no se repite en un día de los de siempre: se quita del viejo (nunca del escrito).
  {
    const escritos = new Set(drafts.filter((draft) => draft.escrito).flatMap((draft) => (draft.rows ?? []).filter((row) => row.lugar && row.modo !== 'camino').map((row) => row.lugar)))
    if (escritos.size > 0) for (const draft of drafts) if (!draft.escrito) for (const key of ['manana', 'tarde']) if (Array.isArray(draft[key])) draft[key] = draft[key].filter((stop) => !escritos.has(stop.lugar) || stop.modo === 'camino')
  }
  /** Lo que ya va en la ruta y está en el pool: por dentro y no opcional. */
  const forceInside = (draft, name) => {
    for (const list of [draft.manana, draft.tarde]) for (const stop of list) if (stop.lugar === name && (stop.modo === 'fuera' || stop.tipo === 'opcional')) {
      if (stop.modo === 'fuera') {
        stop.modo = 'dentro'
        // (Lo que el viajero marca para entrar dura lo que dura por dentro: el Castillo, 1 h; el sitio de por fuera de 20 min no vale.)
        stop.min = Math.max(stop.min ?? 0, Math.min(placeByName.get(name)?.duration_minutes ?? 60, 60))
      }
      if (stop.tipo === 'opcional') stop.tipo = 'normal'
    }
    // Lo marcado va por dentro SIEMPRE ANTES de su última entrada (REGLAS_RUTAS 12 y 1): si el sitio cierra pronto (última entrada antes de
    // las 19:00) y el día lo lleva tarde en su mitad, se adelanta dentro del mismo día: delante de lo que va antes, o detrás de lo de su zona.
    const place = placeByName.get(name)
    if (place) {
      const hours = hoursOf(draft.day)
      const closes = Math.max(0, ...parseHoursSessions(effectiveSchedule(place, hours)).map((session) => session.close))
      const lastEntry = lastEntryMinutes(place, 12 * 60, hours)
      const limit = Math.min(lastEntry ?? Infinity, closes > 0 ? closes - 30 : Infinity)
      if (limit < 19 * 60) {
        for (const list of [draft.tarde]) {
          const index = list.findIndex((stop) => stop.lugar === name && stop.modo === 'dentro')
          if (index < 3) continue
          const sameZone = list.slice(0, index).findIndex((stop) => placeByName.get(stop.lugar)?.zone === place.zone && stop.modo !== 'camino')
          // (Solo la tarde, que empieza a las 13:30 o después: la mañana ya llega antes de cualquier última entrada.)
          const [moved] = list.splice(index, 1)
          list.splice(sameZone >= 0 ? sameZone : 0, 0, moved)
        }
      }
    }
  }

  // El pool: cada lugar elegido en su sitio escrito (el primero cuyo día está en el viaje y cuyo hueco no ha cogido
  // otro antes; manda el orden de `pool_lista`). Lo que ya está en la ruta queda garantizado por dentro.
  // ── Un sitio en el día de su zona (REGLAS_RUTAS 4, 12 y 13) ─────────────────────────────────────
  // Lo que el viajero marca en el pool sin sitio escrito, y lo que añade una experiencia (la lista del destino), va en el día cuya
  // zona es la del sitio, en la mitad donde más paradas tiene de esa zona, detrás de la última de esa zona; nunca en un día que ya
  // lo muestra (por \`muestra\`). ANTES de añadir se mira si cabe (regla 2 de las nuevas): se cuenta el tiempo de la mitad y solo se
  // recorta lo que se puede recortar, en este orden: opcionales y «De camino», la elástica, nivel 3. Lo protegido nunca se recorta:
  // imprescindibles, lo del pool, las horas fijas y lo que añade la experiencia. Si no cabe, se prueba el siguiente día de su zona.
  const stopsOfDraft = (draft) => (draft.escrito ? (draft.rows ?? []).filter((row) => row.lugar).map((row) => ({ lugar: row.lugar, modo: row.modo ?? undefined })) : [...draft.manana, ...draft.tarde])
  const zonesOfDraft = (draft, half) => {
    const counts = new Map()
    for (const stop of half ? draft[half] : stopsOfDraft(draft)) {
      const zone = placeByName.get(stop.lugar)?.zone
      if (zone && stop.modo !== 'camino') counts.set(zone, (counts.get(zone) ?? 0) + 1)
    }
    return counts
  }
  const BIG_MINUTES = 90
  const WALK_BETWEEN = 7
  const isBigStop = (stop) => stop.modo === 'dentro' && (stop.min ?? placeByName.get(stop.lugar)?.duration_minutes ?? 0) > BIG_MINUTES
  const shownInDraft = (draft, name) => {
    const id = placeByName.get(name)?.id
    return stopsOfDraft(draft).some((stop) => stop.lugar === name || (id && placeByName.get(stop.lugar)?.pass_by?.includes?.includes(name)))
  }
  const stopMinutes = (stop) => (stop.modo === 'camino' ? 5 : stop.modo === 'fuera' ? stop.min ?? placeByName.get(stop.lugar)?.minutos_fuera ?? 15 : stop.min ?? placeByName.get(stop.lugar)?.duration_minutes ?? 30)
  const usedMinutes = (list) => list.reduce((sum, stop) => sum + stopMinutes(stop) + (stop.modo === 'camino' ? 2 : WALK_BETWEEN), 0)
  /** Los minutos que da una mitad del día: la mañana, de su hora de empezar a las 13:00; la tarde, de su hora de empezar a la puesta de sol más 45 min. */
  const halfCapacity = (draft, half) => {
    const hours = hoursOf(draft.day)
    if (half === 'manana') return 13 * 60 - toMin(draft.manana_empieza ?? '08:30')
    const begins = toMin(draft.empieza ?? '14:00')
    return Math.min((hours.sunset ?? 18 * 60) + 45, 21 * 60 + 30) - begins
  }
  /** Lo que no se recorta para hacer sitio: imprescindibles, lo del pool, las horas fijas y lo que añade la experiencia. */
  const protectedStop = (stop) => {
    const place = placeByName.get(stop.lugar)
    return Boolean(stop.protegido || stop.hora || stop.tipo === 'fija' || poolNames.includes(stop.lugar) || place?.level === 1 || place?.tier === 'joya')
  }
  /** Qué se puede quitar, en este orden: opcionales y «De camino», luego nivel 3 (nunca una iglesia con arte, ni lo que forma grupo). */
  const cutOrder = (list, { hard = false } = {}) => {
    const candidates = list.filter((stop) => !protectedStop(stop) || (hard && placeByName.get(stop.lugar)?.level === 1 && placeByName.get(stop.lugar)?.tier !== 'joya' && !stop.protegido && !stop.hora && !poolNames.includes(stop.lugar)))
    const rank = (stop) => {
      const place = placeByName.get(stop.lugar)
      if (!place) return 9
      // (Lo que forma una visita inseparable o es el acceso de otro sitio no se quita suelto.)
      if (place.approach_to || (place.group && (destData.groups?.[place.group]?.inseparable ?? []).length > 0)) return 9
      const tags = place.tags ?? []
      if (stop.modo === 'camino' || stop.tipo === 'opcional') return 0
      if (!hard && (tags.includes('iglesia') || tags.includes('museo'))) return 9
      if (!hard) return (place.level ?? 3) >= 3 || tags.includes('paseo') ? 1 : 9
      return (place.level ?? 3) >= 3 ? 1 : (place.level ?? 3) === 2 ? 2 : 3
    }
    return candidates.map((stop, index) => ({ stop, index, rank: rank(stop) })).filter((entry) => entry.rank < 9).sort((a, b) => a.rank - b.rank || b.index - a.index).map((entry) => entry.stop)
  }
  /** ¿Cabe \`minutes\` más en esa mitad? Devuelve los \`quitar\` que hacen falta (puede ser lista vacía) o null si no cabe. */
  const fitCuts = (draft, half, minutes, options = {}) => {
    const list = draft[half]
    let free = halfCapacity(draft, half) - usedMinutes(list) - minutes - WALK_BETWEEN
    if (free >= 0) return []
    // (La elástica da hasta un cuarto de su tiempo.)
    for (const stop of list) if (stop.elastica != null) free += Math.floor(stopMinutes(stop) * 0.25)
    const cuts = []
    for (const stop of cutOrder(list, options)) {
      if (free >= 0) break
      cuts.push(stop.lugar)
      free += stopMinutes(stop) + (stop.modo === 'camino' ? 2 : WALK_BETWEEN)
    }
    // Si no basta, un grupo inseparable entero (la Plaza con la Basílica de San Pedro): solo en el viaje de 1 día, con lo marcado en el pool.
    if (free < 0 && options.hard) {
      for (const group of Object.values(destData.groups ?? {})) {
        if (!(group.inseparable ?? []).length) continue
        const members = list.filter((stop) => (group.places ?? []).includes(stop.lugar))
        if (members.length < 2 || members.some((stop) => stop.protegido || stop.hora || poolNames.includes(stop.lugar) || placeByName.get(stop.lugar)?.tier === 'joya')) continue
        for (const stop of members) if (!cuts.includes(stop.lugar)) { cuts.push(stop.lugar); free += stopMinutes(stop) + WALK_BETWEEN }
        if (free >= 0) break
      }
    }
    return free >= 0 ? cuts : null
  }
  /** La entrada que pide hora (Museos Vaticanos, Galería Borghese…) va como una entrada reservada en su mejor franja real (la primera del día escrito). */
  const bestFranja = (draft, name) => {
    const franjas = written.days[draft.id]?.entradas?.[name]
    const first = franjas ? Object.values(franjas)[0] : null
    return first ? { hora: first[0], franjas } : null
  }
  /** Mete \`item\` ({ lugar, min, dentro, atardecer, franja, con, no_con_dia, zona, pool }) en el día de su zona. Devuelve true si lo mete. */
  const insertByZone = (item, label) => {
    const place = placeByName.get(item.lugar)
    const zoneId = item.zona ?? place?.zone
    if (!place || !zoneId || drafts.some((draft) => shownInDraft(draft, item.lugar))) return false
    const minutes = item.min ?? Math.min(place.duration_minutes ?? 30, 180)
    const big = Boolean(item.dentro) && minutes > BIG_MINUTES
    const oneDay = contentDays === 1
    const extras = (item.con ?? []).filter((other) => placeByName.has(other) && !drafts.some((draft) => shownInDraft(draft, other))).map((other) => ({ lugar: other, min: Math.min(placeByName.get(other).duration_minutes ?? 20, 30), protegido: true }))
    const meters = (draft, half) => {
      const points = draft[half].map((stop) => placeByName.get(stop.lugar)?.coordinates).filter(Array.isArray)
      if (!Array.isArray(place.coordinates) || points.length === 0) return Infinity
      const sorted = points.map((point) => straightLineMeters(place.coordinates, point)).sort((a, b) => a - b)
      return sorted.slice(0, 3).reduce((sum, value) => sum + value, 0) / Math.min(3, sorted.length)
    }
    // Los días y mitades que prueba, en orden: los de su zona (más paradas de esa zona primero); en el viaje de 1 día, lo marcado en el pool
    // entra siempre y sustituye la mitad más cercana (más cercana a su zona, con lo menos importante).
    const options = []
    for (const [index, draft] of drafts.entries()) {
      if (draft.escrito) continue
      if (closedThatDay(item.lugar, draft.day) || (item.no_con_dia ?? []).some((other) => shownInDraft(draft, other)) || (big && stopsOfDraft(draft).some(isBigStop))) continue
      const count = zonesOfDraft(draft).get(zoneId) ?? 0
      if (count > 0) {
        const half = item.franja ?? ((zonesOfDraft(draft, 'manana').get(zoneId) ?? 0) >= (zonesOfDraft(draft, 'tarde').get(zoneId) ?? 0) ? 'manana' : 'tarde')
        // (Cerca de verdad: un sitio de su zona a unos 1.500 m de lo que ya lleva esa mitad como mucho; nunca se mete lejos con un taxi. Lo del pool, sí.)
        if (!item.pool && meters(draft, half) > (destData.destination_config?.alcance?.experiencia_cerca_m ?? 1200)) continue
        options.push({ draft, index, half, count, hard: oneDay && Boolean(item.pool) })
      } else if (oneDay && item.pool) {
        const half = item.franja ?? (meters(draft, 'manana') <= meters(draft, 'tarde') ? 'manana' : 'tarde')
        options.push({ draft, index, half, count: 0, hard: true })
      }
    }
    options.sort((a, b) => b.count - a.count || a.index - b.index)
    for (const option of options) {
      const { draft: target, half, hard } = option
      const franja = item.dentro ? bestFranja(target, item.lugar) : null
      const cuts = fitCuts(target, half, minutes + extras.reduce((sum, extra) => sum + extra.min, 0), { hard: hard && item.pool })
      if (cuts == null) continue
      const list = target[half]
      const lastOfZone = list.map((stop, index) => (placeByName.get(stop.lugar)?.zone === zoneId && stop.modo !== 'camino' ? index : -1)).reduce((a, b) => Math.max(a, b), -1)
      const stop = {
        lugar: item.lugar,
        min: minutes,
        protegido: true,
        ...(item.dentro ? { modo: 'dentro', entrada: (place.ticket_info ?? []).some((line) => /de pago/i.test(line)), si_cerrado: 'quitar' } : {}),
        ...(item.atardecer ? { modo: 'atardecer' } : {}),
        ...(franja ? { tipo: 'fija', hora: franja.hora, hora_tipo: 'turno', turno: true, llegar_antes: ENTRY_ARRIVAL_MARGIN } : {}),
      }
      const anchor = lastOfZone >= 0 ? list[lastOfZone].lugar : null
      const key = half === 'manana' ? 'manana' : 'tarde.*'
      const where = franja ? { al_principio: true } : anchor ? { despues_de: anchor } : {}
      const cambios = { [key]: { insertar: [{ ...where, parada: stop }, ...extras.map((extra) => ({ despues_de: item.lugar, parada: extra }))] } }
      if (cuts.length > 0) cambios[key].quitar = cuts
      // Un solo atardecer por día: si el sitio es del atardecer, el que ya lo era pasa a parada normal.
      if (item.atardecer) {
        const adjust = {}
        for (const other of stopsOfDraft(target)) if (other.modo === 'atardecer' && other.lugar !== item.lugar) adjust[other.lugar] = { modo: 'parada' }
        if (Object.keys(adjust).length > 0) cambios[key].ajustar = adjust
      }
      applyOps(target, cambios, label)
      target.poolOps.push([cambios, label])
      return true
    }
    return false
  }
  /** Alarga un sitio que el día ya lleva (el barrio, el parque), solo con el tiempo que sobra: nunca quita una parada. */
  const stretchInDrafts = (item, label) => {
    for (const draft of drafts) {
      if (draft.escrito) continue
      const found = stopsOfDraft(draft).find((stop) => stop.lugar === item.lugar && stop.modo !== 'camino')
      if (!found) continue
      const half = draft.manana.includes(found) ? 'manana' : 'tarde'
      const extra = item.alarga ? Math.max(0, item.min - (found.min ?? placeByName.get(found.lugar)?.duration_minutes ?? 0)) : 0
      const needsMin = extra > 0
      // (El atardecer solo cambia en la tarde: un sitio de la mañana no se vuelve el atardecer.)
      const needsSun = item.atardecer && found.modo !== 'atardecer' && half === 'tarde'
      if (!needsMin && !needsSun) continue
      // (Alargar un paseo solo usa el tiempo que sobra: nunca quita una parada.)
      if (needsMin && halfCapacity(draft, half) - usedMinutes(draft[half]) < extra) continue
      const patch = { tipo: 'normal', protegido: true, ...(needsMin ? { min: item.min } : {}), ...(needsSun ? { modo: 'atardecer' } : {}) }
      const adjust = { [item.lugar]: patch }
      if (needsSun) for (const other of stopsOfDraft(draft)) if (other.modo === 'atardecer' && other.lugar !== item.lugar) adjust[other.lugar] = { modo: 'parada' }
      const cambios = { [half === 'manana' ? 'manana' : 'tarde.*']: { ajustar: adjust } }
      applyOps(draft, cambios, label)
      draft.poolOps.push([cambios, label])
      return true
    }
    return false
  }

  const unplacedPool = []
  const poolOrder = destData.pool_lista?.lugares ?? []
  const orderedPool = [...poolNames].sort((a, b) => (poolOrder.indexOf(a) < 0 ? 999 : poolOrder.indexOf(a)) - (poolOrder.indexOf(b) < 0 ? 999 : poolOrder.indexOf(b)))
  const takenHoles = new Set()
  // Lo que ya va en la ruta no cuenta como elección; los extras, hasta el límite por días (2 días, 2; 3, 3; 4, 4;
  // 5 o más, 5), en el orden de `pool_lista`.
  const extrasLimit = poolExtrasLimit(contentDays)
  let extrasUsed = 0
  for (const name of orderedPool) {
    // Un día escrito trae el sitio escrito de cada extra (qué sale, qué entra, en qué orden y cuántos minutos): lo coloca él. Lo que ya va en el día no cambia nada.
    // (Tanda 2: el día donde está escrito; entre varios, el que ese día abre, luego el de más `prioridad` —el medio día del Tridente gana a la Roma antigua para la Galería— y luego el primero del viaje.)
    const escritoDefs = drafts.map((draft, position) => (draft.escrito ? { draft, position, def: written.days[draft.id]?.pool?.[name] ?? null } : null)).filter((item) => item?.def && (item.def.pendiente || item.def.no_cabe || vale(item.def, { ids: order, dateIso: hoursOf(item.draft.day).dateIso })))
    const escritoDef = [...escritoDefs].sort((x, y) => Number(closedThatDay(name, x.draft.day)) - Number(closedThatDay(name, y.draft.day)) || (y.def.prioridad ?? 0) - (x.def.prioridad ?? 0) || x.position - y.position)[0]
    if (escritoDef) {
      ;(escritoDef.draft.poolPedido ??= []).push({ name, def: escritoDef.def })
      continue
    }
    // Lo marcado en el pool que un día escrito ya lleva por dentro: ya incluido. Si lo lleva por fuera o de camino, pasa a por dentro (el pool va por dentro y es la prioridad).
    if (drafts.some((draft) => draft.escrito && (draft.rows ?? []).some((row) => row.lugar === name && row.modo === 'dentro'))) continue
    {
      const host = placeByName.get(name)?.type === 'interior' ? drafts.find((draft) => draft.escrito && (draft.rows ?? []).some((row) => row.lugar === name && row.modo !== 'dentro' && row.tipo === 'parada')) : null
      if (host && !closedThatDay(name, host.day)) {
        ;(host.poolDentro ??= []).push(name)
        continue
      }
    }
    if (drafts.some((draft) => draft.escrito && (draft.rows ?? []).some((row) => row.lugar === name && row.modo !== 'camino'))) continue
    const already = drafts.find((draft) => !draft.escrito && [...draft.manana, ...draft.tarde].some((stop) => stop.lugar === name && stop.modo !== 'camino'))
    if (already) {
      forceInside(already, name)
      already.poolInside.push(name)
      continue
    }
    if (hasFreeTour && tourCovers.has(name) && placeByName.get(name)?.type !== 'interior') continue
    if (extrasUsed >= extrasLimit) {
      unplacedPool.push({ unitId: name, name, reason: 'pool_limit', dayNumber: null })
      continue
    }
    extrasUsed++
    // El extra va en el día más cercano a su zona (decisión del usuario, 4-oct-2026): los sitios escritos se ordenan por la distancia media
    // del lugar a las tres paradas más cercanas de cada día (sin zigzag); a igual distancia, el orden del fichero.
    const nearness = (siteDay) => {
      const source = placeByName.get(name)
      const draft = drafts.find((candidate) => candidate.id === siteDay)
      if (!Array.isArray(source?.coordinates) || !draft) return Infinity
      const points = [...draft.manana, ...draft.tarde].filter((stop) => stop.modo !== 'camino').map((stop) => placeByName.get(stop.lugar)?.coordinates).filter(Array.isArray)
      if (points.length === 0) return Infinity
      const meters = points.map((point) => straightLineMeters(source.coordinates, point)).sort((x, y) => x - y)
      return meters.slice(0, 3).reduce((sum, value) => sum + value, 0) / Math.min(3, meters.length)
    }
    const sites = (written.destino?.pool?.[name]?.sitios ?? []).map((candidate, index) => ({ candidate, index, meters: nearness(candidate.dia) })).sort((x, y) => x.meters - y.meters || x.index - y.index).map((item) => item.candidate)
    // (Nunca en un día en que ese lugar cierra: pasa a su siguiente sitio.)
    // (Un sitio de los de siempre en un día escrito no hace nada —el día escrito trae sus propios extras—: no cuenta como sitio.)
    const siteDraft = (candidate) => drafts.find((draft) => draft.id === candidate.dia && !draft.escrito)
    const site = sites.find((candidate) => siteDraft(candidate) && !closedThatDay(name, siteDraft(candidate).day) && !(candidate.hueco && takenHoles.has(`${candidate.dia}:${candidate.hueco}`)) && !blockedPoolSites.includes(`${candidate.dia}:${name}`)) ?? sites.find((candidate) => siteDraft(candidate) && !(candidate.hueco && takenHoles.has(`${candidate.dia}:${candidate.hueco}`)) && !blockedPoolSites.includes(`${candidate.dia}:${name}`))
    if (!site) {
      // (Sin sitio escrito —el viaje de 1 día, o un día que no está en el viaje—: en el día de su zona, por dentro.)
      if (insertByZone({ lugar: name, dentro: true, pool: true }, `pool:${name}`)) continue
      unplacedPool.push({ unitId: name, name, reason: sites.length === 0 ? 'no_room' : 'no_room_day', dayNumber: null })
      continue
    }
    const draft = drafts.find((candidate) => candidate.id === site.dia)
    if (site.hueco) takenHoles.add(`${site.dia}:${site.hueco}`)
    applyOps(draft, site.cambios, `pool:${name}`)
    draft.poolOps.push([site.cambios, `pool:${name}`])
  }
  // Las experiencias (REGLAS_RUTAS 13): para cada una, la lista ordenada del destino (`destination_config.experiencias_lista`); el motor mete de
  // esa lista lo que cabe según los días (1 día, 1; 2 o 3 días, 2 o 3; más de 3, 3 o 4), cada cosa en el día de su zona.
  const listLimit = contentDays <= 1 ? 1 : contentDays <= 3 ? contentDays : contentDays <= 5 ? 3 : 4
  for (const exp of selected) {
    let added = 0
    for (const item of destData.destination_config?.experiencias_lista?.[exp] ?? []) {
      if (added >= listLimit) break
      if (item.desde_dias != null && contentDays < item.desde_dias) continue
      const label = `lista:${exp}:${item.lugar}`
      const ok = item.alarga || item.atardecer ? stretchInDrafts(item, label) || insertByZone(item, label) : insertByZone(item, label)
      if (ok) added++
    }
  }
  // Viaje de 2 días: por dentro solo lo marcado en el pool (o, sin nada marcado, lo que dice el destino) y lo que va siempre
  // dentro (el Panteón); el resto de lo que tiene entrada, por fuera (INVARIANTES 449).
  const shortRule = cityDays.length === 1 ? written.destino?.viajes_cortos?.un_dia ?? null : cityDays.length === 2 ? written.destino?.viajes_cortos?.dos_dias ?? null : null
  const insideAllowed = (() => {
    if (!shortRule) return null
    const marked = Object.keys(shortRule.marcables ?? {}).filter((name) => inPool(name))
    return new Set([...(shortRule.siempre_dentro ?? []), ...(hasFreeTour ? shortRule.siempre_dentro_con_free_tour ?? [] : []), ...(marked.length > 0 ? marked.flatMap((name) => shortRule.marcables[name]) : shortRule.dentro_sin_marcar ?? []), ...poolNames, ...insideNames])
  })()
  // Lo que no se ve desde la calle (los Museos Vaticanos: por fuera son un muro) no existe «por fuera»: si no se entra, la parada
  // desaparece y la visita de la zona son sus otros lugares (la Plaza y la Basílica).
  const hasOutsideView = (name) => {
    const source = placeByName.get(name)
    return !source || source.minutos_fuera != null || Boolean(source.pass_by) || source.type === 'exterior'
  }
  // REGLAS_RUTAS 45: por dentro gana a por fuera entre días del viaje (se rellena más abajo, tras montar todos los días).
  const dedupeDrop = new Set()
  const finishDraft = (draft) => {
    if (dedupeDrop.size > 0) for (const section of ['manana', 'tarde']) draft[section] = draft[section].filter((stop) => !dedupeDrop.has(`${draft.id}:${stop.lugar}`))
    // (Lo que se quitó de la tarde para que la cena no pase de su hora límite, REGLAS_RUTAS 44.)
    if (dropTarde.length > 0) draft.tarde = draft.tarde.filter((stop) => !dropTarde.includes(`${draft.id}:${stop.lugar}`))
    if (insideAllowed) {
      for (const section of ['manana', 'tarde']) {
        const before = draft[section].length
        draft[section] = draft[section].filter((stop) => !(stop.modo === 'dentro' && stop.entrada && !insideAllowed.has(stop.lugar) && !hasOutsideView(stop.lugar)))
        // La mañana que se queda sin su museo se rellena con lo que sí hay en la zona: la Plaza y la Basílica con calma
        // (la Basílica entera, con la Piedad, la tumba de Pedro y la subida a la cúpula vista desde dentro: 90 min).
        // (Solo si la mañana no tiene otra cosa con hora fija: con los Museos marcados, siguen a las 08:00.)
        if (section === 'manana' && draft[section].length < before && !draft.manana.some((stop) => stop.hora != null)) {
          // Sin el museo de las 08:00 no hay prisa: la mañana empieza más tarde y acaba donde empezaba la comida.
          if (!draft.manana_empieza) draft.manana_empieza = '09:30'
          for (const stop of draft.manana) {
            if (stop.lugar === 'Basílica de San Pedro') stop.min = Math.max(stop.min ?? 0, 90)
            if (stop.lugar === 'Plaza de San Pedro') stop.min = Math.max(stop.min ?? 0, 30)
          }
        }
      }
    }
    if (insideAllowed) for (const stop of [...draft.manana, ...draft.tarde]) if (stop.modo === 'dentro' && stop.entrada && !insideAllowed.has(stop.lugar)) {
      stop.modo = 'fuera'
      stop.motivoFuera = 'viaje_corto'
      // (Por fuera no hay entrada con hora ni turno que cumplir.)
      delete stop.hora
      delete stop.turno
      if (stop.tipo === 'fija') stop.tipo = 'normal'
    }
    // "Quiero entrar": lo que el viajero pide ver por dentro.
    for (const stop of [...draft.manana, ...draft.tarde]) if (insideNames.includes(stop.lugar) && stop.modo === 'fuera') stop.modo = 'dentro'
    // `solo_con` / `solo_sin`: una parada que solo sale si otra del día va por dentro (o si no va): el miércoles del Papa, con los Museos o sin ellos.
    {
      const insideNow = (name) => [...draft.manana, ...draft.tarde].some((stop) => stop.lugar === name && stop.modo === 'dentro')
      for (const section of ['manana', 'tarde']) draft[section] = draft[section].filter((stop) => (stop.solo_con == null || insideNow(stop.solo_con)) && (stop.solo_sin == null || !insideNow(stop.solo_sin)))
    }
  }
  for (const draft of drafts) finishDraft(draft)
  // Si un sitio sale en dos días del viaje, uno por fuera y otro por dentro, se queda el de dentro; si los dos son por fuera, el del día de su zona.
  // Las nocturnas no cuentan (siguen la regla 5/6) ni los «De camino».
  {
    const found = new Map()
    for (const draft of drafts) for (const section of ['manana', 'tarde']) for (const stop of draft[section]) {
      if (stop.modo === 'camino') continue
      const list = found.get(stop.lugar) ?? []
      list.push({ draft, stop })
      found.set(stop.lugar, list)
    }
    for (const [name, list] of found) {
      const byDraft = new Map(list.map((item) => [item.draft.id, item]))
      if (byDraft.size < 2) continue
      const entries = [...byDraft.values()]
      const place = placeByName.get(name)
      const isInside = (item) => item.stop.modo === 'dentro' && !closedThatDay(name, item.draft.day)
      const locked = (item) => item.stop.hora_tipo === 'reserva' || item.stop.hora_tipo === 'turno' || item.stop.turno === true
      let keep
      if (entries.some(isInside)) keep = entries.find(isInside)
      else {
        const zoneCount = (item) => zonesOfDraft(item.draft).get(place?.zone) ?? 0
        keep = [...entries].sort((a, b) => zoneCount(b) - zoneCount(a))[0]
      }
      for (const item of entries) if (item !== keep && !locked(item) && !(isInside(item))) dedupeDrop.add(`${item.draft.id}:${name}`)
    }
    if (dedupeDrop.size > 0) for (const draft of drafts) finishDraft(draft)
  }
  /** El mismo día escrito con otra versión de la tarde (y lo mismo del pool). */
  const redraft = (draft, version) => {
    const other = makeDraft(draft.id, draft.index, version)
    for (const [ops, label] of draft.poolOps) {
      applyOps(other, ops, label)
      other.poolOps.push([ops, label])
    }
    for (const name of draft.poolInside) {
      forceInside(other, name)
      other.poolInside.push(name)
    }
    finishDraft(other)
    return other
  }

  // ── 4. Las horas ─────────────────────────────────────────────────────────────────────────────
  let whyByPlace = null
  function curatedWhyOf(name) {
    if (!whyByPlace) {
      const counts = new Map()
      for (const cfg of destData.curated_days ?? []) {
        for (const section of [cfg, ...Object.values(cfg.variantes ?? {})]) {
          for (const item of [...(section.manana ?? []), ...(section.tarde ?? []), ...(section.tarde_antes ?? []), ...(section.insertar ?? []).map((insert) => insert.parada)]) {
            if (!item?.por_que) continue
            const byText = counts.get(item.lugar) ?? new Map()
            const textKey = JSON.stringify(item.por_que)
            byText.set(textKey, (byText.get(textKey) ?? 0) + 1)
            counts.set(item.lugar, byText)
          }
        }
      }
      whyByPlace = new Map([...counts].map(([lugar, byText]) => [lugar, JSON.parse([...byText].sort((a, b) => b[1] - a[1])[0][0])]))
    }
    return whyByPlace.get(name) ?? destData.por_que_lugares?.[name] ?? null
  }
  const usedRestaurants = new Set()
  const notEnoughTime = []
  /** En qué día se vio cada lugar (para las revisitas escritas: «Ya la viste el día 1…»). */
  const seenDay = new Map()
  /** Lo que el viaje ya ha visto por dentro (o como parada), para `si_no_visto` y `si_visto`. */
  const seenInside = new Set()
  const seen = new Set(hasFreeTour ? [...tourCovers] : [])
  const problems = []

  function sourceOf(stop) {
    if (tour && stop.lugar === tour.name) return { ...tour, isFreeTour: true, level: 1, type: 'exterior', duration_minutes: tour.duration_minutes ?? 150 }
    const pause = (destData.curated_breaks ?? []).find((item) => item.name === stop.lugar)
    if (pause) return { ...pause, isBreak: true, level: 3, type: 'exterior', is_free_access: true }
    return placeByName.get(stop.lugar) ?? null
  }
  const hourOf = (stop) => (stop.hora == null ? null : toMin(stop.hora))
  const firstRequiredOf = (list) => (list ?? []).find((stop) => stop.tipo !== 'opcional' && stop.modo !== 'camino') ?? null
  // A una entrada reservada se llega siempre 30 min antes, sin tolerancia (decisión del usuario, 3-oct-2026: la tarjeta dice «Llega 30 min antes»).
  const entryTolerance = () => 0

  /** El lugar listo para el formato, según cómo sale (`modo`) y por qué va por fuera si va. */
  function readyPlace(stop, source, outsideReason, hours) {
    const modo = stop.modo ?? 'parada'
    let ready = { ...source }
    if (outsideReason || modo === 'fuera') {
      const reason = outsideReason ?? (stop.motivoFuera === 'viaje_corto' ? OUTSIDE_REASONS.viaje_corto : OUTSIDE_REASONS.no_cabe)
      ready = {
        ...source,
        visitOutside: true,
        outsideReason: reason,
        outsideKind: reason === OUTSIDE_REASONS.viaje_corto ? 'no_cabe' : Object.keys(OUTSIDE_REASONS).find((k) => OUTSIDE_REASONS[k] === reason) ?? (reason.startsWith('Todavía') ? 'no_abre' : 'no_cabe'),
        coordinates: source.pass_by?.coordinates ?? source.coordinates,
        duration_minutes: stop.min_fuera ?? source.minutos_fuera ?? OUTSIDE_MINUTES,
        // (Lo escrito «por fuera» o «si está cerrado, por fuera»: lo decide quien escribe el día, no el motor. 5.4)
        ...((stop.modo === 'fuera' && !stop.motivoFuera) || stop.si_cerrado === 'fuera' ? { outsideAuthored: true } : {}),
        // Lo escrito «por fuera» a propósito (el Castillo de Sant'Angelo): ni «para llegar a todo lo del día» ni «Quiero entrar»; sale su texto de `por_fuera`.
        // (En un viaje de 1 o 2 días se queda como antes: ahí el viajero puede marcarlo en el pool y pedir entrar.)
        ...(stop.modo === 'fuera' && !stop.motivoFuera && !outsideReason && (!insideAllowed || stop.escrito) ? { outsideKind: 'a_proposito', outsideReason: source.por_fuera ?? null } : {}),
        windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior',
      }
    } else if (modo === 'camino') {
      ready = {
        ...source,
        passThrough: true,
        duration_minutes: stop.min ?? Math.min(source.duration_minutes ?? PASS_THROUGH_MINUTES, PASS_THROUGH_MINUTES),
        outsideReason: 'hoy no toca entrar',
        windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior',
      }
    } else {
      if (stop.min != null) ready.duration_minutes = stop.min
      // (Un día escrito que dice «por dentro» sale por dentro aunque el sitio sea de nivel 3: la cabecera del acordeón lo enseña.)
      if (stop.escrito && modo === 'dentro') ready = { ...ready, writtenInside: true }
      if (modo === 'atardecer' && hours.sunset != null) ready = { ...ready, sunset: hours.sunset, ...(stop.lead ? { sunsetLead: stop.lead } : {}) }
    }
    // (Una calle que lo escrito pone como parada, «Via Margutta y Via del Babuino», es parada, no "de camino".)
    if (stop.no_calle || (modo !== 'camino' && isStreet(source))) ready.notStreet = true
    if (stop.traslado?.min) ready = { ...ready, transitMinutes: stop.traslado.min, ...(stop.traslado.como ? { transitHow: stop.traslado.como } : {}) }
    if (stop.aviso) ready.stopNotice = stop.aviso
    // (`foto`: el nombre con el que se pide la foto de esta parada, si no es el del lugar: el mismo parque dos veces en un día.)
    if (stop.foto) ready.photoName = stop.foto
    if (Array.isArray(source.salida) && !ready.visitOutside && !ready.passThrough) ready.end_coordinates = source.salida
    // (El texto escrito en la parada; si no, el de los días curados; si no, el del destino: `_destino.json` → `textos`.)
    const why = stop.texto ?? curatedWhyOf(stop.lugar) ?? written.destino?.textos?.[stop.lugar] ?? null
    if (why) ready.curatedWhy = why
    const [scheduled] = placesForScheduler({ id: stop.lugar, places: [ready] }, destData, null)
    return scheduled
  }

  /** ¿Está abierto de `start` a `start + duration`? { ok } | { wait: minutos hasta que abre } | { closed, opensAt } */
  function openCheck(place, start, duration, hours, maxWait = null) {
    if (place.isFreeTour || place.isBreak || place.visitOutside || place.passThrough || place.type === 'exterior' && !place.schedule && !place.windows && !place.by_day && !place.by_period && !place.by_season) return { ok: true }
    const sessions = parseHoursSessions(effectiveSchedule(place, hours)).sort((a, b) => a.open - b.open)
    if (sessions.length === 0) return { ok: true }
    const last = lastEntryMinutes(place, start, hours)
    const inside = sessions.find((session) => start >= session.open && start + duration <= session.close)
    if (inside && (last == null || start <= last)) return { ok: true }
    const next = sessions.find((session) => session.open > start)
    if (next && next.open - start <= (inPool(place.name) ? OPEN_WAIT_MAX_POOL : maxWait ?? OPEN_WAIT_MAX) && next.open + duration <= next.close) return { wait: next.open - start }
    return { closed: true, opensAt: next?.open ?? null }
  }

  const walkLeg = (from, to) => (Array.isArray(from) && Array.isArray(to) ? Math.round(travel.leg(from, to)?.minutes ?? 0) : 0)

  /**
   * Al lado de un imprescindible, aunque esté cerrado, se ve por fuera (PARA_CODE_TODO_2026-10-01, 5.4): un lugar con su
   * exterior curado (`minutos_fuera`) que a su hora está cerrado y tiene un imprescindible (nivel 1) a 5 min andando o menos,
   * justo antes o justo después, sale «Por fuera» con su tiempo de por fuera y sin el aviso en rojo; la ficha dice cuándo
   * abre («Por dentro abre de 12:00 a 19:00»). Lo escrito «por fuera» es una decisión del día: tampoco lleva el aviso.
   */
  function markOutsideNextToEssential(visits, hours) {
    return visits.map((visit, i) => {
      const place = visit.place
      if (!place.visitOutside || !['cerrado', 'ya_cerrado', 'no_abre'].includes(place.outsideKind)) return visit
      const source = placeByName.get(place.name)
      if (source?.minutos_fuera == null && !place.outsideAuthored) return visit
      const near = [visits[i - 1], visits[i + 1]].find((other) => {
        const otherSource = other ? placeByName.get(other.place.name) : null
        return otherSource?.level === 1 && !other.place.passThrough && walkLeg(otherSource.coordinates, place.coordinates) <= NEXT_TO_ESSENTIAL_WALK
      })
      if (!near && !place.outsideAuthored) return visit
      const sessions = place.outsideKind === 'cerrado' ? [] : parseHoursSessions(effectiveSchedule(source, hours)).sort((x, y) => x.open - y.open)
      const opens = sessions.map((session) => `de ${toHHMM(session.open)} a ${toHHMM(session.close)}`).join(' y ')
      return { ...visit, place: { ...place, outsideKind: 'al_lado', outsideNear: near?.place.name ?? null, outsideReason: opens ? `Por dentro abre ${opens}` : 'Hoy está cerrado por dentro' } }
    })
  }
  /** Lo que sale «Por fuera» con el aviso en rojo (todavía no ha abierto, ya ha cerrado): lo que la regla de arriba no salva. */
  const redOutside = (visits, hours) => markOutsideNextToEssential(visits, hours).filter((visit) => visit.place.visitOutside && ['no_abre', 'ya_cerrado'].includes(visit.place.outsideKind))

  /**
   * Una lista de paradas, en orden, desde `cursor`. `elasticDelta`: lo que se alarga o acorta la parada elástica.
   * Devuelve las visitas y el cursor al final (sin tocar nada fuera de lo escrito).
   */
  /**
   * Lo menos que puede durar una parada recortada: el 75 % de lo escrito y nunca menos de 15 min (20 un barrio); lo que
   * ya está escrito más corto (una plaza de 10 min) se queda como está. Salvo un barrio, que nunca baja de 20: en la
   * comprobación (writtenCheck) un Barrio Judío escrito de 10 min es un error.
   */
  function shrinkFloor(stop, base, writtenCheck = false) {
    const barrio = (placeByName.get(stop.lugar)?.tags ?? []).includes('barrio')
    const abs = barrio ? BARRIO_MIN : STOP_MIN
    if (writtenCheck && barrio) return Math.max(abs, Math.ceil(base * 0.75))
    return Math.min(base, Math.max(Math.ceil(base * 0.75), abs))
  }
  function runListOnce(list, slot, cursor, ctx, elasticDelta = 0) {
    const visits = []
    const units = []
    let { t, coords } = cursor
    let carry = null
    let mergedMinutes = 0
    const cursorStart = cursor.t
    list.forEach((original, index) => {
      let late = null
      // (La elástica que se quedaría por debajo de ELASTIC_DROP min se quita: su rato va al bloque siguiente.)
      if (original.elastica != null && ctx.dropElastic) return
      let stop = original
      let source = sourceOf(stop)
      if (!source) {
        ctx.problems.push({ tipo: 'lugar_desconocido', lugar: stop.lugar })
        return
      }
      // `si_no_visto`: no va si el viaje ya lo vio por dentro otro día (el Castillo de D7 con el de D2 o D4); `si_visto`: va
      // solo si ya se vio ese otro (el Palazzo Doria Pamphilj en su lugar).
      // El desayuno (una pausa, `isBreak`): solo en completo, y solo después de una visita temprana con hora (Trevi a las
      // 8:30) o para llenar el rato hasta algo con hora fija (el Free Tour de las 10:00). Nunca como bloque de todas las
      // mañanas (decisión del usuario, 2026-09-29).
      if (source.isBreak && !ctx.escrito) {
        const previousHour = index > 0 ? hourOf(list[index - 1]) : null
        const nextHour = index + 1 < list.length ? hourOf(list[index + 1]) : null
        const afterEarly = previousHour != null && previousHour <= BREAKFAST_AFTER_BEFORE
        if (!(afterEarly || nextHour != null)) return
      }
      if (stop.si_no_visto && seenInside.has(stop.lugar)) return
      // `una_vez`: lo que ya salió en el viaje (por dentro o por fuera) no vuelve a salir (el Castillo, que ya solo va por fuera).
      if (stop.una_vez && seen.has(stop.lugar)) {
        // (Si se salta, el tramo que se ahorra se hace como dice: del Castillo a Santa Maria in Trastevere, en el bus 23.)
        if (stop.traslado_si_se_salta) carry = stop.traslado_si_se_salta
        return
      }
      if (stop.si_visto && !seen.has(stop.si_visto)) return
      let outsideReason = null
      // Cerrado ese día: lo escrito (por fuera, o el cambio por otra parada); si no hay nada escrito, por fuera si se
      // ve desde fuera y, si no, fuera del día (y la prueba lo marca).
      if (!source.isFreeTour && !source.isBreak && stop.modo !== 'camino' && closedThatDay(stop.lugar, ctx.day)) {
        const rule = stop.si_cerrado
        if (rule === 'quitar') return
        if (rule?.cambiar_por) {
          // (Si el cambio es lo mismo que viene justo después, no sale dos veces seguidas: su rato se suma al siguiente. Las
          // Catacumbas cerradas el 1 de enero y la Via Appia, dos veces. PROMPT_REPASO_LOCAL_ROMA, 3.)
          if (list[index + 1]?.lugar === rule.cambiar_por.lugar) {
            mergedMinutes += rule.cambiar_por.min ?? 30
            return
          }
          // (Y si lo que viene a cambiar es lo que va justo antes, el parque de Villa Borghese de D4 cuando cierra la Galería, ese rato
          // se suma a lo de antes.)
          if (visits.at(-1)?.place.name === rule.cambiar_por.lugar && list[index - 1]?.lugar === rule.cambiar_por.lugar) {
            const last = visits.at(-1)
            const cap = paseoMaxOf(placeByName.get(last.place.name))
            const extra = rule.cambiar_por.min ?? 30
            last.end += cap != null ? Math.min(extra, Math.max(0, cap - (last.end - last.start))) : extra
            t = last.end
            return
          }
          stop = { ...clone(rule.cambiar_por) }
          source = sourceOf(stop)
          if (!source) return
        } else if (rule === 'camino' || (source.type !== 'interior' && rule !== 'fuera')) {
          stop = { ...stop, modo: 'camino' }
        } else if (rule === 'fuera' || source.minutos_fuera != null) {
          outsideReason = OUTSIDE_REASONS.cerrado
        } else {
          if (!ctx.probe) notEnoughTime.push({ name: stop.lugar, reason: 'closed', dayNumber: ctx.day.dayNumber, closed: { dateIso: ctx.hours.dateIso, weekday: ctx.hours.weekday } })
          if (!rule) ctx.problems.push({ tipo: 'cerrado_sin_solucion', lugar: stop.lugar })
          if (stop.traslado) carry = stop.traslado
          return
        }
      }
      if (carry && !stop.traslado) stop = { ...stop, traslado: stop.traslado_si_va_primera ?? carry }
      carry = null
      // Lo escrito "por fuera": con su motivo real si a esa hora está cerrado (el Tempietto después de las 18:00).
      if (!outsideReason && stop.modo === 'fuera' && !source.isFreeTour && !ctx.escrito) {
        const probeAt = t + walkLeg(coords, source.pass_by?.coordinates ?? source.coordinates)
        const check = openCheck(source, probeAt, source.duration_minutes ?? 30, ctx.hours)
        if (check.closed) outsideReason = check.opensAt != null ? `Todavía no ha abierto (abre a las ${toHHMM(check.opensAt)})` : OUTSIDE_REASONS.ya_cerrado
      }
      let place = readyPlace(stop, source, outsideReason, ctx.hours)
      const legRaw = walkLeg(coords, place.coordinates)
      // (Un traslado escrito no se usa si andando es un paseo corto: la Isla Tiberina y Santa Cecilia, cuando van seguidas.)
      if (place.transitMinutes && legRaw <= SHORT_WALK) {
        place = { ...place }
        delete place.transitMinutes
        delete place.transitHow
      }
      // (Un tramo de más de LONG_WALK min andando nunca va a pie: si no trae su bus o taxi escrito, en taxi.)
      if (!place.transitMinutes && legRaw > LONG_WALK && t != null && coords) place = { ...place, transitMinutes: Math.max(10, Math.round(legRaw / 2.5) + 5), transitHow: 'un taxi' }
      // Festivos con el transporte recortado (Navidad en Roma): fuera de sus horas, el bus o el metro escritos pasan a taxi
      // (o a pie si el tramo es corto), nunca en bus ni metro.
      const transitKind = place.transitMinutes ? publicTransitKind(place.transitHow) : null
      if (transitKind && calendar.hasDates && t != null && !transitRuns(destData, ctx.hours?.dateIso, transitKind, t, t + place.transitMinutes)) {
        if (legRaw > LONG_WALK) place = { ...place, transitHow: 'un taxi', transitMinutes: Math.min(place.transitMinutes, Math.max(10, Math.round(legRaw / 2.5) + 5)), transitHoliday: true }
        else {
          place = { ...place, transitHoliday: true }
          delete place.transitMinutes
          delete place.transitHow
        }
      }
      const leg = place.transitMinutes ? Math.min(legRaw, place.transitMinutes) : legRaw
      // (Con sus minutos exactos: una rejilla de 5 min aquí sumaba redondeos y se llegaba tarde a los turnos; la pantalla
      // redondea y la hora de una parada sigue siendo la anterior + su duración + el paseo, con 4 min de margen.)
      let at = t + leg
      // Verano (REGLAS_RUTAS 21: solo julio y agosto, de 14:00 a 16:30): por la tarde, nada al sol. Lo que va al aire libre espera
      // (el rato es descanso); lo que está a cubierto (una iglesia, un museo por dentro) o se cruza de camino, no.
      // (Una hora fija de después manda sobre la sombra: la entrada reservada no se mueve, INVARIANTES 466.)
      const fixed = hourOf(stop)
      let fixedMargin = 0
      if (fixed != null) {
        // (A la entrada con turno se llega 10 min antes: `turno` en lo escrito, los turnos de la ficha o el Free Tour.)
        const slotted = Boolean(stop.turno || source.turnos || source.isFreeTour)
        fixedMargin = stop.llegar_antes ?? (slotted ? TICKET_MARGIN : 0)
        const needed = fixed - fixedMargin
        // (Una hora escrita sin turno es orientativa: llegar hasta 10 min después no es llegar tarde.)
        // (Si se llega tarde, no se avisa aún: antes se recorta lo de antes, hacia atrás desde la hora fija: compressToFixedHours.)
        // (Llegar 30 min antes a una entrada reservada es lo bueno, no lo obligado: hasta 10 min antes vale, y no hace falta recortar nada.)
        const tol = entryTolerance(stop)
        if (!ctx.escrito && at > needed + tol) late = { arrival: at, needed, fixed, tol, lugar: stop.lugar, reserved: stop.llegar_antes != null }
        // (Un día escrito: la hora del documento es la hora; el motor no la mueve.)
        at = ctx.escrito ? fixed : Math.max(at, fixed)
      }
      let duration = place.duration_minutes ?? 30
      if (mergedMinutes) {
        const cap = paseoMaxOf(source)
        duration = cap != null ? Math.max(duration, Math.min(cap, duration + mergedMinutes)) : duration + mergedMinutes
        mergedMinutes = 0
      }
      if (original.elastica != null && elasticDelta) duration = Math.max(shrinkFloor(stop, duration), duration + elasticDelta)
      // (Un barrio escrito por debajo de su mínimo, o una elástica que no llega: la prueba lo marca.)
      if (!ctx.probe && !ctx.escrito && !place.visitOutside && !place.passThrough && place.sunset == null && duration < shrinkFloor(stop, stop.min ?? source.duration_minutes ?? duration, true)) ctx.problems.push({ tipo: 'parada_corta', lugar: stop.lugar, minutos: duration })
      // El mirador: se llega a su hora (el sol menos 25 min) y se queda hasta 15 min después del sol.
      if (place.sunset != null && ctx.escrito) ctx.sunsetArrival = at
      if (place.sunset != null && !ctx.escrito) {
        // (REGLAS_RUTAS 38: el mirador no se queda más que su máximo, `min_max`: si lo escrito llega antes, llega más tarde y el rato de antes lo llena la regla 20.)
        const lead = Math.min((place.sunsetLead ?? SUNSET_LEAD) + (ctx.earlyBy ?? 0), (source.min_max ?? Infinity) - SUNSET_STAY)
        const target = place.sunset - lead
        ctx.sunsetArrival = at
        // (REGLAS_RUTAS 6: el atardecer se intenta, pero no se esperan más de 30 min sin nada: si se llega antes, el mirador va cuando se llega.)
        if (at < target && target - at <= SUNSET_MAX_WAIT) at = target
        // El viajero manda (3-oct-2026): si su reserva se pisa con el atardecer, ese día va sin atardecer, sin forzarlo y sin aviso.
        if (at > place.sunset && ctx.reserved) return
        if (at > place.sunset) place = { ...place, sunset: undefined, nightView: true }
        else duration = Math.min(Math.max(20, place.sunset + SUNSET_STAY - at), source.min_max ?? Infinity)
      }
      // (El tramo en bus o taxi de antes de llegar se queda aunque la parada cambie aquí a "por fuera" o por otra: si no, la hora
      // contaba el taxi y la pantalla pintaba 33 min andando, de San Pedro a Santa Cecilia en Navidad. PROMPT_TEXTOS_RITMO 7.)
      const arrivalTransit = place.transitMinutes ? { transitMinutes: place.transitMinutes, transitHow: place.transitHow } : null
      if (!place.visitOutside && !place.passThrough) {
        // (Lo que la elástica estira nunca pasa de la hora de cierre: se queda hasta que cierra, no se pierde por dentro.
        // El Castillo a las 17:50 con 110 min salía «ya ha cerrado». PROMPT_REPASO_LOCAL_ROMA, 3.)
        const writtenMin = stop.min ?? source.duration_minutes ?? 30
        while (original.elastica != null && duration - 5 >= writtenMin && openCheck(place, at, duration, ctx.hours).closed && !openCheck(place, at, writtenMin, ctx.hours).closed) duration -= 5
        // La entrada reservada se recorta hasta el cierre (la visita de las 17:30 acaba a las 20:00 si el sitio cierra a esa hora; nunca menos de 60 min).
        if (stop.recorta_al_cierre) {
          // (`recorta_al_cierre: 20`: se acorta hasta su cierre, con ese mínimo; `true`: hasta 60 min, como la entrada reservada.)
          const shortest = typeof stop.recorta_al_cierre === 'number' ? stop.recorta_al_cierre : 60
          while (duration > shortest && openCheck(place, at, duration, ctx.hours).closed && !openCheck(place, at, shortest, ctx.hours).closed) duration -= 5
        }
        // REGLAS_RUTAS 1 (orden ante un cierre: adelantar → acortar → por fuera → quitar): una visita por dentro que se pasaría de la hora de cierre se acorta hasta el cierre, no menos de 20 min.
        else while (duration > 20 && openCheck(place, at, duration, ctx.hours).closed && !openCheck(place, at, 20, ctx.hours).closed) duration -= 5
        // (Lo escrito «si está cerrado, por fuera» no espera más de lo de siempre, 20 min: es el plan B que quien escribe el día prefiere.)
        const check = openCheck(place, at, duration, ctx.hours, stop.si_cerrado === 'fuera' && source.minutos_fuera != null ? OPEN_WAIT_AUTHORED : null)
        // Una parada opcional nunca crea una espera ni sale cerrada: si no está abierta a su hora, no entra (su tiempo lo recoge la parada que se estira).
        if ((check.wait || check.closed) && original.tipo === 'opcional' && !place.sunset) {
          if (stop.traslado) carry = stop.traslado
          return
        }
        // El viajero manda (REGLAS_RUTAS 3): una entrada que reservó él con el sitio cerrado se queda tal cual, y sale un aviso con la hora de cierre.
        if (check.closed && stop.reserva_manda) {
          const closes = Math.max(0, ...parseHoursSessions(effectiveSchedule(place, ctx.hours)).map((session) => session.close))
          if (!ctx.probe) ctx.problems.push({ tipo: 'reserva_cerrada', lugar: stop.lugar, hora: toHHMM(at), cierre: closes > 0 ? toHHMM(closes) : null, dayNumber: ctx.day.dayNumber })
        } else if (check.wait) at += check.wait
        else if (check.closed) {
          const rule = stop.si_cerrado
          const reason = check.opensAt != null ? `Todavía no ha abierto (abre a las ${toHHMM(check.opensAt)})` : OUTSIDE_REASONS.ya_cerrado
          if (rule?.cambiar_por && !original.__swapped) {
            const swapped = { ...clone(rule.cambiar_por), __swapped: true }
            const other = sourceOf(swapped)
            if (other) {
              place = readyPlace(swapped, other, null, ctx.hours)
              stop = swapped
              duration = place.duration_minutes ?? 30
            }
          } else if (rule === 'quitar') {
            // (Cerrado a esa hora y sin sentido por fuera, un parque con verja de noche: no va, como si cerrase ese día.)
            if (stop.traslado) carry = stop.traslado
            return
          } else if (rule === 'camino') {
            place = readyPlace({ ...stop, modo: 'camino' }, source, null, ctx.hours)
            duration = place.duration_minutes
          } else if (hasFreeTour && ctx.tourPassed && tourCovers.has(stop.lugar) && (rule === 'fuera' || source.minutos_fuera != null)) {
            // (REGLAS_RUTAS 8: lo que el tour recorre no se repite por fuera, de día, ese mismo día, después del tour.)
            if (stop.traslado) carry = stop.traslado
            return
          } else if (rule === 'fuera' || source.minutos_fuera != null) {
            place = readyPlace(stop, source, reason, ctx.hours)
            duration = place.duration_minutes
            if (!rule) ctx.problems.push({ tipo: 'fuera_de_horario', lugar: stop.lugar, hora: toHHMM(at) })
          } else {
            ctx.problems.push({ tipo: 'fuera_de_horario', lugar: stop.lugar, hora: toHHMM(at) })
          }
        }
        if (arrivalTransit && !place.transitMinutes) place = { ...place, ...arrivalTransit }
      }
      // (Un lugar que va por la mañana y por la tarde, el parque de Villa Borghese en D4, no comparte id: cada uno con su título.)
      const unitId = `${ctx.id}:${stop.lugar}${slot === 'tarde' && ctx.morningNames?.has(stop.lugar) ? '~t' : ''}${units.some((unit) => unit.id === `${ctx.id}:${stop.lugar}`) ? `#${index}` : ''}`
      const level = source.level ?? 3
      const theme = selected.find((exp) => (source.tags ?? []).some((tag) => TAG_INTEREST_MAP[exp].includes(tag))) ?? null
      units.push({
        id: unitId,
        group: null,
        places: [place],
        slot,
        blockId: ctx.id,
        role: place.sunset != null ? 'atardecer' : place.passThrough ? 'de_paso' : inPool(source.name) ? 'pool' : 'parada',
        dropRank: 1,
        priority: level === 1 ? PRIORITY.ESSENTIAL : inPool(source.name) ? PRIORITY.POOL : PRIORITY.THEME,
        curatedIndex: (slot === 'manana' ? 0 : CURATED_AFTERNOON_OFFSET) + index,
        poolIndex: inPool(source.name) ? poolNames.indexOf(source.name) : null,
        ...(theme && level !== 1 ? { experienceTheme: theme } : {}),
        // El nombre con el que sale (`titulo`: «Via Margutta y Via del Babuino»), siempre.
        ...(stop.titulo ? { stretchTitle: stop.titulo, stretchWhy: stop.texto_titulo ?? null, stretchBase: -100000 } : {}),
        ...(original.elastica != null ? { elastic: original.elastica } : {}),
        // (Opcional en lo escrito: no cuenta como «plan» en las cifras de la pantalla de ritmo, paceStats.mjs.)
        ...(original.tipo === 'opcional' ? { optional: true } : {}),
        // `revisita`: si el viaje ya pasó por aquí otro día, sale como revisita con su texto ({dia}: el día en que se vio).
        ...(stop.revisita && seenDay.has(source.name) && seenDay.get(source.name) !== ctx.day.dayNumber ? { isRevisit: true, revisitReason: String(stop.revisita).replace('{dia}', `el día ${seenDay.get(source.name)}`) } : {}),
      })
      if (place.isFreeTour) ctx.tourPassed = true
      visits.push({ unitId, place, start: at, end: at + duration, chained: false, walkMinutes: leg, walkSource: 'matrix', ...(stop.entrada ? { ticket: true } : {}), ...(fixed != null ? { fixedAt: fixed, fixedMargin, horaTipo: stop.hora_tipo ?? 'reserva' } : {}), ...(stop.recorta_al_cierre ? { reservedEntry: true } : {}), ...(original.elastica != null ? { elasticMax: original.elastica } : {}), ...(late ? { __late: late } : {}) })
      t = at + duration
      coords = place.end_coordinates ?? place.coordinates
      if (!ctx.probe) {
        seen.add(source.name)
        if (!seenDay.has(source.name)) seenDay.set(source.name, ctx.day.dayNumber)
        if (!place.visitOutside && !place.passThrough) seenInside.add(source.name)
        for (const name of place.outsideOf ?? []) seen.add(name)
      }
    })
    if (visits.some((visit) => visit.__late)) {
      compressToFixedHours(visits, cursorStart, ctx)
      t = visits.at(-1).end
    }
    // Una parada elástica de antes de una hora fija (Borgo Pio antes de la entrada de los Museos) absorbe lo que falta hasta llegar a ella,
    // hasta su máximo (la elástica y el máximo del paseo del lugar).
    for (let k = 1; k < visits.length; k++) {
      const fixedVisit = visits[k]
      if (fixedVisit.fixedAt == null) continue
      let wait = fixedVisit.fixedAt - fixedVisit.fixedMargin - (visits[k - 1].end + (fixedVisit.walkMinutes ?? 0))
      if (wait <= 0) continue
      for (let j = k - 1; j >= 0 && wait > 0; j--) {
        const candidate = visits[j]
        if (candidate.elasticMax == null || candidate.place.visitOutside || candidate.place.passThrough) continue
        const cap = paseoMaxOf(placeByName.get(candidate.place.name))
        const grow = Math.min(wait, candidate.elasticMax, cap != null ? Math.max(0, cap - (candidate.end - candidate.start)) : Infinity)
        if (grow <= 0) continue
        candidate.end += grow
        for (let m = j + 1; m < k; m++) {
          visits[m].start += grow
          visits[m].end += grow
        }
        wait -= grow
      }
      t = visits.at(-1).end
    }
    return { visits, units, cursor: { t, coords } }
  }

  /**
   * Una hora fija (el turno de la Galería, la entrada del Coliseo o de los Vaticanos, el Free Tour, la recogida de una excursión, una
   * reserva con hora) no se mueve ni un minuto: si lo de antes, encadenado hacia delante, llega tarde, se recorta hacia atrás desde esa
   * hora (lo más cercano primero, sin bajar de lo mínimo de cada parada) y lo que va detrás se recoloca. Si no basta, se avisa como siempre.
   */
  function compressToFixedHours(visits, startT, ctx) {
    for (let k = 0; k < visits.length; k++) {
      const late = visits[k].__late
      if (!late) continue
      const over = late.arrival - late.needed
      if (over > 0) {
        const gained = shrinkBefore(visits, k, over, startT, ctx)
        if (gained > 0) {
          for (let m = k + 1; m < visits.length; m++) if (visits[m].__late) visits[m].__late.arrival -= gained
          late.arrival -= gained
        }
      }
    }
    for (const visit of visits) {
      const late = visit.__late
      if (!late) continue
      delete visit.__late
      if (late.arrival > late.needed + late.tol) {
        // (Con `dropLate`, lo que no cabe antes de la hora fija lo resuelve runList quitando paradas; si no, el aviso de siempre.)
        if (ctx.dropLate) ctx.lateLeft.push(late)
        else ctx.problems.push({ tipo: 'llega_tarde', lugar: late.lugar, llega: toHHMM(late.arrival), hora: toHHMM(late.fixed), ...(late.reserved ? { reservada: true, minutos: late.arrival - late.needed } : {}) })
      }
    }
  }

  /**
   * Una hora fija nunca se mueve ni se quita (INVARIANTES 466). Si lo de antes no cabe ni recortado, se quita lo de antes, en este orden:
   * primero las opcionales, luego los lugares menores (nivel 3, 2 y 1), y el más cercano a la hora fija primero. Lo que se quita sale en
   * «Quedó fuera» (la campana). Devuelve el índice de la lista a quitar, o -1.
   */
  function dropCandidate(list, beforeIndex) {
    const rank = (stop) => {
      const level = sourceOf(stop)?.level ?? 3
      // (Un atardecer es lo último que se quita: la hora fija de después manda sobre el sol, y no sale en «Quedó fuera».)
      // (Y una hora escrita que no es una reserva ni el tour, la Basílica a las 12:00 el Jueves Santo, solo se quita si no hay nada más: la reservada no se mueve.)
      return (hourOf(stop) != null ? 30 : 0) + (stop.modo === 'atardecer' ? 20 : 0) + (stop.tipo === 'opcional' ? 0 : 10) + (4 - level)
    }
    let best = -1
    for (let i = beforeIndex - 1; i >= 0; i--) {
      const stop = list[i]
      if ((hourOf(stop) != null && (stop.recorta_al_cierre || stop.lugar === tour?.name)) || stop.modo === 'camino' || !sourceOf(stop)) continue
      if (best < 0 || rank(stop) < rank(list[best])) best = i
    }
    return best
  }
  function runList(list, slot, cursor, ctx, elasticDelta = 0) {
    if (ctx.dropLate) return runListOnce(list, slot, cursor, ctx, elasticDelta)
    const snap = ctx.probe ? null : { seen: new Set(seen), seenInside: new Set(seenInside), seenDay: new Map(seenDay), problems: ctx.problems.length, notEnough: notEnoughTime.length }
    let current = list
    const dropped = []
    for (let guard = 0; guard < 10; guard++) {
      ctx.dropLate = true
      ctx.lateLeft = []
      let run
      try {
        run = runListOnce(current, slot, cursor, ctx, elasticDelta)
      } finally {
        ctx.dropLate = false
      }
      const left = ctx.lateLeft
      ctx.lateLeft = null
      // Un lugar que ya no se puede ver por dentro por llegar tarde (la Basílica a las 14:50 con cierre a las 15:00) y una opcional delante: la opcional se quita
      // antes que perder el lugar (INVARIANTES 466, «primero salen las opcionales»).
      let optionalAt = -1
      if (left.length === 0) {
        const late = run.visits.find((visit) => visit.place.visitOutside && ['ya_cerrado', 'no_abre'].includes(visit.place.outsideKind))
        const lateAt = late ? current.findIndex((stop) => stop.lugar === late.place.name && stop.modo !== 'fuera') : -1
        if (lateAt > 0) optionalAt = current.findLastIndex((stop, index) => index < lateAt && stop.tipo === 'opcional' && stop.modo !== 'camino' && hourOf(stop) == null)
      }
      if (left.length === 0 && optionalAt < 0) {
        if (dropped.length > 0 && !ctx.probe) for (const stop of dropped.filter((item) => item.tipo !== 'opcional' && item.modo !== 'atardecer')) notEnoughTime.push({ name: stop.lugar, reason: 'time', dayNumber: ctx.day.dayNumber })
        run.dropped = dropped
        run.list = current
        return run
      }
      const fixedAt = left.length > 0 ? current.findIndex((stop) => stop.lugar === left[0].lugar && hourOf(stop) != null) : -1
      const at = optionalAt >= 0 ? optionalAt : fixedAt >= 0 ? dropCandidate(current, fixedAt) : -1
      if (at < 0 || guard === 9) {
        // Nada más que quitar: el aviso de siempre.
        if (snap) {
          for (const name of [...seen]) if (!snap.seen.has(name)) seen.delete(name)
          for (const name of [...seenInside]) if (!snap.seenInside.has(name)) seenInside.delete(name)
          for (const name of [...seenDay.keys()]) if (!snap.seenDay.has(name)) seenDay.delete(name)
          ctx.problems.length = snap.problems
          notEnoughTime.length = snap.notEnough
        }
        const final = runListOnce(current, slot, cursor, ctx, elasticDelta)
        final.dropped = dropped
        final.list = current
        return final
      }
      dropped.push(current[at])
      current = current.filter((_, i) => i !== at)
      if (snap) {
        for (const name of [...seen]) if (!snap.seen.has(name)) seen.delete(name)
        for (const name of [...seenInside]) if (!snap.seenInside.has(name)) seenInside.delete(name)
        for (const name of [...seenDay.keys()]) if (!snap.seenDay.has(name)) seenDay.delete(name)
        ctx.problems.length = snap.problems
        notEnoughTime.length = snap.notEnough
      }
    }
    return runListOnce(current, slot, cursor, ctx, elasticDelta)
  }

  /**
   * Recorta hasta `over` min de las visitas anteriores a la k (con k = visits.length, la hora en que acaba todo) y recoloca las de detrás.
   * Devuelve los minutos que se ganan justo antes de la k (0 si no se pudo o si lo recolocado quedaría cerrado).
   */
  function shrinkBefore(visits, k, over, startT, ctx) {
    // Primero hasta el 75 % de lo escrito (lo normal); si aun así no llega a la hora fija, hasta la mitad (nunca menos de 15 min, 20 un barrio):
    // una hora fija pesa más que unos minutos de visita.
    const floorOf = (visit, deep) => {
      const duration = visit.end - visit.start
      if (!deep) return shrinkFloor({ lugar: visit.place.name }, duration)
      const barrio = (placeByName.get(visit.place.name)?.tags ?? []).includes('barrio')
      return Math.min(duration, Math.max(Math.ceil(duration * 0.5), barrio ? BARRIO_MIN : STOP_MIN))
    }
    const reducible = (visit, deep, already) => {
      const place = visit.place
      if (place.visitOutside || place.passThrough || place.sunset != null || place.nightView) return 0
      return Math.max(0, visit.end - visit.start - floorOf(visit, deep) - already)
    }
    const snapshot = visits.map((visit) => ({ start: visit.start, end: visit.end }))
    const cuts = new Map()
    let left = over
    for (const deep of [false, true]) {
      for (let i = k - 1; i >= 0 && left > 0; i--) {
        const cut = Math.min(reducible(visits[i], deep, cuts.get(i) ?? 0), left)
        if (cut > 0) {
          cuts.set(i, (cuts.get(i) ?? 0) + cut)
          left -= cut
        }
      }
    }
    if (cuts.size === 0) return 0
    const first = Math.min(...cuts.keys())
    for (let m = first; m < visits.length; m++) {
      const visit = visits[m]
      const duration = snapshot[m].end - snapshot[m].start - (cuts.get(m) ?? 0)
      if (m > first) {
        const oldPrevEnd = snapshot[m - 1].end
        const slack = snapshot[m].start - (oldPrevEnd + visit.walkMinutes)
        let base = visits[m - 1].end + visit.walkMinutes
        if (slack > 0) base = Math.max(base, snapshot[m].start)
        if (visit.fixedAt != null) base = Math.max(base, visit.fixedAt)
        visit.start = base
      }
      visit.end = visit.start + duration
    }
    // Lo recolocado tiene que seguir abierto a su hora; si no, se deja como estaba.
    const broken = visits.slice(first).some((visit) => !visit.place.visitOutside && !visit.place.passThrough && openCheck(visit.place, visit.start, visit.end - visit.start, ctx.hours).closed)
    if (broken) {
      visits.forEach((visit, i) => {
        visit.start = snapshot[i].start
        visit.end = snapshot[i].end
      })
      return 0
    }
    return k === 0 ? 0 : snapshot[k - 1].end - visits[k - 1].end
  }

  /** El día empieza a la hora de su primera parada fija, si la trae (el Coliseo a las 8:30). */
  function morningStartOf(draft) {
    const firstFixed = draft.manana[0] ? hourOf(draft.manana[0]) : null
    if (draft.manana_empieza) return toMin(draft.manana_empieza)
    if (firstFixed == null) return mode.dayStart
    return firstFixed - (draft.manana[0].llegar_antes ?? (draft.manana[0].turno || draft.manana[0].lugar === tour?.name || placeByName.get(draft.manana[0].lugar)?.turnos ? TICKET_MARGIN : 0))
  }
  /** La comida: el restaurante escrito o su alternativa (si cierra ese día o ya salió en el viaje), de cuándo a cuándo. */
  function lunchOf(draft, cursor, skeletonDay, hours) {
    const pick = (names) => recommendedRestaurant(destData, { names, meal: 'comida', near: cursor.coords, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: usedRestaurants })
    // (El escrito o su alternativa, si están a LUNCH_WALK_MAX min andando de la parada de antes; si no, el más cercano.)
    const writtenSpots = [draft.comida.restaurante, draft.comida.alternativa].filter(Boolean).map((name) => pick([name])).filter(Boolean)
    // (Con una entrada reservada justo después de comer, el restaurante escrito que está junto a la entrada, la pizza al corte de Bonci a dos
    // minutos de los Museos, gana al más cercano a la parada de antes, aunque haya que andar algo más: hasta LUNCH_WALK_MAX + 12.)
    const entranceStop = isReservedDraft(draft) ? firstRequiredOf(draft.tarde) : null
    const entranceSource = entranceStop && hourOf(entranceStop) != null ? sourceOf(entranceStop) : null
    const nextToEntrance = entranceSource ? writtenSpots.find((candidate) => walkLeg(candidate.coordinates, entranceSource.coordinates) <= 10 && walkLeg(cursor.coords, candidate.coordinates) <= LUNCH_WALK_MAX + 12) : null
    const spot = nextToEntrance ?? writtenSpots.find((candidate) => walkLeg(cursor.coords, candidate.coordinates) <= LUNCH_WALK_MAX) ?? pick(null) ?? writtenSpots[0] ?? null
    const walk = spot ? walkLeg(cursor.coords, spot.coordinates) : 5
    // (En un cuarto de hora exacto, como la cena: la app pinta las comidas redondeadas.)
    let start = Math.max(roundUp15(cursor.t + walk), isReservedDraft(draft) ? LUNCH_EARLIEST_RESERVED : LUNCH_EARLIEST)
    const written = draft.empieza ? toMin(draft.empieza) : null
    // (Lo primero de la tarde que no es opcional: una opcional delante, Santa Cecilia, se quita antes que mover la hora fija.)
    const firstAfternoon = firstRequiredOf(draft.tarde)
    const fixedFirst = firstAfternoon ? hourOf(firstAfternoon) : null
    // Comida tranquila (3-oct-2026): con una entrada reservada de la tarde, la comida se retrasa hasta las 14:30 o las 15:00 según la hora elegida, y lo que sobre antes de
    // la entrada es margen (hasta 60 min no cuenta como hueco). Con la entrada de las 17:00, a las 14:30; con la de las 17:45, a las 15:00. Nunca antes de lo que daba.
    if (isReservedDraft(draft) && fixedFirst != null && firstAfternoon.llegar_antes != null) {
      const calmStart = Math.min(15 * 60, roundUp15(fixedFirst - firstAfternoon.llegar_antes - LUNCH_DEFAULT - 60))
      if (calmStart > start) start = calmStart
    }
    // (Con una entrada reservada justo después de comer, la comida no acaba donde empieza la tarde escrita: se alarga, 60 min, hasta lo que deje la hora fija, INVARIANTES 460.)
    let end = written != null && !(isReservedDraft(draft) && fixedFirst != null) ? written : start + LUNCH_DEFAULT
    // (La comida dura como mucho 90 min, aunque lo escrito empiece la tarde más tarde: lo demás es tarde.)
    end = Math.min(end, start + LUNCH_MAX_COMPLETO)
    let short = null
    if (end - start < lunchMinOf(draft)) {
      short = end - start
      end = start + lunchMinOf(draft)
    }
    // Una hora fija como lo primero de la tarde (San Clemente a las 14:00) no se mueve: la comida acaba antes, hasta su mínimo.
    let lateBy = 0
    const firstSource = firstAfternoon ? sourceOf(firstAfternoon) : null
    if (fixedFirst != null && firstSource) {
      const slotted = Boolean(firstAfternoon.turno || firstSource.turnos || firstSource.isFreeTour)
      const legRaw = walkLeg(spot?.coordinates ?? cursor.coords, firstSource.coordinates)
      const leg = firstAfternoon.traslado?.min ? Math.min(legRaw, firstAfternoon.traslado.min) : legRaw
      const tolerance = entryTolerance(firstAfternoon)
      const over = end + leg - (fixedFirst - (firstAfternoon.llegar_antes ?? (slotted ? TICKET_MARGIN : 0)) + tolerance)
      if (over > 0) {
        end = Math.max(start + lunchMinOf(draft), end - over)
        lateBy = Math.max(0, end + leg - (fixedFirst - (firstAfternoon.llegar_antes ?? (slotted ? TICKET_MARGIN : 0)) + tolerance))
      }
    }
    return { spot, start, end, short, lateBy }
  }
  /** Lo que querría la elástica ese día con ese borrador, sin apuntar nada (null si la tarde no tiene elástica y mirador). */
  function elasticNeed(draft, skeletonDay, hours, half) {
    const elasticStop = draft.tarde.find((stop) => stop.elastica != null)
    const sunsetStop = draft.tarde.find((stop) => stop.modo === 'atardecer')
    if (!elasticStop || !sunsetStop || hours.sunset == null) return null
    const probe = { id: draft.id, day: skeletonDay, hours, problems: [], sunsetArrival: null, probe: true }
    let after
    if (half) after = { t: draft.empieza ? toMin(draft.empieza) : HALF_DAY_AFTERNOON, coords: null }
    else {
      const morning = runList(draft.manana, 'manana', { t: morningStartOf(draft), coords: null }, probe)
      if (!draft.comida) after = morning.cursor
      else {
        const lunch = lunchOf(draft, morning.cursor, skeletonDay, hours)
        after = { t: lunch.end, coords: lunch.spot?.coordinates ?? morning.cursor.coords }
      }
    }
    runList(draft.tarde, 'tarde', after, probe)
    if (probe.sunsetArrival == null) return null
    return { wanted: hours.sunset - (sunsetStop.lead ?? SUNSET_LEAD) - probe.sunsetArrival, max: elasticStop.elastica }
  }

  // ── Un día escrito: las filas del documento → paradas con su hora, comidas y nocturnas ───────────────────────
  const restaurantByName = new Map((destData.restaurants ?? []).map((restaurant) => [restaurant.name, restaurant]))
  const rowCoords = (row) => {
    if (row.tipo === 'comida' || row.tipo === 'cena') {
      const restaurant = restaurantByName.get(row.restaurante)
      return restaurant?.coordinates ? [restaurant.coordinates.lat, restaurant.coordinates.lng] : null
    }
    if (row.tipo === 'noche') return catalogueByName.get(row.noche)?.coordinates ?? null
    return placeByName.get(row.lugar)?.coordinates ?? null
  }
  const catalogueByName = new Map((destData.night_experiences ?? []).map((entry) => [entry.name, entry]))
  const rowWalk = (a, b) => walkLeg(rowCoords(a), rowCoords(b))
  const isPaid = (place) => (place?.ticket_info ?? []).some((line) => /de pago/i.test(line))
  const rowToStop = (row, traslado) => {
    const place = placeByName.get(row.lugar)
    const stop = { lugar: row.lugar, min: row.min, hora: row.hora, tipo: 'fija', hora_tipo: row.hora_tipo ?? 'orientativa', escrito: true }
    if (row.titulo) stop.titulo = row.titulo
    // (El texto del colchón: lo que hay dentro, de la tabla «Qué hay en cada colchón» del documento.)
    if (row.texto) stop.texto = row.texto
    if (row.turno) stop.turno = true
    // (El nombre con el que se pide su foto, si no es el del lugar: la terraza del Altar, el paseo por el Aventino… Hueco en _fotos.json.)
    if (row.foto) stop.foto = row.foto
    if (row.modo === 'dentro') {
      stop.modo = 'dentro'
      stop.entrada = isPaid(place)
      // (Cerrado a su hora: la regla de cierres — acortar, por fuera si desde la calle se ve algo, y si no, quitar. Una reserva del viajero se queda y avisa.)
      stop.si_cerrado = place?.minutos_fuera != null || place?.pass_by || place?.type === 'exterior' ? 'fuera' : 'quitar'
      if (row.hora_tipo === 'reserva') stop.reserva_manda = true
    } else if (row.modo === 'fuera') {
      stop.modo = 'fuera'
      stop.min_fuera = row.min
    } else if (row.modo === 'camino') stop.modo = 'camino'
    else if (row.modo === 'atardecer') stop.modo = 'atardecer'
    if (traslado) stop.traslado = traslado
    return stop
  }
  // Cuánto dura por dentro lo que el viajero marca en el pool y el día lleva por fuera o de camino.
  const MINUTOS_POR_DENTRO = { 'Panteón': 40, 'Altar de la Patria': 30, "Castillo de Sant'Angelo": 60, 'Basílica de San Pedro': 75, 'Coliseo': 75, 'Foro Romano y Palatino': 90, 'Museos Vaticanos y Capilla Sixtina': 150, 'Cúpula de San Pedro': 45 }
  const GUIA_LARGA = new Set(['Museos Vaticanos y Capilla Sixtina', 'Coliseo', 'Foro Romano y Palatino', 'Galería Borghese'])
  /** Lo marcado en el pool manda en 1 y 1,5 días: si para meterlo no cabe un imprescindible, el imprescindible se queda fuera. */
  const poolManda = shortNoTour
  const claveDeTabla = (draft) => (/manana/.test(String(draft.tablaVersion ?? '')) ? 'manana' : draft.version)
  const envDe = (skeletonDay) => {
    const hours = hoursOf(skeletonDay)
    return {
      walk: rowWalk,
      // (\`minutos\`: una joya vale con llegar 20 min antes del cierre, mejor por dentro aunque sea corto que por fuera.)
      abierta: (row, start, minutos = null) => {
        const place = placeByName.get(row.lugar)
        if (!place || row.modo !== 'dentro') return true
        return openCheck(place, start, minutos != null ? Math.min(row.min, minutos) : row.min, hours).ok === true
      },
    }
  }
  const nivelDe = (name) => placeByName.get(name)?.level ?? null
  // (Las filas de una tabla de pool no traen id: se les da uno por su tipo y su nombre —con número si se repite en el día—, para que el registro y las causas las encuentren.)
  const marcarFilas = (lista) => {
    const vistas = new Set()
    return lista.map((row) => {
      let id = row.id
      if (!id && row.tipo !== 'traslado') id = idDeFila(row)
      // (Un id es de una sola fila: si se repite en el día —dos tarjetas con el mismo título—, la segunda lleva «_2».)
      if (id && vistas.has(id)) {
        let n = 2
        while (vistas.has(`${id}_${n}`)) n++
        id = `${id}_${n}`
      }
      if (id) vistas.add(id)
      return { ...row, id, imprescindible: row.imprescindible ?? nivelDe(row.lugar) === 1, nivel: row.nivel ?? nivelDe(row.lugar) }
    })
  }

  /**
   * Primera parte de un día escrito: la tabla elegida, la hora que puso el viajero, el pool escrito, lo marcado en el pool que ya está en el día y las experiencias.
   * Deja las filas en \`draft.rowsPrep\` (las reglas de noche del viaje las tocan después) y el registro de cambios en \`draft.log\`.
   */
  const prepararEscrito = (draft, skeletonDay) => {
    const hours = hoursOf(skeletonDay)
    const env = envDe(skeletonDay)
    // Cada cambio de una fila respecto al documento lleva su causa real (draft.log): el test y la revisión leen de aquí.
    const log = (draft.log = [...(draft.cambiosIniciales ?? [])])
    let rows = marcarFilas(draft.rows)
    // Lo que el documento da por escrito para cada fila: la tabla del día y, donde un extra trae su propia tabla, esa (el registro cuenta los cambios contra ella).
    draft.docBase = new Map(rows.map((row) => [row.id, row]))
    const clave = claveDeTabla(draft)
    const orden = written.days[draft.id]?.orden_quitar ?? []
    const acciones = { walk: rowWalk, abierta: env.abierta, marcar: marcarFilas, clave, pool: poolManda, orden }
    // (Una tabla derivada —el miércoles por la mañana, el Free Tour de mañana— deja sus horas como horas preferidas: las horas de verdad las saca `componerDia`, una sola vez, al final.)
    // La hora que puso el viajero (una entrada reservada o el Free Tour) manda sobre la del ejemplo de la tabla: la fila se queda en esa hora y el
    // resto corre con los márgenes (30 min antes de una reserva, 15 antes de un turno o del tour).
    {
      const cambios = [
        ...Object.entries(entradas ?? {}).map(([lugar, hora]) => ({ lugar, hora, causa: `reserva de ${lugar} a las ${hora}`, tipo: 'reserva' })),
        ...(freeTourDespues?.hora && draft.id === 'D1' ? [{ lugar: tour?.name, hora: freeTourDespues.hora, causa: `Free Tour a las ${freeTourDespues.hora}`, tipo: 'tour' }] : []),
      ]
      for (const cambio of cambios) {
        const i = rows.findIndex((row) => row.lugar === cambio.lugar && (row.hora_tipo === 'reserva' || row.hora_tipo === 'turno' || row.turno || row.tipo === 'tour'))
        if (i < 0 || rows[i].hora === cambio.hora) continue
        const antes = rows
        const puestas = rows.map((row, k) => (k === i ? { ...row, hora: cambio.hora, ...(cambio.tipo === 'reserva' ? { hora_tipo: 'reserva' } : {}) } : row))
        // (Desde la fila de después de la fija anterior: lo de antes de esa no se toca.)
        // Si la fila nueva cabe donde está (la hora es más tarde que la del ejemplo), solo corre lo de después; si no, se vuelve a correr desde la fija anterior.
        let anterior = i - 1
        while (anterior > 0 && !esAncla(puestas[anterior])) anterior--
        const limite = filaMin(cambio.hora) - antesDeLlegar(puestas[i])
        const cabe = i === 0 || finDe(puestas[i - 1]) + hueco(puestas[i - 1], puestas[i], rowWalk) <= limite
        rows = correrHoras(puestas, { desde: cabe ? i + 1 : Math.max(1, anterior + 1), walk: rowWalk }).rows
        anotarCambios(antes, rows, cambio.causa, log)
      }
    }
    // El pool escrito (un extra por media jornada) y las experiencias elegidas.
    const franjasUsadas = new Set()
    const noIncluido = (name, reason) => {
      const place = placeByName.get(name)
      const weekly = reason === 'closed_on_day' && (place?.closed_on ?? []).some((day) => norm(day) === norm(hours.weekday))
      unplacedPool.push({ unitId: name, name, reason, dayNumber: skeletonDay.dayNumber, ...(reason === 'closed_on_day' ? { closed: { dateIso: realDateIso(skeletonDay), weekday: hours.weekday }, closedWeekly: weekly } : {}) })
    }
    const tablaDeVersion = (def) => (def.acciones ?? []).every((accion) => accion.op !== 'tabla' || Boolean(accion.tablas?.[clave]) || Object.keys(accion.tablas ?? {}).some((key) => key.length > 1 && key.includes(clave) && /^[A-D]+$/.test(key)))
    // Cierres que el documento escribe para un lugar del día (la Galería el lunes en el D4, el Castillo en el D6…): lo que pasa entonces, con su causa.
    for (const [lugar, cierre] of Object.entries(written.days[draft.id]?.cierres ?? {})) {
      // (`dia_semana`: no es un cierre del lugar sino lo que pasa ese día de la semana —el miércoles, audiencia del Papa—.)
      const aplica = cierre.dia_semana ? Boolean(hours.weekday) && norm(hours.weekday) === cierre.dia_semana : closedThatDay(lugar, skeletonDay)
      if (!aplica || !rows.some((row) => row.lugar === lugar)) continue
      // (Las horas del documento se conservan: solo se empuja lo que los márgenes no dejan llegar, y lo que la acción fija a mano manda.)
      const aplicadas = aplicarAcciones(rows, cierre.acciones, { walk: rowWalk, clave })
      const corrida = correrHoras(resolverTaxis(marcarFilas(aplicadas.rows), rowWalk), { desde: aplicadas.primera, walk: rowWalk, orden, soloEmpujar: true })
      anotarCambios(rows, corrida.rows, `${lugar} cierra ese día: ${cierre.causa ?? 'lo escrito en el documento'}`, log)
      rows = corrida.rows
      if (cierre.no_incluido) noIncluido(lugar, 'closed_on_day')
      draft.applied.push(`cierre:${lugar}`)
    }
    for (const { name, def } of draft.poolPedido ?? []) {
      if (def.pendiente) { noIncluido(name, 'pendiente'); continue }
      if (def.no_cabe) { noIncluido(name, 'no_room'); continue }
      // (En esa versión de la tarde el extra ya va como colchón: ya incluido. En otra que no tiene su tabla, no entra.)
      if (def.incluido_en?.includes(clave)) { draft.applied.push(`pool:${name}`); continue }
      if (def.solo_en && !def.solo_en.includes(clave)) { noIncluido(name, 'no_room_day'); continue }
      if (def.ya_si_dentro && rows.some((row) => row.lugar === def.ya_si_dentro && row.modo === 'dentro')) { draft.applied.push(`pool:${name}`); continue }
      const bloqueada = def.franja === 'dia' ? franjasUsadas.size > 0 : def.franja && (franjasUsadas.has(def.franja) || franjasUsadas.has('dia'))
      if (bloqueada) { noIncluido(name, 'no_room_day'); continue }
      if (closedThatDay(name, skeletonDay)) { noIncluido(name, 'closed_on_day'); continue }
      if (!tablaDeVersion(def)) { noIncluido(name, 'no_room_day'); continue }
      const hecho = aplicarExtra(rows, def, acciones)
      if (!hecho) { noIncluido(name, 'no_room_day'); continue }
      anotarCambios(rows, hecho.rows, `pool: ${name}`, log)
      // Con la tabla escrita de ese extra, las horas salen de los márgenes (el documento: «Pool y experiencias: cómo se calculan las horas»): lo que se mueve respecto a las horas de la tabla se apunta aparte.
      if (hecho.tabla) {
        anotarCambios(hecho.tabla, hecho.rows, `pool: ${name}: horas por los márgenes`, log)
        for (const fila of marcarFilas(hecho.tabla)) if (fila.id) draft.docBase.set(fila.id, fila)
      }
      rows = hecho.rows
      if (def.franja) franjasUsadas.add(def.franja)
      if (def.franja === 'dia') { franjasUsadas.add('manana'); franjasUsadas.add('tarde') }
      draft.applied.push(`pool:${name}`)
    }
    // Lo marcado en el pool que el día lleva por fuera o de camino pasa a ir por dentro (es la prioridad; en 1 y 1,5 días, si no cabe un imprescindible, se queda fuera).
    for (const name of draft.poolDentro ?? []) {
      const i = rows.findIndex((row) => row.lugar === name && row.tipo === 'parada' && row.modo !== 'dentro')
      if (i < 0) continue
      const min = Math.max(rows[i].min, MINUTOS_POR_DENTRO[name] ?? Math.min(placeByName.get(name)?.duration_minutes ?? 45, 60))
      const antes = rows
      const prueba = rows.map((row, k) => (k === i ? { ...row, modo: 'dentro', min, ...(GUIA_LARGA.has(name) ? { guia: true } : {}) } : row))
      const corrida = correrHoras(prueba, { desde: Math.max(1, i), walk: rowWalk, orden, protegidas: (row) => row.hora_tipo === 'reserva', quitarImprescindibles: poolManda })
      if (corrida.problemas.length > 0) { noIncluido(name, 'no_room_day'); continue }
      rows = corrida.rows
      anotarCambios(antes, rows, `pool: ${name}`, log)
      draft.applied.push(`pool:${name}`)
    }
    for (const exp of selected) {
      const def = written.days[draft.id]?.experiencias?.[exp]
      if (!def || def.pendiente || !vale(def, { ids: order, dateIso: hours.dateIso })) { if (def?.pendiente) draft.extrasNoIncluidos.push({ name: exp, pendiente: def.pendiente }); continue }
      if (def.solo_en && !def.solo_en.includes(clave)) continue
      if (def.sin_tablas?.includes(draft.tablaVersion)) continue
      // (`por_version`: lo que solo cambia en una versión de la tarde —A, B, C o D—.)
      const hecho = aplicarExtra(rows, def.por_version?.[clave] ? { ...def, acciones: [...(def.acciones ?? []), ...def.por_version[clave]] } : def, acciones)
      if (!hecho) { draft.extrasNoIncluidos.push({ name: exp, pendiente: 'no cabe' }); continue }
      anotarCambios(rows, hecho.rows, `experiencia: ${exp}`, log)
      rows = hecho.rows
      draft.applied.push(`experiencia:${exp}`)
    }
    if (draft.id === 'D0-medio' && /manana/.test(String(draft.tablaVersion))) {
      const salida = mediaJornada?.salida ?? '15:00'
      const recortadas = recortarSalida(rows, salida, { walk: rowWalk })
      anotarCambios(rows, recortadas, `salida a las ${salida}`, log)
      rows = recortadas
    }
    // (El atardecer, el turno de la Galería en verano y los huecos ya no se ajustan aquí: los hace `componerDia`, una sola vez, al final de todo.)
    // Una mesa cuyo restaurante todavía no ha abierto a esa hora (Poldo e Gianna a las 19:30, la cena escrita a las 19:20) se retrasa hasta que abre (hasta 30 min); si no, va su alternativa.
    {
      let lista = rows
      for (let i = 0; i < lista.length; i++) {
        const row = lista[i]
        if (row.tipo !== 'comida' && row.tipo !== 'cena') continue
        const meal = row.tipo === 'cena' ? 'cena' : 'comida'
        const start = filaMin(row.hora)
        const candidatas = [row.restaurante, row.alternativa, row.tercera].filter(Boolean)
        const abiertoA = (name, at) => recommendedRestaurant(destData, { names: [name], meal, near: null, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: null, at })?.name === name
        if (candidatas.some((name) => abiertoA(name, start))) continue
        let mejor = null
        for (const name of candidatas) for (let delta = 5; delta <= 30; delta += 5) if (abiertoA(name, start + delta)) { if (!mejor || delta < mejor.delta) mejor = { name, delta }; break }
        if (!mejor) continue
        const antes = lista
        lista = lista.map((r, k) => (k === i ? { ...r, hora: filaHHMM(start + mejor.delta) } : r))
        lista = correrHoras(lista, { desde: i + 1, walk: rowWalk }).rows
        anotarCambios(antes, lista, `${mejor.name} abre a las ${filaHHMM(start + mejor.delta)}: la ${meal} se retrasa ${mejor.delta} min`, log)
      }
      rows = lista
    }
    draft.rowsPrep = rows
    draft.hoursPrep = hours
  }

  // ── Las nocturnas que dependen de lo que ya ha salido en el viaje (tanda 2) ───────────────────────────────────────────────
  // Cada día escrito trae su nocturna en la tabla; estas reglas la cambian solo cuando el viaje lo pide:
  //   · 1,5 días, medio día de tarde: si Trevi no ha salido de noche en el día entero (la tarde D), la nocturna es Trevi (taxi desde la cena) en lugar de Piazza Navona.
  //   · D1, tarde D: en taxi desde Trastevere. Trevi si todavía no ha salido en el viaje; si ya salió, el Coliseo iluminado si no ha salido de noche; si no, Trastevere de noche.
  //   · D2: si la Plaza de España todavía no ha salido en el viaje (de día o de noche), la nocturna es la Plaza de España de noche, con su taxi, en lugar de Piazza Navona.
  //   · Se cena en Trastevere y esa tarde no se ha paseado Trastevere de noche: la nocturna es Trastevere de noche (30 min, sin taxi), salvo que falte un imprescindible.
  //   · 2,5 días: si el Coliseo iluminado ya salió de noche en el viaje, la nocturna del medio día es Piazza Navona de noche (taxi).
  const NOCHE_MIN = { 'Fontana de Trevi (noche)': 20, 'Plaza de España (noche)': 20, 'Coliseo (noche)': 20, 'Piazza Navona (noche)': 30, 'Trastevere de noche': 30, 'Panteón (noche)': 30, 'Foro Romano desde el Campidoglio (noche)': 30, "El Puente y el Castillo de Sant'Angelo (noche)": 30 }
  const lugarDeNoche = { 'Fontana de Trevi (noche)': 'Fontana de Trevi', 'Plaza de España (noche)': 'Plaza de España', 'Coliseo (noche)': 'Coliseo', 'Piazza Navona (noche)': 'Piazza Navona', 'Trastevere de noche': 'Trastevere', 'Panteón (noche)': 'Panteón', 'Foro Romano desde el Campidoglio (noche)': 'Foro Romano y Palatino', "El Puente y el Castillo de Sant'Angelo (noche)": "Puente Sant'Angelo" }
  /**
   * Regla 0bis (tanda 3): todo lo que tiene visita por dentro va por dentro UNA vez en el viaje; las otras veces, por fuera y más corto. Lo que solo tiene sentido por dentro (sin visita
   * por fuera) se queda; la reserva manda. Va en el orden del viaje: el primer día que lo lleva por dentro se lo queda.
   */
  const aplicarDentroUnaVez = () => {
    const vistos = new Map()
    for (const draft of drafts) {
      if (!draft.escrito || !draft.rowsPrep) continue
      const antes = draft.rowsPrep
      let cambiado = false
      const rows = antes.map((row) => {
        if (row.tipo !== 'parada' || row.modo !== 'dentro') return row
        if (!vistos.has(row.lugar)) { vistos.set(row.lugar, draft.id); return row }
        const place = placeByName.get(row.lugar)
        const sePuedeFuera = place?.minutos_fuera != null || place?.pass_by || place?.type === 'exterior'
        if (row.hora_tipo === 'reserva' || row.reserva_manda || row.otra_visita || !sePuedeFuera) return row
        cambiado = true
        return { ...row, modo: 'fuera', min: Math.min(row.min, place?.minutos_fuera ?? 15), guia: undefined, entrada: undefined }
      })
      if (!cambiado) continue
      anotarCambios(antes, rows, 'por dentro una sola vez en el viaje: ya va por dentro otro día', draft.log)
      draft.rowsPrep = rows
    }
  }
  /** Noche especial de la fecha (`destination_config.noche_especial`): Nochebuena, solo la Fontana de Trevi; Nochevieja, una sola. Devuelve las filas con las nocturnas que sobran quitadas. */
  const nocheEspecial = (rows, hours, log) => {
    const especial = destData.destination_config?.noche_especial?.[String(hours.dateIso ?? '').slice(5)] ?? null
    if (!especial) return rows
    const noches = rows.filter((row) => row.tipo === 'noche')
    const quedan = especial.noche ? noches.filter((row) => row.noche === especial.noche).slice(0, especial.maximo ?? 1) : noches.slice(0, especial.maximo ?? 1)
    const sobran = noches.filter((row) => !quedan.includes(row))
    if (sobran.length === 0) return rows
    // (Si el día no trae esa noche, la primera nocturna del día pasa a ser la de la fecha.)
    const nuevas = quedan.length === 0 && especial.noche ? rows.filter((row) => !sobran.slice(1).includes(row)).map((row) => (row === sobran[0] ? { ...row, noche: especial.noche, id: `noche_${especial.noche}` } : row)) : rows.filter((row) => !sobran.includes(row))
    anotarCambios(rows, nuevas, especial.noche ? `noche especial: ${especial.noche}` : 'noche especial: una sola', log)
    return nuevas
  }
  const aplicarNochesDelViaje = () => {
    const escritos = drafts.filter((draft) => draft.escrito && draft.rowsPrep)
    // (Primero la noche especial de cada fecha: así lo que sale ese día de noche cuenta como ya salido para el resto del viaje.)
    for (const draft of escritos) draft.rowsPrep = nocheEspecial(draft.rowsPrep, draft.hoursPrep ?? hoursOf(draft.day), draft.log)
    // Lo que ya sale en el viaje, de día (cualquier fila con ese lugar, también «de camino», y lo que enseña el tour) y de noche.
    const diaViaje = (name, salvo = null) => tourCovers.has(name) || escritos.some((draft) => draft !== salvo && draft.rowsPrep.some((row) => row.lugar === name)) || drafts.some((draft) => !draft.escrito && [...(draft.manana ?? []), ...(draft.tarde ?? [])].some((stop) => stop.lugar === name))
    const nocheViaje = (noche, salvo = null) => escritos.some((draft) => draft !== salvo && draft.rowsPrep.some((row) => row.tipo === 'noche' && row.noche === noche))
    const salido = (noche, salvo) => diaViaje(lugarDeNoche[noche], salvo) || nocheViaje(noche, salvo)
    const taxiMinMeters = destData.destination_config?.alcance?.taxi_desde_m ?? 1500
    const cambiarNoche = (draft, antesRow, nueva, causa) => {
      const rows = draft.rowsPrep
      const i = rows.indexOf(antesRow)
      if (i < 0 || antesRow.noche === nueva) return
      const cena = [...rows.slice(0, i)].reverse().find((row) => row.tipo === 'cena')
      const catalogo = catalogueByName.get(nueva)
      const lejos = cena && catalogo ? straightLineMeters(rowCoords(cena) ?? catalogo.coordinates, catalogo.coordinates) > taxiMinMeters : false
      let lista = rows.filter((row) => row !== antesRow)
      let at = i
      // (El taxi escrito de antes de la nocturna: si la nueva no queda lejos de la cena, sobra; si queda lejos y no hay, se pone.)
      const tieneTaxi = lista[i - 1]?.tipo === 'traslado'
      if (tieneTaxi && !lejos) { lista = lista.filter((_, k) => k !== i - 1); at = i - 1 }
      const nuevaFila = { id: `noche_${nueva.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`, tipo: 'noche', noche: nueva, hora: antesRow.hora, min: NOCHE_MIN[nueva] ?? 20, como_documento: '', texto_documento: nueva }
      const nuevos = !tieneTaxi && lejos ? [{ tipo: 'traslado', id: 'traslado_un_taxi', hora: antesRow.hora, min: 10, traslado: { como: 'un taxi', min: 'auto' } }, nuevaFila] : [nuevaFila]
      lista.splice(at, 0, ...nuevos)
      const corridas = correrHoras(resolverTaxis(lista, rowWalk), { desde: Math.max(1, at), walk: rowWalk }).rows
      anotarCambios(rows, corridas, causa, draft.log)
      draft.rowsPrep = corridas
      draft.applied.push(`noche:${nueva}`)
    }
    const trastevereIluminado = (rows) => rows.some((row) => row.lugar === 'Trastevere' && /iluminado/.test(row.titulo ?? ''))
    // Las nocturnas se reparten día a día, empezando por el primero del viaje (Tanda 4). «Ya salió» es: salió DE NOCHE en un día anterior (o antes ese mismo día); un sitio visto de día no quita su nocturna.
    // Antes que ninguna otra va la primera nocturna imprescindible (destination_config.noches_imprescindibles) que aún no ha salido; luego la que escribe el día; luego, si se cena en Trastevere,
    // Trastevere de noche; y si esa ya salió, la que prefiera el día (`noche_si_repetida`) o la que quede más cerca de la cena. Sin ninguna libre, el día se queda sin nocturna.
    const imprescindibles = destData.destination_config?.noches_imprescindibles?.lista ?? []
    const NOCHES_POSIBLES = ['Fontana de Trevi (noche)', 'Plaza de España (noche)', 'Coliseo (noche)', 'Piazza Navona (noche)', 'Panteón (noche)', 'Trastevere de noche', 'Foro Romano desde el Campidoglio (noche)', "El Puente y el Castillo de Sant'Angelo (noche)"]
    // (`usadas`: lo que ya salió de noche en los días anteriores, DESPUÉS de componer cada día: una nocturna que la hora límite de la noche quita no cuenta como salida.)
    const usadas = new Set()
    const asignarDia = (draft) => {
      const provisional = new Set()
      const mmdd = String((draft.hoursPrep ?? hoursOf(draft.day)).dateIso ?? '').slice(5)
      const fija = destData.destination_config?.noche_especial?.[mmdd]?.noche ?? null
      const huecos = draft.rowsPrep.filter((row) => row.tipo === 'noche').length
      for (let k = 0; k < huecos; k++) {
        const row = draft.rowsPrep.filter((item) => item.tipo === 'noche')[k]
        if (!row) break
        // (Nochebuena: solo Trevi, y esa noche puede repetir.)
        if (fija && row.noche === fija) { provisional.add(row.noche); continue }
        const rows = draft.rowsPrep
        const cena = rows.find((item) => item.tipo === 'cena')
        // (Las que ese día ya ha repartido, no las que la tabla escribe en las otras nocturnas: esas se reparten a su vez.)
        const delDia = provisional
        const sitios = new Set(rows.filter((item) => item.lugar).map((item) => item.lugar))
        const vale = (name) => {
          const entrada = catalogueByName.get(name)
          if (!entrada || usadas.has(name) || provisional.has(name) || delDia.has(name)) return false
          return entrada.allow_same_day === true || !(entrada.conflicts_with ?? []).some((lugar) => sitios.has(lugar))
        }
        const distancia = (name) => (cena && catalogueByName.get(name)?.coordinates ? straightLineMeters(rowCoords(cena) ?? catalogueByName.get(name).coordinates, catalogueByName.get(name).coordinates) : 0)
        const enTrastevere = cena && String(restaurantByName.get(cena.restaurante)?.zone ?? '').includes('Trastevere')
        let elegida = imprescindibles.find(vale) ?? null
        let causa = elegida ? `${elegida} es la primera nocturna imprescindible que aún no ha salido de noche en el viaje` : null
        if (!elegida && vale(row.noche)) { elegida = row.noche; causa = null }
        if (!elegida && enTrastevere && !trastevereIluminado(rows) && vale('Trastevere de noche')) { elegida = 'Trastevere de noche'; causa = 'se cena en Trastevere y esa tarde no se ha paseado Trastevere de noche: la nocturna es Trastevere de noche' }
        if (!elegida) {
          const preferida = (written.days[draft.id]?.noche_si_repetida ?? []).find(vale)
          elegida = preferida ?? [...NOCHES_POSIBLES.filter(vale)].sort((x, y) => Number(diaViaje(lugarDeNoche[x] ?? '', draft)) - Number(diaViaje(lugarDeNoche[y] ?? '', draft)) || distancia(x) - distancia(y))[0] ?? null
          causa = elegida ? `${row.noche} ya salió de noche en el viaje: la nocturna pasa a ${elegida}` : null
        }
        if (elegida) {
          if (elegida !== row.noche) cambiarNoche(draft, row, elegida, causa)
          provisional.add(elegida)
        } else {
          const i = rows.indexOf(row)
          const lista = rows.filter((item, j) => item !== row && !(j === i - 1 && item.tipo === 'traslado'))
          anotarCambios(rows, lista, `${row.noche} ya salió de noche en el viaje y no queda otra nocturna: sin nocturna`, draft.log)
          draft.rowsPrep = lista
          k--
          // (Al quitar una, la siguiente ocupa su sitio en la lista.)
          if (draft.rowsPrep.filter((item) => item.tipo === 'noche').length <= k + 1) break
        }
      }
      // Medio día de tarde de 1,5 días: si la Plaza de España aún no ha salido de noche, la noche acaba con Trevi y después la Plaza de España (10 min andando).
      if (draft.id === 'D0-medio' && String(draft.tablaVersion).startsWith('tarde') && !usadas.has('Plaza de España (noche)') && !provisional.has('Plaza de España (noche)')) {
        const trevi = draft.rowsPrep.find((row) => row.tipo === 'noche' && row.noche === 'Fontana de Trevi (noche)')
        if (trevi) {
          const rows = draft.rowsPrep
          const i = rows.indexOf(trevi)
          const nueva = { id: 'noche_plaza_de_espana_noche', tipo: 'noche', noche: 'Plaza de España (noche)', hora: filaHHMM(filaMin(trevi.hora) + trevi.min + 10), min: NOCHE_MIN['Plaza de España (noche)'], como_documento: '', texto_documento: 'Plaza de España (noche)' }
          const lista = [...rows.slice(0, i + 1), nueva, ...rows.slice(i + 1)]
          anotarCambios(rows, lista, 'la Plaza de España no ha salido de noche en el viaje: la noche del medio día de tarde acaba con Trevi y la Plaza de España (10 min andando)', draft.log)
          draft.rowsPrep = lista
          draft.applied.push('noche:Plaza de España (noche)')
        }
      }
    }
    return { asignarDia, registrar: (draft) => { for (const row of draft.rowsPrep) if (row.tipo === 'noche') usadas.add(row.noche) } }
  }

  // ── Las horas, una sola vez, al final (Tanda 4) ───────────────────────────────────────────────────────────────────────────
  const colchonesDeZona = (written.destino?.colchones?.lista ?? []).map((c) => ({ ...c, coords: placeByName.get(c.lugar)?.coordinates ?? null })).filter((c) => c.coords)
  const normaId = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  /** El colchón de la zona más cercana al sitio (a menos de 1,8 km), o null. */
  const colchonCercano = (row) => {
    const coords = rowCoords(row)
    if (!coords) return null
    const mejor = colchonesDeZona.map((c) => ({ c, d: straightLineMeters(coords, c.coords) })).sort((a, b) => a.d - b.d)[0]
    return mejor && mejor.d <= 1800 ? { lugar: mejor.c.lugar, titulo: mejor.c.titulo, texto: mejor.c.texto, nivel: 3, imprescindible: false } : null
  }
  /** Una fila de «Llegada a {sitio}» para una reserva o un turno, con su motivo (los datos de `llegadas` del destino). */
  const llegadaDe = (row) => {
    const cfg = written.destino?.llegadas
    if (!cfg || row.tipo === 'tour' || !placeByName.has(row.lugar)) return null
    const base = row.hora_tipo === 'reserva' ? cfg.reserva : cfg.turno
    if (!base) return null
    return { min: base.min, titulo: `Llegada a ${row.lugar}`, texto: cfg.por_lugar?.[row.lugar] ?? base.texto }
  }
  /**
   * La hora de cada fila del día se calcula aquí, una sola vez (componerDia.js), desde la lista que dejaron todos los ajustes. El registro cuenta los cambios respecto al documento con
   * esa hora final: una entrada por fila, con todas las causas que la tocaron.
   */
  /**
   * «De camino» (Tanda 4): pasas por delante sin pararte, 5 min como mucho.
   *   1. Una calle que se recorre en 10 o 15 min no es de camino: es un paseo («Paseo por Via Veneto»).
   *   2. Un sitio de nivel 1 o 2 no va de camino la primera vez que sale en el viaje (salvo que el Free Tour ya pase por él): va como parada.
   *   3. Un sitio que no se ve desde la calle cuando está cerrado (`visible_desde_calle: false`, como el Tempietto) y está cerrado a esa hora, sale con su alternativa (`camino_alternativa`).
   */
  const reglasDeCamino = (rows, hours, log) => {
    return rows.map((row) => {
      let fila = row
      const place = placeByName.get(row.lugar)
      if (row.modo === 'camino' && row.tipo === 'parada' && !row.llegada && place) {
        if (row.min > 5) {
          fila = { ...row, tipo: 'paseo', modo: null, titulo: `Paseo por ${place.name}`, min: row.min }
          log.push({ id: row.id, lugar: fila.titulo, sitio: row.lugar, que: 'modo+titulo', causa: `${row.min} min andando: una calle de más de 5 min no es «de camino», es un paseo` })
        } else if ((place.level ?? 3) <= 2 && !caminoVistos.has(row.lugar) && !tourCovers.has(row.lugar)) {
          fila = { ...row, modo: 'fuera', min: place.minutos_fuera ?? 10, min_fuera: place.minutos_fuera ?? 10 }
          log.push({ id: row.id, lugar: row.titulo ?? row.lugar, sitio: row.lugar, que: 'modo+min', causa: `primera vez que sale ${row.lugar} en el viaje (nivel ${place.level}): va como parada, no de camino` })
        }
      }
      if (place && place.visible_desde_calle === false && place.camino_alternativa && (fila.modo === 'camino' || fila.modo === 'fuera') && openCheck(place, filaMin(fila.hora), 5, hours).ok !== true) {
        fila = { ...fila, titulo: place.camino_alternativa }
        log.push({ id: row.id, lugar: fila.titulo, sitio: row.lugar, que: 'titulo', causa: `${place.name} no se ve desde la calle cuando está cerrado: la parada es ${place.camino_alternativa}` })
      }
      if (fila.lugar && fila.tipo !== 'traslado' && fila.modo !== 'camino') caminoVistos.add(fila.lugar)
      return fila
    })
  }
  const componerEscrito = (draft, skeletonDay) => {
    const hours = draft.hoursPrep ?? hoursOf(skeletonDay)
    const env0 = envDe(skeletonDay)
    const stageLog = draft.log
    let rows = reglasDeCamino(draft.rowsPrep, hours, stageLog)
    // Cierres (regla de cierres): lo que por dentro cae cerrado a su hora se mueve antes en el día, hasta donde está abierto (una joya, el Panteón, mejor por dentro aunque sea corto).
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row.modo !== 'dentro' || row.hora_tipo === 'reserva' || row.hora_tipo === 'turno' || env0.abierta(row, filaMin(row.hora))) continue
      const moved = adelantar(rows, i, { ...env0, joya: placeByName.get(row.lugar)?.tier === 'joya' })
      if (moved) {
        anotarCambios(rows, moved, `cierre de ${row.lugar}`, stageLog)
        rows = moved
        draft.applied.push(`adelantar:${row.lugar}`)
        continue
      }
      // (Si no se puede adelantar y abre enseguida —San Clemente el 1 de enero abre a las 12:00—, la visita empieza cuando abre: la hora que ve el viajero sale de aquí, no de otro cálculo.)
      const place = placeByName.get(row.lugar)
      const espera = place ? openCheck(place, filaMin(row.hora), row.min, hours) : null
      if (espera?.wait > 0) {
        const hora = filaHHMM(filaMin(row.hora) + espera.wait)
        stageLog.push({ id: row.id, lugar: row.titulo ?? row.lugar, sitio: row.lugar, que: 'hora', causa: `cierre de ${row.lugar}: abre a las ${hora}` })
        rows = rows.map((other, k) => (k === i ? { ...other, hora } : other))
      }
    }
    // Una fila con hora fija (reserva, turno) que a esa hora está cerrada se quita —el día no se reordena para abrirla— y el tiempo que deja lo llena componerDia con nombre.
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i]
      if (row.modo !== 'dentro' || !(row.hora_tipo === 'reserva' || row.hora_tipo === 'turno') || env0.abierta(row, filaMin(row.hora))) continue
      stageLog.push({ id: row.id, lugar: row.titulo ?? row.lugar, sitio: row.lugar ?? null, que: 'quitada', causa: `cierre de ${row.lugar}: a las ${row.hora} está cerrado` })
      const weekly = (placeByName.get(row.lugar)?.closed_on ?? []).some((day) => norm(day) === norm(hours.weekday))
      unplacedPool.push({ unitId: row.lugar, name: row.lugar, reason: 'closed_on_day', dayNumber: skeletonDay.dayNumber, closed: { dateIso: realDateIso(skeletonDay), weekday: hours.weekday }, closedWeekly: weekly })
      rows = rows.filter((other, k) => k !== i && !(k === i - 1 && other.tipo === 'traslado'))
      i = Math.min(i, rows.length)
    }
    rows = nocheEspecial(rows, hours, stageLog)
    const inicial = marcarFilas(draft.rows)
    const componer = (filas) => componerDia(filas, {
      walk: rowWalk,
      sunset: hours.sunset,
      lead: SUNSET_LEAD,
      cenaDesde: dinnerHoursOf(draft).desde,
      mesaDesde: (row) => draft.mesaDesde?.get(row.id) ?? null,
      abierta: env0.abierta,
      colchonZona: colchonCercano,
      llegada: llegadaDe,
      orden: written.days[draft.id]?.orden_quitar ?? [],
      nocheValida: (row) => nocheValida(destData, hours.dateIso ?? null, hours.sunset ?? null, filaMin(row.hora), row.min),
      turnoMovible: (row) => row.lugar === 'Galería Borghese' && row.modo === 'dentro' && (row.hora_tipo === 'reserva' || row.turno) && entradas?.['Galería Borghese'] == null,
    })
    let resultado = componer(rows)
    // Un extra del pool (o lo que sea) que no cabe sin que la comida se vaya tarde (los restaurantes cierran sobre las 15:00): se acorta lo de antes de la comida por este orden y se vuelve a calcular,
    // sin cambiar nunca el orden para comer antes (haría zigzag): 1) el colchón hasta su mínimo; 2) la visita por dentro hasta su mínimo (min_max del sitio); 3) lo de nivel más bajo pasa a «de camino»;
    // 4) solo después se quita por la pirámide, de abajo arriba (nunca un imprescindible).
    {
      const limite = destData.destination_config?.comida_limite ? filaMin(destData.destination_config.comida_limite) : null
      let actual = rows
      for (let vuelta = 0; limite != null && vuelta < 40; vuelta++) {
        const comida = resultado.rows.find((row) => row.tipo === 'comida')
        if (!comida || filaMin(comida.hora) <= limite) break
        const iComida = actual.findIndex((row) => row.id === comida.id)
        if (iComida < 0) break
        const libre = (row, i) => i < iComida && row.tipo !== 'traslado' && !row.llegada && !esFija(row) && row.hora_tipo !== 'reserva' && row.hora_tipo !== 'turno' && row.tipo !== 'tour'
        const nivel = (row) => (row.tipo === 'paseo' || row.tipo === 'desayuno' ? 3 : placeByName.get(row.lugar)?.level ?? 3)
        const lugares = actual.map((row, i) => ({ row, i })).filter(({ row, i }) => libre(row, i))
        let cambio = null
        const colchon = [...lugares].reverse().find(({ row }) => row.colchon && row.min > Math.min(row.min, 30))
        const minimoPorDentro = (row) => placeByName.get(row.lugar)?.minimo_dentro ?? Math.max(30, Math.ceil(row.min * 0.75))
        // (Solo la visita por dentro marcada en el pool, que es lo que hizo que no cupiera: nada más se acorta por dentro.)
        const porDentro = [...lugares].sort((x, y) => Number(poolNames.includes(y.row.lugar)) - Number(poolNames.includes(x.row.lugar)) || y.i - x.i).find(({ row }) => row.modo === 'dentro' && poolNames.includes(row.lugar) && row.min > minimoPorDentro(row))
        const aCamino = [...lugares].sort((x, y) => nivel(y.row) - nivel(x.row) || y.i - x.i).find(({ row }) => row.tipo === 'parada' && !row.colchon && nivel(row) >= 3 && row.modo !== 'camino' && row.modo !== 'dentro')
        const quitable = [...lugares].sort((x, y) => nivel(y.row) - nivel(x.row) || y.i - x.i).find(({ row }) => nivel(row) >= 2 && !row.imprescindible && !poolNames.includes(row.lugar))
        if (colchon) cambio = { i: colchon.i, fila: { ...colchon.row, min: Math.min(colchon.row.min, 30) }, causa: 'la comida iba a caer tarde: el colchón baja a su mínimo' }
        else if (porDentro) cambio = { i: porDentro.i, fila: { ...porDentro.row, min: minimoPorDentro(porDentro.row) }, causa: `la comida iba a caer a las ${comida.hora}: la visita por dentro baja a su mínimo (${minimoPorDentro(porDentro.row)} min)` }
        else if (aCamino) cambio = { i: aCamino.i, fila: { ...aCamino.row, modo: 'camino', min: 5 }, causa: `la comida iba a caer a las ${comida.hora}: lo de nivel más bajo pasa a «de camino»` }
        else if (quitable) cambio = { i: quitable.i, quitar: true, causa: `la comida iba a caer a las ${comida.hora}: se quita lo de nivel más bajo (pirámide)` }
        if (!cambio) break
        const antesFila = actual[cambio.i]
        if (cambio.quitar) {
          stageLog.push({ id: antesFila.id, lugar: antesFila.titulo ?? antesFila.lugar, sitio: antesFila.lugar ?? null, que: 'quitada', causa: cambio.causa })
          actual = actual.filter((_, k) => k !== cambio.i)
        } else {
          stageLog.push({ id: antesFila.id, lugar: antesFila.titulo ?? antesFila.lugar, sitio: antesFila.lugar ?? null, que: cambio.fila.modo !== antesFila.modo ? 'modo+min' : 'min', causa: cambio.causa })
          actual = actual.map((row, k) => (k === cambio.i ? cambio.fila : row))
        }
        resultado = componer(actual)
      }
    }
    // Los colchones no nombran paradas que el mismo día tienen su tarjeta (el texto va por tabla y el día es el que manda).
    const nombresDelDia = resultado.rows.filter((row) => row.tipo === 'parada' && row.lugar && !row.llegada).map((row) => placeByName.get(row.lugar)?.name).filter(Boolean)
    const sanear = (row) => {
      if (!row.colchon || !row.texto) return row
      const otros = nombresDelDia.filter((nombre) => nombre !== row.lugar)
      const claves = otros.map((nombre) => normaId(nombre).replace(/_/g, ' '))
      const trozos = String(row.texto).split(/(?<=[;.])\s+/)
      const buenos = trozos.filter((trozo) => !claves.some((clave) => clave.length > 3 && normaId(trozo).replace(/_/g, ' ').includes(clave)))
      return buenos.length === trozos.length ? row : { ...row, texto: buenos.join(' ') || null, texto_saneado: true }
    }
    const finales = resultado.rows.map(sanear)
    // El registro: una entrada por fila con todo lo que cambió respecto al documento, con la hora final.
    const noCambios = stageLog.filter((entry) => ['nueva', 'quitada', 'aviso', 'restaurante'].includes(entry.que))
    const causasDe = new Map()
    for (const entry of stageLog) {
      if (['nueva', 'quitada', 'aviso', 'restaurante'].includes(entry.que) || !entry.causa) continue
      const lista = causasDe.get(entry.id) ?? []
      if (!lista.includes(entry.causa)) lista.push(entry.causa)
      causasDe.set(entry.id, lista)
    }
    const nuevoLog = noCambios.filter((entry) => !(entry.que === 'quitada' && finales.some((row) => row.id === entry.id)))
    const idsFinales = new Set(finales.map((row) => row.id))
    for (const entry of nuevoLog) if (entry.que === 'nueva' && !idsFinales.has(entry.id)) entry.que = 'nueva_quitada'
    const nombre = (row) => row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? row.id
    for (const row of finales) {
      const previa = draft.docBase?.get(row.id) ?? inicial.find((x) => x.id === row.id)
      const causas = [...(causasDe.get(row.id) ?? []), ...(resultado.causas.get(row.id) ?? [])]
      if (!previa) {
        if (resultado.nuevas.includes(row.id)) nuevoLog.push({ id: row.id, lugar: nombre(row), sitio: row.lugar ?? null, que: 'nueva', causa: causas.join(' + ') || 'fila nueva' })
        continue
      }
      const dif = []
      if (previa.hora !== row.hora) dif.push('hora')
      if (previa.min !== row.min) dif.push('min')
      if ((previa.modo ?? null) !== (row.modo ?? null)) dif.push('modo')
      if ((previa.titulo ?? null) !== (row.titulo ?? null)) dif.push('titulo')
      if (dif.length) nuevoLog.push({ id: row.id, lugar: nombre(row), sitio: row.lugar ?? null, que: dif.join('+'), causa: causas.join(' + ') || 'las horas se recalculan al final con los márgenes', de: { hora: previa.hora, min: previa.min, modo: previa.modo ?? null }, a: { hora: row.hora, min: row.min, modo: row.modo ?? null } })
    }
    for (const row of resultado.quitadas) nuevoLog.push({ id: row.id, lugar: nombre(row), sitio: row.lugar ?? null, que: 'quitada', causa: row.causa })
    for (const aviso of resultado.avisos) nuevoLog.push({ id: null, lugar: null, sitio: null, que: 'aviso', causa: aviso })
    for (const row of finales) {
      if (row.colchon && row.min > 120) nuevoLog.push({ id: row.id, lugar: nombre(row), sitio: row.lugar ?? null, que: 'aviso', causa: `colchón de ${row.min} min (más de 2 horas)` })
      if (row.tipo === 'cena' && filaMin(row.hora) > 22 * 60) nuevoLog.push({ id: row.id, lugar: row.restaurante, sitio: null, que: 'aviso', causa: `la cena pasa de las 22:00 (${row.hora})` })
    }
    draft.log = nuevoLog
    draft.rowsPrep = finales
    draft.problemasComponer = resultado.problemas
  }

  // Lo que ya se ha comido y cenado en el viaje (los días se planifican en orden): restaurantes usados, el barrio de la cena del día anterior y el de la comida de hoy.
  const mesas = { usados: new Set(), cenaAnterior: null, cenaDeHoy: null, comidaHoy: null }
  // Lo que ya ha salido en el viaje como parada (no de camino): la primera vez que sale un sitio de nivel 1 o 2 va como parada, no de camino.
  const caminoVistos = new Set()
  const planEscritoDay = (draft, skeletonDay) => {
    const hours = hoursOf(skeletonDay)
    const ctx = { id: draft.id, day: skeletonDay, hours, escrito: true, reserved: false, problems: [], sunsetArrival: null, morningNames: new Set() }
    const env = envDe(skeletonDay)
    const rows = draft.rowsPrep
    const log = draft.log
    draft.rowsFinal = rows
    const stops = []
    let carry = null
    for (const row of rows) {
      if (row.tipo === 'traslado') { carry = { como: row.traslado.como, min: row.traslado.min }; continue }
      if (row.tipo === 'comida' || row.tipo === 'cena' || row.tipo === 'noche') continue
      stops.push(rowToStop(row, carry))
      carry = null
    }
    const run = runListOnce(stops, 'tarde', { t: filaMin(rows[0].hora), coords: null }, ctx)
    // Lo que la regla de cierres cambia al construir las paradas (acortar, por fuera, quitar): con su causa.
    {
      const used = new Set()
      for (const row of rows) {
        if (row.tipo !== 'parada' && row.tipo !== 'paseo' && row.tipo !== 'desayuno' && row.tipo !== 'tour') continue
        const visit = run.visits.find((item, k) => !used.has(k) && item.place.name === row.lugar)
        const nombre = row.titulo ?? row.lugar
        if (!visit) { log.push({ id: row.id, lugar: nombre, sitio: row.lugar ?? null, que: 'quitada', causa: `cierre de ${row.lugar}` }); continue }
        used.add(run.visits.indexOf(visit))
        const dif = []
        if (visit.start !== filaMin(row.hora)) dif.push('hora')
        if (visit.end - visit.start !== row.min) dif.push('min')
        if (row.modo === 'dentro' && visit.place.visitOutside) dif.push('modo')
        if (dif.length) log.push({ id: row.id, lugar: nombre, sitio: row.lugar ?? null, que: dif.join('+'), causa: `cierre de ${row.lugar}` })
      }
    }
    mesas.comidaHoy = null
    mesas.cenaDeHoy = null
    // Comidas y cenas: el escrito; si cierra ese día o a esa hora, su alternativa; si cierran los dos, la tercera (cuando la hay); si no hay ninguna abierta, otro de la
    // misma zona abierto a esa hora (de los datos), apuntado en el registro.
    const meals = []
    let dinnerRestaurant = null
    const mmdd = String(hours.dateIso ?? '').slice(5)
    // (Las fechas en que todas las mesas llevan «Con reserva» van en destination_config.fechas_con_reserva: un solo sitio, no repartidas por las tablas.)
    const reservaCfg = destData.destination_config?.fechas_con_reserva ?? {}
    const NAVIDAD = reservaCfg.fechas ?? []
    for (const row of rows) {
      if (row.tipo !== 'comida' && row.tipo !== 'cena') continue
      const meal = row.tipo === 'cena' ? 'cena' : 'comida'
      const start = filaMin(row.hora)
      const pick = (name) => (name ? recommendedRestaurant(destData, { names: [name], meal, near: null, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: null, at: start }) : null)
      let chosen = null
      let motivo = null
      const candidatas = [row.restaurante, row.alternativa, row.tercera].filter(Boolean)
      // Un restaurante no se repite en el viaje (los días van en orden y el primero se queda el suyo) y, si hay otra opción, no se cena dos días seguidos en el mismo barrio
      // ni se come y se cena en el mismo barrio el mismo día. La cadena: lo escrito, su alternativa, la tercera, otro de la misma zona y otro a menos de 1 km en otro barrio, abierto y sin usar.
      const barrioDe = (name) => mainZoneOf(restaurantByName.get(name)?.zone ?? '')
      const cenando = row.tipo === 'cena'
      const barrioOk = (name) => !cenando || (barrioDe(name) !== mesas.cenaAnterior?.barrio && barrioDe(name) !== mesas.comidaHoy)
      const abierto = (name) => pick(name)?.name === name
      const sinUsar = (name) => !mesas.usados.has(name)
      const coordsDe = (name) => {
        const c = restaurantByName.get(name)?.coordinates
        return Array.isArray(c) ? c : c ? [c.lat, c.lng] : null
      }
      const escritoCoords = coordsDe(row.restaurante)
      const distanciaA = (name) => (escritoCoords && coordsDe(name) ? straightLineMeters(escritoCoords, coordsDe(name)) : Infinity)
      // (Los otros restaurantes abiertos solo se miran si lo escrito no sirve: es lo caro.)
      let otrosCache = null
      const otros = () => (otrosCache ??= (destData.restaurants ?? []).map((restaurant) => restaurant.name).filter((name) => !candidatas.includes(name) && abierto(name)))
      const mismaZona = (name) => barrioDe(name) === barrioDe(row.restaurante)
      const orden = (lista) => [...lista].sort((x, y) => distanciaA(x) - distanciaA(y) || x.localeCompare(y, 'es'))
      const etapas = [
        () => candidatas.filter((name) => abierto(name) && sinUsar(name) && barrioOk(name)),
        () => orden(otros().filter((name) => sinUsar(name) && barrioOk(name) && mismaZona(name))),
        () => orden(otros().filter((name) => sinUsar(name) && barrioOk(name) && distanciaA(name) <= 1000)),
        () => candidatas.filter((name) => abierto(name) && sinUsar(name)),
        () => orden(otros().filter((name) => sinUsar(name) && mismaZona(name))),
        () => candidatas.filter((name) => abierto(name)),
      ]
      let etapa = -1
      let elegidas = []
      for (let k = 0; k < etapas.length && etapa < 0; k++) {
        elegidas = etapas[k]()
        if (elegidas.length > 0) etapa = k
      }
      if (etapa >= 0) {
        const name = elegidas[0]
        chosen = pick(name)
        if (chosen?.name !== name) chosen = { name, coordinates: coordsDe(name), zone: restaurantByName.get(name)?.zone ?? null }
        if (name !== row.restaurante) {
          const razones = []
          for (const candidata of candidatas.slice(0, candidatas.includes(name) ? candidatas.indexOf(name) : candidatas.length)) {
            const porque = !abierto(candidata) ? 'cierra ese día o a esa hora' : !sinUsar(candidata) ? 'ya sale en el viaje' : !barrioOk(candidata) ? (barrioDe(candidata) === mesas.comidaHoy ? 'se comió en ese mismo barrio ese día' : 'se cenó en ese mismo barrio el día anterior') : null
            if (porque) razones.push(`${candidata} ${porque}`)
          }
          const dondeEsta = candidatas.includes(name) ? '' : mismaZona(name) ? ', otro de la misma zona abierto y sin usar' : ', otro a menos de 1 km en otro barrio, abierto y sin usar'
          motivo = razones.length ? `${razones.join('; ')}: va ${name}${dondeEsta}` : `${row.restaurante}: va ${name}${dondeEsta}`
        }
        if (etapa === 3 || etapa === 4 || (etapa === 5 && !sinUsar(name))) {
          if (!sinUsar(name) || etapa === 5) log.push({ id: row.id, lugar: name, sitio: null, que: 'aviso', causa: `restaurante repetido en el viaje: ${name} (no queda otro abierto en la zona)` })
          if (cenando && !barrioOk(name)) log.push({ id: row.id, lugar: name, sitio: null, que: 'aviso', causa: `barrio repetido: ${barrioDe(name)} (${barrioDe(name) === mesas.comidaHoy ? 'se come y se cena en el mismo barrio' : 'dos cenas seguidas en el mismo barrio'}); no hay otra opción abierta que no rompa la ruta` })
        }
      }
      if (!chosen) {
        chosen = pick(row.restaurante)
        // (Sin ninguno abierto a esa hora, otro de la zona abierto ese día, aunque la hora justa no esté clara.)
        if (!chosen) chosen = recommendedRestaurant(destData, { names: [row.restaurante], meal, near: null, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: null })
        motivo = chosen ? `${candidatas.join(', ')}: ninguno abierto ese día a esa hora; va ${chosen.name}, otro de la misma zona abierto` : `${candidatas.join(', ')}: ninguno abierto ese día a esa hora y no hay otro en la zona`
      }
      if (chosen?.name) {
        mesas.usados.add(chosen.name)
        if (cenando) { mesas.cenaDeHoy = { barrio: barrioDe(chosen.name) } } else mesas.comidaHoy = barrioDe(chosen.name)
      }
      if (motivo) log.push({ id: row.id, lugar: row.restaurante, sitio: null, que: 'restaurante', causa: motivo })
      // (Navidad y Año Nuevo: «con reserva»; y sin dato de si ese restaurante cierra, el aviso de que se reserve con antelación.)
      const restaurante = restaurantByName.get(chosen?.name)
      const sinDato = restaurante && !restaurante.closed_on && !restaurante.closed_dates && !/\d{1,2}:\d{2}\s*-/.test(String(restaurante.hours ?? ''))
      const nota = !NAVIDAD.includes(mmdd) ? (/con reserva/i.test(row.nota ?? '') ? 'Con reserva' : null) : sinDato ? reservaCfg.sin_dato ?? 'En Navidad, reserva con antelación' : (row.tipo === 'cena' && reservaCfg.cena_especial?.[mmdd]) || reservaCfg.texto || 'Con reserva'
      if (row.tipo === 'comida') meals.push({ type: 'lunch', start, end: start + row.min, eatMinutes: row.min, coordinates: chosen?.coordinates ?? null, ...(chosen ? { spot: { name: chosen.name, zone: chosen.zone } } : {}), eatStart: start, ...(nota ? { note: nota } : {}) })
      else {
        dinnerRestaurant = chosen
        meals.push({ type: 'dinner', start, end: start + row.min, coordinates: chosen?.coordinates ?? null, walkMinutes: 0, ...(nota ? { note: nota } : {}) })
      }
    }
    // (Lo que se cenó hoy es lo que mira la cena de mañana.)
    mesas.cenaAnterior = mesas.cenaDeHoy
    const month = hours.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : null
    const nights = rows.filter((row) => row.tipo === 'noche' && (!row.solo_meses || (month != null && row.solo_meses.includes(month)))).map((row) => ({ ...catalogueByName.get(row.noche), fixedStart: filaMin(row.hora), fixedMinutes: row.min, wholeWalk: true })).filter((entry) => entry.name)
    const dinnerZone = dinnerRestaurant ? dinnerZones(destData).find((zone) => zone.restaurants.includes(dinnerRestaurant.name))?.id ?? null : null
    problemsEscrito.push(...ctx.problems.map((problem) => ({ ...problem, dayNumber: skeletonDay.dayNumber })))
    const dayPlan = {
      dayNumber: skeletonDay.dayNumber,
      weekday: skeletonDay.weekday,
      allowsRepetition: false,
      isBlank: false,
      isExcursion: false,
      halfDayExcursion: null,
      curated: true,
      escrito: true,
      hours,
      units: run.units,
      schedule: { visits: run.visits, meals, kept: run.units, dropped: [], walkMinutes: 0, meters: 0, idleMinutes: 0, idleBeforeDinner: 0, modeFallback: null },
      lunchZone: null,
      dinnerZone,
      dinnerPlaceZone: null,
      dinnerCoords: dinnerRestaurant?.coordinates ?? null,
      dinnerRestaurant,
      nightNames: [],
      blocks: null,
      curatedDay: { id: draft.id, nombre: draft.nombre, variantes: draft.applied, noche: null, nocheDespuesDeCenar: true, nocheAntesDeCenar: false, nocheMinutos: null, nocheSiCae: null },
      untypedAfternoon: false,
      reorderedBlocks: [],
      closedAnchors: [],
      otherRestaurants: [],
      written: { version: draft.version, escrito: true, tabla: draft.tablaClave, grupo: draft.tablaVersion },
      escritoNights: nights,
      escritoLog: log.map((entry) => ({ ...entry, fecha: hours.dateIso ?? null })),
      escritoRows: rows,
    }
    return dayPlan
  }
  const problemsEscrito = []
  const days = []
  const cityPlanned = []
  // Los días escritos se preparan todos antes de planificar ninguno: las reglas de noche miran lo que sale en el viaje entero.
  for (const skeletonDay of skeleton) {
    const index = cityDays.indexOf(skeletonDay)
    if (index >= 0 && drafts[index].escrito) prepararEscrito(drafts[index], skeletonDay)
  }
  aplicarDentroUnaVez()
  const noches = aplicarNochesDelViaje()
  // (Día a día: se reparten las nocturnas de ese día, se componen sus horas y solo entonces cuenta lo que de verdad salió de noche.)
  for (const skeletonDay of skeleton) {
    const index = cityDays.indexOf(skeletonDay)
    if (index >= 0 && drafts[index].escrito) {
      noches.asignarDia(drafts[index])
      componerEscrito(drafts[index], skeletonDay)
      noches.registrar(drafts[index])
    }
  }
  for (const skeletonDay of skeleton) {
    const index = cityDays.indexOf(skeletonDay)
    if (index < 0) {
      days.push({ ...skeletonDay, units: [], schedule: null })
      continue
    }
    const hours = hoursOf(skeletonDay)
    const half = Boolean(skeletonDay.halfDayExcursion)
    let draft = drafts[index]
    if (draft.escrito) {
      const escritoPlan = planEscritoDay(draft, skeletonDay)
      days.push(escritoPlan)
      cityPlanned.push(escritoPlan)
      continue
    }
    // En la frontera entre dos versiones (el sol a menos de NEIGHBOUR_WINDOW min del corte), si la elástica no llega en la
    // suya y en la vecina llega mejor, el día va con la vecina: los cortes son una raya, no una pared.
    const need = elasticNeed(draft, skeletonDay, hours, half)
    if (need && Math.abs(need.wanted) > need.max + LEAD_FLEX && hours.sunset != null) {
      const at = VERSIONS.indexOf(draft.version)
      const otherAt = need.wanted < 0 ? at - 1 : at + 1
      const cut = cuts[need.wanted < 0 ? at - 1 : at]
      if (otherAt >= 0 && otherAt < VERSIONS.length && cut && Math.abs(hours.sunset - toMin(cut)) <= NEIGHBOUR_WINDOW) {
        const other = redraft(draft, VERSIONS[otherAt])
        const otherNeed = elasticNeed(other, skeletonDay, hours, half)
        if (otherNeed && Math.abs(otherNeed.wanted) < Math.abs(need.wanted)) {
          other.applied.push(`luz:${draft.version}→${other.version}`)
          draft = other
          drafts[index] = other
        }
      }
    }
    // Tranquilo: las opcionales no vuelven nunca (PROMPT_ROMA_V4_REPASO 6); el rato que sobra va al barrio elástico (hasta
    // su máximo de paseo, 120 min) y al aperitivo (hasta 90). Antes volvían en verano y la tarde tranquila era la completa.
    const ctx = { id: draft.id, day: skeletonDay, hours, reserved: draft.applied.some((label) => String(label).startsWith('reserva:')), problems: [], sunsetArrival: null, morningNames: new Set(draft.manana.flatMap((stop) => [stop.lugar, ...(stop.si_cerrado?.cambiar_por?.lugar ? [stop.si_cerrado.cambiar_por.lugar] : [])])) }
    // El día que no empieza antes de una hora (el 1 de enero tras la Nochevieja, a las 10:00): toda la mañana se corre lo
    // mismo que la primera hora, menos lo que tiene turno. Si así se llega tarde a una hora fija o la comida se va
    // demasiado tarde, se prueba con la variante `empieza_tarde` del día escrito (lo que pasa a la tarde: no se quita
    // nada); y si tampoco, a la segunda hora (`si_no_cabe`, las 9:30), primero sin la variante y luego con ella. Si nada
    // cabe sin perder el atardecer del día, se prueba otra vez sin esa condición; y si ni así, el día se queda a su hora
    // escrita y queda apuntado en sus variantes («empieza:no_cabe»).
    const notBefore = half ? null : notBeforeOf(skeletonDay)
    if (notBefore && morningStartOf(draft) < notBefore.at) {
      // (Se corre también la entrada con hora que elige el viajero, el Coliseo; no lo que tiene turnos fijos: el Free Tour, la Galería.)
      const movable = (stop) => stop.hora != null && stop.lugar !== tour?.name && !placeByName.get(stop.lugar)?.turnos
      const lateOps = written.days[draft.id]?.variantes?.empieza_tarde ?? null
      const attempt = (at, withOps, keepSunset = true) => {
        const trial = { ...draft, applied: [...draft.applied] }
        if (withOps) applyOps(trial, lateOps, 'empieza_tarde')
        const delta = at - morningStartOf(trial)
        if (delta <= 0) return null
        trial.manana = trial.manana.map((stop) => (movable(stop) ? { ...stop, hora: toHHMM(toMin(stop.hora) + delta) } : stop))
        const probe = { ...ctx, problems: [], sunsetArrival: null, probe: true }
        const run = runList(trial.manana, 'manana', { t: at, coords: null }, probe)
        if (probe.problems.some((problem) => problem.tipo === 'llega_tarde')) return null
        const lunch = trial.comida ? lunchOf(trial, run.cursor, skeletonDay, hours) : null
        if (lunch && lunch.start > notBefore.lunchBy) return null
        // (Y el atardecer del día no se pierde por empezar tarde: ni con la elástica al mínimo se llegaría con sol.)
        if (keepSunset && hours.sunset != null && trial.tarde.some((stop) => stop.modo === 'atardecer')) {
          const afternoonProbe = { ...ctx, problems: [], sunsetArrival: null, probe: true }
          runList(trial.tarde, 'tarde', lunch ? { t: lunch.end, coords: lunch.spot?.coordinates ?? run.cursor.coords } : run.cursor, afternoonProbe)
          const slack = trial.tarde.find((stop) => stop.elastica != null)?.elastica ?? 0
          if (afternoonProbe.sunsetArrival != null && afternoonProbe.sunsetArrival - slack > hours.sunset) return null
        }
        trial.manana_empieza = toHHMM(at)
        trial.applied.push(`empieza:${toHHMM(at)}`, ...(withOps ? ['empieza_tarde'] : []))
        return trial
      }
      const hoursToTry = [notBefore.at, ...(notBefore.fallback != null && notBefore.fallback > morningStartOf(draft) ? [notBefore.fallback] : [])]
      let late = null
      for (const at of hoursToTry) {
        late = attempt(at, false) ?? (lateOps ? attempt(at, true) : null)
        if (late) break
      }
      // (Si el atardecer no se salva a ninguna de las dos horas, manda no madrugar: a la hora más temprana de las dos, y el
      // mirador se ve ya de noche.)
      for (const at of [...hoursToTry].reverse()) {
        if (late) break
        late = attempt(at, false, false) ?? (lateOps ? attempt(at, true, false) : null)
        if (late) late.applied.push('empieza:sin_atardecer')
      }
      if (late) {
        // (El nombre del día no promete la primera hora si ya no es la primera hora: «Trevi sin gente» a las 10:00.)
        if (written.days[draft.id]?.nombre_empieza_tarde && late.nombre === written.days[draft.id].nombre) late.nombre = written.days[draft.id].nombre_empieza_tarde
        Object.assign(draft, late)
        drafts[index] = draft
      } else draft.applied.push('empieza:no_cabe')
    }
    let startMorning = morningStartOf(draft)
    // REGLAS_RUTAS 2: si antes de una entrada con hora sobra tiempo, el día empieza más tarde (no se llena con paradas de antes de tiempo).
    if (!half && !draft.manana_empieza && draft.manana.length > 1 && hourOf(draft.manana[0]) == null) {
      const probeRun = runList(draft.manana, 'manana', { t: startMorning, coords: null }, { ...ctx, problems: [], sunsetArrival: null, probe: true })
      const k = probeRun.visits.findIndex((visit, index) => index > 0 && visit.fixedAt != null)
      if (k > 0) {
        const idle = probeRun.visits[k].fixedAt - (probeRun.visits[k].fixedMargin ?? 0) - (probeRun.visits[k - 1].end + (probeRun.visits[k].walkMinutes ?? 0))
        if (idle > 20) startMorning += Math.floor(idle / 5) * 5
      }
    }
    // Un mismo sitio, una vez al día (INVARIANTES 467): si un sitio va de día y también al atardecer, va al atardecer si el atardecer cuadra
    // (se prueba el día entero sin la visita de día); si no cuadra, va de día, y solo una vez.
    if (!half) {
      const sunsetNames = [...new Set(draft.tarde.filter((stop) => stop.modo === 'atardecer').map((stop) => stop.lugar))]
      for (const name of sunsetNames) {
        const isDay = (stop) => stop.lugar === name && stop.modo !== 'atardecer' && stop.modo !== 'camino'
        if (![...draft.manana, ...draft.tarde].some(isDay)) continue
        const trial = { ...draft, manana: draft.manana.filter((stop) => !isDay(stop)), tarde: draft.tarde.filter((stop) => !isDay(stop)) }
        const probe = { ...ctx, problems: [], sunsetArrival: null, probe: true }
        const morningRun = runList(trial.manana, 'manana', { t: morningStartOf(trial), coords: null }, probe)
        let after = morningRun.cursor
        if (trial.comida) {
          const lunch = lunchOf(trial, morningRun.cursor, skeletonDay, hours)
          after = { t: lunch.end, coords: lunch.spot?.coordinates ?? morningRun.cursor.coords }
        }
        const elastic = trial.tarde.find((stop) => stop.elastica != null)
        const afternoonRun = runList(trial.tarde, 'tarde', after, probe, elastic ? -elastic.elastica : 0)
        const survives = afternoonRun.visits.some((visit) => visit.place.name === name && visit.place.sunset != null)
        if (survives) {
          draft.manana = trial.manana
          draft.tarde = trial.tarde
          draft.applied.push(`una_vez:${name}:atardecer`)
        } else {
          draft.tarde = draft.tarde.filter((stop) => !(stop.lugar === name && stop.modo === 'atardecer'))
          draft.applied.push(`una_vez:${name}:de_dia`)
        }
      }
    }
    // (Y lo demás que el día escrito pone en la mañana y otra vez en la tarde, el Castillo del miércoles con la entrada a mediodía: la segunda vez sobra. Salvo el
    // mismo lugar con dos títulos escritos distintos, el parque de Villa Borghese de camino a la Galería y su lago.)
    if (!half) {
      const titleOf = (stop) => stop.titulo ?? null
      draft.tarde = draft.tarde.filter((stop) => {
        if (stop.modo === 'camino' || stop.modo === 'atardecer') return true
        const before = draft.manana.find((other) => other.lugar === stop.lugar && other.modo !== 'camino')
        if (!before) return true
        if (titleOf(before) && titleOf(stop) && titleOf(before) !== titleOf(stop)) return true
        draft.applied.push(`una_vez:${stop.lugar}`)
        return false
      })
    }
    // La comida dura como mínimo LUNCH_MIN (PROMPT_TEXTOS_RITMO 6). Si no cabe antes de la hora escrita de la tarde, se
    // quitan primero las opcionales (las de la mañana, de la última hacia atrás; luego las de la tarde, hasta cubrir lo que
    // falta) y lo que quede lo absorbe la elástica. Nunca se acorta la comida. (El 1 de enero, con los Capitolinos y el
    // Altar por dentro, la mañana se comía la comida: -5 min.)
    if (!half && draft.comida) {
      const shortNow = () => {
        const probe = { ...ctx, problems: [], sunsetArrival: null, probe: true }
        const run = runList(draft.manana, 'manana', { t: startMorning, coords: null }, probe)
        return lunchOf(draft, run.cursor, skeletonDay, hours).short
      }
      const withoutAt = (list, at) => {
        const removed = list[at]
        const next = list[at + 1]
        const rest = list.filter((_, i) => i !== at)
        // (Si la opcional traía el traslado, lo hereda la siguiente, con el suyo propio si lo tiene.)
        if (removed.traslado && next && !next.traslado) rest[at] = { ...next, traslado: next.traslado_si_va_primera ?? removed.traslado }
        return rest
      }
      const lastOptional = (list) => list.findLastIndex((stop) => stop.tipo === 'opcional')
      const afternoonFixed = draft.tarde.some((stop) => stop.hora != null)
      let short = shortNow()
      // (Solo si quitarla ayuda: una opcional de antes de una hora fija, Trevi antes del Free Tour de las 10:00, no le da
      // ni un minuto a la comida y se queda.)
      while (short != null) {
        let helped = false
        for (let at = draft.manana.length - 1; at >= 0 && !helped; at--) {
          if (draft.manana[at].tipo !== 'opcional') continue
          const before = draft.manana
          draft.manana = withoutAt(before, at)
          const after = shortNow()
          if (after == null || after > short) {
            draft.applied.push(`comida:sin ${before[at].lugar}`)
            short = after
            helped = true
          } else draft.manana = before
        }
        if (!helped) break
      }
      // (Si la tarde empieza con una hora fija, los Museos a las 14:45, quitar una opcional de después no arregla la comida.)
      let missing = short != null && !afternoonFixed ? lunchMinOf(draft) - short : 0
      while (missing > 0) {
        const at = lastOptional(draft.tarde)
        if (at < 0) break
        const stop = draft.tarde[at]
        missing -= (stop.min ?? placeByName.get(stop.lugar)?.duration_minutes ?? 15) + 5
        draft.applied.push(`comida:sin ${stop.lugar}`)
        draft.tarde = withoutAt(draft.tarde, at)
      }
    }
    const beforeMorning = { seen: new Set(seen), inside: new Set(seenInside), day: new Map(seenDay), problems: ctx.problems.length, notEnough: notEnoughTime.length }
    let morning = half ? { visits: [], units: [], cursor: { t: HALF_DAY_AFTERNOON, coords: null } } : runList(draft.manana, 'manana', { t: startMorning, coords: null }, ctx)
    if (morning.list) draft.manana = morning.list
    // La comida: el restaurante escrito o su alternativa (si cierra ese día o ya salió en el viaje).
    const meals = []
    let afterLunch = morning.cursor
    let lunchName = null
    if (!half && draft.comida) {
      let lunchPlan = lunchOf(draft, morning.cursor, skeletonDay, hours)
      // Si ni con la comida al mínimo se llega a la hora fija con que empieza la tarde, se recorta la mañana hacia atrás.
      if (lunchPlan.lateBy > 0 && morning.visits.length > 0) {
        // (La comida empieza en un cuarto de hora exacto: se prueba recortando de 5 en 5 hasta que cuadre.)
        const saved = morning.visits.map((visit) => ({ start: visit.start, end: visit.end }))
        const savedCursor = morning.cursor
        for (let extra = 0; extra <= 20 && lunchPlan.lateBy > 0; extra += 5) {
          morning.visits.forEach((visit, i) => {
            visit.start = saved[i].start
            visit.end = saved[i].end
          })
          morning.cursor = savedCursor
          const gained = shrinkBefore(morning.visits, morning.visits.length, lunchPlan.lateBy + extra, startMorning, ctx)
          if (gained <= 0) break
          morning.cursor = { ...savedCursor, t: morning.visits.at(-1).end }
          lunchPlan = lunchOf(draft, morning.cursor, skeletonDay, hours)
        }
        if (lunchPlan.lateBy > 0) {
          morning.visits.forEach((visit, i) => {
            visit.start = saved[i].start
            visit.end = saved[i].end
          })
          morning.cursor = savedCursor
          lunchPlan = lunchOf(draft, morning.cursor, skeletonDay, hours)
        }
        // Una hora fija de la tarde (los Museos a las 15:00) no se mueve (INVARIANTES 466): si ni así se llega, se quita lo de la mañana, en el
        // orden de siempre (opcionales, luego lo menor), y lo que se quita sale en «Quedó fuera».
        const droppedMorning = []
        for (let guard = 0; lunchPlan.lateBy > 0 && guard < 10; guard++) {
          // (Si la comida ya empieza lo más pronto que puede, quitar cosas de la mañana no gana nada: el aviso va por llegar tarde.)
          if (lunchPlan.start <= (isReservedDraft(draft) ? LUNCH_EARLIEST_RESERVED : LUNCH_EARLIEST)) break
          const at = dropCandidate(draft.manana, draft.manana.length)
          if (at < 0) break
          droppedMorning.push(draft.manana[at])
          draft.manana = draft.manana.filter((_, i) => i !== at)
          // (La mañana se vuelve a montar desde cero: lo que la primera vez dio por visto, no.)
          for (const name of [...seen]) if (!beforeMorning.seen.has(name)) seen.delete(name)
          for (const name of [...seenInside]) if (!beforeMorning.inside.has(name)) seenInside.delete(name)
          for (const name of [...seenDay.keys()]) if (!beforeMorning.day.has(name)) seenDay.delete(name)
          ctx.problems.length = beforeMorning.problems
          notEnoughTime.length = beforeMorning.notEnough
          morning = runList(draft.manana, 'manana', { t: startMorning, coords: null }, ctx)
          lunchPlan = lunchOf(draft, morning.cursor, skeletonDay, hours)
        }
        for (const stop of droppedMorning.filter((item) => item.tipo !== 'opcional')) notEnoughTime.push({ name: stop.lugar, reason: 'time', dayNumber: skeletonDay.dayNumber })
      }
      const { spot, start, end, short } = lunchPlan
      // (La comida ya dura LUNCH_MIN; la tarde empieza más tarde y lo absorbe la elástica. Solo es un problema si no hay
      // elástica que lo absorba: entonces la tarde va con retraso.)
      // (Ni si la tarde no lleva ninguna hora fija a la que llegar tarde: empieza un rato después y ya está.)
      if (short != null && !draft.tarde.some((stop) => stop.elastica != null) && draft.tarde.some((stop) => stop.hora != null)) ctx.problems.push({ tipo: 'comida_corta', minutos: short })
      // (Si a la primera parada de la tarde se va en bus o taxi, ese rato no es tiempo libre: `transitAfter`.)
      const firstAfternoon = draft.tarde[0]
      meals.push({ type: 'lunch', start, end, eatMinutes: end - start, coordinates: spot?.coordinates ?? morning.cursor.coords, ...(spot ? { spot: { name: spot.name, zone: spot.zone } } : {}), eatStart: start, ...(firstAfternoon?.traslado?.min ? { transitAfter: firstAfternoon.traslado.min } : {}) })
      if (spot) {
        usedRestaurants.add(spot.name)
        lunchName = spot.name
      }
      afterLunch = { t: end, coords: spot?.coordinates ?? morning.cursor.coords }
    } else if (half) {
      afterLunch = { t: draft.empieza ? toMin(draft.empieza) : HALF_DAY_AFTERNOON, coords: null }
      // Al volver de la excursión de medio día (Ostia, hasta las 14:00), la comida: junto a donde se llega (`junto_a`, la
      // Pirámide, con el tren de Ostia), antes de la tarde (PROMPT_REPASO_LOCAL_ROMA, 3: se volvía de Ostia sin comer).
      if (draft.comida) {
        const back = placeByName.get(draft.comida.junto_a ?? '')?.coordinates ?? null
        const { spot, start, end } = lunchOf(draft, { t: HALF_DAY_BACK, coords: back }, skeletonDay, hours)
        meals.push({ type: 'lunch', start, end, eatMinutes: end - start, coordinates: spot?.coordinates ?? back, ...(spot ? { spot: { name: spot.name, zone: spot.zone } } : {}), eatStart: start })
        if (spot) {
          usedRestaurants.add(spot.name)
          lunchName = spot.name
        }
        afterLunch = { t: Math.max(afterLunch.t, end), coords: spot?.coordinates ?? back }
      }
    }
    // La tarde, con la elástica ajustada para que el mirador llegue a su hora.
    const elasticStop = draft.tarde.find((stop) => stop.elastica != null)
    const sunsetStop = draft.tarde.find((stop) => stop.modo === 'atardecer')
    let elasticUsed = 0
    let elasticGrow = null
    let elasticWanted = 0
    if (elasticStop && sunsetStop && hours.sunset != null) {
      const probe = { ...ctx, problems: [], sunsetArrival: null, probe: true }
      runList(draft.tarde, 'tarde', afterLunch, probe)
      if (probe.sunsetArrival != null) {
        const target = hours.sunset - (sunsetStop.lead ?? SUNSET_LEAD)
        elasticWanted = target - probe.sunsetArrival
        // (De 5 en 5, como todo lo que ve el viajero.)
        const pmax = paseoMaxOf(placeByName.get(elasticStop.lugar))
        const baseMin = elasticStop.min ?? placeByName.get(elasticStop.lugar)?.duration_minutes ?? 30
        // (Y nunca por encima del máximo de su paseo: Borgo Pio, una calle, 45.)
        // (Y en completo, un barrio o un parque también puede crecer hasta su máximo de paseo, 90, antes que dejar tiempo libre.)
        const grow = Math.min(pmax != null ? Math.max(elasticStop.elastica, pmax - baseMin) : elasticStop.elastica, pmax != null ? Math.max(0, pmax - baseMin) : Infinity)
        elasticGrow = grow
        elasticUsed = Math.round(Math.max(-elasticStop.elastica, Math.min(grow, elasticWanted)) / 5) * 5
        // Nunca por debajo del 75 % de lo escrito ni de 15 min (20 un barrio); si haría falta bajar de ELASTIC_DROP, se quita.
        const base = elasticStop.min ?? placeByName.get(elasticStop.lugar)?.duration_minutes ?? 30
        // (Solo si después hay un bloque del mismo barrio que se queda su rato, Monti con el aperitivo en Monti, y nunca un
        // lugar del pool.)
        const elasticPlace = placeByName.get(elasticStop.lugar)
        const sameBarrioAfter = Boolean(draft.barrio_cena) && (elasticPlace?.zone === draft.barrio_cena || norm(elasticStop.lugar) === norm(draft.barrio_cena))
        if (base + elasticWanted < ELASTIC_DROP && sameBarrioAfter && !inPool(elasticStop.lugar)) {
          ctx.dropElastic = true
          elasticUsed = -base
        } else elasticUsed = Math.max(shrinkFloor(elasticStop, base) - base, elasticUsed)
      }
    }
    // Lo que la elástica no llega a absorber (hasta LEAD_FLEX min), lo absorbe la llegada al mirador: de 15 a 35 min antes del
    // sol en vez de 25. Si se llega tarde ya pasa solo; si se llegaría pronto, se llega antes y se queda más.
    // (Por menos de 5 min no se adelanta: esa espera en el mirador no se nota.)
    // Si la tarde no llega al sol ni con la elástica, la comida se acorta (hasta 45 min)
    // antes de perder el atardecer: comer junto a la Galería Borghese deja luego 25 min hasta el Ara Pacis.
    if (elasticStop && elasticWanted < -(elasticStop.elastica + LEAD_FLEX)) {
      const lunchMeal = meals.find((meal) => meal.type === 'lunch')
      const room = lunchMeal ? lunchMeal.end - lunchMeal.start - lunchMinOf(draft) : 0
      const cut = Math.floor(Math.min(room, -elasticWanted - elasticStop.elastica) / 5) * 5
      if (cut >= 5) {
        lunchMeal.end -= cut
        lunchMeal.eatMinutes -= cut
        afterLunch = { ...afterLunch, t: afterLunch.t - cut }
        elasticWanted += cut
        elasticUsed = Math.max(elasticUsed, Math.round(Math.max(-elasticStop.elastica, elasticWanted) / 5) * 5)
        // (Y si con el rato ganado la elástica ya no baja de ELASTIC_DROP, vuelve: Monti no se quita por nada.)
        const elasticBase = elasticStop.min ?? placeByName.get(elasticStop.lugar)?.duration_minutes ?? 30
        if (ctx.dropElastic && elasticBase + elasticWanted >= ELASTIC_DROP) {
          ctx.dropElastic = false
          elasticUsed = Math.max(shrinkFloor(elasticStop, elasticBase) - elasticBase, Math.round(Math.max(-elasticStop.elastica, elasticWanted) / 5) * 5)
        }
      }
    }
    // Tranquilo (PROMPT_ROMA_V4_REPASO 6): lo que sobra después del barrio (hasta su máximo) y del aperitivo (hasta 90) no
    // se queda suelto antes del atardecer: es un descanso después de comer, con su nombre, y la tarde empieza después.
    let restAfterLunch = 0
    // (En completo, igual, hasta 60 min: la comida escrita de 140 min en verano pasa a 90 y la tarde empezaba antes de que
    // abriese Santa Cecilia; el descanso va antes que el aperitivo.)
    if (elasticStop && lunchName) {
      const spare = elasticWanted - (elasticGrow ?? 0) - LEAD_FLEX
      // (Nunca si lo primero de la tarde es una hora fija: el descanso no la mueve, INVARIANTES 466; San Clemente a las 14:00.)
      if (spare > 20 && hourOf(firstRequiredOf(draft.tarde) ?? {}) == null) {
        restAfterLunch = Math.floor(Math.min(spare, destData.destination_config?.alcance?.descanso_despues_comer_max_min ?? REST_AFTER_LUNCH_MAX) / 5) * 5
        // (El descanso no cierra ninguna puerta: si por empezar la tarde más tarde algo pasa a verse por fuera, el Panteón
        // del sábado, que deja de vender entradas a las 16:00, no hay descanso.)
        const outsideWith = (from) => {
          const probe = { ...ctx, problems: [], sunsetArrival: null, probe: true }
          return runList(draft.tarde, 'tarde', from, probe, elasticUsed).visits.filter((visit) => visit.place.visitOutside).length
        }
        if (outsideWith({ ...afterLunch, t: afterLunch.t + restAfterLunch }) > outsideWith(afterLunch)) restAfterLunch = 0
        afterLunch = { ...afterLunch, t: afterLunch.t + restAfterLunch }
        elasticWanted -= restAfterLunch
      }
    }
    const early = elasticWanted - elasticUsed
    // (Solo en un mirador: una avenida al atardecer, los Foros, tiene su máximo.)
    const sunsetIsMirador = sunsetStop && (placeByName.get(sunsetStop.lugar)?.tags ?? []).includes('mirador')
    ctx.earlyBy = early >= 5 && sunsetIsMirador ? Math.min(LEAD_FLEX, early) : 0
    let afternoon = runList(draft.tarde, 'tarde', afterLunch, ctx, elasticUsed)
    if (afternoon.list) draft.tarde = afternoon.list
    // Lo que cae cerrado a su hora y no se salva por fuera se mueve a cuando está abierto (PARA_CODE_TODO_2026-10-01, 5.4): en la
    // misma tarde, a otro sitio de la lista más cerca de donde estaba, sin tocar lo que tiene hora fija ni el atardecer, y solo
    // si así la tarde no pierde nada (ni una hora fija, ni el mirador).
    {
      for (let guard = 0; guard < 3; guard++) {
        const bad = redOutside(afternoon.visits, hours)[0]
        if (!bad) break
        const from = draft.tarde.findIndex((stop) => stop.lugar === bad.place.name)
        if (from < 0 || draft.tarde[from].hora != null || draft.tarde[from].modo === 'atardecer' || draft.tarde[from].elastica != null || inPool(bad.place.name)) break
        const before = { bad: redOutside(afternoon.visits, hours).length, problems: ctx.problems.length, sunset: ctx.sunsetArrival }
        let moved = null
        for (let distance = 1; distance < draft.tarde.length && !moved; distance++) {
          for (const to of [from - distance, from + distance]) {
            if (to < 0 || to >= draft.tarde.length || draft.tarde[to].hora != null || draft.tarde[to].modo === 'atardecer') continue
            const trial = [...draft.tarde]
            const [item] = trial.splice(from, 1)
            trial.splice(to, 0, item)
            const probe = { ...ctx, problems: [], sunsetArrival: null, probe: true }
            const run = runList(trial, 'tarde', afterLunch, probe, elasticUsed)
            const stillBad = redOutside(run.visits, hours)
            if (stillBad.length >= before.bad || probe.problems.length > 0 || run.visits.length < afternoon.visits.length) continue
            // (Y sin ir y venir: lo que se camina no crece más de 10 min, ni sale un zigzag nuevo: volver a menos de 300 m de algo de lo que
            // se estuvo después de irse a más de 1,2 km.)
            const walked = (list) => list.reduce((sum, visit) => sum + (visit.walkMinutes ?? 0), 0)
            if (walked(run.visits) > walked(afternoon.visits) + 10) continue
            const zigzags = (list) => {
              let count = 0
              const points = list.filter((visit) => !visit.place.passThrough && Array.isArray(visit.place.coordinates)).map((visit) => visit.place.coordinates)
              points.forEach((here, index) => {
                for (let i = 0; i < index - 1; i++) {
                  if (metersBetween(here, points[i]) > 300) continue
                  if (points.slice(i + 1, index).some((other) => metersBetween(other, points[i]) > 1200)) {
                    count++
                    break
                  }
                }
              })
              return count
            }
            if (zigzags(run.visits) > zigzags(afternoon.visits)) continue
            // (Llegar antes al mirador no importa: espera a su hora; llegar más tarde de lo que se llegaba y de su hora, hasta 10 min, sí.)
            const sunsetStopHere = draft.tarde.find((stop) => stop.modo === 'atardecer')
            const sunsetTarget = hours.sunset != null ? hours.sunset - (sunsetStopHere?.lead ?? SUNSET_LEAD) : null
            if (before.sunset != null && probe.sunsetArrival != null && probe.sunsetArrival > Math.max(before.sunset, sunsetTarget ?? 0) + 10) continue
            moved = { trial, to }
            break
          }
        }
        if (!moved) {
          // Sin sitio donde esté abierto, un lugar menor (nivel 3) no sale: ni un «ya ha cerrado» en rojo ni un exterior que no vale
          // la pena. Sale en «Quedó fuera».
          if ((placeByName.get(bad.place.name)?.level ?? 3) < 3) break
          draft.tarde = draft.tarde.filter((_, index) => index !== from)
          draft.applied.push(`quita:${bad.place.name}`)
          notEnoughTime.push({ name: bad.place.name, reason: 'time', dayNumber: skeletonDay.dayNumber })
          afternoon = runList(draft.tarde, 'tarde', afterLunch, ctx, elasticUsed)
          continue
        }
        draft.tarde = moved.trial
        draft.applied.push(`mueve:${bad.place.name}`)
        afternoon = runList(draft.tarde, 'tarde', afterLunch, ctx, elasticUsed)
      }
    }
    // Sin huecos antes de cenar (PARA_CODE_TARDE_VATICANO, 3): si después de lo último quedan más de 45 min hasta la cena
    // y hay a un paseo un sitio del destino que el viaje no ve (nivel 1 o 2, abierto a esa hora), va ese sitio.
    if (!half) {
      const floorOfDinner = Math.max(dinnerHoursOf(draft).desde, draft.cena?.hora ? toMin(draft.cena.hora) : 0)
      const idleOf = (run) => Math.max(roundUp15(run.cursor.t + FILLER_DINNER_WALK), floorOfDinner) - run.cursor.t - FILLER_DINNER_WALK
      const idle = idleOf(afternoon)
      if (idle > FILLER_IDLE_MIN && afternoon.cursor.coords) {
        // (Lo que el viaje ya ha visto y lo escrito en los otros días; lo que hoy se ha caído, no.)
        const tripNames = new Set([...seen, ...drafts.flatMap((other) => [...other.manana, ...other.tarde].map((stop) => stop.lugar))])
        // (Ni un museo ya de noche, ni volver junto a lo que el día ya vio antes de lo último: sería un zigzag.)
        const earlierCoords = afternoon.visits.slice(0, -1).concat(morning.visits).map((visit) => visit.place.coordinates).filter(Array.isArray)
        const fits = (place) => !(place.type === 'interior' && hours.sunset != null && afternoon.cursor.t + 10 >= hours.sunset) && !earlierCoords.some((coords) => metersBetween(coords, place.coordinates) < 400)
        const candidates = (destData.places ?? [])
          // (En la misma zona que lo último: irse a otra y volver para el aperitivo sería un barrio dos veces.)
          .filter((place) => place.coordinates && (place.level ?? 3) <= 2 && !tripNames.has(place.name) && !place.isFreeTour && !closedThatDay(place.name, ctx.day) && fits(place) && place.zone && place.zone === placeByName.get(afternoon.visits.at(-1)?.place?.name)?.zone)
          .map((place) => ({ place, walk: walkLeg(afternoon.cursor.coords, place.coordinates) }))
          .filter(({ walk }) => walk > 0 && walk <= FILLER_WALK_MAX)
          .sort((a, b) => a.walk - b.walk)
        for (const { place, walk } of candidates) {
          const minutes = Math.min(place.duration_minutes ?? 30, FILLER_MINUTES_MAX, Math.floor((idle - walk - 10) / 5) * 5)
          if (minutes < FILLER_MINUTES_MIN) continue
          const ready = placeByName.get(place.name)
          if (!ready || !openCheck(ready, afternoon.cursor.t + walk, minutes, hours).ok) continue
          const probe = runList([...draft.tarde, { lugar: place.name, min: minutes }], 'tarde', afterLunch, { ...ctx, problems: [], sunsetArrival: null, probe: true }, elasticUsed)
          if (idleOf(probe) < 0 || probe.visits.at(-1)?.place?.name !== place.name || probe.visits.at(-1)?.place?.visitOutside) continue
          draft.tarde = [...draft.tarde, { lugar: place.name, min: minutes }]
          draft.applied.push(`relleno_cena:${place.name}`)
          afternoon = runList(draft.tarde, 'tarde', afterLunch, ctx, elasticUsed)
          break
        }
      }
    }
    const visits = markOutsideNextToEssential([...morning.visits, ...afternoon.visits], hours)
    const units = [...morning.units, ...afternoon.units]
    // La cena: su restaurante y su hora escritas (la hora es la de antes; si se llega más tarde, cuando se llega).
    const last = afternoon.cursor
    const pickDinner = (names) => recommendedRestaurant(destData, { names, meal: 'cena', near: last.coords, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: usedRestaurants })
    // La cena, como la comida, a 15 min andando como mucho de lo último (PROMPT_ROMA_V4_REPASO 10: Trattoria Monti a 20 min
    // de los Foros): la escrita o su alternativa si están a 15; si no, la más cercana; y si ninguna, la escrita.
    const writtenDinners = [pickDinner([draft.cena?.restaurante].filter(Boolean)), pickDinner([draft.cena?.alternativa].filter(Boolean))].filter(Boolean)
    const nearDinner = (spot) => spot && walkLeg(last.coords, spot.coordinates) <= DINNER_WALK_MAX
    const nearestDinner = pickDinner(null)
    // La cena entre lo último de la tarde y la nocturna, a 15 min o menos de las dos (REGLAS_RUTAS 15). Si no puede ser, va junto a la nocturna
    // y el tramo desde lo último se hace en bus o taxi (regla 19).
    const nightWalkDef = { ...(destData.night_walks?.[draft.noche] ?? {}), ...(written.destino?.noches?.[draft.noche] ?? {}) }
    const nightFirst = (destData.night_experiences ?? []).find((entry) => entry.name === nightWalkDef.recorrido?.[0])
    const nightCoords = Array.isArray(nightFirst?.coordinates) ? nightFirst.coordinates : null
    const nearBoth = (spot) => nearDinner(spot) && (!nightCoords || walkLeg(spot.coordinates, nightCoords) <= NIGHT_DINNER_WALK_MAX)
    let dinnerByTaxi = false
    let dinnerRestaurant = writtenDinners.find(nearBoth) ?? (nearBoth(nearestDinner) ? nearestDinner : null)
    if (!dinnerRestaurant && nightCoords) {
      const nearNight = (spot) => spot && walkLeg(spot.coordinates, nightCoords) <= NIGHT_DINNER_WALK_MAX
      const byNight = recommendedRestaurant(destData, { names: null, meal: 'cena', near: nightCoords, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: usedRestaurants })
      dinnerRestaurant = writtenDinners.find(nearNight) ?? byNight ?? null
      dinnerByTaxi = Boolean(dinnerRestaurant) && !nearDinner(dinnerRestaurant)
    }
    dinnerRestaurant = dinnerRestaurant ?? writtenDinners.find(nearDinner) ?? (nearDinner(nearestDinner) ? nearestDinner : null) ?? writtenDinners[0] ?? nearestDinner
    const dinnerWalkOnFoot = dinnerRestaurant ? walkLeg(last.coords, dinnerRestaurant.coordinates) : 10
    const dinnerWalk = dinnerByTaxi || dinnerWalkOnFoot > DINNER_WALK_MAX * 2 ? Math.min(dinnerWalkOnFoot, Math.round(straightLineMeters(last.coords, dinnerRestaurant.coordinates) / 350) + 6) : dinnerWalkOnFoot
    let readyAt = last.t + dinnerWalk
    // Nunca antes de las 19:30 (ni de la hora escrita) y, en verano (versión D), nunca antes de las 20:30.
    const dinnerFloor = Math.max(dinnerHoursOf(draft).desde, draft.cena?.hora ? toMin(draft.cena.hora) : 0)
    const dinnerStart = Math.max(roundUp15(readyAt), dinnerFloor)
    // REGLAS_RUTAS 44: la cena empieza como tarde a la hora límite del destino (`cena_limite`). Si la tarde no cabe, se recorta en el orden de siempre:
    // lo menos importante de la tarde (acortar ya está hecho antes). Lo protegido no se quita.
    {
      const limit = dinnerHoursOf(draft).hasta
      if (limit != null && dinnerStart > limit && recortesCena < 12) {
        const candidate = cutOrder(draft.tarde, { hard: false })[0]
        if (candidate) return planWrittenTrip({ ...args, dropTarde: [...dropTarde, `${draft.id}:${candidate.lugar}`], recortesCena: recortesCena + 1 })
      }
    }
    // Si la cena espera y lo último es el mirador, se queda más en el mirador (hasta SUNSET_STAY_EXTRA min): las luces.
    const lastVisit = afternoon.visits.at(-1)
    // (Solo un mirador: una avenida o un paseo tienen su máximo. Desde 10 min de espera, y deja 5.)
    // (En C y D: en A y B ese rato es de la nocturna y de «luces y aperitivo».)
    if ((draft.version === 'C' || draft.version === 'D') && dinnerStart - readyAt > 10 && lastVisit?.place?.sunset != null && (lastVisit.place.tags ?? []).includes('mirador')) {
      // (REGLAS_RUTAS 38: nunca por encima del máximo del sitio, `min_max`.)
      const roomLeft = (placeByName.get(lastVisit.place.name)?.min_max ?? Infinity) - (lastVisit.end - lastVisit.start)
      const extra = Math.max(0, Math.min(SUNSET_STAY_EXTRA, dinnerStart - readyAt - 5, roomLeft))
      lastVisit.end += extra
      readyAt += extra
    }
    meals.push({ type: 'dinner', start: dinnerStart, end: dinnerStart + (draft.cena?.minutos ?? DINNER_MINUTES), coordinates: dinnerRestaurant?.coordinates ?? last.coords, walkMinutes: dinnerWalk })
    if (dinnerRestaurant) usedRestaurants.add(dinnerRestaurant.name)
    const otherRestaurants = [...usedRestaurants].filter((name) => name !== lunchName && name !== dinnerRestaurant?.name)
    const dayPlan = {
      dayNumber: skeletonDay.dayNumber,
      weekday: skeletonDay.weekday,
      allowsRepetition: false,
      isBlank: false,
      isExcursion: false,
      halfDayExcursion: skeletonDay.halfDayExcursion ?? null,
      curated: true,
      hours,
      units,
      schedule: {
        visits,
        meals: meals.sort((a, b) => a.start - b.start),
        kept: units,
        dropped: [],
        walkMinutes: visits.reduce((sum, visit) => sum + (visit.walkMinutes ?? 0), 0),
        meters: 0,
        idleMinutes: 0,
        idleBeforeDinner: Math.max(0, dinnerStart - readyAt),
        modeFallback: null,
      },
      lunchZone: null,
      dinnerZone: draft.barrio_cena,
      dinnerPlaceZone: null,
      dinnerCoords: dinnerRestaurant?.coordinates ?? null,
      dinnerRestaurant,
      nightNames: [],
      blocks: null,
      curatedDay: { id: draft.id, nombre: draft.nombre, variantes: draft.applied, noche: draft.noche, nocheDespuesDeCenar: draft.noche_despues_de_cenar, nocheAntesDeCenar: draft.noche_antes_de_cenar, nocheMinutos: draft.noche_minutos, nocheSiCae: draft.noche_si_cae, version: draft.version },
      ...(draft.noTour ? { noTour: true } : {}),
      untypedAfternoon: false,
      reorderedBlocks: [],
      closedAnchors: [],
      otherRestaurants,
      written: { version: draft.version, elastic: elasticStop ? { lugar: elasticStop.lugar, wanted: elasticWanted, used: elasticUsed, max: elasticStop.elastica, grow: elasticGrow ?? elasticStop.elastica } : null, sunsetArrival: ctx.sunsetArrival, problems: ctx.problems, suggestions: draft.suggestions, dinnerHour: draft.cena?.hora ?? null, ...(restAfterLunch ? { restAfterLunch } : {}) },
    }
    problems.push(...ctx.problems.map((problem) => ({ ...problem, dayNumber: skeletonDay.dayNumber })))
    days.push(dayPlan)
    cityPlanned.push(dayPlan)
  }

  // ── 5. Los paseos nocturnos escritos (los mismos que el motor de días curados) ───────────────
  const catalogue = new Map((destData.night_experiences ?? []).map((entry) => [entry.name, entry]))
  // (Los paseos nocturnos del destino, con lo que los días escritos cambian: `noches` de _destino.json.)
  const walks = { ...(destData.night_walks ?? {}), ...Object.fromEntries(Object.entries(written.destino?.noches ?? {}).map(([id, patch]) => [id, { ...(destData.night_walks?.[id] ?? {}), ...patch }])) }
  const shortTrip = cityDays.length <= 2
  const daysOfPlace = new Map()
  const timesSeen = new Map()
  for (const day of cityPlanned) {
    for (const visit of day.schedule.visits) {
      daysOfPlace.set(visit.place.name, new Set([...(daysOfPlace.get(visit.place.name) ?? []), day.dayNumber]))
      timesSeen.set(visit.place.name, (timesSeen.get(visit.place.name) ?? 0) + 1)
    }
  }
  const usedNights = new Set()
  // «{lugar} iluminado» cuenta como la nocturna de ese lugar (REGLAS_RUTAS 21): un mirador al que se llega de noche y que tiene buena foto
  // de noche (`night_view_overrides`) ya es esa nocturna; no vuelve en otra noche del viaje.
  const nightViewOverrides = destData.destination_config?.night_view_overrides ?? {}
  for (const day of cityPlanned) {
    for (const visit of day.schedule?.visits ?? []) {
      const late = visit.place.nightView || (visit.place.sunset != null && day.hours?.sunset != null && visit.start > day.hours.sunset)
      const nocturna = late ? nightViewOverrides[visit.place.name]?.nocturna : null
      if (nocturna) usedNights.add(nocturna)
    }
  }
  const nightsByDay = new Map()
  const walkText = (walk, chain, beforeDinner = false) => {
    const parts = walk.texto_partes
    if (!parts && walk.texto_si_va_segundo && chain.slice(1).some((entry) => entry.name === walk.texto_si_va_segundo_lugar)) return walk.texto_si_va_segundo
    if (!parts) return chain.length < walk.recorrido.length && walk.texto_corto ? walk.texto_corto : walk.texto
    const pieces = chain.map((entry) => parts.lugares?.[entry.name]).filter(Boolean)
    if (pieces.length === 0) return walk.texto ?? null
    const list = pieces.length === 1 ? pieces[0] : `${pieces.slice(0, -1).join(', ')} y ${pieces.at(-1)}`
    const joined = list.charAt(0).toUpperCase() + list.slice(1)
    const ending = pieces.length === 1 ? (beforeDinner ? parts.uno_antes_de_cenar : null) ?? parts.uno : (beforeDinner ? parts.varios_antes_de_cenar : null) ?? parts.varios
    return `${parts.inicio} ${joined} ${ending}`
  }
  // Paseo nocturno todas las noches mientras queden sitios que valgan la pena, aunque haya que cruzar la ciudad (decisión
  // del usuario, 2026-10-01; INVARIANTES 413). Un día sin paseo escrito toma el mejor que quede.
  const NO_WALK = { nombre: null, recorrido: [], alternativas: [] }
  // (La fecha manda, REGLAS_RUTAS 14: la noche propia de una fecha (Nochebuena: Trevi) está reservada para ese día; los demás días llevan otra nocturna.)
  const specialNames = new Set(cityPlanned.map((other) => destData.destination_config?.noche_especial?.[String(other.hours?.dateIso ?? '').slice(5)]?.noche).filter(Boolean))
  for (const day of cityPlanned) {
    if (day.escritoNights) {
      // (Un día escrito trae sus nocturnas, con su hora: el motor no elige.)
      if (day.escritoNights.length > 0) nightsByDay.set(day.dayNumber, day.escritoNights)
      continue
    }
    // `noche_si_cae` ({ lugar, noche }): si ese lugar no cabe de día, ese día su paseo de noche es otro (Piazza Navona no se cae: va de noche).
    const fallen = day.curatedDay.nocheSiCae && !day.schedule.visits.some((visit) => visit.place.name === day.curatedDay.nocheSiCae.lugar && !visit.place.visitOutside)
    const walk = walks[fallen ? day.curatedDay.nocheSiCae.noche : day.curatedDay.noche] ?? NO_WALK
    const removedByDay = Object.entries(walk.quitar_si_va ?? {}).filter(([id]) => order.includes(id)).flatMap(([, names]) => names)
    // (Un atardecer escrito no lo sustituye la nocturna: el Puente Sant'Angelo al atardecer se queda y de noche se puede volver.)
    const startOf = (name) => day.schedule.visits.find((visit) => visit.place.name === name && visit.place.sunset == null && !visit.place.nightView)?.start ?? null
    const lateVisit = (entry) => (entry.conflicts_with ?? []).some((name) => {
      const start = startOf(name)
      return start != null && (start >= LATE_VISIT_MINUTES || (day.hours?.sunset != null && start >= day.hours.sunset))
    })
    // Ver de noche lo que se ha visto de día (esa misma tarde o a la mañana siguiente) no es repetir: es otra experiencia
    // (decisión del usuario, PARA_CODE_TARDE_VATICANO, 2026-10-01; fuera la regla de «no repetir de noche»). Solo no se
    // repite la misma nocturna en el viaje.
    // Nocturna el mismo día (3-oct-2026): si la visita de día de ese sitio fue por la mañana, su nocturna puede ir ese mismo día (Trevi a
    // las 8:00 y Trevi iluminada a las 22:00 son dos experiencias); si fue por la tarde, la nocturna va en otro día.
    // (REGLAS_RUTAS 6: lo que cuenta es lo que la nocturna ENSEÑA (`muestra`), no solo con lo que choca: «El Puente y el Castillo» enseña el
    // Castillo, y «Trastevere de noche» enseña Trastevere. También cuentan los sitios que esa tarde se ven por fuera junto a la visita.)
    const shownNames = (entry) => new Set([...(entry.conflicts_with ?? []), ...(entry.muestra ?? []).map((id) => placeNameById.get(id)).filter(Boolean)])
    const visitedThisAfternoon = (entry) => {
      const names = shownNames(entry)
      return day.schedule.visits.some((visit) => visit.start >= AFTERNOON_FROM && (names.has(visit.place.name) || (visit.place.outsideOf ?? []).some((name) => names.has(name))))
    }
    let fallbackFar = false
    const allowed = (entry, { strictReach = false } = {}) => {
      if (!entry || usedNights.has(entry.name) || visitedThisAfternoon(entry)) return false
      if (specialNames.has(entry.name) && specialNight?.noche !== entry.name) return false
      if (strictReach && day.dinnerCoords && metersBetween(day.dinnerCoords, entry.coordinates) > NIGHT_FALLBACK_METERS) return false
      // (REGLAS_RUTAS 37: la nocturna, a unos 20 min andando de la cena; si no, pasa a la siguiente de su paseo.)
      if (day.dinnerCoords && metersBetween(day.dinnerCoords, entry.coordinates) > (destData.destination_config?.alcance?.nocturna_desde_cena_m ?? 1500) && !fallbackFar) return false
      return true
    }
    // (Nochebuena y Nochevieja: un paseo corto, una sola parada cerca de la cena. PROMPT_REPASO_LOCAL_ROMA, 4.)
    const specialNight = destData.destination_config?.noche_especial?.[String(day.hours?.dateIso ?? '').slice(5)] ?? null
    const shortNight = Boolean(specialNight)
    const max = shortNight ? specialNight.maximo ?? 1 : walk.maximo ?? 2
    let chain = walk.recorrido.filter((name) => !removedByDay.includes(name)).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
    // (La noche propia de una fecha, de los datos del destino: el 24 de diciembre, la Fontana de Trevi.)
    if (specialNight?.noche && catalogue.get(specialNight.noche) && !visitedThisAfternoon(catalogue.get(specialNight.noche))) chain = [catalogue.get(specialNight.noche)]
    let fromAlternative = false
    // (`sin_relevo`: esa noche no lleva paseo; el plan de la tarde ya es de noche, el mercadillo de Navona antes de cenar.)
    if (chain.length === 0 && !walk.sin_relevo) {
      chain = (walk.alternativas ?? []).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
      const byDistance = (a, b) => metersBetween(day.dinnerCoords, a.coordinates) - metersBetween(day.dinnerCoords, b.coordinates)
      if (chain.length === 0) chain = [...catalogue.values()].filter((entry) => allowed(entry, { strictReach: true })).sort(byDistance)
      // (Si cerca no queda nada, el que quede, aunque haya que cruzar la ciudad: uno solo.)
      if (chain.length === 0) { fallbackFar = true; chain = [...catalogue.values()].filter((entry) => allowed(entry)).sort(byDistance).slice(0, 1) }
      fromAlternative = walk.recorrido.length > 0 || walk === NO_WALK
    }
    // (El relevo de lo que solo vale antes de cenar —Trastevere de noche, tras el Janículo— es otra nocturna: no vuelve si ya salió en el viaje ni si esa tarde se vio lo que enseña.)
    chain = chain.slice(0, max).map((entry) => {
      const relevo = entry.si_no ? catalogue.get(entry.si_no) : null
      return relevo && !usedNights.has(relevo.name) && !visitedThisAfternoon(relevo) ? { ...entry, fallback: relevo } : entry
    })
    if (chain.length === 0) continue
    for (const entry of chain) {
      usedNights.add(entry.name)
      if (entry.fallback) usedNights.add(entry.fallback.name)
      for (const name of entry.conflicts_with ?? []) timesSeen.set(name, (timesSeen.get(name) ?? 0) + 1)
    }
    const sameAs = fromAlternative ? Object.values(walks).find((other) => other !== walk && Array.isArray(other.recorrido) && chain.every((entry) => other.recorrido.includes(entry.name))) : null
    const text = fromAlternative ? (sameAs ? walkText(sameAs, chain) : null) : walkText(walk, chain)
    nightsByDay.set(day.dayNumber, chain.map((entry) => ({ ...entry, wholeWalk: true, ...(walk.excepcion_mismo_dia ? { sameDayException: true } : {}), ...((fromAlternative && walk.alternativas_despues_de_cenar) || day.curatedDay.nocheDespuesDeCenar ? { afterDinnerOnly: true } : {}), ...(day.curatedDay.nocheDespuesDeCenar ? { afterDinnerForced: true } : {}), ...(shortTrip && (entry.conflicts_with ?? []).some((name) => daysOfPlace.get(name)?.has(day.dayNumber)) && lateVisit(entry) ? { replacesDayVisit: true } : {}) })))
    day.nightWalk = { nombre: fromAlternative ? sameAs?.nombre ?? nightNameOf(chain) : walk.nombre, texto: text, textoAntesCenar: fromAlternative ? (sameAs ? walkText(sameAs, chain, true) : null) : walkText(walk, chain, true), recorrido: chain.map((entry) => entry.name), ...(!fromAlternative && walk.texto_despues_cenar ? { textoDespuesCenar: walk.texto_despues_cenar } : {}) }
  }
  const centro = Object.values(walks).find((walk) => Array.isArray(walk.centro_dos_dias))
  if (shortTrip && centro) {
    const seenByDay = new Set(cityPlanned.flatMap((day) => day.schedule.visits.flatMap((visit) => [visit.place.name, ...(visit.place.outsideOf ?? [])])))
    const covered = new Set([...seenByDay, ...tourCovers])
    const missing = centro.centro_dos_dias.filter((name) => !covered.has(name))
    const needed = centro.solo_si_falta ? missing.some((name) => centro.solo_si_falta.includes(name)) : missing.length > 0
    const host = cityPlanned.find((day) => day.curatedDay.id === 'D1') ?? cityPlanned.find((day) => day.curatedDay.id !== 'D3') ?? cityPlanned[0]
    if (needed && host && !host.escrito) { // (Un día escrito trae sus nocturnas: el reparto de «centro en dos días» no las cambia.)
      const current = nightsByDay.get(host.dayNumber) ?? []
      const wanted = new Set([...missing, ...current.flatMap((entry) => entry.conflicts_with ?? [])])
      const chain = centro.recorrido
        .map((name) => catalogue.get(name))
        .filter((entry) => entry && (entry.conflicts_with ?? []).some((name) => wanted.has(name)))
        .filter((entry) => !(entry.conflicts_with ?? []).some((name) => missing.includes(name)) || ![...nightsByDay.entries()].some(([dayNumber, list]) => dayNumber !== host.dayNumber && list.some((other) => other.name === entry.name)))
      if (chain.length > 0) {
        for (const [dayNumber, list] of nightsByDay) if (dayNumber !== host.dayNumber) nightsByDay.set(dayNumber, list.filter((entry) => !chain.some((other) => other.name === entry.name)))
        nightsByDay.set(host.dayNumber, chain.map((entry) => ({ ...entry, wholeWalk: true })))
        host.nightWalk = { nombre: centro.nombre, texto: walkText(centro, chain), textoAntesCenar: walkText(centro, chain, true), recorrido: chain.map((entry) => entry.name) }
      }
    }
  }

  // Traslados largos (más de 25 min andando) y los tramos en transporte escritos (`traslado`).
  for (const day of cityPlanned) {
    const visits = day.schedule.visits
    const lunch = (day.schedule.meals ?? []).find((meal) => meal.type === 'lunch')
    day.longWalks = []
    for (let i = 0; i < visits.length; i++) {
      const visit = visits[i]
      if (visit.place.transitMinutes && visit.place.transitHow && i > 0) {
        visit.place = { ...visit.place, transit: { how: visit.place.transitHow, minutes: visit.place.transitMinutes } }
        continue
      }
      if (i === 0) continue
      const previous = visits[i - 1]
      const fromLunch = lunch?.coordinates && lunch.start >= previous.end && lunch.start < visit.start
      const from = fromLunch ? lunch.coordinates : previous.place.end_coordinates ?? previous.place.coordinates
      const minutes = travel.leg(from, visit.place.coordinates)?.minutes ?? 0
      if (minutes <= TRANSFER_NOTICE_MINUTES) continue
      const place = placeByName.get(visit.place.name)
      // (Con el transporte recortado a esa hora, la alternativa es el taxi, no el bus.)
      const runs = !calendar.hasDates || anyTransitRuns(destData, day.hours?.dateIso, previous.end, visit.start)
      day.longWalks.push({ minutes, from: fromLunch ? 'la comida' : previous.place.name, to: visit.place.name, uphill: Boolean(place?.uphill), how: runs ? (visit.place.transitHow ?? place?.uphill?.transit ?? null) : 'taxi', taxiOnly: !runs })
    }
  }

  // Avisos de la campana que no son «Quedó fuera» (3-oct-2026): llegar tarde a una entrada reservada (los 30 min de antes no caben ni recortando lo de antes) y la
  // Lo único que se avisa es la reserva del viajero con el sitio cerrado («Ese día {lugar} cierra a las {hora}»), REGLAS_RUTAS 2.
  problems.push(...problemsEscrito)
  const dayNotices = []
  for (const problem of problems) {
    if (problem.tipo === 'reserva_cerrada' && problem.cierre && !dayNotices.some((item) => item.dayNumber === problem.dayNumber && item.name === problem.lugar)) {
      dayNotices.push({ dayNumber: problem.dayNumber, name: problem.lugar, reason: `Ese día ${problem.lugar} cierra a las ${problem.cierre}`, suggestion: 'Elige otra hora o otro día para tu entrada' })
    }
  }
  const seenAtNight = new Set([...nightsByDay.values()].flat().flatMap((entry) => [...(entry.conflicts_with ?? []), ...(entry.muestra ?? []).map((id) => placeNameById.get(id)).filter(Boolean)])) // (REGLAS_RUTAS 5 y 39: lo que enseña una nocturna cuenta como visto)
  const closedAllTrip = (name) => cityPlanned.length > 0 && cityPlanned.every((day) => closedThatDay(name, day))
  const unplacedEssentials = (destData.places ?? [])
    .filter((place) => place.level === 1 && !seen.has(place.name) && !tourCovers.has(place.name) && !seenAtNight.has(place.name))
    .map((place) => ({ unitId: place.name, name: place.name, reason: closedAllTrip(place.name) ? 'closed_every_day' : insideAllowed && !insideAllowed.has(place.name) && !hasOutsideView(place.name) ? 'short_trip_no_outside_view' : 'no_room', closedOn: place.closed_on ?? [] }))
  // El pool contra un imprescindible de pago (REGLAS_RUTAS 3, 4-oct-2026), cuando no caben los dos por dentro:
  //   - si el imprescindible se ve bien por fuera (el Coliseo), entra el extra y el imprescindible va por fuera: no se hace nada;
  //   - si por fuera no vale (los Museos Vaticanos), el imprescindible se queda por dentro y el extra va a «No incluido»;
  //   - las joyas nunca se pierden (por fuera, como mínimo). Sin avisos: el viajero lo cambia con «Quiero entrar» o desde «No incluido».
  const poolKeysOf = (dayList) => [...new Set(dayList.flatMap((day) => (day.curatedDay.variantes ?? []).filter((label) => label.startsWith('pool:')).map((label) => `${day.curatedDay.id}:${label.slice(5)}`)))]
  const lostForGood = (list) => list.filter((item) => item.reason === 'no_room' && placeByName.get(item.name)?.level === 1 && (placeByName.get(item.name)?.ticket_info ?? []).some((line) => /de pago/i.test(line)) && !hasOutsideView(item.name))
  const clashes = poolKeysOf(cityPlanned).filter((key) => !blockedPoolSites.includes(key))
  if (clashes.length > 0 && lostForGood(unplacedEssentials).length > 0 && blockedPoolSites.length < 8) {
    const again = planWrittenTrip({ ...args, blockedPoolSites: [...blockedPoolSites, ...clashes] })
    if (again && lostForGood(again.unplacedEssentials ?? []).length < lostForGood(unplacedEssentials).length) return again
  }
  const tourDay = hasFreeTour ? cityPlanned.find((day) => day.schedule.visits.some((visit) => visit.place.isFreeTour))?.dayNumber ?? 1 : null

  return {
    mode,
    engine: 'v4',
    days,
    curated: true,
    written: true,
    nightsByDay,
    joyaNames: [...joyaNames],
    pinnedMornings: [],
    rescueDetours: {},
    notEnoughTime: notEnoughTime.filter((item) => !seen.has(item.name)),
    coreDays: destData.destination_config?.core_days ?? null,
    placedDay: new Map(),
    unplacedPool,
    unplacedEssentials,
    quotaMisses: [],
    experienceRange: null,
    experienceCounts: {},
    coveredByFreeTour: hasFreeTour ? [{ unitId: tour?.name, names: [...tourCovers], dayNumber: tourDay }] : [],
    movedForJoya: [],
    blockSummary: cityPlanned.map((day) => ({ dayNumber: day.dayNumber, morning: day.curatedDay.id, afternoon: day.curatedDay.id, lateDinner: false })),
    untypedHalves: 0,
    calendar: { hasDates: calendar.hasDates, month: calendar.month, season: calendar.season, referenceIso: calendar.referenceIso },
    dateMoves,
    problems,
    dayNotices,
    // Para las pruebas: dónde quedó el Free Tour añadido después y, si no quedó en ningún día, por qué.
    ...(ftKey ? { freeTourInfo: { franja: ftFranja, hora: freeTourDespues?.hora ?? null, dayId: ftDayIndex >= 0 ? order[ftDayIndex] : null, order: [...order], motivo: ftDayIndex >= 0 ? null : order.some((id) => written.days[id].variantes?.[ftKey]) ? ftWhy.join('; ') : `ningún día del viaje (${order.join(', ')}) trae el tramo escrito de un tour de ${ftFranja}` } } : {}),
  }
}

/** «Trastevere y Piazza Navona de noche»: el nombre de una nocturna hecha de varios lugares. */
function nightNameOf(chain) {
  const bases = [...new Set(chain.map((entry) => String(entry.name).replace(/\s*\(noche\)$/, '').replace(/\s+de noche$/, '').replace(/^Piazza /, '')))]
  return bases.length > 0 ? `${joinSpanish(bases)} de noche` : 'Paseo nocturno'
}
