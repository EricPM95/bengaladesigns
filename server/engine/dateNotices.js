/**
 * Avisos de fechas especiales (PROMPT_AVISO_FECHAS.md; rehechos en la Tanda 10M, 2026-10-25): lo que el viajero ve al abrir su
 * ruta si su viaje cae en un festivo, un día de cierre o una fecha con algo especial. Se guardan además en la campana de la app.
 *
 * UN aviso por fecha, en dos partes (`que_pasa` y `hecho`; `texts[0]` las lleva juntas):
 *   1. Qué pasa ese día, siempre igual: lo que cierra o cambia, esté o no en su ruta (información por si quiere añadir algo).
 *   2. La frase de lo que hemos hecho, la misma para todos (`fechas_especiales.frases.hecho`), que solo sale si ese día cierra
 *      o cambia algo. Única excepción (ahí la frase sería mentira): un sitio de `closed_notices.sitios_que_no_se_quitan` que se
 *      queda en un día que cierra («En tu viaje no hay otro día para…: se queda en su día y decides tú»); y si un sitio cerrado se
 *      enseña por fuera, el aviso de siempre («…te lo enseñamos por fuera, merece la pena igual»).
 *
 * Tipos de tarjeta (`kind`):
 *   - 'curado': una entrada de `fechas_especiales` (sale si la fecha cae en el viaje, aunque nada de su ruta cierre).
 *   - 'auto':   los cierres de la semana (el domingo cierran los Museos Vaticanos, el lunes la Galería Borghese…), siempre que el
 *               sitio esté en su ruta; un festivo de `closed_notices.festivos` sin entrada propia; un horario especial; la
 *               variante del día de la semana con `aviso_fecha`.
 * Cada tarjeta lleva además `cierran` (los nombres de todos los lugares que cierran o cambian esa fecha) y `campana` (la frase corta de la campana).
 * No cambia cómo se reparten los días: solo cuenta lo que ya hay.
 */

import { closedOutsideNotice, closedReason, dayOfMonth } from '../../shared/routeEngine/closedNotices.js'
import { closedOnDay, specialHoursOn, withinMonthDays } from '../../shared/routeEngine/openingHours.js'
import { specialDateMatches, specialDatesOfMonth } from '../../shared/routeEngine/specialDates.js'
import { holidayTransitRule } from '../../shared/routeEngine/holidayTransit.js'
import { joinSpanish, placeWithArticle } from '../../shared/routeEngine/whyTexts.js'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const RESTAURANTES_TEXT = 'Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.'
/** Las frases por defecto (cada destino pone las suyas en `fechas_especiales.frases`). */
const FRASES = {
  hecho: 'Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.',
  se_queda: 'En tu viaje no hay otro día para {sitio}: {se_quedan} en su día y decides tú.',
  semanal: 'Los {dias} {cierra} {lugares}.',
  festivo: 'Es festivo y {cierra} {lugares}.',
}
/** Sin la última frase de lo que hemos hecho ("Hemos puesto…"): para el aviso sin fechas. */
const withoutPromise = (text) => String(text ?? '').replace(/\s*Hemos [^.]*\.\s*$/, '')
const weekdayOf = (dateIso) => WEEKDAYS[new Date(`${String(dateIso).slice(0, 10)}T12:00:00Z`).getUTCDay()]
const dayNumberOf = (dateIso) => Number(String(dateIso).slice(8, 10))
const capital = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text)
const stripArticle = (text) => String(text ?? '').replace(/^(el|la|los|las)\s+/i, '')
const fill = (text, values) => String(text).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)
/** "domingo 26 de septiembre" */
const longDate = (dateIso) => `${weekdayOf(dateIso)} ${dayOfMonth(dateIso)}`
/** "domingos", "lunes", "sábados" */
const pluralWeekday = (weekday) => (/s$/.test(weekday) ? weekday : `${weekday}s`)
/** "sábado 25" */
const shortDate = (dateIso) => `${weekdayOf(dateIso)} ${dayNumberOf(dateIso)}`

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
    cierra: plural ? 'cierran' : 'cierra',
    cerrado: { el: 'cerrado', la: 'cerrada', los: 'cerrados', las: 'cerradas' }[article],
    abre: plural ? 'abren' : 'abre',
  }
}

/** Lo mismo para varios lugares a la vez. */
function grammarOf(places) {
  if (places.length === 1) return grammar(places[0])
  const all = places.map(grammar)
  const feminine = all.every((g) => /^(la|las)\s/i.test(g.named))
  return {
    named: joinSpanish(all.map((g) => g.named)),
    bare: joinSpanish(all.map((g) => g.bare)),
    plural: true,
    cierra: 'cierran',
    cerrado: feminine ? 'cerradas' : 'cerrados',
    abre: 'abren',
  }
}

/** La primera letra en minúscula, salvo que la frase empiece por un nombre propio (el del destino). */
const lowerFirst = (text, keep) => (keep && String(text).startsWith(keep) ? text : String(text).charAt(0).toLowerCase() + String(text).slice(1))

/** El nombre corto de una fecha curada para la etiqueta del día: "Todos los Santos", "Ferragosto". */
const tagOf = (entry) => String(entry.titulo ?? '').split(' · ').at(-1)

/**
 * La frase corta de la campana de la app.
 *   Con cierres y un día especial (`label`): «1 de enero · Año Nuevo: el Coliseo, el Foro y 2 lugares más cierran.»
 *   Con cierres sin día especial:            «Coliseo, Panteón y 2 lugares más cierran el 25 de diciembre.»
 *   Sin cierres (solo cambios de horario o información): el título del aviso.
 */
function campanaText({ dateIso, label, closing, changing, title, weekly }) {
  const main = closing.length > 0 ? closing : changing
  if (main.length === 0) return title
  const names = main.map((place) => (label ? shortNamed(place) : grammar(place).bare))
  const rest = names.length - 2
  const items = rest > 0 ? [...names.slice(0, 2), `${rest} ${rest === 1 ? 'lugar' : 'lugares'} más`] : names
  const phrase = joinSpanish(items)
  const plural = main.length > 1 || grammar(main[0]).plural
  const verb = closing.length > 0 ? (plural ? 'cierran' : 'cierra') : plural ? 'cambian' : 'cambia'
  const tail = closing.length > 0 ? '' : ' su horario'
  if (label) return `${label}: ${phrase} ${verb}${tail}.`
  return `${capital(phrase)} ${verb}${tail} el ${weekly ? longDate(dateIso) : dayOfMonth(dateIso)}.`
}

/**
 * @param {object} destData
 * @param {object} trip     la salida del planificador (días con `hours` y `schedule`…)
 * @param {object} options  { poolNames, tripDates }  `tripDates`: todas las fechas del viaje (también el día de vuelta)
 * @returns {object[]} tarjetas { id, day_number, date_iso, icon, title, tag, texts, kind, que_pasa, hecho, cierran, campana }
 */
export function dateNoticesFor(destData, trip, options = {}) {
  /** ¿Se cumple en esta fecha una regla de `inException` ("papa.sin_audiencia": el verano sin audiencias)? */
  const inException = (key, dateIso) => {
    if (!key || !dateIso) return false
    const ranges = String(key).split('.').reduce((node, part) => node?.[part], destData.destination_config) ?? []
    const md = Number(dateIso.slice(5, 7)) * 100 + Number(dateIso.slice(8, 10))
    return ranges.some((range) => withinMonthDays(md, range.desde, range.hasta))
  }
  const calendar = { hasDates: trip.calendar?.hasDates ?? (trip.days ?? []).some((day) => day.hours?.weekday), month: trip.calendar?.month ?? options.month ?? null }
  const places = destData.places ?? []
  const placeByName = new Map(places.map((place) => [place.name, place]))
  const joyas = new Set([...(destData.joyas ?? []), ...places.filter((place) => place.tier === 'joya').map((place) => place.name)])
  const poolNames = new Set(options.poolNames ?? [])
  const matters = (name) => {
    const place = placeByName.get(name)
    return Boolean(place) && (place.level === 1 || joyas.has(name) || poolNames.has(name))
  }
  // Todas salen: `verificar: true` no las esconde, las cuenta con prudencia ("es posible que…", "compruébalo en la
  // web oficial"), que es como está escrito su texto (decisión del usuario, 2026-09-27).
  const specials = destData.fechas_especiales?.fechas ?? []
  const frases = { ...FRASES, ...(destData.fechas_especiales?.frases ?? {}) }
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
      // Sin fechas la ruta no se ajusta a esa fecha: fuera la frase de "hemos ajustado / hemos puesto…" (no es verdad).
      texts: [entry.tipo === 'temporada' ? entry.texto : `Si tu viaje coincide con ${label}: ${lowerFirst(withoutPromise(entry.contexto ?? entry.texto), destData.destination)}`],
      kind: 'curado',
      que_pasa: null,
      hecho: null,
      cierran: [],
      campana: entry.titulo,
    }))
  }

  const dayByDate = new Map(days.map((day) => [day.hours.dateIso, day]))
  const tripDates = [...new Set((options.tripDates?.length ? options.tripDates : days.map((day) => day.hours.dateIso)).map((iso) => String(iso).slice(0, 10)))].sort()
  const dayNumberOfDate = (iso) => dayByDate.get(iso)?.dayNumber ?? (tripDates.includes(iso) ? tripDates.indexOf(iso) + 1 : null)
  const visitsOn = (iso) => dayByDate.get(iso)?.schedule?.visits ?? []
  const tour = destData.default_free_tour ?? null

  // Lo que el viaje ve de verdad (entra o pasa a verlo cerrado por fuera): las paradas, lo que recorre el Free Tour y las nocturnas.
  const routeNames = new Set()
  for (const day of trip.days ?? []) {
    for (const visit of day.schedule?.visits ?? []) {
      const p = visit.place
      if (p.passThrough || (p.visitOutside && p.outsideKind !== 'cerrado')) continue
      routeNames.add(p.name)
      if (tour && p.name === tour.name) for (const name of tour.covers ?? []) routeNames.add(name)
    }
    for (const night of trip.nightsByDay?.get(day.dayNumber) ?? []) routeNames.add(night.name)
  }
  // Un lugar «de nombre» (el viajero lo conoce): los de nivel 1 y 2, y todo lo que lleva su ruta.
  const named = (place) => (place.level ?? 3) <= 2 || routeNames.has(place.name)
  const byLevel = (a, b) => (a.level ?? 3) - (b.level ?? 3)

  /** Los lugares que cierran y los que cambian de horario en esa fecha (`entry`: su `horario_especial`, aunque aún no se aplique). */
  const affected = (iso, entry = null) => {
    const weekday = weekdayOf(iso)
    const closing = places.filter((place) => named(place) && closedOnDay(place, weekday, iso)).sort(byLevel)
    const changing = places.filter((place) => named(place) && !closing.includes(place) && specialHoursOn(place, iso)).sort(byLevel)
    for (const name of Object.keys(entry?.horario_especial?.lugares ?? {})) {
      const place = placeByName.get(name)
      if (place && !closing.includes(place) && !changing.includes(place)) changing.push(place)
    }
    return { closing, changing }
  }
  /** Los lugares con su artículo, hasta 4 ("el Coliseo, el Foro, el Panteón y más" si hay más). */
  const listText = (list) => {
    const all = list.map(shortNamed)
    return joinSpanish(all.length > 4 ? [...all.slice(0, 3), 'más'] : all)
  }

  /** La parte de lo que hemos hecho: la frase de todos; si un sitio que no se quita se queda en un día que cierra, su excepción; y si se enseña por fuera, el aviso de siempre. */
  const hechoFor = (iso) => {
    const weekday = weekdayOf(iso)
    const stays = []
    const outside = []
    for (const visit of visitsOn(iso)) {
      const place = placeByName.get(visit.place.name)
      if (!place) continue
      if (visit.place.closedThisDay) stays.push(place)
      else if (visit.place.visitOutside && visit.place.outsideKind === 'cerrado' && closedOnDay(place, weekday, iso)) outside.push(place)
    }
    const parts = []
    if (stays.length > 0) {
      const g = grammarOf(stays)
      parts.push(fill(frases.se_queda, { sitio: g.named, se_quedan: g.plural ? 'se quedan' : 'se queda' }))
    }
    for (const place of outside) {
      const text = closedOutsideNotice(destData, place, { dateIso: iso, weekday })
      if (text) parts.push(text)
    }
    return parts.length > 0 ? parts.join(' ') : frases.hecho
  }

  /** «Domingo 6 y martes 8» (con el mes si cambia). */
  const datesTitle = (isos) => {
    const sorted = [...new Set(isos)].sort()
    const sameMonth = sorted.every((iso) => iso.slice(0, 7) === sorted[0].slice(0, 7))
    return capital(joinSpanish(sorted.map((iso) => (sameMonth ? shortDate(iso) : longDate(iso)))))
  }

  const cards = []
  const closureDates = new Set()
  const makeCard = ({ iso, id, icon, title, tag, kind, quePasa, hecho = null, extraTexts = [], closing = [], changing = [], label = null, weekly = false }) => ({
    id,
    day_number: dayNumberOfDate(iso),
    date_iso: iso,
    icon,
    title,
    tag,
    texts: [[quePasa, hecho].filter(Boolean).join(' '), ...extraTexts].filter(Boolean),
    kind,
    que_pasa: quePasa,
    hecho,
    cierran: [...closing, ...changing].map((place) => place.name),
    campana: campanaText({ dateIso: iso, label, closing, changing, title, weekly }),
  })

  // 1. Curados: una entrada de `fechas_especiales` por fecha del viaje que cae en ella (con rango, solo la primera fecha). Salen aunque nada de la ruta cierre.
  for (const entry of specials) {
    // `requiere_lugares`: solo si ese día el viaje lleva alguno de esos lugares (el Coliseo el primer domingo de mes).
    // (De día o de noche: el mercadillo de Navona va en el día que pasa por la plaza, también en su nocturna.)
    const carriesPlaces = (iso) => {
      if (!entry.requiere_lugares) return true
      const day = dayByDate.get(iso)
      return (day?.schedule?.visits ?? []).some((visit) => entry.requiere_lugares.includes(visit.place.name) && !visit.place.visitOutside) || (trip.nightsByDay?.get(day?.dayNumber) ?? []).some((night) => entry.requiere_lugares.includes(night.name))
    }
    let dates = tripDates.filter((iso) => specialDateMatches(entry, iso) && carriesPlaces(iso))
    if (entry.hasta) dates = dates.slice(0, 1)
    for (const iso of dates) {
      // `otro_dia`: el aviso solo sale si el viaje lleva esos lugares OTRO día; {dia} = «el viernes 6» (el último domingo de mes: «te los hemos puesto el viernes 6»).
      let dia = ''
      if (entry.otro_dia) {
        const other = tripDates.find((date) => date !== iso && visitsOn(date).some((visit) => entry.otro_dia.includes(visit.place.name) && !visit.place.visitOutside && !visit.place.closedThisDay))
        if (!other) continue
        dia = `el ${other.slice(0, 7) === iso.slice(0, 7) ? shortDate(other) : longDate(other)}`
      }
      // (Un aviso solo informativo no cuenta cierres: el último domingo no habla de la Villa Farnesina.)
      const { closing, changing } = entry.sin_frase ? { closing: [], changing: [] } : affected(iso, entry)
      const affects = closing.length + changing.length > 0
      const title = entry.titulo_con_fecha ? `${datesTitle([iso])} · ${entry.titulo_con_fecha}` : entry.titulo
      const transit = holidayTransitRule(destData, iso)?.texto
      if (affects) closureDates.add(iso)
      cards.push(makeCard({
        iso,
        id: `${iso}:${entry.id}`,
        icon: entry.icono ?? 'fiesta',
        title,
        tag: tagOf(entry),
        kind: 'curado',
        quePasa: fill(entry.contexto ?? entry.texto, { dia }),
        hecho: !entry.sin_frase && affects ? hechoFor(iso) : null,
        // (`aviso_restaurantes`: Navidad y Ferragosto, muchos restaurantes cierran; y el transporte recortado de ese festivo: frases aparte, fuera de las 35 palabras.)
        extraTexts: [...(transit ? [transit] : []), ...(entry.aviso_restaurantes ? [destData.fechas_especiales?._restaurantes ?? RESTAURANTES_TEXT] : [])],
        closing,
        changing,
        label: title,
      }))
    }
  }

  // 2. Los festivos sin entrada propia (`closed_notices.festivos`) y los cierres de cada semana. Un aviso por fecha.
  const festivos = destData.destination_config?.closed_notices?.festivos ?? {}
  for (const iso of tripDates) {
    if (closureDates.has(iso)) continue
    const weekday = weekdayOf(iso)
    const reasonOf = (place) => closedReason(place, { dateIso: iso, weekday })
    // 2a. Festivo: algún lugar de nombre cierra por fecha (y es de los grandes o está en la ruta).
    const festive = places.filter((place) => named(place) && reasonOf(place)?.kind === 'festivo')
    if (festive.some((place) => place.level === 1 || routeNames.has(place.name))) {
      const { closing, changing } = affected(iso)
      const name = festivos[reasonOf(festive[0]).token]
      const tagName = name ? capital(stripArticle(name)) : dayOfMonth(iso)
      const title = name ? `${dayOfMonth(iso)} · ${tagName}` : dayOfMonth(iso)
      closureDates.add(iso)
      cards.push(makeCard({
        iso,
        id: `${iso}:festivo`,
        icon: 'fiesta',
        title,
        tag: tagName,
        kind: 'auto',
        quePasa: fill(frases.festivo, { cierra: closing.length > 1 || grammar(closing[0]).plural ? 'cierran' : 'cierra', lugares: listText(closing) }),
        hecho: hechoFor(iso),
        closing,
        changing,
        label: title,
      }))
      continue
    }
    // 2b. Cierre de la semana: un lugar de su ruta que ese día de la semana cierra (aunque la ruta lo esquive). Nombrando el sitio, nunca «los museos».
    const weekly = places.filter((place) => named(place) && routeNames.has(place.name) && reasonOf(place)?.kind === 'semanal').sort(byLevel)
    if (weekly.length > 0) {
      const g = grammarOf(weekly)
      const { closing, changing } = affected(iso)
      const tag = `${capital(g.bare)} ${g.cerrado}`
      closureDates.add(iso)
      cards.push(makeCard({
        iso,
        id: `${iso}:${tag}`,
        icon: 'cierre',
        title: `${datesTitle([iso])} · ${tag}`,
        tag,
        kind: 'auto',
        quePasa: fill(frases.semanal, { dias: pluralWeekday(weekday), cierra: g.cierra, lugares: g.named }),
        hecho: hechoFor(iso),
        closing,
        changing,
        weekly: true,
      }))
    }
  }

  // 3. Horario especial de un lugar de la ruta que ningún aviso de ese día ha contado.
  for (const iso of tripDates) {
    if (closureDates.has(iso)) continue
    for (const visit of visitsOn(iso)) {
      const place = placeByName.get(visit.place.name)
      const special = place ? specialHoursOn(place, iso) : null
      if (!special || !matters(place.name)) continue
      const g = grammar(place)
      const tag = 'Horario especial'
      cards.push(makeCard({
        iso,
        id: `${iso}:${tag}`,
        icon: 'luz',
        title: `${datesTitle([iso])} · ${tag}`,
        tag,
        kind: 'auto',
        quePasa: `El ${dayOfMonth(iso)} ${g.named} ${g.abre} con horario especial (${special.windows.join(', ')}).`,
        hecho: 'Hemos puesto tu visita dentro de ese horario.',
        changing: [place],
      }))
    }
  }

  // 4. La variante del día de la semana que cambia algo de un imprescindible (`aviso_fecha`: la audiencia de los miércoles, el Panteón del sábado).
  for (const day of days) {
    const cfg = day.curatedDay ? (destData.curated_days ?? []).find((candidate) => candidate.id === day.curatedDay.id) : null
    for (const name of day.curatedDay?.variantes ?? []) {
      const notice = cfg?.variantes?.[name]?.aviso_fecha
      if (!notice?.texto || inException(notice.excepto, day.hours.dateIso)) continue
      const tag = notice.etiqueta ?? 'Aviso'
      const iso = day.hours.dateIso
      if (cards.some((card) => card.id === `${iso}:${tag}`)) continue
      cards.push(makeCard({ iso, id: `${iso}:${tag}`, icon: notice.icono ?? 'cierre', title: `${datesTitle([iso])} · ${tag}`, tag, kind: 'auto', quePasa: notice.texto }))
    }
  }

  // Primero lo que cierra o cambia la ruta, después lo informativo; cada grupo por fecha.
  const important = (card) => card.kind === 'auto' || card.cierran.length > 0
  return [...cards.filter(important), ...cards.filter((card) => !important(card))].sort((a, b) => Number(!important(a)) - Number(!important(b)) || a.date_iso.localeCompare(b.date_iso))
}

/**
 * "Mejor no" al poner fechas (decisión del usuario, 2026-09-28): la ruta se queda exactamente igual y no sale ningún
 * aviso. Solo el dato de cada parada: qué paradas cierran ese día (cierre semanal o festivo), para su marca roja
 * "Hoy cierra" en la línea de horario.
 * @param {object} destData
 * @param {{ startIso: string, days: { day_number: number, stops: string[] }[] }} kept
 * @returns {{ day_number: number, name: string }[]}
 */
export function keptRouteClosures(destData, { startIso, days }) {
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const isoOf = (dayNumber) => new Date(Date.parse(`${startIso}T12:00:00Z`) + (dayNumber - 1) * 86400000).toISOString().slice(0, 10)
  const closures = []
  for (const day of days) {
    const dateIso = isoOf(day.day_number)
    for (const name of day.stops) {
      const place = placeByName.get(name)
      if (place && closedOnDay(place, weekdayOf(dateIso), dateIso)) closures.push({ day_number: day.day_number, name })
    }
  }
  return closures
}
