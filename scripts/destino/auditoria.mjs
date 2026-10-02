// Auditoría automática de un viaje (decisión del usuario, 2026-09-28): todo lo que antes se repasaba a mano, para
// cualquier destino. La usan la revisión (con su lista de casos: ruta, día, hora, parada) y el barrido (contando).
// Los días libres del viajero ("lo organizo yo") no se revisan.
import { closedOnDay, effectiveSchedule, lastEntryMinutes, parseHoursSessions, placeWindows } from '../../shared/routeEngine/openingHours.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { grupoFueraDeOrdenEnDia, tituloQueNoSeCumple } from './textChecks.mjs'
import { whyTexts } from '../../shared/routeEngine/whyTexts.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'
import { ownPhotoFile, photosFor } from '../../server/engine/writtenDays.js'

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
  no_cuadra: 'Hora que no cuadra: la anterior + su duración + el paseo pasa de la hora de la parada',
  hueco: 'Hueco de más de 20 min sin nada entre dos paradas (30 antes del atardecer o de una entrada con turno)',
  cerrada_a_su_hora: 'Parada con «Todavía no ha abierto» o «Ya ha cerrado» a su hora (junto a un imprescindible va «Por fuera» sin aviso; si no, se mueve a cuando está abierta)',
  foto_repetida: 'La misma foto propia en dos tarjetas del mismo día',
  tiempo_libre_sigue: 'Sale un «Tiempo libre» o un «Aperitivo» (ya no existen)',
  paseo_misma_zona: 'El paseo de «Pasea y piérdete por…» en el mismo sitio que la parada de antes (esa parada se alarga y no hay tarjeta aparte)',
  libre_largo: 'Tiempo libre de más de 30 min (60 si sale con nombre de paseo)',
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
  atardecer_corto: 'Parada de atardecer que acaba antes de que se ponga el sol',
  nocturna_repite: 'Lugar de una nocturna que ya salió de día ese mismo día',
  fuera_mal: '"Quedó fuera" con un lugar por el que pasa la ruta o con "No te dio tiempo" por un cierre',
  plaza_despues: 'Iglesia o monumento antes que su plaza',
  texto_generico: 'Texto genérico en una nocturna o en "Roma iluminada"',
  texto_condicion: 'Texto con solo_si_viene_de / solo_si_sigue que no se cumple',
  ideas_lejos: 'Tiempo libre con ideas de otra zona',
  paseo_largo: 'Parada de paseo (parque, jardín, barrio o avenida) por encima de su máximo',
  restaurante_repetido: 'El mismo restaurante dos veces en el viaje',
  fuera_con_tiempo: '"Por fuera para llegar a todo" en un día con tiempo libre o paradas estiradas',
  manana_tarde: '"Por la mañana" en el texto de una parada que va por la tarde',
  pago_sin_dentro: 'Imprescindible de pago que no sale nunca por dentro en el viaje',
  vaticano_sin_castillo: "El día del Vaticano sin el Castillo de Sant'Angelo (ni por dentro ni por fuera)",
  vaticano_sin_puente: "El día del Vaticano sin el Puente Sant'Angelo de día",
  hueco_cena: 'Más de 45 min antes de cenar sin nada, con un sitio de la ruta sin ver a un paseo',
  tour_repite: 'Un sitio del recorrido del Free Tour que sale también suelto el día del tour (Trevi a las 8:30 y el tour a las 10:00)',
  barrio_dos_veces: 'El mismo barrio dos veces el mismo día, con otra cosa en medio (Trastevere a las 16:15 y otra vez al anochecer)',
}

/** Cierre de Roma (2026-09-28): el máximo de una parada de paseo; una avenida, 45; el lugar puede traer el suyo (`max_minutos_paseo`: la Via Appia). */
const LIBRE_CON_NOMBRE_MAX = 60
const HUECO_MARGEN_MAX = 30
export const PASEO_MAX = { paseo: 90, calle: 45 }
export function paseoMaxOf(place) {
  const tags = new Set(place?.tags ?? [])
  if (place?.max_minutos_paseo != null) return place.max_minutos_paseo
  if (tags.has('calle')) return PASEO_MAX.calle
  if (tags.has('parque') || tags.has('barrio') || tags.has('paseo')) return PASEO_MAX.paseo
  return null
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
  const add = (tipo, n, hora, parada, detalle = '') => casos.push({ tipo, donde: `${label ? `${label}, ` : ''}${n === 0 ? 'todo el viaje' : `día ${n}`}${hora ? `, ${hora}` : ''}${parada ? ` ${parada}` : ''}`, detalle })
  const seenOnDay = new Map()
  const allNames = new Set()
  const restaurantsSeen = []

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
    // (Lo que recorre el Free Tour también está en el viaje: la Befana de Piazza Navona en un viaje con Free Tour.)
    if (D.default_free_tour && day.stops.some((stop) => nameOf(stop) === D.default_free_tour.name)) for (const name of D.default_free_tour.covers ?? []) allNames.add(name)

    // Repetidos.
    const inDay = new Map()
    for (const stop of dayStops) {
      const name = nameOf(stop)
      // (El mismo lugar con dos nombres escritos distintos, el parque de Villa Borghese de camino a la Galería y su lago y su templo por la
      // tarde en D4, son dos paradas: PARA_CODE_TODO_2026-10-01, 5.5.)
      if (inDay.has(name) && !(stop.display_title && inDay.get(name).title && stop.display_title !== inDay.get(name).title)) add('repetido_dia', n, stop.suggested_time, name, `también a las ${inDay.get(name).time}`)
      else inDay.set(name, { time: stop.suggested_time, title: stop.display_title ?? null })
      if (!stop.is_revisit && !stop.pass_through && !stop.is_pass_by && !stop.is_free_walk) {
        if (seenOnDay.has(name) && seenOnDay.get(name) !== n) add('repetido_viaje', n, stop.suggested_time, name, `ya en el día ${seenOnDay.get(name)}`)
        else seenOnDay.set(name, n)
      }
    }

    const metersApart = (a, b) => {
      const rad = Math.PI / 180
      const x = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2
      return 2 * 6371000 * Math.asin(Math.sqrt(x))
    }
    // Sin repeticiones de día (PROMPT_REPASO_LOCAL_ROMA, 8). Ver de noche lo que se vio de día ya no cuenta como repetir
    // (PARA_CODE_TARDE_VATICANO, 1).
    // 1. El día del Vaticano lleva siempre el Castillo (por dentro o por fuera) y el Puente Sant'Angelo de día, como está
    // escrito (PARA_CODE_TARDE_VATICANO, 6).
    // (Salvo el 24 y el 31 en los viajes de 2 días con Free Tour: el Vaticano por la mañana y la Roma Antigua, que cierra
    // pronto, por la tarde; pasar por el Castillo hacía perder el Foro por dentro.)
    const compressedVatican = (day.curated_day?.variants ?? []).some((variant) => /^fecha:12-(24|31)&/.test(variant))
    if (['D2', 'D3'].includes(day.curated_day?.id) && !compressedVatican) {
      const names = dayStops.map(nameOf)
      // (El Castillo va una sola vez por viaje, por fuera: basta con que lo lleve algún otro día.)
      const castleElsewhere = days.some((other) => (other?.stops ?? []).some((stop) => String(stop.place_name ?? stop.name).includes("Castillo de Sant'Angelo")))
      if (!castleElsewhere) add('vaticano_sin_castillo', n, '', day.curated_day.id, 'el día del Vaticano sin el Castillo de Sant\'Angelo')
      if (!names.some((name) => name.includes("Puente Sant'Angelo")) && !dayStops.some((stop) => (stop.display_title ?? stop.night_view_title ?? '').includes("Puente Sant'Angelo"))) add('vaticano_sin_puente', n, '', day.curated_day.id, 'el día del Vaticano sin el Puente Sant\'Angelo')
    }
    // 1b. Más de 45 min antes de cenar sin nada, con un sitio de la ruta sin ver a un paseo (menos de 800 m) y abierto.
    if (dinnerStart != null && dayStops.length > 0) {
      const beforeDinner = dayStops.filter((stop) => (t2m(stop.suggested_time) ?? 0) < dinnerStart)
      const last = beforeDinner[beforeDinner.length - 1]
      if (last) {
        // (Con la nocturna de antes de cenar: ese rato ya tiene su paseo.)
        const lastEndAt = Math.max(...day.stops.filter((stop) => (t2m(stop.suggested_time) ?? 0) < dinnerStart).map((stop) => (t2m(stop.suggested_time) ?? 0) + (stop.duration_minutes ?? 0)))
        const idle = dinnerStart - lastEndAt - (day.dinner_walk_minutes ?? 0)
        // (Lo que el viaje ve, también lo que recorre el Free Tour; y solo si está abierto a esa hora: lo mismo que mira el motor.)
        const tourInTrip = D.default_free_tour && days.some((other) => (other?.stops ?? []).some((stop) => nameOf(stop) === D.default_free_tour.name))
        // (El barrio del paseo de antes de cenar también se ve: «Pasea y piérdete por Monti».)
        const paseoTitles = days.flatMap((other) => (other?.stops ?? []).filter((stop) => stop.is_free_walk).map((stop) => stop.name)).join(' ')
        const seenTrip = new Set([...days.flatMap((other) => (other?.stops ?? []).map(nameOf)), ...(tourInTrip ? D.default_free_tour.covers ?? [] : []), ...(D.places ?? []).filter((place) => paseoTitles.includes(place.name)).map((place) => place.name)])
        const lastPlace = byName.get(nameOf(last))
        const openAt = (place, from, to) => {
          if (iso && closedOnDay(place, hours.weekday, iso)) return false
          const sessions = parseHoursSessions(effectiveSchedule(place, hours) ?? place.schedule ?? '')
          const lastIn = lastEntryMinutes(place, from)
          return sessions.length === 0 ? place.type !== 'interior' || !place.schedule : sessions.some((session) => from >= session.open && to <= session.close) && (lastIn == null || from <= lastIn)
        }
        // (En la misma zona que lo último, como el motor: irse a otra y volver para el aperitivo sería un barrio dos veces.)
        // (Ni un museo ya de noche, ni volver junto a lo que el día ya vio antes de lo último: sería un zigzag.)
        const earlier = beforeDinner.slice(0, -1).map((stop) => byName.get(nameOf(stop))).filter((place) => place?.coordinates)
        const fits = (place) => !(place.type === 'interior' && sunset != null && lastEndAt + 10 >= sunset) && !earlier.some((other) => metersApart(other.coordinates, place.coordinates) < 400)
        const near = lastPlace?.coordinates ? (D.places ?? []).find((place) => place.coordinates && fits(place) && place.zone === lastPlace.zone && !seenTrip.has(place.name) && (place.level ?? 3) <= 2 && metersApart(place.coordinates, lastPlace.coordinates) < 800 && openAt(place, lastEndAt + 10, lastEndAt + 30)) : null
        if (idle > 45 && near) add('hueco_cena', n, last.suggested_time, nameOf(last), `${idle} min hasta la cena y ${near.name} a un paseo`)
      }
    }
    // 2. El día del Free Tour, nada suelto de lo que el tour ya recorre (salvo entrar en lo que el tour enseña por fuera).
    const tourCfg = D.default_free_tour
    if (tourCfg && day.stops.some((stop) => nameOf(stop) === tourCfg.name)) {
      for (const stop of dayStops) {
        const name = nameOf(stop)
        if (!(tourCfg.covers ?? []).includes(name) || stop.pass_through) continue
        const place = byName.get(name)
        const inside = place?.type === 'interior' && stop.visit_mode !== 'fuera' && (place.ticket_info ?? []).some((line) => /de pago/i.test(line))
        if (!inside) add('tour_repite', n, stop.suggested_time, name, 'y el Free Tour pasa por ahí')
      }
    }
    // 3. El mismo barrio dos veces el mismo día: la parada del barrio y, después de subir a un mirador o de irse a otra zona,
    // otra vez al barrio (su aperitivo o su paseo de noche). Trastevere a las 16:15, el Janículo y «Trastevere al anochecer».
    const barrios = (D.places ?? []).filter((place) => (place.tags ?? []).includes('barrio'))
    for (const barrio of barrios) {
      const firstAt = dayStops.findIndex((stop) => nameOf(stop) === barrio.name && !stop.pass_through)
      if (firstAt < 0) continue
      const later = dayStops.slice(firstAt + 1)
      const awayAt = later.findIndex((stop) => {
        const place = byName.get(nameOf(stop))
        return place && ((place.tags ?? []).includes('mirador') || (place.zone && place.zone !== barrio.zone))
      })
      if (awayAt < 0) continue
      const back = new RegExp(`(^|[^\p{L}])${barrio.name}([^\p{L}]|$)`, 'u')
      // (De día: el paseo de noche por el barrio ya no cuenta como repetir. PARA_CODE_TARDE_VATICANO, 1.)
      const titles = later.slice(awayAt + 1).map(nameOf)
      const other = (D.places ?? []).filter((place) => place.name !== barrio.name && place.name.includes(barrio.name)).map((place) => place.name)
      if (titles.some((text) => back.test(other.reduce((rest, name) => rest.split(name).join(''), text)))) add('barrio_dos_veces', n, dayStops[firstAt].suggested_time, barrio.name, `y otra vez después de ${nameOf(later[awayAt])}`)
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
          // Y la última entrada (la Basílica de San Pedro, a las 19:15): se mira cuándo empieza y cuándo acaba (segundo repaso).
          else {
            const lastEntry = lastEntryMinutes(place, start, { ...hours, sunset })
            if (lastEntry != null && start > lastEntry + ROUNDING) add('fuera_de_horario', n, stop.suggested_time, name, `última entrada ${String(Math.floor(lastEntry / 60)).padStart(2, '0')}:${String(lastEntry % 60).padStart(2, '0')}`)
          }
        }
      }
      // Atardecer: el mirador que llega después del sol, o un texto de atardecer ya de noche.
      if (sunset != null && start != null) {
        if (stop.sunset_minutes != null && start > sunset + ROUNDING) add('atardecer_tarde', n, stop.suggested_time, name, `sol a las ${Math.floor(sunset / 60)}:${String(sunset % 60).padStart(2, '0')}`)
        if (!stop.night_view && stop.sunset_minutes == null && /\batardecer\b/i.test(stop.why ?? '') && start > sunset + 15) add('atardecer_tarde', n, stop.suggested_time, name, 'texto de atardecer ya de noche')
      }
      // Tramo largo sin transporte (desde la comida si va en medio).
      if (previous) {
        // (El paseo de antes de cenar viene detrás de lo último que haya, nocturna incluida: se mide desde ahí.)
        const reference = stop.is_free_walk ? [...day.stops].filter((other) => other !== stop && (t2m(other.suggested_time) ?? 0) < start).sort((x, y) => t2m(x.suggested_time) - t2m(y.suggested_time)).at(-1) ?? previous : previous
        const fromLunch = lunch && lunchStart != null && lunchStart >= t2m(reference.suggested_time) + (reference.duration_minutes ?? 0) - 1 && lunchStart < start
        const walk = leg(fromLunch ? coordsOf(lunch) : endCoordsOf(reference), coordsOf(stop))
        if (!stop.transit && walk != null && walk > 25) add('tramo_largo', n, stop.suggested_time, name, `${Math.round(walk)} min andando`)
        // Hueco sin nada (sin la comida en medio y sin tiempo libre con nombre).
        const prevEnd = t2m(reference.suggested_time) + (reference.duration_minutes ?? 0)
        const named = (day.free_times ?? []).some((entry) => entry.before === name)
        // (Cierre de Roma: antes de un mirador del atardecer o de una entrada con turno, hasta 30 min son margen, no hueco:
        // se llega a la hora dorada o a recoger la entrada.)
        const margin = stop.sunset_minutes != null || stop.night_view || byName.get(name)?.turnos ? HUECO_MARGEN_MAX : 20
        if (!fromLunch && !named && start - prevEnd - (walk ?? 0) > margin) add('hueco', n, stop.suggested_time, name, `${Math.round(start - prevEnd - (walk ?? 0))} min`)
        // La hora de una parada es la anterior + su duración + el paseo (PROMPT_ROMA_V4_REPASO 1): con las horas de 5 en 5
        // pueden bailar hasta 4 min; más, no cuadra (el Arco acababa a las 10:20 y el Foro empezaba a las 10:20 con 9 min).
        if (!fromLunch && !stop.transit && walk != null && start - prevEnd < walk - 4) add('no_cuadra', n, stop.suggested_time, name, `acaba ${previous.name} a las ${String(Math.floor(prevEnd / 60)).padStart(2, '0')}:${String(prevEnd % 60).padStart(2, '0')} y hay ${Math.round(walk)} min andando`)
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
      // (El paseo de antes de cenar está en la zona de la cena, no se cuenta como volver: PARA_CODE_TODO_2026-10-01, 5.)
      if (here && stop.sunset_minutes == null && !stop.night_view && !nearSunset && !stop.is_free_walk) {
        // (Volver al mismo lugar con otro nombre escrito —el parque de Villa Borghese por la mañana y por la tarde— es un plan, no un zigzag.)
        for (let i = 0; i < index - 1; i++) {
          const there = coordsOf(dayStops[i])
          if (!there || straightLineMeters(here, there) > 300 || nameOf(dayStops[i]) === name) continue
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
      ...(day.free_times ?? []).map((entry) => ({ minutes: entry.minutes, before: entry.before, ideas: entry.suggestions ?? [], title: entry.title ?? null, aperitivo: Boolean(entry.aperitivo), descanso: Boolean(entry.descanso) })),
    ]
    // (Con la nocturna antes de cenar, el rato de luces y aperitivo va detrás de ella: cuenta desde lo último del día.)
    const lastEnd = Math.max(0, ...day.stops.filter((stop) => dinnerStart == null || t2m(stop.suggested_time) < dinnerStart).map((stop) => t2m(stop.suggested_time) + (stop.duration_minutes ?? 0)))
    for (const libre of libres) {
      const beforeSun = dayStops.some((stop) => nameOf(stop) === libre.before && stop.sunset_minutes != null) && sunset != null && sunset >= 19 * 60
      // (Cierre de Roma, 2026-09-28: desde 30 min, también antes del sol en verano.)
      void beforeSun
      // (El paso d del relleno: el rato con nombre de paseo de la zona, "Via Margutta y Via del Babuino", vale hasta 60 min.)
      // (Un aperitivo con su nombre, 90 como mucho: PROMPT_ROMA_V4_REPASO 8.)
      // (En verano, un descanso largo después de comer no es un aviso: de junio a agosto, entre las 14:00 y las 16:30, por
      // el calor. Decisión del usuario, 2026-09-30.)
      const beforeStop = dayStops.find((stop) => nameOf(stop) === libre.before)
      const libreEnd = beforeStop ? t2m(beforeStop.suggested_time) - (beforeStop.transit?.minutes ?? 0) : null
      const month = iso ? Number(iso.slice(5, 7)) : null
      const summerRest = month != null && month >= 6 && month <= 8 && libreEnd != null && libreEnd - libre.minutes >= 13 * 60 + 30 && (libreEnd <= 16 * 60 + 45 || libre.descanso)
      if (!summerRest && libre.minutes > (libre.descanso ? 120 : libre.aperitivo ? 90 : libre.title ? LIBRE_CON_NOMBRE_MAX : 30) && !libre.evening) add('libre_largo', n, '', libre.title ? `«${libre.title}» antes de ${libre.before}` : `antes de ${libre.before}`, `${libre.minutes} min`)
      if (libre.evening && dinnerStart != null && lastEnd + libre.minutes + (day.dinner_walk_minutes ?? 0) > dinnerStart + 1) add('libre_pisa_comida', n, '', 'antes de la cena', `acaba ${lastEnd + libre.minutes + (day.dinner_walk_minutes ?? 0) - dinnerStart} min tarde`)
      for (const idea of libre.ideas) if (levelOf(idea.name) <= 2) add('nivel_idea', n, '', idea.name, `idea de tiempo libre antes de ${libre.before}`)
    }
    // «Todavía no ha abierto» o «Ya ha cerrado» a su hora: con la regla de «junto a un imprescindible» va por fuera sin aviso rojo (5.4).
    for (const stop of dayStops) if (stop.visit_mode === 'fuera' && (stop.outside_kind === 'no_abre' || stop.outside_kind === 'ya_cerrado')) add('cerrada_a_su_hora', n, stop.suggested_time, nameOf(stop), stop.outside_reason ?? '')
    // Nunca la misma foto en dos tarjetas del mismo día (PARA_CODE_TODO_2026-10-01, 5.2): con las fotos propias, aquí; con las de
    // Unsplash y Wikipedia, scripts/destino/fotosRepetidas.mjs (pide las fotos a la API).
    {
      const table = photosFor('roma')
      const seenPhotos = new Map()
      for (const stop of day.stops) {
        if (stop.is_break || stop.no_own_photo || stop.is_free_walk && !stop.photo_name) continue
        const base = stop.photo_name ?? stop.name
        const asked = stop.is_night_experience && !/(noche)$|sde noche$/i.test(base) ? `${base} (noche)` : base
        const file = ownPhotoFile(table, asked, iso)?.archivo
        if (!file) continue
        if (seenPhotos.has(file)) add('foto_repetida', n, stop.suggested_time, nameOf(stop), `como ${seenPhotos.get(file)} (${file})`)
        else seenPhotos.set(file, nameOf(stop))
      }
    }
    // Sin «Tiempo libre» ni «Aperitivo» (PARA_CODE_TODO_2026-10-01, paso 5): lo que sobra va a una parada con nombre, a «Pasea y
    // piérdete por {zona}» o a recolocar las horas. Y el paseo nunca va en el mismo sitio que la parada de antes (se alarga esa).
    if (day.aperitivo || day.free_afternoon || day.free_time || (day.free_times ?? []).some((entry) => !entry.descanso && !entry.named)) add('tiempo_libre_sigue', n, '', '', 'sale un «Tiempo libre» o un «Aperitivo»')
    for (const stop of day.stops) if (/aperitivo|tiempo libre|tarde libre/i.test(stop.name ?? '') && !stop.is_break) add('tiempo_libre_sigue', n, stop.suggested_time, stop.name, 'una parada con nombre de aperitivo o de tiempo libre')
    {
      const ordered = [...day.stops]
      for (let i = 1; i < ordered.length; i++) {
        if (!ordered[i].is_free_walk) continue
        const before = ordered[i - 1]
        const base = String(nameOf(before)).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(el|la|los|las)s+/, '')
        const title = String(ordered[i].name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        const here = coordsOf(ordered[i])
        const there = coordsOf(before)
        const cerca = here && there && straightLineMeters(here, there) <= 250 && !before.is_night_experience
        if ((base.length >= 4 && title.includes(base)) || cerca) add('paseo_misma_zona', n, ordered[i].suggested_time, ordered[i].name, `justo después de ${nameOf(before)}`)
      }
    }
    // Paradas de paseo por encima de su máximo; "por fuera para llegar a todo" con tiempo de sobra; "por la mañana" por la tarde.
    const stretched = []
    for (const stop of dayStops) {
      const max = paseoMaxOf(byName.get(nameOf(stop)))
      // (La parada que se alarga en lugar del paseo de antes de cenar: hasta 90 min más, `stretched_free_walk`.)
      if (max != null && (stop.duration_minutes ?? 0) > max + (stop.stretched_free_walk ? 90 : 0)) {
        stretched.push(nameOf(stop))
        add('paseo_largo', n, stop.suggested_time, nameOf(stop), `${stop.duration_minutes} min (máximo ${max})`)
      }
      const start = t2m(stop.suggested_time)
      if (start != null && start >= 13 * 60 && /por la mañana/i.test(stop.why ?? '')) add('manana_tarde', n, stop.suggested_time, nameOf(stop), 'el texto habla de la mañana')
    }
    const hasFree = libres.some((libre) => !libre.evening && libre.minutes > 30)
    for (const stop of dayStops) if (stop.outside_kind === 'no_cabe' && (hasFree || stretched.length > 0)) add('fuera_con_tiempo', n, stop.suggested_time, nameOf(stop), hasFree ? 'con tiempo libre ese día' : `con ${stretched.join(', ')} estirado`)
    // (Restaurantes de todo el viaje, más abajo.)
    for (const meal of day.meals ?? []) if (meal.restaurant) restaurantsSeen.push({ name: meal.restaurant, n, time: meal.time })
    // La comida: el tiempo libre de antes no la pisa.
    for (const entry of day.free_times ?? []) if (entry.before === 'la comida' && lunchStart != null && (lunchEnd ?? lunchStart) < lunchStart) add('libre_pisa_comida', n, '', 'antes de la comida')
    // Cena que espera sin motivo: llega (con el paseo) y la cena empieza más de 20 min después, ya dentro de su franja.
    if (dinnerStart != null) {
      // (El paseo hasta la cena, desde lo último que haya —una nocturna también—, no solo desde lo último de día.)
      const lastBefore = [...day.stops].filter((stop) => (t2m(stop.suggested_time) ?? 0) < dinnerStart && !stop.after_dinner).sort((x, y) => t2m(x.suggested_time) - t2m(y.suggested_time)).at(-1)
      const dinnerPoint = dinner?.latitude != null ? [dinner.latitude, dinner.longitude] : null
      const walkToDinner = (lastBefore && dinnerPoint ? leg(endCoordsOf(lastBefore), dinnerPoint) : null) ?? day.dinner_walk_minutes ?? 0
      const arrive = lastEnd + walkToDinner
      const idle = dinnerStart - arrive
      // (Decisión del usuario, 2026-09-28: también si se llega antes de la franja de la cena: es una espera sin nada.)
      void dinnerWindowStart
      // (Con la cena en su hora más temprana, 19:30 —20:30 en la versión D, la de verano—, esperar es el motivo: nunca antes.)
      const dinnerFloor = day.curated_day?.variants?.[0] === 'D' ? 20 * 60 + 30 : 19 * 60 + 30
      if (idle > 20 && dinnerStart > dinnerFloor) add('cena_espera', n, dinner.suggested_time, 'cena', `${idle} min de espera`)
    }
    // Parte D del repaso (2026-09-28).
    const generic = new Set([whyTexts.night(), whyTexts.nightBeforeDinner(), D.destination_config?.night_view_text].filter(Boolean))
    const dayNames = new Set(dayStops.map(nameOf))
    for (const stop of day.stops) {
      const start = t2m(stop.suggested_time)
      // El atardecer acaba antes de que se ponga el sol.
      if (stop.sunset_minutes != null && sunset != null && start != null && start + (stop.duration_minutes ?? 0) < sunset - ROUNDING) add('atardecer_corto', n, stop.suggested_time, nameOf(stop), `acaba antes del sol (${Math.floor(sunset / 60)}:${String(sunset % 60).padStart(2, '0')})`)
      // La nocturna repite lo que ya salió ese día.
      if (stop.is_night_experience) {
        const base = String(stop.name).replace(/s*(noche)$/, '').replace(/s+de noche$/, '')
        if (dayNames.has(base)) add('nocturna_repite', n, stop.suggested_time, stop.name, `${base} ya salió de día`)
      }
      // Textos genéricos en las nocturnas y en "Roma iluminada".
      if ((stop.is_night_experience || stop.night_view) && generic.has(stop.why)) add('texto_generico', n, stop.suggested_time, stop.night_view_title ?? stop.name, stop.why)
      // Un texto con condición que no se cumple (el motor pone el general; si no lo tiene, sale el condicionado).
      if (stop.why_condition && !stop.why_condition.cumple && !stop.why_condition.usa_general) add('texto_condicion', n, stop.suggested_time, nameOf(stop), stop.why_condition.tipo)
    }
    // Plaza o iglesia fuera de orden.
    for (const aviso of grupoFueraDeOrdenEnDia(D, day)) add('plaza_despues', n, '', '', aviso)
    // Ideas de tiempo libre de otra zona (a más de 1,5 km de donde se está).
    for (const entry of day.free_times ?? []) {
      const anchor = dayStops.find((stop) => nameOf(stop) === entry.before) ?? dayStops.find((stop) => nameOf(stop) === entry.after)
      const here = anchor ? coordsOf(anchor) : null
      for (const idea of entry.suggestions ?? []) {
        const coords = byName.get(idea.name)?.coordinates
        if (here && Array.isArray(coords) && straightLineMeters(here, coords) > 1500) add('ideas_lejos', n, '', idea.name, `idea de tiempo libre antes de ${entry.before}`)
      }
    }
    // Títulos y textos con hora.
    for (const aviso of tituloQueNoSeCumple(day)) add('titulo_hora', n, '', '', aviso)
  }

  // "Quedó fuera": nunca un lugar por el que pasa la ruta ese día; y si es un cierre, el motivo no es "No te dio tiempo".
  const seenByDay = new Map(days.map((day, index) => [day?.day_number ?? index + 1, new Set((day?.stops ?? []).flatMap((stop) => [stop.place_name ?? stop.name, ...(stop.outside_of ?? [])]))]))
  const reported = new Set()
  for (const [index, day] of days.entries()) {
    for (const item of day?.not_included ?? []) {
      const key = `${item.name}|${item.reason}`
      if (reported.has(key)) continue
      reported.add(key)
      const dayNumber = item.day_number ?? null
      if (dayNumber != null && seenByDay.get(dayNumber)?.has(item.name)) add('fuera_mal', dayNumber, '', item.name, 'la ruta pasa por ahí ese día')
      const place = byName.get(item.name)
      const iso = dayNumber != null && startIso ? addDays(startIso, dayNumber - 1) : null
      if (place && iso && item.reason === 'No te dio tiempo' && closedOnDay(place, WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()], iso)) add('fuera_mal', dayNumber, '', item.name, 'ese día cierra: el motivo es el cierre')
      void index
    }
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
    // (La tarjeta de temporada, PROMPT_TARJETA_TEMPORADA: los miradores con el atardecer, con un atardecer en la ruta; el
    // descanso después de comer, con algún día de julio o agosto.)
    if (/miradores con el atardecer/.test(note.text) && !cityDays.some((day) => day.stops.some((stop) => stop.sunset_minutes != null))) add('nota_promete', '—', '', 'Tarjeta de temporada', 'promete los miradores al atardecer y ninguna parada es un atardecer')
    if (/después de comer, descanso/.test(note.text) && !(startIso && days.some((day, index) => day?.stops?.length && /^\d{4}-0[78]-/.test(addDays(startIso, index))))) add('nota_promete', '—', '', 'Tarjeta de temporada', 'promete el descanso de verano y ningún día es de julio o agosto')
  }
  // El mismo restaurante dos veces en el viaje (cierre de Roma, 2026-09-28).
  const byRestaurant = new Map()
  for (const item of restaurantsSeen) byRestaurant.set(item.name, [...(byRestaurant.get(item.name) ?? []), item])
  for (const [name, list] of byRestaurant) if (list.length > 1) add('restaurante_repetido', list[1].n, '', name, list.map((item) => `día ${item.n} (${item.time === 'lunch' ? 'comida' : 'cena'})`).join(', '))
  // Las entradas son parte del negocio (2026-09-28): todo imprescindible de pago por dentro algún día del viaje.
  const insideNames = new Set(days.flatMap((day) => (day?.stops ?? []).filter((stop) => stop.visit_mode === 'dentro').map((stop) => stop.place_name ?? stop.name)))
  for (const place of D.places ?? []) {
    if (place.level !== 1 || place.type !== 'interior' || !(place.ticket_info ?? []).some((line) => /de pago/i.test(line))) continue
    if (!insideNames.has(place.name)) add('pago_sin_dentro', 0, '', place.name, 'ningún día por dentro')
  }
  return casos
}
