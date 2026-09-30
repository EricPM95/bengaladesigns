/**
 * Adaptador del servidor para el motor v3 (shared/routeEngine/).
 *
 * Solo hace lo que es del servidor: leer la matriz de tiempos del disco y traducir el resultado del
 * motor al MISMO formato de día que ya pinta la app (paradas, comidas con su zona, nocturnas). El
 * reparto y las horas los decide el motor, que no sabe nada de archivos — por eso se puede llevar a
 * Modo Hoy.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTravelTimes } from '../../shared/routeEngine/travelTimes.js'
import { toHHMM, toMinutes } from '../../shared/routeEngine/time.js'
import { mealZoneInfo } from '../routeAlgorithm.js'
import { HALF_DAY_EXCURSION_END, HALF_DAY_EXCURSION_START, HALF_DAY_ROUTE_START } from './modeConfig.js'
import { buildStop } from './buildDay.js'

/**
 * Todas las horas y duraciones que ve el viajero, de 5 en 5 minutos (decisión del usuario, 2026-09-29; antes, al cuarto de
 * hora, y el redondeo se comía minutos de las visitas: el Barrio Judío de 20 min salía de 11).
 */
const DISPLAY_STEP = 5

/** "10:07" → "10:05": los 5 minutos más cercanos (nunca siempre hacia arriba: el día acabaría con retraso). */
function nearestQuarter(hhmm) {
  const minutes = toMinutes(hhmm)
  return Number.isFinite(minutes) ? toHHMM(Math.round(minutes / DISPLAY_STEP) * DISPLAY_STEP) : hhmm
}

/**
 * Horas redondas (PROMPT_RUTAS_CURADAS B2.1): el motor calcula con los minutos exactos y aquí se enseñan los 5 minutos
 * más cercanos de cada llegada (nunca siempre hacia arriba: el día acabaría con retraso). Lo que hay hasta la
 * siguiente parada (el paseo, la comida, una espera) se queda con sus minutos exactos, y la visita dura lo que cuadra:
 * así la hora de salida más el paseo da la llegada a la siguiente (también lo de paso). Lo que no tiene siguiente se queda
 * con sus minutos; una visita nunca baja de la mitad de lo que dura (entonces, sus minutos de siempre).
 */
/** Antes de esta hora, el "Por qué aquí" que depende de la hora usa su versión `temprano` ("a primera hora, sin gente"). */
const EARLY_WHY_BEFORE = 9 * 60 + 30

/**
 * El `por_que` de la parada: un texto, o { texto, temprano } si depende de la hora. `temprano` solo si la parada empieza
 * antes de las 09:30; si no, `texto` (nunca "a primera hora" a las 10:00 o por la tarde con el pool).
 */
/** El texto general de un lugar (sin condiciones): el de `por_que_lugares`, o su `general`. */
function generalWhyOf(destData, name) {
  const why = destData.por_que_lugares?.[name]
  if (!why) return null
  if (typeof why === 'string') return why
  return why.general ?? (why.solo_si_viene_de || why.solo_si_sigue ? null : why)
}

/**
 * Las `variables` de un texto curado que cambian con el día (PROMPT_UI_REPASO_2, 4: la tasa de la Fontana de Trevi se
 * cobra desde las 9:00, y los lunes y viernes desde las 11:30). Cada una: { siempre, <día de la semana>, <AAAA-MM-DD>,
 * sin_fecha }. Con fecha manda la de ese día exacto, luego la del día de la semana, luego `siempre`; sin fechas,
 * `sin_fecha` (que dice las excepciones) o `siempre`.
 */
function whyVariablesOf(why, hours) {
  const values = {}
  for (const [name, byDay] of Object.entries(why?.variables ?? {})) {
    const dated = hours?.dateIso || hours?.weekday
    values[name] = dated ? (byDay[hours?.dateIso] ?? byDay[hours?.weekday] ?? byDay.siempre) : (byDay.sin_fecha ?? byDay.siempre)
  }
  return values
}

const fillWhy = (text, values) => (typeof text === 'string' ? text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all) : text)

function curatedWhyAt(why, startMinutes, hours = null) {
  if (typeof why === 'string') return why
  // `temprano_antes` ("09:00"): el umbral de ESE texto, si no es el de siempre (la Fontana de Trevi: antes de la tasa).
  // Puede ser una variable ("{umbral}"): el de ESE día (sin fechas, el de `siempre`: antes de él no se paga ningún día).
  const values = whyVariablesOf(why, hours)
  const threshold = why?.temprano_antes?.startsWith?.('{') ? (hours?.dateIso || hours?.weekday ? values[why.temprano_antes.slice(1, -1)] : why.variables?.[why.temprano_antes.slice(1, -1)]?.siempre) : why?.temprano_antes
  const before = threshold ? toMinutes(threshold) : EARLY_WHY_BEFORE
  return fillWhy(startMinutes < before && why?.temprano ? why.temprano : why?.texto ?? why?.temprano ?? null, values)
}

/** Lo más que dura un "Por el camino" (B.1): lo que merece más es una parada. */
const ON_THE_WAY_MAX_MINUTES = 10

/** Un imprescindible nunca dura menos (decisión del usuario, 2026-09-28: la Plaza de España de 10 min era poco). */
const IMPRESCINDIBLE_MIN_MINUTES = 20

/** Estirada al menos esto sobre su tiempo, la estirable sale con su nombre de tiempo libre (2026-09-28). */
const STRETCH_TITLE_MIN = 45

/** Invierno: el sol antes de esta hora; con más de WINTER_IDLE_MAX libres antes de cenar, la nocturna pasa antes de la cena. */
const WINTER_EVENING_BEFORE = 18 * 60
const WINTER_IDLE_MAX = 90

function quarterHourStops(stops) {
  const exact = stops.map((stop) => toMinutes(stop.suggested_time))
  // (La duración, también de 5 en 5; el paseo entre paradas se queda con sus minutos exactos.)
  const step = (stop) => (stop.duration_minutes == null ? stop : { ...stop, duration_minutes: Math.max(DISPLAY_STEP, Math.round(stop.duration_minutes / DISPLAY_STEP) * DISPLAY_STEP) })
  return stops.map((stop, index) => step(stepStop(stop, index)))
  function stepStop(stop, index) {
    const start = exact[index]
    if (!Number.isFinite(start)) return stop
    // (Hacia arriba: una llegada nunca se enseña antes de que se llegue, así el paseo se ve; como mucho 4 min, y no se
    // acumula porque el motor cuenta con los minutos exactos. PROMPT_ROMA_V4_REPASO 1.)
    const roundedStart = Math.ceil(start / DISPLAY_STEP) * DISPLAY_STEP
    const next = index + 1 < stops.length && !stops[index + 1].is_night_experience && !stop.is_night_experience ? exact[index + 1] : NaN
    if (!Number.isFinite(next)) return { ...stop, suggested_time: toHHMM(roundedStart) }
    const gap = next - (start + (stop.duration_minutes ?? 0))
    const duration = Math.ceil(next / DISPLAY_STEP) * DISPLAY_STEP - gap - roundedStart
    const rounded = duration >= (stop.duration_minutes ?? 0) / 2 ? duration : stop.duration_minutes
    // "Por el camino" dura 10 min como mucho: el sobrante del redondeo no se mete ahí, se queda esperando la hora de
    // la siguiente parada (PROMPT_AJUSTES_20_RUTAS B.1).
    // (Y un monumento "Por fuera" en su propia línea, que se ve desde su compañero: tampoco se rellena.)
    const onTheWay = (stop.pass_through || stop.is_pass_by) && !stop.instead_of_visit
    // Por fuera, sus `minutos_fuera` exactos: ni se rellena ni se recorta con el redondeo (decisión del 2026-09-28).
    if (stop.visit_mode === 'fuera' && stop.duration_minutes != null) return { ...stop, suggested_time: toHHMM(roundedStart) }
    // (El mínimo nunca se come el paseo hasta la siguiente: la hora de una parada es la anterior + su duración + el paseo.)
    const { min_minutes: floor, max_minutes: ceiling, ...clean } = stop
    // (`max_minutes`: el puente no se queda con lo que sobra del redondeo.)
    return { ...clean, suggested_time: toHHMM(roundedStart), duration_minutes: onTheWay ? Math.min(rounded, ON_THE_WAY_MAX_MINUTES) : Math.min(Math.max(rounded, floor ?? 0), ceiling ?? Infinity, Math.max(rounded, duration + 4)) }
  }
}
import { dinnerZoneOf, nightStopsFor, nightTiming } from '../../shared/routeEngine/nightWalk.js'
import { dinnerZones, recommendedRestaurant } from '../../shared/routeEngine/dinnerZones.js'
import { TAG_INTEREST_MAP } from '../../shared/routeEngine/experienceTags.js'
import { hoursWarning, parseClosingMinutes, scheduleForDay } from '../../shared/routeEngine/openingHours.js'
import { seasonFit } from '../../shared/routeEngine/availability.js'
import { isStreet } from '../../shared/routeEngine/localRules.js'
import { joinSpanish, placeWithArticle, whyTexts } from '../../shared/routeEngine/whyTexts.js'
import { paseoMaxOf } from '../../shared/routeEngine/curatedTrip.js'
import { closedAnchorNotice, closedOutsideNotice } from '../../shared/routeEngine/closedNotices.js'
import { anyTransitRuns } from '../../shared/routeEngine/holidayTransit.js'

/**
 * Un texto que manda al bus o al metro, en un festivo y a una hora en que no circulan (PROMPT_ROMA_NAVIDAD 1): el taxi en su
 * lugar. «Sube con calma o en el bus 115» → «…o en taxi»; «Bajas del bus aquí» → «Bajas del taxi aquí».
 */
export function withoutPublicTransit(text) {
  if (typeof text !== 'string') return text
  return text
    .replace(/\ben (el|la|los) (bus|autobús|metro|tranvía)( [A-Z]\b| \d+)?( o el \d+)?/gi, 'en taxi')
    .replace(/\bdel (bus|autobús|metro|tranvía)( [A-Z]\b| \d+)?/gi, 'del taxi')
    .replace(/\b(el|la) (bus|autobús|metro|tranvía)( [A-Z]\b| \d+)?( o el \d+)?/gi, 'un taxi')
}

export { dinnerZoneOf, nightWalkPlan } from '../../shared/routeEngine/nightWalk.js'

export { placesForScheduler } from '../../shared/routeEngine/planTrip.js'

const TRAVEL_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../data/pipeline_v2/travel')
const travelByDestination = new Map()

/**
 * La matriz del destino, cargada una vez por proceso. Sin matriz el motor sigue funcionando con
 * tramos estimados (línea recta por el rodeo): peor, pero nunca roto.
 */
export function travelTimesFor(destinationKey) {
  if (!travelByDestination.has(destinationKey)) {
    const path = join(TRAVEL_DIR, `${destinationKey}.json`)
    const matrix = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
    if (!matrix) console.warn(`[motor v3] "${destinationKey}" sin matriz de tiempos: se estimarán todos los tramos`)
    const adjustmentsPath = join(TRAVEL_DIR, `${destinationKey}.ajustes.json`)
    const adjustments = existsSync(adjustmentsPath) ? JSON.parse(readFileSync(adjustmentsPath, 'utf8')).tramos ?? [] : []
    travelByDestination.set(destinationKey, createTravelTimes(matrix, adjustments))
  }
  return travelByDestination.get(destinationKey)
}

/**
 * La cena en su barrio de cena (calculado de los restaurantes, dinnerZones.js): `zone` es la etiqueta
 * de los restaurantes ("Tridente / Spagna"), que es lo que busca la ficha de la cena. Sin barrio de
 * cena, la zona de lugares como antes.
 */
function dinnerFields(destData, dinnerZoneId, placeZone) {
  const zone = dinnerZoneId ? dinnerZones(destData).find((option) => option.id === dinnerZoneId) : null
  return zone ? { zone: zone.label, zone_display: zone.display } : zoneFields(destData, placeZone, 'cena')
}

/** Los cafés más cercanos a una pausa (`suggest.sub_category` de la pausa, 2 por defecto), con minutos a pie aproximados. */
function breakSuggestions(destData, pause) {
  const [lat, lng] = pause.coordinates ?? []
  if (lat == null || lng == null) return []
  const wanted = pause.suggest?.sub_category ?? 'cafe'
  const count = pause.suggest?.count ?? 2
  const meters = (restaurant) => {
    const r = restaurant.coordinates ?? {}
    const x = ((r.lng - lng) * Math.PI) / 180 * Math.cos((((r.lat + lat) / 2) * Math.PI) / 180)
    const y = ((r.lat - lat) * Math.PI) / 180
    return Math.sqrt(x * x + y * y) * 6371000
  }
  return (destData.restaurants ?? [])
    .filter((restaurant) => restaurant.sub_category === wanted && restaurant.coordinates?.lat != null)
    .map((restaurant) => ({ restaurant, meters: meters(restaurant) }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, count)
    .map(({ restaurant, meters: distance }) => ({
      name: restaurant.name,
      walk_minutes: Math.max(1, Math.round((distance * 1.3) / 80)),
      address: restaurant.address ?? null,
      latitude: restaurant.coordinates.lat,
      longitude: restaurant.coordinates.lng,
    }))
}

function zoneFields(destData, zoneKey, mealType) {
  const info = mealZoneInfo(destData, zoneKey, mealType)
  return { zone: info.name, zone_display: info.display }
}

/**
 * El "por qué" de una parada (Paso 6, ver whyTexts.js): el motivo más fuerte por el que la puso el
 * motor. pool > imprescindible > experiencia > mirador / nocturna > de camino.
 */
function whyFor(visit, unit, { destData, city, tripDay, lunchEnd, tour, tourToday, tourRepeats }) {
  const place = destData.places?.find((candidate) => candidate.name === visit.place.name) ?? visit.place
  if (visit.place.isFreeTour) {
    const essentials = (tour?.covers ?? [])
      .map((name) => destData.places?.find((candidate) => candidate.name === name))
      .filter((candidate) => candidate?.level === 1)
      .map(placeWithArticle)
    return whyTexts.freeTour({ area: tour?.area_del ?? null, places: joinSpanish(essentials), repeats: tourRepeats })
  }
  // La pausa con nombre del día curado (el desayuno romano): su propio texto.
  if (visit.place.isBreak) return visit.place.why ?? visit.place.description ?? null
  // Revisitas y pasos por fuera ya traen su texto (revisitReason).
  if (visit.place.passBy || unit?.isRevisit) return null
  if (unit?.poolIndex != null) return whyTexts.pool()
  if (place.level === 1) {
    const paidInterior = !(place.is_free_access ?? place.type === 'exterior')
    if (tourToday && paidInterior && (tour?.covers ?? []).includes(place.name)) return whyTexts.insideAfterTour(placeWithArticle(place), city)
    return whyTexts.essential(city)
  }
  // La experiencia, solo si ESE lugar es de ella: en un grupo, la Boca de la Verdad no hereda el
  // "Naturaleza y Vistas" del Jardín de los Naranjos.
  if (unit?.experienceTheme && (TAG_INTEREST_MAP[unit.experienceTheme] ?? []).some((tag) => (place.tags ?? []).includes(tag))) {
    return whyTexts.experience(unit.experienceTheme)
  }
  // Hueco a mitad de día: lo gratis que entró antes de la parada con hora (y lo de pago, por fuera).
  if (unit?.gapFillerBefore) {
    const outside = visit.place.outsideOf?.length ? ` ${whyTexts.outside(joinSpanish(visit.place.outsideOf))}` : ''
    return whyTexts.inGap() + outside
  }
  // Atardecer: solo el mirador que el motor colocó para la puesta de sol (lleva su hora). Llegar de 60 a
  // 30 min antes es "con tiempo"; menos de 30, "justo a tiempo".
  if (visit.place.sunset != null && visit.start >= visit.place.sunset - 60 && visit.start <= visit.place.sunset + 15) {
    return visit.place.sunset - visit.start > 30 ? whyTexts.sunsetEarly(city) : whyTexts.sunset(city)
  }
  return visit.start >= lunchEnd ? whyTexts.onTheWay() : whyTexts.onTheWayMorning()
}

/**
 * El aviso del madrugón, con las plantillas del destino. {hora}: a la que se empieza; {lugar}: el nivel 1 que
 * se salva, con su artículo ("el Foro Romano y el Altar de la Patria"); {cierre}: en invierno, la hora a la
 * que cierra ese día (lo que antes cierra), si cierra antes de las 18:00.
 */
function wakeNoticeFor(destData, tripDay, places, startedAt) {
  const templates = destData.destination_config?.wake_notices ?? {}
  const levelOne = places.filter((place) => place.level === 1)
  const named = (levelOne.length > 0 ? levelOne : places).map((place) => placeWithArticle(destData.places?.find((other) => other.name === place.name) ?? place))
  const lugar = named.length > 0 ? joinSpanish([...new Set(named)]) : 'todo lo de hoy'
  const hours = tripDay.hours ?? {}
  const month = hours.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : null
  const winter = month !== null && (destData.destination_config?.context_banners?.meses_invierno ?? []).includes(month)
  // Lo que cierra pronto ese día (el Foro a las 16:30). El aviso de invierno nombra SOLO eso (decisión del
  // 2026-09-26: decía "el Foro Romano y el Panteón cierran a las 16:30" y el Panteón abre hasta las 19:00).
  const earlyClosing = levelOne
    .map((place) => ({ place, close: parseClosingMinutes(scheduleForDay(destData.places?.find((other) => other.name === place.name) ?? place, hours)) }))
    .filter(({ close }) => close !== null && close < EARLY_CLOSING_MINUTES)
  const closings = earlyClosing.map(({ close }) => close)
  const fill = (text, values) => String(text).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)
  const closingNamed = [...new Set(earlyClosing.map(({ place }) => placeWithArticle(destData.places?.find((other) => other.name === place.name) ?? place)))]
  // Varios lugares: la variante en plural ("cierran", "los veas").
  const cierre = closingNamed.length > 1 ? templates.cierre_varios ?? templates.cierre : templates.cierre
  if (winter && closings.length > 0 && cierre) return fill(cierre, { hora: toHHMM(startedAt), lugar: joinSpanish(closingNamed), cierre: toHHMM(Math.min(...closings)) })
  if (templates.general) return fill(templates.general, { hora: toHHMM(startedAt), lugar })
  return `Hoy empezamos a las ${toHHMM(startedAt)} para que te dé tiempo a ver ${lugar}`
}

/**
 * El tramo en transporte de una parada: "el bus 118 (desde la Pirámide)" → "Bus 118, unos 25 min" con 🚌; el metro
 * con 🚇 y el tranvía con 🚊. Lo de entre paréntesis (desde dónde) se queda en `detail`.
 */
function transitFields({ how, minutes }) {
  const text = String(how).replace(/^(el|la)\s+/i, '')
  const detail = text.match(/\(([^)]*)\)/)?.[1] ?? null
  const line = text.replace(/\s*\([^)]*\)/, '').trim()
  const icon = /metro/i.test(line) ? '🚇' : /tranv/i.test(line) ? '🚊' : '🚌'
  return { icon, label: `${line.charAt(0).toUpperCase()}${line.slice(1)}, unos ${minutes} min`, minutes, detail }
}

/** "Cierre temprano": lo que cierra antes de esta hora (el Foro, a las 16:30 en invierno). */
const EARLY_CLOSING_MINUTES = 18 * 60

/**
 * Un día de ciudad del motor v3, en el formato de la app.
 *
 * @param {object} args
 * @param {object} args.destData
 * @param {object} args.tripDay          un elemento de planTrip().days (con `units` y `schedule`)
 * @param {string} args.city
 * @param {object[]} [args.nightChain]
 * @param {Set<string>} [args.dayVisitedNames]
 */
export function formatDayV3({ destData, tripDay, city, nightChain = [], dayVisitedNames = new Set(), tourRepeats = false }) {
  const { schedule } = tripDay
  const unitById = new Map(tripDay.units.map((unit) => [unit.id, unit]))
  const lunchEnd = schedule.meals.find((meal) => meal.type === 'lunch')?.end ?? 0
  const tour = destData.default_free_tour ?? null
  const tourToday = schedule.visits.some((visit) => visit.place.isFreeTour)
  const stops = schedule.visits.map((visit, visitIndex) => {
    const stop = buildStop(visit.place, visit.start, visit.end - visit.start, unitById.get(visit.unitId)?.revisitReason ?? null)
    // La estirable que se lleva un buen rato (decisión del usuario, 2026-09-28): con su nombre y su texto, nunca
    // tiempo libre suelto ("Tiempo libre en Villa Borghese: barca en el lago, bici…").
    const stretchUnit = unitById.get(visit.unitId)
    const stretchedLong = stretchUnit?.stretchTitle && stretchUnit.stretchBase != null && visit.end - visit.start - stretchUnit.stretchBase >= STRETCH_TITLE_MIN
    stop.why = whyFor(visit, unitById.get(visit.unitId), { destData, city, tripDay, lunchEnd, tour, tourToday, tourRepeats })
    // Mirador del atardecer: la hora de la puesta de sol a la que se ajusta (para las comprobaciones).
    if (visit.place.sunset != null) stop.sunset_minutes = visit.place.sunset
    // Y su etiqueta: "🌅 El momento perfecto para ver el atardecer" (texto del destino), no "Elegido según tus gustos".
    if (visit.place.sunset != null && destData.destination_config?.sunset_text) stop.why = destData.destination_config.sunset_text
    // El mirador que llega ya de noche (en invierno): no se vende como atardecer, sino como la ciudad
    // iluminada (decisión del 2026-09-26; el texto, en el JSON del destino).
    // (También el de las rutas de 1 día, que no pasan por el ajuste de blockTrip.)
    const sunsetToday = tripDay.hours?.sunset ?? null
    const curatedStops = (destData.curated_days ?? []).flatMap((day) => [...(day.manana ?? []), ...(day.tarde ?? []), ...Object.values(day.variantes ?? {}).flatMap((variant) => [...(variant.manana ?? []), ...(variant.tarde ?? [])])])
    const sunsetMirador = (destData.morning_flows ?? []).concat(destData.afternoon_flows ?? []).some((block) => block.paradas.some((stop) => stop.rol === 'atardecer' && stop.lugar === visit.place.name)) || curatedStops.some((stop) => stop.rol === 'atardecer' && stop.lugar === visit.place.name)
    // Si llega después de que se ponga el sol, ya es de noche (decisión del usuario, 2026-09-28: el Pincio a las 17:00
    // con el sol a las 16:39 no es "el atardecer más clásico"): "Roma iluminada desde el Pincio", sin 🌅.
    const lateForSun = (sunsetMirador || visit.place.sunset != null) && sunsetToday != null && visit.start > sunsetToday
    if (visit.place.nightView || lateForSun) {
      stop.night_view = true
      delete stop.sunset_minutes
      // Un texto por mirador (decisión del usuario, 2026-09-28): en el puente o en los Foros no se está en alto.
      stop.why = destData.destination_config?.night_view_texts?.[visit.place.name] ?? destData.destination_config?.night_view_text ?? 'Vistas de la ciudad iluminada.'
      // Sale como experiencia nocturna, con su nombre: "Roma iluminada desde el Janículo" (decisión del 2026-09-27).
      const desde = destData.destination_config?.night_view_names?.[visit.place.name]
      const template = destData.destination_config?.night_view_title
      if (desde && template) stop.night_view_title = template.replace('{desde}', desde)
    }
    // El tramo en bus o metro hasta aquí (`traslado_min`): "🚌 Bus 118, unos 25 min".
    if (visit.place.transit) stop.transit = transitFields(visit.place.transit)
    // (Opcional en lo escrito: el viajero ve qué puede saltarse. PROMPT_QUITAR_RITMOS 2.)
    if (unitById.get(visit.unitId)?.optional) stop.is_optional = true
    // Lo que recorre el Free Tour, para que la ficha lo diga: esos sitios no vuelven a salir sueltos.
    if (visit.place.isFreeTour && Array.isArray(visit.place.covers)) stop.free_tour_covers = visit.place.covers
    // La foto del Free Tour: la propia del destino (`photo_url`) cuando la haya; mientras, la de un lugar que ya
    // tiene la app (`photo_from`: Piazza Navona), nunca la que devuelva buscar "Free Tour" por su nombre.
    if (visit.place.isFreeTour) {
      if (tour?.photo_url) stop.photo_url = tour.photo_url
      const photoPlace = tour?.photo_from ? destData.places?.find((candidate) => candidate.name === tour.photo_from) : null
      if (photoPlace) {
        stop.photo_name = photoPlace.name
        stop.wikipedia_title = photoPlace.wikipedia_title ?? null
      }
    }
    // Una pausa con nombre (el desayuno romano): no es un lugar, se pinta como la comida, con su icono, su texto
    // y dos cafés cerca de los restaurantes del destino. Sin horario, etiquetas ni ficha.
    if (visit.place.isBreak) {
      stop.is_break = true
      stop.break_icon = visit.place.icon ?? '☕'
      stop.break_suggestions = breakSuggestions(destData, visit.place)
      for (const key of ['hours', 'schedule', 'hours_card', 'tags', 'category', 'category_label', 'wikipedia_title', 'tip', 'reservation', 'ticket_info', 'experience']) delete stop[key]
    }
    // Posición en el orden curado del día (fijado a mano: Popolo → Pincio → España): el programador
    // no lo invierte y la métrica de zigzag tampoco lo cuenta como paseo de más.
    const curatedIndex = unitById.get(visit.unitId)?.curatedIndex
    if (curatedIndex != null) stop.curated_index = curatedIndex
    // Entró por una experiencia elegida (Paso 3): la app le pone una etiqueta con su nombre.
    const experienceTheme = unitById.get(visit.unitId)?.experienceTheme
    if (experienceTheme && (TAG_INTEREST_MAP[experienceTheme] ?? []).some((tag) => (visit.place.tags ?? []).includes(tag))) stop.experience = experienceTheme
    // De temporada con `aprox`, en el margen de 15 días: la parada lleva el aviso del propio dato.
    const source = destData.places?.find((candidate) => candidate.name === visit.place.name)
    // La pestaña «Entradas» (PARA_CODE_NAVONA 6): un sitio de acceso libre no la lleva, salvo que esté en el recorrido de un
    // Free Tour (entonces va en ella ese tour) o tenga una parte de pago (la cúpula, la cripta).
    if (source && !visit.place.isFreeTour && !visit.place.isBreak) {
      if (!(source.ticket_info ?? []).some((line) => /de pago|se pagan?\b/i.test(line))) stop.free_access = true
      const tourCfg = destData.default_free_tour
      if ((tourCfg?.covers ?? []).includes(source.name)) stop.in_free_tour = { name: tourCfg.name, duration_minutes: tourCfg.duration_minutes ?? null, meeting_point: tourCfg.meeting_point ?? null, url: tourCfg.url ?? null }
      // (La ficha, solo con nuestro texto: sin el que escribe la IA bajo demanda.)
      if (source.sin_texto_ia) {
        stop.no_ai_text = true
        // (Y el texto del lugar, el de su ficha: va debajo del «por qué» de la ruta si no son el mismo.)
        const placeText = destData.por_que_lugares?.[source.name] ?? null
        if (placeText) stop.place_text = placeText
      }
    }
    if (source?.available) {
      const hours = tripDay.hours ?? {}
      const fit = seasonFit(source.available, { hasDates: Boolean(hours.weekday), month: hours.dateIso ? Number(String(hours.dateIso).slice(5, 7)) - 1 : null }, hours.dateIso ?? null, true)
      if (fit.notice) stop.season_notice = fit.notice
    }
    // Una calle no es una parada (Parte A, regla 4): sale como "Pasas por…", sin número.
    // (La Via Appia Antica en D7 es el paseo del día, no una calle de paso: `no_calle`.)
    if ((isStreet(visit.place) && !visit.place.notStreet) || visit.place.passThrough) {
      stop.pass_through = true
      stop.why = whyTexts.passThrough()
      delete stop.experience
    }
    // Un imprescindible cerrado ese día que se enseña por fuera (decisión del 2026-09-26): con su motivo.
    const sourcePlace = destData.places?.find((candidate) => candidate.name === visit.place.name)
    // Un monumento (lo que tiene interior: el Altar, el Tempietto, el Castillo) nunca va "por el camino": sale
    // "Por fuera" y dice por qué (PROMPT_RUTAS_CURADAS B2.3). Lo de acera (plazas, fuentes, ruinas) sí es camino.
    if (stop.pass_through && sourcePlace?.type === 'interior') {
      stop.outside = true
      stop.outside_reason = visit.place.outsideReason ?? 'Hoy lo ves por fuera para llegar a todo lo del día'
    }
    // Todo monumento es parada, por dentro o por fuera (PROMPT_PENDIENTE B): `visit_mode` para la cabecera del acordeón
    // ("Por dentro · 75 min" / "Por fuera · 15 min") y el motivo, que la ficha enseña en Resumen.
    if (visit.place.visitOutside) {
      stop.visit_mode = 'fuera'
      stop.outside = true
      stop.outside_reason = visit.place.outsideReason
      stop.outside_kind = visit.place.outsideKind ?? 'no_cabe'
    } else if (sourcePlace?.type === 'interior' && (sourcePlace.level ?? 3) <= 2 && !stop.pass_through && !visit.place.passBy) stop.visit_mode = 'dentro'
    // Un imprescindible es parada de verdad: 20 min como mínimo (la Plaza de España no se ve en 10), salvo por fuera.
    if (sourcePlace?.level === 1 && !visit.place.visitOutside && !stop.pass_through && !visit.place.passBy && !stop.is_night_experience) stop.min_minutes = IMPRESCINDIBLE_MIN_MINUTES
    if (visit.place.maxMinutes) stop.max_minutes = visit.place.maxMinutes
    // (Y una calle o un paseo, nunca por encima de su máximo aunque el redondeo de la pantalla sume: Via della
    // Conciliazione, 45. Solo cuando el máximo es el mismo en los dos ritmos.)
    const walkMax = paseoMaxOf(sourcePlace, false)
    if (walkMax != null && walkMax === paseoMaxOf(sourcePlace, true)) stop.max_minutes = Math.min(stop.max_minutes ?? Infinity, walkMax)
    if (sourcePlace?.level === 1 && (stop.pass_through || visit.place.passThrough || visit.place.passBy || visit.place.visitOutside)) {
      const notice = closedOutsideNotice(destData, sourcePlace, tripDay.hours ?? {})
      if (notice) stop.closed_notice = notice
    }
    // El aviso del día curado ("a esta hora ya hay gente; si puedes, pásate temprano"). La `nota` es INTERNA
    // (instrucciones para nosotros y el motor): nunca sale (PROMPT_AJUSTES_20_RUTAS A.2).
    if (visit.place.stopNotice) stop.notice = visit.place.stopNotice
    // Lo de pago de su grupo que se ve por fuera (el Castillo, desde el Puente; hueco a mitad de día).
    if (visit.place.outsideOf?.length) stop.outside_of = visit.place.outsideOf
    // Un imprescindible ya visto otro día, repasado por fuera camino de la cena (ver planTrip, paso 7).
    if (visit.place.passBy) stop.is_pass_by = true
    // Paso por fuera EN LUGAR de la visita (no ya visto otro día): el Foro que no llega a su cierre.
    if (visit.place.passBy && visit.place.passBy.seenOnDay == null) {
      stop.instead_of_visit = true
      // Lo que se ve desde ese mismo paso (el Arco, desde el Coliseo por fuera): cuenta como visto.
      if (visit.place.passBy.includes?.length) stop.pass_by_includes = visit.place.passBy.includes
      // Se nombra por lo que se hace: "Foro Romano visto desde Via dei Fori Imperiali". El nombre
      // del lugar se guarda aparte (place_name) para la ficha y las comprobaciones.
      const place = destData.places?.find((candidate) => candidate.name === visit.place.name)
      const from = visit.place.passBy.from ?? place?.pass_by?.from ?? null
      if (from) {
        const label = (place?.pass_by?.label ?? visit.place.name).replace(/^(el|la|los|las)\s+/i, '')
        stop.place_name = visit.place.name
        stop.name = `${label.charAt(0).toUpperCase()}${label.slice(1)} visto desde ${from}`
      }
    }
    // El horario de ESE día (fechas: el del día de la semana; época: el de la época; si no, el de
    // lunes a viernes), y sin fechas, el aviso de los días que a esa hora está cerrado.
    if (!visit.place.passBy && !visit.place.isFreeTour && (visit.place.windows || visit.place.by_day || visit.place.by_season)) {
      const hours = tripDay.hours ?? {}
      const daySchedule = scheduleForDay(visit.place, hours)
      stop.hours = daySchedule
      stop.schedule = daySchedule
      const warning = hoursWarning(visit.place, visit.start, visit.end, hours)
      if (warning) stop.hours_warning = warning
    }
    // "Por qué aquí" curado de la parada (`por_que` del día curado): manda sobre el texto genérico, que solo queda
    // de reserva. Salvo el mirador que llega de noche, que se cuenta como la ciudad iluminada (A.1).
    // Un monumento por fuera usa su `por_fuera` si lo trae (el Castillo: "Hoy lo ves por fuera para llegar al
    // atardecer del Janículo…").
    if (visit.place.curatedWhy && !stop.night_view) {
      const why = visit.place.curatedWhy
      // `solo_si_viene_de` / `solo_si_sigue` (decisión del usuario, 2026-09-28): un texto que habla de lo de antes o de
      // después solo sale si se cumple; si no, su texto general ("general" o el del lugar).
      // (Si entre medias se come, lo de antes es la comida: la Plaza de San Pedro después de comer no "sale de los Museos".)
      const previousVisit = schedule.visits[visitIndex - 1] ?? null
      const lunchBetween = previousVisit && schedule.meals.some((meal) => meal.type === 'lunch' && meal.start >= previousVisit.end - 1 && meal.start < visit.start)
      const previousName = lunchBetween ? 'la comida' : previousVisit?.place.name ?? null
      const nextName = schedule.visits[visitIndex + 1]?.place.name ?? null
      const condition = typeof why === 'object' && why ? (why.solo_si_viene_de ? { lista: why.solo_si_viene_de, nombre: previousName, tipo: 'viene_de' } : why.solo_si_sigue ? { lista: why.solo_si_sigue, nombre: nextName, tipo: 'sigue' } : null) : null
      const holds = !condition || condition.lista.includes(condition.nombre)
      const general = condition && !holds ? (why.general ?? generalWhyOf(destData, visit.place.name)) : null
      stop.why = stop.outside && typeof why === 'object' && why.por_fuera ? why.por_fuera : general ? curatedWhyAt(general, visit.start, tripDay.hours) : curatedWhyAt(why, visit.start, tripDay.hours)
      stop.why_source = 'curado'
      if (condition) stop.why_condition = { tipo: condition.tipo, cumple: holds, usa_general: Boolean(general) }
    }
    // Por fuera, su texto de por fuera (el del lugar: `por_fuera` en el JSON del destino), si la parada no trae el suyo.
    if (stop.visit_mode === 'fuera' && sourcePlace?.por_fuera && !(typeof visit.place.curatedWhy === 'object' && visit.place.curatedWhy?.por_fuera)) {
      stop.why = sourcePlace.por_fuera
      stop.why_source = 'curado'
    }
    if (stretchedLong) {
      stop.display_title = stretchUnit.stretchTitle
      if (stretchUnit.stretchWhy) {
        stop.why = stretchUnit.stretchWhy
        stop.why_source = 'curado'
      }
    }
    // Dónde acaba lo que no acaba donde empieza (el Free Tour, en Piazza Navona): el tramo siguiente sale de ahí.
    if (visit.place.end_coordinates) {
      stop.end_latitude = visit.place.end_coordinates[0]
      stop.end_longitude = visit.place.end_coordinates[1]
    }
    // El Free Tour: dónde acaba y, si se come justo después, que la comida es por esa zona (B.2).
    if (visit.place.isFreeTour && tour?.ends_at?.name) {
      const lunch = schedule.meals.find((meal) => meal.type === 'lunch')
      const lunchNext = lunch && lunch.start >= visit.end && !schedule.visits.some((other) => other.start >= visit.end && other.start < lunch.start)
      stop.free_tour_end = lunchNext ? `El tour acaba en ${tour.ends_at.name}: te hemos buscado la comida por esa zona para que aproveches el día.` : `El tour acaba en ${tour.ends_at.name}.`
    }
    // Festivo con el transporte recortado a esa hora: ningún texto de la parada manda al bus ni al metro.
    if (tripDay.hours?.weekday && tripDay.hours?.dateIso && !anyTransitRuns(destData, tripDay.hours.dateIso, visit.start, visit.start)) {
      for (const field of ['why', 'note', 'description']) if (/\b(bus|autobús|metro|tranvía)\b/i.test(stop[field] ?? '')) stop[field] = withoutPublicTransit(stop[field])
    }
    return stop
  })

  // Se come donde se está: la zona de la última visita antes de cada comida.
  const zoneBefore = (minutes) => [...schedule.visits].reverse().find((visit) => visit.end <= minutes)?.place.zone ?? null
  const dinnerZone = dinnerZoneOf(tripDay)
  const meals = schedule.meals.map((meal) => ({
    time: meal.type,
    suggested_time: toHHMM(meal.start),
    options: [],
    // La comida es una FRANJA (Paso 2): llegar, comer y andar a la siguiente parada.
    ...(meal.type === 'lunch' ? { window_end: toHHMM(meal.end) } : {}),
    // Dónde se come: el restaurante que eligió el programador (lunchSpots.js), con su zona.
    ...(meal.type === 'lunch' && meal.spot
      ? { zone: meal.spot.zone, zone_display: `en ${String(meal.spot.zone).replace(/\s*\/\s*/g, ' y ')}`, restaurant: meal.spot.name, latitude: meal.coordinates[0], longitude: meal.coordinates[1] }
      : meal.type === 'lunch'
        ? zoneFields(destData, tripDay.lunchZone ?? zoneBefore(meal.start) ?? dinnerZone, 'comida')
        : {
            ...dinnerFields(destData, tripDay.dinnerZone, dinnerZone),
            // La cena también lleva su restaurante recomendado (decisión del usuario, 2026-09-28).
            ...(tripDay.dinnerRestaurant ? { restaurant: tripDay.dinnerRestaurant.name, latitude: tripDay.dinnerRestaurant.coordinates[0], longitude: tripDay.dinnerRestaurant.coordinates[1] } : {}),
          }),
  }))

  // Por qué hoy se madruga, si el día tuvo que pasar al horario normal para no perder un
  // imprescindible. Con el nombre de lo que se recupera, no con la regla.
  // El motivo de verdad: lo principal de lo que se recupera (el Coliseo y el Foro, no el Arco que abre
  // el grupo): sus imprescindibles de visita larga, o el más largo si no hay.
  // Nunca lo que va de paso (decisión del 2026-09-26): el motivo es lo que por madrugar se visita.
  const visitedToday = (name) => schedule.visits.some((visit) => visit.place.name === name && !visit.place.passThrough && !visit.place.passBy)
  const recoveredPlaces = [
    ...(schedule.modeFallback?.recoveredUnitIds ?? []).flatMap((id) => {
      const places = (unitById.get(id)?.places ?? []).filter((place) => visitedToday(place.name))
      const main = places.filter((place) => place.level === 1 && (place.duration_minutes ?? 0) >= 45)
      return main.length > 0 ? main : [...places].sort((a, b) => (b.duration_minutes ?? 0) - (a.duration_minutes ?? 0)).slice(0, 1)
    }),
    // Madrugar pedido por la reparación del viaje: lo que se recupera es un imprescindible del viaje.
    // Solo lo que de verdad entra hoy (la reparación pasa la lista entera de lo que faltaba).
    ...(schedule.modeFallback?.recoveredNames ?? [])
      .filter(visitedToday)
      .map((name) => destData.places?.find((place) => place.name === name))
      .filter(Boolean),
  ].filter(Boolean)
  const recovered = recoveredPlaces.map((place) => placeWithArticle(place)).filter(Boolean)
  // La comida acortada para no perder un imprescindible (ajustes C): se dice SIEMPRE (decisión del
  // 2026-09-26), con lo que se salva; si no se sabe nombrarlo, "todo lo de hoy". Nunca baja de 60 min.
  const shortened = schedule.shortenedLunch ?? []
  const namedByLunch = shortened
    .map((name) => destData.places?.find((place) => place.name === name))
    .filter(Boolean)
    .map((place) => placeWithArticle(place))
  const savedByLunch = namedByLunch.length > 0 ? namedByLunch : shortened.length > 0 ? ['todo lo de hoy'] : []
  // El madrugón se cuenta con cercanía (decisión del 2026-09-26), con las plantillas del JSON del destino
  // (`destination_config.wake_notices`): la general, o la del cierre temprano en invierno. Si además se
  // acorta la comida, se añade; ninguna de las dos cosas va en silencio.
  const wakeNotice = schedule.modeFallback?.startedAt != null ? wakeNoticeFor(destData, tripDay, recoveredPlaces, schedule.modeFallback.startedAt) : null
  const lunchNotice = savedByLunch.length > 0 ? `Hoy la comida es más corta para que te dé tiempo a ver ${joinSpanish(savedByLunch)}` : null
  const dayNotice = wakeNotice && lunchNotice ? `${wakeNotice} ${lunchNotice}.` : wakeNotice ?? lunchNotice

  // El ancla cerrada todo el viaje que no se ve por fuera (los Museos Vaticanos): el aviso va en la primera parada
  // de su bloque, con lo que sí se ve (la Plaza y la Basílica de San Pedro).
  for (const closed of tripDay.closedAnchors ?? []) {
    const blockVisits = schedule.visits.filter((visit) => String(visit.unitId).startsWith(`${closed.blockId}:`) && !visit.place.passThrough)
    const at = schedule.visits.indexOf(blockVisits[0])
    if (at < 0) continue
    const rest = blockVisits.map((visit) => destData.places?.find((place) => place.name === visit.place.name)).filter((place) => place?.level === 1)
    const place = destData.places?.find((candidate) => candidate.name === closed.name)
    const notice = closedAnchorNotice(destData, place, closed.dates, rest, joinSpanish)
    if (notice) stops[at].closed_notice = notice
  }

  const mediaJornada = tripDay.halfDayExcursion ?? null
  // El paseo nocturno: antes de cenar si ya es de noche y la tarde deja sitio (Estaciones, Parte 3).
  const lastVisit = schedule.visits.at(-1)
  const dinnerMeal = schedule.meals.find((meal) => meal.type === 'dinner')
  const asPoint = (coords) => (Array.isArray(coords) ? { lat: coords[0], lng: coords[1] } : null)
  const nightTimingInput = {
    sunset: tripDay.hours?.sunset ?? null,
    lastEnd: lastVisit?.end ?? null,
    lastCoords: asPoint(lastVisit?.place.end_coordinates ?? lastVisit?.place.coordinates),
    dinnerStart: dinnerMeal?.start ?? null,
    dinnerEnd: dinnerMeal?.end ?? null,
    dinnerCoords: asPoint(dinnerMeal?.coordinates),
    dateIso: tripDay.hours?.dateIso ?? null,
  }
  // Una nocturna que solo vale antes de cenar (el Janículo de noche: el bus 115 deja de subir a las 22:00): si el barrio
  // de la tarde se estiró hasta la cena, devuelve lo justo para que quepa antes (segundo repaso, 2026-09-28).
  const absorbed = lastVisit?.place.absorbedExtra ?? 0
  if (absorbed > 0 && nightChain.some((entry) => entry.solo_antes_de_cenar) && !nightTiming(nightChain, nightTimingInput).beforeDinner) {
    // Hasta dejar el barrio en media hora (luego se baja del mirador por él, camino de la cena).
    const maxCut = Math.max(absorbed, lastVisit.end - lastVisit.start - 30)
    for (let cut = 15; cut <= maxCut; cut += 15) {
      if (!nightTiming(nightChain, { ...nightTimingInput, lastEnd: lastVisit.end - cut }).beforeDinner) continue
      nightTimingInput.lastEnd = lastVisit.end - cut
      const last = stops[schedule.visits.length - 1]
      if (last) last.duration_minutes = Math.max(20, (last.duration_minutes ?? 0) - cut)
      break
    }
  }
  // Invierno con más de 90 min antes de cenar (segundo repaso, 2026-09-28): la nocturna va antes de la cena, detrás de
  // como mucho 60 min de rato libre (el paseo por Via del Corso); lo que sobre se lo lleva la nocturna (index.js).
  let chainForNight = nightChain
  const winterEvening = (tripDay.hours?.sunset ?? Infinity) < WINTER_EVENING_BEFORE && (schedule.idleBeforeDinner ?? 0) > WINTER_IDLE_MAX
  if (nightChain.length > 0) {
    const chain = winterEvening && !nightTiming(nightChain, nightTimingInput).beforeDinner ? nightChain.map((entry) => ({ ...entry, afterDinnerOnly: false })) : nightChain
    // Con la nocturna antes de cenar (repaso 3, 2026-09-28): primero la nocturna (20-25 min) y luego el rato de "luces y
    // aperitivo", justo antes de la cena y hasta la hora de cenar (hasta 90 min, ver index.js).
    if (nightTiming(chain, nightTimingInput).beforeDinner) chainForNight = chain
  }
  const nightStops = chainForNight.length > 0 ? nightStopsFor(chainForNight, dayVisitedNames, nightTimingInput) : []
  const lastNightBefore = nightStops.filter((stop) => stop.before_dinner).at(-1)
  // (Con días escritos, el restaurante escrito manda: no se vuelve a elegir junto a la nocturna.)
  if (lastNightBefore && lastNightBefore.latitude != null && !tripDay.written) {
    const dinnerMealOut = meals.find((meal) => meal.time === 'dinner')
    const near = [lastNightBefore.latitude, lastNightBefore.longitude]
    const pick = dinnerMealOut ? recommendedRestaurant(destData, { meal: 'cena', near, weekday: tripDay.hours?.weekday ?? null, dateIso: tripDay.hours?.dateIso ?? null, exclude: new Set(tripDay.otherRestaurants ?? []) }) : null
    // (La cena va en la zona donde acaba la tarde: después de Navona y el Panteón de noche, cerca de ellos.)
    if (pick && pick.name !== dinnerMealOut.restaurant) Object.assign(dinnerMealOut, { restaurant: pick.name, latitude: pick.coordinates[0], longitude: pick.coordinates[1], zone: pick.zone ?? dinnerMealOut.zone, zone_display: pick.zone ? `en ${String(pick.zone).replace(/\s*\/\s*/g, ' y ')}` : dinnerMealOut.zone_display })
  }
  return {
    day_number: tripDay.dayNumber,
    title: `${city} — día ${tripDay.dayNumber}`,
    type: 'city',
    stops: quarterHourStops([...stops, ...nightStops]),
    meals: meals.map((meal) => ({ ...meal, suggested_time: nearestQuarter(meal.suggested_time), ...(meal.window_end ? { window_end: nearestQuarter(meal.window_end) } : {}) })),
    not_included: [],
    times_are_final: true,
    dinner_zone: tripDay.dinnerZone ?? dinnerZone,
    half_day_excursion: mediaJornada
      ? {
          id: mediaJornada.id,
          starts_at: toHHMM(HALF_DAY_EXCURSION_START),
          ends_at: toHHMM(HALF_DAY_EXCURSION_END),
          route_starts_at: toHHMM(HALF_DAY_ROUTE_START),
        }
      : null,
    day_notice: dayNotice,
    // Para el bloque de tiempo libre antes de cenar (la app lo recalcula si el viajero edita el día).
    dinner_walk_minutes: schedule.meals.find((meal) => meal.type === 'dinner')?.walkMinutes ?? null,
    engine_stats: { walk_minutes: schedule.walkMinutes, idle_minutes: schedule.idleMinutes, idle_before_dinner: schedule.idleBeforeDinner },
  }
}
