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
const MESES_INVIERNO = [11, 12, 1, 2]
const OUTSIDE_REASONS = { cerrado: 'Hoy cierra', no_cabe: 'Hoy lo ves por fuera para llegar a todo lo del día', viaje_corto: 'En un viaje corto lo ves por fuera: no da tiempo a entrar' }
/** Valores por defecto de las franjas (lo del destino manda: `destination_config.franjas`). Provisional (PREGUNTAS_TANDA6). */
const FRANJAS = {
  inicio: '09:00', comida_desde: '12:30', comida_hasta: '14:30', comida_min: 60, cena_min: 90, cena_desde: '19:30', cena_desde_verano: '20:00', meses_verano: [5, 6, 7, 8, 9], tarde_margen_min: 60,
  llegada: { reserva: 30, turno: 15, tour: 15 }, excursion_tarde_desde: '16:00', hueco_para_parada_corta: 20, cerca_m: 450, andar_max_min: 25, comida_junto_min: 12, taxi_max_min: 15, manana_hasta: '14:00', vas_bien_min: 45, espera_max_min: 15, cerca_max_min: 30, tarde_medio_desde: '16:00', comida_antes_desde: '12:00', hueco_llenar_min: 60, cerca_andar_min: 15, sugerencia_cerca_min: 10, sugerencia_lejos_min: 90, sugerencia_lejos_andar_min: 20, sugerencia_lejos_transporte_min: 15,
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
function avisoDe(stop, mes = null, invierno = MESES_INVIERNO) {
  const partes = []
  if (stop.aviso_horario) partes.push(stop.aviso_horario)
  // (Un aviso de temporada, solo en sus fechas: «En invierno cierra pronto» en invierno; el cierre por meses, el de ese mes.)
  if (stop.aviso_invierno && mes != null && invierno.includes(mes)) partes.push(stop.aviso_invierno)
  const porMes = mes != null ? (stop.cierra_meses ?? []).find((c) => (c.desde <= c.hasta ? mes >= c.desde && mes <= c.hasta : mes >= c.desde || mes <= c.hasta)) : null
  if (porMes) partes.push(`Cierra a las ${porMes.hora}: entra antes`)
  if (stop.cierra) partes.push(`Cierra a las ${stop.cierra}: entra antes`)
  if (stop.abre) partes.push(`Abre a las ${stop.abre}`)
  if (partes.length === 0 && !stop.aviso_horario && stop.avisos?.length) partes.push(...stop.avisos.map((a) => a.charAt(0).toUpperCase() + a.slice(1)))
  return partes.length ? [...new Set(partes)].join('. ') : null
}

/**
 * @param {object} args  destData, written ({ destino, days }), totalDays, hasFreeTour, poolNames, experiencesPositive, dateRangeStartIso, month, season, travel, forceOrder, entradas,
 *                       freeTourDespues, mediaJornada, sinExcursion, mediaExcursion
 * @returns el plan (misma forma que el motor anterior) o null si falta algún día escrito
 */
export function planListasTrip(args) {
  const { destData, written, totalDays, hasFreeTour: hasFreeTourIn = false, poolNames: poolNamesIn = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel, forceOrder = null, entradas = {}, freeTourDespues: freeTourDespuesIn = null, mediaJornada = null, sinExcursion = false, mediaExcursion = null, ajuste = null, chequeo = null } = args
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
  // Para llenar huecos y para las sugerencias solo valen sitios conocidos: los que salen en algún día escrito del documento o de nivel 1 o 2 (nunca un sitio poco conocido).
  const lugaresDocumento = new Set()
  const restaurantesDocumento = new Set()
  {
    const recorrer = (o) => {
      if (Array.isArray(o)) o.forEach(recorrer)
      else if (o && typeof o === 'object') {
        if (typeof o.lugar === 'string') lugaresDocumento.add(o.lugar)
        for (const clave of ['restaurante', 'alternativa', 'tercera']) if (typeof o[clave] === 'string') restaurantesDocumento.add(o[clave])
        Object.values(o).forEach(recorrer)
      }
    }
    recorrer(written.days)
  }
  const esConocido = (place) => (place.level ?? 3) <= 2 || lugaresDocumento.has(place.name)

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
    // (Por dentro se llega por la entrada, si el sitio tiene una distinta de su centro: el Foro, por el lado del Coliseo.)
    return (Array.isArray(source.entrada) ? source.entrada : null) ?? source.coordinates ?? null
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
    // La tarde de un medio día (la de llegada) empieza a las 16:00 (provisional: las llegadas y salidas se piensan aparte).
    if (parteKey === 'tarde' && dia.partes.manana && !base.empieza) base.empieza = cfg.tarde_medio_desde
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
  // (Cada cosa que una experiencia cambia —su `clave`— se hace una vez por viaje, en el primer día que la trae.)
  const hechasExp = new Set()
  for (const exp of selected) {
    for (const d of drafts) {
      for (const def of [].concat(d.dia.experiencias?.[exp] ?? [])) {
        const clave = `${exp}:${def.clave ?? def.añade ?? ''}`
        if (hechasExp.has(clave) || !cumple(def.cuando, d.ctx)) continue
        // (Lo que la experiencia añade y el viaje ya lleva no se repite, ni se añade un día en que cierra.)
        if (def.añade && drafts.some((o) => stopsOfTrabajo(o.trabajo).some((s) => s.lugar === def.añade && s.modo !== 'camino' && s.tipo !== 'traslado'))) continue
        if (def.añade && closedThatDay(def.añade, d.day)) continue
        d.trabajo = aplicarOps(d.trabajo, def.ops)
        d.aplicadas.push(`experiencia:${exp}`)
        hechasExp.add(clave)
      }
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
    // De temporada: lo que va de camino y solo está en sus fechas (el Santo Bambino, las luces de Navidad) no sale fuera de ellas.
    items = items.filter((item) => {
      if (item.kind !== 'stop' || item.modo !== 'camino') return true
      const available = placeByName.get(item.lugar)?.available
      if (!available || item.ignora_temporada) return true
      const fit = seasonFit(available, calendar, hours.dateIso)
      if (fit.enters && !fit.notice) return true
      log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'quitada', causa: `fuera de temporada: ${item.lugar} solo está en sus fechas` })
      return false
    })
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
        if (item.kind === 'comida') start = Math.max(llega, item.piso != null ? item.piso : toMin(cfg.comida_desde))
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
          const causaRepetido = `restaurante repetido en el viaje: ${name} (no hay un restaurante de verdad abierto a menos de ${recambio.max_andar_min} min andando)`
          if (!libre(name) && !log.some((l) => l.id === item.id && l.causa === causaRepetido)) log.push({ id: item.id, lugar: name, sitio: null, que: 'aviso', causa: causaRepetido })
        }
        // (El motivo se cuenta ANTES de dar por usado el que va: si no, «el que va ya sale en el viaje».)
        const motivoFinal = motivo ?? `${descartadas()}: va ${name}`
        usadasHoy.add(name)
        if (name !== original && !log.some((l) => l.id === item.id && l.que === 'restaurante')) log.push({ id: item.id, lugar: original, sitio: null, que: 'restaurante', causa: motivoFinal })
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
     * Pone una parada con hora fija a su hora (3.3 y Tanda 6b). El día NUNCA empieza más tarde por una reserva: empieza a su hora (o antes, si la reserva es antes) y la mañana se llena, siempre con las
     * comprobaciones de siempre, por este orden:
     *   1. lo que va antes en la lista (mientras quepa y no aleje del sitio de la hora fija: volver a él después sería un zigzag);
     *   2. si aún queda más de 1 h, lo cercano que va después (a 15 min andando o menos), en su orden y sin zigzag;
     *   3. si aún sobra más de 1 h, sitios cercanos del destino que no salgan en el viaje y estén abiertos.
     * Lo demás va después de la hora fija, en el mismo orden. Si la hora fija cae a mediodía (empieza entre las 12:30 y las 15:00 y dura más de 1 h), la comida va antes,
     * entre las 12:00 y las 12:30, en su zona y pegada a la «Llegada a…».
     */
    const colocarFija = (lista, F, desde) => {
      const L = lista.find((it) => it.llegada && it.de === F.id) ?? null
      const resto = lista.filter((it) => it !== F && it !== L)
      const margen = L ? L.min : 0
      const H = toMin(F.hora)
      const limite = H - margen
      const coordsF = coordsOf(F)
      const posF = lista.indexOf(F)
      // (Todo lo que va hasta la hora fija ya colocada anterior —con su «Llegada a…»— no se mueve: queda delante.)
      let ultimaColocada = -1
      resto.forEach((it, i) => { if (it.kind === 'stop' && it.hora && !it.llegada && it.fijo_colocado) ultimaColocada = i })
      desde = Math.max(desde, ultimaColocada + 1)
      const kPos = resto.filter((it) => lista.indexOf(it) < posF).length
      // Unidades: un traslado viaja con la parada a la que lleva.
      const unidades = []
      let pend = []
      resto.forEach((it, i) => {
        if (it.kind === 'traslado') { pend.push(it); return }
        unidades.push({ items: [...pend, it], head: it, i })
        pend = []
      })
      if (pend.length > 0 && unidades.length > 0) unidades.at(-1).items.push(...pend)
      const plano = (us) => us.flatMap((u) => u.items)
      const llegadaA = (items, destino, desdeT = startPoint.t) => {
        const sim = simular(items, desdeT)
        const ultimo = sim.at(-1)
        const previo = [...sim].reverse().find((it) => it.kind !== 'traslado')
        const prevC = previo ? endCoordsOf(previo) : null
        return (ultimo ? ultimo.t1 : desdeT) + (prevC && destino ? walkLeg(prevC, destino) : 0)
      }
      // ¿La hora fija cae a mediodía? Entonces la comida va antes (si cabe entre las 12:00 y la hora fija).
      const comidaU = unidades.find((u) => u.head.kind === 'comida' && !u.head.piso_fijo) ?? null
      const comidaPiso = toMin(cfg.comida_antes_desde)
      let mediodia = false
      let objetivoT = limite
      let objetivoC = coordsF
      let duracionComida = cfg.comida_min
      // (La comida va antes si iría detrás de la hora fija —en la lista va después— y entonces caería después de las 14:30.)
      if (comidaU && comidaU.i >= kPos && H >= toMin(cfg.comida_desde) && H + (F.min ?? 0) + 10 > toMin(cfg.comida_hasta)) {
        const rc = coordsOf(comidaU.head)
        const andar = rc && coordsF ? walkLeg(rc, coordsF) : 5
        // (Lo que ya está colocado delante, una hora fija anterior, también cuenta: la comida no puede empezar antes de que acabe.)
        const congelado = unidades.filter((u) => u.i < desde)
        const libreDesde = congelado.length > 0 ? llegadaA(plano(congelado), rc) : startPoint.t
        // La comida de siempre (60 min) o, si no cabe, una rápida (45 o 30).
        for (const dur of [cfg.comida_min, 45, 30]) {
          const inicioComida = limite - dur - andar
          if (inicioComida >= Math.max(comidaPiso, libreDesde)) { mediodia = true; objetivoT = inicioComida; objetivoC = rc; duracionComida = dur; break }
        }
      }
      // (La comida va lo más tarde que deja la hora fija, entre las 12:00 y las 12:30.)
      let comidaAntes = mediodia ? { ...comidaU.head, min: duracionComida, piso: Math.min(Math.max(comidaPiso, objetivoT), comidaPiso + 30), piso_fijo: true } : null
      // La comida de antes va en la zona de la hora fija (pegada a su «Llegada a…»): si el restaurante escrito queda lejos, otro restaurante de verdad a menos de 10 min andando de ella.
      if (comidaAntes && coordsF) {
        const rc = coordsOf(comidaAntes)
        if (!rc || walkLeg(rc, coordsF) > cfg.comida_junto_min) {
          const nombresUsados = new Set([...estado.mesas, ...items.filter((it) => it.kind === 'comida' || it.kind === 'cena').map((it) => it.restaurante)])
          const cerca = (destData.restaurants ?? [])
            .filter((r) => recambio.tipos.includes(r.tipo_local) && !nombresUsados.has(r.name) && abiertoA(r.name, 'comida', Math.max(comidaAntes.piso, objetivoT)))
            .map((r) => ({ name: r.name, andar: restaurantCoords(r.name) ? walkLeg(restaurantCoords(r.name), coordsF) : Infinity }))
            .filter((x) => x.andar <= recambio.max_andar_min)
            .sort((a, b) => a.andar - b.andar || a.name.localeCompare(b.name, 'es'))[0]
          if (cerca) {
            log.push({ id: comidaAntes.id, lugar: comidaAntes.restaurante_escrito ?? comidaAntes.restaurante, sitio: null, que: 'restaurante', causa: `la comida va antes de ${F.titulo ?? F.lugar} (a las ${F.hora}), en su zona: va ${cerca.name}, un restaurante de verdad a ${cerca.andar} min andando` })
            comidaAntes = { ...comidaAntes, restaurante: cerca.name, restaurante_escrito: cerca.name, alternativa: null, tercera: null }
            objetivoC = coordsOf(comidaAntes)
          }
        }
      }
      const base = reglas.todas(lista, { vistosAntes: estado.vistos, dentroAntes: estado.dentro })
      // (Lo que, puesta la hora fija, no cabe sin volver sobre sus pasos pasa a «Si te sobra tiempo»: `fueraSet`.)
      let fueraSet = new Set()
      const montar = (A, extras = []) => {
        const dentro = new Set(A.flatMap((u) => u.items.map((it) => it.id)))
        const despues = unidades.filter((u) => !dentro.has(u.head.id) && !(mediodia && u === comidaU) && !fueraSet.has(u.head.id))
        const iniciales = [...plano(A), ...extras]
        return { lista: [...iniciales, ...(comidaAntes ? [comidaAntes] : []), ...(L ? [L] : []), F, ...plano(despues)], antesComida: iniciales }
      }
      const nuevasRompe = (lista2) => reglas.nuevas(base, reglas.todas(lista2, { vistosAntes: estado.vistos, dentroAntes: estado.dentro })).length > 0
      const cabe = (items) => llegadaA(items, objetivoC) <= objetivoT
      const A = []
      // lo congelado (lo que ya estaba colocado delante de una hora fija anterior)
      for (const u of unidades) if (u.i < desde) A.push(u)
      const mediaDiaYa = (u) => mediodia && u === comidaU
      // 1. lo que va antes en la lista: el trozo más largo que cabe y que no rompe una comprobación (un zigzag que solo se arregla llevando también lo siguiente se prueba con lo siguiente)
      const candidatas = []
      for (const u of unidades) {
        if (u.i < desde) continue
        if (u.i >= kPos) break
        if (mediaDiaYa(u)) continue
        if (esBarrera(u.head, lista)) break
        candidatas.push(u)
      }
      let cabenN = 0
      for (let n = 1; n <= candidatas.length; n++) {
        if (!cabe(plano([...A, ...candidatas.slice(0, n)]))) break
        cabenN = n
      }
      const sobra = (items) => objetivoT - llegadaA(items, objetivoC)
      const puedeSobrar = (it) => it.kind === 'stop' && it.modo !== 'camino' && !esFijo(it) && !esPrimeraVez(lista, it) && it.tipo !== 'desayuno' && !it.relleno_no_quitar
      // Cada trozo posible (de más largo a más corto): si colocar la hora fija rompe una comprobación por culpa de algo de DESPUÉS de ella, eso pasa a «Si te sobra tiempo»;
      // si la rompe algo de ANTES, ese trozo no vale. Gana el que menos deja fuera (cada parada fuera cuenta como 2; cada hora libre antes, como 1).
      let mejor = null
      // Variante «recortar»: si no cabe todo lo que iba antes, se quita (a «Si te sobra tiempo») lo menos importante que se puede quitar hasta que quepa el resto,
      // en vez de dejar la hora fija tarde o lo que no cabe detrás de ella (donde haría volver sobre los pasos).
      const variantes = []
      if (cabenN < candidatas.length) {
        const quedan = [...candidatas]
        const recortadas = new Set()
        while (!cabe(plano([...A, ...quedan]))) {
          const quitable = quedan.map((u, i) => ({ u, i })).filter(({ u }) => puedeSobrar(u.head))
            .sort((a, b) => (nivelDe(b.u.head.lugar) ?? 3) - (nivelDe(a.u.head.lugar) ?? 3) || b.i - a.i)[0]
          if (!quitable) break
          quedan.splice(quitable.i, 1)
          recortadas.add(quitable.u.head.id)
        }
        // Si quitar no basta, la comida de antes se hace más corta (45 o 30 min), como cuando va justo antes de la hora fija.
        for (const dur of [45, 30]) {
          if (cabe(plano([...A, ...quedan]))) break
          const k = quedan.findIndex((u) => u.head.kind === 'comida' && u.head.min > dur)
          if (k < 0) break
          const u = quedan[k]
          const acortar = (it) => (it === u.head ? { ...it, min: dur } : it)
          quedan[k] = { ...u, head: acortar(u.head), items: u.items.map(acortar) }
        }
        if (cabe(plano([...A, ...quedan])) && (recortadas.size > 0 || quedan.some((u, i) => u.head.min !== candidatas.find((c) => c.head.id === u.head.id)?.head.min))) variantes.push({ n: candidatas.length, A1: [...A, ...quedan], excl0: recortadas })
      }
      for (let n = cabenN; n >= 0; n--) variantes.push({ n, A1: [...A, ...candidatas.slice(0, n)], excl0: new Set() })
      for (const v of variantes) {
        const { n, A1 } = v
        const excl = new Set(v.excl0)
        let valido = true
        for (let guard = 0; guard < 12; guard++) {
          fueraSet = excl
          const nuevas = reglas.nuevas(base, reglas.todas(montar(A1).lista, { vistosAntes: estado.vistos, dentroAntes: estado.dentro }))
          if (nuevas.length === 0) break
          const culpables = nuevas.map((v) => unidades.find((u) => u.head.id === v.clave.split('>').at(-1))).filter(Boolean)
          let culpable = culpables.find((u) => !A1.includes(u) && puedeSobrar(u.head))
          // Si lo que vuelve a la zona es algo que no se puede quitar (un «de camino» que seguía a la hora fija), se quita lo que, ya puesta la hora fija, aleja del sitio antes de volver: lo que va entre ellos.
          if (!culpable) {
            const lst = montar(A1).lista
            const iF = lst.findIndex((it) => it.id === F.id)
            for (const c of culpables.filter((u) => !A1.includes(u))) {
              const iC = lst.findIndex((it) => it.id === c.head.id)
              culpable = unidades.find((u) => { const k = lst.findIndex((it) => it.id === u.head.id); return k > iF && k < iC && !A1.includes(u) && puedeSobrar(u.head) })
              if (culpable) break
            }
          }
          if (!culpable) { valido = false; break }
          excl.add(culpable.head.id)
        }
        if (!valido) continue
        const coste = excl.size * 2 + Math.max(0, sobra(plano(A1))) / 60
        if (!mejor || coste < mejor.coste) mejor = { n, A1, excl, coste, porTiempo: v.excl0 }
        if (excl.size === 0) break
      }
      fueraSet = new Set()
      let tomadas = 0
      if (mejor) {
        A.splice(0, A.length, ...mejor.A1)
        fueraSet = mejor.excl
        tomadas = mejor.n
        for (const id of mejor.excl) {
          const u = unidades.find((x) => x.head.id === id)
          spare.push({ ...u.head, razon: 'ancla', spareReason: 'Para otro momento' })
          log.push({ id, lugar: u.head.titulo ?? u.head.lugar, sitio: u.head.lugar, que: 'sobra', causa: mejor.porTiempo.has(id) ? `no cabía antes de ${F.titulo ?? F.lugar} (a las ${F.hora}) sin llegar tarde: pasa a «Si te sobra tiempo»` : `poner ${F.titulo ?? F.lugar} a su hora (${F.hora}) lo dejaba volviendo sobre sus pasos: pasa a «Si te sobra tiempo»` })
        }
      }
      // (Si no entró todo lo que iba antes en la lista, lo que queda va detrás de la hora fija y no se adelanta nada de lo que iba después.)
      let prefijoCompleto = tomadas === candidatas.length
      // 2. si aún queda más de 1 h, lo cercano que va después (seguido, en su orden: cada parada a 15 min andando o menos de la anterior y todo a 30 min o menos de la hora fija);
      //    se prueba con todas las que caben y, si eso rompe una comprobación (un zigzag), con una menos, hasta que no rompa ninguna.
      if (prefijoCompleto && sobra(plano(A)) > cfg.hueco_llenar_min) {
        const cola = []
        let previoC = A.length > 0 ? endCoordsOf(A.at(-1).head) : objetivoC
        for (const u of unidades) {
          if (u.i < kPos || A.includes(u) || (mediaDiaYa(u))) continue
          if (esBarrera(u.head, lista)) break
          const c = coordsOf(u.head)
          if (!c || !coordsF || walkLeg(c, coordsF) > cfg.cerca_max_min || (previoC && walkLeg(previoC, c) > cfg.cerca_andar_min)) break
          if (!cabe(plano([...A, ...cola, u]))) break
          cola.push(u)
          previoC = endCoordsOf(u.head)
        }
        for (let n = cola.length; n > 0; n--) {
          const probando = [...A, ...cola.slice(0, n)]
          if (nuevasRompe(montar(probando).lista)) continue
          A.push(...cola.slice(0, n))
          break
        }
      }
      // 3. si aún sobra más de 1 h, sitios cercanos del destino que no salen en el viaje y están abiertos
      const extras = []
      for (let guard = 0; guard < 4 && sobra([...plano(A), ...extras]) > cfg.hueco_llenar_min; guard++) {
        const relleno = cercanaA(F, sobra([...plano(A), ...extras]), resto, [...plano(A), ...extras])
        if (!relleno) break
        if (nuevasRompe(montar(A, [...extras, relleno]).lista)) break
        extras.push(relleno)
        log.push({ id: relleno.id, lugar: relleno.lugar, sitio: relleno.lugar, que: 'nueva', causa: `antes de ${F.titulo ?? F.lugar} (a las ${F.hora}) quedaba más de 1 h libre: entra una parada cercana abierta` })
      }
      const { lista: nuevo } = montar(A, extras)
      if (nuevasRompe(nuevo)) return null
      // El día empieza a su hora; solo empieza antes si la hora fija es antes de que pueda llegarse a ella.
      const llegaF = llegadaA([...plano(A), ...extras], objetivoC)
      if (A.length === 0 && extras.length === 0 && llegaF > objetivoT) {
        const antes = objetivoT - llegaF
        startPoint.t += antes
        log.push({ id: F.id, lugar: F.titulo ?? F.lugar, sitio: F.lugar, que: 'hora', causa: `${F.titulo ?? F.lugar} es a las ${F.hora}: el día empieza ${-antes} min antes` })
      }
      return nuevo
    }
    const esFijoSinColocar = (it) => it.kind === 'stop' && it.hora && !it.llegada && !it.fijo_colocado
    // (Una hora fija que aún no se ha colocado, o su «Llegada a…»: nada se adelanta más allá de ella.)
    const esBarrera = (it, lista) => esFijoSinColocar(it) || Boolean(it.llegada && lista.some((x) => x.id === it.de && esFijoSinColocar(x)))
    /** Una parada corta pegada al sitio (a poca distancia, exterior, que el viaje no lleve ya y que esté abierta), con su sitio en roma.json. */
    const cercanaA = (F, hueco, resto, prefijo) => {
      const c = coordsOf(F)
      if (!c) return null
      const yaSale = new Set([...estado.vistos, ...lugaresDelViaje, ...items.filter((it) => it.lugar).map((it) => it.lugar), ...resto.map((it) => it.lugar).filter(Boolean), ...prefijo.map((it) => it.lugar).filter(Boolean)])
      const prev = [...prefijo].reverse().find((it) => it.kind !== 'traslado')
      const prevC = prev ? endCoordsOf(prev) : null
      const candidatos = (destData.places ?? [])
        .filter((place) => !yaSale.has(place.name) && esConocido(place) && (place.type === 'exterior' || place.minutos_fuera != null) && Array.isArray(place.coordinates) && !closedThatDay(place.name, skeletonDay) && !place.available && !place.capa_de && !(place.tags ?? []).includes('mercadillo_navideno'))
        .map((place) => ({ place, d: meters(c, place.coordinates), min: Math.min(place.minutos_fuera ?? place.duration_minutes ?? 15, 30) }))
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
      const at = lista.findIndex((other) => other.id === item.id)
      return !lista.slice(0, at < 0 ? lista.length : at).some((other) => other.kind === 'stop' && other.lugar === item.lugar)
    }
    // Cuánto se tarda en verlo por fuera: lo que dice el propio documento donde ya lo pone por fuera («Altar de la Patria, por fuera ~30»); si no, el dato del sitio.
    const fueraDelDocumento = new Map()
    for (const d of Object.values(written.days)) for (const parte of Object.values(d.partes ?? {})) for (const lista of Object.values(parte ?? {})) {
      if (!Array.isArray(lista)) continue
      for (const st of lista) if (st?.lugar && st.modo === 'fuera' && st.min && !fueraDelDocumento.has(st.lugar)) fueraDelDocumento.set(st.lugar, st.min)
    }
    const fueraMin = (item) => Math.min(item.min, fueraDelDocumento.get(item.lugar) ?? placeByName.get(item.lugar)?.minutos_fuera ?? OUTSIDE_MINUTES)
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
      // Un «de camino» no ocupa tiempo ni va a «Si te sobra tiempo»: si lo que se quita era adonde iba, la ruta ya no pasa por allí y desaparece (salvo un imprescindible la primera vez).
      const caminos = []
      const at = lista.findIndex((it) => it.id === item.id)
      for (let i = at - 1; i >= 0; i--) {
        const previo = lista[i]
        if (previo.kind === 'traslado' || quitar.has(previo.id)) continue
        if (previo.kind !== 'stop' || previo.modo !== 'camino' || previo.llegada || esPrimeraVez(lista, previo)) break
        quitar.add(previo.id)
        caminos.push(previo)
      }
      const nueva = lista.filter((it) => !quitar.has(it.id))
      // Un traslado que se queda sin destino (detrás de él ya no hay una parada de su franja) se va también.
      return { lista: nueva.filter((it, i) => !(it.kind === 'traslado' && (!nueva[i + 1] || nueva[i + 1].kind === 'traslado'))), motivo, caminos }
    }
    const apuntarCaminos = (caminos, item) => {
      for (const previo of caminos) log.push({ id: previo.id, lugar: previo.titulo ?? previo.lugar, sitio: previo.lugar, que: 'quitada', causa: `la ruta ya no pasa por allí: ${item.titulo ?? item.lugar} sale de la ruta` })
    }
    const reducir = (lista, franja) => {
      const antes = baseReglas(lista)
      const candidatos = lista
        .filter((it) => it.kind === 'stop' && it.franja === franja && it.modo !== 'camino' && !esFijo(it) && !esPrimeraVez(lista, it) && it.tipo !== 'desayuno' && !it.relleno_no_quitar)
        .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
      // Mañana: antes de quitar, se acorta lo de menos (por dentro → por fuera, y lo de por fuera se queda de camino).
      if (franja === 'manana') {
        // (Pasar de por dentro a por fuera no quita nada: vale también para un imprescindible la primera vez, que se sigue viendo.)
        const dentroAcortables = lista
          .filter((it) => it.kind === 'stop' && it.franja === franja && it.modo === 'dentro' && !esFijo(it) && !it.protegido && it.tipo !== 'desayuno' && !it.relleno_no_quitar)
          .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
        for (const item of dentroAcortables) {
          {
            const nuevo = lista.map((it) => (it.id === item.id ? { ...it, modo: 'fuera', min: fueraMin(it) } : it))
            if (reglas.nuevas(antes, baseReglas(nuevo)).length === 0 && fueraMin(item) < item.min) {
              log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'modo+min', causa: 'la comida iba a caer tarde: lo de menos de la mañana pasa de por dentro a por fuera' })
              return nuevo
            }
          }
        }
        // (Lo de por fuera se queda de camino: se sigue viendo, solo se tarda menos; por eso vale también para un imprescindible la primera vez, empezando por lo de menos.)
        const fueraAcortables = lista
          .filter((it) => it.kind === 'stop' && it.franja === franja && it.modo === 'fuera' && !esFijo(it) && !it.protegido && it.tipo !== 'desayuno' && !it.relleno_no_quitar)
          .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
        for (const item of fueraAcortables) {
          if (item.min > 5) {
            const nuevo = lista.map((it) => (it.id === item.id ? { ...it, modo: 'camino', min: 5 } : it))
            if (reglas.nuevas(antes, baseReglas(nuevo)).length === 0) {
              log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'modo+min', causa: 'la comida iba a caer tarde: lo de menos de la mañana se queda de camino' })
              return nuevo
            }
          }
        }
      }
      for (const item of candidatos) {
        const { lista: nueva, caminos } = mandarASobra(lista, item)
        const sp = [...spare, { ...item, franja }]
        const despues = reglas.todas(nueva, { spare: sp, vistosAntes: estado.vistos, dentroAntes: estado.dentro })
        if (reglas.nuevas(antes, despues).length > 0) continue
        apuntarCaminos(caminos, item)
        spare.push({ ...item, franja, razon: 'cabe', spareReason: franja === 'manana' ? 'Si te da tiempo, por la mañana' : 'Si te da tiempo, por la tarde' })
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

    /**
     * Cada visita por dentro se mira con SU hora de llegada (la orientativa): si aún no ha abierto, o cierra antes de que acabe la visita,
     *   - se espera si son 15 min o menos;
     *   - si no, pasa a por fuera o de camino (la fachada), con su aviso «Abre a las…» (nunca se cambia el orden);
     *   - y si no se ve desde fuera, pasa a «Si te sobra tiempo».
     */
    const resolverHorarios = (lista) => {
      let out = lista
      const hechos = new Set()
      for (let guard = 0; guard < 40; guard++) {
        const sim = simular(out)
        const malo = sim.find((it) => {
          if (it.kind !== 'stop' || it.llegada || it.tipo !== 'parada' || it.modo === 'fuera' || it.modo === 'camino' || it.hora || hechos.has(it.id)) return false
          const source = sourceOf(it)
          if (!source || source.type !== 'interior') return false
          return openCheck(source, it.t0, it.min ?? 20, hours).ok !== true
        })
        if (!malo) break
        hechos.add(malo.id)
        const source = sourceOf(malo)
        const chequeo = openCheck(source, malo.t0, malo.min ?? 20, hours)
        const abre = chequeo.opensAt ?? null
        const horaAbre = abre != null ? toHHMM(abre) : null
        const sesiones = parseHoursSessions(effectiveSchedule(source, hours)).sort((a, b) => a.open - b.open)
        const proxima = abre != null ? sesiones.find((x) => x.open === abre) : null
        // 1. se espera si son 15 min o menos y luego cabe entera
        if (abre != null && abre - malo.t0 <= cfg.espera_max_min && proxima && abre + (malo.min ?? 20) <= proxima.close) {
          out = out.map((it) => (it.id === malo.id ? { ...it, no_antes: toHHMM(abre) } : it))
          log.push({ id: malo.id, lugar: malo.titulo ?? malo.lugar, sitio: malo.lugar, que: 'hora', causa: `${malo.titulo ?? malo.lugar} abre a las ${horaAbre}: se espera ${abre - malo.t0} min` })
          continue
        }
        const aviso = horaAbre ? `Abre a las ${horaAbre}` : 'Hoy ya ha cerrado'
        // 2. por fuera (o de camino si es de poca importancia), con su aviso
        if (source.minutos_fuera != null || source.pass_by || source.type === 'exterior') {
          const camino = (nivelDe(malo.lugar) ?? 3) >= 3
          out = out.map((it) => (it.id === malo.id ? { ...it, previo_horario: { modo: it.modo, min: it.min }, modo: camino ? 'camino' : 'fuera', min: camino ? 5 : Math.min(it.min, source.minutos_fuera ?? OUTSIDE_MINUTES), aviso_horario: aviso, motivo_fuera: horaAbre ? `A esta hora aún no ha abierto (abre a las ${horaAbre})` : 'A esta hora ya ha cerrado', fuera_por_horario: true } : it))
          log.push({ id: malo.id, lugar: malo.titulo ?? malo.lugar, sitio: malo.lugar, que: 'modo+min', causa: `llega hacia las ${toHHMM(malo.t0)} y ${horaAbre ? `no abre hasta las ${horaAbre}` : 'ya ha cerrado'}: va por ${camino ? 'de camino' : 'fuera'} con su aviso` })
          continue
        }
        // 3. «Si te sobra tiempo» (si no es un imprescindible la primera vez)
        if (!esPrimeraVez(out, malo) && !esFijo(malo)) {
          const { lista: nueva, caminos } = mandarASobra(out, malo)
          apuntarCaminos(caminos, malo)
          spare.push({ ...malo, razon: 'horario', spareReason: horaAbre ? `Para cuando abra (a las ${horaAbre})` : 'Para otro momento' })
          log.push({ id: malo.id, lugar: malo.titulo ?? malo.lugar, sitio: malo.lugar, que: 'sobra', causa: `llega hacia las ${toHHMM(malo.t0)}, no se ve desde fuera y ${horaAbre ? `no abre hasta las ${horaAbre}` : 'ya ha cerrado'}: pasa a «Si te sobra tiempo»` })
          out = nueva
          continue
        }
        // 4. Un imprescindible la primera vez no puede pasar a «Si te sobra tiempo»: se ve por fuera (la fachada), con su aviso, y el orden no cambia.
        out = out.map((it) => (it.id === malo.id ? { ...it, previo_horario: { modo: it.modo, min: it.min }, modo: 'fuera', min: Math.min(it.min, OUTSIDE_MINUTES * 2), aviso_horario: aviso, motivo_fuera: horaAbre ? `A esta hora aún no ha abierto (abre a las ${horaAbre})` : 'A esta hora ya ha cerrado', fuera_por_horario: true } : it))
        log.push({ id: malo.id, lugar: malo.titulo ?? malo.lugar, sitio: malo.lugar, que: 'modo+min', causa: `llega hacia las ${toHHMM(malo.t0)} y ${horaAbre ? `no abre hasta las ${horaAbre}` : 'ya ha cerrado'}: es un imprescindible de la primera vez: va por fuera con su aviso` })
      }
      return out
    }

    /**
     * Una entrada con turnos de verdad (la Galería Borghese: cada 2 horas) sin reserva puesta por el viajero no es un turno inventado: se coge el turno real más cercano
     * a donde cae en el día, y lo de alrededor se coloca con la regla de la hora fija.
     */
    const turnosReales = (lista) => {
      let out = lista
      for (const it of lista) {
        if (it.kind !== 'stop' || it.llegada || it.hora || it.hora_tipo !== 'reserva') continue
        const turnos = placeByName.get(it.lugar)?.turnos
        if (!turnos?.cada_minutos) continue
        const sim = simular(out)
        const natural = sim.find((x) => x.id === it.id)?.t0
        if (natural == null) continue
        const horas = []
        for (let t = toMin(turnos.desde); t <= toMin(turnos.hasta); t += turnos.cada_minutos) horas.push(t)
        const elegido = horas.reduce((mejor, t) => (Math.abs(t - natural) < Math.abs(mejor - natural) ? t : mejor), horas[0])
        out = out.map((x) => (x.id === it.id ? { ...x, hora: toHHMM(elegido), turno_real: true } : x.llegada && x.de === it.id ? { ...x, hora: toHHMM(elegido - x.min) } : x))
        log.push({ id: it.id, lugar: it.titulo ?? it.lugar, sitio: it.lugar, que: 'hora', causa: `sin reserva puesta, el turno real más cercano a donde cae (hacia las ${toHHMM(natural)}) es el de las ${toHHMM(elegido)}` })
      }
      return out
    }

    /**
     * El cierre se mira con la hora que SE ENSEÑA: si al quepar lo demás (ajustar) la visita cae antes y ya está abierta, vuelve a ir por dentro; y al revés.
     * Se repite hasta que la hora y el aviso dicen lo mismo.
     */
    const reabrirHorarios = (lista) => lista.map((it) => {
      if (!it.fuera_por_horario || !it.previo_horario) return it
      const { previo_horario: previo, aviso_horario: _a, motivo_fuera: _m, fuera_por_horario: _f, ...resto } = it
      return { ...resto, modo: previo.modo, min: previo.min }
    })
    const firmaHorarios = (lista) => JSON.stringify(lista.map((it) => [it.id, it.modo, it.min, it.fuera_por_horario === true, it.no_antes ?? null]))
    const horariosCoherentes = (lista) => {
      let out = lista
      for (let vuelta = 0; vuelta < 5; vuelta++) {
        const antes = firmaHorarios(out)
        const volver = out.filter((it) => it.fuera_por_horario && it.previo_horario).map((it) => it.id)
        // (El registro de lo que se decidió con una hora que ya no es la buena se borra: no puede quedar un aviso que dice otra cosa.)
        for (let i = log.length - 1; i >= 0; i--) if (volver.includes(log[i].id) && log[i].que === 'modo+min' && /llega hacia|imprescindible de la primera vez/.test(log[i].causa ?? '')) log.splice(i, 1)
        out = ajustar(resolverHorarios(reabrirHorarios(out)))
        if (firmaHorarios(out) === antes) break
      }
      return out
    }

    // El orden: el día tal cual → fijas a su hora → horarios de llegada → restaurantes → que quepa (con las mesas elegidas) → mesas otra vez con las horas hechas.
    items = elegirMesas(items)
    items = turnosReales(items)
    items = anclar(items)
    items = resolverHorarios(items)
    items = ajustar(items)
    items = elegirMesas(items)
    items = ajustar(items)
    items = horariosCoherentes(items)
    items = elegirMesas(items)
    items = horariosCoherentes(items)
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
          .filter((it) => it.kind === 'stop' && it.modo !== 'camino' && !it.hecho && !esFijo(it) && !esPrimeraVez(lista, it) && it.tipo !== 'desayuno' && filtro(it))
          .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
        for (const item of candidatos) {
          const { lista: nueva, caminos } = mandarASobra(lista, item)
          const despues = reglas.todas(nueva, { spare: [...spare, { ...item }], vistosAntes: estado.vistos, dentroAntes: estado.dentro })
          if (reglas.nuevas(antes, despues).length > 0) continue
          apuntarCaminos(caminos, item)
          spare.push({ ...item, razon: 'usuario', spareReason: 'Para otro momento' })
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
      } else if ((ajuste.dropNames ?? []).length > 0) {
        // «Vas justo»: el viajero ha dicho qué deja para si le sobra tiempo.
        for (const name of ajuste.dropNames) {
          const item = nueva.find((it) => it.kind === 'stop' && it.modo !== 'camino' && !it.hecho && !esFijo(it) && (it.lugar === name || it.titulo === name))
          if (!item) continue
          const { lista: sin, caminos } = mandarASobra(nueva, item)
          apuntarCaminos(caminos, item)
          spare.push({ ...item, razon: 'usuario', spareReason: 'Para otro momento' })
          log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'sobra', causa: 'vas justo y lo has dejado para si te sobra tiempo' })
          nueva = sin
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

    // HOY: cada vez que el viajero marca «Visto», se compara la hora real con lo que le queda de la franja (paradas que faltan, con sus minutos y los trayectos).
    let comprobacionTiempo = null
    if (chequeo && chequeo.dayNumber === dayNumber) {
      const hechoDe = (it) => it.kind === 'stop' && !it.llegada && (chequeo.doneNames ?? []).some((n) => n === it.lugar || n === it.titulo)
      const marcada = items.map((it) => (hechoDe(it) ? { ...it, hecho: true } : it))
      const ahora = chequeo.nowMinutes
      const ultimoHecho = [...marcada].reverse().find((it) => it.hecho)
      const posActual = ultimoHecho ? endCoordsOf(ultimoHecho) : null
      const resto = marcada.filter((it) => !it.hecho)
      const sim = simular(resto, ahora, posActual)
      const quedanManana = sim.some((it) => it.kind === 'stop' && it.franja === 'manana' && !it.llegada)
      const franjaActual = quedanManana || (sim.some((it) => it.kind === 'comida') && ahora < toMin(cfg.comida_hasta)) ? 'manana' : 'tarde'
      const finFranja = franjaActual === 'manana' ? toMin(cfg.manana_hasta) : cenaDesde
      const quedan = sim.filter((it) => it.kind === 'stop' && it.franja === franjaActual && !it.llegada)
      const fin = quedan.length > 0 ? quedan.at(-1).t1 : ahora
      const holgura = finFranja - fin
      const estadoTiempo = holgura > cfg.vas_bien_min ? 'bien' : holgura < 0 ? 'justo' : 'normal'
      let drop = null
      if (estadoTiempo === 'justo') {
        const antes = baseReglas(marcada)
        const cand = marcada
          .filter((it) => it.kind === 'stop' && it.modo !== 'camino' && !it.hecho && it.franja === franjaActual && !esFijo(it) && !esPrimeraVez(marcada, it) && it.tipo !== 'desayuno' && !it.relleno_no_quitar)
          .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
        for (const item of cand) {
          const { lista: nueva } = mandarASobra(marcada, item)
          if (reglas.nuevas(antes, reglas.todas(nueva, { spare: [{ ...item }], vistosAntes: estado.vistos, dentroAntes: estado.dentro })).length > 0) continue
          drop = { name: item.titulo ?? item.lugar, reason: 'Es lo de menos importancia de lo que te queda' }
          break
        }
      }
      let sugerencias = []
      if (estadoTiempo === 'bien') {
        const vistosHoy = new Set(marcada.filter((it) => it.kind === 'stop').map((it) => it.lugar))
        const hechasHoy = marcada.filter((it) => it.hecho).map((it) => it.lugar)
        const otro1 = (nombre) => {
          const otro = drafts.find((d) => d !== draft && stopsOfTrabajo(d.trabajo).some((x) => x.lugar === nombre && x.modo !== 'camino'))
          return otro ? { dia: otro.day.dayNumber, futuro: otro.day.dayNumber > dayNumber } : null
        }
        const salida = []
        // Cuánto de lejos puede estar: en mitad de una franja, lo cercano (5-10 min andando); justo antes de comer o de cenar con 1 h 30 o más de sobra, hasta 15-20 min andando o 15 min en bus o metro.
        const antesDeMesa = quedan.length === 0
        const lejos = antesDeMesa && holgura >= cfg.sugerencia_lejos_min
        const enTransporte = (a, b) => 6 + Math.round((meters(a, b) * 1.3) / 330)
        const mesa = marcada.find((it) => !it.hecho && it.kind === (franjaActual === 'manana' ? 'comida' : 'cena'))
        const tipoMesa = franjaActual === 'manana' ? 'comida' : 'cena'
        const mesaDeAhora = mesa ? simular(resto, ahora, posActual).find((it) => it.id === mesa.id) : null
        const usadas = new Set([...estado.mesas, ...restaurantesDocumento])
        for (const it of marcada) if (it.kind === 'comida' || it.kind === 'cena') usadas.delete(it.restaurante)
        // 1º, lo de «Si te sobra tiempo» de ese día
        for (const sp of spare) salida.push({ item: { ...sp, kind: 'stop' }, nota: null })
        // 2º, lo que el documento sugiere para este día (salvo que el viaje lleve el día propio de ese sitio)
        for (const sg of written.days[draft.id]?.sugerencias ?? []) {
          const place = placeByName.get(sg.lugar)
          if (!place || salida.some((x) => x.item.lugar === sg.lugar) || vistosHoy.has(sg.lugar) || hechasHoy.includes(sg.lugar) || estado.vistos.has(sg.lugar)) continue
          if (sg.salvo_dia && drafts.some((d) => d !== draft && d.id === sg.salvo_dia)) continue
          if (otro1(sg.lugar)) continue
          const aqui = posActual && place.coordinates ? walkLeg(posActual, place.coordinates) : 0
          const minutos = Math.min(sg.min ?? place.duration_minutes ?? 60, 60)
          if (aqui + minutos > holgura + 5 || closedThatDay(place.name, skeletonDay) || (place.type === 'interior' && openCheck(place, ahora + aqui, minutos, hours).ok !== true)) continue
          salida.push({ item: { kind: 'stop', tipo: 'parada', lugar: place.name, titulo: sg.titulo ?? undefined, modo: null, min: minutos, franja: franjaActual, id: idDe({ tipo: 'parada', lugar: place.name }) }, nota: null })
        }
        // 3º, sitios CONOCIDOS de todo el destino (no solo de los días del viaje), abiertos y con tiempo de verlos
        const puntos = [posActual, ...quedan.map((it) => coordsOf(it))].filter(Boolean)
        const candidatos = (destData.places ?? [])
          .filter((place) => !vistosHoy.has(place.name) && !hechasHoy.includes(place.name) && !estado.vistos.has(place.name) && !spare.some((x) => x.lugar === place.name) && Array.isArray(place.coordinates) && !place.capa_de && !(place.tags ?? []).includes('mercadillo_navideno') && !place.available && place.level !== undefined && esConocido(place))
          .map((place) => {
            const aqui = posActual ? walkLeg(posActual, place.coordinates) : 99
            const cercaDeLoQueQueda = Math.min(99, ...puntos.map((c) => walkLeg(c, place.coordinates)).filter((m) => m <= cfg.sugerencia_cerca_min))
            const cerca = Math.min(aqui <= cfg.sugerencia_cerca_min ? aqui : 99, cercaDeLoQueQueda)
            const viaje = posActual ? (aqui <= cfg.sugerencia_lejos_andar_min ? aqui : enTransporte(posActual, place.coordinates) <= cfg.sugerencia_lejos_transporte_min ? enTransporte(posActual, place.coordinates) : 99) : 99
            return { place, aqui, cerca, viaje, otro: otro1(place.name) }
          })
          .filter(({ place, cerca, viaje, otro }) => (cerca < 99 || (lejos && viaje < 99)) && !(otro && !otro.futuro) && !closedThatDay(place.name, skeletonDay))
          .sort((a, b) => (a.place.level ?? 3) - (b.place.level ?? 3) || Math.min(a.cerca, a.viaje) - Math.min(b.cerca, b.viaje))
        for (const { place, aqui, cerca, viaje, otro } of candidatos) {
          if (salida.length >= 6) break
          const esLejos = cerca >= 99
          const minutos = Math.min(place.minutos_fuera ?? place.duration_minutes ?? 20, 30)
          const trayecto = esLejos ? viaje : aqui
          const llega = ahora + (posActual ? trayecto : 0)
          // abierto a la hora a la que llegaría y con tiempo de verlo antes de que cierre
          if (place.type === 'interior' && openCheck(place, llega, minutos, hours).ok !== true) continue
          const item = { kind: 'stop', tipo: 'parada', lugar: place.name, modo: place.type === 'interior' && place.minutos_fuera != null ? 'fuera' : null, min: minutos, franja: franjaActual, id: idDe({ tipo: 'parada', lugar: place.name }) }
          // con las comprobaciones de siempre (sin zigzag, nada repetido…)
          const iPos = marcada.findIndex((it) => !it.hecho)
          const probando = [...marcada.slice(0, iPos < 0 ? marcada.length : iPos), item, ...marcada.slice(iPos < 0 ? marcada.length : iPos)]
          if (reglas.nuevas(baseReglas(marcada), reglas.todas(probando, { vistosAntes: estado.vistos, dentroAntes: estado.dentro })).length > 0) continue
          let nota = otro ? `Lo tienes el día ${otro.dia}` : null
          let cambioMesa = null
          if (esLejos) {
            // Si lo que se propone queda lejos, la comida o la cena se cambia a esa zona: un restaurante de verdad, abierto y que no salga ya en el viaje.
            if (!mesa || !mesaDeAhora) continue
            const buena = (destData.restaurants ?? [])
              .filter((r) => recambio.tipos.includes(r.tipo_local) && !usadas.has(r.name) && restaurantCoords(r.name) && abiertoA(r.name, tipoMesa, Math.max(mesaDeAhora.t0, llega + minutos)))
              .map((r) => ({ r, andar: walkLeg(place.coordinates, restaurantCoords(r.name)) }))
              .filter((x) => x.andar <= cfg.comida_junto_min)
              .sort((a, b) => a.andar - b.andar || a.r.name.localeCompare(b.r.name, 'es'))[0]
            if (!buena) continue
            // tiempo: ir, verlo y llegar al restaurante antes de la hora de la mesa
            if (llega + minutos + buena.andar > Math.max(mesaDeAhora.t0, finFranja) + 15) continue
            cambioMesa = { comida: tipoMesa === 'comida', restaurante: buena.r.name, zona: buena.r.zone ?? null, coordenadas: restaurantCoords(buena.r.name) }
            nota = [nota, `Y ${tipoMesa === 'comida' ? 'comes' : 'cenas'} en ${buena.r.zone ?? buena.r.name}`].filter(Boolean).join(' · ')
          } else if (trayecto + minutos > holgura + 5) continue
          salida.push({ item, nota, cambioMesa })
        }
        sugerencias = salida
      }
      comprobacionTiempo = { estado: estadoTiempo, holgura, antesDeComer: quedan.length === 0, franja: franjaActual, drop, sugerencias }
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
    return construirSalida(draft, skeletonDay, final, spare, quitadas, escritoNights, hours, fecha, dateIso, comprobacionTiempo)
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
        // (La imprescindible solo si el taxi desde la cena es de 15 min o menos; si no, va la nocturna escrita del día.)
        const cercaDeLaCena = (name) => {
          const c = catalogueByName.get(name)?.coordinates
          if (!origenC || !c) return true
          return meters(origenC, c) <= (destData.destination_config?.alcance?.taxi_desde_m ?? 1500) || transitMin(origenC, c, 'taxi') <= cfg.taxi_max_min
        }
        elegida = imprescindiblesNoche.find((name) => vale(name) && cercaDeLaCena(name)) ?? null
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
  const mesesInvierno = destData.destination_config?.context_banners?.meses_invierno ?? MESES_INVIERNO
  const stopNota = (item, hours) => avisoDe(item, hours?.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : Number.isInteger(calendar.month) ? calendar.month + 1 : null, mesesInvierno)
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
    const aviso = stopNota(item, hours)
    if (aviso) ready.stopNotice = aviso
    if (item.foto) ready.photoName = item.foto
    if (Array.isArray(source.salida) && !ready.visitOutside && !ready.passThrough) ready.end_coordinates = source.salida
    const why = item.texto ?? destData.por_que_lugares?.[item.lugar] ?? written.destino?.textos?.[item.lugar] ?? null
    if (why) ready.curatedWhy = why
    if (item.titulo && item.tipo !== 'tour') ready.stretchTitle = item.titulo
    const [scheduled] = placesForScheduler({ id: item.lugar, places: [ready] }, destData, null)
    return scheduled
  }

  function construirSalida(draft, skeletonDay, final, spare, quitadas, escritoNights, hours, fecha, dateIso, comprobacionTiempo = null) {
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
        visits.push({ unitId, place, start, end: start + duration, chained: false, walkMinutes: item.leg ?? 0, walkSource: 'matrix', ...(item.hora && !item.llegada ? { fixedAt: toMin(item.hora), fixedMargin: 0, horaTipo: item.hora_tipo ?? 'turno', ...(item.turno_real ? { turnoRecomendado: true } : {}) } : {}), orientative: !item.hora, franja: item.franja })
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
    // Las franjas del día con su hora (la única hora que se enseña además de las fijas): «Mañana · 9:00–14:00», «Tarde · 15:00–19:30», «Cena · 20:00».
    const media = (m) => Math.round(m / 30) * 30
    const abajo30 = (m) => Math.floor(m / 30) * 30
    const arriba30 = (m) => Math.ceil(m / 30) * 30
    const paradas = final.filter((it) => it.kind === 'stop')
    const comidaIt = final.find((it) => it.kind === 'comida')
    const cenaIt = final.find((it) => it.kind === 'cena')
    const delaManana = paradas.filter((it) => it.franja === 'manana')
    const delaTarde = paradas.filter((it) => it.franja === 'tarde')
    const franjas = []
    if (delaManana.length > 0 || comidaIt) {
      const desdeM = delaManana.length > 0 ? delaManana[0].t0 : comidaIt.t0
      franjas.push({ id: 'manana', label: 'Mañana', from: toHHMM(abajo30(desdeM)), to: toHHMM(arriba30(comidaIt ? comidaIt.t0 : delaManana.at(-1).t1)) })
    }
    if (delaTarde.length > 0) franjas.push({ id: 'tarde', label: 'Tarde', from: toHHMM(abajo30(comidaIt ? comidaIt.t1 : delaTarde[0].t0)), to: toHHMM(arriba30(delaTarde.at(-1).t1)) })
    if (cenaIt) franjas.push({ id: 'cena', label: 'Cena', from: toHHMM(media(cenaIt.t0)), to: null })
    // La tarjeta de descanso (regla 12 del documento): la tarde acaba más de 1 h antes de la cena y el día tiene noche.
    let restCard = null
    {
      const ultimaTarde = delaTarde.length > 0 ? delaTarde.at(-1) : paradas.at(-1)
      if (cenaIt && ultimaTarde && cenaIt.t0 - (ultimaTarde.t1 + (cenaIt.leg ?? 0)) > 60 && !draft.soloTarde) {
        const frases = written.destino?.noche_frases ?? {}
        const nombres = escritoNights.map((n) => frases[n.name] ?? n.name.replace(/ \(noche\)$/, ''))
        const lista = nombres.length <= 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
        restCard = nombres.length > 0
          ? { title: 'Un respiro antes de cenar', text: `Llevas todo el día caminando: relájate, que después de cenar te llevamos a ver ${lista}.`, night_name: lista }
          : { title: 'Un respiro antes de cenar', text: 'Llevas todo el día caminando: aprovecha para descansar antes de cenar.', night_name: null }
      }
    }
    const dayPlan = {
      dayNumber: skeletonDay.dayNumber, weekday: skeletonDay.weekday, allowsRepetition: false, isBlank: false, isExcursion: false, halfDayExcursion: skeletonDay.halfDayExcursion ?? null,
      curated: true, escrito: true, listas: true, hours,
      units, schedule: { visits, meals, kept: units, dropped: [], walkMinutes: 0, meters: 0, idleMinutes: 0, idleBeforeDinner: 0, modeFallback: null },
      lunchZone: null, dinnerZone, dinnerPlaceZone: null, dinnerCoords: dinnerRestaurant?.coordinates ?? null, dinnerRestaurant, nightNames: [], blocks: null,
      curatedDay: { id: draft.id, nombre: draft.dia.nombre, variantes: draft.aplicadas, noche: null, nocheDespuesDeCenar: true, nocheAntesDeCenar: false, nocheMinutos: null, nocheSiCae: null },
      untypedAfternoon: false, reorderedBlocks: [], closedAnchors: [], otherRestaurants: [],
      written: { version: null, escrito: true, tabla: draft.id, grupo: draft.parteKey },
      escritoNights, escritoLog: log.map((entry) => ({ ...entry, fecha: fecha ?? null })),
      escritoRows: final.map((item) => ({ id: item.id, tipo: item.kind === 'stop' ? (item.tipo ?? 'parada') : item.kind, lugar: item.lugar ?? item.restaurante ?? item.noche ?? null, titulo: item.titulo ?? null, restaurante: item.restaurante ?? null, hora: toHHMM(item.t0 ?? 0), t0: item.t0 ?? 0, t1: item.t1 ?? 0, llegaA: item.llegaA ?? null, tarde: item.tarde ?? 0, hora_fija: item.hora ?? null, min: item.min ?? 0, modo: item.modo ?? null, llegada: item.llegada === true, hora_tipo: item.hora_tipo ?? null, fija: Boolean(item.hora), nivel: nivelDe(item.lugar), franja: item.franja, de: item.de ?? null, relleno: item.relleno ?? null, protegido: item.protegido === true, por_horario: item.fuera_por_horario === true, previo_min: item.previo_horario?.min ?? null })),
      tardeLibre,
      spare: spareVisits,
      spareRows: spare.map((item) => ({ razon: item.razon ?? null, id: item.id, lugar: item.lugar, titulo: item.titulo ?? null, franja: item.franja, nivel: nivelDe(item.lugar), modo: item.modo ?? null, protegido: item.protegido === true })),
      ordenBase: draft.ordenBase,
      sunsetText: aviso,
      rainPlan: lluvia,
      franjas,
      restCard,
      timeCheck: comprobacionTiempo ? { ...comprobacionTiempo, sugerencias: comprobacionTiempo.sugerencias.map(({ item, nota, cambioMesa }) => ({ item, nota, cambioMesa: cambioMesa ?? null, place: lugarListo({ ...item, kind: 'stop' }, hours) })).filter((x) => x.place) } : null,
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

  // Todo lo que el viaje lleva en alguno de sus días (las paradas cercanas de relleno no repiten nada del viaje).
  const lugaresDelViaje = new Set(drafts.flatMap((d) => [...d.trabajo.manana, ...d.trabajo.tarde]).map((stop) => stop.lugar).filter(Boolean))
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
  // Lo marcado en el pool que no tiene sitio escrito pero el viaje ya enseña (pasa de camino, sale de noche, o es un barrio del que se ve una parada) no «queda fuera».
  {
    const mostrados = new Set()
    const zonasVistas = new Set()
    for (const day of cityPlanned) {
      for (const row of day.escritoRows ?? []) if (row.lugar) { mostrados.add(row.lugar); if (row.modo !== 'camino') { const zone = placeByName.get(row.lugar)?.zone; if (zone) zonasVistas.add(zone) } }
      for (const row of day.spareRows ?? []) mostrados.add(row.lugar)
    }
    for (let i = unplacedPool.length - 1; i >= 0; i--) {
      const entry = unplacedPool[i]
      if (entry.reason !== 'no_room') continue
      const place = placeByName.get(entry.name)
      if (mostrados.has(entry.name) || seenAtNight.has(entry.name) || ((place?.tags ?? []).includes('barrio') && place?.zone && zonasVistas.has(place.zone))) unplacedPool.splice(i, 1)
    }
  }
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
