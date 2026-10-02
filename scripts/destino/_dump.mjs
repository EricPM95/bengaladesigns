import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const dias = Number(a.dias ?? 1), fecha = a.fecha ?? '2027-03-10', ft = a.ft === '1'
const pool = a.pool ? a.pool.split('|') : []
const positive = ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles']
if (a.exp) positive.push(...a.exp.split('|'))
const only = a.dia ? [Number(a.dia)] : Array.from({ length: dias }, (_, i) => i + 1)
for (const n of only) {
  const d = await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, pool, positive, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
  console.log(`\n=== DÍA ${n} (${fecha}) ===`)
  for (const s of d.stops ?? []) console.log(`${s.suggested_time ?? '--'}  ${s.name}  [${s.duration_minutes ?? ''}min ${s.visit_mode ?? ''}${s.is_pass_by ? ' pass_by' : ''}${s.pass_through ? ' pass' : ''}]${s.hours ? '  ' + s.hours : ''}`)
  for (const m of d.meals ?? []) console.log(`  · ${m.time} ${m.suggested_time} ${m.restaurant ?? ''} ${m.zone ?? ''}`)
  if (a.avisos) console.log('no incluido:', JSON.stringify(d.not_included), '| aviso:', d.day_notice)
}
