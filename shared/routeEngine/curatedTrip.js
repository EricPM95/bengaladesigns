/**
 * Días curados (docs/DIAS_CURADOS_ROMA.md, 2026-09-26): el viaje se hace con días enteros pensados de principio
 * a fin (`curated_days` del JSON del destino), no con mañanas y tardes sueltas. El motor:
 *
 *   1. ELIGE qué días van (`curated_selection`: por días de ciudad, Free Tour, experiencia y pool);
 *   2. los ORDENA (cierres de cada día, `no_en`; las joyas lo antes posible; el orden por defecto);
 *   3. aplica la VARIANTE que toca (invierno, día de la semana, Free Tour, pool) sin inventar otra;
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
import { dinnerZones, mainZoneOf, recommendedRestaurant } from './dinnerZones.js'
import { MODE_V3 } from './modes.js'
import { tripCalendar } from './tripCalendar.js'
import { closedOnDay, effectiveSchedule, matchesDateRange, parseClosingMinutes, parseHoursSessions } from './openingHours.js'
import { specialHoursToAvoid } from './specialDates.js'
import { sunsetFor } from './sunset.js'
import { tripDays } from './tripSkeleton.js'
import { availableForTrip } from './availability.js'
import { lunchSpots } from './lunchSpots.js'
import { joinSpanish, placeWithArticle, whyTexts } from './whyTexts.js'
import { isStreet } from './localRules.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'

/** Lo que dura pasar por un sitio "de paso". */
const PASS_THROUGH_MINUTES = 10
/** Un imprescindible visto por fuera, si su `pass_by` no dice otra cosa. */
const OUTSIDE_MINUTES = 15
/** Con el atardecer antes de esta hora el día va en su variante de invierno. 18:30 (PROMPT_RUTAS_CURADAS, B.3): así
    mediados de marzo y la segunda quincena de octubre ya van en invierno. */
const WINTER_SUNSET_BEFORE = 18 * 60 + 30
/** Un mirador del atardecer que llega más tarde que esto después de la puesta de sol ya es de noche (decisión del
    usuario, 2026-09-28: en cuanto llega después del sol). */
const MIRADOR_LATE_MINUTES = 0
/** Por qué un monumento va por fuera (PROMPT_PENDIENTE B.4), en el orden en que se decide. */
const OUTSIDE_REASONS = { cerrado: 'Hoy cierra', ya_cerrado: 'A esta hora ya ha cerrado', no_abre: 'A esta hora no abre', no_cabe: 'Hoy lo ves por fuera para llegar a todo lo del día' }
/** Un monumento de exterior que el día ponía de paso: parada corta. */
const SHORT_STOP_MINUTES = 15
/** Más espera que esto antes del atardecer, con el mirador primero, se llena (decisión del usuario, 2026-09-28). */
const MID_DAY_WAIT_MAX = 60
/** Con esta espera o más antes del sol, el monumento que iba por fuera por tiempo prueba a ir por dentro. */
const FILL_INSIDE_MIN_IDLE = 20
/** Con una espera así o más, el día recupera lo suyo que se había quedado fuera (Letrán). */
const RECOVER_MIN_GAP = 30
/** Cierre de Roma (2026-09-28): la regla de relleno. Hueco: más de FILL_GAP_MINUTES; hasta FILL_ROUNDS paradas nuevas por día, probando FILL_CANDIDATES de la zona. */
const FILL_GAP_MINUTES = 30
const FILL_ROUNDS = 4
const FILL_CANDIDATES = 6
/** O a menos de esto de la parada junto al hueco, aunque sea de otra zona (Via Margutta, bajando del Pincio). */
const FILL_NEAR_METERS = 700
/** De la misma zona, pero sin cruzar media ciudad (el centro histórico es muy grande). */
const FILL_ZONE_METERS = 1000
const FILL_WALK_MAX = 25
const FILL_LEG_MAX = 15
/** El máximo de una parada de paseo: el suyo (`max_minutos_paseo`: la Via Appia), 45 una avenida, 90 un parque o un barrio. */
export function paseoMaxOf(place) {
  const tags = new Set(place?.tags ?? [])
  // (REGLAS_RUTAS 38: cada sitio tiene su máximo en los datos, `min_max`; estirarlo nunca lo pasa.)
  if (place?.min_max != null) return place.min_max
  if (place?.max_minutos_paseo != null) return place.max_minutos_paseo
  if (tags.has('calle')) return 45
  if (tags.has('parque') || tags.has('barrio') || tags.has('paseo')) return 90
  return null
}
/** Lo que se cuenta para llegar andando a comer al estirar el barrio de antes de la comida. */
const LUNCH_WALK_ALLOWANCE = 5
/** La cena de una noche con nocturna a hora fija, a esta distancia de ella como mucho (unos 15 min andando). */
const NIGHT_FIXED_DINNER_METERS = 1200
/** Espera a la cena a partir de la cual la parada de barrio de antes se estira (decisión del usuario, 2026-09-28). */
const APERITIVO_ABSORB_FROM = 15
/** "De camino, en la misma zona": a esta distancia del mirador como mucho. */
const ON_THE_WAY_METERS = 700
/** Un imprescindible es parada de verdad: nunca menos de 20 min (decisión del usuario, 2026-09-28). */
const IMPRESCINDIBLE_MIN_MINUTES = 20
/** Lo que se ve desde el compañero (la Plaza Venecia desde el Altar): su propia línea, en un momento. */
const SEEN_FROM_MINUTES = 5
/** Lo que devuelve la parada que se estira para no perder el atardecer, y su mínimo (el callejeo por Trastevere). */
const STRETCH_GIVE_BACK_MINUTES = 15
const STRETCH_MIN_MINUTES = 20
/** Un día con horario especial para lo que lleva (el Coliseo el 2 de junio): menos que un cierre, más que el orden. */
const SPECIAL_HOURS_COST = 400
/** Sin atardecer en la tarde: más que esto antes de cenar se lo llevan las paradas estirables. */
const DINNER_IDLE_MAX = 90
/** Comida acortada para no perder un imprescindible (75 min con aviso). */
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
const CURATED_AFTERNOON_OFFSET = 100
/** Motivos del programador que son de horario (cerrado a esa hora, cierra durante la visita, última entrada). */
const HOURS_REASONS = new Set(['closed', 'closes_during_visit', 'after_last_entry', 'after_latest_end'])
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
export function planCuratedTrip({ destData, totalDays, hasFreeTour = false, poolNames = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel, insideNames = [] }) {
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  const mode = MODE_V3
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const curatedById = new Map((destData.curated_days ?? []).map((day) => [day.id, day]))
  const selected = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const inPool = (name) => poolNames.includes(name)
  // "Quiero entrar" (PROMPT_PENDIENTE F): por dentro y obligatorio, como si estuviera en el pool, pero sin sus reglas
  // (no mueve días ni cambia paradas: solo recoloca horas).
  // (`autoInside`: lo que el motor pasa a por dentro para llenar la espera antes del atardecer, un día cada vez.)
  const autoInside = new Set()
  const inside = (name) => insideNames.includes(name) || autoInside.has(name)
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
  // Sin fechas no hay días concretos (PROMPT_PENDIENTE G): el 15 del mes solo vale para el atardecer y el horario de
  // temporada; nada de festivos, fechas del día curado ni horarios especiales.
  const realDateIso = (day) => (calendar.hasDates ? hoursOf(day).dateIso : null)
  /** Las fechas especiales ya no llevan sugerencias con hora (INVARIANTES 405): ningún día trae una. */
  const dateSuggestionOf = () => null
  const closedThatDay = (name, day) => {
    const place = placeByName.get(name)
    if (!place) return false
    const hours = hoursOf(day)
    return closedOnDay(place, hours.weekday, calendar.hasDates ? hours.dateIso : null) || !availableForTrip(place.available, calendar, hours.dateIso, inPool(name))
  }
  // ¿Cierra ese día antes del atardecer? (el Jardín de los Naranjos a las 18:00 en otoño)
  const closesBeforeSunset = (name, day) => {
    const place = placeByName.get(name)
    const hours = hoursOf(day)
    const close = place ? parseClosingMinutes(effectiveSchedule(place, hours)) : null
    return close != null && hours.sunset != null && close < hours.sunset
  }
  const sunCondition = (cond, day) => {
    const toMinutes = (hhmm) => Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1] ?? 0)
    const sunset = day ? hoursOf(day).sunset : null
    if (cond.sol_antes_de != null && !(sunset != null && sunset < toMinutes(cond.sol_antes_de))) return false
    if (cond.sol_despues_de != null && !(sunset != null && sunset >= toMinutes(cond.sol_despues_de))) return false
    return true
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
  // Con Free Tour y sin Galería (ni pool ni Arte), D4 se queda sin contenido: el tercer día es D5. Y sin Galería, D4
  // solo con el atardecer después de las 18:00: en invierno (el parque cierra al anochecer y la tarde se queda
  // vacía), el tercer día es D5.
  const sinGaleria = !inPool('Galería Borghese') && !selected.includes('arte_museos')
  const tourSinGaleria = sinGaleria && (hasFreeTour || (cityDays[2] ? isWinter(cityDays[2]) : false))
  if (cityDays.length === 3) {
    // El tercer día: lo decide el pool (el primero que active D4 o D5) y, si no, la experiencia.
    const byPool = poolNames.map(extraDayOf).find((id) => id === 'D4' || id === 'D5')
    list.push(byPool ?? (barriosSinArte || tourSinGaleria ? rules.tercer_dia?.barrios_sin_arte ?? 'D5' : rules.tercer_dia?.resto ?? 'D4'))
  } else if (cityDays.length >= 4) {
    list.push(...(barriosSinArte || tourSinGaleria ? ['D5', 'D4'] : ['D4', 'D5']))
  }
  if (cityDays.length >= 5) list.push(rules.cinco_dias ?? 'D6')
  if (cityDays.length >= 6) list.push(rules.seis_dias ?? 'D7')
  // Tabla de rutas del destino (`curated_routes.por_dias_ciudad`, PROMPT_RUTAS_CURADAS B.1): qué días van, por días de
  // ciudad y con o sin Free Tour. Una entrada {con_galeria, sin_galeria} se decide por el pool o Arte; desde 4 días
  // de viaje, siempre con Galería (es el museo de pago que toca).
  const routeTable = destData.curated_routes?.por_dias_ciudad
  if (routeTable) {
    const keys = Object.keys(routeTable).map(Number).sort((a, b) => a - b)
    const key = keys.filter((k) => k <= cityDays.length).at(-1)
    const row = key != null ? routeTable[String(key)]?.[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] : null
    if (row) {
      list.length = 0
      for (const item of row) list.push(typeof item === 'string' ? item : sinGaleria && contentDays < 4 ? item.sin_galeria : item.con_galeria)
    }
  }
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
  // Variantes de pool dentro de D1, o de D1-FT con Free Tour (2 días, o el segundo lugar que no tiene día propio):
  // una tarde como mucho. En 2 días, el lugar del pool que se queda sin tarde (ya es de otro, o su variante no
  // existe en ese día) va a "No te dio tiempo" con el motivo, no a la regla general.
  const poolDay = list.includes('D1') ? 'D1' : list.includes('D1-FT') ? 'D1-FT' : null
  const poolVariants = new Map()
  const poolBlocked = new Map()
  const variantOwner = new Map()
  for (const name of poolNames) {
    const rule = poolRules[name]
    if (!rule || !poolDay) continue
    const ownDay = extraDayOf(name)
    if (ownDay && list.includes(ownDay)) continue
    const variant = rule.dos_dias || rule.antes ? rule.dos_dias ?? rule.antes : null
    if (!variant) continue
    const current = poolVariants.get(poolDay) ?? []
    const variantDef = curatedById.get(poolDay)?.variantes?.[variant]
    // Solo una variante que cambie la tarde (la Borghese o Caracalla); San Clemente solo añade al principio.
    const taker = current.find((other) => curatedById.get(poolDay)?.variantes?.[other]?.tarde)
    if (!variantDef || (variantDef.tarde && taker)) {
      if (cityDays.length <= 2 && taker) poolBlocked.set(name, variantOwner.get(taker))
      continue
    }
    variantOwner.set(variant, name)
    poolVariants.set(poolDay, [...current, variant])
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
      if (rule.evitar) return false
      if (rule.fecha) return Boolean(realDateIso(day)) && realDateIso(day).slice(5) === rule.fecha
      if (rule.dia_semana) return Boolean(hours.weekday) && norm(hours.weekday) === norm(rule.dia_semana) && (!rule.si_lleva || carries(cfg, rule.si_lleva))
      return false
    })
  }
  // `evitar` (decisión del usuario, 2026-09-28): mejor otro día si el viaje lo tiene, pero si no, se queda y sin aviso.
  // D2 en miércoles de invierno: la audiencia retrasa la tarde y el Janículo llega de noche ("Roma iluminada").
  const EVITAR_COST = 300
  const avoids = (cfg, day) => {
    const hours = hoursOf(day)
    return (cfg.no_en ?? []).some((rule) => rule.evitar && rule.dia_semana && Boolean(hours.weekday) && norm(hours.weekday) === norm(rule.dia_semana) && (!rule.invierno || isWinter(day)))
  }
  const avoidSpecial = calendar.hasDates ? specialHoursToAvoid(destData) : []
  let order = chosen
  if (chosen.length > 1) {
    let best = null
    for (const candidate of permutations(chosen)) {
      let cost = 0
      candidate.forEach((id, index) => {
        const cfg = curatedById.get(id)
        const day = cityDays[index]
        if (violates(cfg, day)) cost += 1000
        if (avoids(cfg, day)) cost += EVITAR_COST
        // Una noche con nocturna a hora fija (la Girandola el 29 de junio): ese día, uno que cene cerca (a 15 min o menos),
        // para que la cena acabe a tiempo (decisión del usuario, 2026-09-28).
        const nightSug = dateSuggestionOf(day)
        if (nightSug?.night) {
          const entry = (destData.night_experiences ?? []).find((candidate) => candidate.name === nightSug.sug.lugar)
          const zone = dinnerZones(destData).find((option) => option.id === cfg.cena?.barrio)
          if (entry?.coordinates && zone?.coordinates && metersBetween(zone.coordinates, entry.coordinates) > NIGHT_FIXED_DINNER_METERS) cost += EVITAR_COST
        }
        // Lo del pool que el día lleva y ese día cierra (el Castillo en D2 un lunes): también es un cierre.
        if (poolNames.some((name) => carries(cfg, name) && closedThatDay(name, day))) cost += 1000
        // Y una entrada de pago que el día lleva por dentro y ese día cierra (el Castillo en D2 un lunes): mejor otro día,
        // que las entradas son parte del negocio (auditoría final de Roma, 2026-09-28).
        for (const stop of [...(cfg.manana ?? []), ...(cfg.tarde ?? [])]) if (stop.pago && !poolNames.includes(stop.lugar) && stopApplies(stop, null) && closedThatDay(stop.lugar, day)) cost += EVITAR_COST
        // Las joyas del día cerradas ese día (festivos): la que no se ve por fuera (los Museos Vaticanos) pesa más
        // que las que sí (el Coliseo y el Panteón, por fuera con aviso). El 24-25 de diciembre, el Vaticano va el 24.
        for (const joya of cfg.joyas ?? []) if (closedThatDay(joya, day)) cost += placeByName.get(joya)?.pass_by ? 300 : 2000
        // Una fecha especial que puede dejar sin mañana lo que el día lleva (el Coliseo el 2 de junio, desfile):
        // otro día si se puede (`horario_especial` confirmado o "probable").
        for (const rule of avoidSpecial) if (hoursOf(day).dateIso && matchesDateRange(rule.fecha, rule.hasta, hoursOf(day).dateIso) && rule.lugares.some((name) => carries(cfg, name))) cost += SPECIAL_HOURS_COST
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
  // Avisos de fecha (PROMPT_AVISO_FECHAS): lo que otro día del viaje no podía llevar (una joya o lo del pool que ese
  // día cierra, o su `no_en`) y el orden ha puesto en este. Con fechas; sin ellas no hay días de la semana.
  const dateMoves = []
  if (calendar.hasDates) {
    order.forEach((id, index) => {
      const cfg = curatedById.get(id)
      const placed = cityDays[index]
      const noEn = (other, name) => (cfg.no_en ?? []).some((rule) => !rule.evitar && rule.dia_semana && hoursOf(other).weekday && norm(hoursOf(other).weekday) === norm(rule.dia_semana) && (rule.si_lleva ? rule.si_lleva === name && carries(cfg, name) : (cfg.joyas ?? []).includes(name)))
      const names = [...new Set([...(cfg.joyas ?? []), ...poolNames.filter((name) => carries(cfg, name)), ...(cfg.no_en ?? []).filter((rule) => rule.si_lleva && carries(cfg, rule.si_lleva)).map((rule) => rule.si_lleva)])]
      for (const name of names) {
        if (closedThatDay(name, placed)) continue
        for (const other of cityDays) {
          if (other === placed || !(closedThatDay(name, other) || noEn(other, name))) continue
          dateMoves.push({ name, dayId: id, blockedDayNumber: other.dayNumber, blockedDateIso: hoursOf(other).dateIso, placedDayNumber: placed.dayNumber, placedDateIso: hoursOf(placed).dateIso })
        }
      }
    })
  }

  // ── 3 y 4. Variante y paradas de cada día ─────────────────────────────────────────────────────
  // ¿Va esta parada? (`solo`: una condición o una lista de condiciones, basta con una). Lo del pool va siempre.
  /** Un museo de pago de nivel 1-2 que se ve por fuera (`minutos_fuera`) y el viajero no ha elegido en el pool. */
  function seenOutside(stop) {
    const place = placeByName.get(stop.lugar)
    const paid = stop.pago || !(place?.is_free_access ?? place?.type === 'exterior')
    return Boolean(place) && (place.level ?? 3) <= 2 && place.type === 'interior' && place.minutos_fuera != null && paid && !inPool(stop.lugar) && !inside(stop.lugar)
  }
  /** La misma parada, por fuera porque no cabe (no cuenta para el tope de museos de pago). */
  const asOutside = (stop) => ({ ...stop, rol: stop.rol === 'atardecer' ? stop.rol : 'de_paso', pago: false, fuera_motivo: OUTSIDE_REASONS.no_cabe, solo: undefined })

  function stopApplies(stop, day) {
    if (inPool(stop.lugar) || inside(stop.lugar)) return true
    if (!stop.solo) return true
    const conditions = Array.isArray(stop.solo) ? stop.solo : [stop.solo]
    return conditions.some((cond) =>
      (cond.experiencia == null || selected.includes(cond.experiencia)) &&
      (cond.pool == null || (cond.pool ? inPool(stop.lugar) : !inPool(stop.lugar))) &&
      (cond.min_dias == null || contentDays >= cond.min_dias) &&
      // `no_si_dia`: no, si el viaje lleva ese otro día (la Isla Tiberina de D5, que ya está en D1-FT).
      (cond.no_si_dia == null || ![cond.no_si_dia].flat().some((id) => order.includes(id))) &&
      // `si_dia`: solo si el viaje lleva ese día (lo que llena en D5 el hueco del Altar, que ya salió en D1).
      (cond.si_dia == null || [cond.si_dia].flat().some((id) => order.includes(id))) &&
      (cond.fecha == null || (Boolean(day) && realDateIso(day)?.slice(5) === cond.fecha)) &&
      (cond.cierra_antes_del_atardecer == null || (Boolean(day) && closesBeforeSunset(cond.cierra_antes_del_atardecer, day))) &&
      (cond.estacion == null || !day || (cond.estacion === 'no_invierno' ? !isWinter(day) : isWinter(day))) &&
      // `sol_antes_de` / `sol_despues_de`: por la hora del sol ese día (Santa Maria del Popolo, que abre de 16:00 a 18:00:
      // después del Pincio solo si el sol se pone antes de las 17:00).
      sunCondition(cond, day),
    )
  }
  // `nombre`: el título del día; una variante que mueve la parada que el título promete trae el suyo ("Trevi sin gente" en
  // ritmo tranquilo, con Trevi a las 10:00, pasa a "Trevi, el Pincio y la tarde en Monti").
  const sectionsOf = (cfg) => ({ nombre: cfg.nombre, manana: cfg.manana ?? [], comida: cfg.comida ?? null, tarde: cfg.tarde ?? [], cena: cfg.cena ?? null, noche: cfg.noche ?? null })
  const namesOf = (sections) => [...sections.manana, ...sections.tarde].map((stop) => stop.lugar)
  // La variante de cada día, en este orden: tarde A/B (D5), invierno, tranquilo, Free Tour (después del ritmo: con
  // tour, D4 no enseña Trevi ni la Plaza de España aunque sea tranquilo), día de la semana, "Museos cerrados", las
  // de pool y "sin Caracalla". Las secciones que trae una variante sustituyen a las de antes.
  const resolveEntry = (id, index, { tardeB = false, forceWinter = false, noWinter = false } = {}) => {
    const cfg = curatedById.get(id)
    const day = cityDays[index]
    let sections = sectionsOf(cfg)
    const applied = []
    const apply = (name) => {
      const raw = cfg.variantes?.[name]
      if (!raw) return
      // `sin_free_tour`: lo que solo vale sin Free Tour (D4 en domingo: comida a las 12:00 y la Galería a las 14:00).
      // (`si_en_tarde`: solo si esa parada va por la tarde; en invierno la Galería va por la mañana.)
      const withoutTour = raw.sin_free_tour && !hasFreeTour && (!raw.sin_free_tour.si_en_tarde || sections.tarde.some((stop) => stop.lugar === raw.sin_free_tour.si_en_tarde))
      const variant = withoutTour ? { ...raw, ...raw.sin_free_tour, insertar: [...(raw.insertar ?? []), ...(raw.sin_free_tour.insertar ?? [])] } : raw
      applied.push(name)
      for (const key of ['nombre', 'manana', 'comida', 'tarde', 'cena', 'noche', 'si_sobra', 'si_espera']) if (variant[key] !== undefined) sections = { ...sections, [key]: variant[key] }
      // (Una mañana nueva se lleva sus paradas de la tarde: el miércoles, el Castillo pasa a la mañana; cierre de Roma.)
      if (variant.manana !== undefined && variant.tarde === undefined) sections = { ...sections, tarde: sections.tarde.filter((stop) => !variant.manana.some((other) => other.lugar === stop.lugar)) }
      if (variant.quitar) sections = { ...sections, manana: sections.manana.filter((stop) => !variant.quitar.includes(stop.lugar)), tarde: sections.tarde.filter((stop) => !variant.quitar.includes(stop.lugar)) }
      if (variant.tarde_antes) sections = { ...sections, manana: sections.manana.filter((stop) => !variant.tarde_antes.some((other) => other.lugar === stop.lugar)), tarde: [...variant.tarde_antes, ...sections.tarde.filter((stop) => !variant.tarde_antes.some((other) => other.lugar === stop.lugar))] }
      for (const insert of variant.insertar ?? []) {
        // `estacion`: solo en invierno o fuera de él (D4 en domingo: Santa Maria del Popolo antes del Pincio en verano,
        // después en invierno, cuando abre a las 16:30 y el sol ya se ha puesto).
        if (insert.estacion && (insert.estacion === 'invierno') !== isWinter(day)) continue
        if (!sunCondition(insert, day)) continue
        // (`solo_si_falta`: si esa parada ya va ese día, no se repite.)
        if (insert.solo_si_falta && namesOf(sections).includes(insert.parada.lugar)) continue
        if (insert.despues_de) {
          // (Varias opciones: detrás de la primera que haya. `en: 'manana'`: en la mañana; si no, en la tarde.)
          const key = insert.en === 'manana' ? 'manana' : 'tarde'
          const anchors = [].concat(insert.despues_de)
          const anchor = anchors.find((name) => sections[key].some((stop) => stop.lugar === name))
          const after = sections[key].findIndex((stop) => stop.lugar === anchor)
          // (`solo_si_esta`: sin ninguna de esas paradas, no se inserta.)
          if (after < 0 && insert.solo_si_esta) continue
          sections = { ...sections, [key]: after >= 0 ? [...sections[key].slice(0, after + 1), insert.parada, ...sections[key].slice(after + 1)] : [...sections[key], insert.parada] }
          continue
        }
        const at = sections.tarde.findIndex((stop) => stop.lugar === insert.antes_de)
        sections = { ...sections, tarde: at >= 0 ? [...sections.tarde.slice(0, at), insert.parada, ...sections.tarde.slice(at)] : [...sections.tarde, insert.parada] }
      }
      // `horas`: la hora fija de una parada ese día (D4 en domingo: la Galería a las 14:00, para bajar a Santa Maria del
      // Popolo cuando abre, a las 16:30).
      if (variant.horas) sections = { ...sections, manana: sections.manana.map((stop) => (variant.horas[stop.lugar] ? { ...stop, hora: variant.horas[stop.lugar] } : stop)), tarde: sections.tarde.map((stop) => (variant.horas[stop.lugar] ? { ...stop, hora: variant.horas[stop.lugar] } : stop)) }
      if (variant.atardecer) sections = { ...sections, tarde: sections.tarde.map((stop) => (stop.lugar === variant.atardecer ? { ...stop, rol: 'atardecer' } : stop)) }
      // `sin_estirar`: ese día no se estira (D4 en domingo: el Parque, para que Santa Maria del Popolo llegue abierta).
      // (Solo si lo que va detrás lo necesita: con Free Tour o con el sol pronto, Santa Maria del Popolo va antes o después.)
      if (variant.sin_estirar && !hasFreeTour && sunCondition({ sol_despues_de: '17:30' }, day)) sections = { ...sections, tarde: sections.tarde.map((stop) => (variant.sin_estirar.includes(stop.lugar) ? { ...stop, estirar: undefined } : stop)) }
    }
    // Invierno de ESTE día: con `atardecer_antes_de`, solo si el sol se pone antes de esa hora (D2: 18:20 — antes, se
    // sube primero al Janículo). `tranquilo_invierno` sigue la condición de la suya o, si no la trae, la de invierno.
    const sunsetToday = hoursOf(day).sunset
    const before = (hhmm) => hhmm == null || (sunsetToday != null && sunsetToday < Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1] ?? 0))
    // `forceWinter`: con el orden normal el mirador llegaba después del sol (decisión del usuario, 2026-09-28).
    // (`noWinter`: el orden normal, aunque sea invierno por la fecha, si con él se llega a todo abierto; cierre de Roma.)
    const winterFor = (name) => forceWinter || (!noWinter && isWinter(day) && before(cfg.variantes?.[name]?.atardecer_antes_de ?? null))
    // Tarde B de D5 (el Campidoglio y el Ghetto salen en otro día del viaje); si no, la A, con su atardecer de invierno.
    if (tardeB) apply('tarde_b')
    else if (cfg.variantes?.invierno?.atardecer && winterFor('invierno')) apply('invierno')
    if (cfg.variantes?.con_d5 && order.includes('D5')) apply('con_d5')
    if (winterFor('invierno') && !cfg.variantes?.invierno?.atardecer) apply('invierno')
    if (hasFreeTour) apply('con_free_tour')
    const weekday = WEEKDAY_KEY[norm(day.weekday ?? '')] ?? null
    if (weekday) {
      apply(weekday)
    }
    // Las de fecha (`si_fecha`: D1 el 25 de diciembre o el 1 de enero, "Navidad"), en el orden del JSON.
    const mmdd = realDateIso(day)?.slice(5) ?? null
    for (const [name, variant] of Object.entries(cfg.variantes ?? {})) if (mmdd && (variant.si_fecha ?? []).includes(mmdd)) apply(name)
    // "Museos cerrados" (D2 en domingo sin alternativa o en festivo): el día entero sin horas muertas.
    for (const [name, variant] of Object.entries(cfg.variantes ?? {})) if (variant.si_cerrado && closedThatDay(variant.si_cerrado, day)) apply(name)
    // Las de pool de D1 (2 días). San Clemente va a la tarde B de D5 si el viaje la lleva.
    for (const variant of poolDay && index === order.indexOf(poolDay) ? poolVariants.get(poolDay) ?? [] : []) {
      if (variant === poolRules['Basílica de San Clemente']?.antes && order.includes('D5')) continue
      apply(variant)
    }
    if (tardeB && inPool('Basílica de San Clemente') && !order.includes('D6')) apply(poolRules['Basílica de San Clemente']?.d5_tarde_b ?? 'tarde_b_san_clemente')
    // Rutas curadas (PROMPT_RUTAS_CURADAS, D5): lo del pool sin su día propio en el viaje (San Clemente sin D6) va en la
    // variante con su nombre del día que la tenga (`pool_san_clemente` de D5) si no es el día de las variantes de pool
    // (D1/D1-FT, ya resuelto arriba).
    for (const [name, rule] of Object.entries(poolRules)) {
      if (!inPool(name) || !rule?.antes || index === order.indexOf(poolDay) || !cfg.variantes?.[rule.antes]) continue
      if (rule.dia && order.includes(rule.dia)) continue
      if (!applied.includes(rule.antes)) apply(rule.antes)
    }
    // Sin Caracalla (no toca, cierra ese día o la quita el tope de museos): la mañana de D5 empieza en la Boca.
    const sinCaracalla = cfg.variantes?.sin_caracalla
    if (sinCaracalla) {
      const stop = sections.manana.find((other) => other.lugar === sinCaracalla.si_no_va)
      if (!stop || !stopApplies(stop, day) || closedThatDay(stop.lugar, day) || dropPaid.has(stop.lugar)) apply('sin_caracalla')
    }
    const closedAnchors = []
    const sin = applied.map((name) => cfg.variantes?.[name]?.sin).find(Boolean)
    if (sin) closedAnchors.push(sin)
    // Lo que va este viaje (ritmo, experiencia, pool, días, estación). Lo que no, se apunta: su compañero de grupo
    // lo enseña por fuera (el Castillo desde el Puente).
    // El museo de pago que este viaje no visita por dentro (su `solo`: sin pool ni Arte, pocos días) y se ve por fuera
    // (`minutos_fuera`) no desaparece: va por fuera, en su sitio (PROMPT_PENDIENTE B.4b). Lo demás, fuera como antes.
    // Un lugar no sale nunca dos veces en el mismo día (decisión del usuario, 2026-09-28): si una entrada suya va (la
    // Galería de D4 con Free Tour: el turno de las 13:00 en invierno, el de las 15:00 si no), la otra no se queda "por
    // fuera"; y de las que no van, una sola por fuera.
    const applying = new Set([...sections.manana, ...sections.tarde].filter((stop) => stopApplies(stop, day)).map((stop) => stop.lugar))
    // Lo de la tarde que hoy no va solo por el sol o la estación (Letrán en D5C, "los días largos"): si luego sobra tiempo,
    // el día lo recupera (repaso de la ruta 3, 2026-09-28). Con el nombre de la parada de antes, para volver a su sitio.
    const SUN_KEYS = new Set(['sol_antes_de', 'sol_despues_de', 'estacion'])
    const recoverable = sections.tarde
      .map((stop, at) => ({ stop, after: sections.tarde.slice(0, at).reverse().find((other) => stopApplies(other, day))?.lugar ?? null }))
      .filter(({ stop }) => stop.solo && !stopApplies(stop, day) && !applying.has(stop.lugar) && [].concat(stop.solo).every((cond) => Object.keys(cond).every((key) => SUN_KEYS.has(key))))
      .map(({ stop, after }) => ({ stop: { ...stop, solo: undefined }, after }))
    const notToday = [...sections.manana, ...sections.tarde].filter((stop) => !stopApplies(stop, day) && !seenOutside(stop) && !applying.has(stop.lugar)).map((stop) => stop.lugar)
    const outsideKept = new Set()
    const keep = (stop) => {
      if (stopApplies(stop, day)) return stop
      if (!seenOutside(stop) || applying.has(stop.lugar) || outsideKept.has(stop.lugar)) return null
      outsideKept.add(stop.lugar)
      return asOutside(stop)
    }
    const once = (list) => list.filter((stop, at) => list.findIndex((other) => other.lugar === stop.lugar) === at)
    sections = { ...sections, manana: once(sections.manana.map(keep).filter(Boolean)), tarde: once(sections.tarde.map(keep).filter(Boolean)) }
    // La tarde no repite lo que ya va por la mañana (el Cementerio, con la mañana sin Caracalla). Con la mañana YA
    // filtrada (PROMPT_RUTAS_CURADAS B.6): si la parada de la mañana no va este día, la de la tarde se queda.
    const morningNames = new Set(sections.manana.map((stop) => stop.lugar))
    sections = { ...sections, tarde: sections.tarde.filter((stop) => !morningNames.has(stop.lugar)) }
    // Lo marcado en el pool es una visita, nunca "de paso" (el Parque de Villa Borghese en la variante de invierno):
    // el pool manda sobre la variante (2026-09-27).
    const asVisit = (stop) => (inPool(stop.lugar) && stop.rol === 'de_paso' ? { ...stop, rol: 'parada' } : stop)
    sections = { ...sections, manana: sections.manana.map(asVisit), tarde: sections.tarde.map(asVisit) }
    // La sugerencia de día de una fecha especial, a su hora (el resto del día se ajusta): si el día ya lleva el lugar,
    // esa hora; si es una pausa del destino (la Bendición), entra en la mañana o en la tarde según la hora. Un lugar
    // que el día no lleva no se añade: el aviso no promete nada.
    const suggestion = dateSuggestionOf(day)
    let suggestionName = null
    if (suggestion && !suggestion.night) {
      const { sug } = suggestion
      const fixed = (stop) => ({ ...stop, hora: sug.hora, fija: true, rol: 'parada', ...(sug.por_que ? { por_que: sug.por_que } : {}), ...(sug.traslado ? { traslado: sug.traslado, traslado_min: sug.traslado_min } : {}) })
      const has = [...sections.manana, ...sections.tarde].some((stop) => stop.lugar === sug.lugar)
      if (has) sections = { ...sections, manana: sections.manana.map((stop) => (stop.lugar === sug.lugar ? fixed(stop) : stop)), tarde: sections.tarde.map((stop) => (stop.lugar === sug.lugar ? fixed(stop) : stop)) }
      else if ((destData.curated_breaks ?? []).some((item) => item.name === sug.lugar)) {
        const stop = fixed({ lugar: sug.lugar })
        sections = sug.hora < '13:00' ? { ...sections, manana: [...sections.manana, stop] } : { ...sections, tarde: [stop, ...sections.tarde] }
        // La comida con hora fija del día (D4 en invierno, a las 12:00) no pisa la bendición: come después, y cerca
        // (sin los restaurantes del barrio de siempre, que quedan lejos).
        if (sections.comida) sections = { ...sections, comida: { ...sections.comida, hora: undefined, bloque: undefined, temprana: undefined, restaurantes: undefined } }
      }
      suggestionName = sug.lugar
      // La vuelta de la sugerencia a lo que sigue del día (de San Pedro a la Borghese: el metro A).
      // (En la primera de la tarde que abre ese día: el 25 de diciembre la Galería está cerrada.)
      const firstOpen = sections.tarde.findIndex((stop) => !closedThatDay(stop.lugar, day))
      if (sug.traslado_despues && firstOpen >= 0 && !sections.tarde[firstOpen].traslado && sug.hora < '13:00') sections = { ...sections, tarde: sections.tarde.map((stop, at) => (at === firstOpen ? { ...stop, traslado: sug.traslado_despues, traslado_min: sug.traslado_despues_min } : stop)) }
    }
    // Media jornada (la excursión se lleva la mañana): solo la tarde.
    if (day.halfDayExcursion) sections = { ...sections, manana: [], comida: null }
    return { id, cfg, day, sections, applied, closedAnchors, notToday, tardeB, suggestionName, forceWinter, noWinter, recoverable }
  }
  // Lo que el tope de museos de pago quita (se decide con el viaje entero y se aplica al volver a resolver).
  const dropPaid = new Set()
  const tardeBOf = (entries, entry) => {
    const rule = entry.cfg.variantes?.tarde_b
    if (!rule) return false
    const others = new Set([...entries.filter((other) => other !== entry).flatMap((other) => namesOf(other.sections)), ...(hasFreeTour ? tourCovers : [])])
    // Tarde B en cuanto alguno (el Campidoglio o el Ghetto) sale en otro día del viaje; la A, solo si no sale ninguno.
    return (rule.si_salen_en_otro_dia ?? []).some((name) => others.has(name))
  }
  // Las entradas son parte del negocio (auditoría final de Roma, 2026-09-28): un imprescindible de pago que en este viaje
  // solo se ve con el Free Tour (el tour pasa por delante del Panteón, pero no entra) sale por dentro el mismo día, justo
  // al acabar el tour, igual que el Coliseo. Si ese día no cabe, lo intenta el programador en otro (más abajo).
  const paidEssential = (place) => place?.level === 1 && place.type === 'interior' && (place.ticket_info ?? []).some((line) => /de pago/i.test(line))
  const withTourInsides = (entries) => {
    if (!hasFreeTour || !tour?.name) return entries
    const inside = new Set(entries.flatMap((entry) => [...entry.sections.manana, ...entry.sections.tarde].filter((stop) => stop.rol !== 'de_paso').map((stop) => stop.lugar)))
    const missing = [...tourCovers].filter((name) => paidEssential(placeByName.get(name)) && !inside.has(name))
    if (missing.length === 0) return entries
    return entries.map((entry) => {
      for (const key of ['manana', 'tarde']) {
        const at = entry.sections[key].findIndex((stop) => stop.lugar === tour.name)
        if (at < 0) continue
        const added = missing.map((name) => ({ lugar: name, rol: 'parada', tras_free_tour: true, por_que: whyTexts.insideAfterTour(placeWithArticle(placeByName.get(name)), destData.destination ?? 'la ciudad') }))
        return { ...entry, tourInsides: missing, sections: { ...entry.sections, [key]: [...entry.sections[key].slice(0, at + 1), ...added, ...entry.sections[key].slice(at + 1)] } }
      }
      return entry
    })
  }
  const resolveAll = () => {
    const first = order.map((id, index) => resolveEntry(id, index))
    return withTourInsides(first.map((entry, index) => (tardeBOf(first, entry) ? resolveEntry(entry.id, index, { tardeB: true }) : entry)))
  }
  let resolved = resolveAll()

  // Tope de museos de pago (💶): lo del pool no cuenta; si sobran, fuera en el orden del JSON.
  const museumRules = rules.museos_de_pago
  if (museumRules) {
    const quota = (museumRules.tope ?? []).find((row) => contentDays <= row.hasta_dias)?.extra ?? 0
    const limit = quota + (selected.includes('arte_museos') ? museumRules.con_arte ?? 1 : 0)
    const paid = () => resolved.flatMap((entry) => [...entry.sections.manana, ...entry.sections.tarde].filter((stop) => stop.pago && !stop.sin_tope && !inPool(stop.lugar) && !inside(stop.lugar) && !dropPaid.has(stop.lugar)).map((stop) => stop.lugar))
    for (const name of museumRules.quitar_en_orden ?? []) {
      if (paid().length <= limit) break
      if (paid().includes(name)) dropPaid.add(name)
    }
    if (dropPaid.size > 0) {
      // Otra vez, sabiendo lo que sale: la mañana de D5 sin Caracalla si el tope se la lleva.
      resolved = resolveAll()
      for (const entry of resolved) {
        for (const name of dropPaid) if ([...entry.sections.manana, ...entry.sections.tarde].some((stop) => stop.lugar === name)) entry.notToday.push(name)
        // Lo que quita el tope y se ve por fuera, por fuera; lo demás, fuera.
        const capped = (stop) => (!dropPaid.has(stop.lugar) ? stop : seenOutside(stop) ? asOutside(stop) : null)
        entry.sections = { ...entry.sections, manana: entry.sections.manana.map(capped).filter(Boolean), tarde: entry.sections.tarde.map(capped).filter(Boolean) }
      }
    }
  }

  let lunchOverride = null
  let whyByPlace = null
  const toMin = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number)
    return h * 60 + m
  }
  // ── 5. Horas ────────────────────────────────────────────────────────────────────────────────
  const allLunchSpots = lunchSpots(destData)
  /** Las zonas de comida que abren ese día, una lista por conjunto (la misma lista siempre, para la memoria del programador). */
  const openSpotsCache = new Map()
  /** Los restaurantes que ya salen en el viaje: nunca el mismo dos veces (cierre de Roma, 2026-09-28). */
  const usedRestaurants = new Set()
  const openLunchSpots = (named, hours, exclude = new Set()) => {
    const dateIso = calendar.hasDates ? hours.dateIso : null
    const key = `${[...named].sort().join('|')}#${hours.weekday ?? ''}#${dateIso ?? ''}#${[...exclude].sort().join('|')}`
    if (!openSpotsCache.has(key)) {
      const openAll = allLunchSpots.filter((spot) => !closedOnDay(spot, hours.weekday, dateIso))
      const unused = openAll.filter((spot) => !exclude.has(spot.name))
      const open = unused.length > 0 ? unused : openAll
      const wanted = named.size > 0 ? open.filter((spot) => named.has(spot.name)) : open
      const zones = new Set(allLunchSpots.filter((spot) => named.has(spot.name)).map((spot) => mainZoneOf(spot.zone ?? '')))
      const sameZone = open.filter((spot) => zones.has(mainZoneOf(spot.zone ?? '')))
      openSpotsCache.set(key, wanted.length > 0 ? wanted : sameZone.length > 0 ? sameZone : open)
    }
    return openSpotsCache.get(key)
  }
  const dinnerOptions = dinnerZones(destData)
  const seen = new Set(hasFreeTour ? [...tourCovers] : [])
  const notEnoughTime = new Set()
  /** Lo que se quedó fuera porque ese día cerraba (el motivo que se enseña es el cierre). */
  const notEnoughClosed = new Map()
  /** En qué día se quedó sin hora cada uno (para avisarlo en ese día). */
  const notEnoughDay = new Map()
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
    // Si con el orden normal el mirador del atardecer llega después del sol (el Janículo a las 18:45 con el sol a las
    // 18:30), el orden de invierno: el mirador primero (decisión del usuario, 2026-09-28), sin depender solo de
    // `atardecer_antes_de`. Se queda si así llega a tiempo y no se pierde nada importante.
    const before = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
    let planned = planDay(entry, skeletonDay)
    const sunsetLate = (plan, sections) => {
      const sunset = plan.hours?.sunset
      if (sunset == null) return false
      const miradores = new Set([...sections.manana, ...sections.tarde].filter((stop) => stop.rol === 'atardecer').map((stop) => stop.lugar))
      return (plan.schedule?.visits ?? []).some((visit) => (visit.place.sunset != null || miradores.has(visit.place.name)) && visit.start > sunset) || (plan.schedule?.dropped ?? []).some(({ reason }) => reason === 'missed_sunset')
    }
    const keyDropped = (plan) => (plan.schedule?.dropped ?? []).filter(({ unit }) => unit.places.some((place) => place.level === 1 || inPool(place.name))).length
    const restore = (state) => {
      seen.clear(); for (const name of state.seen) seen.add(name)
      notEnoughTime.clear(); for (const name of state.notEnoughTime) notEnoughTime.add(name)
      notEnoughDay.clear(); for (const [name, value] of state.notEnoughDay) notEnoughDay.set(name, value)
    }
    /**
     * La espera antes del sol, si pasa de una hora (decisión del usuario, 2026-09-28; antes, de 90 min): primero la subida por el barrio y
     * luego, por dentro, el monumento que iba por fuera por tiempo. Vale para cualquier día con mirador, sea de invierno
     * por la fecha o por el orden forzado (repaso de las 20 rutas: el D2 de marzo esperaba 100 min antes del Janículo).
     */
    // La espera más larga del día entre dos visitas (sin contar comidas): lo que se vería como tiempo libre.
    const maxWait = (plan) => {
      const visits = (plan.schedule?.visits ?? []).filter((visit) => !visit.place.isNightExperience)
      const meals = plan.schedule?.meals ?? []
      let longest = 0
      for (let i = 1; i < visits.length; i++) {
        if (meals.some((meal) => meal.start >= visits[i - 1].end && meal.start < visits[i].start)) continue
        longest = Math.max(longest, visits[i].start - visits[i - 1].end - (visits[i].walkMinutes ?? 0))
      }
      return longest
    }
    // Los huecos que hay que rellenar (cierre de Roma): más de 30 min libres entre dos visitas o antes de comer, y las
    // paradas de paseo por encima de su máximo. Cada uno con la visita junto a la que está y cuántos minutos sobran.
    const issuesOf = (plan) => {
      const visits = (plan.schedule?.visits ?? []).filter((visit) => !visit.place.isNightExperience)
      const meals = plan.schedule?.meals ?? []
      const unitSlot = (visit) => (plan.units ?? []).find((unit) => unit.id === visit.unitId)?.slot ?? 'tarde'
      const out = []
      for (let i = 1; i < visits.length; i++) {
        if (meals.some((meal) => meal.start >= visits[i - 1].end && meal.start < visits[i].start)) continue
        const gap = visits[i].start - visits[i - 1].end - (visits[i].walkMinutes ?? 0)
        if (gap > FILL_GAP_MINUTES) out.push({ visit: visits[i - 1], slot: unitSlot(visits[i - 1]), amount: gap - FILL_GAP_MINUTES })
      }
      const lunch = meals.find((meal) => meal.type === 'lunch')
      const beforeLunch = lunch ? [...visits].reverse().find((visit) => visit.end <= lunch.start) : null
      if (beforeLunch && lunch.start - beforeLunch.end - LUNCH_WALK_ALLOWANCE > FILL_GAP_MINUTES) out.push({ visit: beforeLunch, slot: unitSlot(beforeLunch), amount: lunch.start - beforeLunch.end - LUNCH_WALK_ALLOWANCE - FILL_GAP_MINUTES })
      // (Y después de comer, hasta la siguiente: la comida de las 12:00 y la Galería de las 14:00.)
      const afterLunch = lunch ? visits.find((visit) => visit.start >= lunch.end) : null
      const afterGap = afterLunch ? afterLunch.start - lunch.end - (lunch.transitAfter ?? 0) : 0
      if (afterGap > FILL_GAP_MINUTES) out.push({ visit: afterLunch, slot: unitSlot(afterLunch), amount: afterGap - FILL_GAP_MINUTES, before: true })
      for (const visit of visits) {
        const max = paseoMaxOf(placeByName.get(visit.place.name))
        if (max != null && visit.end - visit.start > max) out.push({ visit, slot: unitSlot(visit), amount: visit.end - visit.start - max })
      }
      return out
    }
    const longestWalk = (plan) => Math.max(0, ...(plan.schedule?.visits ?? []).filter((visit) => !visit.place.transit).map((visit) => visit.walkMinutes ?? 0))
    const issueScore = (plan) => issuesOf(plan).reduce((sum, item) => sum + item.amount, 0)
    const worstIssue = (plan) => issuesOf(plan).sort((a, b) => b.amount - a.amount)[0] ?? null
    // Llenar la espera nunca puede costar una parada (sin el mirador, la espera "baja" a 0).
    const droppedCount = (plan) => (plan.schedule?.dropped ?? []).length
    // Para el monumento por dentro: lo que va "por el camino" (Via della Conciliazione, 5 min) no cuenta como pérdida.
    const realDropped = (plan) => (plan.schedule?.dropped ?? []).filter(({ unit }) => unit.role !== 'de_paso' && !unit.places.every((place) => place.passThrough || place.passBy)).length
    const fillSunWait = (start, opts) => {
      let cur = start.plan ? start : { entry: start.entry, plan: planDay(start.entry, skeletonDay) }
      // Con el mirador primero, la espera hasta el sol (más de una hora) se llena como lo haría un local: el monumento
      // que iba por fuera por tiempo (el Castillo), por dentro.
      const waitBeforeSun = (plan) => {
        const visits = plan.schedule?.visits ?? []
        const at = visits.findIndex((visit) => visit.place.sunset != null)
        return at > 0 ? visits[at].start - visits[at - 1].end - (visits[at].walkMinutes ?? 0) : 0
      }
      const outsideForTime = (plan) => (plan.schedule?.visits ?? []).find((visit) => visit.place.visitOutside && visit.place.outsideKind === 'no_cabe')
      // Un hueco de más de una hora antes del sol (el Castillo cerrado el lunes, decisión del usuario 2026-09-28): primero
      // entran las paradas de nivel 2-3 de camino, en la misma zona (subir al Janículo por el barrio: el Tempietto y la
      // Fontana dell'Acqua Paola van antes del mirador); después se estira lo estirable; y solo entonces tiempo libre.
      /** La subida por el barrio: lo de nivel 2-3 que va después del mirador y está a mano pasa antes (null si no hay). */
      const climbOf = (baseEntry) => {
        const tarde = baseEntry.sections.tarde
        const at = tarde.findIndex((stop) => stop.rol === 'atardecer')
        const mirador = at >= 0 ? placeByName.get(tarde[at].lugar) : null
        const near = (stop) => {
          const place = placeByName.get(stop.lugar)
          return place && mirador && (place.level ?? 3) >= 2 && Array.isArray(place.coordinates) && metersBetween(place.coordinates, mirador.coordinates) <= ON_THE_WAY_METERS
        }
        const after = at >= 0 ? tarde.slice(at + 1) : []
        const climb = after.filter(near).sort((a, b) => metersBetween(placeByName.get(b.lugar).coordinates, mirador.coordinates) - metersBetween(placeByName.get(a.lugar).coordinates, mirador.coordinates))
        if (climb.length === 0) return null
        // El transporte hasta el mirador pasa a la primera parada de la subida.
        const { traslado, traslado_min: trasladoMin, ...miradorStop } = tarde[at]
        const moved = climb.map((stop, index) => (index === 0 && traslado ? { ...stop, traslado, traslado_min: trasladoMin } : stop))
        return { ...baseEntry, sections: { ...baseEntry.sections, tarde: [...tarde.slice(0, at), ...moved, miradorStop, ...after.filter((stop) => !climb.includes(stop))] } }
      }
      // Un hueco de más de una hora antes del sol (el Castillo cerrado el lunes, decisión del usuario 2026-09-28): primero
      // entran las paradas de nivel 2-3 de camino, en la misma zona (subir al Janículo por el barrio: el Tempietto y la
      // Fontana dell'Acqua Paola van antes del mirador); después se estira lo estirable; y solo entonces tiempo libre.
      let climbed = false
      if (waitBeforeSun(cur.plan) > MID_DAY_WAIT_MAX) {
        const climbEntry = climbOf(cur.entry)
        if (climbEntry) {
          const beforeClimb = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
          const climbPlan = planDay(climbEntry, skeletonDay)
          if (!sunsetLate(climbPlan, climbEntry.sections) && droppedCount(climbPlan) <= droppedCount(cur.plan) && waitBeforeSun(climbPlan) < waitBeforeSun(cur.plan)) {
            cur = { entry: climbEntry, plan: climbPlan }
            climbed = true
          } else restore(beforeClimb)
        }
      }
      // Antes de dejar tiempo libre (segundo repaso, 2026-09-28): el monumento que ese día va por fuera por tiempo (el
      // Castillo) pasa a ir por dentro, si cabe. Con la subida por el barrio o sin ella; se queda si no se pierde nada y
      // la espera antes del sol no pasa de una hora.
      const filler = waitBeforeSun(cur.plan) >= FILL_INSIDE_MIN_IDLE && outsideForTime(cur.plan)
      if (filler) {
        const beforeFill = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
        autoInside.add(filler.place.name)
        const fresh = resolveEntry(entry.id, resolvedIndex - 1, opts)
        const candidates = [climbed ? climbOf(fresh) : null, fresh].filter(Boolean)
        for (const fillEntry of candidates) {
          const fillPlan = planDay(fillEntry, skeletonDay)
          if (!sunsetLate(fillPlan, fillEntry.sections) && realDropped(fillPlan) <= realDropped(cur.plan) && keyDropped(fillPlan) <= keyDropped(cur.plan) && waitBeforeSun(fillPlan) <= MID_DAY_WAIT_MAX && !outsideForTime(fillPlan)?.place?.name?.includes(filler.place.name)) {
            cur = { entry: fillEntry, plan: fillPlan }
            break
          }
          restore(beforeFill)
        }
        autoInside.delete(filler.place.name)
      }
      return cur
    }
    let forcedWinter = false
    // (Sin corte fijo por la hora del sol: el día elige el orden con el que el mirador llega a su hora; repaso 3.)
    if (sunsetLate(planned, entry.sections) && entry.cfg.variantes?.invierno && !entry.applied.includes('invierno')) {
      const after = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
      restore(before)
      const { entry: winterEntry, plan: winterPlan } = fillSunWait({ entry: resolveEntry(entry.id, resolvedIndex - 1, { tardeB: entry.tardeB, forceWinter: true }), plan: null }, { tardeB: entry.tardeB, forceWinter: true })
      if (!sunsetLate(winterPlan, winterEntry.sections) && keyDropped(winterPlan) <= keyDropped(planned) && realDropped(winterPlan) <= realDropped(planned)) {
        planned = winterPlan
        resolved[resolvedIndex - 1] = winterEntry
        forcedWinter = true
      } else restore(after)
    }
    // Al revés también (cierre de Roma, punto 3): invierno por la fecha, pero si con el orden normal el mirador llega a
    // su hora y se llega abierto a lo que el invierno dejaba cerrado (la subida andando al Janículo con el Tempietto
    // antes de su última entrada), el orden normal. Lo decide la hora, no el mes.
    if (!forcedWinter && entry.applied.includes('invierno') && !entry.forceWinter) {
      const closedCount = (plan) => (plan.schedule?.visits ?? []).filter((visit) => visit.place.visitOutside && (visit.place.outsideKind === 'ya_cerrado' || visit.place.outsideKind === 'no_abre')).length
      const after = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
      restore(before)
      const normalEntry = resolveEntry(entry.id, resolvedIndex - 1, { tardeB: entry.tardeB, noWinter: true })
      const normalPlan = planDay(normalEntry, skeletonDay)
      // (Sin perder el mirador: el orden normal que deja fuera el Janículo no vale.)
      const sunsetNames = (plan) => (plan.schedule?.visits ?? []).filter((visit) => visit.place.sunset != null || visit.place.nightView).map((visit) => visit.place.name)
      const keepsSunset = sunsetNames(planned).every((name) => (normalPlan.schedule?.visits ?? []).some((visit) => visit.place.name === name))
      if (keepsSunset && !normalEntry.applied.includes('invierno') && !sunsetLate(normalPlan, normalEntry.sections) && keyDropped(normalPlan) <= keyDropped(planned) && realDropped(normalPlan) <= realDropped(planned) && closedCount(normalPlan) < closedCount(planned)) {
        planned = normalPlan
        resolved[resolvedIndex - 1] = normalEntry
      } else restore(after)
    }
    // Invierno por la fecha (o cualquier día con mirador): la misma espera se llena igual.
    if (!sunsetLate(planned, resolved[resolvedIndex - 1].sections)) {
      const beforeNatural = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
      const filled = fillSunWait({ entry: resolved[resolvedIndex - 1], plan: planned }, { tardeB: entry.tardeB, forceWinter: forcedWinter || undefined })
      if (filled.plan !== planned) {
        planned = filled.plan
        resolved[resolvedIndex - 1] = filled.entry
      } else restore(beforeNatural)
    }
    // Antes de dejar más de 30 min de tiempo libre, el día recupera una parada suya que se había quedado fuera, si está
    // abierta y cabe (la misma idea que el Castillo por dentro; repaso de la ruta 3, 2026-09-28).
    const current = resolved[resolvedIndex - 1]
    if (current?.recoverable?.length && (maxWait(planned) > RECOVER_MIN_GAP || issueScore(planned) > 0)) {
      const beforeRecover = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
      let tarde = [...current.sections.tarde]
      for (const { stop, after } of current.recoverable) {
        const at = after ? tarde.findIndex((other) => other.lugar === after) : -1
        tarde = [...tarde.slice(0, at + 1), stop, ...tarde.slice(at + 1)]
      }
      const recoveredEntry = { ...current, sections: { ...current.sections, tarde } }
      const recoveredPlan = planDay(recoveredEntry, skeletonDay)
      const visited = current.recoverable.every(({ stop }) => (recoveredPlan.schedule?.visits ?? []).some((visit) => visit.place.name === stop.lugar && !visit.place.visitOutside))
      if (visited && (!sunsetLate(recoveredPlan, recoveredEntry.sections) || sunsetLate(planned, current.sections)) && realDropped(recoveredPlan) <= realDropped(planned) && keyDropped(recoveredPlan) <= keyDropped(planned) && (maxWait(recoveredPlan) < maxWait(planned) || (maxWait(recoveredPlan) <= maxWait(planned) && issueScore(recoveredPlan) < issueScore(planned)))) {
        planned = recoveredPlan
        resolved[resolvedIndex - 1] = recoveredEntry
      } else restore(beforeRecover)
    }
    // Una sola regla de relleno (cierre de Roma, 2026-09-28): antes de dejar más de 30 min de tiempo libre, o de estirar
    // una parada de paseo por encima de su máximo (90 min en completo, 120 en tranquilo, 45 una avenida), el día prueba:
    // a) el monumento que iba "por fuera para llegar a todo", por dentro; b) lo suyo que se quedó fuera (arriba);
    // c) la siguiente parada de la misma zona que no esté en el viaje, por nivel y abierta a esa hora. Solo si nada de
    // eso cabe, tiempo libre.
    for (let round = 0; round < FILL_ROUNDS && issueScore(planned) > 0; round++) {
      const entryNow = resolved[resolvedIndex - 1]
      const issue = worstIssue(planned)
      if (!issue) break
      const snapshot = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
      const accept = (candidatePlan, candidateEntry, mustVisit = null, newStop = false) => {
        const visited = !mustVisit || (candidatePlan.schedule?.visits ?? []).some((visit) => visit.place.name === mustVisit && !visit.place.visitOutside)
        // (Sin empeorar el atardecer: si ya no llegaba, tampoco se le pide.)
        // (Ni un tramo andando más largo que los que ya tenía el día.)
        // (Y lo que se añade, de camino: se llega y se sale andando en poco, sin ir y volver; el Ara Pacis sí, los Mercados
        // de Trajano entre la Isla Tiberina y el Teatro de Marcelo no.)
        const visits = candidatePlan.schedule?.visits ?? []
        const at = mustVisit ? visits.findIndex((visit) => visit.place.name === mustVisit) : -1
        // (Cada tramo nuevo, como mucho 15 min o lo que ya se andaba de una a otra sin ella.)
        const direct = at >= 0 && visits[at + 1] ? (planned.schedule?.visits ?? []).find((visit) => visit.place.name === visits[at + 1].place.name)?.walkMinutes ?? 0 : 0
        const onTheWay = !newStop || at < 0 || [visits[at], visits[at + 1]].every((visit) => !visit || visit.place.transit || (visit.walkMinutes ?? 0) <= Math.max(FILL_LEG_MAX, direct))
        return visited && onTheWay && longestWalk(candidatePlan) <= Math.max(FILL_WALK_MAX, longestWalk(planned)) && (!sunsetLate(candidatePlan, candidateEntry.sections) || sunsetLate(planned, entryNow.sections)) && realDropped(candidatePlan) <= realDropped(planned) && keyDropped(candidatePlan) <= keyDropped(planned) && issueScore(candidatePlan) < issueScore(planned)
      }
      let improved = false
      // a) Por dentro lo que iba por fuera por tiempo.
      const outsideVisit = (planned.schedule?.visits ?? []).find((visit) => visit.place.visitOutside && visit.place.outsideKind === 'no_cabe')
      if (outsideVisit) {
        autoInside.add(outsideVisit.place.name)
        const insideEntry = resolveEntry(entryNow.id, resolvedIndex - 1, { tardeB: entryNow.tardeB, forceWinter: entryNow.forceWinter || undefined, noWinter: entryNow.noWinter || undefined })
        const insidePlan = planDay(insideEntry, skeletonDay)
        autoInside.delete(outsideVisit.place.name)
        if (accept(insidePlan, insideEntry, outsideVisit.place.name)) {
          planned = insidePlan
          resolved[resolvedIndex - 1] = insideEntry
          improved = true
        } else restore(snapshot)
      }
      // b) Una parada suya que se ha quedado fuera (Monti, "si da tiempo", detrás del atardecer): al hueco.
      if (!improved) {
        const key = issue.slot === 'manana' ? 'manana' : 'tarde'
        const list = entryNow.sections[key]
        // (Lo que no sale en el plan: perdido por tiempo o quitado por "si da tiempo".)
        const plannedNames = new Set((planned.schedule?.visits ?? []).map((visit) => visit.place.name))
        const droppedNames = new Set(list.filter((stop) => stop.rol === 'parada' && !plannedNames.has(stop.lugar) && !closedThatDay(stop.lugar, skeletonDay)).map((stop) => stop.lugar))
        const at = list.findIndex((stop) => stop.lugar === issue.visit.place.name)
        // (Y lo suyo que va detrás del atardecer, adelantado al hueco de antes: Trastevere antes de subir al Janículo.)
        const sunsetAt = list.findIndex((other) => other.rol === 'atardecer')
        const laterOwn = sunsetAt > at && at >= 0 ? list.slice(sunsetAt + 1).filter((other) => other.rol === 'parada' && plannedNames.has(other.lugar) && !droppedNames.has(other.lugar)) : []
        for (const stop of [...list.filter((other) => droppedNames.has(other.lugar) && other.rol !== 'atardecer'), ...laterOwn]) {
          if (at < 0) break
          const without = list.filter((other) => other !== stop)
          const where = without.findIndex((other) => other.lugar === issue.visit.place.name)
          const movedEntry = { ...entryNow, sections: { ...entryNow.sections, [key]: [...without.slice(0, where + 1), { ...stop, si_da_tiempo: undefined }, ...without.slice(where + 1)] } }
          const movedPlan = planDay(movedEntry, skeletonDay)
          if (accept(movedPlan, movedEntry, stop.lugar)) {
            planned = movedPlan
            resolved[resolvedIndex - 1] = movedEntry
            improved = true
            break
          }
          restore(snapshot)
        }
      }
      // c) La siguiente parada de la misma zona que no esté en el viaje (por nivel, y abierta a esa hora).
      if (!improved) {
        const anchor = issue.visit
        const anchorPlace = placeByName.get(anchor.place.name)
        // (También junto a la visita de antes, en la misma parte del día: el Ara Pacis entre el Popolo y el Pincio.)
        const plannedVisits = planned.schedule?.visits ?? []
        const key = issue.slot === 'manana' ? 'manana' : 'tarde'
        // (Solo las paradas propias del día: lo que ya se añadió de relleno no arrastra a otra zona.)
        const own = (visit) => visit && entryNow.sections[key].some((stop) => stop.lugar === visit.place.name && !stop.relleno)
        const ownVisits = plannedVisits.filter((visit) => visit === anchor || own(visit))
        const previous = ownVisits[ownVisits.indexOf(anchor) - 1]
        const refs = [own(anchor) || !anchorPlace ? anchorPlace : null, previous ? placeByName.get(previous.place.name) : null].filter((place) => place && Array.isArray(place.coordinates))
        const nearRef = (place) => refs.filter((ref) => metersBetween(place.coordinates, ref.coordinates) <= (place.zone && place.zone === ref.zone ? FILL_ZONE_METERS : FILL_NEAR_METERS)).sort((a, b) => metersBetween(place.coordinates, a.coordinates) - metersBetween(place.coordinates, b.coordinates))[0] ?? null
        const inTrip = new Set([...seen, ...resolved.filter(Boolean).flatMap((other) => [...other.sections.manana, ...other.sections.tarde].map((stop) => stop.lugar)), ...days.flatMap((other) => (other.schedule?.visits ?? []).map((visit) => visit.place.name))])
        const candidates = (destData.places ?? [])
          .filter((place) => anchorPlace && Array.isArray(place.coordinates) && nearRef(place) && !inTrip.has(place.name) && !place.isFreeTour && !isStreet(place) && Array.isArray(place.coordinates) && !closedThatDay(place.name, skeletonDay))
          .sort((a, b) => (a.level ?? 3) - (b.level ?? 3) || metersBetween(a.coordinates, nearRef(a).coordinates) - metersBetween(b.coordinates, nearRef(b).coordinates))
          .slice(0, FILL_CANDIDATES)
        // (Después de su parada de referencia o, si a esa hora ya no cabe, justo antes.)
        const tries = candidates.flatMap((place) => [{ place, before: false }, { place, before: true }])
        for (const { place, before } of tries) {
          const list = entryNow.sections[key]
          const at = list.findIndex((stop) => stop.lugar === nearRef(place).name)
          if (before && (at < 0 || list[at].rol === 'atardecer')) continue
          // (Con su texto: el del destino o, si no tiene, el consejo de su ficha; nunca "Te pilla de camino".)
          const stop = { lugar: place.name, rol: 'parada', relleno: true, por_que: curatedWhyOf(place.name) ?? place.tip ?? undefined }
          const nextList = at < 0 ? [...list, stop] : before ? [...list.slice(0, at), stop, ...list.slice(at)] : [...list.slice(0, at + 1), stop, ...list.slice(at + 1)]
          const addedEntry = { ...entryNow, sections: { ...entryNow.sections, [key]: nextList } }
          const addedPlan = planDay(addedEntry, skeletonDay)
          if (accept(addedPlan, addedEntry, place.name, true)) {
            planned = addedPlan
            resolved[resolvedIndex - 1] = addedEntry
            improved = true
            break
          }
          restore(snapshot)
        }
      }
      if (!improved) break
    }
    // Antes de dejar algo "por fuera" porque ya ha cerrado, se prueba a cambiarlo de sitio con la parada de al lado de la
    // misma zona (San Pietro in Vincoli antes que Santa María la Mayor, los domingos de invierno; cierre de Roma).
    {
      const entryNow = resolved[resolvedIndex - 1]
      const closedVisit = (planned.schedule?.visits ?? []).find((visit) => {
        if (!visit.place.visitOutside || visit.place.outsideKind !== 'ya_cerrado') return false
        const sessions = parseHoursSessions(effectiveSchedule(placeByName.get(visit.place.name) ?? visit.place, hoursOf(skeletonDay)))
        return sessions.length > 0 && !sessions.some((session) => session.open > visit.start)
      })
      const key = closedVisit ? (['manana', 'tarde'].find((slot) => entryNow.sections[slot].some((stop) => stop.lugar === closedVisit.place.name)) ?? null) : null
      if (key) {
        const list = entryNow.sections[key]
        const at = list.findIndex((stop) => stop.lugar === closedVisit.place.name)
        const here = placeByName.get(closedVisit.place.name)
        for (const other of [at - 1, at + 1]) {
          const neighbour = list[other]
          const there = neighbour ? placeByName.get(neighbour.lugar) : null
          if (!there || !here || neighbour.rol !== 'parada' || !['interior', 'mixto'].includes(there.type) || (there.group && there.group === here.group) || !(there.zone === here.zone || metersBetween(there.coordinates, here.coordinates) <= FILL_NEAR_METERS * 2)) continue
          const swapped = [...list]
          ;[swapped[at], swapped[other]] = [swapped[other], swapped[at]]
          const snapshot = { seen: new Set(seen), notEnoughTime: new Set(notEnoughTime), notEnoughDay: new Map(notEnoughDay) }
          const swappedEntry = { ...entryNow, sections: { ...entryNow.sections, [key]: swapped } }
          const swappedPlan = planDay(swappedEntry, skeletonDay)
          const insideNow = (swappedPlan.schedule?.visits ?? []).some((visit) => visit.place.name === closedVisit.place.name && !visit.place.visitOutside)
          if (insideNow && (!sunsetLate(swappedPlan, swappedEntry.sections) || sunsetLate(planned, entryNow.sections)) && realDropped(swappedPlan) <= realDropped(planned) && keyDropped(swappedPlan) <= keyDropped(planned)) {
            planned = swappedPlan
            resolved[resolvedIndex - 1] = swappedEntry
            break
          }
          restore(snapshot)
        }
      }
    }
    for (const meal of planned.schedule?.meals ?? []) if (meal.type === 'lunch' && meal.spot?.name) usedRestaurants.add(meal.spot.name)
    if (planned.dinnerRestaurant?.name) usedRestaurants.add(planned.dinnerRestaurant.name)
    days.push(planned)
  }

  // Para cambiar la cena de sitio sin repetir restaurante: los que salen el resto del viaje (y la comida del día).
  const lunchOf = (day) => (day.schedule?.meals ?? []).find((meal) => meal.type === 'lunch')?.spot?.name ?? null
  for (const day of days) {
    day.otherRestaurants = days.flatMap((other) => [lunchOf(other), other === day ? null : other.dinnerRestaurant?.name ?? null]).filter(Boolean)
  }
  // Revisitas marcadas (decisión del usuario, 2026-09-28): un lugar solo se repite otro día si su parada lo dice
  // (`revisita`), a otra hora y con su texto de revisita ("Ya estuviste el Día 1, pero al atardecer es otro sitio…").
  for (const [index, day] of days.entries()) {
    for (const unit of day.units ?? []) {
      if (!unit.revisitText) continue
      const name = unit.places[0]?.name
      const earlier = days.slice(0, index).find((other) => (other.schedule?.visits ?? []).some((visit) => visit.place.name === name))
      if (earlier) unit.revisitReason = unit.revisitText.replace('{dia}', String(earlier.dayNumber))
    }
  }

  /** El `por_que` más habitual de un lugar en los días curados (para las paradas que no traen el suyo). */
  function curatedWhyOf(name) {
    if (!whyByPlace) {
      const counts = new Map()
      for (const cfg of destData.curated_days ?? []) {
        for (const section of [cfg, ...Object.values(cfg.variantes ?? {})]) {
          // (También las paradas que traen los `insertar`: la Porta Pinciana del domingo.)
          for (const item of [...(section.manana ?? []), ...(section.tarde ?? []), ...(section.tarde_antes ?? []), ...(section.insertar ?? []).map((insert) => insert.parada)]) {
            if (!item?.por_que) continue
            const byText = counts.get(item.lugar) ?? new Map()
            const key = JSON.stringify(item.por_que)
            byText.set(key, (byText.get(key) ?? 0) + 1)
            counts.set(item.lugar, byText)
          }
        }
      }
      whyByPlace = new Map([...counts].map(([lugar, byText]) => [lugar, JSON.parse([...byText].sort((a, b) => b[1] - a[1])[0][0])]))
    }
    return whyByPlace.get(name) ?? destData.por_que_lugares?.[name] ?? null
  }

  /** La unidad, o null si no sale (se salta: cerrada sin nada que ver por fuera). */
  function usable(unit) {
    return unit && !unit.skipped ? unit : null
  }

  function unitOf(stop, slot, index, dayId, day) {
    const hours = hoursOf(day)
    // Las pausas con nombre del día curado (`curated_breaks`: el desayuno romano de D4) son paradas, no huecos.
    const pause = (destData.curated_breaks ?? []).find((item) => item.name === stop.lugar)
    const source = stop.lugar === tour?.name ? { ...tour, isFreeTour: true, duration_minutes: tour.duration_minutes ?? 150 } : pause ? { ...pause, isBreak: true, level: 3, type: 'exterior', is_free_access: true } : placeByName.get(stop.lugar)
    if (!source) return null
    let role = stop.rol ?? 'parada'
    let ready = { ...source }
    // Todo monumento es parada, por dentro o por fuera (decisión del usuario, 2026-09-28): un lugar de nivel 1 o 2
    // (imprescindibles y muy visitados, sean edificios, fuentes, plazas o parques) nunca va "Por el camino" ni escondido
    // en otra parada. Los que tienen interior van por dentro o, con `minutos_fuera`, por fuera (su tiempo corto, su
    // `por_fuera` y el motivo); sin `minutos_fuera` no hay nada que ver por fuera y no salen ("No te dio tiempo").
    const monument = (source.level ?? 3) <= 2 && !source.isFreeTour && !source.isBreak
    const hasInside = source.type === 'interior'
    const outsideMinutes = source.minutos_fuera ?? null
    let outsideReason = null
    let closedSkip = false
    const closedToday = !source.isFreeTour && closedThatDay(stop.lugar, day)
    if (closedToday) {
      // Cerrado ese día: por fuera si se ve desde fuera; lo de exterior (un parque con horario), de paso; lo demás, fuera.
      if (hasInside) {
        if (outsideMinutes != null) outsideReason = OUTSIDE_REASONS.cerrado
        else closedSkip = true
      } else role = 'de_paso'
    }
    if (closedSkip) return { skipped: true, stop, source }
    if (role === 'de_paso' && monument && !outsideReason) {
      if (!hasInside) {
        // Un monumento de exterior (la Plaza de España, Campo de' Fiori) que el día pone de paso: parada corta.
        role = 'parada'
        // (Un imprescindible, 20 min como mínimo: la Plaza de España no se ve en 10.)
        ready = { ...ready, duration_minutes: Math.max(source.level === 1 ? IMPRESCINDIBLE_MIN_MINUTES : 0, stop.minutos ?? Math.min(source.duration_minutes ?? SHORT_STOP_MINUTES, SHORT_STOP_MINUTES)) }
      } else if (outsideMinutes != null) {
        outsideReason = stop.si_cerrado ? OUTSIDE_REASONS.ya_cerrado : stop.fuera_motivo ?? OUTSIDE_REASONS.no_cabe
      } else return { skipped: true, stop, source }
    }
    if (outsideReason) {
      // Por fuera: parada con su tiempo corto, desde donde se ve (su `pass_by` si lo trae), sin horario de visita.
      role = stop.rol === 'atardecer' ? 'atardecer' : 'parada'
      ready = {
        ...source,
        visitOutside: true,
        outsideReason,
        // Qué motivo es (cerrado / ya_cerrado / no_cabe): solo "no_cabe" deja pedir "Quiero entrar".
        outsideKind: Object.keys(OUTSIDE_REASONS).find((key) => OUTSIDE_REASONS[key] === outsideReason) ?? 'no_cabe',
        coordinates: source.pass_by?.coordinates ?? source.coordinates,
        duration_minutes: outsideMinutes,
        windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior',
      }
    } else if (role === 'de_paso') {
      const passBy = source.level === 1 ? source.pass_by : null
      ready = {
        ...source,
        passThrough: true,
        coordinates: passBy?.coordinates ?? source.coordinates,
        duration_minutes: passBy ? passBy.minutes ?? OUTSIDE_MINUTES : Math.min(source.duration_minutes ?? PASS_THROUGH_MINUTES, PASS_THROUGH_MINUTES),
        ...(passBy?.includes?.length ? { outsideOf: passBy.includes } : {}),
        // Por qué no se entra (B2.3): lo dice la tarjeta "Por fuera" si es un monumento (tiene interior).
        outsideReason: closedToday ? 'cerrado hoy' : stop.si_cerrado ? 'a esta hora ya ha cerrado' : 'hoy no toca entrar',
        windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior',
      }
    } else if (role === 'atardecer' && hours.sunset != null) ready = { ...ready, sunset: hours.sunset, ...(stop.atardecer_desde ? { sunsetLead: stop.atardecer_desde } : {}) }
    // La hora del día curado (Coliseo 08:30, Trevi 08:00, la Galería a las 15:00): como pronto a esa hora.
    if (stop.hora && (stop.rol ?? 'parada') !== 'de_paso') ready = { ...ready, not_before: stop.hora }
    // `fija`: a esa hora exacta (la bendición Urbi et Orbi, a las 12:00).
    if (stop.fija && stop.hora) ready = { ...ready, fixed_start: stop.hora }
    // `antes_de`: la visita tiene que haber acabado a esa hora (Santa Maria del Popolo, antes de las 12:00: nunca
    // se pasa a la tarde).
    if (stop.antes_de && role !== 'de_paso' && !ready.visitOutside) ready = { ...ready, latest_end: stop.antes_de }
    if (stop.no_calle) ready = { ...ready, notStreet: true }
    // `max_minutos`: el puente no se queda con lo que sobra del redondeo (lo que sobra pasa a lo siguiente).
    if (stop.max_minutos) ready = { ...ready, maxMinutes: stop.max_minutos }
    // `salida`: donde acaba la visita, si no es donde se entra (el Foro sale junto al Campidoglio); se mide desde ahí.
    if (Array.isArray(source.salida) && !ready.visitOutside && !ready.passThrough && !ready.end_coordinates) ready = { ...ready, end_coordinates: source.salida }
    // (Por fuera manda su `minutos_fuera`, no los minutos de la visita por dentro.)
    if (stop.minutos && !ready.visitOutside) ready = { ...ready, duration_minutes: role === 'de_paso' ? stop.minutos : Math.max(source.level === 1 ? IMPRESCINDIBLE_MIN_MINUTES : 0, stop.minutos) }
    // `traslado_min`: se llega en transporte y el tramo no pasa de esos minutos (el metro B de Piramide a Colosseo
    // en la tarde B de D5, 20 min puerta a puerta frente a 30 andando).
    if (stop.traslado_min) ready = { ...ready, transitMinutes: stop.traslado_min, ...(stop.traslado ? { transitHow: stop.traslado } : {}) }
    if (stop.aviso) ready = { ...ready, stopNotice: stop.aviso }
    if (stop.nota) ready = { ...ready, curatedNote: stop.nota }
    // El "Por qué aquí" que ve el viajero (`por_que`); la `nota` es interna. Lo que añade el pool sin su texto, el
    // más habitual de ese lugar en los días curados.
    const why = stop.por_que ?? curatedWhyOf(stop.lugar)
    if (why) ready = { ...ready, curatedWhy: why }
    const [scheduled] = placesForScheduler({ id: stop.lugar, places: [ready] }, destData, tour?.default_time ?? null)
    const level = source.level ?? 3
    const dropRank = joyaNames.has(source.name) || level === 1 || inside(source.name) ? DROP_RANK.joya : inPool(source.name) ? DROP_RANK.pool : DROP_RANK[role] ?? DROP_RANK.parada
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
      // `estirar`: aquí va el tiempo que sobre antes del atardecer (Trastevere en D2, nunca arriba en el monte).
      // `estirar_max`: hasta cuántos minutos se puede estirar (el Circo Máximo, un prado: 30).
      ...(stop.estirar ? { stretch: true, stretchMax: stop.estirar_max ?? null } : {}),
      // El monumento que el motor pasa a por dentro para llenar la espera antes del sol (el Castillo, la terraza del ángel)
      // se lleva también lo que sobre (decisión del usuario, 2026-09-28).
      ...(!stop.estirar && autoInside.has(source.name) ? { stretch: true, stretchMax: null } : {}),
      // `estirar_titulo` / `estirar_texto`: estirada 45 min o más, la parada se llama así ("Tiempo libre en Villa Borghese").
      ...(stop.estirar && stop.estirar_titulo ? { stretchTitle: stop.estirar_titulo, stretchWhy: stop.estirar_texto ?? null, stretchBase: scheduled.duration_minutes ?? null } : {}),
      // `si_abre`: solo si está abierta al llegar; si hay que esperar a que abra, no entra (Santa Cecilia).
      ...(stop.si_abre ? { onlyIfOpenNow: true } : {}),
      // `revisita`: si el viaje ya lo vio otro día, sale como revisita con este texto ({dia}: el día en que se vio).
      ...(stop.revisita ? { revisitText: stop.revisita } : {}),
      // `aperitivo`: la parada de antes de cenar que se estira hasta la cena (Campo de' Fiori el sábado).
      ...(stop.aperitivo ? { aperitivo: true } : {}),
      ...(stop.si_da_tiempo ? { onlyIfTime: true } : {}),
      // `si_cerrado: de_paso`: si a esa hora ya cerró, se ve de paso (el Tempietto).
      ...(stop.si_cerrado === 'de_paso' ? { passIfClosed: true, curatedStop: stop } : {}),
    }
  }

  /** Programa un día: la comida acortada, como último recurso. */
  function schedule(day, units, dinnerPoint, spots, morning) {
    const hours = hoursOf(day)
    // La hora de comer del día, si la trae (`comida.hora`, `comida.bloque`: D4 en invierno come a las 12:00 para
    // llegar al turno de las 13:00 de la Galería).
    // `comida.temprana`: solo si así no se pierde nada del día (la tarde B de D5 en invierno llega al Moisés).
    const lunch = lunchOverride
    let lunchAt = lunch?.hora ?? null
    const withLunch = (dayMode) => (lunchAt ? { ...dayMode, lunchWindow: [toMin(lunchAt), toMin(lunchAt) + 15], ...(lunch?.bloque ? { lunchBlockMinutes: lunch.bloque, mealMinutes: Math.min(dayMode.mealMinutes, lunch.bloque - 15) } : {}) } : dayMode)
    // Los tramos que el día hace en transporte (`traslado_min`): como mucho esos minutos.
    const travelFor = (list) => {
      const transitTo = new Map(list.flatMap((unit) => unit.places.filter((place) => place.transitMinutes).map((place) => [String(place.coordinates), place.transitMinutes])))
      if (transitTo.size === 0) return travel
      return {
        ...travel,
        leg: (from, to, travelMode) => {
          const base = travel.leg(from, to, travelMode)
          const cap = transitTo.get(String(Array.isArray(to) ? to : [to?.lat, to?.lng]))
          return base && cap != null && base.minutes > cap ? { ...base, minutes: cap, transit: true } : base
        },
      }
    }
    const run = (dayMode, list = units) =>
      scheduleFixedOrder({
        units: list,
        mode: withLunch(dayMode),
        travel: travelFor(list),
        start: { minutes: morning ? dayMode.dayStart : dayMode.halfDayRouteStart ?? mode.halfDayRouteStart, coordinates: null },
        pendingMeals: { lunch: morning, dinner: true },
        dinnerPoint,
        hours,
        lunchSpots: spots,
        keepOrder: true,
      })
    const levelOneLost = (result) => result.dropped.filter(({ unit }) => unit.places.some((place) => place.level === 1)).length
    // Lo que no se puede perder: un nivel 1 o lo del pool (el pool manda sobre todo, decisión del 2026-09-28).
    const keyLost = (candidate) => candidate.dropped.filter(({ unit }) => unit.places.some((place) => place.level === 1 || inPool(place.name))).length
    const realKey = (result) => new Set(result.visits.filter((visit) => !visit.place.passThrough && (placeByName.get(visit.place.name)?.level === 1 || inPool(visit.place.name))).map((visit) => visit.place.name))
    let result = run(mode)
    if (lunch?.temprana && morning) {
      const lost = (candidate) => candidate.dropped.filter(({ unit }) => unit.role !== 'de_paso').length
      if (lost(result) > 0) {
        lunchAt = lunch.temprana
        const early = run(mode)
        if (lost(early) < lost(result)) result = early
        else lunchAt = null
      }
    }
    const modeFallback = null
    let shortenedLunch = null
    // (Y para no perder un lugar del pool: el pool manda sobre todo.)
    if (keyLost(result) > 0 && morning) {
      const baseMode = mode
      const shortLunch = { ...baseMode, mealMinutes: Math.max(SHORT_LUNCH_MINUTES, Math.min(baseMode.mealMinutes, SHORT_LUNCH_MINUTES)), lunchBlockMinutes: Math.min(baseMode.lunchBlockMinutes, SHORT_LUNCH_BLOCK_MINUTES), visitDurationBonus: 0 }
      const alt = run(shortLunch)
      if (keyLost(alt) < keyLost(result) && levelOneLost(alt) <= levelOneLost(result)) {
        shortenedLunch = result.dropped.filter(({ unit }) => unit.places.some((place) => place.level === 1 || inPool(place.name)) && !alt.dropped.some((other) => other.unit.id === unit.id)).flatMap(({ unit }) => unit.places.map((place) => place.name))
        result = alt
      }
    }
    return { ...result, modeFallback, ...(shortenedLunch ? { shortenedLunch } : {}), run: (list) => run(mode, list) }
  }

  function planDay(entry, day) {
    const { id: dayId, cfg, sections } = entry
    const lunchNeeds = sections.comida?.si_lleva
    lunchOverride = (sections.comida?.hora || sections.comida?.temprana) && (!lunchNeeds || [...sections.manana, ...sections.tarde].some((stop) => stop.lugar === lunchNeeds)) ? sections.comida : null
    const hours = hoursOf(day)
    const morning = !day.halfDayExcursion
    const skipped = []
    // El transporte es del TRAMO, no de la parada (B.3): si una parada con `traslado` se salta (las catacumbas en
    // miércoles), la siguiente hereda su bus o su metro.
    const build = (stops, slot) => {
      const units = []
      let carry = null
      stops.forEach((stop, index) => {
        const unit = unitOf(carry && !stop.traslado_min ? { ...stop, traslado: carry.traslado, traslado_min: carry.traslado_min } : stop, slot, index, dayId, day)
        if (unit?.skipped) {
          skipped.push(unit)
          if (stop.traslado_min) carry = { traslado: stop.traslado, traslado_min: stop.traslado_min }
          return
        }
        carry = null
        if (unit) units.push(unit)
      })
      return units
    }
    let units = [...build(sections.manana, 'manana'), ...build(sections.tarde, 'tarde')]
    // Un monumento no va nunca escondido en el texto de otra parada (decisión del usuario, 2026-09-27): lo de su grupo
    // que ese día no se visita (cerrado, no toca este viaje, el tope de museos de pago) y lo que un lugar tiene delante
    // (`pass_by.includes`: la Plaza Venecia desde el Altar) sale en su propia línea, junto a su compañero: "Por fuera"
    // con su motivo si es un monumento, "Por el camino" si no. Donde el día curado lo pone si lo nombra (el Castillo,
    // antes del Puente); si no, justo después del compañero.
    const groupOf = (name) => placeByName.get(name)?.group ?? null
    const curatedOrder = [...sectionsOf(cfg).manana, ...sectionsOf(cfg).tarde, ...Object.values(cfg.variantes ?? {}).flatMap((variant) => [...(variant.manana ?? []), ...(variant.tarde_antes ?? []), ...(variant.tarde ?? [])])].map((stop) => stop.lugar)
    /** Mete en `list` la línea propia de cada lugar de `wanted` (nombre → unidad del compañero). */
    const withOutsideLines = (list, wanted) => {
      for (let [name, host] of wanted) {
        const hostName = host.places[0].name
        // Primero la plaza o el puente, luego el monumento (`group_order`, PROMPT_PENDIENTE C): la Plaza Venecia antes
        // que el Altar; sin orden de grupo, donde lo pone el día curado.
        const own = placeByName.get(name)?.group_order
        const hostOrder = placeByName.get(hostName)?.group_order
        const before = own != null && hostOrder != null ? own < hostOrder : curatedOrder.indexOf(name) >= 0 && curatedOrder.indexOf(name) < curatedOrder.indexOf(hostName)
        let unit = unitOf({ lugar: name, rol: 'de_paso', por_fuera: true }, host.slot, (host.curatedIndex ?? 0) % CURATED_AFTERNOON_OFFSET + (before ? -0.5 : 0.5), dayId, day)
        if (!unit || unit.skipped) continue
        // Se ve DESDE el compañero (la Plaza Venecia desde el Altar, el Castillo desde el Puente): desde su mismo punto
        // y en un momento, sin andar. Antes o después de él según lo pone el día curado.
        const from = before ? host.places[0] : host.places.at(-1)
        // Un monumento por fuera lleva sus `minutos_fuera` del JSON, sin recortar (decisión del usuario, 2026-09-28): si
        // no cabe, el motor decide como con cualquier parada. Lo demás (nivel 3), un momento desde el compañero.
        const monumentOutside = unit.places.some((place) => place.visitOutside)
        unit = { ...unit, places: unit.places.map((place) => ({ ...place, coordinates: before ? from.coordinates : from.end_coordinates ?? from.coordinates, duration_minutes: place.visitOutside ? place.duration_minutes : Math.min(place.duration_minutes ?? SEEN_FROM_MINUTES, SEEN_FROM_MINUTES) })) }
        // Esos minutos salen de la visita del compañero (se ve desde allí): el día no se alarga.
        if (!monumentOutside && !from.visitOutside && (from.duration_minutes ?? 0) > SEEN_FROM_MINUTES * 3) {
          const shorter = { ...host, places: host.places.map((place) => (place === from ? { ...place, duration_minutes: place.duration_minutes - SEEN_FROM_MINUTES } : place)) }
          list = list.map((other) => (other === host ? shorter : other))
          for (const [other, otherHost] of wanted) if (otherHost === host) wanted.set(other, shorter)
          host = shorter
        }
        unit = { ...unit, outsidePartner: true }
        const at = list.indexOf(host)
        if (at < 0) continue
        list = [...list.slice(0, before ? at : at + 1), unit, ...list.slice(before ? at : at + 1)]
      }
      return list
    }
    {
      const names = () => new Set(units.flatMap((unit) => unit.places.map((place) => place.name)))
      const wanted = new Map()
      for (const unit of units) {
        for (const place of unit.places) {
          for (const name of placeByName.get(place.name)?.pass_by?.includes ?? []) {
            if (groupOf(name) && groupOf(name) === groupOf(place.name) && !names().has(name) && !wanted.has(name)) wanted.set(name, unit)
          }
        }
      }
      units = withOutsideLines(units, wanted)
    }
    // La comida en su barrio (los restaurantes que dice el día); la cena, en su barrio de cena.
    const named = new Set(sections.comida?.restaurantes ?? [])
    // Los que cierran ese día no cuentan (días de cierre de los restaurantes curados); si cierran todos los del día,
    // otro de la misma zona que abra (decisión del usuario, 2026-09-28).
    const dinner = dinnerOptions.find((zone) => zone.id === sections.cena?.barrio) ?? null
    // La cena lleva su restaurante recomendado, y los paseos se miden desde él.
    const dinnerNear = dinner?.coordinates ?? units.at(-1)?.places.at(-1)?.coordinates ?? null
    const dinnerRestaurant = recommendedRestaurant(destData, { names: dinner?.restaurants ?? null, meal: 'cena', near: dinnerNear, weekday: hours.weekday, dateIso: realDateIso(day), exclude: usedRestaurants })
    // La comida, ni en el restaurante de la cena de ese día ni en uno que ya salió otro día.
    const spots = openLunchSpots(named, hours, new Set([...usedRestaurants, ...(dinnerRestaurant ? [dinnerRestaurant.name] : [])]))
    const dinnerPoint = dinnerRestaurant?.coordinates ?? dinnerNear
    let result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    // `si_da_tiempo` (Trinità dei Monti antes del Free Tour, Monti después de los Foros): si por ella se pierde algo, sale.
    if (result.dropped.length > 0 && units.some((unit) => unit.onlyIfTime)) {
      const list = units.filter((unit) => !unit.onlyIfTime)
      const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
      if (trial.dropped.length < result.dropped.length) {
        units = list
        result = trial
      }
    }
    // Si la línea propia de lo de su grupo no cabe (se come la franja de la comida), fuera: se queda nombrado en su
    // compañero, como antes.
    const lostPartners = new Set(result.dropped.filter(({ unit }) => unit.outsidePartner).map(({ unit }) => unit.id))
    if (lostPartners.size > 0) {
      units = units.filter((unit) => !lostPartners.has(unit.id))
      result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    }

    // Lo que solo entra si está abierto al llegar (`si_abre`): si cierra o hay que esperar más de 30 min, fuera.
    const waitsToOpen = (candidate) => candidate.visits.filter((visit, index) => {
      const unit = units.find((other) => other.id === visit.unitId)
      if (!unit?.onlyIfOpenNow || index === 0) return false
      return visit.start - candidate.visits[index - 1].end - (visit.walkMinutes ?? 0) > 30
    })
    const notOpen = new Set([...result.dropped.filter(({ unit }) => unit.onlyIfOpenNow).map(({ unit }) => unit.id), ...waitsToOpen(result).map((visit) => visit.unitId)])
    if (notOpen.size > 0) {
      units = units.filter((unit) => !notOpen.has(unit.id))
      result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    }
    // Lo que a esa hora ya ha cerrado y el día quiere de paso (el Tempietto): de paso, en su sitio.
    const closedAtHour = result.dropped.filter(({ unit, reason }) => unit.passIfClosed && HOURS_REASONS.has(reason))
    if (closedAtHour.length > 0) {
      const ids = new Set(closedAtHour.map(({ unit }) => unit.id))
      units = units.map((unit) => (ids.has(unit.id) ? usable(unitOf({ ...unit.curatedStop, rol: 'de_paso' }, unit.slot, unit.curatedIndex % CURATED_AFTERNOON_OFFSET, dayId, day)) ?? unit : unit))
      result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    }
    // El mirador del atardecer que a esa hora ya ha cerrado (el Jardín de los Naranjos cierra a las 18:00 en otoño):
    // visita normal mientras está abierto, sin atardecer.
    const closedAtSunset = result.dropped.filter(({ unit, reason }) => unit.role === 'atardecer' && HOURS_REASONS.has(reason))
    if (closedAtSunset.length > 0) {
      const ids = new Set(closedAtSunset.map(({ unit }) => unit.id))
      units = units.map((unit) => (ids.has(unit.id) ? { ...unit, role: 'parada', places: unit.places.map(({ sunset, ...place }) => place) } : unit))
      result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    }
    // Antes de dar el atardecer por perdido, la parada que se estira (el callejeo por Trastevere) devuelve tiempo: 15 o
    // 30 min, nunca por debajo de 20. Así cabe lo que va de camino (Via della Conciliazione) sin perder el sol.
    let missed = result.dropped.filter(({ unit, reason }) => unit.role === 'atardecer' && reason === 'missed_sunset')
    if (missed.length > 0 && units.some((unit) => unit.stretch)) {
      for (const cut of [STRETCH_GIVE_BACK_MINUTES, STRETCH_GIVE_BACK_MINUTES * 2]) {
        const list = units.map((unit) => (unit.stretch ? { ...unit, places: unit.places.map((place, index) => (index === unit.places.length - 1 ? { ...place, duration_minutes: Math.max(STRETCH_MIN_MINUTES, (place.duration_minutes ?? 30) - cut) } : place)) } : unit))
        const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        const keepsAll = result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId))
        if (keepsAll && trial.visits.some((visit) => visit.place.sunset != null)) {
          units = list
          result = trial
          missed = []
          break
        }
      }
    }
    // El mirador que no llega a su atardecer (se llega de noche): en su sitio, como vistas de Roma iluminada.
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
        if (!place || !(place.pass_by || place.type === 'exterior' || place.minutos_fuera != null)) return unit
        const stop = [...sections.manana, ...sections.tarde].find((other) => other.lugar === place.name)
        return usable(unitOf({ ...stop, rol: 'de_paso' }, unit.slot, unit.curatedIndex % CURATED_AFTERNOON_OFFSET, dayId, day)) ?? unit
      })
      result = schedule(day, units, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
    }
    // `si_sobra` (D5 tarde B en verano): si antes de cenar sobran más de esos minutos y el sol se pone tarde, la tarde
    // acaba con su paseo al atardecer (Via dei Fori Imperiali y la Columna de Trajano) y el rato de antes se queda en
    // la parada que dice `estirar` (Monti: callejear y aperitivo). Solo si no se pierde nada.
    const extra = sections.si_sobra
    if (extra && (result.idleBeforeDinner ?? 0) > (extra.minutos ?? 60) && hours.sunset != null && hours.sunset >= toMin(extra.atardecer_desde ?? '00:00')) {
      const added = (extra.anadir ?? []).map((stop, index) => unitOf(stop, 'tarde', 80 + index, dayId, day)).filter((unit) => unit && !unit.skipped)
      const list = [...units.map((unit) => (extra.estirar && unit.places.some((place) => place.name === extra.estirar) ? { ...unit, stretch: true } : unit)), ...added]
      const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
      if (result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId)) && added.every((unit) => trial.visits.some((visit) => visit.unitId === unit.id))) {
        units = list
        result = trial
      }
    }
    // `si_espera` (D2 en invierno): si antes del atardecer se esperan más de esos minutos, la tarde de `si_espera`
    // (Trastevere antes del Janículo), que se queda ese rato en su `estirar`. Solo si no se pierde nada y llega al sol.
    // (Con el orden de invierno forzado porque el normal llega tarde al sol, no se vuelve al normal.)
    const waitRule = entry.forceWinter ? null : sections.si_espera
    const sunsetIndex = result.visits.findIndex((visit) => visit.place.sunset != null)
    if (waitRule?.tarde && sunsetIndex > 0) {
      const wait = result.visits[sunsetIndex].start - result.visits[sunsetIndex - 1].end - (result.visits[sunsetIndex].walkMinutes ?? 0)
      // (Cierre de Roma, punto 3: también si con el orden de ahora se llega cerrado a algo de esa tarde, el Tempietto
      // después de su última entrada. Lo decide la hora a la que se llega, no el mes.)
      const closedNow = (candidate) => candidate.visits.filter((visit) => visit.place.visitOutside && (visit.place.outsideKind === 'ya_cerrado' || visit.place.outsideKind === 'no_abre') && waitRule.tarde.some((stop) => stop.lugar === visit.place.name)).length
      const closedBefore = closedNow(result)
      if (wait > (waitRule.minutos ?? 60) || closedBefore > 0) {
        const morningNames = new Set(sections.manana.map((stop) => stop.lugar))
        // (Lo de pago que este viaje no visita por dentro, por fuera: igual que en la tarde de siempre.)
        const tarde = waitRule.tarde.map((stop) => (stopApplies(stop, day) ? stop : seenOutside(stop) ? asOutside(stop) : null)).filter((stop) => stop && !morningNames.has(stop.lugar))
        let list = [...units.filter((unit) => unit.slot === 'manana'), ...build(tarde, 'tarde')]
        let trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        // Lo que así llega cerrado y el día quiere de paso (el Tempietto después de su última entrada), de paso.
        const nowClosed = new Set(trial.dropped.filter(({ unit, reason }) => unit.passIfClosed && HOURS_REASONS.has(reason)).map(({ unit }) => unit.id))
        if (nowClosed.size > 0) {
          list = list.map((unit) => (nowClosed.has(unit.id) ? usable(unitOf({ ...unit.curatedStop, rol: 'de_paso' }, unit.slot, unit.curatedIndex % CURATED_AFTERNOON_OFFSET, dayId, day)) ?? unit : unit))
          trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        }
        const names = (candidate) => new Set(candidate.visits.map((visit) => visit.place.name))
        // (Lo que solo iba de paso, la Fuente de las Tortugas, no cuenta como perdido.)
        const had = new Set(result.visits.filter((visit) => !visit.place.passThrough && !visit.place.passBy && units.find((unit) => unit.id === visit.unitId)?.role !== 'de_paso').map((visit) => visit.place.name))
        const has = names(trial)
        // (Y llegando al sol de verdad: el Janículo a las 18:45 con el sol a las 18:30 no vale.)
        if ([...had].every((name) => has.has(name)) && trial.visits.some((visit) => visit.place.sunset != null && visit.start <= visit.place.sunset) && (wait > (waitRule.minutos ?? 60) || closedNow(trial) < closedBefore)) {
          units = list
          result = trial
        }
      }
    }
    // Lo que el programador ha quitado para llegar al sol (Via della Conciliazione en D2 en invierno): antes, la parada
    // que se estira (Trastevere) devuelve 15 o 30 min, nunca por debajo de 20, si así vuelve sin perder nada ni el sol.
    const lostForSun = result.dropped.filter(({ reason }) => reason === 'missed_sunset')
    // (También si el mirador llega, pero después del sol: el Janículo a las 18:45 con el sol a las 18:37.)
    const sunLate = (candidate) => candidate.visits.some((visit) => visit.place.sunset != null && visit.start > visit.place.sunset)
    const lateBefore = sunLate(result)
    if ((lostForSun.length > 0 || lateBefore) && result.visits.some((visit) => visit.place.sunset != null) && units.some((unit) => unit.stretch)) {
      for (const cut of [STRETCH_GIVE_BACK_MINUTES, STRETCH_GIVE_BACK_MINUTES * 2]) {
        const list = units.map((unit) => (unit.stretch ? { ...unit, places: unit.places.map((place, index) => (index === unit.places.length - 1 ? { ...place, duration_minutes: Math.max(STRETCH_MIN_MINUTES, (place.duration_minutes ?? 30) - cut) } : place)) } : unit))
        const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        const keepsAll = result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId))
        const recovered = lostForSun.every(({ unit }) => trial.visits.some((visit) => visit.unitId === unit.id))
        if (keepsAll && recovered && trial.visits.some((visit) => visit.place.sunset != null) && (!lateBefore || !sunLate(trial))) {
          units = list
          result = trial
          break
        }
      }
    }
    // El tiempo que sobra antes del atardecer se queda en la parada marcada `estirar` (callejear Trastevere), no
    // arriba en el mirador: se alarga de 15 en 15 min mientras no se caiga nada. Cada una hasta su `estirar_max`
    // (el Circo Máximo, un prado: 30 min); lo que pase, a la otra estirable del día (la Via Appia) y, si aún sobra,
    // se queda como tiempo libre con nombre antes del atardecer (PROMPT_AJUSTES_20_RUTAS B.4).
    // La espera antes de una parada que abre más tarde (Santa Maria del Popolo, a las 16:30 el domingo) se queda en la
    // estirable que va justo antes (el Parque), de 15 en 15 min y sin que se caiga nada (decisión del usuario,
    // 2026-09-28: nada de horas muertas de más de una hora).
    const absorbWaits = () => {
      for (let guard = 0; guard < 4; guard++) {
        // La estirable más cercana antes de la espera (el Parque, aunque vaya la Piazza del Popolo en medio; repaso 3).
        const stretchBefore = (index) => {
          for (let k = index - 1; k >= Math.max(0, index - 3); k--) {
            if ((result.meals ?? []).some((meal) => meal.start >= result.visits[k].end && meal.start < result.visits[index].start)) return -1
            if (units.find((unit) => unit.id === result.visits[k].unitId)?.stretch) return k
          }
          return -1
        }
        const at = result.visits.findIndex((visit, index) => index > 0 && visit.place.sunset == null && stretchBefore(index) >= 0 && visit.start - result.visits[index - 1].end - (visit.walkMinutes ?? 0) > 30 && !(result.meals ?? []).some((meal) => meal.start >= result.visits[index - 1].end && meal.start < visit.start))
        if (at < 0) break
        const previous = result.visits[stretchBefore(at)]
        const unit = units.find((other) => other.id === previous.unitId)
        const wait = result.visits[at].start - result.visits[at - 1].end - (result.visits[at].walkMinutes ?? 0)
        let done = false
        for (let extra = Math.floor((wait - 10) / 15) * 15; extra >= 15 && !done; extra -= 15) {
          const list = units.map((other) => (other === unit ? { ...other, places: other.places.map((place) => (place.name === previous.place.name ? { ...place, duration_minutes: (place.duration_minutes ?? 30) + extra } : place)) } : other))
          const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
          const keepsAll = result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId))
          const sunKept = !result.visits.some((visit) => visit.place.sunset != null) || trial.visits.some((visit) => visit.place.sunset != null)
          if (keepsAll && sunKept) {
            units = list
            result = trial
            done = true
          }
        }
        if (!done) break
      }
    }
    absorbWaits()
    const sunsetAt = result.visits.findIndex((visit) => visit.place.sunset != null)
    // (Solo lo de la tarde: el barrio de la mañana, Testaccio, se estira hasta la comida y nada más.)
    const stretchVisits = sunsetAt > 0 ? result.visits.slice(0, sunsetAt).reverse().filter((visit) => { const unit = units.find((other) => other.id === visit.unitId); return unit?.stretch && unit.slot !== 'manana' }) : []
    const stretchVisit = stretchVisits[0] ?? null
    if (stretchVisit) {
      const before = result.visits[sunsetAt - 1]
      const wait = result.visits[sunsetAt].start - before.end - (result.visits[sunsetAt].walkMinutes ?? 0)
      /** Cuánto se lleva cada estirable de `extra`, de la última a la primera, sin pasar su tope. */
      const shares = (extra) => {
        const out = new Map()
        let left = extra
        for (const visit of stretchVisits) {
          const unit = units.find((other) => other.id === visit.unitId)
          const base = unit.places.reduce((sum, place) => sum + (place.duration_minutes ?? 30), 0)
          const room = unit.stretchMax != null ? Math.max(0, unit.stretchMax - base) : Infinity
          const give = Math.min(left, room)
          if (give > 0) out.set(unit.id, give)
          left -= give
          if (left <= 0) break
        }
        return out
      }
      for (let extra = Math.floor((wait - 10) / 15) * 15; extra >= 15; extra -= 15) {
        const give = shares(extra)
        if (give.size === 0) break
        let list = units.map((unit) => (give.has(unit.id) ? { ...unit, places: unit.places.map((place, index) => (index === unit.places.length - 1 ? { ...place, duration_minutes: (place.duration_minutes ?? 30) + give.get(unit.id) } : place)) } : unit))
        let trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        // Lo que así llega cerrado y el día quiere de paso (el Tempietto después de las 18:00), de paso.
        const nowClosed = new Set(trial.dropped.filter(({ unit, reason }) => unit.passIfClosed && HOURS_REASONS.has(reason)).map(({ unit }) => unit.id))
        if (nowClosed.size > 0) {
          list = list.map((unit) => (nowClosed.has(unit.id) ? usable(unitOf({ ...unit.curatedStop, rol: 'de_paso' }, unit.slot, unit.curatedIndex % CURATED_AFTERNOON_OFFSET, dayId, day)) ?? unit : unit))
          trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        }
        const keepsAll = result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId))
        if (keepsAll && trial.visits.some((visit) => visit.place.sunset != null)) {
          units = list
          result = trial
          break
        }
      }
    }
    // Sin atardecer en la tarde (D5 en invierno: el Campidoglio ya de noche, luego el Altar): lo que pase del rato de
    // aperitivo antes de cenar se lo llevan las estirables del día (la Via Appia), cada una hasta su `estirar_max`.
    const idleMax = DINNER_IDLE_MAX
    if (!result.visits.some((visit) => visit.place.sunset != null) && (result.idleBeforeDinner ?? 0) > idleMax) {
      const stretchables = [...result.visits].reverse().map((visit) => units.find((unit) => unit.id === visit.unitId)).filter((unit) => unit?.stretch && unit.slot !== 'manana')
      for (let extra = Math.ceil(((result.idleBeforeDinner ?? 0) - idleMax) / 15) * 15; extra >= 15 && stretchables.length > 0; extra -= 15) {
        const give = new Map()
        let left = extra
        for (const unit of stretchables) {
          const base = unit.places.reduce((sum, place) => sum + (place.duration_minutes ?? 30), 0)
          const room = unit.stretchMax != null ? Math.max(0, unit.stretchMax - base) : Infinity
          const share = Math.min(left, room)
          if (share > 0) give.set(unit.id, share)
          left -= share
          if (left <= 0) break
        }
        if (give.size === 0) break
        const list = units.map((unit) => (give.has(unit.id) ? { ...unit, places: unit.places.map((place, index) => (index === unit.places.length - 1 ? { ...place, duration_minutes: (place.duration_minutes ?? 30) + give.get(unit.id) } : place)) } : unit))
        const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        if (result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId))) {
          units = list
          result = trial
          break
        }
      }
    }
    // Lo que no ha llegado a su hora (PROMPT_PENDIENTE B.4b): el museo de pago que se ve por fuera (`minutos_fuera`, sin
    // elegir en el pool) pasa a por fuera en su sitio; lo de nivel 3 con su compañero de grupo en el día (el Puente),
    // a su propia línea vista desde él. Solo si así cabe sin perder nada.
    {
      const droppedUnits = result.dropped.filter(({ unit }) => unit.role !== 'de_paso' && !unit.outsidePartner && !unit.places.some((place) => place.isFreeTour || place.visitOutside))
      const wanted = new Map()
      const outside = new Map()
      // (Decisión del usuario, 2026-09-28: todo monumento con `minutos_fuera` sale siempre, aunque sea por fuera y aunque
      // sea gratis: Santa Maria del Popolo el domingo por la mañana. Si es por el horario, "A esta hora no abre".)
      const monumentOutside = (name) => {
        const p = placeByName.get(name)
        return Boolean(p) && (p.level ?? 3) <= 2 && p.type === 'interior' && p.minutos_fuera != null && !inPool(name) && !inside(name)
      }
      for (const { unit, reason } of droppedUnits) {
        for (const place of unit.places) {
          if (unit.places.length === 1 && monumentOutside(place.name)) {
            const fuera = unitOf({ lugar: place.name, rol: 'de_paso', fuera_motivo: HOURS_REASONS.has(reason) ? OUTSIDE_REASONS.no_abre : OUTSIDE_REASONS.no_cabe }, unit.slot, (unit.curatedIndex ?? 0) % CURATED_AFTERNOON_OFFSET, dayId, day)
            if (fuera && !fuera.skipped) outside.set(unit.id, fuera)
            continue
          }
          if ((placeByName.get(place.name)?.level ?? 3) <= 2) continue
          const hostVisit = result.visits.find((visit) => visit.place.name !== place.name && groupOf(visit.place.name) && groupOf(visit.place.name) === groupOf(place.name))
          const host = hostVisit ? units.find((other) => other.id === hostVisit.unitId) : null
          if (host && !wanted.has(place.name)) wanted.set(place.name, host)
        }
      }
      if (wanted.size > 0 || outside.size > 0) {
        const dropIds = new Set(droppedUnits.filter(({ unit }) => unit.places.some((place) => wanted.has(place.name))).map(({ unit }) => unit.id))
        let list = withOutsideLines(units.filter((unit) => !dropIds.has(unit.id)).map((unit) => outside.get(unit.id) ?? unit), new Map(wanted))
        let trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        const hadSunset = result.visits.some((visit) => visit.place.sunset != null)
        // Si así se pierde el atardecer, la parada que se estira (Trastevere) devuelve 15 min, nunca por debajo de 20.
        if (hadSunset && !trial.visits.some((visit) => visit.place.sunset != null) && list.some((unit) => unit.stretch)) {
          list = list.map((unit) => (unit.stretch ? { ...unit, places: unit.places.map((place, index) => (index === unit.places.length - 1 ? { ...place, duration_minutes: Math.max(STRETCH_MIN_MINUTES, (place.duration_minutes ?? 30) - STRETCH_GIVE_BACK_MINUTES) } : place)) } : unit))
          trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        }
        const keepsAll = result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId))
        const shown = [...wanted.keys(), ...[...outside.values()].map((unit) => unit.places[0].name)].every((name) => trial.visits.some((visit) => visit.place.name === name))
        if (keepsAll && shown && trial.visits.some((visit) => visit.place.sunset != null) === hadSunset) {
          units = list
          result = trial
        }
      }
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
      // (Lo que ya sale en su propia línea, no: "El Castillo, visto por fuera" no va además dentro del Puente.)
      if (!source.group || (source.level ?? 3) <= 2 || result.visits.some((visit) => visit.place.name === source.name)) continue
      const partner = result.visits.find((visit) => placeByName.get(visit.place.name)?.group === source.group)
      if (partner) partner.place = { ...partner.place, outsideOf: [...new Set([...(partner.place.outsideOf ?? []), source.name])] }
    }
    // Turnos (la Galería, cada hora de 9:00 a 17:00; decisión del usuario, 2026-09-28): si antes del turno del día
    // queda más de media hora de espera, el turno anterior que no deja hueco, sin perder nada.
    for (const visit of [...result.visits]) {
      const turnos = placeByName.get(visit.place.name)?.turnos
      if (!turnos || !visit.place.fixed_start) continue
      const index = result.visits.indexOf(visit)
      const previous = index > 0 ? result.visits[index - 1] : null
      const wait = previous ? visit.start - previous.end - (visit.walkMinutes ?? 0) : 0
      if (wait <= 30) continue
      const unit = units.find((other) => other.id === visit.unitId)
      const from = toMin(turnos.desde ?? '09:00')
      for (let turn = toMin(visit.place.fixed_start) - (turnos.cada_minutos ?? 60); turn >= from; turn -= turnos.cada_minutos ?? 60) {
        const hhmm = `${String(Math.floor(turn / 60)).padStart(2, '0')}:${String(turn % 60).padStart(2, '0')}`
        const list = units.map((other) => (other === unit ? { ...other, places: other.places.map((p) => ({ ...p, fixed_start: hhmm, not_before: hhmm })) } : other))
        const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        const moved = trial.visits.find((other) => other.unitId === visit.unitId)
        if (moved && result.visits.every((other) => trial.visits.some((candidate) => candidate.unitId === other.unitId))) {
          units = list
          result = trial
          break
        }
      }
    }
    // La parada de barrio anterior a la cena (Trastevere, Monti, Campo de' Fiori) se estira hasta la hora de salir a
    // cenar: es el aperitivo (decisión del usuario, 2026-09-28). Sin esperas a la cena sin nada.
    {
      const last = result.visits.at(-1)
      const lastUnit = last ? units.find((unit) => unit.id === last.unitId) : null
      const place = last ? placeByName.get(last.place.name) : null
      const barrio = Boolean(lastUnit?.stretch || lastUnit?.aperitivo || place?.aperitivo_antes_de_cenar || (place?.tags ?? []).includes('barrio'))
      const idle = result.idleBeforeDinner ?? 0
      if (barrio && last.place.sunset == null && !last.place.visitOutside && idle > APERITIVO_ABSORB_FROM) {
        for (let extra = Math.floor(idle / 15) * 15; extra >= 15; extra -= 15) {
          const list = units.map((unit) => (unit === lastUnit ? { ...unit, places: unit.places.map((p, index) => (index === unit.places.length - 1 ? { ...p, duration_minutes: (p.duration_minutes ?? 30) + extra, absorbedExtra: (p.absorbedExtra ?? 0) + extra } : p)) } : unit))
          const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
          if (result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId)) && (trial.idleBeforeDinner ?? 0) < idle) {
            units = list
            result = trial
            break
          }
        }
      }
    }
    // La sugerencia de una fecha especial va a su hora (la Bendición a las 11:30): si no llega, sale lo de la mañana
    // que va justo antes (nunca un nivel 1 ni lo del pool), lo justo. Si ni así, el día se queda como estaba y el aviso
    // no la promete.
    if (entry.suggestionName) {
      const sugId = `${dayId}:${entry.suggestionName}`
      const missed = (candidate) => candidate.dropped.some(({ unit }) => unit.id === sugId)
      if (missed(result)) {
        let trialUnits = units
        let trial = result
        const removed = []
        for (let guard = 0; guard < 6 && missed(trial); guard++) {
          const at = trialUnits.findIndex((unit) => unit.id === sugId)
          const partnered = (unit) => unit.places.some((place) => {
            const group = placeByName.get(place.name)?.group
            return group && trialUnits.some((other) => other !== unit && other.places.some((p) => placeByName.get(p.name)?.group === group))
          })
          const previous = trialUnits.slice(0, at).reverse().find((unit) => unit.slot === trialUnits[at]?.slot && !partnered(unit) && !unit.places.some((place) => place.level === 1 || inPool(place.name) || place.isFreeTour))
          if (!previous) break
          removed.push(previous)
          trialUnits = trialUnits.filter((unit) => unit !== previous)
          trial = schedule(day, trialUnits, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        }
        if (!missed(trial)) {
          units = trialUnits
          result = { ...trial, dropped: [...trial.dropped, ...removed.map((unit) => ({ unit, reason: 'date_suggestion' }))] }
        }
      }
    }
    // La joya cerrada que no se ve por fuera (los Museos Vaticanos el domingo): el día lo avisa.
    const closedAnchors = [...entry.closedAnchors, ...skipped.filter(({ source }) => joyaNames.has(source.name) && !source.pass_by).map(({ source }) => source.name)]
    for (const name of closedAnchors) notEnoughTime.add(name)
    // Lo del día que no ha llegado a su hora (sin lo de paso) va a "No te dio tiempo".
    for (const { unit } of result.dropped) {
      if (unit.role === 'de_paso' || unit.places.some((place) => place.isFreeTour)) continue
      for (const place of unit.places) {
        notEnoughTime.add(place.name)
        // Si se queda fuera porque ese día cierra, el motivo es el cierre ("Cierra el 25 de diciembre"), no "No te dio tiempo".
        if (closedThatDay(place.name, day)) notEnoughClosed.set(place.name, { dateIso: hoursOf(day).dateIso, weekday: hoursOf(day).weekday })
        if (!notEnoughDay.has(place.name)) notEnoughDay.set(place.name, day.dayNumber)
      }
    }
    for (const visit of result.visits) {
      seen.add(visit.place.name)
      for (const name of visit.place.outsideOf ?? []) seen.add(name)
    }
    // Lo que ya ha cerrado cuando se llega (Santa Maria del Popolo el domingo de Pascua), con su plaza, no se baja a ver
    // para volver a subir al mirador: va después del atardecer, "por el camino" al bajar a cenar (repaso 3, 2026-09-28).
    {
      const sunsetAt = result.visits.findIndex((visit) => visit.place.sunset != null)
      const closed = sunsetAt > 0 ? result.visits.slice(0, sunsetAt).find((visit) => {
        if (!visit.place.visitOutside || visit.place.outsideKind !== 'no_abre') return false
        const sessions = parseHoursSessions(effectiveSchedule(placeByName.get(visit.place.name) ?? visit.place, hours))
        return !sessions.some((session) => session.open > visit.start)
      }) : null
      if (closed) {
        const at = result.visits.indexOf(closed)
        const partner = at > 0 && groupOf(result.visits[at - 1].place.name) && groupOf(result.visits[at - 1].place.name) === groupOf(closed.place.name) ? result.visits[at - 1] : null
        const movedIds = new Set([closed.unitId, partner?.unitId].filter(Boolean))
        const sunsetUnit = units.find((unit) => unit.id === result.visits[sunsetAt].unitId)
        const movedUnits = units.filter((unit) => movedIds.has(unit.id)).map((unit) => (unit.id === partner?.unitId ? usable(unitOf({ ...(unit.curatedStop ?? { lugar: unit.places[0].name }), rol: 'de_paso', estirar: undefined, minutos: undefined }, unit.slot, (unit.curatedIndex ?? 0) % CURATED_AFTERNOON_OFFSET, dayId, day)) ?? unit : unit))
        const rest = units.filter((unit) => !movedIds.has(unit.id))
        const list = [...rest.slice(0, rest.indexOf(sunsetUnit) + 1), ...movedUnits, ...rest.slice(rest.indexOf(sunsetUnit) + 1)]
        const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
        if (trial.visits.some((visit) => visit.place.sunset != null) && trial.dropped.length <= result.dropped.length) {
          units = list
          result = trial
          // La espera que deja antes del atardecer, para la estirable de antes (el Parque).
          const sunIndex = result.visits.findIndex((visit) => visit.place.sunset != null)
          const before = sunIndex > 0 ? result.visits[sunIndex - 1] : null
          const stretchUnit = before ? units.find((unit) => unit.id === before.unitId && unit.stretch) : null
          const wait = before ? result.visits[sunIndex].start - before.end - (result.visits[sunIndex].walkMinutes ?? 0) : 0
          for (let extra = Math.floor((wait - 10) / 15) * 15; stretchUnit && extra >= 15; extra -= 15) {
            const longer = units.map((unit) => (unit === stretchUnit ? { ...unit, places: unit.places.map((place) => (place.name === before.place.name ? { ...place, duration_minutes: (place.duration_minutes ?? 30) + extra } : place)) } : unit))
            const again = schedule(day, longer, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
            if (again.visits.some((visit) => visit.place.sunset != null) && again.dropped.length <= result.dropped.length) {
              units = longer
              result = again
              break
            }
          }
        }
      }
    }
    // Otra vez al final: los turnos (la Galería a las 10:00) pueden haber abierto una espera nueva.
    absorbWaits()
    // El barrio de antes de comer se queda el rato hasta la comida (segundo repaso, 2026-09-28: Testaccio con su
    // mercado, no 35 min de parada y luego "Tiempo libre antes de la comida"), de 15 en 15 y sin que se mueva nada.
    {
      const lunch = (result.meals ?? []).find((meal) => meal.type === 'lunch')
      const before = lunch ? [...result.visits].reverse().find((visit) => visit.end <= lunch.start) : null
      const unit = before ? units.find((other) => other.id === before.unitId) : null
      const gap = before ? lunch.start - before.end - LUNCH_WALK_ALLOWANCE : 0
      if (unit?.stretch && gap > 20) {
        for (let extra = Math.floor(gap / 15) * 15; extra >= 15; extra -= 15) {
          const list = units.map((other) => (other === unit ? { ...other, places: other.places.map((place) => (place.name === before.place.name ? { ...place, duration_minutes: (place.duration_minutes ?? 30) + extra } : place)) } : other))
          const trial = schedule(day, list, dinnerPoint, spots.length > 0 ? spots : allLunchSpots, morning)
          const trialLunch = (trial.meals ?? []).find((meal) => meal.type === 'lunch')
          const stretched = trial.visits.find((visit) => visit.unitId === before.unitId && visit.place.name === before.place.name)
          if (result.visits.every((visit) => trial.visits.some((other) => other.unitId === visit.unitId)) && trialLunch?.start === lunch.start && stretched && stretched.end <= trialLunch.start) {
            units = list
            result = trial
            break
          }
        }
      }
    }
    // "Por fuera" por el horario: dos textos según la hora real de la visita (segundo repaso, 2026-09-28). Si ese día
    // todavía abre más tarde, "Todavía no ha abierto (abre a las 16:00)"; si ya no, "A esta hora ya ha cerrado".
    for (const visit of result.visits) {
      if (visit.place.outsideKind !== 'no_abre') continue
      const sessions = parseHoursSessions(effectiveSchedule(placeByName.get(visit.place.name) ?? visit.place, hours))
      const opensLater = sessions.map((session) => session.open).filter((open) => open > visit.start).sort((a, b) => a - b)[0]
      visit.place = opensLater != null
        ? { ...visit.place, outsideReason: `Todavía no ha abierto (abre a las ${toHHMMLocal(opensLater)})` }
        : { ...visit.place, outsideKind: 'ya_cerrado', outsideReason: OUTSIDE_REASONS.ya_cerrado }
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
      dinnerRestaurant,
      nightNames: null,
      blocks: [
        ...(morning ? [{ id: dayId, slot: 'manana', label: sections.nombre ?? cfg.nombre }] : []),
        { id: dayId, slot: 'tarde', label: sections.nombre ?? cfg.nombre },
      ],
      curatedDay: { id: dayId, nombre: sections.nombre ?? cfg.nombre, variantes: entry.applied, noche: sections.noche },
      untypedAfternoon: false,
      reorderedBlocks: [],
      closedAnchors: closedAnchors.map((name) => ({ name, blockId: dayId, dates: [hours.dateIso].filter(Boolean) })),
      curated: null,
    }
  }

  // ── 6a. El pool que ningún día trae: regla general ────────────────────────────────────────────
  const unplacedPool = []
  const cityPlanned = days.filter((day) => day.schedule)
  // Lo que va detrás de otro lugar del pool (el Ojo de la Cerradura detrás de la Boca) se coloca después de él.
  const anchorOf = (name) => poolRules[name]?.si_no?.despues_de ?? poolRules[name]?.despues_de ?? null
  const poolOrder = [...poolNames.filter((name) => !poolNames.includes(anchorOf(name))), ...poolNames.filter((name) => poolNames.includes(anchorOf(name)))]
  for (const name of poolOrder) {
    if (seen.has(name)) continue
    const place = placeByName.get(name)
    if (!place) continue
    if (poolBlocked.has(name)) {
      unplacedPool.push({ unitId: name, name, reason: 'pool_afternoon_taken', takenBy: poolBlocked.get(name), closedOn: place.closed_on ?? [] })
      continue
    }
    // Meter el lugar del pool en `day`, detrás de la unidad `at - 1`. Si no cabe: fuera la parada de menos nivel que
    // no sea nivel 1 (ni joya ni pool), de una en una. Solo vale si todo lo demás del día se sigue visitando (el Altar
    // no se cae por meter Caracalla).
    const placeIn = (day, at, slot) => {
      const poolUnit = unitOf({ lugar: name, rol: 'parada' }, slot, 50, day.curatedDay.id, day)
      if (!poolUnit || poolUnit.skipped) return false
      let list = [...day.units.slice(0, at), poolUnit, ...day.units.slice(at)]
      const before = new Set(day.schedule.visits.map((other) => other.unitId))
      const removed = new Set()
      for (let attempt = 0; attempt < 4; attempt++) {
        const result = day.rerun(list)
        const intact = [...before].every((unitId) => removed.has(unitId) || result.visits.some((other) => other.unitId === unitId))
        if (intact && result.visits.some((other) => other.unitId === poolUnit.id)) {
          const { run, ...plain } = result
          Object.assign(day, { units: result.kept, schedule: { ...plain, modeFallback: day.schedule.modeFallback } })
          return true
        }
        const removable = list
          .filter((unit) => unit !== poolUnit && !unit.places.some((p) => p.level === 1 || joyaNames.has(p.name) || inPool(p.name) || p.isFreeTour))
          .sort((a, b) => (b.places[0].level ?? 3) - (a.places[0].level ?? 3) || Number(b.role === 'de_paso') - Number(a.role === 'de_paso'))[0]
        if (!removable) return false
        removed.add(removable.id)
        list = list.filter((unit) => unit !== removable)
      }
      return false
    }
    // Día fijo del pool (`curated_pool`, decisión del 2026-09-27): su día y detrás de su parada — la Cúpula tras la
    // Basílica en D2 (también en tranquilo); la Boca y el Ojo de la Cerradura en D5 si el viaje lo lleva y, si no,
    // en D1 tras el Barrio Judío. Con día fijo no se va a otro día lejano: si ahí no cabe, se avisa en ese día.
    const fixedRule = poolRules[name] ?? {}
    const fixed = fixedRule.si_viaje_tiene
      ? order.includes(fixedRule.si_viaje_tiene)
        ? null
        : fixedRule.si_no ?? null
      : fixedRule.despues_de
        ? { dia: fixedRule.dia, despues_de: fixedRule.despues_de }
        : null
    if (fixed?.dia) {
      const day = cityPlanned.find((candidate) => candidate.curatedDay?.id === fixed.dia)
      const anchor = day ? day.units.findIndex((unit) => unit.places.some((p) => p.name === fixed.despues_de)) : -1
      const open = day && !closedThatDay(name, day)
      // Detrás de su parada; si a esa hora ya no llega (la Cúpula cierra a las 17:00 en invierno y en tranquilo la
      // Basílica acaba justo entonces), justo delante: se sube a la Cúpula y se baja dentro de la Basílica.
      const ok = open && (placeIn(day, anchor >= 0 ? anchor + 1 : day.units.length, day.units[anchor]?.slot ?? 'tarde') || (anchor >= 0 && placeIn(day, anchor, day.units[anchor]?.slot ?? 'tarde')))
      if (ok) seen.add(name)
      else
        unplacedPool.push({
          unitId: name,
          name,
          reason: day && closedThatDay(name, day) ? 'closed_on_day' : 'no_room_day',
          closedOn: place.closed_on ?? [],
          dayNumber: day?.dayNumber ?? null,
        })
      continue
    }
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
      // Donde el pool dice que nunca (San Clemente nunca en la mañana de D5, que está al otro lado).
      if ((poolRules[name]?.nunca_en ?? []).includes(`${day.curatedDay.id}:${slot}`)) continue
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
        // El día donde se habría quedado (el de su zona): ahí se avisa.
        dayNumber: candidates[0]?.day.dayNumber ?? null,
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
  // El texto del paseo según lo que lleva de verdad (`texto_partes`: una frase por nocturna del recorrido); sin
  // partes, el texto fijo del paseo.
  // `beforeDinner`: con `texto_partes`, sus `uno_antes_de_cenar` / `varios_antes_de_cenar` ("un paseo precioso antes de ir
  // a cenar", no "para cerrar el día"; repaso 3, 2026-09-28).
  const walkText = (walk, chain, beforeDinner = false) => {
    const parts = walk.texto_partes
    // (Si la nocturna lleva detrás el lugar del que habla su texto, que ya tiene el suyo: la Fontana de Trevi sin "sube
    // hasta la Plaza de España" cuando la plaza va detrás.)
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
    const max = walk.maximo ?? 2
    let chain = walk.recorrido.filter((name) => !removedByDay.includes(name)).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
    let fromAlternative = false
    if (chain.length === 0) {
      chain = (walk.alternativas ?? []).map((name) => catalogue.get(name)).filter((entry) => allowed(entry))
      // Si ninguno de la lista vale (ya salió), otro lugar nocturno cerca de la cena.
      if (chain.length === 0) chain = [...catalogue.values()].filter((entry) => allowed(entry, { strictReach: true })).sort((a, b) => metersBetween(day.dinnerCoords, a.coordinates) - metersBetween(day.dinnerCoords, b.coordinates))
      fromAlternative = walk.recorrido.length > 0
    }
    chain = chain.slice(0, max)
    // (Lo que solo vale antes de cenar, el Janículo de noche, lleva su relevo por si cae después: Trastevere de noche.)
    chain = chain.map((entry) => (entry.si_no && catalogue.get(entry.si_no) ? { ...entry, fallback: catalogue.get(entry.si_no) } : entry))
    if (chain.length === 0) continue
    for (const entry of chain) {
      usedNights.add(entry.name)
      for (const name of entry.conflicts_with ?? []) timesSeen.set(name, (timesSeen.get(name) ?? 0) + 1)
    }
    // (Lo que sale en lugar del paseo del día: si coincide con otro paseo del destino, su nombre y su texto.)
    const sameAs = fromAlternative ? Object.values(walks).find((other) => other !== walk && Array.isArray(other.recorrido) && chain.every((entry) => other.recorrido.includes(entry.name))) : null
    const text = fromAlternative ? (sameAs ? walkText(sameAs, chain) : null) : walkText(walk, chain)
    nightsByDay.set(
      day.dayNumber,
      chain.map((entry) => ({ ...entry, wholeWalk: true, ...(walk.excepcion_mismo_dia ? { sameDayException: true } : {}), ...(fromAlternative && walk.alternativas_despues_de_cenar ? { afterDinnerOnly: true } : {}), ...(shortTrip && (entry.conflicts_with ?? []).some((name) => daysOfPlace.get(name)?.has(day.dayNumber)) && lateVisit(entry) && !(entry.conflicts_with ?? []).some((name) => wokeFor.has(name)) ? { replacesDayVisit: true } : {}) })),
    )
    // (Sin nombre propio, el de sus lugares: «Trastevere y Piazza Navona de noche»; repaso 3, 2026-09-28.)
    day.nightWalk = { nombre: fromAlternative ? sameAs?.nombre ?? nightNameOf(chain) : walk.nombre, texto: text, textoAntesCenar: fromAlternative ? (sameAs ? walkText(sameAs, chain, true) : null) : walkText(walk, chain, true), recorrido: chain.map((entry) => entry.name), ...(!fromAlternative && walk.texto_despues_cenar ? { textoDespuesCenar: walk.texto_despues_cenar } : {}) }
  }

  // La noche de una fecha especial (la Girandola el 29 de junio, decisión del usuario 2026-09-28): esa noche la nocturna
  // es esa, a su hora, en vez del paseo del día.
  for (const day of cityPlanned) {
    const suggestion = dateSuggestionOf(day)
    const entry = suggestion?.night ? catalogue.get(suggestion.sug.lugar) : null
    if (!entry) continue
    nightsByDay.set(day.dayNumber, [{ ...entry, wholeWalk: true, fixedStart: toMin(suggestion.sug.hora), dateNight: suggestion.entry.id }])
    // El nombre y el texto que se ven ("La Girandola"); la nota ("hora a confirmar") es interna.
    day.nightWalk = { nombre: suggestion.sug.nombre ?? suggestion.entry.titulo ?? 'Paseo nocturno', texto: suggestion.sug.texto ?? null, recorrido: (nightsByDay.get(day.dayNumber) ?? []).map((entry) => entry.name) }
  }

  // Viajes de 2 días (sección 2b): ningún imprescindible del centro se queda sin ver. Lo que no sale de día (ni de
  // paso) entra en el paseo de esa noche, "El centro iluminado": Panteón → Navona → Trevi → Plaza de España, lo que
  // falte, junto con lo que ya llevaba la noche del centro (D1). También en tranquilo.
  const centro = Object.values(walks).find((walk) => Array.isArray(walk.centro_dos_dias))
  if (shortTrip && centro) {
    const seenByDay = new Set(cityPlanned.flatMap((day) => day.schedule.visits.flatMap((visit) => [visit.place.name, ...(visit.place.outsideOf ?? [])])))
    const covered = new Set([...seenByDay, ...tourCovers])
    const missing = centro.centro_dos_dias.filter((name) => !covered.has(name))
    // Solo cuando el Panteón o Navona no han salido de día (`solo_si_falta`): si faltan solo Trevi y la Plaza de
    // España, ya las lleva el paseo de D1 ("La Roma de las fuentes").
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
      const how = visit.place.transitHow ?? stops.find((stop) => stop.lugar === visit.place.name && stop.traslado)?.traslado ?? place?.uphill?.transit ?? null
      // El tramo que el día hace en transporte (`traslado_min`: el bus 118 a las catacumbas) es un tramo propio
      // ("🚌 Bus 118, unos 25 min"), no un aviso de "57 min andando" (decisión del 2026-09-27).
      if (visit.place.transitMinutes && how) {
        visit.place = { ...visit.place, transit: { how, minutes: visit.place.transitMinutes } }
        continue
      }
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
    notEnoughTime: [...notEnoughTime].filter((name) => !seen.has(name) && !unplacedEssentials.some((item) => item.name === name) && !unplacedPool.some((item) => item.name === name)).map((name) => ({ name, reason: notEnoughClosed.has(name) ? 'closed' : 'no_time', dayNumber: notEnoughDay.get(name) ?? null, ...(notEnoughClosed.has(name) ? { closed: notEnoughClosed.get(name) } : {}) })),
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
    dateMoves,
  }
}

/** «Trastevere y Piazza Navona de noche»: el nombre de una nocturna hecha de varios lugares. */
function nightNameOf(chain) {
  const bases = [...new Set(chain.map((entry) => String(entry.name).replace(/\s*\(noche\)$/, '').replace(/\s+de noche$/, '').replace(/^Piazza /, '')))]
  return bases.length > 0 ? `${joinSpanish(bases)} de noche` : 'Paseo nocturno'
}

/** 960 → "16:00". */
function toHHMMLocal(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
