import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const desde = process.argv[2] ?? '2026-10-11'
const n = Number(process.argv[3] ?? 30)
for (let i = 0; i < n; i++) {
  const inicio = add(desde, i)
  for (let d = 1; d <= 3; d++) {
    for (const g of [false, true]) {
      const grandes = g ? [{ name: 'Coliseo', dateIso: inicio, dayNumber: 1, time: '10:00' }] : []
      const day = await buildDayBlockV3(D, 4, false, d, null, inicio, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', entradas: { 'Altar de la Patria': '10:00', ...(g && d === 1 ? { Coliseo: '10:00' } : {}) }, reservasGrandes: grandes, forceOrder: null, mediaJornada: null })
      const ara = (day?.stops ?? []).find((s) => s.name === 'Ara Pacis')
      const altar = (day?.stops ?? []).find((s) => s.name === 'Altar de la Patria')
      if ((ara && ara.suggested_time < '12:00') || (altar && altar.suggested_time !== '10:00' && altar.reservation_time)) console.log(inicio, 'd' + d, g ? 'conColiseo' : '', 'Ara@', ara?.suggested_time, 'Altar@', altar?.suggested_time, altar?.reservation_time)
    }
  }
}
