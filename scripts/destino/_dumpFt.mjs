import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const dias = Number(a.dias ?? 3)
for (let n = 1; n <= dias; n++) {
  const d = await buildDayBlockV3(D, dias + 1, false, n, null, a.fecha, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', freeTourDespues: { franja: a.franja, hora: a.hora } })
  console.log(`== día ${n} ${d.curated_day?.id} ${JSON.stringify(d.curated_day?.variants)}`)
  if (!a.solo || a.solo == n) for (const s of d.stops) console.log(`  ${s.suggested_time} ${s.name} [${s.duration_minutes}]`)
}
