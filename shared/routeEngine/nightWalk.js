/**
 * Después de cenar no se va "a una visita": se sale a pasear.
 *
 * El motor encadena hasta tres experiencias nocturnas por noche si están cerca unas de otras,
 * ordenadas desde el restaurante hacia fuera. Las distancias reales de Roma dicen solas qué encadena
 * y qué no: Fontana ↔ Panteón 588 m, Fontana ↔ Plaza de España 572 m, Plaza de España ↔ Pincio
 * 678 m — el paseo nocturno clásico sale sin forzarlo. El Coliseo está a 1,4 km de lo más cercano y
 * el Janículo a entre 1,6 y 2,7 km de todo: no encadenan con nada y se quedan como la experiencia
 * única de su noche, que es lo correcto — subir al Janículo es un plan en sí mismo.
 *
 * El reparto de noches es DETERMINISTA y se calcula para el viaje entero (invariante 20): cada día
 * se construye en su propia llamada y, sin esto, dos noches distintas elegirían la misma Fontana.
 */

import { roundUpToFive, roundUpToSlot, toHHMM as minutesToTime } from './time.js'
import { whyTexts } from './whyTexts.js'
import { dinnerZones } from './dinnerZones.js'
import { effectiveSchedule, parseClosingMinutes } from './openingHours.js'
import { seasonFit } from './availability.js'

/** Metros entre dos puntos {lat, lng} (equirectangular: a escala de ciudad el error es despreciable). */
function metersBetween(a, b) {
  if (!Number.isFinite(a?.lat) || !Number.isFinite(b?.lat)) return Infinity
  const toRad = Math.PI / 180
  const x = (b.lng - a.lng) * toRad * Math.cos(((a.lat + b.lat) / 2) * toRad)
  const y = (b.lat - a.lat) * toRad
  return Math.sqrt(x * x + y * y) * 6371000
}

/** Hasta dónde se encadena a pie de noche sin que deje de ser un paseo. */
const CHAIN_MAX_METERS = 900
/**
 * Hasta dónde se anda DESDE LA CENA para la primera parada del paseo: quince minutos.
 *
 * Se mide desde donde se cena (el barrio de cena), no de centro de zona a centro de zona. Con el criterio de zonas
 * vecinas (1,5 km entre centros) no salía ni un paseo en todo el viaje: los centros de zona de Roma
 * están a entre 1,5 y 3,4 km, y Roma Antigua-Centro Histórico se quedaba en 1.574 m, setenta metros
 * por encima del corte. Pero bajar de Monti a la Fontana después de cenar es exactamente lo que
 * hace todo el mundo.
 */
// 15 min andando desde donde se cena (decisión del 2026-09-25): en línea recta, con el rodeo medio
// medido en la matriz de Roma (1,32) y 83 m/min, unos 950 m. Si no hay ninguna a esa distancia, esa
// noche no hay nocturna.
export const NIGHT_REACH_METERS = 950
const MAX_PER_NIGHT = 3
/** En viajes de 1-2 días, la visita de día desde esta hora (o desde el atardecer) deja paso a su nocturna. */
const LATE_VISIT_MINUTES = 17 * 60
/** La nocturna de un imprescindible que no entra de día: desde la cena, hasta esto (unos 20 min andando). */
const MUST_NIGHT_REACH_METERS = 1600
/** La primera se mira con calma; las encadenadas son de paso. */
const FIRST_MINUTES = 45
const CHAINED_MINUTES = 25
/** Después de cenar se sale a esta hora (o cuando ya sea de noche, si es más tarde). */
const NIGHT_START = 21 * 60 + 30
const WALK_MINUTES_BETWEEN = 15
/**
 * Empieza la noche 30 minutos después de la puesta de sol (Estaciones, Parte 3): desde esa hora una
 * experiencia nocturna ya se ve de noche. Si eso es antes de la cena (invierno) y la tarde deja sitio,
 * el paseo va ANTES de cenar, de camino al barrio de la cena; si no (verano), después, como siempre.
 */
export const NIGHT_AFTER_SUNSET_MINUTES = 30
/** Andando: 83 m/min con el rodeo medio de la matriz de Roma (1,32). */
const walkMinutes = (a, b) => (Number.isFinite(metersBetween(a, b)) ? Math.ceil((metersBetween(a, b) * 1.32) / 83) : WALK_MINUTES_BETWEEN)

/** Hora a la que empieza la noche ese día (null si no se sabe la puesta de sol). */
export function nightStartsAt(sunsetMinutes) {
  return Number.isFinite(sunsetMinutes) ? sunsetMinutes + NIGHT_AFTER_SUNSET_MINUTES : null
}

const coordsOf = (entry) => ({ lat: entry.coordinates?.[0], lng: entry.coordinates?.[1] })

/**
 * Reparte las experiencias nocturnas del viaje entre sus noches.
 *
 * Reglas:
 *   - cada experiencia se usa UNA vez en el viaje
 *   - se ofrecen en la noche cuya cena cae en su misma zona
 *   - si el lugar se visitó de día: en viajes de 3+ días su versión nocturna se reserva para OTRA
 *     noche, también si de día solo se pasó por delante (decisión del 2026-09-26: nunca de día y de
 *     noche el mismo día); en viajes de 1-2 días puede ir esa misma noche si la visita de día es a partir
 *     de las 17:00 o del atardecer, y entonces la visita de día se quita (`replacesDayVisit`)
 *   - ningún lugar sale más de 2 veces en el viaje, contando lo de paso y las nocturnas
 *   - en ritmo tranquilo, una nocturna por noche como mucho (`plan.maxPerNight`)
 *
 * @returns {Map<number, object[]>} día -> experiencias de esa noche, ya en orden de paseo
 */
export function planNightWalks(destData, plan) {
  const catalogue = destData?.night_experiences ?? []
  if (catalogue.length === 0) return new Map()

  const shortTrip = plan.days.length <= 2
  // Qué días sale cada lugar (todos: de paso el día 2 y de visita el día 4), cuántas veces, y a qué hora
  // empieza la visita de cada día.
  const dayVisited = new Map()
  const daysOf = new Map()
  const timesSeen = new Map()
  const startOn = new Map()
  for (const day of plan.days) {
    for (const slotName of ['morning', 'afternoon']) {
      for (const unit of day.slots[slotName].units) {
        for (const place of unit.places) {
          dayVisited.set(place.name, day.dayNumber)
          daysOf.set(place.name, new Set([...(daysOf.get(place.name) ?? []), day.dayNumber]))
          timesSeen.set(place.name, (timesSeen.get(place.name) ?? 0) + 1)
          if (unit.start != null && !startOn.has(`${day.dayNumber}:${place.name}`)) startOn.set(`${day.dayNumber}:${place.name}`, unit.start)
        }
      }
    }
  }
  const maxPerNight = plan.maxPerNight ?? MAX_PER_NIGHT
  // Viaje de 1-2 días: la visita de día de ese lugar, ese día, es a partir de las 17:00 o del atardecer.
  const lateDayVisit = (entry, day) =>
    (entry.conflicts_with ?? []).some((name) => {
      const start = startOn.get(`${day.dayNumber}:${name}`)
      return start != null && (start >= LATE_VISIT_MINUTES || (Number.isFinite(day.hours?.sunset) && start >= day.hours.sunset))
    })

  const levelOf = new Map((destData?.places ?? []).map((place) => [place.name, place.level]))
  const placeByName = new Map((destData?.places ?? []).map((place) => [place.name, place]))
  const used = new Set()
  const byDay = new Map()

  // Un imprescindible que no ha entrado de día en ningún sitio (`plan.mustNight`: Navona en 2 días tranquilos con la
  // Galería Borghese del pool) se queda con su nocturna (decisión del 2026-09-26): la noche cuya cena quede más
  // cerca, con más margen de distancia y aunque no esté en la lista de la tarde.
  const forced = new Map()
  const dinnerCoordsOf = (day) => {
    const point = day.dinnerZoneId ? dinnerZones(destData).find((zone) => zone.id === day.dinnerZoneId)?.coordinates : null
    const center = point ?? destData?.zones?.[day.slots.afternoon.zone ?? day.slots.morning.zone]?.center
    return Array.isArray(center) ? { lat: center[0], lng: center[1] } : null
  }
  for (const name of plan.mustNight ?? []) {
    const entry = catalogue.find((candidate) => (candidate.conflicts_with ?? []).includes(name) && !used.has(candidate.name))
    if (!entry) continue
    const best = plan.days
      .filter((day) => !day.isBlank && !day.isExcursion && dinnerCoordsOf(day))
      .map((day) => ({ day, meters: metersBetween(dinnerCoordsOf(day), coordsOf(entry)) }))
      .filter((item) => item.meters <= MUST_NIGHT_REACH_METERS)
      .sort((a, b) => (forced.get(a.day.dayNumber)?.length ?? 0) - (forced.get(b.day.dayNumber)?.length ?? 0) || a.meters - b.meters)[0]
    if (!best) continue
    used.add(entry.name)
    forced.set(best.day.dayNumber, [...(forced.get(best.day.dayNumber) ?? []), entry])
  }

  for (const day of plan.days) {
    // Ni en blanco ni de excursión: no hay cena en la ciudad de la que salir a pasear.
    if (day.isBlank || day.isExcursion) continue
    const dinnerZone = day.slots.afternoon.zone ?? day.slots.morning.zone
    if (!dinnerZone) continue
    // Se sale desde donde se ha cenado: el centro de la zona de la cena es la mejor aproximación
    // mientras no haya restaurante concreto elegido.
    // Donde se cena de verdad (el barrio de cena del motor v3); si no, el centro de la zona.
    const dinnerPoint = day.dinnerZoneId ? dinnerZones(destData).find((zone) => zone.id === day.dinnerZoneId)?.coordinates : null
    const center = dinnerPoint ?? destData?.zones?.[dinnerZone]?.center
    const dinnerCoords = Array.isArray(center) ? { lat: center[0], lng: center[1] } : null

    // Un exterior con puertas (un jardín, un parque) que cierra antes de que sea de noche no puede ser
    // nocturna ese día: el Jardín de los Naranjos cierra a las 18:00 de octubre a febrero, y lo que
    // cierra "al anochecer" (`sunset`) nunca. Lo de interior se ve de noche desde fuera: no cuenta.
    const nightStart = nightStartsAt(day.hours?.sunset)
    const closedAtNight = (entry) =>
      nightStart !== null &&
      (entry.conflicts_with ?? []).some((name) => {
        const place = placeByName.get(name)
        if (!place || place.type !== 'exterior') return false
        const closing = parseClosingMinutes(effectiveSchedule(place, day.hours ?? {}))
        return closing !== null && closing < 24 * 60 && closing <= nightStart
      })

    // Fuera de temporada (`available`, Parte 4): con fechas, la del día; con solo el mes, el mes
    // entero dentro (una nocturna nunca la elige el viajero, así que el mes frontera no vale).
    const hasDates = Boolean(day.hours?.weekday)
    const monthOfDay = day.hours?.dateIso ? Number(String(day.hours.dateIso).slice(5, 7)) - 1 : null
    const fitOf = (entry) => seasonFit(entry.available, { hasDates, month: monthOfDay }, day.hours?.dateIso ?? null, false)
    const inSeason = (entry) => fitOf(entry).enters

    const available = catalogue.filter((entry) => {
      if (used.has(entry.name) || (forced.get(day.dayNumber) ?? []).includes(entry)) return false
      // Con tarde tipo (Mañanas y tardes, Parte B), solo las nocturnas de su lista.
      if (Array.isArray(day.nightNames) && !day.nightNames.includes(entry.name)) return false
      if (closedAtNight(entry) || !inSeason(entry)) return false
      // En un viaje no se repite un lugar de nivel 2 o 3, tampoco de noche (decisión del 2026-09-25):
      // si el Janículo se ve al atardecer otro día, su nocturna no sale. Solo el nivel 1 se repite.
      if ((entry.conflicts_with ?? []).some((name) => dayVisited.has(name) && (levelOf.get(name) ?? 1) >= 2)) return false
      // Como mucho 2 veces en el viaje, contando lo de paso: si ya sale dos veces de día, no hay nocturna.
      if ((entry.conflicts_with ?? []).some((name) => (timesSeen.get(name) ?? 0) >= 2)) return false
      // A distancia de paseo desde la cena. La zona exacta no vale como criterio: es justo la zona
      // donde ese lugar ya se ha visitado de día, así que en viajes largos se excluían todas.
      if (!dinnerCoords) return false
      if (metersBetween(dinnerCoords, coordsOf(entry)) > NIGHT_REACH_METERS) return false
      if (shortTrip) return true
      // Viaje largo: si el lugar se ve de día, su noche es otra. Salvo la nocturna que lo mira desde
      // OTRO sitio y cierra el día que se ha visitado (`same_day_as_visit`: el Foro iluminado desde el
      // Campidoglio el día de la Roma Antigua).
      if (entry.same_day_as_visit) return true
      return !(entry.conflicts_with ?? []).some((name) => daysOf.get(name)?.has(day.dayNumber))
    })
    if (available.length === 0 && !forced.has(day.dayNumber)) continue
    // Viaje de 1-2 días (decisión del 2026-09-26): lo visto de día esa misma noche solo si la visita de día
    // es a partir de las 17:00 o del atardecer (entonces se queda solo la nocturna) o si no hay otra
    // nocturna posible.
    const sameDay = (entry) => !entry.same_day_as_visit && (entry.conflicts_with ?? []).some((name) => daysOf.get(name)?.has(day.dayNumber))
    const keepsDay = (entry) => sameDay(entry) && !lateDayVisit(entry, day)
    if (shortTrip && available.some((entry) => !keepsDay(entry))) available.splice(0, available.length, ...available.filter((entry) => !keepsDay(entry)))

    // Desde el restaurante hacia fuera, vecino más cercano. Cuando el viaje tenga alojamiento
    // elegido, ese punto sesgará el orden; mientras no lo haya, el paseo encadena lo más cercano.
    const chain = [...(forced.get(day.dayNumber) ?? [])]
    let cursor = chain.length > 0 ? coordsOf(chain.at(-1)) : null
    while (chain.length < maxPerNight) {
      const candidates = available.filter((entry) => !chain.includes(entry))
      if (candidates.length === 0) break
      let next = null
      if (!cursor) {
        // La primera es la más cercana a la cena, no la primera del catálogo.
        next = [...candidates].sort((a, b) => metersBetween(dinnerCoords, coordsOf(a)) - metersBetween(dinnerCoords, coordsOf(b)))[0]
      } else {
        const reachable = candidates
          .map((entry) => ({ entry, meters: metersBetween(cursor, coordsOf(entry)) }))
          .filter((item) => item.meters <= CHAIN_MAX_METERS)
          .sort((a, b) => a.meters - b.meters)
        next = reachable[0]?.entry ?? null
      }
      if (!next) break
      chain.push(next)
      cursor = coordsOf(next)
    }

    for (const entry of chain) used.add(entry.name)
    // Con `aprox`, en el margen de 15 días: sale con su aviso ("Es probable que … aún no hayan abierto").
    // La nocturna del lugar visto ese mismo día a última hora (1-2 días) sustituye a esa visita de día.
    if (chain.length > 0) byDay.set(day.dayNumber, chain.map((entry) => ({ ...entry, ...(fitOf(entry).notice ? { season_notice: fitOf(entry).notice } : {}), ...(shortTrip && sameDay(entry) && lateDayVisit(entry, day) ? { replacesDayVisit: true } : {}) })))
  }
  return byDay
}

/**
 * Cuándo va el paseo nocturno (Estaciones, Parte 3). Antes de cenar si ya es de noche antes de la cena
 * y cabe entre la última visita y la cena, recorrido HACIA el barrio de la cena (se acaba en lo más
 * cercano a él); si no cabe entero, se prueba quitando lo más lejano de la cena. Si no, después de
 * cenar, desde las 21:30 (o cuando ya sea de noche).
 * @param {object[]} chain  en orden de paseo desde la cena (planNightWalks)
 * @param {{ sunset?: number|null, lastEnd?: number|null, lastCoords?: {lat:number,lng:number}|null,
 *           dinnerStart?: number|null, dinnerCoords?: {lat:number,lng:number}|null }} timing
 * @returns {{ entries: object[], start: number, beforeDinner: boolean }}
 */
export function nightTiming(chain, timing = {}) {
  // En punto o y media, como el resto de horas de la ruta (18:59 → 19:00).
  const exactStart = nightStartsAt(timing.sunset)
  const nightStart = exactStart === null ? null : roundUpToSlot(exactStart)
  const { lastEnd, lastCoords, dinnerStart, dinnerCoords } = timing
  if (nightStart !== null && Number.isFinite(lastEnd) && Number.isFinite(dinnerStart) && nightStart < dinnerStart) {
    // Hacia la cena: al revés que después de cenar.
    let entries = [...chain].reverse()
    while (entries.length > 0) {
      const first = coordsOf(entries[0])
      const start = Math.max(nightStart, roundUpToSlot(lastEnd + (lastCoords ? walkMinutes(lastCoords, first) : WALK_MINUTES_BETWEEN)))
      const timed = timeChain(entries, start)
      const last = timed.at(-1)
      const toDinner = dinnerCoords ? walkMinutes(coordsOf(last.entry), dinnerCoords) : 0
      if (timed.length === entries.length && last.start + last.duration + toDinner <= dinnerStart) return { entries, start, beforeDinner: true }
      // La que sustituye a una visita de día (1-2 días) no se puede quedar fuera: entonces, después de cenar.
      if (entries[0].replacesDayVisit) break
      entries = entries.slice(1)
    }
  }
  // Después de cenar: nunca antes de que acabe la cena (la de verano, a las 21:00, acaba más tarde).
  return { entries: chain, start: Math.max(NIGHT_START, nightStart ?? 0, roundUpToSlot(timing.dinnerEnd ?? 0)), beforeDinner: false }
}

const durationOf = (entry, index) => (index === 0 ? Math.min(FIRST_MINUTES, entry.duration ?? FIRST_MINUTES) : Math.min(CHAINED_MINUTES, entry.duration ?? CHAINED_MINUTES))

/** Ninguna nocturna empieza más tarde (revisión del 2026-09-25). */
export const NIGHT_LAST_START = 23 * 60

/**
 * Las horas de un paseo nocturno encadenado, con su tiempo real: la duración de cada una más lo que se
 * anda hasta la siguiente, en tramos de 5 min (no un bloque de una hora por nocturna: la tercera salía a
 * las 23:30). Lo que empezaría después de las 23:00 se queda fuera.
 * @returns {{ entry: object, start: number, duration: number }[]}
 */
export function timeChain(entries, start) {
  const timed = []
  let cursor = start
  for (const [index, entry] of entries.entries()) {
    const at = index === 0 ? cursor : roundUpToFive(cursor + walkMinutes(coordsOf(entries[index - 1]), coordsOf(entry)))
    if (at > NIGHT_LAST_START) break
    const duration = durationOf(entry, index)
    timed.push({ entry, start: at, duration })
    cursor = at + duration
  }
  return timed
}

/** Las paradas nocturnas de un día, ya con hora (ver nightTiming: antes o después de cenar). */
export function nightStopsFor(chain, dayVisitedNames, timing = {}) {
  const stops = []
  const plan = nightTiming(chain, timing)
  for (const { entry, start, duration } of timeChain(plan.entries, plan.start)) {
    // Si el lugar ya se ha visto de día, la tarjeta lo dice: no es que se repita por descuido, es
    // que de noche es otra cosa. Eso es parte del valor, no algo que esconder.
    const isRevisit = (entry.conflicts_with ?? []).some((name) => dayVisitedNames.has(name))
    stops.push({
      name: entry.name,
      suggested_time: minutesToTime(start),
      duration_minutes: duration,
      latitude: entry.coordinates?.[0],
      longitude: entry.coordinates?.[1],
      tip: entry.tip ?? entry.description ?? '',
      description: entry.description ?? '',
      hours: null,
      tags: [],
      schedule: null,
      is_night_experience: true,
      ...(plan.beforeDinner ? { before_dinner: true } : {}),
      ...(entry.season_notice ? { season_notice: entry.season_notice } : {}),
      why: plan.beforeDinner ? whyTexts.nightBeforeDinner() : whyTexts.night(),
      ...(isRevisit ? { is_revisit: true } : {}),
      category: 'landmark',
      category_label: 'De noche',
    })
  }
  return stops
}

/**
 * Dónde se cena ese día en el motor v3: el barrio que eligió el repartidor. Si el destino no tiene
 * barrios de cena, la zona de la última visita. De ahí sale también el paseo nocturno.
 */
export function dinnerZoneOf(tripDay) {
  const visits = tripDay.schedule?.visits ?? []
  // El barrio de cena es de restaurantes ("tridente_spagna"); el paseo nocturno se busca por la
  // zona de lugares más cercana a él.
  return tripDay.dinnerPlaceZone ?? tripDay.dinnerZone ?? visits[visits.length - 1]?.place.zone ?? tripDay.curated?.afternoon?.zone ?? tripDay.curated?.morning?.zone ?? null
}

/**
 * El viaje del motor v3 con la forma que espera planNightWalks. Con las paradas que de verdad se
 * visitan —no las del reparto—, también las "de paso" y lo visto por fuera: desde el 2026-09-26 cuentan
 * para no ver un lugar de día y de noche el mismo día, y para el tope de 2 veces por viaje.
 */
export function nightWalkPlan(trip) {
  return {
    days: trip.days.map((day) => {
      const zone = dinnerZoneOf(day)
      // Lo de paso y lo visto por fuera también cuentan (decisión del 2026-09-26: nunca de día y de noche el
      // mismo día, tampoco de paso; y como mucho 2 veces en el viaje).
      const units = (day.schedule?.visits ?? []).map((visit) => ({ places: [visit.place], start: visit.start }))
      return { dayNumber: day.dayNumber, isBlank: day.isBlank, isExcursion: day.isExcursion, dinnerZoneId: day.dinnerZone ?? null, hours: day.hours ?? null, nightNames: day.nightNames ?? null, slots: { morning: { zone, units }, afternoon: { zone, units: [] } } }
    }),
    // Los imprescindibles que no han entrado de día: su nocturna va sí o sí.
    mustNight: (trip.unplacedEssentials ?? []).map((item) => item.name),
    // Ritmo tranquilo: una nocturna por noche como mucho (decisión del 2026-09-26).
    ...(trip.mode?.id === 'tranquilo' ? { maxPerNight: 1 } : {}),
  }
}
