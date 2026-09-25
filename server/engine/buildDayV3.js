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
import { dinnerZoneOf, nightStopsFor } from '../../shared/routeEngine/nightWalk.js'
import { dinnerZones } from '../../shared/routeEngine/dinnerZones.js'
import { hoursWarning, scheduleForDay } from '../../shared/routeEngine/openingHours.js'
import { joinSpanish, placeWithArticle, whyTexts } from '../../shared/routeEngine/whyTexts.js'

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
  // Revisitas y pasos por fuera ya traen su texto (revisitReason).
  if (visit.place.passBy || unit?.isRevisit) return null
  if (unit?.poolIndex != null) return whyTexts.pool()
  if (place.level === 1) {
    const paidInterior = !(place.is_free_access ?? place.type === 'exterior')
    if (tourToday && paidInterior && (tour?.covers ?? []).includes(place.name)) return whyTexts.insideAfterTour(placeWithArticle(place), city)
    return whyTexts.essential(city)
  }
  if (unit?.experienceTheme) return whyTexts.experience(unit.experienceTheme)
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
    // Lo que recorre el Free Tour, para que la ficha lo diga: esos sitios no vuelven a salir sueltos.
    if (visit.place.isFreeTour && Array.isArray(visit.place.covers)) stop.free_tour_covers = visit.place.covers
    // Posición en el orden curado del día (fijado a mano: Popolo → Pincio → España): el programador
    // no lo invierte y la métrica de zigzag tampoco lo cuenta como paseo de más.
    const curatedIndex = unitById.get(visit.unitId)?.curatedIndex
    if (curatedIndex != null) stop.curated_index = curatedIndex
    // Entró por una experiencia elegida (Paso 3): la app le pone una etiqueta con su nombre.
    const experienceTheme = unitById.get(visit.unitId)?.experienceTheme
    if (experienceTheme) stop.experience = experienceTheme
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
  const recovered = (schedule.modeFallback?.recoveredUnitIds ?? []).map((id) => unitById.get(id)?.places[0]?.name).filter(Boolean)
  const paceNotice = recovered.length > 0 ? `Hoy empezamos a las ${toHHMM(schedule.modeFallback.startedAt)} para que te dé tiempo a ver ${recovered.join(' y ')}` : null

  const mediaJornada = tripDay.halfDayExcursion ?? null
  return {
    day_number: tripDay.dayNumber,
    title: `${city} — día ${tripDay.dayNumber}`,
    type: 'city',
    stops: [...stops, ...(nightChain.length > 0 ? nightStopsFor(nightChain, dayVisitedNames) : [])],
    meals,
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
