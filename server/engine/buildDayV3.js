/**
 * Adaptador del servidor para el programador del motor v3 (shared/routeEngine/scheduleDay.js).
 *
 * Traduce en los dos sentidos y nada más:
 *   - entrada: la asignación de un día del reparto -> unidades con prioridad, orden curado y hora
 *     fija del Free Tour, más la matriz de tiempos del destino;
 *   - salida: el resultado del programador -> el MISMO formato de día que ya pinta la app (paradas,
 *     comidas con su zona, nocturnas), más `unscheduled` con lo que no ha cabido y por qué.
 *
 * Lo que es del servidor (leer la matriz del disco, los datos del destino) vive aquí; el programador
 * no sabe nada de archivos, que es lo que permite llevárselo a Modo Hoy.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTravelTimes } from '../../shared/routeEngine/travelTimes.js'
import { PRIORITY, scheduleDay } from '../../shared/routeEngine/scheduleDay.js'
import { MODES_V3 } from '../../shared/routeEngine/modes.js'
import { toHHMM } from '../../shared/routeEngine/time.js'
import { mealZoneInfo } from '../routeAlgorithm.js'
import { HALF_DAY_EXCURSION_END, HALF_DAY_EXCURSION_START, HALF_DAY_ROUTE_START } from './modeConfig.js'
import { buildStop } from './buildDay.js'
import { nightStopsFor } from './nightWalk.js'
import { TIER } from './preplan.js'

const TRAVEL_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../data/pipeline_v2/travel')
const travelByDestination = new Map()

/**
 * La matriz del destino, cargada una vez por proceso. Sin matriz el programador sigue funcionando
 * con tramos estimados (línea recta por el rodeo): peor, pero nunca roto.
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

/** Motivo de lo que no cabe, en palabras del viajero. */
const REASON_TEXT = {
  closed: 'Está cerrado a las horas que quedaban libres ese día',
  after_last_entry: 'A esa hora ya había pasado la última entrada',
  closes_during_visit: 'Cerraría antes de que acabara la visita',
  past_dinner: 'No daba tiempo antes de la cena',
  fixed_start_missed: 'No se llegaba a tiempo a su hora',
  long_visit_after_lunch: 'Es una visita larga y necesita una mañana',
  displaced: 'Se quedó sin hueco al entrar algo que elegiste',
  no_room: 'No cabía en el día',
}

function priorityOf(unit, tiers, interestTags) {
  if (unit.isRevisit) return PRIORITY.FILLER
  const tier = tiers.get(unit.id)
  if (tier === TIER.POOL) return PRIORITY.POOL
  if (tier === TIER.ESSENTIAL) return PRIORITY.ESSENTIAL
  return unit.tags.some((tag) => interestTags.has(tag)) ? PRIORITY.THEME : PRIORITY.FILLER
}

/**
 * Los lugares de una unidad, listos para el programador: con la hora fija del Free Tour y con la
 * marca de par inseparable leída de `groups.<id>.inseparable` del JSON del destino. Se marca en el
 * dato, no se deduce por distancia: Plaza de San Pedro y la Basílica son el mismo sitio aunque las
 * coordenadas estén a 200 m, y dos sitios a 200 m no tienen por qué serlo.
 */
export function placesForScheduler(unit, destData, freeTourTime) {
  const pairs = destData.groups?.[unit.id]?.inseparable ?? []
  const joined = (a, b) => pairs.some((pair) => pair.includes(a) && pair.includes(b))
  return unit.places.map((place, index) => {
    const next = unit.places[index + 1]
    return {
      ...place,
      ...(place.isFreeTour && freeTourTime ? { fixed_start: freeTourTime } : {}),
      ...(next && joined(place.name, next.name) ? { inseparableWithNext: true } : {}),
    }
  })
}

function zoneFields(destData, zoneKey, mealType) {
  const info = mealZoneInfo(destData, zoneKey, mealType)
  return { zone: info.name, zone_display: info.display }
}

/**
 * @param {object} args
 * @param {object} args.destData
 * @param {string} args.destinationKey  para encontrar su matriz (roma)
 * @param {object} args.dayPlan         un elemento de preplanTrip().days
 * @param {string} args.modeId          'completo' | 'tranquilo'
 * @param {Map<string, number>} args.tiers
 * @param {Set<string>} args.interestTags
 * @param {string} args.city
 * @param {object[]} [args.nightChain]
 * @param {Set<string>} [args.dayVisitedNames]
 * @param {number} [args.contentDays]  días de ruta del viaje (sin la vuelta)
 * @param {string[]} [args.poolNames]  lo que el viajero eligió, EN EL ORDEN en que lo eligió
 */
export function buildDayV3({ destData, destinationKey, dayPlan, modeId, tiers, interestTags, city, nightChain = [], dayVisitedNames = new Set(), contentDays = 2, poolNames = [] }) {
  const mode = MODES_V3[modeId] ?? MODES_V3.completo
  const travel = travelTimesFor(destinationKey)
  const freeTourTime = destData.default_free_tour?.default_time ?? null

  const curatedOrder = [...(dayPlan.curated?.morning?.places ?? []), ...(dayPlan.curated?.afternoon?.places ?? [])]
  const planUnits = ['morning', 'afternoon'].flatMap((slot) => dayPlan.slots[slot].units)

  const units = planUnits.map((unit) => {
    const curatedIndex = unit.places.map((place) => curatedOrder.indexOf(place.name)).find((index) => index >= 0)
    const poolIndex = unit.places.map((place) => poolNames.indexOf(place.name)).filter((index) => index >= 0)
    return {
      id: unit.id,
      places: placesForScheduler(unit, destData, freeTourTime),
      priority: priorityOf(unit, tiers, interestTags),
      curatedIndex: curatedIndex ?? null,
      poolIndex: poolIndex.length > 0 ? Math.min(...poolIndex) : null,
      isLong: !unit.isFreeTour && unit.minutes >= mode.longVisitMinutes,
      revisitReason: unit.isRevisit ? unit.revisitReason : null,
    }
  })

  // Excursión de medio día: la mañana es la excursión y la ciudad empieza a las 16:00, ya comido.
  const mediaJornada = dayPlan.halfDayExcursion ?? null
  // Si un imprescindible no cabe con las reglas del ritmo, ESE día usa el horario normal: empieza
  // cuando el completo y sin el extra de duración. En completo no hay nada a lo que volver.
  const normal = { ...mode, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const fallbackMode = normal.dayStart !== mode.dayStart || normal.visitDurationBonus !== mode.visitDurationBonus ? normal : null
  const result = scheduleDay({
    units,
    mode,
    travel,
    start: { minutes: mediaJornada ? HALF_DAY_ROUTE_START : mode.dayStart, coordinates: null },
    pendingMeals: { lunch: !mediaJornada, dinner: true },
    longVisitsAnytime: contentDays === 1,
    fallbackMode,
  })

  // El aviso de por qué hoy se madruga. Con el nombre de lo que se recupera, no con la regla.
  const recoveredNames = (result.modeFallback?.recoveredUnitIds ?? []).map((id) => units.find((unit) => unit.id === id)?.places[0]?.name).filter(Boolean)
  const paceNotice = recoveredNames.length > 0 ? `Hoy empezamos a las ${toHHMM(result.modeFallback.startedAt)} para que te dé tiempo a ver ${recoveredNames.join(' y ')}` : null

  const revisitReasonById = new Map(units.map((unit) => [unit.id, unit.revisitReason]))
  const stops = result.visits.map((visit) => buildStop(visit.place, visit.start, visit.end - visit.start, revisitReasonById.get(visit.unitId)))

  // Se come donde se está: la zona de la última visita antes de cada comida.
  const zoneBefore = (minutes) => [...result.visits].reverse().find((visit) => visit.end <= minutes)?.place.zone ?? null
  const fallbackZone = dayPlan.slots.afternoon.zone ?? dayPlan.slots.morning.zone
  const meals = result.meals.map((meal) => {
    const zoneKey = zoneBefore(meal.start) ?? fallbackZone
    return {
      time: meal.type,
      suggested_time: toHHMM(meal.start),
      options: [],
      ...zoneFields(destData, zoneKey, meal.type === 'lunch' ? 'comida' : 'cena'),
      _zoneKey: zoneKey,
    }
  })
  const dinner = meals.find((meal) => meal.time === 'dinner')
  const dinnerZone = dinner?._zoneKey ?? fallbackZone
  for (const meal of meals) delete meal._zoneKey

  const nightStops = nightChain.length > 0 ? nightStopsFor(nightChain, dayVisitedNames) : []

  return {
    day_number: dayPlan.dayNumber,
    title: `${city} — día ${dayPlan.dayNumber}`,
    type: 'city',
    stops: [...stops, ...nightStops],
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
    // Lo que el programador no ha podido meter, con su motivo. Nunca en silencio: el paso 3 del
    // motor v3 hará que el repartidor lo recoloque en otro día; hasta entonces al menos se ve.
    unscheduled: result.unscheduled.map((item) => ({ ...item, reason_text: REASON_TEXT[item.reason] ?? REASON_TEXT.no_room })),
    // Solo si el día tuvo que pasar al horario normal para no perder un imprescindible.
    pace_notice: paceNotice,
    engine_stats: { walk_minutes: result.walkMinutes, idle_minutes: result.idleMinutes, idle_before_dinner: result.idleBeforeDinner },
  }
}
