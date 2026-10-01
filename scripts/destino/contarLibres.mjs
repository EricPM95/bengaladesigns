// Cuenta, en las 365 fechas, los ratos libres que salen (aperitivo, tarde libre, tiempo libre) y los paseos que
// van en la misma zona que la parada de antes. Para el informe del paso 5 (PARA_CODE_TODO_2026-10-01).
//   node scripts/destino/contarLibres.mjs [dias=2,3,4,5,6,7] [año=2027] [paso=1] [json=fichero]
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const D = findPipelineV2Data('Roma')
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const year = Number(a['año'] ?? 2027)
const step = Number(a.paso ?? 1)
const lengths = (a.dias ?? '2,3,4,5,6,7').split(',').map(Number)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const tally = {}
const bump = (key, sample) => {
  tally[key] ??= { n: 0, ejemplos: [] }
  tally[key].n++
  if (tally[key].ejemplos.length < 8) tally[key].ejemplos.push(sample)
}
let days = 0
for (const dias of lengths) {
  for (let offset = 0; offset < 365; offset += step) {
    const fecha = addDays(`${year}-01-01`, offset)
    for (const ft of [false]) {
      for (let n = 1; n <= dias; n++) {
        let day
        try {
          day = await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
        } catch {
          continue
        }
        if (!day) continue
        days++
        const where = `${fecha} · ${dias} días, día ${n}`
        if (day.aperitivo) bump(`aperitivo: ${day.aperitivo.title}`, where)
        if (day.aperitivo) bump('aperitivo (total)', where)
        if (day.free_afternoon) bump('tarde libre', where)
        for (const f of day.free_times ?? []) bump(f.descanso ? 'descanso con nombre' : f.title ? 'hueco con nombre de paseo' : 'tiempo libre genérico', `${where} (${f.minutes} min antes de ${f.before})`)
        if (day.free_time) bump('free_time (versión vieja)', where)
        for (const stop of day.stops ?? []) {
          if (stop.is_free_walk) bump(`paseo libre: ${stop.name}`, `${where} (${stop.suggested_time}, ${stop.duration_minutes} min)`)
          if (stop.stretched_free_walk) bump('parada alargada por el paseo', `${where} (${stop.name}, ${stop.duration_minutes} min)`)
        }
      }
    }
  }
}
console.log(`${days} días mirados`)
for (const [key, value] of Object.entries(tally).sort((x, y) => y[1].n - x[1].n)) console.log(`${String(value.n).padStart(6)}  ${key}  ← ${value.ejemplos.slice(0, 2).join(' | ')}`)
if (a.json) writeFileSync(a.json, JSON.stringify(tally, null, 1))
