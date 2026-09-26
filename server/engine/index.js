/**
 * La puerta del motor nuevo: MISMA firma y MISMA salida que `buildDayBlockV2`, para que el resto de
 * la app no se entere de cuál de los dos la ha servido. Es lo que permite comparar los dos motores
 * sobre la misma ruta antes de tocar el interruptor.
 *
 * El motor nuevo es el que manda por defecto. La bandera se queda para poder volver atrás y para
 * seguir comparando los dos sobre la misma ruta:
 *
 *   ROUTE_ENGINE=viejo    en .env.local  → todas las rutas vuelven al motor viejo
 *   { "engine": "viejo" } en el cuerpo   → solo esa petición, para comparar sin reiniciar
 *
 * Una diferencia que sí se nota: este motor NO tiene tope de 5 días. El viejo devuelve null por
 * encima de esa duración y el día cae en una llamada a Claude (~60-70s y dinero); este los reparte
 * con `zone_priority` y sale gratis e instantáneo.
 */

import { buildExcursionDayV2, buildManualDayV2 } from '../routeAlgorithm.js'
import { preselectedExcursionId } from './excursions.js'
import { preplanTrip } from './preplan.js'
import { buildDayFromPlan } from './buildDay.js'
import { planNightWalks } from './nightWalk.js'
import { formatDayV3, nightWalkPlan, travelTimesFor } from './buildDayV3.js'
import { MID_DAY_GAP_MINUTES, planTrip } from '../../shared/routeEngine/planTrip.js'
import { planShortTrip, shortTripSlots } from '../../shared/routeEngine/shortTrip.js'
import { planBlockTrip } from '../../shared/routeEngine/blockTrip.js'
import { dinnerZones } from '../../shared/routeEngine/dinnerZones.js'
import { findPipelineV2Key } from '../routeAlgorithm.js'
import { TAG_INTEREST_MAP } from '../../shared/routeEngine/experienceTags.js'
import { availabilityLabel, availableForTrip, seasonFit } from '../../shared/routeEngine/availability.js'
import { tripCalendar } from '../../shared/routeEngine/tripCalendar.js'
import { closedOnDay, earliestVisitStart, effectiveSchedule, lastEntryMinutes } from '../../shared/routeEngine/openingHours.js'

/**
 * Qué motor sirve esta petición. El cuerpo manda sobre la variable de entorno, y en ausencia de
 * ambos manda el nuevo.
 *
 * El defecto se cambió después de comprobar que la salida del motor nuevo es un SUPERCONJUNTO de la
 * del viejo: mismo formato, ningún campo menos, dos de más (`dinner_zone`, `is_revisit`). Volver
 * atrás no necesita un despliegue, solo `ROUTE_ENGINE=viejo`.
 */
export function engineFor(requestEngine) {
  const choice = (requestEngine ?? process.env.ROUTE_ENGINE ?? '').toString().trim().toLowerCase()
  if (choice === 'viejo' || choice === 'v2' || choice === 'old') return 'viejo'
  // Motor v3 en construcción (repartidor que pregunta al programador + programador con reloj
  // real, ver shared/routeEngine/). Solo bajo petición: el defecto sigue siendo 'nuevo' hasta que
  // las métricas digan que gana.
  if (choice === 'v3') return 'v3'
  return 'nuevo'
}

/**
 * Un día completo con el motor nuevo. Misma firma que buildDayBlockV2 (invariante: el contrato de
 * entrada/salida no cambia), devuelve `null` si este destino no tiene datos curados.
 */
export async function buildDayBlockV3(
  destData,
  totalDays,
  hasFreeTour,
  dayNumber,
  pace,
  mapboxToken,
  dateRangeStartIso,
  mustIncludePlaces,
  experiencesPositive,
  options = {},
) {
  if (!destData) return null
  // Experiencias de temporada fuera de su ventana: fuera de la selección (Estaciones, Parte 4).
  experiencesPositive = experiencesInSeason(destData, experiencesPositive ?? [], {
    dateRangeStartIso,
    month: options.month ?? null,
    season: options.season ?? null,
    contentDays: Math.max(1, totalDays - 1),
  })

  // El reparto del viaje ENTERO se recalcula en cada llamada: es una función pura y cuesta
  // milisegundos, y es lo que permite que un día construido aislado sepa qué hacen los demás
  // (invariante 20).
  const isV3 = options.scheduler === 'v3'

  // Viaje de UN día (dos franjas) con rutas curadas en el destino: la ruta es la de short_trips, no
  // la del reparto (decisión del 2026-09-23: los viajes cortos se curan a mano; el motor solo pone
  // horas). 1,5 días llegará con los vuelos, que son los que dicen cuántas franjas quedan.
  if (isV3 && destData.short_trips?.blocks && Math.max(1, totalDays - 1) === 1) {
    const travel = travelTimesFor(findPipelineV2Key(destData.destination ?? options.city ?? ''))
    const trip = planShortTrip({
      destData,
      slots: shortTripSlots('1_dia'),
      pace,
      hasFreeTour,
      poolNames: mustIncludePlaces ?? [],
      experiencesPositive: experiencesPositive ?? [],
      travel,
      month: options.month ?? null,
      season: options.season ?? null,
      dateRangeStartIso,
    })
    const tripDay = trip.days.find((day) => day.dayNumber === dayNumber)
    if (!tripDay) return null
    const day = buildCityDayV3(destData, trip, tripDay, options)
    day.not_included = trip.notIncluded.map((item) => ({ name: item.name, reason: item.reason, suggestion: item.reason === 'No te dio tiempo' ? 'Alarga el viaje medio día' : null }))
    day.night_hint = tripDay.nightHint ?? null
    return day
  }

  const tripArgs = {
    destData,
    totalDays,
    pace,
    hasFreeTour,
    poolNames: mustIncludePlaces ?? [],
    experiencesPositive: experiencesPositive ?? [],
    dateRangeStartIso,
  }
  // Mañanas y tardes tipo (Parte B): con bloques curados en el destino, el viaje se monta con ellos.
  const planner = isV3 && Array.isArray(destData.morning_flows) && destData.morning_flows.length > 0 ? planBlockTrip : planTrip
  const plan = isV3 ? planner({ ...tripArgs, month: options.month ?? null, season: options.season ?? null, travel: travelTimesFor(findPipelineV2Key(destData.destination ?? options.city ?? '')) }) : preplanTrip(tripArgs)

  const dayPlan = plan.days.find((day) => day.dayNumber === dayNumber)
  if (!dayPlan) return null

  // Más allá de `max_auto_days` el día sale EN BLANCO a propósito: el destino ya no da para más
  // contenido nuevo y a partir de ahí lo monta el viajero (Prompt 9, Parte 16).
  //
  // Se devuelve un día manual, no `null`. Devolver null hacía que el servidor cayera al camino de
  // Claude y generara el día con IA: cada día por encima del límite costaba una llamada de pago y
  // salía lleno de relleno, que es exactamente lo contrario de lo que el límite quiere conseguir.
  if (dayPlan.isBlank) {
    const day = buildManualDayV2(dayNumber)
    // Se marca de dónde viene el día en blanco: un día que el viajero convirtió a mano en libre y
    // uno que sale en blanco porque el destino ya no da para más contenido nuevo son la misma
    // pantalla, pero solo el segundo tiene algo que explicar.
    day.beyond_auto_days = true
    day.max_auto_days = destData.destination_config?.max_auto_days ?? null
    return day
  }

  // Día de excursión: no tiene paradas de ciudad, tiene OPCIONES, con una ya preseleccionada — la
  // más popular del destino. El viajero puede cambiarla, o rechazarla y recuperar un día de ruta.
  if (dayPlan.isExcursion) {
    const config = destData.destination_config ?? {}
    const day = buildExcursionDayV2(destData, dayNumber, totalDays, pace)
    // Fuera de temporada (`available` de la excursión, Estaciones Parte 4): no se ofrece. Con solo el
    // mes, el mes frontera tampoco (no la ha elegido el viajero).
    const calendar = tripCalendar({ dateRangeStartIso, month: options.month ?? null, season: options.season ?? null })
    const sourceOf = (id) => destData.excursions?.options?.[id] ?? null
    day.excursion_options = day.excursion_options
      .map((option) => ({ option, fit: seasonFit(sourceOf(option.id)?.available ?? option.available, calendar, calendar.dateOfDay(dayNumber), false) }))
      .filter(({ fit }) => fit.enters)
      .map(({ option, fit }) => (fit.notice ? { ...option, season_notice: fit.notice } : option))
    const preferida =day.excursion_options.find((option) => option.id === preselectedExcursionId(destData))
    if (preferida) {
      // La preseleccionada va la primera: es la que la ficha enseña en grande y el resto quedan
      // como alternativas.
      day.excursion_options = [preferida, ...day.excursion_options.filter((option) => option.id !== preferida.id)]
      day.excursion_preselected = preferida.id
    }
    day.excursion_social_proof = config.excursion_social_proof ?? null
    return day
  }

  if (isV3) return buildCityDayV3(destData, plan, dayPlan, { ...options, experiencesPositive: experiencesPositive ?? [] })

  const nights = planNightWalks(destData, plan)
  const dayVisitedNames = new Set()
  for (const day of plan.days) {
    for (const slotName of ['morning', 'afternoon']) {
      for (const unit of day.slots[slotName].units) {
        for (const place of unit.places) dayVisitedNames.add(place.name)
      }
    }
  }

  const day = await buildDayFromPlan({
    destData,
    dayPlan,
    mode: plan.mode,
    mapboxToken,
    city: destData.destination ?? options.city ?? '',
    nightChain: nights.get(dayNumber) ?? [],
    dayVisitedNames,
  })

  // Lo que el viajero eligió y no cupo viaja con el día, con su motivo. Mejor avisar que dejarlo
  // fuera en silencio: decide él si mueve algo de día, alarga el viaje o cambia de ritmo.
  day.not_included = plan.unplacedPool.map((item) => ({
    name: item.name,
    reason:
      item.reason === 'closed_every_day'
        ? `Cierra todos los días de tu viaje (${item.closedOn.join(', ')})`
        : item.reason === 'out_of_season'
          ? `Solo ${availabilityLabel(item.available)}`
          : 'No cabía en ningún día del viaje',
    suggestion: item.reason === 'closed_every_day' ? 'Cambia las fechas o quítalo de tu selección' : 'Alarga el viaje un día o elige el ritmo completo',
  }))

  return day
}

/**
 * Un día de ciudad del motor v3. El reparto y las horas ya están decididos (planTrip); aquí se le
 * añaden las nocturnas —calculadas con lo que de verdad se visita— y lo que no ha cabido.
 */
function buildCityDayV3(destData, trip, tripDay, options) {
  const nights = planNightWalks(destData, nightWalkPlan(trip))
  const dayVisitedNames = new Set(trip.days.flatMap((day) => (day.schedule?.visits ?? []).map((visit) => visit.place.name)))
  // ¿Vuelve el viaje a pasar por lo que enseña el Free Tour (de noche o de paso)? Cambia su texto.
  const covers = new Set(destData.default_free_tour?.covers ?? [])
  const tourRepeats =
    [...nights.values()].some((chain) => chain.some((entry) => (entry.conflicts_with ?? []).some((name) => covers.has(name)))) ||
    trip.days.some((day) => (day.schedule?.visits ?? []).some((visit) => visit.place.passBy && covers.has(visit.place.name)))
  const day = formatDayV3({
    destData,
    tripDay,
    city: destData.destination ?? options.city ?? '',
    nightChain: nights.get(tripDay.dayNumber) ?? [],
    dayVisitedNames,
    tourRepeats,
  })
  // Lo elegido a mano y los imprescindibles que no han cabido en ningún día, con su motivo. Nunca en
  // silencio: en un viaje de un día es el "No te dio tiempo".
  day.not_included = [
    ...(trip.unplacedPool ?? []).map((item) => ({
      name: item.name,
      reason:
        item.reason === 'closed_every_day'
          ? `Cierra todos los días de tu viaje (${item.closedOn.join(', ')})`
          : item.reason === 'out_of_season'
            ? `Solo ${availabilityLabel(item.available)}`
            : 'No cabía en ningún día del viaje',
      suggestion: item.reason === 'closed_every_day' || item.reason === 'out_of_season' ? 'Cambia las fechas o quítalo de tu selección' : 'Alarga el viaje un día o elige el ritmo completo',
    })),
    ...(trip.unplacedEssentials ?? []).map((item) => ({ name: item.name, reason: 'No cabía en ningún día del viaje', suggestion: 'Alarga el viaje un día' })),
    // Lo de una mañana o una tarde tipo que no llegó a su hora (ya no se madruga por lo que no es nivel 1).
    ...(trip.notEnoughTime ?? []).map((item) => ({ name: item.name, reason: 'No te dio tiempo', suggestion: 'Alarga el viaje medio día o elige el ritmo completo' })),
  ]
  // Mañanas y tardes tipo (Parte B): qué bloque lleva cada medio día; sin bloque, "medio día sin tipo".
  if (Array.isArray(tripDay.blocks)) {
    day.blocks = tripDay.blocks.map((block) => ({ id: block.id, slot: block.slot, label: block.label }))
    day.untyped_halves = tripDay.blocks.filter((block) => block.id == null).length
    day.reordered_blocks = tripDay.reorderedBlocks ?? []
  }
  // Traslados largos (más de 25 min andando), cada uno en su línea, andando primero y luego la alternativa
  // (decisión del 2026-09-26): "Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) ·
  // o el bus 115 si prefieres no subirla". Sin dato de transporte, "bus o taxi".
  const notices = (tripDay.longWalks ?? []).map(({ minutes, from, to, uphill, how }) => {
    const walk = `${from === 'la comida' ? 'Desde la comida' : from} → ${to}: ~${Math.round(minutes / 5) * 5} min andando`
    return uphill ? `${walk} (con cuesta) · o ${how ?? 'en bus o taxi'} si prefieres no subirla` : `${walk} · o en ${how ?? 'bus o taxi'}`
  })
  if (notices.length > 0) day.transfer_notice = notices.join('\n')
  // "Aperitivo y paseo por {barrio}" (ajustes B.7): 90 min o menos antes de cenar en un barrio de cena.
  const aperitivo = aperitivoFor(destData, trip, tripDay, options, dayVisitedNames)
  if (aperitivo) day.aperitivo = aperitivo
  const freeAfternoon = aperitivo ? null : freeAfternoonFor(destData, trip, tripDay, options, dayVisitedNames)
  if (freeAfternoon) day.free_afternoon = freeAfternoon
  const freeTime = midDayFreeFor(destData, trip, tripDay, options, dayVisitedNames)
  if (freeTime) day.free_time = freeTime
  return day
}

/**
 * Las experiencias elegidas que el viaje puede ofrecer (Estaciones, Parte 4). Su ventana vive en
 * `destination_config.experience_availability[id]` ({ from, to, aprox? } MM-DD). Con fechas, entra si
 * algún día del viaje entra (con `aprox`, también en el margen de 15 días); con solo el mes, como
 * seasonFit (availability.js). Sin ventana, siempre.
 */
export function experiencesInSeason(destData, experiencesPositive, { dateRangeStartIso = null, month = null, season = null, contentDays = 1 } = {}) {
  const windows = destData?.destination_config?.experience_availability ?? {}
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  return experiencesPositive.filter((id) => {
    const window = windows[id]
    if (!window) return true
    if (calendar.hasDates) return Array.from({ length: contentDays }, (_, i) => calendar.dateOfDay(i + 1)).some((date) => availableForTrip(window, calendar, date))
    return availableForTrip(window, calendar, null)
  })
}

/** Tiempo libre antes de cenar a partir del cual la tarde se dice "Tarde libre", con sugerencias. */
const FREE_AFTERNOON_MIN_MINUTES = 90
/** Sugerencias de la tarde libre: a esta distancia a pie, como mucho, de donde acaba el día. */
const FREE_AFTERNOON_MAX_WALK_MINUTES = 20
const FREE_AFTERNOON_SUGGESTIONS = 3
/** Desvío máximo de una sugerencia de tiempo libre respecto al camino hacia lo siguiente. */
const SUGGESTION_MAX_DETOUR_MINUTES = 15

/**
 * Tarde libre (decisión del 2026-09-24): cuando el destino ya no da para llenar la tarde, no es un
 * error: se dice, con 2-3 sugerencias de "También te puede interesar" cerca de donde acaba el día.
 * Pueden ser de pago —las añade el viajero si quiere—. Primero lo de sus experiencias; luego el nivel;
 * luego lo más cerca. Nunca algo ya visto en el viaje.
 */
function freeAfternoonFor(destData, trip, tripDay, options, dayVisitedNames) {
  const idle = tripDay.schedule?.idleBeforeDinner ?? 0
  const visits = tripDay.schedule?.visits ?? []
  const last = visits[visits.length - 1]
  if (idle < FREE_AFTERNOON_MIN_MINUTES || !last) return null
  const dinner = (tripDay.schedule?.meals ?? []).find((meal) => meal.type === 'dinner')
  return {
    minutes: idle,
    suggestions: nearbySuggestions(destData, trip, options, dayVisitedNames, last.place.end_coordinates ?? last.place.coordinates, {
      startMinutes: last.end,
      endMinutes: dinner ? dinner.start - (dinner.walkMinutes ?? 0) : null,
      to: dinner?.coordinates ?? null,
      hours: tripDay.hours ?? {},
    }),
  }
}

/** Desde aquí, el rato antes de cenar ya se dice (FreeTimeBlock del cliente, 45 min). */
const APERITIVO_MIN_MINUTES = 45

/**
 * "Aperitivo y paseo por {barrio}" (PROMPT_AJUSTES_BLOQUES B.7): el tiempo libre de 90 min o menos justo
 * antes de cenar, cuando se cena en un barrio con ambiente (un barrio de cena: 3+ restaurantes), se llama
 * así —no "Tarde libre (90 min)"— y lleva 2-3 sugerencias abiertas y de camino.
 */
function aperitivoFor(destData, trip, tripDay, options, dayVisitedNames) {
  const idle = tripDay.schedule?.idleBeforeDinner ?? 0
  const visits = tripDay.schedule?.visits ?? []
  const last = visits[visits.length - 1]
  if (!last || idle < APERITIVO_MIN_MINUTES || idle > FREE_AFTERNOON_MIN_MINUTES) return null
  const zone = dinnerZones(destData).find((option) => option.id === tripDay.dinnerZone)
  if (!zone) return null
  const barrio = String(zone.label).replace(/\s*\/\s*/g, ' y ')
  const dinner = (tripDay.schedule?.meals ?? []).find((meal) => meal.type === 'dinner')
  return {
    title: `Aperitivo y paseo por ${barrio}`,
    barrio,
    minutes: idle,
    suggestions: nearbySuggestions(destData, trip, options, dayVisitedNames, last.place.end_coordinates ?? last.place.coordinates, {
      startMinutes: last.end,
      endMinutes: dinner ? dinner.start - (dinner.walkMinutes ?? 0) : null,
      to: dinner?.coordinates ?? null,
      hours: tripDay.hours ?? {},
    }),
  }
}

/**
 * Tiempo libre a mitad de día (decisión del 2026-09-25): si después de meter lo gratis de camino
 * (planTrip) siguen quedando 60 min o más de espera antes de una parada (el Janículo al atardecer),
 * se dice, con 2-3 sugerencias cerca como la tarde libre —pueden ser de pago: el Castillo por dentro—.
 * La comida no es un hueco.
 */
function midDayFreeFor(destData, trip, tripDay, options, dayVisitedNames) {
  const visits = tripDay.schedule?.visits ?? []
  const meals = tripDay.schedule?.meals ?? []
  let worst = null
  for (let i = 1; i < visits.length; i++) {
    if (visits[i].place.passBy) continue
    if (meals.some((meal) => meal.start >= visits[i - 1].end && meal.start < visits[i].start)) continue
    const gap = visits[i].start - visits[i - 1].end - (visits[i].walkMinutes ?? 0)
    if (gap >= MID_DAY_GAP_MINUTES && (!worst || gap > worst.gap)) worst = { gap, index: i }
  }
  if (!worst) return null
  const previous = visits[worst.index - 1]
  // Entre las sugerencias, nada de lo que ya va hoy más tarde.
  const suggestions = nearbySuggestions(destData, trip, options, dayVisitedNames, previous.place.end_coordinates ?? previous.place.coordinates, {
    startMinutes: previous.end,
    endMinutes: visits[worst.index].start - (visits[worst.index].walkMinutes ?? 0),
    to: visits[worst.index].place.coordinates,
    hours: tripDay.hours ?? {},
  })
  return {
    minutes: worst.gap,
    after: previous.place.name,
    before: visits[worst.index].place.name,
    suggestions,
    // Sin nada que proponer (la espera al atardecer del Pincio, con todo visto): una idea corta de la
    // zona, sin más paradas (decisión del 2026-09-26).
    ...(suggestions.length === 0 ? { hint: zoneHintFor(destData, visits[worst.index].place.zone ?? previous.place.zone) } : {}),
  }
}

/** "Pasear por Villa Borghese: el pulmón verde de Roma." — el paseo de la zona, en una frase. */
function zoneHintFor(destData, zone) {
  const walk = (destData.zone_walks ?? []).find((entry) => entry.zone === zone)
  if (!walk) return null
  const sentence = String(walk.description ?? '').split(/(?<=\.)\s/)[0] ?? ''
  return sentence ? `${walk.name}: ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}` : walk.name
}

/**
 * 2-3 sitios sin ver cerca de `from` (tarde libre y tiempo libre): primero los de sus experiencias.
 * Solo lo que está ABIERTO en ese rato (se llega, se visita entero y se sale a tiempo; no cierra ese
 * día) y DE CAMINO hacia lo siguiente (`to`: la siguiente parada o la cena), con 15 min de desvío como
 * mucho (revisión del 2026-09-25: se proponía la Villa Farnesina, que cierra a las 14:00, a las 17:00).
 */
function nearbySuggestions(destData, trip, options, dayVisitedNames, from, { startMinutes = null, endMinutes = null, to = null, hours = {} } = {}) {
  const travel = travelTimesFor(findPipelineV2Key(destData.destination ?? options.city ?? ''))
  // Lo que enseña el Free Tour por fuera ya está visto (lo de interior de pago, como el Panteón, no).
  const tour = destData.default_free_tour
  const hasTour = trip.days.some((d) => (d.schedule?.visits ?? []).some((visit) => visit.place.isFreeTour))
  const tourSeen = hasTour
    ? (tour?.covers ?? []).filter((name) => {
        const place = (destData.places ?? []).find((candidate) => candidate.name === name)
        return place && (place.is_free_access ?? place.type === 'exterior')
      })
    : []
  // Lo que se ve desde un paso por fuera (el Arco, desde el Coliseo) también está visto.
  const passBySeen = trip.days.flatMap((d) => (d.schedule?.visits ?? []).flatMap((visit) => visit.place.passBy?.includes ?? []))
  const seen = new Set([...dayVisitedNames, ...(trip.coveredByFreeTour ?? []).flatMap((item) => item.names), ...tourSeen, ...passBySeen])
  const chosenTags = new Set((options.experiencesPositive ?? []).flatMap((theme) => (theme in TAG_INTEREST_MAP && theme !== 'free_tour' ? TAG_INTEREST_MAP[theme] : [])))
  const suggestions = (destData.places ?? [])
    .filter((place) => !seen.has(place.name) && Array.isArray(place.coordinates))
    .map((place) => ({ place, walk: travel.leg(from, place.coordinates)?.minutes ?? Infinity, ofExperience: (place.tags ?? []).some((tag) => chosenTags.has(tag)) }))
    .filter((item) => item.walk <= FREE_AFTERNOON_MAX_WALK_MINUTES)
    // De camino: el rodeo para pasar por allí hacia lo siguiente, 15 min como mucho.
    .filter((item) => !to || item.walk + (travel.leg(item.place.coordinates, to)?.minutes ?? Infinity) - (travel.leg(from, to)?.minutes ?? 0) <= SUGGESTION_MAX_DETOUR_MINUTES)
    // Abierto: se llega, cabe la visita entera y da tiempo a seguir.
    .filter((item) => {
      if (startMinutes == null) return true
      if (closedOnDay(item.place, hours.weekday ?? null, hours.weekday ? hours.dateIso ?? null : null)) return false
      const duration = item.place.duration_minutes ?? 30
      const at = earliestVisitStart(effectiveSchedule(item.place, hours), startMinutes + item.walk, duration)
      if (at === null) return false
      const lastEntry = lastEntryMinutes(item.place, at, hours)
      if (lastEntry !== null && at > lastEntry) return false
      const onward = to ? travel.leg(item.place.coordinates, to)?.minutes ?? 0 : 0
      return endMinutes == null || at + duration + onward <= endMinutes
    })
    .sort((a, b) => Number(b.ofExperience) - Number(a.ofExperience) || (a.place.level ?? 9) - (b.place.level ?? 9) || a.walk - b.walk || a.place.name.localeCompare(b.place.name, 'es'))
    .slice(0, FREE_AFTERNOON_SUGGESTIONS)
    .map(({ place, walk }) => ({ name: place.name, walk_minutes: Math.round(walk), requires_ticket: !(place.is_free_access ?? place.type === 'exterior') }))
  return suggestions
}
