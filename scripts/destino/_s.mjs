import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const [dias, n, f, ...pool] = process.argv.slice(2)
const reservas = process.env.RES ? JSON.parse(process.env.RES) : null
const d = await buildDayBlockV3(D, +dias + 1, false, +n, null, f, pool, [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', ...(reservas ? { entradas: reservas } : {}) })
console.log(d.curated_day?.id, JSON.stringify(d.curated_day?.variants))
for (const m of d.meals) console.log('  [', m.time, ']', m.suggested_time, m.window_end ?? '', m.restaurant)
for (const s of d.stops) console.log(' ', s.suggested_time, s.duration_minutes + 'm', s.name, s.visit_mode ?? '', s.is_night_experience ? 'N' : '', s.transit?.label ?? '')
for (const f of d.free_times ?? []) console.log('  libre', f.minutes, f.before, f.title ?? '')
for (const x of d.not_included ?? []) console.log('  fuera:', x.name, x.reason)
