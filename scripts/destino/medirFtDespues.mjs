// El Free Tour añadido después en viajes de 3, 4 y 5 días (PARA_CODE_DECISIONES_D1_D2_D4_FREE_TOUR, parte C): el tour sustituye la parte del día que enseña lo mismo.
// Cada fecha del año, el viaje con el tour a cada hora (de mañana 10:00; de tarde 16:00 y 17:00; de noche, saliendo un rato antes de la puesta de sol).
//   node scripts/destino/medirFtDespues.mjs [paso=1] [dias=3,4,5] [out=docs/MEDIR_FT_DESPUES_2026-10-03.md]
// «Cabe» = el tour sale a su hora, ningún imprescindible se pierde en el viaje (lo que el tour enseña cuenta como visto ese día), nada fuera de horario y no se repite nada el mismo día.
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { auditarViaje, repetidosEnElDia } from './auditoria.mjs'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => (x.includes('=') ? x.split('=') : [x, true])))
const STEP = Number(args.paso ?? 1)
const LENGTHS = String(args.dias ?? '3,4,5').split(',').map(Number)
const OUT = args.out ?? 'docs/MEDIR_FT_DESPUES_2026-10-03.md'
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const leg = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const toMin = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const covers = new Set(D.default_free_tour.covers)
const levelOne = new Set(D.places.filter((place) => place.level === 1).map((place) => place.name))
const isTour = (stop) => /^Free Tour/i.test(String(stop.name)) || stop.is_free_tour

const SCENARIOS = [
  { key: 'de mañana · 10:00', franja: 'manana', hour: () => toMin('10:00') },
  { key: 'de tarde · 16:00', franja: 'tarde', hour: () => toMin('16:00') },
  { key: 'de tarde · 17:00', franja: 'tarde', hour: () => toMin('17:00') },
  { key: 'de noche · sale 20 min antes de la puesta', franja: 'noche', hour: (fecha) => Math.round(((sunsetFor(D, { dateIso: fecha }) ?? 18 * 60) - 20) / 5) * 5 },
]
const tally = new Map()
const rojo = { llega_tarde: [], fuera_de_horario: [], se_pierde: [], repetido: [], error: [] }
const bump = (key, ok, why, example) => {
  const rec = tally.get(key) ?? { casos: 0, caben: 0, motivos: new Map() }
  rec.casos++
  if (ok) rec.caben++
  else {
    const entry = rec.motivos.get(why) ?? { n: 0, ejemplo: example }
    entry.n++
    rec.motivos.set(why, entry)
  }
  tally.set(key, rec)
}
const starts = []
for (let i = 0; i < 365; i += STEP) starts.push(addDays('2027-01-01', i))
let escenarios = 0
async function trip(fecha, dias, extra) {
  const days = []
  for (let n = 1; n <= dias; n++) days.push(await buildDayBlockV3(D, dias + 1, false, n, null, fecha, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', ...extra }))
  return days
}
const visitedLevelOne = (days) => {
  const seen = new Set()
  for (const day of days) for (const stop of day?.stops ?? []) seen.add(stop.name.replace(/ \(noche\)$/, ''))
  return seen
}
for (const fecha of starts) {
  for (const dias of LENGTHS) {
    let base
    try {
      base = await trip(fecha, dias, {})
    } catch (error) {
      rojo.error.push(`${fecha} · ${dias} d sin tour: ${String(error.message).slice(0, 80)}`)
      continue
    }
    const baseSeen = visitedLevelOne(base)
    for (const scenario of SCENARIOS) {
      escenarios++
      const hour = scenario.hour(fecha)
      const label = `${fecha} · ${dias} d · tour ${scenario.key.split(' · ')[0]} ${hhmm(hour)}`
      const key = `${dias} días · tour ${scenario.key}`
      let days
      try {
        days = await trip(fecha, dias, { freeTourDespues: { franja: scenario.franja, hora: hhmm(hour) } })
      } catch (error) {
        rojo.error.push(`${label}: ${String(error.message).slice(0, 80)}`)
        continue
      }
      const tourDay = days.findIndex((day) => (day?.stops ?? []).some(isTour))
      if (tourDay < 0) {
        bump(key, false, 'ningún día del viaje lleva el tour de esa franja (el motor no lo pone)', label)
        continue
      }
      const reasons = []
      const shown = days[tourDay].stops.find(isTour)
      if (Math.abs(toMin(shown.suggested_time) - hour) > 10) {
        reasons.push(`el tour sale a las ${shown.suggested_time}, no a las ${hhmm(hour)}`)
        rojo.llega_tarde.push(`${label}: sale a las ${shown.suggested_time}`)
      }
      for (const caso of auditarViaje(D, [days[tourDay]], { startIso: addDays(fecha, tourDay), poolNames: [], leg, label, viajeCorto: false })) {
        if (caso.tipo === 'fuera_de_horario' || caso.tipo === 'cerrada_a_su_hora') {
          reasons.push(`fuera de horario: ${caso.donde.split(', ').slice(-1)[0]}`)
          rojo.fuera_de_horario.push(`${label}: ${caso.donde.split(', ').slice(-1)[0]}`)
        }
      }
      for (const item of repetidosEnElDia(days[tourDay])) {
        reasons.push('un lugar sale dos veces el mismo día')
        rojo.repetido.push(`${label}: ${item}`)
      }
      // Imprescindibles del viaje sin tour que ya no están (salvo lo que el tour enseña el día del tour).
      const after = visitedLevelOne(days)
      const lost = [...baseSeen].filter((name) => levelOne.has(name) && !after.has(name) && !covers.has(name))
      if (lost.length > 0) {
        reasons.push(`se pierde ${lost.slice(0, 2).join(' y ')}`)
        rojo.se_pierde.push(`${label}: ${lost.join(', ')}`)
      }
      bump(key, reasons.length === 0, reasons[0] ?? '', label)
    }
  }
  if (starts.indexOf(fecha) % 30 === 0) process.stderr.write(`\r${fecha} · ${escenarios}`)
}
process.stderr.write('\n')
const pct = (n, d) => (d === 0 ? '—' : `${Math.round((n / d) * 1000) / 10} %`)
const redTotal = Object.values(rojo).reduce((sum, list) => sum + list.length, 0)
const list = (items) => (items.length === 0 ? '— ninguno' : items.slice(0, 6).map((x) => `  - ${x}`).join('\n') + (items.length > 6 ? `\n  - … y ${items.length - 6} más` : ''))
const lines = [
  '# El Free Tour añadido después (viajes de 3, 4 y 5 días)',
  '',
  `Medido con \`scripts/destino/medirFtDespues.mjs\`: ${starts.length} fechas de 2027, viajes de ${LENGTHS.join(', ')} días, ${escenarios} casos. El tour sustituye la parte del día que enseña lo mismo (de mañana, la mañana del centro de D4; de tarde, la tarde del centro barroco de D1; de noche, la nocturna de ese día). La hora de la salida de noche es una suposición: la ficha del proveedor solo dice «antes de que se ponga el sol», sin hora (aquí, 20 min antes de la puesta).`,
  '',
  redTotal === 0 ? '## 🟢 Ningún fallo grave' : `## 🔴 Fallos graves: ${redTotal}`,
  '',
  `- **Hora fija rota** (${rojo.llega_tarde.length}):\n${list(rojo.llega_tarde)}`,
  `- **Parada fuera de horario o cerrada** (${rojo.fuera_de_horario.length}):\n${list(rojo.fuera_de_horario)}`,
  `- **Imprescindible que se pierde** (${rojo.se_pierde.length}):\n${list(rojo.se_pierde)}`,
  `- **Lugar repetido el mismo día** (${rojo.repetido.length}):\n${list(rojo.repetido)}`,
  `- **El motor falla** (${rojo.error.length}):\n${list(rojo.error)}`,
  '',
  '## Cuánto cabe',
  '',
  '| Viaje y tour | Casos | Caben | Por qué no caben (lo más repetido) |',
  '|---|---|---|---|',
  ...[...tally].sort((a, b) => a[0].localeCompare(b[0], 'es')).map(([key, rec]) => `| ${key} | ${rec.casos} | ${rec.caben} (${pct(rec.caben, rec.casos)}) | ${[...rec.motivos].sort((a, b) => b[1].n - a[1].n).slice(0, 3).map(([why, v]) => `${why} (${v.n}, p. ej. ${v.ejemplo})`).join(' · ') || '—'} |`),
]
writeFileSync(OUT, lines.join('\n') + '\n')
console.log(lines.slice(0, 25).join('\n'))
