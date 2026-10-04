// Comprobaciones que le faltaban a la prueba (REGLAS_RUTAS, parte 6): las reglas 9, 10, 17, 21, 22 y 25, y la hora fija de las reservas.
// Se llaman desde prueba365.mjs, después de auditarViaje. No arreglan nada: cuentan y dan ejemplos.
const t2m = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
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
  hora_fija_movida: 'R-2 · Una entrada reservada que no sale a su hora (o que ha desaparecido)',
}

/**
 * @param {object} D  el JSON del destino
 * @param {object[]} days  los días del viaje tal como salen del motor
 * @param {{ startIso?: string|null, label?: string, month?: number|null, reservas?: Record<string,string> }} options
 */
export function auditarReglas(D, days, { startIso = null, label = '', reservas = null } = {}) {
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
  return casos
}
