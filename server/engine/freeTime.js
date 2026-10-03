/**
 * El tiempo que sobra, sin «Tiempo libre» ni «Aperitivo» (PARA_CODE_TODO_2026-10-01, paso 5, puntos 1 y 7).
 *
 * El motor sigue calculando los ratos que sobran (`aperitivo`, `free_afternoon`, `free_times`: ver index.js); aquí cada uno
 * se convierte en algo con nombre, en este orden:
 *   - menos de 20 min: no sale nada;
 *   - antes de cenar: «Pasea y piérdete por {zona}» (90 min como mucho). Si cae en el mismo sitio que la parada de antes,
 *     no hay tarjeta aparte: esa parada se alarga y lleva el consejo del aperitivo;
 *   - a mitad de día: un sitio de camino como parada; si no, el paseo de la zona a la que se llega; si no, las horas se
 *     recolocan (la parada de antes se alarga).
 * Nunca un texto con «Una idea…». Lo que pone el viajero (días libres, Añadir parada) no pasa por aquí.
 */
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'
import { dinnerZones } from '../../shared/routeEngine/dinnerZones.js'
import { buildStop } from './buildDay.js'
import { paseoMaxOf } from '../../shared/routeEngine/curatedTrip.js'
import { effectiveSchedule, parseClosingMinutes } from '../../shared/routeEngine/openingHours.js'

export const PASEO_MIN_MINUTES = 20
export const PASEO_MAX_MINUTES = 90
const PASEO_PREFIX = 'Pasea y piérdete por '
const SAME_PLACE_METERS = 250
const MAX_DINNER_WAIT = 20
const MAX_PASEO_WALK = 15
const DINNER_BLOCK_MINUTES = 90
const FALLBACK_TIP = 'A esta hora los romanos se toman un spritz o una copa de vino antes de cenar. Si te apetece, siéntate en una terraza y mira pasar la ciudad.'

const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const toMin = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const toHHMM = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const ceil5 = (minutes) => Math.ceil(minutes / 5) * 5
const floor5 = (minutes) => Math.floor(minutes / 5) * 5
const coordsOf = (stop) => (Number.isFinite(stop?.latitude) && Number.isFinite(stop?.longitude) ? [stop.latitude, stop.longitude] : null)
const nameOf = (stop) => stop.place_name ?? stop.name

/** El nombre del paseo de la zona de cena (destination_config.paseo_libre): con las luces en Navidad, la otra zona si ya se vio. */
function zoneTitle(destData, zoneId, tripDay, dayVisitedNames) {
  const config = destData.destination_config?.paseo_libre?.zonas?.[zoneId]
  if (!config) return null
  const iso = tripDay.hours?.weekday ? tripDay.hours?.dateIso : null
  const month = iso ? Number(iso.slice(5, 7)) : null
  if (config.titulo_navidad && iso && (iso.slice(5) === '12-25' || month === 12)) return config.titulo_navidad
  if (config.si_visto?.some((name) => dayVisitedNames.has(name)) && config.si_visto_nombre) return `${PASEO_PREFIX}${config.si_visto_nombre}`
  const winter = (tripDay.hours?.sunset ?? Infinity) < 18 * 60
  return `${PASEO_PREFIX}${winter && config.iluminado ? config.iluminado : config.nombre}`
}

/**
 * El paseo como parada: sin lugar propio (no se busca a Claude ni a Mapbox), con la foto de día de su zona, la etiqueta
 * «Paseo libre» y el consejo del aperitivo dentro de la ficha.
 */
function paseoStop({ title, start, minutes, coordinates, photoName, photoAlternatives, porElCamino, tip, why }) {
  return {
    name: title,
    suggested_time: toHHMM(start),
    duration_minutes: minutes,
    latitude: coordinates[0],
    longitude: coordinates[1],
    tip: '',
    description: '',
    hours: null,
    wikipedia_title: null,
    tags: [],
    schedule: null,
    category: 'walk',
    category_label: 'Paseo libre',
    free_access: true,
    is_free_walk: true,
    ...(photoName ? { photo_name: photoName } : {}),
    ...(photoAlternatives?.length ? { photo_alternatives: photoAlternatives } : {}),
    ...(porElCamino?.length ? { por_el_camino: porElCamino } : {}),
    aperitivo_tip: tip,
    why,
  }
}

/**
 * Cuánto se puede alargar una parada: ni un exterior de «por fuera» (su tiempo es el de su ficha), ni una nocturna, ni una calle
 * de paso, ni el mirador del atardecer; nunca por encima de su máximo de paseo (un barrio, 90) ni de la hora de cierre.
 */
function stretchRoom(stop, place, hours, { ignoreWalkMax = false } = {}) {
  if (stop.visit_mode === 'fuera' || stop.is_night_experience || stop.pass_through || stop.is_break || stop.is_free_walk || stop.sunset_minutes != null || stop.night_view) return 0
  let room = Infinity
  const max = ignoreWalkMax ? null : paseoMaxOf(place)
  if (max != null) room = Math.min(room, max - (stop.duration_minutes ?? 0))
  if (stop.max_minutes != null) room = Math.min(room, stop.max_minutes - (stop.duration_minutes ?? 0))
  const schedule = place ? effectiveSchedule(place, hours ?? {}) : null
  const close = schedule ? parseClosingMinutes(schedule) : null
  if (close != null && close < 24 * 60) room = Math.min(room, close - (toMin(stop.suggested_time) + (stop.duration_minutes ?? 0)))
  return Number.isFinite(room) ? Math.max(0, room) : 600
}

/** La parada que se alarga en vez de un paseo aparte: lleva el consejo del aperitivo (solo antes de cenar). */
function stretch(stop, minutes, tip = null) {
  stop.duration_minutes = (stop.duration_minutes ?? 0) + minutes
  if (tip) stop.aperitivo_tip = tip
  // Una calle de paso que se alarga deja de serlo: es un rato de verdad en ese sitio.
  if (stop.pass_through) delete stop.pass_through
  delete stop.max_minutes
}

/**
 * @param {object} day  El día que ha montado buildCityDayV3, con sus `aperitivo` / `free_afternoon` / `free_times` por resolver.
 * @param {{ destData: object, tripDay: object, dayVisitedNames: Set<string>, travel: { leg: Function }, suggestionsFor: Function }} ctx
 */
export function resolveFreeTime(day, { destData, tripDay, dayVisitedNames, travel, suggestionsFor, trip = null }) {
  const config = destData.destination_config?.paseo_libre ?? {}
  const tip = config.consejo_aperitivo ?? FALLBACK_TIP
  const minMinutes = config.minutos_min ?? PASEO_MIN_MINUTES
  const maxMinutes = config.minutos_max ?? PASEO_MAX_MINUTES
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const leg = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? Math.round(straightLineMeters(a, b) / 75) : 0)
  const report = { evening: null, mid: [] }
  const sortStops = () => day.stops.sort((a, b) => (toMin(a.suggested_time) ?? 0) - (toMin(b.suggested_time) ?? 0))
  day.stops = day.stops ?? []
  sortStops()
  const dinner = (day.meals ?? []).find((meal) => meal.time === 'dinner')
  const dinnerStart = dinner ? toMin(dinner.suggested_time) : null
  const dinnerCoords = dinner && Number.isFinite(dinner.latitude) ? [dinner.latitude, dinner.longitude] : null

  // ── Antes de cenar ────────────────────────────────────────────────────────────────────────────────────────────────
  const evening = day.aperitivo ?? day.free_afternoon ?? null
  delete day.aperitivo
  delete day.free_afternoon
  delete day.free_time
  if (evening && dinnerStart != null) {
    const zone = dinnerZones(destData).find((option) => option.id === tripDay.dinnerZone)
    const zoneConfig = zone ? config.zonas?.[zone.id] ?? null : null
    const title = (zone && zoneTitle(destData, zone.id, tripDay, dayVisitedNames)) ?? (zone ? `${PASEO_PREFIX}${String(zone.label).replace(/\s*\/\s*/g, ' y ')}` : null)
    const center = zone?.coordinates ?? null
    const before = day.stops.filter((stop) => (toMin(stop.suggested_time) ?? Infinity) < dinnerStart && !stop.after_dinner)
    const mentions = (stop) => {
      const name = norm(nameOf(stop)).replace(/^(el|la|los|las)\s+/, '').replace(/\s+de noche$/, '')
      return name.length >= 4 && norm(title).includes(name)
    }
    // Dónde cabe el rato: justo después de lo último que se ve de día (antes de la nocturna, si la hay) y, si no cabe, después
    // de lo último de todo (la nocturna) y hasta la cena.
    const lastDay = [...before].reverse().find((stop) => !stop.is_night_experience) ?? null
    const lastAll = before.at(-1) ?? null
    const slots = []
    if (lastDay) slots.push({ previous: lastDay, next: before[before.indexOf(lastDay) + 1] ?? null })
    if (lastAll && lastAll !== lastDay) slots.push({ previous: lastAll, next: null })
    for (const { previous, next } of slots) {
      if (!title || !center) break
      const previousEnd = toMin(previous.suggested_time) + (previous.duration_minutes ?? 0)
      const nextStart = next ? toMin(next.suggested_time) : dinnerStart
      const nextCoords = next ? coordsOf(next) : dinnerCoords
      // Mismo sitio que la parada de antes: su nombre está en el del paseo, o está a un paso del centro de la zona (una
      // nocturna no se alarga: dura lo que dura).
      const sameName = mentions(previous)
      const near = coordsOf(previous) && straightLineMeters(coordsOf(previous), center) <= SAME_PLACE_METERS && !previous.is_night_experience
      // Un paseo con `una_vez_por_viaje` (el del Tridente) no se repite: si un día anterior ya cena en esa zona, el rato va a la parada que se estira.
      const repeated = Boolean(zoneConfig?.una_vez_por_viaje && trip?.days?.some((other) => other.dayNumber < tripDay.dayNumber && other.dinnerZone === tripDay.dinnerZone))
      const same = sameName || near || repeated
      // El barrio que el día ya ha visto antes (con otra cosa en medio) no vuelve como paseo: sería el mismo sitio dos veces.
      const seenEarlier = !same && before.slice(0, before.indexOf(previous)).some((stop) => !stop.is_night_experience && (placeByName.get(nameOf(stop))?.tags ?? []).includes('barrio') && mentions(stop))
      if (seenEarlier) {
        report.evening = { kind: 'omitido', name: title }
        continue
      }
      if (same) {
        const roomToNext = floor5(nextStart - leg(coordsOf(previous), nextCoords) - previousEnd)
        // (Antes de cenar, el barrio puede pasar de su máximo de paseo: lo que se alarga es el aperitivo, hasta 90 min.)
        const extra = Math.min(roomToNext, stretchRoom(previous, placeByName.get(nameOf(previous)), tripDay.hours, { ignoreWalkMax: true }), zoneConfig?.minutos_max ?? maxMinutes)
        if (extra >= minMinutes) {
          stretch(previous, extra, tip)
          previous.stretched_free_walk = true
          report.evening = { kind: 'alarga', name: nameOf(previous), minutes: extra, title }
          break
        }
        continue
      }
      // (Un paseo no se coge a más de 15 min andando de lo último: de la nocturna del Puente al Campo de' Fiori no.)
      if (leg(coordsOf(previous), center) > MAX_PASEO_WALK) continue
      const start = ceil5(previousEnd + leg(coordsOf(previous), center))
      const minutes = Math.min(zoneConfig?.minutos_max ?? maxMinutes, floor5(nextStart - leg(center, nextCoords) - start))
      if (minutes < minMinutes) continue
      day.stops.push(
        paseoStop({
          title,
          start,
          minutes,
          coordinates: center,
          photoName: zoneConfig?.foto ?? null,
          photoAlternatives: zoneConfig?.foto_alternativas ?? null,
          porElCamino: zoneConfig?.por_el_camino ?? null,
          tip,
          why: 'Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.',
        }),
      )
      report.evening = { kind: 'paseo', name: title, minutes, previous: nameOf(previous) }
      break
    }
    sortStops()
  }
  // Sin espera a la cena: lo que no se ha podido llenar con un paseo (menos de 20 min) no se espera sentado; la cena se adelanta
  // (nunca antes de las 19:30, ni de las 20:30 en verano) y lo de después de cenar con ella.
  if (dinner && dinnerStart != null) {
    const finishing = day.stops.filter((stop) => (toMin(stop.suggested_time) ?? Infinity) < dinnerStart && !stop.after_dinner)
    const lastEnd = Math.max(0, ...finishing.map((stop) => toMin(stop.suggested_time) + (stop.duration_minutes ?? 0)))
    const lastStop = finishing.at(-1) ?? null
    const walk = lastStop && dinnerCoords ? leg(coordsOf(lastStop), dinnerCoords) : day.dinner_walk_minutes ?? 0
    const wait = dinnerStart - (lastEnd + walk)
    const floor = tripDay.written?.version === 'D' ? 20 * 60 + 30 : 19 * 60 + 30
    const earliest = Math.max(floor, Math.ceil((lastEnd + walk) / 15) * 15)
    if (wait > MAX_DINNER_WAIT && earliest < dinnerStart) {
      const shift = dinnerStart - earliest
      dinner.suggested_time = toHHMM(earliest)
      for (const stop of day.stops) {
        if (toMin(stop.suggested_time) >= dinnerStart) stop.suggested_time = toHHMM(toMin(stop.suggested_time) - shift)
      }
      for (const stop of day.stops) if (stop.after_dinner && toMin(stop.suggested_time) < earliest + DINNER_BLOCK_MINUTES) stop.suggested_time = toHHMM(earliest + DINNER_BLOCK_MINUTES)
      report.dinnerEarlier = shift
      sortStops()
    }
  }

  // ── A mitad de día ────────────────────────────────────────────────────────────────────────────────────────────────
  const keep = []
  for (const entry of day.free_times ?? []) {
    // Lo que tiene nombre y contenido propio (el descanso de después de comer, el paseo de antes del mirador) se queda.
    if (entry.descanso || entry.named) {
      keep.push(entry)
      continue
    }
    if (entry.minutes < minMinutes) continue
    const stops = day.stops.filter((stop) => !stop.is_night_experience && !stop.after_dinner)
    const lunch = (day.meals ?? []).find((meal) => meal.time === 'lunch')
    const afterLunch = entry.after === 'la comida'
    const beforeLunch = entry.before === 'la comida'
    const prev = afterLunch ? null : stops.find((stop) => nameOf(stop) === entry.after) ?? null
    const next = beforeLunch ? null : stops.find((stop) => nameOf(stop) === entry.before) ?? null
    const lunchStart = lunch ? toMin(lunch.suggested_time) : null
    const lunchEnd = lunch?.window_end ? toMin(lunch.window_end) : lunchStart != null ? lunchStart + 60 : null
    // De dónde y desde cuándo hay tiempo, y hasta dónde hay que llegar.
    const fromCoords = prev ? coordsOf(prev) : lunch && Number.isFinite(lunch.latitude) ? [lunch.latitude, lunch.longitude] : null
    const fromEnd = prev ? toMin(prev.suggested_time) + (prev.duration_minutes ?? 0) : lunchEnd
    const toCoords = next ? coordsOf(next) : lunch && Number.isFinite(lunch.latitude) ? [lunch.latitude, lunch.longitude] : null
    const toStart = next ? toMin(next.suggested_time) : lunchStart
    if (fromCoords == null || fromEnd == null || toStart == null) continue
    const room = toStart - fromEnd - leg(fromCoords, toCoords)
    if (room < minMinutes) continue
    // La zona: la de la parada de antes; si a la siguiente se llega en bus o metro, la de la siguiente.
    const prevZone = prev ? placeByName.get(nameOf(prev))?.zone ?? null : null
    const nextZone = next ? placeByName.get(nameOf(next))?.zone ?? null : null
    const walkZone = next?.transit && nextZone ? nextZone : prevZone ?? nextZone
    const walk = (destData.zone_walks ?? []).find((candidate) => candidate.zone === walkZone) ?? null
    const insertAt = (stop) => {
      day.stops.push(stop)
      sortStops()
    }
    // 1. Un sitio de camino, como parada.
    const idea = (entry.suggestions ?? []).find((item) => placeByName.has(item.name)) ?? null
    const ideaPlace = idea ? placeByName.get(idea.name) : null
    if (ideaPlace && Array.isArray(ideaPlace.coordinates)) {
      const walkIn = leg(fromCoords, ideaPlace.coordinates)
      const walkOut = leg(ideaPlace.coordinates, toCoords)
      let start = ceil5(fromEnd + walkIn)
      // (Lo que sobra del hueco se lo lleva el sitio, hasta su máximo de paseo: una calle, 45 min.)
      let minutes = Math.min(floor5(toStart - start - walkOut), Math.max(ideaPlace.duration_minutes ?? 30, paseoMaxOf(ideaPlace) ?? 30, 30))
      // Nunca pasada la hora de cierre de ese día (la Minerva, los sábados, cierra a las 19:00): se recorta hasta el cierre, y si no queda un mínimo, otro sitio.
      const closing = parseClosingMinutes(effectiveSchedule(ideaPlace, tripDay.hours ?? {}))
      if (closing != null && closing < 24 * 60) minutes = Math.min(minutes, floor5(closing - start))
      if (minutes >= minMinutes) {
        // Si aun así queda un hueco (el sitio no admite más), la parada de antes se alarga y el sitio se retrasa: sin esperas muertas.
        const left = floor5(toStart - start - walkOut - minutes)
        const room2 = prev ? stretchRoom(prev, placeByName.get(nameOf(prev)), tripDay.hours) : 0
        if (left >= minMinutes && room2 > 0) {
          // (Y el sitio no se retrasa más allá de su cierre.)
          const shiftMax = closing != null && closing < 24 * 60 ? Math.max(0, floor5(closing - start - minutes)) : Infinity
          const extra = Math.min(left, floor5(room2), shiftMax)
          if (extra >= minMinutes) {
          stretch(prev, extra)
          start += extra
          report.mid.push({ kind: 'alarga', name: nameOf(prev), minutes: extra, before: entry.before, after: entry.after })
          }
        }
        const stop = buildStop(ideaPlace, start, minutes, null)
        stop.why = destData.por_que_lugares?.[ideaPlace.name] && typeof destData.por_que_lugares[ideaPlace.name] === 'string' ? destData.por_que_lugares[ideaPlace.name] : stop.why ?? ''
        if (!(ideaPlace.ticket_info ?? []).some((line) => /de pago|se pagan?\b/i.test(line))) stop.free_access = true
        insertAt(stop)
        report.mid.push({ kind: 'sitio', name: ideaPlace.name, minutes, before: entry.before, after: entry.after })
        continue
      }
    }
    // 2. El paseo de la zona a la que se llega; en la misma zona que la parada de antes, esa parada se alarga.
    const canStretch = prev ? stretchRoom(prev, placeByName.get(nameOf(prev)), tripDay.hours) : 0
    if (walk && prevZone && walk.zone === prevZone && prev && canStretch >= minMinutes) {
      const extra = Math.min(floor5(room), maxMinutes, floor5(canStretch))
      stretch(prev, extra)
      report.mid.push({ kind: 'alarga', name: nameOf(prev), minutes: extra, before: entry.before, after: entry.after })
      continue
    }
    // (Un mismo sitio, una vez al día: si el paseo de esa zona ya está en el día, el rato va a la parada que se estira, INVARIANTES 467.)
    const walkTitle = walk ? `${PASEO_PREFIX}${String(walk.name).replace(/^Pasear por /i, '')}` : null
    if (walk && Array.isArray(walk.coordinates) && !day.stops.some((stop) => stop.is_free_walk && stop.name === walkTitle)) {
      const walkIn = leg(fromCoords, walk.coordinates)
      const walkOut = leg(walk.coordinates, toCoords)
      const start = ceil5(fromEnd + walkIn)
      const minutes = Math.min(maxMinutes, floor5(toStart - start - walkOut))
      if (minutes >= minMinutes) {
        const area = String(walk.name).replace(/^Pasear por /i, '')
        const photoPlace = (destData.places ?? []).find((place) => place.zone === walk.zone && (place.level ?? 3) <= 2 && !(place.tags ?? []).includes('mirador')) ?? null
        insertAt(
          paseoStop({
            title: `${PASEO_PREFIX}${area}`,
            start,
            minutes,
            coordinates: walk.coordinates,
            photoName: photoPlace?.name ?? null,
            tip: null,
            why: 'Sin plan fijo: dejarse llevar por las calles es la mejor forma de conocer un barrio.',
          }),
        )
        report.mid.push({ kind: 'paseo', name: `${PASEO_PREFIX}${area}`, minutes, before: entry.before, after: entry.after })
        continue
      }
    }
    // 3. Se recolocan las horas: la parada de antes se alarga (o, tras la comida, la comida; antes de la comida, la comida sale antes).
    if (prev && canStretch >= minMinutes) {
      const extra = Math.min(floor5(room), floor5(canStretch))
      stretch(prev, extra)
      report.mid.push({ kind: 'recoloca', name: nameOf(prev), minutes: extra, before: entry.before, after: entry.after })
    } else if (afterLunch && lunch && lunchEnd != null) {
      lunch.window_end = toHHMM(lunchEnd + floor5(room))
      report.mid.push({ kind: 'recoloca', name: 'la comida', minutes: floor5(room), before: entry.before, after: entry.after })
    } else if (beforeLunch && lunch && lunchStart != null) {
      lunch.suggested_time = toHHMM(lunchStart - floor5(room))
      report.mid.push({ kind: 'recoloca', name: 'la comida (antes)', minutes: floor5(room), before: entry.before, after: entry.after })
    }
  }
  if (keep.length > 0) day.free_times = keep
  else delete day.free_times
  sortStops()
  return report
}
