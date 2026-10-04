import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const cnt = new Map()
for (const f of ['2027-09-07', '2027-02-09']) {
  const names = new Map()
  for (let n = 1; n <= 7; n++) {
    const d = await buildDayBlockV3(D, 8, f === '2027-02-09', n, null, f, [], f === '2027-02-09' ? ['imprescindibles','free_tour'] : [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
    for (const s of d?.stops ?? []) { const k = s.site_id ?? s.name; const m = (s.muestra ?? [k]); for (const id of m) { if (!names.has(id)) names.set(id, []); names.get(id).push(`d${n}${s.is_night_experience ? 'N' : ''}${s.pass_through ? 'p' : ''}:${s.name}`) } }
  }
  console.log(f); for (const [id, v] of names) if (v.length > 1) console.log('  ', id, v.join(' | '))
}
