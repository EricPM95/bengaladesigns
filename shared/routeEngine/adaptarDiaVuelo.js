/**
 * (Tanda 10S7c) «Adaptar solo el primer día / solo el último día» a los vuelos. Modo APARTE: no lo usa la ruta normal ni /api/rebuild-day; solo el cliente cuando el viajero
 * acepta adaptar sus días a los vuelos (`POST /api/adaptar-dia-vuelo`). Contrato completo en docs/dias/_estado_10s7c_X.md.
 *
 * (Tanda LL, Roma parte 2, Eric 4-nov: UN SOLO CAMINO. El PRIMER día y el de VUELTA ya no se recortan aquí: `/api/adaptar-dia-vuelo` los delega en el motor que rehace un día suelto —`/api/rebuild-day`— cuando la petición trae el viaje
 *  (`answers`, `all_days`, `day_number`) y los vuelos (`llegada`, `vuelta`); el día de llegada sale de las franjas F0 a F7 por la hora útil y el de vuelta de la hora de irse. Este recorte queda solo para un día de en medio o una petición sin el viaje.)
 * Recibe las paradas de UN día (ninguna de otros días), la fecha de ese día, `desde` (llegada + traslado al centro) y/o `hasta` (hora de irse al aeropuerto), y devuelve LAS MISMAS
 * paradas: las que caben, con la hora vuelta a poner respetando sus horarios de ESE día, y las que no caben aparte (van a «Si te sobra tiempo»: nunca se pierde ni se añade una).
 *
 *  · Cada parada libre empieza como pronto a `desde` (o a su hora de siempre si esa es posterior: nada se adelanta), tras lo que se tarda a pie desde la anterior. Si cae en un cierre
 *    espera a la apertura; si no cabe antes de cerrar, de la última entrada o de `hasta`, no cabe.
 *  · De todas las formas de dejar paradas se elige: más imprescindibles, luego más paradas, luego más de nivel 1, luego acabar antes. El orden de entrada se conserva.
 *  · (10S8) Con `desde` (día que empieza tarde), el orden de colocación es: primero los sitios que CIERRAN ese día (el Panteón, que cierra a las 19:00), luego los que se ven a cualquier hora
 *    (el Arco de Constantino, la Fontana delle Tartarughe: caben aunque se haga tarde); cada grupo conserva su orden. Sin `desde` (último día) se conserva el orden recibido.
 *  · (10S8) Una comida quitada por caer antes de la llegada no se recoloca; la siguiente (la cena) se queda si cae dentro de la ventana.
 *  · Con reserva (`reservedId`): no se toca. Noche y Free Tour: mantienen su hora si caben en la ventana; si no, van aparte. Las comidas dentro de la ventana se quedan a su hora
 *    (y las demás paradas las respetan); fuera de ella se quitan, salvo la que el viajero eligió.
 * Puro: sin red, sin reloj, determinista.
 */
import { effectiveSchedule, earliestVisitStart, lastEntryMinutes, closedOnDay, seasonKey, parseHoursSessions } from './openingHours.js'
import { sunsetFor } from './sunset.js'
import { importanciaDeSitios } from './importanciaDeSitios.js'
import { toHHMM } from './time.js'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const hhmm = (value) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const redondear10 = (minutos) => Math.ceil(minutos / 10) * 10
const toPair = (c) => (Array.isArray(c) && Number.isFinite(c[0]) ? [c[0], c[1]] : c && Number.isFinite(c.lat) ? [c.lat, c.lng] : null)
const MAX_PASOS = 400000

/**
 * @param {object} args
 *   destData, travel (createTravelTimes), stops, meals, dateIso, season, desde, hasta   (ver el contrato)
 */
export function adaptarDiaAlVuelo({ destData, travel = null, stops = [], meals = [], dateIso = null, season = null, desde = null, hasta = null }) {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(dateIso ?? '')) ? String(dateIso) : null
  const weekday = iso ? WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()] : null
  const estacion = seasonKey(season, iso)
  const hours = { weekday, season: estacion, dateIso: iso, sunset: sunsetFor(destData, { dateIso: iso, season }) }
  const desdeMin = Number.isFinite(desde) ? Number(desde) : null
  const hastaMin = Number.isFinite(hasta) ? Number(hasta) : null

  // ── Qué es cada parada ──
  const lugares = new Map()
  for (const place of destData?.places ?? []) {
    for (const nombre of [place.name, place.titulo_parada, place.fullName]) if (nombre && !lugares.has(norm(nombre))) lugares.set(norm(nombre), place)
  }
  const importancia = importanciaDeSitios(destData)
  const info = stops.map((stop, index) => {
    const place = lugares.get(norm(stop.name)) ?? (stop.fullName ? lugares.get(norm(stop.fullName)) : null) ?? null
    const duracion = Number(stop.durationMinutes) > 0 ? Number(stop.durationMinutes) : 30
    const peso = importancia[place?.name ?? ''] ?? importancia[stop.name] ?? null
    return {
      index, stop, place, duracion, orig: hhmm(stop.time), coords: toPair(stop.coordinates) ?? toPair(place?.coordinates),
      imprescindible: stop.imprescindible === true || peso === 'imprescindible', nivel1: peso !== null,
      llegada: Boolean(stop.isArrival), reservada: Boolean(stop.reservedId), fija: !stop.reservedId && !stop.isArrival && Boolean(stop.night || stop.freeTour),
    }
  })
  // ¿Esta parada cierra ese día (tiene un horario con hora de cierre)? Las de acceso libre (sin horario) se ven a cualquier hora.
  const cierraEseDia = (s) => {
    if (!s.place) return false
    const sesiones = parseHoursSessions(effectiveSchedule(s.place, hours))
    return sesiones.length > 0 && Math.max(...sesiones.map((x) => x.close)) < 23 * 60 + 30
  }
  const libresEnOrden = info.filter((s) => !s.llegada && !s.reservada && !s.fija)
  // (10S8) Día que empieza tarde: primero los que cierran, al final los de cualquier hora (cada grupo en su orden).
  const libres = desdeMin !== null ? [...libresEnOrden.filter(cierraEseDia), ...libresEnOrden.filter((s) => !cierraEseDia(s))] : libresEnOrden
  const anclas = info.filter((s) => s.reservada || s.fija)
  const llegadas = info.filter((s) => s.llegada)

  const caminar = (a, b) => {
    if (!a || !b) return 10
    const m = travel?.leg ? travel.leg(a, b, 'walking')?.minutes : null
    return Number.isFinite(m) ? m : 10
  }

  // ── Las anclas (reserva, noche, Free Tour) y las comidas ──
  const spare = []
  const motivo = (s, reason) => spare.push({ s, reason })
  const obstaculos = []
  const anclasKept = []
  for (const a of anclas) {
    const ini = a.orig
    const fin = ini === null ? null : ini + a.duracion
    if (a.reservada || ini === null) { anclasKept.push(a); if (ini !== null) obstaculos.push({ ini, fin, coords: a.coords }); continue }
    const fuera = (desdeMin !== null && ini < desdeMin) || (hastaMin !== null && fin > hastaMin)
    if (fuera) { motivo(a, 'fuera_de_ventana'); continue }
    anclasKept.push(a)
    obstaculos.push({ ini, fin, coords: a.coords })
  }
  const comidas = meals.map((meal, index) => {
    const ini = hhmm(meal.time)
    const duracion = Number(meal.durationMinutes) > 0 ? Number(meal.durationMinutes) : meal.mealTime === 'dinner' ? 75 : 60
    const dentro = ini !== null && !((desdeMin !== null && ini < desdeMin) || (hastaMin !== null && ini + duracion > hastaMin))
    const keep = ini === null || Boolean(meal.chosenRestaurant) || dentro
    if (keep && ini !== null) obstaculos.push({ ini, fin: ini + duracion, coords: null })
    return { index, mealTime: meal.mealTime, ini, keep }
  })

  // Sin hora de irse, el día no pasa de donde acababa antes (nada de paradas a las once y media de la noche).
  const limite = hastaMin ?? Math.max(0, ...info.map((s) => (s.orig !== null ? s.orig + s.duracion : 0)), ...comidas.map((c) => (c.ini ?? 0) + 60))

  // ── Dónde cabe una parada libre ──
  function colocar(s, listo, desdeCoords, liberado = false) {
    const place = s.place
    if (iso && place && closedOnDay(place, weekday, iso)) return { ok: false, reason: 'cerrado' }
    const sched = place ? effectiveSchedule(place, hours) : null
    // (Si lo que tarda a pie desde la anterior casi coincide con su hora de siempre —hasta 5 min—, se queda a su hora: no se mueve nada sin motivo.)
    const llega = listo + (desdeCoords ? caminar(desdeCoords, s.coords) : 0)
    // Último día (con hora de irse): si antes se ha quitado una parada, la siguiente puede adelantarse a rellenar su hueco (nunca antes de las 8:00).
    const suelo = liberado && hastaMin !== null && desdeMin === null ? 8 * 60 : s.orig ?? 0
    let c = Math.max(s.orig !== null && llega <= s.orig + 5 && !liberado ? s.orig : redondear10(llega), suelo, desdeMin ?? 0)
    for (let vuelta = 0; vuelta < 40; vuelta++) {
      const start = earliestVisitStart(sched, c, s.duracion, redondear10)
      if (start === null) return { ok: false, reason: 'cierra_antes' }
      const fin = start + s.duracion
      const choca = obstaculos.find((o) => o.ini !== null && start < o.fin - 5 && fin - 5 + (o.coords ? caminar(s.coords, o.coords) : 0) > o.ini)
      if (choca) { c = redondear10(choca.fin + (choca.coords ? caminar(choca.coords, s.coords) : 0)); continue }
      if (fin > limite) return { ok: false, reason: 'no_cabe' }
      const ultima = place ? lastEntryMinutes(place, start, hours) : null
      if (ultima !== null && start > ultima) return { ok: false, reason: 'cierra_antes' }
      return { ok: true, start, fin }
    }
    return { ok: false, reason: 'no_cabe' }
  }

  // ── La mejor forma de dejar las paradas libres (en su orden) ──
  const puntuar = (elegidas) => [
    elegidas.filter((e) => e.s.imprescindible).length,
    elegidas.length,
    elegidas.filter((e) => e.s.nivel1).length,
    -(elegidas.at(-1)?.fin ?? 0),
  ]
  const mejorQue = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false }
  // Primero la forma sencilla (poner todas las que quepan, en orden) para tener una cota; luego se busca la mejor con poda y un tope de pasos (determinista).
  const golosa = []
  {
    let listo = desdeMin ?? 0
    let coords = null
    let quitada = false
    for (const s of libres) {
      const p = colocar(s, listo, coords, quitada)
      if (p.ok) { golosa.push({ s, start: p.start, fin: p.fin }); listo = p.fin; coords = s.coords ?? coords } else quitada = true
    }
  }
  let mejor = { elegidas: golosa, puntos: puntuar(golosa) }
  const restoImp = libres.map((_, i) => libres.slice(i).filter((s) => s.imprescindible).length)
  let pasos = 0
  const ir = (i, listo, coords, elegidas, liberado = false) => {
    if (++pasos > MAX_PASOS) return
    const imp = elegidas.filter((e) => e.s.imprescindible).length
    // Poda: ni cogiendo todo lo que queda se mejora lo que ya hay.
    const cotaImp = imp + (restoImp[i] ?? 0)
    const cotaTotal = elegidas.length + (libres.length - i)
    if (cotaImp < mejor.puntos[0] || (cotaImp === mejor.puntos[0] && cotaTotal < mejor.puntos[1])) return
    if (i === libres.length) {
      const puntos = puntuar(elegidas)
      if (mejorQue(puntos, mejor.puntos)) mejor = { elegidas, puntos }
      return
    }
    const s = libres[i]
    const p = colocar(s, listo, coords, liberado)
    if (p.ok) ir(i + 1, p.fin, s.coords ?? coords, [...elegidas, { s, start: p.start, fin: p.fin }], liberado)
    ir(i + 1, listo, coords, elegidas, true)
  }
  ir(0, desdeMin ?? 0, null, [])
  const dentro = new Map(mejor.elegidas.map((e) => [e.s.index, e]))
  for (const s of libres) {
    if (dentro.has(s.index)) continue
    // El motivo real: lo que dijo colocar() suelto (cerrado ese día, cierra antes) o, si por sí sola cabía, que no cabe con las demás.
    const sola = colocar(s, desdeMin ?? 0, null)
    motivo(s, sola.ok ? 'no_cabe' : sola.reason)
  }

  // ── Las «Llegada a…» siguen a su parada ──
  const norma = (s) => norm(String(s.stop.name ?? '').replace(/^Llegada a\s+/i, ''))
  const cuerpo = info.filter((s) => !s.llegada)
  const tiempos = new Map()
  for (const e of mejor.elegidas) tiempos.set(e.s.index, { start: e.start, fin: e.fin })
  for (const a of anclasKept) if (a.orig !== null) tiempos.set(a.index, { start: a.orig, fin: a.orig + a.duracion })
  for (const a of anclasKept) if (a.orig === null) tiempos.set(a.index, { start: 0, fin: 0, sinHora: true })
  const llegadasKept = []
  for (const l of llegadas) {
    const objetivo = norma(l)
    const meta = cuerpo.find((s) => norm(s.stop.name) === objetivo || norm(s.place?.name ?? '') === objetivo) ?? cuerpo.find((s) => s.index > l.index) ?? null
    const t = meta ? tiempos.get(meta.index) : null
    if (!t || t.sinHora) { if (t) llegadasKept.push({ s: l, start: null, meta }); else motivo(l, 'llegada_sin_destino'); continue }
    const antes = meta.orig !== null && l.orig !== null ? Math.max(0, meta.orig - l.orig) : 0
    llegadasKept.push({ s: l, start: t.start - antes, meta })
  }

  // ── La salida ──
  const todas = []
  for (const [index, t] of tiempos) if (!t.sinHora) todas.push({ s: info[index], start: t.start })
  for (const l of llegadasKept) if (l.start !== null) todas.push({ s: l.s, start: l.start, esLlegada: true })
  todas.sort((a, b) => a.start - b.start || (a.esLlegada ? -1 : 0) - (b.esLlegada ? -1 : 0) || a.s.index - b.s.index)
  const sinHora = [...anclasKept.filter((a) => a.orig === null), ...llegadasKept.filter((l) => l.start === null).map((l) => l.s)]
  const order = [
    ...todas.map((t) => ({ id: t.s.stop.id, time: toHHMM(t.start), changed: toHHMM(t.start) !== String(t.s.stop.time ?? '').padStart(5, '0') })),
    ...sinHora.map((s) => ({ id: s.stop.id, time: String(s.stop.time ?? ''), changed: false })),
  ]
  spare.sort((a, b) => a.s.index - b.s.index)
  const spareOut = spare.map(({ s, reason }) => ({ id: s.stop.id, name: s.stop.name, reason, imprescindible: s.imprescindible, ...(s.llegada ? { esLlegada: true } : {}) }))
  const quedan = todas.filter((t) => !t.esLlegada)
  const mealsOut = comidas.map((c) => {
    if (!c.keep) return { index: c.index, mealTime: c.mealTime, time: null, keep: false, afterId: null }
    const antes = quedan.filter((t) => c.ini !== null && t.start < c.ini).at(-1)
    return { index: c.index, mealTime: c.mealTime, time: c.ini === null ? null : toHHMM(c.ini), keep: true, afterId: antes?.s.stop.id ?? null }
  })
  const finMax = Math.max(-1, ...quedan.map((t) => t.start + t.s.duracion))
  const fin = finMax >= 0 ? toHHMM(finMax) : null
  const cambia = spareOut.length > 0 || order.some((o) => o.changed) || mealsOut.some((m) => !m.keep) || order.some((o, i) => o.id !== stops.filter((s) => order.some((x) => x.id === s.id))[i]?.id)
  return {
    changed: cambia,
    weekday,
    order,
    spare: spareOut,
    imprescindiblesFuera: spareOut.filter((s) => s.imprescindible && !s.esLlegada).map((s) => ({ id: s.id, name: s.name, weekday, reason: s.reason })),
    meals: mealsOut,
    fin,
    margenFinal: fin !== null && hastaMin !== null ? hastaMin - finMax : null,
  }
}
