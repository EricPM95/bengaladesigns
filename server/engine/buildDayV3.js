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
import { toHHMM } from '../../shared/routeEngine/time.js'
import { mealZoneInfo } from '../routeAlgorithm.js'
import { HALF_DAY_EXCURSION_END, HALF_DAY_EXCURSION_START, HALF_DAY_ROUTE_START } from './modeConfig.js'
import { buildStop } from './buildDay.js'
import { dinnerZoneOf, nightStopsFor } from '../../shared/routeEngine/nightWalk.js'
import { dinnerZones } from '../../shared/routeEngine/dinnerZones.js'

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
 * Un día de ciudad del motor v3, en el formato de la app.
 *
 * @param {object} args
 * @param {object} args.destData
 * @param {object} args.tripDay          un elemento de planTrip().days (con `units` y `schedule`)
 * @param {string} args.city
 * @param {object[]} [args.nightChain]
 * @param {Set<string>} [args.dayVisitedNames]
 */
export function formatDayV3({ destData, tripDay, city, nightChain = [], dayVisitedNames = new Set() }) {
  const { schedule } = tripDay
  const unitById = new Map(tripDay.units.map((unit) => [unit.id, unit]))
  const stops = schedule.visits.map((visit) => {
    const stop = buildStop(visit.place, visit.start, visit.end - visit.start, unitById.get(visit.unitId)?.revisitReason ?? null)
    // Lo que recorre el Free Tour, para que la ficha lo diga: esos sitios no vuelven a salir sueltos.
    if (visit.place.isFreeTour && Array.isArray(visit.place.covers)) stop.free_tour_covers = visit.place.covers
    // Un imprescindible ya visto otro día, repasado por fuera camino de la cena (ver planTrip, paso 7).
    if (visit.place.passBy) stop.is_pass_by = true
    return stop
  })

  // Se come donde se está: la zona de la última visita antes de cada comida.
  const zoneBefore = (minutes) => [...schedule.visits].reverse().find((visit) => visit.end <= minutes)?.place.zone ?? null
  const dinnerZone = dinnerZoneOf(tripDay)
  const meals = schedule.meals.map((meal) => ({
    time: meal.type,
    suggested_time: toHHMM(meal.start),
    options: [],
    // La comida, donde se está; la cena, en el barrio hacia el que va la tarde.
    ...(meal.type === 'lunch' ? zoneFields(destData, tripDay.lunchZone ?? zoneBefore(meal.start) ?? dinnerZone, 'comida') : dinnerFields(destData, tripDay.dinnerZone, dinnerZone)),
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
