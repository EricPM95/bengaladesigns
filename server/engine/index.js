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
import { dateNoticesFor } from './dateNotices.js'
import { seasonNoteFor } from './seasonNote.js'
import { MID_DAY_GAP_MINUTES, planTrip } from '../../shared/routeEngine/planTrip.js'
import { planShortTrip, shortTripSlots } from '../../shared/routeEngine/shortTrip.js'
import { planBlockTrip } from '../../shared/routeEngine/blockTrip.js'
import { planCuratedTrip } from '../../shared/routeEngine/curatedTrip.js'
import { planWrittenTrip, poolStatusFor } from '../../shared/routeEngine/writtenTrip.js'
import { writtenDaysFor } from './writtenDays.js'
import { dinnerZones } from '../../shared/routeEngine/dinnerZones.js'
import { findPipelineV2Key } from '../routeAlgorithm.js'
import { TAG_INTEREST_MAP } from '../../shared/routeEngine/experienceTags.js'
import { availabilityLabel, availableForTrip, seasonFit } from '../../shared/routeEngine/availability.js'
import { tripCalendar } from '../../shared/routeEngine/tripCalendar.js'
import { closedOnDay, earliestVisitStart, effectiveSchedule, lastEntryMinutes, parseClosingMinutes } from '../../shared/routeEngine/openingHours.js'
import { joinSpanish, placeWithArticle } from '../../shared/routeEngine/whyTexts.js'
import { MODES_V3, isTranquiloPace } from '../../shared/routeEngine/modes.js'

/**
 * Qué motor sirve esta petición. El cuerpo manda sobre la variable de entorno, y en ausencia de
 * ambos manda el nuevo.
 *
 * El defecto se cambió después de comprobar que la salida del motor nuevo es un SUPERCONJUNTO de la
 * del viejo: mismo formato, ningún campo menos, dos de más (`dinner_zone`, `is_revisit`). Volver
 * atrás no necesita un despliegue, solo `ROUTE_ENGINE=viejo`.
 */
/**
 * Qué planificador usa el motor v3 en un destino con días curados (DIAS_CURADOS_ROMA.md, 2026-09-26): 'dias'
 * (por defecto) o 'bloques' (mañanas y tardes sueltas, el de antes). `ROUTE_V3_PLANNER=bloques` en .env.local o
 * `planner: 'bloques'` en las opciones de una petición vuelven al de bloques sin desplegar.
 */
export function plannerFor(requestPlanner) {
  const choice = (requestPlanner ?? process.env.ROUTE_V3_PLANNER ?? '').toString().trim().toLowerCase()
  return choice === 'bloques' || choice === 'blocks' ? 'bloques' : 'dias'
}

/**
 * Motor v4, días escritos (PROMPT_ROMA_COMPLETA, 2026-09-29): `ROUTE_ENGINE=v4` en el entorno o `engine: 'v4'` en las
 * opciones de una petición; `engine: 'v3'` fuerza el de días curados. Con `WRITTEN_DAYS_DEFAULT` a true, v4 es el
 * de por defecto en los destinos con días escritos. Si el viaje necesita un día que no está escrito, v3.
 */
export const WRITTEN_DAYS_DEFAULT = true
export function useWrittenDays(requestEngine) {
  const choice = (requestEngine ?? process.env.ROUTE_ENGINE ?? '').toString().trim().toLowerCase()
  if (choice === 'v4') return true
  if (choice === 'v3' || choice === 'viejo') return false
  return WRITTEN_DAYS_DEFAULT
}

/** El plan v4 de un viaje, una vez aunque se pidan sus días por separado (los últimos 64 viajes). */
const writtenPlanCache = new Map()
function writtenPlanFor(written, destKey, args) {
  const { destData, ...rest } = args
  const key = JSON.stringify([destKey, rest])
  if (writtenPlanCache.has(key)) return writtenPlanCache.get(key)
  const plan = planWrittenTrip({ ...args, written, travel: travelTimesFor(destKey) })
  writtenPlanCache.set(key, plan)
  if (writtenPlanCache.size > 64) writtenPlanCache.delete(writtenPlanCache.keys().next().value)
  return plan
}
/** El pool de un viaje con días escritos: qué va ya incluido y cuántos extras caben (null sin días escritos). */
export function writtenPoolStatus(destData, city, { days, hasFreeTour = false, dateRangeStartIso = null, pace = 'nonstop' }) {
  const destKey = findPipelineV2Key(destData.destination ?? city ?? '')
  const written = writtenDaysFor(destKey)
  if (!written) return null
  return poolStatusFor({ destData, written, totalDays: days + 1, pace, hasFreeTour, experiencesPositive: hasFreeTour ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso, travel: travelTimesFor(destKey) })
}

/** Para las pruebas, después de cambiar los días escritos. */
export function clearWrittenPlanCache() {
  writtenPlanCache.clear()
}

export function engineFor(requestEngine, destData = null) {
  const requested = (requestEngine ?? '').toString().trim().toLowerCase()
  const fromEnv = (process.env.ROUTE_ENGINE ?? '').toString().trim().toLowerCase()
  const choice = requested || fromEnv
  if (choice === 'viejo' || choice === 'v2' || choice === 'old') return 'viejo'
  // Un destino con días curados (Roma, DIAS_CURADOS_ROMA.md) va con el motor v3 y sus días curados por defecto, también
  // en producción (decisión del 2026-09-26, revisión v4 cerrada). Solo lo cambian una petición que pida otro motor o
  // `ROUTE_ENGINE=viejo` (vuelta atrás); `ROUTE_V3_PLANNER=bloques` vuelve a las mañanas y tardes dentro del v3.
  if (!requested && Array.isArray(destData?.curated_days) && destData.curated_days.length > 0) return 'v3'
  // Motor v3 en construcción (repartidor que pregunta al programador + programador con reloj
  // real, ver shared/routeEngine/). Solo bajo petición: el defecto sigue siendo 'nuevo' hasta que
  // las métricas digan que gana.
  if (choice === 'v3' || choice === 'v4') return 'v3' // (v4 = días escritos, que corren dentro del v3)
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
    const day = buildCityDayV3(destData, trip, tripDay, { ...options, pace })
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
    // "Quiero entrar": lo que el viajero ha pedido ver por dentro (PROMPT_PENDIENTE F).
    insideNames: options.insideNames ?? [],
  }
  // Mañanas y tardes tipo (Parte B): con bloques curados en el destino, el viaje se monta con ellos.
  const curated = isV3 && Array.isArray(destData.curated_days) && destData.curated_days.length > 0 && plannerFor(options.planner) === 'dias'
  const planner = curated ? planCuratedTrip : isV3 && Array.isArray(destData.morning_flows) && destData.morning_flows.length > 0 ? planBlockTrip : planTrip
  const destKey = findPipelineV2Key(destData.destination ?? options.city ?? '')
  const written = curated && useWrittenDays(options.engine) ? writtenDaysFor(destKey) : null
  const writtenPlan = written ? writtenPlanFor(written, destKey, { ...tripArgs, month: options.month ?? null, season: options.season ?? null, forceOrder: options.forceOrder ?? null }) : null
  const plan = writtenPlan ?? (isV3 ? planner({ ...tripArgs, month: options.month ?? null, season: options.season ?? null, travel: travelTimesFor(destKey) }) : preplanTrip(tripArgs))

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

  if (isV3) return buildCityDayV3(destData, plan, dayPlan, { ...options, pace, experiencesPositive: experiencesPositive ?? [], poolNames: mustIncludePlaces ?? [] })

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
          : item.reason === 'pool_afternoon_taken'
            ? `En 2 días solo hay una tarde para tus lugares elegidos, y es para ${item.takenBy}`
            : 'No cabía en ningún día del viaje',
    suggestion: item.reason === 'closed_every_day' ? 'Cambia las fechas o quítalo de tu selección' : 'Alarga el viaje un día o elige el ritmo completo',
  }))

  return day
}

/**
 * Un día de ciudad del motor v3. El reparto y las horas ya están decididos (planTrip); aquí se le
 * añaden las nocturnas —calculadas con lo que de verdad se visita— y lo que no ha cabido.
 */
const MESES_TEXTO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
/** "Cierra el 25 de diciembre" (festivo o fecha) o "Cierra los lunes". */
function closedText({ dateIso, weekday }) {
  if (dateIso) return `Cierra el ${Number(dateIso.slice(8, 10))} de ${MESES_TEXTO[Number(dateIso.slice(5, 7)) - 1]}`
  return weekday ? `Cierra los ${weekday}${/s$/.test(weekday) ? '' : 's'}` : 'Ese día cierra'
}

/**
 * ¿Pasa la ruta por ahí ese día? (lo visitado, lo visto de paso o por fuera, lo nocturno, el barrio donde se cena o un
 * lugar de su mismo grupo: la Piazza del Popolo con su iglesia). Entonces no "quedó fuera".
 */
function passesThrough(destData, trip, item, nights) {
  const day = (trip.days ?? []).find((candidate) => candidate.dayNumber === item.dayNumber)
  if (!day) return false
  const place = (destData.places ?? []).find((candidate) => candidate.name === item.name)
  const names = new Set((day.schedule?.visits ?? []).flatMap((visit) => [visit.place.name, ...(visit.place.outsideOf ?? [])]))
  if (names.has(item.name)) return true
  if ((nights.get(day.dayNumber) ?? []).some((entry) => (entry.conflicts_with ?? []).includes(item.name))) return true
  if (place && (place.tags ?? []).includes('barrio') && place.zone && (day.dinnerZone === place.zone || day.dinnerPlaceZone === place.zone)) return true
  if (place?.group && [...names].some((name) => (destData.places ?? []).find((candidate) => candidate.name === name)?.group === place.group)) return true
  return false
}

function buildCityDayV3(destData, trip, tripDay, options) {
  // Con días curados, el paseo nocturno lo trae cada día (night_walks); si no, el reparto de siempre.
  const nights = trip.nightsByDay ?? planNightWalks(destData, nightWalkPlan(trip))
  // Viaje de 1-2 días (decisión del 2026-09-26): la visita de día a partir de las 17:00 o del atardecer de un
  // lugar que esa noche tiene su nocturna se quita; se queda solo la nocturna.
  // Salvo la visita por la que se madruga: esa es el motivo del día y se queda (su nocturna también).
  const wokeFor = new Set(tripDay.schedule?.modeFallback?.recoveredNames ?? [])
  const replaced = new Set((nights.get(tripDay.dayNumber) ?? []).filter((entry) => entry.replacesDayVisit).flatMap((entry) => entry.conflicts_with ?? []).filter((name) => !wokeFor.has(name)))
  if (replaced.size > 0) tripDay = withoutDayVisits(destData, tripDay, replaced, options)
  // Lo que se ve de día en el viaje (sin la visita que ha dejado paso a su nocturna).
  const dayVisitedNames = new Set(trip.days.flatMap((day) => (day.dayNumber === tripDay.dayNumber ? tripDay : day).schedule?.visits ?? []).map((visit) => visit.place.name))
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
      // Lo marcado en el pool: se avisa en el día donde iba (`day_number`), nunca en silencio.
      from_pool: true,
      day_number: item.dayNumber ?? null,
      reason:
        item.reason === 'closed_every_day'
          ? `Cierra todos los días de tu viaje (${item.closedOn.join(', ')})`
          : item.reason === 'closed_on_day'
            ? 'Ese día está cerrado'
          : item.reason === 'no_room_day'
            ? 'No cabía en ese día sin quitar ningún imprescindible'
          : item.reason === 'out_of_season'
            ? `Solo ${availabilityLabel(item.available)}`
            : item.reason === 'pool_afternoon_taken'
              ? `En 2 días solo hay una tarde para tus lugares elegidos, y es para ${item.takenBy}`
              : item.reason === 'pool_limit'
                ? 'Ya has elegido todos los lugares extra que caben en este viaje'
                : 'No cabía en ningún día del viaje',
      suggestion: item.reason === 'closed_every_day' || item.reason === 'out_of_season' ? 'Cambia las fechas o quítalo de tu selección' : 'Alarga el viaje un día o elige el ritmo completo',
    })),
    // Lo que se queda solo con su nocturna no "falta": sale de noche.
    ...(trip.unplacedEssentials ?? []).filter((item) => ![...nights.values()].flat().some((entry) => (entry.conflicts_with ?? []).includes(item.name))).map((item) => (item.reason === 'closed_every_day' ? { name: item.name, reason: 'Cierra todos los días de tu viaje', suggestion: 'Cambia las fechas si quieres verlo por dentro' } : { name: item.name, reason: 'No cabía en ningún día del viaje', suggestion: 'Alarga el viaje un día' })),
    // Lo de una mañana o una tarde tipo que no llegó a su hora (ya no se madruga por lo que no es nivel 1).
    // (Si era del pool, se avisa como lo del pool: nunca desaparece en silencio.)
    // (Decisión del usuario, 2026-09-28: lo que la ruta pasa ese día no "quedó fuera"; y si fue un cierre, el motivo es el cierre.)
    ...(trip.notEnoughTime ?? []).filter((item) => !passesThrough(destData, trip, item, nights)).map((item) => ({ name: item.name, reason: item.closed ? closedText(item.closed) : 'No te dio tiempo', suggestion: item.closed ? 'Cambia las fechas si quieres verlo por dentro' : 'Alarga el viaje medio día o elige el ritmo completo', day_number: item.dayNumber ?? null, ...((options.poolNames ?? []).includes(item.name) ? { from_pool: true } : {}) })),
  ]
  // El paseo nocturno curado: nombre propio y su texto (en la primera nocturna del día).
  if (tripDay.nightWalk && day.stops.some((stop) => stop.is_night_experience && (tripDay.nightWalk.recorrido ?? []).includes(stop.name))) {
    day.night_walk = { name: tripDay.nightWalk.nombre, text: tripDay.nightWalk.texto ?? null }
    const first = day.stops.find((stop) => stop.is_night_experience)
    // (Después de cenar, su texto de después de cenar si lo trae: "Del Pincio se baja…" no vale a las 21:30.)
    // (Antes de cenar, su texto de antes de cenar si lo trae: "un paseo precioso antes de ir a cenar".)
    const walkWhy = first.before_dinner ? tripDay.nightWalk.textoAntesCenar ?? tripDay.nightWalk.texto : tripDay.nightWalk.textoDespuesCenar ?? tripDay.nightWalk.texto
    if (walkWhy && !first.date_text) first.why = walkWhy
    // El nombre del paseo va en todas sus paradas nocturnas: la tarjeta lo enseña siempre.
    for (const stop of day.stops) if (stop.is_night_experience) stop.night_walk_name = tripDay.nightWalk.nombre
  }
  // El día curado y las variantes que se le han aplicado (para la revisión y la ficha).
  if (tripDay.curatedDay) day.curated_day = { id: tripDay.curatedDay.id, name: tripDay.curatedDay.nombre, variants: tripDay.curatedDay.variantes }
  // El título no promete un atardecer que ese día no hay (el Janículo llega ya de noche): "… y Trastevere", sin "al atardecer".
  if (day.curated_day?.name && / al atardecer$/.test(day.curated_day.name) && !(day.stops ?? []).some((stop) => stop.sunset_minutes != null)) day.curated_day.name = day.curated_day.name.replace(/ al atardecer$/, '')
  // Mañanas y tardes tipo (Parte B): qué bloque lleva cada medio día; sin bloque, "medio día sin tipo".
  if (Array.isArray(tripDay.blocks)) {
    day.blocks = tripDay.blocks.map((block) => ({ id: block.id, slot: block.slot, label: block.label }))
    day.untyped_halves = tripDay.blocks.filter((block) => block.id == null).length
    day.reordered_blocks = tripDay.reorderedBlocks ?? []
  }
  // Traslados largos (más de 25 min andando), cada uno en su línea, andando primero y luego la alternativa
  // (decisión del 2026-09-26): "Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) ·
  // o el bus 115 si prefieres no subirla". Sin dato de transporte, "bus o taxi".
  const notices = (tripDay.longWalks ?? []).map(({ minutes, from, to, uphill, how, taxiOnly }) => {
    const walk = `${from === 'la comida' ? 'Desde la comida' : from} → ${to}: ~${Math.round(minutes / 5) * 5} min andando`
    // (Festivo con el transporte recortado a esa hora: solo andando o en taxi.)
    if (taxiOnly) return uphill ? `${walk} (con cuesta) · o en taxi si prefieres no subirla` : `${walk} · o en taxi`
    return uphill ? `${walk} (con cuesta) · o ${how ?? 'en bus o taxi'} si prefieres no subirla` : `${walk} · o en ${how ?? 'bus o taxi'}`
  })
  if (notices.length > 0) day.transfer_notice = notices.join('\n')
  // "Aperitivo y paseo por {barrio}" (ajustes B.7): 90 min o menos antes de cenar en un barrio de cena.
  // El paseo nocturno que va antes de cenar (en invierno) ocupa ese rato: no es tiempo libre (DIAS_CURADOS_ROMA.md, 2b).
  // Invierno (el sol antes de las 18:00) con más de 2 h antes de cenar: lo que sobra se queda en el paseo nocturno
    // de antes de cenar (la bajada por la escalinata en D4), de 15 en 15 y como mucho 45 min más; nunca un relleno
    // (PROMPT_RUTAS_CURADAS C.1, decisión del 2026-09-27).
    const nightStops = (day.stops ?? []).filter((stop) => stop.is_night_experience && stop.before_dinner)
    if ((tripDay.hours?.sunset ?? Infinity) < WINTER_EVENING_SUNSET_BEFORE && nightStops.length > 0) {
      const busy = nightStops.reduce((sum, stop) => sum + (stop.duration_minutes ?? 0), 0)
      // (Repaso 3, 2026-09-28: el rato de luces y aperitivo de después llega hasta 90 min; lo que pase, en la nocturna.)
      const over = (tripDay.schedule?.idleBeforeDinner ?? 0) - busy - WINTER_FREE_MAX_MINUTES
      if (over > 0) nightStops.at(-1).duration_minutes += Math.min(WINTER_NIGHT_STRETCH_MAX, Math.ceil(over / 15) * 15)
    }
  // Una nocturna antes de cenar dura 20-25 min (decisión del usuario, 2026-09-28: la Plaza de España de 60 min era
  // demasiado); lo que sobra es tiempo libre, no nocturna.
  for (const stop of day.stops ?? []) if (stop.is_night_experience && stop.before_dinner) stop.duration_minutes = Math.min(stop.duration_minutes ?? NIGHT_BEFORE_DINNER_MAX, NIGHT_BEFORE_DINNER_MAX)
  const nightBeforeDinner = (day.stops ?? []).filter((stop) => stop.is_night_experience && stop.before_dinner).reduce((sum, stop) => sum + (stop.duration_minutes ?? 0), 0)
  const aperitivo = aperitivoFor(destData, trip, tripDay, options, dayVisitedNames, nightBeforeDinner)
  if (aperitivo) day.aperitivo = aperitivo
  const freeAfternoon = aperitivo ? null : freeAfternoonFor(destData, trip, tripDay, options, dayVisitedNames, nightBeforeDinner)
  if (freeAfternoon) day.free_afternoon = freeAfternoon
  // En invierno, la "Tarde libre" de antes de cenar también lleva nombre y contenido (decisión del usuario, 2026-09-28).
  if (day.free_afternoon && (tripDay.hours?.sunset ?? Infinity) < WINTER_EVENING_SUNSET_BEFORE) {
    const zone = dinnerZones(destData).find((option) => option.id === tripDay.dinnerZone)
    const title = zone ? winterEveningTitle(destData, zone.id, tripDay, dayVisitedNames) : null
    // Sale como el rato con nombre de siempre (el bloque de aperitivo), no como "Tarde libre".
    if (title) {
      day.aperitivo = { title, barrio: String(zone.label).replace(/\s*\/\s*/g, ' y '), minutes: day.free_afternoon.minutes, winter: true, suggestions: day.free_afternoon.suggestions ?? [] }
      delete day.free_afternoon
    }
  }
  // El tiempo libre de antes de cenar acaba cuando hay que salir hacia la cena (decisión del usuario, 2026-09-28): con
  // las horas que ve el viajero (ya redondeadas), desde que acaba lo último del día hasta la cena menos el paseo.
  const dinnerMeal = (tripDay.schedule?.meals ?? []).find((meal) => meal.type === 'dinner')
  if (dinnerMeal) {
    const toMinutes = (hhmm) => {
      const [h, m] = String(hhmm ?? '').split(':').map(Number)
      return Number.isFinite(h) ? h * 60 + (m || 0) : null
    }
    const dinnerStart = Math.ceil(dinnerMeal.start / 15) * 15
    // Con la nocturna antes de cenar, el rato de luces y aperitivo va detrás de ella, hasta la cena (repaso 3).
    const lastEnd = Math.max(0, ...(day.stops ?? []).map((stop) => ({ start: toMinutes(stop.suggested_time), duration: stop.duration_minutes ?? 0 })).filter(({ start }) => start != null && start < dinnerStart).map(({ start, duration }) => start + duration))
    const room = dinnerStart - (dinnerMeal.walkMinutes ?? 0) - lastEnd
    // El hueco real de después de la nocturna (el Janículo que sube antes de cenar): también con nombre.
    if (!day.aperitivo && !day.free_afternoon && room >= APERITIVO_MIN_MINUTES && (day.stops ?? []).some((stop) => stop.is_night_experience && stop.before_dinner)) {
      const late = aperitivoFor(destData, trip, tripDay, options, dayVisitedNames, 0, room)
      if (late) day.aperitivo = late
    }
    for (const key of ['aperitivo', 'free_afternoon']) {
      if (!day[key]) continue
      if (room < APERITIVO_MIN_MINUTES) delete day[key]
      else day[key].minutes = Math.min(day[key].minutes, room)
    }
    // Nunca dos bloques seguidos del mismo barrio antes de cenar (decisión del usuario, 2026-09-29): «Trastevere» +
    // «Trastevere de noche» + «Paseo por Trastevere iluminado y aperitivo» se juntan en uno, «Trastevere al anochecer y
    // aperitivo», de 90 min como mucho, y la nocturna de ese barrio pasa a después de cenar.
    const stops = day.stops ?? []
    const dayStops = stops.filter((stop) => !stop.is_night_experience && toMinutes(stop.suggested_time) != null && toMinutes(stop.suggested_time) < dinnerStart)
    const lastStop = dayStops.at(-1)
    const lastPlace = lastStop ? (destData.places ?? []).find((place) => place.name === (lastStop.place_name ?? lastStop.name)) : null
    const lastIsBarrio = Boolean(lastPlace && (lastPlace.tags ?? []).includes('barrio') && day.aperitivo && norm(day.aperitivo.title).includes(norm(lastPlace.name)))
    // (El barrio: el de la última parada o el de una nocturna de antes de cenar, si el aperitivo es del mismo.)
    const nightBarrio = stops.filter((stop) => stop.is_night_experience && stop.before_dinner).map((stop) => String(stop.name ?? '').replace(/\s+de noche$/i, '')).find((name) => day.aperitivo && norm(day.aperitivo.title).includes(norm(name)))
    const barrioName = lastIsBarrio ? lastPlace.name : nightBarrio ?? null
    if (barrioName && day.aperitivo) {
      const sameNight = stops.filter((stop) => stop.is_night_experience && stop.before_dinner && norm(stop.name ?? '').startsWith(norm(barrioName)))
      const merged = (lastIsBarrio ? lastStop.duration_minutes ?? 0 : 0) + sameNight.reduce((sum, stop) => sum + (stop.duration_minutes ?? 0), 0) + day.aperitivo.minutes
      if (lastIsBarrio) day.stops = stops.filter((stop) => stop !== lastStop)
      for (const stop of sameNight) {
        stop.before_dinner = false
        stop.after_dinner = true
      }
      day.aperitivo = { ...day.aperitivo, title: `${barrioName} al anochecer y aperitivo`, minutes: merged }
    }
    // La «Tarde libre» de justo antes de cenar es el aperitivo, con su nombre (PROMPT_ROMA_V4_REPASO 8: 135 min de tarde
    // libre en el D5C de invierno en tranquilo); así también se adelanta la cena si sobra.
    if (!day.aperitivo && day.free_afternoon) {
      const named = aperitivoFor(destData, trip, tripDay, options, dayVisitedNames, 0, Math.min(WINTER_FREE_MAX_MINUTES, day.free_afternoon.minutes))
      if (named) {
        day.aperitivo = named
        delete day.free_afternoon
      }
    }
    // El aperitivo, 90 min como mucho, siempre (decisión del usuario, 2026-09-29): si el rato hasta la cena es más largo,
    // la cena se adelanta (nunca antes de las 19:30, ni de las 20:30 en verano) y lo de después de cenar con ella.
    if (day.aperitivo) {
      const before = (day.stops ?? []).filter((stop) => toMinutes(stop.suggested_time) != null && toMinutes(stop.suggested_time) < dinnerStart && !stop.after_dinner)
      const lastEnd2 = Math.max(0, ...before.map((stop) => toMinutes(stop.suggested_time) + (stop.duration_minutes ?? 0)))
      const walk = dinnerMeal.walkMinutes ?? 0
      const room2 = dinnerStart - walk - lastEnd2
      const floor = tripDay.written?.version === 'D' ? 20 * 60 + 30 : 19 * 60 + 30
      let newDinner = dinnerStart
      if (room2 > WINTER_FREE_MAX_MINUTES) newDinner = Math.min(dinnerStart, Math.max(floor, Math.ceil((lastEnd2 + WINTER_FREE_MAX_MINUTES + walk) / 5) * 5))
      day.aperitivo.minutes = Math.max(0, Math.min(WINTER_FREE_MAX_MINUTES, newDinner - walk - lastEnd2))
      const shift = dinnerStart - newDinner
      const dinnerOut = (day.meals ?? []).find((meal) => meal.time === 'dinner')
      if (shift > 0 && dinnerOut) {
        dinnerOut.suggested_time = toHHMM(newDinner)
        for (const stop of day.stops ?? []) if (toMinutes(stop.suggested_time) != null && toMinutes(stop.suggested_time) >= dinnerStart) stop.suggested_time = toHHMM(toMinutes(stop.suggested_time) - shift)
      }
      // (La nocturna del barrio que ha pasado a después de cenar, al acabar la cena.)
      for (const stop of day.stops ?? []) if (stop.after_dinner && toMinutes(stop.suggested_time) < newDinner + DINNER_BLOCK_MINUTES) stop.suggested_time = toHHMM(newDinner + DINNER_BLOCK_MINUTES)
      day.stops?.sort((a, b) => (toMinutes(a.suggested_time) ?? 0) - (toMinutes(b.suggested_time) ?? 0))
    }
  }
  const freeTime = midDayFreeFor(destData, trip, tripDay, options, dayVisitedNames)
  if (freeTime) day.free_time = freeTime
  // Todos los huecos de más de 30 min, con nombre (el cliente los pinta en su sitio; `free_time` queda para
  // las versiones de antes).
  const freeTimes = freeTimesFor(destData, trip, tripDay, options, dayVisitedNames)
  if (freeTimes.length > 0) day.free_times = freeTimes
  // Todos los ratos con nombre (aperitivo, tarde libre, tiempo libre), de 5 en 5 como el resto de lo que se ve
  // (PROMPT_ROMA_V4_REPASO 11: salían aperitivos de 43, 53 o 57 min). Hacia abajo, para no pisar lo siguiente.
  const step5 = (minutes) => Math.max(5, Math.floor(minutes / 5) * 5)
  for (const key of ['aperitivo', 'free_afternoon', 'free_time']) if (day[key]?.minutes != null) day[key].minutes = step5(day[key].minutes)
  for (const entry of day.free_times ?? []) entry.minutes = step5(entry.minutes)
  // El banner de contexto va una vez, con el primer día de ciudad (el cliente lo pinta encima del Día 1).
  const firstCityDay = trip.days.find((candidate) => candidate.schedule)?.dayNumber
  if (tripDay.dayNumber === firstCityDay) day.context_banner = contextBannerFor(destData, trip, options)
  // Los avisos de fechas especiales (PROMPT_AVISO_FECHAS), una vez por viaje y con el primer día de ciudad: la app
  // los enseña en una ventana al entrar en la ruta y deja una etiqueta en cada día afectado.
  if (tripDay.dayNumber === firstCityDay) day.date_notices = dateNoticesFor(destData, trip, options)
  // La nota de temporada (decisión del usuario, 2026-09-28), una vez y con el primer día de ciudad. Si sale, el banner
  // de invierno no (diría lo mismo).
  if (tripDay.dayNumber === firstCityDay) {
    const note = seasonNoteFor(destData, trip, { hasNight: [...nights.values()].some((list) => list.length > 0), dateNotices: day.date_notices })
    if (note) {
      day.season_note = note
      const month = Number.isInteger(trip.calendar?.month) ? trip.calendar.month + 1 : null
      if (month !== null && (destData.destination_config?.context_banners?.meses_invierno ?? []).includes(month)) day.context_banner = null
    }
  }
  return day
}

/**
 * El día sin esas visitas de día (las de última hora que deja su nocturna): lo que queda antes de cenar se
 * recalcula desde la nueva última parada, andando hasta la cena.
 */
function withoutDayVisits(destData, tripDay, names, options) {
  const schedule = tripDay.schedule
  const kept = schedule.visits.filter((visit) => !names.has(visit.place.name))
  if (kept.length === schedule.visits.length || kept.length === 0) return tripDay
  const dinner = schedule.meals.find((meal) => meal.type === 'dinner')
  const lunch = schedule.meals.find((meal) => meal.type === 'lunch')
  const travel = travelTimesFor(findPipelineV2Key(destData.destination ?? options.city ?? ''))
  // Lo que venía detrás de lo quitado se adelanta (andando desde lo anterior, en tramos de 5 min y sin
  // entrar antes de que abra): el rato que sobra se queda antes de cenar, no en medio de la tarde.
  const firstRemoved = schedule.visits.findIndex((visit) => names.has(visit.place.name))
  const visits = []
  for (const visit of kept) {
    const previous = visits.at(-1)
    const index = schedule.visits.indexOf(visit)
    if (!previous || index < firstRemoved || visit.place.sunset != null || visit.place.fixed_start || (lunch && lunch.start >= previous.end && lunch.start < visit.start)) {
      visits.push(visit)
      continue
    }
    const walk = travel.leg(previous.place.end_coordinates ?? previous.place.coordinates, visit.place.coordinates)?.minutes ?? visit.walkMinutes ?? 0
    const duration = visit.end - visit.start
    const earliest = Math.ceil((previous.end + walk) / 5) * 5
    const at = earliestVisitStart(effectiveSchedule(visit.place, tripDay.hours ?? {}), earliest, duration) ?? visit.start
    const start = Math.min(visit.start, Math.max(earliest, at))
    visits.push({ ...visit, start, end: start + duration, walkMinutes: walk })
  }
  const last = visits.at(-1)
  const walkToDinner = dinner?.coordinates ? travel.leg(last.place.end_coordinates ?? last.place.coordinates, dinner.coordinates)?.minutes ?? 0 : 0
  const meals = schedule.meals.map((meal) => (meal === dinner ? { ...meal, walkMinutes: walkToDinner } : meal))
  const idleBeforeDinner = dinner ? dinner.start - last.end - walkToDinner : schedule.idleBeforeDinner
  const ids = new Set(visits.map((visit) => visit.unitId))
  return { ...tripDay, units: tripDay.units.filter((unit) => ids.has(unit.id)), schedule: { ...schedule, visits, meals, idleBeforeDinner } }
}

const HHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/**
 * Banner de contexto (decisión del 2026-09-26): uno solo al principio de la ruta, que explica por qué es
 * como es. Las plantillas viven en el JSON del destino (`destination_config.context_banners`); aquí solo
 * se elige el caso, del más al menos importante (invierno corto, invierno, corto, tranquilo), y se rellenan
 * los datos. Null si no toca ninguno.
 */
export function contextBannerFor(destData, trip, options = {}) {
  const templates = destData.destination_config?.context_banners
  if (!templates) return null
  const cityDays = trip.days.filter((day) => day.schedule)
  const days = trip.days.length
  const firstIso = cityDays.find((day) => day.hours?.dateIso)?.hours.dateIso ?? null
  const month = firstIso ? Number(firstIso.slice(5, 7)) : Number.isInteger(trip.calendar?.month) ? trip.calendar.month + 1 : Number.isInteger(options.month) ? options.month + 1 : null
  const winter = month !== null && (templates.meses_invierno ?? []).includes(month)
  const short = days <= 2
  const tranquilo = isTranquiloPace(options.pace)
  const usualStart = tranquilo ? MODES_V3.tranquilo.dayStart : MODES_V3.completo.dayStart
  // Los días que empiezan antes de su hora (el «y algún día empieza un poco antes» del invierno).
  const early = cityDays.filter((day) => day.schedule.modeFallback && (day.schedule.modeFallback.startedAt ?? usualStart) < usualStart)
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (match, key) => (values[key] ?? match))

  if (short && winter) return fill(days === 1 ? templates.invierno_corto_1 : templates.invierno_corto, { dias: days })
  if (winter) {
    const sunset = cityDays.map((day) => day.hours?.sunset).find((value) => value != null)
    const atardecer = sunset != null ? HHMM(Math.ceil(sunset / 15) * 15) : null
    // El nivel 1 de la ruta que cierra antes (el Foro, a las 16:30).
    let closing = null
    for (const day of cityDays) {
      for (const visit of day.schedule.visits ?? []) {
        const place = placeByName.get(visit.place.name)
        if (!place || place.level !== 1 || visit.place.passThrough) continue
        const close = parseClosingMinutes(effectiveSchedule(place, day.hours ?? {}))
        if (close !== null && close < 24 * 60 && (!closing || close < closing.close)) closing = { place, close }
      }
    }
    const madrugar = early.length > 0 ? templates.madrugar ?? '' : ''
    if (!atardecer) return null
    return closing
      ? fill(templates.invierno, { atardecer, lugar: placeWithArticle(closing.place), cierre: HHMM(closing.close), madrugar })
      : fill(templates.invierno_sin_cierre ?? templates.invierno, { atardecer, madrugar })
  }
  if (short) return fill(days === 1 ? templates.corto_1 : templates.corto, { dias: days })
  // Tranquilo, sin hora fija (PROMPT_TEXTOS_RITMO): cada día empieza a su hora escrita, y el texto ya dice que algún día
  // empieza pronto. (Fuera «Solo N días empiezan antes…»: solo servía para los días antes de las 10:00.)
  if (tranquilo) return templates.tranquilo
  return null
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
function freeAfternoonFor(destData, trip, tripDay, options, dayVisitedNames, busyMinutes = 0) {
  const idle = Math.max(0, (tripDay.schedule?.idleBeforeDinner ?? 0) - busyMinutes)
  const visits = tripDay.schedule?.visits ?? []
  const last = visits[visits.length - 1]
  if (idle < FREE_AFTERNOON_MIN_MINUTES || !last) return null
  const dinner = (tripDay.schedule?.meals ?? []).find((meal) => meal.type === 'dinner')
  return {
    minutes: idle,
    ...((tripDay.hours?.sunset ?? Infinity) < WINTER_EVENING_SUNSET_BEFORE ? { winter: true } : {}),
    suggestions: nearbySuggestions(destData, trip, options, dayVisitedNames, last.place.end_coordinates ?? last.place.coordinates, {
      startMinutes: last.end,
      endMinutes: dinner ? dinner.start - (dinner.walkMinutes ?? 0) : null,
      to: dinner?.coordinates ?? null,
      hours: tripDay.hours ?? {},
    }),
  }
}

/** Desde aquí, el rato antes de cenar ya se dice (FreeTimeBlock del cliente, 45 min). */
const APERITIVO_MIN_MINUTES = 20
/** Hasta aquí, el rato antes de cenar es aperitivo (decisión del 2026-09-26: los 99 min de 6 días en invierno). */
const APERITIVO_MAX_MINUTES = 90 // (PROMPT_ROMA_V4_REPASO 8: el aperitivo con su nombre, 90 min como mucho; antes, 120)
/** Con el sol antes de esta hora, el rato antes de cenar es de noche: paseo iluminado y aperitivo (PROMPT_RUTAS_CURADAS B3.1). */
const WINTER_EVENING_SUNSET_BEFORE = 18 * 60
/** Lo más que se alarga el paseo nocturno de antes de cenar en invierno para no pasar de 2 h (C.1). */
const WINTER_NIGHT_STRETCH_MAX = 45
/** En invierno, con la nocturna antes de cenar, el rato de luces y aperitivo de después: 90 min como mucho. */
const WINTER_FREE_MAX_MINUTES = 90
/** Lo que dura la cena: la nocturna del barrio que pasa a después de cenar empieza al acabar. */
const DINNER_BLOCK_MINUTES = 90
const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
/** Una nocturna antes de cenar, como mucho (decisión del usuario, 2026-09-28). */
const NIGHT_BEFORE_DINNER_MAX = 25

/**
 * "Aperitivo y paseo por {barrio}" (PROMPT_AJUSTES_BLOQUES B.7): el tiempo libre de 90 min o menos justo
 * antes de cenar, cuando se cena en un barrio con ambiente (un barrio de cena: 3+ restaurantes), se llama
 * así —no "Tarde libre (90 min)"— y lleva 2-3 sugerencias abiertas y de camino.
 */
/**
 * El nombre del rato de antes de cenar en invierno (decisión del usuario, 2026-09-28), por barrio de cena
 * (`destination_config.aperitivo_invierno`): el 25 de diciembre, en diciembre o el resto del invierno; y si ese día ya
 * se vio lo que nombra, el otro título ("Aperitivo en Campo de' Fiori y la Plaza Farnese"). Null si no hay.
 */
function winterEveningTitle(destData, zoneId, tripDay, dayVisitedNames) {
  const titles = destData.destination_config?.aperitivo_invierno?.[zoneId]
  if (!titles) return null
  if (titles.si_visto && titles.si_visto.some((name) => dayVisitedNames.has(name))) return titles.si_visto_titulo ?? null
  const iso = tripDay.hours?.weekday ? tripDay.hours?.dateIso : null
  if (iso && titles[iso.slice(5)]) return titles[iso.slice(5)]
  const month = iso ? Number(iso.slice(5, 7)) : null
  if (month === 12 && titles.diciembre) return titles.diciembre
  return titles.invierno ?? null
}

function aperitivoFor(destData, trip, tripDay, options, dayVisitedNames, busyMinutes = 0, idleOverride = null) {
  const idle = idleOverride ?? Math.max(0, (tripDay.schedule?.idleBeforeDinner ?? 0) - busyMinutes)
  const visits = tripDay.schedule?.visits ?? []
  const last = visits[visits.length - 1]
  if (!last || idle < APERITIVO_MIN_MINUTES || idle > APERITIVO_MAX_MINUTES) return null
  const zone = dinnerZones(destData).find((option) => option.id === tripDay.dinnerZone)
  if (!zone) return null
  const barrio = String(zone.label).replace(/\s*\/\s*/g, ' y ')
  const dinner = (tripDay.schedule?.meals ?? []).find((meal) => meal.type === 'dinner')
  // Invierno (el sol antes de las 18:00): ya es de noche, así que es un paseo iluminado y aperitivo, de hasta 2 h
  // (B3.1). El paseo de cada barrio de cena, del JSON del destino (`destination_config.paseo_iluminado`).
  const winter = (tripDay.hours?.sunset ?? Infinity) < WINTER_EVENING_SUNSET_BEFORE
  const lit = destData.destination_config?.paseo_iluminado?.[zone.id] ?? null
  return {
    title: winter ? winterEveningTitle(destData, zone.id, tripDay, dayVisitedNames) ?? `Paseo por ${lit ?? `${barrio} de noche`} y aperitivo` : `Aperitivo y paseo por ${barrio}`,
    barrio,
    minutes: idle,
    ...(winter ? { winter: true } : {}),
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
  // El de más minutos entre dos paradas (el cliente de antes solo pinta uno, entre dos paradas).
  return freeTimesFor(destData, trip, tripDay, options, dayVisitedNames)
    .filter((entry) => entry.after !== LUNCH_LABEL && entry.before !== LUNCH_LABEL && entry.minutes >= MID_DAY_GAP_MINUTES)
    .sort((a, b) => b.minutes - a.minutes)[0] ?? null
}

/** Un hueco de más de esto (sin la comida ni lo de antes de cenar) sale como "Tiempo libre" (decisión del 2026-09-26). */
const FREE_GAP_MINUTES = 20 // (PROMPT_ROMA_V4_REPASO 8: ningún rato de más de 20 min sin nombre; antes, 30)
/** El otro extremo de un hueco cuando es la comida. */
const LUNCH_LABEL = 'la comida'

/**
 * Todos los huecos del día de más de 30 min, con nombre: "Tiempo libre" y 2-3 sugerencias de camino (decisión
 * del 2026-09-26: ningún día tiene huecos sin nombre). Entre dos paradas, antes de la comida (el Coliseo
 * acaba a las 11:50 y se come a las 13:00) y después (la Vittoria no abre hasta las 16:00). La espera al
 * mirador del atardecer también: es el tiempo libre que va ANTES del mirador. Lo de antes de cenar es el
 * aperitivo o la tarde libre, aparte.
 */
function freeTimesFor(destData, trip, tripDay, options, dayVisitedNames) {
  const visits = (tripDay.schedule?.visits ?? []).filter((visit) => !visit.place.isNightExperience)
  const lunch = (tripDay.schedule?.meals ?? []).find((meal) => meal.type === 'lunch')
  const travel = travelTimesFor(findPipelineV2Key(destData.destination ?? options.city ?? ''))
  const coordsOf = (visit) => visit.place.end_coordinates ?? visit.place.coordinates
  const gaps = []
  for (let i = 1; i < visits.length; i++) {
    const previous = visits[i - 1]
    const next = visits[i]
    if (lunch && lunch.start >= previous.end && lunch.start < next.start) {
      // Antes de comer: hasta que empieza la comida (andando hasta el restaurante).
      const toLunch = lunch.coordinates ? travel.leg(coordsOf(previous), lunch.coordinates)?.minutes ?? 0 : 0
      gaps.push({ minutes: lunch.start - previous.end - toLunch, from: previous, after: previous.place.name, before: LUNCH_LABEL, to: lunch.coordinates ?? null, end: lunch.start - toLunch, zone: previous.place.zone })
      // Después: desde que acaba la franja de la comida (que ya lleva el paseo) hasta la siguiente.
      // Con metro o bus después de comer (`transitAfter`), el tiempo libre es al llegar, ya en la zona de la siguiente
      // (segundo repaso, 2026-09-28: el parque de la Borghese, no el Borgo antes de 25 min de metro).
      gaps.push({ ...(tripDay.written?.restAfterLunch ? { rest: true } : {}), minutes: next.start - lunch.end - (lunch.transitAfter ?? 0), fromCoords: next.place.coordinates, fromEnd: lunch.end + (lunch.transitAfter ?? 0), after: LUNCH_LABEL, before: next.place.name, to: next.place.coordinates, end: next.start, zone: next.place.zone })
      continue
    }
    // Si a la siguiente se va en metro o bus, el tiempo libre es al llegar: sus ideas y su paseo, de la zona de la siguiente.
    const byTransit = Boolean(next.place.transitMinutes)
    // (Un barrio o una plaza de ambiente, con bares: Monti, Campo de' Fiori.)
    const aperitivoIn = next.place.sunset != null && (previous.place.tags ?? []).some((tag) => tag === 'barrio' || tag === 'gastronomia') ? previous.place.name : null
    gaps.push({ ...(aperitivoIn ? { aperitivoIn } : {}), minutes: next.start - previous.end - (next.walkMinutes ?? 0), ...(byTransit ? { fromCoords: next.place.coordinates, fromEnd: previous.end + (next.walkMinutes ?? 0) } : { from: previous }), after: previous.place.name, before: next.place.name, to: next.place.coordinates, end: next.start - (byTransit ? 0 : next.walkMinutes ?? 0), zone: byTransit ? next.place.zone ?? previous.place.zone : previous.place.zone ?? next.place.zone })
  }
  const seenToday = new Set(dayVisitedNames)
  return gaps
    .filter((gap) => gap.minutes > FREE_GAP_MINUTES)
    .map((gap) => {
      const from = gap.from ? coordsOf(gap.from) : gap.fromCoords
      const startMinutes = gap.from ? gap.from.end : gap.fromEnd
      const suggestions = nearbySuggestions(destData, trip, options, seenToday, from, { startMinutes, endMinutes: gap.end, to: gap.to, hours: tripDay.hours ?? {} })
      // Lo que se propone en un hueco no se vuelve a proponer en otro del mismo día.
      // (Un rato corto, de 30 min o menos, no gasta las ideas: le hacen falta al rato largo, que sin ellas se queda sin nombre.)
      if (gap.minutes > 30) for (const item of suggestions) seenToday.add(item.name)
      return {
        // (Un aperitivo con nombre, 90 min como mucho: lo que pase se queda de margen antes del atardecer.)
        minutes: gap.aperitivoIn ? Math.min(APERITIVO_MAX_MINUTES, gap.minutes) : gap.minutes,
        after: gap.after,
        before: gap.before,
        suggestions,
        // Sin nada que proponer (la espera al atardecer del Pincio, con todo visto): una idea corta de la
        // zona, sin más paradas (decisión del 2026-09-26).
        ...(suggestions.length === 0 ? { hint: zoneHintFor(destData, gap.zone) } : {}),
        // Con una idea clara de paseo de la misma zona, sale con su nombre (cierre de Roma, punto 1d): "Via Margutta y
        // Via del Babuino", no "Tiempo libre antes de la comida".
        ...(namedWalkTitle(destData, suggestions, gap.zone) ? { title: namedWalkTitle(destData, suggestions, gap.zone) } : {}),
        // Antes del atardecer y viniendo de un barrio (Monti antes de los Foros en verano): el aperitivo en ese barrio, con su
        // nombre y 90 min como mucho, como haría un local (PROMPT_ROMA_V4_REPASO 8).
        ...(gap.aperitivoIn ? { title: `Aperitivo en ${gap.aperitivoIn}`, aperitivo: true } : {}),
        // En tranquilo, la tarde larga empieza con un descanso después de comer (lo que no cabe en el barrio ni en el aperitivo).
        ...(gap.rest ? { title: REST_TITLE, hint: REST_HINT, descanso: true } : {}),
        // En julio y agosto, más de 90 min entre las 14:00 y las 17:00: lo que haría un local (repaso 3, 2026-09-28).
        ...(isSummerSiesta(tripDay, startMinutes, gap.end, gap.minutes) ? { title: SIESTA_TITLE, hint: SIESTA_HINT } : {}),
      }
    })
}

/** Las ideas de paseo (calles, plazas, paseos) de la zona del hueco, hasta dos, como título; si no las hay, nada. */
const WALK_IDEA_TAGS = new Set(['calle', 'paseo', 'plaza'])
function namedWalkTitle(destData, suggestions, zone) {
  if (suggestions.length === 0) return null
  const places = suggestions.map((item) => (destData.places ?? []).find((place) => place.name === item.name)).filter(Boolean)
  const walks = places.filter((place) => place.type === 'exterior' && (place.tags ?? []).some((tag) => WALK_IDEA_TAGS.has(tag)))
  return walks.length > 0 && walks.length === places.length ? joinSpanish(walks.slice(0, 2).map((place) => place.name)) : null
}

const REST_TITLE = 'Descanso después de comer'
const REST_HINT = 'Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir.'
const SIESTA_TITLE = 'Descanso a la sombra'
const SIESTA_HINT = 'En verano los romanos se esconden del calor a estas horas.'
/** Julio o agosto, más de 90 min libres y dentro de 13:45-17:15 (el calor del día). */
function isSummerSiesta(tripDay, start, end, minutes) {
  const month = Number(String(tripDay.hours?.dateIso ?? '').slice(5, 7))
  return (month === 7 || month === 8) && minutes > 90 && start >= 13 * 60 + 45 && end <= 17 * 60 + 15
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
    // Un lugar de nivel 1 o 2 no es una "idea" de tiempo libre: si va, es parada (decisión del usuario, 2026-09-28).
    .filter((place) => !seen.has(place.name) && Array.isArray(place.coordinates) && (place.level ?? 3) > 2)
    // Una capa (el mercadillo de Navona) no es un sitio aparte, y lo de temporada solo en sus fechas, sin margen.
    .filter((place) => {
      if (place.capa_de) return false
      if (!place.available) return true
      const fit = seasonFit(place.available, trip.calendar ?? { hasDates: Boolean(hours.weekday), month: null }, hours.dateIso ?? null)
      return fit.enters && !fit.notice
    })
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
