// Depuración: un día de un viaje (con o sin Free Tour) tal como lo da el motor.
//   node scripts/destino/_diaTrip.mjs fecha=2027-12-24 dias=3 dia=1 ft=1
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const dias = Number(a.dias ?? 3)
const d = await buildDayBlockV3(D, dias + 1, a.ft === '1', Number(a.dia ?? 1), null, a.fecha, [], a.ft === '1' ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
console.log(d.title, JSON.stringify(d.curated_day))
for (const s of d.stops) console.log(`${s.suggested_time}  ${s.name}  [${s.duration_minutes}min ${s.visit_mode ?? ''} ${s.outside_kind ?? ''}]`)
for (const m of d.meals ?? []) console.log(`  · ${m.time} ${m.suggested_time} ${m.restaurant ?? ''}`)
console.log('no incl:', JSON.stringify(d.not_included))
