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
import { recommendedRestaurant } from './dinnerZones.js'
import { MODE_V3 } from './modes.js'
import { tripCalendar } from './tripCalendar.js'
import { closedOnDay, effectiveSchedule, lastEntryMinutes, matchesDateRange, matchesDateToken, parseHoursSessions } from './openingHours.js'
import { specialHoursToAvoid } from './specialDates.js'
import { anyTransitRuns, publicTransitKind, transitRuns } from './holidayTransit.js'
import { sunsetFor } from './sunset.js'
import { tripDays } from './tripSkeleton.js'
import { availableForTrip, seasonFit } from './availability.js' // eslint-disable-line no-unused-vars
import { joinSpanish } from './whyTexts.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'
import { isStreet } from './localRules.js'
import { paseoMaxOf } from './curatedTrip.js'

const OUTSIDE_REASONS = { cerrado: 'Hoy cierra', ya_cerrado: 'A esta hora ya ha cerrado', no_abre: 'A esta hora no abre', no_cabe: 'Hoy lo ves por fuera para llegar a todo lo del día' }
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
const SUNSET_STAY = 15
const SUNSET_STAY_EXTRA = 30 // si la cena espera, el mirador se alarga hasta 30 min más
/** A la entrada con turno se llega 10 min antes (recoger la entrada). */
const TICKET_MARGIN = 10
/** Si una parada abre dentro de estos minutos, se espera; si no, cuenta como cerrada a esa hora. */
const OPEN_WAIT_MAX = 20
const OPEN_WAIT_MAX_POOL = 45 // lo que el viajero ha elegido se espera más antes que verlo por fuera (las Termas de Caracalla el 1 de enero, que abren a las 9:30)
const PASS_THROUGH_MINUTES = 10
const OUTSIDE_MINUTES = 15
const LUNCH_EARLIEST = 12 * 60 + 30
const LUNCH_MIN = 45
const LUNCH_DEFAULT = 60
const DINNER_MINUTES = 90
const DINNER_EARLIEST = 19 * 60 + 30
const DINNER_EARLIEST_SUMMER = 20 * 60 + 30
const BREAKFAST_AFTER_BEFORE = 9 * 60 + 30 // el desayuno va después de una visita con hora hasta esta hora (Trevi a las 8:30)

const LUNCH_MAX_COMPLETO = 90 // en completo, 90
const REST_AFTER_LUNCH_MAX = 60 // en completo, el descanso después de comer, como mucho
const DINNER_WALK_MAX = 15 // y la de la cena, igual
const LUNCH_WALK_MAX = 15 // el restaurante de la comida, a 15 min andando como mucho de la parada de antes
const HALF_DAY_AFTERNOON = 16 * 60
const TRANSFER_NOTICE_MINUTES = 25
const NIGHT_FALLBACK_METERS = 1200
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
  const { destData, written, totalDays, hasFreeTour = false, poolNames = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel, insideNames = [], forceOrder = null, blockedPoolSites = [] } = args
  if (!written?.days) return null
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  const mode = MODE_V3
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const selected = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const inPool = (name) => poolNames.includes(name)
  const tour = destData.default_free_tour ?? null
  const tourCovers = new Set(hasFreeTour ? tour?.covers ?? [] : [])
  const joyaNames = new Set((destData.places ?? []).filter((place) => place.tier === 'joya').map((place) => place.name))
  const cuts = written.destino?.cortes_luz ?? DEFAULT_CUTS
  const skeleton = tripDays({ destData, totalDays, hasFreeTour, dateRangeStartIso })
  const contentDays = skeleton.length
  const cityDays = skeleton.filter((day) => !day.isBlank && !day.isExcursion)
  const earlyLimit = Math.min(3, Math.max(1, cityDays.length - 1))

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
  const dateSuggestionOf = (day) => {
    const iso = realDateIso(day)
    if (!iso) return null
    for (const entry of destData.fechas_especiales?.fechas ?? []) {
      const sug = entry.sugerencia
      if (!sug?.lugar || !sug.hora) continue
      if (sug.dia ? iso.slice(5) !== sug.dia : !matchesDateRange(entry.fecha, entry.hasta, iso)) continue
      return { entry, sug, night: sug.lugar.endsWith('(noche)') }
    }
    return null
  }

  // ── 1. Qué días van: la tabla del destino por días de ciudad ────────────────────────────────
  const sinGaleria = !inPool('Galería Borghese') && !selected.includes('arte_museos')
  const routeTable = destData.curated_routes?.por_dias_ciudad ?? {}
  const keys = Object.keys(routeTable).map(Number).sort((a, b) => a - b)
  const key = keys.filter((k) => k <= cityDays.length).at(-1)
  const row = key != null ? routeTable[String(key)]?.[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] ?? [] : []
  const chosen = row.map((item) => (typeof item === 'string' ? item : sinGaleria && contentDays < 4 ? item.sin_galeria : item.con_galeria)).slice(0, cityDays.length)
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
    if (rule.fecha) return Boolean(realDateIso(day)) && realDateIso(day).slice(5) === rule.fecha
    if (rule.dia_semana) return Boolean(hoursOf(day).weekday) && norm(hoursOf(day).weekday) === norm(rule.dia_semana) && (!rule.si_lleva || carries(w, rule.si_lleva))
    return false
  })
  const violates = (w, day) => violatesRules(w, day) || (carriesTour(w) && noTourOn(day))
  const avoids = (w, day) => (w.no_en ?? []).some((rule) => rule.evitar && rule.dia_semana && Boolean(hoursOf(day).weekday) && norm(hoursOf(day).weekday) === norm(rule.dia_semana) && (!rule.invierno || isWinter(day)))
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
        return cost
      }))
    }
    let best = null
    for (const candidate of permutations(chosen)) {
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
      if (target === 'nombre' || target === 'noche' || target === 'barrio_cena') {
        draft[target] = op
        continue
      }
      if (target === 'manana') {
        draft.manana = applyListOp(draft.manana, op)
        if (op.comida) draft.comida = { ...draft.comida, ...op.comida }
        if (op.restaurante?.comida) draft.comida = { ...draft.comida, restaurante: op.restaurante.comida, alternativa: op.restaurante.alternativa ?? draft.comida?.alternativa }
        if (op.empieza) draft.manana_empieza = op.empieza
        continue
      }
      const match = /^tarde(?:\.(\*|[A-D]))?$/.exec(target)
      if (!match) continue
      if (match[1] && match[1] !== '*' && match[1] !== draft.version) continue
      draft.tarde = applyListOp(draft.tarde, op)
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

  const makeDraft = (id, index, version) => {
    const w = written.days[id]
    const day = cityDays[index]
    const hours = hoursOf(day)
    const tardeVersion = versionOf(w.tarde, version) ?? {}
    const draft = {
      id,
      day,
      version,
      nombre: w.nombre,
      noche: w.noche ?? null,
      barrio_cena: w.barrio_cena ?? null,
      manana: clone(w.manana?.paradas ?? []),
      comida: clone(w.manana?.comida ?? null),
      tarde: clone(tardeVersion.paradas ?? []),
      empieza: tardeVersion.empieza ?? w.tarde?.empieza ?? null,
      cena: clone(tardeVersion.cena ?? w.tarde?.cena ?? null),
      applied: [version],
      suggestions: [],
      index,
      poolOps: [],
      poolInside: [],
    }
    const variants = w.variantes ?? {}
    if (hasFreeTour && variants.con_free_tour) applyOps(draft, variants.con_free_tour, 'con_free_tour')
    const weekdayKey = hours.weekday && calendar.hasDates ? norm(hours.weekday) : null
    if (weekdayKey && variants[weekdayKey]) applyOps(draft, variants[weekdayKey], weekdayKey)
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
    for (const [key, ops] of Object.entries(variants)) if (key.startsWith('fecha:') && calendar.hasDates && dateKeyMatches(key, hours.dateIso)) applyOps(draft, ops, key)
    // (`si_disponible`: lo escrito para una experiencia solo vale los días en que ese lugar está en fechas, sin margen: la
    // cena junto a Piazza Navona solo si esa noche hay mercadillo.)
    const inDates = (name) => {
      const fit = seasonFit(placeByName.get(name)?.available, calendar, hours.dateIso)
      return fit.enters && !fit.notice
    }
    for (const exp of selected) if (w.experiencias?.[exp] && (!w.experiencias[exp].si_disponible || inDates(w.experiencias[exp].si_disponible))) applyOps(draft, w.experiencias[exp], exp)
    // Lo que depende del viaje: `no_si_dia` (la Isla Tiberina en D5 si el viaje ya lleva D1-FT) y `desde_dias` (solo en
    // viajes de tantos días o más).
    // (`sol_desde` / `sol_hasta`: la parada va solo si el sol se pone a partir de / antes de esa hora; una versión abarca una hora de sol.)
    const bySun = (stop) => hours.sunset == null || (!(stop.sol_desde && hours.sunset < toMin(stop.sol_desde)) && !(stop.sol_hasta && hours.sunset >= toMin(stop.sol_hasta)))
    // (`meses` / `no_meses`: la parada va solo esos meses, o todos menos esos (1-12). El descanso largo de después de comer
    // es cosa del verano: de junio a agosto. Sin fechas, el mes del viaje.)
    const monthOfDay = hours.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : Number.isInteger(calendar.month) ? calendar.month + 1 : null
    const byMonth = (stop) => !(stop.meses && !(monthOfDay != null && stop.meses.includes(monthOfDay))) && !(stop.no_meses && monthOfDay != null && stop.no_meses.includes(monthOfDay))
    const keep = (stop) => byMonth(stop) && bySun(stop) && !(stop.no_si_dia ?? []).some((other) => order.includes(other)) && !(stop.si_dia && !stop.si_dia.some((other) => order.includes(other))) && !(stop.desde_dias && contentDays < stop.desde_dias)
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
    return draft
  }
  const drafts = order.map((id, index) => makeDraft(id, index, lightVersionOf(hoursOf(cityDays[index]).sunset, cuts)))
  /** Lo que ya va en la ruta y está en el pool: por dentro y no opcional. */
  const forceInside = (draft, name) => {
    for (const list of [draft.manana, draft.tarde]) for (const stop of list) if (stop.lugar === name && (stop.modo === 'fuera' || stop.tipo === 'opcional')) {
      if (stop.modo === 'fuera') stop.modo = 'dentro'
      if (stop.tipo === 'opcional') stop.tipo = 'normal'
    }
  }

  // El pool: cada lugar elegido en su sitio escrito (el primero cuyo día está en el viaje y cuyo hueco no ha cogido
  // otro antes; manda el orden de `pool_lista`). Lo que ya está en la ruta queda garantizado por dentro.
  const unplacedPool = []
  const poolOrder = destData.pool_lista?.lugares ?? []
  const orderedPool = [...poolNames].sort((a, b) => (poolOrder.indexOf(a) < 0 ? 999 : poolOrder.indexOf(a)) - (poolOrder.indexOf(b) < 0 ? 999 : poolOrder.indexOf(b)))
  const takenHoles = new Set()
  // Lo que ya va en la ruta no cuenta como elección; los extras, hasta el límite por días (2 días, 2; 3, 3; 4, 4;
  // 5 o más, 5), en el orden de `pool_lista`.
  const extrasLimit = poolExtrasLimit(contentDays)
  let extrasUsed = 0
  for (const name of orderedPool) {
    const already = drafts.find((draft) => [...draft.manana, ...draft.tarde].some((stop) => stop.lugar === name && stop.modo !== 'camino'))
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
    const sites = written.destino?.pool?.[name]?.sitios ?? []
    // (Nunca en un día en que ese lugar cierra: pasa a su siguiente sitio.)
    const siteDraft = (candidate) => drafts.find((draft) => draft.id === candidate.dia)
    const site = sites.find((candidate) => siteDraft(candidate) && !closedThatDay(name, siteDraft(candidate).day) && !(candidate.hueco && takenHoles.has(`${candidate.dia}:${candidate.hueco}`)) && !blockedPoolSites.includes(`${candidate.dia}:${name}`)) ?? sites.find((candidate) => siteDraft(candidate) && !(candidate.hueco && takenHoles.has(`${candidate.dia}:${candidate.hueco}`)) && !blockedPoolSites.includes(`${candidate.dia}:${name}`))
    if (!site) {
      unplacedPool.push({ unitId: name, name, reason: sites.length === 0 ? 'no_room' : 'no_room_day', dayNumber: null })
      continue
    }
    const draft = drafts.find((candidate) => candidate.id === site.dia)
    if (site.hueco) takenHoles.add(`${site.dia}:${site.hueco}`)
    applyOps(draft, site.cambios, `pool:${name}`)
    draft.poolOps.push([site.cambios, `pool:${name}`])
  }
  const finishDraft = (draft) => {
    // "Quiero entrar": lo que el viajero pide ver por dentro.
    for (const stop of [...draft.manana, ...draft.tarde]) if (insideNames.includes(stop.lugar) && stop.modo === 'fuera') stop.modo = 'dentro'
  }
  for (const draft of drafts) finishDraft(draft)
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

  /** El lugar listo para el formato, según cómo sale (`modo`) y por qué va por fuera si va. */
  function readyPlace(stop, source, outsideReason, hours) {
    const modo = stop.modo ?? 'parada'
    let ready = { ...source }
    if (outsideReason || modo === 'fuera') {
      const reason = outsideReason ?? OUTSIDE_REASONS.no_cabe
      ready = {
        ...source,
        visitOutside: true,
        outsideReason: reason,
        outsideKind: Object.keys(OUTSIDE_REASONS).find((k) => OUTSIDE_REASONS[k] === reason) ?? (reason.startsWith('Todavía') ? 'no_abre' : 'no_cabe'),
        coordinates: source.pass_by?.coordinates ?? source.coordinates,
        duration_minutes: stop.min_fuera ?? source.minutos_fuera ?? OUTSIDE_MINUTES,
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
      if (modo === 'atardecer' && hours.sunset != null) ready = { ...ready, sunset: hours.sunset, ...(stop.lead ? { sunsetLead: stop.lead } : {}) }
    }
    // (Una calle que lo escrito pone como parada, «Via Margutta y Via del Babuino», es parada, no "de camino".)
    if (stop.no_calle || (modo !== 'camino' && isStreet(source))) ready.notStreet = true
    if (stop.traslado?.min) ready = { ...ready, transitMinutes: stop.traslado.min, ...(stop.traslado.como ? { transitHow: stop.traslado.como } : {}) }
    if (stop.aviso) ready.stopNotice = stop.aviso
    if (Array.isArray(source.salida) && !ready.visitOutside && !ready.passThrough) ready.end_coordinates = source.salida
    // (El texto escrito en la parada; si no, el de los días curados; si no, el del destino: `_destino.json` → `textos`.)
    const why = stop.texto ?? curatedWhyOf(stop.lugar) ?? written.destino?.textos?.[stop.lugar] ?? null
    if (why) ready.curatedWhy = why
    const [scheduled] = placesForScheduler({ id: stop.lugar, places: [ready] }, destData, null)
    return scheduled
  }

  /** ¿Está abierto de `start` a `start + duration`? { ok } | { wait: minutos hasta que abre } | { closed, opensAt } */
  function openCheck(place, start, duration, hours) {
    if (place.isFreeTour || place.isBreak || place.visitOutside || place.passThrough || place.type === 'exterior' && !place.schedule && !place.windows && !place.by_day && !place.by_period && !place.by_season) return { ok: true }
    const sessions = parseHoursSessions(effectiveSchedule(place, hours)).sort((a, b) => a.open - b.open)
    if (sessions.length === 0) return { ok: true }
    const last = lastEntryMinutes(place, start, hours)
    const inside = sessions.find((session) => start >= session.open && start + duration <= session.close)
    if (inside && (last == null || start <= last)) return { ok: true }
    const next = sessions.find((session) => session.open > start)
    if (next && next.open - start <= (inPool(place.name) ? OPEN_WAIT_MAX_POOL : OPEN_WAIT_MAX) && next.open + duration <= next.close) return { wait: next.open - start }
    return { closed: true, opensAt: next?.open ?? null }
  }

  const walkLeg = (from, to) => (Array.isArray(from) && Array.isArray(to) ? Math.round(travel.leg(from, to)?.minutes ?? 0) : 0)

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
  function runList(list, slot, cursor, ctx, elasticDelta = 0) {
    const visits = []
    const units = []
    let { t, coords } = cursor
    let carry = null
    list.forEach((original, index) => {
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
      if (source.isBreak) {
        const previousHour = index > 0 ? hourOf(list[index - 1]) : null
        const nextHour = index + 1 < list.length ? hourOf(list[index + 1]) : null
        const afterEarly = previousHour != null && previousHour <= BREAKFAST_AFTER_BEFORE
        if (!(afterEarly || nextHour != null)) return
      }
      if (stop.si_no_visto && seenInside.has(stop.lugar)) return
      if (stop.si_visto && !seenInside.has(stop.si_visto)) return
      let outsideReason = null
      // Cerrado ese día: lo escrito (por fuera, o el cambio por otra parada); si no hay nada escrito, por fuera si se
      // ve desde fuera y, si no, fuera del día (y la prueba lo marca).
      if (!source.isFreeTour && !source.isBreak && stop.modo !== 'camino' && closedThatDay(stop.lugar, ctx.day)) {
        const rule = stop.si_cerrado
        if (rule === 'quitar') return
        if (rule?.cambiar_por) {
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
      if (!outsideReason && stop.modo === 'fuera' && !source.isFreeTour) {
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
      const fixed = hourOf(stop)
      if (fixed != null) {
        // (A la entrada con turno se llega 10 min antes: `turno` en lo escrito, los turnos de la ficha o el Free Tour.)
        const needed = fixed - (stop.turno || source.turnos || source.isFreeTour ? TICKET_MARGIN : 0)
        if (at > needed + 2) ctx.problems.push({ tipo: 'llega_tarde', lugar: stop.lugar, llega: toHHMM(at), hora: toHHMM(fixed) })
        at = Math.max(at, fixed)
      }
      let duration = place.duration_minutes ?? 30
      if (original.elastica != null && elasticDelta) duration = Math.max(shrinkFloor(stop, duration), duration + elasticDelta)
      // (Un barrio escrito por debajo de su mínimo, o una elástica que no llega: la prueba lo marca.)
      if (!ctx.probe && !place.visitOutside && !place.passThrough && place.sunset == null && duration < shrinkFloor(stop, stop.min ?? source.duration_minutes ?? duration, true)) ctx.problems.push({ tipo: 'parada_corta', lugar: stop.lugar, minutos: duration })
      // El mirador: se llega a su hora (el sol menos 25 min) y se queda hasta 15 min después del sol.
      if (place.sunset != null) {
        const target = place.sunset - (place.sunsetLead ?? SUNSET_LEAD) - (ctx.earlyBy ?? 0)
        ctx.sunsetArrival = at
        if (at < target) at = target
        if (at > place.sunset) place = { ...place, sunset: undefined, nightView: true }
        else duration = Math.max(20, place.sunset + SUNSET_STAY - at)
      }
      // (El tramo en bus o taxi de antes de llegar se queda aunque la parada cambie aquí a "por fuera" o por otra: si no, la hora
      // contaba el taxi y la pantalla pintaba 33 min andando, de San Pedro a Santa Cecilia en Navidad. PROMPT_TEXTOS_RITMO 7.)
      const arrivalTransit = place.transitMinutes ? { transitMinutes: place.transitMinutes, transitHow: place.transitHow } : null
      if (!place.visitOutside && !place.passThrough) {
        const check = openCheck(place, at, duration, ctx.hours)
        if (check.wait) at += check.wait
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
      const unitId = `${ctx.id}:${stop.lugar}${units.some((unit) => unit.id === `${ctx.id}:${stop.lugar}`) ? `#${index}` : ''}`
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
      visits.push({ unitId, place, start: at, end: at + duration, chained: false, walkMinutes: leg, walkSource: 'matrix', ...(stop.entrada ? { ticket: true } : {}), ...(fixed != null ? { fixedAt: fixed } : {}) })
      t = at + duration
      coords = place.end_coordinates ?? place.coordinates
      if (!ctx.probe) {
        seen.add(source.name)
        if (!seenDay.has(source.name)) seenDay.set(source.name, ctx.day.dayNumber)
        if (!place.visitOutside && !place.passThrough) seenInside.add(source.name)
        for (const name of place.outsideOf ?? []) seen.add(name)
      }
    })
    return { visits, units, cursor: { t, coords } }
  }

  /** El día empieza a la hora de su primera parada fija, si la trae (el Coliseo a las 8:30). */
  function morningStartOf(draft) {
    const firstFixed = draft.manana[0] ? hourOf(draft.manana[0]) : null
    if (draft.manana_empieza) return toMin(draft.manana_empieza)
    if (firstFixed == null) return mode.dayStart
    return firstFixed - (draft.manana[0].turno || draft.manana[0].lugar === tour?.name || placeByName.get(draft.manana[0].lugar)?.turnos ? TICKET_MARGIN : 0)
  }
  /** La comida: el restaurante escrito o su alternativa (si cierra ese día o ya salió en el viaje), de cuándo a cuándo. */
  function lunchOf(draft, cursor, skeletonDay, hours) {
    const pick = (names) => recommendedRestaurant(destData, { names, meal: 'comida', near: cursor.coords, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: usedRestaurants })
    // (El escrito o su alternativa, si están a LUNCH_WALK_MAX min andando de la parada de antes; si no, el más cercano.)
    const writtenSpots = [draft.comida.restaurante, draft.comida.alternativa].filter(Boolean).map((name) => pick([name])).filter(Boolean)
    const spot = writtenSpots.find((candidate) => walkLeg(cursor.coords, candidate.coordinates) <= LUNCH_WALK_MAX) ?? pick(null) ?? writtenSpots[0] ?? null
    const walk = spot ? walkLeg(cursor.coords, spot.coordinates) : 5
    // (En un cuarto de hora exacto, como la cena: la app pinta las comidas redondeadas.)
    const start = Math.max(roundUp15(cursor.t + walk), LUNCH_EARLIEST)
    const written = draft.empieza ? toMin(draft.empieza) : null
    let end = written != null ? written : start + LUNCH_DEFAULT
    // (La comida dura como mucho 90 min, aunque lo escrito empiece la tarde más tarde: lo demás es tarde.)
    end = Math.min(end, start + LUNCH_MAX_COMPLETO)
    let short = null
    if (end - start < LUNCH_MIN) {
      short = end - start
      end = start + LUNCH_MIN
    }
    return { spot, start, end, short }
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

  const days = []
  const cityPlanned = []
  for (const skeletonDay of skeleton) {
    const index = cityDays.indexOf(skeletonDay)
    if (index < 0) {
      days.push({ ...skeletonDay, units: [], schedule: null })
      continue
    }
    const hours = hoursOf(skeletonDay)
    const half = Boolean(skeletonDay.halfDayExcursion)
    let draft = drafts[index]
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
    const ctx = { id: draft.id, day: skeletonDay, hours, problems: [], sunsetArrival: null }
    const startMorning = morningStartOf(draft)
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
      let missing = short != null && !afternoonFixed ? LUNCH_MIN - short : 0
      while (missing > 0) {
        const at = lastOptional(draft.tarde)
        if (at < 0) break
        const stop = draft.tarde[at]
        missing -= (stop.min ?? placeByName.get(stop.lugar)?.duration_minutes ?? 15) + 5
        draft.applied.push(`comida:sin ${stop.lugar}`)
        draft.tarde = withoutAt(draft.tarde, at)
      }
    }
    const morning = half ? { visits: [], units: [], cursor: { t: HALF_DAY_AFTERNOON, coords: null } } : runList(draft.manana, 'manana', { t: startMorning, coords: null }, ctx)
    // La comida: el restaurante escrito o su alternativa (si cierra ese día o ya salió en el viaje).
    const meals = []
    let afterLunch = morning.cursor
    let lunchName = null
    if (!half && draft.comida) {
      const { spot, start, end, short } = lunchOf(draft, morning.cursor, skeletonDay, hours)
      // (La comida ya dura LUNCH_MIN; la tarde empieza más tarde y lo absorbe la elástica. Solo es un problema si no hay
      // elástica que lo absorba: entonces la tarde va con retraso.)
      if (short != null && !draft.tarde.some((stop) => stop.elastica != null)) ctx.problems.push({ tipo: 'comida_corta', minutos: short })
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
      const room = lunchMeal ? lunchMeal.end - lunchMeal.start - LUNCH_MIN : 0
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
      if (spare > 20) {
        restAfterLunch = Math.floor(Math.min(spare, REST_AFTER_LUNCH_MAX) / 5) * 5
        afterLunch = { ...afterLunch, t: afterLunch.t + restAfterLunch }
        elasticWanted -= restAfterLunch
      }
    }
    const early = elasticWanted - elasticUsed
    // (Solo en un mirador: una avenida al atardecer, los Foros, tiene su máximo.)
    const sunsetIsMirador = sunsetStop && (placeByName.get(sunsetStop.lugar)?.tags ?? []).includes('mirador')
    ctx.earlyBy = early >= 5 && sunsetIsMirador ? Math.min(LEAD_FLEX, early) : 0
    const afternoon = runList(draft.tarde, 'tarde', afterLunch, ctx, elasticUsed)
    const visits = [...morning.visits, ...afternoon.visits]
    const units = [...morning.units, ...afternoon.units]
    // La cena: su restaurante y su hora escritas (la hora es la de antes; si se llega más tarde, cuando se llega).
    const last = afternoon.cursor
    const pickDinner = (names) => recommendedRestaurant(destData, { names, meal: 'cena', near: last.coords, weekday: hours.weekday, dateIso: realDateIso(skeletonDay), exclude: usedRestaurants })
    // La cena, como la comida, a 15 min andando como mucho de lo último (PROMPT_ROMA_V4_REPASO 10: Trattoria Monti a 20 min
    // de los Foros): la escrita o su alternativa si están a 15; si no, la más cercana; y si ninguna, la escrita.
    const writtenDinners = [pickDinner([draft.cena?.restaurante].filter(Boolean)), pickDinner([draft.cena?.alternativa].filter(Boolean))].filter(Boolean)
    const nearDinner = (spot) => spot && walkLeg(last.coords, spot.coordinates) <= DINNER_WALK_MAX
    const nearestDinner = pickDinner(null)
    const dinnerRestaurant = writtenDinners.find(nearDinner) ?? (nearDinner(nearestDinner) ? nearestDinner : null) ?? writtenDinners[0] ?? nearestDinner
    const dinnerWalk = dinnerRestaurant ? walkLeg(last.coords, dinnerRestaurant.coordinates) : 10
    let readyAt = last.t + dinnerWalk
    // Nunca antes de las 19:30 (ni de la hora escrita) y, en verano (versión D), nunca antes de las 20:30.
    const dinnerFloor = Math.max(DINNER_EARLIEST, draft.version === 'D' ? DINNER_EARLIEST_SUMMER : 0, draft.cena?.hora ? toMin(draft.cena.hora) : 0)
    const dinnerStart = Math.max(roundUp15(readyAt), dinnerFloor)
    // Si la cena espera y lo último es el mirador, se queda más en el mirador (hasta SUNSET_STAY_EXTRA min): las luces.
    const lastVisit = afternoon.visits.at(-1)
    // (Solo un mirador: una avenida o un paseo tienen su máximo. Desde 10 min de espera, y deja 5.)
    // (En C y D: en A y B ese rato es de la nocturna y de «luces y aperitivo».)
    if ((draft.version === 'C' || draft.version === 'D') && dinnerStart - readyAt > 10 && lastVisit?.place?.sunset != null && (lastVisit.place.tags ?? []).includes('mirador')) {
      const extra = Math.min(SUNSET_STAY_EXTRA, dinnerStart - readyAt - 5)
      lastVisit.end += extra
      readyAt += extra
    }
    meals.push({ type: 'dinner', start: dinnerStart, end: dinnerStart + DINNER_MINUTES, coordinates: dinnerRestaurant?.coordinates ?? last.coords, walkMinutes: dinnerWalk })
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
      curatedDay: { id: draft.id, nombre: draft.nombre, variantes: draft.applied, noche: draft.noche, version: draft.version },
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
  for (const day of cityPlanned) {
    const walk = walks[day.curatedDay.noche]
    if (!walk) continue
    const removedByDay = Object.entries(walk.quitar_si_va ?? {}).filter(([id]) => order.includes(id)).flatMap(([, names]) => names)
    const startOf = (name) => day.schedule.visits.find((visit) => visit.place.name === name)?.start ?? null
    const lateVisit = (entry) => (entry.conflicts_with ?? []).some((name) => {
      const start = startOf(name)
      return start != null && (start >= LATE_VISIT_MINUTES || (day.hours?.sunset != null && start >= day.hours.sunset))
    })
    const allowed = (entry, { strictReach = false } = {}) => {
      if (!entry || usedNights.has(entry.name)) return false
      const conflicts = entry.conflicts_with ?? []
      if (conflicts.some((name) => (timesSeen.get(name) ?? 0) >= 2 && !(walk.excepcion_mismo_dia && daysOfPlace.get(name)?.has(day.dayNumber) && timesSeen.get(name) === 2))) return false
      const sameDay = !entry.same_day_as_visit && conflicts.some((name) => daysOfPlace.get(name)?.has(day.dayNumber))
      if (sameDay && !shortTrip && !walk.excepcion_mismo_dia) return false
      if (sameDay && shortTrip && !walk.excepcion_mismo_dia && !lateVisit(entry)) return false
      if (strictReach && day.dinnerCoords && metersBetween(day.dinnerCoords, entry.coordinates) > NIGHT_FALLBACK_METERS) return false
      return true
    }
    const max = walk.maximo ?? 2
    let chain = walk.recorrido.filter((name) => !removedByDay.includes(name)).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
    let fromAlternative = false
    // (`sin_relevo`: esa noche no lleva paseo; el plan de la tarde ya es de noche, el mercadillo de Navona antes de cenar.)
    if (chain.length === 0 && !walk.sin_relevo) {
      chain = (walk.alternativas ?? []).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
      if (chain.length === 0) chain = [...catalogue.values()].filter((entry) => allowed(entry, { strictReach: true })).sort((a, b) => metersBetween(day.dinnerCoords, a.coordinates) - metersBetween(day.dinnerCoords, b.coordinates))
      fromAlternative = walk.recorrido.length > 0
    }
    chain = chain.slice(0, max).map((entry) => (entry.si_no && catalogue.get(entry.si_no) ? { ...entry, fallback: catalogue.get(entry.si_no) } : entry))
    if (chain.length === 0) continue
    for (const entry of chain) {
      usedNights.add(entry.name)
      for (const name of entry.conflicts_with ?? []) timesSeen.set(name, (timesSeen.get(name) ?? 0) + 1)
    }
    const sameAs = fromAlternative ? Object.values(walks).find((other) => other !== walk && Array.isArray(other.recorrido) && chain.every((entry) => other.recorrido.includes(entry.name))) : null
    const text = fromAlternative ? (sameAs ? walkText(sameAs, chain) : null) : walkText(walk, chain)
    nightsByDay.set(day.dayNumber, chain.map((entry) => ({ ...entry, wholeWalk: true, ...(walk.excepcion_mismo_dia ? { sameDayException: true } : {}), ...(fromAlternative && walk.alternativas_despues_de_cenar ? { afterDinnerOnly: true } : {}), ...(shortTrip && (entry.conflicts_with ?? []).some((name) => daysOfPlace.get(name)?.has(day.dayNumber)) && lateVisit(entry) ? { replacesDayVisit: true } : {}) })))
    day.nightWalk = { nombre: fromAlternative ? sameAs?.nombre ?? nightNameOf(chain) : walk.nombre, texto: text, textoAntesCenar: fromAlternative ? (sameAs ? walkText(sameAs, chain, true) : null) : walkText(walk, chain, true), recorrido: chain.map((entry) => entry.name), ...(!fromAlternative && walk.texto_despues_cenar ? { textoDespuesCenar: walk.texto_despues_cenar } : {}) }
  }
  for (const day of cityPlanned) {
    const suggestion = dateSuggestionOf(day)
    const entry = suggestion?.night ? catalogue.get(suggestion.sug.lugar) : null
    if (!entry) continue
    nightsByDay.set(day.dayNumber, [{ ...entry, wholeWalk: true, fixedStart: toMin(suggestion.sug.hora), dateNight: suggestion.entry.id }])
    day.nightWalk = { nombre: suggestion.sug.nombre ?? suggestion.entry.titulo ?? 'Paseo nocturno', texto: suggestion.sug.texto ?? null, recorrido: (nightsByDay.get(day.dayNumber) ?? []).map((item) => item.name) }
  }
  const centro = Object.values(walks).find((walk) => Array.isArray(walk.centro_dos_dias))
  if (shortTrip && centro) {
    const seenByDay = new Set(cityPlanned.flatMap((day) => day.schedule.visits.flatMap((visit) => [visit.place.name, ...(visit.place.outsideOf ?? [])])))
    const covered = new Set([...seenByDay, ...tourCovers])
    const missing = centro.centro_dos_dias.filter((name) => !covered.has(name))
    const needed = centro.solo_si_falta ? missing.some((name) => centro.solo_si_falta.includes(name)) : missing.length > 0
    const host = cityPlanned.find((day) => day.curatedDay.id === 'D1') ?? cityPlanned.find((day) => day.curatedDay.id !== 'D3') ?? cityPlanned[0]
    if (needed && host) {
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

  const seenAtNight = new Set([...nightsByDay.values()].flat().flatMap((entry) => entry.conflicts_with ?? []))
  const closedAllTrip = (name) => cityPlanned.length > 0 && cityPlanned.every((day) => closedThatDay(name, day))
  const unplacedEssentials = (destData.places ?? [])
    .filter((place) => place.level === 1 && !seen.has(place.name) && !tourCovers.has(place.name) && !seenAtNight.has(place.name))
    .map((place) => ({ unitId: place.name, name: place.name, reason: closedAllTrip(place.name) ? 'closed_every_day' : 'no_room', closedOn: place.closed_on ?? [] }))
  // Un extra del pool nunca le quita a un imprescindible de pago su visita por dentro (decisión del usuario, 2026-09-29): si
  // el día de un extra deja uno por fuera por la hora, el viaje se vuelve a montar con ese extra en su siguiente sitio
  // (y se queda así solo si mejora).
  const lostInside = (dayList) => dayList.flatMap((day) => (day.schedule?.visits ?? []).filter((visit) => visit.ticket && placeByName.get(visit.place.name)?.level === 1 && visit.place.visitOutside && visit.place.outsideKind !== 'cerrado').map(() => day))
  const clashes = [...new Set(lostInside(cityPlanned).flatMap((day) => (day.curatedDay.variantes ?? []).filter((label) => label.startsWith('pool:')).map((label) => `${day.curatedDay.id}:${label.slice(5)}`)))].filter((key) => !blockedPoolSites.includes(key))
  if (clashes.length > 0 && blockedPoolSites.length < 8) {
    const again = planWrittenTrip({ ...args, blockedPoolSites: [...blockedPoolSites, ...clashes] })
    if (again && lostInside(again.days.filter((day) => day.schedule)).length < lostInside(cityPlanned).length) return again
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
  }
}

/** «Trastevere y Piazza Navona de noche»: el nombre de una nocturna hecha de varios lugares. */
function nightNameOf(chain) {
  const bases = [...new Set(chain.map((entry) => String(entry.name).replace(/\s*\(noche\)$/, '').replace(/\s+de noche$/, '').replace(/^Piazza /, '')))]
  return bases.length > 0 ? `${joinSpanish(bases)} de noche` : 'Paseo nocturno'
}
