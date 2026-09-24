/**
 * Paso 6 del motor nuevo: convertir la asignación de UN día en paradas con hora.
 *
 * El reparto (preplan.js) ya ha decidido qué unidades van en qué franja de qué día. Aquí solo se
 * decide el ORDEN dentro de cada franja y la HORA de cada parada. Nada de esto cruza días: por eso
 * puede correr aislado en su propia llamada (invariante 20).
 *
 * Las reglas de tiempo, todas del Prompt 9:
 *   - Todo cae en :00 o :30, redondeando SIEMPRE hacia arriba. Ni :15 ni :45.
 *   - El redondeo crea un colchón de 5 a 29 minutos entre paradas. Eso NO es un hueco que haya que
 *     rellenar: es caminar tranquilo, hacer fotos, comprar un helado.
 *   - Dos paradas a menos de 3 minutos se encadenan SIN redondeo entre ellas (llegas a la Plaza de
 *     Venecia, miras, y entras al Altar de la Patria; no esperas veinte minutos en medio). El
 *     redondeo se aplica al salir del grupo.
 *   - Ninguna parada empieza antes de que el sitio abra, ni durante un cierre de mediodía.
 *
 * Las primitivas de horarios y de tiempo a pie se IMPORTAN del motor viejo a propósito: el parser
 * multi-tramo, el clamp de apertura y el colchón de proximidad son invariantes comprados con bugs
 * reales (ver docs/INVARIANTES_MOTOR.md 2 y 22). Reescribirlos sería volver a comprarlos.
 */

import {
  categoryFor,
  fetchWalkingMinutes,
  isAdjacentByDistance,
  mealZoneInfo,
  nextOpenMinutes,
  parseClosingMinutes,
} from '../routeAlgorithm.js'
import { HALF_DAY_EXCURSION_END, HALF_DAY_EXCURSION_START, HALF_DAY_ROUTE_START } from './modeConfig.js'
import { metersBetween } from './preplan.js'
import { nightStopsFor } from './nightWalk.js'

const SLOT_MINUTES = 30
/** Por debajo de esto dos paradas son el mismo sitio: se encadenan sin redondeo (Prompt 9, Parte 6). */
const CHAIN_MAX_WALK_MINUTES = 3
/** Colchón entre paradas que NO están pegadas: salir, orientarse, empezar. */
const TRANSITION_MINUTES = 10

export function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

export function minutesToTime(total) {
  const normalized = ((Math.round(total) % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

/**
 * Al siguiente :00 o :30, SIEMPRE hacia arriba. Las 10:15 pasan a las 10:30; las 10:31, a las 11:00;
 * las 10:00 se quedan donde están.
 *
 * Hacia arriba y no al más cercano —que es lo que hacía el motor viejo— porque redondear hacia abajo
 * significa programar una parada antes de haber llegado a ella.
 */
export function roundUpToSlot(minutes) {
  const remainder = ((minutes % SLOT_MINUTES) + SLOT_MINUTES) % SLOT_MINUTES
  return remainder === 0 ? minutes : minutes + (SLOT_MINUTES - remainder)
}

const coordsOf = (place) => ({ lat: place.coordinates?.[0], lng: place.coordinates?.[1] })

/**
 * Orden geográfico dentro de una franja: vecino más cercano desde el punto de entrada.
 *
 * Cuando la franja viene del reparto curado, su orden se respeta como SEMILLA y solo se intercala lo
 * demás. Está medido: reordenar el núcleo curado por geografía daba rutas peores (25,74 km frente a
 * 23,79 km). Quien escribió ese orden sabía algo que la distancia en línea recta no ve.
 */
function orderPlaces(places, entryCoords, curatedNames) {
  if (places.length <= 1) return places
  const curated = []
  const rest = []
  for (const place of places) {
    if (curatedNames?.has(place.name)) curated.push(place)
    else rest.push(place)
  }
  // El núcleo curado mantiene su orden; el resto entra por cercanía al final de lo ya colocado.
  const ordered = [...curated]
  let cursorCoords = ordered.length > 0 ? coordsOf(ordered[ordered.length - 1]) : entryCoords
  const pending = [...rest]
  while (pending.length > 0) {
    let bestIndex = 0
    let bestDistance = Infinity
    for (let i = 0; i < pending.length; i++) {
      const distance = cursorCoords ? metersBetween(cursorCoords, coordsOf(pending[i])) : 0
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = i
      }
    }
    const next = pending.splice(bestIndex, 1)[0]
    ordered.push(next)
    cursorCoords = coordsOf(next)
  }
  return ordered
}

/** Las unidades de una franja, desplegadas a lugares sueltos y en orden de visita. */
function placesForSlot(slot, entryCoords, curatedNames) {
  // Dentro de una unidad manda su `group_order`: nunca se reordena por geografía (invariante 14).
  // Lo que se ordena es el conjunto de unidades, representadas por su primer lugar.
  const units = slot.units
  if (units.length === 0) return []
  // El Free Tour abre su día siempre (invariante 1), así que no entra en el orden geográfico: se
  // queda delante y el resto de la franja se ordena a partir de donde acaba.
  const units2 = [...units].sort((a, b) => Number(b.isFreeTour) - Number(a.isFreeTour))
  const heads = units2.map((unit) => ({ unit, head: unit.places[0] }))
  const freeTourHead = heads.find((h) => h.unit.isFreeTour)?.head ?? null
  const orderedHeads = freeTourHead
    ? [freeTourHead, ...orderPlaces(heads.filter((h) => !h.unit.isFreeTour).map((h) => h.head), coordsOf(freeTourHead), curatedNames)]
    : orderPlaces(
        heads.map((h) => h.head),
        entryCoords,
        curatedNames,
      )
  const byHead = new Map(heads.map((h) => [h.head.name, h.unit]))
  // El motivo de la revisita viaja pegado al lugar: la unidad se pierde al aplanar a paradas.
  return orderedHeads.flatMap((head) => {
    const unit = byHead.get(head.name)
    return unit.isRevisit ? unit.places.map((place) => ({ ...place, _revisitReason: unit.revisitReason })) : unit.places
  })
}

/**
 * Pone hora a una lista de lugares ya ordenada.
 *
 * @returns {Promise<{stops: object[], cursor: number}>} `cursor` = minuto en que acaba el último.
 */
async function schedulePlaces(places, startMinutes, mapboxToken, mode, cutoff = Infinity) {
  const stops = []
  let cursor = startMinutes
  let previous = null

  for (const place of places) {
    let start
    if (!previous) {
      start = roundUpToSlot(cursor)
    } else {
      const chained = isAdjacentByDistance(previous.coordinates, place.coordinates)
      const walkMinutes = chained ? 0 : await fetchWalkingMinutes(previous.coordinates, place.coordinates, mapboxToken)
      if (chained || walkMinutes <= CHAIN_MAX_WALK_MINUTES) {
        // Encadenado: se entra directamente, sin redondear. Llegas a la plaza, miras, y entras al
        // monumento — no esperas veinte minutos en la puerta porque el reloj no sea redondo.
        start = cursor + walkMinutes
      } else {
        start = roundUpToSlot(cursor + walkMinutes + TRANSITION_MINUTES)
      }
    }

    // Nunca antes de que abra, ni durante un cierre de mediodía. Y si hay que esperar, se espera al
    // siguiente hueco redondo (invariante 2).
    const openAt = nextOpenMinutes(place.schedule, start)
    if (openAt === null) continue // cerrado el resto del día: este lugar no entra
    if (openAt > start) start = roundUpToSlot(openAt)

    const duration = (place.duration_minutes ?? 30) + (place.isFreeTour ? 0 : mode.visitDurationBonus)
    // Tampoco tan tarde que no le dé tiempo a cerrar.
    const closesAt = parseClosingMinutes(place.schedule)
    if (closesAt !== null && start + duration > closesAt) continue
    // El día se acaba a la hora de cenar. Sin este corte la tarde seguía metiendo paradas por
    // encima de la cena: la Domus Aurea a las 20:30 con la cena a las 21:00, o Via Condotti a la
    // misma hora que el restaurante.
    if (start + duration > cutoff) continue

    stops.push(buildStop(place, start, duration, place._revisitReason))
    cursor = start + duration
    previous = place
  }
  return { stops, cursor }
}

export function buildStop(place, startMinutes, durationMinutes, revisitReason) {
  return {
    name: place.name,
    suggested_time: minutesToTime(startMinutes),
    duration_minutes: durationMinutes,
    latitude: place.coordinates?.[0],
    longitude: place.coordinates?.[1],
    tip: place.tip || place.photo_tip || '',
    description: place.tip || place.photo_tip || '',
    hours: place.schedule ?? null,
    wikipedia_title: place.wikipedia_title ?? null,
    tags: Array.isArray(place.tags) ? place.tags : [],
    schedule: place.schedule ?? null,
    // Horarios auditados (2026-09-24): el texto largo para la ficha y si hay que reservar.
    ...(place.card_text ? { hours_card: place.card_text } : {}),
    ...(place.reservation ? { reservation: place.reservation } : {}),
    ...(place.isFreeTour ? { is_free_tour: true, free_tour_meeting_point: place.meeting_point ?? null } : {}),
    // Volver a un sitio a otra hora no es un duplicado por descuido: la ficha lo dice y explica por
    // qué merece la pena (ver revisits.js).
    ...(revisitReason ? { is_revisit: true, revisit_reason: revisitReason } : {}),
    ...categoryFor(place.name, place.tags),
  }
}

/**
 * La comida cae donde el flujo natural del día la encuentra, dentro de su ventana — no a una hora
 * fija. Si la mañana acaba a las 12:40 se come a las 13:00; si acaba a las 13:10, a las 13:30.
 * Fuera de la ventana por arriba, se come al final de la ventana: mejor tarde que nunca.
 */
function mealTimeWithin(cursor, [open, close]) {
  const rounded = roundUpToSlot(Math.max(cursor, open))
  return Math.min(rounded, close)
}

/**
 * Construye el día completo a partir de su asignación del reparto.
 *
 * @param {object} args
 * @param {object} args.destData
 * @param {object} args.dayPlan   Un elemento de `preplanTrip().days`.
 * @param {object} args.mode      MODE_CONFIG del ritmo.
 * @param {string|null} args.mapboxToken
 * @param {string} args.city
 * @param {object[]} [args.nightChain]  Experiencias nocturnas de esta noche (ver nightWalk.js).
 * @param {Set<string>} [args.dayVisitedNames]  Lugares que el viaje ve de día, para marcar revisitas.
 */
export async function buildDayFromPlan({ destData, dayPlan, mode, mapboxToken, city, nightChain = [], dayVisitedNames = new Set() }) {
  const curatedNames = new Set([
    ...(dayPlan.curated?.morning?.places ?? []),
    ...(dayPlan.curated?.afternoon?.places ?? []),
  ])

  // Excursión de medio día: la mañana es la excursión (08:00-14:00) y la ciudad no empieza hasta
  // las 16:00. No lleva bloque de comida: a la hora de comer el viajero está volviendo de Ostia, y
  // proponerle un restaurante en Trastevere a las 13:30 es proponerle algo imposible.
  const mediaJornada = dayPlan.halfDayExcursion ?? null

  const morningPlaces = mediaJornada ? [] : placesForSlot(dayPlan.slots.morning, null, curatedNames)
  // La mañana se corta en la comida, igual que la tarde se corta en la cena. Sin esto una mañana
  // larga se comía la comida y la tarde arrancaba encima de ella: seis solapes, todos a las 15:00.
  const morning = await schedulePlaces(morningPlaces, mode.dayStart, mapboxToken, mode, mode.lunchWindow[1])

  const lunchAt = mealTimeWithin(morning.cursor, mode.lunchWindow)
  const meals = mediaJornada
    ? []
    : [
        {
          time: 'lunch',
          suggested_time: minutesToTime(lunchAt),
          options: [],
          ...zoneFields(destData, dayPlan.slots.morning.zone, 'comida'),
        },
      ]

  const afternoonStart = mediaJornada ? HALF_DAY_ROUTE_START : Math.max(lunchAt + mode.lunchMinutes, mode.afternoonStart)
  const lastMorning = morningPlaces[morningPlaces.length - 1] ?? null
  const afternoonPlaces = placesForSlot(dayPlan.slots.afternoon, lastMorning ? coordsOf(lastMorning) : null, curatedNames)
  const afternoon = await schedulePlaces(afternoonPlaces, afternoonStart, mapboxToken, mode, mode.dinnerWindow[0])

  const dinnerAt = mealTimeWithin(afternoon.cursor, mode.dinnerWindow)
  // La cena se hace donde acaba la tarde, no donde empezó el día.
  const dinnerZone = dayPlan.slots.afternoon.zone ?? dayPlan.slots.morning.zone
  meals.push({
    time: 'dinner',
    suggested_time: minutesToTime(dinnerAt),
    options: [],
    ...zoneFields(destData, dinnerZone, 'cena'),
  })

  // El paseo nocturno va después de la cena, encadenado por geografía (ver nightWalk.js).
  const nightStops = nightChain.length > 0 ? nightStopsFor(nightChain, dayVisitedNames) : []

  return {
    day_number: dayPlan.dayNumber,
    title: `${city} — día ${dayPlan.dayNumber}`,
    type: 'city',
    stops: [...morning.stops, ...afternoon.stops, ...nightStops],
    meals,
    not_included: [],
    times_are_final: true,
    // Lo que el viajero pidió y no cupo viaja hasta la UI: mejor avisar que callar.
    dinner_zone: dinnerZone,
    // La excursión de la mañana, con sus horas ya resueltas, para que la UI no tenga que volver a
    // calcularlas (y no pueda calcularlas distinto).
    half_day_excursion: mediaJornada
      ? {
          id: mediaJornada.id,
          starts_at: minutesToTime(HALF_DAY_EXCURSION_START),
          ends_at: minutesToTime(HALF_DAY_EXCURSION_END),
          route_starts_at: minutesToTime(HALF_DAY_ROUTE_START),
        }
      : null,
  }
}

function zoneFields(destData, zoneKey, mealType) {
  const info = mealZoneInfo(destData, zoneKey, mealType)
  return { zone: info.name, zone_display: info.display }
}
