// Auditoría automática de un viaje (decisión del usuario, 2026-09-28): todo lo que antes se repasaba a mano, para
// cualquier destino. La usan la revisión (con su lista de casos: ruta, día, hora, parada) y el barrido (contando).
// Los días libres del viajero ("lo organizo yo") no se revisan.
import { closedOnDay, effectiveSchedule, parseHoursSessions, placeWindows } from '../../shared/routeEngine/openingHours.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { tituloQueNoSeCumple } from './textChecks.mjs'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

/** Verano: el tiempo libre con nombre antes del atardecer vale hasta aquí (decisión del usuario, 2026-09-27). */
const VERANO_ANTES_DEL_SOL_MAX = 150
/** Las horas que ve el viajero van al cuarto de hora: pueden correr hasta 7 min respecto a las del motor. */
const ROUNDING = 7

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const t2m = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const coordsOf = (item) => (item?.latitude != null ? [item.latitude, item.longitude] : null)
const endCoordsOf = (item) => (item?.end_latitude != null ? [item.end_latitude, item.end_longitude] : coordsOf(item))

/** Los tipos, con el título que sale en el recuento (en este orden). */
export const TIPOS_AUDITORIA = {
  repetido_dia: 'Lugar repetido en el mismo día',
  repetido_viaje: 'Lugar repetido otro día (salvo nocturnas y revisitas)',
  pool_fuera: 'Lugar del pool fuera de la ruta',
  fuera_de_horario: 'Parada fuera de su horario real de ese día',
  atardecer_tarde: 'Mirador de atardecer después del sol (o texto de atardecer de noche)',
  tramo_largo: 'Tramo de más de 25 min andando sin transporte',
  hueco: 'Hueco de más de 30 min sin nada entre dos paradas',
  libre_largo: 'Tiempo libre de más de 60 min',
  libre_pisa_comida: 'Tiempo libre que pisa la comida o la cena',
  cena_espera: 'Cena que empieza más de 20 min después de llegar, sin motivo',
  zigzag: 'Zigzag: volver a una zona que ya se dejó ese día',
  nivel_camino: 'Nivel 1-2 como "Por el camino"',
  nivel_idea: 'Nivel 1-2 como "idea" de tiempo libre',
  duracion_corta: 'Imprescindible de menos de 20 min',
  fuera_minutos: '"Por fuera" con un tiempo distinto de su minutos_fuera',
  aviso_promete: 'Aviso de fecha que promete algo que la ruta no hace',
  aviso_lugar_ajeno: 'Aviso de fecha que nombra un lugar que no está en el viaje',
  aviso_repetido: 'Avisos de fecha repetidos',
  titulo_hora: 'Texto de hora que no coincide con la hora real',
  nota_promete: 'Nota de temporada que promete algo que la ruta no hace',
}

/**
 * @param {object} D  el JSON del destino
 * @param {object[]} days  los días del viaje tal como salen del motor (buildDayBlockV3), en orden
 * @param {{ startIso?: string|null, poolNames?: string[], leg?: (a, b) => number|null, label?: string, dinnerWindowStart?: number }} options
 * @returns {{ tipo: string, donde: string, detalle: string }[]}
 */
export function auditarViaje(D, days, options = {}) {
  const { startIso = null, poolNames = [], leg = () => null, label = '', dinnerWindowStart = 20 * 60 } = options
  const byName = new Map((D.places ?? []).map((place) => [place.name, place]))
  const levelOf = (name) => byName.get(name)?.level ?? 3
  const casos = []
  const add = (tipo, n, hora, parada, detalle = '') => casos.push({ tipo, donde: `${label ? `${label}, ` : ''}día ${n}${hora ? `, ${hora}` : ''}${parada ? ` ${parada}` : ''}`, detalle })
  const seenOnDay = new Map()
  const allNames = new Set()

  for (const [index, day] of days.entries()) {
    if (!day?.stops?.length || day.type === 'excursion' || day.is_free_day || day.free_day) continue
    const n = day.day_number ?? index + 1
    const iso = startIso ? addDays(startIso, index) : null
    const hours = iso ? { dateIso: iso, weekday: WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()], sunset: null } : {}
    const sunset = iso ? sunsetFor(D, { dateIso: iso }) : null
    const dayStops = day.stops.filter((stop) => !stop.is_night_experience)
    const nameOf = (stop) => stop.place_name ?? stop.name
    const lunch = day.meals?.find((meal) => meal.time === 'lunch')
    const dinner = day.meals?.find((meal) => meal.time === 'dinner')
    const lunchStart = t2m(lunch?.suggested_time)
    const lunchEnd = t2m(lunch?.window_end) ?? lunchStart
    const dinnerStart = t2m(dinner?.suggested_time)
    for (const stop of day.stops) allNames.add(nameOf(stop).replace(/\s*\(noche\)$/, ''))

    // Repetidos.
    const inDay = new Map()
    for (const stop of dayStops) {
      const name = nameOf(stop)
      if (inDay.has(name)) add('repetido_dia', n, stop.suggested_time, name, `también a las ${inDay.get(name)}`)
      else inDay.set(name, stop.suggested_time)
      if (!stop.is_revisit && !stop.pass_through && !stop.is_pass_by) {
        if (seenOnDay.has(name) && seenOnDay.get(name) !== n) add('repetido_viaje', n, stop.suggested_time, name, `ya en el día ${seenOnDay.get(name)}`)
        else seenOnDay.set(name, n)
      }
    }

    let previous = null
      for (const stop of dayStops) {
      const name = nameOf(stop)
      const place = byName.get(name)
      const start = t2m(stop.suggested_time)
      const end = start + (stop.duration_minutes ?? 0)
      const outside = stop.visit_mode === 'fuera' || stop.outside
      const passing = stop.pass_through || stop.is_pass_by
      // Horario real de ese día (con fechas): cerrado ese día, o la visita fuera de sus franjas.
      if (place && iso && !outside && !passing && start != null) {
        if (closedOnDay(place, hours.weekday, iso)) add('fuera_de_horario', n, stop.suggested_time, name, 'ese día cierra')
        else {
          const text = placeWindows(place, { ...hours, sunset })?.join(', ') ?? effectiveSchedule(place, { ...hours, sunset })
          const sessions = parseHoursSessions(text)
          if (sessions.length > 0 && !sessions.some((window) => start >= window.open - ROUNDING && end <= window.close + ROUNDING)) add('fuera_de_horario', n, stop.suggested_time, name, `abierto ${text}`)
        }
      }
      // Atardecer: el mirador que llega después del sol, o un texto de atardecer ya de noche.
      if (sunset != null && start != null) {
        if (stop.sunset_minutes != null && start > sunset + ROUNDING) add('atardecer_tarde', n, stop.suggested_time, name, `sol a las ${Math.floor(sunset / 60)}:${String(sunset % 60).padStart(2, '0')}`)
        if (!stop.night_view && stop.sunset_minutes == null && /\batardecer\b/i.test(stop.why ?? '') && start > sunset + 15) add('atardecer_tarde', n, stop.suggested_time, name, 'texto de atardecer ya de noche')
      }
      // Tramo largo sin transporte (desde la comida si va en medio).
      if (previous) {
        const fromLunch = lunch && lunchStart != null && lunchStart >= t2m(previous.suggested_time) + (previous.duration_minutes ?? 0) - 1 && lunchStart < start
        const walk = leg(fromLunch ? coordsOf(lunch) : endCoordsOf(previous), coordsOf(stop))
        if (!stop.transit && walk != null && walk > 25) add('tramo_largo', n, stop.suggested_time, name, `${Math.round(walk)} min andando`)
        // Hueco sin nada (sin la comida en medio y sin tiempo libre con nombre).
        const prevEnd = t2m(previous.suggested_time) + (previous.duration_minutes ?? 0)
        const named = (day.free_times ?? []).some((entry) => entry.before === name)
        if (!fromLunch && !named && start - prevEnd - (walk ?? 0) > 30) add('hueco', n, stop.suggested_time, name, `${Math.round(start - prevEnd - (walk ?? 0))} min`)
      }
      // Nivel 1-2 "Por el camino".
      if (passing && !outside && levelOf(name) <= 2) add('nivel_camino', n, stop.suggested_time, name)
      // Duraciones.
      if (levelOf(name) === 1 && !outside && !passing && (stop.duration_minutes ?? 0) < 20) add('duracion_corta', n, stop.suggested_time, name, `${stop.duration_minutes} min`)
      if (stop.visit_mode === 'fuera' && place?.minutos_fuera != null && stop.duration_minutes !== place.minutos_fuera) add('fuera_minutos', n, stop.suggested_time, name, `${stop.duration_minutes} min (JSON: ${place.minutos_fuera})`)
      // Zigzag (A → B → A): volver a menos de 300 m de una parada anterior después de haberse ido a más de 1,2 km
      // de ella (la cena aparte). Por distancia, no por zonas: el Teatro de Marcelo está pegado al Ghetto.
      const here = coordsOf(stop)
      const index = dayStops.indexOf(stop)
      // (El mirador del atardecer y lo de noche vuelven a propósito: el Pincio sobre la Piazza del Popolo.)
      const sunsetStop = dayStops.find((other) => other.sunset_minutes != null || other.night_view)
      const nearSunset = sunsetStop && coordsOf(sunsetStop) && here && straightLineMeters(here, coordsOf(sunsetStop)) < 500
      if (here && stop.sunset_minutes == null && !stop.night_view && !nearSunset) {
        for (let i = 0; i < index - 1; i++) {
          const there = coordsOf(dayStops[i])
          if (!there || straightLineMeters(here, there) > 300) continue
          const away = dayStops.slice(i + 1, index).some((other) => coordsOf(other) && straightLineMeters(coordsOf(other), there) > 1200)
          if (away) {
            add('zigzag', n, stop.suggested_time, name, `vuelve junto a ${nameOf(dayStops[i])}`)
            break
          }
        }
      }
      previous = stop
    }

    // Tiempo libre: largo, o que pisa la comida o la cena; ideas de nivel 1-2.
    const libres = [
      ...(day.free_times ?? []).map((entry) => ({ minutes: entry.minutes, before: entry.before, ideas: entry.suggestions ?? [] })),
      ...(day.aperitivo ? [{ minutes: day.aperitivo.minutes, before: 'la cena', ideas: day.aperitivo.suggestions ?? [], evening: true }] : []),
      ...(day.free_afternoon ? [{ minutes: day.free_afternoon.minutes, before: 'la cena', ideas: day.free_afternoon.suggestions ?? [], evening: true }] : []),
    ]
    const lastEnd = Math.max(0, ...day.stops.filter((stop) => dinnerStart == null || t2m(stop.suggested_time) < dinnerStart).map((stop) => t2m(stop.suggested_time) + (stop.duration_minutes ?? 0)))
    for (const libre of libres) {
      const beforeSun = dayStops.some((stop) => nameOf(stop) === libre.before && stop.sunset_minutes != null) && sunset != null && sunset >= 19 * 60
      if (libre.minutes > 60 && !libre.evening && !(beforeSun && libre.minutes <= VERANO_ANTES_DEL_SOL_MAX)) add('libre_largo', n, '', `antes de ${libre.before}`, `${libre.minutes} min`)
      if (libre.evening && dinnerStart != null && lastEnd + libre.minutes + (day.dinner_walk_minutes ?? 0) > dinnerStart + 1) add('libre_pisa_comida', n, '', 'antes de la cena', `acaba ${lastEnd + libre.minutes + (day.dinner_walk_minutes ?? 0) - dinnerStart} min tarde`)
      for (const idea of libre.ideas) if (levelOf(idea.name) <= 2) add('nivel_idea', n, '', idea.name, `idea de tiempo libre antes de ${libre.before}`)
    }
    // La comida: el tiempo libre de antes no la pisa.
    for (const entry of day.free_times ?? []) if (entry.before === 'la comida' && lunchStart != null && (lunchEnd ?? lunchStart) < lunchStart) add('libre_pisa_comida', n, '', 'antes de la comida')
    // Cena que espera sin motivo: llega (con el paseo) y la cena empieza más de 20 min después, ya dentro de su franja.
    if (dinnerStart != null) {
      const arrive = lastEnd + (day.dinner_walk_minutes ?? 0)
      const idle = dinnerStart - arrive - (day.aperitivo?.minutes ?? 0) - (day.free_afternoon?.minutes ?? 0)
      if (arrive >= dinnerWindowStart && idle > 20) add('cena_espera', n, dinner.suggested_time, 'cena', `${idle} min de espera`)
    }
    // Títulos y textos con hora.
    for (const aviso of tituloQueNoSeCumple(day)) add('titulo_hora', n, '', '', aviso)
  }

  // Lo del pool que no ha entrado.
  for (const day of days) for (const item of day?.not_included ?? []) if (item.from_pool || poolNames.includes(item.name)) add('pool_fuera', item.day_number ?? day.day_number ?? '?', '', item.name, item.reason ?? '')

  // Avisos de fechas: promesas que no se cumplen, lugares que no están en el viaje, repetidos.
  const notices = days.find((day) => day?.date_notices?.length)?.date_notices ?? []
  const levelPlaces = (D.places ?? []).filter((place) => (place.level ?? 3) <= 2)
  const mentioned = (text) => levelPlaces.filter((place) => text.includes(place.name) || (place.short_name && text.includes(place.short_name))).map((place) => place.name)
  for (const notice of notices) {
    const n = notice.day_number ?? '—'
    const texts = notice.texts ?? []
    // Repetidos: el mismo texto dos veces, o dos textos que cierran el mismo lugar.
    const closes = new Map()
    for (const [i, text] of texts.entries()) {
      if (texts.indexOf(text) !== i) add('aviso_repetido', n, '', notice.title, text.slice(0, 80))
      for (const name of mentioned(text)) if (/cierra|cerrad/i.test(text)) {
        if (closes.has(name)) add('aviso_repetido', n, '', notice.title, `${name} cierra en dos frases`)
        closes.set(name, i)
      }
      for (const name of mentioned(text)) if (!allNames.has(name) && !/^Si tu viaje coincide/.test(text)) add('aviso_lugar_ajeno', n, '', notice.title, name)
    }
    // Promesa de sugerencia: la del JSON (con hora) tiene que estar en la ruta de ese día.
    const entry = (D.fechas_especiales?.fechas ?? []).find((candidate) => notice.id?.endsWith(`:${candidate.id}`))
    const sug = entry?.sugerencia
    if (sug?.hora && texts.some((text) => /Hemos (colocado|dejado|puesto tu noche)/.test(text))) {
      const dayIndex = sug.dia && startIso ? days.findIndex((candidate, i) => addDays(startIso, i).slice(5) === sug.dia) : days.findIndex((candidate) => candidate?.day_number === notice.day_number)
      const day = days[dayIndex]
      const placed = (day?.stops ?? []).some((stop) => (stop.place_name ?? stop.name) === sug.lugar || stop.name === sug.lugar)
      if (!placed) add('aviso_promete', n, '', notice.title, `${sug.lugar} no está en la ruta de ese día`)
    }
  }
  // Nota de temporada: "veas Roma iluminada" con alguna nocturna; "a primera hora" con la mayoría de los días
  // empezando por un imprescindible antes de las 10:00.
  const note = days.find((day) => day?.season_note)?.season_note
  if (note) {
    const cityDays = days.filter((day) => day?.stops?.length && day.type !== 'excursion')
    if (/iluminada/.test(note.text) && !cityDays.some((day) => day.stops.some((stop) => stop.is_night_experience || stop.night_view))) add('nota_promete', '—', '', 'Nota de temporada', 'promete Roma iluminada y ninguna noche lleva nocturna')
    if (/primera hora/.test(note.text)) {
      const early = cityDays.filter((day) => {
        const first = day.stops.find((stop) => !stop.is_night_experience && !stop.is_break && !stop.pass_through)
        return first && levelOf(first.place_name ?? first.name) === 1 && t2m(first.suggested_time) < 10 * 60
      })
      if (early.length <= cityDays.length / 2) add('nota_promete', '—', '', 'Nota de temporada', `promete visitas a primera hora y solo ${early.length} de ${cityDays.length} días empiezan así`)
    }
  }
  return casos
}
