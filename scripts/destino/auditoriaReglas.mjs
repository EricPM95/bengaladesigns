import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { effectiveSchedule, parseHoursSessions } from '../../shared/routeEngine/openingHours.js'

// Comprobaciones que le faltaban a la prueba (REGLAS_RUTAS, parte 6): las reglas 9, 10, 17, 21, 22 y 25, y la hora fija de las reservas.
// Se llaman desde prueba365.mjs, después de auditarViaje. No arreglan nada: cuentan y dan ejemplos.
const t2m = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const WEEKDAYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

export const TIPOS_REGLAS = {
  joya_tarde: 'R-9 · Una joya que sale por primera vez después del día 3 (después del día 2 en viajes de 2 días)',
  dos_visitas_grandes: 'R-10 · Dos visitas grandes (grupo con más de 90 min por dentro) el mismo día',
  grupo_partido: 'R-10 · Un grupo que nunca se separa, partido entre dos días',
  se_llena_tarde: 'R-17 · Un sitio que se llena (lista del destino), después de las 9:30',
  verano_al_sol: 'R-21 · Julio o agosto: una parada al aire libre entre las 14:00 y las 16:30',
  hora_no_10: 'R-22 · Una hora que no es de 10 en 10 (salvo las fijas y las paradas pegadas a menos de 200 m)',
  duracion_no_5: 'R-22 · Una duración que no es de 5 en 5',
  fuera_sin_vista: 'R-25 · Una parada «por fuera» de un sitio que por fuera no se ve (los Museos Vaticanos)',
  experiencia_sin_efecto: 'R-13 · Una experiencia elegida que no cambia nada del viaje (mismo viaje con y sin ella)',
  calle_parada: 'B.2 · Una calle como parada con su propio tiempo (debe ir dentro de un paseo o como «De camino»)',
  min_max_pasado: 'R-38 · Una parada que pasa su máximo (`min_max`)',
  acaba_tras_cierre: 'R-1 · Una visita por dentro que acaba después del cierre (debería acortarse, mínimo 20 min)',
  acortada_menos_20: 'R-1 · Una visita por dentro acortada a menos de 20 min',
  mirador_fuera_de_hora: 'R-16 · Un mirador de atardecer a más de 30 min del sol',
  espera_mas_90: 'R-16 · Una espera de más de 90 min entre dos paradas',
  cena_lejos_nocturna: 'R-37 · La cena a más de 20 min andando de la nocturna y sin transporte',
  noche_pasa_limite: 'R-41 · Una nocturna que acaba después de la hora límite de la noche',
  camino_sin_nombre: 'R-40 · Un «De camino» cuyo nombre no empieza por «De camino»',
  camino_cierra_pool: 'R-40 · Un «De camino» que cierra un lugar del pool',
  experiencia_fuera_de_zona: 'B.3 · Una parada de experiencia fuera de la zona del día',
  no_incluido_pero_visto: 'R-39 · Un «No incluido» que sí sale en la muestra de una parada',
  restaurante_zona: 'B.4 · Un restaurante cuya zona no es la de sus coordenadas',
  hora_fija_movida: 'R-2 · Una entrada reservada que no sale a su hora (o que ha desaparecido)',
}

/**
 * @param {object} D  el JSON del destino
 * @param {object[]} days  los días del viaje tal como salen del motor
 * @param {{ startIso?: string|null, label?: string, month?: number|null, reservas?: Record<string,string> }} options
 */
export function auditarReglas(D, days, { startIso = null, label = '', reservas = null, poolNames = [], leg = () => null } = {}) {
  const casos = []
  const add = (tipo, n, hora, parada, detalle = '') => casos.push({ tipo, donde: `${label ? `${label}, ` : ''}${n === 0 ? 'todo el viaje' : `día ${n}`}${hora ? `, ${hora}` : ''}${parada ? ` ${parada}` : ''}`, detalle })
  const byName = new Map((D.places ?? []).map((place) => [place.name, place]))
  const nameOf = (stop) => stop.place_name ?? stop.name
  const config = D.destination_config ?? {}
  const real = days.map((day, index) => ({ day, n: day?.day_number ?? index + 1, index })).filter(({ day }) => day?.stops?.length && day.type !== 'excursion' && !day.is_free_day && !day.free_day)
  const hasOutsideView = (place) => !place || place.minutos_fuera != null || Boolean(place.pass_by) || place.type === 'exterior'

  // R-9 Lo mejor, primero: cada joya sale por primera vez el día 3 como tarde (el 2 en viajes de 2 días).
  const limit = days.length <= 2 ? 2 : 3
  if (days.length >= 3) {
    for (const joya of D.joyas ?? []) {
      const id = byName.get(joya)?.id
      const first = real.find(({ day }) => day.stops.some((stop) => !stop.is_night_experience && !stop.night_view && (nameOf(stop) === joya || (stop.muestra ?? []).includes(id))))
      if (first && first.n > limit) add('joya_tarde', 0, '', joya, `sale por primera vez el día ${first.n}`)
    }
  }

  // R-10 Cada día tiene un sentido: una sola visita grande (un grupo cuenta como una) y un grupo no se parte entre días.
  const groupDays = new Map()
  for (const { day, n } of real) {
    const big = new Map()
    for (const stop of day.stops) {
      if (stop.is_night_experience || stop.night_view || stop.is_break || stop.visit_mode === 'fuera' || stop.pass_through) continue
      const place = byName.get(nameOf(stop))
      if (!place || place.type !== 'interior') continue
      const key = place.group ?? place.name
      big.set(key, (big.get(key) ?? 0) + (stop.duration_minutes ?? 0))
      if (place.group) groupDays.set(`${place.group}|${nameOf(stop)}`, [...(groupDays.get(`${place.group}|${nameOf(stop)}`) ?? []), n])
    }
    const bigGroups = [...big.entries()].filter(([, minutes]) => minutes > 90)
    if (bigGroups.length > 1) add('dos_visitas_grandes', n, '', bigGroups.map(([key, minutes]) => `${key} (${minutes} min)`).join(' + '))
  }
  for (const [groupId, group] of Object.entries(D.groups ?? {})) {
    if (group.breakable_if_short !== false && !(group.inseparable ?? []).length) continue
    const members = group.places ?? []
    const daysOfMember = members.map((name) => [name, real.filter(({ day }) => day.stops.some((stop) => nameOf(stop) === name && stop.visit_mode !== 'fuera' && !stop.is_night_experience && !stop.night_view && !stop.pass_through)).map(({ n }) => n)]).filter(([, list]) => list.length > 0)
    const all = new Set(daysOfMember.flatMap(([, list]) => list))
    // (Los que van en días distintos, con los dos por dentro.)
    // (Dos miembros distintos del grupo, sin ningún día en común: el grupo está partido. El mismo sitio dos días es otra regla, la 5.)
    const split = daysOfMember.some(([, a], i) => daysOfMember.some(([, b], j) => j > i && !a.some((day) => b.includes(day))))
    if (group.breakable_if_short === false && all.size > 1 && split) add('grupo_partido', 0, '', group.name ?? groupId, daysOfMember.map(([name, list]) => `${name}: día ${list.join(',')}`).join(' · '))
  }

  // R-17 A primera hora, lo que luego se llena (lista del destino).
  for (const name of config.se_llenan ?? []) {
    for (const { day, n } of real) {
      const stop = day.stops.find((candidate) => nameOf(candidate) === name && !candidate.is_night_experience && !candidate.night_view && !candidate.pass_through)
      if (stop && t2m(stop.suggested_time) > 9 * 60 + 30) add('se_llena_tarde', n, stop.suggested_time, name)
    }
  }

  // R-21 Julio y agosto: nada al aire libre de 14:00 a 16:30.
  for (const { day, n, index } of real) {
    const month = startIso ? Number(addDays(startIso, index).slice(5, 7)) : null
    if (month !== 7 && month !== 8) continue
    for (const stop of day.stops) {
      const start = t2m(stop.suggested_time)
      if (start == null || start < 14 * 60 || start >= 16 * 60 + 30) continue
      if (stop.is_night_experience || stop.night_view || stop.is_break || stop.pass_through) continue
      const place = byName.get(nameOf(stop))
      if (!place) continue
      const openAir = place.type === 'exterior' || stop.visit_mode === 'fuera'
      if (openAir && stop.hora_tipo !== 'reserva' && stop.hora_tipo !== 'turno') add('verano_al_sol', n, stop.suggested_time, nameOf(stop), 'al aire libre en las horas de calor')
    }
  }

  // R-22 Horas de 10 en 10 (las fijas y las pegadas, no) y duraciones de 5 en 5.
  const metersApart = (a, b) => {
    const rad = Math.PI / 180
    const dLat = (b[0] - a[0]) * rad
    const dLng = (b[1] - a[1]) * rad
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2
    return 2 * 6371000 * Math.asin(Math.sqrt(h))
  }
  for (const { day, n } of real) {
    day.stops.forEach((stop, index) => {
      if (stop.is_night_experience || stop.is_break) return
      const start = t2m(stop.suggested_time)
      if (start == null) return
      const previous = day.stops[index - 1]
      const chained = previous && Number.isFinite(previous.latitude) && Number.isFinite(stop.latitude) && metersApart([previous.latitude, previous.longitude], [stop.latitude, stop.longitude]) < 200
      const fixed = stop.hora_tipo != null || stop.sunset_minutes != null || stop.is_free_tour || stop.reserved_entry || stop.night_view
      // (Pegada en el tiempo: el motor no pone una parada antes de que acabe la anterior con su paseo, ni la retrasa más de lo que deja una hora fija
      // de después; en esos casos la hora es de 5 en 5. Se mide con el paseo en línea recta a 75 m/min, que es como lo mira el motor.)
      const walk = (a, b) => (a && b && Number.isFinite(a.latitude) && Number.isFinite(b.latitude) ? metersApart([a.latitude, a.longitude], [b.latitude, b.longitude]) / 75 : null)
      const prevEnd = previous ? t2m(previous.suggested_time) + (previous.duration_minutes ?? 0) : null
      const tightBefore = prevEnd != null && !previous.is_night_experience && walk(previous, stop) != null && start - prevEnd <= walk(previous, stop) + 6
      const next = day.stops[index + 1]
      const nextFixed = next && (next.hora_tipo != null || next.sunset_minutes != null || next.is_free_tour || next.reserved_entry)
      const tightAfter = nextFixed && walk(stop, next) != null && t2m(next.suggested_time) - (start + (stop.duration_minutes ?? 0)) <= walk(stop, next) + 6
      if (start % 10 !== 0 && !fixed && !chained && !tightBefore && !tightAfter) add('hora_no_10', n, stop.suggested_time, nameOf(stop))
      if ((stop.duration_minutes ?? 0) % 5 !== 0) add('duracion_no_5', n, stop.suggested_time, nameOf(stop), `${stop.duration_minutes} min`)
    })
  }

  // R-25 «Por fuera» solo donde se ve algo desde la calle.
  for (const { day, n } of real) {
    for (const stop of day.stops) {
      if (stop.visit_mode !== 'fuera') continue
      const place = byName.get(nameOf(stop))
      // (Junto a un imprescindible, un sitio cerrado se ve por fuera: `al_lado`, `no_abre`, `ya_cerrado`. Eso no cuenta.)
      if (place && !hasOutsideView(place) && !['al_lado', 'no_abre', 'ya_cerrado'].includes(stop.outside_kind)) add('fuera_sin_vista', n, stop.suggested_time, nameOf(stop), stop.outside_kind ?? '')
    }
  }

  // R-2 Una hora fija no se mueve ni se quita: la entrada reservada sale a su hora.
  for (const [place, hour] of Object.entries(reservas ?? {})) {
    const at = t2m(hour)
    const found = real.flatMap(({ day, n }) => day.stops.filter((stop) => nameOf(stop) === place && stop.visit_mode !== 'fuera').map((stop) => ({ stop, n })))
    if (found.length === 0) add('hora_fija_movida', 0, '', place, `reservada a las ${hour} y no sale por dentro`)
    else if (!found.some(({ stop }) => Math.abs(t2m(stop.suggested_time) - at) <= 5)) add('hora_fija_movida', found[0].n, found[0].stop.suggested_time, place, `reservada a las ${hour}`)
  }
// ── Reglas 38 a 42 y A.1 a A.8 del encargo del 5-oct ─────────────────────────────────────────────────
  const dateOf = (index) => (startIso ? addDays(startIso, index) : null)
  const idToName = new Map((D.places ?? []).filter((place) => place.id).map((place) => [place.id, place.name]))
  const nightLimit = (iso) => {
    const cfg = config.noche_limite
    if (!cfg) return null
    const month = iso ? String(Number(iso.slice(5, 7))) : null
    return t2m((month && cfg.meses?.[month]) ?? cfg.hora)
  }
  for (const { day, n, index } of real) {
    const iso = dateOf(index)
    const sunset = iso ? sunsetFor(D, { dateIso: iso }) : null
    const stops = day.stops
    // R-38 · Cada parada tiene su máximo (`min_max`).
    for (const stop of stops) {
      const place = byName.get(nameOf(stop))
      if (place?.min_max != null && (stop.duration_minutes ?? 0) > place.min_max && !stop.is_free_tour) add('min_max_pasado', n, stop.suggested_time, nameOf(stop), `${stop.duration_minutes} min y su máximo es ${place.min_max}`)
    }
    // R-1 (A.1) · Nada por dentro acaba después del cierre; nada acortado baja de 20 min.
    if (iso) {
      const hours = { dateIso: iso, weekday: WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()], sunset }
      for (const stop of stops) {
        const place = byName.get(nameOf(stop))
        const start = t2m(stop.suggested_time)
        if (!place || stop.visit_mode !== 'dentro' || start == null || stop.is_night_experience) continue
        const sessions = parseHoursSessions(effectiveSchedule(place, hours))
        const session = sessions.find((item) => start >= item.open && start < item.close)
        if (session && start + (stop.duration_minutes ?? 0) > session.close) add('acaba_tras_cierre', n, stop.suggested_time, nameOf(stop), `acaba ${start + stop.duration_minutes} y cierra a las ${session.close}`)
        if (session && (stop.duration_minutes ?? 0) < 20 && (place.duration_minutes ?? 0) >= 20 && stop.hora_tipo == null && session.close - (start + (stop.duration_minutes ?? 0)) <= 5) add('acortada_menos_20', n, stop.suggested_time, nameOf(stop), `${stop.duration_minutes} min`)
      }
    }
    // R-16 (A.3) · El mirador, a ±30 min del atardecer; ninguna espera de más de 90 min.
    if (sunset != null) {
      for (const stop of stops) {
        if (stop.sunset_minutes == null || stop.night_view) continue
        const start = t2m(stop.suggested_time)
        const end = start + (stop.duration_minutes ?? 0)
        if (start > sunset + 30 || end < sunset - 30) add('mirador_fuera_de_hora', n, stop.suggested_time, nameOf(stop), `sol a las ${Math.floor(sunset / 60)}:${String(sunset % 60).padStart(2, '0')}`)
      }
    }
    const mealTimes = (day.meals ?? []).map((meal) => t2m(meal.suggested_time)).filter((time) => time != null)
    stops.forEach((stop, i) => {
      const next = stops[i + 1]
      if (!next || stop.is_night_experience || next.is_night_experience) return
      const gap = t2m(next.suggested_time) - (t2m(stop.suggested_time) + (stop.duration_minutes ?? 0))
      if (gap > 90 && !mealTimes.some((time) => time >= t2m(stop.suggested_time) && time <= t2m(next.suggested_time)) && next.hora_tipo == null && !next.is_free_tour) add('espera_mas_90', n, stop.suggested_time, nameOf(stop), `${gap} min hasta ${nameOf(next)}`)
    })
    for (const free of day.free_times ?? []) if ((free.minutes ?? 0) > 90 && !/^Descanso/.test(free.title ?? '')) add('espera_mas_90', n, '', free.before ?? '', `${free.minutes} min libres`)
    // R-37 (A.4) · La cena a 20 min andando o menos de la nocturna, o con su transporte.
    const dinner = (day.meals ?? []).find((meal) => meal.time === 'dinner')
    const firstNight = stops.find((stop) => stop.is_night_experience && !stop.before_dinner && Number.isFinite(stop.latitude))
    if (dinner && firstNight && Number.isFinite(dinner.latitude) && !firstNight.transit) {
      const from = [dinner.latitude, dinner.longitude]
      const to = [firstNight.latitude, firstNight.longitude]
      const walk = leg(from, to) ?? metersApart(from, to) / 75 * 1.25
      if (walk > 20) add('cena_lejos_nocturna', n, firstNight.suggested_time, nameOf(firstNight), `~${Math.round(walk)} min andando desde la cena`)
    }
    // R-41 (A.6) · Nada acaba después de la hora límite de la noche.
    const limit = nightLimit(iso)
    if (limit != null) for (const stop of stops) {
      const end = t2m(stop.suggested_time) + (stop.duration_minutes ?? 0)
      if (stop.is_night_experience && end > limit) add('noche_pasa_limite', n, stop.suggested_time, nameOf(stop), `acaba a las ${Math.floor(end / 60)}:${String(end % 60).padStart(2, '0')}`)
    }
    // B.2 · Una calle no es una parada: va dentro de un paseo o como «De camino».
    for (const stop of stops) {
      const place = byName.get(nameOf(stop))
      if (place && (place.tags ?? []).includes('calle') && !stop.pass_through && !stop.is_free_walk && stop.sunset_minutes == null && !stop.is_night_experience && !/^Pasea/i.test(stop.display_title ?? '') && !/atardecer|puesta de sol/i.test(`${stop.why ?? ''} ${stop.tip ?? ''}`)) (sunset != null && Math.abs(t2m(stop.suggested_time) - sunset) <= 60) || add('calle_parada', n, stop.suggested_time, nameOf(stop), `${stop.duration_minutes} min`)
    }
    // R-40 (A.7) · Un «De camino» lleva su nombre y no cierra el pool.
    for (const stop of stops) {
      if (stop.pass_through && !String(stop.display_name ?? '').startsWith('De camino')) add('camino_sin_nombre', n, stop.suggested_time, nameOf(stop))
      if (stop.pass_through && poolNames.includes(nameOf(stop)) && !stops.some((other) => other !== stop && nameOf(other) === nameOf(stop) && !other.pass_through && !other.is_night_experience) && !(day.not_included ?? []).some((item) => item.name === nameOf(stop))) add('camino_cierra_pool', n, stop.suggested_time, nameOf(stop), 'el «De camino» no es una visita del pool')
    }
    // B.3 · Las experiencias van en la zona del día.
    const zonesOfDay = new Set(stops.filter((stop) => !stop.is_night_experience && !stop.pass_through).map((stop) => byName.get(nameOf(stop))?.zone).filter(Boolean))
    for (const label of day.curated_day?.variants ?? []) {
      const match = /^lista:[^:]+:(.+)$/.exec(label)
      if (!match) continue
      const place = byName.get(match[1])
      const stop = stops.find((item) => nameOf(item) === match[1])
      if (!stop || !place?.zone) continue
      const others = new Set(stops.filter((item) => item !== stop && !item.is_night_experience && !item.pass_through).map((item) => byName.get(nameOf(item))?.zone).filter(Boolean))
      if (!others.has(place.zone)) add('experiencia_fuera_de_zona', n, stop.suggested_time, match[1], `su zona es ${place.zone} y el día está en ${[...others].join(', ')}`)
    }
    void zonesOfDay
  }
  // R-39 (A.5) · Nada de «No incluido» está en la `muestra` de una parada del viaje.
  const shownIds = new Set(real.flatMap(({ day }) => day.stops.flatMap((stop) => stop.muestra ?? [])))
  for (const { day, n } of real) for (const item of day.not_included ?? []) {
    if (item.is_notice) continue
    const id = byName.get(item.name)?.id
    if (id && shownIds.has(id)) add('no_incluido_pero_visto', n, '', item.name, 'sale en la muestra de una parada')
  }

  return casos
}

/** B.4 · La zona de cada restaurante (su etiqueta) contra sus coordenadas: los tres sitios más cercanos tienen que ser de una zona que esa etiqueta admite. */
const ETIQUETA_ZONAS = [
  [/centro hist|judío|judio/i, ['centro_historico']],
  [/trastevere/i, ['trastevere']],
  [/testaccio/i, ['testaccio', 'aventino']],
  [/monti|esquilino|termini|coliseo|fori/i, ['roma_antigua', 'esquilino']],
  [/vaticano|prati|borgo/i, ['vaticano']],
  [/trevi|popolo|tridente|spagna/i, ['centro_historico', 'villa_borghese']],
  [/veneto|salario/i, ['villa_borghese']],
  [/san giovanni/i, ['san_giovanni']],
  [/venezia/i, ['roma_antigua', 'centro_historico']],
]
export function auditarRestaurantes(D) {
  const casos = []
  const places = (D.places ?? []).filter((place) => Array.isArray(place.coordinates) && place.zone)
  const meters = (a, b) => {
    const rad = Math.PI / 180
    const dLat = (b[0] - a[0]) * rad
    const dLng = (b[1] - a[1]) * rad
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2
    return 2 * 6371000 * Math.asin(Math.sqrt(h))
  }
  for (const restaurant of D.restaurants ?? []) {
    const at = restaurant.coordinates ? [restaurant.coordinates.lat, restaurant.coordinates.lng] : null
    if (!at || !restaurant.zone) continue
    const allowed = ETIQUETA_ZONAS.filter(([re]) => re.test(restaurant.zone)).flatMap(([, zones]) => zones)
    if (allowed.length === 0) continue
    const sorted = places.map((place) => ({ place, m: meters(at, place.coordinates) })).sort((a, b) => a.m - b.m)
    const near = sorted.slice(0, 3)
    if (!near.some((item) => allowed.includes(item.place.zone))) casos.push({ tipo: 'restaurante_zona', donde: restaurant.name, detalle: restaurant.zone + ' pero lo más cercano es ' + near[0].place.name + ' (' + near[0].place.zone + ', ' + Math.round(near[0].m) + ' m)' })
  }
  return casos
}
