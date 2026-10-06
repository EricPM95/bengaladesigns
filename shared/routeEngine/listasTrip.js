/**
 * Motor de listas (Tanda 6, decidido el 6-oct-2026): los días son LISTAS de paradas por franjas (data/dias/<destino>/listas.json, escritas por nosotros desde
 * docs/dias/DIAS_ROMA_PARADAS.md), sin horas al minuto. El motor solo hace estas cosas, y nada más:
 *
 *   1. Elegir los días del viaje y su orden (listasOrden.js).
 *   2. Cierres: lo cerrado ese día sale de la lista con «Cerrado hoy»; cada parada tiene que estar abierta en su franja; avisos «Cierra a las…», «Abre a las…».
 *   3. Lo que tiene hora fija (reserva, turno, Free Tour) va a su hora, con su «Llegada a…» delante: lo que cabe antes va antes y lo demás después, en el mismo orden;
 *      si antes queda un rato entra una parada corta pegada al sitio, y si no hay ninguna el día empieza más tarde.
 *   4. Pool y experiencias: al sitio que escribe el documento.
 *   5. Si cabe: se suma lo que dura cada parada y el trayecto, por franja; lo que no cabe pasa a «Si te sobra tiempo», de abajo arriba por la pirámide (nunca un
 *      imprescindible la primera vez). La comida, como muy tarde a las 14:30: primero se acorta lo de menos de la mañana y después pasa a «Si te sobra tiempo».
 *   6. Restaurantes y nocturnas: la alternativa escrita; un recambio solo si es un restaurante de verdad a menos de 10 min; sin repetir restaurantes ni nocturnas; las
 *      nocturnas imprescindibles, en los primeros días.
 *   7. Siempre las mismas comprobaciones al recolocar (listasReglas.js, regla 13 del documento): si un cambio rompe alguna, no se hace.
 *   8. La hora de cada parada es orientativa: la suma de lo que dura cada una más el trayecto, desde que empieza el día. Nunca mueve nada.
 *
 * No rellena huecos, no alarga paradas, no ajusta al atardecer (el sol es un dato de la cabecera), no corrige distancias, no tiene versiones A-D ni tablas de fechas.
 * Devuelve lo mismo que el motor anterior (días con visitas, comidas y nocturnas), para que el formato de día y la app no cambien.
 */

import { placesForScheduler } from './planTrip.js'
import { PRIORITY } from './scheduleDay.js'
import { dinnerZones, recommendedRestaurant } from './dinnerZones.js'
import { MODE_V3 } from './modes.js'
import { tripCalendar } from './tripCalendar.js'
import { closedOnDay, effectiveSchedule, lastEntryMinutes, matchesDateRange, matchesDateToken, parseHoursSessions } from './openingHours.js'
import { sunsetFor } from './sunset.js'
import { tripDays } from './tripSkeleton.js'
import { straightLineMeters } from './travelTimes.js'
import { nocheValida } from './nightLimit.js'
import { availableForTrip, seasonFit } from './availability.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'
import { isStreet } from './localRules.js'
import { ordenarDias, paradasDelDia } from './listasOrden.js'
import { copiarParte, aplicarVariantes, aplicarExperiencias, aplicarOps, aplicarOp, cumple, norm, toMin, toHHMM } from './listasDia.js'
import { crearReglas, valorDe } from './listasReglas.js'

const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))
const slug = (text) => norm(text).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const OUTSIDE_MINUTES = 15
const OUTSIDE_REASONS = { cerrado: 'Hoy cierra', no_cabe: 'Hoy lo ves por fuera para llegar a todo lo del día', viaje_corto: 'En un viaje corto lo ves por fuera: no da tiempo a entrar' }
/** Valores por defecto de las franjas (lo del destino manda: `destination_config.franjas`). Provisional (PREGUNTAS_TANDA6). */
const FRANJAS = {
  inicio: '09:00', comida_desde: '12:00', comida_hasta: '14:30', comida_min: 60, cena_min: 90, cena_desde: '19:30', cena_desde_verano: '20:30', meses_verano: [5, 6, 7, 8, 9], tarde_margen_min: 60,
  llegada: { reserva: 30, turno: 15, tour: 15 }, excursion_tarde_desde: '16:00', hueco_para_parada_corta: 20, cerca_m: 450, andar_max_min: 25,
}

/** Cuántos extras del pool se pueden elegir: 2 días, 2; 3, 3; 4, 4; 5 o más, 5. */
export function poolExtrasLimit(contentDays) {
  return Math.max(2, Math.min(5, contentDays))
}

/** Qué lugares de `pool_lista` ya van en la ruta de ese viaje (sin elegir nada) y cuáles son extras. */
export function poolStatusFor(args) {
  const plan = planListasTrip({ ...args, poolNames: [] })
  if (!plan) return null
  const inside = new Set(plan.days.flatMap((day) => day.schedule?.visits ?? []).filter((visit) => !visit.place.passThrough && !visit.place.passBy).map((visit) => visit.place.name))
  for (const chain of plan.nightsByDay.values()) for (const entry of chain) for (const name of entry.conflicts_with ?? []) inside.add(name)
  const covered = new Set(args.hasFreeTour ? args.destData.default_free_tour?.covers ?? [] : [])
  const lista = args.destData.pool_lista?.lugares ?? []
  const exterior = (name) => args.destData.places?.find((place) => place.name === name)?.type !== 'interior'
  return {
    included: lista.filter((name) => inside.has(name) || (covered.has(name) && exterior(name))),
    extras: lista.filter((name) => !inside.has(name) && !(covered.has(name) && exterior(name))),
    maxExtras: poolExtrasLimit(plan.days.length),
  }
}

/** La nota de una parada a partir de lo que el documento avisa: «Cierra a las 18:15: entra antes», «Abre a las 16:00». */
function avisoDe(stop) {
  const partes = []
  if (stop.cierra) partes.push(`Cierra a las ${stop.cierra}: entra antes`)
  if (stop.abre) partes.push(`Abre a las ${stop.abre}`)
  if (partes.length === 0 && stop.avisos?.length) partes.push(...stop.avisos.map((a) => a.charAt(0).toUpperCase() + a.slice(1)))
  return partes.length ? partes.join('. ') : null
}

/**
 * @param {object} args  destData, written ({ destino, days }), totalDays, hasFreeTour, poolNames, experiencesPositive, dateRangeStartIso, month, season, travel, forceOrder, entradas,
 *                       freeTourDespues, mediaJornada, sinExcursion, mediaExcursion
 * @returns el plan (misma forma que el motor anterior) o null si falta algún día escrito
 */
export function planListasTrip(args) {
  const { destData, written, totalDays, hasFreeTour: hasFreeTourIn = false, poolNames: poolNamesIn = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel, forceOrder = null, entradas = {}, freeTourDespues: freeTourDespuesIn = null, mediaJornada = null, sinExcursion = false, mediaExcursion = null, ajuste = null } = args
  if (!written?.days) return null
  const poolNames = poolNamesIn
  const franjasDestino = written.destino?.franjas ?? destData.destination_config?.franjas ?? {}
  const cfg = { ...FRANJAS, ...franjasDestino, llegada: { ...FRANJAS.llegada, ...(franjasDestino.llegada ?? {}) } }
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const restaurantByName = new Map((destData.restaurants ?? []).map((restaurant) => [restaurant.name, restaurant]))
  const catalogueByName = new Map((destData.night_experiences ?? []).map((entry) => [entry.name, entry]))
  const selected = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const tour = destData.default_free_tour ?? null
  const skeleton = tripDays({ destData, totalDays, hasFreeTour: hasFreeTourIn, dateRangeStartIso, sinExcursion, mediaExcursion })
  const contentDays = skeleton.length
  const cityDays = skeleton.filter((day) => !day.isBlank && !day.isExcursion)
  // Free Tour: en un viaje de 1,5 días o menos NO se ofrece.
  const shortNoTour = cityDays.length === 1 || (cityDays.length === 2 && Boolean(mediaJornada))
  const hasFreeTour = shortNoTour ? false : hasFreeTourIn
  const freeTourDespues = shortNoTour ? null : freeTourDespuesIn
  const tourCovers = new Set(hasFreeTour || freeTourDespues ? tour?.covers ?? [] : [])
  const nivelDe = (name) => placeByName.get(name)?.level ?? null

  const hoursOf = (day) => {
    const dateIso = calendar.dateOfDay(day.dayNumber)
    return { weekday: day.weekday ?? null, season: calendar.season, dateIso, sunset: sunsetFor(destData, { dateIso, season: calendar.season }) }
  }
  const realDateIso = (day) => (calendar.hasDates ? hoursOf(day).dateIso : null)
  const closedThatDay = (name, day, ignoraTemporada = false) => {
    const place = placeByName.get(name)
    if (!place) return false
    const hours = hoursOf(day)
    return closedOnDay(place, hours.weekday, calendar.hasDates ? hours.dateIso : null) || (!ignoraTemporada && !availableForTrip(place.available, calendar, hours.dateIso, poolNames.includes(name)))
  }
  const noTourOn = (day) => {
    const iso = realDateIso(day)
    if (!hasFreeTour || !iso) return false
    return (tour?.disponibilidad?.sin_tour ?? []).some((entry) => matchesDateToken(typeof entry === 'string' ? entry : entry.fecha, iso))
  }
  /** ¿Está abierto de `start` a `start + duration`? { ok } | { closed, opensAt } */
  function openCheck(place, start, duration, hours) {
    if (place.type === 'exterior' && !place.schedule && !place.windows && !place.by_day && !place.by_period && !place.by_season) return { ok: true }
    const sessions = parseHoursSessions(effectiveSchedule(place, hours)).sort((a, b) => a.open - b.open)
    if (sessions.length === 0) return { ok: true }
    const last = lastEntryMinutes(place, start, hours)
    const inside = sessions.find((session) => start >= session.open && start + duration <= session.close)
    if (inside && (last == null || start <= last)) return { ok: true }
    const next = sessions.find((session) => session.open > start)
    return { closed: true, opensAt: next?.open ?? null }
  }

  // ── 1. Qué días van y en qué orden ───────────────────────────────────────────────────────────────────────────
  const ordenado = ordenarDias({
    destData, written, cityDays, contentDays, hasFreeTour, hoursOf, realDateIso, closedThatDay, calendar, poolNames, selected, mediaJornada, forceOrder, noTourOn, tour,
    cerradoA: (lugar, hora, day) => placeByName.get(lugar) && openCheck(placeByName.get(lugar), toMin(hora), 15, hoursOf(day)).ok !== true,
  })
  if (!ordenado) return null
  const { order, dateMoves } = ordenado

  // ── Utilidades de coordenadas y trayectos ────────────────────────────────────────────────────────────────────
  const walkLeg = (from, to) => (Array.isArray(from) && Array.isArray(to) ? Math.round(travel?.leg(from, to)?.minutes ?? Math.round((straightLineMeters(from, to) * 1.3) / 80)) : 0)
  const restaurantCoords = (name) => {
    const c = restaurantByName.get(name)?.coordinates
    return Array.isArray(c) ? c : c ? [c.lat, c.lng] : null
  }
  const sourceOf = (item) => {
    if (item.tipo === 'tour' || (tour && item.lugar === tour.name)) return tour ? { ...tour, isFreeTour: true, level: 1, type: 'exterior', duration_minutes: tour.duration_minutes ?? 150 } : null
    if (item.tipo === 'desayuno') {
      const pause = (destData.curated_breaks ?? []).find((entry) => entry.name === item.lugar)
      return pause ? { ...pause, isBreak: true, level: 3, type: 'exterior', is_free_access: true } : null
    }
    return placeByName.get(item.lugar) ?? null
  }
  const coordsOf = (item) => {
    if (item.kind === 'comida' || item.kind === 'cena') return restaurantCoords(item.restaurante)
    if (item.kind === 'noche') return catalogueByName.get(item.noche)?.coordinates ?? null
    if (item.kind !== 'stop') return null
    if (item.llegada && item.tipo === 'tour' && tour) return tour.coordinates ?? null
    const source = sourceOf(item)
    if (!source) return null
    if (item.modo === 'fuera' || item.modo === 'camino') return source.pass_by?.coordinates ?? source.coordinates ?? null
    return source.coordinates ?? null
  }
  const endCoordsOf = (item) => {
    if (item.kind !== 'stop' || item.llegada) return coordsOf(item)
    const source = sourceOf(item)
    if (item.tipo === 'tour' && tour) return tour.ends_at?.coordinates ?? tour.coordinates ?? null
    return item.modo === 'dentro' || !item.modo ? (Array.isArray(source?.salida) ? source.salida : coordsOf(item)) : coordsOf(item)
  }
  const meters = (a, b) => straightLineMeters(a, b)
  /** Minutos de un traslado escrito (taxi, bus, metro) entre dos puntos. El documento no los da: los calcula el motor por la distancia. */
  const transitMin = (from, to, como) => {
    if (!from || !to) return 15
    const m = meters(from, to)
    return /taxi/i.test(como) && !/bus|metro/i.test(como) ? Math.max(8, Math.round(m / 350) + 6) : Math.max(12, Math.round(m / 250) + 8)
  }
  const transitHow = (como) => {
    const c = String(como).toLowerCase()
    if (/^taxi$/.test(c)) return 'un taxi'
    if (/^bus (\d+) o taxi$/.test(c)) return `el bus ${/\d+/.exec(c)[0]} o un taxi`
    if (/^bus/.test(c)) return `el ${c}`
    if (/^metro/.test(c)) return `el ${c}`
    return c
  }

  const reglas = crearReglas({
    coordsOf, nivelDe, walk: (a, b) => walkLeg(a, b), meters,
    cerradoEnFranja: (item) => item.cerrado_todo_el_dia === true,
  })

  // ── Estado del viaje: lo que ya salió (los días se procesan en orden) ──────────────────────────────────────────
  const estado = {
    vistos: new Set(hasFreeTour ? [...tourCovers] : []), // lo que ya salió como parada o de camino (para «la primera vez»)
    dentro: new Set(), // lo que ya va por dentro
    mesas: new Set(), // restaurantes ya usados
    noches: new Set(), // nocturnas ya usadas
  }
  const problems = []
  const dayNotices = []
  const unplacedPool = []
  const logsViaje = []

  // ── 2. Preparar la lista de cada día: variantes, free tour ─────────────────────────────────────────────────────
  const ftHour = freeTourDespues?.hora ? toMin(freeTourDespues.hora) : null
  const ftFranja = ftHour != null ? (ftHour < 13 * 60 ? 'manana' : ftHour < 19 * 60 ? 'tarde' : 'noche') : freeTourDespues?.franja ?? null
  let ftDayIndex = -1
  if (ftFranja && tour) {
    for (let i = 0; i < order.length; i++) {
      const dia = written.days[order[i]]
      if (!(dia.variantes ?? []).some((v) => v.cuando?.free_tour_despues === ftFranja) || noTourOn(cityDays[i])) continue
      ftDayIndex = i
      break
    }
  }
  const enFechas = (rango, dateIso) => {
    const [desde, hasta] = String(rango).split('..')
    return matchesDateRange(desde, hasta ?? desde, dateIso)
  }
  const contextoDe = (dia, day, hours, parte, index) => ({
    weekday: hours.weekday, dateIso: calendar.hasDates ? hours.dateIso : null, month: hours.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : Number.isInteger(calendar.month) ? calendar.month + 1 : null,
    hasFreeTour, freeTourFranja: ftDayIndex === index ? ftFranja : null, entradas, poolNames, experiencias: selected, orden: order, parte, enFechas,
    cerrado: (name) => closedThatDay(name, day),
  })

  const preparar = (id, index) => {
    const dia = written.days[id]
    const day = cityDays[index]
    const hours = hoursOf(day)
    const franjaMedio = mediaJornada?.franja ?? (index === 0 ? 'tarde' : 'manana')
    const parteKey = dia.partes.unica ? 'unica' : dia.partes[franjaMedio] ? franjaMedio : Object.keys(dia.partes)[0]
    const parte = dia.partes[parteKey]
    let base = copiarParte(parte)
    if (dia.hereda_manana_de) base.manana = clone(written.days[dia.hereda_manana_de].partes.unica.manana)
    if (!base.empieza && dia.empieza) base.empieza = dia.empieza
    const aplicadas = []
    const ctx = contextoDe(dia, day, hours, parteKey === 'unica' ? null : parteKey, index)
    let trabajo = aplicarVariantes(base, dia, ctx, aplicadas)
    // El Free Tour que el viajero añade: la hora que él eligió.
    const marca = (lista) => lista.map((stop) => (stop.hora === '$free_tour' ? { ...stop, hora: freeTourDespues?.hora ?? '17:00' } : stop))
    trabajo = { ...trabajo, manana: marca(trabajo.manana), tarde: marca(trabajo.tarde) }
    const log = []
    // Un día sin Free Tour (festivo): el tour no se pone.
    if (tour && noTourOn(day) && [...trabajo.manana, ...trabajo.tarde].some((stop) => stop.lugar === tour.name)) {
      trabajo = { ...trabajo, manana: trabajo.manana.filter((s) => s.lugar !== tour.name), tarde: trabajo.tarde.filter((s) => s.lugar !== tour.name) }
      aplicadas.push('sin_free_tour')
    }
    return { id, index, dia, day, hours, parteKey, trabajo, aplicadas, log, ctx, pooled: [], soloTarde: Boolean(day.halfDayExcursion?.soloTarde) }
  }
  const drafts = order.map((id, index) => preparar(id, index))

  // ── 3. Pool: cada lugar elegido, en el sitio que escribe el documento ────────────────────────────────────────
  const minutosDentro = written.destino?.minutos_por_dentro ?? destData.destination_config?.minutos_por_dentro ?? {}
  const poolOrder = destData.pool_lista?.lugares ?? []
  const orderedPool = [...poolNames].sort((a, b) => (poolOrder.indexOf(a) < 0 ? 999 : poolOrder.indexOf(a)) - (poolOrder.indexOf(b) < 0 ? 999 : poolOrder.indexOf(b)))
  const stopsOfTrabajo = (trabajo) => [...trabajo.manana, ...trabajo.tarde]
  let extrasUsados = 0
  const extrasLimit = poolExtrasLimit(contentDays)
  for (const name of orderedPool) {
    const place = placeByName.get(name)
    // Lo que ya va por dentro: ya incluido.
    if (drafts.some((d) => stopsOfTrabajo(d.trabajo).some((s) => s.lugar === name && s.modo === 'dentro'))) continue
    // Lo que va por fuera o de camino en un día (y ese día abre): pasa a por dentro, con lo que dura por dentro.
    const anfitrion = place?.type === 'interior' ? drafts.find((d) => !closedThatDay(name, d.day) && stopsOfTrabajo(d.trabajo).some((s) => s.lugar === name && s.modo !== 'dentro' && s.tipo !== 'traslado')) : null
    if (anfitrion) {
      for (const key of ['manana', 'tarde']) {
        anfitrion.trabajo[key] = anfitrion.trabajo[key].map((s) => (s.lugar === name && s.tipo !== 'traslado' && s.modo !== 'dentro' ? { ...s, modo: 'dentro', min: Math.max(s.min ?? 0, minutosDentro[name] ?? Math.min(place?.duration_minutes ?? 60, 60)), protegido: true, titulo: s.modo === 'camino' ? undefined : s.titulo } : s))
      }
      anfitrion.aplicadas.push(`pool:${name}`)
      continue
    }
    // Lo que ya sale de otra forma (por dentro de otro modo) en algún día: nada que hacer.
    if (drafts.some((d) => stopsOfTrabajo(d.trabajo).some((s) => s.lugar === name && s.modo !== 'camino' && s.tipo !== 'traslado'))) continue
    if (hasFreeTour && tourCovers.has(name) && place?.type !== 'interior') continue
    if (extrasUsados >= extrasLimit) {
      unplacedPool.push({ unitId: name, name, reason: 'pool_limit', dayNumber: null })
      continue
    }
    extrasUsados++
    const candidatos = drafts
      .map((d, position) => ({ d, position, def: d.dia.pool?.[name] ?? null }))
      .filter((c) => c.def && cumple(c.def.cuando, c.d.ctx))
    candidatos.sort((x, y) => Number(closedThatDay(name, x.d.day)) - Number(closedThatDay(name, y.d.day)) || (y.def.prioridad ?? 0) - (x.def.prioridad ?? 0) || x.position - y.position)
    const elegido = candidatos[0]
    if (!elegido) {
      unplacedPool.push({ unitId: name, name, reason: 'no_room', dayNumber: null })
      continue
    }
    elegido.d.trabajo = aplicarOps(elegido.d.trabajo, elegido.def.ops)
    elegido.d.aplicadas.push(`pool:${name}`)
    elegido.d.pooled.push(name)
    if (closedThatDay(name, elegido.d.day)) {
      unplacedPool.push({ unitId: name, name, reason: 'closed_on_day', dayNumber: elegido.d.day.dayNumber, closed: { dateIso: realDateIso(elegido.d.day), weekday: hoursOf(elegido.d.day).weekday }, closedWeekly: (place?.closed_on ?? []).length > 0 })
    }
  }

  // ── 4. Experiencias: lo que cada una añade o cambia, una vez por viaje, en el primer día que lo trae ─────────────
  for (const exp of selected) {
    for (const d of drafts) {
      const def = d.dia.experiencias?.[exp]
      if (!def || !cumple(def.cuando, d.ctx)) continue
      // (Lo que la experiencia añade y el viaje ya lleva no se repite.)
      if (def.lugar && drafts.some((o) => stopsOfTrabajo(o.trabajo).some((s) => s.lugar === def.lugar && s.modo !== 'camino' && s.tipo !== 'traslado' && !s.capa))) continue
      if (def.lugar && closedThatDay(def.lugar, d.day)) continue
      if (def.lugar) {
        const fit = seasonFit(placeByName.get(def.lugar)?.available, calendar, hoursOf(d.day).dateIso)
        if (placeByName.get(def.lugar)?.available && !(fit.enters && !fit.notice)) continue
      }
      d.trabajo = aplicarOps(d.trabajo, def.ops)
      d.aplicadas.push(`experiencia:${exp}`)
      break
    }
  }

  // ── 5. Reservas del viajero: la hora que él eligió manda ─────────────────────────────────────────────────────
  for (const [lugar, hora] of Object.entries(entradas ?? {})) {
    const host = drafts.find((d) => stopsOfTrabajo(d.trabajo).some((s) => s.lugar === lugar && s.tipo !== 'traslado' && s.modo !== 'camino'))
    if (!host) continue
    const place = placeByName.get(lugar)
    for (const key of ['manana', 'tarde']) {
      let marcada = false
      host.trabajo[key] = host.trabajo[key].map((s) => {
        if (marcada || s.lugar !== lugar || s.tipo === 'traslado' || s.modo === 'camino') return s
        marcada = true
        return { ...s, modo: 'dentro', hora, hora_tipo: 'reserva', min: Math.max(s.min ?? 0, minutosDentro[lugar] ?? Math.min(place?.duration_minutes ?? 60, 90)), protegido: true }
      })
    }
    host.aplicadas.push(`reserva:${hora}`)
  }

  // ── Un día: de la lista al día con sus horas orientativas ───────────────────────────────────────────────────────
  function procesarDia(draft, skeletonDay) {
    const { hours, dia } = draft
    const log = draft.log
    const dayNumber = skeletonDay.dayNumber
    const dateIso = realDateIso(skeletonDay)
    const fecha = hours.dateIso ?? null
    const empiezaMin = toMin(draft.soloTarde ? cfg.excursion_tarde_desde : draft.trabajo.empieza ?? cfg.inicio)
    const verano = hours.dateIso ? cfg.meses_verano.includes(Number(String(hours.dateIso).slice(5, 7))) : false
    const cenaDesde = toMin(verano ? cfg.cena_desde_verano : cfg.cena_desde)
    const tardeHasta = cenaDesde + cfg.tarde_margen_min
    const spare = []
    const quitadas = []

    // 5.1 La lista de trabajo en una sola secuencia de elementos.
    let n = 0
    const ids = new Set()
    const idDe = (campos) => {
      let id = `${campos.tipo ?? campos.kind}_${slug(campos.titulo ?? campos.lugar ?? campos.restaurante ?? campos.noche ?? campos.como ?? 'x')}`
      let k = 2
      while (ids.has(id)) id = `${id.replace(/_\d+$/, '')}_${k++}`
      ids.add(id)
      return id
    }
    const aItem = (stop, franja) => ({ ...stop, kind: stop.tipo === 'traslado' ? 'traslado' : 'stop', franja, id: idDe(stop), nivel: nivelDe(stop.lugar), n: n++ })
    let items = []
    const t = draft.trabajo
    if (!draft.soloTarde) {
      for (const stop of t.manana) items.push(aItem(stop, 'manana'))
      if (t.comida) items.push({ ...t.comida, kind: 'comida', franja: 'comida', id: idDe({ kind: 'comida', restaurante: t.comida.restaurante }), min: cfg.comida_min, restaurante_escrito: t.comida.restaurante })
    }
    for (const stop of t.tarde) items.push(aItem(stop, 'tarde'))
    if (t.cena) items.push({ ...t.cena, kind: 'cena', franja: 'cena', id: idDe({ kind: 'cena', restaurante: t.cena.restaurante }), min: cfg.cena_min, restaurante_escrito: t.cena.restaurante })
    if (draft.soloTarde) for (const stop of t.manana) quitadas.push({ ...stop, motivo: 'excursión de medio día: de 8:00 a 14:00 el viajero está fuera; la ciudad empieza a las 16:00' })

    // (El orden de la lista escrita tal como llega, antes de tocar nada: la prueba compara el día con esto.)
    const ordenBase = items.map((it) => it.id)
    // 5.2 Lo que el Free Tour recorre sale de la lista cuando la variante lo pide (el Free Tour que el viajero añade para esa franja).
    if (t.quitar_cubierto_por_tour && tour) {
      items = items.filter((item) => {
        if (item.kind !== 'stop' || !tourCovers.has(item.lugar) || item.modo === 'camino' || item.hora) return true
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'quitada', causa: 'Lo ves en el Free Tour' })
        return false
      })
    }

    /** Cerrado todo el rato de su franja (la mañana hasta las 14:30; la tarde desde las 12:00): no abre cuando le toca. */
    const cerradoEnFranja = (item, source) => {
      if (item.modo === 'camino' || item.modo === 'fuera' || item.tipo !== 'parada' || item.hora_tipo === 'reserva' || source.type !== 'interior') return false
      const sesiones = parseHoursSessions(effectiveSchedule(source, hours))
      if (sesiones.length === 0) return false
      const ventana = item.franja === 'manana' ? [7 * 60, toMin(cfg.comida_hasta)] : [toMin(cfg.comida_desde), 22 * 60]
      return !sesiones.some((s) => Math.min(s.close, ventana[1]) - Math.max(s.open, ventana[0]) >= Math.min(item.min ?? 20, 20))
    }
    // 5.3 Cierres: lo cerrado ese día sale con «Cerrado hoy» (o por fuera si se ve desde la calle, o su alternativa escrita).
    const sinTraslado = (lista, destinoId) => lista.filter((it, i) => !(it.kind === 'traslado' && lista[i + 1]?.id === destinoId))
    items = items.flatMap((item) => {
      if (item.kind !== 'stop' || item.llegada) return [item]
      const source = sourceOf(item)
      if (!source || source.isFreeTour || source.isBreak || item.modo === 'camino') return [item]
      if (!closedThatDay(item.lugar, skeletonDay, item.ignora_temporada === true) && !cerradoEnFranja(item, source)) return [item]
      // Una reserva del viajero con el sitio cerrado se queda y avisa (manda él).
      if (item.hora_tipo === 'reserva' && item.hora) {
        problems.push({ tipo: 'reserva_cerrada', lugar: item.lugar, hora: item.hora, cierre: null, dayNumber })
        return [{ ...item, cerrado_todo_el_dia: false }]
      }
      if (item.si_cerrado?.cambiar_titulo) {
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'titulo', causa: `${item.lugar} está cerrado hoy: la parada es «${item.si_cerrado.cambiar_titulo}»` })
        return [{ ...item, titulo: item.si_cerrado.cambiar_titulo, modo: 'fuera', min: item.si_cerrado.min ?? Math.min(item.min, source.minutos_fuera ?? 10), motivo_fuera: OUTSIDE_REASONS.cerrado }]
      }
      const sePuedeFuera = source.minutos_fuera != null || source.pass_by || source.type === 'exterior'
      if (sePuedeFuera) {
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'modo', causa: `cierre de ${item.lugar}: hoy cierra, por fuera` })
        return [{ ...item, modo: 'fuera', min: Math.min(item.min, source.minutos_fuera ?? OUTSIDE_MINUTES), motivo_fuera: OUTSIDE_REASONS.cerrado }]
      }
      log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'quitada', causa: `cierre de ${item.lugar}` })
      quitadas.push({ ...item, motivo: 'Cerrado hoy' })
      if (poolNames.includes(item.lugar) && !unplacedPool.some((u) => u.name === item.lugar)) unplacedPool.push({ unitId: item.lugar, name: item.lugar, reason: 'closed_on_day', dayNumber, closed: { dateIso, weekday: hours.weekday }, closedWeekly: (source.closed_on ?? []).length > 0 })
      return []
    })
    // (Un traslado que lleva a lo que se quitó, o que se queda sin nada detrás, no tiene sentido.)
    items = items.filter((item, i) => !(item.kind === 'traslado' && (!items[i + 1] || items[i + 1].kind === 'traslado')))

    // 5.4 Por dentro una sola vez en el viaje: lo que un día anterior ya llevó por dentro va por fuera (si se puede) y más corto; la reserva y lo de solo por dentro, no.
    items = items.map((item) => {
      if (item.kind !== 'stop' || item.modo !== 'dentro' || !estado.dentro.has(item.lugar)) return item
      const source = sourceOf(item)
      const sePuedeFuera = source?.minutos_fuera != null || source?.pass_by || source?.type === 'exterior'
      if (item.hora_tipo === 'reserva' || item.hora || !sePuedeFuera) return item
      log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'modo+min', causa: 'por dentro una sola vez en el viaje: ya va por dentro otro día' })
      return { ...item, modo: 'fuera', min: Math.min(item.min, source?.minutos_fuera ?? OUTSIDE_MINUTES), hora_tipo: undefined }
    })

    // 5.5 La «Llegada a…» de cada reserva, turno y Free Tour: 30 min antes de una reserva, 15 antes de un turno o del tour.
    const conLlegada = (lista) => lista.flatMap((item) => {
      if (item.kind !== 'stop' || item.llegada || !(item.hora_tipo || item.tipo === 'tour')) return [item]
      if (item.llegada_incluida) return [item]
      const tipoLlegada = item.tipo === 'tour' ? 'tour' : item.hora_tipo === 'reserva' ? 'reserva' : 'turno'
      const margen = cfg.llegada[tipoLlegada]
      const info = written.destino?.llegadas ?? {}
      const texto = tipoLlegada === 'tour' ? `${info.free_tour?.texto ?? ''}${tour?.meeting_point ? ` Punto de encuentro: ${tour.meeting_point}.` : ''}`.trim() : info.por_lugar?.[item.lugar] ?? info[tipoLlegada]?.texto ?? null
      const titulo = tipoLlegada === 'tour' ? info.free_tour?.titulo ?? 'Llegada al punto de encuentro del Free Tour' : `Llegada a ${item.lugar}`
      const llegada = { kind: 'stop', tipo: tipoLlegada === 'tour' ? 'tour' : 'parada', llegada: true, lugar: item.lugar, titulo, texto_llegada: texto, min: margen, modo: 'fuera', franja: item.franja, id: idDe({ tipo: 'llegada', lugar: item.lugar }), de: item.id, hora: item.hora ? toHHMM(toMin(item.hora) - margen) : undefined }
      return [llegada, { ...item, llegada_incluida: true }]
    })
    items = conLlegada(items)

    // ── Horas orientativas: la suma de lo que dura cada parada más el trayecto ─────────────────────────────────
    const startPoint = { t: empiezaMin }
    const simular = (lista, desde = startPoint.t, prev0 = null) => {
      let t = desde
      let prev = prev0
      let pendiente = null
      return lista.map((item) => {
        if (item.kind === 'traslado') { pendiente = item; return { ...item, t0: t, t1: t, leg: 0 } }
        const c = coordsOf(item)
        let leg = 0
        let transit = null
        if (prev && c) {
          if (pendiente) { leg = transitMin(prev, c, pendiente.como); transit = { como: pendiente.como, min: leg } } else {
            leg = walkLeg(prev, c)
            // Un tramo de más de 25 min andando no va a pie: en taxi.
            if (leg > cfg.andar_max_min) { leg = Math.min(leg, transitMin(prev, c, 'taxi')); transit = { como: 'taxi', min: leg } }
          }
        }
        pendiente = null
        const llega = t + leg
        let start = llega
        let tarde = 0
        if (item.kind === 'comida') start = Math.max(llega, toMin(cfg.comida_desde))
        else if (item.kind === 'cena') start = Math.max(llega, cenaDesde)
        if (item.no_antes) start = Math.max(start, toMin(item.no_antes))
        if (item.hora) {
          const fija = toMin(item.hora)
          if (llega <= fija) start = fija
          else { start = llega; tarde = llega - fija }
        }
        const end = start + (item.min ?? 0)
        t = end
        prev = endCoordsOf(item) ?? c ?? prev
        return { ...item, t0: start, t1: end, leg, llegaA: llega, tarde, ...(transit ? { transit } : {}) }
      })
    }

    // 5.6 Restaurantes: el escrito; si no, su alternativa; si no, un restaurante de verdad a menos de 10 min; si no, el escrito aunque se repita.
    const recambio = destData.destination_config?.recambio_restaurante ?? { tipos: ['restaurante', 'pizzeria'], max_andar_min: 10 }
    const abiertoA = (name, meal, start) => recommendedRestaurant(destData, { names: [name], meal, near: null, weekday: hours.weekday, dateIso, exclude: null, at: start })?.name === name
    const elegirMesas = (lista) => {
      const sim = simular(lista)
      const usadasHoy = new Set()
      return lista.map((item, i) => {
        if (item.kind !== 'comida' && item.kind !== 'cena') return item
        const meal = item.kind === 'cena' ? 'cena' : 'comida'
        const start = sim[i].t0
        const original = item.restaurante_escrito ?? item.restaurante
        const candidatas = [original, item.alternativa, item.tercera].filter(Boolean)
        const libre = (name) => !estado.mesas.has(name) && !usadasHoy.has(name)
        const porque = (name) => (!abiertoA(name, meal, start) ? 'cierra ese día o a esa hora' : 'ya sale en el viaje')
        const descartadas = () => candidatas.filter((name) => !libre(name) || !abiertoA(name, meal, start)).map((name) => `${name} ${porque(name)}`).join('; ')
        let name = candidatas.find((candidata) => abiertoA(candidata, meal, start) && libre(candidata))
        let motivo = null
        if (!name) {
          const origen = restaurantCoords(original)
          const buenos = (destData.restaurants ?? [])
            .filter((r) => !candidatas.includes(r.name) && recambio.tipos.includes(r.tipo_local) && libre(r.name) && abiertoA(r.name, meal, start))
            .map((r) => ({ name: r.name, andar: origen && restaurantCoords(r.name) ? walkLeg(origen, restaurantCoords(r.name)) : Infinity }))
            .filter((x) => x.andar <= recambio.max_andar_min)
            .sort((x, y) => x.andar - y.andar || x.name.localeCompare(y.name, 'es'))
          name = buenos[0]?.name ?? null
          if (name) motivo = `${descartadas()}: va ${name}, un restaurante de verdad a ${buenos[0].andar} min andando`
        }
        if (!name) {
          name = candidatas.find((candidata) => abiertoA(candidata, meal, start)) ?? original
          if (!libre(name)) log.push({ id: item.id, lugar: name, sitio: null, que: 'aviso', causa: `restaurante repetido en el viaje: ${name} (no hay un restaurante de verdad abierto a menos de ${recambio.max_andar_min} min andando)` })
        }
        usadasHoy.add(name)
        if (name !== original && !log.some((l) => l.id === item.id && l.que === 'restaurante')) log.push({ id: item.id, lugar: original, sitio: null, que: 'restaurante', causa: motivo ?? `${descartadas()}: va ${name}` })
        return name === item.restaurante ? item : { ...item, restaurante: name }
      })
    }

    // 5.7 Lo que tiene hora fija va a su hora (3.3).
    const baseSinColocar = items
    const anclar = (lista) => {
      let out = lista
      const fijos = out.filter((it) => it.kind === 'stop' && it.hora && !it.llegada && !it.fijo_colocado).sort((a, b) => toMin(a.hora) - toMin(b.hora))
      let congeladoHasta = 0
      for (const f of fijos) {
        const colocada = colocarFija(out, f, congeladoHasta)
        if (!colocada) {
          log.push({ id: f.id, lugar: f.titulo ?? f.lugar, sitio: f.lugar, que: 'aviso', causa: `${f.hora}: colocar ${f.titulo ?? f.lugar} a su hora rompería una comprobación de siempre: se queda donde está` })
          out = out.map((it) => (it.id === f.id ? { ...it, fijo_colocado: true } : it))
        } else out = colocada.map((it) => (it.id === f.id ? { ...it, fijo_colocado: true } : it))
        congeladoHasta = Math.max(0, out.findIndex((it) => it.id === f.id))
      }
      return out
    }
    /**
     * Pone una parada con hora fija a su hora (3.3): antes va lo que cabe, de lo que ya iba antes y de lo que iba después, en el mismo orden; lo demás, detrás.
     * Se prueba con todo lo que cabe y, si eso rompe una comprobación de siempre (un zigzag, la pirámide), con un poco menos, hasta dar con algo que no rompa
     * ninguna. Con lo que sobra de tiempo antes: una parada corta pegada al sitio o, si no hay, el día empieza más tarde.
     */
    const colocarFija = (lista, F, desde) => {
      const L = lista.find((it) => it.llegada && it.de === F.id) ?? null
      const resto = lista.filter((it) => it !== F && it !== L)
      const margen = L ? L.min : 0
      const limite = toMin(F.hora) - margen
      const coordsF = coordsOf(F)
      const llegadaDe = (lista) => {
        const prefijo = simular(lista)
        const ultimo = prefijo.at(-1)
        const finT = ultimo ? ultimo.t1 : startPoint.t
        const previo = [...prefijo].reverse().find((it) => it.kind !== 'traslado')
        const prevC = previo ? endCoordsOf(previo) : null
        return finT + (prevC && coordsF ? walkLeg(prevC, coordsF) : 0)
      }
      const llegadaSi = (p) => llegadaDe(resto.slice(0, p))
      const minP = Math.min(desde, resto.length)
      let pMax = minP
      while (pMax < resto.length && !(resto[pMax].kind === 'stop' && resto[pMax].hora && !resto[pMax].fijo_colocado) && llegadaSi(pMax + 1) <= limite) pMax++
      const base = reglas.todas(lista, { vistosAntes: estado.vistos, dentroAntes: estado.dentro })
      const candidatos = []
      for (let p = pMax; p >= minP; p--) {
        // No se deja un traslado colgando al final del prefijo: viaja con lo que va detrás.
        if (p > minP && resto[p - 1].kind === 'traslado') continue
        const hueco = limite - llegadaSi(p)
        const relleno = hueco >= cfg.hueco_para_parada_corta ? cercanaA(F, hueco, resto, resto.slice(0, p)) : null
        let nuevo = [...resto.slice(0, p), ...(relleno ? [relleno] : []), ...(L ? [L] : []), F, ...resto.slice(p)]
        // Si colocarla rompe una comprobación (un zigzag que antes no había), lo que la rompe y se puede quitar pasa a «Si te sobra tiempo»; si no se puede, ese prefijo no vale.
        const sobran = []
        let valido = true
        for (let guard = 0; guard < 30; guard++) {
          const despues = reglas.todas(nuevo, { spare: sobran, vistosAntes: estado.vistos, dentroAntes: estado.dentro })
          const nuevas = reglas.nuevas(base, despues)
          if (nuevas.length === 0) break
          const culpable = nuevas.map((v) => nuevo.find((it) => it.id === v.clave.split('>').at(-1))).find((it) => it && it !== F && it.kind === 'stop' && !esFijo(it) && !esPrimeraVez(nuevo, it) && !it.relleno_no_quitar)
          if (!culpable) { valido = false; break }
          sobran.push({ ...culpable, spareReason: 'No cabía en su sitio por la hora de tu reserva' })
          nuevo = mandarASobra(nuevo, culpable).lista
        }
        if (!valido) continue
        const resta = relleno ? limite - llegadaDe([...resto.slice(0, p), relleno]) : hueco
        candidatos.push({ p, hueco, relleno, nuevo, sobran, resta: Math.max(0, resta) })
      }
      // El que más deja en su sitio: cada parada que pasa a «Si te sobra tiempo» cuenta como 45 min de día que empieza más tarde; a igual, más de lo que ya iba antes.
      const coste = (c) => c.sobran.length + c.resta / 45
      candidatos.sort((x, y) => coste(x) - coste(y) || y.p - x.p)
      const elegido = candidatos[0]
      if (!elegido) return null
      const { hueco, relleno, nuevo, sobran } = elegido
      if (relleno) log.push({ id: relleno.id, lugar: relleno.lugar, sitio: relleno.lugar, que: 'nueva', causa: `antes de ${F.titulo ?? F.lugar} (a las ${F.hora}) quedaban ${hueco} min: entra una parada corta pegada al sitio` })
      for (const item of sobran) {
        spare.push({ ...item, franja: item.franja })
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'sobra', causa: `poner ${F.titulo ?? F.lugar} a su hora (${F.hora}) lo dejaba volviendo sobre sus pasos: pasa a «Si te sobra tiempo»` })
      }
      // Lo que queda después de la parada corta (o todo el hueco, si no hay ninguna): el día empieza más tarde.
      const resta = elegido.resta
      if (resta > 0) {
        startPoint.t += resta
        log.push({ id: F.id, lugar: F.titulo ?? F.lugar, sitio: F.lugar, que: 'hora', causa: `${F.titulo ?? F.lugar} es a las ${F.hora}: el día empieza ${resta} min más tarde` })
      }
      return nuevo
    }
    /** Una parada corta pegada al sitio (a poca distancia, exterior, que el viaje no lleve ya), con su sitio en roma.json. */
    const cercanaA = (F, hueco, resto, prefijo) => {
      const c = coordsOf(F)
      if (!c) return null
      const yaSale = new Set([...estado.vistos, ...items.filter((it) => it.lugar).map((it) => it.lugar), ...resto.map((it) => it.lugar).filter(Boolean)])
      const prev = [...prefijo].reverse().find((it) => it.kind !== 'traslado')
      const prevC = prev ? endCoordsOf(prev) : null
      const candidatos = (destData.places ?? [])
        .filter((place) => !yaSale.has(place.name) && (place.type === 'exterior' || place.minutos_fuera != null) && Array.isArray(place.coordinates) && !closedThatDay(place.name, skeletonDay) && !place.available && !place.capa_de && !(place.tags ?? []).includes('mercadillo_navideno'))
        .map((place) => ({ place, d: meters(c, place.coordinates), min: Math.min(place.minutos_fuera ?? place.duration_minutes ?? 15, 20) }))
        .filter(({ d, min, place }) => d <= cfg.cerca_m && min >= 10 && (prevC ? walkLeg(prevC, place.coordinates) : 0) + min + walkLeg(place.coordinates, c) <= hueco + 5)
        .sort((a, b) => (a.place.level ?? 3) - (b.place.level ?? 3) || a.d - b.d)
      const mejor = candidatos[0]
      return mejor ? { kind: 'stop', tipo: 'parada', lugar: mejor.place.name, modo: 'fuera', min: mejor.min, franja: F.franja, id: idDe({ tipo: 'parada', lugar: mejor.place.name }), relleno: 'ancla', relleno_no_quitar: true } : null
    }

    // 5.8 Que quepa: por franja; la comida, como muy tarde a las 14:30.
    const esFijo = (item) => Boolean(item.hora || item.hora_tipo || item.tipo === 'tour' || item.llegada || item.fijo_colocado)
    const esPrimeraVez = (lista, item) => {
      if ((nivelDe(item.lugar) ?? 3) !== 1) return false
      if (estado.vistos.has(item.lugar)) return false
      return !lista.slice(0, lista.indexOf(item)).some((other) => other.kind === 'stop' && other.lugar === item.lugar)
    }
    const fueraMin = (item) => Math.min(item.min, placeByName.get(item.lugar)?.minutos_fuera ?? OUTSIDE_MINUTES)
    const exceso = (lista) => {
      const sim = simular(lista)
      const comida = sim.find((it) => it.kind === 'comida')
      const cena = sim.find((it) => it.kind === 'cena')
      const manana = sim.filter((it) => it.franja === 'manana' && it.kind === 'stop')
      const tarde = sim.filter((it) => it.franja === 'tarde' && it.kind === 'stop')
      const limiteComida = toMin(cfg.comida_hasta)
      const maniana = comida ? comida.llegaA - limiteComida : manana.length ? manana.at(-1).t1 - limiteComida : 0
      // La tarde acaba como tarde a la hora de la cena más el margen; si no hay cena, a esa hora.
      const finTarde = tarde.length ? tarde.at(-1).t1 : 0
      const sinCena = finTarde - tardeHasta
      const conCena = cena ? cena.llegaA - (tardeHasta + 30) : 0
      return { manana: maniana, tarde: Math.max(sinCena, conCena), sim }
    }
    const baseReglas = (lista) => reglas.todas(lista, { vistosAntes: estado.vistos, dentroAntes: estado.dentro })
    /** Quita una parada (y lo que solo existía para ella: su llegada y su traslado) y la manda a «Si te sobra tiempo». */
    const mandarASobra = (lista, item, motivo) => {
      const quitar = new Set([item.id])
      lista.forEach((it, i) => {
        if (it.llegada && it.de === item.id) quitar.add(it.id)
        if (it.kind === 'traslado' && lista[i + 1]?.id === item.id) quitar.add(it.id)
      })
      const nueva = lista.filter((it) => !quitar.has(it.id))
      // Un traslado que se queda sin destino (detrás de él ya no hay una parada de su franja) se va también.
      return { lista: nueva.filter((it, i) => !(it.kind === 'traslado' && (!nueva[i + 1] || nueva[i + 1].kind === 'traslado'))), motivo }
    }
    const reducir = (lista, franja) => {
      const antes = baseReglas(lista)
      const candidatos = lista
        .filter((it) => it.kind === 'stop' && it.franja === franja && !esFijo(it) && !esPrimeraVez(lista, it) && it.tipo !== 'desayuno' && !it.relleno_no_quitar)
        .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
      // Mañana: antes de quitar, se acorta lo de menos (por dentro → por fuera, y lo de por fuera se queda de camino).
      if (franja === 'manana') {
        for (const item of candidatos) {
          if (item.modo === 'dentro' && !item.protegido) {
            const nuevo = lista.map((it) => (it.id === item.id ? { ...it, modo: 'fuera', min: fueraMin(it) } : it))
            if (reglas.nuevas(antes, baseReglas(nuevo)).length === 0 && fueraMin(item) < item.min) {
              log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'modo+min', causa: 'la comida iba a caer tarde: lo de menos de la mañana pasa de por dentro a por fuera' })
              return nuevo
            }
          }
        }
        for (const item of candidatos) {
          if (item.modo === 'fuera' && !esPrimeraVez(lista, item) && (nivelDe(item.lugar) ?? 3) >= 2 && item.min > 5) {
            const nuevo = lista.map((it) => (it.id === item.id ? { ...it, modo: 'camino', min: 5 } : it))
            if (reglas.nuevas(antes, baseReglas(nuevo)).length === 0) {
              log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'modo+min', causa: 'la comida iba a caer tarde: lo de menos de la mañana se queda de camino' })
              return nuevo
            }
          }
        }
      }
      for (const item of candidatos) {
        const { lista: nueva } = mandarASobra(lista, item)
        const sp = [...spare, { ...item, franja }]
        const despues = reglas.todas(nueva, { spare: sp, vistosAntes: estado.vistos, dentroAntes: estado.dentro })
        if (reglas.nuevas(antes, despues).length > 0) continue
        spare.push({ ...item, franja, spareReason: franja === 'manana' ? 'No cabía en la mañana' : 'No cabía en la tarde' })
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'sobra', causa: franja === 'manana' ? 'no cabe en la mañana (la comida iba a caer después de las 14:30): pasa a «Si te sobra tiempo»' : 'no cabe en la tarde: pasa a «Si te sobra tiempo»' })
        return nueva
      }
      return null
    }
    const ajustar = (lista) => {
      let out = lista
      for (let guard = 0; guard < 80; guard++) {
        const e = exceso(out)
        if (e.manana > 0) {
          const siguiente = reducir(out, 'manana')
          if (siguiente) { out = siguiente; continue }
        }
        if (e.tarde > 0) {
          const siguiente = reducir(out, 'tarde')
          if (siguiente) { out = siguiente; continue }
        }
        if (e.manana > 0 || e.tarde > 0) log.push({ id: null, lugar: null, sitio: null, que: 'aviso', causa: `no cabe del todo (${Math.max(e.manana, e.tarde)} min de más) y no queda nada que quitar sin romper una comprobación` })
        break
      }
      return out
    }

    // El orden: el día tal cual → fijas a su hora → restaurantes → que quepa (con las mesas elegidas) → mesas otra vez con las horas hechas.
    items = elegirMesas(items)
    items = anclar(items)
    items = ajustar(items)
    items = elegirMesas(items)
    items = ajustar(items)
    items = elegirMesas(items)
    let final = simular(items)
    // HOY: «Voy con retraso» y «Estoy cansado». Lo hecho se queda; lo que falta se recalcula desde ahora.
    if (ajuste && ajuste.dayNumber === dayNumber) {
      const hechoDe = (it) => it.kind === 'stop' && !it.llegada && (ajuste.doneNames ?? []).some((n) => n === it.lugar || n === it.titulo)
      const marcada = items.map((it) => (hechoDe(it) ? { ...it, hecho: true } : it))
      const comida = final.find((it) => it.kind === 'comida')
      const franjaActual = comida && ajuste.nowMinutes < comida.t0 ? 'manana' : 'tarde'
      const sobrarUna = (lista, filtro) => {
        const antes = baseReglas(lista)
        const candidatos = lista
          .filter((it) => it.kind === 'stop' && !it.hecho && !esFijo(it) && !esPrimeraVez(lista, it) && it.tipo !== 'desayuno' && filtro(it))
          .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
        for (const item of candidatos) {
          const { lista: nueva } = mandarASobra(lista, item)
          const despues = reglas.todas(nueva, { spare: [...spare, { ...item }], vistosAntes: estado.vistos, dentroAntes: estado.dentro })
          if (reglas.nuevas(antes, despues).length > 0) continue
          spare.push({ ...item, spareReason: ajuste.mode === 'cansado' ? 'Lo has dejado para otro rato' : 'Lo has dejado por el retraso' })
          log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'sobra', causa: ajuste.mode === 'cansado' ? 'estoy cansado: solo se queda lo de nivel 1 y 2' : 'voy con retraso: lo de menos importancia de la franja pasa a «Si te sobra tiempo»' })
          return nueva
        }
        return null
      }
      let nueva = marcada
      if (ajuste.mode === 'cansado') {
        for (let guard = 0; guard < 40; guard++) {
          const siguiente = sobrarUna(nueva, (it) => (nivelDe(it.lugar) ?? 3) >= 3)
          if (!siguiente) break
          nueva = siguiente
        }
      } else {
        nueva = sobrarUna(nueva, (it) => it.franja === franjaActual) ?? nueva
      }
      const sim0 = simular(nueva)
      const hechos = sim0.filter((it) => it.hecho)
      const resto = nueva.filter((it) => !it.hecho)
      const ultimoHecho = hechos.at(-1)
      const desde = Math.max(ajuste.nowMinutes, ultimoHecho ? ultimoHecho.t1 : 0)
      final = [...hechos, ...simular(resto, desde, ultimoHecho ? endCoordsOf(ultimoHecho) : null)]
    }

    // 5.9 Nocturnas (regla 12): la escrita; si ya salió, la imprescindible que falte; si no, la más cercana a la cena que no haya salido.
    const noches = nochesDelDia(draft, final, hours, fecha)
    const escritoNights = noches.map((nocheItem) => ({ ...catalogueByName.get(nocheItem.noche), fixedStart: nocheItem.t0, fixedMinutes: nocheItem.min, wholeWalk: true })).filter((e) => e.name)

    // 5.10 Lo que cuenta como visto para los días que vienen.
    for (const item of final) {
      if (item.kind === 'comida' || item.kind === 'cena') estado.mesas.add(item.restaurante)
      if (item.kind !== 'stop' || item.llegada) continue
      estado.vistos.add(item.lugar)
      if (item.modo === 'dentro') estado.dentro.add(item.lugar)
    }
    for (const nocheItem of noches) estado.noches.add(nocheItem.noche)

    draft.ordenBase = ordenBase
    return construirSalida(draft, skeletonDay, final, spare, quitadas, escritoNights, hours, fecha, dateIso)
  }

  // ── Nocturnas ───────────────────────────────────────────────────────────────────────────────────────────────────
  const NOCHE_MIN = { 'Fontana de Trevi (noche)': 20, 'Plaza de España (noche)': 20, 'Coliseo (noche)': 20, 'Piazza Navona (noche)': 30, 'Trastevere de noche': 30, 'Panteón (noche)': 30, 'Foro Romano desde el Campidoglio (noche)': 30, "El Puente y el Castillo de Sant'Angelo (noche)": 30 }
  const imprescindiblesNoche = destData.destination_config?.noches_imprescindibles?.lista ?? []
  function nochesDelDia(draft, final, hours, fecha) {
    const nocheDef = draft.trabajo.noche
    if (!nocheDef) return []
    const log = draft.log
    const cena = [...final].reverse().find((it) => it.kind === 'cena')
    const ultimo = [...final].reverse().find((it) => it.kind !== 'traslado' && it.kind !== 'noche')
    const origen = cena ?? ultimo
    const origenC = origen ? endCoordsOf(origen) : null
    const sitiosHoy = new Set(final.filter((it) => it.kind === 'stop' && it.modo !== 'camino' && !it.llegada).map((it) => it.lugar))
    const especial = destData.destination_config?.noche_especial?.[String(fecha ?? '').slice(5)] ?? null
    const usadasHoy = new Set()
    const vale = (name) => {
      const entrada = catalogueByName.get(name)
      if (!entrada || estado.noches.has(name) || usadasHoy.has(name)) return false
      return entrada.allow_same_day === true || !(entrada.conflicts_with ?? []).some((lugar) => sitiosHoy.has(lugar))
    }
    const distancia = (name) => (origenC && catalogueByName.get(name)?.coordinates ? meters(origenC, catalogueByName.get(name).coordinates) : 0)
    const posibles = [...catalogueByName.keys()].filter((name) => NOCHE_MIN[name])
    const mas_cercana = () => posibles.filter(vale).sort((a, b) => distancia(a) - distancia(b))[0] ?? null
    const huecos = nocheDef.libre ? 1 : Math.max(1, (nocheDef.lista ?? []).length)
    const salida = []
    for (let k = 0; k < huecos; k++) {
      const escrita = nocheDef.lista?.[k] ?? null
      let elegida = null
      let causa = null
      if (especial && escrita && escrita === especial.noche) { elegida = escrita; usadasHoy.add(escrita) } // (Nochebuena: solo Trevi, y esa noche puede repetir.)
      else {
        elegida = imprescindiblesNoche.find(vale) ?? null
        if (elegida) causa = `${elegida} es la primera nocturna imprescindible que aún no ha salido de noche en el viaje`
        if (!elegida && escrita && vale(escrita)) elegida = escrita
        if (!elegida) {
          elegida = (nocheDef.alternativa ?? []).find(vale) ?? mas_cercana()
          if (elegida) causa = `${escrita ?? 'la nocturna escrita'} ya salió de noche en el viaje: la nocturna pasa a ${elegida}, la más cercana a la cena que no ha salido`
        }
      }
      if (!elegida) { log.push({ id: `noche_${slug(escrita ?? 'libre')}`, lugar: escrita, sitio: null, que: 'quitada', causa: 'ya salió de noche en el viaje y no queda otra nocturna: sin nocturna' }); continue }
      if (especial && !(escrita === especial.noche) && salida.length >= (especial.maximo ?? 1)) continue
      usadasHoy.add(elegida)
      if (causa) log.push({ id: `noche_${slug(elegida)}`, lugar: escrita, sitio: null, que: 'noche', causa })
      salida.push({ kind: 'noche', noche: elegida, min: NOCHE_MIN[elegida] ?? 20, id: `noche_${slug(elegida)}` })
    }
    // La hora: después de cenar (o de la última parada), con lo andado hasta ella.
    let t = (cena ?? ultimo)?.t1 ?? 21 * 60
    let prev = origenC
    const sunset = hours.sunset
    const resultado = []
    for (const nocheItem of salida) {
      const c = catalogueByName.get(nocheItem.noche)?.coordinates ?? null
      const leg = prev && c ? (meters(prev, c) > (destData.destination_config?.alcance?.taxi_desde_m ?? 1500) ? transitMin(prev, c, 'taxi') : walkLeg(prev, c)) : 0
      const start = Math.round((t + leg) / 5) * 5
      if (!nocheValida(destData, fecha, sunset, start, nocheItem.min)) {
        log.push({ id: nocheItem.id, lugar: nocheItem.noche, sitio: null, que: 'quitada', causa: 'hora límite de la noche' })
        continue
      }
      resultado.push({ ...nocheItem, t0: start, t1: start + nocheItem.min })
      t = start + nocheItem.min
      prev = c
    }
    return resultado
  }

  // ── De los elementos del día a lo que el formato de día entiende ─────────────────────────────────────────────────────
  const stopNota = (item) => avisoDe(item)
  function lugarListo(item, hours) {
    const source = sourceOf(item)
    if (!source) return null
    if (item.llegada) {
      return { ...source, isArrival: true, arrivalText: item.texto_llegada ?? null, arrivalTitle: item.titulo ?? null, visitOutside: true, outsideKind: 'a_proposito', outsideReason: null, outsideAuthored: true, duration_minutes: item.min, windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior', name: item.tipo === 'tour' && tour ? tour.name : source.name }
    }
    let ready = { ...source }
    const modo = item.modo ?? 'parada'
    if (source.isFreeTour) {
      // el tour es una parada con su hora
    } else if (modo === 'fuera' || item.motivo_fuera) {
      ready = {
        ...source, visitOutside: true, outsideReason: item.motivo_fuera ?? source.por_fuera ?? null, outsideKind: item.motivo_fuera ? 'cerrado' : 'a_proposito', outsideAuthored: !item.motivo_fuera,
        coordinates: source.pass_by?.coordinates ?? source.coordinates, duration_minutes: item.min, windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior',
      }
    } else if (modo === 'camino') {
      ready = { ...source, passThrough: true, duration_minutes: item.min, outsideReason: 'hoy no toca entrar', windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior' }
    } else {
      ready.duration_minutes = item.min
      if (modo === 'dentro') ready = { ...ready, writtenInside: true }
    }
    if (modo !== 'camino' && (item.no_calle || isStreet(source))) ready.notStreet = true
    if (item.transit) ready = { ...ready, transitMinutes: item.transit.min, transitHow: transitHow(item.transit.como), transit: { how: transitHow(item.transit.como), minutes: item.transit.min } }
    const aviso = stopNota(item)
    if (aviso) ready.stopNotice = aviso
    if (item.foto) ready.photoName = item.foto
    if (Array.isArray(source.salida) && !ready.visitOutside && !ready.passThrough) ready.end_coordinates = source.salida
    const why = item.texto ?? destData.por_que_lugares?.[item.lugar] ?? written.destino?.textos?.[item.lugar] ?? null
    if (why) ready.curatedWhy = why
    if (item.titulo && item.tipo !== 'tour') ready.stretchTitle = item.titulo
    const [scheduled] = placesForScheduler({ id: item.lugar, places: [ready] }, destData, null)
    return scheduled
  }

  function construirSalida(draft, skeletonDay, final, spare, quitadas, escritoNights, hours, fecha, dateIso) {
    const log = draft.log
    const visits = []
    const units = []
    const meals = []
    let dinnerRestaurant = null
    const redondea = (m) => Math.round(m / 5) * 5
    let lastEnd = 0
    final.forEach((item, index) => {
      if (item.kind === 'stop') {
        const place = lugarListo(item, hours)
        if (!place) { problems.push({ tipo: 'lugar_desconocido', lugar: item.lugar, dayNumber: skeletonDay.dayNumber }); return }
        const unitId = `${draft.id}:${item.id}`
        const start = Math.max(redondea(item.t0), lastEnd)
        const duration = Math.max(5, item.t1 - item.t0)
        const level = place.level ?? 3
        units.push({ id: unitId, group: null, places: [place], slot: item.franja, blockId: draft.id, role: place.passThrough ? 'de_paso' : 'parada', dropRank: 1, priority: level === 1 ? PRIORITY.ESSENTIAL : item.protegido ? PRIORITY.POOL : PRIORITY.THEME, curatedIndex: index, poolIndex: null, ...(item.titulo && !item.llegada ? { stretchTitle: item.titulo, stretchWhy: item.texto_titulo ?? null, stretchBase: -100000 } : {}) })
        visits.push({ unitId, place, start, end: start + duration, chained: false, walkMinutes: item.leg ?? 0, walkSource: 'matrix', ...(item.hora && !item.llegada ? { fixedAt: toMin(item.hora), fixedMargin: 0, horaTipo: item.hora_tipo ?? 'turno' } : {}), orientative: !item.hora })
        lastEnd = start
      } else if (item.kind === 'comida' || item.kind === 'cena') {
        const r = restaurantByName.get(item.restaurante)
        const chosen = r ? { name: r.name, coordinates: restaurantCoords(r.name), zone: r.zone ?? null } : null
        const start = redondea(item.t0)
        const reservaCfg = destData.destination_config?.fechas_con_reserva ?? {}
        const mmdd = String(fecha ?? '').slice(5)
        const NAVIDAD = reservaCfg.fechas ?? []
        const sinDato = r && !r.closed_on && !r.closed_dates && !/\d{1,2}:\d{2}\s*-/.test(String(r.hours ?? ''))
        const nota = !NAVIDAD.includes(mmdd) ? (/con reserva/i.test(item.nota ?? '') ? 'Con reserva' : null) : sinDato ? reservaCfg.sin_dato ?? 'En Navidad, reserva con antelación' : (item.kind === 'cena' && reservaCfg.cena_especial?.[mmdd]) || reservaCfg.texto || 'Con reserva'
        if (item.kind === 'comida') meals.push({ type: 'lunch', start, end: start + item.min, eatMinutes: item.min, coordinates: chosen?.coordinates ?? null, ...(chosen ? { spot: { name: chosen.name, zone: chosen.zone } } : {}), eatStart: start, ...(nota ? { note: nota } : {}) })
        else {
          dinnerRestaurant = chosen
          meals.push({ type: 'dinner', start, end: start + item.min, coordinates: chosen?.coordinates ?? null, walkMinutes: item.leg ?? 0, ...(nota ? { note: nota } : {}) })
        }
      }
    })
    const dinnerZone = dinnerRestaurant ? dinnerZones(destData).find((zone) => zone.restaurants.includes(dinnerRestaurant.name))?.id ?? null : null
    // Lo que pasa a «Si te sobra tiempo»: con su lugar listo para la ficha.
    const spareVisits = spare.map((item) => {
      const place = lugarListo({ ...item, kind: 'stop' }, hours)
      return place ? { unitId: `${draft.id}:${item.id}`, place, start: 0, end: item.min ?? 15, spareReason: item.spareReason } : null
    }).filter(Boolean)
    // El plan de lluvia del día.
    const lluvia = draft.dia.lluvia ? planDeLluvia(draft, final, hours) : null
    const aviso = hours.sunset != null ? `Hoy el sol se pone a las ${toHHMM(hours.sunset)}` : null
    // (Excursión de medio día: si de la tarde no queda ninguna parada de nivel 1 o 2, la tarde queda libre.)
    const tardeLibre = draft.soloTarde ? !final.some((it) => it.kind === 'stop' && !it.llegada && it.modo !== 'camino' && (nivelDe(it.lugar) ?? 3) <= 2) : false
    for (const q of quitadas) log.push({ id: q.id ?? null, lugar: q.titulo ?? q.lugar, sitio: q.lugar ?? null, que: 'quitada', causa: q.motivo === 'Cerrado hoy' ? `cierre de ${q.lugar}` : q.motivo })
    const dayPlan = {
      dayNumber: skeletonDay.dayNumber, weekday: skeletonDay.weekday, allowsRepetition: false, isBlank: false, isExcursion: false, halfDayExcursion: skeletonDay.halfDayExcursion ?? null,
      curated: true, escrito: true, listas: true, hours,
      units, schedule: { visits, meals, kept: units, dropped: [], walkMinutes: 0, meters: 0, idleMinutes: 0, idleBeforeDinner: 0, modeFallback: null },
      lunchZone: null, dinnerZone, dinnerPlaceZone: null, dinnerCoords: dinnerRestaurant?.coordinates ?? null, dinnerRestaurant, nightNames: [], blocks: null,
      curatedDay: { id: draft.id, nombre: draft.dia.nombre, variantes: draft.aplicadas, noche: null, nocheDespuesDeCenar: true, nocheAntesDeCenar: false, nocheMinutos: null, nocheSiCae: null },
      untypedAfternoon: false, reorderedBlocks: [], closedAnchors: [], otherRestaurants: [],
      written: { version: null, escrito: true, tabla: draft.id, grupo: draft.parteKey },
      escritoNights, escritoLog: log.map((entry) => ({ ...entry, fecha: fecha ?? null })),
      escritoRows: final.map((item) => ({ id: item.id, tipo: item.kind === 'stop' ? (item.tipo ?? 'parada') : item.kind, lugar: item.lugar ?? item.restaurante ?? item.noche ?? null, titulo: item.titulo ?? null, restaurante: item.restaurante ?? null, hora: toHHMM(item.t0 ?? 0), t0: item.t0 ?? 0, t1: item.t1 ?? 0, llegaA: item.llegaA ?? null, tarde: item.tarde ?? 0, hora_fija: item.hora ?? null, min: item.min ?? 0, modo: item.modo ?? null, llegada: item.llegada === true, hora_tipo: item.hora_tipo ?? null, fija: Boolean(item.hora), nivel: nivelDe(item.lugar), franja: item.franja, de: item.de ?? null, relleno: item.relleno ?? null, protegido: item.protegido === true })),
      tardeLibre,
      spare: spareVisits,
      spareRows: spare.map((item) => ({ id: item.id, lugar: item.lugar, titulo: item.titulo ?? null, franja: item.franja, nivel: nivelDe(item.lugar), modo: item.modo ?? null, protegido: item.protegido === true })),
      ordenBase: draft.ordenBase,
      sunsetText: aviso,
      rainPlan: lluvia,
    }
    return dayPlan
  }

  /** «🌧 Si llueve»: el texto del documento y lo que cambia (qué sale y qué entra), con las mismas comprobaciones. */
  function planDeLluvia(draft, final, hours) {
    const lluvia = draft.dia.lluvia
    const entradas = (lluvia.ops ?? []).filter((entrada) => cumple(entrada.cuando, draft.ctx))
    if (entradas.length === 0) return { text: lluvia.texto, remove: [], add: [], slot: 'dia', checks: [] }
    const ops = entradas.reduce((junto, entrada) => {
      for (const franja of ['manana', 'tarde']) if (entrada.ops[franja]) junto[franja] = junto[franja] ? { ...junto[franja], ...entrada.ops[franja], quitar: [...(junto[franja].quitar ?? []), ...(entrada.ops[franja].quitar ?? [])], insertar: [...(junto[franja].insertar ?? []), ...(entrada.ops[franja].insertar ?? [])], ajustar: { ...(junto[franja].ajustar ?? {}), ...(entrada.ops[franja].ajustar ?? {}) }, cambiar: { ...(junto[franja].cambiar ?? {}), ...(entrada.ops[franja].cambiar ?? {}) } } : { ...entrada.ops[franja] }
      return junto
    }, {})
    const nombresActuales = final.filter((it) => it.kind === 'stop' && !it.llegada)
    const sinFranja = (lista) => lista.map((it) => ({ ...it }))
    const franjaDeOps = ops.manana && ops.tarde ? 'dia' : ops.manana ? 'manana' : 'tarde'
    let trabajo = { manana: nombresActuales.filter((it) => it.franja === 'manana').map((it) => ({ ...it })), tarde: nombresActuales.filter((it) => it.franja === 'tarde').map((it) => ({ ...it })) }
    const antes = new Set(nombresActuales.map((it) => `${it.lugar}|${it.titulo ?? ''}|${it.modo ?? ''}`))
    const tiene = (franja) => draft.trabajo.franjas?.[franja] !== false
    const despuesT = { manana: ops.manana && tiene('manana') ? aplicarOp(trabajo.manana, ops.manana) : trabajo.manana, tarde: ops.tarde && tiene('tarde') ? aplicarOp(trabajo.tarde, ops.tarde) : trabajo.tarde }
    // El día con el plan de lluvia, en el orden en que se hace de verdad (una reserva puede haber mezclado mañana y tarde): lo que sale se va, y lo que entra va detrás de lo que le precede en su franja.
    const fusionar = () => {
      const sale = []
      const entradasPorPrevio = new Map()
      for (const franja of ['manana', 'tarde']) {
        let previo = `INICIO_${franja}`
        for (const it of despuesT[franja]) {
          if (it.id && nombresActuales.some((a) => a.id === it.id)) previo = it.id
          else entradasPorPrevio.set(previo, [...(entradasPorPrevio.get(previo) ?? []), it])
        }
      }
      const supervivientes = new Set([...despuesT.manana, ...despuesT.tarde].filter((it) => it.id).map((it) => it.id))
      for (const franja of ['manana', 'tarde']) sale.push(...(entradasPorPrevio.get(`INICIO_${franja}`) ?? []))
      for (const it of nombresActuales) {
        if (!supervivientes.has(it.id)) continue
        const modificado = [...despuesT.manana, ...despuesT.tarde].find((d) => d.id === it.id) ?? it
        sale.push(modificado, ...(entradasPorPrevio.get(it.id) ?? []))
      }
      return sale
    }
    const despues = fusionar()
    const claveDe = (it) => `${it.lugar}|${it.titulo ?? ''}|${it.modo ?? ''}`
    const quitan = nombresActuales.filter((it) => !despues.some((d) => claveDe(d) === claveDe(it)))
    const entran = despues.filter((d) => !antes.has(claveDe(d)))
    const h = hours
    const add = entran.map((it) => {
      const place = lugarListo({ ...it, kind: 'stop', franja: it.franja ?? 'tarde' }, h)
      return place ? { unitId: `${draft.id}:lluvia:${slug(it.titulo ?? it.lugar)}`, place, start: 0, end: it.min ?? 15 } : null
    }).filter(Boolean)
    return { text: lluvia.texto, remove: quitan.map((it) => it.titulo ?? it.lugar), removeMeta: quitan.map((it) => ({ lugar: it.lugar, titulo: it.titulo ?? null, modo: it.modo ?? null })), add, slot: franjaDeOps, checks: reglas.nuevas(reglas.todas(nombresActuales.map((it, i) => ({ ...it, kind: 'stop', id: it.id ?? `l${i}` })), { vistosAntes: new Set(), dentroAntes: new Set() }), reglas.todas(despues.map((it, i) => ({ ...it, kind: 'stop', id: it.id ?? `l${i}` })), { vistosAntes: new Set(), dentroAntes: new Set() })).map((v) => v.texto) }
  }

  // ── Los días, uno a uno, en el orden del viaje ──────────────────────────────────────────────────────────────────
  const days = []
  const cityPlanned = []
  const nightsByDay = new Map()
  const closedAll = (name) => cityPlanned.length > 0 && cityDays.every((day) => closedThatDay(name, day))

  for (const skeletonDay of skeleton) {
    const index = cityDays.indexOf(skeletonDay)
    if (index < 0) {
      days.push({ ...skeletonDay, units: [], schedule: null })
      continue
    }
    const plan = procesarDia(drafts[index], skeletonDay)
    days.push(plan)
    cityPlanned.push(plan)
    if (plan.escritoNights.length > 0) nightsByDay.set(plan.dayNumber, plan.escritoNights)
  }

  // ── Lo que no salió del todo ─────────────────────────────────────────────────────────────────────────────────────
  const vistoEnViaje = new Set([...estado.vistos])
  const seenAtNight = new Set([...nightsByDay.values()].flat().flatMap((entry) => entry.conflicts_with ?? []))
  const unplacedEssentials = (destData.places ?? [])
    .filter((place) => place.level === 1 && !vistoEnViaje.has(place.name) && !tourCovers.has(place.name) && !seenAtNight.has(place.name))
    .map((place) => ({ unitId: place.name, name: place.name, reason: closedAll(place.name) ? 'closed_every_day' : 'no_room', closedOn: place.closed_on ?? [] }))
  problems.push(...cityPlanned.flatMap((day) => []))
  for (const problem of problems) {
    if (problem.tipo === 'reserva_cerrada' && !dayNotices.some((item) => item.dayNumber === problem.dayNumber && item.name === problem.lugar)) {
      dayNotices.push({ dayNumber: problem.dayNumber, name: problem.lugar, reason: `Ese día ${problem.lugar} está cerrado`, suggestion: 'Elige otra hora o otro día para tu entrada' })
    }
  }
  const tourDay = hasFreeTour ? cityPlanned.find((day) => day.schedule.visits.some((visit) => visit.place.isFreeTour))?.dayNumber ?? 1 : null

  return {
    mode: MODE_V3,
    engine: 'v5',
    days,
    curated: true,
    written: true,
    nightsByDay,
    joyaNames: [],
    pinnedMornings: [],
    rescueDetours: {},
    notEnoughTime: [],
    coreDays: destData.destination_config?.core_days ?? null,
    placedDay: new Map(),
    unplacedPool,
    unplacedEssentials,
    quotaMisses: [],
    experienceRange: null,
    experienceCounts: {},
    coveredByFreeTour: hasFreeTour ? [{ unitId: tour?.name, names: [...tourCovers], dayNumber: tourDay }] : [],
    movedForJoya: [],
    blockSummary: cityPlanned.map((day) => ({ dayNumber: day.dayNumber, morning: day.curatedDay.id, afternoon: day.curatedDay.id, lateDinner: false })),
    untypedHalves: 0,
    calendar: { hasDates: calendar.hasDates, month: calendar.month, season: calendar.season, referenceIso: calendar.referenceIso },
    dateMoves,
    problems,
    dayNotices,
    ...(ftFranja ? { freeTourInfo: { franja: ftFranja, hora: freeTourDespues?.hora ?? null, dayId: ftDayIndex >= 0 ? order[ftDayIndex] : null, order: [...order], motivo: ftDayIndex >= 0 ? null : 'ningún día lo lleva' } } : {}),
  }
}
