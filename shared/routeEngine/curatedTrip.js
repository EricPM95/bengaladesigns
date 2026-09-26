/**
 * Días curados (docs/DIAS_CURADOS_ROMA.md, 2026-09-26): el viaje se hace con días enteros pensados de principio
 * a fin (`curated_days` del JSON del destino), no con mañanas y tardes sueltas. El motor:
 *
 *   1. ELIGE qué días van (`curated_selection`: por días de ciudad, Free Tour, experiencia y pool);
 *   2. los ORDENA (cierres de cada día, `no_en`; las joyas lo antes posible; el orden por defecto);
 *   3. aplica la VARIANTE que toca (invierno, tranquilo, día de la semana, Free Tour, pool) sin inventar otra;
 *   4. quita lo que no toca (`solo`: ritmo, experiencia, pool, días; el tope de museos de pago 💶);
 *   5. calcula las HORAS con el programador de siempre (aperturas, cierres, comida, atardecer, cena) y hace
 *      los ajustes que dice el documento: saltar lo cerrado, lo imprescindible cerrado por fuera con su aviso,
 *      el mirador que llega de noche como vistas de Roma iluminada y el madrugón solo por un nivel 1;
 *   6. pone el lugar del pool que ningún día trae (regla general) y el PASEO NOCTURNO curado de cada día.
 *
 * Devuelve lo mismo que planBlockTrip (días con unidades y horas), para que el servidor no cambie. Puro.
 */

import { placesForScheduler } from './planTrip.js'
import { PRIORITY, scheduleFixedOrder } from './scheduleDay.js'
import { dinnerZones } from './dinnerZones.js'
import { MODES_V3, modeV3For } from './modes.js'
import { tripCalendar } from './tripCalendar.js'
import { closedOnDay } from './openingHours.js'
import { sunsetFor } from './sunset.js'
import { tripDays } from './tripSkeleton.js'
import { availableForTrip } from './availability.js'
import { lunchSpots } from './lunchSpots.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'

/** Lo que dura pasar por un sitio "de paso". */
const PASS_THROUGH_MINUTES = 10
/** Un imprescindible visto por fuera, si su `pass_by` no dice otra cosa. */
const OUTSIDE_MINUTES = 15
/** Con el atardecer antes de esta hora el día va en su variante de invierno (el documento: "hacia las 17:00"). */
const WINTER_SUNSET_BEFORE = 18 * 60
/** Un mirador del atardecer que llega más tarde que esto después de la puesta de sol ya es de noche. */
const MIRADOR_LATE_MINUTES = 30
/** Madrugar lo justo: de media en media hora. */
const WAKE_EARLY_STEP = 30
/** Comida acortada para no perder un imprescindible (D3 tranquilo: 75 min con aviso). */
const SHORT_LUNCH_MINUTES = 60
const SHORT_LUNCH_BLOCK_MINUTES = 75
/** Traslado a partir del cual el día lo avisa. */
const TRANSFER_NOTICE_MINUTES = 25
/** Una nocturna de sustitución (la de la lista ya salió): a esto de la cena como mucho. */
const NIGHT_FALLBACK_METERS = 1200
/** En 1-2 días, la visita de día desde esta hora (o el atardecer) deja paso a su nocturna. */
const LATE_VISIT_MINUTES = 17 * 60
/** Qué se cae antes si el día no da (el más alto primero). */
const DROP_RANK = { joya: 1, pool: 2, parada: 3, atardecer: 3, de_paso: 5 }
const DROP_RANK_BY_LEVEL = { 3: 7, 2: 6, de_paso: 5.5 }
const CURATED_AFTERNOON_OFFSET = 100
const WEEKDAY_KEY = { lunes: 'lunes', martes: 'martes', 'miércoles': 'miercoles', miercoles: 'miercoles', jueves: 'jueves', viernes: 'viernes', 'sábado': 'sabado', sabado: 'sabado', domingo: 'domingo' }
const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Metros entre dos [lat, lng]. */
function metersBetween(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return Infinity
  const toRad = Math.PI / 180
  const x = (b[1] - a[1]) * toRad * Math.cos(((a[0] + b[0]) / 2) * toRad)
  const y = (b[0] - a[0]) * toRad
  return Math.sqrt(x * x + y * y) * 6371000
}

/** Todos los órdenes de una lista corta. */
function permutations(list) {
  if (list.length <= 1) return [list]
  return list.flatMap((item, index) => permutations([...list.slice(0, index), ...list.slice(index + 1)]).map((rest) => [item, ...rest]))
}

/**
 * @param {object} args  como planBlockTrip
 */
export function planCuratedTrip({ destData, totalDays, pace, hasFreeTour = false, poolNames = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel }) {
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  const mode = modeV3For(pace)
  const tranquilo = mode.id === 'tranquilo'
  const normalMode = { ...mode, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const curatedById = new Map((destData.curated_days ?? []).map((day) => [day.id, day]))
  const selected = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const inPool = (name) => poolNames.includes(name)
  const tour = destData.default_free_tour ?? null
  const tourCovers = new Set(hasFreeTour ? tour?.covers ?? [] : [])
  const joyaNames = new Set((destData.places ?? []).filter((place) => place.tier === 'joya').map((place) => place.name))
  const skeleton = tripDays({ destData, totalDays, hasFreeTour, dateRangeStartIso })
  const contentDays = skeleton.length
  const cityDays = skeleton.filter((day) => !day.isBlank && !day.isExcursion)
  const earlyLimit = Math.min(3, Math.max(1, cityDays.length - 1))

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
  const isWinter = (day) => {
    const sunset = hoursOf(day).sunset
    return sunset != null && sunset < WINTER_SUNSET_BEFORE
  }

  // ── 1. Qué días van ─────────────────────────────────────────────────────────────────────────
  const rules = destData.curated_selection ?? {}
  const poolRules = destData.curated_pool ?? {}
  const barriosSinArte = selected.includes('barrios_sabores') && !selected.includes('arte_museos')
  const list = [...(hasFreeTour ? rules.base?.con_free_tour ?? ['D3', 'D1-FT'] : rules.base?.sin_free_tour ?? ['D1', 'D2'])]
  const extraDayOf = (name) => {
    const rule = poolRules[name]
    return rule?.dia && (rule.min_dias_ciudad ?? 0) <= cityDays.length ? rule.dia : null
  }
  if (cityDays.length === 3) {
    // El tercer día: lo decide el pool (el primero que active D4 o D5) y, si no, la experiencia.
    const byPool = poolNames.map(extraDayOf).find((id) => id === 'D4' || id === 'D5')
    list.push(byPool ?? (barriosSinArte ? rules.tercer_dia?.barrios_sin_arte ?? 'D5' : rules.tercer_dia?.resto ?? 'D4'))
  } else if (cityDays.length >= 4) {
    list.push(...(barriosSinArte ? ['D5', 'D4'] : ['D4', 'D5']))
  }
  if (cityDays.length >= 5) list.push(rules.cinco_dias ?? 'D6')
  if (cityDays.length >= 6) list.push(rules.seis_dias ?? 'D7')
  // Lo del pool que activa un día que no ha entrado (las catacumbas en 5 días: D7), si hay sitio o en lugar del
  // último día opcional.
  for (const name of poolNames) {
    const id = extraDayOf(name)
    if (!id || list.includes(id) || !curatedById.has(id) || cityDays.length < 3) continue
    if (list.length < cityDays.length) list.push(id)
    else {
      const replaceable = [...list].reverse().find((other) => !['D1', 'D2', 'D3', 'D1-FT'].includes(other) && !poolNames.some((pool) => extraDayOf(pool) === other))
      if (replaceable) list.splice(list.indexOf(replaceable), 1, id)
    }
  }
  // Variantes de pool dentro de D1 (2 días, o el segundo lugar que no tiene día propio): una tarde como mucho.
  const poolVariants = new Map()
  for (const name of poolNames) {
    const rule = poolRules[name]
    if (!rule) continue
    const ownDay = extraDayOf(name)
    if (ownDay && list.includes(ownDay)) continue
    const variant = (!ownDay || !list.includes(ownDay)) && (rule.dos_dias || rule.antes) ? rule.dos_dias ?? rule.antes : null
    if (!variant || !list.includes('D1')) continue
    const current = poolVariants.get('D1') ?? []
    const variantDef = curatedById.get('D1')?.variantes?.[variant]
    // Solo una variante que cambie la tarde (la Borghese o Caracalla); San Clemente solo añade al principio.
    if (variantDef?.tarde && current.some((other) => curatedById.get('D1')?.variantes?.[other]?.tarde)) continue
    poolVariants.set('D1', [...current, variant])
  }
  // Si hay más días de ciudad que días elegidos (viajes largos), los que queden sin usar.
  for (const id of ['D4', 'D5', 'D6', 'D7']) if (list.length < cityDays.length && !list.includes(id) && curatedById.has(id)) list.push(id)
  const chosen = list.slice(0, cityDays.length)

  // ── 2. En qué orden ─────────────────────────────────────────────────────────────────────────
  // ¿Lleva el día este lugar en este viaje? (para `no_en` con `si_lleva`: D4 no en lunes si lleva la Galería).
  const carries = (cfg, name) => [...(cfg.manana ?? []), ...(cfg.tarde ?? [])].some((stop) => stop.lugar === name && stopApplies(stop, null))
  const violates = (cfg, day) => {
    const hours = hoursOf(day)
    return (cfg.no_en ?? []).some((rule) => {
      if (rule.fecha) return Boolean(hours.dateIso) && hours.dateIso.slice(5) === rule.fecha
      if (rule.dia_semana) return Boolean(hours.weekday) && norm(hours.weekday) === norm(rule.dia_semana) && (!rule.si_lleva || carries(cfg, rule.si_lleva))
      return false
    })
  }
  let order = chosen
  if (chosen.length > 1) {
    let best = null
    for (const candidate of permutations(chosen)) {
      let cost = 0
      candidate.forEach((id, index) => {
        const cfg = curatedById.get(id)
        const day = cityDays[index]
        if (violates(cfg, day)) cost += 1000
        // Lo del pool que el día lleva y ese día cierra (el Castillo en D2 un lunes): también es un cierre.
        if (poolNames.some((name) => carries(cfg, name) && closedThatDay(name, day))) cost += 1000
        // Un día de joyas no va en un día de media jornada (se perdería la mañana).
        if (day.halfDayExcursion && (cfg.joyas ?? []).length > 0) cost += 500
        // Lo mejor primero: las joyas como muy tarde el día 3 y nunca solo el último (3+ días).
        for (const joya of cfg.joyas ?? []) {
          const first = candidate.findIndex((other) => (curatedById.get(other).joyas ?? []).includes(joya))
          if (first === index && (index + 1 > earlyLimit || (cityDays.length >= 3 && index === cityDays.length - 1))) cost += 100
          if (first === index) cost += index
        }
        cost += Math.abs(index - chosen.indexOf(id))
      })
      if (!best || cost < best.cost) best = { candidate, cost }
    }
    order = best.candidate
  }

  // ── 3 y 4. Variante y paradas de cada día ─────────────────────────────────────────────────────
  // ¿Va esta parada? (`solo`: una condición o una lista de condiciones, basta con una). Lo del pool va siempre.
  function stopApplies(stop, day) {
    if (inPool(stop.lugar)) return true
    if (!stop.solo) return true
    const conditions = Array.isArray(stop.solo) ? stop.solo : [stop.solo]
    return conditions.some((cond) =>
      (cond.ritmo == null || (cond.ritmo === 'completo' ? !tranquilo : tranquilo)) &&
      (cond.experiencia == null || selected.includes(cond.experiencia)) &&
      (cond.pool == null || (cond.pool ? inPool(stop.lugar) : !inPool(stop.lugar))) &&
      (cond.min_dias == null || contentDays >= cond.min_dias) &&
      (cond.estacion == null || !day || (cond.estacion === 'no_invierno' ? !isWinter(day) : isWinter(day))),
    )
  }
  const sectionsOf = (cfg) => ({ manana: cfg.manana ?? [], comida: cfg.comida ?? null, tarde: cfg.tarde ?? [], cena: cfg.cena ?? null, noche: cfg.noche ?? null })
  const namesOf = (sections) => [...sections.manana, ...sections.tarde].map((stop) => stop.lugar)
  const resolved = []
  const outBefore = new Set()
  order.forEach((id, index) => {
    const cfg = curatedById.get(id)
    const day = cityDays[index]
    let sections = sectionsOf(cfg)
    const applied = []
    const apply = (name) => {
      const variant = cfg.variantes?.[name]
      if (!variant) return
      applied.push(name)
      for (const key of ['manana', 'comida', 'tarde', 'cena', 'noche']) if (variant[key] !== undefined) sections = { ...sections, [key]: variant[key] }
      if (variant.quitar) sections = { ...sections, manana: sections.manana.filter((stop) => !variant.quitar.includes(stop.lugar)), tarde: sections.tarde.filter((stop) => !variant.quitar.includes(stop.lugar)) }
      if (variant.tarde_antes) sections = { ...sections, manana: sections.manana.filter((stop) => !variant.tarde_antes.some((other) => other.lugar === stop.lugar)), tarde: [...variant.tarde_antes, ...sections.tarde.filter((stop) => !variant.tarde_antes.some((other) => other.lugar === stop.lugar))] }
      for (const insert of variant.insertar ?? []) {
        const at = sections.tarde.findIndex((stop) => stop.lugar === insert.antes_de)
        sections = { ...sections, tarde: at >= 0 ? [...sections.tarde.slice(0, at), insert.parada, ...sections.tarde.slice(at)] : [...sections.tarde, insert.parada] }
      }
      if (variant.atardecer) sections = { ...sections, tarde: sections.tarde.map((stop) => (stop.lugar === variant.atardecer ? { ...stop, rol: 'atardecer' } : stop)) }
    }
    // Tarde B de D5: si lo que ella enseña (el Campidoglio y el Ghetto) ya salió en el viaje.
    const tardeB = cfg.variantes?.tarde_b
    if (tardeB && (tardeB.si_ya_salieron ?? []).every((name) => outBefore.has(name))) apply('tarde_b')
    else if (cfg.variantes?.invierno?.atardecer && isWinter(day)) apply('invierno')
    if (cfg.variantes?.con_d5 && order.includes('D5')) apply('con_d5')
    if (isWinter(day) && !cfg.variantes?.invierno?.atardecer) apply('invierno')
    if (hasFreeTour) apply('con_free_tour')
    if (tranquilo) {
      apply('tranquilo')
      if (isWinter(day)) apply('tranquilo_invierno')
    }
    const weekday = WEEKDAY_KEY[norm(day.weekday ?? '')] ?? null
    // El domingo de D2 solo si no hubo otro remedio (va en su día de cierre).
    if (weekday && !(weekday === 'domingo' && (cfg.no_en ?? []).some((rule) => norm(rule.dia_semana) === 'domingo') && !violates(cfg, day))) {
      apply(weekday)
      if (tranquilo) apply(`tranquilo_${weekday}`)
    }
    for (const variant of index === order.indexOf('D1') ? poolVariants.get('D1') ?? [] : []) apply(variant)
    const closedAnchors = []
    const sin = applied.map((name) => cfg.variantes?.[name]?.sin).find(Boolean)
    if (sin) closedAnchors.push(sin)
    // Lo que va este viaje (ritmo, experiencia, pool, días, estación). Lo que no, se apunta: su compañero de grupo
    // lo enseña por fuera (el Castillo desde el Puente).
    const notToday = [...sections.manana, ...sections.tarde].filter((stop) => !stopApplies(stop, day)).map((stop) => stop.lugar)
    sections = { ...sections, manana: sections.manana.filter((stop) => stopApplies(stop, day)), tarde: sections.tarde.filter((stop) => stopApplies(stop, day)) }
    // Media jornada (la excursión se lleva la mañana): solo la tarde.
    if (day.halfDayExcursion) sections = { ...sections, manana: [], comida: null }
    resolved.push({ id, cfg, day, sections, applied, closedAnchors, notToday })
    for (const name of namesOf(sections)) outBefore.add(name)
    if (sections.manana.some((stop) => stop.lugar === tour?.name)) for (const name of tourCovers) outBefore.add(name)
  })

  // Tope de museos de pago (💶): lo del pool no cuenta; si sobran, fuera en el orden del JSON.
  const museumRules = rules.museos_de_pago
  if (museumRules) {
    const quota = (museumRules.tope ?? []).find((row) => contentDays <= row.hasta_dias)?.extra ?? 0
    const limit = quota + (selected.includes('arte_museos') ? museumRules.con_arte ?? 1 : 0)
    const paid = () => resolved.flatMap((entry) => [...entry.sections.manana, ...entry.sections.tarde].filter((stop) => stop.pago && !inPool(stop.lugar)).map((stop) => stop.lugar))
    for (const name of museumRules.quitar_en_orden ?? []) {
      if (paid().length <= limit) break
      for (const entry of resolved) if ([...entry.sections.manana, ...entry.sections.tarde].some((stop) => stop.lugar === name && !inPool(name))) entry.notToday.push(name)
      for (const entry of resolved) entry.sections = { ...entry.sections, manana: entry.sections.manana.filter((stop) => stop.lugar !== name || inPool(name)), tarde: entry.sections.tarde.filter((stop) => stop.lugar !== name || inPool(name)) }
    }
  }

  // ── 5. Horas ────────────────────────────────────────────────────────────────────────────────
  const allLunchSpots = lunchSpots(destData)
  const dinnerOptions = dinnerZones(destData)
  const seen = new Set(hasFreeTour ? [...tourCovers] : [])
  const notEnoughTime = new Set()
  const days = []
  let resolvedIndex = 0
  for (const skeletonDay of skeleton) {
    if (skeletonDay.isBlank || skeletonDay.isExcursion) {
      days.push({ ...skeletonDay, units: [], schedule: null, hours: hoursOf(skeletonDay) })
      continue
    }
    const entry = resolved[resolvedIndex++]
    if (!entry) {
      days.push({ ...skeletonDay, units: [], schedule: null, hours: hoursOf(skeletonDay), isBlank: true })
      continue
    }
    days.push(planDay(entry, skeletonDay))
  }

  function unitOf(stop, slot, index, dayId, day) {
    const hours = hoursOf(day)
    const source = stop.lugar === tour?.name ? { ...tour, isFreeTour: true, duration_minutes: tour.duration_minutes ?? 150 } : placeByName.get(stop.lugar)
    if (!source) return null
    let role = stop.rol ?? 'parada'
    let ready = { ...source }
    // Cerrado ese día: lo imprescindible se enseña por fuera (su `pass_by`, con aviso); lo demás que se ve desde la
    // calle va de paso; lo que no, se salta.
    let closedSkip = false
    if (!source.isFreeTour && closedThatDay(stop.lugar, day)) {
      if (source.level === 1 && (source.pass_by || source.type === 'exterior' || source.visible_from_outside)) role = 'de_paso'
      else if (source.type === 'exterior' || source.visible_from_outside) role = 'de_paso'
      else closedSkip = true
    }
    if (closedSkip) return { skipped: true, stop, source }
    if (role === 'de_paso') {
      const passBy = source.level === 1 ? source.pass_by : null
      ready = {
        ...source,
        passThrough: true,
        coordinates: passBy?.coordinates ?? source.coordinates,
        duration_minutes: passBy ? passBy.minutes ?? OUTSIDE_MINUTES : Math.min(source.duration_minutes ?? PASS_THROUGH_MINUTES, PASS_THROUGH_MINUTES),
        ...(passBy?.includes?.length ? { outsideOf: passBy.includes } : {}),
        windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior',
      }
    } else if (role === 'atardecer' && hours.sunset != null) ready = { ...ready, sunset: hours.sunset }
    // La hora del día curado (Coliseo 08:30, Trevi 08:00, la Galería a las 15:00): como pronto a esa hora.
    if (stop.hora && role !== 'de_paso') ready = { ...ready, not_before: stop.hora }
    if (stop.no_calle) ready = { ...ready, notStreet: true }
    if (stop.aviso) ready = { ...ready, stopNotice: stop.aviso }
    if (stop.nota) ready = { ...ready, curatedNote: stop.nota }
    const [scheduled] = placesForScheduler({ id: stop.lugar, places: [ready] }, destData, tour?.default_time ?? null)
    const level = source.level ?? 3
    const dropRank = joyaNames.has(source.name) || level === 1 ? DROP_RANK.joya : inPool(source.name) ? DROP_RANK.pool : tranquilo ? (role === 'de_paso' ? DROP_RANK_BY_LEVEL.de_paso : DROP_RANK_BY_LEVEL[level] ?? DROP_RANK_BY_LEVEL[3]) : DROP_RANK[role] ?? DROP_RANK.parada
    const theme = selected.find((id) => (source.tags ?? []).some((tag) => TAG_INTEREST_MAP[id].includes(tag))) ?? null
    return {
      id: `${dayId}:${stop.lugar}`,
      group: null,
      places: [scheduled],
      slot,
      blockId: dayId,
      role: inPool(source.name) && role !== 'de_paso' ? 'pool' : role,
      dropRank,
      priority: level === 1 ? PRIORITY.ESSENTIAL : inPool(source.name) ? PRIORITY.POOL : PRIORITY.THEME,
      curatedIndex: (slot === 'manana' ? 0 : CURATED_AFTERNOON_OFFSET) + index,
      poolIndex: inPool(source.name) ? poolNames.indexOf(source.name) : null,
      ...(theme && level !== 1 ? { experienceTheme: theme } : {}),
    }
  }

  /** Programa un día: madrugón solo por un nivel 1 (tranquilo), comida acortada como último recurso. */
  function schedule(day, units, dinnerPoint, spots, morning) {
    const hours = hoursOf(day)
    const run = (dayMode, list = units) =>
      scheduleFixedOrder({
        units: list,
        mode: dayMode,
        travel,
        start: { minutes: morning ? dayMode.dayStart : dayMode.halfDayRouteStart ?? mode.halfDayRouteStart, coordinates: null },
        pendingMeals: { lunch: morning, dinner: true },
        dinnerPoint,
        hours,
        lunchSpots: spots,
        keepOrder: true,
      })
    const levelOneLost = (result) => result.dropped.filter(({ unit }) => unit.places.some((place) => place.level === 1)).length
    const realLevelOne = (result) => new Set(result.visits.filter((visit) => !visit.place.passThrough && placeByName.get(visit.place.name)?.level === 1).map((visit) => visit.place.name))
    let result = run(mode)
    let modeFallback = null
    let shortenedLunch = null
    // Tranquilo solo madruga si un nivel 1 se queda fuera del día, lo justo, y el motivo es lo que así se VISITA.
    if (tranquilo && morning && levelOneLost(result) > 0) {
      const base = levelOneLost(result)
      const had = realLevelOne(result)
      for (let start = mode.dayStart - WAKE_EARLY_STEP; start >= normalMode.dayStart; start -= WAKE_EARLY_STEP) {
        const trial = run({ ...normalMode, dayStart: start })
        const gained = [...realLevelOne(trial)].filter((name) => !had.has(name))
        if (levelOneLost(trial) < base && gained.length > 0) {
          result = trial
          modeFallback = { recoveredUnitIds: [], recoveredNames: gained, startedAt: start, dayStart: start }
          break
        }
      }
    }
    if (levelOneLost(result) > 0 && morning) {
      const baseMode = modeFallback ? { ...normalMode, dayStart: modeFallback.dayStart } : mode
      const shortLunch = { ...baseMode, mealMinutes: Math.max(SHORT_LUNCH_MINUTES, Math.min(baseMode.mealMinutes, SHORT_LUNCH_MINUTES)), lunchBlockMinutes: Math.min(baseMode.lunchBlockMinutes, SHORT_LUNCH_BLOCK_MINUTES), visitDurationBonus: 0 }
      const alt = run(shortLunch)
      if (levelOneLost(alt) < levelOneLost(result)) {
        shortenedLunch = result.dropped.filter(({ unit }) => unit.places.some((place) => place.level === 1) && !alt.dropped.some((other) => other.unit.id === unit.id)).flatMap(({ unit }) => unit.places.map((place) => place.name))
        result = alt
      }
    }
    return { ...result, modeFallback, ...(shortenedLunch ? { shortenedLunch } : {}), run: (list) => run(modeFallback ? { ...normalMode, dayStart: modeFallback.dayStart } : mode, list) }
  }

  function planDay(entry, day) {
    const { id: dayId, cfg, sections } = entry
    const hours = hoursOf(day)
    const morning = !day.halfDayExcursion
    const skipped = []
    const build = (stops, slot) =>
      stops
        .map((stop, index) => unitOf(stop, slot, index, dayId, day))
        .filter((unit) => {
          if (unit?.skipped) skipped.push(unit)
          return unit && !unit.skipped
        })
    let units = [...build(sections.manana, 'manana'), ...build(sections.tarde, 'tarde')]
    // La comida en su barrio (los restaurantes que dice el día); la cena, en su barrio de cena.
    const named = new Set(sections.comida?.restaurantes ?? [])
    const spots = named.size > 0 ? allLunchSpots.filter((spot) => named.has(spot.name)) : allLunchSpots
    const dinner = dinnerOptions.find((zone) => zone.id === sections.cena?.barrio) ?? null
    const dinnerPoint = dinner?.coordinates ?? units.at(-1)?.places.at(-1)?.coordinates ?? null
    let result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)

    // El mirador que no llega a su atardecer (se llega de noche): en su sitio, como vistas de Roma iluminada.
    const missed = result.dropped.filter(({ unit, reason }) => unit.role === 'atardecer' && reason === 'missed_sunset')
    if (missed.length > 0) {
      units = units.map((unit) => (missed.some(({ unit: other }) => other.id === unit.id) ? { ...unit, role: 'parada', places: unit.places.map(({ sunset, ...place }) => ({ ...place, nightView: true })) } : unit))
      result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    }
    for (const visit of result.visits) {
      if (visit.place.nightView && hours.sunset != null && visit.start <= hours.sunset + MIRADOR_LATE_MINUTES) visit.place = { ...visit.place, nightView: false }
    }
    // Un imprescindible que no ha cabido (no por cierre): por fuera, en su sitio, si se ve desde la calle.
    const lostLevelOne = result.dropped.filter(({ unit }) => unit.places.some((place) => place.level === 1) && unit.role !== 'de_paso')
    if (lostLevelOne.length > 0) {
      const outside = new Set(lostLevelOne.map(({ unit }) => unit.id))
      units = units.map((unit) => {
        if (!outside.has(unit.id)) return unit
        const place = placeByName.get(unit.places[0].name)
        if (!place || !(place.pass_by || place.type === 'exterior' || place.visible_from_outside)) return unit
        const stop = [...sections.manana, ...sections.tarde].find((other) => other.lugar === place.name)
        return unitOf({ ...stop, rol: 'de_paso' }, unit.slot, unit.curatedIndex % CURATED_AFTERNOON_OFFSET, dayId, day) ?? unit
      })
      result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    }
    // Lo de su grupo que se ha saltado por cierre (el Castillo el lunes) o que no toca este viaje (sin pool) se ve
    // por fuera desde el compañero; y lo que un lugar visitado tiene delante (`pass_by.includes`: la Plaza Venecia
    // desde el Altar), también: los pares inseparables no se parten.
    for (const visit of result.visits) {
      const includes = placeByName.get(visit.place.name)?.pass_by?.includes ?? []
      const partners = includes.filter((name) => placeByName.get(name)?.group && placeByName.get(name).group === placeByName.get(visit.place.name)?.group && !result.visits.some((other) => other.place.name === name))
      if (partners.length > 0) visit.place = { ...visit.place, outsideOf: [...new Set([...(visit.place.outsideOf ?? []), ...partners])] }
    }
    // (Y lo que no ha llegado a su hora: el Castillo que no cabe se ve igual desde el Puente.)
    const droppedPlaces = result.dropped.filter(({ unit }) => unit.role !== 'de_paso').flatMap(({ unit }) => unit.places.map((place) => placeByName.get(place.name))).filter(Boolean)
    for (const source of [...skipped.map(({ source }) => source), ...(entry.notToday ?? []).map((name) => placeByName.get(name)).filter(Boolean), ...droppedPlaces]) {
      if (!source.group) continue
      const partner = result.visits.find((visit) => placeByName.get(visit.place.name)?.group === source.group)
      if (partner) partner.place = { ...partner.place, outsideOf: [...new Set([...(partner.place.outsideOf ?? []), source.name])] }
    }
    // La joya cerrada que no se ve por fuera (los Museos Vaticanos el domingo): el día lo avisa.
    const closedAnchors = [...entry.closedAnchors, ...skipped.filter(({ source }) => joyaNames.has(source.name) && !source.pass_by).map(({ source }) => source.name)]
    for (const name of closedAnchors) notEnoughTime.add(name)
    // Lo del día que no ha llegado a su hora (sin lo de paso) va a "No te dio tiempo".
    for (const { unit } of result.dropped) if (unit.role !== 'de_paso' && !unit.places.some((place) => place.isFreeTour)) for (const place of unit.places) notEnoughTime.add(place.name)
    for (const visit of result.visits) {
      seen.add(visit.place.name)
      for (const name of visit.place.outsideOf ?? []) seen.add(name)
    }
    const { run, ...schedulePlain } = result
    return {
      ...day,
      hours,
      units: result.kept,
      schedule: schedulePlain,
      rerun: run,
      lunchZone: null,
      dinnerZone: dinner?.id ?? null,
      dinnerPlaceZone: dinner?.placeZone ?? null,
      dinnerCoords: dinnerPoint,
      nightNames: null,
      blocks: [
        ...(morning ? [{ id: dayId, slot: 'manana', label: cfg.nombre }] : []),
        { id: dayId, slot: 'tarde', label: cfg.nombre },
      ],
      curatedDay: { id: dayId, nombre: cfg.nombre, variantes: entry.applied, noche: sections.noche },
      untypedAfternoon: false,
      reorderedBlocks: [],
      closedAnchors: closedAnchors.map((name) => ({ name, blockId: dayId, dates: [hours.dateIso].filter(Boolean) })),
      curated: null,
    }
  }

  // ── 6a. El pool que ningún día trae: regla general ────────────────────────────────────────────
  const unplacedPool = []
  const cityPlanned = days.filter((day) => day.schedule)
  for (const name of poolNames) {
    if (seen.has(name)) continue
    const place = placeByName.get(name)
    if (!place) continue
    // El día cuya zona queda más cerca (lo más cerca de alguna de sus paradas), abierto ese día.
    const candidates = cityPlanned
      .filter((day) => !closedThatDay(name, day))
      .map((day) => {
        const nearest = day.schedule.visits.map((visit, index) => ({ index, meters: metersBetween(visit.place.coordinates, place.coordinates) })).sort((a, b) => a.meters - b.meters)[0]
        return { day, nearest }
      })
      .filter((item) => item.nearest)
      .sort((a, b) => a.nearest.meters - b.nearest.meters)
    let placed = false
    for (const { day, nearest } of candidates) {
      const visit = day.schedule.visits[nearest.index]
      const at = day.units.findIndex((unit) => unit.id === visit.unitId) + 1
      const slot = day.units[at - 1]?.slot ?? 'tarde'
      const poolUnit = unitOf({ lugar: name, rol: 'parada' }, slot, 50, day.curatedDay.id, day)
      if (!poolUnit || poolUnit.skipped) continue
      let list = [...day.units.slice(0, at), poolUnit, ...day.units.slice(at)]
      const before = new Set(day.schedule.visits.map((other) => other.unitId))
      const removed = new Set()
      // Si no cabe: fuera la parada de menos nivel que no sea nivel 1 (ni joya ni pool), de una en una. Solo vale si
      // todo lo demás del día se sigue visitando (el Altar no se cae por meter Caracalla).
      for (let attempt = 0; attempt < 4 && !placed; attempt++) {
        const result = day.rerun(list)
        const intact = [...before].every((unitId) => removed.has(unitId) || result.visits.some((other) => other.unitId === unitId))
        if (intact && result.visits.some((other) => other.unitId === poolUnit.id)) {
          const { run, ...plain } = result
          Object.assign(day, { units: result.kept, schedule: { ...plain, modeFallback: day.schedule.modeFallback } })
          placed = true
          break
        }
        const removable = list
          .filter((unit) => unit !== poolUnit && !unit.places.some((p) => p.level === 1 || joyaNames.has(p.name) || inPool(p.name) || p.isFreeTour))
          .sort((a, b) => (b.places[0].level ?? 3) - (a.places[0].level ?? 3) || Number(b.role === 'de_paso') - Number(a.role === 'de_paso'))[0]
        if (!removable) break
        removed.add(removable.id)
        list = list.filter((unit) => unit !== removable)
      }
      if (placed) break
    }
    if (placed) seen.add(name)
    else {
      // Con su motivo: fuera de temporada todo el viaje, cerrado todos los días o sin sitio.
      const outOfSeason = cityPlanned.every((day) => !availableForTrip(place.available, calendar, hoursOf(day).dateIso, true))
      const closedEvery = cityPlanned.every((day) => closedOnDay(place, hoursOf(day).weekday, calendar.hasDates ? hoursOf(day).dateIso : null))
      unplacedPool.push({
        unitId: name,
        name,
        reason: outOfSeason ? 'out_of_season' : closedEvery ? 'closed_every_day' : 'no_room',
        closedOn: place.closed_on ?? [],
        ...(outOfSeason ? { available: Array.isArray(place.available) ? place.available[0] : place.available } : {}),
      })
    }
  }

  // Una experiencia elegida que ningún día trae (los mercadillos de Navidad, sección 7): lo suyo que esté en
  // temporada entra de camino, junto a la parada más cercana del día (el de Piazza Navona, en D1), a 10 min
  // andando como mucho y sin que se caiga nada. Una vez por viaje y experiencia.
  const curatedNames = new Set(cityPlanned.flatMap((day) => day.schedule.visits.map((visit) => visit.place.name)))
  for (const id of selected) {
    const tags = TAG_INTEREST_MAP[id] ?? []
    const allCurated = (destData.curated_days ?? []).flatMap((cfg) => [...(cfg.manana ?? []), ...(cfg.tarde ?? [])].map((stop) => placeByName.get(stop.lugar))).filter(Boolean)
    if (allCurated.some((place) => (place.tags ?? []).some((tag) => tags.includes(tag)))) continue
    let placed = false
    for (const place of (destData.places ?? []).filter((candidate) => (candidate.tags ?? []).some((tag) => tags.includes(tag)) && !curatedNames.has(candidate.name) && !seen.has(candidate.name))) {
      for (const day of cityPlanned) {
        if (placed || closedThatDay(place.name, day)) continue
        const nearest = day.schedule.visits.map((visit) => ({ visit, minutes: travel.leg(visit.place.coordinates, place.coordinates)?.minutes ?? Infinity })).sort((a, b) => a.minutes - b.minutes)[0]
        if (!nearest || nearest.minutes > 10) continue
        const at = day.units.findIndex((unit) => unit.id === nearest.visit.unitId) + 1
        const extra = unitOf({ lugar: place.name, rol: 'parada' }, day.units[at - 1]?.slot ?? 'tarde', 60, day.curatedDay.id, day)
        if (!extra || extra.skipped) continue
        const result = day.rerun([...day.units.slice(0, at), { ...extra, experienceTheme: id }, ...day.units.slice(at)])
        const intact = day.schedule.visits.every((visit) => result.visits.some((other) => other.unitId === visit.unitId))
        if (!intact || !result.visits.some((visit) => visit.unitId === extra.id)) continue
        const { run, ...plain } = result
        Object.assign(day, { units: result.kept, schedule: { ...plain, modeFallback: day.schedule.modeFallback } })
        seen.add(place.name)
        placed = true
      }
      if (placed) break
    }
  }

  // ── 6b. Los paseos nocturnos curados ─────────────────────────────────────────────────────────
  const catalogue = new Map((destData.night_experiences ?? []).map((entry) => [entry.name, entry]))
  const walks = destData.night_walks ?? {}
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
  for (const day of cityPlanned) {
    const walk = walks[day.curatedDay.noche]
    if (!walk) continue
    const removedByDay = Object.entries(walk.quitar_si_va ?? {}).filter(([id]) => order.includes(id)).flatMap(([, names]) => names)
    const startOf = (name) => day.schedule.visits.find((visit) => visit.place.name === name)?.start ?? null
    const lateVisit = (entry) => (entry.conflicts_with ?? []).some((name) => {
      const start = startOf(name)
      return start != null && (start >= LATE_VISIT_MINUTES || (day.hours?.sunset != null && start >= day.hours.sunset))
    })
    const wokeFor = new Set(day.schedule.modeFallback?.recoveredNames ?? [])
    const allowed = (entry, { strictReach = false } = {}) => {
      if (!entry || usedNights.has(entry.name)) return false
      const conflicts = entry.conflicts_with ?? []
      // Como mucho 2 veces en el viaje (visita, de paso o de noche).
      if (conflicts.some((name) => (timesSeen.get(name) ?? 0) >= 2 && !(walk.excepcion_mismo_dia && daysOfPlace.get(name)?.has(day.dayNumber) && timesSeen.get(name) === 2))) return false
      const sameDay = !entry.same_day_as_visit && conflicts.some((name) => daysOfPlace.get(name)?.has(day.dayNumber))
      // 3+ días: nunca de día y de noche el mismo día (salvo la excepción del día: la escalinata de D4).
      if (sameDay && !shortTrip && !walk.excepcion_mismo_dia) return false
      // 1-2 días: solo si la visita de día es de última hora (entonces se queda solo la nocturna).
      if (sameDay && shortTrip && !walk.excepcion_mismo_dia && !lateVisit(entry)) return false
      if (strictReach && day.dinnerCoords && metersBetween(day.dinnerCoords, entry.coordinates) > NIGHT_FALLBACK_METERS) return false
      return true
    }
    const max = tranquilo ? 1 : walk.maximo ?? 2
    let chain = walk.recorrido.filter((name) => !removedByDay.includes(name)).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
    let fromAlternative = false
    if (chain.length === 0) {
      chain = (walk.alternativas ?? []).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
      // Si ninguno de la lista vale (ya salió), otro lugar nocturno cerca de la cena.
      if (chain.length === 0) chain = [...catalogue.values()].filter((entry) => allowed(entry, { strictReach: true })).sort((a, b) => metersBetween(day.dinnerCoords, a.coordinates) - metersBetween(day.dinnerCoords, b.coordinates))
      fromAlternative = walk.recorrido.length > 0
    }
    chain = chain.slice(0, max)
    if (chain.length === 0) continue
    for (const entry of chain) {
      usedNights.add(entry.name)
      for (const name of entry.conflicts_with ?? []) timesSeen.set(name, (timesSeen.get(name) ?? 0) + 1)
    }
    const shortened = chain.length < walk.recorrido.length
    const text = fromAlternative ? null : shortened && walk.texto_corto ? walk.texto_corto : walk.texto
    nightsByDay.set(
      day.dayNumber,
      chain.map((entry) => ({ ...entry, wholeWalk: true, ...(walk.excepcion_mismo_dia ? { sameDayException: true } : {}), ...(shortTrip && (entry.conflicts_with ?? []).some((name) => daysOfPlace.get(name)?.has(day.dayNumber)) && lateVisit(entry) && !(entry.conflicts_with ?? []).some((name) => wokeFor.has(name)) ? { replacesDayVisit: true } : {}) })),
    )
    day.nightWalk = { nombre: fromAlternative ? 'Paseo nocturno' : walk.nombre, texto: text }
  }

  // Traslados largos (más de 25 min andando), con la cuesta y el bus si el lugar o la parada lo dicen.
  for (const day of cityPlanned) {
    const visits = day.schedule.visits
    const lunch = (day.schedule.meals ?? []).find((meal) => meal.type === 'lunch')
    const stops = [...(curatedById.get(day.curatedDay.id)?.manana ?? []), ...(curatedById.get(day.curatedDay.id)?.tarde ?? []), ...Object.values(curatedById.get(day.curatedDay.id)?.variantes ?? {}).flatMap((variant) => [...(variant.manana ?? []), ...(variant.tarde ?? [])])]
    day.longWalks = []
    for (let i = 1; i < visits.length; i++) {
      const previous = visits[i - 1]
      const visit = visits[i]
      const fromLunch = lunch?.coordinates && lunch.start >= previous.end && lunch.start < visit.start
      const from = fromLunch ? lunch.coordinates : previous.place.end_coordinates ?? previous.place.coordinates
      const minutes = travel.leg(from, visit.place.coordinates)?.minutes ?? 0
      if (minutes <= TRANSFER_NOTICE_MINUTES) continue
      const place = placeByName.get(visit.place.name)
      const how = stops.find((stop) => stop.lugar === visit.place.name && stop.traslado)?.traslado ?? place?.uphill?.transit ?? null
      day.longWalks.push({ minutes, from: fromLunch ? 'la comida' : previous.place.name, to: visit.place.name, uphill: Boolean(place?.uphill), how })
    }
    delete day.rerun
  }

  // Imprescindibles que no han salido en ningún sitio (ni de día, ni por fuera, ni con el tour, ni de noche).
  const seenAtNight = new Set([...nightsByDay.values()].flat().flatMap((entry) => entry.conflicts_with ?? []))
  const closedAllTrip = (name) => cityPlanned.length > 0 && cityPlanned.every((day) => closedThatDay(name, day))
  const unplacedEssentials = (destData.places ?? [])
    .filter((place) => place.level === 1 && !seen.has(place.name) && !tourCovers.has(place.name) && !seenAtNight.has(place.name))
    .map((place) => ({ unitId: place.name, name: place.name, reason: closedAllTrip(place.name) ? 'closed_every_day' : 'no_room', closedOn: place.closed_on ?? [] }))

  return {
    mode,
    days,
    curated: true,
    nightsByDay,
    joyaNames: [...joyaNames],
    pinnedMornings: [],
    rescueDetours: {},
    notEnoughTime: [...notEnoughTime].filter((name) => !seen.has(name) && !unplacedEssentials.some((item) => item.name === name) && !unplacedPool.some((item) => item.name === name)).map((name) => ({ name, reason: 'no_time' })),
    coreDays: destData.destination_config?.core_days ?? null,
    placedDay: new Map(),
    unplacedPool,
    unplacedEssentials,
    quotaMisses: [],
    experienceRange: null,
    experienceCounts: {},
    coveredByFreeTour: hasFreeTour ? [{ unitId: tour?.name, names: [...tourCovers], dayNumber: days.find((day) => day.curatedDay?.id === 'D3')?.dayNumber ?? 1 }] : [],
    movedForJoya: [],
    blockSummary: days.filter((day) => day.curatedDay).map((day) => ({ dayNumber: day.dayNumber, morning: day.curatedDay.id, afternoon: day.curatedDay.id, lateDinner: false })),
    untypedHalves: 0,
    calendar: { hasDates: calendar.hasDates, month: calendar.month, season: calendar.season, referenceIso: calendar.referenceIso },
  }
}
