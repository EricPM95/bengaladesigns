// La prueba de los días escritos: parada a parada contra docs/dias/DIAS_ESCRITOS_ROMA.md, en las 365 fechas de 2027.
//   node scripts/destino/pruebaEscritos.mjs [out=docs/dias/PRUEBA_ESCRITOS.md] [volcado=ruta.txt] [dias=1,1.5,2,2.5]
// Una diferencia es un fallo, salvo las que explica «Lo que hará el motor» (cierres, ajuste al atardecer, hora límite de la noche…).
// Tanda 2 (5-oct-2026): además del parada a parada, comprueba qué días lleva cada viaje y en qué orden (con el cambio de orden de los días), que ninguna comida ni cena
// caiga en un restaurante cerrado ese día o a esa hora, los avisos «Hemos puesto el Vaticano otro día», lo que pasa de las 22:00 o de 2 horas, y qué imprescindibles no salen.
import fs from 'node:fs'
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { closedOnDay, matchesDateToken } from '../../shared/routeEngine/openingHours.js'
import { restaurantOpenAt } from '../../shared/routeEngine/dinnerZones.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const out = args.out ?? 'docs/dias/PRUEBA_ESCRITOS.md'
const D = findPipelineV2Data('Roma')
const IDS = ['D0', 'D0-medio', 'D1', 'D1-corto', 'D2', 'D3', 'D1-FT', 'DT-medio', 'DM-medio']
const dias = Object.fromEntries(IDS.map((id) => [id, JSON.parse(fs.readFileSync(`data/dias/roma/${id}.json`, 'utf8'))]))
const WEEKDAY = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))
const cuts = ['17:40', '18:45', '19:45'].map(toMin)
const letra = (sunset) => (sunset < cuts[0] ? 'A' : sunset < cuts[1] ? 'B' : sunset < cuts[2] ? 'C' : 'D')
const weekdayOf = (iso) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const plain = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const placeOf = (name) => D.places.find((place) => place.name === name)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
// (Para elegir tabla, todos los domingos cuentan como cerrados —el documento: «el domingo, también el último del mes»—.)
const museosCierran = (iso) => weekdayOf(iso) === 'domingo' || closedOnDay(placeOf(MUSEOS), weekdayOf(iso), iso)
const restauranteOf = (name) => D.restaurants.find((restaurant) => restaurant.name === name)
const sinTour = (iso) => (D.default_free_tour?.disponibilidad?.sin_tour ?? []).some((entry) => matchesDateToken(typeof entry === 'string' ? entry : entry.fecha, iso))

// ── Qué días lleva cada viaje y en qué orden (el documento, «Orden de los días»), calculado aquí sin mirar al motor ───────────────────────────────
const mala = (id, iso) => {
  const wd = plain(weekdayOf(iso))
  const mmdd = iso.slice(5)
  if (id === 'D2') return wd === 'domingo' || wd === 'miercoles' || museosCierran(iso)
  if (id === 'D3') return wd === 'domingo' || museosCierran(iso) || sinTour(iso)
  if (id === 'D1' || id === 'D1-FT') return mmdd === '06-02' || mmdd === '12-25'
  return false
}
/** El orden de dos días enteros: el escrito si no cae mal, y si cae mal y se puede cambiar, cambiados. Con los mismos días malos en los dos órdenes, valen los dos. */
function parOrdenado(par, isos) {
  const coste = (orden) => orden.reduce((suma, id, i) => suma + (mala(id, isos[i]) ? 1 : 0), 0)
  const normal = [par[0], par[1]]
  const cambiado = [par[1], par[0]]
  return coste(cambiado) < coste(normal) ? [cambiado] : coste(cambiado) === coste(normal) ? [normal, cambiado] : [normal]
}
const VIAJES = [
  { clave: '1 día', dias: 1, ft: false, esperado: () => [['D0']] },
  { clave: '1,5 días, medio día de tarde y día entero', dias: 2, ft: false, medio: { franja: 'tarde' }, esperado: () => [['D0-medio', 'D1-corto']] },
  { clave: '1,5 días, día entero y medio día de mañana', dias: 2, ft: false, medio: { franja: 'manana', salida: '15:00' }, esperado: () => [['D1-corto', 'D0-medio']] },
  { clave: '2 días', dias: 2, ft: false, esperado: (start) => parOrdenado(['D1', 'D2'], [start, addDays(start, 1)]) },
  { clave: '2 días con Free Tour de mañana', dias: 2, ft: true, esperado: (start) => parOrdenado(['D3', 'D1-FT'], [start, addDays(start, 1)]) },
  { clave: '2,5 días, medio día de tarde', dias: 3, ft: false, medio: { franja: 'tarde' }, esperado: (start) => parOrdenado(['D1', 'D2'], [addDays(start, 1), addDays(start, 2)]).map((par) => ['DT-medio', ...par]) },
  { clave: '2,5 días, medio día de mañana', dias: 3, ft: false, medio: { franja: 'manana', salida: '15:00' }, esperado: (start) => parOrdenado(['D1', 'D2'], [start, addDays(start, 1)]).map((par) => [...par, 'DT-medio']) },
  { clave: '2,5 días con Free Tour de mañana, medio día de tarde', dias: 3, ft: true, medio: { franja: 'tarde' }, esperado: (start) => parOrdenado(['D3', 'D1-FT'], [addDays(start, 1), addDays(start, 2)]).map((par) => ['DT-medio', ...par]) },
  { clave: '2,5 días con Free Tour de mañana, medio día de mañana', dias: 3, ft: true, medio: { franja: 'manana', salida: '15:00' }, esperado: (start) => parOrdenado(['D3', 'D1-FT'], [start, addDays(start, 1)]).map((par) => [...par, 'DM-medio']) },
]
// Los extras del pool con su tabla escrita (tanda 2): el mismo viaje con un lugar marcado; el día que lo lleva sale con la tabla de ese extra (o con la normal si ese día cierra o su versión no la tiene).
const base = (clave) => VIAJES.find((viaje) => viaje.clave === clave)
const POOL = [
  ...['Galería Borghese', 'Ojo de la Cerradura del Aventino', 'Basílica de San Juan de Letrán', 'Parque de Villa Borghese'].map((name) => ({ ...base('2 días'), clave: `2 días + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese', 'Ojo de la Cerradura del Aventino', 'Basílica de San Juan de Letrán'].map((name) => ({ ...base('2 días con Free Tour de mañana'), clave: `2 días con Free Tour de mañana + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese', 'Parque de Villa Borghese'].map((name) => ({ ...base('2,5 días, medio día de tarde'), clave: `2,5 días, medio día de tarde + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese'].map((name) => ({ ...base('2,5 días, medio día de mañana'), clave: `2,5 días, medio día de mañana + pool: ${name}`, pool: [name] })),
  ...['Basílica de San Juan de Letrán'].map((name) => ({ ...base('2,5 días con Free Tour de mañana, medio día de mañana'), clave: `2,5 días con Free Tour de mañana, medio día de mañana + pool: ${name}`, pool: [name] })),
  { ...base('1,5 días, medio día de tarde y día entero'), clave: '1,5 días, medio día de tarde y día entero + pool: Museos Vaticanos', pool: ['Museos Vaticanos y Capilla Sixtina'] },
  { ...base('1,5 días, día entero y medio día de mañana'), clave: '1,5 días, día entero y medio día de mañana + pool: Museos Vaticanos', pool: ['Museos Vaticanos y Capilla Sixtina'] },
  { ...base('1,5 días, medio día de tarde y día entero'), clave: '1,5 días, medio día de tarde y día entero + pool: Coliseo', pool: ['Coliseo'] },
  { ...base('1 día'), clave: '1 día + pool: Coliseo', pool: ['Coliseo'] },
]
// El Free Tour de tarde (17:00) y de noche (18:30) en el viaje de 2 días: el Día de la Roma antigua lleva su versión con el tour.
const FT_DESPUES = [
  { ...base('2 días'), clave: '2 días + Free Tour de tarde (17:00)', ftDespues: { franja: 'tarde', hora: '17:00' } },
  { ...base('2 días'), clave: '2 días + Free Tour de noche (18:30)', ftDespues: { franja: 'noche', hora: '18:30' } },
]
const SOLO = args.dias ? new Set(args.dias.split(',')) : null
const viajesAUsar = [...VIAJES, ...(SOLO?.has('pool') ? POOL : []), ...(SOLO?.has('ft') ? FT_DESPUES : [])].filter((viaje) => !SOLO || (SOLO.has('pool') && viaje.pool) || (SOLO.has('ft') && viaje.ftDespues) || (!viaje.pool && !viaje.ftDespues && SOLO.has({ 1: '1', 2: viaje.medio ? '1.5' : '2', 3: '2.5' }[viaje.dias])))

/** Navidad y Año Nuevo: el Día de la Roma antigua se sustituye por el D1-corto (todo por fuera). */
const conFiestas = (ids, start) => ids.map((id, i) => (id === 'D1' && ['12-25', '01-01'].includes(addDays(start, i).slice(5)) ? 'D1-corto' : id))

/** La tabla que toca según el documento (se vuelve a calcular aquí, sin mirar al motor). null = el documento no trae esa tabla (se deriva). */
function tablaEsperada(id, iso, viaje, posicion) {
  const rows = tablaBase(id, iso, viaje, posicion)
  if (!rows || !viaje.pool) return rows
  return conPool(rows, id, iso, viaje)
}
/** Lo marcado en el pool: el día que lo lleva sale con la tabla escrita de ese extra. */
function conPool(rows, id, iso, viaje) {
  const sunset = sunsetFor(D, { dateIso: iso })
  const l = letra(sunset)
  const wd = weekdayOf(iso)
  const esManana = viaje.medio?.franja === 'manana' && (id === 'DT-medio' || id === 'DM-medio')
  const clave = esManana ? 'manana' : l
  for (const name of viaje.pool) {
    const def = dias[id].pool?.[name]
    if (!def) continue
    // (Si el extra está escrito en varios días del viaje, va en uno solo: el que ese día abre, luego el de más prioridad y luego el primero.)
    const candidatos = viaje.ctx.ids.map((cid, i) => ({ cid, i, iso: addDays(viaje.ctx.start, i), def: dias[cid]?.pool?.[name] })).filter((item) => item.def)
    const cerrado = (item) => Boolean(placeOf(name) && closedOnDay(placeOf(name), weekdayOf(item.iso), item.iso))
    const ganador = [...candidatos].sort((x, y) => Number(cerrado(x)) - Number(cerrado(y)) || (y.def.prioridad ?? 0) - (x.def.prioridad ?? 0) || x.i - y.i)[0]
    if (ganador?.cid !== id || ganador?.iso !== iso) continue
    const accion = (def.acciones ?? []).find((item) => item.op === 'tabla' || item.op === 'reemplazar_manana')
    if (!accion) continue
    if (placeOf(name) && closedOnDay(placeOf(name), wd, iso)) return rows
    const iComida = rows.findIndex((row) => row.tipo === 'comida')
    if (accion.op === 'reemplazar_manana') {
      if (rows.some((row) => row.lugar === def.ya_si_dentro && row.modo === 'dentro')) return rows
      return [...accion.filas, ...rows.slice(iComida)]
    }
    if (def.incluido_en?.includes(clave)) return rows
    if (def.solo_en && !def.solo_en.includes(clave)) return rows
    const tabla = accion.tablas[clave] ?? Object.entries(accion.tablas).find(([k]) => k.length > 1 && k.includes(clave) && /^[A-D]+$/.test(k))?.[1]
    if (!tabla) return rows
    return accion.desde === 'dia' ? tabla : [...rows.slice(0, iComida), ...tabla]
  }
  return rows
}
function tablaBase(id, iso, viaje, posicion) {
  const sunset = sunsetFor(D, { dateIso: iso })
  const l = letra(sunset)
  const wd = plain(weekdayOf(iso))
  const mmdd = iso.slice(5)
  const v = dias[id].versiones
  const por = (grupo) => {
    const t = v[grupo]
    return t[l] ?? Object.entries(t).find(([k]) => /^[A-D]+$/.test(k) && k.includes(l))?.[1] ?? t.unica
  }
  const esMedioDeManana = viaje.medio?.franja === 'manana'
  if (id === 'D2') {
    if (mmdd === '12-25' || mmdd === '01-01') return por('fiesta')
    if (museosCierran(iso)) return por(wd === 'miercoles' ? 'miercoles_sin_museos' : 'domingo')
    return por(wd === 'miercoles' ? 'miercoles' : 'normal')
  }
  if (id === 'D3') return por(museosCierran(iso) ? 'domingo' : 'normal')
  // (Con el Free Tour de tarde o de noche, el Día de la Roma antigua lleva su versión con el tour, salvo el día en que no hay tour.)
  if (id === 'D1' && viaje.ftDespues && !sinTour(iso)) return v[viaje.ftDespues.franja === 'noche' ? 'free_tour_noche' : 'free_tour_tarde'].unica
  if (id === 'D1' || id === 'D1-FT' || id === 'D1-corto') return por('normal')
  if (id === 'D0') return (viaje.pool ?? []).includes('Coliseo') ? v.reves.unica : v.normal.unica
  if (id === 'D0-medio') {
    const museos = (viaje.pool ?? []).includes(MUSEOS) && !museosCierran(iso)
    if (!esMedioDeManana) return museos ? v.tarde_con_museos.unica : por('tarde_sin_museos')
    return museos ? v.manana_con_museos.unica : wd === 'miercoles' ? null : v.manana.unica
  }
  if (id === 'DM-medio') return v.manana.unica
  if (id === 'DT-medio') {
    if (esMedioDeManana) return v.manana.unica
    const rows = l === 'A' && sunset < 17 * 60 + 15 ? v.tarde_invierno.unica : v.tarde[l]
    // (Con Free Tour de mañana, la Plaza de España de camino (5 min) y el rato que sobra, al colchón.)
    if (!viaje.ft) return rows
    const espana = rows.find((row) => row.lugar === 'Plaza de España' && row.modo !== 'camino')
    const colchon = [...rows].reverse().find((row) => row.colchon)
    return rows.map((row) => (row === espana ? { ...row, modo: 'camino', min: 5 } : row === colchon ? { ...row, min: row.min + (espana.min - 5) } : row))
  }
  void posicion
  return null
}

const diffs = []
const extra = { mesas: 0, restaurante_cerrado: [], restaurante_sin: [], cena_22: [], colchon_2h: [], aviso_vaticano: [], orden: [], restaurante_cambiado: 0, imprescindibles: new Map(), sinTabla: 0 }
let comparados = 0
let filasTotal = 0
const limpia = (t) => t.replace(/\s*\(noche\)/g, '').replace(/ iluminados?$/, '').trim()
const claveFila = (row) => limpia(plain(row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? ''))
const claveActual = (stop) => limpia(plain(stop.display_title ?? stop.night_view_title ?? stop.place_name ?? stop.name))

function comparar(viaje, iso, dayNumber, id, rows, day) {
  const esperadas = rows.filter((row) => row.tipo !== 'traslado')
  const actuales = [
    ...(day.stops ?? []).map((stop) => ({ kind: 'stop', key: claveActual(stop), hora: stop.suggested_time, min: stop.duration_minutes, stop })),
    ...(day.meals ?? []).map((meal) => ({ kind: 'meal', key: plain(meal.restaurant ?? ''), hora: meal.suggested_time, min: meal.window_end ? toMin(meal.window_end) - toMin(meal.suggested_time) : null, tipo: meal.time, meal })),
  ]
  const log = day.engine_log ?? []
  const usadas = new Set()
  /** La causa que el motor apunta para ese cambio de esa fila; sin causa apuntada, la diferencia es un fallo. */
  const causaDe = (row, que) => {
    // (Las filas de una tabla de pool no traen id: se buscan por su nombre en el registro.)
    const esLaFila = (x) => (row.id ? x.id === row.id : limpia(plain(x.lugar)) === claveFila(row) || x.sitio === row.lugar)
    const hit = log.filter((x) => esLaFila(x) && (que === 'quitada' ? x.que === 'quitada' : x.que.split('+').includes(que)))
    return hit.length ? [...new Set(hit.map((x) => x.causa))].join(' + ') : null
  }
  for (const row of esperadas) {
    filasTotal++
    const key = claveFila(row)
    const esComida = row.tipo === 'comida' || row.tipo === 'cena'
    const i = actuales.findIndex((a, k) => !usadas.has(k) && (esComida ? a.kind === 'meal' && a.tipo === (row.tipo === 'cena' ? 'dinner' : 'lunch') : a.kind === 'stop' && (a.key === key || a.key.includes(key) || key.includes(a.key))))
    const where = { viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${row.hora} ${row.texto_documento?.replace(/\*/g, '') ?? ''}`.trim() }
    if (i < 0) {
      diffs.push({ ...where, tipo: 'falta', causa: causaDe(row, 'quitada') })
      continue
    }
    usadas.add(i)
    const a = actuales[i]
    if (a.hora !== row.hora) diffs.push({ ...where, tipo: 'hora', detalle: `${row.hora} → ${a.hora}`, causa: causaDe(row, 'hora') })
    if (!esComida && row.tipo !== 'noche' && a.min !== row.min) diffs.push({ ...where, tipo: 'minutos', detalle: `${row.min} → ${a.min}`, causa: causaDe(row, 'min') })
    if (row.tipo === 'comida' && a.min != null && a.min !== row.min) diffs.push({ ...where, tipo: 'minutos', detalle: `${row.min} → ${a.min}`, causa: causaDe(row, 'min') })
    if (a.kind === 'stop' && row.tipo === 'parada') {
      const modoActual = a.stop.pass_through ? 'camino' : a.stop.visit_mode === 'dentro' ? 'dentro' : a.stop.visit_mode === 'fuera' ? 'fuera' : null
      const modoFila = row.modo === 'atardecer' ? null : row.modo
      if ((modoFila ?? null) !== modoActual) diffs.push({ ...where, tipo: 'cómo', detalle: `${row.modo ?? '-'} → ${modoActual ?? '-'}`, causa: causaDe(row, 'modo') ?? causaDe(row, 'quitada') })
    }
  }
  // Las horas y las duraciones, de 5 en 5.
  for (const a of actuales) {
    if (a.hora && toMin(a.hora) % 5 !== 0) diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'hora_no_5', causa: null })
    // (Un «de camino» escrito con 3 min en el documento —el Elefantino de Bernini, Santa Maria sopra Minerva— es lo que dice el documento, no un fallo.)
    if (a.kind === 'stop' && a.min != null && a.min % 5 !== 0 && !esperadas.some((row) => row.min === a.min && (claveFila(row) === a.key || a.key.includes(claveFila(row)) || claveFila(row).includes(a.key)))) diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'minutos_no_5', detalle: String(a.min), causa: null })
  }
  actuales.forEach((a, k) => {
    if (usadas.has(k)) return
    diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'sobra', causa: log.filter((x) => x.que === 'nueva' && limpia(plain(x.lugar)) === a.key).map((x) => x.causa)[0] ?? null })
  })
  comparados++
}

/** Lo que va aparte de las filas: restaurantes abiertos, cenas tardías, colchones largos y avisos que prometen lo que no es. */
function comprobarExtras(viaje, iso, dayNumber, id, day, ids) {
  const wd = weekdayOf(iso)
  for (const meal of day.meals ?? []) {
    extra.mesas++
    const nombre = meal.restaurant
    const tipo = meal.time === 'dinner' ? 'cena' : 'comida'
    if (!nombre) { extra.restaurante_sin.push(`${iso} ${id} ${tipo}`); continue }
    const restaurante = restauranteOf(nombre)
    const start = toMin(meal.suggested_time)
    const cerrado = restaurante && (closedOnDay(restaurante, wd, iso) || !restaurantOpenAt(restaurante, start) || (tipo === 'cena' ? !['cena', 'ambos'].includes(restaurante.meal) : !['comida', 'ambos'].includes(restaurante.meal)))
    if (cerrado) extra.restaurante_cerrado.push(`${iso} ${viaje.clave} ${id}: ${tipo} en ${nombre} (${meal.suggested_time})`)
  }
  for (const entry of day.engine_log ?? []) {
    if (entry.que === 'restaurante') extra.restaurante_cambiado++
    if (entry.que === 'aviso' && /22:00/.test(entry.causa)) extra.cena_22.push(`${iso} ${viaje.clave} ${id}: ${entry.causa}`)
    if (entry.que === 'aviso' && /colchón/.test(entry.causa)) extra.colchon_2h.push(`${iso} ${viaje.clave} ${id}: ${entry.lugar} (${entry.causa})`)
  }
  void ids
}

const nochesDe = (day) => (day.stops ?? []).filter((stop) => stop.is_night_experience).map((stop) => stop.name)

for (let n = 0; n < 365; n++) {
  const start = addDays('2027-01-01', n)
  for (const viaje of viajesAUsar) {
    const aceptables = viaje.esperado(start).map((ids) => conFiestas(ids, start))
    const vistos = new Set()
    let ok = true
    // Primero los días del viaje (los que saca el motor), luego se mira si son los que pide el documento y se compara cada uno.
    const construidos = []
    for (let d = 1; d <= viaje.dias; d++) {
      try {
        construidos.push(await buildDayBlockV3(D, viaje.dias + 1, viaje.ft, d, null, start, viaje.pool ?? [], viaje.ft ? ["imprescindibles", "free_tour"] : [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', mediaJornada: viaje.medio ?? null, freeTourDespues: viaje.ftDespues ?? null }))
      } catch (error) {
        diffs.push({ viaje: viaje.clave, fecha: start, dia: d, id: aceptables[0][d - 1], fila: '-', tipo: 'error', detalle: String(error.message).slice(0, 120) })
        construidos.push(null)
        ok = false
      }
    }
    const reales = construidos.map((day) => day?.curated_day?.id)
    const esperadoIds = aceptables.find((ids) => ids.every((id, i) => id === reales[i])) ?? aceptables[0]
    if (!aceptables.some((ids) => ids.every((id, i) => id === reales[i]))) {
      extra.orden.push(`${start} ${viaje.clave}: el motor pone ${reales.join(' + ')} y el documento pide ${aceptables.map((ids) => ids.join(' + ')).join(' o ')}`)
      ok = false
    }
    viaje.ctx = { ids: esperadoIds, start }
    // Los avisos de fechas especiales que dicen «Hemos puesto el Vaticano otro día»: tiene que ser verdad (ese día no lleva el Vaticano).
    for (const card of construidos[0]?.date_notices ?? []) {
      if (!/Vaticano otro día/.test((card.texts ?? []).join(' '))) continue
      const i = construidos.findIndex((day, k) => k >= 0 && addDays(start, k) === card.date_iso)
      const day = construidos[i]
      const lleva = (day?.stops ?? []).some((stop) => /Museos Vaticanos|Basílica de San Pedro|Plaza de San Pedro/.test(stop.place_name ?? stop.name ?? ''))
      if (lleva) extra.aviso_vaticano.push(`${card.date_iso} ${viaje.clave}: el aviso dice «Hemos puesto el Vaticano otro día» y ese día (${day.curated_day?.id}) lleva el Vaticano`)
    }
    for (let d = 1; d <= viaje.dias; d++) {
      const day = construidos[d - 1]
      if (!day) continue
      const id = day.curated_day?.id
      const iso = addDays(start, d - 1)
      const rows = id ? tablaEsperada(id, iso, viaje, d) : null
      for (const stop of day.stops ?? []) vistos.add(stop.place_name ?? stop.name)
      for (const name of nochesDe(day)) vistos.add(name.replace(/s*(noche)$/, ''))
      for (const entry of D.night_experiences ?? []) if (nochesDe(day).includes(entry.name)) for (const lugar of entry.conflicts_with ?? []) vistos.add(lugar)
      if (viaje.ft) for (const lugar of D.default_free_tour?.covers ?? []) vistos.add(lugar)
      if (!rows) {
        extra.sinTabla++
        if (id) comprobarExtras(viaje, iso, d, id, day, esperadoIds)
        continue
      }
      comparar(viaje, iso, d, id, rows, day)
      comprobarExtras(viaje, iso, d, id, day, esperadoIds)
    }
    if (!ok) continue
    // Los imprescindibles (nivel 1 de roma.json) que no salen en ningún momento de ese viaje.
    if (viaje.dias <= 3) {
      const faltan = D.places.filter((place) => place.level === 1 && !vistos.has(place.name)).map((place) => place.name)
      for (const name of faltan) {
        const clave = `${viaje.clave}|${name}`
        const item = extra.imprescindibles.get(clave) ?? { viaje: viaje.clave, name, fechas: [] }
        item.fechas.push(start)
        extra.imprescindibles.set(clave, item)
      }
    }
  }
}

const sin = diffs.filter((x) => !x.causa)
const por = new Map()
for (const x of diffs) {
  const k = `${x.id} · ${x.tipo} · ${x.causa ?? 'SIN EXPLICAR'} · ${x.fila.replace(/^\d\d:\d\d /, '')}`
  const item = por.get(k) ?? { n: 0, ejemplos: [] }
  item.n++
  if (item.ejemplos.length < 3) item.ejemplos.push(`${x.fecha}${x.detalle ? ' ' + x.detalle : ''}`)
  por.set(k, item)
}
const lines = [`# Prueba de los días escritos (parada a parada, 2027)`, '', `${comparados} días comparados, ${filasTotal} filas del documento. Diferencias: ${diffs.length} (${sin.length} sin explicar). Días cuya tabla el documento no trae (se derivan): ${extra.sinTabla}.`, '']
lines.push('Viajes probados: ' + viajesAUsar.map((viaje) => viaje.clave).join(' · '), '')
lines.push('## Resumen de las otras comprobaciones', '')
lines.push(`- Qué días lleva cada viaje y en qué orden (con el cambio de orden por fechas): ${extra.orden.length} fallos.`)
lines.push(`- Comidas y cenas comprobadas: ${extra.mesas}. En un restaurante cerrado ese día o a esa hora: ${extra.restaurante_cerrado.length}; comidas o cenas sin restaurante: ${extra.restaurante_sin.length}; restaurantes cambiados por su alternativa o por otro de la zona (apuntado en el registro): ${extra.restaurante_cambiado}.`)
lines.push(`- Cenas que pasan de las 22:00: ${extra.cena_22.length}. Colchones de más de 2 horas: ${extra.colchon_2h.length}.`)
lines.push(`- Avisos «Hemos puesto el Vaticano otro día» en un día del Vaticano: ${extra.aviso_vaticano.length}.`)
lines.push(`- Imprescindibles que no salen en algún viaje (viaje · lugar · cuántas fechas de 365): ${[...extra.imprescindibles.values()].length} casos.`, '')
const listar = (titulo, lista, max = 40) => {
  if (lista.length === 0) return
  lines.push(`## ${titulo} (${lista.length})`, '')
  for (const item of lista.slice(0, max)) lines.push(`- ${item}`)
  if (lista.length > max) lines.push(`- … y ${lista.length - max} más`)
  lines.push('')
}
listar('Orden de los días: fallos', extra.orden)
listar('Restaurantes cerrados', extra.restaurante_cerrado)
listar('Comidas o cenas sin restaurante', extra.restaurante_sin)
listar('Cenas después de las 22:00', extra.cena_22)
listar('Colchones de más de 2 horas', extra.colchon_2h)
listar('Avisos «otro día» en el día del Vaticano', extra.aviso_vaticano)
if (extra.imprescindibles.size > 0) {
  lines.push(`## Imprescindibles que no salen (${extra.imprescindibles.size})`, '')
  for (const item of [...extra.imprescindibles.values()].sort((a, b) => a.viaje.localeCompare(b.viaje) || b.fechas.length - a.fechas.length)) lines.push(`- ${item.viaje} · ${item.name} · ${item.fechas.length} fechas (${item.fechas.slice(0, 3).join(', ')}${item.fechas.length > 3 ? '…' : ''})`)
  lines.push('')
}
lines.push('## Sin explicar', '')
for (const [k, v] of [...por].filter(([k]) => k.includes('SIN EXPLICAR')).sort((a, b) => b[1].n - a[1].n)) lines.push(`- ${k} ×${v.n} — ${v.ejemplos.join(' · ')}`)
lines.push('', '## Explicadas por «Lo que hará el motor»', '')
for (const [k, v] of [...por].filter(([k]) => !k.includes('SIN EXPLICAR')).sort((a, b) => b[1].n - a[1].n)) lines.push(`- ${k} ×${v.n} — ${v.ejemplos.join(' · ')}`)
writeFileSync(out, lines.join('\n') + '\n')
if (args.imprescindibles) writeFileSync(args.imprescindibles, JSON.stringify([...extra.imprescindibles.values()], null, 1))
if (args.volcado) writeFileSync(args.volcado, diffs.map((x) => JSON.stringify(x)).join('\n') + '\n')
console.log(JSON.stringify({ mesas: extra.mesas, dias: comparados, filas: filasTotal, diferencias: diffs.length, sin_explicar: sin.length, orden: extra.orden.length, restaurantes_cerrados: extra.restaurante_cerrado.length, sin_restaurante: extra.restaurante_sin.length, cena_22: extra.cena_22.length, colchon_2h: extra.colchon_2h.length, aviso_vaticano: extra.aviso_vaticano.length, imprescindibles_que_faltan: extra.imprescindibles.size }))
