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

/** "10:07" → "10:00": el cuarto de hora más cercano (nunca siempre hacia arriba: el día acabaría con retraso). */
function nearestQuarter(hhmm) {
  const minutes = toMinutes(hhmm)
  return Number.isFinite(minutes) ? toHHMM(Math.round(minutes / 15) * 15) : hhmm
}

/**
 * Horas redondas (PROMPT_RUTAS_CURADAS B2.1): el motor calcula con los minutos exactos y aquí se enseña el cuarto de
 * hora más cercano de cada llegada (nunca siempre hacia arriba: el día acabaría con retraso). Lo que hay hasta la
 * siguiente parada (el paseo, la comida, una espera) se queda con sus minutos exactos, y la visita dura lo que cuadra:
 * así la hora de salida más el paseo da la llegada a la siguiente (también lo de paso). Lo que no tiene siguiente se queda
 * con sus minutos; una visita nunca baja de la mitad de lo que dura (entonces, sus minutos de siempre).
 */
/** Antes de esta hora, el "Por qué aquí" que depende de la hora usa su versión `temprano` ("a primera hora, sin gente"). */
const EARLY_WHY_BEFORE = 9 * 60 + 30

/**
 * El `por_que` de la parada: un texto, o { texto, temprano } si depende de la hora. `temprano` solo si la parada empieza
 * antes de las 09:30; si no, `texto` (nunca "a primera hora" a las 10:00 en tranquilo o por la tarde con el pool).
 */
function curatedWhyAt(why, startMinutes) {
  if (typeof why === 'string') return why
  // `temprano_antes` ("09:00"): el umbral de ESE texto, si no es el de siempre (la Fontana de Trevi: antes de la tasa).
  const before = why?.temprano_antes ? toMinutes(why.temprano_antes) : EARLY_WHY_BEFORE
  return startMinutes < before && why?.temprano ? why.temprano : why?.texto ?? why?.temprano ?? null
}

/** Lo más que dura un "Por el camino" (B.1): lo que merece más es una parada. */
const ON_THE_WAY_MAX_MINUTES = 10

function quarterHourStops(stops) {
  const exact = stops.map((stop) => toMinutes(stop.suggested_time))
  return stops.map((stop, index) => {
    const start = exact[index]
    if (!Number.isFinite(start)) return stop
    const roundedStart = Math.round(start / 15) * 15
    const next = index + 1 < stops.length && !stops[index + 1].is_night_experience && !stop.is_night_experience ? exact[index + 1] : NaN
    if (!Number.isFinite(next)) return { ...stop, suggested_time: toHHMM(roundedStart) }
    const gap = next - (start + (stop.duration_minutes ?? 0))
    const duration = Math.round(next / 15) * 15 - gap - roundedStart
    const rounded = duration >= (stop.duration_minutes ?? 0) / 2 ? duration : stop.duration_minutes
    // "Por el camino" dura 10 min como mucho: el sobrante del redondeo no se mete ahí, se queda esperando la hora de
    // la siguiente parada (PROMPT_AJUSTES_20_RUTAS B.1).
    const onTheWay = (stop.pass_through || stop.is_pass_by) && !stop.outside && !stop.instead_of_visit
    return { ...stop, suggested_time: toHHMM(roundedStart), duration_minutes: onTheWay ? Math.min(rounded, ON_THE_WAY_MAX_MINUTES) : rounded }
  })
}
import { dinnerZoneOf, nightStopsFor } from '../../shared/routeEngine/nightWalk.js'
import { dinnerZones } from '../../shared/routeEngine/dinnerZones.js'
import { TAG_INTEREST_MAP } from '../../shared/routeEngine/experienceTags.js'
import { hoursWarning, parseClosingMinutes, scheduleForDay } from '../../shared/routeEngine/openingHours.js'
import { seasonFit } from '../../shared/routeEngine/availability.js'
import { isStreet } from '../../shared/routeEngine/localRules.js'
import { joinSpanish, placeWithArticle, whyTexts } from '../../shared/routeEngine/whyTexts.js'
import { closedAnchorNotice, closedOutsideNotice } from '../../shared/routeEngine/closedNotices.js'

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
    travelByDestination.set(destinationKey, createTravelTimes(matrix))
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
  const templates = destData.destination_config?.pace_notices ?? {}
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
  const stops = schedule.visits.map((visit) => {
    const stop = buildStop(visit.place, visit.start, visit.end - visit.start, unitById.get(visit.unitId)?.revisitReason ?? null)
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
    if (visit.place.nightView || (sunsetMirador && visit.place.sunset == null && sunsetToday != null && visit.start > sunsetToday + 30)) {
      stop.night_view = true
      stop.why = destData.destination_config?.night_view_text ?? 'Vistas de la ciudad iluminada.'
      // Sale como experiencia nocturna, con su nombre: "Roma iluminada desde el Janículo" (decisión del 2026-09-27).
      const desde = destData.destination_config?.night_view_names?.[visit.place.name]
      const template = destData.destination_config?.night_view_title
      if (desde && template) stop.night_view_title = template.replace('{desde}', desde)
    }
    // El tramo en bus o metro hasta aquí (`traslado_min`): "🚌 Bus 118, unos 25 min".
    if (visit.place.transit) stop.transit = transitFields(visit.place.transit)
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
      stop.outside_reason = visit.place.outsideReason ?? 'hoy no toca entrar'
    }
    if (sourcePlace?.level === 1 && (stop.pass_through || visit.place.passThrough || visit.place.passBy)) {
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
    if (visit.place.curatedWhy && !stop.night_view) {
      stop.why = curatedWhyAt(visit.place.curatedWhy, visit.start)
      stop.why_source = 'curado'
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
        : dinnerFields(destData, tripDay.dinnerZone, dinnerZone)),
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
  // (`destination_config.pace_notices`): la general, o la del cierre temprano en invierno. Si además se
  // acorta la comida, se añade; ninguna de las dos cosas va en silencio.
  const wakeNotice = schedule.modeFallback?.startedAt != null ? wakeNoticeFor(destData, tripDay, recoveredPlaces, schedule.modeFallback.startedAt) : null
  const lunchNotice = savedByLunch.length > 0 ? `Hoy la comida es más corta para que te dé tiempo a ver ${joinSpanish(savedByLunch)}` : null
  const paceNotice = wakeNotice && lunchNotice ? `${wakeNotice} ${lunchNotice}.` : wakeNotice ?? lunchNotice

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
  }
  return {
    day_number: tripDay.dayNumber,
    title: `${city} — día ${tripDay.dayNumber}`,
    type: 'city',
    stops: quarterHourStops([...stops, ...(nightChain.length > 0 ? nightStopsFor(nightChain, dayVisitedNames, nightTimingInput) : [])]),
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
    pace_notice: paceNotice,
    // Para el bloque de tiempo libre antes de cenar (la app lo recalcula si el viajero edita el día).
    dinner_walk_minutes: schedule.meals.find((meal) => meal.type === 'dinner')?.walkMinutes ?? null,
    engine_stats: { walk_minutes: schedule.walkMinutes, idle_minutes: schedule.idleMinutes, idle_before_dinner: schedule.idleBeforeDinner },
  }
}
