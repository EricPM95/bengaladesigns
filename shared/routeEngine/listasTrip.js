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
 *      imprescindible la primera vez). La comida, como muy tarde a las 15:00 (regla 6): primero se acorta lo de menos de la mañana y después pasa a «Si te sobra tiempo».
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
import { tripDays, weekdayForDay } from './tripSkeleton.js'
import { prepararVuelta, datosDeVuelta, disponerVuelta, armarBloque, tarjetaHoyVuelves, avisosDeVuelta, resumenDeVuelta, normalizaHora } from './vueltaDia.js'
import { straightLineMeters } from './travelTimes.js'
import { nocheValida } from './nightLimit.js'
import { franjaDelFreeTour } from './freeTourHoras.js'
import { availabilityLabel, availableForTrip, seasonFit } from './availability.js'
import { TAG_INTEREST_MAP } from './experienceTags.js'
import { isStreet } from './localRules.js'
import { ordenarDias, paradasDelDia } from './listasOrden.js'
import { claseDeReserva, sitiosGrandesDe } from './listasReservas.js'
import { aplicarOpsLlegada, decidirLlegada, excursionEnDia1, libreDeLlegada, MEDIOS_CON_HORA } from './llegadaDia1.js'
import { copiarParte, aplicarVariantes, aplicarExperiencias, aplicarOps, aplicarOp, cumple, norm, toMin, toHHMM } from './listasDia.js'
import { crearReglas, valorDe } from './listasReglas.js'
import { COMIDA_HASTA } from './comida.js'
import { closedStaysNotice, sitiosQueNoSeQuitan } from './closedNotices.js'

const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)))
const slug = (text) => norm(text).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const OUTSIDE_MINUTES = 15
const MESES_INVIERNO = [11, 12, 1, 2]
/** La marca de un sitio que cierra ese día y se queda en su día porque no hay otro (Tanda 6y10, 1b). */
const CERRADO_ESTE_DIA = 'Cerrado este día'
const OUTSIDE_REASONS = { cerrado: 'Hoy cierra', no_cabe: 'Hoy lo ves por fuera para llegar a todo lo del día', viaje_corto: 'En un viaje corto lo ves por fuera: no da tiempo a entrar' }
/** Valores por defecto de las franjas (lo del destino manda: `destination_config.franjas`). Provisional (PREGUNTAS_TANDA6). */
const FRANJAS = {
  inicio: '09:00', comida_desde: '12:30', comida_hasta: COMIDA_HASTA, cena_junto_min: 20, comida_min: 60, cena_min: 90, cena_desde: '19:30',
  // La comida y la cena según la reserva (Tanda 6y8, todos los destinos): si al salir de la reserva ya es más tarde de esta hora, la mesa va ANTES de la reserva; si no, DESPUÉS. La cena no se retrasa quitando paradas: con una reserva nada pasa a «Si te sobra tiempo» (regla 17), solo se ordena.
  // `entre_reservas_min`: lo que se deja para ir de una reserva a la siguiente cuando la app elige el turno de una entrada junto a otra reserva del viajero.
  // Antes de una reserva la mesa se cuenta corta (`*_rapida_min`, desde `*_rapida_desde`) solo si la normal haría llegar tarde: solo ponemos la parada, cuánto tarda en comer lo decide el viajero.
  // LA COMIDA NUNCA VA ANTES DE LAS 12:00 (Tanda 6y10, P4, Eric): `comida_rapida_desde` es 12:00 para todas las reservas. La única excepción (`comida_rapida_excepcion`): una reserva que empieza entre `reserva_desde` y
  // `reserva_hasta` (en Roma, los Museos de 12:00 a 13:00) con la comida antes: la comida corta (`min`: 30) puede empezar desde `desde` (11:15), cerca del sitio, y esa comida hace de «Llegada a…»: la reserva no se pone
  // tarde por el rato de llegada (este solo se acorta hasta lo que queda). Vale para cualquier destino: la regla no lee nombres.
  comida_antes_si_sale_despues_de: '14:30', cena_antes_si_sale_despues_de: '22:00', cena_hasta: '22:30', comida_rapida_min: 45, comida_rapida_desde: '12:00', comida_rapida_excepcion: { reserva_desde: '12:00', reserva_hasta: '13:00', desde: '11:15', min: 30 }, cena_rapida_min: 60, cena_rapida_desde: '18:00', tolerancia_hora_min: 5, entre_reservas_min: 30, cena_desde_verano: '20:00', meses_verano: [5, 6, 7, 8, 9], tarde_margen_min: 60,
  llegada: { reserva: 30, turno: 15, tour: 15 }, excursion_tarde_desde: '16:00', hueco_para_parada_corta: 20, cerca_m: 450, andar_max_min: 25, comida_junto_min: 12, taxi_max_min: 15, manana_hasta: '14:00', vas_bien_min: 45, espera_max_min: 15, espera_plaza_max_min: 40, espera_plaza_cerca_min: 5, cerca_max_min: 30, tarde_medio_desde: '16:00', comida_antes_desde: '12:00', hueco_llenar_min: 60, cerca_andar_min: 15, hueco_reserva_min: 30, sugerencia_cerca_min: 10, sugerencia_lejos_min: 90, sugerencia_lejos_andar_min: 20, sugerencia_lejos_transporte_min: 15,
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
  if (stop.aviso_cierre) partes.push(stop.aviso_cierre)
  if (stop.cierra) partes.push(`Cierra a las ${stop.cierra}: entra antes`)
  if (stop.abre) partes.push(`Abre a las ${stop.abre}`)
  if (partes.length === 0 && !stop.aviso_horario && stop.avisos?.length) partes.push(...stop.avisos.map((a) => a.charAt(0).toUpperCase() + a.slice(1)))
  return partes.length ? [...new Set(partes)].join('. ') : null
}

/**
 * @param {object} args  destData, written ({ destino, days }), totalDays, hasFreeTour, poolNames, experiencesPositive, dateRangeStartIso, month, season, travel, forceOrder, entradas,
 *                       freeTourDespues, mediaJornada, diaCuatro, diaPropio
 *                       vuelta (Tanda 7, el día de vuelta con horas; solo de pago): { hora: 'HH:MM' (la del viajero), modo ('flight'|'train'|'bus'|'ferry' o 'avion'|'tren'…), puntoId, zona, info (_llegada.json), pago: false para ignorarla,
 *                       aMano: true (la ruta a mano: nada se recorta ni se rehace, solo salen los avisos), diaCaidoAlLlegar (el día escrito que se cayó al llegar, de la llegada), excursion: { nombre, vuelve, medioDia, dateIso, dayNumber } }
 * @returns el plan (misma forma que el motor anterior) o null si falta algún día escrito. Con `vuelta`: `plan.vuelta` (ver shared/routeEngine/vueltaDia.js y docs/dias/INFORME_PARTE_MOTORVUELTA_TANDA7.md).
 */
export function planListasTrip(args) {
  const { destData, written: writtenIn, totalDays, hasFreeTour: hasFreeTourIn = false, poolNames: poolNamesIn = [], experiencesPositive = [], dateRangeStartIso = null, month = null, season = null, travel, forceOrder = null, entradas = {}, freeTourDespues: freeTourDespuesIn = null, mediaJornada: mediaJornadaIn = null, diaCuatro = null, diaPropio = null, ajuste = null, chequeo = null, reservasGrandes = [], reservasViaje = [], llegada: llegadaIn = null, vuelta: vueltaIn = null } = args
  if (!writtenIn?.days) return null
  // («Crear mi propio día»: el día que el viajero monta con sus sitios es un día escrito más, hecho al vuelo (diaPropio.js), y va fijo en su día.)
  let written = diaPropio ? { ...writtenIn, days: { ...writtenIn.days, [diaPropio.id]: diaPropio.dia } } : writtenIn
  // La vuelta lleva SIEMPRE los datos de los puntos del destino (`_llegada.json`), los mismos que lee la llegada (`written.llegadaInfo`): una sola fuente. Quien llame puede darle los suyos en `vuelta.info`.
  const vuelta = vueltaIn ? { ...vueltaIn, info: vueltaIn.info ?? written?.llegadaInfo ?? null } : null
  // ── LLEGADA CON HORAS (Tanda 7, agente F; de pago): `llegada` = { hora, medio, puntoId?, zona?, pago?, aMano? }. Sin ella, con `pago: false`, en coche o con la ruta a mano, el motor no cambia nada. ──
  // Con la llegada puesta, el medio día de las salidas de antes (`mediaJornada`) deja de usarse: las horas del vuelo ya dicen cuánto queda de cada día (llegadaDia1.js).
  const llegadaPide = Boolean(llegadaIn && llegadaIn.pago !== false && llegadaIn.aMano !== true && llegadaIn.hora && MEDIOS_CON_HORA.includes(llegadaIn.medio ?? 'avion') && !(diaPropio && Number(diaPropio.dayNumber) === 1))
  const mediaJornada = llegadaPide ? null : mediaJornadaIn
  const diasOriginales = written.days
  const poolNames = poolNamesIn
  const franjasDestino = written.destino?.franjas ?? destData.destination_config?.franjas ?? {}
  const cfg = { ...FRANJAS, ...franjasDestino, llegada: { ...FRANJAS.llegada, ...(franjasDestino.llegada ?? {}) } }
  const calendar = tripCalendar({ dateRangeStartIso, month, season })
  const sitiosGrandes = sitiosGrandesDe(destData)
  const placeByName = new Map((destData.places ?? []).map((place) => [place.name, place]))
  const restaurantByName = new Map((destData.restaurants ?? []).map((restaurant) => [restaurant.name, restaurant]))
  const catalogueByName = new Map((destData.night_experiences ?? []).map((entry) => [entry.name, entry]))
  const selected = (experiencesPositive ?? []).filter((id) => id in TAG_INTEREST_MAP && id !== 'free_tour')
  const tour = destData.default_free_tour ?? null
  // Una excursión que el viajero reservó para el día de llegada, y sale cuando ya está libre: ese día lleva la excursión (llegadaDia1.js); la del día 4 de siempre vuelve a Roma, que no se hacen dos.
  const excursionDia1 = llegadaPide && excursionEnDia1(llegadaIn.excursionReservada ?? null, { fecha1: calendar.hasDates ? calendar.dateOfDay(1) : null, libre: libreDeLlegada(destData, written, llegadaIn) }) === 'lleva_el_dia'
  let skeleton = tripDays({ destData, totalDays, hasFreeTour: hasFreeTourIn, dateRangeStartIso, interruptor: { modo: excursionDia1 ? 'roma' : diaCuatro, mediaJornada: Boolean(mediaJornada) }, propios: diaPropio ? [diaPropio.dayNumber] : [] })
  if (excursionDia1) skeleton = skeleton.map((day, i) => (i === 0 ? { ...day, isExcursion: true, isBlank: false, interruptor: false, curated: null, halfDayExcursion: null } : day))
  const contentDays = skeleton.length
  const cityDays = skeleton.filter((day) => !day.isBlank && !day.isExcursion)
  // Free Tour: en un viaje de 1,5 días o menos NO se ofrece.
  const shortNoTour = cityDays.length === 1 || (cityDays.length === 2 && Boolean(mediaJornada))
  const hasFreeTour = shortNoTour ? false : hasFreeTourIn
  const freeTourDespues = shortNoTour ? null : freeTourDespuesIn
  // (La franja del Free Tour de después: antes de las 13:00 mañana, antes de las 19:00 tarde, y después noche. Se necesita ya para ordenar los días.)
  const ftHour = freeTourDespues?.hora ? toMin(freeTourDespues.hora) : null
  const ftFranja = ftHour != null ? franjaDelFreeTour(freeTourDespues.hora) : freeTourDespues?.franja ?? null
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
        for (const name of Array.isArray(o.otras) ? o.otras : []) restaurantesDocumento.add(name)
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
  const noSeQuitan = sitiosQueNoSeQuitan(destData)
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

  // GANCHO LLEGADA → VUELTA, segunda parte (Tanda 7, integración): los días de la tabla que la llegada ha cambiado por una versión suya (el D1 por «la rápida», «la ruta del centro»…) y que NO son el día caído.
  // Siguen en el viaje con otra forma: «un día más» de la vuelta no los puede traer otra vez como si faltaran (`hooks.vuelta.sustituidos`).
  const conSustituidos = (decision, tabla) => {
    if (decision?.aplica && decision.publico?.hooks?.vuelta) {
      const caido = decision.publico.hooks.vuelta.vuelve_como_dia_mas ?? null
      decision.publico.hooks.vuelta.sustituidos = tabla.filter((id) => !decision.chosen.includes(id) && id !== caido)
    }
    return decision
  }

  // LAS RESERVAS DEL DÍA DE VUELTA son de la vuelta (vueltaDia.js las trata allí, con su bloque a su hora). La llegada no las debe tomar por reservas «de otro día» que reclaman el día 1 (el Coliseo reservado
  // el día de vuelta no le quita el D1 a la llegada): se le pasan solo las reservas grandes de los días de ruta. Solo con una vuelta de pago que corre de verdad (la ruta a mano no la usa).
  const vueltaTrataSusReservas = Boolean(vuelta && vuelta.pago !== false && vuelta.aMano !== true && written.llegadas?.vuelta && totalDays >= 2 && datosDeVuelta(vuelta, vuelta.info))
  const esDeVuelta = (r) => (calendar.hasDates && r?.dateIso ? r.dateIso === calendar.dateOfDay(contentDays + 1) : Number(r?.dayNumber) === contentDays + 1)
  const reservasParaLlegada = vueltaTrataSusReservas ? (reservasGrandes ?? []).filter((r) => !esDeVuelta(r)) : reservasGrandes

  // ── 1. Qué días van y en qué orden ───────────────────────────────────────────────────────────────────────────
  const ordenado = ordenarDias({
    propios: diaPropio ? { [diaPropio.dayNumber]: diaPropio.id } : {},
    reservasGrandes,
    // La llegada con horas: la decisión del día 1 (se pide una vez que se sabe la tabla de días del viaje).
    llegada: llegadaPide ? (chosen) => {
      const ftReserva = tour ? (reservasGrandes ?? []).find((r) => r && r.name === tour.name) ?? null : null
      return conSustituidos(decidirLlegada({
        destData, written, entrada: llegadaIn, chosen, n: contentDays, hasFreeTour, ftReserva, reservasViaje, entradas, excursion: llegadaIn.excursionReservada ?? null, excursionDia1, ftHora: ftReserva?.time ?? (tour ? entradas?.[tour.name] ?? null : null), tourName: tour?.name ?? null,
        fecha1: calendar.hasDates ? calendar.dateOfDay(1) : null, mes: calendar.month, reservasGrandes: reservasParaLlegada, sitiosGrandes: destData.sitios_grandes?.lugares ?? [], nivelDe,
        dia: (k) => { const d = cityDays[k]; return d ? { dayNumber: d.dayNumber, dateIso: realDateIso(d), weekday: hoursOf(d).weekday ?? null, noTour: noTourOn(d) } : null },
        cerrado: (name, k) => Boolean(cityDays[k]) && closedThatDay(name, cityDays[k]),
      }), chosen)
    } : null,
    // El Free Tour de tarde o de noche que el viajero ha reservado, con su fecha: el día escrito que lo lleva va fijo en esa fecha (Tanda 6u).
    freeTourFijo: freeTourDespues && ftFranja && ftFranja !== 'manana' && (freeTourDespues.dateIso || freeTourDespues.dayNumber != null) ? { franja: ftFranja, dateIso: freeTourDespues.dateIso ?? null, dayNumber: freeTourDespues.dayNumber ?? null } : null,
    destData, written, cityDays, contentDays, hasFreeTour, hoursOf, realDateIso, closedThatDay, calendar, poolNames, selected, mediaJornada, forceOrder, noTourOn, tour,
    cerradoA: (lugar, hora, day) => placeByName.get(lugar) && openCheck(placeByName.get(lugar), toMin(hora), 15, hoursOf(day)).ok !== true,
  })
  if (!ordenado) return null
  const { order, dateMoves, motivosOrden, ftSeparado, llegadaDecision } = ordenado
  // El Free Tour sin hora que con la llegada no cabe: el viaje se rehace con sus días de «Sin Free Tour» y la hoja del resumen lo dice.
  if (llegadaDecision?.reiniciarSinFreeTour) {
    const sin = planListasTrip({ ...args, hasFreeTour: false, freeTourDespues: null, experiencesPositive: (args.experiencesPositive ?? []).filter((id) => id !== 'free_tour'), llegada: { ...llegadaIn, _sinTour: true } })
    if (sin?.llegada) { sin.llegada.avisos = [...llegadaDecision.publico.avisos, ...sin.llegada.avisos]; sin.llegada.caso = `free_tour_no_se_pone+${sin.llegada.caso}` }
    return sin
  }
  written = ordenado.written ?? written

  // ── El día de vuelta con horas (Tanda 7, shared/routeEngine/vueltaDia.js): la fila de la tabla, las reservas de ese día y lo que cambia en los días de ruta. Sin `vuelta` (sin vuelos, la gratis), nada de esto existe. ──
  const V = prepararVuelta({ vuelta, info: vuelta?.info ?? null, destData, written, totalDays, contentDays, calendar, reservasGrandes, reservasViaje, sitiosGrandes, tour, weekdayDe: (n) => weekdayForDay(dateRangeStartIso, n) })
  // (La ruta a mano: las horas no recortan ni rehacen nada, solo salen los avisos.)
  const Vactiva = V && !V.aMano ? V : null
  // GANCHO CON LA LLEGADA (Tanda 7, punto 6): el día escrito que se cayó al llegar (cuando el D1 pasa al día 2 y se cae el último día de ruta). La vuelta de las 23:00 o más tarde lo recupera como «un día más».
  // La llegada lo rellena con el id del día (o una lista de ids) antes de que se monte la vuelta; mientras tanto vale lo que traiga la petición (`vuelta.diaCaidoAlLlegar`).
  // Con la llegada con hora puesta, manda lo que ella decidió de verdad (`plan.llegada.hooks.vuelta.vuelve_como_dia_mas`): el día que se cayó. Sin llegada, vale lo de la petición.
  let diaCaidoAlLlegar = (llegadaDecision?.aplica ? llegadaDecision.publico?.hooks?.vuelta?.vuelve_como_dia_mas : null) ?? vuelta?.diaCaidoAlLlegar ?? null

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
    // (Un sitio dentro de otro, con su propio punto —el Reloj de agua del Pincio dentro de «Villa Borghese»—: sus coordenadas mandan, o dos paradas seguidas salen a «0 m».)
    if (Array.isArray(item.coordenadas)) return item.coordenadas
    if (item.modo === 'fuera' || item.modo === 'camino') return source.pass_by?.coordinates ?? source.coordinates ?? null
    // (Por dentro se llega por la entrada, si el sitio tiene una distinta de su centro: el Foro, por el lado del Coliseo.)
    return (Array.isArray(item.entrada_en) ? item.entrada_en : null) ?? (Array.isArray(source.entrada) ? source.entrada : null) ?? source.coordinates ?? null
  }
  const endCoordsOf = (item) => {
    if (item.kind !== 'stop' || item.llegada) return coordsOf(item)
    const source = sourceOf(item)
    if (item.tipo === 'tour' && tour) return tour.ends_at?.coordinates ?? tour.coordinates ?? null
    return item.modo === 'dentro' || !item.modo ? (Array.isArray(item.salida_en) ? item.salida_en : Array.isArray(source?.salida) ? source.salida : coordsOf(item)) : coordsOf(item)
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

  // (El zigzag mira dónde está cada sitio, no por qué lado del Foro se entra: ese lado solo cuenta para el tiempo de andar.)
  const reglas = crearReglas({
    coordsOf: (item) => (item.entrada_en ? coordsOf({ ...item, entrada_en: undefined }) : coordsOf(item)), nivelDe, walk: (a, b) => walkLeg(a, b), meters,
    cerradoEnFranja: (item) => item.cerrado_todo_el_dia === true,
  })

  // ── Estado del viaje: lo que ya salió (los días se procesan en orden) ──────────────────────────────────────────
  const estado = {
    vistos: new Set(hasFreeTour ? [...tourCovers] : []), // lo que ya salió como parada o de camino (para «la primera vez»)
    dentro: new Set(), // lo que ya va por dentro
    mesas: new Set(), // restaurantes ya usados
    noches: new Set(), // nocturnas ya usadas
    cerrados: new Set(), // lugares que cierran y se quedan como «Cerrado este día» (no vistos)
    visitadoEn: new Map(), // lugar → número del día en que ya fue parada (para «Ya lo visitaste el día n» en un «de camino»)
  }
  const problems = []
  const dayNotices = []
  const unplacedPool = []
  const logsViaje = []

  // ── 2. Preparar la lista de cada día: variantes, free tour ─────────────────────────────────────────────────────
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
  // Las horas de las reservas grandes de CADA día (Tanda 6w): la petición trae todas las del viaje con su fecha; así el día de los Museos y el del Free Tour, aunque sean distintos, ven cada uno la suya.
  const grandesConHora = (reservasGrandes ?? []).filter((r) => r && r.time)
  const nombresGrandes = new Set(grandesConHora.map((r) => r.name))
  const entradasDeDia = (index) => {
    if (grandesConHora.length === 0) return entradas
    const day = cityDays[index]
    const out = Object.fromEntries(Object.entries(entradas ?? {}).filter(([name]) => !nombresGrandes.has(name)))
    for (const r of grandesConHora) {
      const esDeEseDia = calendar.hasDates && r.dateIso ? hoursOf(day).dateIso === r.dateIso : day.dayNumber === Number(r.dayNumber)
      if (esDeEseDia) out[r.name] = r.time
    }
    return out
  }
  // (`sobre`: el día de vuelta, que no es un día de ruta: sus reservas propias, sin pool ni experiencias —ya salieron en los días de ruta—.)
  const contextoDe = (dia, day, hours, parte, index, sobre = null) => ({
    weekday: hours.weekday, dateIso: calendar.hasDates ? hours.dateIso : null, month: hours.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : Number.isInteger(calendar.month) ? calendar.month + 1 : null,
    hasFreeTour, freeTourFranja: ftDayIndex === index ? ftFranja : null, tourName: tour?.name ?? null, ftAqui: Boolean(ftSeparado) && ftSeparado.slotFt === index, ftOtroDia: Boolean(ftSeparado) && ftSeparado.slotOtro === index, entradas: sobre ? sobre.entradas : llegadaDecision?.entradasApp?.[index] ? { ...entradasDeDia(index), ...llegadaDecision.entradasApp[index] } : entradasDeDia(index), forzar: sobre ? [] : dia.llegada_ops?.forzar ?? [], poolNames: sobre ? [] : poolNames, experiencias: sobre ? [] : selected, orden: order, parte, enFechas,
    // (Un sitio que cierra ese día activa las variantes «si cierra, sin él» del documento. Si es de los que NUNCA se quitan —el Vaticano, la Galería Borghese— y ningún día del viaje abre, se queda
    // en su día como parada «Cerrado este día», sin ocupar tiempo y con su aviso (Tanda 6y10, 1b), y el resto del día es la versión sin él.)
    cerrado: (name) => closedThatDay(name, day) || (!sobre && Vactiva ? Vactiva.cerradoEn(dia.id, name) : false),
  })

  // (`sobre`: el día de vuelta —Tanda 7—, que no es un día de ruta: { day, parteKey, entradas }.)
  const preparar = (id, index, sobre = null) => {
    const dia = written.days[id]
    const day = sobre?.day ?? cityDays[index]
    const hours = hoursOf(day)
    const franjaMedio = mediaJornada?.franja ?? (index === 0 ? 'tarde' : 'manana')
    // (Un día con una versión «De tarde» —el DA-medio, la tarde de llegada— la usa cuando el medio día es de tarde.)
    const parteKey = sobre?.parteKey ?? (dia.partes[franjaMedio] && Object.keys(dia.partes).length > 1 ? franjaMedio : dia.partes.unica ? 'unica' : dia.partes[franjaMedio] ? franjaMedio : Object.keys(dia.partes)[0])
    const parte = dia.partes[parteKey]
    const construirBase = () => {
      const b = copiarParte(parte)
      if (dia.hereda_manana_de) b.manana = clone(written.days[dia.hereda_manana_de].partes.unica.manana)
      if (!b.empieza && dia.empieza) b.empieza = dia.empieza
      // La tarde de un medio día (la de llegada) empieza a las 16:00 (provisional: las llegadas y salidas se piensan aparte).
      if (parteKey === 'tarde' && (dia.partes.manana || dia.partes.unica) && !b.empieza) b.empieza = cfg.tarde_medio_desde
      return b
    }
    const base = construirBase()
    const aplicadas = []
    const ctx = contextoDe(dia, day, hours, parteKey === 'unica' ? null : parteKey, index, sobre)
    let trabajo = aplicarVariantes(base, dia, ctx, aplicadas)
    // El día de un sitio grande reservado el día de vuelta se queda en su día en la versión sin esa visita (Tanda 7, punto 10): su bloque va al día de vuelta.
    if (Vactiva && !sobre) trabajo = Vactiva.limpiar(dia.id, trabajo)
    // Lo que NUNCA se quita (el Vaticano, la Galería Borghese) y ese día cierra, porque ningún otro día del viaje abre (Tanda 6y10, 1b): la versión «sin él» del documento ya ha quitado el sitio de la lista;
    // aquí vuelve a su puesto como parada marcada «Cerrado este día» (no se quita: decide el viajero). Después, en 5.2b, sale de la secuencia del día para no ocupar tiempo.
    for (const name of noSeQuitan) {
      if (!closedThatDay(name, day)) continue
      const esElSitio = (s) => s.lugar === name && s.tipo !== 'traslado' && s.modo !== 'camino'
      if ([...trabajo.manana, ...trabajo.tarde].some(esElSitio)) continue
      const original = construirBase()
      for (const key of ['manana', 'tarde']) {
        const at = original[key].findIndex(esElSitio)
        if (at < 0) continue
        const donde = Math.min(at, trabajo[key].length)
        trabajo = { ...trabajo, [key]: [...trabajo[key].slice(0, donde), { ...original[key][at], cerrado_este_dia: true }, ...trabajo[key].slice(donde)] }
        break
      }
    }
    // El mismo día SIN las reservas grandes (Tanda 6y5, P4): la fila de la tabla de la hora reservada puede llevar menos paradas que el día de siempre. Lo que ya no cabe no desaparece:
    // pasa a «Si te sobra tiempo» de ese día (paso 5.0b).
    const sinGrandes = Object.fromEntries(Object.entries(ctx.entradas ?? {}).filter(([name]) => !sitiosGrandes.has(name)))
    if (dia.llegada_ops) trabajo = aplicarOpsLlegada(trabajo, dia.llegada_ops, written.days)
    const controlBase = Object.keys(sinGrandes).length !== Object.keys(ctx.entradas ?? {}).length ? aplicarVariantes(construirBase(), dia, { ...ctx, entradas: sinGrandes }, []) : null
    const control = controlBase && dia.llegada_ops ? aplicarOpsLlegada(controlBase, dia.llegada_ops, written.days) : controlBase
    const conReserva = new Set([...trabajo.manana, ...trabajo.tarde, ...(trabajo.sobra ?? [])].filter((s) => s.tipo !== 'traslado').map((s) => s.lugar))
    const sinReservaVistos = new Set()
    const perdidasPorReserva = control ? [...control.manana, ...control.tarde].filter((s) => {
      // (Una calle «de camino» no es una parada: si la ruta ya no pasa por allí, desaparece como siempre. Un «de camino» que es un sitio —la Fuente de las Tortugas, el Elefantino— sí es una parada.)
      if (s.tipo !== 'parada' || !s.lugar || s.hora || conReserva.has(s.lugar) || sinReservaVistos.has(s.lugar)) return false
      if (s.modo === 'camino' && (!placeByName.get(s.lugar) || isStreet(placeByName.get(s.lugar)))) return false
      sinReservaVistos.add(s.lugar)
      return true
      // (En «Si te sobra tiempo» ya no es «de camino»: es una parada corta que el viajero puede hacer si le sobra el rato.)
    }).map((s) => (s.modo === 'camino' ? { ...clone(s), modo: null, min: Math.max(s.min ?? 10, 10) } : clone(s))) : []
    // El Free Tour que el viajero añade: la hora que él eligió.
    const marca = (lista) => lista.map((stop) => (stop.hora === '$free_tour' ? { ...stop, hora: freeTourDespues?.hora ?? '17:00' } : stop))
    trabajo = { ...trabajo, manana: marca(trabajo.manana), tarde: marca(trabajo.tarde) }
    const log = []
    // Un día sin Free Tour (festivo): el tour no se pone.
    if (tour && noTourOn(day) && [...trabajo.manana, ...trabajo.tarde].some((stop) => stop.lugar === tour.name)) {
      trabajo = { ...trabajo, manana: trabajo.manana.filter((s) => s.lugar !== tour.name), tarde: trabajo.tarde.filter((s) => s.lugar !== tour.name) }
      aplicadas.push('sin_free_tour')
    }
    return { id, index, dia, day, hours, parteKey, trabajo, perdidasPorReserva, aplicadas, log, ctx, pooled: [], soloTarde: Boolean(day.halfDayExcursion?.soloTarde), sinAjustes: dia.llegada_ops?.sin_ajustes === true, llegadaBloques: dia.llegada_ops?.bloques ?? [], diaLlegada: dia.llegada_ops?.dia_llegada === true }
  }
  const drafts = order.map((id, index) => preparar(id, index))
  // Una salida de madrugada (Tanda 7, punto 9): cuenta como la noche de antes. El último día de ruta lleva su cena y no lleva nocturna (el viajero se va esa noche).
  if (Vactiva?.madrugada) {
    const ultimoIndice = cityDays.indexOf(skeleton.at(-1))
    if (ultimoIndice >= 0 && drafts[ultimoIndice]) {
      drafts[ultimoIndice].trabajo = { ...drafts[ultimoIndice].trabajo, noche: null }
      drafts[ultimoIndice].sinNocheVuelta = true
      drafts[ultimoIndice].aplicadas.push('vuelta:sin_nocturna')
    }
  }

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
    if (closedThatDay(name, elegido.d.day) && !noSeQuitan.has(name)) {
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
  // 5.0 Una reserva de cualquier sitio va al DÍA DE SU FECHA (Tanda 6y4, punto 7). Una grande (el Coliseo, los Museos, la Galería) mueve su día entero (ordenarDias, arriba); las demás
  // (el Altar de la Patria, el Panteón, un sitio sin tabla…) mueven solo el sitio: sale de la lista del día que lo llevaba y entra en la del día de la reserva, en el puesto que le toca por su hora.
  // Nada se quita nunca: lo que sale de un día entra en otro, y cada día que se pida por separado ve el mismo viaje (la petición trae todas las reservas, no solo las de su día).
  // (Lo que cubre la misma entrada que una grande —el Foro con el Coliseo— no mueve nada por su cuenta: va con el día de la grande.)
  const marcasViaje = []
  // El reloj de un día a ritmo normal: lo que dura cada parada y un rato de andar entre una y otra; una hora fija espera a su hora.
  const relojTras = (draft, secuencia, n) => {
    let reloj = toMin(draft.trabajo.empieza ?? cfg.inicio)
    for (let at = 0; at < n; at++) {
      const s = secuencia[at]
      if (s.tipo !== 'traslado') {
        if (s.hora && s.hora !== '$free_tour') reloj = Math.max(reloj, toMin(s.hora))
        reloj += (s.min ?? 10) + 8
      } else reloj += 10
    }
    return reloj
  }
  /** Quita la visita de una lista de un día (con el traslado que iba delante, que era para llegar a ella) y la devuelve. */
  const sacarVisita = (draft, esLaVisita) => {
    for (const key of ['manana', 'tarde']) {
      const at = draft.trabajo[key].findIndex(esLaVisita)
      if (at < 0) continue
      const visita = draft.trabajo[key][at]
      const quitar = new Set([at])
      if (draft.trabajo[key][at - 1]?.tipo === 'traslado') quitar.add(at - 1)
      draft.trabajo[key] = draft.trabajo[key].filter((_, i) => !quitar.has(i))
      return visita
    }
    return null
  }
  /** Mete la visita en el día en el puesto que le toca por su hora: en la mañana si es antes de la comida (en la tarde si el día solo tiene tarde), detrás de lo que a esa hora ya habrá hecho y sin pasar una hora fija. */
  const meterPorHora = (draft, visita, minutos) => {
    const secuencia = [...draft.trabajo.manana, ...draft.trabajo.tarde]
    const nManana = draft.trabajo.manana.length
    let lo = 0
    let hi = secuencia.length
    secuencia.forEach((s, i) => {
      if (s.tipo === 'traslado' || !s.hora || s.hora === '$free_tour') return
      if (toMin(s.hora) <= minutos) lo = Math.max(lo, i + 1)
      else hi = Math.min(hi, i)
    })
    const deLaManana = !draft.soloTarde && minutos < toMin(cfg.comida_antes_desde) + 90
    let desde = deLaManana ? 0 : nManana
    let hasta = deLaManana ? nManana : secuencia.length
    if (draft.soloTarde) { desde = nManana; hasta = secuencia.length }
    // (Si la hora y las horas fijas del día no dejan hueco en la franja, manda la hora fija; y si tampoco, la franja.)
    let a = Math.max(desde, lo)
    let b = Math.min(hasta, hi)
    if (a > b) { a = Math.max(0, Math.min(lo, hi)); b = Math.max(a, Math.min(hi, secuencia.length)) }
    let punto = a
    for (let at = a; at <= b; at++) if (relojTras(draft, secuencia, at) <= minutos) punto = at
    if (secuencia[punto - 1]?.tipo === 'traslado') punto++ // (entre un traslado y la parada a la que lleva, no)
    const at = Math.min(Math.max(punto, a), Math.max(a, b))
    if (at <= nManana && !draft.soloTarde) draft.trabajo.manana.splice(Math.min(at, nManana), 0, visita)
    else draft.trabajo.tarde.splice(Math.max(0, at - nManana), 0, visita)
  }
  // LLEGADA (Tanda 7, F): una reserva grande del día 1 con la llegada desde las 14:00 (o 13:00 en invierno) lleva SOLO su bloque (el Coliseo con el Arco y el Foro, los Museos con la Plaza y la Basílica,
  // la Galería con el parque), entero y sin mirar si cabe: se mete en la ruta de la fila en el puesto que le toca por su hora, como una reserva pequeña (lo que va antes en su orden y lo demás después).
  // El bloque sale de la lista del día escrito del sitio, con la tabla de la hora de la reserva (`diasOriginales`, sin los ajustes de la llegada).
  for (const d of drafts) {
    for (const bloque of d.llegadaBloques ?? []) {
      const dia = diasOriginales[bloque.fuente]
      if (!dia) continue
      const parte = dia.partes.unica ?? Object.values(dia.partes)[0]
      const base = copiarParte(parte)
      if (dia.hereda_manana_de) base.manana = clone(diasOriginales[dia.hereda_manana_de].partes.unica.manana)
      const origen = aplicarVariantes(base, dia, { ...contextoDe(dia, d.day, d.hours, null, d.index), entradas: { [bloque.sitio]: bloque.hora } }, [])
      const secuencia = [...origen.manana, ...origen.tarde]
      const delBloque = secuencia.filter((s) => s.tipo !== 'traslado' && bloque.lugares.includes(s.lugar) && s.modo !== 'camino')
      const yaEsta = (lugar) => [...d.trabajo.manana, ...d.trabajo.tarde, ...(d.trabajo.sobra ?? [])].some((s) => s.tipo !== 'traslado' && s.lugar === lugar)
      const iReserva = delBloque.findIndex((s) => s.lugar === bloque.sitio)
      if (iReserva < 0) continue
      // La primera parada del bloque va donde le toca por su hora (la hora de la reserva menos lo que dura lo que va delante en el bloque); el resto del bloque, detrás, tal cual, en su orden.
      const t = toMin(bloque.hora)
      const largo = (s) => (s.min ?? 10) + 8
      const nuevas = delBloque.filter((s) => !yaEsta(s.lugar)).map((s) => ({ ...s, protegido: true, llegada_bloque: bloque.sitio, hora: undefined, hora_tipo: s.lugar === bloque.sitio ? s.hora_tipo : undefined }))
      if (nuevas.length > 0) {
        const delante = delBloque.slice(0, iReserva).reduce((suma, o) => suma + largo(o), 0)
        meterPorHora(d, nuevas[0], t - delante)
        let anterior = nuevas[0]
        for (const visita of nuevas.slice(1)) {
          const lista = d.trabajo.manana.includes(anterior) ? d.trabajo.manana : d.trabajo.tarde
          lista.splice(lista.indexOf(anterior) + 1, 0, visita)
          anterior = visita
        }
      }
      d.aplicadas.push(`bloque_de_la_reserva:${bloque.sitio}`)
    }
  }
  for (const r of reservasViaje ?? []) {
    if (!r?.name || sitiosGrandes.has(r.name) || !/^\d{1,2}:\d{2}$/.test(String(r.time ?? ''))) continue
    const slot = cityDays.findIndex((day) => (calendar.hasDates && r.dateIso ? hoursOf(day).dateIso === r.dateIso : day.dayNumber === Number(r.dayNumber)))
    if (slot < 0 || !drafts[slot]) continue
    const destino = drafts[slot]
    const hora = String(r.time).length === 4 ? `0${r.time}` : String(r.time)
    const minutos = toMin(hora)
    const esLaVisita = (s) => s.lugar === r.name && s.tipo !== 'traslado' && s.modo !== 'camino'
    // Por dentro una sola vez en el viaje: el sitio reservado entra por dentro en el día de su reserva; si otro día lo llevaba también por dentro, ahí pasa a verse por fuera.
    const soloAquiPorDentro = (aqui) => {
      for (const d of drafts) {
        if (d === aqui) continue
        for (const key of ['manana', 'tarde']) {
          d.trabajo[key] = d.trabajo[key].map((s) => (esLaVisita(s) && s.modo === 'dentro' ? { ...s, modo: 'fuera', min: Math.min(s.min ?? 15, placeByName.get(r.name)?.minutos_fuera ?? 15) } : s))
        }
      }
    }
    const dentroMin = (visita) => Math.max(visita.min ?? 0, minutosDentro[r.name] ?? Math.min(placeByName.get(r.name)?.duration_minutes ?? 60, 90))
    if (stopsOfTrabajo(destino.trabajo).some(esLaVisita)) {
      // Ya está en el día de la reserva. Si en la lista cae a una hora muy distinta de la de la reserva (el Panteón de la tarde, reservado a las 11:00), se pasa al puesto que le toca por su hora:
      // si no, el día enseñaría «Tarde» con una hora de la mañana. Si cae cerca de su hora, se queda donde la pone la lista.
      const secuencia = [...destino.trabajo.manana, ...destino.trabajo.tarde]
      const en = secuencia.findIndex(esLaVisita)
      if (Math.abs(relojTras(destino, secuencia, en) - minutos) > 60) {
        const visita = sacarVisita(destino, esLaVisita)
        meterPorHora(destino, { ...visita, modo: 'dentro', min: dentroMin(visita), protegido: true }, minutos)
        destino.aplicadas.push(`reserva_a_su_hora:${r.name}`)
      }
      soloAquiPorDentro(destino)
      marcasViaje.push({ lugar: r.name, hora, host: destino })
      continue
    }
    const origen = drafts.find((d) => d !== destino && stopsOfTrabajo(d.trabajo).some(esLaVisita))
    if (!origen) continue
    soloAquiPorDentro(destino)
    // Sale del día que lo llevaba y entra en el de la reserva.
    const visita = sacarVisita(origen, esLaVisita)
    origen.aplicadas.push(`reserva_sale:${r.name}`)
    meterPorHora(destino, { ...visita, modo: 'dentro', min: dentroMin(visita), protegido: true }, minutos)
    destino.aplicadas.push(`reserva_entra:${r.name}`)
    marcasViaje.push({ lugar: r.name, hora, host: destino })
  }

  // 5.0b Lo que una reserva grande deja sin sitio no desaparece (Tanda 6y5, P4): con el Coliseo desde las 14:16 la fila de su tabla trae una tarde con menos paradas (se pierden la Fuente de las
  // Tortugas, el Elefantino…). Esas paradas, si no salen en ningún otro día ni de camino, pasan a «Si te sobra tiempo» de ese día. (Lo que el Free Tour ya enseña, o lo que ese día está cerrado, no.)
  for (const d of drafts) {
    for (const parada of d.perdidasPorReserva ?? []) {
      const place = placeByName.get(parada.lugar)
      if (!place || (hasFreeTour && tourCovers.has(parada.lugar) && place.type !== 'interior') || closedThatDay(parada.lugar, d.day)) continue
      const sigue = drafts.some((o) => [...stopsOfTrabajo(o.trabajo), ...(o.trabajo.sobra ?? [])].some((s) => s.lugar === parada.lugar && s.tipo !== 'traslado'))
      if (sigue) continue
      d.trabajo.sobra = [...(d.trabajo.sobra ?? []), { ...parada, por_reserva: true }]
      d.aplicadas.push(`sobra_por_reserva:${parada.lugar}`)
    }
  }

  // (Las reservas con día —las de arriba— ya saben en qué día van; las `entradas` de la petición son las del día pedido y solo valen para lo que no viene con día.)
  const reservasAMarcar = [...marcasViaje]
  const yaMarcada = new Set(marcasViaje.map((marca) => marca.lugar))
  if (grandesConHora.length === 0) { for (const [lugar, hora] of Object.entries(entradas ?? {})) if (!yaMarcada.has(lugar)) reservasAMarcar.push({ lugar, hora, host: null }) }
  else {
    for (const [lugar, hora] of Object.entries(entradas ?? {})) if (!nombresGrandes.has(lugar) && !yaMarcada.has(lugar)) reservasAMarcar.push({ lugar, hora, host: null })
    drafts.forEach((d, i) => { for (const [lugar, hora] of Object.entries(entradasDeDia(i))) if (nombresGrandes.has(lugar)) reservasAMarcar.push({ lugar, hora, host: d }) })
  }
  for (const { lugar, hora, host: anfitrionFijo } of reservasAMarcar) {
    const host = anfitrionFijo ?? drafts.find((d) => stopsOfTrabajo(d.trabajo).some((s) => s.lugar === lugar && s.tipo !== 'traslado' && s.modo !== 'camino'))
    if (!host || !stopsOfTrabajo(host.trabajo).some((s) => s.lugar === lugar && s.tipo !== 'traslado' && s.modo !== 'camino')) continue
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
    // Regla 17: si el viajero insiste en una hora sin lista escrita, se aplica la regla general (4) y queda apuntado.
    const clase = claseDeReserva(host.dia, lugar, hora, { sitiosGrandes, destData, tieneFreeTour: hasFreeTour, excursionManana: Boolean(host.day?.halfDayExcursion && host.day.halfDayExcursion.soloTarde) })
    if (clase.clase === 'sin_lista' || clase.clase === 'no_cabe') host.log.push({ id: null, lugar, sitio: lugar, que: 'aviso', causa: clase.clase === 'sin_lista' ? `reserva sin lista: ${lugar} a las ${hora} no tiene lista escrita para este día; se aplica la regla general (4)` : `reserva que no cabe: ${lugar} a las ${hora} es una combinación que no cabe; se aplica la regla general (4)` })
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
      if (t.comida) items.push({ ...t.comida, kind: 'comida', franja: 'comida', id: idDe({ kind: 'comida', restaurante: t.comida.restaurante }), min: t.comida.min ?? cfg.comida_min, restaurante_escrito: t.comida.restaurante })
    }
    for (const stop of t.tarde) items.push(aItem(stop, 'tarde'))
    if (t.cena) items.push({ ...t.cena, kind: 'cena', franja: 'cena', id: idDe({ kind: 'cena', restaurante: t.cena.restaurante }), min: cfg.cena_min, restaurante_escrito: t.cena.restaurante })
    if (draft.soloTarde) for (const stop of t.manana) quitadas.push({ ...stop, motivo: 'excursión de medio día: de 8:00 a 14:00 el viajero está fuera; la ciudad empieza a las 16:00' })

    // (El orden de la lista escrita tal como llega, antes de tocar nada: la prueba compara el día con esto.)
    const ordenBase = items.map((it) => it.id)
    // Lo que el documento deja para «Si te sobra tiempo» en esta versión del día (p. ej. el Barrio Judío y las iglesias con el Coliseo a mediodía).
    for (const stop of t.sobra ?? []) {
      const item = aItem(stop, 'tarde')
      spare.push({ ...item, razon: stop.por_reserva ? 'reserva' : 'documento', spareReason: 'Para otro momento' })
      log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'sobra', causa: stop.sobra_causa ?? (stop.por_reserva ? 'con tu reserva a esa hora ya no cabe en el día: pasa a «Si te sobra tiempo»' : 'el documento lo deja para «Si te sobra tiempo» en este día') })
    }
    // 5.2 Lo que el Free Tour recorre sale de la lista cuando la variante lo pide (el Free Tour que el viajero añade para esa franja).
    if (t.quitar_cubierto_por_tour && tour) {
      items = items.filter((item) => {
        if (item.kind !== 'stop' || !tourCovers.has(item.lugar) || item.modo === 'camino' || item.hora) return true
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'quitada', causa: 'Lo ves en el Free Tour' })
        return false
      })
    }

    // 5.2b Lo que NUNCA se quita y ese día cierra (Tanda 6y10, 1b): se saca de la secuencia del día —no lleva «Llegada a…», no ocupa tiempo ni cuenta para nada— y vuelve al final en su puesto como
    // parada «Cerrado este día», con su aviso (se queda, no se quita: decide el viajero). El resto del día es la versión «sin él» del documento. (Una reserva del viajero con el sitio cerrado sigue su camino: se queda y avisa.)
    const cerradosEseDia = []
    {
      const sale = []
      const antes = []
      for (const item of items) {
        const esMarca = item.kind === 'stop' && !item.llegada && noSeQuitan.has(item.lugar) && item.modo !== 'fuera' && item.modo !== 'camino' && !(item.hora_tipo === 'reserva' && item.hora)
          && (item.cerrado_este_dia === true || closedThatDay(item.lugar, skeletonDay, item.ignora_temporada === true))
        if (esMarca) cerradosEseDia.push({ item, antes: [...antes].reverse() })
        else { sale.push(item); antes.push(item.id) }
      }
      items = sale
      for (const { item } of cerradosEseDia) {
        const aviso = closedStaysNotice(destData, placeByName.get(item.lugar), hours) ?? `Ese día ${item.lugar} está cerrado`
        item.aviso_cierre = aviso
        problems.push({ tipo: 'cierra_sin_otro_dia', lugar: item.lugar, aviso, dayNumber })
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'aviso', causa: `cierre de ${item.lugar}: ningún otro día del viaje lo permite; se queda en su día con el aviso` })
      }
    }

    /** Cerrado todo el rato de su franja (la mañana hasta el límite de la comida; la tarde desde que empieza la comida): no abre cuando le toca. */
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
    // (Tanda 6k, punto 3: sin fechas no hay «hoy»: un sitio de temporada que no abre en ese mes no «cierra hoy», solo está en sus fechas.)
    const motivoCierre = (source) => (calendar.hasDates ? OUTSIDE_REASONS.cerrado : source.available && availabilityLabel(source.available) ? `Solo está ${availabilityLabel(source.available)}` : 'Fuera de temporada en ese mes')
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
      // (Un sitio que nunca se quita y cierra ese día ya salió de la secuencia en 5.2b: vuelve al final como «Cerrado este día».)
      if (item.si_cerrado?.cambiar_titulo) {
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'titulo', causa: `${item.lugar} está cerrado hoy: la parada es «${item.si_cerrado.cambiar_titulo}»` })
        return [{ ...item, titulo: item.si_cerrado.cambiar_titulo, modo: 'fuera', min: item.si_cerrado.min ?? Math.min(item.min, source.minutos_fuera ?? 10), motivo_fuera: motivoCierre(source) }]
      }
      const sePuedeFuera = source.minutos_fuera != null || source.pass_by || source.type === 'exterior'
      if (sePuedeFuera) {
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'modo', causa: `cierre de ${item.lugar}: hoy cierra, por fuera` })
        return [{ ...item, modo: 'fuera', min: Math.min(item.min, source.minutos_fuera ?? OUTSIDE_MINUTES), motivo_fuera: motivoCierre(source) }]
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
      // (30 min en las reservas grandes —el Coliseo, los Museos, la Galería—, por las colas de seguridad; 15 en el Free Tour y en los turnos.)
      const tipoLlegada = item.tipo === 'tour' ? 'tour' : item.hora_tipo === 'reserva' && sitiosGrandes.has(item.lugar) ? 'reserva' : 'turno'
      const margen = cfg.llegada[tipoLlegada]
      const info = written.destino?.llegadas ?? {}
      const texto = tipoLlegada === 'tour' ? `${info.free_tour?.texto ?? ''}${tour?.meeting_point ? ` Punto de encuentro: ${tour.meeting_point}.` : ''}`.trim() : info.por_lugar?.[item.lugar] ?? info[tipoLlegada]?.texto ?? null
      const titulo = tipoLlegada === 'tour' ? info.free_tour?.titulo ?? 'Llegada al punto de encuentro del Free Tour' : `Llegada a ${item.lugar}`
      const llegada = { kind: 'stop', tipo: tipoLlegada === 'tour' ? 'tour' : 'parada', llegada: true, lugar: item.lugar, titulo, texto_llegada: texto, min: margen, modo: 'fuera', franja: item.franja, id: idDe({ tipo: 'llegada', lugar: item.lugar }), de: item.id, hora: item.hora ? toHHMM(toMin(item.hora) - margen) : undefined, entrada: item.hora ?? null }
      return [llegada, { ...item, llegada_incluida: true }]
    })
    items = conLlegada(items)

    // ── Horas orientativas: la suma de lo que dura cada parada más el trayecto ─────────────────────────────────
    /** ¿Esta hora de reserva cae en la ventana de la excepción de la comida corta (`comida_rapida_excepcion`)? */
    const enVentanaDeComida = (hora) => {
      const excepcion = cfg.comida_rapida_excepcion
      return Boolean(excepcion && hora && toMin(hora) >= toMin(excepcion.reserva_desde) && toMin(hora) <= toMin(excepcion.reserva_hasta))
    }
    const startPoint = { t: empiezaMin }
    const simular = (lista, desde = startPoint.t, prev0 = null) => {
      let t = desde
      let prev = prev0
      let pendiente = null
      let anterior = null
      return lista.map((item) => {
        if (item.kind === 'traslado') { pendiente = item; return { ...item, t0: t, t1: t, leg: 0 } }
        const c = coordsOf(item)
        let leg = 0
        let transit = null
        // (Entre la «Llegada a…» y la propia parada no hay trayecto: es el mismo sitio.)
        if (prev && c && !(anterior?.llegada && anterior.de === item.id)) {
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
        else if (item.kind === 'cena') start = Math.max(llega, item.piso != null ? item.piso : cenaDesde)
        if (item.no_antes) start = Math.max(start, toMin(item.no_antes))
        // La «Llegada a…» de una reserva de la ventana, detrás de una comida: la comida hace de llegada, y el rato de llegada solo dura lo que queda hasta la hora de la reserva.
        const llegadaElastica = item.llegada === true && Boolean(item.entrada) && anterior?.kind === 'comida' && enVentanaDeComida(item.entrada)
        if (item.hora && !llegadaElastica) {
          const fija = toMin(item.hora)
          // (Hasta `tolerancia_hora_min` de retraso cuenta como llegar a su hora: la hora de la parada es orientativa y andar un poco más deprisa lo cubre.)
          if (llega <= fija || llega - fija <= cfg.tolerancia_hora_min) start = fija
          else { start = llega; tarde = llega - fija }
        }
        const end = start + (llegadaElastica ? Math.max(0, Math.min(item.min ?? 0, toMin(item.entrada) - start)) : item.min ?? 0)
        t = end
        prev = endCoordsOf(item) ?? c ?? prev
        anterior = item
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
        if (item.sin_restaurante) return item // (la comida al llegar: sin restaurante nuestro, Tanda 7)
        const meal = item.kind === 'cena' ? 'cena' : 'comida'
        // (Una comida rápida antes de una reserva empieza pronto, pero el restaurante se mira abierto desde la hora de comer de siempre: son recomendaciones, no una mesa reservada.)
        const start = item.kind === 'comida' && item.corta ? Math.max(sim[i].t0, toMin(cfg.comida_antes_desde)) : sim[i].t0
        const original = item.restaurante_escrito ?? item.restaurante
        const candidatas = [original, item.alternativa, item.tercera, ...(item.otras ?? [])].filter(Boolean)
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

    const paseoAntesDeCenar = (lista) => {
      let out = lista
      for (const nombre of cfg.paseo_antes_de_cenar ?? []) {
        const iPaseo = out.findIndex((it) => it.kind === 'stop' && it.lugar === nombre && !it.llegada)
        const iCena = out.findIndex((it) => it.kind === 'cena')
        if (iPaseo < 0 || iCena < 0 || iPaseo === iCena - 1) continue
        // (Un traslado escrito justo delante del paseo viaja con él.)
        const desde = iPaseo > 0 && out[iPaseo - 1].kind === 'traslado' ? iPaseo - 1 : iPaseo
        const bloque = out.slice(desde, iPaseo + 1)
        const resto = out.filter((_, k) => k < desde || k > iPaseo)
        const donde = resto.findIndex((it) => it.kind === 'cena')
        out = [...resto.slice(0, donde), ...bloque, ...resto.slice(donde)]
      }
      return out
    }
    // 5.7 Lo que tiene hora fija (una reserva del viajero, el Free Tour). Tanda 6z5: la hora solo decide en qué fila de su tabla cae y, con ella, qué lista escrita se usa (listasDia.js).
    // Ese día sigue la lista tal cual, en su orden: la hora fija se queda donde la lista la pone y nada se mueve, se quita ni se avisa por ella (ni «vas justo», ni «llegas tarde»,
    // ni pasar algo detrás de la reserva, ni pasarlo a «por fuera» porque no dé tiempo). La app no sabe si el viajero anda rápido, si se para o si el metro va tarde.
    const baseSinColocar = items
    const anclar = (lista) => lista.map((it) => (it.kind === 'stop' && it.hora && !it.llegada && !it.fijo_colocado ? { ...it, fijo_colocado: true } : it))
    // (Regla 17, Tanda 6w: con una reserva del viajero el día lleva todo lo que tiene escrito. La app solo lo ordena: nada se quita, nada pasa a «Si te sobra tiempo» por el tiempo y la comida no se acorta.)
    const conReservaDelViajero = (lista) => lista.some((it) => it.kind === 'stop' && it.hora_tipo === 'reserva')

    // 5.8 Que quepa: por franja; la comida, como muy tarde a las 15:00 (regla 6).
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
    // Una reserva nunca pasa un imprescindible que se visita por dentro (la Basílica, el Foro, el Panteón…) a «por fuera» o «de camino» la primera vez: se mueve, antes o después, y solo se acortan otras cosas.
    const protegidaPorReserva = (lista, it) => it.kind === 'stop' && it.modo === 'dentro' && (nivelDe(it.lugar) ?? 3) === 1 && !it.acortable && !placeByName.get(it.lugar)?.acortable && !estado.dentro.has(it.lugar)
    const fueraMin = (item) => Math.min(item.min, fueraDelDocumento.get(item.lugar) ?? placeByName.get(item.lugar)?.minutos_fuera ?? OUTSIDE_MINUTES)
    const exceso = (lista) => {
      const sim = simular(lista)
      const comida = sim.find((it) => it.kind === 'comida')
      const cena = sim.find((it) => it.kind === 'cena')
      const manana = sim.filter((it) => it.franja === 'manana' && it.kind === 'stop')
      // (Tanda 7, VIAJES_REVISION «El día no cabe del todo: sobran 150 min»: el Free Tour de la noche tiene su hora y no se mueve ni se quita; si acaba después de la hora de cenar —el de las 19:00 o el de las 21:00—
      // eso no es tiempo que sobre de la tarde: no hay nada que quitar para arreglarlo. Se cuenta solo lo que sí se puede mover; la tarde se mide hasta su última parada que no es el tour, y la cena que va detrás
      // del tour (regla 4) cae donde acaba el tour.)
      const tarde = sim.filter((it) => it.franja === 'tarde' && it.kind === 'stop' && it.tipo !== 'tour')
      // (Un solo límite para todos los días, con o sin hora fija: la comida no empieza después de las 15:00; solo se toca si pasa de ahí.)
      const limiteComida = toMin(cfg.comida_hasta)
      const maniana = comida ? comida.llegaA - limiteComida : manana.length ? manana.at(-1).t1 - limiteComida : 0
      // La tarde acaba como tarde a la hora de la cena más el margen; si no hay cena, a esa hora.
      const finTarde = tarde.length ? tarde.at(-1).t1 : 0
      const sinCena = finTarde - tardeHasta
      const cenaTrasElTour = cena ? sim.some((it) => it.tipo === 'tour' && it.t1 > tardeHasta && sim.indexOf(it) < sim.indexOf(cena)) : false
      const conCena = cena && !cenaTrasElTour ? cena.llegaA - (tardeHasta + 30) : 0
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
      const excesoAntes = exceso(lista).manana
      if (franja === 'manana') {
        // (Pasar de por dentro a por fuera no quita nada: vale también para un imprescindible la primera vez, que se sigue viendo.)
        const diaConReserva = lista.some((it) => it.kind === 'stop' && it.hora && !it.llegada)
        const dentroAcortables = lista
          .filter((it) => it.kind === 'stop' && it.franja === franja && it.modo === 'dentro' && !esFijo(it) && !it.protegido && it.tipo !== 'desayuno' && !it.relleno_no_quitar && !(diaConReserva && protegidaPorReserva(lista, it)))
          .sort((a, b) => valorDe(a, nivelDe) - valorDe(b, nivelDe) || b.n - a.n)
        for (const item of dentroAcortables) {
          {
            const nuevo = lista.map((it) => (it.id === item.id ? { ...it, modo: 'fuera', min: fueraMin(it) } : it))
            // (Solo si de verdad adelanta la comida: acortar algo cuando después hay que esperar a una hora —una Plaza «desde las 12:30»— no sirve de nada.)
            if (reglas.nuevas(antes, baseReglas(nuevo)).length === 0 && fueraMin(item) < item.min && exceso(nuevo).manana < excesoAntes) {
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
            if (reglas.nuevas(antes, baseReglas(nuevo)).length === 0 && exceso(nuevo).manana < excesoAntes) {
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
        // (Solo se quita si de verdad ayuda: quitar algo que va antes de una hora fija, cuando después hay que esperar a ella, no adelanta nada.)
        const mejora = franja === 'manana' ? exceso(nueva).manana < exceso(lista).manana : exceso(nueva).tarde < exceso(lista).tarde
        if (!mejora) continue
        apuntarCaminos(caminos, item)
        spare.push({ ...item, franja, razon: 'cabe', spareReason: franja === 'manana' ? 'Si te da tiempo, por la mañana' : 'Si te da tiempo, por la tarde' })
        log.push({ id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'sobra', causa: franja === 'manana' ? 'no cabe en la mañana (la comida iba a caer después de las 14:30): pasa a «Si te sobra tiempo»' : 'no cabe en la tarde: pasa a «Si te sobra tiempo»' })
        return nueva
      }
      return null
    }
    // En el día de llegada con una lista escrita para la llegada (`draft.sinAjustes`) no se recorta nada por minutos (Tanda 7, punto 6: «el motor no quita ni mueve nada por minutos»). Si el viajero ha añadido algo (pool,
    // experiencias, una reserva: `protegido`), el día se ajusta como siempre: lo que no cabe pasa a «Si te sobra tiempo».
    const sinRecortar = draft.sinAjustes === true && ![...draft.trabajo.manana, ...draft.trabajo.tarde].some((s) => s.protegido === true)
    const ajustar = (lista) => {
      let out = lista
      if (conReservaDelViajero(lista) || sinRecortar) return out
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
     * Con una reserva del viajero (Tanda 6z5) el día sigue su lista escrita tal cual y el orden no cambia; desde la 6y10 (1c) también se mira el horario real de cada visita por dentro (un sitio que a su hora ya
     * habrá cerrado, o que aún no habrá abierto, no sale «por dentro» con una hora imposible). Lo que cierra ese día (regla 5) ya está resuelto al elegir la lista.
     */
    const resolverHorarios = (lista) => {
      // (Tanda 6y10, 1c: también con una reserva del viajero cada visita por dentro se mira con SU horario real de ese día: no se mueve nada ni se quita por el tiempo, pero una visita que a su hora ya habrá
      // cerrado va por fuera con su aviso, y una que aún no habrá abierto espera o, si falta mucho, va por fuera con su aviso. Lo que tiene hora fija —la reserva y el Free Tour— no se toca.)
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
        // 1. se espera si son 15 min o menos —o hasta 40 si lo de antes es una plaza o un sitio al aire libre justo al lado (la Piazza del Popolo antes de Santa Maria del Popolo)— y luego cabe entera
        const iMalo = sim.findIndex((it) => it.id === malo.id)
        const previa = [...sim.slice(0, Math.max(0, iMalo))].reverse().find((it) => it.kind === 'stop' && !it.llegada)
        const previaC = previa ? endCoordsOf(previa) : null
        const malaC = coordsOf(malo)
        const previaAlAireLibre = Boolean(previa) && (previa.modo === 'fuera' || sourceOf(previa)?.type === 'exterior') && previaC && malaC && walkLeg(previaC, malaC) <= cfg.espera_plaza_cerca_min
        const esperaMax = previaAlAireLibre ? cfg.espera_plaza_max_min : cfg.espera_max_min
        const conEspera = abre != null && abre - malo.t0 <= esperaMax && proxima && abre + (malo.min ?? 20) <= proxima.close
          ? out.map((it) => (it.id === malo.id ? { ...it, no_antes: toHHMM(abre), ...(abre - malo.t0 > cfg.espera_max_min && previa ? { espera_en: { lugar: previa.lugar, titulo: previa.titulo ?? null } } : {}), espera_abre: toHHMM(abre), espera_tras: previa ? { lugar: previa.lugar, titulo: previa.titulo ?? null } : null } : it))
          : null
        // (Tanda 6z5: esperar a que abra no se mide contra la hora de una reserva: la app no calcula si se llega tarde.)
        if (conEspera) {
          out = conEspera
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
        // (Con una reserva del viajero el día lleva todo lo que tiene escrito —regla 17—: lo que no se ve desde fuera y a su hora estará cerrado se queda donde está; la tarjeta enseña su horario real y decide el viajero.)
        const conReserva = conReservaDelViajero(out)
        if (conReserva && !esPrimeraVez(out, malo)) continue
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
        // (El turno que coge la app no pisa ni se salta una reserva del viajero —la suya manda—: de los turnos que dejan las reservas del día en el orden de la lista, sin cruzarse, el más cercano; si ninguno encaja, el más cercano.)
        const dur = duracionDe(it)
        const iEste = out.findIndex((x) => x.id === it.id)
        const ajenas = out.map((o, i) => ({ o, i })).filter(({ o }) => esReservaFija(o))
        const margenDe = (o) => (sitiosGrandes.has(o.lugar) && o.hora_tipo === 'reserva' ? cfg.llegada.reserva : cfg.llegada.turno)
        const libres = horas.filter((t) => ajenas.every(({ o, i }) => (i < iEste ? t - cfg.llegada.turno >= toMin(o.hora) + duracionDe(o) + cfg.entre_reservas_min : t + dur + cfg.entre_reservas_min <= toMin(o.hora) - margenDe(o))))
        const elegido = (libres.length ? libres : horas).reduce((mejor, t) => (Math.abs(t - natural) < Math.abs(mejor - natural) ? t : mejor))
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

    /**
     * 5.7b La comida, la cena y la reserva (Tanda 6y8, decidido por Eric el 12-oct-2026; vale para todos los destinos y sale de los datos, no de nombres):
     *   · LA COMIDA va antes de la reserva si al salir de ella ya son más de las 14:30 (hora de la reserva + lo que dura la visita en los datos del sitio); si sale a las 14:30 o antes, va después.
     *   · LA CENA, igual con las 22:00 (6y9: antes 21:00; en Roma se cena bien hasta tarde); y nunca empieza después de las 22:30.
     *   · La entrada NUNCA sale tarde: si la mesa va antes y la normal haría llegar tarde, se cuenta corta (solo ponemos la parada: cuánto tarda en comer lo decide el viajero); si aun así llega
     *     tarde, lo que va justo antes de la reserva pasa detrás de ella (en su orden; nada se quita) o, si detrás ya es de noche, a «Si te sobra tiempo»; y si la reserva es antes de que empiece el día,
     *     el día empieza antes. Una sola regla: el documento solo escribe qué paradas lleva cada hora; dónde cae la mesa lo decide esto.
     * Cuenta como reserva la que PUSO el viajero (o el Free Tour que reservó) y, desde la 6y9 (P5, Eric), también el turno real que la app coge de la Galería sin reserva (`turno_real`): su comida va siempre según a qué hora sale.
     */
    const esReservaFija = (it) => it.kind === 'stop' && !it.llegada && Boolean(it.hora) && (Boolean(it.hora_tipo) || it.tipo === 'tour')
    const duracionDe = (it) => {
      const d = sourceOf(it)?.duration_minutes
      return Number.isFinite(d) && d > 0 ? d : it.min ?? 0
    }
    const salidaDe = (it) => toMin(it.hora) + duracionDe(it)
    /** Dónde empieza la reserva en la lista: su «Llegada a…» y, delante, el traslado que lleva hasta ella. */
    const inicioGrupo = (lista, i) => {
      let g = i
      if (lista[g - 1]?.llegada && lista[g - 1].de === lista[i].id) g--
      if (lista[g - 1]?.kind === 'traslado') g--
      return g
    }
    const MESAS = [
      { kind: 'comida', opcion: 'comida', sale: 'comida_antes_si_sale_despues_de', rapidaMin: 'comida_rapida_min', rapidaDesde: 'comida_rapida_desde' },
      { kind: 'cena', opcion: 'cena', sale: 'cena_antes_si_sale_despues_de', rapidaMin: 'cena_rapida_min', rapidaDesde: 'cena_rapida_desde' },
    ]
    /** Desde qué hora puede empezar la mesa corta de antes de esta reserva: la comida, nunca antes de las 12:00 salvo ante una reserva a mediodía (`comida_rapida_excepcion`); la cena, desde su hora. */
    const mesaCorta = (mesa, reserva) => {
      if (mesa.kind === 'comida' && enVentanaDeComida(reserva?.hora)) return { piso: toMin(cfg.comida_rapida_excepcion.desde), min: cfg.comida_rapida_excepcion.min ?? cfg[mesa.rapidaMin] }
      return { piso: toMin(cfg[mesa.rapidaDesde]), min: cfg[mesa.rapidaMin] }
    }
    /** ¿Cabe la mesa (rápida) antes de la «Llegada a…» de esta reserva? Lo que dura la mesa rápida, desde su hora más temprana, más lo que se tarda en llegar. */
    const cabeLaMesaAntes = (lista, i, mesa) => {
      const g = inicioGrupo(lista, i)
      // (Ante una reserva de la ventana de la comida corta, la comida hace de «Llegada a…»: cuenta hasta la hora de la reserva, no hasta su llegada.)
      const hora = mesa.kind === 'comida' && enVentanaDeComida(lista[i].hora) ? lista[i].hora : lista[g].hora ?? lista[g + 1]?.hora ?? lista[i].hora
      const corta = mesaCorta(mesa, lista[i])
      return toMin(hora) >= corta.piso + corta.min + cfg.comida_junto_min
    }
    /**
     * La comida y la cena en el lado de la reserva que toca. Solo mueve la mesa, y solo si está del lado contrario. `opciones.comida` / `opciones.cena`: false = esa mesa no se pone antes de ninguna
     * reserva (la salida de emergencia cuando ponerla antes haría llegar tarde: la entrada nunca sale tarde).
     */
    const colocarMesas = (lista, opciones = {}) => {
      let out = lista
      for (const mesa of MESAS) {
        const iMesa = out.findIndex((it) => it.kind === mesa.kind)
        if (iMesa < 0) continue
        if (out[iMesa].sin_restaurante) continue // (la comida al llegar va ANTES de la primera parada y no se mueve nunca, Tanda 7)
        const limite = toMin(cfg[mesa.sale])
        const fijas = out.map((it, i) => ({ it, i })).filter(({ it }) => esReservaFija(it))
        const debeAntes = ({ it, i }) => opciones[mesa.opcion] !== false && salidaDe(it) > limite && cabeLaMesaAntes(out, i, mesa)
        // La mesa está detrás de una reserva que sale tarde: va antes de ella (con su llegada).
        const detras = fijas.find((f) => f.i < iMesa && debeAntes(f))
        if (detras) {
          const g = inicioGrupo(out, detras.i)
          const sin = out.filter((_, k) => k !== iMesa)
          out = [...sin.slice(0, g), out[iMesa], ...sin.slice(g)]
          continue
        }
        // La mesa está delante de una reserva que sale pronto (o de una a la que no se puede ir con la mesa hecha): va después de ella.
        const delante = fijas.filter((f) => f.i > iMesa && !debeAntes(f)).at(-1)
        if (delante) {
          const sin = out.filter((_, k) => k !== iMesa)
          out = [...sin.slice(0, delante.i), out[iMesa], ...sin.slice(delante.i)]
        }
      }
      return out
    }
    /** Cuánto llega tarde cada reserva (suma de minutos) con la hora de la mesa tal cual está. */
    const retrasoDe = (lista) => simular(lista).reduce((total, it) => total + (it.tarde > 0 && esReservaFija(it) ? it.tarde : 0), 0)
    /**
     * Que ninguna reserva salga tarde (ver arriba). Cada reserva se prueba por separado: si con todo lo que se puede pasar detrás de ella sigue tarde, se deja como estaba (no se desmonta el día
     * por unos minutos que no se arreglan así) y queda apuntado.
     */
    const acomodarReservas = (lista) => {
      let out = lista
      const imposibles = new Set()
      /** Lo que va justo antes de la reserva (entre la reserva anterior y esta), la última parada, pasa detrás de ella. Devuelve la lista nueva y qué se hizo, o null si no queda nada que pasar. */
      const pasarDetras = (base, idR) => {
        const iR = base.findIndex((it) => it.id === idR)
        const R = base[iR]
        const g = inicioGrupo(base, iR)
        let c = -1
        for (let k = g - 1; k >= 0; k--) {
          const it = base[k]
          if (it.hora || it.llegada || it.tipo === 'tour') break
          if (it.kind === 'stop' && it.tipo !== 'desayuno') { c = k; break }
        }
        if (c < 0) return null
        const mover = base[c - 1]?.kind === 'traslado' ? [base[c - 1], base[c]] : [base[c]]
        const resto = base.filter((it) => !mover.includes(it))
        const iRn = resto.findIndex((it) => it.id === R.id)
        const item = base[c]
        return { lista: [...resto.slice(0, iRn + 1), ...mover.map((it) => (it.kind === 'stop' ? { ...it, franja: R.franja } : it)), ...resto.slice(iRn + 1)], sobra: null, nota: { id: item.id, lugar: item.titulo ?? item.lugar, sitio: item.lugar, que: 'orden', causa: `no cabe antes de ${R.lugar} (a las ${R.hora}): pasa detrás de la reserva, en su orden` } }
      }
      for (let guard = 0; guard < 40; guard++) {
        const sim = simular(out)
        const tardeEn = sim.findIndex((it) => it.tarde > 0 && (esReservaFija(it) || (it.llegada && esReservaFija(out.find((o) => o.id === it.de) ?? {}))) && !imposibles.has(it.llegada ? it.de : it.id))
        if (tardeEn < 0) break
        const late = sim[tardeEn]
        const idR = late.llegada ? late.de : late.id
        const inicio0 = startPoint.t
        let intento = out
        const tardeDe = (l) => simular(l).find((it) => it.id === idR)?.tarde ?? 0
        const tarde0 = tardeDe(intento)
        // Cada paso tiene que acercar la reserva a su hora; si no adelanta nada, se deja (y se queda lo que ya adelantó).
        for (let paso = 0; paso < 60; paso++) {
          const iR = intento.findIndex((it) => it.id === idR)
          const R = intento[iR]
          const g = inicioGrupo(intento, iR)
          const ahora = tardeDe(intento)
          if (ahora <= 0) break
          // 1. La mesa de antes de la reserva se cuenta corta.
          const iMesa = intento.slice(0, g).findLastIndex((it) => (it.kind === 'comida' || it.kind === 'cena') && !it.corta)
          if (iMesa >= 0) {
            const mesa = intento[iMesa]
            const conf = MESAS.find((m) => m.kind === mesa.kind)
            const corta = intento.map((it, k) => (k === iMesa ? { ...it, corta: true, min: Math.min(it.min ?? 999, mesaCorta(conf, R).min), piso: mesaCorta(conf, R).piso } : it))
            if (tardeDe(corta) < ahora) {
              log.push({ id: mesa.id, lugar: mesa.restaurante, sitio: null, que: 'mesa_corta', causa: `${mesa.kind === 'cena' ? 'la cena' : 'la comida'} va antes de ${R.lugar} (a las ${R.hora}) y la normal haría llegar tarde: se cuenta corta` })
              intento = corta
              continue
            }
          }
          // 2. Lo que va justo antes de la reserva pasa detrás de ella, en su orden: se prueba pasar una, dos, tres… y se queda lo que más adelanta (a veces una sola parada de camino no adelanta, pero con la siguiente sí).
          const pasos = []
          let cur = intento
          let mejorN = 0
          let mejorT = ahora
          for (let n = 0; n < 14; n++) {
            const r = pasarDetras(cur, idR)
            if (!r) break
            pasos.push(r)
            cur = r.lista
            const t = tardeDe(cur)
            if (t < mejorT) { mejorT = t; mejorN = pasos.length }
            if (t <= 0) break
          }
          if (mejorN > 0) {
            for (const r of pasos.slice(0, mejorN)) {
              if (r.sobra) {
                apuntarCaminos(r.sobra.caminos, r.sobra.item)
                spare.push({ ...r.sobra.item, razon: 'reserva', spareReason: 'Para otro momento' })
              }
              log.push(r.nota)
            }
            intento = pasos[mejorN - 1].lista
            continue
          }
          // 3. Nada que pasar detrás que adelante y es la primera hora fija del día: el día empieza antes (a su «Llegada a…»).
          if (!intento.slice(0, g).some((it) => it.hora)) {
            startPoint.t = Math.max(0, startPoint.t - Math.ceil(ahora / 5) * 5)
            log.push({ id: R.id, lugar: R.titulo ?? R.lugar, sitio: R.lugar, que: 'hora', causa: `${R.lugar} es a las ${R.hora}: el día empieza antes (a las ${toHHMM(startPoint.t)}) para llegar a tiempo` })
            continue
          }
          break
        }
        const tarde1 = tardeDe(intento)
        if (tarde1 < tarde0) out = intento
        else startPoint.t = inicio0
        if (tarde1 > 0) {
          imposibles.add(idR)
          const R = out.find((it) => it.id === idR)
          log.push({ id: R.id, lugar: R.titulo ?? R.lugar, sitio: R.lugar, que: 'aviso', causa: `${R.lugar} a las ${R.hora} llega ${tarde1} min tarde y no hay forma de evitarlo sin desmontar el día` })
        }
      }
      return out
    }
    /** Lo que pasó detrás de una reserva puede dejar la comida pasadas las 15:00: va justo detrás de esa reserva (que sale pronto), siempre que no haga llegar tarde a otra. */
    const comidaPronto = (lista) => {
      const iC = lista.findIndex((it) => it.kind === 'comida')
      const comida = iC >= 0 ? simular(lista).find((it) => it.kind === 'comida') : null
      if (!comida || comida.t0 <= toMin(cfg.comida_hasta)) return lista
      const ultima = lista.map((it, i) => ({ it, i })).filter(({ it, i }) => i < iC && esReservaFija(it) && salidaDe(it) <= toMin(cfg.comida_antes_si_sale_despues_de)).at(-1)
      if (!ultima || ultima.i === iC - 1) return lista
      const sin = lista.filter((_, k) => k !== iC)
      const nueva = [...sin.slice(0, ultima.i + 1), lista[iC], ...sin.slice(ultima.i + 1)]
      return retrasoDe(nueva) <= retrasoDe(lista) ? nueva : lista
    }
    /** Cuánto se pasa la cena de su hora tope (para elegir entre las opciones de abajo). */
    const cenaTardia = (lista) => Math.max(0, (simular(lista).find((it) => it.kind === 'cena')?.t0 ?? 0) - toMin(cfg.cena_hasta))
    /**
     * Cuánto se pasa la comida de su hora tope (15:00). Solo en el día de llegada (`draft.diaLlegada`; sus listas escritas no se recortan por minutos): ahí una comida detrás de una reserva de la noche
     * no es una opción (la comida se quedaba al final del día). En los demás días no cuenta, como siempre: la entrada nunca sale tarde (6y8).
     */
    const comidaTardia = (lista) => { if (!draft.diaLlegada) return 0; const c = simular(lista).find((it) => it.kind === 'comida'); return c ? Math.max(0, c.t0 - toMin(cfg.comida_hasta)) : 0 }
    const mesasYReservas = (lista) => {
      // (Regla 17: con DOS horas fijas del viajero el mismo día no se mueve ni se quita nada por la comida o la cena: manda la lista escrita, como antes de la 6y8.)
      if (lista.filter((it) => it.kind === 'stop' && !it.llegada && it.hora && !it.turno_real && (it.hora_tipo || it.tipo === 'tour')).length >= 2) return lista
      // (El turno real que coge la app cuenta siempre como hora fija —6y9, P5—, haya o no otra reserva ese día; la regla 17 de arriba solo cuenta las del viajero.)
      // Una reserva antes de la hora de empezar: el día empieza antes (a su «Llegada a…»).
      const fijosHora = lista.filter((it) => it.hora && ((it.llegada && esReservaFija(lista.find((o) => o.id === it.de) ?? {})) || esReservaFija(it))).map((it) => toMin(it.hora))
      const inicioBase = Math.min(empiezaMin, ...fijosHora)
      // Primero la regla tal cual (la comida y la cena antes si la reserva sale tarde). Si con eso alguna reserva llega tarde, se prueba sin la mesa de antes —la entrada nunca sale tarde— y se queda lo mejor.
      let mejor = null
      let probada = 0
      for (const opciones of [{}, { comida: false }, { cena: false }, { comida: false, cena: false }]) {
        startPoint.t = inicioBase
        const l0 = log.length
        const s0 = spare.length
        const out = comidaPronto(acomodarReservas(colocarMesas(lista, opciones)))
        const puntos = retrasoDe(out) + cenaTardia(out) + comidaTardia(out)
        const nuevoLog = log.slice(l0)
        const nuevaSpare = spare.slice(s0)
        log.length = l0
        spare.length = s0
        if (!mejor || puntos < mejor.puntos) mejor = { out, puntos, nuevoLog, nuevaSpare, opcion: probada, inicio: startPoint.t }
        probada++
        if (puntos === 0) break
      }
      // (Solo se apunta lo que de verdad cambió: la mesa que la regla pondría antes de una reserva y aquí va después.)
      if (mejor.opcion > 0) {
        const regla = colocarMesas(lista, {})
        const sinAntes = [mejor.opcion === 1 || mejor.opcion === 3 ? 'comida' : null, mejor.opcion === 2 || mejor.opcion === 3 ? 'cena' : null].filter(Boolean)
        const cambiadas = sinAntes.filter((kind) => {
          const m = MESAS.find((x) => x.kind === kind)
          const iM = regla.findIndex((it) => it.kind === kind)
          return iM >= 0 && regla.some((it, i) => i > iM && esReservaFija(it) && salidaDe(it) > toMin(cfg[m.sale]))
        })
        if (cambiadas.length) log.push({ id: null, lugar: null, sitio: null, que: 'aviso', causa: `${cambiadas.map((k) => (k === 'cena' ? 'la cena' : 'la comida')).join(' y ')} no puede ir antes de la reserva sin hacerla llegar tarde: va después` })
      }
      startPoint.t = mejor.inicio
      log.push(...mejor.nuevoLog)
      spare.push(...mejor.nuevaSpare)
      return mejor.out
    }

    // El orden: el día tal cual → fijas a su hora → horarios de llegada → restaurantes → que quepa (con las mesas elegidas) → mesas otra vez con las horas hechas.
    items = elegirMesas(items)
    items = turnosReales(items)
    items = anclar(items)
    items = mesasYReservas(items)
    // El paseo que el destino pone siempre antes de cenar (en Roma, el Paseo por Trastevere, regla 10) va justo antes de la cena, vaya donde vaya lo demás (Tanda 6x).
    items = paseoAntesDeCenar(items)
    items = resolverHorarios(items)
    items = ajustar(items)
    items = elegirMesas(items)
    items = ajustar(items)
    items = horariosCoherentes(items)
    items = elegirMesas(items)
    items = horariosCoherentes(items)
    // «De camino» (Tanda 6f, 4i): nunca es un sitio que ese día ya sale como parada (ese rato es el trayecto), y un día nunca empieza con una tarjeta de «de camino».
    const limpiarCaminos = () => {
      items = items.filter((it) => {
        if (it.kind !== 'stop' || it.modo !== 'camino' || it.llegada || it.tipo === 'tour') return true
        const repetido = items.some((o) => o !== it && o.kind === 'stop' && !o.llegada && o.modo !== 'camino' && o.lugar === it.lugar)
        if (repetido) log.push({ id: it.id, lugar: it.titulo ?? it.lugar, sitio: it.lugar, que: 'quitada', causa: 'ya sale ese día como parada: ese rato es el trayecto' })
        return !repetido
      })
      {
        const primera = items.findIndex((it) => !(it.kind === 'traslado' || (it.kind === 'stop' && it.modo === 'camino' && !it.llegada)))
        const sobran = items.slice(0, primera < 0 ? 0 : primera).filter((it) => it.kind === 'stop' && it.modo === 'camino')
        for (const it of sobran) log.push({ id: it.id, lugar: it.titulo ?? it.lugar, sitio: it.lugar, que: 'quitada', causa: 'el día no empieza con un «de camino»: ese rato es el trayecto hasta la primera parada' })
        if (primera > 0) items = items.slice(primera)
      }
    }
    // (Quitar un «de camino» adelanta lo que viene detrás: las horas y los avisos de apertura se rehacen con las horas nuevas, hasta que no se quite nada más.)
    for (let vuelta = 0; vuelta < 4; vuelta++) {
      const antes = items.length
      limpiarCaminos()
      if (items.length === antes) break
      items = horariosCoherentes(items)
    }
    // Lo de camino que ya fue parada otro día del viaje lleva «Ya lo visitaste el día n».
    items = items.map((it) => (it.kind === 'stop' && it.modo === 'camino' && !it.llegada && estado.visitadoEn.has(it.lugar) ? { ...it, visitado_dia: estado.visitadoEn.get(it.lugar) } : it))
    // (Lo último que cambia horas —los horarios de apertura, los restaurantes— ya está hecho: la reserva no puede haber quedado tarde.)
    items = mesasYReservas(items)
    // (Mover una mesa cambia las horas de lo que viene detrás: los avisos de apertura se rehacen con las horas de verdad, también en un día con reserva —Tanda 6y10, 1c—.)
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

    // Lo que cierra y nunca se quita vuelve a su puesto (después de lo que iba delante), sin ocupar tiempo: «Cerrado este día» (5.2b).
    for (const { item, antes } of cerradosEseDia) {
      const idPrevio = antes.find((id) => final.some((it) => it.id === id))
      const at = idPrevio ? final.findIndex((it) => it.id === idPrevio) + 1 : 0
      // (Al principio del día, la marca va a la hora de empezar el día —la versión «sin él» puede dejar la mañana vacía: un miércoles, la Plaza y la Basílica van después de comer—.)
      const t = at > 0 ? final[at - 1].t1 : Math.min(startPoint.t, final.find((it) => it.kind === 'stop')?.t0 ?? startPoint.t)
      final = [...final.slice(0, at), { ...item, kind: 'stop', modo: 'fuera', min: 0, hora: undefined, hora_tipo: undefined, cerrado_este_dia: true, motivo_fuera: CERRADO_ESTE_DIA, t0: t, t1: t, leg: 0, llegaA: t, tarde: 0 }, ...final.slice(at)]
    }

    // 5.9 (antes, porque HOY mira la noche del día) Nocturnas (regla 12): la escrita; si ya salió, la imprescindible que falte; si no, la más cercana a la cena que no haya salido.
    const noches = nochesDelDia(draft, final, hours, fecha)

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
      // El hueco antes de una entrada: si lo siguiente que le queda es la «Llegada a…» de una reserva y sobran más de 30 min, HOY lo dice («Tienes 50 min antes de tu entrada») y sugiere algo cercano.
      const siguienteReal = sim.find((it) => it.kind !== 'traslado')
      const esperaEscrita = siguienteReal && siguienteReal.kind === 'stop' && !siguienteReal.llegada && siguienteReal.no_antes && !siguienteReal.espera_abre
      const huecoReserva = siguienteReal && siguienteReal.kind === 'stop' && (siguienteReal.llegada || esperaEscrita) ? siguienteReal.t0 - ahora : 0
      const estadoTiempo = huecoReserva > cfg.hueco_reserva_min ? 'hueco' : holgura > cfg.vas_bien_min ? 'bien' : holgura < 0 ? 'justo' : 'normal'
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
      if (estadoTiempo === 'bien' || estadoTiempo === 'hueco') {
        const hueco = estadoTiempo === 'hueco'
        const espacio = hueco ? huecoReserva : holgura
        const vistosHoy = new Set(marcada.filter((it) => it.kind === 'stop').map((it) => it.lugar))
        const hechasHoy = marcada.filter((it) => it.hecho).map((it) => it.lugar)
        // Nada que ya salga en el viaje (ni otro día, antes o después, ni en la noche de este mismo día).
        const deNoche = new Set()
        for (const n of noches) {
          deNoche.add(n.noche.replace(/ \(noche\)$/, '').replace(/ de noche$/, ''))
          for (const lugar of catalogueByName.get(n.noche)?.conflicts_with ?? []) deNoche.add(lugar)
        }
        const yaSale = (nombre) => lugaresDelViaje.has(nombre) || deNoche.has(nombre)
        const salida = []
        // Cuánto de lejos puede estar: en mitad de una franja y antes de comer, lo cercano (5-10 min andando); lo lejano solo antes de cenar con 1 h 30 o más de sobra (hasta 20 min andando o 15 en bus o metro).
        const antesDeMesa = quedan.length === 0
        const tipoMesa = franjaActual === 'manana' ? 'comida' : 'cena'
        const lejos = !hueco && antesDeMesa && tipoMesa === 'cena' && holgura >= cfg.sugerencia_lejos_min
        const enTransporte = (a, b) => 6 + Math.round((meters(a, b) * 1.3) / 330)
        const mesa = marcada.find((it) => !it.hecho && it.kind === tipoMesa)
        const mesaDeAhora = mesa ? sim.find((it) => it.id === mesa.id) : null
        // Antes de comer: lo que se sugiere tiene que quedar cerca de donde empieza la tarde (si no, la tarde vuelve sobre sus pasos).
        const inicioTarde = !hueco && antesDeMesa && tipoMesa === 'comida' ? coordsOf(resto.find((it) => it.kind === 'stop' && it.franja === 'tarde' && !it.llegada) ?? {}) : null
        const llegadaC = hueco ? coordsOf(siguienteReal) : null
        const siguienteLugar = hueco ? (siguienteReal.llegada ? siguienteReal.lugar : siguienteReal.lugar) : null
        const usadas = new Set([...estado.mesas, ...restaurantesDocumento])
        for (const it of marcada) if (it.kind === 'comida' || it.kind === 'cena') usadas.delete(it.restaurante)
        // 1º, lo de «Si te sobra tiempo» de ese día
        if (!hueco) for (const sp of spare) salida.push({ item: { ...sp, kind: 'stop' }, nota: null })
        // 2º, lo que el documento sugiere para este día (salvo que el viaje lleve ya ese sitio)
        const escritas = (written.days[draft.id]?.sugerencias ?? []).flatMap((sg) => (sg.lugares ? sg.lugares.map((lugar) => ({ ...sg, lugar })) : [sg]))
        for (const sg of escritas) {
          const place = placeByName.get(sg.lugar)
          if (!place || salida.some((x) => x.item.lugar === sg.lugar) || vistosHoy.has(sg.lugar) || hechasHoy.includes(sg.lugar) || estado.vistos.has(sg.lugar) || yaSale(sg.lugar)) continue
          // (La del hueco antes de una entrada solo cuando esa entrada es la suya; las demás, no.)
          if (sg.antes_de ? !hueco || siguienteLugar !== sg.antes_de : hueco) continue
          if (sg.salvo_dia && drafts.some((d) => d !== draft && d.id === sg.salvo_dia)) continue
          const aqui = posActual && place.coordinates ? walkLeg(posActual, place.coordinates) : 0
          const minutos = Math.min(sg.min ?? place.minutos_fuera ?? place.duration_minutes ?? 60, 60)
          const vuelta = hueco && llegadaC ? walkLeg(place.coordinates, llegadaC) : 0
          if (aqui + minutos + vuelta > espacio + 5 || closedThatDay(place.name, skeletonDay) || (place.type === 'interior' && openCheck(place, ahora + aqui, minutos, hours).ok !== true)) continue
          salida.push({ item: { kind: 'stop', tipo: 'parada', lugar: place.name, titulo: sg.titulo ?? undefined, modo: place.type === 'interior' && place.minutos_fuera != null && minutos <= place.minutos_fuera ? 'fuera' : null, min: minutos, franja: franjaActual, id: idDe({ tipo: 'parada', lugar: place.name }) }, nota: null })
        }
        // 3º, sitios CONOCIDOS de todo el destino (no solo de los días del viaje), abiertos y con tiempo de verlos
        const puntos = [posActual, ...quedan.map((it) => coordsOf(it))].filter(Boolean)
        const candidatos = (destData.places ?? [])
          .filter((place) => !vistosHoy.has(place.name) && !hechasHoy.includes(place.name) && !estado.vistos.has(place.name) && !yaSale(place.name) && !spare.some((x) => x.lugar === place.name) && Array.isArray(place.coordinates) && !place.capa_de && !(place.tags ?? []).includes('mercadillo_navideno') && !place.available && place.level !== undefined && esConocido(place))
          .map((place) => {
            const aqui = posActual ? walkLeg(posActual, place.coordinates) : 99
            const cercaDeLoQueQueda = Math.min(99, ...puntos.map((c) => walkLeg(c, place.coordinates)).filter((m) => m <= cfg.sugerencia_cerca_min))
            // (En el hueco antes de una entrada solo vale lo cercano a donde está Y a la entrada; antes de comer, lo cercano a donde empieza la tarde.)
            const cerca = hueco ? (aqui <= cfg.sugerencia_cerca_min && llegadaC && walkLeg(place.coordinates, llegadaC) <= cfg.sugerencia_cerca_min ? aqui : 99) : Math.min(aqui <= cfg.sugerencia_cerca_min ? aqui : 99, cercaDeLoQueQueda)
            const cercaDeLaTarde = !inicioTarde || walkLeg(place.coordinates, inicioTarde) <= cfg.sugerencia_cerca_min
            const viaje = posActual ? (aqui <= cfg.sugerencia_lejos_andar_min ? aqui : enTransporte(posActual, place.coordinates) <= cfg.sugerencia_lejos_transporte_min ? enTransporte(posActual, place.coordinates) : 99) : 99
            return { place, aqui, cerca: cercaDeLaTarde ? cerca : 99, viaje }
          })
          .filter(({ place, cerca, viaje }) => (cerca < 99 || (lejos && viaje < 99)) && !closedThatDay(place.name, skeletonDay))
          .sort((a, b) => (a.place.level ?? 3) - (b.place.level ?? 3) || Math.min(a.cerca, a.viaje) - Math.min(b.cerca, b.viaje))
        for (const { place, aqui, cerca, viaje } of candidatos) {
          if (salida.length >= 6) break
          const esLejos = cerca >= 99
          const minutos = Math.min(place.minutos_fuera ?? place.duration_minutes ?? 20, 30)
          const trayecto = esLejos ? viaje : aqui
          const llega = ahora + (posActual ? trayecto : 0)
          // abierto a la hora a la que llegaría y con tiempo de verlo antes de que cierre
          if (place.type === 'interior' && openCheck(place, llega, minutos, hours).ok !== true) continue
          if (hueco && trayecto + minutos + walkLeg(place.coordinates, llegadaC) > espacio + 5) continue
          const item = { kind: 'stop', tipo: 'parada', lugar: place.name, modo: place.type === 'interior' && place.minutos_fuera != null ? 'fuera' : null, min: minutos, franja: franjaActual, id: idDe({ tipo: 'parada', lugar: place.name }) }
          // con las comprobaciones de siempre (sin zigzag, nada repetido…)
          const iPos = marcada.findIndex((it) => !it.hecho)
          const probando = [...marcada.slice(0, iPos < 0 ? marcada.length : iPos), item, ...marcada.slice(iPos < 0 ? marcada.length : iPos)]
          if (reglas.nuevas(baseReglas(marcada), reglas.todas(probando, { vistosAntes: estado.vistos, dentroAntes: estado.dentro })).length > 0) continue
          let nota = null
          let cambioMesa = null
          if (esLejos) {
            // Si lo que se propone queda lejos, la cena se cambia a esa zona: un restaurante de verdad, abierto y que no salga ya en el viaje.
            if (!mesa || !mesaDeAhora) continue
            const buena = (destData.restaurants ?? [])
              .filter((r) => recambio.tipos.includes(r.tipo_local) && !usadas.has(r.name) && restaurantCoords(r.name) && abiertoA(r.name, tipoMesa, Math.max(mesaDeAhora.t0, llega + minutos)))
              .map((r) => ({ r, andar: walkLeg(place.coordinates, restaurantCoords(r.name)) }))
              .filter((x) => x.andar <= cfg.comida_junto_min)
              .sort((a, b) => a.andar - b.andar || a.r.name.localeCompare(b.r.name, 'es'))[0]
            if (!buena) continue
            // tiempo: ir, verlo y llegar al restaurante antes de la hora de la mesa
            if (llega + minutos + buena.andar > Math.max(mesaDeAhora.t0, finFranja) + 15) continue
            const coordsRest = restaurantCoords(buena.r.name)
            // La noche del día tiene que seguir cerca de la nueva cena (taxi de 15 min o menos); si no, va la nocturna más cercana a la nueva cena que no haya salido.
            const nochesNuevas = nochesDelDia(draft, final, hours, fecha, { origenC: coordsRest, sinLog: true })
            const mismas = nochesNuevas.map((n) => n.noche).join('|') === noches.map((n) => n.noche).join('|')
            cambioMesa = { comida: false, restaurante: buena.r.name, zona: buena.r.zone ?? null, coordenadas: coordsRest, noches: mismas ? [] : nochesNuevas.map((n) => ({ ...catalogueByName.get(n.noche), fixedStart: n.t0, fixedMinutes: n.min, wholeWalk: true })).filter((e) => e.name) }
            nota = [`Y cenas en ${buena.r.zone ?? buena.r.name}`, mismas ? null : `y después, ${nochesNuevas.map((n) => (written.destino?.noche_frases ?? {})[n.noche] ?? n.noche.replace(/ \(noche\)$/, '')).join(' y ')}`].filter(Boolean).join(' ')
          } else if (trayecto + minutos > espacio + 5) continue
          salida.push({ item, nota, cambioMesa })
        }
        sugerencias = salida
      }
      comprobacionTiempo = { estado: estadoTiempo, huecoDe: estadoTiempo === 'hueco' ? { nombre: siguienteReal.titulo ?? siguienteReal.lugar, entrada: Boolean(siguienteReal.llegada) } : null, holgura: estadoTiempo === 'hueco' ? huecoReserva : holgura, antesDeComer: quedan.length === 0 && estadoTiempo !== 'hueco', franja: franjaActual, drop, sugerencias }
    }

    // 5.9 Nocturnas (regla 12): la escrita; si ya salió, la imprescindible que falte; si no, la más cercana a la cena que no haya salido.
    const escritoNights = noches.map((nocheItem) => ({ ...catalogueByName.get(nocheItem.noche), fixedStart: nocheItem.t0, fixedMinutes: nocheItem.min, wholeWalk: true })).filter((e) => e.name)

    // 5.10 Lo que cuenta como visto para los días que vienen.
    for (const item of final) {
      if ((item.kind === 'comida' || item.kind === 'cena') && item.restaurante) estado.mesas.add(item.restaurante)
      if (item.kind !== 'stop' || item.llegada) continue
      // (Lo que cierra y se queda como «Cerrado este día» no se ha visto: no cuenta como visto ni por dentro, pero tampoco es un imprescindible que se quede fuera sin explicar.)
      if (item.cerrado_este_dia) { estado.cerrados.add(item.lugar); continue }
      estado.vistos.add(item.lugar)
      if (item.modo !== 'camino' && !estado.visitadoEn.has(item.lugar)) estado.visitadoEn.set(item.lugar, dayNumber)
      if (item.modo === 'dentro') estado.dentro.add(item.lugar)
    }
    for (const nocheItem of noches) estado.noches.add(nocheItem.noche)

    draft.ordenBase = ordenBase
    return construirSalida(draft, skeletonDay, final, spare, quitadas, escritoNights, hours, fecha, dateIso, comprobacionTiempo)
  }

  // ── Nocturnas ───────────────────────────────────────────────────────────────────────────────────────────────────
  const NOCHE_MIN = { 'Fontana de Trevi (noche)': 20, 'Plaza de España (noche)': 20, 'Coliseo (noche)': 20, 'Piazza Navona (noche)': 30, 'Trastevere de noche': 30, 'Panteón (noche)': 30, 'Foro Romano desde el Campidoglio (noche)': 30, "El Puente y el Castillo de Sant'Angelo (noche)": 30 }
  const imprescindiblesNoche = destData.destination_config?.noches_imprescindibles?.lista ?? []
  function nochesDelDia(draft, final, hours, fecha, opts = {}) {
    const nocheDef = draft.trabajo.noche
    if (!nocheDef || draft.sinNocheVuelta) return []
    // (opts.origenC: dónde se ha cambiado la cena; opts.sinLog: es una prueba para una sugerencia de HOY, no deja nada en el registro.)
    const log = opts.sinLog ? [] : draft.log
    const cena = [...final].reverse().find((it) => it.kind === 'cena')
    const ultimo = [...final].reverse().find((it) => it.kind !== 'traslado' && it.kind !== 'noche')
    const origen = cena ?? ultimo
    const origenC = opts.origenC ?? (origen ? endCoordsOf(origen) : null)
    // Todo lo visto ese día, de cualquier forma (por dentro, por fuera, de camino, «sin gente»): una nocturna no puede ser un sitio de esos en un viaje de 2,5 días o más (regla 11c).
    const vistoHoy = new Set(final.filter((it) => it.kind === 'stop' && !it.llegada && !it.no_quita_noche).flatMap((it) => [it.lugar, it.titulo].filter(Boolean)))
    const especial = destData.destination_config?.noche_especial?.[String(fecha ?? '').slice(5)] ?? null
    const usadasHoy = new Set()
    const larga = cityDays.length >= 3
    const sitioDeLaNoche = (name) => [name.replace(/ \(noche\)$/, '').replace(/ de noche$/, ''), ...(catalogueByName.get(name)?.conflicts_with ?? [])]
    const vale = (name) => {
      const entrada = catalogueByName.get(name)
      if (!entrada || estado.noches.has(name) || usadasHoy.has(name)) return false
      // (Viajes de 2 días o menos: sí se puede repetir de noche lo visto ese día, hay poco tiempo. De 2,5 días o más, no.)
      return !larga || !sitioDeLaNoche(name).some((lugar) => vistoHoy.has(lugar))
    }
    const distancia = (name) => (origenC && catalogueByName.get(name)?.coordinates ? meters(origenC, catalogueByName.get(name).coordinates) : 0)
    const cercaDeLaCena = (name) => {
      const c = catalogueByName.get(name)?.coordinates
      if (!origenC || !c) return true
      return meters(origenC, c) <= (destData.destination_config?.alcance?.taxi_desde_m ?? 1500) || transitMin(origenC, c, 'taxi') <= cfg.taxi_max_min
    }
    // Las parejas (regla 13): una noche lleva una pareja, o solo una de las dos; nunca se mezclan y entre las dos no hay más de 15 min andando.
    const parejas = (written.destino?.noches_parejas ?? []).map((pareja) => pareja.filter((name) => NOCHE_MIN[name]))
    const parejaDe = (name) => parejas.find((pareja) => pareja.includes(name)) ?? (NOCHE_MIN[name] ? [name] : [])
    const miembros = (pareja) => {
      const buenos = pareja.filter(vale)
      if (buenos.length >= 2) {
        const a = catalogueByName.get(buenos[0])?.coordinates
        const b = catalogueByName.get(buenos[1])?.coordinates
        if (a && b && walkLeg(a, b) > 15) return [buenos[0]]
      }
      return buenos
    }
    const todasLasParejas = [...parejas, ...[...catalogueByName.keys()].filter((name) => NOCHE_MIN[name] && !parejas.some((pareja) => pareja.includes(name))).map((name) => [name])]
    const escrita = nocheDef.lista?.[0] ?? null
    const salida = []
    let elegidos = []
    let causa = null
    if (especial && escrita && escrita === especial.noche) { elegidos = [escrita]; usadasHoy.add(escrita) } // (Nochebuena: solo Trevi, y esa noche puede repetir.)
    else {
      // 1. La primera pareja imprescindible que aún no ha salido y queda a 15 min en taxi o menos de la cena. «La imprescindible que falte»: la que ningún día de después del viaje lleve como su
      //    noche escrita (Tanda 6g: el D4 escribe el Coliseo, así que en un viaje con el D4 el D2 se queda con su Trastevere de noche y no le quita el Coliseo).
      const escritasDespues = new Set(drafts.filter((other) => other.index > draft.index).flatMap((other) => { const e = other.trabajo.noche?.lista?.[0]; return e ? parejaDe(e) : [] }))
      for (const name of imprescindiblesNoche) {
        if (escritasDespues.has(name)) continue
        const m = miembros(parejaDe(name))
        if (m.length > 0 && cercaDeLaCena(m[0])) { elegidos = m; causa = `${m.join(' y ')}: la primera pareja de nocturnas imprescindible que aún no ha salido de noche en el viaje`; break }
      }
      // 2. La escrita del día (su pareja entera, o la que quede).
      if (elegidos.length === 0 && escrita) {
        const m = miembros(parejaDe(escrita))
        if (m.length > 0 && cercaDeLaCena(m[0])) elegidos = m
      }
      // 3. Su alternativa escrita, y si no, la pareja más cercana a la cena que no haya salido (y a 15 min en taxi o menos).
      if (elegidos.length === 0) {
        for (const alternativa of nocheDef.alternativa ?? []) { const m = miembros(parejaDe(alternativa)); if (m.length > 0 && cercaDeLaCena(m[0])) { elegidos = m; break } }
      }
      if (elegidos.length === 0) {
        const mejor = todasLasParejas.map((pareja) => miembros(pareja)).filter((m) => m.length > 0 && cercaDeLaCena(m[0])).sort((a, b) => distancia(a[0]) - distancia(b[0]))[0]
        if (mejor) { elegidos = mejor; causa = `${escrita ?? 'la nocturna escrita'} no vale hoy o ya salió: la noche pasa a ${mejor.join(' y ')}, la pareja más cercana a la cena que no ha salido` }
      }
    }
    if (elegidos.length === 0) log.push({ id: `noche_${slug(escrita ?? 'libre')}`, lugar: escrita, sitio: null, que: 'quitada', causa: 'ya salió de noche en el viaje, o es un sitio visto hoy, y no queda otra pareja de nocturnas cerca de la cena: sin nocturna' })
    for (const elegida of elegidos) {
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
      // (Con una reserva del viajero la nocturna se queda aunque el día acabe tarde, Tanda 6x: el viajero la quita si quiere.)
      if (!nocheValida(destData, fecha, sunset, start, nocheItem.min) && !final.some((it) => it.kind === 'stop' && it.hora_tipo === 'reserva')) {
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
  /**
   * «Abre a las…» (Tanda 6y10, 1d): solo si la ruta llega ANTES de que abra, UNA sola vez y con la hora de ESE día (la del horario real, no la que el documento escribe para un día cualquiera).
   * Si la parada ya lleva el aviso calculado con la hora real (`aviso_horario`, cuando pasa a por fuera) no se repite; si la ruta llega con el sitio abierto, no sale nada.
   */
  const abreAviso = (item, hours) => {
    if (!item.abre || item.aviso_horario) return null
    if (item.t0 == null) return item.abre // (sin hora —«Si te sobra tiempo»—: el del documento)
    const source = sourceOf(item)
    const sesiones = source ? parseHoursSessions(effectiveSchedule(source, hours)).sort((a, b) => a.open - b.open) : []
    if (sesiones.length === 0) return item.t0 < toMin(item.abre) ? item.abre : null
    if (sesiones.some((s) => item.t0 >= s.open && item.t0 < s.close)) return null
    const proxima = sesiones.find((s) => s.open > item.t0)
    return proxima ? toHHMM(proxima.open) : null
  }
  const stopNota = (item, hours) => {
    const abre = abreAviso(item, hours)
    // (Si la parada trae el «abre a las…» del documento y la ruta llega con el sitio abierto, tampoco sale el texto escrito del documento que dice lo mismo.)
    const avisos = item.abre && !abre ? (item.avisos ?? []).filter((texto) => !/\babre\b/i.test(texto)) : item.avisos
    return avisoDe({ ...item, abre: abre ?? undefined, avisos }, hours?.dateIso ? Number(String(hours.dateIso).slice(5, 7)) : Number.isInteger(calendar.month) ? calendar.month + 1 : null, mesesInvierno)
  }
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
        ...source, visitOutside: true, outsideReason: item.motivo_fuera ?? source.por_fuera ?? null, outsideKind: item.fuera_por_horario ? (String(item.motivo_fuera ?? '').startsWith('A esta hora aún no ha abierto') ? 'no_abre' : 'ya_cerrado') : item.motivo_fuera === OUTSIDE_REASONS.cerrado || item.cerrado_este_dia ? 'cerrado' : item.motivo_fuera ? 'no_abre' : 'a_proposito', outsideAuthored: !item.motivo_fuera,
        coordinates: source.pass_by?.coordinates ?? source.coordinates, duration_minutes: item.min, windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior',
      }
    } else if (modo === 'camino') {
      ready = { ...source, passThrough: true, duration_minutes: item.min, outsideReason: 'hoy no toca entrar', windows: undefined, by_period: undefined, by_season: undefined, by_day: undefined, schedule: undefined, last_entry: undefined, type: 'exterior' }
    } else {
      ready.duration_minutes = item.min
      if (modo === 'dentro') ready = { ...ready, writtenInside: true }
    }
    if (item.cerrado_este_dia) ready.closedThisDay = true // (Tanda 6y10, 1b: «Cerrado este día», sin tiempo y con su aviso.)
    if (modo !== 'camino' && (item.no_calle || isStreet(source))) ready.notStreet = true
    if (item.transit) ready = { ...ready, transitMinutes: item.transit.min, transitHow: transitHow(item.transit.como), transit: { how: transitHow(item.transit.como), minutes: item.transit.min } }
    const aviso = stopNota(item, hours)
    if (aviso) ready.stopNotice = aviso
    if (Array.isArray(item.coordenadas)) ready = { ...ready, coordinates: item.coordenadas, entrada: undefined, pass_by: undefined }
    if (item.foto) ready.photoName = item.foto
    if (item.visitado_dia) ready.visitedDay = item.visitado_dia
    // Si se llega antes de que abra: HOY dice «abre en n min. Mientras, …»; el texto sale de la parada de antes (su `texto_espera`) o, si no lo tiene, «aprovecha {la parada de antes}».
    if (item.espera_abre) {
      ready.waitOpensAt = item.espera_abre
      const previa = item.espera_tras
      const texto = previa ? placeByName.get(previa.lugar)?.texto_espera ?? `aprovecha ${previa.titulo ?? previa.lugar}` : null
      if (texto) ready.waitHint = `Mientras, ${texto}`
    }
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
    // La franja de cada parada es la de su sitio en el día (Tanda 6k, punto 2): antes de la comida, «Mañana»; después, «Tarde». Con una reserva, el día cambia de lista y una parada que el documento
    // escribe en la tarde puede quedar antes de la comida (o al revés): sin esto, el día saldría con dos franjas «Mañana», o con una franja con horas que no son las suyas.
    {
      const comidaAt = final.findIndex((it) => it.kind === 'comida')
      if (comidaAt >= 0) final = final.map((it, at) => (it.kind === 'stop' && (it.franja === 'manana' || it.franja === 'tarde') && it.franja !== (at < comidaAt ? 'manana' : 'tarde') ? { ...it, franja: at < comidaAt ? 'manana' : 'tarde', franja_doc: it.franja_doc ?? it.franja } : it))
    }
    const units = []
    const meals = []
    let dinnerRestaurant = null
    const redondea = (m) => Math.round(m / 5) * 5
    let lastEnd = 0
    // La línea de la llegada (Tanda 6f, punto 1): la tarjeta «Llegada a…» ya no sale; si el viajero tiene la reserva puesta (o el Free Tour añadido), la tarjeta de la visita lleva
    // una línea arriba con la hora de entrada y la de llegada. El motor sigue contando el rato de llegada antes de la hora fija.
    const horaCorta = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
    const notaDeLlegada = (item) => {
      const L = final.find((x) => x.llegada && x.de === item.id)
      if (!L || !item.hora) return null
      const reservaDelViajero = item.hora_tipo === 'reserva' && !item.turno_real
      if (!reservaDelViajero && item.tipo !== 'tour') return null
      const info = written.destino?.llegadas ?? {}
      const entrada = toMin(item.hora)
      const llega = entrada - L.min
      // Tanda 6y4, punto 6: la hora de la entrada sale UNA sola vez en la ficha («✓ Tu entrada: 10:30»); esta línea va debajo y SIN hora calculada: «Llega unos 30 minutos antes: …» (15 en el Free Tour).
      // (`hora` y `minutos` siguen yendo en la nota: son los de la cuenta atrás de HOY, nunca se enseñan.)
      if (item.tipo === 'tour') return { texto: `Llega unos ${L.min} minutos antes a ${info.free_tour?.punto ?? 'el punto de encuentro'}.${info.free_tour?.frase ? ` ${info.free_tour.frase}.` : ''}`, hora: horaCorta(llega), minutos: L.min }
      // (Solo el principio del motivo, hasta el primer punto o dos puntos: «la cola del control de seguridad», no la frase entera con su segunda parte.)
      const motivo = (info.por_lugar?.[item.lugar] ?? '').split(/[.:]/)[0].trim()
      const frase = motivo ? motivo.charAt(0).toLowerCase() + motivo.slice(1) : info.linea_reserva?.generico ?? 'hay cola de control'
      return { texto: `Llega unos ${L.min} minutos antes: ${frase}`, hora: horaCorta(llega), minutos: L.min }
    }
    final.forEach((item, index) => {
      if (item.kind === 'stop') {
        const place = lugarListo(item, hours)
        if (!place) { problems.push({ tipo: 'lugar_desconocido', lugar: item.lugar, dayNumber: skeletonDay.dayNumber }); return }
        const unitId = `${draft.unitPrefix ?? draft.id}:${item.id}`
        const start = Math.max(redondea(item.t0), lastEnd)
        const duration = item.cerrado_este_dia ? 0 : Math.max(5, item.t1 - item.t0)
        const level = place.level ?? 3
        units.push({ id: unitId, group: null, places: [place], slot: item.franja, blockId: draft.id, role: place.passThrough ? 'de_paso' : 'parada', dropRank: 1, priority: level === 1 ? PRIORITY.ESSENTIAL : item.protegido ? PRIORITY.POOL : PRIORITY.THEME, curatedIndex: index, poolIndex: null, ...(item.titulo && !item.llegada ? { stretchTitle: item.titulo, stretchWhy: item.texto_titulo ?? null, stretchBase: -100000 } : {}) })
        visits.push({ unitId, place, start, end: start + duration, chained: false, walkMinutes: item.leg ?? 0, walkSource: 'matrix', ...(item.hora && !item.llegada ? { fixedAt: toMin(item.hora), fixedMargin: 0, horaTipo: item.hora_tipo ?? 'turno', ...(item.turno_real ? { turnoRecomendado: true } : {}), ...(notaDeLlegada(item) ? { arrivalNote: notaDeLlegada(item) } : {}) } : {}), orientative: !item.hora, franja: item.franja })
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
        if (item.kind === 'comida') meals.push({ type: 'lunch', ...(item.sin_restaurante ? { sinRestaurante: true, label: item.titulo ?? null } : {}), start, end: start + item.min, eatMinutes: item.min, coordinates: chosen?.coordinates ?? null, ...(chosen ? { spot: { name: chosen.name, zone: chosen.zone } } : {}), eatStart: start, ...(nota ? { note: nota } : {}) })
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
      return place ? { unitId: `${draft.unitPrefix ?? draft.id}:${item.id}`, place, start: 0, end: item.min ?? 15, spareReason: item.spareReason } : null
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
    // (Tanda 6f, 4d: sin tarjeta de descanso antes de cenar; si sobra tiempo, solo HOY lo dice con «Vas bien de tiempo».)
    const dayPlan = {
      dayNumber: skeletonDay.dayNumber, weekday: skeletonDay.weekday, allowsRepetition: false, isBlank: false, isExcursion: false, interruptor: skeletonDay.interruptor === true, halfDayExcursion: skeletonDay.halfDayExcursion ?? null,
      curated: true, escrito: true, listas: true, hours,
      units, schedule: { visits, meals, kept: units, dropped: [], walkMinutes: 0, meters: 0, idleMinutes: 0, idleBeforeDinner: 0, modeFallback: null },
      lunchZone: null, dinnerZone, dinnerPlaceZone: null, dinnerCoords: dinnerRestaurant?.coordinates ?? null, dinnerRestaurant, nightNames: [], blocks: null,
      curatedDay: { id: draft.id, nombre: draft.dia.nombre, variantes: draft.aplicadas, noche: null, nocheDespuesDeCenar: true, nocheAntesDeCenar: false, nocheMinutos: null, nocheSiCae: null },
      untypedAfternoon: false, reorderedBlocks: [], closedAnchors: [], otherRestaurants: [],
      written: { version: null, escrito: true, tabla: draft.id, grupo: draft.parteKey },
      escritoNights, escritoLog: log.map((entry) => ({ ...entry, fecha: fecha ?? null })),
      escritoRows: final.map((item) => ({ id: item.id, tipo: item.kind === 'stop' ? (item.tipo ?? 'parada') : item.kind, lugar: item.lugar ?? item.restaurante ?? item.noche ?? null, titulo: item.titulo ?? null, restaurante: item.restaurante ?? null, hora: toHHMM(item.t0 ?? 0), t0: item.t0 ?? 0, t1: item.t1 ?? 0, llegaA: item.llegaA ?? null, tarde: item.tarde ?? 0, hora_fija: item.hora ?? null, min: item.min ?? 0, modo: item.modo ?? null, llegada: item.llegada === true, hora_tipo: item.hora_tipo ?? null, fija: Boolean(item.hora), nivel: nivelDe(item.lugar), franja: item.franja, franja_doc: item.franja_doc ?? item.franja, de: item.de ?? null, relleno: item.relleno ?? null, protegido: item.protegido === true, por_horario: item.fuera_por_horario === true, previo_min: item.previo_horario?.min ?? null, visitado_dia: item.visitado_dia ?? null, no_quita_noche: item.no_quita_noche === true, cerrado_este_dia: item.cerrado_este_dia === true })),
      tardeLibre,
      spare: spareVisits,
      spareRows: spare.map((item) => ({ razon: item.razon ?? null, id: item.id, lugar: item.lugar, titulo: item.titulo ?? null, franja: item.franja, nivel: nivelDe(item.lugar), modo: item.modo ?? null, protegido: item.protegido === true, por_llegada: item.por_llegada === true })),
      ordenBase: draft.ordenBase,
      sunsetText: aviso,
      rainPlan: lluvia,
      franjas,
      timeCheck: comprobacionTiempo ? { ...comprobacionTiempo, sugerencias: comprobacionTiempo.sugerencias.map(({ item, nota, cambioMesa }) => ({ item, nota, cambioMesa: cambioMesa ?? null, place: lugarListo({ ...item, kind: 'stop' }, hours) })).filter((x) => x.place) } : null,
    }
    return dayPlan
  }

  /** «🌧 Si llueve»: el texto del documento y lo que cambia (qué sale y qué entra), con las mismas comprobaciones. */
  function planDeLluvia(draft, final, hours) {
    const lluvia = draft.dia.lluvia
    const entradasPosibles = (lluvia.ops ?? []).filter((entrada) => cumple(entrada.cuando, draft.ctx))
    // Si una parte de la alternativa rompe una comprobación de siempre en la versión que toca de ese día (otra lista escrita, otro orden), no se hace: «Si una recolocación rompe alguna, no se hace».
    const actualesParaComprobar = final.filter((it) => it.kind === 'stop' && !it.llegada)
    const tieneFranja = (franja) => draft.trabajo.franjas?.[franja] !== false
    const baseLluvia = reglas.todas(actualesParaComprobar.map((it, i) => ({ ...it, kind: 'stop', id: it.id ?? `l${i}` })), { vistosAntes: new Set(), dentroAntes: new Set() })
    const entradas = entradasPosibles.filter((entrada) => {
      const lista = ['manana', 'tarde'].flatMap((franja) => {
        const delaFranja = actualesParaComprobar.filter((it) => it.franja === franja).map((it) => ({ ...it }))
        return entrada.ops[franja] && tieneFranja(franja) ? aplicarOp(delaFranja, entrada.ops[franja]) : delaFranja
      }).map((it, i) => ({ ...it, kind: 'stop', id: it.id ?? `l${i}` }))
      return reglas.nuevas(baseLluvia, reglas.todas(lista, { vistosAntes: new Set(), dentroAntes: new Set() })).length === 0
    })
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
    if ((index === 0 || drafts[index].diaLlegada) && llegadaDecision?.aplica) plan.llegadaDia = { ...(index === 0 ? llegadaDecision.publico.dia1 : {}), ...(index === 0 ? { lista: drafts[index].id } : {}), es_dia_1: index === 0, bloques: drafts[index].llegadaBloques.map((b) => b.sitio) }
    days.push(plan)
    cityPlanned.push(plan)
    if (plan.escritoNights.length > 0) nightsByDay.set(plan.dayNumber, plan.escritoNights)
  }

  // ── El día de vuelta con horas (Tanda 7, puntos 9, 10-vuelta, 12-vuelta y 19), con todos los días de ruta ya hechos ──────────────────────────────────────────────
  const vueltaSalida = V ? montarVuelta() : null
  function montarVuelta() {
    const retDay = { dayNumber: V.dia.dayNumber, weekday: V.dia.weekday, allowsRepetition: false, isBlank: false, isExcursion: false, interruptor: false, halfDayExcursion: null, curated: null, esVuelta: true }
    const horasV = hoursOf(retDay)
    const entradasVuelta = Object.fromEntries(V.reservas.vuelta.map((r) => [r.name, r.hora]))
    const dentroMinDe = (name) => Math.max(minutosDentro[name] ?? 0, Math.min(placeByName.get(name)?.duration_minutes ?? 60, 90))
    const vacio = () => ({ franjas: { manana: true, tarde: true }, manana: [], comida: null, tarde: [], cena: null, noche: null, empieza: null, sobra: [] })
    const borradorManual = (id, nombre, trabajo) => {
      const dia = { id, nombre, partes: { unica: { manana: [], comida: null, tarde: [], cena: null, noche: null } }, lluvia: null, quedarme: null, variantes: [], experiencias: {}, pool: {} }
      return { id, unitPrefix: `vuelta:${id}`, index: drafts.length, dia, day: retDay, hours: horasV, parteKey: 'unica', trabajo, perdidasPorReserva: [], aplicadas: [], log: [], ctx: contextoDe(dia, retDay, horasV, null, -1, { entradas: entradasVuelta }), pooled: [], soloTarde: false }
    }
    /** La reserva pequeña de ese día: su parada a su hora, dentro de la mañana (si ya está en la lista, se queda en su sitio con su hora). Nada se quita. */
    const meterReservas = (draft, pequenas) => {
      for (const r of pequenas) {
        const esElTour = Boolean(tour) && r.name === tour.name
        const esLaVisita = (s) => s.lugar === r.name && s.tipo !== 'traslado' && s.modo !== 'camino'
        const fija = esElTour ? { hora: r.hora } : { modo: 'dentro', hora: r.hora, hora_tipo: 'reserva', protegido: true }
        const ya = [...draft.trabajo.manana, ...draft.trabajo.tarde].some(esLaVisita)
        if (ya) {
          let marcada = false
          for (const key of ['manana', 'tarde']) draft.trabajo[key] = draft.trabajo[key].map((s) => { if (marcada || !esLaVisita(s)) return s; marcada = true; return { ...s, ...fija, ...(esElTour ? {} : { min: Math.max(s.min ?? 0, dentroMinDe(r.name)) }) } })
        } else {
          meterPorHora(draft, esElTour ? { tipo: 'tour', lugar: r.name, min: tour.duration_minutes ?? 150, ...fija } : { tipo: 'parada', lugar: r.name, min: dentroMinDe(r.name), ...fija }, toMin(r.hora))
        }
        draft.aplicadas.push(`vuelta:reserva:${r.name}`)
      }
    }
    /**
     * «Un día más» (el día que se cayó al llegar o el siguiente que el viaje no lleva) puede traer sitios que la ruta ya ha visto (la ruta del centro de la llegada y el día de Villa Borghese
     * llevan los dos la Fontana de Trevi y la Plaza de España). Se aplica la regla de siempre de los imprescindibles: si ya se vieron otro día del viaje, un imprescindible sale otra vez como
     * parada corta (~10 min) y lo que no es imprescindible pasa a «de camino» (con «Ya lo visitaste el día n»). Lo que ya iba de camino o por fuera no se toca.
     */
    const conLoYaVisto = (trabajo) => {
      const ajusta = (s) => {
        if (s.tipo === 'traslado' || !s.lugar || s.modo === 'camino' || s.modo === 'fuera' || !estado.vistos.has(s.lugar)) return s
        return (nivelDe(s.lugar) ?? 3) === 1 ? { ...s, min: Math.min(s.min ?? 10, 10) } : { ...s, modo: 'camino', min: Math.min(s.min ?? 5, 5) }
      }
      return { ...trabajo, manana: trabajo.manana.map(ajusta), tarde: trabajo.tarde.map(ajusta) }
    }
    /** Lo que va después de la comida pasa a «Si te sobra tiempo» (y lo que ya ha salido en el viaje no se repite). */
    const tardeASobra = (trabajo, causa) => {
      const yaEnLista = new Set([...trabajo.manana, ...(trabajo.sobra ?? [])].map((s) => s.lugar))
      const nuevas = trabajo.tarde.filter((s) => s.tipo !== 'traslado' && s.lugar && s.modo !== 'camino' && !yaEnLista.has(s.lugar) && !estado.vistos.has(s.lugar)).map((s) => ({ ...s, sobra_causa: causa }))
      return { ...trabajo, tarde: [], sobra: [...(trabajo.sobra ?? []), ...nuevas] }
    }

    let disp = null
    let draft = null
    let nota = null
    // (La ruta a mano: ni se recorta ni se rehace nada; solo salen los avisos de las reservas contra el vuelo.)
    if (!Vactiva) return { disp: null, plan: null, ...montarPublico(V, null, null, []) }
    disp = disponerVuelta(V, { written, destData, vistos: new Set(estado.vistos), orden: [...order, ...(llegadaDecision?.aplica ? llegadaDecision.publico?.hooks?.vuelta?.sustituidos ?? [] : [])], hasFreeTour, diaCaidoAlLlegar })
    if (disp.tipo === 'manana') {
      const id = disp.corta ? disp.fila.corta : disp.fila.lista
      const dia = written.days[id]
      const parteKey = disp.corta ? (dia.partes.unica ? 'unica' : Object.keys(dia.partes)[0]) : disp.fila.parte ?? 'unica'
      draft = preparar(id, -1, { day: retDay, parteKey, entradas: entradasVuelta })
      draft.unitPrefix = `vuelta:${id}`
      draft.dia = { ...draft.dia, lluvia: null }
      const conTarde = disp.conComida ? 'el documento lo deja para «Si te sobra tiempo» en este día: lo que va después de la comida (la tarde es del viajero)' : 'el documento lo deja para «Si te sobra tiempo» en este día: lo que va después de la comida (este día no lleva comida)'
      draft.trabajo = conLoYaVisto({ ...tardeASobra(draft.trabajo, conTarde), comida: disp.conComida ? draft.trabajo.comida : null, cena: null, noche: null })
      nota = draft.trabajo.empieza ? null : `la hora de empezar de ${id} no está escrita: se usa la de un día normal`
      meterReservas(draft, V.reservas.pequenas)
    } else if (disp.tipo === 'dia_mas') {
      const dia = written.days[disp.lista]
      draft = preparar(disp.lista, -1, { day: retDay, parteKey: dia.partes.unica ? 'unica' : Object.keys(dia.partes)[0], entradas: entradasVuelta })
      draft.unitPrefix = `vuelta:${disp.lista}`
      draft.dia = { ...draft.dia, lluvia: null }
      draft.trabajo = conLoYaVisto({ ...draft.trabajo, cena: null, noche: null })
      meterReservas(draft, V.reservas.pequenas)
    } else if (disp.tipo === 'bloques') {
      // (Lo que el día del sitio se ha quedado en su versión sin esa visita —la Plaza y la Basílica del Vaticano sin Museos— no se repite en el bloque.)
      const omitir = new Set(order.flatMap((id) => [...(V.conservadas.get(id) ?? [])]))
      const bloques = V.reservas.grandes.map((g) => ({ g, b: armarBloque({ sitio: g.sitio, hora: g.hora, written, ctxDe: (diaId, ent) => contextoDe(written.days[diaId], retDay, horasV, null, -1, { entradas: ent }), fechaDelDia: { weekday: horasV.weekday }, omitir }) })).filter((x) => x.b)
      const t = vacio()
      bloques.forEach(({ g, b }, i) => {
        let marcada = false
        const marca = (lista) => lista.map((s) => { if (marcada || s.lugar !== g.name) return s; marcada = true; return { ...s, modo: 'dentro', hora: g.hora, hora_tipo: 'reserva', min: Math.max(s.min ?? 0, dentroMinDe(g.name)), protegido: true } })
        const m = marca(b.manana)
        const tt = marca(b.tarde)
        if (disp.conComida) { if (i === 0) { t.manana.push(...m); t.tarde.push(...tt) } else t.tarde.push(...m, ...tt) } else t.manana.push(...m, ...tt)
        t.sobra.push(...b.sobra)
        if (disp.conComida) t.tarde.push(...b.despuesDeComer)
        else t.sobra.push(...b.despuesDeComer.map((s) => ({ ...s, sobra_causa: 'el documento lo deja para «Si te sobra tiempo» en este día: ese día de la semana no va antes de comer y este día no lleva comida' })))
        if (i === 0 && disp.conComida) t.comida = b.comida
        if (i === 0) t.empieza = b.empieza
      })
      draft = borradorManual(`DV-bloque-${slug(V.reservas.grandes.map((g) => g.name).join('-'))}`, `Día de vuelta: ${V.reservas.grandes.map((g) => g.name).join(' y ')}`, t)
      draft.aplicadas.push(...V.reservas.grandes.map((g) => `vuelta:bloque:${g.name}`))
      meterReservas(draft, V.reservas.pequenas)
    } else if (disp.tipo === 'solo_reservas') {
      draft = borradorManual('DV-reservas', 'Día de vuelta: solo tus reservas', vacio())
      meterReservas(draft, V.reservas.pequenas)
    }
    const plan = draft ? procesarDia(draft, retDay) : null
    if (plan) plan.esVuelta = true
    return { disp, plan, nota, ...montarPublico(V, disp, plan, nota ? [nota] : []) }
  }
  /** Lo que viaja en la salida del motor (`plan.vuelta`), sin ninguna hora calculada. */
  function montarPublico(V, disp, plan, notas) {
    const info = vuelta?.info ?? null
    const textosDV = written.days?.['DV-traslado']?.textos ?? {}
    const paradas = (plan?.escritoRows ?? []).filter((r) => r.tipo !== 'comida' && r.tipo !== 'cena' && r.tipo !== 'traslado' && r.tipo !== 'noche' && !r.llegada)
    const sinParadas = paradas.length === 0
    const llevaManana = !sinParadas && !V.aMano
    const contenido = V.aMano ? null : disp?.tipo === 'manana' && sinParadas ? 'sin_paradas' : disp?.tipo ?? null
    const duracionDe = (name) => (tour && name === tour.name ? tour.duration_minutes ?? 150 : placeByName.get(name)?.duration_minutes ?? minutosDentro[name] ?? null)
    const zona = vuelta?.zona ?? null
    return {
      publico: {
        version: 1,
        activo: !V.aMano,
        aMano: V.aMano,
        medio: V.datos.modeKey,
        punto: { id: V.datos.punto.id, nombre: V.datos.punto.nombre, corto: V.datos.punto.corto, porDefecto: V.datos.porDefecto },
        hora: V.datos.hora,
        fila: { indice: V.indiceFila, desde: V.fila.desde, hasta: V.fila.hasta ?? null, lleva: V.fila.lleva, doc: V.fila.doc ?? null },
        lleva: V.lleva,
        madrugada: V.madrugada,
        fecha: V.dia,
        ultimoDiaDeRuta: V.ultimoDeRuta,
        contenido,
        listaId: plan?.curatedDay?.id ?? null,
        manana: disp?.tipo === 'manana' ? { lista: disp.corta ? disp.fila.corta : disp.fila.lista, orden: disp.fila.orden, corta: disp.corta, saltadas: disp.saltadas ?? [] } : null,
        diaMas: disp?.tipo === 'dia_mas' ? { lista: disp.lista, origen: disp.origen } : null,
        hoja: disp?.tipo === 'hoja' ? disp.hoja : null,
        excursion: V.excursion ? { nombre: V.excursion.nombre, vuelve: V.excursion.vuelve, medioDia: V.excursion.medioDia, enVuelta: V.excursion.enVuelta, enUltimoDia: V.excursion.enUltimoDia } : null,
        bloques: V.reservas.grandes.map((g) => ({ sitio: g.name, hora: g.hora, paradas: g.sitio.bloque.paradas })),
        reservasPequenas: V.reservas.pequenas.map((r) => ({ name: r.name, hora: r.hora })),
        comida: Boolean(plan && (plan.escritoRows ?? []).some((r) => r.tipo === 'comida')),
        tardeLibre: disp?.tardeLibre && !V.aMano ? { texto: textosDV.tarde_libre ?? null, anadirLugares: true } : null,
        maleta: llevaManana && info?.maleta ? { titulo: info.maleta.titulo ?? null, texto: info.maleta.texto, consigna: info.maleta.consigna ?? null } : null,
        ultimaTarde: llevaManana && info?.ultima_tarde ? { texto: info.ultima_tarde.texto } : null,
        tarjeta: !V.aMano && sinParadas && contenido !== 'excursion' ? tarjetaHoyVuelves({ V, written, info, destData, zona, madrugada: false }) : null,
        tarjetaUltimoDia: !V.aMano && V.madrugada ? tarjetaHoyVuelves({ V, written, info, destData, zona, madrugada: true }) : null,
        resumen: V.aMano || contenido === 'excursion' ? null : { ...resumenDeVuelta({ V, contenido: sinParadas ? 'sin_paradas' : contenido }), dayNumber: V.dia.dayNumber, dateIso: V.dia.dateIso, madrugada: V.madrugada },
        avisos: avisosDeVuelta({ V, destData, tour, duracionDe }),
        notas,
        interno: { salirMin: V.datos.salirMin, margenMin: V.datos.margen, equivalenteMin: V.equivalente, aviso: 'Solo para el motor y las pruebas: nunca se enseña.' },
      },
    }
  }

  // ── Lo que no salió del todo ─────────────────────────────────────────────────────────────────────────────────────
  const vistoEnViaje = new Set([...estado.vistos, ...estado.cerrados])
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
    if (problem.tipo === 'cierra_sin_otro_dia' && !dayNotices.some((item) => item.dayNumber === problem.dayNumber && item.name === problem.lugar)) {
      dayNotices.push({ dayNumber: problem.dayNumber, name: problem.lugar, reason: problem.aviso, suggestion: 'Si quieres entrar, cambia las fechas del viaje' })
    }
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
    motivosOrden,
    // El día de vuelta con horas (Tanda 7): solo con `vuelta` de pago. `diaPlan` es el día de vuelta hecho (como un día de ruta) o null si va sin paradas.
    ...(vueltaSalida?.publico ? { vuelta: { ...vueltaSalida.publico, diaPlan: vueltaSalida.plan ?? null } } : {}),
    problems,
    dayNotices,
    ...(llegadaDecision?.aplica ? { llegada: llegadaDecision.publico } : {}),
    ...(ftFranja ? { freeTourInfo: { franja: ftFranja, hora: freeTourDespues?.hora ?? null, dayId: ftDayIndex >= 0 ? order[ftDayIndex] : null, order: [...order], motivo: ftDayIndex >= 0 ? null : 'ningún día lo lleva' } } : {}),
  }
}
