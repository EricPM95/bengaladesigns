// Reservas dentro de la ruta · 2 · medir si cabe (PARA_CODE_RESERVAS_EN_RUTA_2_MEDIR).
// SOLO MIDE: no cambia nada de la app. Coge los días que hoy monta el motor (v4, días escritos) y simula, con las reglas de la propuesta,
// qué pasaría si el viajero tuviera una reserva (entrada o Free Tour) a cada hora real, en cada día de la semana, en el día donde ya está
// la parada y en otro día del viaje; y qué pasaría con las horas de llegada y de salida de los vuelos.
//   node scripts/destino/medirReservas.mjs [paso=1] [dias=3,4,5] [amplio] [out=docs/MEDIR_RESERVAS_2026-10-02.md]
//   (paso: una fecha de salida de cada N del año; 1 = las 365)
//
// Las reglas que usa la simulación (de la propuesta, ver docs/archivo/PARA_CODE_RESERVAS_EN_RUTA_1_CONSULTA.md):
//   - lo reservado va a su hora; se llega 30 min antes (la parada de antes tiene que acabar, y el paseo, a tiempo);
//   - lo único que puede tocarse, por este orden: nada (solo cambian las horas) → encoger paseos → quitar opcionales, paseos y «si entra»
//     → (versión corta de un imprescindible que no es joya: de paso y por fuera) → cambiar el orden del grupo → pasar el grupo a otro día;
//   - nunca: quitar un imprescindible en silencio, mover lo reservado, poner algo con el sitio cerrado, romper el atardecer o la cena.
import { writeFileSync, readFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { placeWindows, parseHoursSessions, closedOnDay, lastEntryMinutes, seasonKey } from '../../shared/routeEngine/openingHours.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => (x.includes('=') ? x.split('=') : [x, true])))
const STEP = Number(args.paso ?? 1)
const LENGTHS = String(args.dias ?? '3,4,5').split(',').map(Number)
const BROAD = Boolean(args.amplio)
const TRIPS56 = Boolean(args.viajes56)
const OUT = args.out ?? (TRIPS56 ? 'docs/MEDIR_RESERVAS_2026-10-02_56_VIAJES.md' : 'docs/MEDIR_RESERVAS_2026-10-02.md')
const YEAR = Number(args.year ?? 2027)
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')

// ── Utilidades ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const t2m = (t) => {
  const [h, m] = String(t ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const hh = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const placeByName = new Map((D.places ?? []).map((place) => [place.name, place]))
const pct = (n, d) => (d === 0 ? '—' : `${Math.round((n / d) * 1000) / 10} %`)

const legCache = new Map()
function legBetween(a, b) {
  if (!a || !b) return 0
  const key = `${a[0]},${a[1]}|${b[0]},${b[1]}`
  let value = legCache.get(key)
  if (value === undefined) {
    value = travel.leg(a, b)?.minutes ?? Math.round(straightLineMeters(a, b) / 75)
    legCache.set(key, value)
  }
  return value
}

// ── Los sitios con entrada: sus horas reales, su grupo, cuánto dura la visita ────────────────────────────────────────────────
// FUENTES (comprobadas el 2-oct-2026; el informe las repite):
//  - Vaticanos: tickets.museivaticani.va, franjas cada 30 min de 08:00 a 17:30 (10-nov-2026 y 1-dic-2026). Verano 2027 todavía no se vende.
//  - Panteón: direzionemuseiroma.cultura.gov.it/en/pantheon/, franjas cada hora de 09:00 a 17:00.
//  - Galería Borghese: galleriaborghese.cultura.gov.it/en/visita/, turnos a las 9, 10… 17 h y 17:45 (visita de 2 h; 1 h 15 el de las 17:45).
//  - Free Tour: civitatis.com/es/roma/free-tour-roma/, salidas 10:00 y 17:00 (no 16:00 como decían nuestros datos).
//  - Coliseo: colosseo.it no publica las franjas (ni el vendedor, protegido): se mide con una MALLA SUPUESTA cada 30 min, de 08:30 a la última entrada.
const everyMinutes = (from, to, step) => {
  const list = []
  for (let m = from; m <= to; m += step) list.push(m)
  return list
}
const GROUPS = {
  coliseo: {
    A: ['Coliseo', 'Arco de Constantino', 'Foro Romano y Palatino', 'Plaza del Campidoglio', 'Plaza Venecia', 'Altar de la Patria'],
    B: ['Altar de la Patria', 'Plaza Venecia', 'Plaza del Campidoglio', 'Foro Romano y Palatino', 'Arco de Constantino', 'Coliseo'],
  },
  vaticano: {
    A: ['Museos Vaticanos y Capilla Sixtina', 'Basílica de San Pedro', 'Cúpula de San Pedro', 'Plaza de San Pedro', 'Via della Conciliazione', "Puente Sant'Angelo", "Castillo de Sant'Angelo"],
    B: ['Basílica de San Pedro', 'Cúpula de San Pedro', 'Plaza de San Pedro', 'Museos Vaticanos y Capilla Sixtina', 'Via della Conciliazione', "Puente Sant'Angelo", "Castillo de Sant'Angelo"],
  },
  panteon: { A: ['Panteón'], B: ['Panteón'] },
  borghese: { A: ['Galería Borghese', 'Parque de Villa Borghese', 'Terraza del Pincio', 'Jardines del Pincio', 'Piazza del Popolo'], B: ['Galería Borghese', 'Parque de Villa Borghese', 'Terraza del Pincio', 'Jardines del Pincio', 'Piazza del Popolo'] },
}
const SITES = {
  coliseo: { label: 'Coliseo (Coliseo, Foro y Palatino)', stop: 'Coliseo', visit: () => 85, slots: (last) => everyMinutes(8 * 60 + 30, last ?? 15 * 60 + 30, 30), slotsNote: 'malla supuesta cada 30 min (la web no publica las franjas)' },
  vaticano: { label: 'Museos Vaticanos', stop: 'Museos Vaticanos y Capilla Sixtina', visit: () => 180, slots: (last) => everyMinutes(8 * 60, Math.min(last ?? 17.5 * 60, 17.5 * 60), 30), slotsNote: 'cada 30 min de 08:00 a 17:30 (web de venta oficial)' },
  panteon: { label: 'Panteón', stop: 'Panteón', visit: () => 30, slots: () => everyMinutes(9 * 60, 17 * 60, 60), slotsNote: 'cada hora de 09:00 a 17:00 (web oficial)' },
  borghese: { label: 'Galería Borghese', stop: 'Galería Borghese', visit: (t) => (t >= 17 * 60 + 45 ? 75 : 120), slots: () => [...everyMinutes(9 * 60, 17 * 60, 60), 17 * 60 + 45], slotsNote: 'turnos a las horas en punto y 17:45 (web oficial)' },
}
const FREE_TOUR = { label: 'Free Tour', hours: [10 * 60, 17 * 60], minutes: 150, start: [41.9058, 12.4823], end: [41.8992, 12.473], covers: ['Plaza de España', 'Via Condotti', 'Fontana de Trevi', 'Iglesia de San Ignacio de Loyola', 'Piazza Navona'] }
const ARRIVE_BEFORE = 30
// El día empieza a las 8:30, como los que monta el motor; solo una reserva más temprana lo adelanta (llegando 30 min antes).
const USUAL_START = 8 * 60 + 30
const DAY_START_FLOOR = USUAL_START
const WALK_MIN = 10

// ── De un día del motor a lo que usa la simulación ───────────────────────────────────────────────────────────────────────────
// Clases (los niveles de la propuesta): ancla (atardecer, nocturna, cena: su hora no se mueve), joya, imprescindible, si_entra, paseo, opcional,
// paso (de camino), normal (una parada con nombre que la propuesta no clasifica), comida.
const TIER_OVERRIDE = { "Castillo de Sant'Angelo": 'imprescindible', Trastevere: 'imprescindible', 'Plaza del Campidoglio': 'si_entra' }
function classOf(stop, place) {
  // El Free Tour que el viajero ya eligió en el formulario sale a una hora fija, como una reserva.
  if (/^Free Tour/i.test(String(stop.name))) return 'ancla'
  if (stop.sunset_minutes != null || stop.is_night_experience || stop.night_view || stop.after_dinner) return 'ancla'
  const tier = TIER_OVERRIDE[place?.name] ?? place?.tier
  if (tier === 'joya' || tier === 'imprescindible' || tier === 'si_entra') return tier
  if (stop.is_optional) return 'opcional'
  if (stop.is_free_walk) return 'paseo'
  if (stop.pass_through) return 'paso'
  return 'normal'
}
function sessionsOf(place, weekday, dateIso, visitMode) {
  if (!place || visitMode === 'fuera') return [{ open: 0, close: 1440 }]
  const windows = placeWindows(place, { weekday, dateIso })
  const sessions = windows ? parseHoursSessions(windows.join(', ')) : []
  return sessions.length > 0 ? sessions : [{ open: 0, close: 1440 }]
}
let idCounter = 0
function modelDay(day, dateIso) {
  const weekday = weekdayOf(dateIso)
  const hours = { weekday, dateIso, season: seasonKey(null, dateIso) }
  const events = [
    ...(day.stops ?? []).map((stop) => ({ t: t2m(stop.suggested_time), kind: 'stop', stop })),
    ...(day.meals ?? []).map((meal) => ({ t: t2m(meal.suggested_time), kind: 'meal', meal })),
  ].filter((event) => event.t != null).sort((a, b) => a.t - b.t)
  const items = []
  let previous = null
  for (const event of events) {
    let item
    if (event.kind === 'stop') {
      const stop = event.stop
      const name = String(stop.name).replace(/ \(noche\)$/, '')
      const place = placeByName.get(name) ?? null
      const cls = classOf(stop, place)
      const visit = cls === 'ancla' || stop.pass_through ? 'fuera' : stop.visit_mode
      const sessions = sessionsOf(place, weekday, dateIso, visit)
      const tier = place ? TIER_OVERRIDE[place.name] ?? place.tier : null
      item = {
        id: ++idCounter, kind: 'stop', name: stop.name, baseName: name, place, cls, dur: stop.duration_minutes ?? 30, baseDur: stop.duration_minutes ?? 30,
        coords: Number.isFinite(stop.latitude) ? [stop.latitude, stop.longitude] : null, base0: event.t, sessions, visit,
        lastEntry: place && visit !== 'fuera' ? lastEntryMinutes(place, event.t, hours) : null,
        anchorAt: cls === 'ancla' ? event.t : null,
        // (El mirador del atardecer llega de 15 a 35 min antes del sol: la elástica del motor. Holgura de ±10 sobre su hora.)
        anchorTol: stop.sunset_minutes != null ? 10 : 0,
        grid: place?.name === 'Galería Borghese' ? SITES.borghese.slots() : null,
        short: tier === 'imprescindible' && cls === 'imprescindible' ? Math.min(stop.duration_minutes ?? 30, place?.minutos_fuera ?? 15) : null,
        walkMin: cls === 'paseo' ? Math.min(WALK_MIN, stop.duration_minutes ?? WALK_MIN) : null,
      }
      // Cambio 1 del usuario (2-oct): el Castillo de Sant'Angelo es solo por fuera, 20 min, todos los días (su cierre de los lunes no bloquea nada).
      if (item.baseName === "Castillo de Sant'Angelo") Object.assign(item, { visit: 'fuera', dur: 20, baseDur: 20, sessions: [{ open: 0, close: 1440 }], lastEntry: null, short: null, grid: null })
    } else {
      const meal = event.meal
      const lunch = meal.time === 'lunch'
      if (lunch) continue
      item = {
        id: ++idCounter, kind: 'meal', name: lunch ? 'Comida' : 'Cena', cls: lunch ? 'comida' : 'ancla', dur: lunch ? 60 : 90, baseDur: lunch ? 60 : 90, minDur: lunch ? 45 : 90,
        coords: Number.isFinite(meal.latitude) ? [meal.latitude, meal.longitude] : null, base0: event.t, sessions: [{ open: 0, close: 1440 }],
        anchorAt: lunch ? null : event.t, lunchWindow: lunch ? [12 * 60, 15 * 60 + 30] : null,
      }
    }
    // El paseo entre dos paradas contiguas: como mucho el que dejó el motor (el taxi o el metro que ya contaba).
    item.baseLeg = previous && previous.coords && item.coords ? Math.max(0, item.base0 - (previous.base0 + previous.baseDur)) : null
    items.push(item)
    previous = item
  }
  return { items, weekday, dateIso, hours, curated: day.curated_day ? `${day.curated_day.id}${day.curated_day.variants?.length ? ' ' + day.curated_day.variants.join('+') : ''}` : 'otro', night: false }
}

// ── El programador: dado un orden, ¿cabe? (las esperas valen: se llega y se espera a que abra) ────────────────────────────
// Lo que mira: cada visita dentro de un horario de apertura y antes de la última entrada; lo anclado en su hora; lo reservado en su hora con la
// parada de antes terminada 30 min antes (y el paseo); la comida en su franja; el día entre su principio y su fin.
const adjacentLeg = (a, b) => legBetween(a.endCoords ?? a.coords, b.coords)
const LUNCH = { dur: 60, earliest: 12 * 60 + 15, latestStart: 15 * 60 + 30, wantFrom: 12 * 60 + 45 }
function schedule(seq, bounds, round = bounds.round ?? null) {
  const lunch = bounds.lunch === null ? null : (bounds.lunch ?? LUNCH)
  let lunchPlaced = !lunch
  let lunchAt = null
  let prev = null
  let prevEnd = bounds.dayStart
  const starts = []
  const legOf = (a, b) => (a.baseNext === b.id ? Math.min(adjacentLeg(a, b), a.baseNextGap) : adjacentLeg(a, b))
  for (const item of seq) {
    const leg = prev ? legOf(prev, item) : 0
    let arrival = prev ? prevEnd + leg : bounds.dayStart
    // La comida: antes de la primera parada a la que se llega ya pasadas las 12:45 (o que cruzaría las 14:45), si después cabe lo anclado o reservado.
    if (!lunchPlaced && arrival >= lunch.earliest) {
      const want = arrival >= lunch.wantFrom || arrival + item.dur > lunch.latestStart
      const ls = Math.max(arrival, lunch.earliest)
      if (want && ls <= lunch.latestStart) {
        const after = ls + lunch.dur + (prev ? leg : 0)
        const limit = item.reservedAt != null ? item.reservedAt - ARRIVE_BEFORE : item.anchorAt != null ? item.anchorAt + (item.anchorTol ?? 0) : Infinity
        if (after <= limit) {
          lunchPlaced = true
          lunchAt = ls
          arrival = after
        }
      }
    }
    let s
    if (item.reservedAt != null) {
      if (arrival > item.reservedAt - ARRIVE_BEFORE) return { ok: false, why: 'llegada_a_la_reserva', item }
      s = item.reservedAt
    } else if (item.anchorAt != null) {
      const tol = item.anchorTol ?? 0
      if (arrival > item.anchorAt + tol) return { ok: false, why: 'ancla', item }
      s = Math.max(arrival, item.anchorAt - tol)
    } else {
      s = arrival
      for (let guard = 0; guard < 6; guard++) {
        const before = s
        const r = item.roundFn ?? round
        if (r && item.kind === 'stop') s = r(s)
        if (item.grid) {
          const slot = item.grid.find((g) => g >= s)
          if (slot == null) return { ok: false, why: 'horario', item }
          s = slot
        }
        const session = item.sessions.find((x) => s >= x.open - 0 && s + item.dur <= x.close)
        if (!session) {
          const next = item.sessions.find((x) => x.open > s && x.open + item.dur <= x.close)
          if (!next) return { ok: false, why: 'horario', item }
          s = next.open
        }
        if (s === before) break
      }
      if (item.lastEntry != null && item.visit !== 'fuera' && s > item.lastEntry) return { ok: false, why: 'horario', item }
    }
    // (Lo anclado y lo reservado también tienen que estar abiertos: ya lo están si son exteriores; lo reservado, por construcción de la franja.)
    if (item.reservedAt != null && item.kind === 'stop' && item.visit !== 'fuera') {
      if (!item.sessions.some((x) => s >= x.open && s + item.dur <= x.close + 1)) return { ok: false, why: 'horario', item }
    }
    // La comida en una espera: si la parada tiene que esperar a que abra (o a su hora) y en ese rato cabe comer, se come ahí.
    if (!lunchPlaced) {
      const ls = Math.max(arrival, lunch.earliest)
      if (ls <= lunch.latestStart && ls + lunch.dur + (prev ? leg : 0) <= s) {
        lunchPlaced = true
        lunchAt = ls
      }
    }
    starts.push(s)
    prevEnd = s + item.dur
    prev = item
  }
  if (!lunchPlaced) {
    // Sin comida antes de ninguna parada: va al final, si el día acaba pronto; si el día no llega a las 13:00, no hace falta.
    if (prevEnd >= lunch.wantFrom && bounds.dayStart <= 14 * 60 && prevEnd <= lunch.latestStart) lunchAt = Math.max(prevEnd, lunch.earliest)
    else if (prevEnd >= lunch.wantFrom && bounds.dayStart <= 13 * 60 + 30) return { ok: false, why: 'comida', item: prev }
  }
  if (bounds.dayEnd != null && prevEnd > bounds.dayEnd) return { ok: false, why: 'fin_de_dia', item: prev }
  return { ok: true, starts, lunchAt }
}

function linkBaseline(items) {
  // Marca, en cada parada, la siguiente del motor y el hueco que le dejó (para no pedir más paseo del que ya contaba el motor).
  for (let i = 0; i < items.length - 1; i++) {
    items[i].baseNext = items[i + 1].id
    items[i].baseNextGap = items[i + 1].baseLeg ?? 0
  }
  return items
}

// ── La escalera de lo que puede tocarse ───────────────────────────────────────────────────────────────────────────────────────
// Etapas, cada una suma a la anterior. Devuelve { seq, actions } o null si no hay nada más que tocar.
const STAGES_STRICT = [
  { n: 0, label: 'nada' },
  { n: 1, label: 'encoger paseos' },
  { n: 2, label: 'quitar opcionales' },
  { n: 3, label: 'quitar paseos y paradas de paso' },
  { n: 4, label: 'quitar «si entra»' },
  { n: 5, label: 'versión corta de un imprescindible' },
]
const STAGES_BROAD = [...STAGES_STRICT, { n: 6, label: 'quitar paradas sin clasificar (nivel 2 y 3)' }]
const STAGES = STAGES_STRICT
function applyStage(seq, stage) {
  const actions = []
  const out = []
  for (const item of seq) {
    let next = item
    if (item.reservedAt == null) {
      if (stage >= 1 && item.cls === 'paseo' && item.dur > item.walkMin) {
        next = { ...item, dur: item.walkMin }
        actions.push({ tipo: 'encoger', name: item.baseName ?? item.name, de: item.dur, a: item.walkMin })
      }
      const drop =
        (stage >= 2 && item.cls === 'opcional') || (stage >= 3 && (item.cls === 'paseo' || item.cls === 'paso')) || (stage >= 4 && item.cls === 'si_entra') || (stage >= 6 && item.cls === 'normal')
      if (drop) {
        actions.push({ tipo: 'quitar', name: item.baseName ?? item.name, cls: item.cls })
        continue
      }
      if (stage >= 5 && item.cls === 'imprescindible' && item.short != null && item.short < item.dur) {
        next = { ...item, dur: item.short, visit: 'fuera', sessions: [{ open: 0, close: 1440 }], lastEntry: null, grid: null }
        actions.push({ tipo: 'corto', name: item.baseName ?? item.name, de: item.dur, a: item.short })
      }
    }
    out.push(next)
  }
  return { seq: out, actions }
}
/** Lo mínimo: de lo que se tocó, devuelve cada cosa a su sitio mientras siga cabiendo (empezando por lo más importante). */
function prune(original, tried, bounds) {
  const importance = { corto: 0, quitar: 1, encoger: 2 }
  let current = tried
  const toRestore = current.actions.map((a) => a).sort((a, b) => (importance[a.tipo] ?? 3) - (importance[b.tipo] ?? 3))
  const keep = new Set(toRestore.map((a) => a.name + a.tipo))
  const build = () => {
    const out = []
    for (const item of original) {
      const name = item.baseName ?? item.name
      let next = item
      if (item.reservedAt == null) {
        if (keep.has(name + 'quitar')) continue
        if (keep.has(name + 'corto') && item.short != null) next = { ...item, dur: item.short, visit: 'fuera', sessions: [{ open: 0, close: 1440 }], lastEntry: null, grid: null }
        else if (keep.has(name + 'encoger') && item.walkMin != null) next = { ...item, dur: item.walkMin }
      }
      out.push(next)
    }
    return out
  }
  for (const action of toRestore) {
    const key = action.name + action.tipo
    keep.delete(key)
    if (!schedule(build(), bounds).ok) keep.add(key)
  }
  const seq = build()
  return { seq, actions: tried.actions.filter((a) => keep.has(a.name + a.tipo)) }
}

// ── Las formas de ordenar el día ─────────────────────────────────────────────────────────────────────────────────────────────
/** El bloque del grupo (en un orden) metido entre el resto del día, en cada posición posible. `others` conserva su orden. */
function arrangements(items, reserved, groupNames, includeBaseline) {
  const groupSet = new Set(groupNames.A)
  const inGroup = items.filter((item) => item.kind === 'stop' && item.cls !== 'ancla' && item !== reserved && groupSet.has(item.baseName))
  const others = items.filter((item) => item !== reserved && !inGroup.includes(item))
  const orders = []
  const byName = (list) => list.map((name) => inGroup.find((item) => item.baseName === name)).filter(Boolean)
  const baselineOrder = items.filter((item) => item === reserved || inGroup.includes(item))
  const seen = new Set()
  const push = (block, label) => {
    const key = block.map((item) => item.id).join(',')
    if (seen.has(key)) return
    seen.add(key)
    orders.push({ block, label })
  }
  const withReserved = (names) => names.map((name) => (name === reserved.baseName ? reserved : inGroup.find((item) => item.baseName === name))).filter(Boolean)
  push(withReserved(groupNames.A), 'A')
  push(withReserved(groupNames.B), 'B')
  push(baselineOrder, 'tal cual')
  const list = []
  for (const order of orders) {
    // Las posiciones: el bloque entra donde no cruce las horas ancladas (cena, nocturnas): cualquier hueco de `others`.
    for (let k = 0; k <= others.length; k++) {
      const seq = [...others.slice(0, k), ...order.block, ...others.slice(k)]
      list.push({ seq, order: order.label, k })
    }
  }
  return { list, baselineSeq: includeBaseline ? items : null }
}

// ── Resolver una reserva en un día ───────────────────────────────────────────────────────────────────────────────────────────
/**
 * @param model  el día (modelDay) tal como lo monta el motor
 * @param reservedItem  el elemento reservado (ya con reservedAt y su duración)
 * @returns {{ bucket, stage, actions, why }}
 */
function solveDay(items, reservedItem, groupNames, bounds, stages = STAGES_STRICT, extra = {}) {
  const base = items.map((item) => (item.id === reservedItem.id ? reservedItem : item))
  // 1. sin tocar nada: las mismas paradas, el mismo orden y los mismos minutos; solo cambian las horas.
  const plain = schedule(base, bounds)
  if (plain.ok) return { bucket: 'sin_tocar', actions: [], starts: plain.starts, lunchAt: plain.lunchAt, seq: base }
  let worst = { ...plain, progress: plain.item ? base.indexOf(plain.item) : 0 }
  const keepWorst = (result, seq) => {
    const progress = result.item ? seq.findIndex((x) => x.id === result.item.id) : 0
    if (progress >= worst.progress) worst = { ...result, progress }
  }
  // 2. encoger o quitar, con el orden de siempre.
  for (const stage of stages.slice(1)) {
    const tried = applyStage(base, stage.n)
    if (tried.actions.length === 0) continue
    const result = schedule(tried.seq, bounds)
    if (result.ok) {
      const pruned = prune(base, tried, bounds)
      const final = schedule(pruned.seq, bounds)
      return { bucket: 'encoge_quita', stage: stage.n, actions: pruned.actions, starts: final.starts, lunchAt: final.lunchAt, seq: pruned.seq }
    }
    keepWorst(result, tried.seq)
  }
  // 3. cambiar el orden del grupo (con lo que haga falta encoger o quitar).
  const arr = arrangements(base, base.find((item) => item.id === reservedItem.id), groupNames, false)
  for (const stage of stages) {
    const feasible = []
    for (const option of arr.list) {
      const tried = stage.n === 0 ? { seq: option.seq, actions: [] } : applyStage(option.seq, stage.n)
      if (stage.n > 0 && tried.actions.length === 0) continue
      const result = schedule(tried.seq, bounds)
      if (result.ok) feasible.push({ option, tried })
      else if (stage.n >= 5) keepWorst(result, tried.seq)
    }
    if (feasible.length > 0) {
      // De todas las formas que caben, la más natural: la que menos madruga, menos huecos deja y menos toca.
      let best = null
      for (const { option, tried } of feasible) {
        const pruned = stage.n === 0 ? tried : prune(option.seq, tried, bounds)
        const final = schedule(pruned.seq, bounds)
        if (!final.ok) continue
        const score = Math.max(0, USUAL_START - final.starts[0]) * 4 + holeOf(pruned.seq, final.starts) + pruned.actions.length * 15
        if (!best || score < best.score) best = { score, option, pruned, final }
      }
      if (best) return { bucket: 'orden_o_dia', how: `orden ${best.option.order}`, stage: stage.n, actions: best.pruned.actions, starts: best.final.starts, lunchAt: best.final.lunchAt, seq: best.pruned.seq }
    }
  }
  return { bucket: 'no_cabe', why: worst.why, failItem: worst.item, ...extra }
}

// ── Construcción de los viajes ──────────────────────────────────────────────────────────────────────────────────────────────
const dayCache = new Map()
async function buildTrip(fecha, dias, ft = false, pool = [], exps = []) {
  const key = `${fecha}|${dias}|${ft}|${pool.join('+')}|${exps.join('+')}`
  if (dayCache.has(key)) return dayCache.get(key)
  const days = []
  const positive = [...(ft ? ['free_tour'] : []), ...exps]
  for (let n = 1; n <= dias; n++) {
    try {
      days.push(await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, pool, positive.length ? ['imprescindibles', ...positive] : ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' }))
    } catch {
      days.push(null)
    }
  }
  const trip = { fecha, dias, ft, pool, exps, days }
  dayCache.set(key, trip)
  if (dayCache.size > 40) dayCache.delete(dayCache.keys().next().value)
  return trip
}

// ── Lo que sale ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const results = [] // { family, site, T, fecha, dias, dayIdx, target, bucket, why, stage, actions, hole, early }
const failures = [] // fallos de la definición (de la simulación) — con uno solo, no se sigue
const appFindings = [] // lo que ya hace mal el motor de hoy
const notInRoute = new Map()
const byCurated = new Map()
const started = Date.now()

function recordFailure(kind, detail) {
  failures.push({ kind, detail })
}
/** Comprobaciones de la definición de «0 fallos» sobre un día resuelto. */
function verify(model, solved, reservedItem, bounds, label) {
  if (!solved.starts) return
  const seq = solved.seq
  const starts = solved.starts
  const present = new Set(seq.map((item) => item.id))
  for (const item of model.items) {
    // nada quitado sin aviso: lo quitado está en las acciones; un imprescindible o una joya nunca se quita
    if (!present.has(item.id) && item.id !== reservedItem.id) {
      if ((item.cls === 'joya' || item.cls === 'imprescindible') && !(solved.covered ?? []).includes(item.id)) recordFailure('quitado sin aviso', `${label}: ${item.name}`)
      if (item.cls === 'ancla') recordFailure('atardecer, cena o nocturna quitada', `${label}: ${item.name}`)
    }
  }
  seq.forEach((item, i) => {
    const s = starts[i]
    if (item.reservedAt != null && s !== item.reservedAt) recordFailure('hora fija rota', `${label}: ${item.name} a las ${hh(s)} en vez de ${hh(item.reservedAt)}`)
    if (item.anchorAt != null && (s < item.anchorAt - (item.anchorTol ?? 0) || s > item.anchorAt + (item.anchorTol ?? 0))) recordFailure('atardecer o cena movidos', `${label}: ${item.name} ${hh(s)} ≠ ${hh(item.anchorAt)}`)
    if (item.kind === 'stop' && item.visit !== 'fuera' && !item.sessions.some((x) => s >= x.open && s + item.dur <= x.close + 1)) recordFailure('sitio cerrado', `${label}: ${item.name} ${hh(s)}-${hh(s + item.dur)}`)
    if (item.kind === 'stop' && item.visit !== 'fuera' && item.lastEntry != null && s > item.lastEntry) recordFailure('después de la última entrada', `${label}: ${item.name} ${hh(s)}`)
    if (i > 0) {
      const prev = seq[i - 1]
      const leg = prev.baseNext === item.id ? Math.min(adjacentLeg(prev, item), prev.baseNextGap) : adjacentLeg(prev, item)
      if (s < starts[i - 1] + prev.dur + leg - 0.001) recordFailure('se llega después de la hora', `${label}: ${prev.name} → ${item.name}`)
      if (item.reservedAt != null && starts[i - 1] + prev.dur + leg > item.reservedAt - ARRIVE_BEFORE + 0.001) recordFailure('sin 30 min de margen antes de la reserva', `${label}: ${item.name}`)
    }
  })
}
function holeOf(seq, starts) {
  let max = 0
  for (let i = 1; i < seq.length; i++) {
    if (seq[i].kind === 'meal' || seq[i - 1].kind === 'meal') continue
    if (seq[i].anchorAt != null) continue
    const gap = starts[i] - (starts[i - 1] + seq[i - 1].dur + adjacentLeg(seq[i - 1], seq[i]))
    if (gap > max) max = gap
  }
  return max
}

/** Una reserva de un sitio con entrada a una hora T, el día `target` de un viaje. */
function reservedFits(reserved) {
  return reserved.sessions.some((x) => reserved.reservedAt >= x.open && reserved.reservedAt + reserved.dur <= x.close + 1)
}
function simulateEntry(trip, models, siteKey, T, targetIdx, stages = STAGES_STRICT, roundFn = null) {
  const site = SITES[siteKey]
  const target = models[targetIdx]
  if (!target) return null
  const homeIdx = models.findIndex((m) => m && m.items.some((item) => item.kind === 'stop' && item.cls !== 'ancla' && item.baseName === site.stop))
  if (homeIdx < 0) return { family: 'entrada', site: siteKey, T, bucket: 'fuera_de_ruta' }
  const bounds = { dayStart: Math.min(USUAL_START, T - ARRIVE_BEFORE), ...(roundFn ? { round: roundFn } : {}) }
  const group = GROUPS[siteKey]
  const label = `${trip.fecha} · ${trip.dias} d · ${site.label} ${hh(T)} · día ${targetIdx + 1}`
  const reserve = (model, item) => ({ ...item, reservedAt: T, dur: site.visit(T), anchorAt: null, visit: 'dentro', short: null, lastEntry: null, grid: null })
  // El día de la excursión no se cambia por otro (uno de los choques que pidió tener en cuenta el usuario).
  if (target.items.length === 0) return { family: 'entrada', site: siteKey, T, bucket: 'no_cabe', why: 'dia_de_excursion', target: homeIdx === targetIdx ? 'mismo' : 'otro', label }
  const sameDay = homeIdx === targetIdx
  if (sameDay) {
    const item = target.items.find((x) => x.kind === 'stop' && x.cls !== 'ancla' && x.baseName === site.stop)
    const reserved = reserve(target, item)
    if (!reservedFits(reserved)) return { family: 'entrada', site: siteKey, T, bucket: 'no_cabe', why: 'visita_no_cabe_antes_del_cierre', target: 'mismo', label }
    const solved = solveDay(linkBaseline(target.items.map((x) => ({ ...x }))), reserved, group, bounds, stages)
    return { family: 'entrada', site: siteKey, T, ...solved, target: 'mismo', label, model: target, reserved }
  }
  // Otro día: el grupo pasa entero a ese día y el día que estaba ahí ocupa su hueco (los dos tienen que abrir en su nueva fecha).
  const home = models[homeIdx]
  const homeItem = home.items.find((x) => x.kind === 'stop' && x.cls !== 'ancla' && x.baseName === site.stop)
  // El contenido del día de origen, con las horas de apertura de la fecha del día elegido (y al revés).
  const moved = remodel(home, target.dateIso)
  const displaced = remodel(target, home.dateIso)
  if (!moved || !displaced) {
    const closer = !moved ? { day: home.curated, item: closedItem(home, target.dateIso), weekday: target.weekday, role: 'grupo' } : { day: target.curated, item: closedItem(target, home.dateIso), weekday: home.weekday, role: 'desplazado' }
    return { family: 'entrada', site: siteKey, T, bucket: 'no_cabe', why: 'cierre_del_otro_dia', target: 'otro', label, cause: closer }
  }
  const displacedOk = solveFree(displaced)
  if (!displacedOk) return { family: 'entrada', site: siteKey, T, bucket: 'no_cabe', why: 'el_otro_dia_no_cabe_en_la_fecha', target: 'otro', label, cause: { day: target.curated, item: 'no cabe en esa fecha', weekday: home.weekday, role: 'desplazado' } }
  const item = moved.items.find((x) => x.kind === 'stop' && x.cls !== 'ancla' && x.baseName === site.stop)
  const reserved = reserve(moved, item)
  if (!reservedFits(reserved)) return { family: 'entrada', site: siteKey, T, bucket: 'no_cabe', why: 'visita_no_cabe_antes_del_cierre', target: 'otro', label }
  const solved = solveDay(linkBaseline(moved.items.map((x) => ({ ...x }))), reserved, group, bounds, stages)
  if (solved.bucket === 'no_cabe') return { family: 'entrada', site: siteKey, T, ...solved, target: 'otro', label }
  return { family: 'entrada', site: siteKey, T, ...solved, bucket: 'orden_o_dia', how: 'día', target: 'otro', label, model: moved, reserved }
}
/** Un sitio que, si cierra, impide que el grupo vaya a ese día: el sitio con entrada de cada grupo y las joyas. Lo demás se ve por fuera. */
const blocksGroup = (item) => item.cls === 'joya' || Object.values(SITES).some((site) => site.stop === item.baseName)
const asOutside = (item) => ({ ...item, visit: 'fuera', dur: Math.min(item.dur, item.place?.minutos_fuera ?? 15), sessions: [{ open: 0, close: 1440 }], lastEntry: null, grid: null, short: null, outsideByClosing: true })
/** El primer sitio visitado por dentro que cierra en otra fecha (para decir por qué un día no se puede cambiar). */
function closedItem(model, dateIso) {
  const weekday = weekdayOf(dateIso)
  return model.items.find((item) => item.kind === 'stop' && item.place && item.visit !== 'fuera' && blocksGroup(item) && closedOnDay(item.place, weekday, dateIso))?.name ?? null
}
/** El mismo contenido de un día, con los horarios de otra fecha; null si algo de lo que se visita por dentro cierra ese día. */
function remodel(model, dateIso) {
  const weekday = weekdayOf(dateIso)
  const hours = { weekday, dateIso, season: seasonKey(null, dateIso) }
  const items = []
  for (const item of model.items) {
    if (item.kind === 'stop' && item.place && item.visit !== 'fuera' && closedOnDay(item.place, weekday, dateIso)) {
      // Cambio 2 del usuario: si cierra el sitio con entrada o una joya, el grupo no va a ese día; si cierra otra parada, el grupo va igual y esa se ve por fuera.
      if (blocksGroup(item)) return null
      items.push(asOutside(item))
      continue
    }
    items.push(item.kind === 'stop' ? { ...item, sessions: sessionsOf(item.place, weekday, dateIso, item.visit), lastEntry: item.place && item.visit !== 'fuera' ? lastEntryMinutes(item.place, item.base0, hours) : null } : { ...item })
  }
  return { ...model, items, dateIso, weekday, hours }
}
/** ¿Cabe el día tal cual está (sin reserva) en su fecha, con lo que se permite tocar sin quitar imprescindibles? */
function solveFree(model, bounds = { dayStart: DAY_START_FLOOR }, stages = STAGES_STRICT) {
  const items = linkBaseline(model.items.map((x) => ({ ...x })))
  if (schedule(items, bounds).ok) return true
  for (const stage of stages.slice(1)) {
    const tried = applyStage(items, stage.n)
    if (tried.actions.length === 0) continue
    if (schedule(tried.seq, bounds).ok) return true
  }
  return false
}


// ── Free Tour como una reserva más ──────────────────────────────────────────────────────────────────────────────────────────
function simulateFT(trip, models, T, targetIdx, stages = STAGES_STRICT) {
  const target = models[targetIdx]
  if (!target) return null
  if (target.items.length === 0) return { family: 'ft', site: 'ft', T, bucket: 'no_cabe', why: 'dia_de_excursion', target: 'mismo' }
  const covers = new Set(FREE_TOUR.covers)
  const coveredIds = target.items.filter((x) => x.kind === 'stop' && covers.has(x.baseName) && x.cls !== 'ancla').map((x) => x.id)
  const ft = {
    id: ++idCounter, kind: 'stop', name: 'Free Tour', baseName: 'Free Tour', cls: 'reservado', dur: FREE_TOUR.minutes, baseDur: FREE_TOUR.minutes, coords: FREE_TOUR.start, endCoords: FREE_TOUR.end,
    reservedAt: T, sessions: [{ open: 0, close: 1440 }], visit: 'fuera', base0: T,
  }
  const firstCovered = target.items.findIndex((x) => coveredIds.includes(x.id))
  const rest = target.items.filter((x) => !coveredIds.includes(x.id)).map((x) => ({ ...x }))
  const anchorsAt = rest.findIndex((x) => x.anchorAt != null)
  let position = firstCovered >= 0 ? target.items.slice(0, firstCovered).filter((x) => !coveredIds.includes(x.id)).length : anchorsAt >= 0 ? anchorsAt : rest.length
  position = Math.min(position, rest.length)
  const base = [...rest.slice(0, position), ft, ...rest.slice(position)]
  const bounds = { dayStart: Math.min(USUAL_START, T - ARRIVE_BEFORE) }
  const solved = solveDay(linkBaseline(base), ft, { A: ['Free Tour'], B: ['Free Tour'] }, bounds, stages)
  const label = `${trip.fecha} · ${trip.dias} d · Free Tour ${hh(T)} · día ${targetIdx + 1}`
  return { family: 'ft', site: 'ft', T, ...solved, covered: coveredIds, label, model: target, reserved: ft, coveredCount: coveredIds.length, target: 'mismo' }
}

// ── Los vuelos: la llegada y la salida como horas fijas ──────────────────────────────────────────────────────────────────────
const FLIGHT_CENTER_MIN = 60 // del aeropuerto (Fiumicino) al centro: _llegada.json, al_centro_min
const FLIGHT_LEAVE_BEFORE = 180 // salir de la ciudad antes del vuelo: _llegada.json, salir_antes_min
/** Salida: lo anclado (atardecer, nocturnas, cena) que cae después de dejar la ciudad se quita, con su aviso: ese rato ya no existe. */
function truncateForDeparture(items, dayEnd) {
  const dropped = []
  const kept = items.filter((x) => {
    if (x.anchorAt != null && x.anchorAt + x.dur > dayEnd) {
      dropped.push({ tipo: 'quitar', name: x.baseName ?? x.name, cls: 'anclado después de salir hacia el aeropuerto' })
      return false
    }
    return true
  })
  return { kept, dropped }
}
function simulateFlight(trip, models, kind, H, stages = STAGES_STRICT) {
  const idx = kind === 'llegada' ? 0 : models.length - 1
  const model = models[idx]
  if (!model) return null
  const bounds = kind === 'llegada' ? { dayStart: H * 60 + FLIGHT_CENTER_MIN } : { dayStart: DAY_START_FLOOR, dayEnd: H * 60 - FLIGHT_LEAVE_BEFORE }
  const prep = kind === 'salida' ? truncateForDeparture(model.items, bounds.dayEnd) : { kept: model.items, dropped: [] }
  const items = linkBaseline(prep.kept.map((x) => ({ ...x })))
  const plain = schedule(items, bounds)
  if (plain.ok) return { family: 'vuelo', kind, H, bucket: prep.dropped.length > 0 ? 'encoge_quita' : 'sin_tocar', actions: prep.dropped, model }
  let worst = { ...plain, progress: plain.item ? items.indexOf(plain.item) : 0 }
  for (const stage of stages.slice(1)) {
    const tried = applyStage(items, stage.n)
    if (tried.actions.length === 0) continue
    const result = schedule(tried.seq, bounds)
    if (result.ok) {
      const pruned = prune(items, tried, bounds)
      return { family: 'vuelo', kind, H, bucket: 'encoge_quita', stage: stage.n, actions: [...prep.dropped, ...pruned.actions], model }
    }
    const progress = result.item ? tried.seq.findIndex((x) => x.id === result.item.id) : 0
    if (progress >= worst.progress) worst = { ...result, progress }
  }
  // El grupo (el día entero) pasa a otro día y ese día ocupa su sitio: los dos tienen que abrir en su nueva fecha.
  for (let j = 0; j < models.length; j++) {
    if (j === idx || !models[j] || models[j].items.length === 0) continue
    const moved = remodel(models[j], model.dateIso)
    const displaced = remodel(model, models[j].dateIso)
    if (!moved || !displaced) continue
    const movedFit = kind === 'salida' ? { ...moved, items: truncateForDeparture(moved.items, bounds.dayEnd).kept } : moved
    if (solveFree(movedFit, bounds, stages) && solveFree(displaced, { dayStart: DAY_START_FLOOR }, stages)) return { family: 'vuelo', kind, H, bucket: 'orden_o_dia', how: `día ${j + 1}`, model }
  }
  return { family: 'vuelo', kind, H, bucket: 'no_cabe', why: worst.why, failItem: worst.item, model }
}

// ── Horas de 10 en 10, a la más cercana (cambio 3 del usuario) ────────────────────────────────────────────────────────────────
// 11:32 → 11:30, 11:38 → 11:40, 11:35 → 11:40. Las horas fijas (entradas, atardecer, recogidas, cena) mantienen su hora real y las paradas pegadas
// (menos de 200 m) van seguidas, sin redondear: llevan el mismo hueco que tenían. El motor sigue calculando con los minutos exactos; lo que se
// redondea es la hora que se enseña, y la visita dura lo que cuadra hasta la siguiente. Se mide:
//   - cuántos minutos se mueve cada hora (media) y cuántos minutos se le quitan a las visitas al día;
//   - cuántos días / casos dejan de caber DE VERDAD: una hora enseñada fuera del horario del sitio (antes de abrir o después de la última entrada)
//     o una apertura que no cae en un múltiplo de 10 (la tarjeta tendría que enseñar :05 o :15);
//   - y, aparte, lo que cuesta: días con alguna visita enseñada más de 5 min (y un cuarto) más corta de lo que dura.
const nearest10 = (m) => Math.round(m / 10) * 10
const CHAIN_METERS = 200
function roundedView(seq, starts) {
  const shown = []
  let forcedOdd = 0
  const chained = (i) => {
    const a = seq[i - 1]
    const b = seq[i]
    if (!a || !b || !a.coords || !b.coords) return false
    return straightLineMeters(a.endCoords ?? a.coords, b.coords) < CHAIN_METERS
  }
  seq.forEach((item, i) => {
    const fixed = item.anchorAt != null || item.reservedAt != null
    let d
    if (fixed) d = starts[i]
    else if (i > 0 && chained(i)) d = shown[i - 1] + (starts[i] - starts[i - 1])
    else {
      d = nearest10(starts[i])
      // Nunca se recorta una visita más de 5 min: si al redondear la visita de antes se queda corta, esta hora sube a la siguiente decena.
      const before = seq[i - 1]
      if (before) for (let guard = 0; guard < 2; guard++) {
        const room = d - adjacentLeg(before, item) - shown[i - 1]
        if (before.dur - room > 5) d += 10
        else break
      }
      // (Y si lo que viene después es una hora fija, esta no sube más de lo que deja la visita sin recortarse más de 5 min.)
      const after = seq[i + 1]
      if (after && (after.anchorAt != null || after.reservedAt != null)) {
        const latest = starts[i + 1] - adjacentLeg(item, after) - item.dur + 5
        if (d > latest) d = Math.max(Math.floor(latest / 10) * 10, nearest10(starts[i]) - 10)
      }
    }
    // Nunca antes de que abra: si abre a una hora que no es múltiplo de 10, la tarjeta no puede ser redonda.
    if (!fixed && item.kind === 'stop' && item.visit !== 'fuera') {
      const session = item.sessions.find((x) => starts[i] >= x.open && starts[i] + item.dur <= x.close)
      if (session && d < session.open) {
        d = session.open
        if (d % 10 !== 0) forcedOdd++
      }
    }
    shown.push(d)
  })
  let moved = 0
  let later = 0
  let counted = 0
  let cutTotal = 0
  let longCut = 0
  let window = 0
  seq.forEach((item, i) => {
    if (item.anchorAt == null && item.reservedAt == null) {
      moved += Math.abs(shown[i] - starts[i])
      later += Math.max(0, shown[i] - starts[i])
      counted++
    }
    const next = seq[i + 1]
    if (next) {
      const available = shown[i + 1] - adjacentLeg(item, next) - shown[i]
      const cut = Math.max(0, item.dur - available)
      cutTotal += cut
      if (cut > Math.max(5, item.dur * 0.25)) longCut++
    }
    if (item.kind === 'stop' && item.visit !== 'fuera') {
      if (item.lastEntry != null && shown[i] > item.lastEntry) window++
      if (!item.sessions.some((x) => shown[i] >= x.open && shown[i] <= x.close)) window++
    }
  })
  return { moved: counted ? moved / counted : 0, later, cutTotal, fails: { corte: longCut, horario: window, abre_a_media_hora: forcedOdd }, ok: window + forcedOdd === 0, soft: longCut > 0 }
}
// ── Principal ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Los 56 viajes de las revisiones (revision20.mjs: 26 rutas; revisionCierre.mjs: 30 viajes), leídos de sus scripts. */
function trips56() {
  const r20 = readFileSync(new URL('./revision20.mjs', import.meta.url), 'utf8')
  const cierre = readFileSync(new URL('./revisionCierre.mjs', import.meta.url), 'utf8')
  const grab = (text, marker) => {
    const from = text.indexOf(marker) + marker.length
    const open = text.indexOf('[', from)
    const end = text.indexOf('\n]', open)
    return text.slice(open, end + 2)
  }
  const lista20 = new Function('return ' + grab(r20, 'const VIAJES = globalThis.__REVISION_VIAJES ??'))()
  const V = (dias, ft, fecha, exps = []) => ({ dias, ft, exps, fecha })
  const listaCierre = new Function('V', 'return ' + grab(cierre, 'globalThis.__REVISION_VIAJES ='))(V)
  return [...lista20, ...listaCierre]
}
const modelsOf = (trip) => trip.days.map((day, i) => (day ? modelDay(day, addDays(trip.fecha, i)) : null))
function slotsFor(siteKey, dateIso) {
  const site = SITES[siteKey]
  const place = placeByName.get(site.stop)
  const weekday = weekdayOf(dateIso)
  if (closedOnDay(place, weekday, dateIso)) return { closed: true, slots: [] }
  const hours = { weekday, dateIso, season: seasonKey(null, dateIso) }
  const windows = placeWindows(place, hours)
  const sessions = windows ? parseHoursSessions(windows.join(', ')) : []
  const last = lastEntryMinutes(place, 12 * 60, hours)
  const slots = site.slots(last).filter((T) => sessions.some((x) => T >= x.open && T <= x.close) && (last == null || T <= last))
  // Panteón: una franja con la que ni siquiera cabe la visita de 30 min antes del cierre (o de la misa) no se vende.
  return { closed: false, slots: siteKey === 'panteon' ? slots.filter((T) => sessions.some((x) => T >= x.open && T + site.visit(T) <= x.close)) : slots }
}

// Festivos italianos de 2027 (Pascua: 28 de marzo): misa de domingo en el Panteón; sus vísperas, misa de sábado.
const HOLIDAYS_2027 = new Set(['2027-01-01', '2027-01-06', '2027-03-28', '2027-03-29', '2027-04-25', '2027-05-01', '2027-06-02', '2027-08-15', '2027-11-01', '2027-12-08', '2027-12-25', '2027-12-26'])
const BUCKET_RANK = { sin_tocar: 0, encoge_quita: 1, orden_o_dia: 2, no_cabe: 3 }
const tally = (map, key) => map.set(key, (map.get(key) ?? 0) + 1)
const byWeekday = {}
const agg = {} // agg[site][T][target][bucket]
const aggBroad = {}
const reasons = {}
const round10 = { days: 0, bad: 0, soft: 0, moved: [], later: [], cut: [], why: { horario: 0, abre_a_media_hora: 0 } }
const round10Fit = {}
const flightAgg = {}
const flightReasons = {}
const extras = { madrugon: 0, hueco: 0, cabe: 0, corto: 0, quitado: new Map(), fuera_de_ruta: new Map(), cierre: 0 }
const failCurated = new Map()
const failOther = new Map()
const idle = {}
const fidelity = { days: 0, ok: 0, byReason: new Map(), exampleBad: [] }
const todayFindings = new Map()
const bump = (obj, ...path) => {
  let node = obj
  for (const key of path.slice(0, -1)) node = node[key] ??= {}
  const last = path.at(-1)
  node[last] = (node[last] ?? 0) + 1
}
function addToday(tipo, detail) {
  const entry = todayFindings.get(tipo) ?? { n: 0, examples: [] }
  entry.n++
  if (entry.examples.length < 6) entry.examples.push(detail)
  todayFindings.set(tipo, entry)
}
function aggregate(res, broadRes) {
  const { site, T, target } = res
  bump(agg, site, T, target ?? 'mismo', res.bucket)
  if (res.bucket === 'no_cabe') {
    reasons[site] ??= new Map()
    tally(reasons[site], res.why ?? '?')
    bump(aggBroad, site, T, target ?? 'mismo', broadRes && broadRes.bucket !== 'no_cabe' ? 'cabe_ampliado' : 'no_cabe')
  }
}

async function main() {
  const starts = Array.from({ length: 365 }, (_, i) => addDays(`${YEAR}-01-01`, i)).filter((_, i) => i % STEP === 0)
  let trips = 0
  let scenarios = 0
  const grid = TRIPS56 ? trips56() : starts.flatMap((fecha) => LENGTHS.map((dias) => ({ fecha, dias, ft: false, pool: [], exps: [] })))
  for (const spec of grid) {
    {
      const { fecha, dias } = spec
      const trip = await buildTrip(fecha, dias, spec.ft ?? false, spec.pool ?? [], spec.exps ?? [])
      const models = modelsOf(trip)
      trips++
      // 0. Lo que ya hace hoy el motor, sin ninguna reserva.
      models.forEach((model) => {
        if (!model) return
        fidelity.days++
        const bounds = { dayStart: Math.min(DAY_START_FLOOR, model.items[0]?.base0 ?? DAY_START_FLOOR) }
        const result = schedule(linkBaseline(model.items.map((x) => ({ ...x }))), bounds)
        if (result.ok) fidelity.ok++
        else {
          tally(fidelity.byReason, result.why)
          if (fidelity.exampleBad.length < 8) fidelity.exampleBad.push(`${model.dateIso} (${model.curated}): ${result.why} en ${result.item?.name}`)
        }
        for (const item of model.items) {
          if (item.kind !== 'stop' || !item.place) continue
          if (item.visit !== 'fuera' && closedOnDay(item.place, model.weekday, model.dateIso)) addToday('Visita por dentro de un sitio cerrado ese día', `${model.dateIso} (${model.weekday}): ${item.name} a las ${hh(item.base0)}`)
          if (item.baseName === 'Panteón' && item.visit !== 'fuera') {
            const inside = item.sessions.some((x) => item.base0 >= x.open && item.base0 + item.dur <= x.close)
            if (!inside) addToday('Panteón por dentro en horario de misa o cerrado', `${model.dateIso} (${model.weekday}): ${hh(item.base0)}-${hh(item.base0 + item.dur)}, horario ${item.sessions.map((x) => hh(x.open) + '-' + hh(x.close)).join(' y ')}`)
            if (model.dateIso.slice(5) === '01-01') addToday('Panteón por dentro el 1 de enero (cerrado)', `${model.dateIso}`)
            // Misa según la web: sábados y vísperas de festivo a las 17:00 (venta cortada a las 16:00); domingos y festivos a las 10:30 (venta cortada a las 09:30; vuelve a abrir ~11:45).
            const end = item.base0 + item.dur
            const sunday = model.weekday === 'domingo' || HOLIDAYS_2027.has(model.dateIso)
            const saturday = model.weekday === 'sábado' || HOLIDAYS_2027.has(addDays(model.dateIso, 1))
            if (sunday && item.base0 < 11 * 60 + 45 && end > 9 * 60 + 30) addToday('Panteón por dentro durante la misa de domingo o festivo', `${model.dateIso} (${model.weekday}): ${hh(item.base0)}-${hh(end)}`)
            if (saturday && !sunday && end > 16 * 60) addToday('Panteón por dentro en la misa de sábado o víspera de festivo', `${model.dateIso} (${model.weekday}): ${hh(item.base0)}-${hh(end)}`)
          }
        }
        // Las horas de 10 en 10 sobre el día tal como está.
        if (model.items.filter((x) => x.kind === 'stop').length >= 4) {
          const items = linkBaseline(model.items.map((x) => ({ ...x })))
          const exact = schedule(items, { dayStart: model.items[0].base0 })
          if (exact.ok) {
            const view = roundedView(items, exact.starts)
            round10.days++
            round10.moved.push(view.moved)
            round10.later.push(view.later)
            round10.cut.push(view.cutTotal)
            if (!view.ok) round10.bad++
            if (view.soft) round10.soft++
            for (const [k, v] of Object.entries(view.fails)) if (v > 0 && k !== 'corte') round10.why[k]++
          }
        }
      })
      // Lo que hay hoy alrededor de cada sitio con entrada (huecos y paseos), una vez por día que lo lleva.
      for (const [siteKey, site] of Object.entries(SITES)) {
        models.forEach((model) => {
          const at = model?.items.findIndex((x) => x.kind === 'stop' && x.cls !== 'ancla' && x.baseName === site.stop)
          if (at == null || at < 0) return
          const before = model.items.slice(0, at)
          const after = model.items.slice(at + 1)
          const free = (list) => list.filter((x) => ['opcional', 'paseo', 'paso', 'si_entra'].includes(x.cls)).reduce((sum, x) => sum + x.dur, 0) + list.filter((x) => x.cls === 'paseo').reduce((sum, x) => sum + Math.max(0, x.dur - (x.walkMin ?? x.dur)), 0)
          const gapBefore = at > 0 ? Math.max(0, model.items[at].base0 - (model.items[at - 1].base0 + model.items[at - 1].baseDur)) - (model.items[at].baseLeg ?? 0) : null
          const nextItem = model.items[at + 1]
          const gapAfter = nextItem ? Math.max(0, nextItem.base0 - (model.items[at].base0 + model.items[at].baseDur)) - (nextItem.baseLeg ?? 0) : null
          const record = (idle[siteKey] ??= { days: 0, paseoBefore: [], paseoAfter: [], gapBefore: [], gapAfter: [] })
          record.days++
          record.paseoBefore.push(free(before))
          record.paseoAfter.push(free(after))
          if (gapBefore != null) record.gapBefore.push(Math.max(0, gapBefore))
          if (gapAfter != null) record.gapAfter.push(Math.max(0, gapAfter))
        })
      }
      // 1. Las entradas: cada franja real, cada día del viaje.
      for (const [siteKey, site] of Object.entries(SITES)) {
        const home = models.findIndex((m) => m && m.items.some((x) => x.kind === 'stop' && x.cls !== 'ancla' && x.baseName === site.stop))
        for (let d = 0; d < models.length; d++) {
          if (!models[d]) continue
          const { closed, slots } = slotsFor(siteKey, models[d].dateIso)
          if (closed) {
            extras.cierre++
            continue
          }
          for (const T of slots) {
            scenarios++
            const res = simulateEntry(trip, models, siteKey, T, d, STAGES_STRICT)
            if (!res) continue
            if (res.bucket === 'fuera_de_ruta') {
              tally(extras.fuera_de_ruta, siteKey)
              continue
            }
            let broadRes = null
            if (res.bucket === 'no_cabe') broadRes = simulateEntry(trip, models, siteKey, T, d, STAGES_BROAD)
            aggregate({ ...res, site: siteKey }, broadRes)
            bump(byWeekday, siteKey, models[d].weekday, res.bucket)
            if (res.bucket !== 'no_cabe') {
              verify(res.model, res, res.reserved, { dayStart: DAY_START_FLOOR }, res.label)
              extras.cabe++
              if ((res.starts?.[0] ?? 9999) < USUAL_START) extras.madrugon++
              if (res.starts && holeOf(res.seq, res.starts) > 90) extras.hueco++
              if ((res.actions ?? []).some((a) => a.tipo === 'corto')) extras.corto++
              for (const a of res.actions ?? []) tally(extras.quitado, `${a.tipo}: ${a.name}`)
              if (res.seq && res.starts) {
                const view = roundedView(res.seq, res.starts)
                const entry = (round10Fit[siteKey] ??= { checked: 0, stop: 0, soft: 0, why: { horario: 0, abre_a_media_hora: 0 } })
                entry.checked++
                if (view.soft) entry.soft++
                if (!view.ok) {
                  entry.stop++
                  for (const [k, v] of Object.entries(view.fails)) if (v > 0 && k !== 'corte') entry.why[k]++
                }
              }
            } else if (res.target === 'mismo') {
              const key = `${models[d]?.curated ?? 'otro'}|${siteKey}`
              const rec = failCurated.get(key) ?? { n: 0, items: new Map(), whys: new Map(), hours: new Map() }
              rec.n++
              tally(rec.items, res.failItem?.name ?? '—')
              tally(rec.whys, res.why ?? '?')
              tally(rec.hours, hh(T))
              failCurated.set(key, rec)
            } else if (res.cause) {
              const key = `${res.cause.day}|${res.cause.item ?? '—'}|${res.cause.weekday}|${res.cause.role}`
              tally(failOther, key)
            }
          }
        }
      }
      // 2. El Free Tour como una reserva más, a sus dos horas reales, en cada día (en los viajes que ya lo llevan elegido no tiene sentido).
      for (let d = 0; d < (spec.ft ? 0 : models.length); d++) {
        if (!models[d]) continue
        for (const T of FREE_TOUR.hours) {
          scenarios++
          const res = simulateFT(trip, models, T, d, STAGES_STRICT)
          if (!res) continue
          let broadRes = null
          if (res.bucket === 'no_cabe') broadRes = simulateFT(trip, models, T, d, STAGES_BROAD)
          aggregate(res, broadRes)
          if (res.bucket !== 'no_cabe') {
            verify(res.model, res, res.reserved, { dayStart: DAY_START_FLOOR }, res.label)
            extras.cabe++
          }
        }
      }
      // 3. Los vuelos: llegadas y salidas a las 9, 12, 15, 18 y 21 h.
      for (const kind of ['llegada', 'salida']) {
        for (const H of [9, 12, 15, 18, 21]) {
          const res = simulateFlight(trip, models, kind, H, STAGES_STRICT)
          if (!res) continue
          bump(flightAgg, kind, H, res.bucket)
          if (res.bucket === 'no_cabe') {
            const broadRes = simulateFlight(trip, models, kind, H, STAGES_BROAD)
            flightReasons[kind] ??= new Map()
            tally(flightReasons[kind], res.why ?? '?')
            bump(flightAgg, kind, H, broadRes?.bucket === 'no_cabe' ? 'no_cabe_ampliado' : 'cabe_ampliado')
          }
        }
      }
      if (trips % 25 === 0) process.stderr.write(`\r${trips} viajes · ${scenarios} casos · ${Math.round((Date.now() - started) / 1000)} s · fallos ${failures.length}   `)
      if (failures.length > 0) break
    }
    if (failures.length > 0) break
  }
  process.stderr.write('\n')
  return { trips, scenarios, starts: TRIPS56 ? 0 : starts.length }
}

export { failOther, byWeekday, schedule, modelDay, solveDay, SITES, GROUPS, simulateEntry, simulateFT, simulateFlight, buildTrip, STAGES_STRICT, STAGES_BROAD, applyStage, round10, round10Fit, main, agg, aggBroad, reasons, flightAgg, flightReasons, extras, failCurated, idle, fidelity, todayFindings, failures, slotsFor, modelsOf, hh, pct, FREE_TOUR }
export const ARGS = { STEP, LENGTHS, YEAR, OUT, started, BROAD }

// ── El informe ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const WHY = {
  dia_de_excursion: 'Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro)',
  llegada_a_la_reserva: 'Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben)',
  ancla: 'Se pisa con el atardecer, la cena o la nocturna',
  comida: 'No queda sitio para comer (entre las 12:15 y las 15:30)',
  horario: 'Algo del día cae en un horario cerrado (o pasada la última entrada)',
  visita_no_cabe_antes_del_cierre: 'La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada',
  cierre_del_otro_dia: 'El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…)',
  el_otro_dia_no_cabe_en_la_fecha: 'El día que cedería su hueco no cabe en esa fecha',
  fin_de_dia: 'No cabe antes de salir hacia el aeropuerto',
}
const BUCKETS = ['sin_tocar', 'encoge_quita', 'orden_o_dia', 'no_cabe']
const BUCKET_LABEL = { sin_tocar: 'cabe sin tocar nada', encoge_quita: 'cabe encogiendo o quitando', orden_o_dia: 'cabe cambiando el orden o el día', no_cabe: 'no cabe' }
const avg = (list) => (list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : 0)
const quantile = (list, q) => {
  if (!list.length) return 0
  const sorted = [...list].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
}
const sumBuckets = (node) => BUCKETS.reduce((acc, b) => ({ ...acc, [b]: (node?.[b] ?? 0) }), {})
const row = (cells) => `| ${cells.join(' | ')} |`

function siteTable(siteKey, label, slotsNote) {
  const lines = [`### ${label}`, '', `Franjas: ${slotsNote}.`, '', row(['Hora', 'Casos', 'mismo día: sin tocar', 'encoge o quita', 'orden', 'no cabe', 'otro día: cabe', 'no cabe', 'no cabe aun quitando lo sin clasificar']), row(Array(9).fill('---'))]
  const times = Object.keys(agg[siteKey] ?? {}).map(Number).sort((a, b) => a - b)
  for (const T of times) {
    const same = sumBuckets(agg[siteKey][T].mismo)
    const other = sumBuckets(agg[siteKey][T].otro)
    const nSame = BUCKETS.reduce((a, b) => a + same[b], 0)
    const nOther = BUCKETS.reduce((a, b) => a + other[b], 0)
    const broadSame = aggBroad[siteKey]?.[T]?.mismo?.no_cabe ?? 0
    const broadOther = aggBroad[siteKey]?.[T]?.otro?.no_cabe ?? 0
    const all = nSame + nOther
    const otherOk = other.orden_o_dia + other.sin_tocar + other.encoge_quita
    lines.push(row([hh(T), all, pct(same.sin_tocar, nSame), pct(same.encoge_quita, nSame), pct(same.orden_o_dia, nSame), pct(same.no_cabe, nSame), pct(otherOk, nOther), pct(other.no_cabe, nOther), pct(broadSame + broadOther, all)]))
  }
  const totalSame = {}
  const totalOther = {}
  for (const T of times) {
    for (const b of BUCKETS) {
      totalSame[b] = (totalSame[b] ?? 0) + (agg[siteKey][T].mismo?.[b] ?? 0)
      totalOther[b] = (totalOther[b] ?? 0) + (agg[siteKey][T].otro?.[b] ?? 0)
    }
  }
  const nS = BUCKETS.reduce((a, b) => a + (totalSame[b] ?? 0), 0)
  const nO = BUCKETS.reduce((a, b) => a + (totalOther[b] ?? 0), 0)
  const okO = (totalOther.sin_tocar ?? 0) + (totalOther.encoge_quita ?? 0) + (totalOther.orden_o_dia ?? 0)
  lines.push(row(['**Todas**', nS + nO, pct(totalSame.sin_tocar ?? 0, nS), pct(totalSame.encoge_quita ?? 0, nS), pct(totalSame.orden_o_dia ?? 0, nS), pct(totalSame.no_cabe ?? 0, nS), pct(okO, nO), pct(totalOther.no_cabe ?? 0, nO), '']))
  return lines
}

function buildReport(summary) {
  const out = []
  const seconds = Math.round((Date.now() - started) / 1000)
  out.push('# Reservas dentro de la ruta · 2 · Medir si cabe', '', `Medido el 2-oct-2026 con \`scripts/destino/medirReservas.mjs\` (solo mide: no cambia nada de la app). ${TRIPS56 ? `${summary.trips} viajes: los 26 de revision20.mjs y los 30 de revisionCierre.mjs, cada uno con su duración, su Free Tour y sus experiencias (si ya llevan Free Tour, ese no se mide como reserva)` : `${summary.trips} viajes de ${LENGTHS.join(', ')} días (salida cada ${STEP === 1 ? 'día' : STEP + ' días'} de ${YEAR}: ${summary.starts} fechas)`}, ${summary.scenarios} reservas simuladas, ${seconds} s.`, '')
  // 1. Fallos, arriba del todo
  if (failures.length > 0) {
    out.push('## 🔴 FALLOS DE LA DEFINICIÓN DE «0 FALLOS» — SE PARA AQUÍ', '')
    const byKind = new Map()
    for (const f of failures) {
      const list = byKind.get(f.kind) ?? []
      list.push(f.detail)
      byKind.set(f.kind, list)
    }
    for (const [kind, list] of byKind) out.push(`- 🔴 **${kind}**: ${list.length}. Ej.: ${list.slice(0, 4).join(' · ')}`)
    out.push('', 'No se sigue: la simulación rompió una regla de la propuesta.', '')
  } else {
    out.push('## 🟢 Fallos de la propuesta (ninguna hora fija rota, nada cerrado, nada quitado sin aviso, atardecer y cena intactos): **0**', '', `Cada caso resuelto se comprobó después con una revisión aparte (hora de la reserva, aperturas y última entrada, cena y nocturnas en su hora, 30 min de margen, ningún imprescindible quitado). Se resolvieron ${extras.cabe} casos que caben y ninguno falló la revisión.`, '')
  }
  const hoy = [...todayFindings]
  out.push('## 🔴 Lo que el motor de hoy ya hace mal (sin ninguna reserva)', '')
  if (hoy.length === 0) out.push('Nada: ni visitas por dentro de sitios cerrados ni el Panteón en misa.', '')
  for (const [tipo, entry] of hoy) out.push(`- 🔴 **${tipo}**: ${entry.n} días. Ej.: ${entry.examples.join(' · ')}`)
  out.push('', 'Misas del Panteón: el motor respeta los horarios de misa de sábado y domingo y, desde el 2-oct-2026, también los de los festivos (como un domingo) y sus vísperas (como un sábado): dato misas_festivos del Panteón y massWeekday en openingHours.js. Esta medida lo comprueba contra el calendario festivo italiano de 2027. Pendiente de decidir: el 29 de junio, festivo solo en Roma.', '')
  out.push(`Fidelidad del modelo: de ${fidelity.days} días que monta el motor, ${fidelity.ok} (${pct(fidelity.ok, fidelity.days)}) caben tal cual en la simulación. El resto: ${[...fidelity.byReason].map(([k, v]) => `${k} ${v}`).join(', ') || '—'}.`, '')
  // Lo esencial, en pocas palabras
  const totalsFor = (siteKey) => {
    const same = {}
    const other = {}
    for (const node of Object.values(agg[siteKey] ?? {})) {
      for (const b of BUCKETS) {
        same[b] = (same[b] ?? 0) + (node.mismo?.[b] ?? 0)
        other[b] = (other[b] ?? 0) + (node.otro?.[b] ?? 0)
      }
    }
    const n = (o) => BUCKETS.reduce((a, b) => a + (o[b] ?? 0), 0)
    return { same, other, nSame: n(same), nOther: n(other) }
  }
  out.push('## Lo esencial, en pocas palabras', '')
  for (const [key, site] of [...Object.entries(SITES), ['ft', { label: 'Free Tour' }]]) {
    const t = totalsFor(key)
    if (t.nSame + t.nOther === 0) continue
    const okSame = t.nSame - (t.same.no_cabe ?? 0)
    const okOther = t.nOther - (t.other.no_cabe ?? 0)
    out.push(`- **${site.label}**: con la reserva el mismo día que ya está la parada, cabe en ${pct(okSame, t.nSame)} de los casos (${pct(t.same.sin_tocar ?? 0, t.nSame)} sin tocar nada, ${pct(t.same.encoge_quita ?? 0, t.nSame)} encogiendo o quitando algo, ${pct(t.same.orden_o_dia ?? 0, t.nSame)} cambiando el orden). Con la reserva en otro día del viaje, cabe en ${t.nOther ? pct(okOther, t.nOther) : '—'}.`)
  }
  const flightLine = (kind) => [9, 12, 15, 18, 21].map((H) => { const node = flightAgg[kind]?.[H] ?? {}; const n = BUCKETS.reduce((a, b) => a + (node[b] ?? 0), 0); return `${H}:00 → ${pct(node.no_cabe ?? 0, n)}` }).join(', ')
  out.push(`- **Vuelos**, % que no cabe — llegada: ${flightLine('llegada')}. Salida: ${flightLine('salida')}.`)
  out.push(`- **Horas de 10 en 10, a la más cercana (sin recortar nunca más de 5 min)**: cuesta ${avg(round10.later)} min al día de horas enseñadas más tarde y ${avg(round10.cut)} min al día de visitas recortadas; mueve cada hora ${avg(round10.moved)} min de media; dejan de caber de verdad ${round10.bad} de ${round10.days} días (${pct(round10.bad, round10.days)}) y, entre las reservas que caben, ${Object.values(round10Fit).reduce((a, v) => a + v.stop, 0)} de ${Object.values(round10Fit).reduce((a, v) => a + v.checked, 0)} (${pct(Object.values(round10Fit).reduce((a, v) => a + v.stop, 0), Object.values(round10Fit).reduce((a, v) => a + v.checked, 0))}); el coste: ${pct(round10.soft, round10.days)} de los días llevan alguna visita enseñada más de 5 min más corta (${avg(round10.cut)} min al día en total).`)
  out.push('')
  // Fuentes
  out.push('## Las horas de entrada y de dónde salen (comprobadas el 2-oct-2026)', '',
    '| Sitio | Franjas que se miden | Fuente |', '|---|---|---|',
    '| Museos Vaticanos | cada 30 min, de 08:00 a 17:30 | tickets.museivaticani.va (10-nov-2026 y 1-dic-2026; 13-oct-2026 sin entradas a la venta; 13-jul-2027 y 9-mar-2027 todavía no se venden: la temporada alta no se puede mirar) |',
    '| Panteón | cada hora, de 09:00 a 17:00 | direzionemuseiroma.cultura.gov.it/en/pantheon (cierra por misa: sábado/vísperas 17:00, domingo/festivos 10:30; venta cortada una hora antes) |',
    '| Galería Borghese | a las horas en punto (9–17) y a las 17:45 (1 h 15) | galleriaborghese.cultura.gov.it/en/visita (martes a domingo; cierra 25 dic y 1 ene) |',
    '| Free Tour | 10:00 y 17:00 | civitatis.com/es/roma/free-tour-roma (nuestros datos decían 16:00: sin comprobar; la web dice 17:00) |',
    '| Coliseo | **malla supuesta**: cada 30 min de 08:30 a la última entrada | colosseo.it no publica las franjas y el vendedor (ticketing.colosseo.it) pide pasar un control de navegador: no lo he saltado. Si el Coliseo vende cada hora o cada 15 min, cambian los números de ese sitio |',
    '', 'Nuestros datos, además, dicen en unas notas que la Galería tiene turnos «cada 2 h» y en la ficha «cada hora»: la web oficial dice cada hora. Y a `turnos` de la Galería le falta el de las 17:45.', '')
  out.push('## Cómo se midió (reglas de la simulación)', '',
    '- Cada día es el que monta hoy el motor (v4, días escritos). Una reserva a la hora T fija ese sitio a T; la parada anterior tiene que acabar, con el paseo, 30 min antes.',
    '- Lo único que se toca, por este orden: **1** nada (solo cambian las horas) → **2** encoger paseos (a 10 min) → quitar opcionales → quitar paseos y paradas de paso → quitar «si entra» (el Campidoglio) → versión corta de un imprescindible que no es joya (de paso y por fuera, sus minutos curados) → **3** cambiar el orden del grupo (las dos maneras de la propuesta) o poner el grupo entre otras paradas → **4** si la reserva es de otro día, el grupo pasa a ese día y ese día ocupa su hueco (los dos tienen que abrir en su nueva fecha).',
    '- Del resultado se quita todo lo que sobra: se muestra lo mínimo que hizo falta.',
    '- **Niveles**: joyas e imprescindibles, como en los datos (más el Castillo y Trastevere, que la propuesta sube a imprescindibles, y el Campidoglio como «si entra»). Opcional = marcado `is_optional`; paseo = «Pasea y piérdete…»; «de paso» = paradas de 10 min sin visita. **Las demás paradas con nombre (Barrio Judío, Torre Argentina, Puente Sant\'Angelo…) la propuesta no las clasifica**: en la medida principal NO se pueden quitar. La última columna («aun quitando lo sin clasificar») dice cuántos casos se salvarían si también se pudieran quitar.',
    '- Anclas que no se mueven: el mirador del atardecer (con su holgura de ±10 min), las nocturnas y la cena. La comida (60 min) se pone entre las 12:15 y las 15:30.',
    '- **El día de la excursión** (los viajes de 5 días llevan uno) no se cambia por otro: si la reserva cae ahí, no cabe. Los días de llegada y de vuelta de esta medida son días enteros (los vuelos se miden aparte, y una reserva y un vuelo a la vez no se miden juntos). Nochebuena y Navidad entran por los cierres de cada sitio; sus avisos no se modelan.',
    '- Las visitas por dentro tienen que caber en el horario del sitio de esa fecha y entrar antes de la última entrada. Los días empiezan a las 8:30 salvo que una reserva más temprana lo adelante.',
    '- Los datos de las paradas, los horarios de cada fecha y los paseos entre paradas son los del motor (`travelTimesFor`); donde el motor ya contaba un trayecto más corto (metro, taxi), la simulación lo respeta.',
    '')
  // 2. Una tabla por sitio
  out.push('## 2. Por sitio: cada hora de entrada y el % de casos en cada resultado', '', 'Se simulan los viajes de 3, 4 y 5 días de todo el año, cada franja, **el día donde ya está la parada («mismo día») y cada otro día del viaje («otro día»)**. «Otro día»: el grupo pasa entero a ese día (o no cabe).', '')
  for (const [key, site] of Object.entries(SITES)) out.push(...siteTable(key, site.label, site.slotsNote), '')
  out.push(...siteTable('ft', 'Free Tour (como una reserva más)', 'salidas a las 10:00 y a las 17:00; el tour cubre Plaza de España, Via Condotti, Trevi, San Ignacio y Navona (esas visitas sueltas desaparecen del día porque ya se ven con el tour)'), '')
  out.push('Fuera de ruta: reservas de un sitio que el viaje no lleva (no se miden: la propuesta no dice qué pasa): ' + ([...extras.fuera_de_ruta].map(([k, v]) => `${SITES[k]?.label ?? k} ${v}`).join(', ') || 'ninguna') + '. Días con el sitio cerrado (no hay franja que reservar): ' + extras.cierre + '.', '')
  // por día de la semana
  out.push('### Por día de la semana de la reserva (% de «no cabe» sobre todas las franjas de ese día)', '', row(['Sitio', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']), row(Array(8).fill('---')))
  for (const [key, site] of Object.entries(SITES)) {
    out.push(row([site.label, ...['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((d) => {
      const node = byWeekday[key]?.[d]
      if (!node) return 'cerrado'
      const n = BUCKETS.reduce((a, b) => a + (node[b] ?? 0), 0)
      return pct(node.no_cabe ?? 0, n)
    })]))
  }
  out.push('')
  out.push(`De los ${extras.cabe} casos que caben: ${extras.madrugon} obligan a empezar antes de las 8:30 (por una reserva temprana), ${extras.hueco} dejan un hueco de más de 90 min entre dos paradas (la reserva está lejos de lo demás) y ${extras.corto} necesitan dejar un imprescindible en su versión corta.`, '')
  // 3. Vuelos
  out.push('## 3. Vuelos: llegada y salida como horas fijas', '', `Llegada: se está en el centro ${FLIGHT_CENTER_MIN} min después de aterrizar (Fiumicino, \`_llegada.json\`); el primer día empieza entonces. Salida: hay que dejar la ciudad ${FLIGHT_LEAVE_BEFORE} min antes del vuelo; el último día acaba entonces. Mismo orden de cosas que arriba; si no cabe, el día entero se cambia con otro del viaje.`, '',
    row(['', 'Hora', 'Casos', 'sin tocar', 'encoge o quita', 'cambia el día', 'no cabe', 'no cabe aun quitando lo sin clasificar']), row(Array(8).fill('---')))
  for (const kind of ['llegada', 'salida']) {
    for (const H of [9, 12, 15, 18, 21]) {
      const node = flightAgg[kind]?.[H] ?? {}
      const n = BUCKETS.reduce((a, b) => a + (node[b] ?? 0), 0)
      out.push(row([kind, `${H}:00`, n, pct(node.sin_tocar ?? 0, n), pct(node.encoge_quita ?? 0, n), pct(node.orden_o_dia ?? 0, n), pct(node.no_cabe ?? 0, n), pct(node.no_cabe_ampliado ?? 0, n)]))
    }
  }
  out.push('', 'Ojo: hoy los vuelos no pasan por el motor (los trata el cliente, `fitDayToTrip`, recortando el día sin rehacerlo). Esto mide cómo quedaría si pasaran. Con salidas a las 9:00 el último día desaparece entero (hay que dejar la ciudad a las 6:00), y con llegadas a las 21:00 el primero también: ahí «nunca se pierde un imprescindible» no se puede cumplir, y sale el aviso.', '')
  // 4. Por motivo
  out.push('## 4. Los casos que no caben, agrupados por motivo', '')
  for (const [key, site] of [...Object.entries(SITES), ['ft', { label: 'Free Tour' }]]) {
    const map = reasons[key]
    if (!map) continue
    const total = [...map.values()].reduce((a, b) => a + b, 0)
    out.push(`**${site.label}** (${total} casos): ` + [...map].sort((a, b) => b[1] - a[1]).map(([why, n]) => `${WHY[why] ?? why}: ${pct(n, total)}`).join(' · '), '')
  }
  for (const kind of ['llegada', 'salida']) {
    const map = flightReasons[kind]
    if (!map) continue
    const total = [...map.values()].reduce((a, b) => a + b, 0)
    out.push(`**Vuelo de ${kind}** (${total} casos): ` + [...map].sort((a, b) => b[1] - a[1]).map(([why, n]) => `${WHY[why] ?? why}: ${pct(n, total)}`).join(' · '), '')
  }
  // 5. Minutos de paseo hoy
  out.push('## 5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada', '', 'Mirando los días que hoy monta el motor. «Paseo recortable» = minutos de opcionales, paseos, paradas de paso y «si entra» (más lo que se puede encoger de un paseo a 10 min) que hay en ese día **antes** o **después** del sitio. «Hueco» = minutos libres entre la parada y la de al lado (sin contar el paseo): lo que midió el usuario.', '',
    row(['Sitio', 'Días con el sitio', 'Paseo recortable antes: media', 'peor día', 'después: media', 'peor día', 'Hueco antes: media', '% días con ≥15 min', 'Hueco después: media', '% días con ≥15 min']), row(Array(10).fill('---')))
  for (const [key, site] of Object.entries(SITES)) {
    const r = idle[key]
    if (!r) continue
    const ok15 = (list) => pct(list.filter((x) => x >= 15).length, list.length)
    out.push(row([site.label, r.days, avg(r.paseoBefore), Math.min(...r.paseoBefore), avg(r.paseoAfter), Math.min(...r.paseoAfter), avg(r.gapBefore), ok15(r.gapBefore), avg(r.gapAfter), ok15(r.gapAfter)]))
  }
  out.push('')
  // 6. Horas redondas
  out.push('## 6. Horas de 10 en 10, a la más cercana', '', 'La forma que pidió el usuario: a la decena más cercana (11:32 → 11:30, 11:38 → 11:40), **pero nunca se recorta una visita más de 5 min: en esos casos la hora sube a la siguiente decena**. Las horas fijas (entradas, atardecer, recogidas, cena) mantienen su hora real y las paradas pegadas (menos de 200 m) van seguidas, sin redondear. El motor sigue calculando con minutos exactos; se redondea la hora que se enseña y la visita dura lo que cuadra hasta la siguiente.', '',
    'Un caso **deja de caber de verdad** si, al redondear, una hora cae fuera del horario del sitio (antes de abrir o después de la última entrada) o un sitio abre a una hora que no es múltiplo de 10 (la tarjeta no puede ser redonda). **El coste** es otra cosa: como la visita dura lo que cuadra hasta la siguiente, al redondear a la más cercana a veces se enseña una visita unos minutos más corta; se cuentan los casos con alguna visita enseñada más de 5 min (y más de un cuarto) más corta.', '',
    row(['Sobre', 'Casos', 'Dejan de caber', 'Por qué', 'Con alguna visita recortada (coste)']), row(Array(5).fill('---')))
  out.push(row(['Días que monta hoy el motor (sin reservas)', round10.days, `${round10.bad} (${pct(round10.bad, round10.days)})`, `fuera de horario ${round10.why.horario} · abre a media hora ${round10.why.abre_a_media_hora}`, `${round10.soft} (${pct(round10.soft, round10.days)})`]))
  for (const [key, site] of Object.entries(SITES)) {
    const v = round10Fit[key]
    if (v) out.push(row([`Reservas que caben: ${site.label}`, v.checked, `${v.stop} (${pct(v.stop, v.checked)})`, `fuera de horario ${v.why.horario} · abre a media hora ${v.why.abre_a_media_hora}`, `${v.soft} (${pct(v.soft, v.checked)})`]))
  }
  out.push('', `**Lo que cuesta, en minutos al día**: cada hora enseñada se mueve ${avg(round10.moved)} min de media respecto a la real (mediana ${quantile(round10.moved, 0.5)}, p90 ${quantile(round10.moved, 0.9)}); en total, las horas enseñadas van ${avg(round10.later)} min más tarde que las reales al día (p90 ${quantile(round10.later, 0.9)}) y a las visitas se les quitan ${avg(round10.cut)} min al día en total (p90 ${quantile(round10.cut, 0.9)}). Los días que aun así llevan alguna visita recortada más de 5 min son los de la tabla (casi siempre, la que va justo antes de una hora fija).`, '')
  // 7. Qué reescribir
  out.push('## 7. Qué días de Roma reescribir, o dónde poner un paseo, para que no quede ningún «no cabe»', '')
  out.push('### 7a. Reserva el mismo día en que ya está el grupo: lo que no cabe (y no es un cierre ni una franja imposible)', '',
    'Por día escrito y sitio: cuántos casos no caben, a qué horas de entrada y qué paradas son las que lo impiden. Aquí es donde habría que poner un paseo o una parada opcional (algo que se pueda quitar) o dejar sitio de otra forma.', '',
    row(['Día escrito', 'Sitio', 'No cabe', 'Motivo principal', 'Horas de entrada que fallan', 'Paradas que lo impiden (las más repetidas)']), row(Array(6).fill('---')))
  const fixable = [...failCurated].filter(([, rec]) => ![...rec.whys].every(([why]) => ['visita_no_cabe_antes_del_cierre'].includes(why)))
  const topOf = (map, n = 3) => [...map].sort((a, b) => b[1] - a[1]).slice(0, n)
  for (const [key, rec] of fixable.sort((a, b) => b[1].n - a[1].n).slice(0, 30)) {
    const [curated, siteKey] = key.split('|')
    const hours = [...rec.hours.keys()].sort()
    out.push(row([curated, SITES[siteKey]?.label ?? siteKey, rec.n, topOf(rec.whys, 1).map(([w]) => WHY[w] ?? w).join(''), `${hours[0]} … ${hours.at(-1)} (${hours.length} franjas)`, topOf(rec.items).map(([n, v]) => `${n} (${v})`).join(', ')]))
  }
  out.push('')
  out.push('### 7b. Reserva en otro día: por qué un día no se puede cambiar por otro', '',
    'El grupo solo pasa a otro día si los dos días abren en la fecha nueva. Estos son los cierres que lo impiden: **qué día escrito** (el que se movería), **qué parada** cierra y **en qué día de la semana**. «grupo» = el día del grupo no puede ir a esa fecha; «desplazado» = el día que cedería su hueco no puede ir a la fecha de origen.', '',
    row(['Día escrito', 'Cierra', 'El día de la semana', 'Papel', 'Casos']), row(Array(5).fill('---')))
  for (const [key, n] of topOf(failOther, 28)) {
    const [day, item, weekday, role] = key.split('|')
    out.push(row([day, item, weekday, role, n]))
  }
  out.push('')
  return out
}

// ── Ejecución ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith('medirReservas.mjs')) {
  const summary = await main()
  const lines = buildReport(summary)
  writeFileSync(OUT, lines.join('\n') + '\n')
  console.log(JSON.stringify({ ...summary, fallos: failures.length, hoy: [...todayFindings].map(([k, v]) => [k, v.n]), out: OUT }))
  if (failures.length > 0) process.exitCode = 1
}
