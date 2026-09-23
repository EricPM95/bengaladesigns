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
import { nightStopsFor } from './nightWalk.js'

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

/** La zona donde acaba el día: la de su última visita. Ahí se cena y de ahí sale el paseo nocturno. */
export function dinnerZoneOf(tripDay) {
  const visits = tripDay.schedule?.visits ?? []
  return visits[visits.length - 1]?.place.zone ?? tripDay.curated?.afternoon?.zone ?? tripDay.curated?.morning?.zone ?? null
}

/**
 * El viaje del motor v3 con la forma que espera planNightWalks (nightWalk.js). Con las paradas que
 * de verdad se visitan, no con las del reparto: el motor anterior apartaba el Coliseo nocturno del
 * día 1 "porque ya se había visto" cuando el constructor lo había tirado sin avisar.
 */
export function nightWalkPlan(trip) {
  return {
    days: trip.days.map((day) => {
      const zone = dinnerZoneOf(day)
      const units = (day.schedule?.visits ?? []).map((visit) => ({ places: [visit.place] }))
      return { dayNumber: day.dayNumber, isBlank: day.isBlank, isExcursion: day.isExcursion, slots: { morning: { zone, units }, afternoon: { zone, units: [] } } }
    }),
  }
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
  const stops = schedule.visits.map((visit) => buildStop(visit.place, visit.start, visit.end - visit.start, unitById.get(visit.unitId)?.revisitReason ?? null))

  // Se come donde se está: la zona de la última visita antes de cada comida.
  const zoneBefore = (minutes) => [...schedule.visits].reverse().find((visit) => visit.end <= minutes)?.place.zone ?? null
  const dinnerZone = dinnerZoneOf(tripDay)
  const meals = schedule.meals.map((meal) => ({
    time: meal.type,
    suggested_time: toHHMM(meal.start),
    options: [],
    ...zoneFields(destData, zoneBefore(meal.start) ?? dinnerZone, meal.type === 'lunch' ? 'comida' : 'cena'),
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
    dinner_zone: dinnerZone,
    half_day_excursion: mediaJornada
      ? {
          id: mediaJornada.id,
          starts_at: toHHMM(HALF_DAY_EXCURSION_START),
          ends_at: toHHMM(HALF_DAY_EXCURSION_END),
          route_starts_at: toHHMM(HALF_DAY_ROUTE_START),
        }
      : null,
    pace_notice: paceNotice,
    engine_stats: { walk_minutes: schedule.walkMinutes, idle_minutes: schedule.idleMinutes, idle_before_dinner: schedule.idleBeforeDinner },
  }
}
