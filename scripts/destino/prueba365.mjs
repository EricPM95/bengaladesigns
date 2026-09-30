// La prueba de las 365 fechas (motor v4, días escritos): el viaje empezando cada día del año, de 2 a 7 días,
// con y sin Free Tour; cada experiencia; cada extra del pool solo y en parejas. Todo lo de auditoria.mjs y lo
// propio de los días escritos. No arregla nada: cuenta y enseña ejemplos, y lo que salga se arregla en los datos.
//   node scripts/destino/prueba365.mjs [año=2027] [rapida] [out=docs/PRUEBA365.md] [volcar=<tipo>]
// Da también sus números solo en las fechas clave de los viajeros españoles (fechasClave.mjs, INVARIANTES 406).
// (volcar: todos los casos de ese tipo en el scratch que se diga con volcado=<fichero>, no solo 6 ejemplos.)
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { TIPOS_AUDITORIA, auditarViaje } from './auditoria.mjs'
import { tituloQueNoSeCumple } from './textChecks.mjs'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'
import { enFechaClave, fechasClaveDe } from './fechasClave.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => (x.includes('=') ? x.split('=') : [x, true])))
const year = Number(args['año'] ?? args.ano ?? 2027)
const quick = Boolean(args.rapida)
const out = args.out ?? 'docs/PRUEBA365.md'
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const legBetween = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)
const EXTRA_TIPOS = {
  v4_llega_tarde: 'Se llega tarde a una hora fija (o a recoger la entrada)',
  v4_fuera_de_horario: 'Parada fuera de su horario sin solución escrita',
  v4_cerrado_sin_solucion: 'Cerrado ese día y sin nada escrito',
  v4_comida_corta: 'La comida no cabe en sus 45 min y no hay opcional ni elástica que lo absorba',
  v4_lugar_desconocido: 'Lugar escrito que no existe en las fichas',
  v4_elastica: 'La elástica tendría que pasar de su margen (±30, y 10 más en la llegada al mirador: de 15 a 35 min antes del sol)',
  v4_antes_de_cenar: '«Antes de cenar» en una parada que va después de cenar',
  v4_titulo: 'Título del día que no se cumple',
  v4_error: 'El motor falla',
  comida_menos_45: 'Comida de menos de 45 min en la ruta (la regla: 45 como mínimo, siempre)',
  pago_cerrado_fecha: '(Información) Imprescindible de pago sin visita por dentro porque cierra un día del viaje (1 de enero, Navidad…)',
}
const TIPOS = { ...TIPOS_AUDITORIA, ...EXTRA_TIPOS }
const counts = new Map()
/** Por tipo, en qué día escrito y versión cae ("D4 A lun"), para saber qué arreglar. */
const byDay = new Map()
const tally = (tipo, key) => {
  const map = byDay.get(tipo) ?? new Map()
  map.set(key, (map.get(key) ?? 0) + 1)
  byDay.set(tipo, map)
}
const examples = new Map()
const dumped = []
let trips = 0
// Las fechas clave de ese año: el viaje que pisa alguna cuenta aparte.
const CLAVES = fechasClaveDe(year)
const INFORMATIVOS = new Set(['pago_cerrado_fecha'])
let currentKey = null
const keyTrips = new Map()
const keyCases = new Map()
const add = (tipo, where, detail) => {
  if (currentKey) {
    const list = keyCases.get(currentKey.id) ?? []
    list.push({ tipo, text: `${where}${detail ? ` — ${detail}` : ''}` })
    keyCases.set(currentKey.id, list)
  }
  counts.set(tipo, (counts.get(tipo) ?? 0) + 1)
  const list = examples.get(tipo) ?? []
  if (list.length < 6) list.push(`${where}${detail ? ` — ${detail}` : ''}`)
  examples.set(tipo, list)
  if (args.volcar === tipo || args.volcar === 'todos') dumped.push(`${args.volcar === 'todos' ? `${tipo} | ` : ''}${where}${detail ? ` — ${detail}` : ''}`)
}
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const hh = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const t2m = (t) => {
  const [h, m] = String(t ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}

async function runTrip({ fecha, dias, ft, exps = [], pool = [] }) {
  const positive = [...(ft ? ['free_tour'] : []), ...exps]
  const label = `${fecha} · ${dias} días${ft ? ' · FT' : ''}${exps.length ? ` · ${exps.join('+')}` : ''}${pool.length ? ` · pool ${pool.join('+')}` : ''}`
  const days = []
  try {
    for (let n = 1; n <= dias; n++) days.push(await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, pool, positive.length ? ['imprescindibles', ...positive] : [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' }))
  } catch (error) {
    add('v4_error', label, String(error?.message ?? error).slice(0, 160))
    return
  }
  trips++
  // La comida, 45 min como mínimo en la ruta que ve el viajero: de su hora a su fin, y hasta la parada siguiente.
  for (const [i, day] of days.entries()) {
    const lunch = day?.meals?.find((meal) => meal.time === 'lunch')
    if (!lunch?.suggested_time) continue
    const start = t2m(lunch.suggested_time)
    const end = lunch.window_end ? t2m(lunch.window_end) : null
    const next = (day.stops ?? []).map((stop) => t2m(stop.suggested_time)).filter((t) => t != null && t > start).sort((a, b) => a - b)[0]
    const minutes = Math.min(end != null ? end - start : Infinity, next != null ? next - start : Infinity)
    if (minutes < 45) add('comida_menos_45', `${label}, día ${i + 1}`, `${lunch.suggested_time}: ${minutes} min`)
  }
  const keyOf = (n) => {
    const day = days[n - 1]
    return day?.curated_day ? `${day.curated_day.id} ${day.curated_day.variants?.[0] ?? ''}${(day.curated_day.variants ?? []).slice(1).length ? ` +${day.curated_day.variants.slice(1).join('+')}` : ''}` : 'otro'
  }
  const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const closedAllTrip = (name) => {
    const place = (D.places ?? []).find((candidate) => candidate.name === name)
    return Boolean(place) && days.some((day, index) => day?.stops?.length && closedOnDay(place, WEEKDAYS[new Date(`${addDays(fecha, index)}T12:00:00Z`).getUTCDay()], addDays(fecha, index)))
  }
  for (const caso of auditarViaje(D, days, { startIso: fecha, poolNames: pool, leg: legBetween, label })) {
    // (Si ese imprescindible cierra algún día del viaje, es la fecha: va aparte, como información.)
    if (caso.tipo === 'pago_sin_dentro' && closedAllTrip(/todo el viaje (.+)$/.exec(caso.donde)?.[1] ?? '')) caso.tipo = 'pago_cerrado_fecha'
    add(caso.tipo, caso.donde, caso.detalle)
    const n = Number(/día ([0-9]+)/.exec(caso.donde)?.[1] ?? 0)
    tally(caso.tipo, n ? keyOf(n) : 'viaje')
  }
  for (const [index, day] of days.entries()) {
    if (!day?.stops?.length) continue
    const n = index + 1
    for (const aviso of tituloQueNoSeCumple(day)) add('v4_titulo', `${label}, día ${n}`, aviso)
    const dinner = (day.meals ?? []).find((meal) => meal.time === 'dinner')
    const dinnerAt = t2m(dinner?.suggested_time)
    for (const stop of day.stops) if (dinnerAt != null && t2m(stop.suggested_time) > dinnerAt && /antes de (ir a )?cenar/i.test(stop.why ?? '')) add('v4_antes_de_cenar', `${label}, día ${n}, ${stop.suggested_time} ${stop.name}`)
  }
}

/** Lo que el motor ha apuntado en cada día (problemas y elástica), desde el plan. */
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { planWrittenTrip } from '../../shared/routeEngine/writtenTrip.js'
const written = writtenDaysFor('roma')
function planChecks({ fecha, dias, ft, exps = [], pool = [] }) {
  const label = `${fecha} · ${dias} días${ft ? ' · FT' : ''}${exps.length ? ` · ${exps.join('+')}` : ''}${pool.length ? ` · pool ${pool.join('+')}` : ''}`
  const positive = [...(ft ? ['free_tour'] : []), ...exps]
  const plan = planWrittenTrip({ destData: D, written, totalDays: dias + 1, hasFreeTour: ft, poolNames: pool, experiencesPositive: positive.length ? ['imprescindibles', ...positive] : [], dateRangeStartIso: fecha, travel })
  if (!plan) {
    add('v4_error', label, 'sin plan (falta un día escrito)')
    return
  }
  for (const day of plan.days) {
    const w = day.written
    if (!w) continue
    const where = `${label}, día ${day.dayNumber} (${day.curatedDay?.id} ${w.version}, ${day.hours?.weekday})`
    for (const problem of w.problems ?? []) tally(`v4_${problem.tipo}`, `${day.curatedDay?.id} ${w.version} ${day.hours?.weekday ?? ''}`)
    if (w.elastic && elasticOut(w.elastic)) tally('v4_elastica', `${day.curatedDay?.id} ${w.version}${(day.curatedDay?.variantes ?? []).slice(1).length ? ' +' + day.curatedDay.variantes.slice(1).join('+') : ''}`)
    for (const problem of w.problems ?? []) add(`v4_${problem.tipo}`, where, [problem.lugar, problem.llega ? `llega ${problem.llega} para las ${problem.hora}` : problem.hora, problem.minutos != null ? `${problem.minutos} min` : null].filter(Boolean).join(' · '))
    if (w.elastic && elasticOut(w.elastic)) add('v4_elastica', where, `${w.elastic.lugar}: quería ${w.elastic.wanted > 0 ? '+' : ''}${w.elastic.wanted} (margen ±${w.elastic.max}); sol ${hh(day.hours.sunset)}`)
  }
}

/**
 * La elástica fuera de su margen. Si falta tarde (se llegaría tarde al sol), fuera de ±margen + 10. Si sobra, lo que no
 * absorbe sale como rato con nombre (regla 370; el aperitivo, hasta 90, más 20 sin nombre) y la auditoría ya lo vigila:
 * solo cuenta si sobra más que eso (PROMPT_ROMA_V4_REPASO: la comida de 90 min en completo deja tarde de sobra en verano).
 */
const elasticOut = (e) => e.wanted > (e.grow ?? e.max) + 10 + 90 + 20 || -e.wanted > e.max + 10

const started = Date.now()
const starts = Array.from({ length: 365 }, (_, i) => addDays(`${year}-01-01`, i))
const grid = []
// 1. Todas las fechas, de 2 a 7 días, con y sin Free Tour.
for (const fecha of quick ? starts.filter((_, i) => i % 7 === 0) : starts) {
  for (const dias of [2, 3, 4, 5, 6, 7]) for (const ft of [false, true]) grid.push({ fecha, dias, ft })
}
// 2. Cada experiencia (3 y 5 días, completo, sin Free Tour).
for (const fecha of starts.filter((_, i) => i % (quick ? 14 : 2) === 0)) for (const exp of ['arte_museos', 'naturaleza_vistas', 'barrios_sabores']) for (const dias of [3, 5]) grid.push({ fecha, dias, ft: false, exps: [exp] })
// 3. Cada extra del pool solo y en parejas (4 días, completo; una fecha por semana, cambiando el día de la semana).
const extras = (D.pool_lista?.lugares ?? []).filter((name) => !['Coliseo', 'Foro Romano y Palatino', 'Fontana de Trevi', 'Panteón', 'Museos Vaticanos y Capilla Sixtina', 'Basílica de San Pedro', 'Piazza Navona', 'Plaza de España'].includes(name))
const pairs = extras.flatMap((a, i) => extras.slice(i + 1).map((b) => [a, b]))
const weekly = starts.filter((_, i) => i % (quick ? 28 : 7) === 0)
for (const [w, fecha] of weekly.entries()) {
  for (const name of extras) grid.push({ fecha: addDays(fecha, w % 7), dias: 4, ft: false, pool: [name] })
  for (const pair of pairs.filter((_, i) => i % weekly.length === w)) grid.push({ fecha: addDays(fecha, w % 7), dias: 5, ft: false, pool: pair })
}

for (const [index, trip] of grid.entries()) {
  currentKey = enFechaClave(CLAVES, trip.fecha, trip.dias)
  if (currentKey) keyTrips.set(currentKey.id, (keyTrips.get(currentKey.id) ?? 0) + 1)
  planChecks(trip)
  await runTrip(trip)
  if (index % 500 === 0) process.stderr.write(`\r${index}/${grid.length} viajes (${Math.round((Date.now() - started) / 1000)} s)   `)
}
process.stderr.write('\n')

const total = [...counts.values()].reduce((a, b) => a + b, 0)
const lines = [
  `# Prueba de las 365 fechas (motor v4, días escritos)`,
  '',
  `${trips} viajes (${quick ? 'rápida: una fecha por semana' : `todas las fechas de ${year}`}), en ${Math.round((Date.now() - started) / 1000)} s. **Total: ${total}**.`,
  '',
  ...Object.entries(TIPOS).map(([tipo, texto]) => {
    const count = counts.get(tipo) ?? 0
    return count === 0 ? `- **${texto}**: 0 ✅` : [`- **${texto}**: ${count}`, ...(examples.get(tipo) ?? []).map((example) => `  - ${example}`)].join('\n')
  }),
  '',
  '## Dónde caen (día escrito, versión y variantes)',
  '',
  ...[...byDay.entries()].map(([tipo, map]) => `- **${TIPOS[tipo] ?? tipo}**: ${[...map.entries()].sort((x, y) => y[1] - x[1]).slice(0, 14).map(([k, v]) => `${k.trim()} ×${v}`).join(' · ')}`),
  ...[...counts.keys()].filter((tipo) => !(tipo in TIPOS)).map((tipo) => `- **${tipo}**: ${counts.get(tipo)}\n${(examples.get(tipo) ?? []).map((example) => `  - ${example}`).join('\n')}`),
]
const keyAll = [...keyCases.values()].flat()
const keyReal = keyAll.filter((item) => !INFORMATIVOS.has(item.tipo))
lines.push(
  '',
  '## Solo en las fechas clave de los viajeros españoles',
  '',
  `${[...keyTrips.values()].reduce((a, b) => a + b, 0)} viajes pisan alguna fecha clave. **Avisos de verdad: ${keyReal.length}** · informativos (algo cierra ese día y el aviso lo explica): ${keyAll.length - keyReal.length}.`,
  '',
  '| Fecha clave | Fechas | Viajes | De verdad | Informativos |',
  '|---|---|---|---|---|',
  ...CLAVES.map((item) => {
    const cases = keyCases.get(item.id) ?? []
    const real = cases.filter((c) => !INFORMATIVOS.has(c.tipo)).length
    return `| ${item.nombre} | ${item.desde.slice(5)} – ${item.hasta.slice(5)} | ${keyTrips.get(item.id) ?? 0} | ${real} | ${cases.length - real} |`
  }),
  '',
  ...CLAVES.flatMap((item) => (keyCases.get(item.id) ?? []).filter((c) => !INFORMATIVOS.has(c.tipo)).map((c) => `- ${item.nombre}: ${c.tipo} | ${c.text}`)),
)
writeFileSync(out, lines.join('\n') + '\n')
if (args.volcar) writeFileSync(args.volcado ?? `volcado_${args.volcar}.txt`, dumped.join('\n') + '\n')
console.log(JSON.stringify({ viajes: trips, total, clave: { reales: keyReal.length, informativos: keyAll.length - keyReal.length }, tipos: Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1])) }))
