// Los órdenes nuevos de D1, D2 y D4 según la hora de la entrada (PARA_CODE_D1_D2_D4_SEGUNDO_ORDEN): se mide como si hubiera una reserva en cada franja.
// Cada fecha del año, el día escrito (D1 · Coliseo, D2 · Vaticanos, D4 · Galería) el primero de un viaje de 3 días, con la reserva a cada hora que se vende.
//   node scripts/destino/medirEntradas.mjs [paso=1] [dia=D1,D2,D4] [out=docs/MEDIR_ENTRADAS_2026-10-03.md]
// «Cabe» = la parada reservada sale a su hora (se llega 30 min antes), nada llega tarde, nada fuera de horario ni cerrado, y no se quita un imprescindible en silencio.
// Un atardecer que no cabe por la hora de la reserva NO cuenta como fallo («el viajero manda»). Los huecos de más de 30 min se cuentan aparte.
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { auditarViaje, repetidosEnElDia } from './auditoria.mjs'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { closedOnDay, placeWindows, parseHoursSessions, lastEntryMinutes, seasonKey } from '../../shared/routeEngine/openingHours.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => (x.includes('=') ? x.split('=') : [x, true])))
const STEP = Number(args.paso ?? 1)
const DAYS = String(args.dia ?? 'D1,D2,D4').split(',')
const OUT = args.out ?? 'docs/MEDIR_ENTRADAS_2026-10-03.md'
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const written = writtenDaysFor('roma')
const leg = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const toMin = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const placeByName = new Map(D.places.map((place) => [place.name, place]))
const OTHERS = { D1: ['D2', 'D4'], D2: ['D1', 'D4'], D4: ['D1', 'D2'] }
const GRID = { D1: 30, D2: 30, D4: 60 }

/** Las horas a las que se vende la entrada de ese día, de la primera franja a la última (las de la ficha del lugar si las hay). */
function hoursOf(id) {
  const [place, franjas] = Object.entries(written.days[id].entradas)[0]
  const names = Object.keys(franjas)
  const from = Math.min(...names.map((name) => toMin(franjas[name][0])))
  const to = Math.max(...names.map((name) => toMin(franjas[name][1])))
  const list = []
  for (let t = from; t <= to; t += GRID[id]) list.push(t)
  if (id === 'D4' && !list.includes(toMin('17:45'))) list.push(toMin('17:45'))
  return { place, franjas, list }
}

const tally = new Map() // «día · franja» → { casos, caben, motivos, huecos }
const bump = (key, ok, why, example, gaps) => {
  const rec = tally.get(key) ?? { casos: 0, caben: 0, cerrado: 0, motivos: new Map(), huecos: 0, ejemplosHueco: [] }
  rec.casos++
  if (why === 'cerrado') rec.cerrado++
  else if (ok) rec.caben++
  else {
    const entry = rec.motivos.get(why) ?? { n: 0, ejemplo: example }
    entry.n++
    rec.motivos.set(why, entry)
  }
  if (ok && gaps.length > 0) {
    allGaps.push({ key, label: example, gaps })
    rec.huecos++
    if (rec.ejemplosHueco.length < 3) rec.ejemplosHueco.push(`${example} (${gaps.join('; ')})`)
  }
  tally.set(key, rec)
}
const allGaps = []
const rojo = { llega_tarde: [], fuera_de_horario: [], sin_aviso: [], repetido: [], basilica_fuera: [], error: [] }

const starts = []
for (let i = 0; i < 365; i += STEP) starts.push(addDays('2027-01-01', i))
let escenarios = 0
for (const id of DAYS) {
  const { place, franjas, list } = hoursOf(id)
  const names = Object.keys(franjas)
  const franjaOf = (t) => names.find((name) => t >= toMin(franjas[name][0]) && t <= toMin(franjas[name][1])) ?? names.at(-1)
  const placeData = placeByName.get(place)
  for (const fecha of starts) {
    const weekday = WEEKDAYS[new Date(`${fecha}T12:00:00Z`).getUTCDay()]
    const forceOrder = [id, ...OTHERS[id]]
    const base = { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', forceOrder }
    let baseDay = null
    try {
      baseDay = await buildDayBlockV3(D, 4, false, 1, null, fecha, [], ['imprescindibles'], base)
    } catch (error) {
      rojo.error.push(`${fecha} ${id} sin reserva: ${String(error.message).slice(0, 100)}`)
      continue
    }
    for (const T of list) {
      escenarios++
      const label = `${fecha} (${weekday}) · ${id} · ${hhmm(T)}`
      const key = `${id} · ${franjaOf(T)}`
      // Fuera del horario de ese día (antes de abrir o pasada la última entrada de la época): no se vende esa hora.
      {
        const hours = { weekday, dateIso: fecha, season: seasonKey(null, fecha) }
        const windows = placeWindows(placeData, hours)
        const sessions = windows ? parseHoursSessions(windows.join(', ')) : []
        const last = lastEntryMinutes(placeData, 12 * 60, hours)
        if (sessions.length > 0 && !closedOnDay(placeData, weekday, fecha) && (!sessions.some((x) => T >= x.open && T <= x.close) || (last != null && T > last))) continue
      }
      // Cerrado ese día (cierre semanal, festivo): no se vende entrada; no cuenta.
      // (Los Museos Vaticanos cierran los domingos: no existe una entrada reservada en domingo. El último domingo de mes es gratis, de 9:00 a 14:00, y no se reserva: cola. Fuera de la prueba.)
      if (closedOnDay(placeData, weekday, fecha) || (place === 'Museos Vaticanos y Capilla Sixtina' && weekday === 'domingo')) {
        bump(key, false, 'cerrado', label, [])
        continue
      }
      let day
      try {
        day = await buildDayBlockV3(D, 4, false, 1, null, fecha, [], ['imprescindibles'], { ...base, entradas: { [place]: hhmm(T) } })
      } catch (error) {
        rojo.error.push(`${label}: ${String(error.message).slice(0, 100)}`)
        continue
      }
      const reasons = []
      const reservedStop = (day?.stops ?? []).find((stop) => stop.name === place && stop.visit_mode !== 'fuera')
      if (!reservedStop) reasons.push('la parada reservada no sale por dentro')
      else {
        const shown = toMin(reservedStop.suggested_time)
        if (Math.abs(shown - T) > 10) {
          reasons.push(`sale a las ${reservedStop.suggested_time}, no a las ${hhmm(T)}`)
          rojo.llega_tarde.push(`${label}: sale a las ${reservedStop.suggested_time}`)
        }
      }
      for (const item of repetidosEnElDia(day)) {
        reasons.push(`un lugar sale dos veces el mismo día: ${item.split(' (')[0].replace(/^\S+ /, '')}`)
        rojo.repetido.push(`${label}: ${item}`)
      }
      const audit = auditarViaje(D, [day], { startIso: fecha, poolNames: [], leg, label, viajeCorto: true })
      const gaps = []
      for (const caso of audit) {
        if (caso.tipo === 'fuera_de_horario' || caso.tipo === 'cerrada_a_su_hora') {
          reasons.push(`${caso.tipo === 'fuera_de_horario' ? 'fuera de horario' : 'a su hora ya cerrado o sin abrir'}: ${caso.donde.split(', ').slice(-1)[0]}`)
          rojo.fuera_de_horario.push(`${label}: ${caso.donde.split(', ').slice(-1)[0]}`)
        } else if (caso.tipo === 'basilica_fuera') {
          reasons.push('la Basílica de San Pedro por fuera el día de los Vaticanos')
          rojo.basilica_fuera.push(`${label}: ${caso.detalle}`)
        } else if (caso.tipo === 'hueco') {
          const minutes = Number(/(\d+) min/.exec(caso.detalle)?.[1] ?? 0)
          if (minutes > 30) gaps.push(`${caso.donde.split(', ').slice(-1)[0]} ${minutes} min`)
        }
        // (El atardecer quitado por la reserva no es fallo; el resto de tipos no cambian lo que cabe.)
      }
      // Lo que se quitó: un imprescindible que había sin reserva y ya no está, sin aviso.
      // (La nocturna de un lugar cuenta: Piazza Navona (noche) es Piazza Navona de noche, no se cae.)
      const names = new Set((day?.stops ?? []).map((stop) => stop.name.replace(/ \(noche\)$/, '')))
      const noticed = new Set((day?.not_included ?? []).map((item) => item.name))
      for (const stop of baseDay?.stops ?? []) {
        const data = placeByName.get(stop.name)
        if (data?.level === 1 && !names.has(stop.name) && !noticed.has(stop.name) && !/\(noche\)/.test(stop.name)) {
          reasons.push(`se quita ${stop.name}`)
          rojo.sin_aviso.push(`${label}: ${stop.name}`)
        }
      }
      bump(key, reasons.length === 0, reasons[0] ?? '', label, gaps)
    }
    if (starts.indexOf(fecha) % 30 === 0) process.stderr.write(`\r${id} ${fecha} · ${escenarios}`)
  }
}
process.stderr.write('\n')

const pct = (n, d) => (d === 0 ? '—' : `${Math.round((n / d) * 1000) / 10} %`)
const total = (field) => [...tally.values()].reduce((sum, rec) => sum + rec[field], 0)
const lines = [
  '# Órdenes nuevos de D1, D2 y D4 según la hora de la entrada',
  '',
  `Medido con \`scripts/destino/medirEntradas.mjs\`: ${starts.length} fechas de 2027, ${escenarios} reservas simuladas (cada día escrito, el primero de un viaje de 3 días, con la reserva a cada hora que se vende). Cabe = la parada sale a su hora, nada llega tarde ni fuera de horario, y no se quita un imprescindible en silencio. Un atardecer que no cabe por la hora de la reserva no es fallo.`,
  '',
  rojo.llega_tarde.length + rojo.fuera_de_horario.length + rojo.sin_aviso.length + rojo.repetido.length + rojo.basilica_fuera.length + rojo.error.length === 0 ? '## 🟢 Ningún fallo grave' : '## 🔴 Fallos graves',
  '',
  `- **Hora fija rota (llega tarde)**: ${rojo.llega_tarde.length}`,
  `- **Parada fuera de horario o cerrada a su hora**: ${rojo.fuera_de_horario.length}${rojo.fuera_de_horario.length ? '\n' + rojo.fuera_de_horario.slice(0, 8).map((x) => `  - ${x}`).join('\n') : ''}`,
  `- **Imprescindible quitado sin aviso**: ${rojo.sin_aviso.length}${rojo.sin_aviso.length ? '\n' + rojo.sin_aviso.slice(0, 8).map((x) => `  - ${x}`).join('\n') : ''}`,
  `- **Un lugar repetido el mismo día**: ${rojo.repetido.length}${rojo.repetido.length ? '\n' + rojo.repetido.slice(0, 8).map((x) => `  - ${x}`).join('\n') : ''}`,
  `- **La Basílica de San Pedro por fuera el día de los Vaticanos**: ${rojo.basilica_fuera.length}${rojo.basilica_fuera.length ? '\n' + rojo.basilica_fuera.slice(0, 8).map((x) => `  - ${x}`).join('\n') : ''}`,
  `- **El motor falla**: ${rojo.error.length}${rojo.error.length ? '\n' + rojo.error.slice(0, 5).map((x) => `  - ${x}`).join('\n') : ''}`,
  '',
  `## Qué porcentaje cabe el mismo día (sin contar los días en que el sitio cierra: ${total('cerrado')} casos)`,
  '',
  '| Día · franja de la entrada | Casos | Caben | Huecos de más de 30 min (entre los que caben) | Por qué no caben (lo más repetido) |',
  '|---|---|---|---|---|',
  ...[...tally].map(([key, rec]) => `| ${key} | ${rec.casos - rec.cerrado} | ${rec.caben} (${pct(rec.caben, rec.casos - rec.cerrado)}) | ${rec.huecos} | ${[...rec.motivos].sort((a, b) => b[1].n - a[1].n).slice(0, 3).map(([why, v]) => `${why} (${v.n}, p. ej. ${v.ejemplo})`).join(' · ') || '—'} |`),
  '',
  '## Ejemplos de huecos de más de 30 min',
  '',
  ...[...tally].filter(([, rec]) => rec.ejemplosHueco.length > 0).map(([key, rec]) => `- **${key}**: ${rec.ejemplosHueco.join(' ‖ ')}`),
]
writeFileSync(OUT, lines.join('\n') + '\n')
// (Todos los casos en rojo, sin recortar, para mirarlos uno a uno: `json=ruta`.)
if (args.json) writeFileSync(args.json, JSON.stringify({ ...rojo, huecos: allGaps }, null, 1))
console.log(lines.slice(0, 30).join('\n'))
