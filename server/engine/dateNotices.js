/**
 * Avisos de fechas especiales (PROMPT_AVISO_FECHAS.md): lo que el viajero ve en una ventana al entrar en su ruta
 * por primera vez si su viaje cae en un festivo, un día de cierre o una fecha con algo especial.
 *
 * Dos tipos, en la misma lista (`date_notices`, una tarjeta por día):
 *   - Automáticos: lo que el motor YA ha hecho por un cierre (día movido, por fuera, cerrado todo el viaje,
 *     horario especial, la variante del día de la semana que trae `aviso_fecha`). Solo joyas, imprescindibles y
 *     lo del pool: lo pequeño que no cambia la ruta no se cuenta.
 *   - Curados: `fechas_especiales` del JSON del destino (solo las que no llevan `verificar: true`).
 * Si el mismo día hay de los dos, van en la misma tarjeta: primero lo que hemos hecho, luego lo que hay que ver.
 * Todo aviso acaba con lo que hemos hecho ("Hemos puesto…"): así lo escriben las plantillas de aquí y así se
 * curan los textos del JSON.
 */

import { closedReason, dayOfMonth } from '../../shared/routeEngine/closedNotices.js'
import { closedOnDay, specialHoursOn } from '../../shared/routeEngine/openingHours.js'
import { specialDateMatches, specialDatesOfMonth } from '../../shared/routeEngine/specialDates.js'
import { joinSpanish, placeWithArticle } from '../../shared/routeEngine/whyTexts.js'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const weekdayOf = (dateIso) => WEEKDAYS[new Date(`${String(dateIso).slice(0, 10)}T12:00:00Z`).getUTCDay()]
const dayNumberOf = (dateIso) => Number(String(dateIso).slice(8, 10))
const capital = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text)
/** "domingo 26 de septiembre" */
const longDate = (dateIso) => `${weekdayOf(dateIso)} ${dayOfMonth(dateIso)}`
/** "los domingos", "los lunes", "los sábados" */
const pluralWeekday = (weekday) => `los ${/s$/.test(weekday) ? weekday : `${weekday}s`}`

/** El lugar con su artículo, sin la segunda mitad de los nombres dobles ("los Museos Vaticanos", no "… y Capilla Sixtina"). */
function shortNamed(place) {
  if (place?.pass_by?.label) return place.pass_by.label
  const short = String(place?.name ?? '').split(' y ')[0]
  return placeWithArticle({ name: short })
}
function grammar(place) {
  const named = shortNamed(place)
  const article = (/^(el|la|los|las)\s/i.exec(named)?.[1] ?? 'el').toLowerCase()
  const plural = article === 'los' || article === 'las'
  return {
    named,
    bare: named.replace(/^(el|la|los|las)\s+/i, ''),
    plural,
    pronoun: { el: 'lo', la: 'la', los: 'los', las: 'las' }[article],
    cierra: plural ? 'cierran' : 'cierra',
    abre: plural ? 'abren' : 'abre',
    cerrado: { el: 'cerrado', la: 'cerrada', los: 'cerrados', las: 'cerradas' }[article],
  }
}

/** Lo mismo para varios lugares a la vez ("el Coliseo y el Panteón cierran… para que no los pierdas"). */
function grammarOf(places) {
  if (places.length === 1) return grammar(places[0])
  const all = places.map(grammar)
  const feminine = all.every((g) => /^(la|las)\s/i.test(g.named))
  return {
    named: joinSpanish(all.map((g) => g.named)),
    bare: joinSpanish(all.map((g) => g.bare)),
    plural: true,
    pronoun: feminine ? 'las' : 'los',
    cierra: 'cierran',
    abre: 'abren',
    cerrado: feminine ? 'cerradas' : 'cerrados',
  }
}

/** La primera letra en minúscula, salvo que la frase empiece por un nombre propio (el del destino). */
const lowerFirst = (text, keep) => (keep && String(text).startsWith(keep) ? text : String(text).charAt(0).toLowerCase() + String(text).slice(1))

/** "sábado 25" */
const shortDate = (dateIso) => `${weekdayOf(dateIso)} ${dayNumberOf(dateIso)}`

/** El nombre del festivo de ese día ("Navidad", "el Lunes de Pascua"), de `closed_notices.festivos`. */
function holidayName(destData, place, dateIso) {
  const reason = closedReason(place, { dateIso, weekday: weekdayOf(dateIso) })
  if (reason?.kind !== 'festivo') return null
  return destData.destination_config?.closed_notices?.festivos?.[reason.token] ?? null
}

/** "Los domingos los Museos Vaticanos cierran." / "El 25 de diciembre el Coliseo cierra por Navidad." */
function closureSentence(destData, placeOrPlaces, dateIso) {
  const places = Array.isArray(placeOrPlaces) ? placeOrPlaces : [placeOrPlaces]
  const place = places[0]
  const g = grammarOf(places)
  const reason = closedReason(place, { dateIso, weekday: weekdayOf(dateIso) })
  if (reason?.kind === 'semanal') return `${capital(pluralWeekday(reason.weekday))} ${g.named} ${g.cierra}.`
  const name = holidayName(destData, place, dateIso)
  return `El ${dayOfMonth(dateIso)} ${g.named} ${g.cierra}${name ? ` por ${name}` : ''}.`
}

/** El nombre corto de una fecha curada para la etiqueta del día: "Todos los Santos", "Ferragosto". */
const tagOf = (entry) => String(entry.titulo ?? '').split(' · ').at(-1)

/**
 * @param {object} destData
 * @param {object} trip     la salida del planificador (días con `hours` y `schedule`, `dateMoves`, `unplacedEssentials`…)
 * @param {object} options  { poolNames }
 * @returns {object[]} tarjetas { id, day_number, date_iso, icon, title, tag, texts, kind }
 */
export function dateNoticesFor(destData, trip, options = {}) {
  const calendar = { hasDates: trip.calendar?.hasDates ?? (trip.days ?? []).some((day) => day.hours?.weekday), month: trip.calendar?.month ?? options.month ?? null }
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const joyas = new Set([...(destData.joyas ?? []), ...(destData.places ?? []).filter((place) => place.tier === 'joya').map((place) => place.name)])
  const poolNames = new Set(options.poolNames ?? [])
  const matters = (name) => {
    const place = placeByName.get(name)
    return Boolean(place) && (place.level === 1 || joyas.has(name) || poolNames.has(name))
  }
  const specials = (destData.fechas_especiales?.fechas ?? []).filter((entry) => !entry.verificar)
  const days = (trip.days ?? []).filter((day) => day.hours?.dateIso)

  // ── Sin fechas (solo el mes): solo lo de temporada y las fechas fijas del mes, con "Si tu viaje coincide…" ──
  if (!calendar.hasDates) {
    if (calendar.month == null) return []
    return specialDatesOfMonth(specials, calendar.month).map(({ entry, label }) => ({
      id: `curado:${entry.id}`,
      day_number: null,
      date_iso: null,
      icon: entry.icono ?? 'fiesta',
      title: entry.titulo,
      tag: tagOf(entry),
      texts: [entry.tipo === 'temporada' ? entry.texto : `Si tu viaje coincide con ${label}: ${lowerFirst(entry.texto, destData.destination)}`],
      kind: 'curado',
    }))
  }

  /** Por día (fecha): lo automático y lo curado, para juntarlo en una tarjeta. */
  const byDate = new Map()
  const slot = (dateIso) => {
    if (!byDate.has(dateIso)) byDate.set(dateIso, { auto: [], curated: null })
    return byDate.get(dateIso)
  }
  /** `tag`: la etiqueta del día; `subject`: de qué va, para el título ("Domingo 26 de septiembre · Museos Vaticanos"). */
  const addAuto = (dateIso, text, tag, subject, icon = 'cierre') => {
    const entry = slot(dateIso)
    if (!entry.auto.some((item) => item.text === text)) entry.auto.push({ text, tag, subject, icon })
  }

  // 1. Día movido: lo que otro día del viaje cierra (o no debe ir) está en este. Un aviso por lugar, en el primer
  // día que no podía ir, con todos esos días juntos.
  // Los lugares con los mismos días bloqueados y el mismo día puesto van en una sola frase ("El 25 de diciembre el
  // Coliseo y el Panteón cierran por Navidad…").
  const movesByName = new Map()
  for (const move of trip.dateMoves ?? []) {
    if (!matters(move.name)) continue
    movesByName.set(move.name, [...(movesByName.get(move.name) ?? []), move])
  }
  const moveGroups = new Map()
  for (const [name, moves] of movesByName) {
    const place = placeByName.get(name)
    const blocked = [...new Set(moves.map((move) => move.blockedDateIso))].sort()
    const closed = blocked.filter((iso) => closedOnDay(place, weekdayOf(iso), iso))
    const key = `${closed.join(',') || `no_en:${blocked.join(',')}`}>${moves[0].placedDateIso}`
    if (!moveGroups.has(key)) moveGroups.set(key, { places: [], blocked, closed, placedIso: moves[0].placedDateIso })
    moveGroups.get(key).places.push(place)
  }
  for (const { places, blocked, closed, placedIso } of moveGroups.values()) {
    const g = grammarOf(places)
    const sameMonth = (iso) => iso.slice(0, 7) === placedIso.slice(0, 7)
    const done = `Hemos puesto tu visita el ${sameMonth(blocked[0]) ? shortDate(placedIso) : longDate(placedIso)} para que no ${g.pronoun} pierdas.`
    let text
    if (closed.length === 1) text = `${closureSentence(destData, places, closed[0])} ${done}`
    else if (closed.length > 1) {
      const fechas = joinSpanish(closed.map((iso) => {
        const name = holidayName(destData, places[0], iso)
        return `el ${shortDate(iso)}${name ? ` (${name.replace(/^(el|la|los|las)\s+/i, '')})` : ''}`
      }))
      text = `${capital(g.named)} ${g.cierra} ${fechas}. ${done}`
    } else {
      // No cierra, pero el día no debe ir (`no_en`): el último domingo de mes los Museos Vaticanos abren solo por la
      // mañana y con muchísima gente.
      text = `El último ${weekdayOf(blocked[0])} de mes ${g.named} ${g.abre} solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el ${shortDate(placedIso)}.`
    }
    addAuto(closed[0] ?? blocked[0], text, closed.length ? `${capital(g.bare)} ${g.cerrado}` : 'Último domingo de mes', g.bare)
  }

  // 2. Por fuera: un imprescindible cerrado ese día que se enseña desde fuera.
  for (const day of days) {
    const iso = day.hours.dateIso
    for (const visit of day.schedule?.visits ?? []) {
      const place = placeByName.get(visit.place.name)
      if (!place || !matters(place.name) || !closedOnDay(place, day.hours.weekday ?? weekdayOf(iso), iso)) continue
      const g = grammar(place)
      addAuto(iso, `${closureSentence(destData, place, iso)} Hemos ajustado el día para enseñárte${g.pronoun} por fuera sin perder tiempo.`, `${capital(g.bare)} ${g.cerrado}`, g.bare)
    }
  }

  // 3. Cerrado todo el viaje: no hay forma de verlo por dentro.
  const closedAll = [
    ...(trip.unplacedEssentials ?? []).filter((item) => item.reason === 'closed_every_day').map((item) => item.name),
    ...(trip.unplacedPool ?? []).filter((item) => item.reason === 'closed_every_day').map((item) => item.name),
  ]
  for (const name of [...new Set(closedAll)]) {
    const place = placeByName.get(name)
    if (!place) continue
    const g = grammar(place)
    const closedDays = days.filter((day) => closedOnDay(place, day.hours.weekday ?? weekdayOf(day.hours.dateIso), day.hours.dateIso)).map((day) => day.hours.dateIso)
    if (closedDays.length === 0) continue
    const sameMonth = closedDays.every((iso) => iso.slice(5, 7) === closedDays[0].slice(5, 7))
    const fechas = sameMonth
      ? `${joinSpanish(closedDays.map((iso) => `el ${dayNumberOf(iso)}`))} de ${MONTHS[Number(closedDays[0].slice(5, 7)) - 1]}`
      : joinSpanish(closedDays.map((iso) => `el ${dayOfMonth(iso)}`))
    const names = [...new Set(closedDays.map((iso) => holidayName(destData, place, iso)).filter(Boolean).map((text) => text.replace(/^(el|la|los|las)\s+/i, '')))]
    const why = names.length === 1 ? ` (${names[0]})` : ''
    addAuto(closedDays[0], `${capital(g.named)} ${g.cierra} ${fechas}${why}, que son los días de tu viaje. ${capital(g.pronoun)} hemos dejado en «No te dio tiempo» por si cambias de fechas.`, `${capital(g.bare)} ${g.cerrado}`, g.bare)
  }

  // 4. Horario especial (`fechas_especiales[].horario_especial` confirmado): la visita va dentro de ese horario.
  for (const day of days) {
    const iso = day.hours.dateIso
    for (const visit of day.schedule?.visits ?? []) {
      const place = placeByName.get(visit.place.name)
      const special = place ? specialHoursOn(place, iso) : null
      if (!special || !matters(place.name)) continue
      const g = grammar(place)
      addAuto(iso, `El ${dayOfMonth(iso)} ${g.named} ${g.abre} con horario especial (${special.windows.join(', ')}). Hemos puesto tu visita dentro de ese horario.`, 'Horario especial', g.bare, 'luz')
    }
  }

  // 5. La variante del día de la semana que cambia algo de un imprescindible (`aviso_fecha`: la audiencia de los
  // miércoles, el Panteón del sábado).
  for (const day of days) {
    const cfg = day.curatedDay ? (destData.curated_days ?? []).find((candidate) => candidate.id === day.curatedDay.id) : null
    for (const name of day.curatedDay?.variantes ?? []) {
      const notice = cfg?.variantes?.[name]?.aviso_fecha
      if (notice?.texto) addAuto(day.hours.dateIso, notice.texto, notice.etiqueta ?? 'Aviso', notice.etiqueta ?? 'Aviso', notice.icono ?? 'cierre')
    }
  }

  // 6. Curados: la tarjeta va en el primer día del viaje que cae en su fecha. Con rango (Navidad, del 24 al 26), lo
  // automático de los demás días del rango se junta en su tarjeta: es la misma ocasión.
  for (const entry of specials) {
    const inRange = days.filter((day) => specialDateMatches(entry, day.hours.dateIso)).map((day) => day.hours.dateIso)
    if (inRange.length === 0) continue
    const target = slot(inRange[0])
    if (target.curated) continue
    target.curated = entry
    for (const iso of inRange.slice(1)) {
      const other = byDate.get(iso)
      if (!other || other.curated) continue
      for (const item of other.auto) if (!target.auto.some((known) => known.text === item.text)) target.auto.push(item)
      byDate.delete(iso)
    }
  }

  // Una tarjeta por día, en orden de fecha.
  const dayOfDate = new Map(days.map((day) => [day.hours.dateIso, day.dayNumber]))
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, { auto, curated }]) => {
      const first = auto[0]
      return {
        id: `${iso}:${curated?.id ?? first?.tag ?? ''}`,
        day_number: dayOfDate.get(iso) ?? null,
        date_iso: iso,
        icon: curated?.icono ?? first?.icon ?? 'cierre',
        title: curated?.titulo ?? `${capital(longDate(iso))} · ${capital([...new Set(auto.map((item) => item.subject))].join(' · '))}`,
        tag: curated ? tagOf(curated) : first.tag,
        texts: [...auto.map((item) => item.text), ...(curated ? [curated.texto] : [])],
        kind: curated && auto.length ? 'mixto' : curated ? 'curado' : 'auto',
      }
    })
}
