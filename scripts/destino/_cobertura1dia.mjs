import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const need = ['Fontana de Trevi', 'Plaza de España', 'Plaza de San Pedro', 'Coliseo', 'Panteón', 'Piazza Navona']
const miss = {}
let n = 0
for (let i = 0; i < 365; i += 5) for (const pool of [[], ['Coliseo']]) {
  const fecha = add('2027-01-01', i)
  const day = await buildDayBlockV3(D, 2, false, 1, null, fecha, pool, ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
  n++
  const names = (day.stops ?? []).map((s) => s.name)
  for (const k of need) if (!names.some((x) => x.startsWith(k))) (miss[`${k}|pool=${pool.length}`] ??= []).push(fecha)
}
console.log(n, Object.fromEntries(Object.entries(miss).map(([k, v]) => [k, v.length + ' ' + v.slice(0, 4).join(',')])))
