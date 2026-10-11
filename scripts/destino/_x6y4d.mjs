import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const inicio = process.argv[2]
const dc = Number(process.argv[3] ?? 0)
const lugar = process.argv[4] ?? 'Coliseo'
const hora = process.argv[5] ?? '10:00'
const grandesNombres = new Set(['Coliseo','Museos Vaticanos y Capilla Sixtina','Galería Borghese'])
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
for (let d = 1; d <= 3; d++) {
  const grandes = dc && grandesNombres.has(lugar) ? [{ name: lugar, dateIso: add(inicio, dc - 1), dayNumber: dc, time: hora }] : []
  const day = await buildDayBlockV3(D, 4, false, d, null, inicio, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', entradas: dc === d ? { [lugar]: hora } : {}, reservasGrandes: grandes, reservasViaje: dc && !grandesNombres.has(lugar) ? [{ name: lugar, dateIso: add(inicio, dc - 1), dayNumber: dc, time: hora }] : [], forceOrder: null, mediaJornada: null })
  console.log(`D${d} [${day?.curated_day?.id}]`, (day?.stops ?? []).map((s) => `${s.suggested_time}${s.reservation_time ? '*' : ''} ${s.name}`).join(' | '))
  console.log('   sobra:', (day?.spare_stops ?? []).map((s) => s.name).join(', '), '| no incl:', (day?.not_included ?? []).map((s) => `${s.name}(${s.reason})`).join(', '))
  for (const l of day?.engine_log ?? []) if (['quitada', 'aviso'].includes(l.que)) console.log('   log', l.que, l.lugar, '-', l.causa)
}
