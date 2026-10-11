import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const desde = process.argv[2] ?? '2027-03-01'
const n = Number(process.argv[3] ?? 14)
const POOL = (process.argv[5] ?? "").split("|").filter(Boolean)
const EXPS = (process.argv[6] ?? "").split("|").filter(Boolean)
const NDIAS = Number(process.argv[4] ?? 3)
async function trip(inicio, { entradasPorDia = {}, grandes = [] } = {}) {
  const out = []
  for (let d = 1; d <= NDIAS; d++) {
    const day = await buildDayBlockV3(D, NDIAS + 1, false, d, null, inicio, POOL, EXPS, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', entradas: entradasPorDia[d] ?? {}, reservasGrandes: grandes, forceOrder: null, mediaJornada: null })
    out.push(day)
  }
  return out
}
const nombres = (days) => new Set(days.flatMap((day) => (day?.stops ?? []).map((s) => s.name)))
for (let i = 0; i < n; i++) {
  const inicio = add(desde, i)
  const base = await trip(inicio)
  const bn = nombres(base)
  for (let dd = 1; dd <= NDIAS; dd++) {
    const g = [{ name: 'Coliseo', dateIso: add(inicio, dd - 1), dayNumber: dd, time: '10:00' }]
    const t = await trip(inicio, { entradasPorDia: { [dd]: { Coliseo: '10:00' } }, grandes: g })
    const tn = nombres(t)
    const perdidos = [...bn].filter((x) => !tn.has(x))
    const nuevos = [...tn].filter((x) => !bn.has(x))
    if (perdidos.length || nuevos.length) console.log(inicio, 'Coliseo d' + dd, 'perdidos:', perdidos.join(','), '| nuevos:', nuevos.join(','), '| dias:', t.map((x) => x?.curated_day?.id).join(','))
  }
}
