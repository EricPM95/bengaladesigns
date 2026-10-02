import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const place = { D1: 'Coliseo', D2: 'Museos Vaticanos y Capilla Sixtina', D4: 'Galería Borghese' }[a.dia]
const others = { D1: ['D2', 'D4'], D2: ['D1', 'D4'], D4: ['D1', 'D2'] }[a.dia]
const d = await buildDayBlockV3(D, 4, false, 1, null, a.fecha, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', forceOrder: [a.dia, ...others], entradas: a.hora ? { [place]: a.hora } : {} })
console.log(d.title, d.curated_day?.variants)
for (const s of d.stops) console.log(`${s.suggested_time}  ${s.name}  [${s.duration_minutes}min ${s.visit_mode ?? ''}]`)
for (const m of d.meals ?? []) console.log(`  · ${m.time} ${m.suggested_time} ${m.restaurant ?? ''}`)
console.log('no incl:', JSON.stringify(d.not_included))
